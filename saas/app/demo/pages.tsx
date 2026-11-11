/* eslint-disable @typescript-eslint/no-explicit-any */
/** Pages de la démo : mêmes écrans que l'application, lus depuis les données d'exemple du navigateur. */
import React, { useState } from "react";
import Link from "./shims/link";
import { ArrowLeft, ArrowRight, Award, Building2, Check, CheckCircle2, Circle, Crown, Download, FilePlus2, FileText, GraduationCap, LayoutTemplate, Lock, Map as IconeCarte, MapPin, Minus, Phone, PlayCircle, ReceiptText, Search, Store, Target, Trash2, Trophy, WandSparkles } from "lucide-react";
import { ORDRE_PLANS, PLANS, type CapacitesStudio } from "../src/lib/plans";
import { ETAPES, etape, ajouterJournal, type EntreeJournal } from "../src/lib/pipeline";
import { FAMILLES, photosPourCommerce } from "../src/lib/studio";
import { dateFr, euros, LIBELLES, STATUTS, totaux, nettoyerLignes } from "../src/lib/factures";
import { MODULES, NIVEAUX, LECONS, lecon, progression } from "../src/lib/academie/cours";
import { missions } from "../src/lib/academie/missions";
import { BoutonRecherche } from "../src/components/BoutonRecherche";
import { BoutonsStudio } from "../src/components/studio/BoutonsStudio";
import { GenerateurMessage } from "../src/components/GenerateurMessage";
import { ConclureVente } from "../src/components/ConclureVente";
import { EditeurStudio } from "../src/components/studio/EditeurStudio";
import { BanquePhotos } from "../src/components/studio/BanquePhotos";
import { CarteProspects } from "../src/components/CarteProspects";
import { EditeurDocument } from "../src/components/factures/EditeurDocument";
import { LeconInteractive } from "../src/components/academie/LeconInteractive";
import { AssistantLivraison } from "../src/components/AssistantLivraison";
import { cap, db, plan, sauver } from "./donnees";
import { naviguer, rafraichir } from "./shims/routeur";
import { creerDocument } from "./api";
import { annoncer } from "./annonce";

const COULEURS = ["#6d4aff", "#0ea5c6", "#ec4899", "#f97316", "#10b981", "#3b5bfd"];
const initiales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join("").toUpperCase();
const Retour = ({ href, lib }: { href: string; lib: string }) => <Link href={href} className="note" style={{ display: "inline-flex", gap: ".3rem", alignItems: "center", textDecoration: "none" }}><ArrowLeft size={16} aria-hidden />{lib}</Link>;
const Statut = ({ id }: { id: string }) => { const e = etape(id); return <span className="statut" style={{ color: e.couleur, background: `color-mix(in srgb, ${e.couleur} 14%, transparent)` }}>{e.nom}</span>; };

