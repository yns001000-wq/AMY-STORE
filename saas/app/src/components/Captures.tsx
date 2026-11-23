import Image from "next/image";
import { Check } from "lucide-react";

/**
 * Vraies captures de l'application, prises avec un compte de démonstration (entreprises fictives, aucune donnée d'utilisateur).
 * Fichiers dans public/captures/. Affichées en grand, en alternance avec leur explication. Section masquée si la liste est vide.
 */
export const CAPTURES: { src: string; titre: string; texte: string; points: string[]; largeur: number; hauteur: number }[] = [
  { src: "/captures/liste-priorite.webp", titre: "Vos entreprises, par priorité", texte: "Chaque entreprise trouvée arrive dans votre liste avec un score de 0 à 100 : vous savez qui contacter en premier.",
    points: ["Score calculé avec le registre officiel (ancienneté, métier, taille, téléphone)", "Statut, rappels et historique de chaque échange", "Un lien pour vérifier en un clic si l'entreprise a déjà un site"], largeur: 1200, hauteur: 1107 },
  { src: "/captures/carte-prospects-2.webp", titre: "La carte de vos prospects", texte: "Voyez où sont vos entreprises et organisez vos tournées : celles d'un même quartier se démarchent le même jour.",
    points: ["Points colorés par priorité ou par étape du suivi", "Incluse dans toutes les offres, même Gratuite"], largeur: 1200, hauteur: 795 },
  { src: "/captures/studio-maquette.webp", titre: "La maquette à son nom, en un clic", texte: "Le Studio crée un site complet au nom de l'entreprise. Vous ajustez textes, couleurs et sections, l'aperçu suit en direct.",
    points: ["Restaurant, pizzeria, boulangerie, coiffure, artisan…", "Prête pour le téléphone, à montrer pendant la visite", "Mise en ligne en un clic dès l'offre Pro"], largeur: 1200, hauteur: 1032 },
];

export function Captures() {
  if (!CAPTURES.length) return null;
  return (
    <section className="bloc" id="captures" style={{ paddingTop: 0 }}>
      <div className="conteneur">
        <div className="tete"><span className="surtitre">Dans l&apos;application</span><h2>Ce que vous verrez une fois inscrit</h2><p>Captures de l&apos;interface réelle, avec un compte de démonstration : les entreprises affichées sont fictives.</p></div>
        <div className="zigzag">
          {CAPTURES.map((c, i) => (
            <article key={c.src} className={`zigzag-ligne${i % 2 ? " inverse" : ""}`}>
              <figure className="capture"><Image src={c.src} alt={`${c.titre} : capture de l'application`} width={c.largeur} height={c.hauteur} sizes="(max-width: 900px) 92vw, 640px" /></figure>
              <div className="zigzag-texte">
                <span className="etape-num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{c.titre}</h3>
                <p>{c.texte}</p>
                <ul>{c.points.map((pt) => <li key={pt}><Check aria-hidden />{pt}</li>)}</ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
