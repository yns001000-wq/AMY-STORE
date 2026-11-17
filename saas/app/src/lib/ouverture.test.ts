import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { ventesOuvertes } from "./stripe";

describe("ouverture des ventes réelles", () => {
  it("bloque les paiements réels avant le 18/11/2026, jamais le mode test", () => {
    expect(ventesOuvertes(new Date("2026-11-17T22:59:00Z"), "sk_live_x")).toBe(false);
    expect(ventesOuvertes(new Date("2026-11-17T23:00:00Z"), "sk_live_x")).toBe(true); // minuit à Paris
    expect(ventesOuvertes(new Date("2026-11-01T10:00:00Z"), "sk_test_x")).toBe(true);
  });
});
