import { describe, expect, it } from "vitest";
import {
  appliquer, compteurs, CREDIT_PARRAIN_CENTIMES, etapeFilleul, genererCode, montantPaiement, motifAutoParrainage, nomAffiche, normaliserCode,
  normaliserEmail, premierPaiementRemise, statsParrainage, prolongerProOffert, recompenseDue, remiseApplicable, rentabilitePireCas, RECOMPENSES_MAX_PAR_AN, type Parrainage,
} from "./parrainage";
import { planEffectif } from "./plans";

const J = 86400000;
const neuf: Parrainage = { statut: "inscrit", periode: null, paiements: 0, premierPaiementLe: null, validationPrevueLe: null };
const t0 = new Date("2026-11-14T10:00:00Z");

describe("codes de parrainage", () => {
  it("sont lisibles, en majuscules, sans 0/O ni 1/I ambigus", () => {
    for (let i = 0; i < 300; i++) {
      const c = genererCode("Léa-Marie", Math.random);
      expect(c).toMatch(/^LEA-[2-9]{4}$/);
    }
    expect(genererCode("", () => 0)).toBe("AMI-2222");
    expect(genererCode("  françois  ", () => 0.99)).toBe("FRANCOIS-9999");
  });
  it("acceptent une saisie approximative", () => {
    expect(normaliserCode(" lea-4827 ")).toBe("LEA-4827");
    expect(normaliserCode("L0IC4827")).toBe("LOIC-4827");
    expect(normaliserCode("LEA-4807")).toBeNull();          // 0 jamais dans les chiffres
    expect(normaliserCode("<script>")).toBeNull();
    expect(normaliserCode(42)).toBeNull();
  });
  it("n'affichent que le prénom et l'initiale du nom d'un filleul", () => {
    expect(nomAffiche("tom durand", 1)).toBe("Tom D.");
    expect(nomAffiche("Inès", 2)).toBe("Inès");
    expect(nomAffiche(null, 3)).toBe("Ami n°3");
  });
});

describe("réduction de 20 % du filleul", () => {
  it("ne s'applique qu'une fois, au 1er paiement", () => {
    expect(montantPaiement(2900, 1, true)).toBe(2320);
    expect(montantPaiement(2900, 2, true)).toBe(2900);
    expect(montantPaiement(2900, 3, true)).toBe(2900);
    expect(montantPaiement(29000, 1, true)).toBe(23200);   // 1re année en annuel
    expect(montantPaiement(29000, 2, true)).toBe(29000);
    expect(premierPaiementRemise(29)).toBe(23.2);
    expect(premierPaiementRemise(119)).toBe(95.2);
  });
  it("est réservée à un compte neuf, parrainé, jamais abonné", () => {
    const base = { parrainId: "p", statutParrainage: "inscrit", aDejaPaye: false, abonnementsPasses: 0 };
    expect(remiseApplicable(base)).toBe(true);
    expect(remiseApplicable({ ...base, parrainId: null })).toBe(false);
    expect(remiseApplicable({ ...base, aDejaPaye: true })).toBe(false);
    expect(remiseApplicable({ ...base, abonnementsPasses: 1 })).toBe(false);
    expect(remiseApplicable({ ...base, statutParrainage: "annule" })).toBe(false);
    expect(remiseApplicable({ ...base, statutParrainage: "paye" })).toBe(false); // déjà utilisée
  });
});

