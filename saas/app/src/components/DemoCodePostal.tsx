"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, MapPin, Search } from "lucide-react";
import type { ResultatDemo } from "@/lib/demo";

const fmt = (n: number) => n.toLocaleString("fr-FR");

/** Carte floutée : points rouges placés dans leur case d'environ 1 km, sur un fond de rues flouté. Aucun nom, aucune adresse. */
function CarteFloutee({ points }: { points: ResultatDemo["points"] }) {
  if (!points.length) return null;
  const lats = points.map((p) => p.lat), lons = points.map((p) => p.lon);
  const [la0, la1, lo0, lo1] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
  const dla = Math.max(la1 - la0, 0.01), dlo = Math.max(lo1 - lo0, 0.01);
  const x = (lo: number) => 8 + ((lo - lo0) / dlo) * 84, y = (la: number) => 92 - ((la - la0) / dla) * 84;
  return (
    <div className="demo-carte" role="img" aria-label={`Carte floutée : ${points.length} zones où se trouvent ces entreprises`}>
      <div className="demo-carte-fond" aria-hidden />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {points.map((p, i) => <circle key={i} cx={x(p.lon)} cy={y(p.lat)} r={Math.min(2 + Math.sqrt(p.n) * 1.1, 6)} className="demo-point" />)}
      </svg>
      <span className="demo-carte-cadenas"><Lock aria-hidden />Noms et adresses visibles après inscription</span>
    </div>
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
