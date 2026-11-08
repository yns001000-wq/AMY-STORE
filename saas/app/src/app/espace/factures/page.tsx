import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, FilePlus2, FileText, Lock, ReceiptText } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import { dateFr, euros, LIBELLES, STATUTS, totaux, nettoyerLignes } from "@/lib/factures";

export const metadata = { title: "Devis et factures" };

export default async function PageFactures({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const { type } = await searchParams;
  const [{ plan }, { data: docs }, { data: ent }] = await Promise.all([
    profilEtPlan(session.user.id),
    session.sb.from("documents").select("id, type, numero, statut, client, lignes, taux_tva, date_emission, date_echeance, paye_le, cree_le").order("cree_le", { ascending: false }).limit(500),
    session.sb.from("entreprises").select("siret").maybeSingle(),
  ]);
  const ok = PLANS[plan].facturation;
  const liste = (docs ?? []).filter((d) => !type || d.type === type);
  const annee = String(new Date().getFullYear()), mois = new Date().toISOString().slice(0, 7);
  const ttc = (d: { lignes: unknown; taux_tva: number }) => totaux(nettoyerLignes(d.lignes), Number(d.taux_tva)).ttc;
  const encaisse = (p: string) => (docs ?? []).filter((d) => d.type === "facture" && d.statut === "payee" && d.paye_le?.startsWith(p)).reduce((s, d) => s + ttc(d), 0);
  const attente = (docs ?? []).filter((d) => d.type === "facture" && d.statut === "emise").reduce((s, d) => s + ttc(d), 0);
  const devisOuverts = (docs ?? []).filter((d) => d.type === "devis" && d.statut === "envoye");
  return (
    <>
      <div className="barre-haut">
        <div><p className="note" style={{ margin: "0 0 .3rem" }}>Numérotation continue, mentions légales, avoirs : conforme et sans tableur</p><h1>Devis et factures</h1></div>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
          <Link className="btn" href="/espace/factures/entreprise"><Building2 aria-hidden />Mon entreprise</Link>
          {ok ? <>
            <form action="/api/documents" method="post"><input type="hidden" name="type" value="devis" /><button className="btn p" type="submit"><FilePlus2 aria-hidden />Nouveau devis</button></form>
            <form action="/api/documents" method="post"><input type="hidden" name="type" value="facture" /><button className="btn" type="submit"><ReceiptText aria-hidden />Nouvelle facture</button></form>
          </> : <Link className="btn p" href="/espace/abonnement"><Lock aria-hidden />Inclus dès Premium</Link>}
        </div>
      </div>
      {ok && !ent?.siret && <p className="alerte">Première fois ? <Link href="/espace/factures/entreprise">Renseignez votre identité de vendeur</Link> : elle est obligatoire sur chaque devis et chaque facture.</p>}
      <div className="stats">
        <div className="carte stat"><p className="note" style={{ margin: 0 }}>Encaissé ce mois-ci</p><p className="valeur">{euros(encaisse(mois))}</p></div>
        <div className="carte stat"><p className="note" style={{ margin: 0 }}>Encaissé en {annee}</p><p className="valeur">{euros(encaisse(annee))}</p><p className="note" style={{ margin: 0 }}>Micro-entreprise : c&apos;est le chiffre d&apos;affaires encaissé que l&apos;on déclare à l&apos;Urssaf.</p></div>
        <div className="carte stat"><p className="note" style={{ margin: 0 }}>En attente de paiement</p><p className="valeur">{euros(attente)}</p></div>
        <div className="carte stat"><p className="note" style={{ margin: 0 }}>Devis en attente de réponse</p><p className="valeur">{devisOuverts.length}</p></div>
      </div>
      <section className="carte">
        <div className="tableau-entete">
          <div className="bascule" role="group" aria-label="Type" style={{ margin: 0 }}>
            {[["", "Tout"], ["devis", "Devis"], ["facture", "Factures"], ["avoir", "Avoirs"]].map(([t, l]) => <Link key={t} href={t ? `/espace/factures?type=${t}` : "/espace/factures"} className="onglet-lien" aria-current={(type ?? "") === t ? "page" : undefined}>{l}</Link>)}
          </div>
        </div>
        {!liste.length ? <div className="vide"><FileText aria-hidden /><h3>Aucun document</h3><p className="note">Créez un devis depuis la fiche d&apos;un prospect ou avec le bouton « Nouveau devis ».</p></div> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Document</th><th>Client</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody>{liste.map((d) => { const s = STATUTS[d.statut]; return (
              <tr key={d.id}>
                <td><Link href={`/espace/factures/${d.id}`}><b>{LIBELLES[d.type as "devis"]}</b> {d.numero ?? "brouillon"}</Link></td>
                <td>{d.client?.nom || "—"}</td>
                <td>{d.date_emission ? dateFr(d.date_emission) : dateFr(d.cree_le)}</td>
                <td>{euros((d.type === "avoir" ? -1 : 1) * ttc(d))}</td>
                <td><span className="statut" style={{ color: s.couleur, background: `color-mix(in srgb, ${s.couleur} 14%, transparent)` }}>{s.nom}</span></td>
              </tr>); })}</tbody>
          </table></div>
        )}
      </section>
      <p className="note" style={{ marginTop: "1rem" }}>Facturation électronique : la réforme impose progressivement aux entreprises de recevoir puis d&apos;émettre leurs factures entre professionnels par une plateforme agréée. Vérifiez les dates qui vous concernent sur impots.gouv.fr ; MySite vous préviendra des évolutions.</p>
    </>
  );
}
