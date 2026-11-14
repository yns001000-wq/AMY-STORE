"use client";
import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { COOKIE_PARRAIN } from "@/lib/parrainage";

/** Prénom du parrain si le visiteur est arrivé par un lien de parrainage (cookie de 30 jours), sinon null. */
export function useInvitation(): string | null {
  const [prenom, setPrenom] = useState<string | null>(null);
  useEffect(() => {
    if (!document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE_PARRAIN}=`))) return;
    fetch("/api/parrainage/invitation").then((r) => r.json()).then((j) => j.invite && setPrenom(j.prenom)).catch(() => {});
  }, []);
  return prenom;
}

/** Bandeau discret sur le site public : « Invité par Léa : -20 % sur ton 1er paiement ». */
export function BandeauParrainage() {
  const prenom = useInvitation();
  if (!prenom) return null;
  return <p className="bandeau-parrainage" role="status"><Gift aria-hidden /><span>Invité par <b>{prenom}</b> : -20 % sur ton 1er paiement</span></p>;
}
