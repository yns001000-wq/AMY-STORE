/**
 * Studio MySite : API typée autour du moteur de sites (moteur.ts).
 * - maquette express (sans IA, tous les plans) ;
 * - étude d'établissement, rédaction et retouches par l'IA (selon l'offre) ;
 * - édition manuelle filtrée selon les capacités de l'offre.
 */
import * as M from "./moteur";
import type { Consigne } from "../cout-ia";
import { PHOTOS } from "./photos";
import type { CapacitesStudio } from "../plans";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type DonneesSite = Record<string, any>;
const moteur = M as unknown as {
  FAM_SM: Record<string, { lib: string; titre: string; principal: string; accent: string; offre: string; repas: boolean }>;
  POLICES_SM: Record<string, string>;
  ICONES_SM: Record<string, string>;
  normaliserSM: (m: unknown, base: DonneesSite) => DonneesSite;
  completerPhotosSM: (d: DonneesSite, p?: { metier?: string | null }, quoi?: { hero?: boolean; maison?: boolean; listes?: boolean }) => DonneesSite;
  pageSM: (d: DonneesSite, opts?: { filigrane?: boolean; marqueBlanche?: boolean; urlSite?: string }) => string;
  horairesSM: (h: unknown) => Record<string, string> | null;
};

export const FAMILLES = moteur.FAM_SM;
export const POLICES: Record<string, string> = { gloock: "Gloock (élégante)", marcellus: "Marcellus (classique)", archivo: "Archivo (moderne)", bricolage: "Bricolage (affirmée)" };
export const ICONES = Object.keys(moteur.ICONES_SM);
export const SECTIONS: [string, string][] = [["defilant", "Bandeau défilant"], ["vedettes", "Incontournables"], ["maison", "La maison"], ["bande", "Spécialités"], ["faq", "Questions fréquentes"], ["plan", "Plan d'accès"]];
export const JOURS: [string, string][] = [["lun", "Lundi"], ["mar", "Mardi"], ["mer", "Mercredi"], ["jeu", "Jeudi"], ["ven", "Vendredi"], ["sam", "Samedi"], ["dim", "Dimanche"]];

/** Palettes prédéfinies (toutes les offres). Les couleurs libres sont réservées aux offres payantes. */
export const PALETTES: { id: string; nom: string; principal: string; accent: string }[] = [
  { id: "foret", nom: "Forêt et tomate", principal: "#1d4d3a", accent: "#b3372a" },
  { id: "nuit", nom: "Nuit et corail", principal: "#16243a", accent: "#c2391b" },
  { id: "bordeaux", nom: "Bordeaux et cuivre", principal: "#4a1d24", accent: "#a8432f" },
  { id: "ardoise", nom: "Ardoise et orange", principal: "#16324f", accent: "#c2410c" },
  { id: "prune", nom: "Prune et framboise", principal: "#3d2c2e", accent: "#9d4e6a" },
  { id: "charbon", nom: "Charbon et piment", principal: "#1f1d1a", accent: "#c2391b" },
];

export const photoUrl = (cle: string) => PHOTOS[cle]?.[0];
export const BANQUE_PHOTOS = Object.entries(PHOTOS).map(([cle, [url, legende]]) => ({ cle, url, legende }));

/** Famille de site déduite du métier du prospect (corrigée ensuite par l'étude IA). */
export function familleDepuisMetier(metier: string | null | undefined): string {
  const m = (metier ?? "").toLowerCase();
  if (/pizz/.test(m)) return "pizzeria";
  if (/rapide|snack|kebab|tacos|burger/.test(m)) return "rapide";
  if (/sushi|wok|asiat|japon|chin|tha[iï]|vietnam/.test(m)) return "asiatique";
  if (/caf[ée]|bar|salon de th/.test(m)) return "cafe";
  if (/boulang|p[âa]tiss/.test(m)) return "patisserie";
  if (/traiteur/.test(m)) return "traiteur";
  if (/coiff|beaut|esth|ongl/.test(m)) return "beaute";
  if (/restau|brasserie|bistrot/.test(m)) return "restaurant";
  return "artisan";
}

