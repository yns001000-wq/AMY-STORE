"use client";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CircleHelp, Clock, Download, History, ImageIcon, LayoutList, ListChecks, Lock, Monitor, Palette, RotateCcw, Save, Smartphone, Trash2, Type, Undo2, Upload, WandSparkles,
} from "lucide-react";
import type { CapacitesStudio, PlanId } from "@/lib/plans";
import { BANQUE_PHOTOS, FAMILLES, ICONES, JOURS, PALETTES, POLICES, SECTIONS, rendreSite, type DonneesSite } from "@/lib/studio";
import { Articles, ListeTextes, Texte, Verrou, type Article } from "./champs";
import { EtudeIA, type Etude } from "./EtudeIA";

type Onglet = "ia" | "textes" | "style" | "sections" | "carte" | "horaires" | "faq" | "photos" | "versions" | "telecharger";
const ONGLETS: [Onglet, string, typeof Type][] = [
  ["ia", "IA", WandSparkles], ["textes", "Textes", Type], ["style", "Style", Palette], ["sections", "Sections", LayoutList], ["carte", "Carte", ListChecks],
  ["horaires", "Horaires", Clock], ["faq", "FAQ", CircleHelp], ["photos", "Photos", ImageIcon], ["versions", "Versions", History], ["telecharger", "Télécharger", Download],
];
const SUGGESTIONS = ["Ajoute une formule du midi", "Rends le ton plus chic", "Mets en avant la livraison et la vente à emporter", "Raccourcis tous les textes", "Ajoute une catégorie Boissons à la carte", "Écris une FAQ plus complète"];
const HORAIRE = /^\d\d:\d\d-\d\d:\d\d(,\d\d:\d\d-\d\d:\d\d)*$/;

export interface VersionResume { id: number; libelle: string | null; cree_le: string }
interface Props { id: string; initial: DonneesSite; etude: Etude | null; plan: PlanId; cap: CapacitesStudio; versions: VersionResume[]; retouches: { utilise: number; max: number } }

