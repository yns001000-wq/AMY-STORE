import Link from "next/link";
import { Info } from "@/components/Info";
import { EDITEUR as E } from "@/lib/editeur";
import { CREDIT_PARRAIN_CENTIMES, DELAI_VALIDATION_ANNUEL_JOURS, DUREE_COOKIE_JOURS, JOURS_PRO_OFFERTS, RECOMPENSES_MAX_PAR_AN, REMISE_FILLEUL_POURCENT } from "@/lib/parrainage";

export const metadata = { title: "Règlement du parrainage" };

const credit = `${CREDIT_PARRAIN_CENTIMES / 100} €`;

/** Règlement complet du parrainage (renvoyé par les CGV et les CGU). Les chiffres viennent des mêmes constantes que le code. */
export default function ReglementParrainage() {
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Règlement du parrainage</h1>
      <p className="note">Version du 14 novembre 2026.</p>
      <p><b>En une phrase :</b> invite un ami : il a -{REMISE_FILLEUL_POURCENT} % sur son 1er paiement, et toi tu gagnes {credit} de crédit dès qu&apos;il paie son 2e mois.</p>

      <h2>1. Organisateur</h2>
      <p>Le programme de parrainage est proposé par <Info v={E.nom} manque="Prénom NOM" />, entrepreneur individuel, SIREN {E.siren}, éditeur de MySite (voir les <Link href="/mentions-legales">mentions légales</Link>). Il complète les <Link href="/cgv">CGV</Link> et les <Link href="/cgu">CGU</Link>.</p>

      <h2>2. Qui peut parrainer</h2>
      <p>Tout utilisateur de MySite, y compris en offre Gratuite. Chaque utilisateur dispose d&apos;un code personnel (par exemple LEA-4827) et d&apos;un lien de la forme mysite-app.com/?ref=CODE, visibles dans la section « Parrainage » de son espace.</p>
      <p>Le parrain partage lui-même son lien, aux personnes de son choix. MySite n&apos;envoie jamais de message à sa place. Le parrain s&apos;engage à ne pas envoyer de messages non sollicités en masse (spam) et à ne pas présenter le programme de façon trompeuse.</p>

      <h2>3. Enregistrement du parrain</h2>
      <p>Quand une personne suit un lien de parrainage, le code du parrain est conservé {DUREE_COOKIE_JOURS} jours dans un cookie de son navigateur. S&apos;il crée un compte MySite pendant ce délai, le parrain est enregistré sur son compte au moment de l&apos;inscription. Une fois enregistré, il ne change plus.</p>

      <h2>4. Avantage du filleul</h2>
      <ul>
        <li>-{REMISE_FILLEUL_POURCENT} % sur le <b>1er paiement uniquement</b> : le 1er mois pour un abonnement mensuel, la 1re année pour un abonnement annuel. Les paiements suivants sont au prix normal.</li>
        <li>La réduction est appliquée automatiquement au paiement.</li>
        <li>Elle est réservée à un <b>compte neuf</b>, qui n&apos;a jamais eu d&apos;abonnement payant MySite.</li>
      </ul>

      <h2>5. Récompense du parrain</h2>
      <ul>
        <li><b>Parrain abonné à une offre payante :</b> {credit} de crédit, ajoutés à son compte client et déduits automatiquement de ses prochaines factures MySite. Le crédit non utilisé passe sur les factures suivantes.</li>
        <li><b>Parrain en offre Gratuite</b> au moment de la récompense : {JOURS_PRO_OFFERTS} jours de l&apos;offre Pro offerts dans l&apos;application, sans paiement. S&apos;il en gagne plusieurs, ils s&apos;ajoutent les uns aux autres. À la fin, le compte repasse en offre Gratuite, sans aucune démarche.</li>
        <li>Le crédit n&apos;est <b>jamais converti en argent</b>, ni remboursé, ni transféré à une autre personne ou un autre compte.</li>
      </ul>

      <h2>6. Validation de la récompense</h2>
      <ul>
        <li><b>Filleul en abonnement mensuel :</b> quand sa 2e facture est réellement payée.</li>
        <li><b>Filleul en abonnement annuel :</b> {DELAI_VALIDATION_ANNUEL_JOURS} jours après son paiement, s&apos;il ne s&apos;est pas rétracté et n&apos;a pas été remboursé.</li>
        <li>En cas de <b>rétractation, remboursement, contestation du paiement (litige) ou résiliation</b> du filleul avant la validation, le parrainage est annulé, sans récompense.</li>
      </ul>
      <p>Le parrain est informé par e-mail quand son filleul s&apos;abonne, puis quand la récompense est validée.</p>

      <h2>7. Limite</h2>
      <p>{RECOMPENSES_MAX_PAR_AN} récompenses par parrain et par année civile. Au-delà, les parrainages sont comptés et affichés, mais ne donnent pas de récompense. Le compteur repart à zéro le 1er janvier.</p>

      <h2>8. Interdiction de l&apos;auto-parrainage et de la fraude</h2>
      <p>Il est interdit de se parrainer soi-même. Sont notamment refusés : le même compte, la même adresse e-mail (y compris ses variantes) et la même carte bancaire (vérifiée grâce à l&apos;empreinte de carte fournie par notre prestataire de paiement, Stripe, sans que MySite ait accès au numéro de carte). Un parrainage obtenu par fraude est annulé, et la récompense correspondante peut être retirée.</p>

      <h2>9. Données personnelles</h2>
      <p>Le parrain voit uniquement le prénom et l&apos;initiale du nom de ses filleuls, et l&apos;étape de leur parrainage. Il ne voit ni leur adresse e-mail, ni leurs paiements, ni leur activité. Les données du parrainage sont conservées pendant la durée des comptes concernés. Détails dans la <Link href="/confidentialite">politique de confidentialité</Link>.</p>

      <h2>10. Modification ou fin du programme</h2>
      <p>Le programme peut être modifié ou arrêté. Les parrainages déjà enregistrés restent traités selon le règlement en vigueur au moment de l&apos;inscription du filleul. Toute modification est publiée sur cette page avec sa date.</p>
    </article>
  );
}
