/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Données de la démo : un compte fictif (Noa, Lyon, restauration) avec des prospects, sites, devis et factures d'exemple.
 * Tout reste dans le navigateur (localStorage quand il est disponible). Aucune donnée réelle d'entreprise.
 */
import { PLANS, type PlanId } from "../src/lib/plans";
import { siteExpress, siteDepuisIA } from "../src/lib/studio";
import exemple from "../src/lib/studio/exemple-pizzeria.test.json";
import { echeanceParDefaut, LIGNES_TYPES, totaux } from "../src/lib/factures";

export type Ligne = Record<string, any>;
export interface Base {
  profil: { prenom: string; plan: PlanId; secteur: string; departements: string[] };
  conso: { prospects: number; messages_ia: number; sites_ia: number; retouches_ia: number };
  prospects: Ligne[]; sites: Ligne[]; versions: Ligne[]; documents: Ligne[]; entreprise: Ligne | null;
  compteurs: Record<string, number>; publications: Ligne[]; livraisons: Record<string, Ligne>; progression: Record<string, number>; photos: Ligne[];
  reserve: Ligne[];
}

const CLE = "mysite-demo-v1";
const id = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2) + Date.now().toString(16));
const jour = (decalage = 0) => { const d = new Date(); d.setDate(d.getDate() + decalage); return d.toISOString().slice(0, 10); };
const j = (t: string, decalage = 0) => ({ d: jour(decalage), t });

function prospect(nom: string, metier: string, ville: string, cp: string, adresse: string, lat: number, lon: number, statut = "nouveau", extra: Ligne = {}): Ligne {
  return {
    id: id(), nom, metier, ville, code_postal: cp, adresse: `${adresse} ${cp} ${ville}`, departement: "69", latitude: lat, longitude: lon, statut,
    siret: String(90000000000000 + Math.floor(Math.random() * 9999999999)), telephone: null, email: null, notes: "",
    indices: `Code d'activité 56.10 (${metier})`, source: "Exemple de démonstration (données fictives)",
    prochaine_action: null, date_prochaine_action: null, journal: [j("Trouvé dans la base Sirene (registre public)", -12)], cree_le: new Date(Date.now() - 864e5 * 12).toISOString(), ...extra,
  };
}

