/**
 * Parrainage : règles, sans effet de bord (testées dans parrainage.test.ts).
 * Règle publique : « Invite un ami : il a -20 % sur son 1er paiement, et toi tu gagnes 29 € de crédit dès qu'il paie son 2e mois. »
 * Le crédit n'est jamais converti en argent ni transféré : il est déduit des prochaines factures MySite du parrain.
 */
import { coutMaxIA, PLANS } from "./plans";

export const REMISE_FILLEUL_POURCENT = 20;
export const CREDIT_PARRAIN_CENTIMES = 2900;
export const JOURS_PRO_OFFERTS = 30;
export const RECOMPENSES_MAX_PAR_AN = 12;
export const DELAI_VALIDATION_ANNUEL_JOURS = 14;
export const DUREE_COOKIE_JOURS = 30;
export const COOKIE_PARRAIN = "mysite_parrain";
/** Identifiant du coupon Stripe (-20 %, une seule fois). Créé automatiquement s'il n'existe pas. */
export const COUPON_STRIPE = "MYSITE-PARRAINAGE-20";

const JOUR = 86400000;

// ---------- Codes ----------

/** Chiffres sans 0 ni 1 : jamais de confusion avec O et I. La partie prénom ne contient que des lettres. */
const CHIFFRES = "23456789";

/** Partie lisible du code : le prénom en majuscules, sans accents, lettres seules, 10 au plus (« AMI » s'il n'y en a pas). */
export function racineCode(prenom: string | null | undefined): string {
  const r = (prenom ?? "").trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().split(/[\s-]+/)[0].replace(/[^A-Z]/g, "").slice(0, 10);
  return r.length >= 2 ? r : "AMI";
}

/** Nouveau code, par exemple « LEA-4827 ». `alea` renvoie un nombre dans [0, 1). */
export function genererCode(prenom: string | null | undefined, alea: () => number = Math.random): string {
  let suffixe = "";
  for (let i = 0; i < 4; i++) suffixe += CHIFFRES[Math.floor(alea() * CHIFFRES.length)];
  return `${racineCode(prenom)}-${suffixe}`;
}

/**
 * Code saisi ou reçu dans un lien → forme canonique, ou null s'il n'a pas la bonne forme.
 * Tolère les minuscules, les espaces et la confusion 0/O et 1/I dans la partie prénom.
 */
export function normaliserCode(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = v.trim().toUpperCase().replace(/\s+/g, "").match(/^([A-Z01]{2,10})-?([2-9]{4})$/);
  if (!m) return null;
  return `${m[1].replace(/0/g, "O").replace(/1/g, "I")}-${m[2]}`;
}

export const lienParrainage = (site: string, code: string) => `${site.replace(/\/$/, "")}/?ref=${encodeURIComponent(code)}`;

export const messagePartage = (lien: string) =>
  `J'utilise MySite pour trouver des commerces et leur vendre des sites. Avec mon lien, tu as -20 % sur ton premier paiement : ${lien}`;

/** « Prénom + initiale du nom » : jamais le nom complet ni l'e-mail d'un filleul. */
export function nomAffiche(prenom: string | null | undefined, rang: number): string {
  const mots = (prenom ?? "").trim().split(/\s+/).filter(Boolean);
  if (!mots.length) return `Ami n°${rang}`;
  const p = mots[0].charAt(0).toUpperCase() + mots[0].slice(1, 30);
  return mots[1] ? `${p} ${mots[1].charAt(0).toUpperCase()}.` : p;
}

// ---------- Anti-triche ----------

/** E-mail comparable : minuscules, sans « +étiquette », sans les points pour Gmail. */
export function normaliserEmail(email: string | null | undefined): string {
  const e = (email ?? "").trim().toLowerCase();
  const [local, domaine] = e.split("@");
  if (!domaine) return e;
  let l = local.split("+")[0];
  const d = domaine === "googlemail.com" ? "gmail.com" : domaine;
  if (d === "gmail.com") l = l.replace(/\./g, "");
  return `${l}@${d}`;
}

export interface Identite { id: string; email?: string | null; empreintesCartes?: string[] }

/** Auto-parrainage : même compte, même e-mail (normalisé) ou même carte bancaire (empreinte Stripe). Renvoie le motif, ou null. */
export function motifAutoParrainage(parrain: Identite, filleul: Identite): "meme_compte" | "meme_email" | "meme_carte" | null {
  if (parrain.id === filleul.id) return "meme_compte";
  if (parrain.email && filleul.email && normaliserEmail(parrain.email) === normaliserEmail(filleul.email)) return "meme_email";
  const cartes = new Set((parrain.empreintesCartes ?? []).filter(Boolean));
  if ((filleul.empreintesCartes ?? []).some((c) => c && cartes.has(c))) return "meme_carte";
  return null;
}

// ---------- Réduction du filleul ----------

