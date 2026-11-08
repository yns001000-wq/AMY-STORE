import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const titre = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--police-titre", display: "swap" });
const ui = Inter({ subsets: ["latin"], variable: "--police-ui", display: "swap" });

export const metadata: Metadata = {
  title: { default: "MySite · vos prospects locaux, prêts à appeler", template: "%s · MySite" },
  description: "Choisissez votre secteur et votre région : MySite trouve les commerces à démarcher, prépare vos messages et vos maquettes de sites, et suit vos ventes.",
};

export default function Racine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${titre.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
