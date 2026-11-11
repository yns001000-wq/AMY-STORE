import Link from "next/link";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { Info } from "@/components/Info";
import { EDITEUR as E } from "@/lib/editeur";

export const metadata = { title: "Abonnement : gérer, résilier, se rétracter" };

/**
 * Page publique « Abonnement » : tout ce qui concerne l'abonnement au même endroit (changer d'offre, factures,
 * résiliation en ligne art. L215-1-1, rétractation art. L221-18 avec le formulaire type, reconduction annuelle).
 */
export default async function AbonnementPublic() {
  const connecte = Boolean(await utilisateurConnecte());
  const espace = connecte ? "/espace/abonnement" : "/connexion?suite=/espace/abonnement";
  const sujet = encodeURIComponent("Rétractation de mon abonnement MySite");
  const corps = encodeURIComponent("Bonjour,\n\nJe vous notifie par la présente ma rétractation du contrat portant sur la prestation de services ci-dessous :\n\nAbonnement MySite, offre : \nCommandé le : \nNom : \nAdresse e-mail du compte : \nDate : \n");
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Abonnement</h1>
      <p>Changer d&apos;offre, retrouver vos factures, résilier ou vous rétracter : tout se fait en ligne, sans frais et sans justification.</p>
      <p><Link className="btn p" href={espace}>{connecte ? "Gérer mon abonnement" : "Me connecter pour gérer mon abonnement"}</Link></p>

      <h2 id="gerer">Changer d&apos;offre, carte bancaire, factures</h2>
      <p>Dans <b>Mon abonnement</b>, le bouton « Changer d&apos;offre, factures, carte » ouvre votre espace de paiement sécurisé (Stripe). Vous pouvez :</p>
      <ul>
        <li>passer à une offre supérieure : effet immédiat, avec un calcul au prorata ;</li>
        <li>passer à une offre inférieure : effet à la prochaine échéance ;</li>
        <li>changer de carte bancaire ;</li>
        <li>télécharger toutes vos factures.</li>
      </ul>

      <h2 id="resilier">Résilier mon abonnement</h2>
      <p>L&apos;abonnement est <b>sans engagement</b>. Vous pouvez le résilier à tout moment, en deux clics :</p>
      <ol>
        <li>connectez-vous et ouvrez <b>Mon abonnement</b> ;</li>
        <li>cliquez sur « Résilier mon abonnement », vérifiez la date d&apos;effet, puis « Confirmer la résiliation ».</li>
      </ol>
      <p>Vous gardez l&apos;accès jusqu&apos;à la fin de la période déjà payée, puis votre compte repasse en offre Gratuite. Aucun autre prélèvement. Une confirmation vous est envoyée par e-mail. Vous pouvez changer d&apos;avis et reprendre l&apos;abonnement tant que la date d&apos;effet n&apos;est pas passée.</p>
      <p><Link className="btn" href="/resilier">Résilier mon abonnement</Link></p>

      <h2 id="retractation">Me rétracter (14 jours)</h2>
      <p>Si vous êtes un particulier, vous disposez de <b>14 jours</b> après la souscription pour vous rétracter, sans motif (article L221-18 du Code de la consommation). L&apos;abonnement s&apos;arrête tout de suite et vous êtes remboursé du montant payé, déduction faite des jours déjà utilisés (article L221-25), sous 14 jours au plus tard, sur la carte utilisée.</p>
      <p>Deux façons de faire :</p>
      <ul>
        <li><b>en ligne</b> : bouton « Me rétracter (14 jours) » dans <Link href={espace}>Mon abonnement</Link> ;</li>
        <li><b>par e-mail</b> : envoyez le formulaire ci-dessous (ou toute déclaration claire) à <Info v={E.email} manque="e-mail" lien="mail" />.</li>
      </ul>
      <blockquote className="carte" style={{ margin: "1rem 0" }}>
        <p><b>Formulaire de rétractation</b> (à compléter et renvoyer uniquement si vous souhaitez vous rétracter du contrat)</p>
        <p>À l&apos;attention de MySite, <Info v={E.nom} manque="Prénom NOM" />, <Info v={E.adresse} manque="adresse" />, <Info v={E.email} manque="e-mail" lien="mail" /> :</p>
        <p>Je vous notifie par la présente ma rétractation du contrat portant sur la prestation de services ci-dessous :</p>
        <p>Abonnement MySite, offre : ……… · Commandé le : ………</p>
        <p>Nom : ……… · Adresse e-mail du compte : ………</p>
        <p>Date : ……… · Signature (en cas d&apos;envoi papier) : ………</p>
      </blockquote>
      {E.email && <p><a className="btn" href={`mailto:${E.email}?subject=${sujet}&body=${corps}`}>Envoyer le formulaire par e-mail</a></p>}
      <p className="note">Le droit de rétractation est réservé aux consommateurs. Les professionnels peuvent résilier à tout moment, avec effet à la fin de la période payée.</p>

      <h2 id="essai">Essai gratuit</h2>
      <p>L&apos;essai Premium de 7 jours se fait sans carte bancaire. À la fin, rien n&apos;est prélevé : le compte repasse automatiquement en offre Gratuite.</p>

      <h2 id="renouvellement">Renouvellement</h2>
      <p>L&apos;abonnement mensuel se renouvelle chaque mois, l&apos;abonnement annuel chaque année. Pour l&apos;annuel, nous vous prévenons par e-mail avant le renouvellement, avec la date limite pour résilier. Toute hausse de prix vous est annoncée au moins 30 jours à l&apos;avance.</p>

      <h2 id="fin">Après la fin de l&apos;abonnement</h2>
      <p>Vos prospects, sites et factures restent accessibles dans l&apos;offre Gratuite. Les sites mis en ligne avec MySite restent en ligne 15 jours, puis sont retirés : vous pouvez les télécharger pour les héberger ailleurs.</p>

      <h2 id="aide">Besoin d&apos;aide ?</h2>
      <p>Vous n&apos;arrivez pas à vous connecter ? Écrivez-nous depuis l&apos;adresse e-mail de votre compte, à <Info v={E.email} manque="e-mail" lien="mail" /> : nous résilions pour vous et vous le confirmons par e-mail. Détails complets dans les <Link href="/cgv">conditions générales de vente</Link>.</p>
    </article>
  );
}
