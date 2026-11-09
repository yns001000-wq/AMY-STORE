"use client";
import { useState } from "react";
import { Download, Trash2 } from "lucide-react";

/** Droits RGPD dans l'application : export de toutes les données (art. 15 et 20) et suppression du compte (art. 17). */
export function GestionCompte() {
  const [etape, setEtape] = useState<"repos" | "confirmer">("repos");
  const [saisie, setSaisie] = useState("");
  const [etat, setEtat] = useState<{ charge?: boolean; erreur?: string; fini?: boolean }>({});
  async function supprimer() {
    setEtat({ charge: true });
    try {
      const r = await fetch("/api/compte/supprimer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: saisie }) });
      const j = await r.json();
      if (!r.ok) setEtat({ erreur: j.erreur ?? "Suppression impossible." }); else { setEtat({ fini: true }); setTimeout(() => { window.location.href = "/"; }, 2500); }
    } catch { setEtat({ erreur: "Connexion impossible." }); }
  }
  if (etat.fini) return <p className="alerte ok">Votre compte et vos données ont été supprimés. À bientôt peut-être.</p>;
  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      <section className="carte pile">
        <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Télécharger mes données</h2>
        <p className="note" style={{ margin: 0 }}>Toutes vos données (profil, prospects, sites, devis, factures, photos, progression) dans un fichier JSON lisible et réutilisable.</p>
        <a className="btn" href="/api/compte/export"><Download aria-hidden />Télécharger mes données</a>
      </section>
      <section className="carte pile">
        <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Supprimer mon compte</h2>
        <p className="note" style={{ margin: 0 }}>Suppression définitive : abonnement arrêté, sites retirés de la ligne, prospects, sites, photos, devis et factures effacés. <b>Téléchargez d&apos;abord vos données</b> : vous devez conserver vos propres factures 10 ans.</p>
        {etape === "repos" ? <button type="button" className="btn" style={{ color: "#ef4444" }} onClick={() => setEtape("confirmer")}><Trash2 aria-hidden />Supprimer mon compte</button> : <>
          <label>Tapez SUPPRIMER pour confirmer<input id="c-confirme" value={saisie} onChange={(e) => setSaisie(e.target.value)} autoComplete="off" /></label>
          {etat.erreur && <p className="alerte" role="alert" style={{ margin: 0 }}>{etat.erreur}</p>}
          <div className="ed-ligne" style={{ flexWrap: "wrap" }}>
            <button type="button" className="btn p" style={{ background: "#ef4444" }} disabled={saisie !== "SUPPRIMER" || etat.charge} onClick={supprimer}>{etat.charge ? "Suppression…" : "Supprimer définitivement"}</button>
            <button type="button" className="btn" onClick={() => { setEtape("repos"); setSaisie(""); }}>Annuler</button>
          </div>
        </>}
      </section>
    </div>
  );
}