describe("validation de la récompense", () => {
  it("filleul mensuel : seulement après le 2e paiement réellement payé", () => {
    const a = appliquer(neuf, { type: "paiement", periode: "mensuel", le: t0, montantCentimes: 2320 });
    expect(a.action).toBe("premier_paiement");
    expect(a.parrainage.statut).toBe("paye");
    expect(appliquer(a.parrainage, { type: "echeance", le: new Date(t0.getTime() + 20 * J) }).action).toBe("rien");
    expect(appliquer(a.parrainage, { type: "paiement", periode: "mensuel", le: t0, montantCentimes: 0 }).action).toBe("rien"); // facture à 0 €
    const b = appliquer(a.parrainage, { type: "paiement", periode: "mensuel", le: new Date(t0.getTime() + 30 * J), montantCentimes: 2900 });
    expect(b.action).toBe("valider");
    expect(b.parrainage.statut).toBe("valide");
    expect(appliquer(b.parrainage, { type: "paiement", periode: "mensuel", le: t0, montantCentimes: 2900 }).action).toBe("rien");
  });
  it("filleul annuel : 14 jours après son paiement, pas avant", () => {
    const a = appliquer(neuf, { type: "paiement", periode: "annuel", le: t0, montantCentimes: 23200 });
    expect(a.parrainage.validationPrevueLe?.getTime()).toBe(t0.getTime() + 14 * J);
    expect(appliquer(a.parrainage, { type: "echeance", le: new Date(t0.getTime() + 13.9 * J) }).action).toBe("rien");
    expect(appliquer(a.parrainage, { type: "echeance", le: new Date(t0.getTime() + 14 * J) }).action).toBe("valider");
  });
  it("rétractation, remboursement, litige ou résiliation avant la validation : annulé, sans récompense", () => {
    const paye = appliquer(neuf, { type: "paiement", periode: "annuel", le: t0, montantCentimes: 23200 }).parrainage;
    for (const motif of ["retractation", "remboursement", "litige", "resiliation"] as const) {
      const a = appliquer(paye, { type: "annulation", motif });
      expect(a.action).toBe("annuler");
      expect(appliquer(a.parrainage, { type: "echeance", le: new Date(t0.getTime() + 30 * J) }).action).toBe("rien");
      expect(appliquer(a.parrainage, { type: "paiement", periode: "annuel", le: t0, montantCentimes: 29000 }).action).toBe("rien");
    }
    expect(appliquer(neuf, { type: "annulation", motif: "resiliation" }).parrainage.statut).toBe("annule");
  });
  it("une fois validé, un remboursement ne reprend pas la récompense", () => {
    const valide: Parrainage = { ...neuf, statut: "valide", periode: "mensuel", paiements: 2 };
    expect(appliquer(valide, { type: "annulation", motif: "remboursement" }).action).toBe("rien");
  });
});

describe("anti-triche", () => {
  it("refuse l'auto-parrainage : même compte, même e-mail, même carte", () => {
    expect(motifAutoParrainage({ id: "a" }, { id: "a" })).toBe("meme_compte");
    expect(motifAutoParrainage({ id: "a", email: "Lea.Martin@gmail.com" }, { id: "b", email: "leamartin+test@googlemail.com" })).toBe("meme_email");
    expect(motifAutoParrainage({ id: "a", email: "a@ex.fr", empreintesCartes: ["fp_1", "fp_2"] }, { id: "b", email: "b@ex.fr", empreintesCartes: ["fp_2"] })).toBe("meme_carte");
    expect(motifAutoParrainage({ id: "a", email: "a@ex.fr", empreintesCartes: ["fp_1"] }, { id: "b", email: "b@ex.fr", empreintesCartes: ["fp_3"] })).toBeNull();
    expect(motifAutoParrainage({ id: "a", email: "lea.martin@orange.fr" }, { id: "b", email: "leamartin@orange.fr" })).toBeNull(); // points gardés hors Gmail
    expect(normaliserEmail(" Tom+X@Ex.FR ")).toBe("tom@ex.fr");
  });
});

