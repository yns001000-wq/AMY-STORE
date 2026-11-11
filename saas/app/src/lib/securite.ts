import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "./supabase/admin";

/** Vérifie l'en-tête « Authorization: Bearer CRON_SECRET » des tâches planifiées, en temps constant. */
export function cronAutorise(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const recu = Buffer.from(req.headers.get("authorization") ?? ""), attendu = Buffer.from(`Bearer ${secret}`);
  return recu.length === attendu.length && timingSafeEqual(recu, attendu);
}

/** Empreinte de l'adresse IP (jamais stockée en clair). */
export function empreinteIP(req: Request): string {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "inconnue";
  return createHash("sha256").update(`${ip}|${process.env.CRON_SECRET ?? "mysite"}`).digest("hex").slice(0, 32);
}

/**
 * Limitation de débit des formulaires publics (migration 0008). Renvoie true si la requête est autorisée.
 * En cas de panne de la base, on laisse passer plutôt que de bloquer un signalement légitime.
 */
export async function limiter(cle: string, max: number, secondes: number): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin().rpc("limiter_requete", { p_cle: cle, p_max: max, p_secondes: secondes });
    return error ? true : data !== false;
  } catch { return true; }
}
