import Link from "next/link";
import { Info } from "@/components/Info";
import { EDITEUR as E } from "@/lib/editeur";
import { CREDIT_PARRAIN_CENTIMES, DELAI_VALIDATION_ANNUEL_JOURS, DUREE_COOKIE_JOURS, JOURS_PRO_OFFERTS, RECOMPENSES_MAX_PAR_AN, REMISE_FILLEUL_POURCENT } from "@/lib/parrainage";

export const metadata = { title: "Règlement du parrainage" };

const credit = `${CREDIT_PARRAIN_CENTIMES / 100} €`;

/**
 * Règlement complet du parrainage (partie intégrante des CGV et des CGU). Les chiffres viennent des mêmes constantes que le code.
 * Rédigé pour être sans ambiguïté (art. 1190 du Code civil : un doute s'interprète contre celui qui a rédigé le contrat d'adhésion).
 */
export default function ReglementParrainage() {
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Règlement du parrainage</h1>
      <p className="note">Version du 14 novembre 2026.</p>
      <p><b>En une phrase :</b> invite un ami : il a -{REMISE_FILLEUL_POURCENT} % sur son 1er paiement, et toi tu gagnes {credit} de crédit dès qu&apos;il paie son 2e mois.</p>

      <h2>1. Organisateur et valeur du règlement</h2>
      <p>Le programme de parrainage est proposé par <Info v={E.nom} manque="Prénom NOM" />, entrepreneur individuel, SIREN {E.siren}, éditeur de MySite (voir les <Link href="/mentions-legales">mentions légales</Link>). Ce règlement fait partie des <Link href="/cgv">CGV</Link> et des <Link href="/cgu">CGU</Link>. Participer au programme est facultatif et gratuit. Partager son lien de parrainage, ou s&apos;inscrire avec un lien de parrainage, vaut acceptation de ce règlement.</p>

      <h2>2. Définitions</h2>
      <ul>
        <li><b>Parrain</b> : l&apos;utilisateur de MySite qui partage son lien ou son code personnel.</li>
        <li><b>Filleul</b> : la personne qui crée un compte MySite avec ce lien ou ce code.</li>
        <li><b>Compte neuf</b> : un compte qui n&apos;a jamais eu d&apos;abonnement payant MySite, ni payé de facture MySite.</li>
        <li><b>Paiement</b> : une facture d&apos;abonnement MySite (création ou renouvellement) d&apos;un montant supérieur à 0 €, effectivement payée par le filleul.</li>
        <li><b>Validation</b> : le moment où la récompense du parrain est acquise (article 7).</li>
        <li><b>Année civile</b> : du 1er janvier au 31 décembre, heure de Paris.</li>
      </ul>

      <h2>3. Qui peut parrainer, et comment partager</h2>
      <p>Tout utilisateur de MySite, y compris en offre Gratuite. Chaque utilisateur dispose d&apos;un code personnel (par exemple LEA-4827) et d&apos;un lien de la forme mysite-app.com/?ref=CODE, visibles dans la section « Parrainage » de son espace.</p>
      <p>Le parrain partage lui-même son lien, aux personnes de son choix. MySite n&apos;envoie jamais de message à sa place. Le parrain s&apos;engage à :</p>
      <ul>
        <li>ne pas envoyer de messages non sollicités en masse (spam), ni acheter ou utiliser des listes de contacts ;</li>
        <li>dire clairement qu&apos;il s&apos;agit d&apos;un <b>lien de parrainage</b> et qu&apos;il reçoit un avantage si la personne s&apos;abonne, notamment s&apos;il le publie sur un site ou un réseau social (le message proposé par MySite le précise déjà) ;</li>
        <li>ne pas présenter MySite de façon trompeuse (aucune promesse de revenus, aucun faux avis) ;</li>
        <li>ne pas utiliser la marque MySite dans une publicité payante (mots-clés, annonces) sans accord écrit.</li>
      </ul>

      <h2>4. Enregistrement du parrain</h2>
      <p>Le code du parrain accompagne le visiteur jusqu&apos;à l&apos;inscription par le lien suivi. Le visiteur peut aussi choisir de <b>garder son invitation {DUREE_COOKIE_JOURS} jours</b> : un cookie contenant uniquement le code du parrain est alors déposé dans son navigateur, avec son accord, et peut être retiré à tout moment (bouton « Retirer » ou réglages du navigateur).</p>
      <p>Le parrain est enregistré sur le compte du filleul au moment de son inscription. Une fois enregistré, il ne change plus. Un compte ne peut avoir qu&apos;un seul parrain.</p>

      <h2>5. Avantage du filleul</h2>
      <ul>
        <li>-{REMISE_FILLEUL_POURCENT} % sur le <b>1er paiement uniquement</b> : le 1er mois pour un abonnement mensuel, la 1re année pour un abonnement annuel. Les paiements suivants sont au prix normal, indiqué avant la commande.</li>
        <li>La réduction est appliquée automatiquement au paiement et apparaît sur la page de paiement et sur la facture.</li>
        <li>Elle est réservée à un <b>compte neuf</b> et ne se cumule pas avec un autre code de réduction.</li>
        <li>Le filleul garde tous ses droits de consommateur, dont le droit de rétractation de 14 jours (voir les CGV). La réduction déjà accordée ne lui est jamais réclamée.</li>
      </ul>

      <h2>6. Récompense du parrain</h2>
      <ul>
        <li><b>Parrain abonné à une offre payante</b> au moment de la validation : {credit} de crédit, ajoutés à son compte client et déduits automatiquement de ses prochaines factures MySite. Le crédit non utilisé passe sur les factures suivantes, sans limite de durée tant que le compte existe.</li>
        <li><b>Parrain en offre Gratuite</b> au moment de la validation : {JOURS_PRO_OFFERTS} jours de l&apos;offre Pro offerts dans l&apos;application, sans paiement ni carte bancaire. S&apos;il en gagne plusieurs, ils s&apos;ajoutent les uns aux autres. À la fin, le compte repasse en offre Gratuite, sans aucune démarche ni prélèvement.</li>
        <li>Le crédit n&apos;est <b>jamais converti en argent</b>, ni remboursé, ni transféré à une autre personne ou un autre compte. Il est perdu si le compte du parrain est supprimé.</li>
        <li>Le parrain est informé par e-mail quand son filleul fait son 1er paiement, puis quand la récompense est validée.</li>
      </ul>

      <h2>7. Validation de la récompense</h2>
      <ul>
        <li><b>Filleul en abonnement mensuel :</b> quand son 2e paiement est effectivement réalisé.</li>
        <li><b>Filleul en abonnement annuel :</b> {DELAI_VALIDATION_ANNUEL_JOURS} jours après son 1er paiement, s&apos;il ne s&apos;est pas rétracté, n&apos;a pas été remboursé et n&apos;a pas résilié.</li>
        <li>En cas de <b>rétractation, remboursement, contestation du paiement auprès de sa banque, ou résiliation</b> (même prévue pour la fin de la période) du filleul avant la validation, le parrainage est annulé, sans récompense.</li>
        <li>Une fois validée, la récompense reste acquise, même si le filleul résilie ensuite.</li>
      </ul>

      <h2>8. Limite</h2>
      <p>{RECOMPENSES_MAX_PAR_AN} récompenses par parrain et par année civile. Au-delà, les parrainages sont comptés et affichés, mais ne donnent pas de récompense. Le compteur repart à zéro le 1er janvier.</p>

      <h2>9. Auto-parrainage et fraude</h2>
      <p>Il est interdit de se parrainer soi-même. Sont notamment refusés : le même compte, la même adresse e-mail (y compris ses variantes, comme les « +étiquettes » ou les points des adresses Gmail) et la même carte bancaire. La carte est comparée grâce à l&apos;empreinte fournie par notre prestataire de paiement, Stripe : MySite n&apos;a jamais accès au numéro de carte.</p>
      <p>Un parrainage obtenu par fraude ou en violation de l&apos;article 3 est annulé. Si une récompense a déjà été accordée, elle peut être retirée, après que le parrain a été informé par e-mail et a pu donner ses explications dans un délai de 15 jours.</p>

      <h2>10. Contestation</h2>
      <p>Si tu penses qu&apos;un parrainage a été annulé ou refusé à tort (par exemple, une carte partagée dans un même foyer pour deux activités distinctes), écris à <Info v={E.email} manque="e-mail" lien="mail" /> : la décision est réexaminée par une personne, et non par l&apos;outil seul. Pour un consommateur, le recours au médiateur de la consommation indiqué dans les <Link href="/cgv">CGV</Link> reste possible.</p>

      <h2>11. Données personnelles</h2>
      <p>Le parrain voit uniquement le prénom et l&apos;initiale du nom de ses filleuls, la date de leur inscription et l&apos;étape de leur parrainage. Il ne voit ni leur adresse e-mail, ni leurs paiements, ni leur activité. Le filleul en est informé au moment de son inscription. Les données du parrainage sont conservées pendant la durée des comptes concernés ; les empreintes de cartes sont seulement comparées, jamais enregistrées par MySite. Détails dans la <Link href="/confidentialite">politique de confidentialité</Link>.</p>

      <h2>12. Modification ou fin du programme</h2>
      <p>Le programme peut être modifié ou arrêté pour l&apos;avenir. Toute modification est publiée sur cette page, avec sa date, au moins 30 jours avant de s&apos;appliquer, et annoncée par e-mail aux parrains qui ont au moins un filleul. Les parrainages déjà enregistrés et les récompenses déjà acquises restent traités selon le règlement en vigueur au moment de l&apos;inscription du filleul. Chacun peut cesser de participer à tout moment, simplement en ne partageant plus son lien.</p>

      <h2>13. Droit applicable</h2>
      <p>Droit français. Pour un consommateur : tribunal de son domicile et médiation de la consommation (voir les <Link href="/cgv">CGV</Link>).</p>
    </article>
  );
}
