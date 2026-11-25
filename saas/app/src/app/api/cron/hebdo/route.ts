import { NextResponse } from "next/server";
import { cronAutorise } from "@/lib/securite";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { envoyerEmail, urlSite } from "@/lib/email";
import { consommation } from "@/lib/quotas";
import { planEffectif, PLANS } from "@/lib/plans";
import { libelleRemise, prochaineRemiseAZero } from "@/lib/limites";
import { scoreProspect } from "@/lib/score";
import { jetonDesinscription } from "@/lib/relances";
import { contenuHebdo, hebdoAEnvoyer, sujetHebdo, type DonneesHebdo } from "@/lib/hebdo";

export const maxDuration = 300;
const EN_COURS = new Set(["contacte", "repondu", "rdv", "devis"]);

/**
 * Tâche du lundi 9 h (Vercel Cron, en-tête Authorization: Bearer CRON_SECRET) : « Ton point de la semaine ».
 * Règles d'envoi dans lib/hebdo.ts. Chaque envoi réussi est mémorisé (relances_envoyees.hebdo) : jamais deux fois la même semaine.
 */
export async function GET(req: Request) {
  if (!cronAutorise(req)) return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  if (!jetonDesinscription("test")) return NextResponse.json({ envoyes: 0, raison: "Secret de désinscription absent : aucun e-mail envoyé." });
  const admin = supabaseAdmin();
  const { data: profils, error } = await admin.from("profils").select("id, prenom, plan, pro_offert_jusqu, cree_le, cgu_acceptees_le, relances_desinscrit, relances_envoyees").eq("relances_desinscrit", false).not("cgu_acceptees_le", "is", null);
  if (error) return NextResponse.json({ erreur: "Lecture des profils impossible" }, { status: 500 });

  const dans7j = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const bilan = { examines: profils?.length ?? 0, envoyes: 0, echecs: 0, ignores: 0 };
  for (const p of profils ?? []) {
    const { data: u } = await admin.auth.admin.getUserById(p.id);
    const envoyees = (p.relances_envoyees ?? {}) as Record<string, string>;
    const etat = { creeLe: p.cree_le as string, configure: !!p.cgu_acceptees_le, desinscrit: !!p.relances_desinscrit, derniereConnexion: u?.user?.last_sign_in_at ?? null, envoyees };
    if (!u?.user?.email || !hebdoAEnvoyer(etat)) { bilan.ignores++; continue; }

    const { data: pros } = await admin.from("prospects").select("nom, metier, naf, indices, telephone, statut, date_creation, tranche_effectif, prochaine_action, date_prochaine_action").eq("user_id", p.id).limit(3000);
    const liste = pros ?? [];
    const nouveaux = liste.filter((x) => x.statut === "nouveau").map((x) => ({ nom: x.nom as string, metier: x.metier as string | null, score: scoreProspect(x) })).sort((a, b) => b.score - a.score);
    const rappels = liste.filter((x) => x.date_prochaine_action && x.date_prochaine_action <= dans7j && !["gagne", "perdu", "refus"].includes(x.statut))
      .sort((a, b) => String(a.date_prochaine_action).localeCompare(String(b.date_prochaine_action)))
      .map((x) => ({ nom: x.nom as string, action: x.prochaine_action as string | null, date: x.date_prochaine_action as string }));
    const plan = planEffectif(p as { plan: string; pro_offert_jusqu?: string | null });
    let quota: DonneesHebdo["quota"] = null;
    if (plan === "gratuit") {
      const c = await consommation(p.id), q = PLANS.gratuit.quotas;
      quota = { prospectsRestants: Math.max(0, q.prospects - c.prospects), messagesRestants: Math.max(0, q.messages_ia - c.messages_ia), remise: libelleRemise(prochaineRemiseAZero()) };
    }
    const d: DonneesHebdo = {
      prenom: (p.prenom as string | null) || null, aContacter: nouveaux.slice(0, 3), rappels, totalAContacter: nouveaux.length,
      enCours: liste.filter((x) => EN_COURS.has(x.statut)).length, gagnes: liste.filter((x) => x.statut === "gagne").length, quota,
    };
    const lienDes = urlSite(`/api/relances/desinscription?u=${p.id}&t=${jetonDesinscription(p.id)}`);
    const ok = await envoyerEmail(u.user.email, sujetHebdo(d), contenuHebdo(d, { espace: urlSite("/espace"), desinscription: lienDes }),
      { "List-Unsubscribe": `<${lienDes}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });
    if (!ok) { bilan.echecs++; continue; }
    await admin.from("profils").update({ relances_envoyees: { ...envoyees, hebdo: new Date().toISOString() } }).eq("id", p.id);
    bilan.envoyes++;
  }
  return NextResponse.json(bilan);
}
