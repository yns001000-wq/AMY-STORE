"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CircleUser, Columns3, CreditCard, Gift, GraduationCap, LayoutDashboard, LayoutTemplate, Map as IconeCarte, ReceiptText, Settings2 } from "lucide-react";

const LIENS = [["/espace", "Tableau de bord", LayoutDashboard], ["/espace/pipeline", "Pipeline", Columns3], ["/espace/carte", "Carte", IconeCarte], ["/espace/studio", "Studio", LayoutTemplate], ["/espace/factures", "Devis et factures", ReceiptText], ["/espace/academie", "Académie", GraduationCap], ["/espace/bienvenue", "Secteur et zone", Settings2], ["/espace/parrainage", "Parrainage", Gift], ["/espace/abonnement", "Mon abonnement", CreditCard], ["/espace/compte", "Mon compte", CircleUser]] as const;

export function MenuApp() {
  const chemin = usePathname();
  // Le lien touché est mis en valeur tout de suite, sans attendre la réponse du serveur.
  const [vers, setVers] = useState<string | null>(null);
  useEffect(() => { setVers(null); }, [chemin]);
  const actif = vers ?? chemin;
  return (
    <ul className="menu">
      {LIENS.map(([href, t, Ico]) => <li key={href}><Link href={href} onClick={() => href !== chemin && setVers(href)} aria-current={actif === href || (href !== "/espace" && actif.startsWith(href + "/")) ? "page" : undefined}><Ico aria-hidden />{t}</Link></li>)}
    </ul>
  );
}
