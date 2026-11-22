/**
 * Section « Ils ont vendu leur premier site ». MASQUÉE tant que la liste est vide.
 * À remplir UNIQUEMENT avec de vrais témoignages, avec l'accord écrit de la personne (nom ou prénom + initiale, ville, date).
 * Aucun témoignage, avis, logo ou chiffre inventé (pratique commerciale trompeuse, art. L121-2 du Code de la consommation).
 */
export interface Temoignage {
  prenom: string;     // ex. « Léa B. »
  ville: string;
  texte: string;      // ses mots, sans retouche du sens
  date: string;       // AAAA-MM
  accordLe: string;   // date de l'accord écrit, gardé en interne
}

export const TEMOIGNAGES: Temoignage[] = [];

export function Temoignages() {
  if (!TEMOIGNAGES.length) return null;
  return (
    <section className="bloc" id="temoignages" style={{ paddingTop: 0 }}>
      <div className="conteneur">
        <div className="tete"><h2>Ils ont vendu leur premier site</h2></div>
        <div className="grille">
          {TEMOIGNAGES.map((t) => (
            <figure key={`${t.prenom}-${t.date}`} className="carte temoignage">
              <blockquote>« {t.texte} »</blockquote>
              <figcaption className="note">{t.prenom}, {t.ville} · {new Date(`${t.date}-01`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
