import Image from "next/image";

/**
 * Vraies captures de l'application, prises avec un compte de démonstration (entreprises fictives, aucune donnée d'utilisateur).
 * Fichiers dans public/captures/. La section reste masquée tant que la liste est vide.
 */
export const CAPTURES: { src: string; titre: string; texte: string; largeur: number; hauteur: number }[] = [];

export function Captures() {
  if (!CAPTURES.length) return null;
  return (
    <section className="bloc" id="captures" style={{ paddingTop: 0 }}>
      <div className="conteneur">
        <div className="tete"><h2>L&apos;application, telle que vous l&apos;utiliserez</h2><p>Captures de l&apos;interface réelle, avec un compte de démonstration : les entreprises affichées sont fictives.</p></div>
        <div className="captures">
          {CAPTURES.map((c) => (
            <figure key={c.src} className="capture">
              <Image src={c.src} alt={`${c.titre} : ${c.texte}`} width={c.largeur} height={c.hauteur} sizes="(max-width: 700px) 90vw, 360px" />
              <figcaption><strong>{c.titre}</strong><span className="note">{c.texte}</span></figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