/** -20 % sur le 1er paiement : seulement pour un compte neuf, parrainé, jamais abonné auparavant. */
export function remiseApplicable(f: { parrainId: string | null | undefined; statutParrainage: string | null | undefined; aDejaPaye: boolean; abonnementsPasses: number }): boolean {
  return !!f.parrainId && f.statutParrainage === "inscrit" && !f.aDejaPaye && f.abonnementsPasses === 0;
}

/** Montant de chaque paiement en centimes : la remise ne vaut que pour le 1er (rang 1). */
export function montantPaiement(prixCentimes: number, rang: number, remise: boolean): number {
  return remise && rang === 1 ? Math.round(prixCentimes * (100 - REMISE_FILLEUL_POURCENT) / 100) : prixCentimes;
}

/** Prix du 1er paiement affiché sur la page des offres, en euros (au centime). */
export const premierPaiementRemise = (prixEuros: number) => Math.round(prixEuros * (100 - REMISE_FILLEUL_POURCENT)) / 100;

// ---------- Cycle de vie ----------

export type StatutParrainage = "inscrit" | "paye" | "valide" | "annule";
export type Periode = "mensuel" | "annuel";
export type MotifAnnulation = "retractation" | "remboursement" | "litige" | "resiliation" | "meme_email" | "meme_carte" | "meme_compte" | "deja_abonne";

export interface Parrainage {
  statut: StatutParrainage;
  periode: Periode | null;
  paiements: number;            // factures payées (> 0 €) du filleul, création et renouvellements
  premierPaiementLe: Date | null;
  validationPrevueLe: Date | null;
}

export type Evenement =
  | { type: "paiement"; periode: Periode; le: Date; montantCentimes: number }
  | { type: "annulation"; motif: MotifAnnulation }
  | { type: "echeance"; le: Date };   // passage quotidien de la tâche automatique

export interface Transition { parrainage: Parrainage; action: "rien" | "premier_paiement" | "valider" | "annuler"; motif?: MotifAnnulation }

/**
 * Applique un événement au parrainage :
 *  - 1er paiement → « payé » (en annuel, validation prévue 14 jours plus tard) ;
 *  - 2e paiement d'un filleul mensuel → « validé » ;
 *  - échéance des 14 jours d'un filleul annuel → « validé » ;
 *  - rétractation, remboursement, litige, résiliation avant la validation → « annulé ».
 * Un parrainage validé ou annulé ne bouge plus.
 */
export function appliquer(p: Parrainage, e: Evenement): Transition {
  if (p.statut === "valide" || p.statut === "annule") return { parrainage: p, action: "rien" };
  if (e.type === "annulation") return { parrainage: { ...p, statut: "annule" }, action: "annuler", motif: e.motif };
  if (e.type === "paiement") {
    if (e.montantCentimes <= 0) return { parrainage: p, action: "rien" };
    const paiements = p.paiements + 1;
    if (p.statut === "inscrit") {
      const validationPrevueLe = e.periode === "annuel" ? new Date(e.le.getTime() + DELAI_VALIDATION_ANNUEL_JOURS * JOUR) : null;
      return { parrainage: { ...p, statut: "paye", periode: e.periode, paiements, premierPaiementLe: e.le, validationPrevueLe }, action: "premier_paiement" };
    }
    if (p.periode === "mensuel" && paiements >= 2) return { parrainage: { ...p, statut: "valide", paiements }, action: "valider" };
    return { parrainage: { ...p, paiements }, action: "rien" };
  }
  // échéance quotidienne
  if (p.statut === "paye" && p.periode === "annuel" && p.validationPrevueLe && e.le.getTime() >= p.validationPrevueLe.getTime()) {
    return { parrainage: { ...p, statut: "valide" }, action: "valider" };
  }
  return { parrainage: p, action: "rien" };
}

// ---------- Récompense du parrain ----------

export type TypeRecompense = "credit" | "pro_offert" | "hors_limite";

/**
 * Récompense due au parrain au moment de la validation :
 *  - au-delà de 12 récompenses dans l'année civile : rien (le parrainage est compté, pas récompensé) ;
 *  - parrain abonné payant : 29 € de crédit sur son solde Stripe ;
 *  - parrain en offre Gratuite (même s'il profite déjà de jours de Pro offerts) : 30 jours de Pro.
 */
export function recompenseDue(parrain: { abonnePayant: boolean; recompensesCetteAnnee: number }): TypeRecompense {
  if (parrain.recompensesCetteAnnee >= RECOMPENSES_MAX_PAR_AN) return "hors_limite";
  return parrain.abonnePayant ? "credit" : "pro_offert";
}

/** Les jours de Pro offerts s'ajoutent les uns aux autres, à partir d'aujourd'hui ou de la fin de ceux déjà acquis. */
export function prolongerProOffert(jusquau: Date | null, maintenant: Date, jours = JOURS_PRO_OFFERTS): Date {
  const depart = jusquau && jusquau.getTime() > maintenant.getTime() ? jusquau : maintenant;
  return new Date(depart.getTime() + jours * JOUR);
}

