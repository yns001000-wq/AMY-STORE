import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;
export function stripe(): Stripe {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) throw new Error("STRIPE_SECRET_KEY manquante");
  // STRIPE_FETCH=1 : client HTTP « fetch » (passe par le proxy de l'environnement de test ; inutile en production).
  return (client ??= new Stripe(cle, process.env.STRIPE_FETCH === "1" ? { httpClient: Stripe.createFetchHttpClient() } : undefined));
}

/** Cause d'un échec Stripe, en un mot sans détail sensible : sert au diagnostic (adresse de retour et journaux). */
export function causeErreurStripe(e: unknown): "cle" | "prix" | "requete" | "reseau" | "autre" {
  if (e instanceof Stripe.errors.StripeAuthenticationError || e instanceof Stripe.errors.StripePermissionError) return "cle";
  if (e instanceof Stripe.errors.StripeInvalidRequestError) return /no such price|price/i.test(e.message) ? "prix" : "requete";
  if (e instanceof Stripe.errors.StripeConnectionError) return "reseau";
  if (e instanceof Error && /STRIPE_SECRET_KEY/.test(e.message)) return "cle";
  return "autre";
}
