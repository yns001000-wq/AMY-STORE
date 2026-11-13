import { Info } from "@/components/Info";
import { EDITEUR as E } from "@/lib/editeur";
export const metadata = { title: "Mentions légales" };
export default function Mentions() {
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Mentions légales</h1>
      <h2>Éditeur</h2>
      <p>MySite est édité par <Info v={E.nom} manque="Prénom NOM" />, entrepreneur individuel (EI), micro-entrepreneur.<br />
        SIREN : {E.siren}<br />
        Adresse : <Info v={E.adresse} manque="adresse" /><br />
        Téléphone : <Info v={E.telephone} manque="téléphone" lien="tel" /><br />
        E-mail : <Info v={E.email} manque="e-mail" lien="mail" /><br />
        TVA non applicable, article 293 B du CGI.<br />
        Directeur de la publication : <Info v={E.nom} manque="Prénom NOM" />.</p>
      <h2>Hébergement</h2>
      <p>Application : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (contact : <a href="https://vercel.com/help" target="_blank" rel="noopener">vercel.com/help</a>). Base de données : Supabase Inc. (serveurs en Union européenne, région <Info v={E.regionSupabase} manque="Francfort ou Paris" />).</p>
      <h2>Données des entreprises</h2>
      <p>Base Sirene, INSEE, licence ouverte Etalab 2.0, via l&apos;API Recherche d&apos;entreprises. Données OpenStreetMap © contributeurs OpenStreetMap, licence ODbL : la base dérivée est disponible sur demande sous la même licence.</p>
      <h2>Signalement de contenus</h2>
      <p>Pour signaler un contenu illicite sur un site publié avec MySite : page <a href="/signaler">Signaler un contenu</a>. Point de contact unique (autorités et utilisateurs, règlement européen sur les services numériques) : <Info v={E.email} manque="e-mail" lien="mail" />, en français ou en anglais.</p>
      <h2>Abonnement, résiliation et rétractation</h2>
      <p>Tout est regroupé sur la page <a href="/abonnement">Abonnement</a>.</p>
      <h2>Médiation de la consommation</h2>
      <p>Médiateur : <Info v={E.mediateur} manque="nom et site du médiateur choisi" />.</p>
    </article>
  );
}
