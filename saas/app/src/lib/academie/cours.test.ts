import { describe, expect, it } from "vitest";
import { LECONS, lecon, MODULES, niveau, progression } from "./cours";
import { missions } from "./missions";
import { avancement, ETAPES_LIVRAISON } from "../livraison";

describe("Académie", () => {
  it("chaque leçon est complète et cohérente", () => {
    const ids = new Set<string>();
    for (const l of LECONS) {
      expect(ids.has(l.id), `doublon ${l.id}`).toBe(false); ids.add(l.id);
      expect(l.video.length).toBeGreaterThanOrEqual(4);
      expect(l.quiz.length).toBe(3);
      for (const q of [...l.quiz, ...l.video.flatMap((s) => (s.quiz ? [s.quiz] : []))]) {
        expect(q.bonne).toBeGreaterThanOrEqual(0);
        expect(q.bonne).toBeLessThan(q.choix.length);
        expect(new Set(q.choix).size).toBe(q.choix.length);
      }
      for (const s of l.video) expect(s.voix.length).toBeLessThan(260); // phrases courtes : narration fluide
    }
    const positions = LECONS.flatMap((l) => l.quiz.map((q) => q.bonne));
    expect(new Set(positions).size).toBeGreaterThan(1); // la bonne réponse n'est pas toujours au même endroit
    expect(MODULES.length).toBe(7);
    expect(LECONS.length).toBe(17);
  });
  it("les liens vers les cours existent", () => {
    for (const e of ETAPES_LIVRAISON) if (e.lecon) expect(lecon(e.lecon), e.lecon).toBeDefined();
    for (const m of missions({ secteur: false, prospects: 0, contactes: 0, sites: 0, rdv: 0, devis: 0, publies: 0, payees: 0 })) expect(lecon(m.lecon), m.lecon).toBeDefined();
    expect(lecon("livrer-domaine")).toBeDefined();
    expect(lecon("conclure-acompte")).toBeDefined();
  });
  it("aucune promesse de gain dans les cours", () => {
    const tout = JSON.stringify(MODULES).toLowerCase();
    for (const interdit of ["revenus garantis", "devenez riche", "à coup sûr", "argent facile", "sans effort"]) expect(tout).not.toContain(interdit);
    // les exemples chiffrés sont toujours signalés comme des exemples
    for (const l of LECONS) for (const s of l.video) if (s.visuel.type === "chiffre" && /€/.test(s.visuel.valeur)) expect(s.visuel.note ?? "").toMatch(/exemple/i);
  });
  it("calcule progression et niveau", () => {
    expect(progression(new Set()).pct).toBe(0);
    expect(progression(new Set()).prochaine?.id).toBe("demarrer-statut");
    const tout = progression(new Set(LECONS.map((l) => l.id)));
    expect(tout.pct).toBe(100);
    expect(tout.niveau.nom).toBe("Maître MySite");
    expect(niveau(30).nom).toBe("Prospecteur");
    expect(niveau(30).suivant).toBe("Vendeur");
  });
  it("missions et livraison avancent avec l'activité", () => {
    const m = missions({ secteur: true, prospects: 12, contactes: 5, sites: 1, rdv: 0, devis: 0, publies: 0, payees: 0 });
    expect(m.filter((x) => x.fait).map((x) => x.id)).toEqual(["zone", "prospects", "maquette", "contact"]);
    expect(avancement({}).pct).toBe(0);
    expect(avancement({ accord: true, contenus: true }).prochaine?.cle).toBe("domaine");
    const toutes = Object.fromEntries(ETAPES_LIVRAISON.map((e) => [e.cle, true]));
    expect(avancement(toutes).pct).toBe(100);
  });
});
