/**
 * Limites des offres : quoi est épuisé, quand tout repart à zéro, quelle offre proposer et avec quels arguments.
 * Sans effet de bord (testé dans limites.test.ts).
 *
 * Principes (conception honnête, sans manipulation) :
 *  - la limite tombe après les premiers vrais résultats (commerces trouvés, messages écrits, maquettes créées), jamais avant ;
 *  - l'utilisateur est prévenu avant (« plus qu'1 message ce mois-ci ») et connaît la date exacte de remise à zéro ;
 *  - on montre ce qu'il a déjà accompli et ce que l'offre suivante change concrètement, en chiffres exacts ;
 *  - toujours une sortie : attendre le mois prochain, parrainer, ou fermer. Pas de compte à rebours, pas de culpabilisation.
 */
import { PLANS, type PlanId, type TypeQuota } from "./plans";

export type TypeLimite = TypeQuota | "sites" | "mois";

export interface EtatCompteur { max: number; utilise: number; reste: number; epuise: boolean }

/** Offre proposée après chaque offre (Ultra : aucune). */
export const OFFRE_SUIVANTE: Partial<Record<PlanId, Exclude<PlanId, "gratuit">>> = { gratuit: "pro", pro: "premium", premium: "ultra" };

export function compteurs(quotas: Record<TypeQuota, number>, conso: Record<TypeQuota, number>): Record<TypeQuota, EtatCompteur> {
  const r = {} as Record<TypeQuota, EtatCompteur>;
  for (const t of Object.keys(quotas) as TypeQuota[]) {
    const max = quotas[t], utilise = conso[t] ?? 0;
    r[t] = { max, utilise, reste: Math.max(0, max - utilise), epuise: max > 0 && utilise >= max };
  }
  return r;
}

/**
 * Mois gratuit épuisé : les deux gestes de base du mois (trouver des commerces, leur écrire) sont utilisés.
 * Toutes les créations (recherche, messages, nouvelles maquettes) sont alors bloquées jusqu'au 1er du mois suivant.
 */
export function moisGratuitEpuise(plan: PlanId, c: Record<TypeQuota, EtatCompteur>): boolean {
  return plan === "gratuit" && c.prospects.epuise && c.messages_ia.epuise;
}

/** Premier jour du mois suivant (heure de Paris), date de remise à zéro des compteurs. */
export function prochaineRemiseAZero(maintenant = new Date()): Date {
  const [a, m] = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" }).format(maintenant).split("-").map(Number);
  return new Date(Date.UTC(m === 12 ? a + 1 : a, m === 12 ? 0 : m, 1, 0, 0, 0) - 3600000); // minuit à Paris (heure d'hiver ; l'écart d'été ne change pas le jour affiché)
}
export const libelleRemise = (d: Date) => `le ${d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" }).replace(/^1 /, "1er ")}`;
export const moisEnCours = (maintenant = new Date()) => maintenant.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", month: "long" });

/** « moins de 1 € par jour » : prix mensuel ramené au jour (30 jours), arrondi à l'euro supérieur, toujours vrai. */
export function prixParJour(prixMensuel: number): string {
  const j = prixMensuel / 30;
  return `moins de ${Math.ceil(j + 1e-9)} € par jour`;
}

const LIB: Record<TypeQuota, [string, string]> = {
  prospects: ["commerce", "commerces trouvés"], messages_ia: ["message", "messages rédigés par l'IA"],
  sites_ia: ["site sur mesure", "sites sur mesure par l'IA"], retouches_ia: ["retouche", "retouches par l'IA"],
};

/** Ce que l'offre suivante change, en chiffres exacts tirés de la grille (le compteur épuisé en premier). */
export function argumentsOffre(plan: PlanId, suivante: Exclude<PlanId, "gratuit">, type?: TypeLimite): string[] {
  const A = PLANS[plan], B = PLANS[suivante], out: string[] = [];
  const ordre: TypeQuota[] = ["prospects", "messages_ia", "sites_ia", "retouches_ia"];
  if (type && type in LIB) ordre.sort((x, y) => Number(y === type) - Number(x === type));
  for (const t of ordre) {
    const a = A.quotas[t], b = B.quotas[t];
    if (b <= a) continue;
    out.push(a > 0 ? `${b.toLocaleString("fr-FR")} ${LIB[t][1]} par mois au lieu de ${a}` : `${b} ${LIB[t][1]} par mois`);
  }
  if (B.departements > A.departements) out.push(Number.isFinite(B.departements) ? `${B.departements} départements au lieu de ${A.departements}` : "La France entière");
  if (B.studio.sitesMax > A.studio.sitesMax && plan === "gratuit") out.push(`${B.studio.sitesMax} maquettes conservées au lieu de ${A.studio.sitesMax}`);
  if (B.studio.publications > A.studio.publications && A.studio.publications === 0) out.push("Mise en ligne des sites en un clic");
  if (B.academie === "complete" && A.academie !== "complete") out.push("L'Académie complète (7 modules)");
  if (B.facturation && !A.facturation) out.push("Devis et factures conformes");
  if (B.studio.marqueBlanche && !A.studio.marqueBlanche) out.push("Marque blanche (aucune mention MySite)");
  return out.slice(0, 5);
}

/** Titre de la page de limite, selon ce qui est épuisé. */
export function titreLimite(type: TypeLimite, plan: PlanId, mois: string): string {
  const q = PLANS[plan].quotas;
  switch (type) {
    case "mois": return `Votre mois gratuit de ${mois} est bien rempli 🎉`;
    case "prospects": return `Vos ${q.prospects.toLocaleString("fr-FR")} commerces de ${mois} sont trouvés`;
    case "messages_ia": return `Vos ${q.messages_ia.toLocaleString("fr-FR")} messages de ${mois} sont rédigés`;
    case "sites_ia": return `Vos ${q.sites_ia} sites sur mesure de ${mois} sont créés`;
    case "retouches_ia": return `Vos ${q.retouches_ia} retouches de ${mois} sont utilisées`;
    case "sites": return `Vos ${PLANS[plan].studio.sitesMax} maquettes sont créées`;
  }
}

export const estTypeLimite = (v: unknown): v is TypeLimite => typeof v === "string" && ["prospects", "messages_ia", "sites_ia", "retouches_ia", "sites", "mois"].includes(v);