/** Année civile en heure de Paris (pour la limite de 12 récompenses). */
export const anneeParis = (d: Date) => Number(new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric" }).format(d));

// ---------- Affichage ----------

export interface LigneFilleul { statut: StatutParrainage; periode: Periode | null; recompense: TypeRecompense | null }

/** Badge et avancement (0 à 3) d'un filleul dans la liste. */
export function etapeFilleul(f: LigneFilleul): { badge: string; ton: "neutre" | "attente" | "ok" | "annule"; etape: number } {
  if (f.statut === "annule") return { badge: "Annulé", ton: "annule", etape: 0 };
  if (f.statut === "valide") {
    const badge = f.recompense === "hors_limite" ? "Validé : limite de 12 atteinte" : f.recompense === "pro_offert" ? "Validé : +1 mois de Pro" : "Validé : +29 €";
    return { badge, ton: "ok", etape: 3 };
  }
  if (f.statut === "paye") return { badge: f.periode === "annuel" ? "1er paiement fait, validation sous 14 jours" : "1er paiement fait, plus qu'un mois", ton: "attente", etape: 2 };
  return { badge: "Inscrit", ton: "neutre", etape: 1 };
}

export function compteurs(liste: { statut: StatutParrainage; recompense: TypeRecompense | null; creditCentimes: number }[]) {
  return {
    inscrits: liste.length,
    enAttente: liste.filter((l) => l.statut === "inscrit" || l.statut === "paye").length,
    valides: liste.filter((l) => l.statut === "valide").length,
    creditGagneCentimes: liste.reduce((s, l) => s + (l.recompense === "credit" ? l.creditCentimes : 0), 0),
  };
}

/** Chiffres du parrainage pour le tableau « Suivi des ventes » (propriétaire). Montants en centimes. */
export function statsParrainage(parrainages: { statut: string; apporte_centimes: number }[], recompenses: { type: string; statut: string; montant_centimes: number; jours: number }[]) {
  return {
    parrainages: parrainages.length,
    payants: parrainages.filter((p) => p.statut === "paye" || p.statut === "valide").length,
    valides: parrainages.filter((p) => p.statut === "valide").length,
    annules: parrainages.filter((p) => p.statut === "annule").length,
    creditDonneCentimes: recompenses.filter((r) => r.type === "credit" && r.statut === "credite").reduce((s, r) => s + r.montant_centimes, 0),
    joursProOfferts: recompenses.filter((r) => r.type === "pro_offert").reduce((s, r) => s + r.jours, 0),
    caFilleulsCentimes: parrainages.reduce((s, p) => s + Math.max(0, p.apporte_centimes), 0),
  };
}

// ---------- Rentabilité ----------

/**
 * Hypothèses du calcul de rentabilité (prudentes) :
 *  - cotisations sociales de la micro-entreprise : 25,6 % du chiffre d'affaires (à faire confirmer par l'Urssaf ou le comptable) ;
 *  - Stripe : 1,5 % + 0,25 € par paiement par carte européenne ;
 *  - IA : coût maximal de l'offre (tous les quotas utilisés jusqu'au bout), un dollar compté pour un euro.
 * Un crédit sur le solde client ne supporte ni cotisations ni frais Stripe : il coûte ce que l'on aurait encaissé net à sa place.
 */
export const HYPOTHESES = { cotisations: 0.256, stripePourcent: 0.015, stripeFixe: 0.25 };

const net = (encaisse: number) => encaisse * (1 - HYPOTHESES.cotisations) - (encaisse * HYPOTHESES.stripePourcent + HYPOTHESES.stripeFixe);

/** Pire cas : filleul Pro mensuel, -20 % sur le 1er mois, IA utilisée à fond les deux mois. Montants en euros. */
export function rentabilitePireCas() {
  const P = PLANS.pro, ia = coutMaxIA(P.quotas);
  const premier = premierPaiementRemise(P.prixMensuel);
  const apporte = net(premier) + net(P.prixMensuel) - 2 * ia;
  // Prudent : on ne retire pas les 0,25 € fixes (encore payés si le crédit ne couvre qu'une partie de la facture).
  const credit = CREDIT_PARRAIN_CENTIMES / 100, coutCredit = credit * (1 - HYPOTHESES.cotisations) - credit * HYPOTHESES.stripePourcent;
  const coutProOffert = ia; // 30 jours de Pro offerts à un parrain en Gratuit : seul le coût de l'IA est réel
  const r = (n: number) => Math.round(n * 100) / 100;
  return { premierPaiement: premier, apporte: r(apporte), coutCredit: r(coutCredit), coutProOffert: r(coutProOffert), marge: r(apporte - Math.max(coutCredit, coutProOffert)) };
}
