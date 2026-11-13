import { describe, expect, it } from "vitest";
import { echapper, emailHtml, emailTexte } from "./email-gabarit";

const pied = { site: "https://mysite-app.com", contact: "contact@exemple.fr" };

describe("gabarit des e-mails", () => {
  it("affiche la marque, l'emoji, le titre, la liste et le bouton", () => {
    const h = emailHtml({ emoji: "🎉", titre: "Bienvenue", paragraphes: ["Bonjour"], liste: ["Un", "Deux"], bouton: { texte: "Ouvrir", url: "https://mysite-app.com/espace" } }, pied);
    expect(h).toContain("MySite");
    expect(h).toContain("🎉");
    expect(h).toContain(">Bienvenue</h1>");
    expect(h).toContain('href="https://mysite-app.com/espace"');
    expect(h).toContain("mysite-app.com</a>");
  });
  it("échappe tout texte venant d'une personne", () => {
    const h = emailHtml({ emoji: "✅", titre: "Bonjour <script>", paragraphes: ['Site "x" & <b>y</b>'] }, pied);
    expect(h).not.toContain("<script>");
    expect(h).toContain("&lt;script&gt;");
    expect(h).toContain("&quot;x&quot; &amp; &lt;b&gt;");
    expect(echapper("a'b")).toBe("a&#39;b");
  });
  it("retire un bouton dont l'adresse n'est pas sûre, garde les modèles Supabase", () => {
    expect(emailHtml({ emoji: "x", titre: "t", paragraphes: [], bouton: { texte: "Clic", url: "javascript:alert(1)" } }, pied)).not.toContain("javascript:");
    expect(emailHtml({ emoji: "x", titre: "t", paragraphes: [], bouton: { texte: "Confirmer", url: "{{ .ConfirmationURL }}" } }, pied)).toContain('href="{{ .ConfirmationURL }}"');
  });
  it("produit une version texte équivalente", () => {
    const t = emailTexte({ emoji: "✅", titre: "Confirmé", paragraphes: ["Ligne"], liste: ["A"], bouton: { texte: "Voir", url: "https://mysite-app.com" }, note: "Garde-le" }, pied);
    expect(t).toBe("✅ Confirmé\n\nLigne\n\n1. A\n\n👉 Voir : https://mysite-app.com\n\nGarde-le\n\n—\nÀ très vite sur MySite 💜\nhttps://mysite-app.com\nContact : contact@exemple.fr");
  });
});
