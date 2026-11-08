import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Droit d'opposition (RGPD, art. 21) : une entreprise demande à ne plus être proposée par MySite.
 * Effet immédiat pour TOUS les utilisateurs : retrait des espaces existants et exclusion des recherches futures.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const id = String(form.get("siren_siret") ?? "").replace(/\s/g, "");
  const tel = String(form.get("telephone") ?? "").replace(/[^\d+]/g, "");
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (!/^\d{9}(\d{5})?$/.test(id)) return NextResponse.redirect(new URL("/opposition?erreur=1", site), 303);
  const siren = id.slice(0, 9), siret = id.length === 14 ? id : null;
  const admin = supabaseAdmin();
  await admin.from("opposition").insert({ siren: siret ? null : siren, siret, telephone_hash: tel ? createHash("sha256").update(tel).digest("hex") : null });
  // Retrait immédiat des prospects déjà enregistrés chez les utilisateurs
  if (siret) await admin.from("prospects").delete().eq("siret", siret); else await admin.from("prospects").delete().eq("siren", siren);
  return NextResponse.redirect(new URL("/opposition?ok=1", site), 303);
}
