import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import { urlPublique } from "./publication";

/** Réponse HTTP d'un site publié (page unique, robots.txt et sitemap.xml). */
export async function servirSite(ou: { slug: string } | { domaine: string }, chemin: string): Promise<Response> {
  const admin = supabaseAdmin();
  let q = admin.from("publications").select("slug, domaine, html, maj_le");
  if ("slug" in ou) q = q.eq("slug", ou.slug);
  else { const d = ou.domaine.replace(/^www\./, ""); q = q.in("domaine", [d, `www.${d}`]); }
  const { data: pub } = await q.limit(1).maybeSingle();
  if (!pub) return new Response("Site introuvable", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const url = urlPublique(pub.slug, pub.domaine);
  if (chemin === "/robots.txt") return new Response(`User-agent: *\nAllow: /\nSitemap: ${url}/sitemap.xml\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  if (chemin === "/sitemap.xml") return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url}/</loc><lastmod>${String(pub.maj_le).slice(0, 10)}</lastmod></url></urlset>`, { headers: { "Content-Type": "application/xml" } });
  if (chemin !== "/" && chemin !== "") return new Response(null, { status: 301, headers: { Location: `${url}/` } });
  return new Response(pub.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
      // Origine isolée : le site d'un client ne peut jamais lire les cookies de l'application.
      "Content-Security-Policy": "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation",
      "Link": `<${url}/>; rel="canonical"`,
    },
  });
}
