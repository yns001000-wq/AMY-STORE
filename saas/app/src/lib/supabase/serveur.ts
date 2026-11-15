import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

/** Client Supabase côté serveur, au nom de l'utilisateur connecté (les règles RLS s'appliquent). */
export async function supabaseServeur() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    // Session gardée 400 jours (réglage par défaut), renouvelée à chaque visite ; cookie réservé au HTTPS en production.
    cookieOptions: { secure: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://") },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (liste) => {
        try { liste.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* appelé depuis un composant serveur : le proxy rafraîchit la session */ }
      },
    },
  });
}

/**
 * Utilisateur connecté (vérifié auprès de Supabase), ou null.
 * Mis en cache le temps d'un affichage : le menu (layout) et la page partagent la même vérification au lieu d'en faire deux.
 */
export const utilisateurConnecte = cache(async () => {
  const sb = await supabaseServeur();
  const { data } = await sb.auth.getUser();
  return data.user ? { sb, user: data.user } : null;
});
