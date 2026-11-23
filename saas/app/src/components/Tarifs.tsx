"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Star } from "lucide-react";
import { ORDRE_PLANS, PLANS, type Periode, type PlanId } from "@/lib/plans";
import { premierPaiementRemise } from "@/lib/parrainage";
import { prixParJour } from "@/lib/limites";
import { enLancement, PRIX_APRES, prixOffre } from "@/lib/lancement";
import { CompteRebours } from "./CompteRebours";
import { useInvitation } from "./BandeauParrainage";

const fmt = (n: number) => n.toLocaleString("fr-FR");

/** Une seule source pour la grille et le tableau comparatif : tout vient de lib/plans.ts (ce que le code autorise vraiment). */
function lignesOffre(id: PlanId): [boolean, string][] {
  const p = PLANS[id];
  return [
    [true, Number.isFinite(p.departements) ? `${p.departements} département${p.departements > 1 ? "s" : ""}` : "France entière"],
    [true, `${fmt(p.quotas.prospects)} prospects par mois`],
    [true, `${fmt(p.quotas.messages_ia)} messages rédigés par l'IA par mois`],
    [true, id === "gratuit" ? `${p.studio.sitesMax} maquettes express (modèles prêts, sans IA)` : `Maquettes express : ${fmt(p.studio.sitesMax)} conservées`],
    [p.quotas.sites_ia > 0, p.quotas.sites_ia ? `${p.quotas.sites_ia} sites sur mesure par l'IA par mois, ${p.quotas.retouches_ia} retouches` : "0 site sur mesure par l'IA (dès l'offre Pro)"],
    [p.studio.publications > 0, p.studio.publications ? `Mise en ligne : ${fmt(p.studio.publications)} sites en même temps, nom de domaine du client` : "Mise en ligne des sites (dès l'offre Pro)"],
    [true, "Pipeline, rappels et carte"],
    [true, p.academie === "complete" ? "Académie complète (7 modules)" : "Académie : modules Démarrer et Prospecter"],
    [p.export, "Export CSV"],
    [p.facturation, "Devis, factures et suivi des encaissements"],
    ...(p.utilisateurs > 1 ? [[true, `${p.utilisateurs} utilisateurs`] as [boolean, string]] : []),
    ...(p.studio.marqueBlanche ? [[true, "Marque blanche (aucune mention MySite)"] as [boolean, string]] : []),
  ];
}

/** Tableau comparatif : une ligne par fonctionnalité, une colonne par offre. */
const COMPARATIF: { t: string; v: (p: (typeof PLANS)[PlanId]) => string | boolean }[] = [
  { t: "Départements", v: (p) => (Number.isFinite(p.departements) ? String(p.departements) : "France entière") },
  { t: "Prospects par mois", v: (p) => fmt(p.quotas.prospects) },
  { t: "Messages rédigés par l'IA par mois", v: (p) => fmt(p.quotas.messages_ia) },
  { t: "Maquettes express conservées", v: (p) => fmt(p.studio.sitesMax) },
  { t: "Sites sur mesure par l'IA par mois", v: (p) => String(p.quotas.sites_ia) },
  { t: "Retouches par l'IA par mois", v: (p) => String(p.quotas.retouches_ia) },
  { t: "Studio : édition complète et couleurs libres", v: (p) => p.studio.editionComplete },
  { t: "Studio : photos du client et polices", v: (p) => p.studio.photosPerso && p.studio.polices },
  { t: "Sites en ligne en même temps", v: (p) => (p.studio.publications ? fmt(p.studio.publications) : false) },
  { t: "Nom de domaine du client", v: (p) => p.studio.domainePerso },
  { t: "Pipeline, rappels et carte", v: () => true },
  { t: "Score de priorité des prospects", v: () => true },
  { t: "Académie", v: (p) => (p.academie === "complete" ? "7 modules" : "2 modules") },
  { t: "Export CSV", v: (p) => p.export },
  { t: "Devis, factures et suivi des encaissements", v: (p) => p.facturation },
  { t: "Marque blanche (aucune mention MySite)", v: (p) => p.studio.marqueBlanche },
  { t: "Utilisateurs", v: (p) => String(p.utilisateurs) },
];

