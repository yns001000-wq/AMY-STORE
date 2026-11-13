import { describe, expect, it } from "vitest";
import { estAdmin, nettoyerSource, offrePayante, premiersPas, statistiques } from "./croissance";

const J = 86400000, now = new Date("2026-11-10T10:00:00Z");
const dans = (j: number) => new Date(now.getTime() + j * J);

describe("provenance et offre visée", () => {
  it("nettoie la provenance", () => {
    expect(nettoyerSource("TikTok")).toBe("tiktok");
    expect(nettoyerSource("<script>alert(1)</script>")).toBe("scriptalert1script");
    expect(nettoyerSource("")).toBeNull();
    expect(nettoyerSource(undefined)).toBeNull();
    expect(nettoyerSource("a".repeat(80))).toHaveLength(40);
  });
  it("n'accepte que les offres payantes connues", () => {
    expect(offrePayante("pro")).toBe("pro");
    expect(offrePayante("gratuit")).toBeNull();
    expect(offrePayante("admin")).toBeNull();
  });
});


describe("premiers pas", () => {
  it("suit l'avancement, pointe vers la première fiche et vers la première leçon gratuite", () => {
    const pas = premiersPas({ prospects: 3, messages: 0, sites: 0, lecons: 0, premierProspect: "abc" });
    expect(pas.map((p) => p.fait)).toEqual([true, false, false, false]);
    expect(pas[1].lien).toBe("/espace/prospects/abc");
    expect(pas[3].lien).toBe("/espace/academie/demarrer-statut");
    expect(premiersPas({ prospects: 1, messages: 1, sites: 1, lecons: 2 }).every((p) => p.fait)).toBe(true);
  });
});

describe("tableau de suivi", () => {
  const p = (o: object) => ({ plan: "gratuit", cree_le: dans(-40).toISOString(), ...o });
  it("calcule inscrits, abonnés, revenu mensuel et provenances", () => {
    const s = statistiques([
      p({ plan: "pro", abonnement_statut: "active", periode: "mensuel", source: "tiktok", cgu_acceptees_le: "x" }),
      p({ plan: "premium", abonnement_statut: "active", periode: "annuel", source: "tiktok", resiliation_prevue: true }),
      p({ plan: "ultra", abonnement_statut: "canceled" }),
      p({ cree_le: dans(-2).toISOString(), source: "instagram" }),
      p({}),
    ], new Set(["a"]), ["a", "b", "c", "d", "e"], now);
    expect(s.inscrits).toBe(5);
    expect(s.inscrits7j).toBe(1);
    expect(s.payants).toBe(2);
    expect(s.abonnes).toEqual({ pro: 1, premium: 1, ultra: 0 });
    expect(s.revenuMensuel).toBe(78.17); // 29 + 590/12
    expect(s.resiliations).toBe(1);
    expect(s.actives).toBe(1);
    expect(s.conversion).toBe(40);
    expect(s.sources[0]).toEqual({ nom: "tiktok", inscrits: 2, abonnes: 2 });
  });
  it("réserve le tableau aux adresses listées", () => {
    expect(estAdmin("Moi@Ex.fr", "autre@ex.fr, moi@ex.fr")).toBe(true);
    expect(estAdmin("x@ex.fr", "moi@ex.fr")).toBe(false);
    expect(estAdmin("x@ex.fr", "")).toBe(false);
    expect(estAdmin(null, "moi@ex.fr")).toBe(false);
  });
});
