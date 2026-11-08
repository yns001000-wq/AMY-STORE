import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { ETAPES_LIVRAISON } from "@/lib/livraison";
import { normaliserDomaine } from "@/lib/publication";

/** Coche ou décoche une étape manuelle de la livraison, ou enregistre le domaine choisi. */
export async function POST(req: Request) {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { prospect_id?: string; etape?: string; fait?: boolean; domaine?: string };
  const { data: p } = await session.sb.from("prospects").select("id").eq("id", String(b.prospect_id ?? "")).maybeSingle();
  if (!p) return NextResponse.json({ erreur: "Prospect introuvable" }, { status: 404 });
  const { data: l } = await session.sb.from("livraisons").select("etapes, domaine").eq("prospect_id", p.id).maybeSingle();
  const etapes = { ...((l?.etapes as Record<string, string>) ?? {}) };
  if (b.etape) {
    const e = ETAPES_LIVRAISON.find((x) => x.cle === b.etape);
    if (!e || e.auto) return NextResponse.json({ erreur: "Étape invalide" }, { status: 400 });
    if (b.fait) etapes[e.cle] = new Date().toISOString().slice(0, 10); else delete etapes[e.cle];
  }
  const domaine = b.domaine !== undefined ? (b.domaine ? normaliserDomaine(b.domaine) : null) : l?.domaine ?? null;
  if (b.domaine && !domaine) return NextResponse.json({ erreur: "Nom de domaine invalide" }, { status: 400 });
  await session.sb.from("livraisons").upsert({ prospect_id: p.id, user_id: session.user.id, etapes, domaine, maj_le: new Date().toISOString() });
  return NextResponse.json({ ok: true, etapes, domaine });
}
