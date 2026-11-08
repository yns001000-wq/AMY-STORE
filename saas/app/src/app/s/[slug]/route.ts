import { servirSite } from "@/lib/servir-site";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  return servirSite({ slug: (await params).slug }, new URL(req.url).searchParams.get("chemin") ?? "/");
}
