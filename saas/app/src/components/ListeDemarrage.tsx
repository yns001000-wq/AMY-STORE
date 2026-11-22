import Link from "next/link";
import { Check } from "lucide-react";
import type { Pas } from "@/lib/croissance";

/** Liste de démarrage : 4 étapes cochées d'après les vraies données de l'utilisateur, avec une barre de progression. */
export function ListeDemarrage({ pas }: { pas: Pas[] }) {
  const faits = pas.filter((x) => x.fait).length, pct = Math.round((faits / pas.length) * 100);
  const suivante = pas.find((x) => !x.fait);
  return (
    <section className="carte demarrage" aria-labelledby="titre-demarrage">
      <div className="demarrage-tete">
        <h2 id="titre-demarrage">Votre démarrage</h2>
        <span className="note">{faits} sur {pas.length} étapes</span>
      </div>
      <div className="jauge demarrage-jauge" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`Démarrage : ${pct} %`}><i style={{ width: `${pct}%` }} /></div>
      <ol className="pas">
        {pas.map((x, i) => (
          <li key={x.id} className={`${x.fait ? "fait" : ""}${x.id === suivante?.id ? " suivante" : ""}`}>
            <Link href={x.lien} aria-label={`${x.titre}${x.fait ? " (fait)" : ""}`}>
              <span className="pas-num">{x.fait ? <Check size={16} aria-hidden /> : i + 1}</span>
              <strong>{x.titre}</strong><small>{x.aide}</small>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
