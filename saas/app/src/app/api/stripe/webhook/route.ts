import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { abonnementActif, planDepuisPriceId } from "@/lib/plans";
import { facturePayee, finAbonnement, litige, remboursement } from "@/lib/parrainage-serveur";

/**
 * Webhook Stripe : seule source de vérité pour l'offre d'un utilisateur.
 * Signature vérifiée, chaque événement traité une seule fois (table evenements_stripe).
 * Événements à activer dans Stripe : checkout.session.completed, customer.subscription.created/updated/deleted,
 * et pour le parrainage : invoice.paid, charge.refunded, charge.dispute.created.
 */
export async function POST(req: Request) {
  // Secret du webhook réel (_LIVE) en mode réel, sinon celui du mode test.
  const signature = req.headers.get("stripe-signature");
  const secret = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live") ? process.env.STRIPE_WEBHOOK_SECRET_LIVE : process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ erreur: "Signature manquante" }, { status: 400 });
  let ev: Stripe.Event;
  try { ev = stripe().webhooks.constructEvent(await req.text(), signature, secret); }
  catch { return NextResponse.json({ erreur: "Signature invalide" }, { status: 400 }); }

  const admin = supabaseAdmin();
  const { error: deja } = await admin.from("evenements_stripe").insert({ id: ev.id, type: ev.type });
  if (deja) return NextResponse.json({ recu: true, doublon: true }); // déjà traité (clé primaire)

  try {
    if (ev.type === "checkout.session.completed") {
      const s = ev.data.object as Stripe.Checkout.Session;
      if (s.client_reference_id && typeof s.customer === "string") {
        await admin.from("profils").update({ stripe_customer_id: s.customer }).eq("id", s.client_reference_id);
      }
    } else if (ev.type.startsWith("customer.subscription.")) {
      const sub = ev.data.object as Stripe.Subscription;
      const item = sub.items.data[0];
      const supprime = ev.type === "customer.subscription.deleted";
      const plan = supprime || !abonnementActif(sub.status) ? "gratuit" : planDepuisPriceId(item?.price.id);
      const intervalle = item?.price.recurring?.interval;
      const maj = {
        plan, abonnement_statut: sub.status, stripe_subscription_id: supprime ? null : sub.id,
        periode_fin: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
        periode: intervalle === "year" ? "annuel" : intervalle === "month" ? "mensuel" : null,
        abonnement_debut: supprime ? null : new Date(sub.start_date * 1000).toISOString(),
        resiliation_prevue: !supprime && !!sub.cancel_at_period_end,
      };
      const userId = sub.metadata?.user_id;
      const q = admin.from("profils").update(maj);
      const { error } = userId ? await q.eq("id", userId) : await q.eq("stripe_customer_id", String(sub.customer));
      if (error) throw error;
      await finAbonnement(sub, supprime);
    } else if (ev.type === "invoice.paid") {
      await facturePayee(ev.data.object as Stripe.Invoice);
    } else if (ev.type === "charge.refunded") {
      const c = ev.data.object as Stripe.Charge;
      await remboursement(c, c.metadata?.motif === "retractation_L221-18");
    } else if (ev.type === "charge.dispute.created") {
      await litige(ev.data.object as Stripe.Dispute);
    }
  } catch (e) {
    await admin.from("evenements_stripe").delete().eq("id", ev.id); // Stripe réessaiera
    console.error("Webhook Stripe", ev.type, e);
    return NextResponse.json({ erreur: "Traitement impossible" }, { status: 500 });
  }
  return NextResponse.json({ recu: true });
}
