import { AFaire } from "@/components/AFaire";
export const metadata = { title: "Mentions légales" };
export default function Mentions() {
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Mentions légales</h1>
      <p className="alerte">Brouillon à faire relire avant la mise en ligne.</p>
      <h2>Éditeur</h2>
      <p>MySite, <AFaire>Prénom NOM</AFaire>, entrepreneur individuel · SIRET <AFaire>SIRET</AFaire> · <AFaire>adresse de domiciliation</AFaire> · contact : <AFaire>e-mail</AFaire>. TVA non applicable, article 293 B du CGI. Directeur de la publication : <AFaire>Prénom NOM</AFaire>.</p>
      <h2>Hébergement</h2>
      <p>Application : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. Base de données : Supabase Inc. (serveurs en Union européenne, région <AFaire>Francfort ou Paris</AFaire>).</p>
      <h2>Données des entreprises</h2>
      <p>Base Sirene, INSEE, licence ouverte Etalab 2.0, via l&apos;API Recherche d&apos;entreprises. Données OpenStreetMap © contributeurs OpenStreetMap, licence ODbL : la base dérivée est disponible sur demande sous la même licence.</p>
      <h2>Signalement de contenus</h2>
      <p>Pour signaler un contenu illicite sur un site publié avec MySite : page <a href="/signaler">Signaler un contenu</a>. Point de contact unique (autorités et utilisateurs, règlement européen sur les services numériques) : <AFaire>e-mail</AFaire>, en français ou en anglais.</p>
      <h2>Médiation de la consommation</h2>
      <p>Médiateur : <AFaire>nom et site du médiateur choisi</AFaire>.</p>
    </article>
  );
}
