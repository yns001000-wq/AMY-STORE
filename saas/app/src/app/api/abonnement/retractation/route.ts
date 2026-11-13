import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { envoyerEmail, urlSite } from "@/lib/email";
import { journaliser } from "@/lib/journal";
import { montantRetractation, retractationPossible } from "@/lib/conformite";

/**
 * Rétractation d'un consommateur dans les 14 jours (art. L221-18) : arrêt immédiat de l'abonnement et remboursement,
 * déduction faite de la part du service déjà fournie (art. L221-25), au plus tard 14 jours après la demande (art. L221-24).
 */
export async function POST() {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  const admin = supabaseAdmin();
  const { data: p } = await admin.from("profils").select("stripe_subscription_id, stripe_customer_id, statut_utilisateur, abonnement_debut, retractation_le").eq("id", session.user.id).single();
  const droit = retractationPossible({ particulier: p?.statut_utilisateur !== "professionnel", debut: p?.abonnement_debut ? new Date(p.abonnement_debut) : null, deja: !!p?.retractation_le });
  if (!droit.ok || !p?.stripe_subscription_id) return NextResponse.json({ erreur: droit.raison ?? "Aucun abonnement en cours." }, { status: 409 });

  const sub = await stripe().subscriptions.retrieve(p.stripe_subscription_id);
  const item = sub.items.data[0];
  const charges = await stripe().charges.list({ customer: String(p.stripe_customer_id), limit: 1 });
  const derniere = charges.data.find((c) => c.paid && !c.refunded);
  let rembourse = 0, retenu = 0;
  if (derniere && item?.current_period_start && item.current_period_end) {
    const calc = montantRetractation(derniere.amount - (derniere.amount_refunded ?? 0), new Date(item.current_period_start * 1000), new Date(item.current_period_end * 1000));
    rembourse = calc.rembourse; retenu = calc.retenu;
    if (rembourse > 0) await stripe().refunds.create({ charge: derniere.id, amount: rembourse, reason: "requested_by_customer", metadata: { motif: "retractation_L221-18" } });
  }
  await stripe().subscriptions.cancel(sub.id, { prorate: false });
  await admin.from("profils").update({ retractation_le: new Date().toISOString(), resiliation_prevue: false }).eq("id", session.user.id);
  await journaliser(session.user.id, session.user.email, "retractation", { abonnement: sub.id, rembourse_centimes: rembourse, retenu_centimes: retenu });
  const euros = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const email = await envoyerEmail(session.user.email ?? "", "✅ Rétractation de ton abonnement MySite confirmée", {
    emoji: "✅", titre: "Ta rétractation est bien enregistrée",
    paragraphes: [
      "Nous confirmons ta rétractation. Ton abonnement est arrêté et ton compte repasse en offre Gratuite : tes données restent accessibles.",
      `💶 Remboursement : ${euros(rembourse)} (part du service déjà fournie : ${euros(retenu)}), sur la carte utilisée, sous quelques jours.`,
    ],
    bouton: { texte: "Ouvrir MySite", url: urlSite("/espace") },
    note: "Cet e-mail vaut confirmation de ta rétractation : garde-le.",
  });
  return NextResponse.json({ ok: true, rembourse, retenu, email });
}
