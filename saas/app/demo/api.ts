/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Faux serveur de la démo : intercepte les appels /api/* des vrais composants de MySite et y répond dans le navigateur,
 * avec les mêmes règles que le serveur réel (offres, quotas, numérotation des factures, documents émis figés…).
 * Les fonctions qui demandent un vrai service (IA, Sirene, Stripe, DNS) sont simulées et l'indiquent.
 */
import { PLANS, limite } from "../src/lib/plans";
import { appliquerEdition, FAMILLES, familleDepuisMetier, photosPourCommerce, poserPhotosCommerce, siteDepuisIA, siteExpress } from "../src/lib/studio";
import exemple from "../src/lib/studio/exemple-pizzeria.test.json";
import { mentionsManquantes, normaliserDomaine, reglagesDNS, slugValide, ideesDomaines } from "../src/lib/publication";
import { controleEmission, echeanceParDefaut, LIGNES_TYPES, nettoyerLignes, totaux } from "../src/lib/factures";
import { ajouterJournal } from "../src/lib/pipeline";
import { ETAPES_LIVRAISON } from "../src/lib/livraison";
import { lecon, SEUIL_REUSSITE } from "../src/lib/academie/cours";
import { cap, db, jour, nouvelId, plan, sauver } from "./donnees";
import { naviguer, rafraichir } from "./shims/routeur";
import { annoncer } from "./annonce";

const rep = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const corps = async (init?: RequestInit) => { try { return init?.body && typeof init.body === "string" ? JSON.parse(init.body) : {}; } catch { return {}; } };
const prospect = (id: string) => db().prospects.find((p) => p.id === id);
const journal = (pid: string | null | undefined, t: string) => { const p = pid && prospect(pid); if (p) p.journal = ajouterJournal(p.journal, t); };
const site = (id: string) => db().sites.find((s) => s.id === id);
const urlDemo = (slug: string, domaine?: string | null) => (domaine ? `https://${domaine}` : `https://${slug}.mysite.site`);

function consommer(type: "prospects" | "messages_ia" | "sites_ia" | "retouches_ia", n = 1): boolean {
  const max = limite(plan(), type), c = db().conso;
  if (max <= 0 || c[type] + n > max) return false;
  c[type] += n; return true;
}
function archiver(s: any, libelle: string) {
  const n = cap().versions; if (n <= 0) return;
  db().versions.unshift({ id: Date.now() + Math.random(), site_id: s.id, donnees: JSON.parse(JSON.stringify(s.donnees)), libelle, cree_le: new Date().toISOString() });
  const miennes = db().versions.filter((v) => v.site_id === s.id);
  miennes.slice(n).forEach((v) => { db().versions.splice(db().versions.indexOf(v), 1); });
}

