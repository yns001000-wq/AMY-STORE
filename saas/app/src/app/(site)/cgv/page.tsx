import { AFaire } from "@/components/AFaire";
import { ORDRE_PLANS, PLANS } from "@/lib/plans";
export const metadata = { title: "Conditions générales de vente" };
export default function Cgv() {
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Conditions générales de vente</h1>
      <p className="alerte">Brouillon à faire relire par un avocat avant l&apos;ouverture au public.</p>
      <h2>1. Offres et prix</h2>
      <ul>{ORDRE_PLANS.filter((id) => id !== "gratuit").map((id) => <li key={id}>{PLANS[id].nom} : {PLANS[id].prixMensuel} € TTC par mois, ou {PLANS[id].prixAnnuel} € TTC par an.</li>)}</ul>
      <p>TVA non applicable, article 293 B du CGI. Les quotas de chaque offre sont décrits sur la page Tarifs et se renouvellent chaque mois civil.</p>
      <h2>2. Paiement et renouvellement</h2>
      <p>Paiement par carte via Stripe. L&apos;abonnement se renouvelle automatiquement à la fin de chaque période (mois ou année) jusqu&apos;à résiliation. Pour un abonnement annuel, un rappel est envoyé avant le renouvellement. <AFaire>Configurer l&apos;e-mail de rappel dans Stripe</AFaire></p>
      <h2>3. Résiliation</h2>
      <p>À tout moment, en quelques clics, depuis « Mon abonnement ». Elle prend effet à la fin de la période déjà payée, sans frais. Le compte repasse alors en offre Gratuite et toutes vos données restent accessibles.</p>
      <h2>4. Droit de rétractation (consommateurs)</h2>
      <p>Vous disposez de 14 jours après la souscription. Si vous demandez expressément l&apos;accès immédiat au service, vous reconnaissez perdre ce droit une fois le service pleinement exécuté. En cas de rétractation avant, vous payez seulement la part du service déjà fournie (articles L221-18, L221-25 et L221-28 du Code de la consommation). Formulaire de rétractation : <AFaire>lien ou adresse e-mail</AFaire>.</p>
      <h2>5. Essai Premium</h2>
      <p>7 jours, une fois par compte, sans carte bancaire. Aucun prélèvement à la fin : le compte repasse automatiquement en Gratuit.</p>
      <h2>6. Réclamations et médiation</h2>
      <p>Contact : <AFaire>e-mail</AFaire>. Médiateur de la consommation : <AFaire>nom et site</AFaire>.</p>
    </article>
  );
}
