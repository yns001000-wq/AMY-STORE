import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import { etape } from "@/lib/pipeline";
import { versCSV } from "@/lib/csv";

const COLONNES: [string, string][] = [
  ["nom", "Nom"], ["metier", "Métier"], ["etape", "Étape"], ["telephone", "Téléphone"], ["email", "E-mail"], ["adresse", "Adresse"], ["code_postal", "Code postal"],
  ["ville", "Ville"], ["departement", "Département"], ["siret", "SIRET"], ["prochaine_action", "Prochaine action"], ["date_prochaine_action", "Date"],
  ["dernier_echange", "Dernier échange"], ["notes", "Notes"], ["source", "Source des données"], ["cree_le", "Ajouté le"],
];

/** Export de SES prospects (offres Pro et plus). Le fichier rappelle la source publique des données. */
export async function GET() {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  const { plan } = await profilEtPlan(session.user.id);
  if (!PLANS[plan].export) return NextResponse.json({ erreur: "L'export CSV est inclus dès l'offre Pro.", plan }, { status: 402 });
  const { data } = await session.sb.from("prospects").select("*").order("cree_le", { ascending: false }).limit(10000);
  const lignes = (data ?? []).map((p) => ({ ...p, etape: etape(p.statut).nom, dernier_echange: p.dernier_echange?.slice(0, 10), cree_le: p.cree_le?.slice(0, 10) }));
  const jour = new Date().toISOString().slice(0, 10);
  return new NextResponse(versCSV(COLONNES, lignes), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="mysite-prospects-${jour}.csv"`, "Cache-Control": "no-store" } });
}
