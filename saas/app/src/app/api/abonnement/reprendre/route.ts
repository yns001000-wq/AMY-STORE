import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { journaliser } from "@/lib/journal";

/** Annule une résiliation programmée (tant que la période payée n'est pas terminée). */
export async function POST() {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  const admin = supabaseAdmin();
  const { data: p } = await admin.from("profils").select("stripe_subscription_id").eq("id", session.user.id).single();
  if (!p?.stripe_subscription_id) return NextResponse.json({ erreur: "Aucun abonnement à reprendre." }, { status: 404 });
  await stripe().subscriptions.update(p.stripe_subscription_id, { cancel_at_period_end: false });
  await admin.from("profils").update({ resiliation_prevue: false }).eq("id", session.user.id);
  await journaliser(session.user.id, session.user.email, "reprise", { abonnement: p.stripe_subscription_id });
  return NextResponse.json({ ok: true });
}
