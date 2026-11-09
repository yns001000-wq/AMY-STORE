import "server-only";
import { supabaseAdmin } from "./supabase/admin";

type TypeJournal = "resiliation" | "reprise" | "retractation" | "suppression_compte" | "export_donnees" | "rappel_reconduction" | "changement_cgu";

/** Trace une démarche légale (preuve conservée même si le compte est supprimé). */
export async function journaliser(userId: string | null, email: string | null | undefined, type: TypeJournal, details: Record<string, unknown> = {}) {
  await supabaseAdmin().from("journal_conformite").insert({ user_id: userId, email: email ?? null, type, details });
}