export interface ProspectSite { nom: string; metier?: string | null; ville?: string | null; code_postal?: string | null; adresse?: string | null; telephone?: string | null; email?: string | null; indices?: string | null; notes?: string | null }

/** Données factuelles (viennent de la fiche, jamais de l'IA). */
export function baseSite(p: ProspectSite, famille: string): DonneesSite {
  const adresse = String(p.adresse ?? "").replace(new RegExp(`\\s*${p.code_postal || "#"}.*$`), "").trim();
  return { v: 1, maquette: true, famille, nom: p.nom.replace(/\s*\([^)]*\)/g, ""), ville: p.ville ?? "", code_postal: p.code_postal ?? "", adresse, pays: "FR", telephone: p.telephone ?? "", email: p.email ?? "" };
}

const HORAIRES_TYPE: Record<string, Record<string, string>> = {
  repas: { lun: "11:45-14:00,18:30-22:00", mar: "11:45-14:00,18:30-22:00", mer: "11:45-14:00,18:30-22:00", jeu: "11:45-14:00,18:30-22:00", ven: "11:45-14:00,18:30-22:30", sam: "11:45-14:00,18:30-22:30", dim: "" },
  boutique: { lun: "", mar: "07:00-19:30", mer: "07:00-19:30", jeu: "07:00-19:30", ven: "07:00-19:30", sam: "07:00-19:30", dim: "07:00-13:00" },
  salon: { lun: "", mar: "09:30-19:00", mer: "09:30-19:00", jeu: "09:30-19:00", ven: "09:30-19:00", sam: "09:00-17:00", dim: "" },
  artisan: { lun: "08:00-18:00", mar: "08:00-18:00", mer: "08:00-18:00", jeu: "08:00-18:00", ven: "08:00-18:00", sam: "09:00-12:00", dim: "" },
};

