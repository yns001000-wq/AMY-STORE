import { describe, expect, it } from "vitest";
import { contenuHebdo, envoisRecents, hebdoAEnvoyer, sujetHebdo, type DonneesHebdo, type EtatHebdo } from "./hebdo";
import { emailTexte } from "./email-gabarit";

const lundi = new Date("2026-11-30T08:03:00Z");
const ilYa = (j: number) => new Date(lundi.getTime() - j * 86400000).toISOString();
const etat = (o: Partial<EtatHebdo>): EtatHebdo => ({ creeLe: ilYa(20), configure: true, desinscrit: false, derniereConnexion: ilYa(3), envoyees: {}, ...o });

describe("point de la semaine : qui le reçoit", () => {
  it("un compte configuré de plus de 7 jours, actif", () => {
    expect(hebdoAEnvoyer(etat({}), lundi)).toBe(true);
    expect(hebdoAEnvoyer(etat({ creeLe: ilYa(4) }), lundi)).toBe(false);       // encore dans les e-mails de démarrage
    expect(hebdoAEnvoyer(etat({ configure: false }), lundi)).toBe(false);
    expect(hebdoAEnvoyer(etat({ desinscrit: true }), lundi)).toBe(false);
    expect(hebdoAEnvoyer(etat({ derniereConnexion: ilYa(60) }), lundi)).toBe(false); // parti depuis plus de 45 jours
  });
  it("une fois par semaine, et 2 e-mails de conseils au plus sur 7 jours", () => {
    expect(hebdoAEnvoyer(etat({ envoyees: { hebdo: ilYa(2) } }), lundi)).toBe(false);
    expect(hebdoAEnvoyer(etat({ envoyees: { hebdo: ilYa(7) } }), lundi)).toBe(true);
    expect(hebdoAEnvoyer(etat({ envoyees: { j6: ilYa(1), j3: ilYa(4) } }), lundi)).toBe(false);
    expect(hebdoAEnvoyer(etat({ envoyees: { j6: ilYa(1) } }), lundi)).toBe(true);
    expect(envoisRecents({ j1: ilYa(10), j3: ilYa(5), hebdo: ilYa(6.5) }, lundi)).toBe(2);
  });
});

describe("point de la semaine : contenu", () => {
  const d: DonneesHebdo = {
    prenom: "Camille", totalAContacter: 12, enCours: 3, gagnes: 1,
    aContacter: [{ nom: "Bistrot Démo", metier: "Restaurant", score: 92 }],
    rappels: [{ nom: "Café Démo", action: "Rappeler le gérant", date: "2026-12-02" }],
    quota: { prospectsRestants: 0, messagesRestants: 2, remise: "le 1er décembre" },
  };
  it("rappels, entreprises prioritaires, suivi, quota et désinscription", () => {
    const t = emailTexte(contenuHebdo(d, { espace: "https://mysite-app.com/espace", desinscription: "https://mysite-app.com/x?u=1&t=2" }), { site: "https://mysite-app.com" });
    expect(sujetHebdo(d)).toBe("Ton point de la semaine : 1 rappel à faire");
    expect(t).toContain("📞 Rappel le 02/12 : Café Démo (Rappeler le gérant)");
    expect(t).toContain("⭐ À contacter : Bistrot Démo, restaurant (priorité 92/100)");
    expect(t).toContain("3 en cours");
    expect(t).toContain("il te reste 0 entreprise à trouver et 2 messages");
    expect(t).toContain("12 entreprises t'attendent en tout");
    expect(t).toContain("x?u=1&t=2");
  });
  it("sans rien à faire : invite à chercher des entreprises", () => {
    const vide = { ...d, aContacter: [], rappels: [], totalAContacter: 0, enCours: 0, gagnes: 0, quota: null };
    const c = contenuHebdo(vide, { espace: "https://mysite-app.com/espace", desinscription: "https://mysite-app.com/x" });
    expect(c.bouton?.texte).toBe("Trouver des entreprises");
    expect(sujetHebdo(vide)).toBe("Ton point de la semaine sur MySite");
  });
});
