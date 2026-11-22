/**
 * Relances par e-mail des nouveaux inscrits (J+1, J+3, J+6), envoyées par la tâche quotidienne /api/cron/relances.
 * Règles :
 *  - un e-mail n'est envoyé que si l'étape qu'il propose n'est pas encore faite ;
 *  - jamais deux fois le même (mémoire dans profils.relances_envoyees), au plus un par jour ;
 *  - fenêtre de 3 jours par relance : un compte ancien ne reçoit pas tout d'un coup ;
 *  - jamais après une désinscription (lien dans chaque e-mail, sans connexion).
 * Logique pure (testée dans relances.test.ts), sauf la signature du lien qui lit le secret de l'environnement.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { ContenuEmail } from "./email-gabarit";

export type Relance = "j1" | "j3" | "j6";
const JOUR = 86400000;
const FENETRES: [Relance, number][] = [["j6", 6], ["j3", 3], ["j1", 1]];

export interface EtatRelance {
  creeLe: string;
  desinscrit: boolean;
  envoyees: Partial<Record<Relance, string>>;
  prospects: number;
  sites: number;
  etapesRestantes: string[]; // titres des étapes de la liste de démarrage pas encore faites
}

/** L'étape correspondante est-elle encore à faire ? */
function utile(r: Relance, e: EtatRelance): boolean {
  if (r === "j1") return e.prospects === 0;
  if (r === "j3") return e.sites === 0;
  return e.etapesRestantes.length > 0;
}

/** Relance à envoyer aujourd'hui, ou null. */
export function relanceDuJour(e: EtatRelance, maintenant = new Date()): Relance | null {
  if (e.desinscrit) return null;
  const age = (maintenant.getTime() - new Date(e.creeLe).getTime()) / JOUR;
  for (const [r, j] of FENETRES) {
    if (age >= j && age < j + 3 && !e.envoyees[r] && utile(r, e)) return r;
  }
  return null;
}

/** Titres des étapes de la liste de démarrage, au tutoiement (comme les autres e-mails MySite). */
export const ETAPES_TU: Record<string, string> = {
  prospects: "Réserve ta première entreprise",
  message: "Envoie le premier message (IA)",
  maquette: "Crée sa maquette",
  academie: "Suis l'Académie « Démarrer »",
};

export const SUJETS: Record<Relance, string> = {
  j1: "Ta première entreprise t'attend",
  j3: "Montre-lui sa maquette",
  j6: "Besoin d'aide ?",
};

/** Contenu de l'e-mail (gabarit MySite), avec le lien de désinscription. */
export function contenuRelance(r: Relance, e: EtatRelance, liens: { espace: string; desinscription: string }): ContenuEmail {
  const base = { bouton: { texte: "", url: liens.espace }, desinscription: liens.desinscription };
  if (r === "j1") return { ...base, emoji: "🏪", titre: "Ta première entreprise t'attend",
    paragraphes: [
      "Tu as créé ton compte MySite hier. Il te reste le geste le plus simple : lancer ta première recherche.",
      "En un clic, MySite cherche les entreprises de ta zone dans le registre officiel et te les réserve : personne d'autre ne pourra les contacter avec MySite.",
    ],
    bouton: { texte: "Trouver mes premières entreprises", url: liens.espace } };
  if (r === "j3") return { ...base, emoji: "📱", titre: "Montre-lui sa maquette",
    paragraphes: [
      "Le moment qui change tout : montrer au gérant son futur site, à son nom, sur ton téléphone.",
      "Ouvre la fiche d'une de tes entreprises et crée sa maquette en un clic. L'offre Gratuite comprend 3 maquettes express.",
    ],
    bouton: { texte: "Créer une maquette", url: liens.espace } };
  return { ...base, emoji: "🤝", titre: "Besoin d'aide ?",
    paragraphes: [
      `Il te reste ${e.etapesRestantes.length} étape${e.etapesRestantes.length > 1 ? "s" : ""} pour bien démarrer sur MySite :`,
    ],
    liste: e.etapesRestantes,
    note: "Une question, un blocage ? Écris-nous : l'adresse de contact est en bas de cet e-mail.",
    bouton: { texte: "Reprendre où j'en étais", url: liens.espace } };
}

/* Lien de désinscription signé : il marche sans connexion, et ne peut pas être fabriqué pour un autre compte. */
const secret = () => process.env.RELANCES_SECRET || process.env.CRON_SECRET || "";

export function jetonDesinscription(userId: string, cle = secret()): string | null {
  if (!cle) return null;
  return createHmac("sha256", cle).update(`desinscription:${userId}`).digest("hex").slice(0, 40);
}

export function jetonValide(userId: string, jeton: string, cle = secret()): boolean {
  const attendu = jetonDesinscription(userId, cle);
  if (!attendu || !/^[0-9a-f]{40}$/.test(jeton)) return false;
  return timingSafeEqual(Buffer.from(attendu), Buffer.from(jeton));
}
