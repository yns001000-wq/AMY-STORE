import "server-only";
import type Stripe from "stripe";
import { supabaseAdmin } from "./supabase/admin";
import { stripe } from "./stripe";
import { envoyerEmail, urlSite } from "./email";
import { abonnementActif, estPlan } from "./plans";
import {
  appliquer, COUPON_STRIPE, CREDIT_PARRAIN_CENTIMES, genererCode, JOURS_PRO_OFFERTS, motifAutoParrainage, nomAffiche, normaliserCode,
  RECOMPENSES_MAX_PAR_AN, REMISE_FILLEUL_POURCENT, remiseApplicable, type Evenement, type MotifAnnulation, type Parrainage, type StatutParrainage,
} from "./parrainage";

/**
 * Parrainage côté serveur : codes, remise du filleul au paiement, suivi des paiements (webhook Stripe), récompense du parrain.
 * Idempotence : chaque facture n'est comptée qu'une fois (liste « factures » du parrainage), une récompense est unique par parrainage
 * (clé unique en base) et le crédit Stripe est envoyé avec une clé d'idempotence propre au parrainage : un événement rejoué ne crédite jamais deux fois.
 */

type Ligne = {
  id: string; parrain_id: string; filleul_id: string; statut: StatutParrainage; periode: "mensuel" | "annuel" | null; paiements: number; factures: string[];
  premier_paiement_le: string | null; validation_prevue_le: string | null; apporte_centimes: number;
};

const versParrainage = (l: Ligne): Parrainage => ({
  statut: l.statut, periode: l.periode, paiements: l.paiements,
  premierPaiementLe: l.premier_paiement_le ? new Date(l.premier_paiement_le) : null,
  validationPrevueLe: l.validation_prevue_le ? new Date(l.validation_prevue_le) : null,
});

async function historique(parrainId: string, parrainageId: string | null, evenement: string, details: Record<string, unknown> = {}) {
  await supabaseAdmin().from("historique_parrainage").insert({ parrain_id: parrainId, parrainage_id: parrainageId, evenement, details });
}

// ---------- Codes ----------

/** Code personnel de l'utilisateur, créé à la première demande (nouvel essai si le code tiré existe déjà). */
export async function assurerCode(userId: string, prenom: string | null | undefined): Promise<string> {
  const admin = supabaseAdmin();
  const { data } = await admin.from("codes_parrainage").select("code").eq("user_id", userId).maybeSingle();
  if (data?.code) return data.code as string;
  for (let i = 0; i < 8; i++) {
    const code = genererCode(prenom);
    const { error } = await admin.from("codes_parrainage").insert({ user_id: userId, code });
    if (!error) return code;
    const { data: deja } = await admin.from("codes_parrainage").select("code").eq("user_id", userId).maybeSingle();
    if (deja?.code) return deja.code as string;  // créé en parallèle
  }
  throw new Error("Impossible de créer un code de parrainage");
}

/** Prénom du parrain pour le bandeau « Invité par … » (rien d'autre n'est révélé). */
export async function parrainDuCode(code: unknown): Promise<{ prenom: string } | null> {
  const c = normaliserCode(code);
  if (!c) return null;
  const admin = supabaseAdmin();
  const { data } = await admin.from("codes_parrainage").select("user_id").eq("code", c).maybeSingle();
  if (!data) return null;
  const { data: p } = await admin.from("profils").select("prenom").eq("id", data.user_id).maybeSingle();
  return { prenom: nomAffiche(p?.prenom as string | null, 1).replace(/^Ami n°1$/, "un ami") };
}

// ---------- Remise du filleul ----------

/** Coupon -20 % « une seule fois », créé dans Stripe s'il n'existe pas encore. */
async function coupon(): Promise<string> {
  try { await stripe().coupons.retrieve(COUPON_STRIPE); }
  catch {
    await stripe().coupons.create({ id: COUPON_STRIPE, percent_off: REMISE_FILLEUL_POURCENT, duration: "once", name: "Parrainage : -20 % sur le 1er paiement" }).catch(async (e) => {
      // créé entre-temps par une autre requête : sinon, vraie erreur
      await stripe().coupons.retrieve(COUPON_STRIPE).catch(() => { throw e; });
    });
  }
  return COUPON_STRIPE;
}