/* ------------------------------------------------------------------ routes */
type Route = (m: RegExpMatchArray, init: RequestInit | undefined, url: URL) => Promise<Response>;
const ROUTES: [string, RegExp, Route][] = [
  ["POST", /^\/api\/prospects\/rechercher$/, async () => {
    await pause(900);
    const r = db().reserve; if (!r.length) return rep({ ajoutes: 0, message: "Aucun nouveau prospect disponible dans votre zone (démo)." });
    const reste = limite(plan(), "prospects") - db().conso.prospects; if (reste <= 0) return rep({ erreur: "quota", plan: plan() }, 402);
    const lot = r.splice(0, Math.min(5, reste)); lot.forEach((p) => { p.cree_le = new Date().toISOString(); db().prospects.unshift(p); });
    db().conso.prospects += lot.length; sauver(); return rep({ ajoutes: lot.length });
  }],
  ["POST", /^\/api\/prospects\/geocoder$/, async () => rep({ places: 0, restants: 0 })],
  ["POST", /^\/api\/ia\/message$/, async (_m, init) => {
    const { id, canal } = await corps(init); const p = prospect(id);
    if (!p) return rep({ erreur: "Prospect introuvable" }, 404);
    if (p.statut === "refus") return rep({ erreur: "Ce prospect ne souhaite plus être contacté." }, 409);
    if (!consommer("messages_ia")) return rep({ erreur: "quota", plan: plan() }, 402);
    await pause(1200);
    const prenom = db().profil.prenom;
    const texte = canal === "email"
      ? `Objet : Une maquette de site pour ${p.nom}\n\nBonjour,\n\nJe m'appelle ${prenom} et je crée des sites internet pour les commerces de ${p.ville}. J'ai préparé gratuitement une maquette du futur site de ${p.nom} : votre carte, vos horaires et un bouton pour vous appeler, lisibles en un geste sur téléphone.\n\nPuis-je vous la montrer en 5 minutes, sans engagement ?\n\n${prenom}, création de sites pour les commerçants\nRépondez STOP pour ne plus être contacté.`
      : canal === "appel"
        ? `Accroche : « Bonjour, ${prenom}, je crée les sites des commerces du quartier. Vous avez 30 secondes ? »\nRaison : « J'ai préparé une maquette du site de ${p.nom}, gratuite. »\nQuestion : « Aujourd'hui, comment vos clients trouvent vos horaires ? »\nProposition : « Je passe vous la montrer jeudi ou vendredi ? »\n« Pas le temps » → « Justement, tout est prêt : 5 minutes suffisent. »\n« Pas intéressé » → « Je comprends. Je vous laisse mon numéro au cas où. »`
        : `Bonjour, ${prenom}, je crée les sites des commerces de ${p.ville}. J'ai préparé une maquette gratuite du site de ${p.nom} (carte, horaires, appel en un geste). Je peux vous la montrer ? Répondez STOP pour ne plus être contacté.`;
    p.journal = ajouterJournal(p.journal, `Message préparé (${canal})`); sauver();
    return rep({ texte: `${texte}\n\n(Démo : texte d'exemple. Dans l'application, il est rédigé sur mesure pour chaque commerce.)` });
  }],
  /* ---------- Studio ---------- */
  ["POST", /^\/api\/studio$/, async (_m, init) => {
    const { prospect_id, famille } = await corps(init); const p = prospect(prospect_id);
    if (!p) return rep({ erreur: "Prospect introuvable" }, 404);
    if (db().sites.length >= cap().sitesMax) return rep({ erreur: `Votre offre conserve ${cap().sitesMax} sites : supprimez-en un ou passez à l'offre supérieure.`, plan: plan() }, 402);
    const donnees = poserPhotosCommerce(siteExpress(p, famille && FAMILLES[famille] ? famille : undefined), cap().photosPerso ? photosPourCommerce(db().photos as any, p.id) : []);
    const s = { id: nouvelId(), prospect_id: p.id, type: "express", donnees, etude: null, cree_le: new Date().toISOString(), maj_le: new Date().toISOString() };
    db().sites.unshift(s); journal(p.id, "Maquette express créée dans le Studio"); sauver(); return rep({ id: s.id });
  }],
  ["POST", /^\/api\/studio\/etude$/, async (_m, init) => {
    if (!cap().effortIA) return rep({ erreur: "Les sites sur mesure sont inclus dès l'offre Pro.", plan: plan() }, 402);
    const { prospect_id, precisions } = await corps(init); const p = prospect(prospect_id);
    if (!p) return rep({ erreur: "Prospect introuvable" }, 404);
    if (!consommer("sites_ia")) return rep({ erreur: "Quota de sites sur mesure du mois atteint.", plan: plan() }, 402);
    await pause(1600);
    const famille = familleDepuisMetier(p.metier), alt = famille === "rapide" ? "restaurant" : famille === "restaurant" ? "rapide" : "restaurant";
    const etude = {
      statut: "a_confirmer", essais: 0, precisions: precisions ?? "", type: `${p.metier} (${p.ville})`, famille, cuisine: "", confiance: famille === "pizzeria" ? 88 : 61,
      indices: [`Nom : « ${p.nom} »`, `Code d'activité déclaré : ${p.metier}`, `Adresse : ${p.ville}`],
      hypotheses: [{ type: FAMILLES[alt].lib.split(" (")[0], famille: alt, probabilite: famille === "pizzeria" ? 10 : 34 }],
      a_verifier: ["Plats phares et prix", "Horaires exacts", "Livraison ou vente à emporter ?"], resume: "Démo : étude simulée à partir du nom, du code d'activité et de l'adresse.",
    };
    const s = { id: nouvelId(), prospect_id: p.id, type: "ia", donnees: siteExpress(p, famille), etude, cree_le: new Date().toISOString(), maj_le: new Date().toISOString() };
    db().sites.unshift(s); sauver(); return rep({ id: s.id, etude });
  }],
  ["POST", /^\/api\/studio\/([^/]+)\/rediger$/, async (m, init) => {
    const s = site(m[1]); if (!s) return rep({ erreur: "Site introuvable" }, 404);
    const b = await corps(init); const famille = b.famille && FAMILLES[b.famille] ? b.famille : s.etude.famille; const p = prospect(s.prospect_id) ?? { nom: s.donnees.nom };
    await pause(2600);
    archiver(s, "Avant rédaction");
    s.donnees = famille === "pizzeria" ? siteDepuisIA(p as any, famille, exemple, (exemple as any).horaires) : siteExpress(p as any, famille);
    s.donnees.nom = p.nom ?? s.donnees.nom;
    s.etude = { ...s.etude, famille, type: b.type ?? s.etude.type, statut: "redige" }; s.maj_le = new Date().toISOString();
    journal(s.prospect_id, `Site sur mesure rédigé (${b.type ?? famille})`); sauver();
    return rep({ donnees: s.donnees });
  }],
  ["POST", /^\/api\/studio\/([^/]+)\/retouche$/, async (m, init) => {
    if (!cap().effortIA) return rep({ erreur: "Les retouches sont incluses dès l'offre Pro.", plan: plan() }, 402);
    const s = site(m[1]); if (!s) return rep({ erreur: "Site introuvable" }, 404);
    const { consigne = "" } = await corps(init);
    if (!consommer("retouches_ia")) return rep({ erreur: "Quota de retouches du mois atteint.", plan: plan() }, 402);
    await pause(1400);
    archiver(s, `Avant retouche : ${consigne}`);
    const d = JSON.parse(JSON.stringify(s.donnees)); let explication = "Démo : retouche simulée.";
    const c = consigne.toLowerCase();
    if (/formule|midi/.test(c) && d.offre?.onglets?.[0]) { d.offre.onglets[0].articles.unshift({ nom: "Formule midi", desc: "Plat du jour et dessert, du lundi au vendredi.", prix: 13.9 }); explication = "J'ai ajouté une formule midi en tête de la carte."; }
    else if (/chic|élégant|elegant/.test(c) && d.accueil) { d.accueil.chapo = `${d.nom} vous reçoit dans un cadre soigné, avec une cuisine faite maison et un accueil attentionné, au cœur de ${d.ville}.`; explication = "J'ai rendu la présentation plus élégante."; }
    else if (/court|raccourci/.test(c) && d.accueil) { d.accueil.chapo = d.accueil.chapo.split(".")[0] + "."; explication = "J'ai raccourci la présentation."; }
    else if (/boisson/.test(c) && d.offre?.onglets) { d.offre.onglets.push({ nom: "Boissons", articles: [{ nom: "Limonade artisanale", desc: "33 cl", prix: 3.5 }, { nom: "Café", desc: "Expresso", prix: 1.8 }] }); explication = "J'ai ajouté une catégorie Boissons à la carte."; }
    else if (/livraison|emporter/.test(c) && d.accueil) { d.accueil.atouts = ["Livraison", "À emporter", ...(d.accueil.atouts ?? []).slice(0, 2)]; explication = "J'ai mis en avant la livraison et la vente à emporter."; }
    else if (/faq/.test(c)) { d.faq = [...(d.faq ?? []), { q: "Proposez-vous des options végétariennes ?", r: "Oui, plusieurs plats de la carte sont végétariens." }]; explication = "J'ai complété la FAQ."; }
    const { d: res, refuses } = appliquerEdition(s.donnees, d, cap());
    s.donnees = res; s.maj_le = new Date().toISOString(); sauver();
    return rep({ donnees: res, explication: `${explication} (Démo : dans l'application, la retouche est rédigée sur mesure.)`, refuses });
  }],
  ["POST", /^\/api\/studio\/([^/]+)\/restaurer$/, async (m, init) => {
    const s = site(m[1]); const { version_id } = await corps(init); const v = db().versions.find((x) => x.id === version_id && x.site_id === m[1]);
    if (!s || !v) return rep({ erreur: "Version introuvable" }, 404);
    archiver(s, "Avant restauration"); s.donnees = v.donnees; sauver(); return rep({ donnees: v.donnees });
  }],
  ["GET", /^\/api\/studio\/([^/]+)\/publier$/, async (m) => {
    const p = db().publications.find((x) => x.site_id === m[1]);
    if (!p) return rep({ publie: false });
    return rep({ publie: true, ...p, url: urlDemo(p.slug), urlDomaine: p.domaine ? `https://${p.domaine}` : null, dns: p.domaine ? { ok: false, detail: "Démo : la vérification DNS se fait dans l'application en ligne." } : null, reglages: p.domaine ? reglagesDNS(p.domaine) : [] });
  }],
  ["POST", /^\/api\/studio\/([^/]+)\/publier$/, async (m, init) => {
    if (cap().publications <= 0) return rep({ erreur: "La mise en ligne en un clic est incluse dès l'offre Pro.", plan: plan() }, 402);
    const b = await corps(init); const s = site(m[1]); if (!s) return rep({ erreur: "Site introuvable" }, 404);
    if (!b.verifie) return rep({ erreur: "Confirmez avoir vérifié le contenu avec le gérant." }, 400);
    if (!slugValide(String(b.slug ?? ""))) return rep({ erreur: "Adresse invalide : lettres minuscules, chiffres et tirets (3 à 40 caractères)." }, 400);
    const manque = mentionsManquantes(b.mentions ?? {}); if (manque.length) return rep({ erreur: `Mentions légales obligatoires manquantes : ${manque.join(", ")}.` }, 400);
    const domaine = b.domaine ? normaliserDomaine(b.domaine) : null; if (b.domaine && !domaine) return rep({ erreur: "Nom de domaine invalide (ex. pizzabella.fr)." }, 400);
    const ex = db().publications.find((x) => x.site_id === s.id);
    if (!ex && db().publications.length >= cap().publications) return rep({ erreur: `Votre offre permet ${cap().publications} sites en ligne en même temps.`, plan: plan() }, 402);
    await pause(900);
    const pub = { site_id: s.id, slug: b.slug, domaine, mentions: b.mentions, publie_le: new Date().toISOString(), maj_le: new Date().toISOString() };
    if (ex) Object.assign(ex, pub); else { db().publications.push(pub); journal(s.prospect_id, `Site mis en ligne : ${urlDemo(b.slug, domaine)}`); }
    sauver(); annoncer("Démo : le site n'est pas réellement mis en ligne. Dans l'application, il l'est en un clic.");
    return rep({ url: urlDemo(b.slug), urlDomaine: domaine ? `https://${domaine}` : null, reglages: domaine ? reglagesDNS(domaine) : [], branchement: domaine ? "manuel" : undefined });
  }],
  ["DELETE", /^\/api\/studio\/([^/]+)\/publier$/, async (m) => { db().publications = db().publications.filter((x) => x.site_id !== m[1]); sauver(); return rep({ ok: true }); }],
  ["POST", /^\/api\/studio\/photo$/, async (_m, init) => {
    if (!cap().photosPerso) return rep({ erreur: "L'envoi de vos propres photos est inclus dès l'offre Premium.", plan: plan() }, 402);
    const fd = init?.body as FormData; const f = fd?.get("photo");
    if (!(f instanceof File) || !/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 5 * 1024 * 1024) return rep({ erreur: "Photo JPEG, PNG ou WebP de 5 Mo maximum." }, 400);
    const url = await new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsDataURL(f); });
    let photo = null;
    if (fd.get("garder") === "1" && cap().banquePerso > 0) {
      const pid = String(fd.get("prospect_id") ?? "") || null;
      photo = { id: nouvelId(), url, legende: String(fd.get("legende") ?? "").slice(0, 120), portee: fd.get("portee") === "tous" || !pid ? "tous" : "commerce", prospect_id: pid };
      db().photos.unshift(photo);
    }
    sauver(); return rep({ url, photo });
  }],
  ["PATCH", /^\/api\/studio\/photo\/([^/]+)$/, async (m, init) => {
    const ph = db().photos.find((x) => x.id === m[1]); if (!ph) return rep({ erreur: "Photo introuvable" }, 404);
    const b = await corps(init); if (typeof b.legende === "string") ph.legende = b.legende.slice(0, 120); if (b.portee === "tous" || b.portee === "commerce") ph.portee = b.portee;
    sauver(); return rep({ photo: ph });
  }],
  ["DELETE", /^\/api\/studio\/photo\/([^/]+)$/, async (m) => { db().photos = db().photos.filter((x) => x.id !== m[1]); sauver(); return rep({ ok: true }); }],
  ["PATCH", /^\/api\/studio\/([^/]+)$/, async (m, init) => {
    const s = site(m[1]); if (!s) return rep({ erreur: "Site introuvable" }, 404);
    const { edition } = await corps(init); const { d, refuses } = appliquerEdition(s.donnees, edition ?? {}, cap());
    archiver(s, "Modification manuelle"); s.donnees = d; s.maj_le = new Date().toISOString(); sauver();
    return rep({ donnees: d, refuses });
  }],
  ["DELETE", /^\/api\/studio\/([^/]+)$/, async (m) => { db().sites = db().sites.filter((s) => s.id !== m[1]); db().publications = db().publications.filter((x) => x.site_id !== m[1]); sauver(); return rep({ ok: true }); }],
  /* ---------- Devis et factures ---------- */
  ["PATCH", /^\/api\/documents\/([^/]+)$/, async (m, init) => {
    const doc = db().documents.find((x) => x.id === m[1]); if (!doc) return rep({ erreur: "Document introuvable" }, 404);
    if (doc.numero) return rep({ erreur: "Document émis : il ne peut plus être modifié." }, 409);
    const b = await corps(init); const e = db().entreprise; const taux = e && e.tva !== "franchise" ? Number(e.taux_tva) || 0 : 0; const lignes = nettoyerLignes(b.lignes);
    Object.assign(doc, { client: { ...b.client, hors_etablissement: b.client?.hors_etablissement === true }, lignes, total_ht: totaux(lignes, taux).ht, taux_tva: taux, date_echeance: b.date_echeance || echeanceParDefaut(), conditions: String(b.conditions ?? "").slice(0, 1000) });
    sauver(); return rep({ ok: true, totaux: totaux(lignes, taux), taux });
  }],
  ["POST", /^\/api\/documents\/([^/]+)$/, async (m, init) => {
    const doc = db().documents.find((x) => x.id === m[1]); if (!doc) return rep({ erreur: "Document introuvable" }, 404);
    const { action } = await corps(init); const P = PLANS[plan()];
    if (action === "emettre") {
      if (!P.facturation) return rep({ erreur: "Devis et factures inclus dès l'offre Premium.", plan: plan() }, 402);
      const pb = controleEmission(db().entreprise as any, doc.client ?? {}, nettoyerLignes(doc.lignes)); if (pb.length) return rep({ erreur: pb.join(" ") }, 400);
      const annee = new Date().getFullYear(), cle = `${doc.type}-${annee}`, n = (db().compteurs[cle] ?? 0) + 1; db().compteurs[cle] = n;
      doc.numero = `${doc.type === "facture" ? "F" : doc.type === "devis" ? "D" : "A"}-${annee}-${String(n).padStart(4, "0")}`;
      doc.emetteur = { ...db().entreprise }; doc.date_emission = jour(0); doc.statut = doc.type === "devis" ? "envoye" : "emise";
      journal(doc.prospect_id, `${doc.type === "devis" ? "Devis" : "Facture"} ${doc.numero} émis(e)`);
      const p = prospect(doc.prospect_id); if (doc.type === "devis" && p && ["nouveau", "contacte", "repondu", "rdv"].includes(p.statut)) p.statut = "devis";
      sauver(); return rep({ numero: doc.numero });
    }
    if (action === "accepter" || action === "refuser") { doc.statut = action === "accepter" ? "accepte" : "refuse"; const p = prospect(doc.prospect_id); if (p) p.statut = action === "accepter" ? "gagne" : "perdu"; journal(doc.prospect_id, `Devis ${doc.numero} ${action === "accepter" ? "accepté" : "refusé"}`); sauver(); return rep({ ok: true }); }
    if (action === "payer") { doc.statut = "payee"; doc.paye_le = jour(0); journal(doc.prospect_id, `Facture ${doc.numero} payée`); sauver(); return rep({ ok: true }); }
    if (action === "annuler") {
      const annee = new Date().getFullYear(), cle = `avoir-${annee}`, n = (db().compteurs[cle] ?? 0) + 1; db().compteurs[cle] = n;
      const avoir = { ...JSON.parse(JSON.stringify(doc)), id: nouvelId(), type: "avoir", numero: `A-${annee}-${String(n).padStart(4, "0")}`, statut: "emise", origine_id: doc.id, conditions: `Avoir annulant la facture ${doc.numero}.`, date_emission: jour(0), cree_le: new Date().toISOString() };
      db().documents.unshift(avoir); doc.statut = "annulee"; journal(doc.prospect_id, `Facture ${doc.numero} annulée par un avoir`); sauver(); return rep({ id: avoir.id });
    }
    if (action === "facturer") {
      const f = { id: nouvelId(), prospect_id: doc.prospect_id, type: "facture", numero: null, statut: "brouillon", client: doc.client, emetteur: null, lignes: doc.lignes, total_ht: doc.total_ht, taux_tva: doc.taux_tva, date_emission: null, date_echeance: echeanceParDefaut(), conditions: `Selon devis ${doc.numero}.`, origine_id: doc.id, paye_le: null, cree_le: new Date().toISOString() };
      db().documents.unshift(f); sauver(); return rep({ id: f.id });
    }
    return rep({ erreur: "Action inconnue" }, 400);
  }],
  ["DELETE", /^\/api\/documents\/([^/]+)$/, async (m) => { db().documents = db().documents.filter((d) => d.id !== m[1] || d.numero); sauver(); return rep({ ok: true }); }],
  /* ---------- Livraison, domaines, Académie ---------- */
  ["POST", /^\/api\/livraison$/, async (_m, init) => {
    const b = await corps(init); const l = (db().livraisons[b.prospect_id] ??= { etapes: {}, domaine: null });
    if (b.etape) { const e = ETAPES_LIVRAISON.find((x) => x.cle === b.etape); if (!e || e.auto) return rep({ erreur: "Étape invalide" }, 400); if (b.fait) l.etapes[e.cle] = jour(0); else delete l.etapes[e.cle]; }
    if (b.domaine !== undefined) l.domaine = b.domaine ? normaliserDomaine(b.domaine) : null;
    sauver(); return rep({ ok: true, etapes: l.etapes, domaine: l.domaine });
  }],
  ["GET", /^\/api\/domaines$/, async (_m, _i, url) => {
    await pause(700);
    const d = url.searchParams.get("domaine");
    const liste = d ? [normaliserDomaine(d)].filter(Boolean) as string[] : ideesDomaines(url.searchParams.get("nom") ?? "", url.searchParams.get("ville"));
    return rep({ resultats: liste.map((x, i) => ({ domaine: x, disponible: i % 3 === 2 ? false : true })) });
  }],
  ["POST", /^\/api\/academie$/, async (_m, init) => {
    const b = await corps(init); const l = lecon(String(b.lecon ?? "")); const score = Math.round(Number(b.score) || 0);
    if (!l) return rep({ erreur: "Leçon inconnue" }, 400); if (score < SEUIL_REUSSITE) return rep({ ok: false });
    db().progression[l.id] = Math.max(db().progression[l.id] ?? 0, score); sauver(); return rep({ ok: true });
  }],
];

