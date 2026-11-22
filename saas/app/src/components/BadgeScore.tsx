import { Info } from "lucide-react";
import { COULEUR_NIVEAU, EXPLICATION_SCORE, LIBELLE_NIVEAU, niveauScore } from "@/lib/score";

/** Badge vert / orange / gris du score « À contacter en priorité ». */
export function BadgeScore({ score }: { score: number }) {
  const n = niveauScore(score), c = COULEUR_NIVEAU[n];
  return (
    <span className={`badge-score score-${n}`} title={`${LIBELLE_NIVEAU[n]} (${score}/100). ${EXPLICATION_SCORE}`}
      style={{ color: c, background: `color-mix(in srgb, ${c} 13%, transparent)` }}>
      <b>{score}</b><span>{LIBELLE_NIVEAU[n]}</span>
    </span>
  );
}

/** Petite info-bulle (au survol, et au toucher sur téléphone) qui explique le calcul du score. */
export function InfoScore() {
  return (
    <details className="info-bulle">
      <summary aria-label="Comment le score est-il calculé ?"><Info aria-hidden /></summary>
      <p>{EXPLICATION_SCORE}</p>
    </details>
  );
}
