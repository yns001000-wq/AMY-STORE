"use client";
import { useEffect } from "react";
import { normaliserCode } from "@/lib/parrainage";

/**
 * Transmet la provenance du visiteur (« ?src=tiktok », ou « ?ref=tiktok » quand ce n'est pas un code de parrainage) aux liens d'inscription de la page.
 * Rien n'est stocké sur l'appareil : ni cookie, ni stockage local. La valeur n'est enregistrée qu'à la création du compte.
 */
export function Provenance() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const ref = q.get("ref"), refSource = ref && !normaliserCode(ref) ? ref : null;
    const src = (q.get("src") ?? q.get("utm_source") ?? refSource ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
    if (!src) return;
    document.querySelectorAll<HTMLAnchorElement>('a[href^="/connexion"]').forEach((a) => {
      const u = new URL(a.href);
      if (!u.searchParams.has("src")) { u.searchParams.set("src", src); a.href = u.pathname + u.search; }
    });
  }, []);
  return null;
}
