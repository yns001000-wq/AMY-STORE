import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Les moteurs de recherche voient les pages publiques ; l'espace privé et les routes techniques restent à l'écart. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/espace", "/api", "/auth", "/impression", "/connexion"] }], sitemap: `${SITE}/sitemap.xml` };
}