function Comparatif() {
  return (
    <details className="comparatif">
      <summary><h3>Comparer les offres en détail</h3><span className="note">Voir le tableau</span></summary>
      <div className="table-wrap">
        <table>
          <caption className="cache">Fonctionnalités incluses dans chaque offre MySite</caption>
          <thead><tr><th scope="col">Fonctionnalité</th>{ORDRE_PLANS.map((id) => <th key={id} scope="col" className={PLANS[id].misEnAvant ? "avant" : ""}>{PLANS[id].nom}</th>)}</tr></thead>
          <tbody>
            {COMPARATIF.map((l) => (
              <tr key={l.t}><th scope="row">{l.t}</th>{ORDRE_PLANS.map((id) => {
                const v = l.v(PLANS[id]);
                return <td key={id} className={PLANS[id].misEnAvant ? "avant" : ""}>{v === true ? <Check aria-label="Inclus" /> : v === false ? <Minus aria-label="Non inclus" /> : v}</td>;
              })}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Bouton de chaque offre : lien d'inscription (site public) ou formulaire de paiement Stripe (espace connecté). */
function Action({ id, periode, mode, particulier, abonne, refCode, remise }: { id: PlanId; periode: Periode; mode: "inscription" | "abonnement"; particulier?: boolean; abonne?: boolean; refCode?: string; remise?: boolean }) {
  const p = PLANS[id].misEnAvant ? " p" : "";
  if (mode === "inscription") return <Link className={`btn bloc${p}`} href={`/connexion?mode=inscription${id === "gratuit" ? "" : `&offre=${id}`}${refCode ? `&ref=${encodeURIComponent(refCode)}` : ""}`}>{id === "gratuit" ? "Commencer gratuitement" : `Choisir ${PLANS[id].nom}`}</Link>;
  if (id === "gratuit" || abonne) return null;
  return (
    <form action="/api/stripe/checkout" method="post" className="pile" style={{ gap: ".7rem" }}>
      <input type="hidden" name="plan" value={id} /><input type="hidden" name="periode" value={periode} />
      {particulier && (
        <label className="case" style={{ fontSize: ".8rem" }}><input type="checkbox" name="renonciation" value="oui" required />
          <span className="note" style={{ fontSize: ".8rem" }}>Je demande l&apos;accès immédiat au service. Si je me rétracte dans les 14 jours, je serai remboursé, déduction faite de la part du service déjà fournie (art. L221-25 C. conso.).</span></label>
      )}
      <p className="note" style={{ fontSize: ".78rem", margin: 0 }}>{remise && <>Parrainage : -20 % sur le 1er paiement uniquement, puis prix normal. </>}Sans engagement · renouvelé automatiquement chaque {periode === "annuel" ? "année" : "mois"} · résiliable à tout moment en ligne. En continuant, vous acceptez les <Link href="/cgv">CGV</Link> et les <Link href="/cgu">CGU</Link>. Paiement sécurisé par Stripe, revendeur officiel.</p>
      <button className={`btn bloc${p}`} type="submit">Passer à {PLANS[id].nom}</button>
    </form>
  );
}

/** Grille des offres, avec bascule mensuel/annuel. */
export function Tarifs({ mode, planActuel, particulier, abonne, voulue, remise }: { mode: "inscription" | "abonnement"; planActuel?: PlanId; particulier?: boolean; abonne?: boolean; voulue?: PlanId | null; remise?: boolean }) {
  const [periode, setPeriode] = useState<Periode>("mensuel");
  // -20 % sur le 1er paiement : filleul connecté et éligible (vérifié par le serveur), ou visiteur arrivé par un lien de parrainage.
  const invite = useInvitation();
  const avecRemise = mode === "abonnement" ? !!remise : !!invite;
  const lancement = enLancement();
  return (
    <>
      <CompteRebours />
      <div style={{ display: "flex" }}>
        <div className="bascule" role="group" aria-label="Période de facturation">
          <button type="button" aria-pressed={periode === "mensuel"} onClick={() => setPeriode("mensuel")}>Mensuel</button>
          <button type="button" aria-pressed={periode === "annuel"} onClick={() => setPeriode("annuel")}>Annuel <span className="remise">2 mois offerts</span></button>
        </div>
      </div>
      <div className="offres">
        {ORDRE_PLANS.map((id) => {
          const p0 = PLANS[id];
          // Prix du moment : lancement jusqu'au 30/11, nouveaux prix ensuite (voir lib/lancement.ts).
          const p = { ...p0, prixMensuel: prixOffre(id, "mensuel"), prixAnnuel: prixOffre(id, "annuel") };
          const annuel = periode === "annuel" && p.prixAnnuel > 0;
          const prix = annuel ? Math.round((p.prixAnnuel / 12) * 100) / 100 : p.prixMensuel;
          const lignes = lignesOffre(id);
          return (
            <article key={id} className={`carte offre${(voulue ? voulue === id : p.misEnAvant) ? " avant" : ""}`} aria-labelledby={`offre-${id}`}>
              {voulue === id ? <span className="badge"><Star aria-hidden />Votre choix</span> : !voulue && p.misEnAvant && <span className="badge"><Star aria-hidden />Recommandé pour démarrer</span>}
              <h3 id={`offre-${id}`}>{p.nom}</h3>
              <p className="accroche">{p.accroche}</p>
              <p className="prix"><b>{prix.toLocaleString("fr-FR", annuel ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : {})} €</b><span>{annuel ? "/mois" : "TTC / mois"}</span></p>
              {avecRemise && p.prixMensuel > 0 ? (() => {
                const plein = annuel ? p.prixAnnuel : p.prixMensuel, reduit = premierPaiementRemise(plein);
                const f2 = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
                return <p className="sous-prix">1er paiement : <span className="prix-barre" style={{ display: "inline" }}><s>{f2(plein)} €</s><em>{f2(reduit)} €</em></span> (-20 %), puis <b style={{ whiteSpace: "nowrap" }}>{f2(plein)} €{annuel ? "/an" : "/mois"}</b></p>;
              })() : <p className="sous-prix">{annuel ? <>payé <b>{fmt(p.prixAnnuel)} €</b> TTC une fois par an</> : p.prixAnnuel ? `sans engagement · ${prixParJour(p.prixMensuel)}` : "pour toujours"}</p>}
              {lancement && id !== "gratuit" && <p className="prix-futur">Prix de lancement · {annuel ? `${PRIX_APRES[id].annuel.toLocaleString("fr-FR")} €/an` : `${PRIX_APRES[id].mensuel} €/mois`} à partir du 1er décembre</p>}
              <ul className="inclus">
                {lignes.map(([oui, t]) => <li key={t} className={oui ? "" : "non"}>{oui ? <Check aria-hidden /> : <Minus aria-hidden />}<span>{t}</span></li>)}
              </ul>
              <div className="pied-offre">{planActuel === id ? <span className="badge-offre">Votre offre actuelle</span> : <Action id={id} periode={periode} mode={mode} particulier={particulier} abonne={abonne} refCode={invite?.code} remise={mode === "abonnement" && !!remise} />}</div>
            </article>
          );
        })}
      </div>
      <Comparatif />
    </>
  );
}
