import { servirSite } from "@/lib/servir-site";
import { normaliserDomaine } from "@/lib/publication";

export async function GET(req: Request, { params }: { params: Promise<{ domaine: string }> }) {
  const d = normaliserDomaine((await params).domaine);
  if (!d) return new Response("Site introuvable", { status: 404 });
  return servirSite({ domaine: d }, new URL(req.url).searchParams.get("chemin") ?? "/");
}
