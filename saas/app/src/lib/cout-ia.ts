/**
 * Coût des appels à l'IA (Claude), sans effet de bord (testé).
 * Tarifs en dollars par million de jetons, relevés le 3 novembre 2026 (documentation Anthropic) :
 *  - lecture du cache : 0,05 × le prix d'entrée sur Opus 5.5 et Sonnet 5.5 ;
 *  - écriture du cache (durée de vie de 5 minutes) : 1,25 × le prix d'entrée.
 * La réflexion du modèle (« thinking ») est comptée dans les jetons de sortie.
 */

/** Une consigne en deux parties : la partie fixe (mise en cache, identique d'un appel à l'autre) puis la partie propre à la demande. */
export interface Consigne { systeme: string; contenu: string }

export const TARIFS_IA: Record<string, { entree: number; sortie: number; cacheLu: number; cacheEcrit: number }> = {
  "claude-opus-5-5": { entree: 4, sortie: 20, cacheLu: 0.2, cacheEcrit: 5 },
  "claude-sonnet-5-5": { entree: 2, sortie: 10, cacheLu: 0.1, cacheEcrit: 2.5 },
};

/** Taille minimale d'une partie fixe pour être mise en cache sur ces modèles (en dessous, le cache est ignoré sans erreur). */
export const CACHE_MINIMUM_JETONS = 512;

export interface UsageIA { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null }

/** Coût d'un appel en dollars, à partir de l'usage renvoyé par l'API. */
export function coutUsage(modele: string, u: UsageIA): number {
  const t = TARIFS_IA[modele];
  if (!t) return 0;
  const lu = u.cache_read_input_tokens ?? 0, ecrit = u.cache_creation_input_tokens ?? 0;
  return (u.input_tokens * t.entree + lu * t.cacheLu + ecrit * t.cacheEcrit + u.output_tokens * t.sortie) / 1_000_000;
}

/**
 * Coût d'un appel selon le scénario de cache, pour une partie fixe de `fixe` jetons et une partie variable de `variable` jetons :
 *  - sans cache : tout au prix d'entrée ;
 *  - cache écrit (premier appel, ou plus de 5 minutes depuis le précédent) : partie fixe à 1,25 × ;
 *  - cache lu (un autre appel identique dans les 5 minutes) : partie fixe à 0,05 ×.
 */
export function coutScenario(modele: string, fixe: number, variable: number, sortie: number, scenario: "sans" | "ecrit" | "lu"): number {
  const cachable = fixe >= CACHE_MINIMUM_JETONS;
  const u: UsageIA = !cachable || scenario === "sans"
    ? { input_tokens: fixe + variable, output_tokens: sortie }
    : scenario === "ecrit"
      ? { input_tokens: variable, output_tokens: sortie, cache_creation_input_tokens: fixe }
      : { input_tokens: variable, output_tokens: sortie, cache_read_input_tokens: fixe };
  return coutUsage(modele, u);
}

/**
 * Taille des appels, en jetons, pour le calcul du coût maximal (pire cas : consignes les plus longues, réponse poussée à sa longueur maximale,
 * et partie fixe écrite dans le cache, le scénario le plus cher). Parties fixes : mesurées sur les consignes du code (à 3,6 caractères par jeton).
 * Parties variables : maximum permis par le code (notes 1 500 caractères, précisions 3 000, consigne de retouche 2 000, 40 photos personnelles…).
 */
export const APPELS_MAX = {
  message: [{ modele: "claude-sonnet-5-5", fixe: 280, variable: 500, sortie: 1500 }],
  site: [
    { modele: "claude-opus-5-5", fixe: 380, variable: 1340, sortie: 8000 },   // étude de l'établissement
    { modele: "claude-opus-5-5", fixe: 1510, variable: 2200, sortie: 16000 }, // rédaction du site
  ],
  retouche: [{ modele: "claude-sonnet-5-5", fixe: 1210, variable: 5600, sortie: 12000 }],
} as const;

/** Coût d'une action (somme de ses appels) pour un scénario de cache donné. */
export function coutAction(action: keyof typeof APPELS_MAX, scenario: "sans" | "ecrit" | "lu"): number {
  return APPELS_MAX[action].reduce((s, a) => s + coutScenario(a.modele, a.fixe, a.variable, a.sortie, scenario), 0);
}
