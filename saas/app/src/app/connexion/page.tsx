import Link from "next/link";
import { seConnecter, sInscrire } from "./actions";

export const metadata = { title: "Connexion" };

const ERREURS: Record<string, string> = {
  identifiants: "E-mail ou mot de passe incorrect.", mdp: "Le mot de passe doit faire au moins 10 caractères.", inscription: "Inscription impossible : cette adresse est peut-être déjà utilisée.",
};

export default async function Connexion({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams, inscription = q.mode === "inscription";
  return (
    <section className="carte" style={{ maxWidth: "32rem", margin: "2rem auto" }}>
      <h1 style={{ fontSize: "1.8rem" }}>{inscription ? "Créer mon cockpit" : "Me connecter"}</h1>
      {q.verifier && <p className="alerte" role="status">Un e-mail de confirmation vient de vous être envoyé. Cliquez sur le lien pour activer votre compte.</p>}
      {q.erreur && <p className="alerte" role="alert">{ERREURS[q.erreur] ?? "Une erreur est survenue."}</p>}
      <form className="pile" action={inscription ? sInscrire : seConnecter}>
        <input type="hidden" name="suite" value={q.suite ?? ""} />
        <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
        <label>Mot de passe<input name="mdp" type="password" autoComplete={inscription ? "new-password" : "current-password"} minLength={inscription ? 10 : undefined} required /></label>
        <button className="btn p" type="submit">{inscription ? "Créer mon compte gratuit" : "Me connecter"}</button>
      </form>
      <p className="note" style={{ marginTop: "1rem" }}>
        {inscription ? <>Déjà inscrit ? <Link href="/connexion">Me connecter</Link></> : <>Pas encore de compte ? <Link href="/connexion?mode=inscription">Créer mon cockpit gratuitement</Link></>}
      </p>
    </section>
  );
}
