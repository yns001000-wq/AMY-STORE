"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Columns3, CreditCard, LayoutDashboard, Settings2 } from "lucide-react";

const LIENS = [["/espace", "Tableau de bord", LayoutDashboard], ["/espace/pipeline", "Pipeline", Columns3], ["/espace/bienvenue", "Secteur et zone", Settings2], ["/espace/abonnement", "Mon abonnement", CreditCard]] as const;

export function MenuApp() {
  const chemin = usePathname();
  return (
    <ul className="menu">
      {LIENS.map(([href, t, Ico]) => <li key={href}><Link href={href} aria-current={chemin === href ? "page" : undefined}><Ico aria-hidden />{t}</Link></li>)}
    </ul>
  );
}
