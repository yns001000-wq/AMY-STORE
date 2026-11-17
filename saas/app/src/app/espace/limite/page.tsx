import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, Check, Gift, Rocket, Sparkles } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { etatLimites } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import { argumentsOffre, estTypeLimite, libelleRemise, moisEnCours, OFFRE_SUIVANTE, prixParJour, prochaineRemiseAZero, titreLimite, type TypeLimite } from "@/lib/limites";

export const metadata = { title: "Limite de votre offre atteinte" };
export const dynamic = "force-dynamic";

/**
 * Page affichée quand une limite de l'offre est atteinte.
 * Elle montre ce qui a déjà été accompli, ce que change l'offre suivante (chiffres exacts), l'alternative du parrainage
 * et la date de remise à zéro. Aucune fausse urgence : l'utilisateur peut toujours attendre le mois prochain.
 */
export default async function Limite({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion?suite=/espace/limite");
  const q = await searchParams;
  const { plan, c, moisEpuise } = await etatLimites(session.user.id);
  const type: TypeLimite = moisEpuise ? "mois" : estTypeLimite(q.type) ? q.type : "prospects";
  const mois = moisEnCours(), remise = libelleRemise(prochaineRemiseAZero());
  const suivante = OFFRE_SUIVANTE[plan];

  // Ce que l'utilisateur a accompli (effet de progression : on part de ses résultats, pas de ce qui lui manque).
  const [{ count: enAttente }, { count: maquettes }] = await Promise.all([
    session.sb.from("prospects").select("id", { count: "exact", head: true }).eq("statut", "nouveau"),
    session.sb.from("sites").select("id", { count: "exact", head: true }),
  ]);
  const bilan = [
    c.prospects.utilise ? `${c.prospects.utilise} commerce${c.prospects.utilise > 1 ? "s" : ""} trouvé${c.prospects.utilise > 1 ? "s" : ""}` : null,
    c.messages_ia.utilise ? `${c.messages_ia.utilise} message${c.messages_ia.utilise > 1 ? "s" : ""} rédigé${c.messages_ia.utilise > 1 ? "s" : ""}` : null,
    maquettes ? `${maquettes} maquette${maquettes > 1 ? "s" : ""} créée${maquettes > 1 ? "s" : ""}` : null,
  ].filter(Boolean) as string[];

  const P = suivante ? PLANS[suivante] : null;
  const args = suivante ? argumentsOffre(plan, suivante, type) : [];
  const gratuit = plan === "gratuit";

  return (
    <div className="limite">
      <header className="limite-tete">
        <span className="pastille p-violet" aria-hidden><Sparkles /></span>
        <h1>{titreLimite(type, plan, mois)}</h1>
        {bilan.length > 0 && <p>Bravo : ce mois-ci, vous avez {bilan.length > 1 ? `${bilan.slice(0, -1).join(", ")} et ${bilan[bilan.length - 1]}` : bilan[0]}.</p>}
        {(enAttente ?? 0) > 0 && <p className="limite-attente"><b>{enAttente} commerce{(enAttente ?? 0) > 1 ? "s" : ""}</b> trouvé{(enAttente ?? 0) > 1 ? "s" : ""} attend{(enAttente ?? 0) > 1 ? "ent" : ""} encore votre premier message.</p>}
        {type === "mois" && <p className="note">Recherche, messages et nouvelles maquettes sont en pause jusqu&apos;au {remise.replace(/^le /, "")}. Vos prospects, vos maquettes et l&apos;Académie restent accessibles.</p>}
      </header>

      {P && suivante && (
        <section className="carte limite-offre" aria-labelledby="titre-suite">
          <span className="offre-mini-badge">Pour continuer dès maintenant</span>
          <h2 id="titre-suite"><Rocket aria-hidden />Passez à {P.nom}</h2>
          <p className="limite-prix"><b>{P.prixMensuel} €</b> TTC / mois · <span>{prixParJour(P.prixMensuel)}</span></p>
          <ul>{args.map((a) => <li key={a}><Check aria-hidden />{a}</li>)}</ul>
          <Link className="btn p bloc grand" href={`/espace/abonnement?offre=${suivante}&depuis=limite`}>Passer à {P.nom}</Link>
          <p className="note" style={{ margin: 0, textAlign: "center" }}>Sans engagement, résiliable à tout moment. {suivante !== "ultra" && <Link href="/espace/abonnement">Voir toutes les offres</Link>}</p>
        </section>
      )}
      {!P && <p className="alerte">Vous utilisez déjà l&apos;offre la plus complète. Pour un besoin plus important, écrivez-nous : l'adresse est dans les mentions légales.</p>}

      <section className="carte limite-parrain" aria-labelledby="titre-parrain">
        <span className="pastille p-rose" aria-hidden><Gift /></span>
        <div>
          <h2 id="titre-parrain">Ou payez moins cher grâce au parrainage</h2>
          <p>{gratuit
            ? <>Invitez une personne qui vend des sites : elle a <b>-20 %</b> sur son 1er paiement, et vous gagnez <b>1 mois de Pro offert</b> dès qu&apos;elle paie son 2e mois.</>
            : <>Invitez une personne qui vend des sites : elle a <b>-20 %</b> sur son 1er paiement, et vous gagnez <b>29 € de crédit</b>, déduits de votre prochaine facture, dès qu&apos;elle paie son 2e mois.</>}</p>
          <Link className="btn" href="/espace/parrainage">Inviter quelqu&apos;un</Link>
        </div>
      </section>

      <section className="carte limite-attendre" aria-labelledby="titre-attendre">
        <span className="pastille p-cyan" aria-hidden><CalendarClock /></span>
        <div>
          <h2 id="titre-attendre">Ou attendez le mois prochain</h2>
          <p className="note" style={{ margin: 0 }}>Vos compteurs repartent à zéro {remise}. Rien n&apos;est perdu : vos prospects, vos maquettes et votre historique restent là.</p>
          <Link href="/espace" className="note">Revenir au tableau de bord</Link>
        </div>
      </section>
    </div>
  );
}
