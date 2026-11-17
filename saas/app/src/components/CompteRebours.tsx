"use client";
import { useEffect, useState } from "react";
import { Hourglass } from "lucide-react";
import { DATE_HAUSSE, PRIX_APRES, tempsRestant } from "@/lib/lancement";

const d2 = (n: number) => String(n).padStart(2, "0");

/**
 * Bandeau des prix de lancement, avec un compte à rebours réel jusqu'au 1er décembre 2026 (minuit, Paris).
 * Il ne recommence jamais : à la date, il disparaît et les nouveaux prix s'appliquent aux nouveaux abonnés.
 */
export function CompteRebours({ compact }: { compact?: boolean }) {
  const [reste, setReste] = useState(() => tempsRestant());
  useEffect(() => { const t = setInterval(() => setReste(tempsRestant()), 1000); return () => clearInterval(t); }, []);
  if (!reste) return null;
  return (
    <div className={`compte-rebours${compact ? " compact" : ""}`} role="timer" aria-live="off">
      <p className="cr-titre"><Hourglass aria-hidden /><span><b>Prix de lancement</b> jusqu&apos;au 30 novembre</span></p>
      <div className="cr-cases" suppressHydrationWarning>
        <span><b suppressHydrationWarning>{reste.jours}</b><small>jours</small></span>
        <span><b suppressHydrationWarning>{d2(reste.heures)}</b><small>heures</small></span>
        <span><b suppressHydrationWarning>{d2(reste.minutes)}</b><small>min</small></span>
        <span><b suppressHydrationWarning>{d2(reste.secondes)}</b><small>s</small></span>
      </div>
      {!compact && <p className="cr-texte">Le {DATE_HAUSSE}, les prix augmentent : Pro passe à {PRIX_APRES.pro.mensuel} €, Premium à {PRIX_APRES.premium.mensuel} € et Ultra à {PRIX_APRES.ultra.mensuel} € par mois. <b>Abonnez-vous avant : vous gardez le prix de lancement tant que vous restez abonné.</b></p>}
    </div>
  );
}
