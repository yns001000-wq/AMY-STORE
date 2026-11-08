import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import { echeanceParDefaut, LIGNES_TYPES, totaux } from "@/lib/factures";

/** Crée un brouillon de devis ou de facture (prérempli avec le prospect), puis ouvre l'éditeur. Offres Premium et Ultra. */
export async function POST(req: Request) {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.redirect(new URL("/connexion", req.url), 303);
  const { plan } = await profilEtPlan(session.user.id);
  if (!PLANS[plan].facturation) return NextResponse.redirect(new URL("/espace/factures", req.url), 303);
  const f = await req.formData();
  const type = f.get("type") === "facture" ? "facture" : "devis";
  const prospectId = String(f.get("prospect_id") ?? "") || null;
  const { data: p } = prospectId ? await session.sb.from("prospects").select("id, nom, adresse, code_postal, ville, siret, email").eq("id", prospectId).maybeSingle() : { data: null };
  const { data: e } = await session.sb.from("entreprises").select("tva, taux_tva").maybeSingle();
  const taux = e && e.tva !== "franchise" ? Number(e.taux_tva) || 20 : 0;
  const client = p ? { nom: p.nom, adresse: [p.adresse, [p.code_postal, p.ville].filter(Boolean).join(" ")].filter(Boolean).join(", "), siret: p.siret ?? "", email: p.email ?? "" } : { nom: "" };
  const lignes = type === "devis" ? LIGNES_TYPES : [LIGNES_TYPES[0]];
  const { data: doc, error } = await session.sb.from("documents").insert({
    user_id: session.user.id, prospect_id: p?.id ?? null, type, client, lignes, total_ht: totaux(lignes, taux).ht, taux_tva: taux, date_echeance: echeanceParDefaut(),
  }).select("id").single();
  if (error || !doc) return NextResponse.redirect(new URL("/espace/factures?erreur=creation", req.url), 303);
  return NextResponse.redirect(new URL(`/espace/factures/${doc.id}`, req.url), 303);
}
