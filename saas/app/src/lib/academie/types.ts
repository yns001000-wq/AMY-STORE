/** Académie MySite : types des cours et des vidéos interactives (animées dans le navigateur, voix et sons générés). */
export type Son = "whoosh" | "pop" | "succes" | "clic" | "cloche";

export type Visuel =
  | { type: "titre"; surtitre?: string; texte: string; sous?: string }
  | { type: "points"; titre?: string; items: string[] }
  | { type: "chiffre"; valeur: string; legende: string; note?: string }
  | { type: "etapes"; titre?: string; etapes: string[]; active?: number }
  | { type: "sms"; messages: { de: "moi" | "lui"; texte: string }[] }
  | { type: "dialogue"; lignes: { qui: string; texte: string }[] }
  | { type: "telephone"; titre: string; lignes: string[]; bouton?: string }
  | { type: "dns"; domaine: string; lignes: { type: string; nom: string; valeur: string }[] }
  | { type: "facture"; titre: string; lignes: [string, string][]; total: string; mention?: string }
  | { type: "check"; titre?: string; items: string[] }
  | { type: "comparaison"; gauche: { titre: string; items: string[] }; droite: { titre: string; items: string[] } };

export interface QuizQ { question: string; choix: string[]; bonne: number; explication: string }

export interface Scene { voix: string; visuel: Visuel; son?: Son; duree?: number; quiz?: QuizQ }

export interface Section { titre: string; texte?: string; liste?: string[] }

export interface Lecon {
  id: string; titre: string; minutes: number; resume: string;
  video: Scene[];
  contenu: Section[];
  quiz: QuizQ[];
  actions?: { lib: string; href: string }[];
}

export interface Module { id: string; titre: string; couleur: string; icone: string; description: string; lecons: Lecon[] }