/** Remise à appliquer au paiement : le coupon si le compte est un filleul neuf, jamais abonné, sinon null. */
export async function remisePourPaiement(userId: string, customerId: string): Promise<{ coupon: string; parrainageId: string } | null> {
  const admin = supabaseAdmin();
  const [{ data: profil }, { data: par }] = await Promise.all([
    admin.from("profils").select("parrain_id, a_deja_paye").eq("id", userId).single(),
    admin.from("parrainages").select("id, statut").eq("filleul_id", userId).maybeSingle(),
  ]);
  if (!profil?.parrain_id || !par) return null;
  const passes = await stripe().subscriptions.list({ customer: customerId, status: "all", limit: 3 });
  const abonnementsPasses = passes.data.filter((s) => s.status !== "incomplete" && s.status !== "incomplete_expired").length;
  if (!remiseApplicable({ parrainId: profil.parrain_id as string, statutParrainage: par.statut as string, aDejaPaye: !!profil.a_deja_paye, abonnementsPasses })) return null;
  return { coupon: await coupon(), parrainageId: par.id as string };
}

// ---------- Empreintes de cartes ----------

async function empreintesClient(customerId: string | null | undefined): Promise<string[]> {
  if (!customerId) return [];
  const s = new Set<string>();
  const [pm, ch] = await Promise.all([
    stripe().paymentMethods.list({ customer: customerId, type: "card", limit: 20 }).catch(() => null),
    stripe().charges.list({ customer: customerId, limit: 20 }).catch(() => null),
  ]);
  pm?.data.forEach((m) => m.card?.fingerprint && s.add(m.card.fingerprint));
  ch?.data.forEach((c) => c.payment_method_details?.card?.fingerprint && s.add(c.payment_method_details.card.fingerprint));
  return [...s];
}

async function empreinteFacture(f: Stripe.Invoice): Promise<string[]> {
  try {
    const paiements = await stripe().invoicePayments.list({ invoice: f.id!, limit: 3 });
    const out: string[] = [];
    for (const p of paiements.data) {
      const pi = p.payment.payment_intent;
      if (!pi) continue;
      const intent = await stripe().paymentIntents.retrieve(typeof pi === "string" ? pi : pi.id, { expand: ["latest_charge"] });
      const ch = intent.latest_charge as Stripe.Charge | null;
      const fp = ch?.payment_method_details?.card?.fingerprint;
      if (fp) out.push(fp);
    }
    return out;
  } catch { return []; }
}

// ---------- Suivi des paiements ----------

async function parrainageDuClient(customerId: string | null | undefined): Promise<Ligne | null> {
  if (!customerId) return null;
  const admin = supabaseAdmin();
  const { data: profil } = await admin.from("profils").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  if (!profil) return null;
  const { data } = await admin.from("parrainages").select("*").eq("filleul_id", profil.id).maybeSingle();
  return (data as Ligne | null) ?? null;
}

const idClient = (c: string | { id: string } | null | undefined) => (typeof c === "string" ? c : c?.id ?? null);

