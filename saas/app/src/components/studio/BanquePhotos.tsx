"use client";
import { useState } from "react";
import Link from "next/link";
import { Globe, Store, Trash2, Upload } from "lucide-react";
import type { PhotoPerso } from "@/lib/studio";

interface Props {
  photos: PhotoPerso[];
  max: number;                       // taille de la banque selon l'offre (0 = pas de banque)
  prospectId?: string | null;        // dans l'éditeur : le commerce du site
  prospectNom?: string;
  onChoisir?: (url: string) => void; // dans l'éditeur : place la photo à l'emplacement choisi
  selection?: string;
  onMessage?: (m: { ok?: boolean; t: string }) => void;
}

/**
 * Envoi de photos et banque personnelle.
 * À chaque envoi, on PROPOSE de garder la photo pour les prochains sites, avec une portée claire :
 * réservée à ce commerce (par défaut) ou utilisable sur tous les sites.
 */
export function BanquePhotos({ photos: initiales, max, prospectId, prospectNom, onChoisir, selection, onMessage }: Props) {
  const [photos, setPhotos] = useState(initiales);
  const [fichier, setFichier] = useState<File | null>(null);
  const [apercu, setApercu] = useState("");
  const [legende, setLegende] = useState("");
  const [garder, setGarder] = useState(max > 0);
  const [portee, setPortee] = useState<"commerce" | "tous">(prospectId ? "commerce" : "tous");
  const [vue, setVue] = useState<"commerce" | "tous">(prospectId ? "commerce" : "tous");
  const [charge, setCharge] = useState(false);
  const dire = (m: { ok?: boolean; t: string }) => (onMessage ? onMessage(m) : alert(m.t));

  const visibles = prospectId
    ? photos.filter((p) => (vue === "commerce" ? p.prospect_id === prospectId && p.portee === "commerce" : p.portee === "tous"))
    : photos;
  const nCommerce = prospectId ? photos.filter((p) => p.prospect_id === prospectId && p.portee === "commerce").length : 0;
  const nTous = photos.filter((p) => p.portee === "tous").length;

  function choisirFichier(f: File | undefined) {
    if (!f) return;
    setFichier(f); setApercu(URL.createObjectURL(f)); setLegende(""); setGarder(max > 0); setPortee(prospectId ? "commerce" : "tous");
  }
  function annuler() { if (apercu) URL.revokeObjectURL(apercu); setFichier(null); setApercu(""); }

  async function envoyer() {
    if (!fichier) return;
    setCharge(true);
    try {
      const fd = new FormData();
      fd.append("photo", fichier); fd.append("legende", legende);
      if (garder) fd.append("garder", "1");
      fd.append("portee", portee);
      if (prospectId) fd.append("prospect_id", prospectId);
      const r = await fetch("/api/studio/photo", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) { dire({ t: j.erreur ?? "Envoi impossible." }); return; }
      if (j.photo) { setPhotos((l) => [j.photo, ...l]); setVue(j.photo.portee); }
      onChoisir?.(j.url);
      dire(j.avertissement ? { t: j.avertissement } : { ok: true, t: onChoisir ? `Photo placée${j.photo ? " et gardée dans votre banque" : ""} : pensez à enregistrer le site.` : "Photo ajoutée à votre banque." });
      annuler();
    } catch { dire({ t: "Connexion impossible. Réessayez." }); } finally { setCharge(false); }
  }

  async function changerPortee(p: PhotoPerso) {
    const nouvelle = p.portee === "commerce" ? "tous" : "commerce";
    if (nouvelle === "tous" && !confirm("Rendre cette photo utilisable sur TOUS vos sites ?\n\nÀ faire seulement si vous en détenez les droits et qu'elle ne montre rien de propre à ce commerce (devanture, enseigne, plats signature, personnes) : sinon, le site d'un autre commerce serait trompeur.")) return;
    const r = await fetch(`/api/studio/photo/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ portee: nouvelle }) });
    const j = await r.json();
    if (r.ok) setPhotos((l) => l.map((x) => (x.id === p.id ? { ...x, ...j.photo } : x))); else dire({ t: j.erreur ?? "Modification impossible." });
  }
  async function renommer(p: PhotoPerso, l: string) {
    if (l === p.legende) return;
    const r = await fetch(`/api/studio/photo/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ legende: l }) });
    if (r.ok) setPhotos((x) => x.map((y) => (y.id === p.id ? { ...y, legende: l } : y)));
  }
  async function supprimer(p: PhotoPerso) {
    if (!confirm("Supprimer définitivement cette photo de votre banque ?\nLes sites qui l'utilisent ne l'afficheront plus.")) return;
    const r = await fetch(`/api/studio/photo/${p.id}`, { method: "DELETE" });
    if (r.ok) setPhotos((l) => l.filter((x) => x.id !== p.id)); else dire({ t: "Suppression impossible." });
  }

  return (
    <div className="banque-perso">
      {!fichier ? (
        <label className="btn bloc ed-envoi"><Upload aria-hidden />{prospectId ? "Envoyer une photo du commerce" : "Ajouter une photo à ma banque"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="cache" onChange={(e) => { choisirFichier(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      ) : (
        <div className="envoi-photo">
          <img src={apercu} alt="Photo à envoyer" />
          <label className="ed-champ"><span>Légende<small>{legende.length}/120</small></span>
            <input value={legende} maxLength={120} onChange={(e) => setLegende(e.target.value)} placeholder="Ex. devanture, salle, pizza margherita, équipe…" /></label>
          {max > 0 ? <>
            <label className="ed-case garder"><input type="checkbox" checked={garder} onChange={(e) => setGarder(e.target.checked)} />
              <span><b>Garder cette photo dans ma banque</b> pour la réutiliser sur mes prochains sites. L&apos;IA s&apos;en servira aussi automatiquement.</span></label>
            {garder && prospectId && (
              <div className="portees" role="radiogroup" aria-label="Utilisation de la photo">
                <label><input type="radio" checked={portee === "commerce"} onChange={() => setPortee("commerce")} /><Store aria-hidden /><span><b>Seulement pour {prospectNom ?? "ce commerce"}</b><small>Devanture, salle, plats, équipe : le choix par défaut.</small></span></label>
                <label><input type="radio" checked={portee === "tous"} onChange={() => setPortee("tous")} /><Globe aria-hidden /><span><b>Pour tous mes sites</b><small>Photo dont vous détenez les droits, sans rien de propre à ce commerce.</small></span></label>
              </div>
            )}
            {!garder && <p className="note" style={{ margin: 0 }}>La photo servira uniquement à ce site.</p>}
          </> : <p className="note" style={{ margin: 0 }}>La banque de photos personnelle est incluse dès l&apos;offre Premium.</p>}
          <div className="ed-ligne">
            <button type="button" className="btn p" onClick={envoyer} disabled={charge}>{charge ? "Envoi…" : "Envoyer"}</button>
            <button type="button" className="btn" onClick={annuler} disabled={charge}>Annuler</button>
          </div>
        </div>
      )}
      <p className="note" style={{ margin: 0 }}>JPEG, PNG ou WebP, 5 Mo maximum. Uniquement des photos dont vous ou le commerçant détenez les droits.</p>

      {max > 0 && <>
        <div className="banque-entete">
          <b>{onChoisir ? "Ma banque" : `Ma banque · ${photos.length}/${max}`}</b>
          {!onChoisir ? null : <Link href="/espace/studio/photos" className="note">Gérer</Link>}
        </div>
        {prospectId && (
          <div className="bascule" role="group" aria-label="Photos affichées" style={{ margin: 0 }}>
            <button type="button" aria-pressed={vue === "commerce"} onClick={() => setVue("commerce")}>Ce commerce ({nCommerce})</button>
            <button type="button" aria-pressed={vue === "tous"} onClick={() => setVue("tous")}>Tous mes sites ({nTous})</button>
          </div>
        )}
        {!visibles.length ? <p className="note" style={{ margin: 0 }}>{prospectId && vue === "commerce" ? "Aucune photo de ce commerce pour l'instant." : "Aucune photo pour l'instant."}</p> : (
          <ul className="banque-liste">
            {visibles.map((p) => (
              <li key={p.id} className={selection === p.url ? "choisie" : undefined}>
                {onChoisir
                  ? <button type="button" className="vignette" onClick={() => onChoisir(p.url)} aria-pressed={selection === p.url} title="Placer cette photo"><img src={p.url} alt={p.legende} loading="lazy" /></button>
                  : <span className="vignette"><img src={p.url} alt={p.legende} loading="lazy" /></span>}
                <input defaultValue={p.legende} maxLength={120} placeholder="Légende" aria-label="Légende" onBlur={(e) => renommer(p, e.target.value.trim())} />
                <div className="ed-ligne">
                  <button type="button" className={`etiquette-portee ${p.portee}`} onClick={() => changerPortee(p)} disabled={p.portee === "tous" && !p.prospect_id} title="Changer l'utilisation">
                    {p.portee === "tous" ? <><Globe aria-hidden />Tous mes sites</> : <><Store aria-hidden />{p.prospect_nom ?? "Ce commerce"}</>}
                  </button>
                  <button type="button" className="ed-ico" onClick={() => supprimer(p)} aria-label="Supprimer"><Trash2 aria-hidden /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </>}
    </div>
  );
}
