import { describe, expect, it } from "vitest";
import { abonnementActif, coutMaxIA, departementsAutorises, economieAnnuelle, limite, ORDRE_PLANS, planDepuisPriceId, planEffectif, priceIdStripe, PLANS } from "./plans";

const env = { STRIPE_PRICE_PRO_MENSUEL: "price_pro_m", STRIPE_PRICE_PRO_ANNUEL: "price_pro_a", STRIPE_PRICE_PREMIUM_MENSUEL: "price_prem_m", STRIPE_PRICE_ULTRA_ANNUEL: "price_ultra_a" };

describe("offres", () => {
  it("les quotas montent avec l'offre", () => {
    expect(limite("gratuit", "prospects")).toBeLessThan(limite("pro", "prospects"));
    expect(limite("pro", "sites_ia")).toBeLessThan(limite("premium", "sites_ia"));
    expect(limite("gratuit", "sites_ia")).toBe(0);
  });
  it("l'IA ne peut jamais coûter plus de 40 % de ce que rapporte une offre, même utilisée à fond", () => {
    // Recette mensuelle la plus basse : l'abonnement annuel ramené au mois. Un euro compté pour un dollar (prudent).
    for (const id of ORDRE_PLANS.filter((p) => p !== "gratuit")) {
      const recette = PLANS[id].prixAnnuel / 12;
      expect(coutMaxIA(PLANS[id].quotas), id).toBeLessThanOrEqual(recette * 0.4);
    }
  });
  it("les comptes gratuits coûtent très peu : moins de 0,20 $ par mois", () => {
    expect(coutMaxIA(PLANS.gratuit.quotas)).toBeLessThanOrEqual(0.2);
  });
  it("l'Académie complète est réservée aux offres payantes", () => {
    expect(PLANS.gratuit.academie).toBe("decouverte");
    for (const id of ["pro", "premium", "ultra"] as const) expect(PLANS[id].academie).toBe("complete");
  });
  it("l'annuel offre 2 mois", () => {
    expect(economieAnnuelle("pro")).toBe(58);
    expect(PLANS.premium.prixAnnuel).toBe(PLANS.premium.prixMensuel * 10);
  });
  it("limite les départements selon l'offre", () => {
    const d = ["69", "42", "38", "01", "73"];
    expect(departementsAutorises("gratuit", d)).toEqual(["69"]);
    expect(departementsAutorises("pro", d)).toEqual(["69", "42", "38"]);
    expect(departementsAutorises("ultra", d)).toEqual(d);
  });
  it("retrouve l'offre depuis Stripe, et donne le gratuit par défaut", () => {
    expect(priceIdStripe("pro", "annuel", env)).toBe("price_pro_a");
    expect(planDepuisPriceId("price_prem_m", env)).toBe("premium");
    expect(planDepuisPriceId("price_inconnu", env)).toBe("gratuit");
    expect(planDepuisPriceId(null, env)).toBe("gratuit");
  });
  it("aucun essai : l'offre appliquée est celle payée, et une valeur inconnue donne le gratuit", () => {
    expect(planEffectif({ plan: "gratuit" })).toBe("gratuit");
    expect(planEffectif({ plan: "pro" })).toBe("pro");
    expect(planEffectif({ plan: "n'importe quoi" })).toBe("gratuit");
  });
  it("seuls active et trialing donnent accès", () => {
    expect(abonnementActif("active")).toBe(true);
    expect(abonnementActif("past_due")).toBe(false);
    expect(abonnementActif("canceled")).toBe(false);
  });
});
