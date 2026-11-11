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
  const { data: p } = await session.sb.from("profils").select("prenom, secteur, departements, statut_utilisateur, cgu_acceptees_le").eq("id", session.user.id).single();
  const deps = (p?.departements as string[] | null) ?? [], premiere = !p?.cgu_acceptees_le;
  return (
    <section className="carte" style={{ maxWidth: "44rem" }}>
      <span className="surtitre">{premiere ? "Dernière étape · 30 secondes" : "Réglages"}</span>
      <h1 style={{ fontSize: "1.9rem" }}>{premiere ? "Qui voulez-vous démarcher ?" : "Secteur et zone"}</h1>
      <p className="note">{premiere ? "Dès que vous validez, MySite cherche vos premiers commerces. Vous pourrez tout modifier ensuite." : "Votre secteur et votre zone déterminent les commerces que MySite vous propose."}</p>
      {q.erreur && <p className="alerte" role="alert">Merci de choisir un secteur, un département, votre situation, et d&apos;accepter les conditions.</p>}
      <form className="pile" action={enregistrerAccueil}>
        <fieldset className="choix" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 600, marginBottom: ".5rem", color: "var(--encre)" }}>Type de commerces</legend>
          {SECTEURS.map((s, i) => <label key={s.id}><input type="radio" name="secteur" value={s.id} defaultChecked={p?.secteur ? p.secteur === s.id : i === 0} required /><span>{s.nom}<small className="note" style={{ display: "block", fontWeight: 400 }}>{s.description}</small></span></label>)}
        </fieldset>
        <label>Votre département
          <select name="departements" defaultValue={deps[0] ?? ""} required>
            <option value="" disabled>Choisir un département</option>
            {DEPARTEMENTS.map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}
          </select>
        </label>
        <details open={deps.length > 1}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Ajouter d&apos;autres départements (offres payantes)</summary>
          <p className="note" style={{ margin: ".5rem 0" }}>Gratuit : 1 département · Pro : 3 · Premium : 10 · Ultra : France entière.</p>
          <div className="cases-deps">
            {DEPARTEMENTS.map(([c, n]) => <label key={c} className="case"><input type="checkbox" name="departements" value={c} defaultChecked={deps.slice(1).includes(c)} /><span>{c} · {n}</span></label>)}
          </div>
        </details>
        <label>Votre prénom (facultatif)<input name="prenom" defaultValue={p?.prenom ?? ""} maxLength={60} autoComplete="given-name" /></label>
        <fieldset className="choix" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 600, marginBottom: ".5rem", color: "var(--encre)" }}>Votre situation</legend>
          <label><input type="radio" name="statut" value="particulier" defaultChecked={p?.statut_utilisateur !== "professionnel"} required />Je me lance (pas encore d&apos;activité déclarée)</label>
          <label><input type="radio" name="statut" value="professionnel" defaultChecked={p?.statut_utilisateur === "professionnel"} />J&apos;ai une activité déclarée (SIRET) et j&apos;utilise MySite pour elle</label>
        </fieldset>
        <label className="case"><input type="checkbox" name="cgu" value="oui" required defaultChecked={!premiere} />
          <span>Je certifie être majeur. J&apos;accepte les <Link href="/cgu" target="_blank">conditions d&apos;utilisation</Link> et les <Link href="/cgv" target="_blank">conditions de vente</Link>, et je m&apos;engage à prospecter dans le respect des règles (messages professionnels identifiés, droit d&apos;opposition respecté).</span>
        </label>
        <button className="btn p grand" type="submit">{premiere ? "Trouver mes premiers commerces" : "Enregistrer"}</button>
      </form>
    </section>
  );
}
