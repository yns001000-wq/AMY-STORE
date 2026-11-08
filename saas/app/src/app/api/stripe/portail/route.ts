import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

/** Espace client Stripe : changer d'offre, mettre à jour la carte, télécharger les factures, résilier (en 3 clics). */
export async function POST() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.redirect(new URL("/connexion", site), 303);
  const { data } = await supabaseAdmin().from("profils").select("stripe_customer_id").eq("id", session.user.id).single();
  if (!data?.stripe_customer_id) return NextResponse.redirect(new URL("/espace/abonnement", site), 303);
  const portail = await stripe().billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${site}/espace/abonnement`, locale: "fr" });
  return NextResponse.redirect(portail.url, 303);
}
