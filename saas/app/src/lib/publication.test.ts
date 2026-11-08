import { describe, expect, it } from "vitest";
import { ideesDomaines, insererMentions, mentionsManquantes, normaliserDomaine, reglagesDNS, slugDepuis, slugValide, urlPublique } from "./publication";
import { rendreSite, siteExpress } from "./studio";
import { PLANS } from "./plans";

describe("mise en ligne", () => {
  it("fabrique une adresse lisible et valide", () => {
    expect(slugDepuis("Pizza Bella", "Lyon")).toBe("pizza-bella-lyon");
    expect(slugDepuis("L'Écrin & Co", "Saint-Étienne")).toBe("l-ecrin-et-co-saint-etienne");
    expect(slugValide("pizza-bella-lyon")).toBe(true);
    expect(slugValide("www")).toBe(false);
    expect(slugValide("-x")).toBe(false);
    expect(slugValide("a--b")).toBe(false);
  });
  it("normalise le nom de domaine du client et donne les bons réglages DNS", () => {
    expect(normaliserDomaine(" https://PizzaBella.fr/accueil ")).toBe("pizzabella.fr");
    expect(normaliserDomaine("pas un domaine")).toBeNull();
    expect(reglagesDNS("pizzabella.fr").map((r) => r.type)).toEqual(["A", "CNAME"]);
    expect(reglagesDNS("www.pizzabella.fr")).toEqual([{ type: "CNAME", nom: "www", valeur: "cname.vercel-dns.com" }]);
    expect(ideesDomaines("Pizza Bella", "Lyon")).toEqual(["pizza-bella.fr", "pizzabella.fr", "pizza-bella-lyon.fr", "pizza-bella.com", "pizzabella-lyon.fr"]);
  });
  it("exige les mentions légales et les insère dans le site final", () => {
    expect(mentionsManquantes({ editeur: "Pizza Bella" })).toEqual(["adresse", "directeur de la publication", "téléphone ou e-mail de contact"]);
    const d = { ...siteExpress({ nom: "Pizza Bella", metier: "Pizzeria", ville: "Lyon" }), maquette: false };
    const html = insererMentions(rendreSite(d, PLANS.pro.studio), { editeur: "Pizza Bella <script>", adresse: "12 rue Paul Bert, 69003 Lyon", directeur: "M. Rossi", telephone: "06 12 34 56 78", siret: "123" }, { nom: "Vercel Inc.", adresse: "Covina" });
    expect(html).toContain('id="mentions-legales"');
    expect(html).toContain("Directeur de la publication");
    expect(html).toContain("Pizza Bella &lt;script&gt;");
    expect(html).not.toContain("page fournie à la mise en ligne");
    expect(html).not.toContain('content="noindex"');
    expect(html).not.toContain("Maquette de démonstration");
  });
  it("donne l'adresse publique", () => {
    expect(urlPublique("pizza-bella-lyon", null, { NEXT_PUBLIC_DOMAINE_SITES: "mysite.site" })).toBe("https://pizza-bella-lyon.mysite.site");
    expect(urlPublique("x", "pizzabella.fr", {})).toBe("https://pizzabella.fr");
  });
});

describe("aiguillage des hôtes", () => {
  const env = { NEXT_PUBLIC_SITE_URL: "https://app.mysite.fr", NEXT_PUBLIC_DOMAINE_SITES: "mysite.site" };
  it("sert l'application sur son domaine et en local", async () => {
    const { hoteDeSite } = await import("./publication");
    expect(hoteDeSite("app.mysite.fr", env)).toBeNull();
    expect(hoteDeSite("localhost:3000", env)).toBeNull();
    expect(hoteDeSite("projet-abc.vercel.app", env)).toBeNull();
    expect(hoteDeSite("pizzabella.fr", {})).toBeNull();
  });
  it("sert les sites publiés sur leur sous-domaine ou le domaine du client", async () => {
    const { hoteDeSite } = await import("./publication");
    expect(hoteDeSite("pizza-bella-lyon.mysite.site", env)).toEqual({ slug: "pizza-bella-lyon" });
    expect(hoteDeSite("www.mysite.site", env)).toBeNull();
    expect(hoteDeSite("a.b.mysite.site", env)).toBeNull();
    expect(hoteDeSite("www.pizzabella.fr", env)).toEqual({ domaine: "www.pizzabella.fr" });
  });
});
