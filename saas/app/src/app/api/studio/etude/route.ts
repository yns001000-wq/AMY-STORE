import { NextResponse } from "next/server";
import { consommer, rembourser } from "@/lib/quotas";
import { contexteStudio, demanderIA, erreurIA } from "@/lib/studio/serveur";
import { FAMILLES, familleDepuisMetier, lireJSON, promptEtude, siteExpress } from "@/lib/studio";

export const maxDuration = 120;

/** Étape 1 du site sur mesure : l'IA étudie ce qu'est vraiment l'établissement (consomme 1 site IA). */
export async function POST(req: Request) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const { session, cap, plan, essai } = ctx;
  if (!cap.effortIA) return NextResponse.json({ erreur: "Les sites sur mesure par l'IA sont inclus dès l'offre Pro.", plan }, { status: 402 });
  const { prospect_id, precisions } = (await req.json().catch(() => ({}))) as { prospect_id?: string; precisions?: string };
  if (!prospect_id) return NextResponse.json({ erreur: "Requête invalide" }, { status: 400 });
  const { data: p } = await session.sb.from("prospects").select("id, nom, metier, ville, code_postal, adresse, telephone, email, indices, notes").eq("id", prospect_id).maybeSingle();
  if (!p) return NextResponse.json({ erreur: "Prospect introuvable" }, { status: 404 });
  const { count } = await session.sb.from("sites").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= cap.sitesMax) return NextResponse.json({ erreur: `Votre offre conserve ${cap.sitesMax} sites : supprimez-en un ou passez à l'offre supérieure.`, plan }, { status: 402 });
  if (!(await consommer(session.user.id, plan, "sites_ia", 1, essai))) return NextResponse.json({ erreur: "Quota de sites sur mesure du mois atteint.", plan }, { status: 402 });
  const rendre = () => rembourser(session.user.id, "sites_ia");
  const prec = typeof precisions === "string" ? precisions.slice(0, 3000) : "";
  try {
    const texte = await demanderIA(promptEtude(p, prec), cap.effortIA === "xhigh" ? "high" : cap.effortIA, 8000);
    if (!texte) { await rendre(); return NextResponse.json({ erreur: "L'IA n'a pas pu étudier cet établissement." }, { status: 422 }); }
    const e = lireJSON(texte);
    const famille = FAMILLES[e.famille] ? e.famille : familleDepuisMetier(p.metier);
    const etude = {
      statut: "a_confirmer", essais: 0, precisions: prec,
      type: String(e.type ?? FAMILLES[famille].lib).slice(0, 80), famille, cuisine: String(e.cuisine ?? "").slice(0, 80),
      confiance: Math.max(0, Math.min(100, Number(e.confiance) || 0)),
      indices: (Array.isArray(e.indices) ? e.indices : []).slice(0, 6).map((x: unknown) => String(x).slice(0, 160)),
      hypotheses: (Array.isArray(e.hypotheses) ? e.hypotheses : []).filter((h: { famille?: string }) => h && FAMILLES[h.famille ?? ""]).slice(0, 3)
        .map((h: { type?: string; famille: string; probabilite?: number }) => ({ type: String(h.type ?? FAMILLES[h.famille].lib).slice(0, 80), famille: h.famille, probabilite: Math.max(0, Math.min(100, Number(h.probabilite) || 0)) })),
      a_verifier: (Array.isArray(e.a_verifier) ? e.a_verifier : []).slice(0, 6).map((x: unknown) => String(x).slice(0, 160)),
      resume: String(e.resume ?? "").slice(0, 400),
    };
    const { data: site, error } = await session.sb.from("sites").insert({ user_id: session.user.id, prospect_id: p.id, type: "ia", donnees: siteExpress(p, famille), etude }).select("id").single();
    if (error || !site) { await rendre(); return NextResponse.json({ erreur: "Création impossible" }, { status: 500 }); }
    return NextResponse.json({ id: site.id, etude });
  } catch (err) {
    await rendre();
    const r = erreurIA(err); if (r) return r;
    throw err;
  }
}
