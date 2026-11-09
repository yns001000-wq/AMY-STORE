/** Routeur en mémoire de la démo : remplace le routage de Next.js (aucun serveur). */
import { useSyncExternalStore } from "react";

let chemin = "/espace";
let version = 0;
const abonnes = new Set<() => void>();
const notifier = () => { version++; abonnes.forEach((f) => f()); };

const VUES: Record<string, string> = { "/espace": "accueil", "/espace/pipeline": "pipeline", "/espace/carte": "carte", "/espace/studio": "studio", "/espace/factures": "factures", "/espace/academie": "academie", "/espace/abonnement": "offres", "/espace/bienvenue": "zone" };

export function naviguer(href: string) {
  let c = href.replace(/^https?:\/\/[^/]+/, "").split("?")[0].split("#")[0] || "/espace";
  if (c.startsWith("/impression/")) c = c.replace("/impression/", "/espace/factures/");
  if (c === "/" || c === "/connexion") c = "/espace";
  chemin = c;
  try { const h = Object.entries(VUES).find(([k]) => k === c)?.[1]; history.replaceState(null, "", h ? `#${h}` : location.pathname + location.search); } catch { /* sans historique */ }
  window.scrollTo({ top: 0 });
  notifier();
}
export function demarrerDepuisHash() {
  const h = location.hash.replace("#", "");
  const c = Object.entries(VUES).find(([, v]) => v === h)?.[0];
  if (c) chemin = c;
}
export const rafraichir = notifier;
export const cheminCourant = () => chemin;
export function useEtat(): { chemin: string; version: number } {
  useSyncExternalStore((f) => { abonnes.add(f); return () => abonnes.delete(f); }, () => version, () => version);
  return { chemin, version };
}
