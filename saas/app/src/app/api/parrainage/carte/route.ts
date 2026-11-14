import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";

const SEMAINE = 7 * 86400000;

/**
 * Proposition de parrainage « au bon moment » (après une 1re mise en ligne ou un devis accepté) : au plus une fois par semaine.
 * Afficher la carte compte comme une proposition ; la fermer ne demande rien d'autre.
 */
export async function GET() {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.json({ afficher: false });
  const admin = supabaseAdmin();
  const { data: p } = await admin.from("profils").select("carte_parrainage_le").eq("id", session.user.id).single();
  const derniere = p?.carte_parrainage_le ? new Date(p.carte_parrainage_le as string).getTime() : 0;
  if (Date.now() - derniere < SEMAINE) return NextResponse.json({ afficher: false });
  await admin.from("profils").update({ carte_parrainage_le: new Date().toISOString() }).eq("id", session.user.id);
  return NextResponse.json({ afficher: true }, { headers: { "Cache-Control": "private, no-store" } });
}