/* ------------------------------------------------------------ tableau de bord */
export function Accueil() {
  const D = db(), P = PLANS[plan()];
  const STATS: [keyof typeof D.conso, string, typeof Target, string][] = [["prospects", "Prospects ajoutés", Target, "p-violet"], ["messages_ia", "Messages rédigés", WandSparkles, "p-rose"], ["sites_ia", "Sites sur mesure", Store, "p-cyan"]];
  return (
    <>
      <div className="barre-haut">
        <div><p className="note" style={{ margin: "0 0 .3rem" }}>Restauration · Rhône</p><h1>Bonjour {D.profil.prenom} 👋</h1></div>
        <span className="badge-offre"><Crown aria-hidden />Offre {P.nom}</span>
      </div>
      <section className="stats" aria-label="Consommation du mois">
        {STATS.map(([t, lib, Ico, coul]) => {
          const max = P.quotas[t], v = D.conso[t], pct = max ? Math.min(100, (v / max) * 100) : 100;
          return (
            <div key={t} className="carte stat">
              <span className={`ico pastille ${coul}`} style={{ margin: 0, width: "2.4rem", height: "2.4rem" }}><Ico aria-hidden /></span>
              <p className="note" style={{ margin: 0 }}>{lib} ce mois-ci</p>
              {max ? <><p className="valeur">{v}<small> / {max}</small></p><div className={`jauge${pct >= 100 ? " pleine" : ""}`}><i style={{ width: `${pct}%` }} /></div></>
                : <p className="valeur"><Lock aria-hidden />Inclus dès l&apos;offre Pro</p>}
            </div>
          );
        })}
      </section>
      <section className="carte">
        <div className="tableau-entete">
          <h2>Mes prospects <span className="note">({D.prospects.length})</span></h2>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <Link className="btn" href="/espace/carte"><IconeCarte aria-hidden />Carte</Link>
            {P.export ? <a className="btn" href="/api/prospects/export"><Download aria-hidden />Export CSV</a> : <Link className="btn" href="/espace/abonnement"><Lock aria-hidden />Export CSV</Link>}
            <BoutonRecherche />
          </div>
        </div>
        <div className="table-wrap"><table>
          <thead><tr><th>Entreprise</th><th>Métier</th><th>Ville</th><th>Statut</th><th>Téléphone</th></tr></thead>
          <tbody>{D.prospects.map((p, i) => (
            <tr key={p.id}>
              <td><div className="ent"><span className="avatar" style={{ background: COULEURS[i % COULEURS.length] }}>{initiales(p.nom)}</span><span><Link href={`/espace/prospects/${p.id}`}><strong>{p.nom}</strong></Link><small>{p.indices}</small></span></div></td>
              <td>{p.metier}</td><td>{p.ville} <span className="note">{p.code_postal}</span></td><td><Statut id={p.statut} /></td><td>{p.telephone ?? <span className="note">à trouver</span>}</td>
            </tr>))}</tbody>
        </table></div>
        <p className="note" style={{ marginTop: "1rem", marginBottom: 0 }}>Démo : commerces fictifs. Dans l&apos;application, ils viennent de la base Sirene (registre public), réservés rien que pour vous.</p>
      </section>
    </>
  );
}

