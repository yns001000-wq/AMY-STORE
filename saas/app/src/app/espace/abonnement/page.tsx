import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { profilEtPlan } from "@/lib/quotas";
import { Tarifs } from "@/components/Tarifs";

export const metadata = { title: "Mon abonnement" };

export default async function Abonnement({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const q = await searchParams;
  const { profil, plan } = await profilEtPlan(session.user.id);
  const particulier = profil.statut_utilisateur !== "professionnel";
  const abonne = Boolean(profil.stripe_subscription_id);
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Mon abonnement</h1>
      {q.erreur === "renonciation" && <p className="alerte" role="alert">Pour un accès immédiat, cochez la case de demande d&apos;exécution immédiate (sinon, contactez-nous pour démarrer après le délai de rétractation de 14 jours).</p>}
      {q.annule && <p className="alerte" role="status">Paiement annulé : rien n&apos;a été prélevé.</p>}
      {abonne ? (
        <div className="carte" style={{ marginBottom: "1.5rem" }}>
          <p>Abonnement actif : <strong>{plan}</strong>{profil.periode_fin ? `, renouvelé le ${new Date(profil.periode_fin as string).toLocaleDateString("fr-FR")}` : ""}.</p>
          <form action="/api/stripe/portail" method="post"><button className="btn p" type="submit">Changer d&apos;offre, factures, carte ou résiliation</button></form>
          <p className="note">La résiliation prend effet à la fin de la période payée ; aucun frais.</p>
        </div>
      ) : null}
      <Tarifs planActuel={plan} action={(id) => id === "gratuit" || abonne ? null : (
        <form action="/api/stripe/checkout" method="post" className="pile">
          <input type="hidden" name="plan" value={id} />
          <label>Période<select name="periode" defaultValue="mensuel"><option value="mensuel">Mensuelle, sans engagement</option><option value="annuel">Annuelle, 2 mois offerts</option></select></label>
          {particulier && (
            <label className="case"><input type="checkbox" name="renonciation" value="oui" required />
              <span className="note">Je demande l&apos;accès immédiat au service et je reconnais perdre mon droit de rétractation de 14 jours une fois le service pleinement exécuté (art. L221-28 du Code de la consommation).</span></label>
          )}
          <button className={`btn${id === "premium" ? " p" : ""}`} type="submit">S&apos;abonner</button>
          <p className="note">Paiement sécurisé par Stripe. Renouvellement automatique, résiliable à tout moment depuis cette page.</p>
        </form>
      )} />
    </>
  );
}