/** Maquette express : contenu d'exemple solide, sans IA (toutes les offres). */
export function siteExpress(p: ProspectSite, famille = familleDepuisMetier(p.metier)): DonneesSite {
  const F = FAMILLES[famille] ?? FAMILLES.artisan, v = p.ville || "votre ville";
  const repas = F.repas, metier = p.metier || F.lib.split(",")[0];
  const offre = repas
    ? { nav: "La carte", surtitre: "Fait maison", titre: "La carte", texte: "Carte d'exemple : à remplacer par la vôtre.", pied: "Prix TTC. Allergènes sur demande.",
        onglets: [{ nom: "Nos plats", articles: [{ nom: "Plat signature", desc: "Votre spécialité, décrite en une phrase.", prix: 14 }, { nom: "Plat du moment", desc: "Selon le marché et la saison.", prix: 12.5 }, { nom: "Formule midi", desc: "Plat et boisson.", prix: 13.9 }] },
          { nom: "Desserts", articles: [{ nom: "Dessert maison", desc: "La gourmandise de la maison.", prix: 5.5 }] }] }
    : { nav: F.offre, surtitre: "Nos prestations", titre: F.offre, texte: "Prestations et tarifs d'exemple : à remplacer par les vôtres.", pied: "Devis gratuit et sans engagement.",
        onglets: [{ nom: "Prestations", articles: [{ nom: "Prestation principale", desc: "Ce que vous faites le mieux.", prix: "Sur devis" }, { nom: "Intervention rapide", desc: "Pour les besoins urgents.", prix: "Dès 60 €" }, { nom: "Conseil et devis", desc: "On étudie votre besoin ensemble.", prix: "Gratuit" }] }] };
  const d = moteur.normaliserSM({
    activite: metier, title: `${p.nom} · ${metier} à ${v}`, meta_description: `${p.nom}, ${metier.toLowerCase()} à ${v}. Horaires, adresse et contact.`,
    accueil: { h1: metier, h1_suite: `à ${v}`, chapo: `${p.nom} vous accueille à ${v}. Une présentation claire, vos horaires et votre numéro accessibles en un geste depuis un téléphone.`, atouts: repas ? ["Fait maison", "Sur place", "À emporter", "Accueil chaleureux"] : ["Devis gratuit", "Travail soigné", "Réponse rapide", "Prix annoncé"], etiquette: null, photo: "" },
    defilant: [`${metier} à ${v}`, "Accueil chaleureux", repas ? "Produits frais" : "Devis gratuit", "Appelez-nous", "Près de chez vous"],
    vedettes: { surtitre: "À découvrir", titre: "Nos incontournables", articles: offre.onglets[0].articles.slice(0, 3).map((a) => ({ ...a, photo: "" })) },
    offre,
    maison: { surtitre: "La maison", titre: `${p.nom}, à ${v}`, texte: "Présentez ici votre histoire, votre façon de travailler et ce que vos clients apprécient. (Texte d'exemple.)", engagements: [{ titre: "Qualité", texte: "Un travail soigné, sans compromis.", icone: "etoile" }, { titre: "Proximité", texte: "Une adresse de quartier, à votre écoute.", icone: "coeur" }], signature: "À bientôt !", photos: [] },
    bande: null,
    infos: { texte: `Retrouvez-nous à ${v}.`, acces: [], bon_a_savoir: repas ? ["Sur place et à emporter", "Paiement par carte"] : ["Devis gratuit", "Paiement par carte ou virement"] },
    horaires: repas ? HORAIRES_TYPE.repas : famille === "patisserie" || famille === "cafe" ? HORAIRES_TYPE.boutique : famille === "beaute" ? HORAIRES_TYPE.salon : HORAIRES_TYPE.artisan,
    faq: [{ q: "Comment vous joindre ?", r: "Par téléphone aux heures d'ouverture, ou par e-mail." }, { q: "Où vous trouver ?", r: `À ${v} : l'adresse et l'itinéraire sont en bas de page.` }],
    final: { titre: "Une question ? Appelez-nous.", texte: "Nous vous répondons avec plaisir." },
    a_verifier: ["Tous les textes, prix et horaires sont des exemples à remplacer"],
  }, baseSite(p, famille));
  return moteur.completerPhotosSM(d, p);
}

/** Rendu de la page selon l'offre (filigrane gratuit, marque blanche Ultra). */
export function rendreSite(d: DonneesSite, cap: CapacitesStudio, urlSite?: string): string {
  return moteur.pageSM(d, { filigrane: cap.filigrane, marqueBlanche: cap.marqueBlanche, urlSite });
}

const CHAMPS_FAITS: [string, number][] = [["nom", 80], ["telephone", 30], ["email", 120], ["adresse", 160], ["code_postal", 10], ["ville", 80], ["facebook", 200]];
const BLOCS_SIMPLES = ["accueil", "maison", "final", "defilant", "masquer", "couleurs"];

/**
 * Applique une édition manuelle en respectant l'offre :
 * - toutes les offres : faits (nom, téléphone…), textes principaux, sections affichées, palettes prédéfinies ;
 * - offres payantes : carte/services, horaires, FAQ, infos, couleurs libres, type de site ;
 * - Premium et Ultra : police des titres, photos envoyées par le client.
 */
