import { ORDRE_PLANS, PLANS, type PlanId } from "@/lib/plans";

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString("fr-FR") : "France entière");

/** Grille des offres. `action` : rendu du bouton de chaque offre (lien d'inscription ou formulaire de paiement). */
export function Tarifs({ action, planActuel }: { action: (id: PlanId) => React.ReactNode; planActuel?: PlanId }) {
  return (
    <div className="grille">
      {ORDRE_PLANS.map((id) => {
        const p = PLANS[id];
        return (
          <article key={id} className={`carte offre${p.misEnAvant ? " avant" : ""}`} aria-labelledby={`offre-${id}`}>
            {p.misEnAvant && <span className="badge">Le plus choisi</span>}
            <h3 id={`offre-${id}`}>{p.nom}</h3>
            <p className="note">{p.accroche}</p>
            <p className="prix">{p.prixMensuel} €<small> TTC / mois</small></p>
            {p.prixAnnuel > 0 && <p className="note">ou {p.prixAnnuel} € par an (2 mois offerts)</p>}
            <ul>
              <li>{Number.isFinite(p.departements) ? `${p.departements} département${p.departements > 1 ? "s" : ""}` : "France entière"}</li>
              <li>{fmt(p.quotas.prospects)} prospects par mois</li>
              <li>{fmt(p.quotas.messages_ia)} messages rédigés par l&apos;IA</li>
              <li className={p.quotas.sites_ia ? "" : "non"}>{p.quotas.sites_ia ? `${p.quotas.sites_ia} sites sur mesure par l'IA` : "1 maquette express (pas de site sur mesure)"}</li>
              <li>Pipeline, rappels et carte</li>
              <li className={p.export ? "" : "non"}>Export CSV</li>
              <li className={p.facturation ? "" : "non"}>Devis et factures</li>
              {p.utilisateurs > 1 && <li>{p.utilisateurs} utilisateurs</li>}
            </ul>
            <div style={{ marginTop: "auto" }}>{planActuel === id ? <p className="note"><strong>Votre offre actuelle</strong></p> : action(id)}</div>
          </article>
        );
      })}
    </div>
  );
}
