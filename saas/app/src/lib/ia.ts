import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY manquante");
  return (client ??= new Anthropic());
}

export type Canal = "sms" | "email" | "appel";
export const CANAUX: Record<Canal, string> = { sms: "SMS", email: "E-mail", appel: "Script d'appel" };

export interface ContexteProspect { nom: string; metier?: string | null; ville?: string | null; indices?: string | null; notes?: string | null; statut?: string | null }

/** Consigne envoyée à Claude. Les règles légales de prospection B2B y sont imposées. */
export function consigneMessage(p: ContexteProspect, canal: Canal, expediteur: string): string {
  const formats: Record<Canal, string> = {
    sms: "Un SMS de 320 caractères au maximum, sans emoji excessif.",
    email: "Un e-mail : première ligne « Objet : … », puis le message (120 mots au maximum).",
    appel: "Un script d'appel de 30 secondes : accroche, raison de l'appel, question ouverte, proposition de rendez-vous, et 2 réponses courtes aux objections « pas le temps » et « pas intéressé ».",
  };
  return [
    "Tu rédiges un premier message de prospection B2B en français, pour un indépendant qui crée des sites internet pour les commerces et artisans locaux.",
    `Expéditeur : ${expediteur}.`,
    `Destinataire : ${p.nom}${p.metier ? `, ${p.metier}` : ""}${p.ville ? ` à ${p.ville}` : ""}.`,
    p.indices ? `Indices publics : ${p.indices}.` : "",
    p.notes ? `Notes de l'utilisateur (prioritaires) : ${p.notes.slice(0, 1500)}` : "",
    `Format : ${formats[canal]}`,
    "Règles impératives :",
    "- Vouvoiement, ton professionnel, chaleureux et direct ; adapte l'argument au métier (ex. restaurant : carte et horaires visibles sur Google ; artisan : appels d'urgence).",
    "- Propose une maquette gratuite et sans engagement de son futur site.",
    "- Identifie clairement l'expéditeur (prénom et activité) ; n'invente aucun nom d'entreprise.",
    canal === "appel" ? "" : "- Termine par une mention de désinscription courte : « Répondez STOP pour ne plus être contacté. »",
    "- N'invente aucun fait sur l'entreprise, aucune statistique, aucun chiffre de résultat, aucun témoignage, aucune urgence artificielle.",
    "Réponds uniquement avec le texte final, sans commentaire.",
  ].filter(Boolean).join("\n");
}
