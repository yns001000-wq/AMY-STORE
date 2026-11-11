import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Site({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="entete">
        <div className="conteneur">
          <Logo />
          <nav className="nav" aria-label="Navigation principale">
            <Link className="lien-sec" href="/#methode">La méthode</Link>
            <Link className="lien-sec" href="/#tarifs">Tarifs</Link>
            <Link href="/connexion">Connexion</Link>
            <Link className="btn p" href="/connexion?mode=inscription">Commencer</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="pied">
        <div className="conteneur">
          <div><Logo /><p style={{ marginTop: ".8rem", maxWidth: "26rem" }}>L'outil des indépendants qui vendent des sites web aux commerces de leur ville.</p>
            <p>Données entreprises : base Sirene (INSEE), licence ouverte · © contributeurs OpenStreetMap (ODbL)</p></div>
          <div><h4>Produit</h4><ul><li><Link href="/#methode">La méthode</Link></li><li><Link href="/#fonctionnalites">Fonctionnalités</Link></li><li><Link href="/#tarifs">Tarifs</Link></li><li><Link href="/#faq">Questions</Link></li><li><Link href="/connexion">Mon cockpit</Link></li></ul></div>
          <div><h4>Légal</h4><ul><li><Link href="/mentions-legales">Mentions légales</Link></li><li><Link href="/cgu">CGU</Link></li><li><Link href="/cgv">CGV</Link></li><li><Link href="/confidentialite">Confidentialité</Link></li><li><Link href="/opposition">Retirer mon entreprise</Link></li><li><Link href="/signaler">Signaler un contenu</Link></li><li><Link href="/resilier"><b>Résilier mon abonnement</b></Link></li></ul></div>
        </div>
      </footer>
    </>
  );
}
