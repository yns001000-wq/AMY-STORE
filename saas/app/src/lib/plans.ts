/** Offres MySite : source unique pour la page Tarifs, les quotas et Stripe. Prix TTC en euros. */
export type PlanId = "gratuit" | "pro" | "premium" | "ultra";
export type Periode = "mensuel" | "annuel";
export type TypeQuota = "prospects" | "messages_ia" | "sites_ia" | "retouches_ia";

/** Puissance du Studio selon l'offre. */
export interface CapacitesStudio {
  effortIA: "medium" | "high" | "xhigh" | null; // profondeur de réflexion de l'IA (null = pas d'IA)
  editionComplete: boolean;   // carte/services, horaires, FAQ, infos (sinon : textes principaux, couleurs prédéfinies, sections)
  couleursLibres: boolean;    // nuancier libre (sinon 6 palettes prédéfinies)
  choixModele: boolean;       // changer de type de site (pizzeria, restaurant, artisan…)
  polices: boolean;           // choix de la police des titres
  photosPerso: boolean;       // envoi des photos du client
  versions: number;           // versions conservées (retour en arrière)
  filigrane: boolean;         // mention « Fait avec MySite » sur l'aperçu et le téléchargement
  marqueBlanche: boolean;     // aucune mention MySite, même dans le bandeau de maquette
  sitesMax: number;           // sites conservés dans le Studio
  banquePerso: number;        // photos gardées dans la banque personnelle (réutilisables sur les prochains sites)
}

export interface Plan {
  id: PlanId;
  nom: string;
  accroche: string;
  prixMensuel: number;
  prixAnnuel: number;
  departements: number; // Infinity = France entière
  quotas: Record<TypeQuota, number>; // par mois
  export: boolean;
  facturation: boolean;
  mentionMySite: boolean;
  utilisateurs: number;
  studio: CapacitesStudio;
  misEnAvant?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  gratuit: {
    id: "gratuit", nom: "Gratuit", accroche: "Pour découvrir avec vos premiers prospects",
    prixMensuel: 0, prixAnnuel: 0, departements: 1,
    quotas: { prospects: 15, messages_ia: 10, sites_ia: 0, retouches_ia: 0 },
    export: false, facturation: false, mentionMySite: true, utilisateurs: 1,
    studio: { effortIA: null, editionComplete: false, couleursLibres: false, choixModele: false, polices: false, photosPerso: false, versions: 0, filigrane: true, marqueBlanche: false, sitesMax: 3, banquePerso: 0 },
  },
  pro: {
    id: "pro", nom: "Pro", accroche: "Pour démarcher sérieusement autour de chez vous",
    prixMensuel: 29, prixAnnuel: 290, departements: 3,
    quotas: { prospects: 300, messages_ia: 300, sites_ia: 10, retouches_ia: 100 },
    export: true, facturation: false, mentionMySite: false, utilisateurs: 1,
    studio: { effortIA: "medium", editionComplete: true, couleursLibres: true, choixModele: true, polices: false, photosPerso: false, versions: 5, filigrane: false, marqueBlanche: false, sitesMax: 100, banquePerso: 0 },
  },
  premium: {
    id: "premium", nom: "Premium", accroche: "Le plus complet pour vendre chaque semaine",
    prixMensuel: 59, prixAnnuel: 590, departements: 10,
    quotas: { prospects: 1000, messages_ia: 1000, sites_ia: 40, retouches_ia: 400 },
    export: true, facturation: true, mentionMySite: false, utilisateurs: 1, misEnAvant: true,
    studio: { effortIA: "high", editionComplete: true, couleursLibres: true, choixModele: true, polices: true, photosPerso: true, versions: 20, filigrane: false, marqueBlanche: false, sitesMax: 500, banquePerso: 300 },
  },
  ultra: {
    id: "ultra", nom: "Ultra", accroche: "Pour les agences et les gros volumes",
    prixMensuel: 119, prixAnnuel: 1190, departements: Infinity,
    quotas: { prospects: 3000, messages_ia: 3000, sites_ia: 120, retouches_ia: 1500 },
    export: true, facturation: true, mentionMySite: false, utilisateurs: 3,
    studio: { effortIA: "xhigh", editionComplete: true, couleursLibres: true, choixModele: true, polices: true, photosPerso: true, versions: 50, filigrane: false, marqueBlanche: true, sitesMax: 2000, banquePerso: 2000 },
  },
};

export const ORDRE_PLANS: PlanId[] = ["gratuit", "pro", "premium", "ultra"];
export const DUREE_ESSAI_JOURS = 7;

export function estPlan(v: unknown): v is PlanId {
  return typeof v === "string" && (ORDRE_PLANS as string[]).includes(v);
}

/** Offre réellement appliquée : un essai Premium en cours prime sur le gratuit. */
export function planEffectif(p: { plan: string; essai_fin?: string | null }, maintenant = new Date()): PlanId {
  const base: PlanId = estPlan(p.plan) ? p.plan : "gratuit";
  if (base === "gratuit" && p.essai_fin && new Date(p.essai_fin) > maintenant) return "premium";
  return base;
}

export function limite(plan: PlanId, type: TypeQuota): number {
  return PLANS[plan].quotas[type];
}

export function departementsAutorises(plan: PlanId, demandes: string[]): string[] {
  const n = PLANS[plan].departements;
  return Number.isFinite(n) ? demandes.slice(0, n) : demandes;
}

/** Économie annuelle affichée (« 2 mois offerts »). */
export function economieAnnuelle(plan: PlanId): number {
  const p = PLANS[plan];
  return Math.max(0, p.prixMensuel * 12 - p.prixAnnuel);
}

/** Correspondance offre/période vers identifiant de prix Stripe (configuré dans l'environnement). */
export function priceIdStripe(plan: Exclude<PlanId, "gratuit">, periode: Periode, env: Record<string, string | undefined> = process.env): string | undefined {
  return env[`STRIPE_PRICE_${plan.toUpperCase()}_${periode.toUpperCase()}`];
}

/** Inverse : retrouve l'offre à partir de l'identifiant de prix reçu de Stripe. Inconnu = gratuit (jamais d'accès offert par erreur). */
export function planDepuisPriceId(priceId: string | null | undefined, env: Record<string, string | undefined> = process.env): PlanId {
  if (!priceId) return "gratuit";
  for (const plan of ["pro", "premium", "ultra"] as const) {
    for (const periode of ["mensuel", "annuel"] as const) {
      if (priceIdStripe(plan, periode, env) === priceId) return plan;
    }
  }
  return "gratuit";
}

/** Statuts Stripe qui donnent accès à l'offre payée. */
export function abonnementActif(statut: string | null | undefined): boolean {
  return statut === "active" || statut === "trialing";
}