/** Facture payée (webhook invoice.paid) : 1er paiement, 2e paiement (validation en mensuel), chiffre d'affaires apporté. */
export async function facturePayee(f: Stripe.Invoice): Promise<void> {
  const admin = supabaseAdmin();
  const client = idClient(f.customer);
  if (f.amount_paid > 0 && client) await admin.from("profils").update({ a_deja_paye: true }).eq("stripe_customer_id", client);
  const l = await parrainageDuClient(client);
  if (!l || !f.id) return;  // pas filleul
  if (l.factures.includes(f.id)) {  // facture déjà comptée : on termine seulement une récompense restée en suspens
    if (l.statut === "paye" && l.periode === "mensuel" && l.paiements >= 2) await recompenser(l.id);
    return;
  }
  const apporte = l.apporte_centimes + Math.max(0, f.amount_paid);
  const compte = ["subscription_create", "subscription_cycle"].includes(f.billing_reason ?? "");
  // Le CA apporté est suivi même après la validation (page « Suivi des ventes »).
  if (!compte || l.statut === "valide" || l.statut === "annule") {
    await admin.from("parrainages").update({ factures: [...l.factures, f.id], apporte_centimes: apporte }).eq("id", l.id);
    return;
  }
  const subId = f.parent?.subscription_details?.subscription;
  const sub = subId ? await stripe().subscriptions.retrieve(typeof subId === "string" ? subId : subId.id) : null;
  const periode = sub?.items.data[0]?.price.recurring?.interval === "year" ? "annuel" : "mensuel";
  const le = new Date((f.status_transitions?.paid_at ?? Math.floor(Date.now() / 1000)) * 1000);
  const t = appliquer(versParrainage(l), { type: "paiement", periode, le, montantCentimes: f.amount_paid });

  // Auto-parrainage par la même carte : vérifié dès le 1er paiement.
  if (t.action === "premier_paiement") {
    const { data: pp } = await admin.from("profils").select("stripe_customer_id").eq("id", l.parrain_id).maybeSingle();
    const [cartesParrain, cartesFilleul] = await Promise.all([empreintesClient(pp?.stripe_customer_id as string | null), empreinteFacture(f)]);
    const motif = motifAutoParrainage({ id: l.parrain_id, empreintesCartes: cartesParrain }, { id: l.filleul_id, empreintesCartes: cartesFilleul });
    if (motif) {
      await admin.from("parrainages").update({ factures: [...l.factures, f.id], apporte_centimes: apporte, paiements: 1, periode, premier_paiement_le: le.toISOString() }).eq("id", l.id);
      await annuler(l, motif);
      return;
    }
  }
  const p = t.parrainage;
  const { data: maj } = await admin.from("parrainages").update({
    factures: [...l.factures, f.id], apporte_centimes: apporte, paiements: p.paiements, periode: p.periode,
    premier_paiement_le: p.premierPaiementLe?.toISOString() ?? null, validation_prevue_le: p.validationPrevueLe?.toISOString() ?? null,
    statut: t.action === "valider" ? l.statut : p.statut,   // « validé » est posé par la fonction de récompense, de façon atomique
  }).eq("id", l.id).eq("statut", l.statut).select("id").maybeSingle();
  if (!maj) return; // modifié entre-temps : Stripe renverra l'événement si besoin
  if (t.action === "premier_paiement") {
    await historique(l.parrain_id, l.id, "premier_paiement", { periode, montant_centimes: f.amount_paid });
    await prevenirParrain(l, "abonne");
  }
  if (t.action === "valider") await recompenser(l.id);
}

/** Annule un parrainage non validé (rétractation, remboursement, litige, résiliation, triche). */
async function annuler(l: Ligne, motif: MotifAnnulation): Promise<void> {
  const t = appliquer(versParrainage(l), { type: "annulation", motif });
  if (t.action !== "annuler") return;
  const { data } = await supabaseAdmin().from("parrainages").update({ statut: "annule", annule_le: new Date().toISOString(), motif_annulation: motif })
    .eq("id", l.id).in("statut", ["inscrit", "paye"]).select("id").maybeSingle();
  if (data) await historique(l.parrain_id, l.id, "annulation", { motif });
}

/** Annule le parrainage d'un filleul (appelé par la rétractation, avant le remboursement). */
export async function annulerFilleul(userId: string, motif: MotifAnnulation): Promise<void> {
  const { data } = await supabaseAdmin().from("parrainages").select("*").eq("filleul_id", userId).maybeSingle();
  if (data) await annuler(data as Ligne, motif);
}

/** Remboursement (dont rétractation) : annule le parrainage non validé et retire le montant du CA apporté. */
export async function remboursement(c: Stripe.Charge, retractation: boolean): Promise<void> {
  const l = await parrainageDuClient(idClient(c.customer));
  if (!l) return;
  await supabaseAdmin().from("parrainages").update({ apporte_centimes: Math.max(0, l.apporte_centimes - (c.amount_refunded ?? 0)) }).eq("id", l.id);
  await annuler(l, retractation ? "retractation" : "remboursement");
}

export async function litige(d: Stripe.Dispute): Promise<void> {
  const chargeId = typeof d.charge === "string" ? d.charge : d.charge.id;
  const c = await stripe().charges.retrieve(chargeId);
  const l = await parrainageDuClient(idClient(c.customer));
  if (l) await annuler(l, "litige");
}

/** Résiliation (demandée ou effective) avant la validation : le parrainage est annulé. */
export async function finAbonnement(sub: Stripe.Subscription, supprime: boolean): Promise<void> {
  if (!supprime && !sub.cancel_at_period_end && !sub.cancel_at) return;
  const l = await parrainageDuClient(idClient(sub.customer));
  if (!l || l.statut !== "paye") return;
  await annuler(l, sub.metadata?.retractation === "oui" ? "retractation" : "resiliation");
}

