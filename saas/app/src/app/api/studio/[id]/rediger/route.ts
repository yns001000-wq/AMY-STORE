import { NextResponse } from "next/server";
import { rembourser } from "@/lib/quotas";
import { ajouterJournal } from "@/lib/pipeline";
import { archiverVersion, chargerSite, contexteStudio, demanderIA, erreurIA, photosDuCommerce } from "@/lib/studio/serveur";
import { blocPhotosPerso, FAMILLES, lireJSON, promptRedaction, remplacerClesPerso, siteDepuisIA } from "@/lib/studio";

export const maxDuration = 300;
const ESSAIS_MAX = 3;

/** Étape 2 : rédaction complète du site, une fois le type d'établissement confirmé par l'utilisateur. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const { session, cap } = ctx;
  const site = await chargerSite(session.sb, (await params).id);
  if (!site) return NextResponse.json({ erreur: "Site introuvable" }, { status: 404 });
  const etude = (site.etude ?? {}) as Record<string, unknown>;
  if (etude.statut !== "a_confirmer") return NextResponse.json({ erreur: "Ce site a déjà été rédigé : utilisez les retouches." }, { status: 409 });
  const essais = Number(etude.essais) || 0;
  if (essais >= ESSAIS_MAX) return NextResponse.json({ erreur: "Nombre d'essais dépassé pour ce site." }, { status: 409 });
  if (!cap.effortIA) return NextResponse.json({ erreur: "Offre insuffisante" }, { status: 402 });
  const b = (await req.json().catch(() => ({}))) as { famille?: string; type?: string; cuisine?: string; precisions?: string };
  const famille = b.famille && FAMILLES[b.famille] ? b.famille : String(etude.famille);
  const choix = { famille, type: String(b.type || etude.type || FAMILLES[famille].lib).slice(0, 80), cuisine: String(b.cuisine ?? etude.cuisine ?? "").slice(0, 80), precisions: String(b.precisions ?? etude.precisions ?? "").slice(0, 3000) };
  await session.sb.from("sites").update({ etude: { ...etude, ...choix, essais: essais + 1 } }).eq("id", site.id);

  const { data: p } = site.prospect_id ? await session.sb.from("prospects").select("id, nom, metier, ville, code_postal, adresse, telephone, email, indices, notes, journal").eq("id", site.prospect_id).maybeSingle() : { data: null };
  const prospect = p ?? { nom: String(site.donnees.nom ?? "Établissement"), ville: site.donnees.ville, code_postal: site.donnees.code_postal, adresse: site.donnees.adresse, telephone: site.donnees.telephone, email: site.donnees.email };
  const dernierEssai = essais + 1 >= ESSAIS_MAX;
  const echec = async (r: NextResponse) => { if (dernierEssai) await rembourser(session.user.id, "sites_ia"); return r; };
  const perso = blocPhotosPerso(await photosDuCommerce(session.sb, cap, site.prospect_id));
  try {
    const texte = await demanderIA("site", promptRedaction(prospect, choix, perso.texte), cap.effortIA, 16000);
    if (!texte) return echec(NextResponse.json({ erreur: "L'IA n'a pas pu rédiger ce site." }, { status: 422 }));
    const red = remplacerClesPerso(lireJSON(texte), perso.cles);
    const donnees = siteDepuisIA(prospect, famille, red, red.horaires);
    await archiverVersion(session.sb, site, cap, "Avant rédaction IA");
    await session.sb.from("sites").update({ donnees, type: "ia", etude: { ...etude, ...choix, essais: essais + 1, statut: "redige" }, maj_le: new Date().toISOString() }).eq("id", site.id);
    if (p) await session.sb.from("prospects").update({ journal: ajouterJournal(p.journal, `Site sur mesure rédigé par l'IA (${choix.type})`) }).eq("id", p.id);
    return NextResponse.json({ donnees });
  } catch (err) {
    const r = erreurIA(err); if (r) return echec(r);
    throw err;
  }
}
