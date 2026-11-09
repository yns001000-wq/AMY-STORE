import Link from "next/link";
import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";

export const metadata = { title: "Résilier mon abonnement" };

/** Accès direct à la résiliation (art. L215-1-1 du Code de la consommation), depuis toutes les pages du site. */
export default async function Resilier() {
  if (await utilisateurConnecte()) redirect("/espace/abonnement#resilier");
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Résilier mon abonnement</h1>
      <p>La résiliation se fait en ligne, sans frais et sans justification. Elle prend effet à la fin de la période déjà payée, et une confirmation vous est envoyée par e-mail.</p>
      <ol>
        <li>Connectez-vous à votre compte (pour que nous identifiions votre abonnement).</li>
        <li>Cliquez sur « Résilier mon abonnement ».</li>
        <li>Vérifiez la date d&apos;effet et cliquez sur « Confirmer la résiliation ».</li>
      </ol>
      <p><Link className="btn p" href="/connexion?suite=/espace/abonnement">Me connecter pour résilier</Link></p>
      <p className="note">Vous n&apos;arrivez pas à vous connecter ? Écrivez-nous depuis l&apos;adresse e-mail de votre compte (voir les <Link href="/mentions-legales">mentions légales</Link>) : nous résilions pour vous et vous le confirmons par e-mail.</p>
    </article>
  );
}
