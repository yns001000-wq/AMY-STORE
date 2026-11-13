/**
 * Produit les modèles d'e-mails de Supabase (inscription, mot de passe oublié…) avec le gabarit MySite.
 * Usage : npx tsx scripts/modeles-supabase.ts > modeles.json, puis envoi à l'API de gestion de Supabase (PATCH /v1/projects/<ref>/config/auth).
 * Les {{ .X }} sont remplacés par Supabase à l'envoi.
 */
import { emailHtml, type ContenuEmail } from "../src/lib/email-gabarit";

const pied = { site: process.env.SITE ?? "https://mysite-app.com", contact: process.env.CONTACT || undefined };
const m: Record<string, [string, ContenuEmail]> = {
  confirmation: ["✨ Confirme ton adresse pour ouvrir ton cockpit MySite", {
    emoji: "👋", titre: "Plus qu'un clic pour commencer !",
    paragraphes: ["Merci de t'être inscrit sur MySite, l'outil pour vendre des sites web aux commerces de ta ville.", "Confirme ton adresse e-mail pour ouvrir ton cockpit et trouver tes premiers commerces. 🚀"],
    bouton: { texte: "Confirmer mon adresse", url: "{{ .ConfirmationURL }}" },
    note: "Tu n'es pas à l'origine de cette inscription ? Ignore simplement cet e-mail : aucun compte ne sera activé.",
  }],
  recovery: ["🔑 Choisis ton nouveau mot de passe MySite", {
    emoji: "🔑", titre: "Nouveau mot de passe",
    paragraphes: ["Tu as demandé à changer le mot de passe de ton compte MySite.", "Clique sur le bouton pour en choisir un nouveau. Le lien n'est valable que peu de temps."],
    bouton: { texte: "Choisir un nouveau mot de passe", url: "{{ .ConfirmationURL }}" },
    note: "Ce n'est pas toi ? Ignore cet e-mail : ton mot de passe actuel reste valable.",
  }],
  magic_link: ["🔗 Ton lien de connexion MySite", {
    emoji: "🔗", titre: "Connexion à MySite",
    paragraphes: ["Voici ton lien pour te connecter à ton cockpit MySite."],
    bouton: { texte: "Me connecter", url: "{{ .ConfirmationURL }}" },
    note: "Ce n'est pas toi ? Ignore cet e-mail.",
  }],
  email_change: ["📧 Confirme ta nouvelle adresse MySite", {
    emoji: "📧", titre: "Confirme ta nouvelle adresse",
    paragraphes: ["Tu as demandé à changer l'adresse e-mail de ton compte MySite.", "Confirme cette nouvelle adresse pour l'utiliser."],
    bouton: { texte: "Confirmer la nouvelle adresse", url: "{{ .ConfirmationURL }}" },
    note: "Ce n'est pas toi ? Ignore cet e-mail et change ton mot de passe par prudence.",
  }],
  invite: ["💌 Tu es invité sur MySite", {
    emoji: "💌", titre: "Bienvenue dans l'équipe !",
    paragraphes: ["Tu as été invité à rejoindre un compte MySite. Accepte l'invitation pour créer ton accès."],
    bouton: { texte: "Accepter l'invitation", url: "{{ .ConfirmationURL }}" },
  }],
  reauthentication: ["🔐 Ton code de vérification MySite : {{ .Token }}", {
    emoji: "🔐", titre: "Ton code de vérification",
    paragraphes: ["Saisis ce code dans MySite pour confirmer qu'il s'agit bien de toi :", "{{ .Token }}"],
    note: "Ce n'est pas toi ? Ignore cet e-mail.",
  }],
  password_changed_notification: ["🔒 Ton mot de passe MySite a été changé", {
    emoji: "🔒", titre: "Mot de passe modifié",
    paragraphes: ["Le mot de passe de ton compte MySite vient d'être changé.", "Si c'est toi, tout va bien. 👍 Sinon, utilise « Mot de passe oublié » sur la page de connexion pour reprendre la main, et écris-nous."],
    bouton: { texte: "Aller sur MySite", url: `${pied.site}/connexion` },
  }],
  email_changed_notification: ["📧 L'adresse de ton compte MySite a été changée", {
    emoji: "📧", titre: "Adresse e-mail modifiée",
    paragraphes: ["L'adresse e-mail de ton compte MySite a été changée pour {{ .Email }}.", "Si ce n'est pas toi, écris-nous au plus vite."],
  }],
};
const conf: Record<string, string> = {};
for (const [cle, [sujet, contenu]] of Object.entries(m)) {
  conf[`mailer_subjects_${cle}`] = sujet;
  conf[`mailer_templates_${cle}_content`] = emailHtml(contenu, pied);
}
process.stdout.write(JSON.stringify(conf));
