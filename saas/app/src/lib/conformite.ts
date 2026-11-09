/**
 * Règles légales de l'abonnement (fonctions pures, testées).
 * - Rétractation d'un consommateur : 14 jours après la souscription (art. L221-18 C. conso.). L'exécution immédiate demandée
 *   ne supprime pas ce droit pour un abonnement (le service n'est pas « pleinement exécuté ») : le consommateur paie
 *   seulement la part déjà fournie (art. L221-25).
 * - Reconduction tacite : information du consommateur au plus tôt 3 mois et au plus tard 1 mois avant la date limite (art. L215-1).
 * - Résiliation en ligne « en 3 clics » (art. L215-1-1, décret 2023-182) : fonctionnalité accessible, confirmation sur support durable.
 */
const JOUR = 864e5;

export function retractationPossible(o: { particulier: boolean; debut: Date | null; deja: boolean }, maintenant = new Date()): { ok: boolean; jusquau: Date | null; raison?: string } {
  if (!o.particulier) return { ok: false, jusquau: null, raison: "Le droit de rétractation concerne les consommateurs (particuliers)." };
  if (!o.debut) return { ok: false, jusquau: null, raison: "Aucun abonnement en cours." };
  if (o.deja) return { ok: false, jusquau: null, raison: "Rétractation déjà exercée." };
  const jusquau = new Date(o.debut.getTime() + 14 * JOUR);
  return maintenant <= jusquau ? { ok: true, jusquau } : { ok: false, jusquau, raison: "Le délai de 14 jours est dépassé : vous pouvez résilier à tout moment." };
}

/** Remboursement en cas de rétractation : montant payé moins la part du service déjà fournie (au jour près). En centimes. */
export function montantRetractation(payeCentimes: number, debutPeriode: Date, finPeriode: Date, maintenant = new Date()): { rembourse: number; retenu: number; joursUtilises: number } {
  const total = Math.max(1, Math.round((finPeriode.getTime() - debutPeriode.getTime()) / JOUR));
  const utilises = Math.min(total, Math.max(0, Math.ceil((maintenant.getTime() - debutPeriode.getTime()) / JOUR)));
  const retenu = Math.round((payeCentimes * utilises) / total);
  return { rembourse: Math.max(0, payeCentimes - retenu), retenu, joursUtilises: utilises };
}

/** Faut-il envoyer aujourd'hui le rappel de reconduction d'un abonnement annuel ? (entre 3 mois et 1 mois avant l'échéance, une seule fois par échéance) */
export function rappelReconductionDu(o: { periode: string | null; finPeriode: Date | null; resiliationPrevue: boolean; rappelEnvoyePour: Date | null }, maintenant = new Date()): boolean {
  if (o.periode !== "annuel" || !o.finPeriode || o.resiliationPrevue) return false;
  if (o.rappelEnvoyePour && o.rappelEnvoyePour.getTime() === o.finPeriode.getTime()) return false;
  const reste = (o.finPeriode.getTime() - maintenant.getTime()) / JOUR;
  return reste <= 90 && reste >= 31; // marge d'un jour avant la limite légale d'un mois
}

export const MOTIFS_SIGNALEMENT: [string, string][] = [
  ["contrefacon", "Atteinte à des droits (photos, marque, textes copiés)"],
  ["trompeur", "Contenu trompeur ou faux avis"],
  ["illicite", "Contenu illicite (haine, violence, escroquerie…)"],
  ["donnees", "Données personnelles publiées sans accord"],
  ["usurpation", "Usurpation d'identité ou de commerce"],
  ["autre", "Autre"],
];
