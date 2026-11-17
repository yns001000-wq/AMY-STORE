import { describe, expect, it } from "vitest";
import { abonnementActif, coutMaxIA, departementsAutorises, economieAnnuelle, limite, ORDRE_PLANS, planDepuisPriceId, planEffectif, priceIdStripe, PLANS } from "./plans";

const env = { STRIPE_PRICE_PRO_MENSUEL: "price_pro_m", STRIPE_PRICE_PRO_ANNUEL: "price_pro_a", STRIPE_PRICE_PREMIUM_MENSUEL: "price_prem_m", STRIPE_PRICE_ULTRA_ANNUEL: "price_ultra_a" };

describe("offres", () => {
  it("les quotas montent avec l'offre", () => {
    expect(limite("gratuit", "prospects")).toBeLessThan(limite("pro", "prospects"));
    expect(limite("pro", "sites_ia")).toBeLessThan(limite("premium", "sites_ia"));
    expect(limite("gratuit", "sites_ia")).toBe(0);
  });
  it("l'IA ne peut jamais coûter plus de 27 % de ce que rapporte une offre, même utilisée à fond (pire cas, cache compris)", () => {
    // Recette mensuelle la plus basse : l'abonnement annuel ramené au mois. Un euro compté pour un dollar (prudent).
    for (const id of ORDRE_PLANS.filter((p) => p !== "gratuit")) {
      const recette = PLANS[id].prixAnnuel / 12;
      expect(coutMaxIA(PLANS[id].quotas), id).toBeLessThanOrEqual(recette * 0.27);
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

describe("Stripe : passage du mode test au mode réel", () => {
  const env = { STRIPE_PRICE_PRO_MENSUEL: "price_test_pro", STRIPE_PRICE_PRO_MENSUEL_LIVE: "price_live_pro" };
  it("prend les prix de test avec une clé de test, les prix réels avec une clé live", () => {
    expect(priceIdStripe("pro", "mensuel", { ...env, STRIPE_SECRET_KEY: "sk_test_x" })).toBe("price_test_pro");
    expect(priceIdStripe("pro", "mensuel", { ...env, STRIPE_SECRET_KEY: "sk_live_x" })).toBe("price_live_pro");
    expect(priceIdStripe("premium", "mensuel", { ...env, STRIPE_SECRET_KEY: "sk_live_x" })).toBeUndefined(); // jamais un prix de test en réel
    expect(priceIdStripe("pro", "mensuel", { ...env, STRIPE_SECRET_KEY: "rk_live_x" })).toBe("price_live_pro"); // clé restreinte réelle
  });
  it("reconnaît l'offre d'un abonnement réel comme d'un abonnement de test", () => {
    expect(planDepuisPriceId("price_live_pro", env)).toBe("pro");
    expect(planDepuisPriceId("price_test_pro", env)).toBe("pro");
  });
});

describe("Stripe : nouveaux prix après le lancement", () => {
  const env = { STRIPE_SECRET_KEY: "sk_live_x", STRIPE_PRICE_PRO_MENSUEL_LIVE: "p_lancement", STRIPE_PRICE_PRO_MENSUEL_LIVE_APRES: "p_apres" };
  it("prix de lancement jusqu'au 30/11, nouveau prix ensuite, et l'offre reste reconnue", () => {
    expect(priceIdStripe("pro", "mensuel", env, new Date("2026-11-30T22:00:00Z"))).toBe("p_lancement");
    expect(priceIdStripe("pro", "mensuel", env, new Date("2026-12-01T08:00:00Z"))).toBe("p_apres");
    expect(planDepuisPriceId("p_apres", env)).toBe("pro");
    expect(planDepuisPriceId("p_lancement", env)).toBe("pro");
  });
});