// ---------- Récompense ----------

/** Valide le parrainage et récompense le parrain (crédit Stripe, jours de Pro, ou rien au-delà de 12 dans l'année). */
export async function recompenser(parrainageId: string): Promise<void> {
  const admin = supabaseAdmin();
  const { data: l } = await admin.from("parrainages").select("parrain_id, filleul_id").eq("id", parrainageId).single();
  const { data: parrain } = await admin.from("profils").select("plan, abonnement_statut, stripe_customer_id, stripe_subscription_id").eq("id", l!.parrain_id).single();
  const abonnePayant = !!parrain && estPlan(parrain.plan) && parrain.plan !== "gratuit" && abonnementActif(parrain.abonnement_statut as string) && !!parrain.stripe_customer_id;
  const { data: r, error } = await admin.rpc("recompenser_parrainage", { p_parrainage: parrainageId, p_abonne_payant: abonnePayant, p_limite: RECOMPENSES_MAX_PAR_AN, p_credit: CREDIT_PARRAIN_CENTIMES, p_jours: JOURS_PRO_OFFERTS }).single();
  if (error || !r) throw error ?? new Error("Récompense impossible");
  const rec = r as { recompense_id: string; type: string; statut: string; deja: boolean };
  if (rec.type === "credit" && rec.statut === "a_crediter") await crediter(rec.recompense_id);
  if (!rec.deja && rec.type !== "credit") await prevenirParrain({ parrain_id: l!.parrain_id, filleul_id: l!.filleul_id }, rec.type === "pro_offert" ? "pro_offert" : "hors_limite");
}

/** Envoie le crédit de 29 € sur le solde client Stripe du parrain (montant négatif = crédit). Rejouable sans risque. */
export async function crediter(recompenseId: string): Promise<void> {
  const admin = supabaseAdmin();
  const { data: rec } = await admin.from("recompenses_parrainage").select("id, parrainage_id, parrain_id, montant_centimes, statut").eq("id", recompenseId).single();
  if (!rec || rec.statut !== "a_crediter") return;
  const { data: p } = await admin.from("profils").select("stripe_customer_id").eq("id", rec.parrain_id).single();
  if (!p?.stripe_customer_id) return;
  const tx = await stripe().customers.createBalanceTransaction(p.stripe_customer_id as string, {
    amount: -rec.montant_centimes, currency: "eur",
    description: "Parrainage MySite : crédit de 29 € déduit des prochaines factures (non remboursable en argent)",
    metadata: { parrainage_id: rec.parrainage_id, recompense_id: rec.id },
  }, { idempotencyKey: `parrainage-credit-${rec.parrainage_id}` });
  const { data: maj } = await admin.from("recompenses_parrainage").update({ statut: "credite", stripe_transaction_id: tx.id }).eq("id", rec.id).eq("statut", "a_crediter").select("parrainage_id").maybeSingle();
  if (maj) {
    await historique(rec.parrain_id, rec.parrainage_id, "credit", { montant_centimes: rec.montant_centimes, transaction: tx.id });
    const { data: l } = await admin.from("parrainages").select("parrain_id, filleul_id").eq("id", rec.parrainage_id).single();
    if (l) await prevenirParrain(l, "credit");
  }
}

