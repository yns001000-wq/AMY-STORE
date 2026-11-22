import { describe, expect, it } from "vitest";
import { anneeCreation, niveauScore, scoreProspect } from "./score";

const maintenant = new Date("2026-11-22T12:00:00Z");

describe("score de priorité", () => {
  it("relit l'année de création dans la date Sirene ou dans les indices", () => {
    expect(anneeCreation({ date_creation: "2025-03-01" })).toBe(2025);
    expect(anneeCreation({ indices: "Code d'activité 56.10A (Restaurant) · créée en 2019" })).toBe(2019);
    expect(anneeCreation({})).toBeNull();
  });
  it("place en premier une entreprise récente, joignable, qui reçoit des clients", () => {
    const fort = scoreProspect({ date_creation: "2026-01-10", telephone: "06 12 34 56 78", naf: "56.10A", tranche_effectif: "01" }, maintenant);
    const faible = scoreProspect({ date_creation: "1990-01-10", naf: "70.22Z", tranche_effectif: "21" }, maintenant);
    expect(fort).toBe(100);
    expect(niveauScore(fort)).toBe("fort");
    expect(faible).toBeLessThan(50);
    expect(niveauScore(faible)).toBe("faible");
  });
  it("reste entre 0 et 100 et neutre quand on ne sait rien", () => {
    const s = scoreProspect({}, maintenant);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
    expect(niveauScore(s)).toBe("faible");
  });
  it("un téléphone connu fait gagner des points", () => {
    const base = { date_creation: "2020-05-01", naf: "43.22A" };
    expect(scoreProspect({ ...base, telephone: "0466000000" }, maintenant)).toBe(scoreProspect(base, maintenant) + 20);
  });
});
