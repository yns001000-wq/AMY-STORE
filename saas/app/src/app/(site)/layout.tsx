import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Site({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="entete">
        <div className="conteneur">
          <Logo />
          <nav className="nav" aria-label="Navigation principale">
            <Link className="lien-sec" href="/#fonctionnalites">Fonctionnalités</Link>
            <Link className="lien-sec" href="/#tarifs">Tarifs</Link>
            <Link href="/connexion">Connexion</Link>
            <Link className="btn p" href="/connexion?mode=inscription">Essai gratuit</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="pied">
        <div className="conteneur">
          <div><Logo /><p style={{ marginTop: ".8rem", maxWidth: "26rem" }}>Le cockpit de prospection des indépendants qui vendent aux commerces de leur région.</p>
            <p>Données entreprises : base Sirene (INSEE), licence ouverte · © contributeurs OpenStreetMap (ODbL)</p></div>
          <div><h4>Produit</h4><ul><li><Link href="/#fonctionnalites">Fonctionnalités</Link></li><li><Link href="/#tarifs">Tarifs</Link></li><li><Link href="/#faq">Questions</Link></li><li><Link href="/connexion">Mon cockpit</Link></li></ul></div>
          <div><h4>Légal</h4><ul><li><Link href="/mentions-legales">Mentions légales</Link></li><li><Link href="/cgu">CGU</Link></li><li><Link href="/cgv">CGV</Link></li><li><Link href="/confidentialite">Confidentialité</Link></li><li><Link href="/opposition">Retirer mon entreprise</Link></li></ul></div>
        </div>
      </footer>
    </>
  );
}
