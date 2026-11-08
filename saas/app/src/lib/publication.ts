/**
 * Mise en ligne des sites finaux : adresse (sous-domaine MySite), nom de domaine du client, mentions légales.
 * Fonctions pures (testées) ; l'accès à la base et à Vercel est dans les routes.
 */
export const RESERVES = new Set(["www", "app", "api", "admin", "mail", "smtp", "ftp", "blog", "aide", "support", "mysite", "static", "cdn", "test", "demo", "status", "docs", "compte", "espace", "connexion"]);

/** Adresse lisible et valide : « Pizza Bella » à Lyon → pizza-bella-lyon. */
export function slugDepuis(nom: string, ville?: string | null): string {
  const base = `${nom} ${ville ?? ""}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&/g, " et ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
  return base.length >= 3 ? base : `site-${base || "client"}`;
}

export function slugValide(s: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$/.test(s) && !s.includes("--") && !RESERVES.has(s);
}

/** Nom de domaine saisi par l'utilisateur → forme normalisée (sans http, sans chemin), ou null s'il est invalide. */
export function normaliserDomaine(v: string): string | null {
  const d = v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
  if (!/^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/.test(d) || d.length > 253) return null;
  return d;
}

/** Domaine « nu » (pizzabella.fr) ou sous-domaine (www.pizzabella.fr) : les réglages DNS diffèrent. */
export const estApex = (d: string) => d.split(".").length === 2 || /\.(co|com|org|gouv|asso)\.[a-z]{2}$/.test(d) && d.split(".").length === 3;

/** Réglages DNS à saisir chez le registraire du client (valeurs documentées par Vercel). */
export function reglagesDNS(domaine: string): { type: "A" | "CNAME"; nom: string; valeur: string }[] {
  const apex = estApex(domaine);
  const racine = apex ? domaine : domaine.split(".").slice(1).join(".");
  return apex
    ? [{ type: "A", nom: "@ (vide)", valeur: "76.76.21.21" }, { type: "CNAME", nom: "www", valeur: "cname.vercel-dns.com" }]
    : [{ type: "CNAME", nom: domaine.slice(0, -(racine.length + 1)), valeur: "cname.vercel-dns.com" }];
}

/** Idées de noms de domaine à proposer au gérant (disponibilité vérifiée ensuite). */
export function ideesDomaines(nom: string, ville?: string | null): string[] {
  const n = slugDepuis(nom, null).replace(/^site-/, ""), v = ville ? slugDepuis(ville, null) : "";
  const court = n.replace(/-/g, "");
  const idees = [`${n}.fr`, `${court}.fr`, v ? `${n}-${v}.fr` : "", `${n}.com`, v ? `${court}-${v}.fr` : ""].filter(Boolean);
  return [...new Set(idees)].filter((d) => normaliserDomaine(d) === d).slice(0, 5);
}

export interface Mentions {
  editeur: string;          // nom ou raison sociale du commerce
  forme?: string;           // ex. « Entreprise individuelle », « SARL au capital de 5 000 € »
  siret?: string;
  adresse: string;
  telephone?: string;
  email?: string;
  directeur: string;        // directeur de la publication (le gérant)
  realisation?: string;     // « Site réalisé par … » (facultatif)
}

export interface Hebergeur { nom: string; adresse: string; telephone?: string }

export function hebergeurParDefaut(env: Record<string, string | undefined> = process.env): Hebergeur {
  return {
    nom: env.HEBERGEUR_NOM || "Vercel Inc.",
    adresse: env.HEBERGEUR_ADRESSE || "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    telephone: env.HEBERGEUR_TELEPHONE || undefined,
  };
}

const h = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function mentionsManquantes(m: Partial<Mentions>): string[] {
  const manque: string[] = [];
  if (!m.editeur?.trim()) manque.push("nom de l'éditeur (le commerce)");
  if (!m.adresse?.trim()) manque.push("adresse");
  if (!m.directeur?.trim()) manque.push("directeur de la publication");
  if (!m.telephone?.trim() && !m.email?.trim()) manque.push("téléphone ou e-mail de contact");
  return manque;
}

/**
 * Ajoute au site les mentions légales (loi pour la confiance dans l'économie numérique, art. 6)
 * et une politique de confidentialité honnête : le site ne dépose aucun cookie et la carte Google ne se charge qu'au clic.
 */
export function insererMentions(html: string, m: Mentions, heb: Hebergeur): string {
  const lignes = [
    `<p><b>Éditeur</b> : ${h(m.editeur)}${m.forme ? `, ${h(m.forme)}` : ""}${m.siret ? `, SIRET ${h(m.siret)}` : ""}<br>${h(m.adresse)}${m.telephone ? `<br>Tél. ${h(m.telephone)}` : ""}${m.email ? `<br>${h(m.email)}` : ""}</p>`,
    `<p><b>Directeur de la publication</b> : ${h(m.directeur)}</p>`,
    `<p><b>Hébergeur</b> : ${h(heb.nom)}, ${h(heb.adresse)}${heb.telephone ? `, tél. ${h(heb.telephone)}` : ""}</p>`,
    m.realisation ? `<p><b>Réalisation</b> : ${h(m.realisation)}</p>` : "",
    `<p><b>Confidentialité</b> : ce site ne dépose aucun cookie et ne collecte aucune donnée personnelle. La carte Google Maps ne se charge que si vous cliquez pour l'afficher ; Google applique alors sa propre politique de confidentialité. Pour toute question : ${h(m.email || m.telephone || m.adresse)}.</p>`,
    `<p><b>Propriété intellectuelle</b> : textes et photos appartiennent à leurs auteurs respectifs ; toute reproduction sans autorisation est interdite.</p>`,
  ].join("");
  const bloc = `<details id="mentions-legales" style="margin-top:1rem;font-size:.85rem;line-height:1.55"><summary style="cursor:pointer;font-weight:700">Mentions légales et confidentialité</summary><div style="padding-top:.6rem">${lignes}</div></details>`;
  let out = html.replace("<span>Mentions légales et confidentialité : page fournie à la mise en ligne.</span>",
    `<span><a href="#mentions-legales" onclick="document.getElementById('mentions-legales').open=true">Mentions légales et confidentialité</a></span>`);
  const i = out.lastIndexOf("</div></footer>");
  out = i >= 0 ? out.slice(0, i) + bloc + out.slice(i) : out.replace("</body>", bloc + "</body>");
  return out;
}

