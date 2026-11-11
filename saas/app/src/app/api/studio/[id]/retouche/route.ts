import { NextResponse } from "next/server";
import { consommer, rembourser } from "@/lib/quotas";
import { MODELE_IA } from "@/lib/plans";
import { archiverVersion, chargerSite, contexteStudio, demanderIA, erreurIA, photosDuCommerce } from "@/lib/studio/serveur";
import { appliquerIA, blocPhotosPerso, lireJSON, promptRetouche, remplacerClesPerso } from "@/lib/studio";

export const maxDuration = 180;

/** Retouche en langage naturel (« ajoute une formule midi », « ton plus chic »…). Quota retouches_ia. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const { session, cap, plan, essai } = ctx;
  if (!cap.effortIA) return NextResponse.json({ erreur: "Les retouches par l'IA sont incluses dès l'offre Pro.", plan }, { status: 402 });
  const site = await chargerSite(session.sb, (await params).id);
  if (!site) return NextResponse.json({ erreur: "Site introuvable" }, { status: 404 });
  const { consigne } = (await req.json().catch(() => ({}))) as { consigne?: string };
  if (!consigne || consigne.trim().length < 3) return NextResponse.json({ erreur: "Décrivez la modification souhaitée." }, { status: 400 });
  if (!(await consommer(session.user.id, plan, "retouches_ia", 1, essai))) return NextResponse.json({ erreur: "Quota de retouches IA du mois atteint.", plan }, { status: 402 });
  const rendre = () => rembourser(session.user.id, "retouches_ia");
  const perso = blocPhotosPerso(await photosDuCommerce(session.sb, cap, site.prospect_id));
  try {
    const texte = await demanderIA(promptRetouche(site.donnees, consigne, perso.texte), cap.effortIA === "xhigh" ? "high" : cap.effortIA, 12000, MODELE_IA.retouche);
    if (!texte) { await rendre(); return NextResponse.json({ erreur: "L'IA n'a pas pu faire cette retouche." }, { status: 422 }); }
    const r = remplacerClesPerso(lireJSON(texte), perso.cles);
    const { d, refuses } = appliquerIA(site.donnees, r.modifications, cap, null);
    await archiverVersion(session.sb, site, cap, `Avant retouche IA : ${consigne.trim()}`);
    await session.sb.from("sites").update({ donnees: d, maj_le: new Date().toISOString() }).eq("id", site.id);
    return NextResponse.json({ donnees: d, explication: String(r.explication ?? "").slice(0, 300), refuses });
  } catch (err) {
    await rendre();
    const r = erreurIA(err); if (r) return r;
    throw err;
  }
}
