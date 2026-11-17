import { describe, expect, it } from "vitest";
import { argumentsOffre, compteurs, libelleRemise, moisGratuitEpuise, OFFRE_SUIVANTE, prixParJour, prochaineRemiseAZero, titreLimite } from "./limites";
import { PLANS } from "./plans";

const zero = { prospects: 0, messages_ia: 0, sites_ia: 0, retouches_ia: 0 };

describe("limites des offres", () => {
  it("repère ce qui est épuisé", () => {
    const c = compteurs(PLANS.gratuit.quotas, { ...zero, prospects: 15, messages_ia: 4 });
    expect(c.prospects).toEqual({ max: 15, utilise: 15, reste: 0, epuise: true });
    expect(c.messages_ia.reste).toBe(1);
    expect(c.sites_ia.epuise).toBe(false); // quota à 0 : non concerné, pas « épuisé »
  });
  it("bloque le mois gratuit quand commerces ET messages sont utilisés, jamais une offre payante", () => {
    expect(moisGratuitEpuise("gratuit", compteurs(PLANS.gratuit.quotas, { ...zero, prospects: 15, messages_ia: 4 }))).toBe(false);
    expect(moisGratuitEpuise("gratuit", compteurs(PLANS.gratuit.quotas, { ...zero, prospects: 15, messages_ia: 5 }))).toBe(true);
    expect(moisGratuitEpuise("pro", compteurs(PLANS.pro.quotas, { ...zero, prospects: 300, messages_ia: 100 }))).toBe(false);
  });
  it("remet à zéro le 1er du mois suivant, y compris en décembre", () => {
    expect(libelleRemise(prochaineRemiseAZero(new Date("2026-11-17T12:00:00Z")))).toBe("le 1er décembre");
    expect(libelleRemise(prochaineRemiseAZero(new Date("2026-12-20T12:00:00Z")))).toBe("le 1er janvier");
  });
  it("propose toujours l'offre juste au-dessus, avec des chiffres exacts", () => {
    expect(OFFRE_SUIVANTE.gratuit).toBe("pro");
    expect(OFFRE_SUIVANTE.ultra).toBeUndefined();
    const a = argumentsOffre("gratuit", "pro", "messages_ia");
    expect(a[0]).toBe(`${PLANS.pro.quotas.messages_ia} messages rédigés par l'IA par mois au lieu de ${PLANS.gratuit.quotas.messages_ia}`);
    expect(a.join(" ")).toContain(`${PLANS.pro.quotas.prospects} commerces trouvés par mois au lieu de ${PLANS.gratuit.quotas.prospects}`);
  });
  it("affiche un prix par jour toujours vrai", () => {
    expect(prixParJour(29)).toBe("moins de 1 € par jour");
    expect(prixParJour(59)).toBe("moins de 2 € par jour");
    expect(prixParJour(119)).toBe("moins de 4 € par jour");
    for (const p of [29, 59, 119]) expect(p / 30).toBeLessThan(Number(prixParJour(p).match(/\d+/)![0]));
  });
  it("donne un titre clair selon la limite atteinte", () => {
    expect(titreLimite("messages_ia", "gratuit", "novembre")).toBe("Vos 5 messages de novembre sont rédigés");
    expect(titreLimite("mois", "gratuit", "novembre")).toMatch(/mois gratuit/);
  });
});