export function appliquerEdition(ancien: DonneesSite, edition: Record<string, unknown>, cap: CapacitesStudio): { d: DonneesSite; refuses: string[] } {
  const refuses: string[] = [], m: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(edition)) {
    if (CHAMPS_FAITS.some(([c]) => c === k)) continue;
    if (k === "famille" && !cap.choixModele) { refuses.push("type de site"); continue; }
    if (k === "police" && !cap.polices) { refuses.push("police"); continue; }
    if (!cap.editionComplete && !BLOCS_SIMPLES.includes(k) && k !== "famille" && k !== "police") { refuses.push(k); continue; }
    m[k] = v;
  }
  if (m.couleurs && !cap.couleursLibres) {
    const c = m.couleurs as { principal?: string; accent?: string };
    if (!PALETTES.some((p) => p.principal === c.principal && p.accent === c.accent)) { delete m.couleurs; refuses.push("couleurs libres"); }
  }
  if (!cap.photosPerso) retirerPhotosExternes(m, refuses);
  const d = moteur.normaliserSM(m, ancien);
  if (edition.couleurs === null) delete d.couleurs;
  for (const [c, n] of CHAMPS_FAITS) if (typeof edition[c] === "string") d[c] = String(edition[c]).replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, n);
  return { d, refuses: [...new Set(refuses)] };
}

/** Photos hors banque (envoyées par le client) : réservées aux offres Premium et Ultra. Parcourt tous les blocs. */
function retirerPhotosExternes(m: Record<string, any>, refuses: string[]) {
  const ext = (s: unknown) => typeof s === "string" && /^https:\/\//.test(s);
  const nettoyer = (o: any): any => {
    if (Array.isArray(o)) return o.map(nettoyer);
    if (!o || typeof o !== "object") return o;
    const r: Record<string, any> = {};
    for (const [k, v] of Object.entries(o)) {
      if (k === "photo" && ext(v)) { r[k] = ""; refuses.push("photos personnelles"); }
      else if (k === "photos" && Array.isArray(v) && v.some(ext)) { r[k] = v.filter((x) => !ext(x)); refuses.push("photos personnelles"); }
      else r[k] = nettoyer(v);
    }
    return r;
  };
  for (const k of Object.keys(m)) m[k] = nettoyer(m[k]);
}

/* ------------------------- Banque de photos personnelle ------------------------- */
export interface PhotoPerso { id: string; url: string; legende: string; portee: "commerce" | "tous"; prospect_id: string | null; prospect_nom?: string | null }

/** Photos utilisables sur le site d'un commerce : les siennes, plus les photos « tous mes sites ». Jamais celles d'un autre commerce. */
export function photosPourCommerce(photos: PhotoPerso[], prospectId: string | null | undefined): PhotoPerso[] {
  return photos.filter((p) => p.portee === "tous" || (!!prospectId && p.prospect_id === prospectId));
}

/** Présente les photos de l'utilisateur à l'IA sous forme de clés courtes (perso-1…), remplacées ensuite par les vraies adresses. */
export function blocPhotosPerso(photos: PhotoPerso[]): { texte: string; cles: Record<string, string> } {
  if (!photos.length) return { texte: "", cles: {} };
  const cles: Record<string, string> = {};
  const lignes = photos.slice(0, 40).map((p, i) => {
    cles[`perso-${i + 1}`] = p.url;
    return `- perso-${i + 1} : ${p.legende.replace(/[\n\r]/g, " ") || "sans légende"} (${p.portee === "commerce" ? "vraie photo de ce commerce" : "photo générique de l'utilisateur"})`;
  });
  return { texte: `VRAIES PHOTOS fournies par l'utilisateur : à PRIVILÉGIER sur la banque (surtout accueil.photo et maison.photos), si la légende correspond à l'emplacement.\n${lignes.join("\n")}\n\n`, cles };
}

/** Remplace, dans une réponse de l'IA, les clés perso-N par l'adresse de la photo. */
export function remplacerClesPerso<T>(o: T, cles: Record<string, string>): T {
  if (typeof o === "string") return (cles[o] ?? o) as T;
  if (Array.isArray(o)) return o.map((x) => remplacerClesPerso(x, cles)) as T;
  if (o && typeof o === "object") return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, remplacerClesPerso(v, cles)])) as T;
  return o;
}

