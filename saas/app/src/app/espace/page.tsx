import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, Gift, Lock, Search, Store, Target, WandSparkles } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { consommation, profilEtPlan } from "@/lib/quotas";
import { departementsAutorises, PLANS, type TypeQuota } from "@/lib/plans";
import { secteurParId } from "@/lib/secteurs";
import { etape } from "@/lib/pipeline";
import { nomDepartement } from "@/lib/departements";
import { BoutonRecherche } from "@/components/BoutonRecherche";

export const metadata = { title: "Mon cockpit" };

const STATS: [TypeQuota, string, typeof Target, string][] = [
  ["prospects", "Prospects ajoutés", Target, "p-violet"], ["messages_ia", "Messages IA", WandSparkles, "p-rose"], ["sites_ia", "Sites sur mesure IA", Store, "p-cyan"],
];
const COULEURS = ["#6d4aff", "#0ea5c6", "#ec4899", "#f97316", "#10b981", "#3b5bfd"];
const initiales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join("").toUpperCase();

export default async function Espace({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const q = await searchParams;
  const { profil, plan } = await profilEtPlan(session.user.id);
  if (!profil.cgu_acceptees_le) redirect("/espace/bienvenue");
  const conso = await consommation(session.user.id);
  const { data: prospects } = await session.sb.from("prospects").select("id, nom, metier, ville, code_postal, statut, indices, telephone").order("cree_le", { ascending: false }).limit(200);
  const secteur = secteurParId(profil.secteur as string);
  const deps = departementsAutorises(plan, (profil.departements as string[]) ?? []);
  const ignores = ((profil.departements as string[]) ?? []).length - deps.length;
  const P = PLANS[plan], plein = conso.prospects >= P.quotas.prospects;
  const essaiPossible = profil.plan === "gratuit" && !profil.essai_premium_utilise;
  const enEssai = profil.plan === "gratuit" && plan === "premium";
  return (
    <>
      <div className="barre-haut">
        <div>
          <p className="note" style={{ margin: "0 0 .3rem" }}>{secteur?.nom} · {deps.map((d) => nomDepartement(d) ?? d).join(", ")}</p>
          <h1>Bonjour{profil.prenom ? ` ${profil.prenom}` : ""} 👋</h1>
        </div>
        <span className="badge-offre"><Crown aria-hidden />Offre {P.nom}{enEssai ? ` · essai jusqu'au ${new Date(profil.essai_fin as string).toLocaleDateString("fr-FR")}` : ""}</span>
      </div>
      {q.abonnement === "ok" && <p className="alerte ok" role="status">Merci ! Votre abonnement est en cours d&apos;activation : il apparaît ici dans quelques secondes.</p>}
      {ignores > 0 && <p className="alerte">Votre offre couvre {P.departements} département(s) : {ignores} département(s) choisi(s) ne sont pas utilisés.&nbsp;<Link href="/espace/abonnement">Élargir ma zone</Link></p>}

      <section className="stats" aria-label="Consommation du mois">
        {STATS.map(([t, lib, Ico, coul]) => {
          const max = P.quotas[t], v = conso[t], pct = max ? Math.min(100, (v / max) * 100) : 100;
          return (
            <div key={t} className={`carte stat${max ? "" : " verrou"}`}>
              <span className={`ico pastille ${coul}`} style={{ margin: 0, width: "2.4rem", height: "2.4rem" }}><Ico aria-hidden /></span>
              <p className="note" style={{ margin: 0 }}>{lib} ce mois-ci</p>
              {max ? <>
                <p className="valeur">{v}<small> / {max}</small></p>
                <div className={`jauge${pct >= 100 ? " pleine" : ""}`} role="img" aria-label={`${v} sur ${max}`}><i style={{ width: `${pct}%` }} /></div>
              </> : <p className="valeur"><Lock aria-hidden />Inclus dès l&apos;offre Pro &nbsp;<Link href="/espace/abonnement">Débloquer</Link></p>}
            </div>
          );
        })}
      </section>

      {plein && (
        <div className="carte upsell">
          <span className="pastille p-orange" style={{ margin: 0 }}><Gift aria-hidden /></span>
          <div>
            <h2 style={{ fontSize: "1.2rem", margin: "0 0 .3rem" }}>Vos {P.quotas.prospects} prospects du mois sont utilisés</h2>
            <p className="note" style={{ margin: 0 }}>Vos prospects et votre historique restent accessibles. Pro : 300 par mois et 3 départements. Premium : 1 000 par mois, 10 départements et sites sur mesure.</p>
          </div>
          <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
            {essaiPossible && <form action="/api/essai" method="post"><button className="btn" type="submit">Essai Premium 7 jours</button></form>}
            <Link className="btn p" href="/espace/abonnement">Voir les offres</Link>
          </div>
        </div>
      )}

      <section className="carte">
        <div className="tableau-entete">
          <h2>Mes prospects <span className="note">({prospects?.length ?? 0})</span></h2>
          <BoutonRecherche desactive={plein} />
        </div>
        {!prospects?.length ? (
          <div className="vide"><Search aria-hidden /><h3>Aucun prospect pour l&apos;instant</h3><p className="note">Lancez votre première recherche : MySite parcourt la base officielle des entreprises de votre zone.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Entreprise</th><th>Métier</th><th>Ville</th><th>Statut</th><th>Téléphone</th></tr></thead>
              <tbody>
                {prospects.map((p, i) => {
                  const recherche = encodeURIComponent(`${p.nom} ${p.ville ?? ""}`);
                  return (
                    <tr key={p.id}>
                      <td><div className="ent"><span className="avatar" style={{ background: COULEURS[i % COULEURS.length] }}>{initiales(p.nom)}</span><span><Link href={`/espace/prospects/${p.id}`}><strong>{p.nom}</strong></Link><small>{p.indices}</small></span></div></td>
                      <td>{p.metier}</td>
                      <td>{p.ville} <span className="note">{p.code_postal}</span></td>
                      <td><span className="statut" style={{ color: etape(p.statut).couleur, background: `color-mix(in srgb, ${etape(p.statut).couleur} 14%, transparent)` }}>{etape(p.statut).nom}</span></td>
                      <td>{p.telephone ?? <span className="liens-num"><a href={`https://www.google.com/maps/search/?api=1&query=${recherche}`} target="_blank" rel="noopener">Maps</a><a href={`https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(p.nom)}&ou=${encodeURIComponent(p.ville ?? "")}`} target="_blank" rel="noopener">Pages Jaunes</a></span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="note" style={{ marginTop: "1rem", marginBottom: 0 }}>Source : base Sirene (INSEE), registre public. Les entreprises opposées à l&apos;usage commercial de leurs données sont exclues. Respectez immédiatement toute demande « STOP ».</p>
      </section>
    </>
  );
}
