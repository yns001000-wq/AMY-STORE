"use client";
import { useState } from "react";
import { Microscope, WandSparkles } from "lucide-react";
import { FAMILLES, type DonneesSite } from "@/lib/studio";

export interface Etude {
  statut: "a_confirmer" | "redige"; essais?: number; precisions?: string; type: string; famille: string; cuisine?: string; confiance?: number;
  indices?: string[]; hypotheses?: { type: string; famille: string; probabilite: number }[]; a_verifier?: string[]; resume?: string;
}

/** Étape de validation : l'utilisateur confirme (ou corrige) le vrai type d'établissement avant la rédaction complète. */
export function EtudeIA({ id, etude, onRedige }: { id: string; etude: Etude; onRedige: (d: DonneesSite) => void }) {
  const choixInitiaux = [{ type: etude.type, famille: etude.famille, probabilite: etude.confiance ?? 0 }, ...(etude.hypotheses ?? []).filter((h) => h.type !== etude.type)];
  const [choix, setChoix] = useState(0);
  const [famille, setFamille] = useState(etude.famille);
  const [type, setType] = useState(etude.type);
  const [cuisine, setCuisine] = useState(etude.cuisine ?? "");
  const [precisions, setPrecisions] = useState(etude.precisions ?? "");
  const [etat, setEtat] = useState<{ charge?: boolean; erreur?: string }>({});
  const fiable = (etude.confiance ?? 0) >= 70;

  async function rediger() {
    setEtat({ charge: true });
    try {
      const r = await fetch(`/api/studio/${id}/rediger`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ famille, type, cuisine, precisions }) });
      const j = await r.json();
      if (!r.ok) setEtat({ erreur: j.erreur ?? "La rédaction n'a pas abouti : réessayez." });
      else onRedige(j.donnees);
    } catch { setEtat({ erreur: "Connexion interrompue. Réessayez : l'étude est conservée." }); }
  }

  return (
    <div className="etude">
      <div className="carte">
        <p className="surtitre"><Microscope aria-hidden />Étude de l&apos;établissement</p>
        <h2 style={{ marginTop: 0 }}>{etude.type}</h2>
        <div className="confiance"><div className="jauge"><i style={{ width: `${etude.confiance ?? 0}%` }} /></div><span>Confiance {etude.confiance ?? 0} %</span></div>
        {etude.resume && <p>{etude.resume}</p>}
        {!!etude.indices?.length && <><h3>Indices retenus</h3><ul>{etude.indices.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
        {!fiable && <p className="alerte">Les indices publics ne suffisent pas pour être sûr. Choisissez le bon type ci-dessous ou ajoutez ce que vous savez (photo de la devanture, carte, avis Google…) : le site sera bien plus juste.</p>}
      </div>

      <div className="carte pile">
        <h3 style={{ margin: 0 }}>Que propose vraiment cet établissement ?</h3>
        <div className="choix">
          {choixInitiaux.map((h, i) => (
            <label key={i}><input type="radio" name="hyp" checked={choix === i} onChange={() => { setChoix(i); setFamille(h.famille); setType(h.type); }} />
              <span>{h.type}<small className="note" style={{ display: "block", fontWeight: 500 }}>{FAMILLES[h.famille]?.lib} · {h.probabilite} %</small></span></label>
          ))}
          <label><input type="radio" name="hyp" checked={choix === -1} onChange={() => setChoix(-1)} /><span>Autre type</span></label>
        </div>
        {choix === -1 && <div className="deux-col">
          <label>Modèle<select value={famille} onChange={(e) => setFamille(e.target.value)}>{Object.entries(FAMILLES).map(([k, f]) => <option key={k} value={k}>{f.lib}</option>)}</select></label>
          <label>Type précis<input value={type} onChange={(e) => setType(e.target.value)} maxLength={80} placeholder="Ex. restaurant libanais" /></label>
        </div>}
        <label>Cuisine ou spécialité (facultatif)<input value={cuisine} onChange={(e) => setCuisine(e.target.value)} maxLength={80} placeholder="Ex. pizzas au feu de bois, sushis, coloration…" /></label>
        <label>Ce que vous savez sur place (facultatif, mais très utile)<textarea rows={4} value={precisions} onChange={(e) => setPrecisions(e.target.value)} maxLength={3000} placeholder="Plats ou prestations vus sur la carte, prix, horaires, ambiance, livraison, terrasse…" /></label>
        {!!etude.a_verifier?.length && <details><summary>Questions à poser au gérant</summary><ul>{etude.a_verifier.map((x, i) => <li key={i}>{x}</li>)}</ul></details>}
        <button type="button" className="btn p grand bloc" onClick={rediger} disabled={etat.charge || !type.trim()}><WandSparkles aria-hidden />{etat.charge ? "Rédaction du site en cours…" : "Rédiger le site sur mesure"}</button>
        {etat.charge && <p className="note" role="status">L&apos;IA écrit la carte complète, les textes, la FAQ et choisit les photos : comptez une à trois minutes. Gardez cette page ouverte.</p>}
        {etat.erreur && <p className="alerte" role="alert">{etat.erreur}</p>}
      </div>
    </div>
  );
}
