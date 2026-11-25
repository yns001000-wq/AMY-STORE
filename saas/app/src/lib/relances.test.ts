import { describe, expect, it } from "vitest";
import { contenuRelance, jetonDesinscription, jetonValide, relanceDuJour, type EtatRelance } from "./relances";
import { emailTexte } from "./email-gabarit";

const maintenant = new Date("2026-11-22T09:00:00Z");
const ilYa = (j: number) => new Date(maintenant.getTime() - j * 86400000).toISOString();
const etat = (o: Partial<EtatRelance>): EtatRelance => ({ creeLe: ilYa(1.2), desinscrit: false, envoyees: {}, prospects: 0, sites: 0, etapesRestantes: ["a", "b"], ...o });

describe("relances des inscrits", () => {
  it("J+1 seulement si aucune entreprise n'est encore réservée", () => {
    expect(relanceDuJour(etat({}), maintenant)).toBe("j1");
    expect(relanceDuJour(etat({ prospects: 3 }), maintenant)).toBeNull();
    expect(relanceDuJour(etat({ creeLe: ilYa(0.5) }), maintenant)).toBeNull(); // trop tôt
  });
  it("J+3 seulement sans maquette, J+6 seulement si la liste n'est pas finie", () => {
    expect(relanceDuJour(etat({ creeLe: ilYa(3.1), prospects: 2 }), maintenant)).toBe("j3");
    expect(relanceDuJour(etat({ creeLe: ilYa(3.1), prospects: 2, sites: 1 }), maintenant)).toBeNull();
    expect(relanceDuJour(etat({ creeLe: ilYa(3.1), prospects: 0, envoyees: { j1: "x" } }), maintenant)).toBeNull(); // pas de maquette sans entreprise trouvée
    expect(relanceDuJour(etat({ creeLe: ilYa(6.1), prospects: 2, sites: 1 }), maintenant)).toBe("j6");
    expect(relanceDuJour(etat({ creeLe: ilYa(6.1), prospects: 2, sites: 1, etapesRestantes: [] }), maintenant)).toBeNull();
  });
  it("jamais deux fois le même, jamais après désinscription, rien pour un compte ancien", () => {
    expect(relanceDuJour(etat({ envoyees: { j1: "x" } }), maintenant)).toBeNull();
    expect(relanceDuJour(etat({ desinscrit: true }), maintenant)).toBeNull();
    expect(relanceDuJour(etat({ creeLe: ilYa(30) }), maintenant)).toBeNull();
  });
  it("chaque e-mail contient le lien de désinscription", () => {
    const c = contenuRelance("j6", etat({}), { espace: "https://mysite-app.com/espace", desinscription: "https://mysite-app.com/api/relances/desinscription?u=1&t=2" });
    const t = emailTexte(c, { site: "https://mysite-app.com" });
    expect(t).toContain("desinscription?u=1&t=2");
    expect(t).toContain("2 étapes");
  });
  it("le lien de désinscription est signé", () => {
    const j = jetonDesinscription("user-1", "secret")!;
    expect(jetonValide("user-1", j, "secret")).toBe(true);
    expect(jetonValide("user-2", j, "secret")).toBe(false);
    expect(jetonValide("user-1", "abc", "secret")).toBe(false);
    expect(jetonDesinscription("user-1", "")).toBeNull();
  });
});
