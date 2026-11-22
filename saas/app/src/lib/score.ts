/**
 * Score « À contacter en priorité » (0 à 100), calculé uniquement avec les données déjà connues du prospect :
 * ancienneté (date de création Sirene), téléphone connu, métier et tranche d'effectif.
 * Ce n'est ni une note de l'entreprise ni une garantie : un simple ordre de passage. Sans effet de bord (testé dans score.test.ts).
 */

export interface DonneesScore {
  date_creation?: string | null;   // AAAA-MM-JJ (Sirene)
  indices?: string | null;          // anciens prospects : « … · créée en 2019 »
  telephone?: string | null;
  naf?: string | null;
  metier?: string | null;
  tranche_effectif?: string | null; // code Sirene : NN, 00, 01, 02, 03, 11, 12…
}

export type NiveauScore = "fort" | "moyen" | "faible";

export const EXPLICATION_SCORE =
  "Score calculé avec les seules données du registre Sirene et de la fiche : une entreprise récente, joignable par téléphone, dans un métier qui reçoit des clients et de petite taille passe en premier. Ce n'est pas une garantie.";

/** Métiers qui reçoivent des clients sur place (restauration, bouche, beauté) : un site leur sert tout de suite. */
const NAF_ACCUEIL = /^(56\.|10\.71|47\.24|96\.02)/;
/** Artisans et services de proximité : clients locaux qui cherchent sur internet. */
const NAF_PROXIMITE = /^(43\.|81\.|45\.20|74\.20)/;

/** Année de création : la date Sirene si elle existe, sinon « créée en AAAA » dans les indices. */
export function anneeCreation(d: DonneesScore): number | null {
  const a = d.date_creation ? Number(d.date_creation.slice(0, 4)) : Number(d.indices?.match(/créée en (\d{4})/)?.[1]);
  return Number.isInteger(a) && a > 1800 ? a : null;
}

export function scoreProspect(d: DonneesScore, maintenant = new Date()): number {
  let s = 30;
  const annee = anneeCreation(d);
  if (annee !== null) {
    const age = maintenant.getFullYear() - annee;
    s += age <= 1 ? 25 : age <= 3 ? 20 : age <= 10 ? 10 : 3;
  } else s += 8; // inconnue : neutre
  if (d.telephone && d.telephone.replace(/\D/g, "").length >= 9) s += 20;
  const naf = d.naf ?? "";
  s += NAF_ACCUEIL.test(naf) ? 15 : NAF_PROXIMITE.test(naf) ? 10 : 5;
  const t = d.tranche_effectif ?? "";
  s += ["01", "02", "03"].includes(t) ? 10 : ["NN", "00"].includes(t) ? 7 : t ? 0 : 5;
  return Math.max(0, Math.min(100, s));
}

export function niveauScore(score: number): NiveauScore {
  return score >= 70 ? "fort" : score >= 50 ? "moyen" : "faible";
}

export const LIBELLE_NIVEAU: Record<NiveauScore, string> = { fort: "Prioritaire", moyen: "À contacter", faible: "Plus tard" };
export const COULEUR_NIVEAU: Record<NiveauScore, string> = { fort: "#0f9f6e", moyen: "#d97706", faible: "#6b7280" };