/** Maquette express : place automatiquement les vraies photos du commerce (accueil, puis la maison). */
export function poserPhotosCommerce(d: DonneesSite, photos: PhotoPerso[]): DonneesSite {
  const urls = photos.filter((p) => p.portee === "commerce").map((p) => p.url);
  if (!urls.length) return d;
  if (d.accueil) d.accueil.photo = urls[0];
  if (d.maison && urls.length > 1) d.maison.photos = urls.slice(1, 3);
  return d;
}

/* ------------------------------ Prompts IA ------------------------------ */
const CONTEXTE = "MySite aide des indépendants à vendre des sites vitrines aux commerces et artisans locaux. Règles : aucune promesse de résultat, aucun avis client, aucune statistique, aucun fait invérifiable présenté comme vrai.";
const listePhotos = () => Object.entries(PHOTOS).map(([k, [, l]]) => `- ${k} : ${l}`).join("\n");
const dossier = (p: ProspectSite) => [`Nom : ${p.nom}`, `Métier déclaré : ${p.metier ?? "?"}`, `Adresse : ${[p.adresse, p.code_postal, p.ville].filter(Boolean).join(" ")}`, `Indices publics : ${p.indices ?? "aucun"}`, `Notes de l'utilisateur : ${(p.notes ?? "aucune").slice(0, 1500)}`].join("\n");

