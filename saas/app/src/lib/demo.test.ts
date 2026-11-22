import { describe, expect, it } from "vitest";
import { compterDemo, departementDuCp, pointsFloutes } from "./demo";

const etab = (siret: string, cp = "30700", lat = 44.0144, lon = 4.4194, naf = "56.10A") => ({
  siret, etat_administratif: "A", statut_diffusion_etablissement: "O", code_postal: cp, activite_principale: naf, libelle_commune: "UZES",
  adresse: "1 RUE SECRETE 30700 UZES", liste_enseignes: ["CHEZ TOTO"], latitude: lat, longitude: lon,
});
const resultat = (siren: string, e: ReturnType<typeof etab>, extra: object = {}) => ({
  siren, etat_administratif: "A", statut_diffusion: "O", nom_complet: "TOTO DUPONT", activite_principale: e.activite_principale, nombre_etablissements_ouverts: 1, matching_etablissements: [e], ...extra,
});

function fauxFetch(pages: Record<string, unknown[]>) {
  return (async (url: string) => {
    const u = new URL(url);
    const restau = (u.searchParams.get("activite_principale") ?? "").includes("56.10A") && u.searchParams.get("est_entrepreneur_individuel") === "true";
    return new Response(JSON.stringify({ results: restau ? pages.restau : [], total_pages: 1 }), { status: 200 });
  }) as unknown as typeof fetch;
}

describe("démo publique", () => {
  it("trouve le département d'un code postal de métropole", () => {
    expect(departementDuCp("30700")).toBe("30");
    expect(departementDuCp("20000")).toBe("2A");
    expect(departementDuCp("97400")).toBeNull();
    expect(departementDuCp("307")).toBeNull();
  });

  it("compte avec les filtres de la vraie recherche et ne renvoie aucune donnée personnelle", async () => {
    const r = await compterDemo({
      cp: "30700", pause: async () => {}, opposition: { sirens: new Set(["333"]), sirets: new Set() },
      fetchFn: fauxFetch({ restau: [
        resultat("111", etab("11100000000011")),
        resultat("222", etab("22200000000022", "30700", 44.0151, 4.4201)),
        resultat("333", etab("33300000000033")),                                       // liste d'opposition MySite
        resultat("444", etab("44400000000044"), { opposition_diffusion_commerciale: true }), // opposition Sirene
        resultat("555", etab("55500000000055", "30100")),                              // autre code postal
      ] }),
    });
    expect(r.total).toBe(2);
    expect(r.parMetier).toEqual([{ id: "restauration", nom: "Restaurants, snacks et pizzerias", n: 2 }]);
    expect(r.commune).toBe("Uzes");
    const json = JSON.stringify(r);
    for (const interdit of ["TOTO", "Toto", "RUE SECRETE", "1110000", "2220000", "Dupont"]) expect(json).not.toContain(interdit);
  });

  it("floute les positions : cases d'environ 1 km, décalées, jamais la vraie position", () => {
    const pts = pointsFloutes([{ latitude: 44.01441, longitude: 4.41942 }, { latitude: 44.0121, longitude: 4.4201 }, { latitude: null, longitude: null }]);
    expect(pts).toHaveLength(1);
    expect(pts[0].n).toBe(2);
    expect(pts[0].lat).not.toBe(44.01441);
    expect(Math.abs(pts[0].lat - 44.01)).toBeLessThan(0.0031);
  });

  it("lève une erreur si l'API ne répond pas (jamais de chiffre inventé)", async () => {
    const panne = (async () => new Response("", { status: 503 })) as unknown as typeof fetch;
    await expect(compterDemo({ cp: "30700", pause: async () => {}, opposition: { sirens: new Set(), sirets: new Set() }, fetchFn: panne })).rejects.toThrow();
  });
});
