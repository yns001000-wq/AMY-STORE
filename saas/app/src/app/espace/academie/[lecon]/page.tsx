import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, Clock, Lock } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { LECONS, lecon, leconOuverte } from "@/lib/academie/cours";
import { profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import { LeconInteractive } from "@/components/academie/LeconInteractive";

export async function generateMetadata({ params }: { params: Promise<{ lecon: string }> }) {
  return { title: lecon((await params).lecon)?.titre ?? "Académie" };
}

export default async function PageLecon({ params }: { params: Promise<{ lecon: string }> }) {
  const id = (await params).lecon;
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const l = lecon(id);
  if (!l) notFound();
  const { plan } = await profilEtPlan(session.user.id);
  const ouverte = leconOuverte(id, PLANS[plan].academie === "complete");
  const { data } = ouverte ? await session.sb.from("progression_cours").select("lecon").eq("lecon", id).maybeSingle() : { data: null };
  const k = LECONS.findIndex((x) => x.id === id), suivante = LECONS[k + 1];
  return (
    <>
      <Link href="/espace/academie" className="note" style={{ display: "inline-flex", gap: ".3rem", alignItems: "center", textDecoration: "none" }}><ArrowLeft size={16} aria-hidden />Académie</Link>
      <div className="barre-haut" style={{ marginTop: ".6rem" }}>
        <div><p className="note" style={{ margin: "0 0 .3rem", color: l.module.couleur, fontWeight: 700 }}>{l.module.titre} · leçon {l.module.lecons.findIndex((x) => x.id === id) + 1}/{l.module.lecons.length}</p><h1>{l.titre}</h1></div>
        <span className="badge-offre"><Clock aria-hidden />{l.minutes} min</span>
      </div>
      {ouverte ? (
        <LeconInteractive l={{ ...l, module: undefined } as unknown as typeof l} couleur={l.module.couleur} dejaFaite={!!data} suivante={suivante ? { id: suivante.id, titre: suivante.titre } : null} />
      ) : (
        <section className="carte" style={{ maxWidth: "44rem" }}>
          <span className="pastille p-violet"><Lock aria-hidden /></span>
          <h2 style={{ fontSize: "1.4rem" }}>Cette leçon fait partie de l&apos;Académie complète</h2>
          <p>{l.resume}</p>
          <p className="note" style={{ margin: "0 0 .4rem" }}>Au programme :</p>
          <ul className="inclus" style={{ margin: "0 0 1.2rem" }}>{l.contenu.map((c) => <li key={c.titre}><Check aria-hidden /><span>{c.titre}</span></li>)}</ul>
          <p className="note">L&apos;Académie complète (7 modules, vidéos, quiz et missions) est incluse dès l&apos;offre Pro, à {PLANS.pro.prixMensuel} € par mois, sans engagement. Les modules Démarrer et Prospecter restent ouverts dans l&apos;offre Gratuite.</p>
          <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
            <Link className="btn p" href="/espace/abonnement">Voir les offres</Link>
            <Link className="btn" href="/espace/academie">Retour à l&apos;Académie</Link>
          </div>
        </section>
      )}
    </>
  );
}