/* ------------------------------------------------------------ pipeline */
export function Pipeline() {
  const tous = db().prospects, auj = new Date().toISOString().slice(0, 10);
  return (
    <>
      <div className="barre-haut"><div><p className="note" style={{ margin: "0 0 .3rem" }}>{tous.length} prospects suivis</p><h1>Pipeline</h1></div></div>
      <div className="kanban">
        {ETAPES.map((e) => { const liste = tous.filter((p) => p.statut === e.id); return (
          <section key={e.id} className="colonne">
            <h2><span style={{ background: e.couleur }} />{e.nom}<small>{liste.length}</small></h2>
            {liste.map((p) => (
              <Link key={p.id} href={`/espace/prospects/${p.id}`} className="ticket">
                <strong>{p.nom}</strong><small>{p.metier} · {p.ville}</small>
                {p.prochaine_action && <em className={p.date_prochaine_action && p.date_prochaine_action <= auj ? "du" : ""}>{p.prochaine_action}{p.date_prochaine_action ? ` · ${dateFr(p.date_prochaine_action)}` : ""}</em>}
              </Link>))}
          </section>); })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------ fiche prospect */
export function Fiche({ id }: { id: string }) {
  const p = db().prospects.find((x) => x.id === id);
  const [form, setForm] = useState(() => ({ telephone: p?.telephone ?? "", email: p?.email ?? "", prochaine_action: p?.prochaine_action ?? "", date_prochaine_action: p?.date_prochaine_action ?? "", notes: p?.notes ?? "" }));
  const [note, setNote] = useState("");
  if (!p) return <p>Prospect introuvable. <Link href="/espace">Retour</Link></p>;
  const maj = (champs: any, texte?: string) => { Object.assign(p, champs); if (texte) p.journal = ajouterJournal(p.journal, texte); sauver(); rafraichir(); };
  const sites = db().sites.filter((s) => s.prospect_id === id), docs = db().documents.filter((d) => d.prospect_id === id), P = PLANS[plan()];
  const journal = (p.journal ?? []) as EntreeJournal[];
  return (
    <>
      <Retour href="/espace" lib="Mes prospects" />
      <div className="barre-haut" style={{ marginTop: ".6rem" }}>
        <div><p className="note" style={{ margin: "0 0 .3rem" }}>{p.metier} · {p.ville} {p.code_postal}</p><h1>{p.nom}</h1></div>
        <Statut id={p.statut} />
      </div>
      <div className="carte" style={{ marginBottom: "1.2rem" }}>
        <p className="note" style={{ margin: "0 0 .6rem" }}>Étape du suivi</p>
        <div className="etapes-choix">{ETAPES.map((x) => <button key={x.id} type="button" className="btn" aria-pressed={x.id === p.statut} onClick={() => maj({ statut: x.id }, `Étape : ${x.nom}`)} style={x.id === p.statut ? { background: x.couleur, borderColor: x.couleur, color: "#fff" } : undefined}>{x.nom}</button>)}</div>
      </div>
      <div className="fiche-grille">
        <div style={{ display: "grid", gap: "1.2rem", alignContent: "start" }}>
          <div className="carte">
            <h2 style={{ fontSize: "1.15rem" }}>Coordonnées</h2>
            <p style={{ display: "flex", gap: ".5rem" }}><MapPin size={18} aria-hidden style={{ flex: "none", marginTop: ".2rem", color: "var(--violet)" }} />{p.adresse}</p>
            {p.telephone ? <p><span className="btn p"><Phone aria-hidden />{p.telephone}</span></p> : <p className="note">Numéro à trouver (Google Maps, Pages Jaunes : liens directs dans l&apos;application).</p>}
            <p className="note" style={{ margin: 0 }}>{p.indices}<br />SIRET {p.siret} · {p.source}</p>
          </div>
          <form className="carte pile" onSubmit={(e) => { e.preventDefault(); maj(form, "Suivi mis à jour"); annoncer("Suivi enregistré."); }}>
            <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Suivi</h2>
            <div className="deux-col">
              <label>Téléphone<input id="f-tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></label>
              <label>E-mail<input id="f-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label>Prochaine action<input id="f-action" value={form.prochaine_action} onChange={(e) => setForm({ ...form, prochaine_action: e.target.value })} placeholder="Ex. rappeler après le service" /></label>
              <label>Date<input id="f-date" type="date" value={form.date_prochaine_action} onChange={(e) => setForm({ ...form, date_prochaine_action: e.target.value })} /></label>
            </div>
            <label>Notes<textarea id="f-notes" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            <button className="btn p" type="submit">Enregistrer</button>
          </form>
        </div>
        <div style={{ display: "grid", gap: "1.2rem", alignContent: "start" }}>
          <BoutonsStudio prospectId={p.id} sites={sites as any} ia={!!cap().effortIA} restants={Math.max(0, P.quotas.sites_ia - db().conso.sites_ia)} />
          <ConclureVente prospectId={p.id} docs={docs as any} facturation={P.facturation} />
          <GenerateurMessage id={p.id} bloque={p.statut === "refus" ? "Ce prospect a demandé à ne plus être contacté." : undefined} />
          <div className="carte">
            <h2 style={{ fontSize: "1.15rem" }}>Historique</h2>
            <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) { maj({}, note.trim()); setNote(""); } }} style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
              <input id="f-echange" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Noter un échange (appel, visite…)" style={{ flex: 1, minWidth: 0 }} />
              <button className="btn" type="submit">Ajouter</button>
            </form>
            <ul className="journal">{journal.map((j, i) => <li key={i}><time>{dateFr(j.d)}</time>{j.t}</li>)}</ul>
          </div>
          <div><button className="btn" type="button" style={{ color: "#ef4444" }} onClick={() => { db().prospects = db().prospects.filter((x) => x.id !== id); sauver(); naviguer("/espace"); }}><Trash2 aria-hidden />Retirer ce prospect</button></div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------ carte */
export function Carte() {
  return (
    <>
      <div className="barre-haut"><div><p className="note" style={{ margin: "0 0 .3rem" }}>Organisez vos tournées : les prospects proches se démarchent le même jour</p><h1>Carte des prospects</h1></div></div>
      <CarteProspects prospects={db().prospects as any} tuiles="tuiles/{z}/{x}/{y}.png" attribution="&copy; les contributeurs d’OpenStreetMap" />
    </>
  );
}

/* ------------------------------------------------------------ Studio */
const LIGNES_STUDIO: [string, (c: CapacitesStudio, q: { sites_ia: number; retouches_ia: number }) => string | boolean][] = [
  ["Maquettes express", () => true], ["Textes, palettes, sections, banque de photos", () => true],
  ["Sites sur mesure / mois", (_c, q) => (q.sites_ia ? String(q.sites_ia) : false)], ["Retouches en une phrase / mois", (_c, q) => (q.retouches_ia ? String(q.retouches_ia) : false)],
  ["Carte, horaires, FAQ, référencement", (c) => c.editionComplete], ["Couleurs libres et choix du modèle", (c) => c.couleursLibres], ["Polices des titres", (c) => c.polices],
  ["Vos propres photos et banque personnelle", (c) => (c.banquePerso ? String(c.banquePerso) : false)], ["Historique des versions", (c) => (c.versions ? String(c.versions) : false)],
  ["Mise en ligne en un clic", (c) => (c.publications ? String(c.publications) : false)], ["Marque blanche", (c) => c.marqueBlanche],
];
export function StudioListe() {
  const sites = db().sites, P = PLANS[plan()];
  return (
    <>
      <div className="barre-haut">
        <div><p className="note" style={{ margin: "0 0 .3rem" }}>Studio {P.nom} · {db().conso.sites_ia}/{P.quotas.sites_ia} sites sur mesure · {db().conso.retouches_ia}/{P.quotas.retouches_ia} retouches ce mois-ci</p><h1>Mes sites</h1></div>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}><Link className="btn" href="/espace/studio/photos">Ma banque de photos</Link><Link className="btn" href="/espace">Créer depuis un prospect</Link></div>
      </div>
      <ul className="grille-sites">{sites.map((s) => { const F = FAMILLES[s.donnees.famille] ?? FAMILLES.artisan; return (
        <li key={s.id}><Link href={`/espace/studio/${s.id}`} className="carte site-carte">
          <span className="site-vignette" style={{ background: `linear-gradient(135deg, ${F.principal}, ${F.accent})` }}>{String(s.donnees.nom ?? "?").slice(0, 1)}</span>
          <strong>{s.donnees.nom}</strong><small>{F.lib.split(" (")[0]} · {s.donnees.ville}</small>
          <small>{s.type === "ia" ? "Sur mesure" : "Express"}{db().publications.some((x) => x.site_id === s.id) ? " · en ligne" : ""}</small>
        </Link></li>); })}</ul>
      <div className="carte" style={{ marginTop: "1.6rem" }}>
        <div className="tableau-entete"><h2>La puissance du Studio selon l&apos;offre</h2></div>
        <div className="table-wrap"><table className="comparatif">
          <thead><tr><th scope="col">Fonction</th>{ORDRE_PLANS.map((p) => <th key={p} scope="col" aria-current={p === plan() ? "true" : undefined}>{PLANS[p].nom}</th>)}</tr></thead>
          <tbody>{LIGNES_STUDIO.map(([lib, f]) => (<tr key={lib}><th scope="row">{lib}</th>{ORDRE_PLANS.map((p) => { const v = f(PLANS[p].studio, PLANS[p].quotas); return <td key={p} aria-current={p === plan() ? "true" : undefined}>{v === true ? <Check aria-label="Inclus" /> : v === false ? (p === "gratuit" ? <Lock aria-label="Non inclus" /> : <Minus aria-label="Non inclus" />) : v}</td>; })}</tr>))}</tbody>
        </table></div>
      </div>
    </>
  );
}
export function StudioSite({ id }: { id: string }) {
  const s = db().sites.find((x) => x.id === id);
  if (!s) return <p>Site introuvable. <Link href="/espace/studio">Retour</Link></p>;
  const P = PLANS[plan()], c = cap(), pr = db().prospects.find((x) => x.id === s.prospect_id);
  const versions = c.versions > 0 ? db().versions.filter((v) => v.site_id === id).slice(0, c.versions) : [];
  return (
    <>
      <div className="barre-haut" style={{ marginBottom: "1rem" }}>
        <div><Retour href={pr ? `/espace/prospects/${pr.id}` : "/espace/studio"} lib={pr ? "Fiche du prospect" : "Mes sites"} /><h1 style={{ marginTop: ".3rem" }}>{s.donnees.nom}</h1></div>
        <span className="badge-offre">{s.type === "ia" ? "Sur mesure" : "Maquette express"} · Studio {P.nom}</span>
      </div>
      <EditeurStudio key={`${id}-${plan()}`} id={id} initial={s.donnees} etude={s.etude} plan={plan()} cap={c} versions={versions as any}
        retouches={{ utilise: db().conso.retouches_ia, max: P.quotas.retouches_ia }} photosPerso={photosPourCommerce(db().photos as any, s.prospect_id)} prospectId={s.prospect_id} siret={pr?.siret ?? null} />
    </>
  );
}
export function Banque() {
  const c = cap();
  return (
    <>
      <Retour href="/espace/studio" lib="Mes sites" />
      <div className="barre-haut" style={{ marginTop: ".6rem" }}><div><p className="note" style={{ margin: "0 0 .3rem" }}>Réutilisez vos vraies photos d&apos;un site à l&apos;autre</p><h1>Ma banque de photos</h1></div></div>
      {c.banquePerso > 0 ? <div className="carte" style={{ maxWidth: "60rem" }}><BanquePhotos key={plan()} photos={db().photos as any} max={c.banquePerso} /></div>
        : <div className="carte vide"><Lock aria-hidden /><h2>Banque de photos personnelle</h2><p className="note">Incluse dès l&apos;offre Premium : changez d&apos;offre de démo en haut de la page.</p></div>}
    </>
  );
}

/* ------------------------------------------------------------ devis et factures */
export function Factures() {
  const docs = db().documents, ok = PLANS[plan()].facturation;
  const ttc = (d: any) => totaux(nettoyerLignes(d.lignes), Number(d.taux_tva)).ttc;
  const mois = new Date().toISOString().slice(0, 7), annee = String(new Date().getFullYear());
  const encaisse = (p: string) => docs.filter((d) => d.type === "facture" && d.statut === "payee" && d.paye_le?.startsWith(p)).reduce((s, d) => s + ttc(d), 0);
  return (
    <>
      <div className="barre-haut">
        <div><p className="note" style={{ margin: "0 0 .3rem" }}>Numérotation continue, mentions légales, avoirs</p><h1>Devis et factures</h1></div>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <Link className="btn" href="/espace/factures/entreprise"><Building2 aria-hidden />Mon entreprise</Link>
          {ok ? <><button className="btn p" type="button" onClick={() => creerDocument("devis", null)}><FilePlus2 aria-hidden />Nouveau devis</button><button className="btn" type="button" onClick={() => creerDocument("facture", null)}><ReceiptText aria-hidden />Nouvelle facture</button></>
            : <Link className="btn p" href="/espace/abonnement"><Lock aria-hidden />Inclus dès Premium</Link>}
        </div>
      </div>
      <div className="stats">
        <div className="carte stat"><p className="note" style={{ margin: 0 }}>Encaissé ce mois-ci</p><p className="valeur">{euros(encaisse(mois))}</p></div>
        <div className="carte stat"><p className="note" style={{ margin: 0 }}>Encaissé en {annee}</p><p className="valeur">{euros(encaisse(annee))}</p></div>
        <div className="carte stat"><p className="note" style={{ margin: 0 }}>Devis en attente</p><p className="valeur">{docs.filter((d) => d.type === "devis" && d.statut === "envoye").length}</p></div>
      </div>
      <section className="carte">
        {!docs.length ? <div className="vide"><FileText aria-hidden /><h3>Aucun document</h3></div> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Document</th><th>Client</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody>{docs.map((d) => { const s = STATUTS[d.statut]; return (
              <tr key={d.id}><td><Link href={`/espace/factures/${d.id}`}><b>{LIBELLES[d.type as "devis"]}</b> {d.numero ?? "brouillon"}</Link></td><td>{d.client?.nom || "—"}</td>
                <td>{dateFr(d.date_emission ?? d.cree_le)}</td><td>{euros((d.type === "avoir" ? -1 : 1) * ttc(d))}</td>
                <td><span className="statut" style={{ color: s.couleur, background: `color-mix(in srgb, ${s.couleur} 14%, transparent)` }}>{s.nom}</span></td></tr>); })}</tbody>
          </table></div>)}
      </section>
    </>
  );
}
export function Document({ id }: { id: string }) {
  const doc = db().documents.find((x) => x.id === id);
  if (!doc) return <p>Document introuvable. <Link href="/espace/factures">Retour</Link></p>;
  const orig = doc.origine_id ? db().documents.find((x) => x.id === doc.origine_id) : null, s = STATUTS[doc.statut];
  return (
    <>
      <Retour href="/espace/factures" lib="Devis et factures" />
      <div className="barre-haut" style={{ marginTop: ".6rem" }}>
        <div><p className="note" style={{ margin: "0 0 .3rem" }}>{doc.client?.nom || "Client à compléter"}</p><h1>{LIBELLES[doc.type as "devis"]} {doc.numero ?? "(brouillon)"}</h1></div>
        <span className="statut" style={{ color: s.couleur, background: `color-mix(in srgb, ${s.couleur} 14%, transparent)` }}>{s.nom}</span>
      </div>
      <EditeurDocument key={id} doc={{ ...doc }} emetteur={doc.numero ? doc.emetteur : db().entreprise} origine={orig ? `${LIBELLES[orig.type as "devis"]} ${orig.numero ?? ""}` : null} peutEmettre={PLANS[plan()].facturation} />
      <p className="note" style={{ marginTop: "1rem" }}>Démo : l&apos;impression et le PDF fonctionnent dans l&apos;application en ligne.</p>
    </>
  );
}
export function Entreprise() {
  const e = db().entreprise ?? {};
  const [f, setF] = useState<any>({ nom: e.nom ?? "", siret: e.siret ?? "", adresse: e.adresse ?? "", email: e.email ?? "", iban: e.iban ?? "" });
  return (
    <>
      <Retour href="/espace/factures" lib="Devis et factures" />
      <div className="barre-haut" style={{ marginTop: ".6rem" }}><div><p className="note" style={{ margin: "0 0 .3rem" }}>Ces informations figurent sur vos devis et factures</p><h1>Mon entreprise</h1></div></div>
      <form className="carte pile" style={{ maxWidth: "46rem" }} onSubmit={(ev) => { ev.preventDefault(); db().entreprise = { ...e, ...f, tva: "franchise", taux_tva: 0 }; sauver(); annoncer("Identité enregistrée."); }}>
        <label>Nom et prénom, ou raison sociale<input id="e-nom" value={f.nom} onChange={(x) => setF({ ...f, nom: x.target.value })} /></label>
        <div className="deux-col"><label>SIRET<input id="e-siret" value={f.siret} onChange={(x) => setF({ ...f, siret: x.target.value })} /></label><label>E-mail<input id="e-mail" value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} /></label></div>
        <label>Adresse<input id="e-adresse" value={f.adresse} onChange={(x) => setF({ ...f, adresse: x.target.value })} /></label>
        <label>IBAN<input id="e-iban" value={f.iban} onChange={(x) => setF({ ...f, iban: x.target.value })} /></label>
        <p className="note" style={{ margin: 0 }}>TVA : franchise en base (« TVA non applicable, art. 293 B du CGI »), le cas le plus courant en micro-entreprise.</p>
        <button className="btn p" type="submit">Enregistrer</button>
      </form>
    </>
  );
}

