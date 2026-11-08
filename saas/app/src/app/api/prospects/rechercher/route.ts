import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { consommation, consommer, profilEtPlan } from "@/lib/quotas";
import { departementsAutorises, limite } from "@/lib/plans";
import { secteurParId } from "@/lib/secteurs";
import { chercherProspects } from "@/lib/sourcing";

/** Ajoute de nouveaux prospects dans l'espace de l'utilisateur, dans la limite de son offre. */
export async function POST() {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  const uid = session.user.id;
  const { profil, plan } = await profilEtPlan(uid);
  const secteur = secteurParId(profil.secteur as string);
  const deps = departementsAutorises(plan, (profil.departements as string[]) ?? []);
  if (!secteur || !deps.length) return NextResponse.json({ erreur: "Choisissez d'abord votre secteur et votre zone." }, { status: 400 });

  const deja = await consommation(uid);
  const reste = limite(plan, "prospects") - deja.prospects;
  if (reste <= 0) return NextResponse.json({ erreur: "quota", plan }, { status: 402 });
  const lot = Math.min(reste, 25);

  const admin = supabaseAdmin();
  const [{ data: connus }, { data: opp }] = await Promise.all([
    admin.from("prospects").select("siret").eq("user_id", uid),
    admin.from("opposition").select("siren, siret"),
  ]);
  const dejaConnus = new Set((connus ?? []).map((x) => x.siret as string));
  const opposition = { sirens: new Set((opp ?? []).map((x) => x.siren).filter(Boolean) as string[]), sirets: new Set((opp ?? []).map((x) => x.siret).filter(Boolean) as string[]) };

  const trouves = [];
  for (const dep of deps) {
    if (trouves.length >= lot) break;
    const r = await chercherProspects({ secteur, dep, max: lot - trouves.length, dejaConnus, opposition });
    trouves.push(...r.prospects);
  }
  if (!trouves.length) return NextResponse.json({ ajoutes: 0, message: "Aucun nouveau prospect dans votre zone pour ce secteur." });
  if (!(await consommer(uid, plan, "prospects", trouves.length))) return NextResponse.json({ erreur: "quota", plan }, { status: 402 });

  const { error } = await admin.from("prospects").insert(trouves.map((p) => ({
    user_id: uid, siret: p.siret, siren: p.siren, nom: p.nom, enseigne: p.enseigne, naf: p.naf, metier: p.metier, adresse: p.adresse,
    code_postal: p.code_postal, ville: p.ville, departement: p.departement, source: p.source, indices: p.indices,
    journal: [{ d: new Date().toISOString().slice(0, 10), t: "Trouvé dans la base Sirene (registre public)" }],
  })));
  if (error) return NextResponse.json({ erreur: "Enregistrement impossible" }, { status: 500 });
  return NextResponse.json({ ajoutes: trouves.length });
}
