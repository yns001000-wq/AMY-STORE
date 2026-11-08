"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowUp, Ban, CheckCircle2, FileCheck2, Plus, Printer, Save, Send, Trash2, Wallet, XCircle } from "lucide-react";
import { euros, LIGNES_TYPES, nettoyerLignes, totaux, type Client, type Emetteur, type Ligne } from "@/lib/factures";
import { ApercuDocument, type DocAffiche } from "./ApercuDocument";

interface Props { doc: DocAffiche & { id: string; origine_id: string | null }; emetteur: Partial<Emetteur> | null; origine: string | null; peutEmettre: boolean }

export function EditeurDocument({ doc: d0, emetteur, origine, peutEmettre }: Props) {
  const router = useRouter();
  const [client, setClient] = useState<Client>({ adresse: "", siret: "", email: "", ...d0.client, nom: d0.client?.nom ?? "" });
  const [lignes, setLignes] = useState<Ligne[]>(nettoyerLignes(d0.lignes).length ? nettoyerLignes(d0.lignes) : [{ designation: "", quantite: 1, prix_unitaire: 0 }]);
  const [echeance, setEcheance] = useState(d0.date_echeance ?? "");
  const [conditions, setConditions] = useState(d0.conditions ?? "");
  const [msg, setMsg] = useState<{ ok?: boolean; t: string } | null>(null);
  const [charge, setCharge] = useState(false);
  const [modifie, setModifie] = useState(false);
  const brouillon = !d0.numero;
  const taux = emetteur?.tva && emetteur.tva !== "franchise" ? Number(emetteur.taux_tva) || 0 : 0;
  const t = totaux(nettoyerLignes(lignes), taux);
  const maj = <T,>(f: (v: T) => void) => (v: T) => { f(v); setModifie(true); };

  async function enregistrer(): Promise<boolean> {
    setCharge(true);
    try {
      const r = await fetch(`/api/documents/${d0.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client, lignes, date_echeance: echeance, conditions }) });
      const j = await r.json();
      if (!r.ok) { setMsg({ t: j.erreur ?? "Enregistrement impossible." }); return false; }
      setModifie(false); setMsg({ ok: true, t: "Brouillon enregistré." }); return true;
    } finally { setCharge(false); }
  }
  async function action(a: string, confirmation?: string, extra?: Record<string, string>) {
    if (confirmation && !confirm(confirmation)) return;
    if (a === "emettre" && modifie && !(await enregistrer())) return;
    setCharge(true);
    try {
      const r = await fetch(`/api/documents/${d0.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: a, ...extra }) });
      const j = await r.json();
      if (!r.ok) { setMsg({ t: j.erreur ?? "Action impossible." }); return; }
      if (j.id) router.push(`/espace/factures/${j.id}`); else router.refresh();
      setMsg({ ok: true, t: a === "emettre" ? `Numéro attribué : ${j.numero}. Le document ne peut plus être modifié.` : "C'est noté." });
    } finally { setCharge(false); }
  }
  async function supprimer() {
    if (!confirm("Supprimer ce brouillon ?")) return;
    const r = await fetch(`/api/documents/${d0.id}`, { method: "DELETE" });
    if (r.ok) router.push("/espace/factures");
  }
  const bouger = (i: number, s: number) => maj(setLignes)((() => { const c = [...lignes]; const [x] = c.splice(i, 1); c.splice(i + s, 0, x); return c; })());

  const apercu: DocAffiche = brouillon ? { ...d0, client, lignes, date_echeance: echeance, conditions, taux_tva: taux } : d0;
  return (
    <div className="doc-grille">
      <div className="pile" style={{ display: "grid", gap: "1rem", alignContent: "start", minWidth: 0 }}>
        {msg && <p className={`alerte${msg.ok ? " ok" : ""}`} role="status" style={{ margin: 0 }}>{msg.t}</p>}
        {brouillon ? <>
          <fieldset className="ed-bloc"><legend>Client</legend>
            <label>Nom ou raison sociale<input value={client.nom} onChange={(e) => maj(setClient)({ ...client, nom: e.target.value })} /></label>
            <label>Adresse<input value={client.adresse ?? ""} onChange={(e) => maj(setClient)({ ...client, adresse: e.target.value })} /></label>
            <div className="deux-col">
              <label>SIRET<input value={client.siret ?? ""} onChange={(e) => maj(setClient)({ ...client, siret: e.target.value })} /></label>
              <label>E-mail<input type="email" value={client.email ?? ""} onChange={(e) => maj(setClient)({ ...client, email: e.target.value })} /></label>
            </div>
          </fieldset>
          <fieldset className="ed-bloc"><legend>Lignes</legend>
            {lignes.map((l, i) => (
              <div className="ed-article" key={i}>
                <textarea rows={3} value={l.designation} placeholder="Désignation" aria-label="Désignation" onChange={(e) => maj(setLignes)(lignes.map((x, j) => (j === i ? { ...x, designation: e.target.value } : x)))} />
                <div className="ed-ligne">
                  <label className="mini">Qté<input inputMode="decimal" value={l.quantite} onChange={(e) => maj(setLignes)(lignes.map((x, j) => (j === i ? { ...x, quantite: e.target.value as unknown as number } : x)))} /></label>
                  <label className="mini">Prix HT (€)<input inputMode="decimal" value={l.prix_unitaire} onChange={(e) => maj(setLignes)(lignes.map((x, j) => (j === i ? { ...x, prix_unitaire: e.target.value as unknown as number } : x)))} /></label>
                  <div className="ed-actions" style={{ marginLeft: "auto", alignSelf: "end" }}>
                    <button type="button" className="ed-ico" disabled={i === 0} onClick={() => bouger(i, -1)} aria-label="Monter"><ArrowUp aria-hidden /></button>
                    <button type="button" className="ed-ico" disabled={i === lignes.length - 1} onClick={() => bouger(i, 1)} aria-label="Descendre"><ArrowDown aria-hidden /></button>
                    <button type="button" className="ed-ico" onClick={() => maj(setLignes)(lignes.filter((_, j) => j !== i))} aria-label="Supprimer"><Trash2 aria-hidden /></button>
                  </div>
                </div>
              </div>
            ))}
            <div className="ed-ligne" style={{ flexWrap: "wrap" }}>
              <button type="button" className="ed-ajout" onClick={() => maj(setLignes)([...lignes, { designation: "", quantite: 1, prix_unitaire: 0 }])}><Plus aria-hidden />Ligne vide</button>
              {LIGNES_TYPES.map((l) => <button key={l.designation} type="button" className="ed-ajout" onClick={() => maj(setLignes)([...lignes, l])}><Plus aria-hidden />{l.designation.split(" :")[0].split(" (")[0]}</button>)}
            </div>
            <p className="note" style={{ margin: 0 }}>Total : <b>{euros(t.ttc)}</b>{taux ? ` dont TVA ${euros(t.tva)}` : " (TVA non applicable)"}. Prix d&apos;exemple : fixez les vôtres.</p>
          </fieldset>
          {d0.type === "devis" && <label className="ed-case garder"><input type="checkbox" checked={!!client.hors_etablissement} onChange={(e) => maj(setClient)({ ...client, hors_etablissement: e.target.checked })} />
            <span><b>Signé chez le commerçant</b> (5 salariés au plus) : ajoute le délai de rétractation de 14 jours, l&apos;interdiction de tout paiement avant 7 jours et le formulaire de rétractation obligatoires. <Link href="/espace/academie/conclure-acompte">Pourquoi ?</Link></span></label>}
          <fieldset className="ed-bloc"><legend>Conditions</legend>
            <label>{d0.type === "devis" ? "Valable jusqu'au" : "Paiement au plus tard le"}<input type="date" value={echeance} onChange={(e) => maj(setEcheance)(e.target.value)} /></label>
            <label>Précisions (facultatif)<textarea rows={3} value={conditions} onChange={(e) => maj(setConditions)(e.target.value)} placeholder={d0.type === "devis" ? "Ex. acompte de 30 % à la signature, solde à la mise en ligne." : "Ex. acompte de 147 € déjà réglé le …"} /></label>
          </fieldset>
          <div className="ed-ligne" style={{ flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={enregistrer} disabled={charge || !modifie}><Save aria-hidden />Enregistrer</button>
            <button type="button" className="btn p" onClick={() => action("emettre", `Émettre ce ${d0.type} ? Un numéro définitif lui sera attribué et il ne pourra plus être modifié.`)} disabled={charge || !peutEmettre}><Send aria-hidden />Émettre</button>
            <button type="button" className="btn" onClick={supprimer} disabled={charge}><Trash2 aria-hidden />Supprimer</button>
          </div>
          {!peutEmettre && <p className="note">L&apos;émission est incluse dès l&apos;offre Premium. <Link href="/espace/abonnement">Voir les offres</Link></p>}
          {!emetteur?.siret && <p className="alerte" style={{ margin: 0 }}>Avant d&apos;émettre : <Link href="/espace/factures/entreprise">complétez votre identité de vendeur</Link>.</p>}
        </> : (
          <div className="carte pile">
            <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Actions</h2>
            <a className="btn p bloc" href={`/impression/${d0.id}`} target="_blank" rel="noopener"><Printer aria-hidden />Imprimer ou enregistrer en PDF</a>
            {d0.type === "devis" && d0.statut === "envoye" && <div className="ed-ligne">
              <button type="button" className="btn" onClick={() => action("accepter")} disabled={charge}><CheckCircle2 aria-hidden />Accepté</button>
              <button type="button" className="btn" onClick={() => action("refuser")} disabled={charge}><XCircle aria-hidden />Refusé</button></div>}
            {d0.type === "devis" && d0.statut === "accepte" && <button type="button" className="btn bloc" onClick={() => action("facturer")} disabled={charge}><FileCheck2 aria-hidden />Créer la facture</button>}
            {d0.type === "facture" && d0.statut === "emise" && <button type="button" className="btn bloc" onClick={() => action("payer")} disabled={charge}><Wallet aria-hidden />Marquer comme payée aujourd&apos;hui</button>}
            {d0.type === "facture" && (d0.statut === "emise" || d0.statut === "payee") && <button type="button" className="btn bloc" onClick={() => action("annuler", "Annuler cette facture ? Un avoir du même montant sera émis. La facture reste conservée (obligation légale).")} disabled={charge}><Ban aria-hidden />Annuler par un avoir</button>}
            <p className="note" style={{ margin: 0 }}>Un document émis ne se modifie plus. Les factures se conservent 10 ans : elles restent consultables ici même si vous changez d&apos;offre.</p>
            {origine && <p className="note" style={{ margin: 0 }}>Lié à : <Link href={`/espace/factures/${d0.origine_id}`}>{origine}</Link></p>}
          </div>
        )}
      </div>
      <div className="doc-apercu"><ApercuDocument doc={apercu} emetteur={emetteur} origine={origine} /></div>
    </div>
  );
}
