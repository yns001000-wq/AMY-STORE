/**
 * « Ton point de la semaine » : e-mail personnel envoyé chaque lundi à 9 h (heure de Paris) par /api/cron/hebdo.
 * Il ne contient que les données de la personne (ses entreprises, ses rappels, son offre) : un service, pas une publicité.
 * Règles :
 *  - à partir du 7e jour après l'inscription (avant, ce sont les e-mails de démarrage) et compte configuré ;
 *  - jamais après une désinscription (même lien que les e-mails de démarrage) ;
 *  - une fois par semaine au plus, et 2 e-mails de conseils au plus sur 7 jours, tous types confondus ;
 *  - plus rien après 45 jours sans connexion (on n'insiste pas auprès de quelqu'un qui est parti).
 * Logique pure, testée dans hebdo.test.ts.
 */
import type { ContenuEmail } from "./email-gabarit";

const JOUR = 86400000;
export const MAX_PAR_SEMAINE = 2;

export interface EtatHebdo {
  creeLe: string;
  configure: boolean;
  desinscrit: boolean;
  derniereConnexion: string | null;
  envoyees: Record<string, string>; // relances_envoyees : { j1, j3, j6, hebdo, … } → date ISO
}

/** Nombre d'e-mails de conseils (démarrage et point hebdomadaire) envoyés ces 7 derniers jours. */
export function envoisRecents(envoyees: Record<string, string>, maintenant = new Date()): number {
  const t = maintenant.getTime();
  return Object.entries(envoyees).filter(([cle, d]) => (cle === "hebdo" || /^j\d+$/.test(cle) || cle.startsWith("hebdo:")) && t - new Date(d).getTime() < 7 * JOUR).length;
}

export function hebdoAEnvoyer(e: EtatHebdo, maintenant = new Date()): boolean {
  const t = maintenant.getTime();
  if (e.desinscrit || !e.configure) return false;
  if (t - new Date(e.creeLe).getTime() < 7 * JOUR) return false;
  const vu = e.derniereConnexion ? new Date(e.derniereConnexion).getTime() : new Date(e.creeLe).getTime();
  if (t - vu > 45 * JOUR) return false;
  if (e.envoyees.hebdo && t - new Date(e.envoyees.hebdo).getTime() < 6 * JOUR) return false;
  return envoisRecents(e.envoyees, maintenant) < MAX_PAR_SEMAINE;
}

export interface DonneesHebdo {
  prenom: string | null;
  aContacter: { nom: string; metier: string | null; score: number }[]; // les 3 plus prometteurs, statut « à contacter »
  rappels: { nom: string; action: string | null; date: string }[];     // actions prévues d'ici 7 jours (ou en retard)
  enCours: number;      // contactés, ont répondu, rendez-vous, devis envoyés
  gagnes: number;
  totalAContacter: number;
  quota: { prospectsRestants: number; messagesRestants: number; remise: string } | null; // offre Gratuite seulement
}

const dateFr = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

export function sujetHebdo(d: DonneesHebdo): string {
  if (d.rappels.length) return `Ton point de la semaine : ${d.rappels.length} rappel${d.rappels.length > 1 ? "s" : ""} à faire`;
  if (d.aContacter.length) return `Ton point de la semaine : ${d.totalAContacter} entreprise${d.totalAContacter > 1 ? "s" : ""} à contacter`;
  return "Ton point de la semaine sur MySite";
}

export function contenuHebdo(d: DonneesHebdo, liens: { espace: string; desinscription: string }): ContenuEmail {
  const liste = [
    ...d.rappels.slice(0, 5).map((r) => `📞 Rappel le ${dateFr(r.date)} : ${r.nom}${r.action ? ` (${r.action})` : ""}`),
    ...d.aContacter.map((p) => `⭐ À contacter : ${p.nom}${p.metier ? `, ${p.metier.toLowerCase()}` : ""} (priorité ${p.score}/100)`),
  ];
  const paragraphes = liste.length
    ? [`Voici ce que MySite te propose pour cette semaine${d.totalAContacter > d.aContacter.length ? ` (${d.totalAContacter} entreprises t'attendent en tout)` : ""} :`]
    : [d.totalAContacter === 0 && d.enCours === 0
      ? "Tu n'as pas encore d'entreprise à contacter : lance une recherche, MySite trouve celles de ta zone en un clic."
      : "Rien d'urgent cette semaine. C'est le bon moment pour trouver de nouvelles entreprises à contacter."];
  const bilan = [d.enCours ? `${d.enCours} en cours (contactées, réponses, rendez-vous, devis)` : "", d.gagnes ? `${d.gagnes} gagnée${d.gagnes > 1 ? "s" : ""}` : ""].filter(Boolean);
  const notes = [
    bilan.length ? `Ton suivi : ${bilan.join(", ")}.` : "",
    d.quota ? `Offre Gratuite ce mois-ci : il te reste ${d.quota.prospectsRestants} entreprise${d.quota.prospectsRestants > 1 ? "s" : ""} à trouver et ${d.quota.messagesRestants} message${d.quota.messagesRestants > 1 ? "s" : ""} à rédiger (remise à zéro ${d.quota.remise}).` : "",
  ].filter(Boolean);
  return {
    emoji: "👋", titre: `Ton point de la semaine${d.prenom ? `, ${d.prenom}` : ""}`,
    paragraphes, liste: liste.length ? liste : undefined, note: notes.length ? notes.join(" ") : undefined,
    bouton: { texte: liste.length ? "Ouvrir mon tableau de bord" : "Trouver des entreprises", url: liens.espace },
    desinscription: liens.desinscription,
  };
}
