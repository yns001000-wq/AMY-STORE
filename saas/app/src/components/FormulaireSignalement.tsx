"use client";
import { useState } from "react";
import { MOTIFS_SIGNALEMENT } from "@/lib/conformite";

/** Signalement d'un contenu illicite sur un site publié avec MySite. */
export function FormulaireSignalement({ urlInitiale }: { urlInitiale: string }) {
  const [f, setF] = useState({ url: urlInitiale, motif: "contrefacon", description: "", nom: "", email: "", bonne_foi: false, site_web: "" });
  const [etat, setEtat] = useState<{ charge?: boolean; ok?: string; erreur?: string }>({});
  async function envoyer(e: React.FormEvent) {
    e.preventDefault(); setEtat({ charge: true });
    try {
      const r = await fetch("/api/signaler", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const j = await r.json();
      setEtat(r.ok ? { ok: `Signalement reçu${j.reference ? ` (référence ${String(j.reference).slice(0, 8)})` : ""}. Nous l'examinons rapidement et vous informerons de notre décision si vous avez laissé votre e-mail.` } : { erreur: j.erreur ?? "Envoi impossible." });
    } catch { setEtat({ erreur: "Connexion impossible. Réessayez." }); }
  }
  if (etat.ok) return <p className="alerte ok">{etat.ok}</p>;
  return (
    <form className="carte pile" onSubmit={envoyer} style={{ maxWidth: "40rem" }}>
      <label>Adresse de la page concernée<input id="s-url" required value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://…" /></label>
      <label>Motif<select id="s-motif" value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value })}>{MOTIFS_SIGNALEMENT.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
      <label>Explication (ce qui pose problème et pourquoi)<textarea id="s-desc" required minLength={10} rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
      <div className="deux-col">
        <label>Votre nom (facultatif)<input id="s-nom" value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} /></label>
        <label>Votre e-mail (pour la réponse)<input id="s-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      </div>
      <input className="cache" tabIndex={-1} autoComplete="off" aria-hidden value={f.site_web} onChange={(e) => setF({ ...f, site_web: e.target.value })} />
      <label className="case"><input type="checkbox" checked={f.bonne_foi} onChange={(e) => setF({ ...f, bonne_foi: e.target.checked })} />Je certifie de bonne foi que les informations de ce signalement sont exactes et complètes.</label>
      {etat.erreur && <p className="alerte" role="alert" style={{ margin: 0 }}>{etat.erreur}</p>}
      <button className="btn p" type="submit" disabled={etat.charge || !f.bonne_foi}>{etat.charge ? "Envoi…" : "Envoyer le signalement"}</button>
    </form>
  );
}
