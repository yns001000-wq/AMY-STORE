import { describe, expect, it } from "vitest";
import * as M from "./moteur";
import exemple from "./exemple-pizzeria.test.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { completerPhotosSM, normaliserSM, pageSM } = M as any;
const base = { v: 1, maquette: true, nom: "Pizza Bella", ville: "Lyon", code_postal: "69003", adresse: "12 rue X", telephone: "06 12 34 56 78", famille: "pizzeria" };

describe("moteur de sites", () => {
  it("filtre les champs inconnus et produit une page complète", () => {
    const d = normaliserSM(exemple, base);
    expect(d.champ_inconnu).toBeUndefined();
    completerPhotosSM(d, { metier: "Pizzeria" });
    const html = pageSM(d);
    expect(html).toContain("<h1>");
    expect(html).toContain('id="plan"');
    expect(html).toContain('application/ld+json');
    expect(html).toContain("/photos/ia-pizzeria-");
    expect(html).toContain('name="robots" content="noindex"');
  });
  it("échappe le HTML injecté dans les textes", () => {
    const d = normaliserSM({ accueil: { h1: "<script>alert(1)</script>", chapo: "x" } }, base);
    expect(pageSM(d)).not.toContain("<script>alert(1)</script>");
  });
  it("applique filigrane, marque blanche, police et sections masquées", () => {
    const d = normaliserSM({ ...exemple, police: "bricolage", masquer: ["plan", "faq"] }, base);
    const libre = pageSM(d, { filigrane: true });
    expect(libre).toContain("Fait avec MySite");
    expect(libre).toContain("Bricolage Grotesque");
    expect(libre).not.toContain('id="plan"');
    expect(libre).not.toContain('id="t-faq"');
    const blanche = pageSM(d, { marqueBlanche: true });
    expect(blanche).not.toContain("MySite");
  });
  it("refuse les photos d'origine inconnue", () => {
    const d = normaliserSM({ accueil: { h1: "T", photo: "javascript:alert(1)" } }, base);
    expect(d.accueil.photo).toBe("");
  });
});
