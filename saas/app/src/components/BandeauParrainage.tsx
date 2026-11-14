"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift } from "lucide-react";
import { COOKIE_PARRAIN, normaliserCode } from "@/lib/parrainage";

interface Invitation { prenom: string; code: string; garde: boolean }

/**
 * Invitation en cours : code du lien suivi (?ref=CODE, rien n'est stocké) ou invitation gardée (cookie déposé après accord du visiteur).
 * Le code suit le visiteur jusqu'à l'inscription par les liens de la page, sans cookie.
 */
export function useInvitation(): Invitation | null {
  const [inv, setInv] = useState<Invitation | null>(null);
  useEffect(() => {
    const ref = normaliserCode(new URLSearchParams(window.location.search).get("ref"));
    const garde = document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE_PARRAIN}=`));
    if (!ref && !garde) return;
    fetch(`/api/parrainage/invitation${ref ? `?code=${encodeURIComponent(ref)}` : ""}`).then((r) => r.json()).then((j) => {
      if (!j.invite) return;
      setInv({ prenom: j.prenom, code: j.code, garde: !!j.garde });
      // Le code accompagne les liens d'inscription de la page (comme la provenance « ?src= ») : aucun stockage.
      document.querySelectorAll<HTMLAnchorElement>('a[href^="/connexion"]').forEach((a) => {
        const u = new URL(a.href);
        if (!u.searchParams.has("ref")) { u.searchParams.set("ref", j.code); a.href = u.pathname + u.search; }
      });
    }).catch(() => {});
  }, []);
  return inv;
}

/** Bandeau discret sur le site public : « Invité par Léa : -20 % sur ton 1er paiement », avec le choix de garder l'invitation 30 jours. */
export function BandeauParrainage() {
  const inv = useInvitation();
  const [garde, setGarde] = useState<boolean | null>(null);
  if (!inv) return null;
  const estGarde = garde ?? inv.garde;
  async function garder(oui: boolean) {
    const r = await fetch("/api/parrainage/invitation", { method: oui ? "POST" : "DELETE", headers: { "Content-Type": "application/json" }, body: oui ? JSON.stringify({ code: inv!.code }) : undefined });
    if (r.ok) setGarde(oui);
  }
  return (
    <div className="bandeau-parrainage" role="status">
      <p><Gift aria-hidden /><span>Invité par <b>{inv.prenom}</b> : -20 % sur ton 1er paiement (nouveau compte)</span></p>
      {estGarde
        ? <p className="bandeau-choix">Invitation gardée 30 jours sur cet appareil. <button type="button" onClick={() => garder(false)}>Retirer</button></p>
        : <p className="bandeau-choix"><button type="button" className="garder" onClick={() => garder(true)}>Garder mon invitation 30 jours</button> <span>(un cookie avec le code de ton parrain, <Link href="/confidentialite">en savoir plus</Link>)</span></p>}
    </div>
  );
}
