import { notFound, redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { estAdmin, statistiques, type LigneProfil } from "@/lib/croissance";

export const metadata = { title: "Suivi des ventes", robots: { index: false } };
export const dynamic = "force-dynamic";

const euros = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/** Tableau de suivi réservé au propriétaire (adresses listées dans ADMIN_EMAILS). Chiffres réels uniquement, lus dans la base. */
export default async function Suivi() {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  if (!estAdmin(session.user.email)) notFound();
  const admin = supabaseAdmin();
  const [{ data: profils }, { data: actifs }] = await Promise.all([
    admin.from("profils").select("id, plan, periode, abonnement_statut, essai_fin, cgu_acceptees_le, resiliation_prevue, source, cree_le").limit(20000),
    admin.from("consommation").select("user_id").gt("prospects", 0).limit(50000),
  ]);
  const lignes = (profils ?? []) as (LigneProfil & { id: string })[];
  const s = statistiques(lignes, new Set((actifs ?? []).map((a) => a.user_id as string)), lignes.map((l) => l.id));
  const pct = (n: number | null) => (n === null || !s.inscrits ? "—" : `${Math.round((n / s.inscrits) * 100)} %`);
  return (
    <>
      <div className="barre-haut"><div><p className="note" style={{ margin: "0 0 .3rem" }}>Visible par vous seul</p><h1>Suivi des ventes</h1></div></div>
      <section className="suivi" aria-label="Chiffres clés">
        <div className="carte"><b>{euros(s.revenuMensuel)}</b><small>revenu mensuel récurrent (un abonnement annuel compte pour un douzième)</small></div>
        <div className="carte"><b>{s.payants}</b><small>abonnés payants · Pro {s.abonnes.pro} · Premium {s.abonnes.premium} · Ultra {s.abonnes.ultra}</small></div>
        <div className="carte"><b>{s.conversion.toLocaleString("fr-FR")} %</b><small>des inscrits sont abonnés</small></div>
        <div className="carte"><b>{s.essais}</b><small>essais Premium en cours</small></div>
        <div className="carte"><b>{s.resiliations}</b><small>résiliations prévues en fin de période</small></div>
      </section>
      <section className="carte" style={{ marginBottom: "1.4rem" }}>
        <h2 style={{ fontSize: "1.15rem" }}>Parcours des inscrits</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>Étape</th><th>Comptes</th><th>Part des inscrits</th></tr></thead>
          <tbody>
            <tr><td>Inscrits (7 derniers jours : {s.inscrits7j} · 30 jours : {s.inscrits30j})</td><td>{s.inscrits}</td><td>100 %</td></tr>
            <tr><td>Ont choisi leur secteur et leur zone</td><td>{s.configures}</td><td>{pct(s.configures)}</td></tr>
            <tr><td>Ont trouvé au moins un prospect</td><td>{s.actives ?? "—"}</td><td>{pct(s.actives)}</td></tr>
            <tr><td>Abonnés payants</td><td>{s.payants}</td><td>{pct(s.payants)}</td></tr>
          </tbody>
        </table></div>
        <p className="note" style={{ marginBottom: 0 }}>Là où le pourcentage chute le plus, c&apos;est l&apos;étape à améliorer en priorité.</p>
      </section>
      <section className="carte">
        <h2 style={{ fontSize: "1.15rem" }}>D&apos;où viennent les inscrits</h2>
        {s.sources.length ? <div className="table-wrap"><table>
          <thead><tr><th>Provenance</th><th>Inscrits</th><th>Abonnés</th></tr></thead>
          <tbody>{s.sources.map((x) => <tr key={x.nom}><td>{x.nom}</td><td>{x.inscrits}</td><td>{x.abonnes}</td></tr>)}</tbody>
        </table></div> : <p className="note">Aucune inscription pour l&apos;instant.</p>}
        <p className="note" style={{ marginBottom: 0 }}>Pour savoir quelle vidéo marche, mettez un lien différent dans chaque bio : <code>votre-site.fr/?src=tiktok</code>, <code>?src=instagram</code>, <code>?src=video2</code>… Aucun cookie n&apos;est utilisé.</p>
      </section>
    </>
  );
}
