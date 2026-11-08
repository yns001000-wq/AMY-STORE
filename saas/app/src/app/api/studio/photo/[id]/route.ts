import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { contexteStudio } from "@/lib/studio/serveur";

const ID = /^[0-9a-f-]{36}$/i;

/** Modifie la légende ou la portée d'une photo de la banque personnelle. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const id = (await params).id;
  if (!ID.test(id)) return NextResponse.json({ erreur: "Photo introuvable" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { legende?: string; portee?: string };
  const maj: Record<string, string> = {};
  if (typeof b.legende === "string") maj.legende = b.legende.replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 120);
  if (b.portee === "tous" || b.portee === "commerce") maj.portee = b.portee;
  if (!Object.keys(maj).length) return NextResponse.json({ erreur: "Requête invalide" }, { status: 400 });
  const { data: avant } = await ctx.session.sb.from("photos_perso").select("prospect_id").eq("id", id).maybeSingle();
  if (!avant) return NextResponse.json({ erreur: "Photo introuvable" }, { status: 404 });
  if (maj.portee === "commerce" && !avant.prospect_id) return NextResponse.json({ erreur: "Cette photo n'est rattachée à aucun commerce." }, { status: 409 });
  const { data, error } = await ctx.session.sb.from("photos_perso").update(maj).eq("id", id).select("id, url, legende, portee, prospect_id").single();
  if (error || !data) return NextResponse.json({ erreur: "Modification impossible" }, { status: 500 });
  return NextResponse.json({ photo: data });
}

/** Retire une photo de la banque et supprime le fichier (RLS : uniquement ses propres photos). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const id = (await params).id;
  if (!ID.test(id)) return NextResponse.json({ erreur: "Photo introuvable" }, { status: 404 });
  const { data: ph } = await ctx.session.sb.from("photos_perso").select("chemin").eq("id", id).maybeSingle();
  if (!ph) return NextResponse.json({ erreur: "Photo introuvable" }, { status: 404 });
  if (!ph.chemin.startsWith(`${ctx.session.user.id}/`)) return NextResponse.json({ erreur: "Interdit" }, { status: 403 });
  await supabaseAdmin().storage.from("studio").remove([ph.chemin]);
  await ctx.session.sb.from("photos_perso").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
