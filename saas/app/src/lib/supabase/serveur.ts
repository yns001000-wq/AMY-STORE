import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Client Supabase côté serveur, au nom de l'utilisateur connecté (les règles RLS s'appliquent). */
export async function supabaseServeur() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (liste) => {
        try { liste.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* appelé depuis un composant serveur : le proxy rafraîchit la session */ }
      },
    },
  });
}

/** Utilisateur connecté (vérifié auprès de Supabase), ou null. */
export async function utilisateurConnecte() {
  const sb = await supabaseServeur();
  const { data } = await sb.auth.getUser();
  return data.user ? { sb, user: data.user } : null;
}
