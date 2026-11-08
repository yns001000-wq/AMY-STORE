import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;
export function stripe(): Stripe {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) throw new Error("STRIPE_SECRET_KEY manquante");
  return (client ??= new Stripe(cle));
}
