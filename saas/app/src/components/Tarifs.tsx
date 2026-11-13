"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Minus, Star } from "lucide-react";
import { ORDRE_PLANS, PLANS, type Periode, type PlanId } from "@/lib/plans";

const fmt = (n: number) => n.toLocaleString("fr-FR");

/** Bouton de chaque offre : lien d'inscription (site public) ou formulaire de paiement Stripe (espace connecté). */
function Action({ id, periode, mode, particulier, abonne }: { id: PlanId; periode: Periode; mode: "inscription" | "abonnement"; particulier?: boolean; abonne?: boolean }) {
  const p = id === "premium" ? " p" : "";
  if (mode === "inscription") return <Link className={`btn bloc${p}`} href={id === "gratuit" ? "/connexion?mode=inscription" : `/connexion?mode=inscription&offre=${id}`}>{id === "gratuit" ? "Commencer gratuitement" : `Choisir ${PLANS[id].nom}`}</Link>;
  if (id === "gratuit" || abonne) return null;
  return (
    <form action="/api/stripe/checkout" method="post" className="pile" style={{ gap: ".7rem" }}>
      <input type="hidden" name="plan" value={id} /><input type="hidden" name="periode" value={periode} />
      {particulier && (
        <label className="case" style={{ fontSize: ".8rem" }}><input type="checkbox" name="renonciation" value="oui" required />
          <span className="note" style={{ fontSize: ".8rem" }}>Je demande l&apos;accès immédiat au service. Si je me rétracte dans les 14 jours, je serai remboursé, déduction faite de la part du service déjà fournie (art. L221-25 C. conso.).</span></label>
      )}
      <p className="note" style={{ fontSize: ".78rem", margin: 0 }}>Sans engagement · renouvelé automatiquement chaque {periode === "annuel" ? "année" : "mois"} · résiliable à tout moment en ligne.</p>
      <button className={`btn bloc${p}`} type="submit">Passer à {PLANS[id].nom}</button>
    </form>
  );
}

/** Grille des offres, avec bascule mensuel/annuel. */
export function Tarifs({ mode, planActuel, particulier, abonne, voulue }: { mode: "inscription" | "abonnement"; planActuel?: PlanId; particulier?: boolean; abonne?: boolean; voulue?: PlanId | null }) {
  const [periode, setPeriode] = useState<Periode>("mensuel");
  return (
    <>
      <div style={{ display: "flex" }}>
        <div className="bascule" role="group" aria-label="Période de facturation">
          <button type="button" aria-pressed={periode === "mensuel"} onClick={() => setPeriode("mensuel")}>Mensuel</button>
          <button type="button" aria-pressed={periode === "annuel"} onClick={() => setPeriode("annuel")}>Annuel <span className="remise">2 mois offerts</span></button>
        </div>
      </div>
      <div className="offres">
        {ORDRE_PLANS.map((id) => {
          const p = PLANS[id], annuel = periode === "annuel" && p.prixAnnuel > 0;
          const prix = annuel ? Math.round((p.prixAnnuel / 12) * 100) / 100 : p.prixMensuel;
          const lignes: [boolean, string][] = [
            [true, Number.isFinite(p.departements) ? `${p.departements} département${p.departements > 1 ? "s" : ""}` : "France entière"],
            [true, `${fmt(p.quotas.prospects)} prospects par mois`],
            [true, `${fmt(p.quotas.messages_ia)} messages rédigés par l'IA`],
            [true, "Maquettes express (modèles prêts, sans IA)"],
            [p.quotas.sites_ia > 0, p.quotas.sites_ia ? `${p.quotas.sites_ia} sites sur mesure par l'IA, ${p.quotas.retouches_ia} retouches` : "Sites sur mesure par l'IA"],
            [true, "Pipeline, rappels et carte"],
            [true, p.academie === "complete" ? "Académie complète (7 modules)" : "Académie : modules Démarrer et Prospecter"],
            [p.export, "Export CSV"],
            [p.facturation, "Devis et factures"],
            ...(p.utilisateurs > 1 ? [[true, `${p.utilisateurs} utilisateurs`] as [boolean, string]] : []),
          ];
          return (
            <article key={id} className={`carte offre${(voulue ? voulue === id : p.misEnAvant) ? " avant" : ""}`} aria-labelledby={`offre-${id}`}>
              {voulue === id ? <span className="badge"><Star aria-hidden />Votre choix</span> : !voulue && p.misEnAvant && <span className="badge"><Star aria-hidden />Le plus complet</span>}
              <h3 id={`offre-${id}`}>{p.nom}</h3>
              <p className="accroche">{p.accroche}</p>
              <p className="prix"><b>{prix.toLocaleString("fr-FR")} €</b><span>TTC / mois</span></p>
              <p className="sous-prix">{annuel ? `soit ${fmt(p.prixAnnuel)} € facturés par an` : p.prixAnnuel ? "sans engagement" : "pour toujours"}</p>
              <ul className="inclus">
                {lignes.map(([oui, t]) => <li key={t} className={oui ? "" : "non"}>{oui ? <Check aria-hidden /> : <Minus aria-hidden />}<span>{t}</span></li>)}
              </ul>
              <div className="pied-offre">{planActuel === id ? <span className="badge-offre">Votre offre actuelle</span> : <Action id={id} periode={periode} mode={mode} particulier={particulier} abonne={abonne} />}</div>
            </article>
          );
        })}
      </div>
    </>
  );
}