/* eslint-disable @typescript-eslint/no-explicit-any */
export function EditeurStudio({ id, initial, etude: etude0, plan, cap, versions, retouches }: Props) {
  const router = useRouter();
  const [d, setD] = useState<DonneesSite>(initial);
  const [modifies, setModifies] = useState<Set<string>>(new Set());
  const [onglet, setOnglet] = useState<Onglet>(cap.effortIA ? "ia" : "textes");
  const [vue, setVue] = useState<"ordi" | "mobile">("ordi");
  const [ecranMobile, setEcranMobile] = useState<"modifier" | "apercu">("modifier");
  const [msg, setMsg] = useState<{ ok?: boolean; t: string } | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [etude, setEtude] = useState<Etude | null>(etude0);
  const [utilise, setUtilise] = useState(retouches.utilise);
  const pile = useRef<DonneesSite[]>([]), dernier = useRef(0);

  /* ---------- modifications locales (aperçu instantané ; le serveur valide à l'enregistrement) ---------- */
  const changer = useCallback((bloc: string, valeur: unknown) => {
    setD((prev) => {
      const t = Date.now();
      if (t - dernier.current > 900) { pile.current = [...pile.current.slice(-49), prev]; }
      dernier.current = t;
      return { ...prev, [bloc]: valeur };
    });
    setModifies((m) => new Set(m).add(bloc));
  }, []);
  const dans = (bloc: string, cle: string, v: unknown) => changer(bloc, { ...(d[bloc] ?? {}), [cle]: v });
  const annuler = () => { const p = pile.current.pop(); if (p) { setD(p); dernier.current = 0; } };

  const enregistrer = useCallback(async (silencieux = false): Promise<boolean> => {
    if (!modifies.size) return true;
    setOccupe("Enregistrement…");
    try {
      const edition = Object.fromEntries([...modifies].map((k) => [k, d[k]]));
      const r = await fetch(`/api/studio/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ edition }) });
      const j = await r.json();
      if (!r.ok) { setMsg({ t: j.erreur ?? "Enregistrement impossible." }); return false; }
      setD(j.donnees); setModifies(new Set());
      if (j.refuses?.length) setMsg({ t: `Non appliqué avec votre offre : ${j.refuses.join(", ")}.` });
      else if (!silencieux) setMsg({ ok: true, t: "Modifications enregistrées." });
      router.refresh();
      return true;
    } catch { setMsg({ t: "Connexion impossible. Réessayez." }); return false; } finally { setOccupe(null); }
  }, [d, id, modifies, router]);

  useEffect(() => {
    const avant = (e: BeforeUnloadEvent) => { if (modifies.size) e.preventDefault(); };
    const touche = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); enregistrer(); } };
    window.addEventListener("beforeunload", avant); window.addEventListener("keydown", touche);
    return () => { window.removeEventListener("beforeunload", avant); window.removeEventListener("keydown", touche); };
  }, [modifies, enregistrer]);

  /* ---------- aperçu ---------- */
  const dv = useDeferredValue(d);
  const html = useMemo(() => { try { return rendreSite(dv, cap); } catch { return "<p style='font:16px system-ui;padding:2rem'>Aperçu indisponible : vérifiez le dernier champ modifié.</p>"; } }, [dv, cap]);

  /* ---------- IA ---------- */
  const [consigne, setConsigne] = useState("");
  const [explication, setExplication] = useState("");
  async function retoucher() {
    if (!(await enregistrer(true))) return;
    setOccupe("L'IA retouche votre site…"); setExplication(""); setMsg(null);
    try {
      const r = await fetch(`/api/studio/${id}/retouche`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consigne }) });
      const j = await r.json();
      if (!r.ok) { setMsg({ t: j.erreur ?? "La retouche n'a pas abouti." }); return; }
      pile.current.push(d); setD(j.donnees); setUtilise((u) => u + 1); setConsigne("");
      setExplication(j.explication || "Retouche appliquée.");
      if (j.refuses?.length) setMsg({ t: `Partie non appliquée avec votre offre : ${j.refuses.join(", ")}.` });
      router.refresh();
    } catch { setMsg({ t: "Connexion impossible. Réessayez." }); } finally { setOccupe(null); }
  }

  async function restaurer(v: number) {
    if (modifies.size && !confirm("Vos modifications non enregistrées seront perdues. Continuer ?")) return;
    setOccupe("Restauration…");
    try {
      const r = await fetch(`/api/studio/${id}/restaurer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version_id: v }) });
      const j = await r.json();
      if (!r.ok) { setMsg({ t: j.erreur ?? "Restauration impossible." }); return; }
      setD(j.donnees); setModifies(new Set()); setMsg({ ok: true, t: "Version restaurée (l'état précédent a été archivé)." }); router.refresh();
    } finally { setOccupe(null); }
  }

  async function supprimer() {
    if (!confirm("Supprimer définitivement ce site et son historique ?")) return;
    const r = await fetch(`/api/studio/${id}`, { method: "DELETE" });
    if (r.ok) { setModifies(new Set()); router.push("/espace/studio"); } else setMsg({ t: "Suppression impossible." });
  }

  /* ---------- photos ---------- */
  const [emplacement, setEmplacement] = useState<"accueil" | "maison0" | "maison1">("accueil");
  const [filtre, setFiltre] = useState("");
  const photosFiltrees = useMemo(() => {
    const sans = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    let f = sans(filtre.trim()); if (f.length >= 5) f = f.slice(0, -1); // « pizza » trouve aussi « pizzeria »
    return f ? BANQUE_PHOTOS.filter((p) => sans(p.legende + " " + p.cle).includes(f)) : BANQUE_PHOTOS;
  }, [filtre]);
  const poserPhoto = (url: string) => {
    if (emplacement === "accueil") dans("accueil", "photo", url);
    else { const ph = [...(d.maison?.photos ?? [])]; ph[emplacement === "maison0" ? 0 : 1] = url; dans("maison", "photos", ph.filter(Boolean)); }
  };
  const photoActuelle = emplacement === "accueil" ? d.accueil?.photo : d.maison?.photos?.[emplacement === "maison0" ? 0 : 1];
  async function envoyerPhoto(f: File | undefined) {
    if (!f) return;
    setOccupe("Envoi de la photo…");
    try {
      const fd = new FormData(); fd.append("photo", f);
      const r = await fetch("/api/studio/photo", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) setMsg({ t: j.erreur ?? "Envoi impossible." }); else { poserPhoto(j.url); setMsg({ ok: true, t: "Photo ajoutée : pensez à enregistrer." }); }
    } finally { setOccupe(null); }
  }

  const [verifie, setVerifie] = useState(false);
  const F = FAMILLES[d.famille] ?? FAMILLES.artisan;
  const masquees: string[] = d.masquer ?? [];
  const offre = d.offre ?? { onglets: [] };
  const restant = Math.max(0, retouches.max - utilise);

  if (etude?.statut === "a_confirmer") {
    return <EtudeIA id={id} etude={etude} onRedige={(donnees) => { setD(donnees); setEtude({ ...etude, statut: "redige" }); setOnglet("textes"); router.refresh(); }} />;
  }

  return (
    <div className="studio" data-ecran={ecranMobile}>
      <div className="studio-barre">
        <div className="bascule studio-ecran" role="group" aria-label="Affichage">
          <button type="button" aria-pressed={ecranMobile === "modifier"} onClick={() => setEcranMobile("modifier")}>Modifier</button>
          <button type="button" aria-pressed={ecranMobile === "apercu"} onClick={() => setEcranMobile("apercu")}>Aperçu</button>
        </div>
        <button type="button" className="btn" onClick={annuler} disabled={!pile.current.length} title="Annuler la dernière modification"><Undo2 aria-hidden /><span className="lib">Annuler</span></button>
        <button type="button" className="btn p" onClick={() => enregistrer()} disabled={!modifies.size || !!occupe}><Save aria-hidden />{modifies.size ? "Enregistrer" : "Enregistré"}</button>
        {occupe && <span className="note studio-occupe" role="status"><span className="rond" aria-hidden />{occupe}</span>}
      </div>
      {msg && <p className={`alerte${msg.ok ? " ok" : ""}`} role="status" style={{ gridColumn: "1 / -1" }}>{msg.t}<button type="button" className="ed-fermer" onClick={() => setMsg(null)} aria-label="Fermer">×</button></p>}

      <section className="studio-panneau" aria-label="Panneau de modification">
        <nav className="studio-onglets" aria-label="Rubriques">
          {ONGLETS.map(([o, lib, Ico]) => <button key={o} type="button" aria-pressed={onglet === o} onClick={() => setOnglet(o)}><Ico aria-hidden />{lib}</button>)}
        </nav>

        <div className="studio-contenu">
          {onglet === "ia" && (
            <Verrou ok={!!cap.effortIA} offre="Pro" titre="Retouches par l'IA">
              <p className="note">Décrivez ce que vous voulez changer, en français courant. L&apos;IA modifie les rubriques concernées et garde l&apos;historique.</p>
              <textarea rows={4} value={consigne} onChange={(e) => setConsigne(e.target.value)} placeholder="Ex. ajoute une formule midi à 13,90 € avec plat et dessert" maxLength={2000} />
              <div className="puces">{SUGGESTIONS.map((s) => <button key={s} type="button" onClick={() => setConsigne(s)}>{s}</button>)}</div>
              <button type="button" className="btn p bloc" onClick={retoucher} disabled={!!occupe || consigne.trim().length < 3 || restant <= 0}><WandSparkles aria-hidden />Appliquer avec l&apos;IA</button>
              <p className="note">{cap.effortIA ? `${restant} retouche${restant > 1 ? "s" : ""} restante${restant > 1 ? "s" : ""} ce mois-ci · réflexion ${({ medium: "standard", high: "approfondie", xhigh: "maximale" } as const)[cap.effortIA]}` : "Retouches IA incluses dès l'offre Pro."}</p>
              {explication && <p className="alerte ok">{explication}</p>}
            </Verrou>
          )}

          {onglet === "textes" && <>
            <fieldset className="ed-bloc"><legend>Établissement</legend>
              <Texte label="Nom" valeur={d.nom} max={80} onChange={(v) => changer("nom", v)} />
              <div className="deux-col">
                <Texte label="Téléphone" valeur={d.telephone} max={30} onChange={(v) => changer("telephone", v)} />
                <Texte label="E-mail" valeur={d.email} max={120} onChange={(v) => changer("email", v)} />
              </div>
              <Texte label="Adresse" valeur={d.adresse} max={160} onChange={(v) => changer("adresse", v)} />
              <div className="deux-col">
                <Texte label="Code postal" valeur={d.code_postal} max={10} onChange={(v) => changer("code_postal", v)} />
                <Texte label="Ville" valeur={d.ville} max={80} onChange={(v) => changer("ville", v)} />
              </div>
            </fieldset>
            <fieldset className="ed-bloc"><legend>Accueil</legend>
              <Texte label="Grand titre" valeur={d.accueil?.h1} max={60} onChange={(v) => dans("accueil", "h1", v)} aide="Gardez le métier : c'est ce que Google lit en premier." />
              <Texte label="Suite du titre" valeur={d.accueil?.h1_suite} max={60} onChange={(v) => dans("accueil", "h1_suite", v)} />
              <Texte label="Présentation" valeur={d.accueil?.chapo} max={330} lignes={4} onChange={(v) => dans("accueil", "chapo", v)} />
              <ListeTextes label="Atouts" valeurs={d.accueil?.atouts} max={120} n={4} onChange={(v) => dans("accueil", "atouts", v)} />
            </fieldset>
            <fieldset className="ed-bloc"><legend>La maison</legend>
              <Texte label="Titre" valeur={d.maison?.titre} max={80} onChange={(v) => dans("maison", "titre", v)} />
              <Texte label="Texte" valeur={d.maison?.texte} max={600} lignes={6} onChange={(v) => dans("maison", "texte", v)} />
              {(d.maison?.engagements ?? []).map((e: any, i: number) => (
                <div className="ed-article" key={i}>
                  <div className="ed-ligne">
                    <input value={e.titre ?? ""} maxLength={60} aria-label="Engagement" onChange={(x) => dans("maison", "engagements", d.maison.engagements.map((y: any, j: number) => (j === i ? { ...y, titre: x.target.value } : y)))} />
                    <select value={e.icone} aria-label="Icône" onChange={(x) => dans("maison", "engagements", d.maison.engagements.map((y: any, j: number) => (j === i ? { ...y, icone: x.target.value } : y)))}>{ICONES.map((k) => <option key={k}>{k}</option>)}</select>
                  </div>
                  <textarea rows={2} value={e.texte ?? ""} maxLength={180} aria-label="Texte de l'engagement" onChange={(x) => dans("maison", "engagements", d.maison.engagements.map((y: any, j: number) => (j === i ? { ...y, texte: x.target.value } : y)))} />
                </div>
              ))}
              <Texte label="Signature" valeur={d.maison?.signature} max={50} onChange={(v) => dans("maison", "signature", v)} />
            </fieldset>
            <fieldset className="ed-bloc"><legend>Appel final</legend>
              <Texte label="Titre" valeur={d.final?.titre} max={70} onChange={(v) => dans("final", "titre", v)} />
              <Texte label="Texte" valeur={d.final?.texte} max={200} lignes={2} onChange={(v) => dans("final", "texte", v)} />
            </fieldset>
            <Verrou ok={cap.editionComplete} offre="Pro" titre="Référencement Google">
              <Texte label="Titre de la page" valeur={d.title} max={90} onChange={(v) => changer("title", v)} aide="Métier + ville : « Pizzeria à Lyon 3e · Pizza Bella »." />
              <Texte label="Description" valeur={d.meta_description} max={170} lignes={3} onChange={(v) => changer("meta_description", v)} />
            </Verrou>
          </>}

          {onglet === "style" && <>
            <fieldset className="ed-bloc"><legend>Palettes</legend>
              <div className="palettes">
                {PALETTES.map((p) => {
                  const actif = d.couleurs?.principal === p.principal && d.couleurs?.accent === p.accent;
                  return <button key={p.id} type="button" aria-pressed={actif} onClick={() => changer("couleurs", { principal: p.principal, accent: p.accent })}><i style={{ background: p.principal }} /><i style={{ background: p.accent }} />{p.nom}</button>;
                })}
                <button type="button" aria-pressed={!d.couleurs} onClick={() => changer("couleurs", null)}><i style={{ background: F.principal }} /><i style={{ background: F.accent }} />Couleurs du modèle</button>
              </div>
            </fieldset>
            <Verrou ok={cap.couleursLibres} offre="Pro" titre="Couleurs sur mesure">
              <div className="deux-col">
                <label className="ed-champ"><span>Principale</span><input type="color" value={d.couleurs?.principal ?? F.principal} onChange={(e) => changer("couleurs", { ...(d.couleurs ?? { accent: F.accent }), principal: e.target.value })} /></label>
                <label className="ed-champ"><span>Accent</span><input type="color" value={d.couleurs?.accent ?? F.accent} onChange={(e) => changer("couleurs", { ...(d.couleurs ?? { principal: F.principal }), accent: e.target.value })} /></label>
              </div>
              <p className="note">Le contraste est vérifié automatiquement : les textes restent lisibles (norme WCAG AA), quelle que soit la teinte.</p>
            </Verrou>
            <Verrou ok={cap.choixModele} offre="Pro" titre="Modèle de site">
              <select value={d.famille} onChange={(e) => changer("famille", e.target.value)} aria-label="Modèle">
                {Object.entries(FAMILLES).map(([k, f]) => <option key={k} value={k}>{f.lib}</option>)}
              </select>
              <p className="note">Change la mise en page, l&apos;emblème, les couleurs par défaut et les données Google (type d&apos;établissement).</p>
            </Verrou>
            <Verrou ok={cap.polices} offre="Premium" titre="Police des titres">
              <div className="polices">
                <button type="button" aria-pressed={!d.police} onClick={() => changer("police", null)}>Celle du modèle</button>
                {Object.entries(POLICES).map(([k, lib]) => <button key={k} type="button" aria-pressed={d.police === k} onClick={() => changer("police", k)}>{lib}</button>)}
              </div>
            </Verrou>
          </>}

          {onglet === "sections" && <>
            <fieldset className="ed-bloc"><legend>Sections affichées</legend>
              {SECTIONS.map(([k, lib]) => (
                <label key={k} className="ed-case"><input type="checkbox" checked={!masquees.includes(k)} onChange={(e) => changer("masquer", e.target.checked ? masquees.filter((x) => x !== k) : [...masquees, k])} />{lib}</label>
              ))}
              <p className="note">L&apos;accueil, la carte, les horaires, le contact et la carte Google Maps du lieu restent toujours affichés.</p>
            </fieldset>
            <fieldset className="ed-bloc"><legend>Bandeau défilant</legend>
              <ListeTextes label="Messages" valeurs={d.defilant} max={120} n={8} onChange={(v) => changer("defilant", v)} />
            </fieldset>
          </>}

          {onglet === "carte" && <>
            <Verrou ok={cap.editionComplete} offre="Pro" titre={F.offre}>
              <div className="deux-col">
                <Texte label="Menu du site" valeur={offre.nav} max={24} onChange={(v) => dans("offre", "nav", v)} />
                <Texte label="Titre" valeur={offre.titre} max={60} onChange={(v) => dans("offre", "titre", v)} />
              </div>
              <Texte label="Introduction" valeur={offre.texte} max={260} lignes={2} onChange={(v) => dans("offre", "texte", v)} />
              {(offre.onglets ?? []).map((g: { nom: string; articles: Article[] }, i: number) => (
                <details key={i} className="ed-onglet" open={i === 0}>
                  <summary>{g.nom || "Catégorie sans nom"} <small>{g.articles?.length ?? 0} article(s)</small></summary>
                  <div className="ed-ligne">
                    <input value={g.nom} maxLength={30} aria-label="Nom de la catégorie" onChange={(e) => dans("offre", "onglets", offre.onglets.map((x: any, j: number) => (j === i ? { ...x, nom: e.target.value } : x)))} />
                    <button type="button" className="ed-ico" aria-label="Supprimer la catégorie" onClick={() => dans("offre", "onglets", offre.onglets.filter((_: unknown, j: number) => j !== i))}><Trash2 aria-hidden /></button>
                  </div>
                  <Articles articles={g.articles} n={18} duree={!F.repas} onChange={(a) => dans("offre", "onglets", offre.onglets.map((x: any, j: number) => (j === i ? { ...x, articles: a } : x)))} />
                </details>
              ))}
              {(offre.onglets?.length ?? 0) < 6 && <button type="button" className="ed-ajout" onClick={() => dans("offre", "onglets", [...(offre.onglets ?? []), { nom: "Nouvelle catégorie", articles: [{ nom: "", desc: "", prix: "" }] }])}>+ Ajouter une catégorie</button>}
              <Texte label="Mention sous la carte" valeur={offre.pied} max={260} lignes={2} onChange={(v) => dans("offre", "pied", v)} />
            </Verrou>
            <Verrou ok={cap.editionComplete} offre="Pro" titre="Incontournables">
              <Texte label="Titre" valeur={d.vedettes?.titre} max={60} onChange={(v) => dans("vedettes", "titre", v)} />
              <Articles articles={d.vedettes?.articles} n={8} onChange={(a) => dans("vedettes", "articles", a)} />
            </Verrou>
          </>}

          {onglet === "horaires" && <>
            <Verrou ok={cap.editionComplete} offre="Pro" titre="Horaires d'ouverture">
              <p className="note">Format : 11:45-14:00,18:30-22:00. Laissez vide si fermé.</p>
              {JOURS.map(([k, lib]) => {
                const v = d.horaires?.[k] ?? "", ok = !v || HORAIRE.test(v.replace(/\s/g, ""));
                return <label key={k} className="ed-jour"><span>{lib}</span><input value={v} placeholder="Fermé" aria-invalid={!ok} onChange={(e) => changer("horaires", { ...(d.horaires ?? {}), [k]: e.target.value })} />{!ok && <small>Format invalide</small>}</label>;
              })}
            </Verrou>
            <Verrou ok={cap.editionComplete} offre="Pro" titre="Infos pratiques">
              <Texte label="Texte" valeur={d.infos?.texte} max={200} lignes={2} onChange={(v) => dans("infos", "texte", v)} />
              <ListeTextes label="Accès (métro, parking…)" valeurs={d.infos?.acces} max={120} n={3} onChange={(v) => dans("infos", "acces", v)} />
              <ListeTextes label="Bon à savoir" valeurs={d.infos?.bon_a_savoir} max={120} n={7} onChange={(v) => dans("infos", "bon_a_savoir", v)} />
            </Verrou>
          </>}

          {onglet === "faq" && (
            <Verrou ok={cap.editionComplete} offre="Pro" titre="Questions fréquentes">
              {(d.faq ?? []).map((q: { q: string; r: string }, i: number) => (
                <div className="ed-article" key={i}>
                  <div className="ed-ligne">
                    <input value={q.q} maxLength={140} placeholder="Question" aria-label="Question" onChange={(e) => changer("faq", d.faq.map((x: any, j: number) => (j === i ? { ...x, q: e.target.value } : x)))} />
                    <button type="button" className="ed-ico" aria-label="Supprimer" onClick={() => changer("faq", d.faq.filter((_: unknown, j: number) => j !== i))}><Trash2 aria-hidden /></button>
                  </div>
                  <textarea rows={3} value={q.r} maxLength={420} placeholder="Réponse" aria-label="Réponse" onChange={(e) => changer("faq", d.faq.map((x: any, j: number) => (j === i ? { ...x, r: e.target.value } : x)))} />
                </div>
              ))}
              {(d.faq?.length ?? 0) < 7 && <button type="button" className="ed-ajout" onClick={() => changer("faq", [...(d.faq ?? []), { q: "", r: "" }])}>+ Ajouter une question</button>}
              <p className="note">Les questions apparaissent aussi dans les résultats Google (données structurées).</p>
            </Verrou>
          )}

          {onglet === "photos" && <>
            <fieldset className="ed-bloc"><legend>Emplacement</legend>
              <div className="bascule" role="group" aria-label="Emplacement de la photo" style={{ margin: 0 }}>
                <button type="button" aria-pressed={emplacement === "accueil"} onClick={() => setEmplacement("accueil")}>Accueil</button>
                <button type="button" aria-pressed={emplacement === "maison0"} onClick={() => setEmplacement("maison0")}>Maison 1</button>
                <button type="button" aria-pressed={emplacement === "maison1"} onClick={() => setEmplacement("maison1")}>Maison 2</button>
              </div>
              <div className="photo-actuelle">
                {photoActuelle ? <img src={photoActuelle} alt="" /> : <span className="note">Aucune photo</span>}
                {photoActuelle && <button type="button" className="btn" onClick={() => poserPhoto("")}>Retirer</button>}
              </div>
            </fieldset>
            <Verrou ok={cap.photosPerso} offre="Premium" titre="Vos photos">
              <label className="btn bloc ed-envoi"><Upload aria-hidden />Envoyer une photo du commerce<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => envoyerPhoto(e.target.files?.[0])} className="cache" /></label>
              <p className="note">JPEG, PNG ou WebP, 5 Mo maximum. N&apos;utilisez que des photos dont le commerçant détient les droits.</p>
            </Verrou>
            <fieldset className="ed-bloc"><legend>Banque de photos MySite ({BANQUE_PHOTOS.length})</legend>
              <input type="search" value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder="Rechercher : pizza, sushi, coiffure…" aria-label="Rechercher une photo" />
              <div className="banque">
                {photosFiltrees.map((p) => <button key={p.cle} type="button" aria-pressed={photoActuelle === p.url} onClick={() => poserPhoto(p.url)} title={p.legende}><img src={p.url} alt={p.legende} loading="lazy" /></button>)}
              </div>
              <p className="note">Images d&apos;illustration générées par IA : à remplacer par de vraies photos du commerce avant la mise en ligne.</p>
            </fieldset>
          </>}

          {onglet === "versions" && (
            <Verrou ok={cap.versions > 0} offre="Pro" titre={`Historique (${cap.versions || 0} versions conservées)`}>
              {!versions.length && <p className="note">Aucune version pour l&apos;instant : chaque enregistrement ou retouche IA en crée une.</p>}
              <ul className="ed-versions">
                {versions.map((v) => (
                  <li key={v.id}><span><b>{v.libelle ?? "Version"}</b><small>{new Date(v.cree_le).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</small></span>
                    <button type="button" className="btn" onClick={() => restaurer(v.id)} disabled={!!occupe}><RotateCcw aria-hidden />Restaurer</button></li>
                ))}
              </ul>
            </Verrou>
          )}

          {onglet === "telecharger" && <>
            <fieldset className="ed-bloc"><legend>Maquette à montrer</legend>
              <p className="note">Fichier HTML autonome avec le bandeau « maquette » : idéal pour l&apos;envoyer au commerçant ou l&apos;ouvrir sur votre téléphone pendant le rendez-vous.{cap.filigrane ? " L'offre Gratuite ajoute la mention « Fait avec MySite »." : ""}</p>
              <a className="btn bloc" href={`/api/studio/${id}/telecharger`} onClick={(e) => { if (modifies.size) { e.preventDefault(); setMsg({ t: "Enregistrez d'abord vos modifications." }); } }}><Download aria-hidden />Télécharger la maquette</a>
            </fieldset>
            <Verrou ok={plan !== "gratuit"} offre="Pro" titre="Version finale à mettre en ligne">
              <p className="note">Sans bandeau de maquette et indexable par Google{cap.marqueBlanche ? ", en marque blanche" : ""}. À héberger chez Netlify, OVH, o2switch…</p>
              <label className="ed-case"><input type="checkbox" checked={verifie} onChange={(e) => setVerifie(e.target.checked)} />J&apos;ai vérifié avec le gérant les textes, prix, horaires et photos.</label>
              <a className={`btn p bloc${verifie && !modifies.size ? "" : " inactif"}`} aria-disabled={!verifie || !!modifies.size} href={verifie && !modifies.size ? `/api/studio/${id}/telecharger?finale=1` : undefined}><Download aria-hidden />Télécharger la version finale</a>
            </Verrou>
            {d.a_verifier?.length > 0 && <fieldset className="ed-bloc"><legend>À vérifier avant la mise en ligne</legend><ul className="ed-verifier">{d.a_verifier.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></fieldset>}
            <button type="button" className="btn" style={{ color: "#ef4444" }} onClick={supprimer}><Trash2 aria-hidden />Supprimer ce site</button>
          </>}
        </div>
        {plan === "gratuit" && <p className="note studio-upsell"><Lock size={14} aria-hidden /> Offre Gratuite : textes, palettes et sections. <Link href="/espace/abonnement">Débloquer la carte, l&apos;IA et la version finale</Link></p>}
      </section>

      <section className="studio-apercu" aria-label="Aperçu du site">
        <div className="apercu-barre">
          <i /><i /><i />
          <span>{d.nom} · aperçu en direct</span>
          <div className="bascule" role="group" aria-label="Taille d'écran" style={{ margin: "0 0 0 auto", padding: ".15rem" }}>
            <button type="button" aria-pressed={vue === "ordi"} onClick={() => setVue("ordi")} aria-label="Ordinateur"><Monitor size={15} aria-hidden /></button>
            <button type="button" aria-pressed={vue === "mobile"} onClick={() => setVue("mobile")} aria-label="Téléphone"><Smartphone size={15} aria-hidden /></button>
          </div>
        </div>
        <div className={`studio-cadre ${vue}`}>
          <iframe title="Aperçu du site" srcDoc={html} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
        </div>
      </section>
    </div>
  );
}
