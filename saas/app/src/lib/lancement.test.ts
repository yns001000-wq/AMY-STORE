import { describe, expect, it } from "vitest";
import { enLancement, FIN_LANCEMENT, prixOffre, tempsRestant } from "./lancement";

const avant = new Date("2026-11-30T22:59:00Z"), apres = new Date("2026-11-30T23:00:00Z"); // minuit à Paris le 1er décembre

describe("prix de lancement", () => {
  it("se termine le 1er décembre 2026 à minuit (Paris)", () => {
    expect(FIN_LANCEMENT.toISOString()).toBe("2026-11-30T23:00:00.000Z");
    expect(enLancement(avant)).toBe(true);
    expect(enLancement(apres)).toBe(false);
  });
  it("affiche les prix de lancement avant, les nouveaux après", () => {
    expect(prixOffre("pro", "mensuel", avant)).toBe(29);
    expect(prixOffre("pro", "mensuel", apres)).toBe(35);
    expect(prixOffre("premium", "annuel", apres)).toBe(690);
    expect(prixOffre("ultra", "mensuel", apres)).toBe(139);
    expect(prixOffre("gratuit", "mensuel", apres)).toBe(0);
  });
  it("garantit le prix de lancement aux abonnés d'avant la date, même plus tard", () => {
    const abonne = new Date("2026-11-20T10:00:00Z"), bienPlusTard = new Date("2028-03-01T10:00:00Z");
    expect(prixOffre("pro", "mensuel", bienPlusTard, abonne)).toBe(29);
    expect(prixOffre("ultra", "annuel", bienPlusTard, abonne)).toBe(1190);
    expect(prixOffre("pro", "mensuel", bienPlusTard, new Date("2026-12-05T10:00:00Z"))).toBe(35);
  });
  it("compte à rebours exact, qui disparaît après la date (jamais remis à zéro)", () => {
    expect(tempsRestant(new Date("2026-11-17T23:00:00Z"))).toEqual({ jours: 13, heures: 0, minutes: 0, secondes: 0 });
    expect(tempsRestant(apres)).toBeNull();
    expect(tempsRestant(new Date("2027-01-01T00:00:00Z"))).toBeNull();
  });
});
