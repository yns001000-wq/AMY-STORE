import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { causeErreurStripe, stripe, ventesOuvertes } from "@/lib/stripe";
import { priceIdStripe, type Periode } from "@/lib/plans";
import { remisePourPaiement } from "@/lib/parrainage-serveur";

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Démarre un paiement d'abonnement (Stripe Checkout). Formulaire POST : plan, periode, renonciation (si particulier). */
export async function POST(req: Request) {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.redirect(new URL("/connexion?suite=/espace/abonnement", SITE()), 303);
  // Pas de vente réelle avant le début d'activité déclaré.
  if (!ventesOuvertes()) return NextResponse.redirect(new URL("/espace/abonnement?erreur=bientot", SITE()), 303);
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ erreur: "Requête invalide" }, { status: 400 });
  const plan = String(form.get("plan")), periode = String(form.get("periode")) as Periode;
  if (!["pro", "premium", "ultra"].includes(plan) || !["mensuel", "annuel"].includes(periode)) return NextResponse.json({ erreur: "Offre invalide" }, { status: 400 });
  const price = priceIdStripe(plan as "pro" | "premium" | "ultra", periode);
  if (!price) return NextResponse.json({ erreur: "Prix Stripe non configuré" }, { status: 500 });

  const admin = supabaseAdmin();
  const { data: profil } = await admin.from("profils").select("stripe_customer_id, statut_utilisateur, cgu_acceptees_le").eq("id", session.user.id).single();
  if (!profil?.cgu_acceptees_le) return NextResponse.redirect(new URL("/espace/bienvenue", SITE()), 303);
  // Particulier : l'accès immédiat pendant le délai de rétractation suppose sa demande expresse (C. conso. L221-25) ; le droit de rétractation reste ouvert, au prorata.
  if (profil.statut_utilisateur !== "professionnel" && form.get("renonciation") !== "oui") {
    return NextResponse.redirect(new URL("/espace/abonnement?erreur=renonciation", SITE()), 303);
  }

  try {
    let client = profil.stripe_customer_id as string | null;
    if (!client) {
      const c = await stripe().customers.create({ email: session.user.email ?? undefined, metadata: { user_id: session.user.id } });
      client = c.id;
      await admin.from("profils").update({ stripe_customer_id: client }).eq("id", session.user.id);
    }
    // Filleul neuf : -20 % sur le 1er paiement (coupon « une seule fois »). Stripe n'accepte pas un code promo en plus d'une remise.
    const remise = await remisePourPaiement(session.user.id, client);
    const checkout = await stripe().checkout.sessions.create({
      mode: "subscription",
      // « Managed Payments » (Stripe vendeur officiel à votre place) est activé par défaut sur les nouveaux comptes. On le coupe ici :
      // les CGV désignent l'éditeur de MySite comme vendeur, et ce mode interdit le texte d'information affiché avant le paiement.
      managed_payments: { enabled: false },
      customer: client,
      client_reference_id: session.user.id,
      line_items: [{ price, quantity: 1 }],
      subscription_data: { metadata: { user_id: session.user.id, acces_immediat_demande: profil.statut_utilisateur === "professionnel" ? "professionnel" : "oui", ...(remise ? { parrainage_id: remise.parrainageId } : {}) } },
      ...(remise ? { discounts: [{ coupon: remise.coupon }] } : { allow_promotion_codes: true }),
      custom_text: { submit: { message: `${remise ? `Parrainage : -20 % sur ce 1er paiement uniquement, puis prix normal à chaque ${periode === "annuel" ? "année" : "mois"}. ` : ""}Abonnement sans engagement, renouvelé automatiquement chaque période et résiliable à tout moment depuis « Mon abonnement ». En validant, vous acceptez les CGV et les CGU de MySite.` } },
      locale: "fr",
      success_url: `${SITE()}/espace?abonnement=ok`,
      cancel_url: `${SITE()}/espace/abonnement?annule=1`,
    });
    return NextResponse.redirect(checkout.url!, 303);
  } catch (e) {
    // Jamais de page d'erreur brute : retour à « Mon abonnement » avec un message, et la cause dans les journaux.
    const cause = causeErreurStripe(e);
    console.error(`Stripe paiement : ${cause} · ${e instanceof Error ? e.message.slice(0, 300) : "erreur inconnue"}`);
    return NextResponse.redirect(new URL(`/espace/abonnement?erreur=paiement&cause=${cause}`, SITE()), 303);
  }
}
