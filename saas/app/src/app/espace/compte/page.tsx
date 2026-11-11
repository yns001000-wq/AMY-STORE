import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import { GestionCompte } from "@/components/GestionCompte";

export const metadata = { title: "Mon compte" };

async function reglerEmailsEssai(form: FormData) {
  "use server";
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  await session.sb.from("profils").update({ emails_essai: form.get("emails_essai") === "oui" }).eq("id", session.user.id);
  revalidatePath("/espace/compte");
}

export default async function Compte({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const { profil, plan } = await profilEtPlan(session.user.id);
  return (
    <>
      <div className="barre-haut"><div><p className="note" style={{ margin: "0 0 .3rem" }}>{session.user.email}</p><h1>Mon compte</h1></div></div>
      {q.mdp === "ok" && <p className="alerte ok" role="status" style={{ maxWidth: "46rem" }}>Votre mot de passe a été changé.</p>}
      <div className="carte pile" style={{ marginBottom: "1.2rem", maxWidth: "46rem" }}>
        <p style={{ margin: 0 }}><b>Offre :</b> {PLANS[plan].nom} · <Link href="/espace/abonnement">Gérer ou résilier</Link></p>
        <p style={{ margin: 0 }}><b>Statut :</b> {profil.statut_utilisateur === "professionnel" ? "professionnel" : "particulier (consommateur)"} · <b>Conditions acceptées le :</b> {profil.cgu_acceptees_le ? new Date(profil.cgu_acceptees_le as string).toLocaleDateString("fr-FR") : "—"}</p>
        <p className="note" style={{ margin: 0 }}><Link href="/cgu">CGU</Link> · <Link href="/cgv">CGV</Link> · <Link href="/confidentialite">Confidentialité</Link> · <Link href="/mentions-legales">Mentions légales</Link></p>
      </div>
      <div className="carte pile" style={{ marginBottom: "1.2rem", maxWidth: "46rem" }}>
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Connexion et e-mails</h2>
        <p style={{ margin: 0 }}><Link href="/espace/compte/mot-de-passe">Changer mon mot de passe</Link></p>
        <form action={reglerEmailsEssai} className="pile" style={{ gap: ".6rem" }}>
          <label className="case"><input type="checkbox" name="emails_essai" value="oui" defaultChecked={profil.emails_essai !== false} /><span>Recevoir les e-mails d&apos;information sur mon essai Premium (2 au plus : avant la fin, puis à la fin)</span></label>
          <div><button className="btn" type="submit">Enregistrer</button></div>
        </form>
        <p className="note" style={{ margin: 0 }}>Les e-mails obligatoires (confirmation de résiliation, rappel de renouvellement annuel) restent envoyés.</p>
      </div>
      <div style={{ maxWidth: "46rem" }}><GestionCompte /></div>
    </>
  );
}
