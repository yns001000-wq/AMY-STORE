import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { coutUsage, type Consigne } from "./cout-ia";

let client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY manquante");
  return (client ??= new Anthropic());
}

/** Note la cause d'un échec de l'IA dans les journaux du serveur (code HTTP et message d'Anthropic ; jamais la clé ni le texte envoyé). */
export function journaliserErreurIA(ou: string, e: unknown): void {
  if (e instanceof Anthropic.APIError) console.error(`IA ${ou} : ${e.status ?? "réseau"} ${e.name} · ${String(e.message).slice(0, 300)}`);
  else console.error(`IA ${ou} :`, e instanceof Error ? e.message.slice(0, 300) : "erreur inconnue");
}

/** Cause d'un échec, en un mot sans détail sensible : sert au diagnostic (réponse de l'API et journaux). */
export function causeErreurIA(e: unknown): "cle" | "credit" | "modele" | "requete" | "surcharge" | "reseau" | "autre" {
  if (!(e instanceof Anthropic.APIError)) return "autre";
  const m = String(e.message).toLowerCase();
  if (e.status === 401 || e.status === 403) return "cle";
  if (m.includes("credit balance") || m.includes("billing")) return "credit";
  if (e.status === 404) return "modele";
  if (e.status === 400 || e.status === 422) return "requete";
  if (e.status === 429 || (e.status ?? 0) >= 500) return "surcharge";
  return e.status ? "autre" : "reseau";
}

export type TypeIA = "message" | "etude" | "site" | "retouche";

/**
 * Appel commun à Claude. La partie fixe de la consigne est envoyée comme instruction système avec un marqueur de cache :
 * quand deux appels du même type ont lieu à moins de 5 minutes d'intervalle, elle est relue depuis le cache (0,05 × le prix).
 * Le modèle, le niveau d'effort et la longueur maximale ne changent pas. L'usage réel (jetons et coût) est noté dans les journaux.
 */
export async function appelerIA(o: { type: TypeIA; modele: string; consigne: Consigne; maxTokens: number; effort: "low" | "medium" | "high" | "xhigh" }): Promise<string | null> {
  const rep = await anthropic().beta.messages.create({
    model: o.modele,
    max_tokens: o.maxTokens,
    output_config: { effort: o.effort },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: o.consigne.systeme, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: o.consigne.contenu }],
  });
  const u = rep.usage;
  console.info(`IA_USAGE ${JSON.stringify({ type: o.type, modele: rep.model ?? o.modele, entree: u.input_tokens, cache_lu: u.cache_read_input_tokens ?? 0, cache_ecrit: u.cache_creation_input_tokens ?? 0, sortie: u.output_tokens, cout: Number(coutUsage(o.modele, u).toFixed(5)) })}`);
  if (rep.stop_reason === "refusal") return null;
  const t = rep.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
  return t || null;
}

export type Canal = "sms" | "email" | "appel";
export const CANAUX: Record<Canal, string> = { sms: "SMS", email: "E-mail", appel: "Script d'appel" };

export interface ContexteProspect { nom: string; metier?: string | null; ville?: string | null; indices?: string | null; notes?: string | null; statut?: string | null }

/** Consigne envoyée à Claude. Les règles légales de prospection B2B y sont imposées. Partie fixe (par canal) d'abord, puis le destinataire. */
export function consigneMessage(p: ContexteProspect, canal: Canal, expediteur: string): Consigne {
  const formats: Record<Canal, string> = {
    sms: "Un SMS de 320 caractères au maximum, sans emoji excessif.",
    email: "Un e-mail : première ligne « Objet : … », puis le message (120 mots au maximum).",
    appel: "Un script d'appel de 30 secondes : accroche, raison de l'appel, question ouverte, proposition de rendez-vous, et 2 réponses courtes aux objections « pas le temps » et « pas intéressé ».",
  };
  const systeme = [
    "Tu rédiges un premier message de prospection B2B en français, pour un indépendant qui crée des sites internet pour les commerces et artisans locaux.",
    `Format : ${formats[canal]}`,
    "Règles impératives :",
    "- Vouvoiement, ton professionnel, chaleureux et direct ; adapte l'argument au métier (ex. restaurant : carte et horaires visibles sur Google ; artisan : appels d'urgence).",
    "- Propose une maquette gratuite et sans engagement de son futur site.",
    "- Identifie clairement l'expéditeur (prénom et activité) ; n'invente aucun nom d'entreprise.",
    canal === "appel" ? "" : "- Termine par une mention de désinscription courte : « Répondez STOP pour ne plus être contacté. »",
    "- N'invente aucun fait sur l'entreprise, aucune statistique, aucun chiffre de résultat, aucun témoignage, aucune urgence artificielle.",
    "Réponds uniquement avec le texte final, sans commentaire.",
  ].filter(Boolean).join("\n");
  const contenu = [
    `Expéditeur : ${expediteur}.`,
    `Destinataire : ${p.nom}${p.metier ? `, ${p.metier}` : ""}${p.ville ? ` à ${p.ville}` : ""}.`,
    p.indices ? `Indices publics : ${p.indices}.` : "",
    p.notes ? `Notes de l'utilisateur (prioritaires) : ${p.notes.slice(0, 1500)}` : "",
  ].filter(Boolean).join("\n");
  return { systeme, contenu };
}
