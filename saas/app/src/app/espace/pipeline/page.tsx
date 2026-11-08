import Link from "next/link";
import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { ETAPES } from "@/lib/pipeline";

export const metadata = { title: "Pipeline" };

/** Vue en colonnes : chaque prospect de l'utilisateur, rangé par étape. */
export default async function Pipeline() {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const { data } = await session.sb.from("prospects").select("id, nom, metier, ville, statut, prochaine_action, date_prochaine_action").order("cree_le", { ascending: false }).limit(1000);
  const tous = data ?? [];
  const aujourdhui = new Date().toISOString().slice(0, 10);
  return (
    <>
      <div className="barre-haut"><div><p className="note" style={{ margin: "0 0 .3rem" }}>{tous.length} prospects suivis</p><h1>Pipeline</h1></div></div>
      <div className="kanban">
        {ETAPES.map((e) => {
          const liste = tous.filter((p) => p.statut === e.id);
          return (
            <section key={e.id} className="colonne" aria-labelledby={`col-${e.id}`}>
              <h2 id={`col-${e.id}`}><span style={{ background: e.couleur }} />{e.nom}<small>{liste.length}</small></h2>
              {liste.slice(0, 60).map((p) => (
                <Link key={p.id} href={`/espace/prospects/${p.id}`} className="ticket">
                  <strong>{p.nom}</strong><small>{p.metier} · {p.ville}</small>
                  {p.prochaine_action && <em className={p.date_prochaine_action && p.date_prochaine_action <= aujourdhui ? "du" : ""}>{p.prochaine_action}{p.date_prochaine_action ? ` · ${p.date_prochaine_action.split("-").reverse().join("/")}` : ""}</em>}
                </Link>
              ))}
              {liste.length > 60 && <p className="note">+ {liste.length - 60} autres</p>}
            </section>
          );
        })}
      </div>
    </>
  );
}
