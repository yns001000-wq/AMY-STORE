/** Étapes du suivi commercial (mêmes valeurs que la contrainte SQL statut_valide). */
export const ETAPES = [
  { id: "nouveau", nom: "À contacter", couleur: "#3b5bfd" },
  { id: "contacte", nom: "Contacté", couleur: "#6d4aff" },
  { id: "repondu", nom: "A répondu", couleur: "#0ea5c6" },
  { id: "rdv", nom: "Rendez-vous", couleur: "#f59e0b" },
  { id: "devis", nom: "Devis envoyé", couleur: "#f97316" },
  { id: "gagne", nom: "Gagné", couleur: "#10b981" },
  { id: "perdu", nom: "Perdu", couleur: "#94a3b8" },
  { id: "refus", nom: "Ne plus contacter", couleur: "#ef4444" },
] as const;
export type Etape = (typeof ETAPES)[number]["id"];

export function etape(id: string | null | undefined) {
  return ETAPES.find((e) => e.id === id) ?? ETAPES[0];
}
export function estEtape(v: unknown): v is Etape {
  return typeof v === "string" && ETAPES.some((e) => e.id === v);
}

export interface EntreeJournal { d: string; t: string }

/** Ajoute une entrée en tête du journal (50 entrées au plus). */
export function ajouterJournal(journal: unknown, texte: string, date = new Date()): EntreeJournal[] {
  const j = Array.isArray(journal) ? (journal as EntreeJournal[]) : [];
  return [{ d: date.toISOString().slice(0, 10), t: texte.slice(0, 500) }, ...j].slice(0, 50);
}
