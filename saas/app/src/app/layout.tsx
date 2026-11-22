import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const titre = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--police-titre", display: "swap" });
const ui = Inter({ subsets: ["latin"], variable: "--police-ui", display: "swap" });

const DESCRIPTION = "Montrez à une entreprise son futur site avant même de l'appeler. MySite trouve les petites entreprises à démarcher autour de vous, écrit le premier message et crée la maquette à leur nom en un clic. Gratuit pour commencer.";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "MySite · vendez des sites web aux entreprises de votre ville", template: "%s · MySite" },
  description: DESCRIPTION,
  applicationName: "MySite",
  openGraph: { type: "website", locale: "fr_FR", siteName: "MySite", title: "Vendez des sites web aux entreprises de votre ville", description: DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: "Vendez des sites web aux entreprises de votre ville", description: DESCRIPTION },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff", colorScheme: "light" };

export default function Racine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${titre.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
