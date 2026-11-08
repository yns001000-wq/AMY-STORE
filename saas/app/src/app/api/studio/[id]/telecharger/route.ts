import { NextResponse } from "next/server";
import { absolutiser, chargerSite, contexteStudio } from "@/lib/studio/serveur";
import { rendreSite, type DonneesSite } from "@/lib/studio";

/**
 * Télécharge le site en un fichier HTML autonome.
 * - ?finale=1 (offres payantes) : retire le bandeau « maquette » et le noindex, une fois les contenus vérifiés avec le client.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const { session, cap, plan } = ctx;
  const site = await chargerSite(session.sb, (await params).id);
  if (!site) return NextResponse.json({ erreur: "Site introuvable" }, { status: 404 });
  const url = new URL(req.url), finale = url.searchParams.get("finale") === "1";
  if (finale && plan === "gratuit") return NextResponse.json({ erreur: "La version finale (sans bandeau de maquette) est incluse dès l'offre Pro.", plan }, { status: 402 });
  const d: DonneesSite = { ...site.donnees, maquette: !finale };
  const html = absolutiser(rendreSite(d, cap, url.origin), url.origin);
  const nom = String(d.nom ?? "site").normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "site";
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="${nom}${finale ? "" : "-maquette"}.html"`, "Cache-Control": "no-store" } });
}
