import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { changerMotDePasse } from "@/lib/actions-auth";

export const metadata = { title: "Nouveau mot de passe" };

export default async function MotDePasse({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion?mode=oubli");
  const q = await searchParams;
  return (
    <section className="carte" style={{ maxWidth: "30rem" }}>
      <h1 style={{ fontSize: "1.7rem" }}>Nouveau mot de passe</h1>
      <p className="note">Compte : {session.user.email}</p>
      {q.erreur && <p className="alerte" role="alert">{q.erreur === "mdp" ? "Le mot de passe doit faire au moins 10 caractères." : "Le changement n'a pas abouti : redemandez un lien depuis « Mot de passe oublié »."}</p>}
      <form className="pile" action={changerMotDePasse}>
        <label>Nouveau mot de passe<input name="mdp" type="password" autoComplete="new-password" minLength={10} placeholder="10 caractères minimum" required /></label>
        <button className="btn p grand" type="submit">Enregistrer</button>
      </form>
    </section>
  );
}
