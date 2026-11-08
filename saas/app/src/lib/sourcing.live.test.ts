import { describe, expect, it } from "vitest";
import { chercherProspects } from "./sourcing";
import { secteurParId } from "./secteurs";

// Test réel contre l'API publique : lancer avec LIVE=1 npm test
describe.skipIf(!process.env.LIVE)("API Sirene réelle", () => {
  it("trouve des restaurants indépendants dans le Rhône", async () => {
    const r = await chercherProspects({ secteur: secteurParId("restauration")!, dep: "69", max: 10, dejaConnus: new Set(), opposition: { sirens: new Set(), sirets: new Set() }, maxPages: 3 });
    console.log(r.prospects.map((p) => `${p.nom} · ${p.metier} · ${p.ville} (${p.code_postal})`).join("\n"));
    expect(r.prospects.length).toBeGreaterThan(0);
    for (const p of r.prospects) expect(p.code_postal.startsWith("69")).toBe(true);
  }, 30000);
});
