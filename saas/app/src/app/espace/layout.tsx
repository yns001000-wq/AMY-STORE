import Link from "next/link";
import { ChartNoAxesCombined, LogOut, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MenuApp } from "@/components/MenuApp";
import { seDeconnecter } from "@/lib/actions-auth";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { profilEtPlan } from "@/lib/quotas";
import { estAdmin } from "@/lib/croissance";
import { PLANS, type PlanId } from "@/lib/plans";

/** Encart du menu : toujours l'offre juste au-dessus de celle de l'utilisateur (rien en Ultra). */
const SUIVANTE: Partial<Record<PlanId, PlanId>> = { gratuit: "pro", pro: "premium", premium: "ultra" };

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await utilisateurConnecte();
  let offre: { titre: string; texte: string; essai: boolean } | null = null, admin = false;
  if (session) {
    admin = estAdmin(session.user.email);
    try {
      const { profil, plan } = await profilEtPlan(session.user.id);
      const essai = profil.plan === "gratuit" && !profil.essai_premium_utilise, enEssai = profil.plan === "gratuit" && plan === "premium";
      const cible = enEssai ? "premium" : SUIVANTE[plan];
      if (essai) offre = { titre: "Essai Premium offert", texte: "7 jours, sans carte bancaire. Retour automatique au Gratuit.", essai: true };
      else if (cible) { const P = PLANS[cible]; offre = { titre: enEssai ? "Garder Premium" : `Passez à ${P.nom}`, texte: `${P.quotas.prospects.toLocaleString("fr-FR")} prospects par mois${P.quotas.sites_ia ? ` et ${P.quotas.sites_ia} sites sur mesure` : ""}. ${P.prixMensuel} € par mois, sans engagement.`, essai: false }; }
    } catch { /* profil pas encore créé : pas d'encart */ }
  }
  return (
    <div className="app">
      <aside className="cote">
        <Logo />
        <nav aria-label="Menu du cockpit"><MenuApp />{admin && <ul className="menu"><li><Link href="/espace/suivi"><ChartNoAxesCombined aria-hidden />Suivi des ventes</Link></li></ul>}</nav>
        {offre && (
          <div className="carte-offre">
            <strong style={{ display: "flex", gap: ".4rem", alignItems: "center" }}><Sparkles size={16} aria-hidden />{offre.titre}</strong>
            <p>{offre.texte}</p>
            {offre.essai ? <form action="/api/essai" method="post"><button className="btn" type="submit">Démarrer l&apos;essai</button></form> : <Link className="btn" href="/espace/abonnement">Voir les offres</Link>}
          </div>
        )}
        <form action={seDeconnecter}><ul className="menu"><li><button type="submit"><LogOut aria-hidden />Déconnexion</button></li></ul></form>
      </aside>
      <main className="principal">{children}</main>
    </div>
  );
}
