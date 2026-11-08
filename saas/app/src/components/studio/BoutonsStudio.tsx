"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Lock, Microscope, Zap } from "lucide-react";

export interface SiteResume { id: string; type: "express" | "ia"; maj_le: string }

/** Création du site d'un prospect depuis sa fiche : maquette express (toutes offres) ou site sur mesure par l'IA (dès Pro). */
export function BoutonsStudio({ prospectId, sites, ia, restants }: { prospectId: string; sites: SiteResume[]; ia: boolean; restants: number }) {
  const router = useRouter();
  const [etat, setEtat] = useState<{ charge?: "express" | "ia"; erreur?: string }>({});
  const [precisions, setPrecisions] = useState("");

  async function creer(mode: "express" | "ia") {
    setEtat({ charge: mode });
    try {
      const r = await fetch(mode === "express" ? "/api/studio" : "/api/studio/etude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prospect_id: prospectId, precisions }) });
      const j = await r.json();
      if (!r.ok) { setEtat({ erreur: j.erreur ?? "Création impossible." }); return; }
      router.push(`/espace/studio/${j.id}`);
    } catch { setEtat({ erreur: "Connexion impossible. Réessayez." }); }
  }

  return (
    <div className="carte pile">
      <h2 style={{ fontSize: "1.15rem", margin: 0, display: "flex", gap: ".5rem", alignItems: "center" }}><LayoutTemplate size={18} style={{ color: "var(--violet)" }} aria-hidden />Son futur site</h2>
      {sites.length > 0 && <ul className="sites-prospect">{sites.map((s) => <li key={s.id}><Link href={`/espace/studio/${s.id}`}>{s.type === "ia" ? "Site sur mesure" : "Maquette express"}</Link><small>modifié le {new Date(s.maj_le).toLocaleDateString("fr-FR")}</small></li>)}</ul>}
      {ia ? <>
        <label>Ce que vous savez (facultatif)<textarea rows={3} value={precisions} onChange={(e) => setPrecisions(e.target.value)} maxLength={3000} placeholder="Ex. vrai restaurant avec terrasse, pizzas au feu de bois, fermé le lundi…" /></label>
        <button type="button" className="btn p bloc" onClick={() => creer("ia")} disabled={!!etat.charge || restants <= 0}><Microscope aria-hidden />{etat.charge === "ia" ? "Étude en cours (30 s environ)…" : "Étudier et créer le site sur mesure"}</button>
        <p className="note" style={{ margin: 0 }}>{restants} site{restants > 1 ? "s" : ""} sur mesure restant{restants > 1 ? "s" : ""} ce mois-ci. L&apos;IA vérifie d&apos;abord le vrai type d&apos;établissement, vous confirmez, puis elle rédige.</p>
      </> : <p className="note" style={{ margin: 0, display: "flex", gap: ".4rem" }}><Lock size={15} aria-hidden style={{ flex: "none", marginTop: ".2rem" }} /><span>Site sur mesure par l&apos;IA (étude de l&apos;établissement, carte complète, retouches) : <Link href="/espace/abonnement">inclus dès l&apos;offre Pro</Link>.</span></p>}
      <button type="button" className="btn bloc" onClick={() => creer("express")} disabled={!!etat.charge}><Zap aria-hidden />{etat.charge === "express" ? "Création…" : "Maquette express (instantanée)"}</button>
      {etat.erreur && <p className="alerte" role="alert" style={{ margin: 0 }}>{etat.erreur}</p>}
    </div>
  );
}
