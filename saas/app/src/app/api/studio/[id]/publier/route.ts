import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { absolutiser, chargerSite, contexteStudio } from "@/lib/studio/serveur";
import { rendreSite } from "@/lib/studio";
import { hebergeurParDefaut, insererMentions, mentionsManquantes, normaliserDomaine, reglagesDNS, slugValide, urlPublique, type Mentions } from "@/lib/publication";
import { ajouterDomaine, retirerDomaine, vercelConfigure } from "@/lib/vercel";
import { verifierDNS } from "@/lib/dns";
import { ajouterJournal } from "@/lib/pipeline";

type Ctx = { params: Promise<{ id: string }> };

/** État de la publication (et vérification DNS du domaine du client). */
export async function GET(_req: Request, { params }: Ctx) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const { data: pub } = await ctx.session.sb.from("publications").select("slug, domaine, mentions, publie_le, maj_le").eq("site_id", (await params).id).maybeSingle();
  if (!pub) return NextResponse.json({ publie: false });
  const dns = pub.domaine ? await verifierDNS(pub.domaine) : null;
  return NextResponse.json({ publie: true, ...pub, url: urlPublique(pub.slug), urlDomaine: pub.domaine ? `https://${pub.domaine}` : null, dns, reglages: pub.domaine ? reglagesDNS(pub.domaine) : [] });
}

/** Met en ligne (ou met à jour) le site final : sans bandeau de maquette, indexable, avec mentions légales. */
export async function POST(req: Request, { params }: Ctx) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const { session, cap, plan } = ctx;
  if (cap.publications <= 0) return NextResponse.json({ erreur: "La mise en ligne en un clic est incluse dès l'offre Pro.", plan }, { status: 402 });
  const site = await chargerSite(session.sb, (await params).id);
  if (!site) return NextResponse.json({ erreur: "Site introuvable" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { slug?: string; mentions?: Partial<Mentions>; domaine?: string | null; verifie?: boolean };
  if (!b.verifie) return NextResponse.json({ erreur: "Confirmez avoir vérifié le contenu avec le gérant." }, { status: 400 });
  const slug = String(b.slug ?? "").toLowerCase();
  if (!slugValide(slug)) return NextResponse.json({ erreur: "Adresse invalide : lettres minuscules, chiffres et tirets (3 à 40 caractères)." }, { status: 400 });
  const nettoie = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
  const m: Mentions = {
    editeur: nettoie(b.mentions?.editeur, 120), forme: nettoie(b.mentions?.forme, 120), siret: nettoie(b.mentions?.siret, 20), adresse: nettoie(b.mentions?.adresse, 200),
    telephone: nettoie(b.mentions?.telephone, 30), email: nettoie(b.mentions?.email, 120), directeur: nettoie(b.mentions?.directeur, 120), realisation: nettoie(b.mentions?.realisation, 120),
  };
  const manque = mentionsManquantes(m);
  if (manque.length) return NextResponse.json({ erreur: `Mentions légales obligatoires manquantes : ${manque.join(", ")}.` }, { status: 400 });
  let domaine: string | null = null;
  if (b.domaine) {
    if (!cap.domainePerso) return NextResponse.json({ erreur: "Le nom de domaine du client est inclus dès l'offre Pro.", plan }, { status: 402 });
    domaine = normaliserDomaine(b.domaine);
    if (!domaine) return NextResponse.json({ erreur: "Nom de domaine invalide (ex. pizzabella.fr)." }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: existant } = await session.sb.from("publications").select("domaine").eq("site_id", site.id).maybeSingle();
  if (!existant) {
    const { count } = await session.sb.from("publications").select("site_id", { count: "exact", head: true });
    if ((count ?? 0) >= cap.publications) return NextResponse.json({ erreur: `Votre offre permet ${cap.publications} sites en ligne en même temps : retirez-en un ou passez à l'offre supérieure.`, plan }, { status: 402 });
  }
  const { data: pris } = await admin.from("publications").select("site_id").eq("slug", slug).neq("site_id", site.id).maybeSingle();
  if (pris) return NextResponse.json({ erreur: "Cette adresse est déjà prise : choisissez-en une autre." }, { status: 409 });
  if (domaine) {
    const { data: dPris } = await admin.from("publications").select("site_id").eq("domaine", domaine).neq("site_id", site.id).maybeSingle();
    if (dPris) return NextResponse.json({ erreur: "Ce nom de domaine est déjà relié à un autre site." }, { status: 409 });
  }

  const origine = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const html = insererMentions(absolutiser(rendreSite({ ...site.donnees, maquette: false }, cap, origine), origine), m, hebergeurParDefaut(),
    { lienSignalement: `${origine}/signaler?site=${encodeURIComponent(urlPublique(slug, domaine).replace(/^https:\/\//, ""))}`, contact: process.env.CONTACT_EMAIL });
  const { error } = await session.sb.from("publications").upsert({ site_id: site.id, user_id: session.user.id, slug, domaine, html, mentions: m, maj_le: new Date().toISOString() }, { onConflict: "site_id" });
  if (error) return NextResponse.json({ erreur: error.code === "23505" ? "Adresse ou domaine déjà pris." : "Mise en ligne impossible." }, { status: error.code === "23505" ? 409 : 500 });

  let branchement: string | undefined;
  if (existant?.domaine && existant.domaine !== domaine) await retirerDomaine(existant.domaine);
  if (domaine && domaine !== existant?.domaine) {
    const r = await ajouterDomaine(domaine);
    branchement = r.ok ? "auto" : r.message === "manuel" ? "manuel" : `erreur : ${r.message}`;
  }
  if (site.prospect_id && !existant) {
    const { data: p } = await session.sb.from("prospects").select("journal").eq("id", site.prospect_id).maybeSingle();
    if (p) await session.sb.from("prospects").update({ journal: ajouterJournal(p.journal, `Site mis en ligne : ${urlPublique(slug, domaine)}`) }).eq("id", site.prospect_id);
  }
  return NextResponse.json({ url: urlPublique(slug), urlDomaine: domaine ? `https://${domaine}` : null, reglages: domaine ? reglagesDNS(domaine) : [], branchement, vercel: vercelConfigure() });
}

/** Retire le site de la ligne (le site reste dans le Studio). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const id = (await params).id;
  const { data: pub } = await ctx.session.sb.from("publications").select("domaine").eq("site_id", id).maybeSingle();
  if (!pub) return NextResponse.json({ ok: true });
  await ctx.session.sb.from("publications").delete().eq("site_id", id);
  if (pub.domaine) await retirerDomaine(pub.domaine);
  return NextResponse.json({ ok: true });
}
