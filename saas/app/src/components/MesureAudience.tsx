"use client";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Mesure d'audience Vercel Web Analytics : sans cookie, sans identifiant persistant, chiffres agrégés
 * visibles seulement par le propriétaire du projet dans le tableau de bord Vercel.
 * Placée uniquement sur les pages de MySite (vitrine et espace), jamais sur les sites publiés des clients.
 * Les adresses sont nettoyées avant l'envoi : pas de paramètres (?code=, ?token=…) et les identifiants remplacés par [id].
 */
export function nettoyerUrl(url: string): string {
  const u = new URL(url);
  u.search = ""; u.hash = "";
  u.pathname = u.pathname.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/gi, "/[id]").replace(/\/\d+(?=\/|$)/g, "/[id]");
  return u.toString();
}

const avantEnvoi = (e: BeforeSendEvent): BeforeSendEvent => ({ ...e, url: nettoyerUrl(e.url) });

export function MesureAudience() {
  return <Analytics beforeSend={avantEnvoi} />;
}
