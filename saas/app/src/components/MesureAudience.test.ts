import { describe, expect, it } from "vitest";
import { nettoyerUrl } from "./MesureAudience";

describe("mesure d'audience", () => {
  it("retire paramètres et identifiants des adresses envoyées", () => {
    expect(nettoyerUrl("https://mysite-app.com/connexion?code=abc&suite=/espace")).toBe("https://mysite-app.com/connexion");
    expect(nettoyerUrl("https://mysite-app.com/espace/prospects/3f2b8c1e-1234-4abc-9def-0123456789ab#notes")).toBe("https://mysite-app.com/espace/prospects/[id]");
    expect(nettoyerUrl("https://mysite-app.com/espace/factures/42/pdf")).toBe("https://mysite-app.com/espace/factures/[id]/pdf");
    expect(nettoyerUrl("https://mysite-app.com/")).toBe("https://mysite-app.com/");
  });
});
