/** Règles de croissance, sans effet de bord (testées) : provenance, premiers pas, chiffres du tableau de suivi. */
import { PLANS, abonnementActif, estPlan, type PlanId } from "./plans";
import { prixOffre } from "./lancement";

const JOUR = 86400000;

/** Provenance d'une inscription (« tiktok », « instagram »…) : minuscules, chiffres, tirets. Jamais de texte libre. */
export function nettoyerSource(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
  return s || null;
}

export function offrePayante(v: unknown): Exclude<PlanId, "gratuit"> | null {
  return v === "pro" || v === "premium" || v === "ultra" ? v : null;
}

export interface Pas { id: "prospects" | "message" | "maquette" | "academie"; titre: string; aide: string; lien: string; fait: boolean }

/**
 * Liste de démarrage du tableau de bord, affichée tant qu'elle n'est pas terminée. Chaque étape est cochée d'après les vraies données :
 * `lecons` = leçons terminées du module « Démarrer » de l'Académie, `leconsDemarrer` = nombre de leçons de ce module.
 */
export function premiersPas(e: { prospects: number; messages: number; sites: number; lecons: number; leconsDemarrer?: number; premierProspect?: string | null }): Pas[] {
  const fiche = e.premierProspect ? `/espace/prospects/${e.premierProspect}` : "/espace";
  const total = e.leconsDemarrer ?? 2;
  return [
    { id: "prospects", titre: "Réservez votre première entreprise", aide: "Un clic : MySite cherche les entreprises de votre zone et vous les réserve.", lien: "/espace", fait: e.prospects > 0 },
    { id: "message", titre: "Envoyez le premier message (IA)", aide: "Ouvrez une fiche : le message est rédigé pour cette entreprise. Vous l'envoyez vous-même.", lien: fiche, fait: e.messages > 0 },
    { id: "maquette", titre: "Créez sa maquette", aide: "Montrez au gérant son futur site, à son nom.", lien: fiche, fait: e.sites > 0 },
    { id: "academie", titre: "Suivez l'Académie « Démarrer »", aide: `${total} leçons courtes pour se lancer en règle. Incluses dans l'offre Gratuite.`, lien: "/espace/academie/demarrer-statut", fait: e.lecons >= total },
  ];
}

export interface LigneProfil { plan: string; abonnement_debut?: string | null; periode?: string | null; abonnement_statut?: string | null; cgu_acceptees_le?: string | null; resiliation_prevue?: boolean | null; source?: string | null; cree_le: string }

/** Chiffres du tableau de suivi du propriétaire. Le revenu mensuel compte un abonnement annuel pour un douzième. */
export function statistiques(profils: LigneProfil[], actifs: Set<string> | null, ids: string[] | null, maintenant = new Date()) {
  const t = maintenant.getTime();
  const depuis = (j: number) => profils.filter((p) => t - new Date(p.cree_le).getTime() <= j * JOUR).length;
  const abonnes: Record<string, number> = { pro: 0, premium: 0, ultra: 0 };
  let revenuMensuel = 0, resiliations = 0, configures = 0;
  const sources = new Map<string, { inscrits: number; abonnes: number }>();
  profils.forEach((p) => {
    const paye = estPlan(p.plan) && p.plan !== "gratuit" && abonnementActif(p.abonnement_statut);
    if (paye) {
      const P = PLANS[p.plan as PlanId];
      abonnes[p.plan]++;
      // Prix réellement payé : celui de lancement pour un abonnement commencé avant le 1er décembre 2026 (prix garanti).
      const debut = p.abonnement_debut ? new Date(p.abonnement_debut) : null;
      revenuMensuel += p.periode === "annuel" ? prixOffre(p.plan as PlanId, "annuel", maintenant, debut) / 12 : prixOffre(p.plan as PlanId, "mensuel", maintenant, debut);
      if (p.resiliation_prevue) resiliations++;
    }
    if (p.cgu_acceptees_le) configures++;
    const s = sources.get(p.source ?? "direct") ?? { inscrits: 0, abonnes: 0 };
    s.inscrits++; if (paye) s.abonnes++;
    sources.set(p.source ?? "direct", s);
  });
  const payants = abonnes.pro + abonnes.premium + abonnes.ultra;
  return {
    inscrits: profils.length, inscrits7j: depuis(7), inscrits30j: depuis(30), configures,
    actives: actifs && ids ? ids.filter((id) => actifs.has(id)).length : null,
    abonnes, payants, resiliations,
    revenuMensuel: Math.round(revenuMensuel * 100) / 100,
    conversion: profils.length ? Math.round((payants / profils.length) * 1000) / 10 : 0,
    sources: [...sources.entries()].map(([nom, v]) => ({ nom, ...v })).sort((a, b) => b.inscrits - a.inscrits),
  };
}

/** Adresses autorisées à voir le tableau de suivi (variable ADMIN_EMAILS, séparées par des virgules). */
export function estAdmin(email: string | null | undefined, liste = process.env.ADMIN_EMAILS): boolean {
  if (!email || !liste) return false;
  return liste.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}
