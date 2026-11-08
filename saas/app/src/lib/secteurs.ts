/** Secteurs à démarcher et codes d'activité (NAF rév. 2) correspondants dans la base Sirene. */
export interface Secteur {
  id: string;
  nom: string;
  description: string;
  naf: string[];
  metier: (naf: string) => string;
}

const met = (table: Record<string, string>, defaut: string) => (naf: string) => table[naf] ?? defaut;

export const SECTEURS: Secteur[] = [
  { id: "restauration", nom: "Restaurants, snacks et pizzerias", description: "Restaurants, restauration rapide, cafés", naf: ["56.10A", "56.10C", "56.30Z"],
    metier: met({ "56.10A": "Restaurant", "56.10C": "Restauration rapide", "56.30Z": "Café, bar" }, "Restaurant") },
  { id: "bouche", nom: "Boulangeries, pâtisseries, traiteurs", description: "Métiers de bouche et commerces alimentaires", naf: ["10.71C", "10.71D", "47.24Z", "56.21Z"],
    metier: met({ "10.71C": "Boulangerie", "10.71D": "Pâtisserie", "47.24Z": "Boulangerie-pâtisserie", "56.21Z": "Traiteur" }, "Métier de bouche") },
  { id: "batiment", nom: "Artisans du bâtiment", description: "Plombiers, électriciens, chauffagistes, peintres", naf: ["43.22A", "43.22B", "43.21A", "43.34Z", "43.32A"],
    metier: met({ "43.22A": "Plombier", "43.22B": "Chauffagiste", "43.21A": "Électricien", "43.34Z": "Peintre", "43.32A": "Menuisier" }, "Artisan du bâtiment") },
  { id: "beaute", nom: "Coiffure et beauté", description: "Salons de coiffure, instituts de beauté", naf: ["96.02A", "96.02B"],
    metier: met({ "96.02A": "Coiffure", "96.02B": "Soins de beauté" }, "Beauté") },
  { id: "services", nom: "Services de proximité", description: "Nettoyage, paysagistes, garages, photographes", naf: ["81.21Z", "81.30Z", "45.20A", "74.20Z"],
    metier: met({ "81.21Z": "Nettoyage", "81.30Z": "Paysagiste", "45.20A": "Garage", "74.20Z": "Photographe" }, "Service") },
];

export function secteurParId(id: string | null | undefined): Secteur | undefined {
  return SECTEURS.find((s) => s.id === id);
}
