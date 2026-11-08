import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { lecon, SEUIL_REUSSITE } from "@/lib/academie/cours";

/** Enregistre la réussite d'une leçon (quiz réussi). Le meilleur score est conservé. */
export async function POST(req: Request) {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { lecon?: string; score?: number };
  const l = lecon(String(b.lecon ?? ""));
  const score = Math.max(0, Math.min(100, Math.round(Number(b.score) || 0)));
  if (!l) return NextResponse.json({ erreur: "Leçon inconnue" }, { status: 400 });
  if (score < SEUIL_REUSSITE) return NextResponse.json({ ok: false });
  const { data: avant } = await session.sb.from("progression_cours").select("score").eq("lecon", l.id).maybeSingle();
  if (!avant || avant.score < score) await session.sb.from("progression_cours").upsert({ user_id: session.user.id, lecon: l.id, score, termine_le: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
