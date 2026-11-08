import { NextResponse } from "next/server";
import { archiverVersion, chargerSite, contexteStudio } from "@/lib/studio/serveur";
import { appliquerEdition } from "@/lib/studio";

/** Enregistre une modification manuelle (filtrée selon l'offre : le serveur ne fait jamais confiance au navigateur). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const { session, cap } = ctx;
  const site = await chargerSite(session.sb, (await params).id);
  if (!site) return NextResponse.json({ erreur: "Site introuvable" }, { status: 404 });
  const { edition } = (await req.json().catch(() => ({}))) as { edition?: Record<string, unknown> };
  if (!edition || typeof edition !== "object" || JSON.stringify(edition).length > 200_000) return NextResponse.json({ erreur: "Requête invalide" }, { status: 400 });
  const { d, refuses } = appliquerEdition(site.donnees, edition, cap);
  await archiverVersion(session.sb, site, cap, "Modification manuelle");
  const { error } = await session.sb.from("sites").update({ donnees: d, maj_le: new Date().toISOString() }).eq("id", site.id);
  if (error) return NextResponse.json({ erreur: "Enregistrement impossible" }, { status: 500 });
  return NextResponse.json({ donnees: d, refuses });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const { error } = await ctx.session.sb.from("sites").delete().eq("id", (await params).id);
  if (error) return NextResponse.json({ erreur: "Suppression impossible" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
