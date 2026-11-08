import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { priceIdStripe, type Periode } from "@/lib/plans";

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Démarre un paiement d'abonnement (Stripe Checkout). Formulaire POST : plan, periode, renonciation (si particulier). */
export async function POST(req: Request) {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.redirect(new URL("/connexion?suite=/espace/abonnement", SITE()), 303);
  const form = await req.formData();
  const plan = String(form.get("plan")), periode = String(form.get("periode")) as Periode;
  if (!["pro", "premium", "ultra"].includes(plan) || !["mensuel", "annuel"].includes(periode)) return NextResponse.json({ erreur: "Offre invalide" }, { status: 400 });
  const price = priceIdStripe(plan as "pro" | "premium" | "ultra", periode);
  if (!price) return NextResponse.json({ erreur: "Prix Stripe non configuré" }, { status: 500 });

  const admin = supabaseAdmin();
  const { data: profil } = await admin.from("profils").select("stripe_customer_id, statut_utilisateur, cgu_acceptees_le").eq("id", session.user.id).single();
  if (!profil?.cgu_acceptees_le) return NextResponse.redirect(new URL("/espace/bienvenue", SITE()), 303);
  // Particulier : l'accès immédiat suppose la demande expresse et la renonciation au droit de rétractation (C. conso. L221-28).
  if (profil.statut_utilisateur !== "professionnel" && form.get("renonciation") !== "oui") {
    return NextResponse.redirect(new URL("/espace/abonnement?erreur=renonciation", SITE()), 303);
  }

  let client = profil.stripe_customer_id as string | null;
  if (!client) {
    const c = await stripe().customers.create({ email: session.user.email ?? undefined, metadata: { user_id: session.user.id } });
    client = c.id;
    await admin.from("profils").update({ stripe_customer_id: client }).eq("id", session.user.id);
  }
  const checkout = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: client,
    client_reference_id: session.user.id,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { user_id: session.user.id, renonciation_retractation: profil.statut_utilisateur === "professionnel" ? "professionnel" : "oui" } },
    allow_promotion_codes: true,
    locale: "fr",
    success_url: `${SITE()}/espace?abonnement=ok`,
    cancel_url: `${SITE()}/espace/abonnement?annule=1`,
  });
  return NextResponse.redirect(checkout.url!, 303);
}
