import { describe, expect, it } from "vitest";
import { PLANS } from "../plans";
import { appliquerEdition, appliquerIA, promptRetouche, blocPhotosPerso, familleDepuisMetier, lireJSON, PALETTES, photosPourCommerce, poserPhotosCommerce, remplacerClesPerso, promptEtude, promptRedaction, rendreSite, siteDepuisIA, siteExpress } from "./index";

const p = { nom: "Pizza Bella (M. Rossi)", metier: "Pizzeria", ville: "Lyon", code_postal: "69003", adresse: "12 rue Paul Bert 69003 Lyon", telephone: "06 12 34 56 78" };
const cap = (id: keyof typeof PLANS) => PLANS[id].studio;

describe("Studio : maquette express", () => {
  it("produit une maquette complète, sans IA, avec les faits de la fiche", () => {
    const d = siteExpress(p);
    expect(d.famille).toBe("pizzeria");
    expect(d.nom).toBe("Pizza Bella");
    expect(d.adresse).toBe("12 rue Paul Bert");
    expect(d.accueil.h1).toBe("Pizzeria");
    expect(d.accueil.photo).toMatch(/^\/photos\//);
    expect(d.offre.onglets.length).toBeGreaterThan(0);
    expect(rendreSite(d, cap("gratuit"))).toContain("Fait avec MySite");
    expect(rendreSite(d, cap("ultra"))).not.toContain("MySite");
  });
  it("devine la famille depuis le métier déclaré", () => {
    expect(familleDepuisMetier("Restauration de type rapide")).toBe("rapide");
    expect(familleDepuisMetier("Sushi bar")).toBe("asiatique");
    expect(familleDepuisMetier("Coiffure")).toBe("beaute");
    expect(familleDepuisMetier("Plombier")).toBe("artisan");
  });
});

describe("Studio : panneau de modification selon l'offre", () => {
  const d0 = siteExpress(p);
  it("Gratuit : textes principaux et palettes, mais pas la carte, les couleurs libres, le modèle ni la police", () => {
    const { d, refuses } = appliquerEdition(d0, {
      accueil: { ...d0.accueil, h1: "Pizzeria au feu de bois" },
      couleurs: { principal: PALETTES[1].principal, accent: PALETTES[1].accent },
      offre: { ...d0.offre, titre: "Piraté" }, famille: "restaurant", police: "gloock", faq: [],
    }, cap("gratuit"));
    expect(d.accueil.h1).toBe("Pizzeria au feu de bois");
    expect(d.couleurs.principal).toBe(PALETTES[1].principal);
    expect(d.offre.titre).toBe(d0.offre.titre);
    expect(d.famille).toBe("pizzeria");
    expect(d.police).toBeUndefined();
    expect(refuses).toEqual(expect.arrayContaining(["offre", "type de site", "police", "faq"]));
    const libre = appliquerEdition(d0, { couleurs: { principal: "#123456", accent: "#654321" } }, cap("gratuit"));
    expect(libre.d.couleurs).toBeUndefined();
    expect(libre.refuses).toContain("couleurs libres");
  });
  it("Pro : carte, horaires, couleurs libres et modèle ; pas de police ni de photos personnelles", () => {
    const { d, refuses } = appliquerEdition(d0, {
      offre: { ...d0.offre, titre: "Nos pizzas" }, couleurs: { principal: "#123456", accent: "#aa3300" }, famille: "restaurant", police: "gloock",
      horaires: { lun: "", mar: "12:00-14:00", mer: "", jeu: "", ven: "", sam: "", dim: "" },
      accueil: { ...d0.accueil, photo: "https://exemple.supabase.co/storage/v1/object/public/studio/u/a.jpg" },
    }, cap("pro"));
    expect(d.offre.titre).toBe("Nos pizzas");
    expect(d.famille).toBe("restaurant");
    expect(d.horaires.mar).toBe("12:00-14:00");
    expect(d.police).toBeUndefined();
    expect(d.accueil.photo).not.toMatch(/^https/);
    expect(refuses).toEqual(expect.arrayContaining(["police", "photos personnelles"]));
  });
  it("Premium : police et photos personnelles", () => {
    const url = "https://exemple.supabase.co/storage/v1/object/public/studio/u/a.jpg";
    const { d, refuses } = appliquerEdition(d0, { police: "bricolage", accueil: { ...d0.accueil, photo: url } }, cap("premium"));
    expect(d.police).toBe("bricolage");
    expect(d.accueil.photo).toBe(url);
    expect(refuses).toEqual([]);
  });
  it("nettoie les faits saisis et revient aux couleurs du modèle", () => {
    const avec = appliquerEdition(d0, { couleurs: { principal: PALETTES[0].principal, accent: PALETTES[0].accent } }, cap("gratuit")).d;
    const { d } = appliquerEdition(avec, { nom: "  <b>Bella</b>  ", couleurs: null }, cap("gratuit"));
    expect(d.nom).toBe("b Bella /b");
    expect(d.couleurs).toBeUndefined();
  });
  it("retouche IA : n'applique que les blocs autorisés et complète les photos", () => {
    const { d } = appliquerIA(d0, { offre: { ...d0.offre, onglets: [{ nom: "Pizzas", articles: [{ nom: "Margherita", desc: "Tomate, mozzarella, basilic", prix: 9 }] }] } }, cap("pro"));
    expect(d.offre.onglets[0].articles[0].nom).toBe("Margherita");
  });
});

describe("Studio : IA", () => {
  it("les consignes imposent les règles légales et le doute sur le code d'activité", () => {
    const e = promptEtude(p, "Vraie salle de restaurant");
    expect(e.systeme).toContain("souvent faux");
    expect(e.contenu).toContain("Vraie salle de restaurant");
    const r = promptRedaction(p, { type: "Pizzeria au feu de bois", famille: "pizzeria" });
    expect(r.systeme).toContain("Aucun avis");
    expect(r.systeme).toContain("ia-pizzeria-");
  });
  it("la partie fixe (mise en cache) ne contient rien du commerce, et ne dépend que du type de site", () => {
    const autre = { ...p, nom: "Chez Marco", ville: "Bron", notes: "Four à bois" };
    const a = promptRedaction(p, { type: "Pizzeria", famille: "pizzeria" }), b = promptRedaction(autre, { type: "Pizzeria napolitaine", famille: "pizzeria" });
    expect(a.systeme).toBe(b.systeme);
    expect(a.systeme).not.toContain(p.nom);
    expect(b.contenu).toContain("Chez Marco");
    const r1 = promptRetouche(siteDepuisIA(p, "pizzeria", {}), "Plus court"), r2 = promptRetouche(siteDepuisIA(autre, "pizzeria", {}), "Ajoute un menu");
    expect(r1.systeme).toBe(r2.systeme);
    expect(r2.contenu).toContain("Ajoute un menu");
  });
  it("lit un JSON entouré de texte et construit le site", () => {
    const j = lireJSON('Voici :\n```json\n{"accueil":{"h1":"Pizzeria","h1_suite":"à Lyon 3e","chapo":"Bienvenue"},"horaires":{"lun":"","mar":"11:45-14:00","mer":"","jeu":"","ven":"","sam":"","dim":""}}\n```');
    const d = siteDepuisIA(p, "pizzeria", j, j.horaires);
    expect(d.accueil.h1_suite).toBe("à Lyon 3e");
    expect(d.horaires.mar).toBe("11:45-14:00");
    expect(() => lireJSON("pas de json")).toThrow();
  });
});

describe("Studio : banque de photos personnelle", () => {
  const ph = (id: string, portee: "commerce" | "tous", prospect_id: string | null, legende = "") => ({ id, url: `https://x.supabase.co/storage/v1/object/public/studio/u/${id}.jpg`, legende, portee, prospect_id });
  const banque = [ph("a", "commerce", "P1", "Devanture"), ph("b", "commerce", "P2", "Salle"), ph("c", "tous", null, "Four à bois"), ph("d", "commerce", "P1", "Salle")];
  it("ne propose jamais les photos d'un autre commerce", () => {
    expect(photosPourCommerce(banque, "P1").map((p) => p.id)).toEqual(["a", "c", "d"]);
    expect(photosPourCommerce(banque, null).map((p) => p.id)).toEqual(["c"]);
  });
  it("présente les photos à l'IA par clés courtes puis remet les vraies adresses", () => {
    const { texte, cles } = blocPhotosPerso(photosPourCommerce(banque, "P1"));
    expect(texte).toContain("perso-1 : Devanture (vraie photo de ce commerce)");
    expect(texte).toContain("photo générique");
    expect(texte).not.toContain("https://");
    const r = remplacerClesPerso({ accueil: { photo: "perso-1" }, maison: { photos: ["perso-3", "ia-pizzeria-four"] }, prix: 9 }, cles);
    expect(r.accueil.photo).toBe(banque[0].url);
    expect(r.maison.photos).toEqual([banque[3].url, "ia-pizzeria-four"]);
    expect(blocPhotosPerso([]).texte).toBe("");
  });
  it("la maquette express place d'office les vraies photos du commerce", () => {
    const d = poserPhotosCommerce(siteExpress(p), photosPourCommerce(banque, "P1"));
    expect(d.accueil.photo).toBe(banque[0].url);
    expect(d.maison.photos).toEqual([banque[3].url]);
    expect(rendreSite(d, cap("premium"))).toContain(banque[0].url);
  });
});
