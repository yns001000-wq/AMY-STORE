import { describe, expect, it } from "vitest";
import { controleEmission, mentionsLegales, nettoyerLignes, totaux } from "./factures";

const e = { nom: "Noa Exemple EI", siret: "12345678900011", adresse: "1 rue Test, 69000 Lyon", tva: "franchise", taux_tva: 0 };

describe("devis et factures", () => {
  it("calcule les totaux au centime près", () => {
    const l = nettoyerLignes([{ designation: "Site", quantite: "1", prix_unitaire: "490,00" }, { designation: "Maintenance", quantite: 12, prix_unitaire: 29.9 }, { designation: "", prix_unitaire: 5 }]);
    expect(l).toHaveLength(2);
    expect(totaux(l, 0)).toEqual({ ht: 848.8, tva: 0, ttc: 848.8 });
    expect(totaux([{ designation: "x", quantite: 3, prix_unitaire: 0.1 }], 20)).toEqual({ ht: 0.3, tva: 0.06, ttc: 0.36 });
  });
  it("refuse quantités et prix négatifs", () => {
    expect(nettoyerLignes([{ designation: "x", quantite: -2, prix_unitaire: -10 }])).toEqual([{ designation: "x", quantite: 1, prix_unitaire: 0 }]);
  });
  it("imprime les mentions obligatoires", () => {
    const f = mentionsLegales("facture", e, { echeance: "2026-12-08" }).join(" ");
    expect(f).toContain("art. 293 B du CGI");
    expect(f).toContain("08/12/2026");
    expect(f).toContain("40 €");
    expect(mentionsLegales("devis", e, { echeance: "2026-12-08" }).join(" ")).toContain("Bon pour accord");
    expect(mentionsLegales("facture", { ...e, tva: "FR00123456789" }).join(" ")).not.toContain("293 B");
  });
  it("bloque l'émission sans identité du vendeur ni adresse du client", () => {
    expect(controleEmission(null, { nom: "Pizza" }, [])).toHaveLength(3);
    expect(controleEmission(e, { nom: "Pizza", adresse: "Lyon" }, [{ designation: "x", quantite: 1, prix_unitaire: 1 }])).toEqual([]);
  });
});
