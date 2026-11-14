import { NextResponse } from "next/server";
import { cronAutorise } from "@/lib/securite";
import { passageQuotidien } from "@/lib/parrainage-serveur";

export const maxDuration = 120;

/**
 * Tâche quotidienne du parrainage (Vercel Cron, en-tête Authorization: Bearer CRON_SECRET) :
 * valide les filleuls annuels 14 jours après leur paiement (sans rétractation, remboursement, litige ni résiliation)
 * et relance les crédits restés en attente après une erreur passagère de Stripe.
 */
export async function GET(req: Request) {
  if (!cronAutorise(req)) return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  return NextResponse.json(await passageQuotidien());
}
