import Link from "next/link";
import { Info } from "@/components/Info";
import { EDITEUR as E } from "@/lib/editeur";

export const metadata = { title: "Confidentialité" };

/** Politique de confidentialité (RGPD, art. 13 et 14). */
export default function Confidentialite() {
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Politique de confidentialité</h1>
      <p className="note">Version du 14 novembre 2026.</p>
      <p>Responsable de traitement : MySite, <Info v={E.nom} manque="Prénom NOM" />, <Info v={E.adresse} manque="adresse" />, <Info v={E.email} manque="e-mail" lien="mail" />.</p>

      <h2>A. Vous êtes utilisateur de MySite</h2>
      <ul>
        <li><b>Compte et service</b> (e-mail, prénom, secteur, zone, statut, contenus, prospects, sites, devis, factures, progression) : pour fournir le service (exécution du contrat), pendant la durée du compte.</li>
        <li><b>Abonnement et facturation</b> (offre, historique de paiement, factures) : obligation légale. Pièces comptables conservées 10 ans. Votre carte est traitée uniquement par Stripe.</li>
        <li><b>Preuves des démarches</b> (résiliation, rétractation, suppression de compte) : pour pouvoir justifier du respect de vos droits (intérêt légitime et obligation légale), pendant 5 ans.</li>
        <li><b>E-mails de service</b> (bienvenue, confirmations, rappel de reconduction d&apos;un abonnement annuel) : obligations légales et exécution du contrat. Aucune newsletter sans votre accord.</li>
        <li><b>Provenance de l&apos;inscription</b> (par exemple « tiktok », si le lien que vous avez suivi l&apos;indiquait) : pour savoir quels contenus font connaître MySite (intérêt légitime), pendant la durée du compte. Aucun cookie n&apos;est utilisé pour cela.</li>
        <li><b>Sécurité</b> (journaux techniques) : intérêt légitime, 12 mois au plus.</li>
      </ul>
      <p>À la suppression de votre compte, vos données sont effacées, sauf ce que la loi oblige à conserver (factures, preuves des démarches).</p>

      <h2>B. Votre entreprise figure dans MySite (professionnels référencés)</h2>
      <p>MySite propose à ses utilisateurs des entreprises à contacter pour des offres professionnelles. Ces informations proviennent <strong>uniquement de registres publics</strong> : base Sirene (INSEE) et OpenStreetMap. Il s&apos;agit du nom, de l&apos;enseigne, de l&apos;activité, de l&apos;adresse de l&apos;établissement et, le cas échéant, du téléphone professionnel publié.</p>
      <p><b>Base légale :</b> intérêt légitime (prospection entre professionnels, liée à votre activité). Les entreprises suivantes sont exclues automatiquement :</p>
      <ul>
        <li>les entrepreneurs en diffusion partielle ;</li>
        <li>les entreprises opposées à l&apos;usage commercial de leurs données auprès de l&apos;INSEE ;</li>
        <li>les établissements fermés.</li>
      </ul>
      <p><b>Conservation :</b> 3 ans sans échange, puis suppression. Les entreprises jamais contactées sont libérées après 60 jours.</p>
      <p><b>Opposition :</b> en un clic sur la page <Link href="/opposition">Retirer mon entreprise</Link>. Votre entreprise est alors exclue chez tous les utilisateurs.</p>

      <h2>C. Données des clients de nos utilisateurs</h2>
      <p>Quand un utilisateur saisit des données sur ses propres clients (factures, notes, contenus de sites), il en est responsable de traitement et MySite agit comme sous-traitant (voir l&apos;article 10 des <Link href="/cgu">CGU</Link>).</p>

      <h2>D. Destinataires et sous-traitants</h2>
      <ul>
        <li><b>Supabase</b> : base de données et authentification, serveurs dans l&apos;Union européenne.</li>
        <li><b>Vercel</b> : hébergement de l&apos;application et des sites publiés, mesure d&apos;audience sans cookie (États-Unis, Data Privacy Framework et clauses contractuelles types).</li>
        <li><b>Stripe</b> : paiement et factures (Data Privacy Framework et clauses contractuelles types).</li>
        <li><b>Anthropic</b> : rédaction automatique des messages et des sites (États-Unis, clauses contractuelles types). Les données envoyées ne servent pas à entraîner ses modèles.</li>
        <li><b>Resend</b> : envoi des e-mails de service, s&apos;il est activé.</li>
      </ul>
      <p>Aucune donnée n&apos;est vendue.</p>

      <h2>E. Vos droits</h2>
      <p>Vous disposez des droits suivants : accès, rectification, effacement, limitation, opposition et portabilité.</p>
      <p>Depuis « Mon compte », vous pouvez <b>télécharger toutes vos données</b> et <b>supprimer votre compte</b>. Pour toute autre demande, écrivez à <Info v={E.email} manque="e-mail" lien="mail" />. Nous répondons sous un mois.</p>
      <p>Vous pouvez introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a>).</p>

      <h2>F. Cookies</h2>
      <p>MySite utilise les cookies nécessaires à la connexion et à la sécurité. Aucun cookie publicitaire ni de mesure d&apos;audience n&apos;est utilisé.</p>
      <p><b>Mesure d&apos;audience sans cookie</b> : les pages de MySite (hors sites publiés pour vos clients) sont mesurées avec Vercel Web Analytics, pour connaître le nombre de visites, les pages consultées, la provenance (site d&apos;origine), le pays et le type d&apos;appareil. Aucun cookie n&apos;est déposé et aucun identifiant n&apos;est conservé : chaque visiteur est reconnu seulement le jour même, par une empreinte calculée qui est effacée au bout de 24 heures. Les adresses des pages sont envoyées sans leurs paramètres ni identifiants. Les résultats sont uniquement des chiffres globaux, consultés par l&apos;éditeur seul. Base légale : notre intérêt légitime à mesurer la fréquentation du site (art. 6.1.f du RGPD) ; vous pouvez vous y opposer en écrivant à l&apos;adresse indiquée en E ou en bloquant le script avec votre navigateur.</p>
      <p><b>Cookie de parrainage</b> (« mysite_parrain ») : déposé <b>seulement si vous cliquez sur « Garder mon invitation 30 jours »</b> après être arrivé par le lien de parrainage d&apos;un utilisateur (consentement, art. 82 de la loi Informatique et Libertés). Il contient uniquement le code de ce parrain, pendant 30 jours, pour vous appliquer la réduction de bienvenue et enregistrer le parrainage si vous créez un compte. Vous pouvez le retirer à tout moment (bouton « Retirer » du bandeau, ou réglages de votre navigateur). Sans ce cookie, l&apos;invitation fonctionne quand même pendant votre visite, par le lien suivi.</p>
      <p><b>Parrainage</b> (voir le <Link href="/reglement-parrainage">règlement</Link>) :</p>
      <ul>
        <li>si vous êtes parrainé, votre parrain voit votre prénom, l&apos;initiale de votre nom, la date de votre inscription et l&apos;étape du parrainage (inscrit, 1er paiement fait, validé ou annulé), jamais votre e-mail ni vos paiements. Base légale : l&apos;exécution du programme auquel vous participez en vous inscrivant avec son lien (art. 6.1.b du RGPD) ;</li>
        <li>pour refuser l&apos;auto-parrainage, nous comparons les adresses e-mail et l&apos;empreinte des cartes bancaires fournie par Stripe. Les empreintes sont seulement comparées, jamais enregistrées par MySite. Base légale : notre intérêt légitime à prévenir la fraude (art. 6.1.f et considérant 47 du RGPD). Une annulation peut être contestée par e-mail : elle est alors réexaminée par une personne (art. 22 du RGPD) ;</li>
        <li>conservation : pendant la durée des comptes concernés ; les traces de paiement suivent les durées légales de conservation des pièces comptables.</li>
      </ul>
      <p>Les sites publiés avec MySite ne déposent aucun cookie. La carte Google Maps ne se charge qu&apos;après un clic du visiteur.</p>

      <h2>G. Sécurité</h2>
      <ul>
        <li>Chiffrement des échanges (HTTPS).</li>
        <li>Cloisonnement des données de chaque utilisateur au niveau de la base de données.</li>
        <li>Clés d&apos;accès sensibles conservées uniquement côté serveur.</li>
        <li>Sites publiés isolés de l&apos;application.</li>
        <li>En cas de violation de données, notification à la CNIL et aux personnes concernées dans les conditions prévues par le RGPD.</li>
      </ul>
    </article>
  );
}
