import Link from "next/link";
import { AFaire } from "@/components/AFaire";

export const metadata = { title: "Conditions générales d'utilisation" };

/** CGU de MySite. Brouillon structuré : à faire relire par un avocat avant l'ouverture au public. */
export default function Cgu() {
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Conditions générales d&apos;utilisation</h1>
      <p className="note">Version du 9 novembre 2026.</p>
      <p className="alerte">Brouillon à faire relire par un avocat avant l&apos;ouverture au public.</p>

      <h2>1. Objet et acceptation</h2>
      <p>MySite est un logiciel en ligne (SaaS) édité par <AFaire>Prénom NOM, entrepreneur individuel, SIRET</AFaire> (« MySite », « nous »).</p>
      <p>Il permet de trouver des entreprises à démarcher dans des registres publics, de suivre ses échanges, de rédiger des messages, de créer et publier des sites vitrines, d&apos;émettre des devis et factures, et de se former.</p>
      <p>Ces conditions s&apos;appliquent à toute personne qui crée un compte (« vous »). Elles sont acceptées à l&apos;inscription. Les conditions de vente des abonnements figurent dans les <Link href="/cgv">CGV</Link>.</p>

      <h2>2. Compte</h2>
      <ul>
        <li>Le service est réservé aux personnes majeures. Vous indiquez à l&apos;inscription si vous agissez en tant que professionnel ou particulier.</li>
        <li>Un compte par personne. Vous protégez vos identifiants et nous signalez tout usage frauduleux.</li>
        <li>Vous pouvez à tout moment télécharger vos données et supprimer votre compte depuis « Mon compte ».</li>
      </ul>

      <h2>3. Vos engagements de prospection</h2>
      <ul>
        <li>Contacter les entreprises uniquement pour une offre en rapport avec leur activité professionnelle.</li>
        <li>Vous identifier dans chaque message et offrir un moyen simple de refuser (« STOP »).</li>
        <li>Respecter immédiatement toute opposition : passer le prospect en « Ne plus contacter » et ne plus le solliciter.</li>
        <li>Ne pas démarcher de particuliers, ne pas revendre ni publier les données obtenues via MySite, ne pas envoyer de messages en masse non sollicités.</li>
        <li>Relire les textes proposés par l&apos;outil avant tout envoi : vous en êtes l&apos;expéditeur et le responsable.</li>
      </ul>
      <p>Pour votre propre prospection, vous êtes responsable de traitement au sens du RGPD.</p>

      <h2>4. Contenus que vous publiez (sites, textes, photos)</h2>
      <p>Les sites, textes, prix, photos et autres contenus que vous créez, importez ou publiez avec MySite sont vos contenus. Vous en êtes seul responsable.</p>
      <p><b>Vous garantissez que :</b></p>
      <ul>
        <li>vous détenez les droits nécessaires sur les photos, logos, marques et textes utilisés, ou l&apos;autorisation de leur titulaire ;</li>
        <li>chaque site publié est validé par le commerçant concerné, avec des informations exactes (prix, horaires, coordonnées) et des mentions légales correctes ;</li>
        <li>les noms de domaine sont enregistrés au nom de vos clients ou avec leur accord.</li>
      </ul>
      <p><b>Sont interdits :</b></p>
      <ul>
        <li>les contenus illicites, haineux, violents, discriminatoires ou portant atteinte à la vie privée ;</li>
        <li>la contrefaçon ;</li>
        <li>les faux avis, faux témoignages, fausses statistiques ou toute pratique commerciale trompeuse ;</li>
        <li>l&apos;usurpation de l&apos;identité d&apos;un commerce ou d&apos;une personne ;</li>
        <li>la publication d&apos;un site pour un commerce sans son accord ;</li>
        <li>les logiciels malveillants et l&apos;hameçonnage.</li>
      </ul>
      <p><b>Licence :</b> vous accordez à MySite, pour la seule durée d&apos;utilisation du service, une licence non exclusive et gratuite pour héberger, reproduire et afficher vos contenus dans le but de fournir le service. Nous n&apos;utilisons pas vos contenus à d&apos;autres fins.</p>

      <h2>5. Signalement et retrait des contenus</h2>
      <p>Toute personne peut nous signaler un contenu illicite sur un site publié avec MySite, depuis la page <Link href="/signaler">Signaler un contenu</Link> ou le lien présent dans les mentions légales de chaque site.</p>
      <p>Nous examinons les signalements avec diligence. En cas de contenu manifestement illicite ou contraire à ces conditions, nous pouvons retirer le contenu, rendre le site inaccessible ou suspendre le compte.</p>
      <p>Nous vous informons de notre décision et de ses motifs, sauf obligation légale contraire, et vous pouvez la contester en nous répondant. Les manquements graves ou répétés peuvent entraîner la résiliation du compte.</p>
      <p>Point de contact pour les autorités et les utilisateurs : <AFaire>e-mail</AFaire>.</p>

      <h2>6. Textes et images proposés par l&apos;outil</h2>
      <p>Les textes, prix et contenus d&apos;exemple proposés automatiquement peuvent être inexacts. Ils sont signalés comme des exemples à vérifier. Les photos de la banque MySite sont des images d&apos;illustration générées par IA : elles doivent être présentées comme telles et remplacées par de vraies photos du commerce dès que possible. Les maquettes sont des démonstrations non publiées.</p>

      <h2>7. Factures et Académie</h2>
      <p>L&apos;outil de devis et factures vous aide à respecter les mentions usuelles. Vous restez responsable de vos documents, de leur conservation (10 ans) et de vos déclarations. Les cours de l&apos;Académie sont donnés à titre informatif : ils ne constituent ni un conseil juridique, fiscal ou comptable personnalisé, ni une promesse de revenus.</p>

      <h2>8. Disponibilité du service</h2>
      <p>Nous faisons nos meilleurs efforts pour que le service soit disponible et sécurisé, sans garantie de disponibilité permanente. Des interruptions pour maintenance peuvent avoir lieu, annoncées autant que possible.</p>

      <h2>9. Propriété intellectuelle de MySite</h2>
      <p>Le logiciel, sa marque, ses modèles de sites, sa banque de photos et ses cours appartiennent à MySite. Vous bénéficiez d&apos;un droit d&apos;utilisation personnel pendant votre abonnement.</p>
      <p>Les sites que vous créez pour vos clients peuvent être utilisés et conservés par eux, y compris après la fin de votre abonnement (via le téléchargement de la version finale).</p>

      <h2>10. Données personnelles</h2>
      <p>Les traitements réalisés par MySite sont décrits dans la <Link href="/confidentialite">politique de confidentialité</Link>.</p>
      <p>Pour les données que vous saisissez au sujet de vos propres clients (factures, notes, contenus des sites), vous êtes responsable de traitement et MySite agit comme sous-traitant (article 28 du RGPD). Dans ce cadre, MySite s&apos;engage à :</p>
      <ul>
        <li>ne traiter ces données que pour fournir le service et sur vos instructions ;</li>
        <li>en assurer la confidentialité et la sécurité ;</li>
        <li>recourir uniquement aux sous-traitants listés dans la politique de confidentialité ;</li>
        <li>vous aider à répondre aux demandes des personnes concernées ;</li>
        <li>vous notifier toute violation de données dans les meilleurs délais ;</li>
        <li>supprimer ces données à la fin du service (après l&apos;export que vous pouvez réaliser à tout moment).</li>
      </ul>

      <h2>11. Responsabilité</h2>
      <p>MySite ne garantit aucun résultat commercial ni aucun revenu.</p>
      <p>Pour les utilisateurs professionnels, la responsabilité de MySite est limitée aux dommages directs et plafonnée au montant payé au titre des 12 derniers mois.</p>
      <p>Pour les consommateurs, la responsabilité de MySite s&apos;exerce dans les conditions du droit commun.</p>
      <p><AFaire>Clauses à valider avec l&apos;avocat</AFaire></p>

      <h2>12. Suspension, résiliation et modification</h2>
      <p>Vous pouvez supprimer votre compte à tout moment. Nous pouvons suspendre ou résilier un compte en cas de manquement à ces conditions, après vous en avoir informé, sauf urgence ou obligation légale.</p>
      <p>Toute modification importante de ces conditions vous est notifiée au moins 30 jours à l&apos;avance. Si vous la refusez, vous pouvez résilier sans frais.</p>

      <h2>13. Droit applicable</h2>
      <p>Droit français. Pour un consommateur : tribunal de son domicile et médiation de la consommation (voir les <Link href="/cgv">CGV</Link>).</p>
    </article>
  );
}
