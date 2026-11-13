/**
 * Mise en forme des e-mails MySite : une version HTML aux couleurs de la marque (en-tête « MySite », emoji, bouton)
 * et une version texte équivalente, pour les messageries qui n'affichent pas le HTML.
 * Sans effet de bord (testé). Tout texte venant d'une personne (prénom, adresse d'un site…) est échappé.
 * Les modèles d'e-mails de Supabase (confirmation d'inscription, mot de passe oublié…) sont produits avec ce même gabarit.
 */

export interface ContenuEmail {
  emoji: string;
  titre: string;
  paragraphes: string[];
  liste?: string[];
  bouton?: { texte: string; url: string };
  /** Petit texte sous le bouton (rappel légal, précision). */
  note?: string;
}

export interface PiedEmail { site: string; contact?: string }

export function echapper(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Adresse de bouton : https uniquement (ou un modèle Supabase « {{ .X }} ») ; sinon le bouton est retiré. */
function urlSure(u: string): string | null {
  return /^https:\/\/[^\s"'<>]+$/.test(u) || /^\{\{ \.[A-Za-z]+ \}\}$/.test(u) ? u : null;
}

const POLICE = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function emailHtml(c: ContenuEmail, pied: PiedEmail): string {
  const p = (t: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2b3045">${echapper(t)}</p>`;
  const url = c.bouton ? urlSure(c.bouton.url) : null;
  const liste = c.liste?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;width:100%">${c.liste.map((x, i) => `<tr><td style="vertical-align:top;padding:6px 12px 6px 0;width:28px"><span style="display:inline-block;width:26px;height:26px;line-height:26px;border-radius:50%;background:#efeaff;color:#6d4aff;font-weight:700;font-size:14px;text-align:center">${i + 1}</span></td><td style="padding:6px 0;font-size:15px;line-height:1.5;color:#2b3045">${echapper(x)}</td></tr>`).join("")}</table>`
    : "";
  const bouton = url && c.bouton
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px"><tr><td style="border-radius:999px;background:#6d4aff;background-image:linear-gradient(120deg,#6d4aff,#3b5bfd 50%,#0ea5c6)"><a href="${url}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${echapper(c.bouton.texte)}</a></td></tr></table>`
    : "";
  const note = c.note ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#5f6680">${echapper(c.note)}</p>` : "";
  const site = echapper(pied.site.replace(/^https?:\/\//, "").replace(/\/$/, ""));
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${echapper(c.titre)}</title></head>
<body style="margin:0;padding:0;background:#f4f2ff;${POLICE}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ff;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px -12px rgba(43,48,90,.25)">
<tr><td style="background:#6d4aff;background-image:linear-gradient(120deg,#6d4aff,#3b5bfd 45%,#0ea5c6);padding:22px 28px">
<span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-.02em">✨ MySite</span></td></tr>
<tr><td style="padding:32px 28px 12px">
<div style="font-size:44px;line-height:1;margin:0 0 14px">${c.emoji}</div>
<h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;color:#0f1222;letter-spacing:-.02em">${echapper(c.titre)}</h1>
${c.paragraphes.map(p).join("\n")}
${liste}${bouton}${note}
</td></tr>
<tr><td style="padding:18px 28px 26px;border-top:1px solid #ece9f7">
<p style="margin:0;font-size:13px;line-height:1.6;color:#5f6680">À très vite sur MySite 💜<br><a href="${echapper(pied.site)}" style="color:#6d4aff;text-decoration:none">${site}</a>${pied.contact ? ` · <a href="mailto:${echapper(pied.contact)}" style="color:#6d4aff;text-decoration:none">${echapper(pied.contact)}</a>` : ""}</p>
</td></tr></table>
</td></tr></table>
</body></html>`;
}

export function emailTexte(c: ContenuEmail, pied: PiedEmail): string {
  const blocs = [`${c.emoji} ${c.titre}`, ...c.paragraphes];
  if (c.liste?.length) blocs.push(c.liste.map((x, i) => `${i + 1}. ${x}`).join("\n"));
  if (c.bouton) blocs.push(`👉 ${c.bouton.texte} : ${c.bouton.url}`);
  if (c.note) blocs.push(c.note);
  blocs.push(`—\nÀ très vite sur MySite 💜\n${pied.site}${pied.contact ? `\nContact : ${pied.contact}` : ""}`);
  return blocs.join("\n\n");
}
