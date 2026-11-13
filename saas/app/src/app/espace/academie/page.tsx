import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Award, CheckCircle2, Circle, GraduationCap, Lock, PlayCircle, Trophy } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { leconOuverte, MODULES, MODULES_GRATUITS, NIVEAUX, progression } from "@/lib/academie/cours";
import { profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import { missions } from "@/lib/academie/missions";

export const metadata = { title: "Académie" };

export default async function Academie() {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const sb = session.sb;
  const compte = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const [{ data: prog }, { data: profil }, prospects, contactes, sites, rdv, devis, publies, payees] = await Promise.all([
    sb.from("progression_cours").select("lecon, score"),
    sb.from("profils").select("secteur, departements").maybeSingle(),
    compte(sb.from("prospects").select("id", { count: "exact", head: true })),
    compte(sb.from("prospects").select("id", { count: "exact", head: true }).neq("statut", "nouveau")),
    compte(sb.from("sites").select("id", { count: "exact", head: true })),
    compte(sb.from("prospects").select("id", { count: "exact", head: true }).in("statut", ["rdv", "devis", "gagne"])),
    compte(sb.from("documents").select("id", { count: "exact", head: true }).eq("type", "devis").not("numero", "is", null)),
    compte(sb.from("publications").select("site_id", { count: "exact", head: true })),
    compte(sb.from("documents").select("id", { count: "exact", head: true }).eq("type", "facture").eq("statut", "payee")),
  ]);
  const faites = new Set((prog ?? []).map((p) => p.lecon));
  const { plan } = await profilEtPlan(session.user.id);
  const complete = PLANS[plan].academie === "complete", ouverte = (id: string) => leconOuverte(id, complete);
  const P = progression(faites, ouverte);
  const gratuits = MODULES.filter((m) => MODULES_GRATUITS.includes(m.id));
  const M = missions({ secteur: !!profil?.secteur && (profil.departements?.length ?? 0) > 0, prospects, contactes, sites, rdv, devis, publies, payees });
  const missionsFaites = M.filter((m) => m.fait).length;
  const rayon = 54, circ = 2 * Math.PI * rayon;
  return (
    <>
      <div className="barre-haut"><div><p className="note" style={{ margin: "0 0 .3rem" }}>Des cours courts, des vidéos interactives et des missions concrètes</p><h1>Académie</h1></div></div>

      <section className="carte academie-tete">
        <div className="anneau" aria-label={`Progression : ${P.pct} %`}>
          <svg viewBox="0 0 120 120" aria-hidden><circle cx="60" cy="60" r={rayon} className="fond" /><circle cx="60" cy="60" r={rayon} className="plein" strokeDasharray={circ} strokeDashoffset={circ * (1 - P.pct / 100)} /></svg>
          <span><b>{P.pct} %</b><small>{P.faites}/{P.total} leçons</small></span>
        </div>
        <div className="academie-niveau">
          <p className="surtitre" style={{ marginBottom: ".5rem" }}><Trophy aria-hidden />Niveau : {P.niveau.nom}</p>
          <h2 style={{ margin: "0 0 .4rem" }}>{P.prochaine ? "Continuez votre parcours" : complete ? "Parcours terminé, bravo !" : "Modules gratuits terminés, bravo !"}</h2>
          <p className="note" style={{ margin: "0 0 1rem" }}>{P.niveau.suivant ? `Prochain niveau : ${P.niveau.suivant} à ${P.niveau.seuil} %.` : "Vous avez atteint le niveau maximal."}</p>
          <ol className="niveaux">{NIVEAUX.map(([s, n]) => <li key={n} className={P.pct >= s ? "atteint" : ""}><i />{n}</li>)}</ol>
          {P.prochaine && <Link className="btn p" href={`/espace/academie/${P.prochaine.id}`}><PlayCircle aria-hidden />{P.faites ? "Reprendre" : "Commencer"} : {P.prochaine.titre}</Link>}
          {!P.prochaine && !complete && <Link className="btn p" href="/espace/abonnement"><Lock aria-hidden />Débloquer l&apos;Académie complète</Link>}
        </div>
      </section>

      {!complete && (
        <div className="carte upsell" style={{ marginTop: "1.2rem", marginBottom: 0 }}>
          <span className="pastille p-violet" style={{ margin: 0 }}><GraduationCap aria-hidden /></span>
          <div>
            <h2 style={{ fontSize: "1.15rem", margin: "0 0 .3rem" }}>Offre Gratuite : {gratuits.length} modules ouverts sur {MODULES.length}</h2>
            <p className="note" style={{ margin: 0 }}>{gratuits.map((m) => m.titre).join(" et ")} : de quoi comprendre la méthode et faire vos premiers contacts. Les modules suivants (convaincre, conclure, livrer, encaisser, passer à l&apos;échelle) sont inclus dès l&apos;offre Pro.</p>
          </div>
          <Link className="btn p" href="/espace/abonnement">Voir les offres</Link>
        </div>
      )}

      <section className="carte" style={{ marginTop: "1.2rem" }}>
        <div className="tableau-entete"><h2><Award aria-hidden style={{ verticalAlign: "-.2em", color: "var(--violet)" }} /> Missions « Première vente »</h2><span className="badge-offre">{missionsFaites}/{M.length}</span></div>
        <div className="jauge" style={{ marginBottom: "1rem" }}><i style={{ width: `${(missionsFaites / M.length) * 100}%` }} /></div>
        <ul className="missions">{M.map((m) => (
          <li key={m.id} className={m.fait ? "faite" : ""}>
            {m.fait ? <CheckCircle2 aria-hidden /> : <Circle aria-hidden />}
            <span>{m.titre}</span>
            {!m.fait && <><Link href={m.href} className="note">Y aller</Link><Link href={`/espace/academie/${m.lecon}`} className="note">Le cours</Link></>}
          </li>
        ))}</ul>
        <p className="note" style={{ margin: ".8rem 0 0" }}>Les missions se cochent toutes seules à partir de votre activité réelle dans MySite.</p>
      </section>

      <div className="modules">
        {MODULES.map((m, k) => {
          const pm = P.parModule.find((x) => x.id === m.id)!.pct;
          return (
            <section key={m.id} className="carte module" style={{ "--m": m.couleur } as React.CSSProperties}>
              <div className="module-tete">
                <span className="module-num">{k + 1}</span>
                <div><h2>{m.titre}</h2><p className="note">{m.description}</p></div>
                {pm === 100 && <span className="module-badge" title="Module terminé"><GraduationCap aria-hidden /></span>}
                {!complete && !MODULES_GRATUITS.includes(m.id) && <span className="badge-offre"><Lock aria-hidden />Dès l&apos;offre Pro</span>}
              </div>
              <div className="jauge"><i style={{ width: `${pm}%`, background: m.couleur }} /></div>
              <ul className="module-lecons">{m.lecons.map((l) => (
                <li key={l.id}><Link href={`/espace/academie/${l.id}`}>
                  {faites.has(l.id) ? <CheckCircle2 aria-hidden className="ok" /> : ouverte(l.id) ? <PlayCircle aria-hidden /> : <Lock aria-hidden />}
                  <span>{l.titre}</span><small>{l.minutes} min</small><ArrowRight aria-hidden className="fleche" />
                </Link></li>
              ))}</ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