/* ------------------------------------------------------------ Académie */
export function Academie() {
  const D = db(), faites = new Set(Object.keys(D.progression)), P = progression(faites);
  const M = missions({ secteur: true, prospects: D.prospects.length, contactes: D.prospects.filter((p) => p.statut !== "nouveau").length, sites: D.sites.length, rdv: D.prospects.filter((p) => ["rdv", "devis", "gagne"].includes(p.statut)).length, devis: D.documents.filter((d) => d.type === "devis" && d.numero).length, publies: D.publications.length, payees: D.documents.filter((d) => d.type === "facture" && d.statut === "payee").length });
  const fait = M.filter((m) => m.fait).length, rayon = 54, circ = 2 * Math.PI * rayon;
  return (
    <>
      <div className="barre-haut"><div><p className="note" style={{ margin: "0 0 .3rem" }}>Des cours courts, des vidéos interactives et des missions concrètes</p><h1>Académie</h1></div></div>
      <section className="carte academie-tete">
        <div className="anneau"><svg viewBox="0 0 120 120" aria-hidden><circle cx="60" cy="60" r={rayon} className="fond" /><circle cx="60" cy="60" r={rayon} className="plein" strokeDasharray={circ} strokeDashoffset={circ * (1 - P.pct / 100)} /></svg><span><b>{P.pct} %</b><small>{P.faites}/{P.total} leçons</small></span></div>
        <div className="academie-niveau">
          <p className="surtitre" style={{ marginBottom: ".5rem" }}><Trophy aria-hidden />Niveau : {P.niveau.nom}</p>
          <h2 style={{ margin: "0 0 .4rem" }}>{P.prochaine ? "Continuez votre parcours" : "Parcours terminé, bravo !"}</h2>
          <ol className="niveaux">{NIVEAUX.map(([s, n]) => <li key={n} className={P.pct >= s ? "atteint" : ""}><i />{n}</li>)}</ol>
          {P.prochaine && <Link className="btn p" href={`/espace/academie/${P.prochaine.id}`}><PlayCircle aria-hidden />Reprendre : {P.prochaine.titre}</Link>}
        </div>
      </section>
      <section className="carte" style={{ marginTop: "1.2rem" }}>
        <div className="tableau-entete"><h2><Award aria-hidden style={{ verticalAlign: "-.2em", color: "var(--violet)" }} /> Missions « Première vente »</h2><span className="badge-offre">{fait}/{M.length}</span></div>
        <div className="jauge" style={{ marginBottom: "1rem" }}><i style={{ width: `${(fait / M.length) * 100}%` }} /></div>
        <ul className="missions">{M.map((m) => <li key={m.id} className={m.fait ? "faite" : ""}>{m.fait ? <CheckCircle2 aria-hidden /> : <Circle aria-hidden />}<span>{m.titre}</span>{!m.fait && <Link href={`/espace/academie/${m.lecon}`} className="note">Le cours</Link>}</li>)}</ul>
      </section>
      <div className="modules">{MODULES.map((m, k) => { const pm = P.parModule.find((x) => x.id === m.id)!.pct; return (
        <section key={m.id} className="carte module" style={{ "--m": m.couleur } as React.CSSProperties}>
          <div className="module-tete"><span className="module-num">{k + 1}</span><div><h2>{m.titre}</h2><p className="note">{m.description}</p></div>{pm === 100 && <span className="module-badge"><GraduationCap aria-hidden /></span>}</div>
          <div className="jauge"><i style={{ width: `${pm}%`, background: m.couleur }} /></div>
          <ul className="module-lecons">{m.lecons.map((l) => <li key={l.id}><Link href={`/espace/academie/${l.id}`}>{faites.has(l.id) ? <CheckCircle2 aria-hidden className="ok" /> : <PlayCircle aria-hidden />}<span>{l.titre}</span><small>{l.minutes} min</small><ArrowRight aria-hidden className="fleche" /></Link></li>)}</ul>
        </section>); })}</div>
    </>
  );
}
export function Lecon({ id }: { id: string }) {
  const l = lecon(id);
  if (!l) return <p>Leçon introuvable. <Link href="/espace/academie">Retour</Link></p>;
  const k = LECONS.findIndex((x) => x.id === id), suivante = LECONS[k + 1];
  return (
    <>
      <Retour href="/espace/academie" lib="Académie" />
      <div className="barre-haut" style={{ marginTop: ".6rem" }}><div><p className="note" style={{ margin: "0 0 .3rem", color: l.module.couleur, fontWeight: 700 }}>{l.module.titre}</p><h1>{l.titre}</h1></div><span className="badge-offre">{l.minutes} min</span></div>
      <LeconInteractive key={id} l={{ ...l, module: undefined } as any} couleur={l.module.couleur} dejaFaite={id in db().progression} suivante={suivante ? { id: suivante.id, titre: suivante.titre } : null} />
    </>
  );
}