describe("récompense du parrain", () => {
  it("limite de 12 par année civile, au-delà comptée sans récompense", () => {
    expect(recompenseDue({ abonnePayant: true, recompensesCetteAnnee: 0 })).toBe("credit");
    expect(recompenseDue({ abonnePayant: true, recompensesCetteAnnee: RECOMPENSES_MAX_PAR_AN - 1 })).toBe("credit");
    expect(recompenseDue({ abonnePayant: true, recompensesCetteAnnee: RECOMPENSES_MAX_PAR_AN })).toBe("hors_limite");
    expect(recompenseDue({ abonnePayant: false, recompensesCetteAnnee: 12 })).toBe("hors_limite");
  });
  it("parrain en Gratuit : 30 jours de Pro, cumulables, sans Stripe", () => {
    expect(recompenseDue({ abonnePayant: false, recompensesCetteAnnee: 3 })).toBe("pro_offert");
    const un = prolongerProOffert(null, t0);
    expect(un.getTime()).toBe(t0.getTime() + 30 * J);
    const deux = prolongerProOffert(un, new Date(t0.getTime() + 5 * J));
    expect(deux.getTime()).toBe(t0.getTime() + 60 * J);                   // s'ajoutent
    expect(prolongerProOffert(new Date(t0.getTime() - J), t0).getTime()).toBe(t0.getTime() + 30 * J); // déjà expiré : depuis aujourd'hui
    expect(planEffectif({ plan: "gratuit", pro_offert_jusqu: deux.toISOString() }, t0)).toBe("pro");
    expect(planEffectif({ plan: "gratuit", pro_offert_jusqu: deux.toISOString() }, new Date(deux.getTime() + 1))).toBe("gratuit");
    expect(planEffectif({ plan: "premium", pro_offert_jusqu: deux.toISOString() }, t0)).toBe("premium");
  });
  it("affiche des étapes claires et des compteurs justes", () => {
    expect(etapeFilleul({ statut: "inscrit", periode: null, recompense: null }).badge).toBe("Inscrit");
    expect(etapeFilleul({ statut: "paye", periode: "mensuel", recompense: null }).badge).toBe("1er paiement fait, plus qu'un mois");
    expect(etapeFilleul({ statut: "valide", periode: "mensuel", recompense: "credit" }).badge).toBe("Validé : +29 €");
    expect(etapeFilleul({ statut: "annule", periode: "mensuel", recompense: null }).badge).toBe("Annulé");
    const c = compteurs([
      { statut: "inscrit", recompense: null, creditCentimes: 0 }, { statut: "paye", recompense: null, creditCentimes: 0 },
      { statut: "valide", recompense: "credit", creditCentimes: CREDIT_PARRAIN_CENTIMES }, { statut: "valide", recompense: "pro_offert", creditCentimes: 0 },
      { statut: "annule", recompense: null, creditCentimes: 0 },
    ]);
    expect(c).toEqual({ inscrits: 5, enAttente: 2, valides: 2, creditGagneCentimes: 2900 });
  });
});

describe("suivi des ventes", () => {
  it("compte parrainages, validations, crédit donné et chiffre d'affaires des filleuls", () => {
    const s = statsParrainage(
      [{ statut: "inscrit", apporte_centimes: 0 }, { statut: "paye", apporte_centimes: 2320 }, { statut: "valide", apporte_centimes: 5220 }, { statut: "annule", apporte_centimes: 0 }],
      [{ type: "credit", statut: "credite", montant_centimes: 2900, jours: 0 }, { type: "credit", statut: "a_crediter", montant_centimes: 2900, jours: 0 }, { type: "pro_offert", statut: "accorde", montant_centimes: 0, jours: 30 }],
    );
    expect(s).toEqual({ parrainages: 4, payants: 2, valides: 1, annules: 1, creditDonneCentimes: 2900, joursProOfferts: 30, caFilleulsCentimes: 7540 });
  });
});

describe("rentabilité", () => {
  it("pire cas : un filleul Pro (-20 %, IA à fond) rapporte plus, après 2 paiements, que ne coûtent les 29 € de crédit", () => {
    const r = rentabilitePireCas();
    expect(r.premierPaiement).toBe(23.2);
    expect(r.apporte).toBeGreaterThan(r.coutCredit);
    expect(r.apporte).toBeGreaterThan(r.coutProOffert);
    expect(r.marge).toBeGreaterThan(0);
    expect(r.coutCredit).toBeGreaterThan(20); // ordre de grandeur attendu (≈ 21 €)
  });
});
