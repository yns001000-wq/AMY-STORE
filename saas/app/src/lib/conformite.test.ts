import { describe, expect, it } from "vitest";
import { montantRetractation, rappelReconductionDu, retractationPossible } from "./conformite";

const d = (s: string) => new Date(`${s}T12:00:00Z`);

describe("conformité de l'abonnement", () => {
  it("rétractation : consommateur, 14 jours, une seule fois", () => {
    expect(retractationPossible({ particulier: true, debut: d("2026-11-01"), deja: false }, d("2026-11-10")).ok).toBe(true);
    expect(retractationPossible({ particulier: true, debut: d("2026-11-01"), deja: false }, d("2026-11-16")).ok).toBe(false);
    expect(retractationPossible({ particulier: false, debut: d("2026-11-01"), deja: false }, d("2026-11-02")).ok).toBe(false);
    expect(retractationPossible({ particulier: true, debut: d("2026-11-01"), deja: true }, d("2026-11-02")).ok).toBe(false);
  });
  it("remboursement au prorata des jours utilisés", () => {
    // 29 € pour 30 jours, rétractation 5 jours après la souscription → 5 jours retenus (4,83 €), 24,17 € remboursés
    expect(montantRetractation(2900, d("2026-11-01"), d("2026-12-01"), d("2026-11-06"))).toEqual({ rembourse: 2417, retenu: 483, joursUtilises: 5 });
    expect(montantRetractation(2900, d("2026-11-01"), d("2026-12-01"), d("2026-11-01")).rembourse).toBe(2900);
  });
  it("rappel de reconduction : abonnements annuels, entre 3 mois et 1 mois avant, une fois", () => {
    const fin = d("2027-03-01");
    expect(rappelReconductionDu({ periode: "annuel", finPeriode: fin, resiliationPrevue: false, rappelEnvoyePour: null }, d("2027-01-15"))).toBe(true);
    expect(rappelReconductionDu({ periode: "annuel", finPeriode: fin, resiliationPrevue: false, rappelEnvoyePour: null }, d("2026-11-15"))).toBe(false);
    expect(rappelReconductionDu({ periode: "annuel", finPeriode: fin, resiliationPrevue: false, rappelEnvoyePour: null }, d("2027-02-15"))).toBe(false);
    expect(rappelReconductionDu({ periode: "annuel", finPeriode: fin, resiliationPrevue: false, rappelEnvoyePour: fin }, d("2027-01-15"))).toBe(false);
    expect(rappelReconductionDu({ periode: "mensuel", finPeriode: fin, resiliationPrevue: false, rappelEnvoyePour: null }, d("2027-01-15"))).toBe(false);
    expect(rappelReconductionDu({ periode: "annuel", finPeriode: fin, resiliationPrevue: true, rappelEnvoyePour: null }, d("2027-01-15"))).toBe(false);
  });
});
