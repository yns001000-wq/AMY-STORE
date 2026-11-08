import { NextResponse } from "next/server";
import { archiverVersion, chargerSite, contexteStudio } from "@/lib/studio/serveur";

/** Revient à une version précédente (l'état actuel est lui-même archivé, donc rien n'est perdu). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const { session, cap } = ctx;
  const site = await chargerSite(session.sb, (await params).id);
  if (!site) return NextResponse.json({ erreur: "Site introuvable" }, { status: 404 });
  const { version_id } = (await req.json().catch(() => ({}))) as { version_id?: number };
  const { data: v } = await session.sb.from("sites_versions").select("donnees").eq("id", Number(version_id)).eq("site_id", site.id).maybeSingle();
  if (!v) return NextResponse.json({ erreur: "Version introuvable" }, { status: 404 });
  await archiverVersion(session.sb, site, cap, "Avant restauration");
  await session.sb.from("sites").update({ donnees: v.donnees, maj_le: new Date().toISOString() }).eq("id", site.id);
  return NextResponse.json({ donnees: v.donnees });
}