/* ------------------------------------------------------------ livraison */
export function Livraison({ id }: { id: string }) {
  const p = db().prospects.find((x) => x.id === id);
  if (!p) return <p>Prospect introuvable.</p>;
  const docs = db().documents.filter((d) => d.prospect_id === id), sites = db().sites.filter((s) => s.prospect_id === id);
  const pub = db().publications.find((x) => sites.some((s) => s.id === x.site_id)), l = db().livraisons[id] ?? { etapes: {}, domaine: null };
  const auto = { accord: docs.some((d) => d.type === "devis" && d.statut === "accepte"), en_ligne: !!pub, dns: false, facture: docs.some((d) => d.type === "facture" && d.statut === "payee") };
  return (
    <>
      <Retour href={`/espace/prospects/${id}`} lib={`Fiche de ${p.nom}`} />
      <div className="barre-haut" style={{ marginTop: ".6rem" }}><div><p className="note" style={{ margin: "0 0 .3rem" }}>Assistant de livraison · de l&apos;accord au premier avis</p><h1>Livrer le site de {p.nom}</h1></div></div>
      <AssistantLivraison key={id} prospect={{ id, nom: p.nom, ville: p.ville }} manuelles={l.etapes} auto={auto} domaine={pub?.domaine ?? l.domaine} dns={pub?.domaine ? { ok: false, detail: "Démo : la vérification DNS se fait dans l'application en ligne." } : null}
        siteId={pub?.site_id ?? sites[0]?.id ?? null} devisAccepte={docs.find((d) => d.type === "devis" && d.statut === "accepte")?.id ?? null} />
    </>
  );
}