/** Création d'un devis ou d'une facture depuis un formulaire (comme POST /api/documents). */
export function creerDocument(type: string, prospectId: string | null) {
  if (!PLANS[plan()].facturation) { annoncer("Devis et factures : inclus dès l'offre Premium. Changez d'offre de démo en haut de la page."); naviguer("/espace/factures"); return; }
  const p = prospectId ? prospect(prospectId) : null; const e = db().entreprise; const taux = e && e.tva !== "franchise" ? Number(e.taux_tva) || 20 : 0;
  const lignes = type === "devis" ? LIGNES_TYPES : [LIGNES_TYPES[0]];
  const doc = { id: nouvelId(), prospect_id: p?.id ?? null, type: type === "facture" ? "facture" : "devis", numero: null, statut: "brouillon", client: p ? { nom: p.nom, adresse: p.adresse, siret: p.siret, email: p.email ?? "" } : { nom: "" }, emetteur: null, lignes, total_ht: totaux(lignes, taux).ht, taux_tva: taux, date_emission: null, date_echeance: echeanceParDefaut(), conditions: "", origine_id: null, paye_le: null, cree_le: new Date().toISOString() };
  db().documents.unshift(doc); sauver(); naviguer(`/espace/factures/${doc.id}`);
}

export function installerFauxServeur() {
  const vrai = window.fetch.bind(window);
  window.fetch = async (entree: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof entree === "string" ? entree : entree instanceof URL ? entree.href : entree.url, location.href);
    if (!url.pathname.startsWith("/api/")) return vrai(entree as RequestInfo, init);
    const methode = (init?.method ?? "GET").toUpperCase();
    for (const [m, re, f] of ROUTES) { const r = url.pathname.match(re); if (m === methode && r) { const reponse = await f(r, init, url); setTimeout(rafraichir, 0); return reponse; } }
    return rep({ erreur: "Fonction indisponible dans la démo." }, 404);
  };
  // La démo ne peut pas afficher de boîtes de dialogue : on confirme par défaut.
  window.confirm = () => true;
  window.alert = (m?: unknown) => annoncer(String(m ?? ""));
  // Formulaires et liens qui visent le serveur (création de devis, Stripe, téléchargements)
  document.addEventListener("submit", (e) => {
    const f = e.target as HTMLFormElement; const action = f.getAttribute("action") ?? "";
    if (action.startsWith("/api/")) {
      e.preventDefault();
      if (action === "/api/documents") { const fd = new FormData(f); creerDocument(String(fd.get("type")), String(fd.get("prospect_id") ?? "") || null); }
      else annoncer("Démo : le paiement Stripe est désactivé. Utilisez le sélecteur d'offre en haut de la page pour essayer chaque abonnement.");
    }
  }, true);
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest("a"); if (!a) return; const h = a.getAttribute("href") ?? "";
    if (h.startsWith("/api/")) { e.preventDefault(); annoncer(h.includes("export") ? "Démo : l'export CSV télécharge le fichier dans l'application en ligne." : "Démo : le téléchargement du site fonctionne dans l'application en ligne."); }
    else if (h.startsWith("/impression/")) { e.preventDefault(); naviguer(h); }
  }, true);
}
