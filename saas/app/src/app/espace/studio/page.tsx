import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, LayoutTemplate, Lock, Minus } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { consommation, profilEtPlan } from "@/lib/quotas";
import { ORDRE_PLANS, PLANS, type CapacitesStudio } from "@/lib/plans";
import { FAMILLES } from "@/lib/studio";

export const metadata = { title: "Studio" };

const LIGNES: [string, (c: CapacitesStudio, q: { sites_ia: number; retouches_ia: number }) => string | boolean][] = [
  ["Maquettes express", () => true],
  ["Textes, palettes, sections, photos de la banque", () => true],
  ["Sites sur mesure par l'IA / mois", (_c, q) => (q.sites_ia ? String(q.sites_ia) : false)],
  ["Retouches IA / mois", (_c, q) => (q.retouches_ia ? String(q.retouches_ia) : false)],
  ["Réflexion de l'IA", (c) => (c.effortIA ? ({ medium: "Standard", high: "Approfondie", xhigh: "Maximale" } as const)[c.effortIA] : false)],
  ["Carte, horaires, FAQ, référencement", (c) => c.editionComplete],
  ["Couleurs libres et choix du modèle", (c) => c.couleursLibres],
  ["Polices des titres", (c) => c.polices],
  ["Vos propres photos", (c) => c.photosPerso],
  ["Banque de photos personnelle, réutilisée par l'IA", (c) => (c.banquePerso ? String(c.banquePerso) : false)],
  ["Historique des versions", (c) => (c.versions ? String(c.versions) : false)],
  ["Version finale sans bandeau", (c) => !c.filigrane],
  ["Marque blanche (aucune mention MySite)", (c) => c.marqueBlanche],
  ["Sites conservés", (c) => String(c.sitesMax)],
];

export default async function ListeStudio() {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const [{ plan }, conso, { data: sites }] = await Promise.all([
    profilEtPlan(session.user.id), consommation(session.user.id),
    session.sb.from("sites").select("id, type, maj_le, prospect_id, donnees->>nom, donnees->>ville, donnees->>famille").order("maj_le", { ascending: false }).limit(200),
  ]);
  const P = PLANS[plan];
  return (
    <>
      <div className="barre-haut">
        <div><p className="note" style={{ margin: "0 0 .3rem" }}>Studio {P.nom} · {conso.sites_ia}/{P.quotas.sites_ia} sites IA · {conso.retouches_ia}/{P.quotas.retouches_ia} retouches ce mois-ci</p><h1>Mes sites</h1></div>
        <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}><Link className="btn" href="/espace/studio/photos">Ma banque de photos</Link><Link className="btn" href="/espace">Créer depuis un prospect</Link></div>
      </div>
      {!sites?.length ? (
        <div className="carte vide"><LayoutTemplate aria-hidden /><h2>Aucun site pour l&apos;instant</h2><p className="note">Ouvrez la fiche d&apos;un prospect et créez sa maquette en un clic : c&apos;est l&apos;argument qui fait signer.</p><Link className="btn p" href="/espace">Voir mes prospects</Link></div>
      ) : (
        <ul className="grille-sites">
          {sites.map((s) => {
            const F = FAMILLES[s.famille ?? ""] ?? FAMILLES.artisan;
            return (
              <li key={s.id}><Link href={`/espace/studio/${s.id}`} className="carte site-carte">
                <span className="site-vignette" style={{ background: `linear-gradient(135deg, ${F.principal}, ${F.accent})` }}>{(s.nom ?? "?").slice(0, 1)}</span>
                <strong>{s.nom}</strong><small>{F.lib.split(" (")[0]} · {s.ville}</small>
                <small>{s.type === "ia" ? "Sur mesure" : "Express"} · modifié le {new Date(s.maj_le).toLocaleDateString("fr-FR")}</small>
              </Link></li>
            );
          })}
        </ul>
      )}
      <div className="carte" style={{ marginTop: "1.6rem" }}>
        <div className="tableau-entete"><h2>La puissance du Studio selon l&apos;offre</h2><Link className="btn" href="/espace/abonnement">Changer d&apos;offre</Link></div>
        <div className="table-wrap">
          <table className="comparatif">
            <thead><tr><th scope="col">Fonction</th>{ORDRE_PLANS.map((p) => <th key={p} scope="col" aria-current={p === plan ? "true" : undefined}>{PLANS[p].nom}</th>)}</tr></thead>
            <tbody>{LIGNES.map(([lib, f]) => (
              <tr key={lib}><th scope="row">{lib}</th>{ORDRE_PLANS.map((p) => { const v = f(PLANS[p].studio, PLANS[p].quotas); return <td key={p} aria-current={p === plan ? "true" : undefined}>{v === true ? <Check aria-label="Inclus" /> : v === false ? (p === "gratuit" ? <Lock aria-label="Non inclus" /> : <Minus aria-label="Non inclus" />) : v}</td>; })}</tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}
