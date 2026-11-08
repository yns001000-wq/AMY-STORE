import { describe, expect, it } from "vitest";
import { celluleCSV, versCSV } from "./csv";

describe("export CSV", () => {
  it("échappe les séparateurs et neutralise les formules", () => {
    expect(celluleCSV('Pizza "Bella"; Lyon')).toBe('"Pizza ""Bella""; Lyon"');
    expect(celluleCSV("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(celluleCSV("-2")).toBe("'-2");
    expect(celluleCSV(null)).toBe("");
  });
  it("produit un fichier pour Excel (BOM, point-virgule)", () => {
    const c = versCSV([["nom", "Nom"], ["ville", "Ville"]], [{ nom: "Pizza Bella", ville: "Lyon" }]);
    expect(c.startsWith("﻿Nom;Ville\r\nPizza Bella;Lyon")).toBe(true);
  });
});
