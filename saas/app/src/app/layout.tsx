import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MySite · vos prospects locaux, prêts à appeler", template: "%s · MySite" },
  description: "Choisissez votre secteur et votre région : MySite trouve les commerces à démarcher, prépare vos messages et vos maquettes de sites, et suit vos ventes.",
};

export default function Racine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="conteneur">
          <header className="entete">
            <Link className="marque" href="/">MySite</Link>
            <nav className="nav" aria-label="Navigation principale">
              <Link href="/#tarifs">Tarifs</Link>
              <Link href="/espace">Mon cockpit</Link>
              <Link className="btn p" href="/connexion">Essai gratuit</Link>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="pied">
            <span>© {new Date().getFullYear()} MySite</span>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/cgu">CGU</Link>
            <Link href="/cgv">CGV</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/opposition">Retirer mon entreprise</Link>
            <span>Données entreprises : base Sirene (INSEE), licence ouverte · © contributeurs OpenStreetMap (ODbL)</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
