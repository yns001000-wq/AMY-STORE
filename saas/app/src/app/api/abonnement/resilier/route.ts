import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { envoyerEmail, signature } from "@/lib/email";
import { journaliser } from "@/lib/journal";
import { PLANS, estPlan } from "@/lib/plans";

/**
 * « Résilier mon abonnement » (art. L215-1-1 du Code de la consommation) : résiliation en ligne, sans frais,
 * effective à la fin de la période déjà payée. Confirmation à l'écran et par e-mail (support durable), et preuve journalisée.
 */
export async function POST() {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.json({ erreur: "Connectez-vous pour identifier votre abonnement." }, { status: 401 });
  const admin = supabaseAdmin();
  const { data: p } = await admin.from("profils").select("stripe_subscription_id, plan").eq("id", session.user.id).single();
  if (!p?.stripe_subscription_id) return NextResponse.json({ erreur: "Aucun abonnement payant en cours." }, { status: 404 });
  const sub = await stripe().subscriptions.update(p.stripe_subscription_id, { cancel_at_period_end: true, metadata: { resilie_le: new Date().toISOString(), resilie_par: "client" } });
  const finTs = sub.items.data[0]?.current_period_end;
  const fin = finTs ? new Date(finTs * 1000) : null;
  await admin.from("profils").update({ resiliation_prevue: true }).eq("id", session.user.id);
  const offre = estPlan(p.plan) ? PLANS[p.plan].nom : String(p.plan);
  await journaliser(session.user.id, session.user.email, "resiliation", { abonnement: sub.id, offre, fin: fin?.toISOString() ?? null });
  const dateFin = fin ? fin.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }) : "la fin de la période en cours";
  const email = await envoyerEmail(session.user.email ?? "", "Confirmation de résiliation de votre abonnement MySite",
    `Bonjour,\n\nNous confirmons la résiliation de votre abonnement MySite ${offre}, demandée le ${new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}.\n\nVous gardez l'accès à votre offre jusqu'au ${dateFin}. Aucun prélèvement ne sera effectué ensuite : votre compte repassera en offre Gratuite et vos données resteront accessibles.\n\nVous avez changé d'avis ? Vous pouvez reprendre votre abonnement depuis « Mon abonnement » avant cette date.${signature()}`);
  return NextResponse.json({ ok: true, fin: fin?.toISOString() ?? null, email });
}
