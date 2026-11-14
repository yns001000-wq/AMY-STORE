import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_PARRAIN } from "@/lib/parrainage";
import { parrainDuCode } from "@/lib/parrainage-serveur";

/** Bandeau « Invité par … » : prénom du parrain dont le lien a été suivi (cookie), rien d'autre. */
export async function GET() {
  const code = (await cookies()).get(COOKIE_PARRAIN)?.value;
  const parrain = code ? await parrainDuCode(code).catch(() => null) : null;
  return NextResponse.json(parrain ? { invite: true, prenom: parrain.prenom } : { invite: false }, { headers: { "Cache-Control": "private, no-store" } });
}