/** Tâche quotidienne : valide les filleuls annuels après 14 jours (s'ils n'ont ni résilié ni été remboursés), relance les crédits en attente. */
export async function passageQuotidien(maintenant = new Date()): Promise<{ valides: number; annules: number; credites: number }> {
  const admin = supabaseAdmin();
  let valides = 0, annules = 0, credites = 0;
  const { data: echus } = await admin.from("parrainages").select("*").eq("statut", "paye").eq("periode", "annuel").lte("validation_prevue_le", maintenant.toISOString()).limit(500);
  for (const l of (echus ?? []) as Ligne[]) {
    // Double vérification auprès de Stripe : abonnement toujours actif, sans résiliation prévue, dernier paiement non remboursé ni contesté.
    const { data: f } = await admin.from("profils").select("stripe_customer_id, stripe_subscription_id").eq("id", l.filleul_id).single();
    const sub = f?.stripe_subscription_id ? await stripe().subscriptions.retrieve(f.stripe_subscription_id as string).catch(() => null) : null;
    const charges = f?.stripe_customer_id ? await stripe().charges.list({ customer: f.stripe_customer_id as string, limit: 5 }) : null;
    const rembourse = charges?.data.some((c) => c.amount_refunded > 0 || c.disputed);
    let motif: MotifAnnulation | null = null;
    if (!sub || !abonnementActif(sub.status)) motif = "resiliation";
    else if (sub.cancel_at_period_end || sub.cancel_at) motif = "resiliation";
    else if (rembourse) motif = "remboursement";
    if (motif) { await annuler(l, motif); annules++; continue; }
    const t = appliquer(versParrainage(l), { type: "echeance", le: maintenant } as Evenement);
    if (t.action === "valider") { await recompenser(l.id); valides++; }
  }
  // Filet de sécurité : 2e paiement mensuel compté mais récompense interrompue (erreur passagère).
  const { data: suspens } = await admin.from("parrainages").select("id").eq("statut", "paye").eq("periode", "mensuel").gte("paiements", 2).limit(500);
  for (const l of suspens ?? []) { await recompenser(l.id as string); valides++; }
  const { data: attente } = await admin.from("recompenses_parrainage").select("id").eq("statut", "a_crediter").limit(500);
  for (const r of attente ?? []) { await crediter(r.id as string); credites++; }
  return { valides, annules, credites };
}

// ---------- E-mails au parrain (jamais à une personne extérieure) ----------

async function prevenirParrain(l: { parrain_id: string; filleul_id: string }, quoi: "abonne" | "credit" | "pro_offert" | "hors_limite"): Promise<void> {
  const admin = supabaseAdmin();
  const [{ data: u }, { data: filleul }] = await Promise.all([
    admin.auth.admin.getUserById(l.parrain_id),
    admin.from("profils").select("prenom").eq("id", l.filleul_id).maybeSingle(),
  ]);
  const email = u?.user?.email;
  if (!email) return;
  const ami = nomAffiche(filleul?.prenom as string | null, 1).replace(/^Ami n°1$/, "Ton ami");
  const bouton = { texte: "Voir mes parrainages", url: urlSite("/espace/parrainage") };
  if (quoi === "abonne") {
    await envoyerEmail(email, `🙌 ${ami} s'est abonné à MySite`, {
      emoji: "🙌", titre: `${ami} s'est abonné`,
      paragraphes: [`${ami} vient de faire son 1er paiement avec ton lien de parrainage. Merci !`, "Dès qu'il paie son 2e mois (ou 14 jours après son paiement s'il a choisi l'annuel), tu gagnes 29 € de crédit, déduits automatiquement de tes prochaines factures MySite."],
      bouton, note: "S'il se rétracte, est remboursé ou résilie avant, le parrainage est annulé.",
    });
  } else if (quoi === "credit") {
    await envoyerEmail(email, "🎉 +29 € gagnés grâce au parrainage", {
      emoji: "🎉", titre: "+29 € gagnés 🎉",
      paragraphes: [`Le parrainage de ${ami} est validé : 29 € de crédit ont été ajoutés à ton compte.`, "Ils seront déduits automatiquement de ta prochaine facture MySite. S'il en reste, ils passent sur les mois suivants."],
      bouton, note: "Le crédit ne peut pas être converti en argent ni transféré.",
    });
  } else if (quoi === "pro_offert") {
    await envoyerEmail(email, "🎉 1 mois de Pro offert grâce au parrainage", {
      emoji: "🎉", titre: "1 mois de Pro offert 🎉",
      paragraphes: [`Le parrainage de ${ami} est validé. Comme tu es en offre Gratuite, tu profites de 30 jours de l'offre Pro, offerts.`, "Rien à payer, rien à résilier : à la fin, ton compte repasse simplement en Gratuit."],
      bouton,
    });
  } else {
    await envoyerEmail(email, `✅ Parrainage de ${ami} validé`, {
      emoji: "✅", titre: "Parrainage validé",
      paragraphes: [`Le parrainage de ${ami} est validé. Tu as déjà reçu 12 récompenses cette année : celui-ci est compté, mais sans récompense.`, "Le compteur repart à zéro le 1er janvier."],
      bouton,
    });
  }
}