/* ------------------------------------------------------------ offres */
export function Offres({ changer }: { changer: (p: any) => void }) {
  return (
    <>
      <div className="barre-haut"><div><p className="note" style={{ margin: "0 0 .3rem" }}>Démo : changez d&apos;offre librement pour voir ce que chacune débloque</p><h1>Mon abonnement</h1></div></div>
      <div className="offres">{ORDRE_PLANS.map((id) => { const P = PLANS[id]; return (
        <div key={id} className={`carte offre${P.misEnAvant ? " avant" : ""}`}>
          {P.misEnAvant && <span className="badge">Le plus complet</span>}
          <h3>{P.nom}</h3><p className="accroche">{P.accroche}</p>
          <p className="prix"><b>{P.prixMensuel} €</b><span>/ mois TTC</span></p>
          <ul className="inclus">
            <li><Check aria-hidden />{P.quotas.prospects} prospects par mois</li>
            <li><Check aria-hidden />{Number.isFinite(P.departements) ? `${P.departements} département(s)` : "France entière"}</li>
            <li className={P.quotas.sites_ia ? "" : "non"}><Check aria-hidden />{P.quotas.sites_ia ? `${P.quotas.sites_ia} sites sur mesure / mois` : "Maquettes express uniquement"}</li>
            <li className={P.studio.publications ? "" : "non"}><Check aria-hidden />{P.studio.publications ? `Mise en ligne : ${P.studio.publications} sites` : "Pas de mise en ligne"}</li>
            <li className={P.facturation ? "" : "non"}><Check aria-hidden />Devis et factures</li>
          </ul>
          <div className="pied-offre"><button type="button" className={`btn bloc${plan() === id ? "" : " p"}`} disabled={plan() === id} onClick={() => changer(id)}>{plan() === id ? "Offre de démo active" : `Essayer ${P.nom}`}</button></div>
        </div>); })}</div>
      <p className="note" style={{ marginTop: "1rem" }}>Dans l&apos;application, le paiement passe par Stripe, avec résiliation en 3 clics. Ici, rien n&apos;est facturé.</p>
    </>
  );
}

export function Zone() {
  return (
    <>
      <div className="barre-haut"><div><h1>Secteur et zone</h1></div></div>
      <div className="carte pile" style={{ maxWidth: "40rem" }}>
        <p style={{ margin: 0 }}><b>Secteur :</b> restauration (pizzerias, restaurants, snacks, cafés…)</p>
        <p style={{ margin: 0 }}><b>Zone :</b> Rhône (69)</p>
        <p className="note" style={{ margin: 0 }}>Démo : dans l&apos;application, vous choisissez votre secteur et vos départements (1 en Gratuit, jusqu&apos;à la France entière en Ultra).</p>
      </div>
    </>
  );
}
export { Search };
