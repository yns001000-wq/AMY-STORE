import Link from "next/link";
import { ArrowRight, GraduationCap, MapPin, ShieldCheck, Store, WandSparkles } from "lucide-react";
import { demanderNouveauMotDePasse, seConnecter, sInscrire } from "@/lib/actions-auth";
import { nettoyerSource, offrePayante } from "@/lib/croissance";
import { PLANS } from "@/lib/plans";

export const metadata = { title: "Connexion", robots: { index: false } };

const ERREURS: Record<string, string> = {
  identifiants: "E-mail ou mot de passe incorrect.", mdp: "Le mot de passe doit faire au moins 10 caractères.",
  inscription: "Inscription impossible : cette adresse est peut-être déjà utilisée.", lien: "Ce lien a expiré : demandez-en un nouveau.",
};

export default async function Connexion({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams, inscription = q.mode === "inscription", oubli = q.mode === "oubli";
  const offre = offrePayante(q.offre), src = nettoyerSource(q.src);
  const suiteInscription = `/connexion?${new URLSearchParams({ mode: "inscription", ...(offre ? { offre } : {}), ...(src ? { src } : {}) })}`;
  return (
    <div className="auth">
      <aside className="auth-visuel">
        <h2>Tout pour vendre des sites aux commerces de votre ville.</h2>
        <p style={{ color: "rgba(255,255,255,.88)", maxWidth: "28rem" }}>Gratuit pour commencer, sans carte bancaire. Vous passez à une offre payante seulement si l&apos;outil vous sert.</p>
        <ul>
          <li><MapPin aria-hidden />Les commerces de votre zone, dans la base officielle Sirene</li>
          <li><WandSparkles aria-hidden />Un message rédigé pour chaque commerce</li>
          <li><Store aria-hidden />Une maquette de site à montrer en rendez-vous</li>
          <li><GraduationCap aria-hidden />Une Académie pour apprendre à vendre, pas à pas</li>
          <li><ShieldCheck aria-hidden />Données publiques, entreprises opposées exclues</li>
        </ul>
      </aside>
      <div className="auth-form">
        <section className="carte">
          {oubli ? <>
            <h1 style={{ fontSize: "1.8rem" }}>Mot de passe oublié</h1>
            <p className="note">Indiquez votre e-mail : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
            {q.envoye && <p className="alerte ok" role="status">Si un compte existe avec cette adresse, un e-mail vient de partir. Pensez à regarder dans les indésirables.</p>}
            <form className="pile" action={demanderNouveauMotDePasse}>
              <label>E-mail<input name="email" type="email" autoComplete="email" inputMode="email" placeholder="vous@exemple.fr" required /></label>
              <button className="btn p bloc grand" type="submit">Recevoir le lien <ArrowRight aria-hidden /></button>
            </form>
            <p className="note" style={{ marginTop: "1.2rem", textAlign: "center" }}><Link href="/connexion">Retour à la connexion</Link></p>
          </> : <>
            <h1 style={{ fontSize: "1.8rem" }}>{inscription ? "Créer mon compte" : "Bon retour !"}</h1>
            <p className="note">{inscription ? (offre ? `Compte gratuit d'abord : vous choisirez l'offre ${PLANS[offre].nom} juste après, sans obligation.` : "Gratuit, sans carte bancaire. 1 minute.") : "Connectez-vous à votre cockpit."}</p>
            {q.verifier && <p className="alerte ok" role="status">Dernière étape : un e-mail de confirmation vient de vous être envoyé. Cliquez sur le lien pour ouvrir votre cockpit (regardez aussi dans les indésirables).</p>}
            {q.erreur && <p className="alerte" role="alert">{ERREURS[q.erreur] ?? "Une erreur est survenue."}</p>}
            <form className="pile" action={inscription ? sInscrire : seConnecter}>
              <input type="hidden" name="suite" value={q.suite ?? ""} />
              {inscription && <><input type="hidden" name="offre" value={offre ?? ""} /><input type="hidden" name="src" value={src ?? ""} /></>}
              <label>E-mail<input name="email" type="email" autoComplete="email" inputMode="email" placeholder="vous@exemple.fr" required /></label>
              <label>Mot de passe<input name="mdp" type="password" autoComplete={inscription ? "new-password" : "current-password"} minLength={inscription ? 10 : undefined} placeholder={inscription ? "10 caractères minimum" : ""} required /></label>
              <button className="btn p bloc grand" type="submit">{inscription ? "Créer mon compte gratuit" : "Me connecter"} <ArrowRight aria-hidden /></button>
            </form>
            {!inscription && <p className="note" style={{ marginTop: ".9rem", textAlign: "center" }}><Link href="/connexion?mode=oubli">Mot de passe oublié ?</Link></p>}
            <p className="note" style={{ marginTop: "1.2rem", textAlign: "center" }}>
              {inscription ? <>Déjà inscrit ? <Link href="/connexion">Me connecter</Link></> : <>Pas encore de compte ? <Link href={suiteInscription}>Créer mon compte gratuit</Link></>}
            </p>
          </>}
        </section>
      </div>
    </div>
  );
}
