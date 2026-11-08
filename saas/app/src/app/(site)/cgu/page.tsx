import { AFaire } from "@/components/AFaire";
export const metadata = { title: "Conditions générales d'utilisation" };
export default function Cgu() {
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Conditions générales d&apos;utilisation</h1>
      <p className="alerte">Brouillon à faire relire par un avocat avant l&apos;ouverture au public.</p>
      <h2>1. Le service</h2>
      <p>MySite est un logiciel en ligne d&apos;aide à la prospection : recherche d&apos;entreprises dans des registres publics, suivi commercial, rédaction assistée par intelligence artificielle et maquettes de sites. MySite ne vend pas de fichier et ne garantit aucun résultat commercial ni aucun revenu.</p>
      <h2>2. Vos engagements de prospection</h2>
      <ul>
        <li>Contacter les entreprises uniquement pour une offre en rapport avec leur activité professionnelle.</li>
        <li>Vous identifier clairement dans chaque message (nom ou entreprise, moyen de contact) et offrir un moyen simple de refuser (« STOP »).</li>
        <li>Respecter immédiatement toute opposition, et ne pas recontacter une entreprise qui a refusé.</li>
        <li>Ne pas démarcher de particuliers, ne pas revendre ni publier les données obtenues via MySite, ne pas envoyer de messages en masse non sollicités.</li>
        <li>Vérifier et relire les textes produits par l&apos;IA avant tout envoi : vous en êtes l&apos;expéditeur et le responsable.</li>
      </ul>
      <p>Pour votre propre prospection, vous agissez en tant que responsable de traitement au sens du RGPD. MySite peut suspendre un compte en cas d&apos;usage abusif (spam, harcèlement, revente de données).</p>
      <h2>3. Contenus générés par l&apos;IA et maquettes</h2>
      <p>Les textes, prix et contenus d&apos;exemple produits par l&apos;IA peuvent être inexacts. Ils sont signalés comme des exemples à valider. Les maquettes sont des démonstrations non publiées.</p>
      <h2>4. Compte et sécurité</h2>
      <p>Un compte par personne. Vous protégez vos identifiants. Vos données restent les vôtres : export possible, suppression du compte sur demande à <AFaire>e-mail</AFaire>.</p>
      <h2>5. Responsabilité, droit applicable</h2>
      <p>Droit français. Pour un consommateur : tribunal de son domicile et médiation de la consommation (voir les mentions légales). <AFaire>Clauses de limitation de responsabilité à rédiger avec l&apos;avocat</AFaire>.</p>
    </article>
  );
}
