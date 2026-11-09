import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { rappelReconductionDu } from "@/lib/conformite";
import { envoyerEmail, signature } from "@/lib/email";
import { journaliser } from "@/lib/journal";
import { PLANS, estPlan } from "@/lib/plans";

/**
 * À appeler une fois par jour (Vercel Cron, en-tête Authorization: Bearer CRON_SECRET).
 * Informe les abonnés annuels de la reconduction, entre 3 mois et 1 mois avant l'échéance (art. L215-1 du Code de la consommation).
 */
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  const admin = supabaseAdmin();
  const { data } = await admin.from("profils").select("id, plan, periode, periode_fin, resiliation_prevue, rappel_reconduction_pour").eq("periode", "annuel").not("periode_fin", "is", null).limit(5000);
  let envoyes = 0;
  for (const p of data ?? []) {
    const fin = new Date(p.periode_fin as string);
    if (!rappelReconductionDu({ periode: p.periode, finPeriode: fin, resiliationPrevue: p.resiliation_prevue, rappelEnvoyePour: p.rappel_reconduction_pour ? new Date(p.rappel_reconduction_pour) : null })) continue;
    const { data: u } = await admin.auth.admin.getUserById(p.id);
    const email = u?.user?.email; if (!email) continue;
    const P = estPlan(p.plan) ? PLANS[p.plan] : null;
    const ok = await envoyerEmail(email, "Votre abonnement MySite sera renouvelé",
      `Bonjour,\n\nVotre abonnement annuel MySite ${P?.nom ?? ""} sera renouvelé automatiquement le ${fin.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}${P ? `, pour ${P.prixAnnuel} € TTC` : ""}.\n\nVous pouvez l'arrêter sans frais avant cette date : rubrique « Mon abonnement », bouton « Résilier mon abonnement » (${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/resilier).${signature()}`);
    if (!ok) continue;
    await admin.from("profils").update({ rappel_reconduction_pour: fin.toISOString() }).eq("id", p.id);
    await journaliser(p.id, email, "rappel_reconduction", { echeance: fin.toISOString() });
    envoyes++;
  }
  return NextResponse.json({ envoyes });
}
