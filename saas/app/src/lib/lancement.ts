/**
 * Prix de lancement (offre réelle et datée, pas une fausse urgence) :
 *  - jusqu'au 30/11/2026 inclus : Pro 29 €, Premium 59 €, Ultra 119 € par mois (annuel : 290, 590, 1 190 €) ;
 *  - à partir du 1er décembre 2026 à minuit (Paris) : Pro 35 €, Premium 69 €, Ultra 139 € (annuel : 350, 690, 1 390 €) ;
 *  - toute personne abonnée avant cette date garde le prix de lancement tant qu'elle reste abonnée (engagement des CGV).
 * Le compte à rebours affiché se termine à FIN_LANCEMENT et ne recommence jamais : après cette date, il disparaît.
 * Sans effet de bord (testé dans lancement.test.ts).
 */
import { FIN_LANCEMENT, PLANS, type Periode, type PlanId } from "./plans";
export { FIN_LANCEMENT };

export const PRIX_APRES: Record<Exclude<PlanId, "gratuit">, { mensuel: number; annuel: number }> = {
  pro: { mensuel: 35, annuel: 350 },
  premium: { mensuel: 69, annuel: 690 },
  ultra: { mensuel: 139, annuel: 1390 },
};

export const enLancement = (maintenant = new Date()) => maintenant.getTime() < FIN_LANCEMENT.getTime();

/**
 * Prix applicable (€ TTC) : celui de lancement avant la date, ou pour un abonnement commencé avant la date ; sinon le nouveau prix.
 * `abonneLe` : début de l'abonnement de la personne (prix garanti), s'il existe.
 */
export function prixOffre(plan: PlanId, periode: Periode, maintenant = new Date(), abonneLe?: Date | null): number {
  if (plan === "gratuit") return 0;
  const lancement = periode === "annuel" ? PLANS[plan].prixAnnuel : PLANS[plan].prixMensuel;
  if (abonneLe && abonneLe.getTime() < FIN_LANCEMENT.getTime()) return lancement;
  return enLancement(maintenant) ? lancement : PRIX_APRES[plan][periode];
}

/** Temps restant avant la fin du lancement, découpé pour l'affichage (null une fois la date passée). */
export function tempsRestant(maintenant = new Date()): { jours: number; heures: number; minutes: number; secondes: number } | null {
  let s = Math.floor((FIN_LANCEMENT.getTime() - maintenant.getTime()) / 1000);
  if (s <= 0) return null;
  const jours = Math.floor(s / 86400); s -= jours * 86400;
  const heures = Math.floor(s / 3600); s -= heures * 3600;
  const minutes = Math.floor(s / 60);
  return { jours, heures, minutes, secondes: s - minutes * 60 };
}

export const DATE_HAUSSE = "1er décembre 2026";
