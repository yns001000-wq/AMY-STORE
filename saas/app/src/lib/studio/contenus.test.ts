import { describe, expect, it } from "vitest";
import { FAMILLES, rendreSite, siteExpress } from "./index";
import { CONTENUS } from "./contenus";
import { PLANS } from "../plans";

/** Texte visible d'une maquette express (balises et styles retirés). */
const texte = (famille: string) => rendreSite(siteExpress({ nom: "Commerce Test", ville: "Lyon", code_postal: "69003", telephone: "04 00 00 00 00" }, famille), PLANS.pro.studio)
  .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("maquette express : contenu adapté au métier", () => {
  it("existe pour chaque famille du moteur", () => {
    for (const f of Object.keys(FAMILLES)) expect(CONTENUS[f], f).toBeDefined();
  });
  it("ne parle de devis que pour les artisans et les traiteurs", () => {
    for (const f of Object.keys(FAMILLES)) {
      const avecDevis = /devis/i.test(texte(f));
      expect(avecDevis, f).toBe(f === "artisan" || f === "traiteur");
    }
  });
  it("pas de vocabulaire de restaurant hors restauration, ni de chantier hors bâtiment", () => {
    for (const f of ["patisserie", "beaute", "artisan", "traiteur"]) expect(texte(f), f).not.toMatch(/formule midi|plat du jour|plat signature/i);
    for (const f of Object.keys(FAMILLES).filter((x) => x !== "artisan")) expect(texte(f), f).not.toMatch(/intervention|chantier|dépannage/i);
  });
  it("a le vocabulaire attendu du métier", () => {
    expect(texte("patisserie")).toMatch(/baguette/i);
    expect(texte("patisserie")).toMatch(/gâteau/i);
    expect(texte("beaute")).toMatch(/rendez-vous/i);
    expect(texte("pizzeria")).toMatch(/margherita/i);
    expect(texte("restaurant")).toMatch(/réserv/i);
  });
  it("garde la mention « exemple » pour les prix et textes", () => {
    for (const f of Object.keys(FAMILLES)) expect(texte(f), f).toMatch(/exemple/i);
  });
});
