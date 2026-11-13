/** Règles de croissance, sans effet de bord (testées) : provenance, premiers pas, chiffres du tableau de suivi. */
import { PLANS, abonnementActif, estPlan, type PlanId } from "./plans";

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

/** Les premiers pas affichés sur le tableau de bord tant qu'ils ne sont pas tous faits. */
export function premiersPas(e: { prospects: number; messages: number; sites: number; lecons: number; premierProspect?: string | null }): Pas[] {
  const fiche = e.premierProspect ? `/espace/prospects/${e.premierProspect}` : "/espace";
  return [
    { id: "prospects", titre: "Trouver vos premiers commerces", aide: "Un clic : MySite cherche les commerces de votre zone.", lien: "/espace", fait: e.prospects > 0 },
    { id: "message", titre: "Préparer votre premier message", aide: "Ouvrez une fiche : le message est rédigé pour ce commerce.", lien: fiche, fait: e.messages > 0 },
    { id: "maquette", titre: "Créer une maquette de site", aide: "Montrez au commerçant son futur site, avec son nom.", lien: fiche, fait: e.sites > 0 },
    { id: "academie", titre: "Suivre la première leçon de l'Académie", aide: "6 minutes pour se lancer en règle. Inclus dans l'offre Gratuite.", lien: "/espace/academie/demarrer-statut", fait: e.lecons > 0 },
  ];
}

export interface LigneProfil { plan: string; periode?: string | null; abonnement_statut?: string | null; cgu_acceptees_le?: string | null; resiliation_prevue?: boolean | null; source?: string | null; cree_le: string }

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
      revenuMensuel += p.periode === "annuel" ? P.prixAnnuel / 12 : P.prixMensuel;
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
