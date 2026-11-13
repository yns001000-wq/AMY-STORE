import "server-only";
import { emailHtml, emailTexte, type ContenuEmail } from "./email-gabarit";

/**
 * Envoi d'e-mails transactionnels (bienvenue, confirmation de résiliation, rappel de reconduction…), via l'API de Resend.
 * Facultatif : sans RESEND_API_KEY, rien n'est envoyé et la fonction renvoie false (la confirmation reste affichée à l'écran
 * et enregistrée dans le journal de conformité). Un e-mail est le « support durable » attendu par la loi : configurez-le avant le lancement.
 * Un contenu structuré part en HTML aux couleurs de MySite, avec sa version texte ; une simple chaîne part en texte brut (messages internes).
 */
export async function envoyerEmail(a: string, sujet: string, contenu: ContenuEmail | string): Promise<boolean> {
  const cle = process.env.RESEND_API_KEY, de = process.env.EMAIL_EXPEDITEUR;
  if (!cle || !de || !a) return false;
  const pied = { site: process.env.NEXT_PUBLIC_SITE_URL ?? "", contact: process.env.CONTACT_EMAIL || undefined };
  const corps = typeof contenu === "string" ? { text: contenu } : { text: emailTexte(contenu, pied), html: emailHtml(contenu, pied) };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: de, to: [a], subject: sujet, ...corps }),
    });
    return r.ok;
  } catch { return false; }
}

export const signature = () => `\n\n—\nMySite · ${process.env.NEXT_PUBLIC_SITE_URL ?? ""}\nContact : ${process.env.CONTACT_EMAIL ?? ""}`;
export const urlSite = (chemin = "") => `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}${chemin}`;
