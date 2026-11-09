import Link from "next/link";
import { AFaire } from "@/components/AFaire";
import { ORDRE_PLANS, PLANS } from "@/lib/plans";

export const metadata = { title: "Conditions générales de vente" };

/** CGV des abonnements MySite. Brouillon structuré : à faire relire par un avocat avant l'ouverture au public. */
export default function Cgv() {
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Conditions générales de vente</h1>
      <p className="note">Version du 9 novembre 2026.</p>
      <p className="alerte">Brouillon à faire relire par un avocat avant l&apos;ouverture au public.</p>

      <h2>1. Vendeur</h2>
      <p><AFaire>Prénom NOM</AFaire>, entrepreneur individuel (EI), SIRET <AFaire>SIRET</AFaire>, <AFaire>adresse</AFaire>, contact : <AFaire>e-mail</AFaire>. TVA non applicable, article 293 B du CGI.</p>

      <h2>2. Offres et prix</h2>
      <ul>
        <li>Gratuit : 0 €, sans limite de durée, avec les quotas indiqués sur la page Tarifs.</li>
        {ORDRE_PLANS.filter((id) => id !== "gratuit").map((id) => <li key={id}>{PLANS[id].nom} : {PLANS[id].prixMensuel} € TTC par mois, ou {PLANS[id].prixAnnuel} € TTC par an.</li>)}
      </ul>
      <p>Le contenu de chaque offre (quotas mensuels, fonctions) est décrit sur la page Tarifs avant la commande. Les quotas se renouvellent chaque mois civil et ne se reportent pas.</p>

      <h2>3. Commande, paiement et factures</h2>
      <p>La commande se fait en ligne depuis « Mon abonnement ». Le paiement par carte est traité par Stripe. MySite n&apos;a jamais accès à votre numéro de carte. Une facture est émise à chaque paiement et reste téléchargeable dans votre espace (« Changer d&apos;offre, factures, carte »).</p>

      <h2>4. Durée et renouvellement</h2>
      <p>L&apos;abonnement est <b>sans engagement</b>. Il est conclu pour un mois ou un an et se renouvelle automatiquement pour la même durée, jusqu&apos;à sa résiliation.</p>
      <p>Pour un abonnement annuel, vous êtes informé par e-mail de la date de renouvellement et de votre droit de ne pas le reconduire, entre trois mois et un mois avant l&apos;échéance (article L215-1 du Code de la consommation).</p>

      <h2>5. Résiliation</h2>
      <p>Vous pouvez résilier à tout moment, sans frais ni justification, depuis le bouton <b>« Résilier mon abonnement »</b>. Il est accessible dans « Mon abonnement » et depuis le lien <Link href="/resilier">Résilier mon abonnement</Link> présent en bas de toutes les pages.</p>
      <ul>
        <li>La résiliation prend effet à la fin de la période déjà payée. Jusque-là, vous gardez l&apos;accès à votre offre.</li>
        <li>Une confirmation vous est envoyée par e-mail.</li>
        <li>Votre compte repasse ensuite en offre Gratuite : vos prospects, sites, devis et factures restent accessibles.</li>
        <li>Vous pouvez annuler la résiliation avant la date d&apos;effet.</li>
      </ul>

      <h2>6. Droit de rétractation (consommateurs)</h2>
      <p>Si vous êtes un consommateur, vous disposez de <b>14 jours</b> à compter de la souscription pour vous rétracter, sans motif (article L221-18 du Code de la consommation).</p>
      <p>En commandant, vous demandez l&apos;accès immédiat au service. Si vous vous rétractez, l&apos;abonnement s&apos;arrête aussitôt et vous êtes remboursé du montant payé, déduction faite de la part du service déjà fournie, calculée au jour près (article L221-25). Le remboursement intervient au plus tard 14 jours après votre demande, sur le moyen de paiement utilisé.</p>
      <p>Pour exercer ce droit, vous pouvez :</p>
      <ul>
        <li>cliquer sur le bouton « Me rétracter » dans « Mon abonnement » ;</li>
        <li>ou nous envoyer le formulaire ci-dessous, ou toute déclaration dénuée d&apos;ambiguïté, par e-mail à <AFaire>e-mail</AFaire>.</li>
      </ul>
      <blockquote className="carte" style={{ margin: "1rem 0" }}>
        <p><b>Formulaire de rétractation</b> (veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat)</p>
        <p>À l&apos;attention de <AFaire>Prénom NOM, adresse, e-mail</AFaire> :</p>
        <p>Je vous notifie par la présente ma rétractation du contrat portant sur la prestation de services ci-dessous :</p>
        <p>Abonnement MySite, offre : ……… · Commandé le : ………</p>
        <p>Nom : ……… · Adresse e-mail du compte : ………</p>
        <p>Date : ……… · Signature (en cas d&apos;envoi papier) : ………</p>
      </blockquote>

      <h2>7. Essai Premium</h2>
      <p>7 jours, une fois par compte, sans carte bancaire. Aucun prélèvement à la fin : le compte repasse automatiquement en offre Gratuite.</p>

      <h2>8. Changement de prix ou d&apos;offre</h2>
      <p>Vous pouvez changer d&apos;offre à tout moment. Le changement vers une offre supérieure est immédiat, avec un calcul au prorata. Le changement vers une offre inférieure prend effet à la prochaine échéance.</p>
      <p>Toute hausse de prix vous est annoncée au moins 30 jours avant son application. Vous pouvez résilier avant qu&apos;elle ne s&apos;applique.</p>

      <h2>9. Conformité du service</h2>
      <p>Pour les consommateurs, MySite est tenu de la garantie légale de conformité des contenus et services numériques pendant toute la durée de l&apos;abonnement (articles L224-25-12 et suivants du Code de la consommation). En cas de défaut, contactez-nous : nous le corrigerons ou, à défaut, vous pourrez obtenir une réduction de prix ou la résolution du contrat.</p>

      <h2>10. Fin de l&apos;abonnement : sites en ligne et données</h2>
      <p>Les sites publiés avec la mise en ligne en un clic (offres Pro et plus) sont hébergés tant que l&apos;abonnement est actif. Après la fin de l&apos;abonnement, ils restent en ligne 15 jours, puis sont retirés.</p>
      <p>Ils restent disponibles dans le Studio et téléchargeables pour être hébergés ailleurs. Il vous appartient d&apos;en informer vos propres clients. Vos devis et factures restent consultables même après un changement d&apos;offre.</p>

      <h2>11. Réclamations et médiation</h2>
      <p>Pour toute réclamation : <AFaire>e-mail</AFaire>.</p>
      <p>Si aucune solution amiable n&apos;est trouvée, le consommateur peut recourir gratuitement au médiateur de la consommation : <AFaire>nom, adresse et site du médiateur choisi</AFaire>.</p>
      <p>Plateforme européenne de règlement des litiges : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>.</p>

      <h2>12. Droit applicable</h2>
      <p>Droit français.</p>
    </article>
  );
}
