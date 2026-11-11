import type { NextConfig } from "next";

const securite = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HTTPS obligatoire pendant 2 ans, y compris sur les sous-domaines
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Aucune page de l'application ne peut être intégrée ailleurs, ni charger de plugin, ni changer l'adresse de base
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securite },
      // Polices chargées par l'aperçu du Studio (iframe isolée, origine opaque) et par les sites téléchargés
      { source: "/polices/:fichier", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }, { key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
};

export default config;
