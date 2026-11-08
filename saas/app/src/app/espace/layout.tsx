import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MenuApp } from "@/components/MenuApp";
import { seDeconnecter } from "@/lib/actions-auth";

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <aside className="cote">
        <Logo />
        <nav aria-label="Menu du cockpit"><MenuApp /></nav>
        <div className="carte-offre">
          <strong style={{ display: "flex", gap: ".4rem", alignItems: "center" }}><Sparkles size={16} aria-hidden />Passez à Premium</strong>
          <p>1 000 prospects par mois, 10 départements et 40 sites sur mesure.</p>
          <Link className="btn" href="/espace/abonnement">Voir les offres</Link>
        </div>
        <form action={seDeconnecter}><ul className="menu"><li><button type="submit"><LogOut aria-hidden />Déconnexion</button></li></ul></form>
      </aside>
      <main className="principal">{children}</main>
    </div>
  );
}
