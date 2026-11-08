import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DUREE_ESSAI_JOURS } from "@/lib/plans";

/** Essai Premium de 7 jours, sans carte, une seule fois par compte. Aucun prélèvement à la fin : retour automatique au gratuit. */
export async function POST() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.redirect(new URL("/connexion", site), 303);
  const admin = supabaseAdmin();
  const { data } = await admin.from("profils").select("plan, essai_premium_utilise").eq("id", session.user.id).single();
  if (data && data.plan === "gratuit" && !data.essai_premium_utilise) {
    const fin = new Date(Date.now() + DUREE_ESSAI_JOURS * 86400000).toISOString();
    await admin.from("profils").update({ essai_premium_utilise: true, essai_fin: fin }).eq("id", session.user.id);
  }
  return NextResponse.redirect(new URL("/espace", site), 303);
}
