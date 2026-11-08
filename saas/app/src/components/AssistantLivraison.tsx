"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ExternalLink, PlayCircle, Search, Sparkles } from "lucide-react";
import { avancement, ETAPES_LIVRAISON, REGISTRAIRES } from "@/lib/livraison";
import { jouerSon } from "@/lib/academie/audio";

interface Props {
  prospect: { id: string; nom: string; ville: string | null }; manuelles: Record<string, string>; auto: Record<string, boolean>;
  domaine: string | null; dns: { ok: boolean; detail: string } | null; siteId: string | null; devisAccepte: string | null;
}

export function AssistantLivraison({ prospect, manuelles: m0, auto, domaine: d0, dns, siteId, devisAccepte }: Props) {
  const [manuelles, setManuelles] = useState(m0);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [domaine, setDomaine] = useState(d0 ?? "");
  const [idees, setIdees] = useState<{ domaine: string; disponible: boolean | null }[] | null>(null);
  const [cherche, setCherche] = useState(false);
  const faites: Record<string, boolean> = Object.fromEntries(ETAPES_LIVRAISON.map((e) => [e.cle, e.auto ? !!auto[e.cle] : !!manuelles[e.cle]]));
  const { pct, prochaine } = avancement(faites);
  const active = ouverte ?? prochaine?.cle ?? null;

  async function cocher(cle: string, fait: boolean) {
    const r = await fetch("/api/livraison", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prospect_id: prospect.id, etape: cle, fait }) });
    if (r.ok) { const j = await r.json(); setManuelles(j.etapes); jouerSon(fait ? "succes" : "clic"); if (fait) setOuverte(null); }
  }
  async function chercherDomaines(un?: string) {
    setCherche(true);
    try {
      const q = un ? `domaine=${encodeURIComponent(un)}` : `nom=${encodeURIComponent(prospect.nom)}&ville=${encodeURIComponent(prospect.ville ?? "")}`;
      const r = await fetch(`/api/domaines?${q}`); const j = await r.json(); setIdees(j.resultats ?? []);
    } finally { setCherche(false); }
  }
  async function retenir(d: string) {
    setDomaine(d);
    await fetch("/api/livraison", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prospect_id: prospect.id, domaine: d }) });
    jouerSon("pop");
  }

  return (
    <div className="livraison">
      <div className="carte livraison-tete">
        <div><b>{pct} %</b><span>{prochaine ? `Prochaine étape : ${prochaine.titre}` : "Livraison terminée : bravo !"}</span></div>
        <div className="jauge"><i style={{ width: `${pct}%` }} /></div>
      </div>
      <ol className="livraison-etapes">
        {ETAPES_LIVRAISON.map((e, k) => {
          const fait = faites[e.cle], ouvert = active === e.cle;
          return (
            <li key={e.cle} className={`${fait ? "faite" : ""}${ouvert ? " ouverte" : ""}`}>
              <button type="button" className="livraison-titre" onClick={() => setOuverte(ouvert ? "__" : e.cle)} aria-expanded={ouvert}>
                {fait ? <CheckCircle2 aria-hidden /> : <Circle aria-hidden />}<span>{k + 1}. {e.titre}</span>{e.facultatif && <small>facultatif</small>}{e.auto && <small>automatique</small>}
              </button>
              {ouvert && (
                <div className="livraison-corps">
                  <p>{e.texte}</p>
                  {e.cle === "accord" && (devisAccepte ? <Link className="btn" href={`/espace/factures/${devisAccepte}`}>Voir le devis accepté</Link>
                    : <form action="/api/documents" method="post"><input type="hidden" name="type" value="devis" /><input type="hidden" name="prospect_id" value={prospect.id} /><button className="btn p" type="submit">Créer le devis</button><p className="note">Une fois signé, ouvrez-le et cliquez « Accepté » : l&apos;étape se coche.</p></form>)}
                  {e.cle === "acompte" && <form action="/api/documents" method="post"><input type="hidden" name="type" value="facture" /><input type="hidden" name="prospect_id" value={prospect.id} /><button className="btn" type="submit">Créer la facture d&apos;acompte</button></form>}
                  {e.cle === "contenus" && siteId && <Link className="btn" href={`/espace/studio/${siteId}`}>Ouvrir le site dans le Studio</Link>}
                  {e.cle === "domaine" && (
                    <div className="pile" style={{ display: "grid", gap: ".7rem" }}>
                      <div className="ed-ligne">
                        <button type="button" className="btn" onClick={() => chercherDomaines()} disabled={cherche}><Sparkles aria-hidden />{cherche ? "Vérification…" : "Proposer des noms libres"}</button>
                        <input value={domaine} onChange={(x) => setDomaine(x.target.value)} placeholder="ou tapez un nom : pizzabella.fr" aria-label="Nom de domaine" style={{ flex: 1, minWidth: 0 }} />
                        <button type="button" className="btn" onClick={() => chercherDomaines(domaine)} disabled={cherche || !domaine} aria-label="Vérifier"><Search aria-hidden /></button>
                      </div>
                      {idees && <ul className="idees-domaines">{idees.map((x) => (
                        <li key={x.domaine}><code>{x.domaine}</code>
                          <span className={x.disponible ? "libre" : x.disponible === false ? "pris" : ""}>{x.disponible ? "Libre" : x.disponible === false ? "Déjà pris" : "Inconnu"}</span>
                          {x.disponible !== false && <button type="button" className="btn" onClick={() => retenir(x.domaine)}>{domaine === x.domaine ? "Retenu ✓" : "Retenir"}</button>}</li>
                      ))}</ul>}
                      <p className="note" style={{ margin: 0 }}>Disponibilité indicative (registres officiels). Le client l&apos;achète à son nom chez :</p>
                      <div className="ed-ligne" style={{ flexWrap: "wrap" }}>{REGISTRAIRES.map((r) => <a key={r.nom} className="btn" href={r.url} target="_blank" rel="noopener">{r.nom}<ExternalLink aria-hidden /></a>)}</div>
                    </div>
                  )}
                  {e.cle === "en_ligne" && siteId && <Link className="btn p" href={`/espace/studio/${siteId}`}>Publier depuis le Studio (onglet Publier)</Link>}
                  {e.cle === "en_ligne" && !siteId && <Link className="btn" href={`/espace/prospects/${prospect.id}`}>Créer d&apos;abord son site depuis la fiche</Link>}
                  {e.cle === "dns" && <p className={`alerte${dns?.ok ? " ok" : ""}`} style={{ margin: 0 }}>{domaine ? (dns ? dns.detail : `Saisissez ${domaine} dans l'onglet Publier du Studio pour obtenir les réglages DNS.`) : "Choisissez d'abord le nom de domaine (étape 4)."}</p>}
                  {e.cle === "google" && <a className="btn" href="https://business.google.com/" target="_blank" rel="noopener">Ouvrir Google Business Profile<ExternalLink aria-hidden /></a>}
                  {e.cle === "facture" && (devisAccepte ? <Link className="btn" href={`/espace/factures/${devisAccepte}`}>Créer la facture depuis le devis</Link> : <Link className="btn" href="/espace/factures">Devis et factures</Link>)}
                  {e.cle === "avis" && <p className="note" style={{ margin: 0 }}>Message type : « Votre site est en ligne ! Si vous êtes satisfait, un avis sur ma fiche Google m&apos;aiderait beaucoup. Et si vous connaissez un commerçant qui aurait besoin d&apos;un site, je suis preneur. Merci ! »</p>}
                  <div className="ed-ligne" style={{ flexWrap: "wrap" }}>
                    {!e.auto && <button type="button" className={`btn${fait ? "" : " p"}`} onClick={() => cocher(e.cle, !fait)}>{fait ? "Décocher" : "C'est fait"}</button>}
                    {e.lecon && <Link className="btn fantome" href={`/espace/academie/${e.lecon}`}><PlayCircle aria-hidden />Voir le cours vidéo</Link>}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