export function graine(): Base {
  const P = [
    prospect("Pizza Bella", "Pizzeria", "Lyon", "69003", "12 rue Paul Bert", 45.7593, 4.8466, "gagne", { telephone: "06 12 34 56 78", notes: "Four à bois, très bonne margherita. Fermé le lundi.", journal: [j("Devis D-2026-0001 accepté", -2), j("Rendez-vous : maquette montrée sur téléphone", -4), j("Appel : intéressé par une maquette", -7), j("Trouvé dans la base Sirene (registre public)", -12)] }),
    prospect("Le Bistrot des Halles", "Restaurant", "Lyon", "69002", "8 rue Mercière", 45.7629, 4.8340, "rdv", { telephone: "04 78 00 00 01", prochaine_action: "Montrer la maquette", date_prochaine_action: jour(2) }),
    prospect("Snack du Rhône", "Restauration rapide", "Lyon", "69007", "41 avenue Jean Jaurès", 45.7470, 4.8432, "contacte", { prochaine_action: "Relancer par SMS", date_prochaine_action: jour(-1) }),
    prospect("Sushi Tokyo", "Cuisine japonaise", "Lyon", "69002", "3 quai Saint-Antoine", 45.7615, 4.8295, "devis", { telephone: "04 78 00 00 02" }),
    prospect("Coiffure Zoé", "Coiffure", "Villeurbanne", "69100", "5 cours Émile Zola", 45.7696, 4.8800, "repondu"),
    prospect("Boulangerie du Parc", "Boulangerie", "Lyon", "69006", "77 boulevard des Belges", 45.7745, 4.8530),
    prospect("La Trattoria", "Restaurant italien", "Lyon", "69001", "14 rue d'Algérie", 45.7678, 4.8323),
    prospect("Kebab Antalya", "Restauration rapide", "Lyon", "69008", "102 avenue des Frères Lumière", 45.7380, 4.8690),
    prospect("Café des Arts", "Café", "Lyon", "69004", "9 place de la Croix-Rousse", 45.7748, 4.8317, "contacte"),
    prospect("Plomberie Martin", "Plombier", "Bron", "69500", "22 avenue Franklin Roosevelt", 45.7380, 4.9130),
    prospect("Wok Express", "Cuisine asiatique", "Lyon", "69003", "60 cours Lafayette", 45.7632, 4.8560, "perdu"),
    prospect("Le Petit Comptoir", "Restaurant", "Lyon", "69005", "2 rue du Bœuf", 45.7620, 4.8270),
  ];
  const pb = P[0], st = P[3];
  const siteIA = { id: id(), user_id: "demo", prospect_id: pb.id, type: "ia", donnees: siteDepuisIA(pb, "pizzeria", exemple, (exemple as any).horaires), etude: { statut: "redige", type: "Pizzeria au feu de bois", famille: "pizzeria", confiance: 92 }, cree_le: new Date().toISOString(), maj_le: new Date(Date.now() - 864e5 * 3).toISOString() };
  const siteEx = { id: id(), user_id: "demo", prospect_id: st.id, type: "express", donnees: siteExpress(st), etude: null, cree_le: new Date().toISOString(), maj_le: new Date(Date.now() - 864e5).toISOString() };
  const entreprise = { nom: "Noa Exemple EI", siret: "12345678900011", adresse: "1 rue de la République, 69002 Lyon", email: "contact@exemple.fr", telephone: "06 00 00 00 00", tva: "franchise", taux_tva: 0, iban: "FR76 0000 0000 0000 0000 0000 000", conditions: "" };
  const emetteur = { ...entreprise };
  const lignesDevis = LIGNES_TYPES;
  const devis = { id: id(), user_id: "demo", prospect_id: pb.id, type: "devis", numero: "D-2026-0001", statut: "accepte", client: { nom: "Pizza Bella", adresse: "12 rue Paul Bert, 69003 Lyon", siret: pb.siret, hors_etablissement: true }, emetteur, lignes: lignesDevis, total_ht: totaux(lignesDevis, 0).ht, taux_tva: 0, date_emission: jour(-5), date_echeance: jour(25), conditions: "Acompte de 30 % après le délai de 7 jours, solde à la mise en ligne.", origine_id: null, paye_le: null, cree_le: new Date(Date.now() - 864e5 * 5).toISOString() };
  const facture = { id: id(), user_id: "demo", prospect_id: pb.id, type: "facture", numero: "F-2026-0001", statut: "payee", client: devis.client, emetteur, lignes: [{ designation: "Acompte de 30 % sur le devis D-2026-0001", quantite: 1, prix_unitaire: 251.4 }], total_ht: 251.4, taux_tva: 0, date_emission: jour(-1), date_echeance: jour(29), conditions: "Selon devis D-2026-0001.", origine_id: devis.id, paye_le: jour(0), cree_le: new Date(Date.now() - 864e5).toISOString() };
  const reserve = [
    prospect("Crêperie Bretonne", "Crêperie", "Lyon", "69005", "17 rue Saint-Jean", 45.7612, 4.8273),
    prospect("Pizzeria Napoli", "Pizzeria", "Lyon", "69007", "25 rue de Marseille", 45.7511, 4.8418),
    prospect("Institut Belle Peau", "Soins de beauté", "Lyon", "69006", "30 rue Vendôme", 45.7660, 4.8456),
    prospect("Électricité Dubois", "Électricien", "Vénissieux", "69200", "4 avenue Jean Cagne", 45.7055, 4.8810),
    prospect("Burger Factory", "Restauration rapide", "Lyon", "69009", "12 rue de Bourgogne", 45.7740, 4.8050),
    prospect("Le Jardin Libanais", "Restaurant libanais", "Lyon", "69003", "88 rue Moncey", 45.7590, 4.8495),
    prospect("Peinture Leroy", "Peintre", "Caluire-et-Cuire", "69300", "6 montée des Forts", 45.7950, 4.8440),
    prospect("Thaï Orchidée", "Cuisine thaïlandaise", "Lyon", "69001", "5 rue Lanterne", 45.7660, 4.8300),
    prospect("Pâtisserie Lilou", "Pâtisserie", "Lyon", "69004", "40 boulevard de la Croix-Rousse", 45.7735, 4.8290),
    prospect("Brasserie du Parc", "Brasserie", "Lyon", "69006", "1 place Jules Ferry", 45.7700, 4.8590),
  ];
  return {
    profil: { prenom: "Noa", plan: "premium", secteur: "restauration", departements: ["69"] },
    conso: { prospects: 12, messages_ia: 6, sites_ia: 1, retouches_ia: 3 },
    prospects: P, sites: [siteIA, siteEx], versions: [], documents: [devis, facture], entreprise,
    compteurs: { "devis-2026": 1, "facture-2026": 1 }, publications: [],
    livraisons: { [pb.id]: { etapes: { contenus: jour(-3), acompte: jour(0) }, domaine: null } },
    progression: { "demarrer-statut": 100, "demarrer-offre": 100, "prospecter-cibler": 66 }, photos: [], reserve,
  };
}

let base: Base;
try { const s = localStorage.getItem(CLE); base = s ? JSON.parse(s) : graine(); } catch { base = graine(); }
export const db = () => base;
export function sauver() { try { localStorage.setItem(CLE, JSON.stringify(base)); } catch { /* stockage indisponible : la démo marche quand même */ } }
export function reinitialiser() { base = graine(); sauver(); }
export const plan = () => base.profil.plan;
export const cap = () => PLANS[base.profil.plan].studio;
export const nouvelId = id;
export { jour, echeanceParDefaut };
