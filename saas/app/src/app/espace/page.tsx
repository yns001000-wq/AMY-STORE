import Link from "next/link";
import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { consommation, profilEtPlan } from "@/lib/quotas";
import { departementsAutorises, PLANS, type TypeQuota } from "@/lib/plans";
import { secteurParId } from "@/lib/secteurs";
import { nomDepartement } from "@/lib/departements";
import { BoutonRecherche } from "@/components/BoutonRecherche";
import { seDeconnecter } from "../connexion/actions";

export const metadata = { title: "Mon cockpit" };

const LIB: Record<TypeQuota, string> = { prospects: "Prospects ajoutés", messages_ia: "Messages IA", sites_ia: "Sites sur mesure IA" };

export default async function Espace({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const q = await searchParams;
  const { profil, plan } = await profilEtPlan(session.user.id);
  if (!profil.cgu_acceptees_le) redirect("/espace/bienvenue");
  const conso = await consommation(session.user.id);
  const { data: prospects } = await session.sb.from("prospects").select("id, nom, metier, ville, code_postal, adresse, statut, indices, telephone").order("cree_le", { ascending: false }).limit(200);
  const secteur = secteurParId(profil.secteur as string);
  const deps = departementsAutorises(plan, (profil.departements as string[]) ?? []);
  const ignores = ((profil.departements as string[]) ?? []).length - deps.length;
  const P = PLANS[plan], plein = conso.prospects >= P.quotas.prospects;
  const essaiPossible = profil.plan === "gratuit" && !profil.essai_premium_utilise;
  return (
    <>
      <section style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "end" }}>
        <div>
          <h1 style={{ fontSize: "2rem" }}>Bonjour{profil.prenom ? ` ${profil.prenom}` : ""}</h1>
          <p className="note">Offre <strong>{P.nom}</strong>{profil.essai_fin && plan === "premium" && profil.plan === "gratuit" ? ` (essai jusqu'au ${new Date(profil.essai_fin as string).toLocaleDateString("fr-FR")})` : ""} · {secteur?.nom} · {deps.map((d) => nomDepartement(d) ?? d).join(", ")}</p>
        </div>
        <div className="nav">
          <Link className="btn" href="/espace/bienvenue">Secteur et zone</Link>
          <Link className="btn" href="/espace/abonnement">Mon abonnement</Link>
          <form action={seDeconnecter}><button className="btn" type="submit">Déconnexion</button></form>
        </div>
      </section>
      {q.abonnement === "ok" && <p className="alerte" role="status">Merci ! Votre abonnement est en cours d&apos;activation : il apparaît ici dans quelques secondes.</p>}
      {ignores > 0 && <p className="alerte">Votre offre couvre {P.departements} département(s) : {ignores} département(s) choisi(s) ne sont pas utilisés. <Link href="/espace/abonnement">Élargir ma zone</Link></p>}

      <section className="grille" style={{ margin: "1.5rem 0" }} aria-label="Consommation du mois">
        {(Object.keys(LIB) as TypeQuota[]).map((t) => {
          const max = P.quotas[t], v = conso[t];
          return (
            <div key={t} className="carte">
              <p className="note" style={{ margin: 0 }}>{LIB[t]} ce mois-ci</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, margin: ".2rem 0" }}>{v} / {max}</p>
              <div className="jauge" role="img" aria-label={`${v} sur ${max}`}><i style={{ width: `${max ? Math.min(100, (v / max) * 100) : 100}%` }} /></div>
            </div>
          );
        })}
      </section>

      {plein && (
        <div className="carte" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.3rem" }}>Vous avez utilisé vos {P.quotas.prospects} prospects du mois</h2>
          <p className="note">Vos prospects et votre historique restent accessibles. Pour en ajouter de nouveaux avant le mois prochain : Pro (300 par mois, 3 départements) ou Premium (1 000 par mois, 10 départements, sites sur mesure).</p>
          <p className="nav">
            <Link className="btn p" href="/espace/abonnement">Voir les offres</Link>
            {essaiPossible && <form action="/api/essai" method="post"><button className="btn" type="submit">Essayer Premium 7 jours, sans carte</button></form>}
          </p>
        </div>
      )}

      <section className="carte">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.3rem", margin: 0 }}>Mes prospects ({prospects?.length ?? 0})</h2>
          <BoutonRecherche desactive={plein} />
        </div>
        {!prospects?.length ? <p className="note">Aucun prospect pour l&apos;instant : lancez votre première recherche.</p> : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>Entreprise</th><th>Métier</th><th>Ville</th><th>Statut</th><th>Coordonnées</th></tr></thead>
              <tbody>
                {prospects.map((p) => {
                  const recherche = encodeURIComponent(`${p.nom} ${p.ville ?? ""}`);
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.nom}</strong><br /><span className="note">{p.indices}</span></td>
                      <td>{p.metier}</td>
                      <td>{p.ville} {p.code_postal}</td>
                      <td>{p.statut}</td>
                      <td>{p.telephone ?? <span className="note">Numéro : <a href={`https://www.google.com/maps/search/?api=1&query=${recherche}`} target="_blank" rel="noopener">Maps</a> · <a href={`https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(p.nom)}&ou=${encodeURIComponent(p.ville ?? "")}`} target="_blank" rel="noopener">Pages Jaunes</a></span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="note" style={{ marginTop: "1rem" }}>Source : base Sirene (INSEE), registre public. Les entreprises qui se sont opposées à l&apos;usage commercial de leurs données sont exclues automatiquement. Respectez toute demande « STOP » immédiatement.</p>
      </section>
    </>
  );
}