/** Adresse publique d'un site publié. */
export function urlPublique(slug: string, domaine?: string | null, env: Record<string, string | undefined> = process.env): string {
  if (domaine) return `https://${domaine}`;
  const racine = env.NEXT_PUBLIC_DOMAINE_SITES;
  return racine ? `https://${slug}.${racine}` : `${env.NEXT_PUBLIC_SITE_URL ?? ""}/s/${slug}`;
}

/**
 * Le proxy reçoit toutes les requêtes : celles qui arrivent sur un sous-domaine de sites (pizza-bella.mysite.site)
 * ou sur le nom de domaine d'un client (pizzabella.fr) affichent le site publié au lieu de l'application.
 */
export function hoteDeSite(host: string, env: Record<string, string | undefined> = process.env): { slug: string } | { domaine: string } | null {
  const hote = host.toLowerCase().split(":")[0];
  if (!hote || hote === "localhost" || /^[\d.]+$/.test(hote) || hote.endsWith(".vercel.app")) return null;
  let app = "";
  try { app = env.NEXT_PUBLIC_SITE_URL ? new URL(env.NEXT_PUBLIC_SITE_URL).hostname : ""; } catch { app = ""; }
  if (!app || hote === app || hote === `www.${app}`) return null;
  const racine = env.NEXT_PUBLIC_DOMAINE_SITES;
  if (racine && (hote === racine || hote === `www.${racine}`)) return null;
  if (racine && hote.endsWith(`.${racine}`)) {
    const label = hote.slice(0, -(racine.length + 1));
    return !label.includes(".") && slugValide(label) ? { slug: label } : null;
  }
  return normaliserDomaine(hote) ? { domaine: hote } : null;
}
