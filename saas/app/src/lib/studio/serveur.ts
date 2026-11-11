import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { anthropic } from "../ia";
import { PLANS, type CapacitesStudio, type PlanId } from "../plans";
import { utilisateurConnecte } from "../supabase/serveur";
import { profilEtPlan } from "../quotas";
import type { DonneesSite } from "./index";

export interface SiteLigne { id: string; user_id: string; prospect_id: string | null; type: "express" | "ia"; donnees: DonneesSite; etude: Record<string, unknown> | null; cree_le: string; maj_le: string }

/** Session + offre + capacités du Studio, ou réponse d'erreur prête à renvoyer. */
export async function contexteStudio() {
  const session = await utilisateurConnecte();
  if (!session) return { erreur: NextResponse.json({ erreur: "Non connecté" }, { status: 401 }) } as const;
  const { plan, essai } = await profilEtPlan(session.user.id);
  return { session, plan, essai, cap: PLANS[plan].studio } as const;
}

/** Lecture d'un site de l'utilisateur (RLS : jamais celui d'un autre). */
export async function chargerSite(sb: SupabaseClient, id: string): Promise<SiteLigne | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await sb.from("sites").select("*").eq("id", id).maybeSingle();
  return (data as SiteLigne) ?? null;
}

/** Sauvegarde l'état précédent dans l'historique, en ne gardant que le nombre de versions prévu par l'offre. */
export async function archiverVersion(sb: SupabaseClient, site: SiteLigne, cap: CapacitesStudio, libelle: string) {
  if (cap.versions <= 0) return;
  await sb.from("sites_versions").insert({ site_id: site.id, user_id: site.user_id, donnees: site.donnees, libelle: libelle.slice(0, 80) });
  const { data } = await sb.from("sites_versions").select("id").eq("site_id", site.id).order("cree_le", { ascending: false }).order("id", { ascending: false });
  const trop = (data ?? []).slice(cap.versions).map((v) => v.id);
  if (trop.length) await sb.from("sites_versions").delete().in("id", trop);
}

/** Appel à Claude pour le Studio. Renvoie le texte, ou null si l'IA refuse ou ne répond rien. */
export async function demanderIA(prompt: string, effort: "low" | "medium" | "high" | "xhigh", maxTokens = 16000): Promise<string | null> {
  const rep = await anthropic().beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: maxTokens,
    output_config: { effort },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content: prompt }],
  });
  if (rep.stop_reason === "refusal") return null;
  const t = rep.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
  return t || null;
}

export function erreurIA(e: unknown) {
  if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ erreur: "Trop de demandes : réessayez dans une minute." }, { status: 429 });
  if (e instanceof Anthropic.APIError) return NextResponse.json({ erreur: "Le service d'IA est indisponible pour le moment." }, { status: 502 });
  if (e instanceof SyntaxError || (e instanceof Error && /JSON/.test(e.message))) return NextResponse.json({ erreur: "Réponse de l'IA illisible : réessayez." }, { status: 502 });
  return null;
}

/** Les sites téléchargés doivent fonctionner hors de MySite : chemins des photos et polices rendus absolus. */
export function absolutiser(html: string, origine: string): string {
  return html.replace(/(["'(])\/(photos|polices)\//g, `$1${origine}/$2/`);
}

export const planSuffisant = (plan: PlanId, min: PlanId) => (["gratuit", "pro", "premium", "ultra"] as PlanId[]).indexOf(plan) >= (["gratuit", "pro", "premium", "ultra"] as PlanId[]).indexOf(min);

/** Photos de la banque personnelle utilisables pour le site d'un commerce (les siennes et les génériques). */
export async function photosDuCommerce(sb: SupabaseClient, cap: CapacitesStudio, prospectId: string | null, limite = 40): Promise<import("./index").PhotoPerso[]> {
  if (!cap.photosPerso || cap.banquePerso <= 0) return [];
  let q = sb.from("photos_perso").select("id, url, legende, portee, prospect_id").order("cree_le", { ascending: false }).limit(limite);
  q = prospectId && /^[0-9a-f-]{36}$/i.test(prospectId) ? q.or(`portee.eq.tous,prospect_id.eq.${prospectId}`) : q.eq("portee", "tous");
  const { data } = await q;
  return (data ?? []) as import("./index").PhotoPerso[];
}
