import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { domaineDisponible } from "@/lib/dns";
import { ideesDomaines, normaliserDomaine } from "@/lib/publication";

/** Idées de noms de domaine et disponibilité indicative (registres officiels via RDAP). */
export async function GET(req: Request) {
  if (!(await utilisateurConnecte())) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  const u = new URL(req.url);
  const demande = u.searchParams.get("domaine");
  const liste = demande ? [normaliserDomaine(demande)].filter(Boolean) as string[] : ideesDomaines(u.searchParams.get("nom") ?? "", u.searchParams.get("ville"));
  const resultats = await Promise.all(liste.slice(0, 6).map(async (d) => ({ domaine: d, disponible: await domaineDisponible(d) })));
  return NextResponse.json({ resultats });
}
