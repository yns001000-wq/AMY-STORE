import { describe, expect, it } from "vitest";
import { ajouterJournal, estEtape, etape, ETAPES } from "./pipeline";

describe("pipeline", () => {
  it("connaît les étapes et refuse les autres", () => {
    expect(estEtape("rdv")).toBe(true);
    expect(estEtape("supprimé")).toBe(false);
    expect(etape("inconnu").id).toBe("nouveau");
    expect(ETAPES.map((e) => e.id)).toEqual(["nouveau", "contacte", "repondu", "rdv", "devis", "gagne", "perdu", "refus"]);
  });
  it("ajoute au journal en tête, 50 entrées au plus", () => {
    const j = ajouterJournal(Array.from({ length: 50 }, (_, i) => ({ d: "2026-01-01", t: `e${i}` })), "Appel", new Date("2026-11-08T10:00:00Z"));
    expect(j).toHaveLength(50);
    expect(j[0]).toEqual({ d: "2026-11-08", t: "Appel" });
    expect(ajouterJournal(null, "x")).toHaveLength(1);
  });
});
