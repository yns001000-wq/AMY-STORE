import { NextResponse } from "next/server";
import { cronAutorise } from "@/lib/securite";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { envoyerEmail, urlSite } from "@/lib/email";
import { premiersPas } from "@/lib/croissance";
import { MODULES } from "@/lib/academie/cours";
import { contenuRelance, ETAPES_TU, jetonDesinscription, relanceDuJour, SUJETS, type Relance } from "@/lib/relances";

export const maxDuration = 120;
const LECONS_DEMARRER = MODULES.find((m) => m.id === "demarrer")!.lecons.map((l) => l.id);

/**
 * Tâche quotidienne (Vercel Cron, en-tête Authorization: Bearer CRON_SECRET) : relances J+1, J+3 et J+6 des nouveaux inscrits.
 * Seuls les comptes créés il y a moins de 10 jours sont examinés. Voir les règles dans lib/relances.ts.
 */
export async function GET(req: Request) {
  if (!cronAutorise(req)) return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  if (!jetonDesinscription("test")) return NextResponse.json({ envoyes: 0, raison: "Secret de désinscription absent : aucun e-mail envoyé." });
  const admin = supabaseAdmin();
  const depuis = new Date(Date.now() - 10 * 86400000).toISOString();
  const { data: profils, error } = await admin.from("profils").select("id, cree_le, relances_desinscrit, relances_envoyees").gte("cree_le", depuis).eq("relances_desinscrit", false);
  if (error) return NextResponse.json({ erreur: "Lecture des profils impossible (migration 0010 appliquée ?)" }, { status: 500 });

  const bilan = { examines: profils?.length ?? 0, envoyes: 0, echecs: 0, detail: { j1: 0, j3: 0, j6: 0 } as Record<Relance, number> };
  for (const p of profils ?? []) {
    const [{ count: prospects }, { count: sites }, { data: conso }, { count: lecons }, { data: u }] = await Promise.all([
      admin.from("prospects").select("id", { count: "exact", head: true }).eq("user_id", p.id),
      admin.from("sites").select("id", { count: "exact", head: true }).eq("user_id", p.id),
      admin.from("consommation").select("messages_ia").eq("user_id", p.id),
      admin.from("progression_cours").select("lecon", { count: "exact", head: true }).eq("user_id", p.id).in("lecon", LECONS_DEMARRER),
      admin.auth.admin.getUserById(p.id),
    ]);
    const email = u?.user?.email;
    if (!email) continue;
    const pas = premiersPas({ prospects: prospects ?? 0, messages: (conso ?? []).reduce((n, l) => n + (l.messages_ia ?? 0), 0), sites: sites ?? 0, lecons: lecons ?? 0, leconsDemarrer: LECONS_DEMARRER.length });
    const envoyees = (p.relances_envoyees ?? {}) as Partial<Record<Relance, string>>;
    const etat = { creeLe: p.cree_le as string, desinscrit: !!p.relances_desinscrit, envoyees, prospects: prospects ?? 0, sites: sites ?? 0, etapesRestantes: pas.filter((x) => !x.fait).map((x) => ETAPES_TU[x.id] ?? x.titre) };
    const r = relanceDuJour(etat);
    if (!r) continue;
    const lienDes = urlSite(`/api/relances/desinscription?u=${p.id}&t=${jetonDesinscription(p.id)}`);
    const ok = await envoyerEmail(email, SUJETS[r], contenuRelance(r, etat, { espace: urlSite("/espace"), desinscription: lienDes }),
      { "List-Unsubscribe": `<${lienDes}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });
    if (!ok) { bilan.echecs++; continue; }
    // Mémorisé seulement après un envoi réussi : jamais deux fois le même.
    await admin.from("profils").update({ relances_envoyees: { ...envoyees, [r]: new Date().toISOString() } }).eq("id", p.id);
    bilan.envoyes++; bilan.detail[r]++;
  }
  return NextResponse.json(bilan);
}
