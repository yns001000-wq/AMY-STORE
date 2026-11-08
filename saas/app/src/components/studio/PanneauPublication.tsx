"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, ExternalLink, Globe, RefreshCw, Rocket, XCircle } from "lucide-react";
import type { CapacitesStudio } from "@/lib/plans";
import { slugDepuis } from "@/lib/publication";
import type { DonneesSite } from "@/lib/studio";

interface Etat {
  publie: boolean; slug?: string; domaine?: string | null; url?: string; urlDomaine?: string | null; mentions?: Record<string, string>;
  dns?: { ok: boolean; detail: string } | null; reglages?: { type: string; nom: string; valeur: string }[]; maj_le?: string;
}

/** Mise en ligne en un clic du site final, avec mentions légales obligatoires et branchement du domaine du client. */
export function PanneauPublication({ id, d, cap, siret, nonEnregistre, onMessage }: { id: string; d: DonneesSite; cap: CapacitesStudio; siret?: string | null; nonEnregistre: boolean; onMessage: (m: { ok?: boolean; t: string }) => void }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [slug, setSlug] = useState(slugDepuis(String(d.nom ?? "site"), d.ville));
  const [domaine, setDomaine] = useState("");
  const [m, setM] = useState({ editeur: String(d.nom ?? ""), forme: "", siret: siret ?? "", adresse: [d.adresse, [d.code_postal, d.ville].filter(Boolean).join(" ")].filter(Boolean).join(", "), telephone: String(d.telephone ?? ""), email: String(d.email ?? ""), directeur: "", realisation: "" });
  const [verifie, setVerifie] = useState(false);
  const [charge, setCharge] = useState(false);

  async function lire() {
    const r = await fetch(`/api/studio/${id}/publier`);
    const j: Etat = await r.json().catch(() => ({ publie: false }));
    setEtat(j);
    if (j.publie) { setSlug(j.slug!); setDomaine(j.domaine ?? ""); if (j.mentions) setM((x) => ({ ...x, ...j.mentions })); }
  }
  useEffect(() => { if (cap.publications > 0) lire(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function publier() {
    if (nonEnregistre) { onMessage({ t: "Enregistrez d'abord vos modifications." }); return; }
    setCharge(true);
    try {
      const r = await fetch(`/api/studio/${id}/publier`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, domaine: domaine || null, mentions: m, verifie }) });
      const j = await r.json();
      if (!r.ok) { onMessage({ t: j.erreur ?? "Mise en ligne impossible." }); return; }
      onMessage({ ok: true, t: etat?.publie ? "Site mis à jour en ligne." : "Votre site est en ligne !" });
      if (j.branchement?.startsWith("erreur")) onMessage({ t: `Site en ligne, mais le domaine n'a pas pu être relié automatiquement (${j.branchement}).` });
      await lire();
    } catch { onMessage({ t: "Connexion impossible. Réessayez." }); } finally { setCharge(false); }
  }
  async function retirer() {
    if (!confirm("Retirer ce site de la ligne ? Il restera dans votre Studio.")) return;
    await fetch(`/api/studio/${id}/publier`, { method: "DELETE" });
    onMessage({ ok: true, t: "Site retiré de la ligne." }); setEtat({ publie: false });
  }

  if (cap.publications <= 0) return null;
  const champ = (k: keyof typeof m, lib: string, aide?: string) => (
    <label className="ed-champ"><span>{lib}</span><input value={m[k]} onChange={(e) => setM({ ...m, [k]: e.target.value })} />{aide && <em>{aide}</em>}</label>
  );

  return (
    <div className="publication">
      {etat?.publie && (
        <div className="en-ligne">
          <p><CheckCircle2 aria-hidden /><b>En ligne</b> depuis le {new Date(etat.maj_le ?? Date.now()).toLocaleDateString("fr-FR")}</p>
          <div className="ed-ligne"><a className="lien-site" href={etat.url} target="_blank" rel="noopener">{etat.url?.replace(/^https?:\/\//, "")}<ExternalLink aria-hidden /></a>
            <button type="button" className="ed-ico" aria-label="Copier l'adresse" onClick={() => navigator.clipboard?.writeText(etat.url!)}><Copy aria-hidden /></button></div>
          {etat.domaine && (
            <div className="dns">
              <p className={etat.dns?.ok ? "ok" : "attente"}>{etat.dns?.ok ? <CheckCircle2 aria-hidden /> : <XCircle aria-hidden />}<span><b>{etat.domaine}</b> : {etat.dns?.detail}</span></p>
              {!etat.dns?.ok && <>
                <p className="note">À saisir chez le registraire du client (OVH, Gandi, Infomaniak, IONOS…), rubrique « Zone DNS ». La propagation prend de quelques minutes à 48 h.</p>
                <table className="table-dns"><thead><tr><th>Type</th><th>Nom</th><th>Valeur</th></tr></thead>
                  <tbody>{etat.reglages?.map((r, i) => <tr key={i}><td>{r.type}</td><td>{r.nom}</td><td><code>{r.valeur}</code></td></tr>)}</tbody></table>
              </>}
              <button type="button" className="btn" onClick={lire}><RefreshCw aria-hidden />Vérifier le domaine</button>
            </div>
          )}
        </div>
      )}

      <fieldset className="ed-bloc"><legend>Adresse du site</legend>
        <label className="ed-champ"><span>Adresse MySite</span><input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} maxLength={40} /></label>
        <label className="ed-champ"><span>Nom de domaine du client (facultatif)</span><input value={domaine} onChange={(e) => setDomaine(e.target.value)} placeholder="pizzabella.fr" />
          <em>Le domaine s&apos;achète au nom du client : il en reste propriétaire. <Link href="/espace/academie/livrer-domaine">Voir le cours</Link></em></label>
      </fieldset>

      <fieldset className="ed-bloc"><legend>Mentions légales (obligatoires)</legend>
        <p className="note" style={{ margin: 0 }}>Tout site professionnel doit identifier son éditeur et son hébergeur. Elles sont ajoutées en bas du site.</p>
        {champ("editeur", "Éditeur (nom du commerce)")}
        <div className="deux-col">{champ("forme", "Forme juridique", "Ex. Entreprise individuelle, SARL…")}{champ("siret", "SIRET")}</div>
        {champ("adresse", "Adresse")}
        <div className="deux-col">{champ("telephone", "Téléphone")}{champ("email", "E-mail")}</div>
        {champ("directeur", "Directeur de la publication", "En général le gérant (nom et prénom).")}
        {champ("realisation", "Réalisation (facultatif)", "Ex. « Site réalisé par Noa, création de sites »")}
      </fieldset>

      <label className="ed-case"><input type="checkbox" checked={verifie} onChange={(e) => setVerifie(e.target.checked)} />Le gérant a validé les textes, prix, horaires et photos.</label>
      <button type="button" className="btn p bloc grand" onClick={publier} disabled={charge || !verifie}><Rocket aria-hidden />{charge ? "Mise en ligne…" : etat?.publie ? "Mettre à jour le site en ligne" : "Mettre en ligne"}</button>
      {etat?.publie && <button type="button" className="btn bloc" onClick={retirer}><Globe aria-hidden />Retirer de la ligne</button>}
      <p className="note" style={{ margin: 0 }}>Hébergement inclus tant que votre abonnement est actif ({cap.publications} sites en ligne en même temps). Les modifications du Studio sont visibles en ligne après « Mettre à jour ».</p>
    </div>
  );
}
