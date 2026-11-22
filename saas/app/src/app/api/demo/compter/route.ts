import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { empreinteIP, limiter } from "@/lib/securite";
import { compterDemo, departementDuCp, type ResultatDemo } from "@/lib/demo";

export const maxDuration = 60;
const JOUR = 86400000;

/**
 * Démo publique (sans inscription) : nombre d'entreprises à démarcher dans un code postal. Aucune donnée personnelle renvoyée
 * (voir lib/demo.ts). Limitée à 15 recherches par heure et par connexion ; résultats gardés 24 h par code postal.
 */
export async function POST(req: Request) {
  const corps = await req.json().catch(() => ({}));
  const cp = String((corps as { cp?: unknown }).cp ?? "").replace(/\s/g, "");
  if (!/^\d{5}$/.test(cp)) return NextResponse.json({ erreur: "Indiquez un code postal à 5 chiffres." }, { status: 400 });
  if (!departementDuCp(cp)) return NextResponse.json({ erreur: "La démo couvre la France métropolitaine pour l'instant." }, { status: 400 });
  if (!(await limiter(`demo:${empreinteIP(req)}`, 15, 3600))) return NextResponse.json({ erreur: "Trop de recherches depuis cette connexion. Réessayez dans une heure, ou créez votre compte gratuit." }, { status: 429 });

  const admin = supabaseAdmin();
  // Cache 24 h (si la table n'existe pas encore, on calcule sans cache).
  const { data: cache } = await admin.from("demo_cache").select("resultat, cree_le").eq("code_postal", cp).maybeSingle();
  if (cache && Date.now() - new Date(cache.cree_le as string).getTime() < JOUR) return NextResponse.json(cache.resultat as ResultatDemo);

  const { data: opp } = await admin.from("opposition").select("siren, siret");
  const opposition = { sirens: new Set((opp ?? []).map((x) => x.siren).filter(Boolean) as string[]), sirets: new Set((opp ?? []).map((x) => x.siret).filter(Boolean) as string[]) };
  try {
    const r = await compterDemo({ cp, opposition });
    await admin.from("demo_cache").upsert({ code_postal: cp, resultat: r, cree_le: new Date().toISOString() });
    return NextResponse.json(r);
  } catch (e) {
    console.error("Démo : registre indisponible", e instanceof Error ? e.message : e);
    // Jamais de chiffre inventé : un message clair, et le visiteur peut réessayer.
    return NextResponse.json({ erreur: "Le registre officiel des entreprises ne répond pas pour le moment. Réessayez dans quelques minutes." }, { status: 503 });
  }
}
