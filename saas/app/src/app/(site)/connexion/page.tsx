import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Store, WandSparkles } from "lucide-react";
import { seConnecter, sInscrire } from "@/lib/actions-auth";

export const metadata = { title: "Connexion" };

const ERREURS: Record<string, string> = {
  identifiants: "E-mail ou mot de passe incorrect.", mdp: "Le mot de passe doit faire au moins 10 caractères.",
  inscription: "Inscription impossible : cette adresse est peut-être déjà utilisée.", lien: "Ce lien a expiré : reconnectez-vous.",
};

export default async function Connexion({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams, inscription = q.mode === "inscription";
  return (
    <div className="auth">
      <aside className="auth-visuel">
        <h2>Votre cockpit de prospection, prêt en 3 minutes.</h2>
        <p style={{ color: "rgba(255,255,255,.88)", maxWidth: "28rem" }}>Gratuit pour commencer, sans carte bancaire. Évoluez quand vos premières ventes arrivent.</p>
        <ul>
          <li><MapPin aria-hidden />Les commerces de votre zone, dans la base officielle Sirene</li>
          <li><WandSparkles aria-hidden />Des messages rédigés par l&apos;IA pour chacun</li>
          <li><Store aria-hidden />Une maquette de site à montrer en rendez-vous</li>
          <li><ShieldCheck aria-hidden />Données publiques, entreprises opposées exclues</li>
        </ul>
      </aside>
      <div className="auth-form">
        <section className="carte">
          <h1 style={{ fontSize: "1.8rem" }}>{inscription ? "Créer mon cockpit" : "Bon retour !"}</h1>
          <p className="note">{inscription ? "Gratuit, sans carte bancaire." : "Connectez-vous à votre cockpit."}</p>
          {q.verifier && <p className="alerte ok" role="status">Un e-mail de confirmation vient de vous être envoyé. Cliquez sur le lien pour activer votre compte.</p>}
          {q.erreur && <p className="alerte" role="alert">{ERREURS[q.erreur] ?? "Une erreur est survenue."}</p>}
          <form className="pile" action={inscription ? sInscrire : seConnecter}>
            <input type="hidden" name="suite" value={q.suite ?? ""} />
            <label>E-mail<input name="email" type="email" autoComplete="email" placeholder="vous@exemple.fr" required /></label>
            <label>Mot de passe<input name="mdp" type="password" autoComplete={inscription ? "new-password" : "current-password"} minLength={inscription ? 10 : undefined} placeholder={inscription ? "10 caractères minimum" : ""} required /></label>
            <button className="btn p bloc grand" type="submit">{inscription ? "Créer mon compte gratuit" : "Me connecter"} <ArrowRight aria-hidden /></button>
          </form>
          <p className="note" style={{ marginTop: "1.2rem", textAlign: "center" }}>
            {inscription ? <>Déjà inscrit ? <Link href="/connexion">Me connecter</Link></> : <>Pas encore de compte ? <Link href="/connexion?mode=inscription">Créer mon cockpit</Link></>}
          </p>
        </section>
      </div>
    </div>
  );
}
