"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Lance la recherche de nouveaux prospects (registres publics) dans la limite de l'offre. */
export function BoutonRecherche({ desactive, auto }: { desactive?: boolean; auto?: boolean }) {
  const router = useRouter();
  const [etat, setEtat] = useState<{ charge: boolean; message?: string }>({ charge: false });
  async function lancer() {
    setEtat({ charge: true, message: "Recherche dans la base Sirene…" });
    try {
      const r = await fetch("/api/prospects/rechercher", { method: "POST" });
      const d = await r.json();
      if (r.status === 402) setEtat({ charge: false, message: "Quota du mois atteint : passez à l'offre supérieure pour continuer." });
      else if (!r.ok) setEtat({ charge: false, message: d.erreur ?? "La recherche n'a pas abouti. Réessayez dans un instant." });
      else { setEtat({ charge: false, message: d.ajoutes ? `${d.ajoutes} nouveaux prospects ajoutés.` : d.message }); if (auto) router.replace("/espace"); router.refresh(); }
    } catch { setEtat({ charge: false, message: "Connexion impossible. Réessayez." }); }
  }
  // Première visite après l'inscription : la recherche part toute seule, une seule fois.
  const lance = useRef(false);
  useEffect(() => { if (auto && !desactive && !lance.current) { lance.current = true; void lancer(); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ display: "flex", gap: ".75rem", alignItems: "center", flexWrap: "wrap" }}>
      <button className="btn p" type="button" onClick={lancer} disabled={etat.charge || desactive}>{etat.charge ? "Recherche en cours…" : "Trouver de nouveaux prospects"}</button>
      {etat.message && <span className="note" role="status">{etat.message}</span>}
    </div>
  );
}
