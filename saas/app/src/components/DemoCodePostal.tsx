"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, MapPin, Search } from "lucide-react";
import type { ResultatDemo } from "@/lib/demo";

const fmt = (n: number) => n.toLocaleString("fr-FR");

/** Fond de plan stylisé (rues, parcs, rivière), identique pour toutes les villes : il évoque une carte sans rien révéler. */
const RUES = [
  "M-5 22 C 40 18, 80 30, 165 24", "M-5 58 C 50 52, 95 66, 165 60", "M-5 86 C 45 80, 110 92, 165 84",
  "M24 -5 C 20 30, 30 70, 22 105", "M62 -5 C 70 35, 58 65, 66 105", "M104 -5 C 98 40, 110 70, 102 105", "M140 -5 C 146 30, 136 75, 142 105",
  "M-5 40 L 60 -5", "M90 105 L 165 38",
];
const RUELLES = ["M-5 10 L 165 14", "M-5 34 L 165 40", "M-5 72 L 165 70", "M-5 96 L 165 98", "M10 -5 L 14 105", "M44 -5 L 40 105", "M84 -5 L 86 105", "M122 -5 L 120 105", "M156 -5 L 152 105"];

/** Carte floutée : chaque zone d'environ 1 km est un point lumineux, sa taille suit le nombre d'entreprises. Aucun nom, aucune adresse. */
function CarteFloutee({ points }: { points: ResultatDemo["points"] }) {
  if (!points.length) return null;
  const lats = points.map((p) => p.lat), lons = points.map((p) => p.lon);
  const [la0, la1, lo0, lo1] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
  const dla = Math.max(la1 - la0, 0.012), dlo = Math.max(lo1 - lo0, 0.012);
  // Repère 160 × 100 (même proportion que le cadre) : les cercles restent ronds.
  const x = (lo: number) => 18 + ((lo - lo0) / dlo) * 124, y = (la: number) => 86 - ((la - la0) / dla) * 72;
  const max = Math.max(...points.map((p) => p.n));
  const tries = [...points].sort((a, b) => a.n - b.n);
  return (
    <figure className="demo-carte" aria-label={`Carte floutée : ${points.length} zones d'environ 1 km où se trouvent ces entreprises`}>
      <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <radialGradient id="halo"><stop offset="0" stopColor="#ef4444" stopOpacity=".55" /><stop offset=".45" stopColor="#f97316" stopOpacity=".22" /><stop offset="1" stopColor="#f97316" stopOpacity="0" /></radialGradient>
          <filter id="flou" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.1" /></filter>
        </defs>
        <rect width="160" height="100" fill="#f3f5fa" />
        <g filter="url(#flou)">
          <ellipse cx="38" cy="70" rx="16" ry="10" fill="#dcefe2" /><ellipse cx="124" cy="22" rx="14" ry="8" fill="#dcefe2" /><ellipse cx="96" cy="78" rx="9" ry="6" fill="#dcefe2" />
          <path d="M-5 48 C 30 40, 55 62, 85 50 S 130 30, 165 44" fill="none" stroke="#d6e6f7" strokeWidth="5" strokeLinecap="round" />
          {RUELLES.map((d) => <path key={d} d={d} fill="none" stroke="#ffffff" strokeWidth="1.2" />)}
          {RUES.map((d) => <path key={d} d={d} fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />)}
        </g>
        {tries.map((p, i) => {
          const r = 4 + (p.n / max) * 9;
          return <g key={i} transform={`translate(${x(p.lon).toFixed(1)} ${y(p.lat).toFixed(1)})`}>
            <circle r={r} fill="url(#halo)" />
            <circle r={p.n / max > 0.5 ? 1.7 : 1.25} className="demo-point" />
          </g>;
        })}
      </svg>
      <figcaption className="demo-carte-legende"><span className="demo-carte-cadenas"><Lock aria-hidden />Noms et adresses après inscription</span></figcaption>
    </figure>
  );
}

/** Démo sans inscription : un code postal → le nombre d'entreprises à démarcher, par métier, sur une carte floutée. */
export function DemoCodePostal() {
  const [cp, setCp] = useState("");
  const [etat, setEtat] = useState<{ charge?: boolean; erreur?: string; r?: ResultatDemo }>({});

  async function chercher(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{5}$/.test(cp.trim())) { setEtat({ erreur: "Indiquez un code postal à 5 chiffres." }); return; }
    setEtat({ charge: true });
    try {
      const rep = await fetch("/api/demo/compter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cp: cp.trim() }) });
      const j = await rep.json();
      setEtat(rep.ok ? { r: j as ResultatDemo } : { erreur: j.erreur ?? "La recherche n'a pas abouti. Réessayez." });
    } catch { setEtat({ erreur: "Connexion impossible. Vérifiez votre réseau et réessayez." }); }
  }

  const r = etat.r;
  return (
    <div className="carte demo" id="demo">
      <form className="demo-form" onSubmit={chercher}>
        <label htmlFor="demo-cp"><MapPin aria-hidden />Votre code postal</label>
        <div className="demo-ligne">
          <input id="demo-cp" inputMode="numeric" autoComplete="postal-code" pattern="\d{5}" maxLength={5} placeholder="ex. 69003" value={cp} onChange={(e) => setCp(e.target.value.replace(/\D/g, ""))} required />
          <button className="btn p" type="submit" disabled={etat.charge}><Search aria-hidden />{etat.charge ? "Recherche…" : "Voir les entreprises à démarcher"}</button>
        </div>
        <p className="note" style={{ margin: 0, fontSize: ".8rem" }}>Sans inscription. Recherche en direct dans le registre officiel des entreprises : comptez quelques secondes.</p>
      </form>
      {etat.erreur && <p className="alerte" role="alert" style={{ margin: 0 }}>{etat.erreur}</p>}
      {r && (
        <div className="demo-resultat" aria-live="polite">
          {r.total > 0 ? <>
            <p className="demo-chiffre"><b>{r.partiel ? "Plus de " : ""}{fmt(r.total)}</b> entreprise{r.total > 1 ? "s" : ""} à démarcher autour de vous{r.commune ? ` (${r.codePostal} ${r.commune})` : ""}</p>
            <p className="note" style={{ margin: 0 }}>Petites entreprises indépendantes et actives : restauration, métiers de bouche, bâtiment, beauté et services. Les entreprises opposées à la prospection sont exclues. Dans MySite, chaque fiche vous permet de vérifier en un clic si elle a déjà un site.</p>
            <ul className="demo-metiers">{r.parMetier.map((m) => <li key={m.id}><span>{m.nom}</span><b>{fmt(m.n)}</b></li>)}</ul>
            <CarteFloutee points={r.points} />
            <Link className="btn p grand bloc" href={`/connexion?mode=inscription&cp=${r.codePostal}`}>Créer mon compte gratuit pour les voir <ArrowRight aria-hidden /></Link>
          </> : <p className="note" style={{ margin: 0 }}>Aucune entreprise trouvée dans le {r.codePostal} pour nos 5 grands métiers. Essayez le code postal d&apos;une ville voisine.</p>}
          <p className="note" style={{ margin: 0, fontSize: ".75rem" }}>Source : {r.source}. Chiffres du {new Date(r.le).toLocaleDateString("fr-FR")}.</p>
        </div>
      )}
    </div>
  );
}
