import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client « administrateur » (clé service_role) : contourne les règles RLS.
 * Réservé au serveur pour : webhook Stripe, quotas, liste d'opposition. Ne JAMAIS l'importer dans un composant client.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) throw new Error("Configuration Supabase incomplète (SUPABASE_SERVICE_ROLE_KEY)");
  return createClient(url, cle, { auth: { persistSession: false, autoRefreshToken: false } });
}
