"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CakeSlice, Check, Coffee, Lock, Pizza, Sandwich, Scissors, Sparkles, UtensilsCrossed, Wrench, X, type LucideIcon } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { enLancement, PRIX_APRES, prixOffre } from "@/lib/lancement";

/** Les sites sur mesure proposés (même familles et couleurs que le moteur du Studio). */
const MODELES: { famille: string; titre: string; detail: string; principal: string; accent: string; Icone: LucideIcon }[] = [
  { famille: "restaurant", titre: "Restaurant, brasserie", detail: "Carte complète, réservation, horaires", principal: "#4a1d24", accent: "#a8432f", Icone: UtensilsCrossed },
  { famille: "pizzeria", titre: "Pizzeria", detail: "Carte des pizzas, à emporter, avis", principal: "#1d4d3a", accent: "#b3372a", Icone: Pizza },
  { famille: "rapide", titre: "Snack, burger, kebab", detail: "Menus, commande par téléphone", principal: "#1f1d1a", accent: "#c2391b", Icone: Sandwich },
  { famille: "patisserie", titre: "Boulangerie, pâtisserie", detail: "Créations, commandes de gâteaux", principal: "#4a2330", accent: "#a83f63", Icone: CakeSlice },
  { famille: "cafe", titre: "Café, brunch", detail: "Carte, ambiance, horaires", principal: "#3b2a20", accent: "#a84a28", Icone: Coffee },
  { famille: "beaute", titre: "Coiffure, beauté", detail: "Tarifs, prise de rendez-vous", principal: "#3d2c2e", accent: "#9d4e6a", Icone: Scissors },
  { famille: "artisan", titre: "Artisan du bâtiment", detail: "Services, zone d'intervention, devis", principal: "#16324f", accent: "#c2410c", Icone: Wrench },
];

const OFFRES = [
  { id: "pro" as const, badge: "Pour commencer", points: (p = PLANS.pro) => [`${p.quotas.sites_ia} sites sur mesure par mois`, `${p.quotas.retouches_ia} retouches par l'IA`, `${p.quotas.prospects} prospects par mois`, "Mise en ligne en un clic"] },
  { id: "ultra" as const, badge: "Le plus puissant", points: (p = PLANS.ultra) => [`${p.quotas.sites_ia} sites sur mesure par mois`, `${p.quotas.retouches_ia} retouches, réflexion maximale de l'IA`, "France entière, 3 utilisateurs", "Marque blanche (aucune mention MySite)"] },
];

/**
 * Offre Gratuite : les sites sur mesure sont montrés, avec un cadenas. Un appui sur un site (ou son cadenas)
 * ouvre une fenêtre qui propose l'offre Pro ou Ultra. Rien n'est payé ici : le choix mène à « Mon abonnement ».
 */
export function SitesSurMesure({ famille, nom }: { famille?: string | null; nom?: string | null }) {
  const [choisi, setChoisi] = useState<(typeof MODELES)[number] | null>(null);
  const fenetre = useRef<HTMLDialogElement>(null);
  const modeles = famille ? [...MODELES].sort((a, b) => Number(b.famille === famille) - Number(a.famille === famille)) : MODELES;

  useEffect(() => {
    const d = fenetre.current; if (!d) return;
    if (choisi && !d.open) d.showModal();
    if (!choisi && d.open) d.close();
  }, [choisi]);

  return (
    <div className="sur-mesure">
      <div className="sur-mesure-tete">
        <strong><Sparkles aria-hidden />Sites sur mesure par l&apos;IA</strong>
        <span className="badge-verrou"><Lock aria-hidden />Dès l&apos;offre Pro</span>
      </div>
      <p className="note" style={{ margin: 0 }}>L&apos;IA étudie le vrai commerce et rédige un site complet à son nom. Touche un modèle pour le débloquer.</p>
      <ul className="sur-mesure-liste">
        {modeles.map((m) => (
          <li key={m.famille}>
            <button type="button" className="sur-mesure-carte" onClick={() => setChoisi(m)} aria-haspopup="dialog" aria-label={`Site sur mesure ${m.titre} : verrouillé, voir les offres Pro et Ultra`}>
              <span className="sur-mesure-vignette" style={{ background: `linear-gradient(135deg, ${m.principal}, ${m.accent})` }}>
                <m.Icone aria-hidden />
                <span className="sur-mesure-faux"><i /><i /><i /></span>
                <span className="cadenas" aria-hidden><Lock /></span>
              </span>
              <span className="sur-mesure-texte"><b>{m.titre}</b><small>{m.detail}</small></span>
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={fenetre} className="fenetre-offres" onClose={() => setChoisi(null)} onClick={(e) => { if (e.target === e.currentTarget) setChoisi(null); }} aria-labelledby="titre-offres">
        {choisi && (
          <div className="fenetre-corps">
            <button type="button" className="ed-ico fenetre-fermer" onClick={() => setChoisi(null)} aria-label="Fermer"><X aria-hidden /></button>
            <span className="sur-mesure-vignette petite" style={{ background: `linear-gradient(135deg, ${choisi.principal}, ${choisi.accent})` }}><choisi.Icone aria-hidden /></span>
            <h2 id="titre-offres">Débloque le site sur mesure « {choisi.titre} »</h2>
            <p className="note">{nom ? <>L&apos;IA vérifie ce qu&apos;est vraiment <b>{nom}</b>, puis rédige son site : textes, {choisi.detail.toLowerCase()}, FAQ et référencement local.</> : <>L&apos;IA vérifie ce qu&apos;est vraiment le commerce, puis rédige son site : textes, {choisi.detail.toLowerCase()}, FAQ et référencement local.</>}</p>
            <div className="fenetre-offres-grille">
              {OFFRES.map((o) => {
                const P = PLANS[o.id];
                return (
                  <section key={o.id} className={`offre-mini${o.id === "pro" ? " avant" : ""}`} aria-labelledby={`mini-${o.id}`}>
                    <span className="offre-mini-badge">{o.badge}</span>
                    <h3 id={`mini-${o.id}`}>{P.nom}</h3>
                    <p className="offre-mini-prix"><b>{prixOffre(o.id, "mensuel")} €</b> TTC / mois{enLancement() && <small className="prix-futur" style={{ display: "block" }}>Prix de lancement · {PRIX_APRES[o.id].mensuel} € dès le 1er décembre</small>}</p>
                    <ul>{o.points().map((t) => <li key={t}><Check aria-hidden />{t}</li>)}</ul>
                    <Link className={`btn bloc${o.id === "pro" ? " p" : ""}`} href={`/espace/abonnement?offre=${o.id}&depuis=sur-mesure`}>Choisir {P.nom}</Link>
                  </section>
                );
              })}
            </div>
            <p className="note" style={{ textAlign: "center", margin: 0 }}>Sans engagement, résiliable à tout moment. <Link href="/espace/abonnement">Voir toutes les offres</Link></p>
          </div>
        )}
      </dialog>
    </div>
  );
}
