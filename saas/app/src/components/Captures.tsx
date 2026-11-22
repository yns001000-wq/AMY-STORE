import Image from "next/image";

/**
 * Vraies captures de l'application, prises avec un compte de démonstration (entreprises fictives, aucune donnée d'utilisateur).
 * Fichiers dans public/captures/. La section reste masquée tant que la liste est vide.
 */
export const CAPTURES: { src: string; titre: string; texte: string; largeur: number; hauteur: number }[] = [
  { src: "/captures/liste-priorite.webp", titre: "Vos entreprises, par priorité", texte: "Un score de 0 à 100 indique qui contacter en premier.", largeur: 1200, hauteur: 1107 },
  { src: "/captures/carte-prospects.webp", titre: "La carte de vos prospects", texte: "Couleurs par priorité, pour organiser vos tournées.", largeur: 1200, hauteur: 790 },
  { src: "/captures/studio-maquette.webp", titre: "La maquette à son nom, en un clic", texte: "Vous ajustez textes, couleurs et sections, l'aperçu suit.", largeur: 1200, hauteur: 1032 },
];

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
