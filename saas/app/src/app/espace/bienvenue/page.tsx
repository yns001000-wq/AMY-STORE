import Link from "next/link";
import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { SECTEURS } from "@/lib/secteurs";
import { DEPARTEMENTS } from "@/lib/departements";
import { enregistrerAccueil } from "./actions";

export const metadata = { title: "Bienvenue" };

export default async function Bienvenue({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const q = await searchParams;
  const { data: p } = await session.sb.from("profils").select("prenom, secteur, departements, statut_utilisateur").eq("id", session.user.id).single();
  return (
    <section className="carte" style={{ maxWidth: "44rem" }}>
      <span className="surtitre">Configuration</span>
      <h1 style={{ fontSize: "1.9rem" }}>Préparons votre cockpit</h1>
      <p className="note">Votre secteur et votre zone déterminent les prospects que MySite vous propose. Vous pourrez les modifier à tout moment.</p>
      {q.erreur && <p className="alerte" role="alert">Merci de choisir un secteur, au moins un département, votre situation, et d&apos;accepter les conditions.</p>}
      <form className="pile" action={enregistrerAccueil}>
        <label>Votre prénom (facultatif)<input name="prenom" defaultValue={p?.prenom ?? ""} maxLength={60} /></label>
        <label>Qui voulez-vous démarcher ?
          <select name="secteur" defaultValue={p?.secteur ?? ""} required>
            <option value="" disabled>Choisir un secteur</option>
            {SECTEURS.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
        </label>
        <label>Où ? (le nombre de départements utilisés dépend de votre offre : 1 en gratuit)
          <select name="departements" multiple size={8} defaultValue={p?.departements ?? []} required>
            {DEPARTEMENTS.map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}
          </select>
        </label>
        <fieldset className="choix" style={{ border: 0, padding: 0 }}>
          <legend style={{ fontWeight: 600, marginBottom: ".5rem", color: "var(--encre)" }}>Votre situation</legend>
          <label><input type="radio" name="statut" value="professionnel" defaultChecked={p?.statut_utilisateur === "professionnel"} required />J&apos;ai une activité déclarée (SIRET) et j&apos;utilise MySite pour mon activité professionnelle</label>
          <label><input type="radio" name="statut" value="particulier" defaultChecked={p?.statut_utilisateur === "particulier"} />Je me lance (pas encore d&apos;activité déclarée)</label>
        </fieldset>
        <label className="case"><input type="checkbox" name="cgu" value="oui" required />
          <span>Je certifie être majeur. J&apos;accepte les <Link href="/cgu" target="_blank">conditions d&apos;utilisation</Link> et les <Link href="/cgv" target="_blank">conditions de vente</Link>, et je m&apos;engage à prospecter dans le respect des règles (messages professionnels identifiés, droit d&apos;opposition respecté).</span>
        </label>
        <button className="btn p grand" type="submit">Enregistrer et voir mes prospects</button>
      </form>
    </section>
  );
}
