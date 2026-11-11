import Link from "next/link";
import { Info } from "@/components/Info";
import { EDITEUR as E } from "@/lib/editeur";

export const metadata = { title: "Confidentialité" };

/** Politique de confidentialité (RGPD, art. 13 et 14). */
export default function Confidentialite() {
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Politique de confidentialité</h1>
      <p className="note">Version du 11 novembre 2026.</p>
      <p>Responsable de traitement : MySite, <Info v={E.nom} manque="Prénom NOM" />, <Info v={E.adresse} manque="adresse" />, <Info v={E.email} manque="e-mail" lien="mail" />.</p>

      <h2>A. Vous êtes utilisateur de MySite</h2>
      <ul>
        <li><b>Compte et service</b> (e-mail, prénom, secteur, zone, statut, contenus, prospects, sites, devis, factures, progression) : pour fournir le service (exécution du contrat), pendant la durée du compte.</li>
        <li><b>Abonnement et facturation</b> (offre, historique de paiement, factures) : obligation légale. Pièces comptables conservées 10 ans. Votre carte est traitée uniquement par Stripe.</li>
        <li><b>Preuves des démarches</b> (résiliation, rétractation, suppression de compte) : pour pouvoir justifier du respect de vos droits (intérêt légitime et obligation légale), pendant 5 ans.</li>
        <li><b>E-mails de service</b> (bienvenue, confirmations, rappel de reconduction d&apos;un abonnement annuel) : obligations légales et exécution du contrat. Aucune newsletter sans votre accord.</li>
        <li><b>E-mails sur l&apos;essai Premium</b> (deux au plus : avant la fin de l&apos;essai, puis à la fin) : exécution du contrat et intérêt légitime. Vous pouvez les désactiver dans « Mon compte ».</li>
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
        <li><b>Vercel</b> : hébergement de l&apos;application et des sites publiés (États-Unis, Data Privacy Framework et clauses contractuelles types).</li>
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
      <p>MySite utilise uniquement les cookies strictement nécessaires à la connexion et à la sécurité : aucun consentement n&apos;est requis. Aucun cookie publicitaire ni de mesure d&apos;audience n&apos;est utilisé.</p>
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
