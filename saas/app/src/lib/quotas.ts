import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import { limite, planEffectif, quotasEffectifs, type PlanId, type TypeQuota } from "./plans";

export function moisCourant(d = new Date()): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" }).format(d).slice(0, 7);
}

/** Profil, offre appliquée, et quotas appliqués. `essai` : compte gratuit en essai Premium (fonctions de Premium, volumes réduits). */
export async function profilEtPlan(userId: string): Promise<{ profil: Record<string, unknown>; plan: PlanId; essai: boolean; quotas: Record<TypeQuota, number> }> {
  const { data, error } = await supabaseAdmin().from("profils").select("*").eq("id", userId).single();
  if (error || !data) throw new Error("Profil introuvable");
  const plan = planEffectif(data as { plan: string; essai_fin?: string | null }), essai = data.plan === "gratuit" && plan === "premium";
  return { profil: data, plan, essai, quotas: quotasEffectifs(plan, essai) };
}

export async function consommation(userId: string): Promise<Record<TypeQuota, number>> {
  const { data } = await supabaseAdmin().from("consommation").select("prospects, messages_ia, sites_ia, retouches_ia").eq("user_id", userId).eq("mois", moisCourant()).maybeSingle();
  return { prospects: data?.prospects ?? 0, messages_ia: data?.messages_ia ?? 0, sites_ia: data?.sites_ia ?? 0, retouches_ia: data?.retouches_ia ?? 0 };
}

/** Réserve n unités du quota, de façon atomique. false = limite atteinte (rien n'est consommé). */
export async function consommer(userId: string, plan: PlanId, type: TypeQuota, n: number, essai = false): Promise<boolean> {
  const max = limite(plan, type, essai);
  if (max <= 0) return false;
  const { data, error } = await supabaseAdmin().rpc("consommer_quota", { p_user: userId, p_type: type, p_n: n, p_limite: max });
  if (error) throw error;
  return data === true;
}

/** Rend une unité de quota après un échec de l'IA. */
export async function rembourser(userId: string, type: TypeQuota): Promise<void> {
  await supabaseAdmin().rpc("rembourser_quota", { p_user: userId, p_type: type });
}
