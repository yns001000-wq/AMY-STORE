import Link from "next/link";
import { AFaire } from "@/components/AFaire";
export const metadata = { title: "Confidentialité" };
export default function Confidentialite() {
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Politique de confidentialité</h1>
      <p className="alerte">Brouillon à faire relire avant la mise en ligne. Responsable de traitement : MySite, <AFaire>Prénom NOM, adresse, e-mail</AFaire>.</p>
      <h2>A. Vous êtes utilisateur de MySite</h2>
      <p>Données : e-mail, prénom, secteur et zone choisis, offre, historique d&apos;utilisation, et vos prospects et notes. Finalité : fournir le service et la facturation (exécution du contrat). Paiement traité par Stripe (nous ne voyons jamais votre numéro de carte). Conservation : durée du compte, puis 3 ans pour la relation commerciale ; pièces comptables 10 ans.</p>
      <h2>B. Votre entreprise figure dans MySite (professionnels référencés)</h2>
      <p>MySite propose à ses utilisateurs des entreprises à contacter pour des offres professionnelles. Ces informations sont collectées <strong>uniquement dans des registres publics</strong> : base Sirene (INSEE) et OpenStreetMap. Il s&apos;agit du nom, de l&apos;enseigne, de l&apos;activité, de l&apos;adresse de l&apos;établissement et, le cas échéant, du téléphone professionnel publié.</p>
      <p>Base légale : intérêt légitime (prospection entre professionnels, liée à votre activité). Exclusions automatiques :</p>
      <ul>
        <li>les entrepreneurs en diffusion partielle ;</li>
        <li>les entreprises opposées à l&apos;usage commercial de leurs données auprès de l&apos;INSEE ;</li>
        <li>les établissements fermés.</li>
      </ul>
      <p>Conservation : 3 ans sans échange, puis suppression.</p>
      <p>Vos droits : accès, rectification, effacement, et <strong>opposition en un clic</strong> sur la page <Link href="/opposition">Retirer mon entreprise</Link>. Réclamation possible auprès de la CNIL (cnil.fr).</p>
      <h2>C. Sous-traitants</h2>
      <p>Les sous-traitants sont les suivants :</p>
      <ul>
        <li>Supabase : base de données, en UE ;</li>
        <li>Vercel : hébergement ;</li>
        <li>Stripe : paiement ;</li>
        <li>Anthropic : IA de rédaction, sans entraînement sur vos données.</li>
      </ul>
      <p>Pour les transferts hors UE, des clauses contractuelles types sont en place. <AFaire>Vérifier et lister les contrats de sous-traitance (DPA)</AFaire></p>
      <h2>D. Cookies</h2>
      <p>Uniquement les cookies nécessaires à la connexion. Aucun cookie publicitaire ni de mesure d&apos;audience sans votre accord.</p>
    </article>
  );
}
