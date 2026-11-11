import { describe, expect, it } from "vitest";
import { estAdmin, joursRestants, mailEssaiDu, nettoyerSource, offrePayante, premiersPas, statistiques } from "./croissance";

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

describe("e-mails liés à l'essai", () => {
  const base = { plan: "gratuit", emailsEssai: true, j2EnvoyeLe: null, finEnvoyeLe: null };
  it("rappelle dans les 2 derniers jours, une seule fois", () => {
    expect(mailEssaiDu({ ...base, essaiFin: dans(5) }, now)).toBeNull();
    expect(mailEssaiDu({ ...base, essaiFin: dans(1.5) }, now)).toBe("j2");
    expect(mailEssaiDu({ ...base, essaiFin: dans(1.5), j2EnvoyeLe: now }, now)).toBeNull();
  });
  it("prévient à la fin de l'essai, une seule fois, pas des semaines après", () => {
    expect(mailEssaiDu({ ...base, essaiFin: dans(-0.5) }, now)).toBe("fin");
    expect(mailEssaiDu({ ...base, essaiFin: dans(-0.5), finEnvoyeLe: now }, now)).toBeNull();
    expect(mailEssaiDu({ ...base, essaiFin: dans(-10) }, now)).toBeNull();
  });
  it("n'envoie rien à un abonné, ni à qui a refusé ces e-mails, ni sans essai", () => {
    expect(mailEssaiDu({ ...base, plan: "pro", essaiFin: dans(1) }, now)).toBeNull();
    expect(mailEssaiDu({ ...base, emailsEssai: false, essaiFin: dans(1) }, now)).toBeNull();
    expect(mailEssaiDu({ ...base, essaiFin: null }, now)).toBeNull();
  });
  it("compte les jours restants", () => {
    expect(joursRestants(dans(6.2), now)).toBe(7);
    expect(joursRestants(dans(-1), now)).toBe(0);
  });
});

describe("premiers pas", () => {
  it("suit l'avancement et pointe vers la première fiche", () => {
    const pas = premiersPas({ prospects: 3, messages: 0, sites: 0, payant: false, essaiDemarre: false, premierProspect: "abc" });
    expect(pas.map((p) => p.fait)).toEqual([true, false, false, false]);
    expect(pas[1].lien).toBe("/espace/prospects/abc");
    expect(premiersPas({ prospects: 1, messages: 1, sites: 1, payant: true, essaiDemarre: false }).every((p) => p.fait)).toBe(true);
  });
});

describe("tableau de suivi", () => {
  const p = (o: object) => ({ plan: "gratuit", cree_le: dans(-40).toISOString(), ...o });
  it("calcule inscrits, abonnés, revenu mensuel et provenances", () => {
    const s = statistiques([
      p({ plan: "pro", abonnement_statut: "active", periode: "mensuel", source: "tiktok", cgu_acceptees_le: "x" }),
      p({ plan: "premium", abonnement_statut: "active", periode: "annuel", source: "tiktok", resiliation_prevue: true }),
      p({ plan: "ultra", abonnement_statut: "canceled" }),
      p({ essai_fin: dans(3).toISOString(), cree_le: dans(-2).toISOString(), source: "instagram" }),
      p({ essai_fin: dans(-3).toISOString() }),
    ], new Set(["a"]), ["a", "b", "c", "d", "e"], now);
    expect(s.inscrits).toBe(5);
    expect(s.inscrits7j).toBe(1);
    expect(s.payants).toBe(2);
    expect(s.abonnes).toEqual({ pro: 1, premium: 1, ultra: 0 });
    expect(s.revenuMensuel).toBe(78.17); // 29 + 590/12
    expect(s.essais).toBe(1);
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
