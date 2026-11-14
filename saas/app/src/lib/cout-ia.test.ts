import { describe, expect, it } from "vitest";
import { APPELS_MAX, CACHE_MINIMUM_JETONS, coutAction, coutScenario, coutUsage } from "./cout-ia";

describe("coût de l'IA", () => {
  it("calcule le coût d'un appel à partir de l'usage renvoyé par l'API", () => {
    // Opus 5.5 : 1 000 jetons lus du cache, 200 en entrée, 500 écrits dans le cache, 2 000 en sortie
    expect(coutUsage("claude-opus-5-5", { input_tokens: 200, cache_read_input_tokens: 1000, cache_creation_input_tokens: 500, output_tokens: 2000 }))
      .toBeCloseTo((200 * 4 + 1000 * 0.2 + 500 * 5 + 2000 * 20) / 1e6, 10);
    expect(coutUsage("modele-inconnu", { input_tokens: 1, output_tokens: 1 })).toBe(0);
  });
  it("le cache lu coûte moins que sans cache, le cache écrit un peu plus (pour la partie fixe seulement)", () => {
    const [sans, ecrit, lu] = (["sans", "ecrit", "lu"] as const).map((s) => coutScenario("claude-opus-5-5", 1500, 100, 0, s));
    expect(lu).toBeLessThan(sans);
    expect(ecrit).toBeGreaterThan(sans);
    expect(ecrit / sans).toBeLessThan(1.25);
  });
  it("une partie fixe trop courte n'est pas mise en cache : même coût dans tous les scénarios", () => {
    const f = CACHE_MINIMUM_JETONS - 1;
    expect(coutScenario("claude-sonnet-5-5", f, 100, 50, "lu")).toBe(coutScenario("claude-sonnet-5-5", f, 100, 50, "sans"));
  });
  it("la réponse (sortie) pèse plus de 85 % du coût maximal de chaque action", () => {
    for (const a of Object.keys(APPELS_MAX) as (keyof typeof APPELS_MAX)[]) {
      const sortie = APPELS_MAX[a].reduce((s, x) => s + coutScenario(x.modele, 0, 0, x.sortie, "sans"), 0);
      expect(sortie / coutAction(a, "ecrit"), a).toBeGreaterThan(0.85);
    }
  });
});