export function promptEtude(p: ProspectSite, precisions?: string): Consigne {
  const systeme = `${CONTEXTE}\n\nTu es l'analyste de MySite. Détermine ce qu'est VRAIMENT cet établissement avant de créer son site. Le code d'activité déclaré est souvent faux (beaucoup de « restauration rapide » sont des restaurants, et inversement) : ne le crois pas sur parole.\n\n`
    + `Pèse les indices : précisions de l'utilisateur, nom (pizza, kebab, sushi, brasserie, boulangerie…), code d'activité, adresse. Un nom neutre sans autre indice ne permet pas de conclure : confiance 50 ou moins.\n`
    + `FAMILLES : ${Object.entries(FAMILLES).map(([k, f]) => `${k} = ${f.lib}`).join(" ; ")}\n`
    + `Réponds UNIQUEMENT avec un objet JSON : {"type": "libellé précis", "famille": "clé", "confiance": 0-100, "cuisine": "ou vide", "indices": ["…"], "hypotheses": [{"type": "…", "famille": "…", "probabilite": 0-100}], "a_verifier": ["questions pour le gérant"], "resume": "deux phrases"}`;
  return { systeme, contenu: `DOSSIER\n${dossier(p)}${precisions ? `\nPrécisions de l'utilisateur (source la plus fiable) : ${precisions.slice(0, 3000)}` : ""}` };
}

export function promptRedaction(p: ProspectSite, etude: { type: string; famille: string; cuisine?: string; precisions?: string }, perso = ""): Consigne {
  const F = FAMILLES[etude.famille] ?? FAMILLES.artisan;
  const systeme = `${CONTEXTE}\n\nTu es directeur artistique et rédacteur web senior. Tu prépares la MAQUETTE d'un site vitrine sur mesure (non publiée) pour la montrer au gérant. Niveau attendu : site d'agence. Le site est une vitrine : l'action principale est d'appeler.\n\n`
    + `PHOTOS DE LA BANQUE (clés) : utilise une photo uniquement si elle montre exactement ce plat ou ce lieu ; sinon laisse "".\n${listePhotos()}\n\n`
    + `RÈGLES : français impeccable, vouvoiement, phrases courtes et concrètes ; métier et ville dans le h1 et la meta description. Carte ou services COMPLETS et crédibles pour ce type précis (3 à 5 onglets, 4 à 10 articles, prix réalistes en euros). Aucun fait invérifiable présenté comme vrai : liste-les dans a_verifier. Aucun avis, aucune note, aucune statistique.\n`
    + `Réponds UNIQUEMENT avec un objet JSON : {"activite", "marque_sous", "title", "meta_description", "couleurs": {"principal": "#…", "accent": "#…"}, "accueil": {"h1", "h1_suite", "chapo", "atouts": [4], "etiquette": {"gros", "texte"}, "photo"}, "defilant": [6], "vedettes": {"surtitre", "titre", "articles": [{"nom", "desc", "prix", "photo"}]}, "offre": {"nav": "${F.offre} ou mieux", "surtitre", "titre", "texte", "onglets": [{"nom", "articles": [{"nom", "desc", "prix"${F.repas ? "" : ", \"duree\""}}]}], "pied"}, "maison": {"surtitre", "titre", "texte", "engagements": [3 {"titre", "texte", "icone": "${ICONES.join("|")}"}], "signature", "photos": []}, "bande": null ou {"surtitre", "titre", "texte", "articles": [3 {"titre", "photo"}]}, "infos": {"texte", "acces": [], "bon_a_savoir": []}, "horaires": {"lun": "HH:MM-HH:MM,HH:MM-HH:MM" ou "", … "dim"}, "faq": [5 {"q", "r"}], "final": {"titre", "texte"}, "a_verifier": []}`;
  const contenu = `ÉTABLISSEMENT\n${dossier(p)}\nÉTUDE VALIDÉE : ${etude.type} (famille « ${etude.famille} » : ${F.lib})${etude.cuisine ? ` · cuisine : ${etude.cuisine}` : ""}${etude.precisions ? `\nPrécisions : ${etude.precisions.slice(0, 3000)}` : ""}\n\n${perso}`.trim();
  return { systeme, contenu };
}

export function promptRetouche(d: DonneesSite, consigne: string, perso = ""): Consigne {
  const copie = { ...d }; for (const k of ["telephone", "email", "adresse", "code_postal", "ville", "nom", "maquette"]) delete copie[k];
  const systeme = `${CONTEXTE}\n\nTu retouches la MAQUETTE d'un site vitrine.\n\nPhotos de la banque (clés) :\n${listePhotos()}\nFamilles : ${Object.keys(FAMILLES).join(", ")}. Sections masquables : defilant, vedettes, maison, bande, faq, plan.\n\n`
    + `Règles : français impeccable, vouvoiement, aucun fait inventé présenté comme vrai, aucun avis ni statistique. Garde le métier et la ville dans le h1.\nRéponds UNIQUEMENT avec un objet JSON : {"modifications": {seulement les blocs de premier niveau à changer, chacun donné EN ENTIER au même format}, "explication": "une phrase"}`;
  return { systeme, contenu: `Données actuelles (JSON) :\n${JSON.stringify(copie)}\n\n${perso}Demande de l'utilisateur : ${consigne.slice(0, 2000)}` };
}

/** Applique une proposition de l'IA (blocs filtrés par l'offre), puis complète les photos manquantes. */
export function appliquerIA(ancien: DonneesSite, modifs: unknown, cap: CapacitesStudio, metier?: string | null): { d: DonneesSite; refuses: string[] } {
  if (!modifs || typeof modifs !== "object") return { d: ancien, refuses: [] };
  const r = appliquerEdition(ancien, modifs as Record<string, unknown>, cap);
  moteur.completerPhotosSM(r.d, { metier }, { listes: true });
  return r;
}

/** Site complet à partir de la rédaction de l'IA. */
export function siteDepuisIA(p: ProspectSite, famille: string, redaction: unknown, horaires?: unknown): DonneesSite {
  const d = moteur.normaliserSM(redaction, baseSite(p, famille));
  d.famille = famille;
  const h = moteur.horairesSM(horaires);
  if (h) d.horaires = h;
  return moteur.completerPhotosSM(d, p);
}

/** Lecture tolérante d'une réponse JSON de l'IA (éventuellement entourée de texte ou de ```json). */
export function lireJSON(texte: string): any {
  const t = texte.replace(/```json|```/g, "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("Réponse IA sans JSON");
  return JSON.parse(t.slice(a, b + 1));
}
