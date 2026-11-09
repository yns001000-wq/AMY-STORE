import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { journaliser } from "@/lib/journal";

/** Droit d'accès et à la portabilité (RGPD, art. 15 et 20) : toutes vos données dans un fichier JSON. */
export async function GET() {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  const sb = session.sb;
  const tables = ["profils", "prospects", "sites", "sites_versions", "documents", "entreprises", "photos_perso", "publications", "livraisons", "progression_cours", "consommation"] as const;
  const donnees: Record<string, unknown> = { exporte_le: new Date().toISOString(), compte: { id: session.user.id, email: session.user.email, cree_le: session.user.created_at } };
  for (const t of tables) { const { data } = await sb.from(t).select("*").limit(20000); donnees[t] = data ?? []; }
  await journaliser(session.user.id, session.user.email, "export_donnees");
  return new NextResponse(JSON.stringify(donnees, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="mysite-mes-donnees-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" } });
}
