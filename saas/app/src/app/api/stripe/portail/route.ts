import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { FIN_LANCEMENT, stripeReel } from "@/lib/plans";

/** Espace client Stripe : changer d'offre, mettre à jour la carte, télécharger les factures, résilier (en 3 clics). */
export async function POST() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.redirect(new URL("/connexion", site), 303);
  const { data } = await supabaseAdmin().from("profils").select("stripe_customer_id, abonnement_debut").eq("id", session.user.id).single();
  if (!data?.stripe_customer_id) return NextResponse.redirect(new URL("/espace/abonnement", site), 303);
  // En mode réel, Stripe exige une configuration d'espace client : celle créée par l'API (STRIPE_PORTAIL_CONFIG), sinon celle par défaut.
  // Abonné au prix de lancement : espace client avec les prix de lancement (changement d'offre au prix garanti) ; sinon, nouveaux prix.
  const debut = data.abonnement_debut ? new Date(data.abonnement_debut as string).getTime() : Date.now();
  const apres = debut >= FIN_LANCEMENT.getTime();
  const configuration = (stripeReel() ? (apres && process.env.STRIPE_PORTAIL_CONFIG_LIVE_APRES) || process.env.STRIPE_PORTAIL_CONFIG_LIVE : process.env.STRIPE_PORTAIL_CONFIG) || undefined;
  const portail = await stripe().billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${site}/espace/abonnement`, locale: "fr", ...(configuration ? { configuration } : {}) });
  return NextResponse.redirect(portail.url, 303);
}
