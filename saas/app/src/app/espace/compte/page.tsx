import Link from "next/link";
import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import { GestionCompte } from "@/components/GestionCompte";

export const metadata = { title: "Mon compte" };

export default async function Compte() {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const { profil, plan } = await profilEtPlan(session.user.id);
  return (
    <>
      <div className="barre-haut"><div><p className="note" style={{ margin: "0 0 .3rem" }}>{session.user.email}</p><h1>Mon compte</h1></div></div>
      <div className="carte pile" style={{ marginBottom: "1.2rem", maxWidth: "46rem" }}>
        <p style={{ margin: 0 }}><b>Offre :</b> {PLANS[plan].nom} · <Link href="/espace/abonnement">Gérer ou résilier</Link></p>
        <p style={{ margin: 0 }}><b>Statut :</b> {profil.statut_utilisateur === "professionnel" ? "professionnel" : "particulier (consommateur)"} · <b>Conditions acceptées le :</b> {profil.cgu_acceptees_le ? new Date(profil.cgu_acceptees_le as string).toLocaleDateString("fr-FR") : "—"}</p>
        <p className="note" style={{ margin: 0 }}><Link href="/cgu">CGU</Link> · <Link href="/cgv">CGV</Link> · <Link href="/confidentialite">Confidentialité</Link> · <Link href="/mentions-legales">Mentions légales</Link></p>
      </div>
      <div style={{ maxWidth: "46rem" }}><GestionCompte /></div>
    </>
  );
}
