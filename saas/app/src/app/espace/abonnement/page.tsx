import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import { Tarifs } from "@/components/Tarifs";
import { GestionAbonnement } from "@/components/GestionAbonnement";
import { retractationPossible } from "@/lib/conformite";
import { offrePayante } from "@/lib/croissance";

export const metadata = { title: "Mon abonnement" };

export default async function Abonnement({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const q = await searchParams;
  const { profil, plan } = await profilEtPlan(session.user.id);
  const abonne = Boolean(profil.stripe_subscription_id);
  return (
    <>
      <div className="barre-haut"><div><p className="note" style={{ margin: "0 0 .3rem" }}>Offre actuelle : {PLANS[plan].nom}</p><h1>Mon abonnement</h1></div></div>
      {q.erreur === "renonciation" && <p className="alerte" role="alert">Pour un accès immédiat, cochez la case de demande d&apos;accès immédiat (ou contactez-nous pour démarrer après le délai de rétractation de 14 jours).</p>}
      {offrePayante(q.offre) && !abonne && <p className="alerte ok" role="status">Votre cockpit est prêt. Vous aviez choisi l&apos;offre {PLANS[offrePayante(q.offre)!].nom} : validez-la ci-dessous, ou <a href="/espace">commencez en Gratuit</a> et décidez plus tard.</p>}
      {q.annule && <p className="alerte" role="status">Paiement annulé : rien n&apos;a été prélevé.</p>}
      {abonne && (
        <div className="carte upsell" style={{ marginBottom: "1.6rem" }}>
          <span className="pastille p-violet" style={{ margin: 0 }}><CreditCard aria-hidden /></span>
          <div><h2 style={{ fontSize: "1.2rem", margin: "0 0 .3rem" }}>Abonnement {PLANS[plan].nom} actif</h2>
            <p className="note" style={{ margin: 0 }}>{profil.periode_fin ? `${profil.resiliation_prevue ? "Fin de l'abonnement" : "Prochain renouvellement"} le ${new Date(profil.periode_fin as string).toLocaleDateString("fr-FR")}. ` : ""}Sans engagement : résiliable à tout moment, sans frais.</p></div>
          <form action="/api/stripe/portail" method="post"><button className="btn p" type="submit">Changer d&apos;offre, factures, carte</button></form>
        </div>
      )}
      {abonne && <div style={{ marginBottom: "1.6rem" }}><GestionAbonnement offre={PLANS[plan].nom} fin={(profil.periode_fin as string) ?? null} resiliationPrevue={!!profil.resiliation_prevue}
        retractation={(() => { const r = retractationPossible({ particulier: profil.statut_utilisateur !== "professionnel", debut: profil.abonnement_debut ? new Date(profil.abonnement_debut as string) : null, deja: !!profil.retractation_le }); return { ok: r.ok, jusquau: r.jusquau?.toISOString() ?? null }; })()} /></div>}
      <Tarifs mode="abonnement" planActuel={plan} particulier={profil.statut_utilisateur !== "professionnel"} abonne={abonne} voulue={abonne ? null : offrePayante(q.offre)} />
      <p className="note" style={{ marginTop: "1.5rem", textAlign: "center" }}>Paiement sécurisé par Stripe · Prix TTC, TVA non applicable (art. 293 B du CGI) · Résiliable à tout moment</p>
    </>
  );
}
