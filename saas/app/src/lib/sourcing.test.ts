import { describe, expect, it } from "vitest";
import { chercherProspects, versProspect, type ResultatApi } from "./sourcing";
import { secteurParId } from "./secteurs";

const resto = secteurParId("restauration")!;
const vide = { sirens: new Set<string>(), sirets: new Set<string>() };
const base = (sur: Partial<ResultatApi> = {}): ResultatApi => ({
  siren: "111111111", nom_complet: "PIZZA BELLA", nom_raison_sociale: "PIZZA BELLA", activite_principale: "56.10C", statut_diffusion: "O",
  opposition_diffusion_commerciale: false, etat_administratif: "A", date_creation: "2019-05-01", nombre_etablissements_ouverts: 1,
  matching_etablissements: [{ siret: "11111111100011", adresse: "1 RUE X 69003 LYON", code_postal: "69003", libelle_commune: "LYON", liste_enseignes: ["PIZZA BELLA"], etat_administratif: "A", activite_principale: "56.10C", statut_diffusion_etablissement: "O" }],
  ...sur,
});

describe("garde-fous RGPD", () => {
  it("garde un établissement actif, diffusible, du bon secteur et du bon département", () => {
    const p = versProspect(base(), resto, "69", vide)!;
    expect(p.nom).toBe("Pizza Bella");
    expect(p.metier).toBe("Restauration rapide");
    expect(p.source).toMatch(/Sirene/);
  });
  it("écarte la diffusion partielle (entrepreneur qui protège ses données)", () => {
    expect(versProspect(base({ statut_diffusion: "P" }), resto, "69", vide)).toBeNull();
  });
  it("écarte l'opposition à l'usage commercial des données", () => {
    expect(versProspect(base({ opposition_diffusion_commerciale: true }), resto, "69", vide)).toBeNull();
  });
  it("écarte la liste d'opposition MySite (SIREN et SIRET)", () => {
    expect(versProspect(base(), resto, "69", { sirens: new Set(["111111111"]), sirets: new Set() })).toBeNull();
    expect(versProspect(base(), resto, "69", { sirens: new Set(), sirets: new Set(["11111111100011"]) })).toBeNull();
  });
  it("écarte les entreprises fermées, les chaînes et les mauvais départements", () => {
    expect(versProspect(base({ etat_administratif: "C" }), resto, "69", vide)).toBeNull();
    expect(versProspect(base({ nombre_etablissements_ouverts: 12 }), resto, "69", vide)).toBeNull();
    expect(versProspect(base(), resto, "42", vide)).toBeNull();
  });
  it("écarte un établissement d'une autre activité", () => {
    const r = base(); r.matching_etablissements![0].activite_principale = "68.20B";
    expect(versProspect(r, resto, "69", vide)).toBeNull();
  });
});

describe("recherche paginée", () => {
  it("s'arrête au maximum demandé et saute les prospects déjà connus", async () => {
    const pages = [1, 2].map((n) => ({ results: [0, 1, 2].map((i) => base({ siren: `${n}0000000${i}`, matching_etablissements: [{ ...base().matching_etablissements![0], siret: `${n}0000000${i}00011` }] })), total_pages: 2 }));
    let appels = 0;
    const fetchFn = (async () => { const d = pages[appels++]; return new Response(JSON.stringify(d), { status: 200 }); }) as unknown as typeof fetch;
    const r = await chercherProspects({ secteur: resto, dep: "69", max: 4, dejaConnus: new Set(["10000000000011"]), opposition: vide, fetchFn, pause: async () => {} });
    expect(r.prospects.map((p) => p.siret)).toEqual(["10000000100011", "10000000200011", "20000000000011", "20000000100011"]);
    expect(appels).toBe(2);
    expect(r.requetes).toBe(2);
  });
});
