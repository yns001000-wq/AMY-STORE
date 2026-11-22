import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Crown, Download, Gift, Lock, Map as IconeCarte, Search, Store, Target, WandSparkles } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { consommation, profilEtPlan } from "@/lib/quotas";
import { departementsAutorises, libelleOffre, PLANS, type TypeQuota } from "@/lib/plans";
import { secteurParId } from "@/lib/secteurs";
import { etape } from "@/lib/pipeline";
import { nomDepartement } from "@/lib/departements";
import { BoutonRecherche } from "@/components/BoutonRecherche";
import { BandeauLimite } from "@/components/BandeauLimite";
import { moisGratuitEpuise, compteurs as etatCompteurs } from "@/lib/limites";
import { premiersPas } from "@/lib/croissance";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BadgeScore, InfoScore } from "@/components/BadgeScore";
import { scoreProspect } from "@/lib/score";
import { ListeDemarrage } from "@/components/ListeDemarrage";
import { MODULES } from "@/lib/academie/cours";

const LECONS_DEMARRER = MODULES.find((m) => m.id === "demarrer")!.lecons.map((l) => l.id);

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
  const { profil, plan, quotas } = await profilEtPlan(session.user.id);
  if (!profil.cgu_acceptees_le) redirect("/espace/bienvenue");
  const conso = await consommation(session.user.id);
  const { data: bruts } = await session.sb.from("prospects").select("id, nom, metier, naf, ville, code_postal, statut, indices, telephone, date_creation, tranche_effectif").order("cree_le", { ascending: false }).limit(200);
  // Tri « les plus prometteurs d'abord » (par défaut) ou « les plus récents ».
  const tri = q.tri === "recents" ? "recents" : "score";
  const avecScore = (bruts ?? []).map((p) => ({ ...p, score: scoreProspect(p) }));
  const prospects = tri === "score" ? [...avecScore].sort((a, b) => b.score - a.score) : avecScore;
  const secteur = secteurParId(profil.secteur as string);
  const deps = departementsAutorises(plan, (profil.departements as string[]) ?? []);
  const ignores = ((profil.departements as string[]) ?? []).length - deps.length;
  const P = PLANS[plan], plein = conso.prospects >= quotas.prospects;
  const moisEpuise = moisGratuitEpuise(plan, etatCompteurs(quotas, conso));
  // Premiers pas : comptés sur toute la vie du compte (pas seulement le mois en cours).
  const admin = supabaseAdmin();
  const [{ data: total }, { count: nbSites }, { count: nbLecons }] = await Promise.all([
    admin.from("consommation").select("messages_ia").eq("user_id", session.user.id),
    admin.from("sites").select("id", { count: "exact", head: true }).eq("user_id", session.user.id),
    admin.from("progression_cours").select("lecon", { count: "exact", head: true }).eq("user_id", session.user.id).in("lecon", LECONS_DEMARRER),
  ]);
  const pas = premiersPas({ prospects: prospects?.length ?? 0, messages: (total ?? []).reduce((n, l) => n + (l.messages_ia ?? 0), 0), sites: nbSites ?? 0, lecons: nbLecons ?? 0, leconsDemarrer: LECONS_DEMARRER.length, premierProspect: avecScore[avecScore.length - 1]?.id });
  const faits = pas.filter((x) => x.fait).length;
  return (
    <>
      <div className="barre-haut">
        <div>
          <p className="note" style={{ margin: "0 0 .3rem" }}>{secteur?.nom} · {deps.map((d) => nomDepartement(d) ?? d).join(", ")}</p>
          <h1>Bonjour{profil.prenom ? ` ${profil.prenom}` : ""} 👋</h1>
        </div>
        <span className="badge-offre"><Crown aria-hidden />{libelleOffre(plan)}</span>
      </div>
      <BandeauLimite userId={session.user.id} />
      {q.abonnement === "ok" && <p className="alerte ok" role="status">Merci ! Votre abonnement est en cours d&apos;activation : il apparaît ici dans quelques secondes.</p>}
      {faits < pas.length && <ListeDemarrage pas={pas} />}
      {ignores > 0 && <p className="alerte">Votre offre couvre {P.departements} département(s) : {ignores} département(s) choisi(s) ne sont pas utilisés.&nbsp;<Link href="/espace/abonnement">Élargir ma zone</Link></p>}

      <section className="stats" aria-label="Consommation du mois">
        {STATS.map(([t, lib, Ico, coul]) => {
          const max = quotas[t], v = conso[t], pct = max ? Math.min(100, (v / max) * 100) : 100;
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


      <section className="carte">
        <div className="tableau-entete">
          <h2>Mes prospects <span className="note">({prospects?.length ?? 0})</span></h2>
          {prospects.length > 1 && <p className="tri-liens note" role="group" aria-label="Trier les prospects">Trier : <Link href="/espace" aria-current={tri === "score" ? "true" : undefined}>les plus prometteurs d&apos;abord</Link> · <Link href="/espace?tri=recents" aria-current={tri === "recents" ? "true" : undefined}>les plus récents</Link></p>}
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <Link className="btn" href="/espace/carte"><IconeCarte aria-hidden />Carte</Link>
            {PLANS[plan].export
              ? <a className="btn" href="/api/prospects/export" download><Download aria-hidden />Export CSV</a>
              : <Link className="btn" href="/espace/abonnement" title="Inclus dès l'offre Pro"><Lock aria-hidden />Export CSV</Link>}
            <BoutonRecherche desactive={plein} limite={moisEpuise ? "mois" : plein ? "prospects" : undefined} auto={q.bienvenue === "1" && !prospects?.length} />
          </div>
        </div>
        {!prospects?.length ? (
          <div className="vide"><Search aria-hidden /><h3>Aucun prospect pour l&apos;instant</h3><p className="note">Lancez votre première recherche : MySite parcourt la base officielle des entreprises de votre zone.</p></div>
        ) : (
          <div className="table-wrap table-prospects">
            <table>
              <thead><tr><th><span className="th-info">Priorité <InfoScore /></span></th><th>Entreprise</th><th>Métier</th><th>Ville</th><th>Statut</th><th>Téléphone</th><th><span className="cache">Fiche</span></th></tr></thead>
              <tbody>
                {prospects.map((p, i) => {
                  const recherche = encodeURIComponent(`${p.nom} ${p.ville ?? ""}`);
                  return (
                    <tr key={p.id}>
                      <td><BadgeScore score={p.score} /></td>
                      <td><div className="ent"><span className="avatar" style={{ background: COULEURS[i % COULEURS.length] }}>{initiales(p.nom)}</span><span><Link href={`/espace/prospects/${p.id}`}><strong>{p.nom}</strong></Link><small>{p.indices}</small></span></div></td>
                      <td>{p.metier}</td>
                      <td>{p.ville} <span className="note">{p.code_postal}</span></td>
                      <td><span className="statut" style={{ color: etape(p.statut).couleur, background: `color-mix(in srgb, ${etape(p.statut).couleur} 14%, transparent)` }}>{etape(p.statut).nom}</span></td>
                      <td>{p.telephone ?? <span className="liens-num"><a href={`https://www.google.com/maps/search/?api=1&query=${recherche}`} target="_blank" rel="noopener">Maps</a><a href={`https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(p.nom)}&ou=${encodeURIComponent(p.ville ?? "")}`} target="_blank" rel="noopener">Pages Jaunes</a></span>}</td>
                      <td className="cell-ouvrir"><Link className="btn petit" href={`/espace/prospects/${p.id}`} aria-label={`Ouvrir la fiche de ${p.nom}`}>Ouvrir<ChevronRight aria-hidden /></Link></td>
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
