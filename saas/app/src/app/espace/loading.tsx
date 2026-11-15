/**
 * Affiché immédiatement après un appui, pendant que le serveur prépare la page (au lieu d'un écran figé).
 * Next.js le précharge avec chaque lien visible : la réaction est instantanée, même sur téléphone.
 */
export default function Chargement() {
  return (
    <div className="chargement" role="status" aria-live="polite">
      <span className="cache">Chargement…</span>
      <div className="sq sq-titre" />
      <div className="sq sq-ligne" />
      <div className="sq-grille"><div className="sq sq-carte" /><div className="sq sq-carte" /><div className="sq sq-carte" /></div>
      <div className="sq sq-bloc" />
    </div>
  );
}
