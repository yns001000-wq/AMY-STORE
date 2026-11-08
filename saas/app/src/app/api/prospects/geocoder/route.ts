import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";

/** Place sur la carte les prospects sans coordonnées, grâce à la Base Adresse Nationale (api-adresse.data.gouv.fr, service public gratuit). */
export async function POST() {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  const { data } = await session.sb.from("prospects").select("id, adresse, code_postal, ville").is("latitude", null).not("adresse", "is", null).limit(40);
  let places = 0;
  for (const p of data ?? []) {
    const q = new URLSearchParams({ q: `${p.adresse} ${p.ville ?? ""}`.slice(0, 200), limit: "1" });
    if (p.code_postal) q.set("postcode", p.code_postal);
    try {
      const r = await fetch(`https://api-adresse.data.gouv.fr/search/?${q}`, { signal: AbortSignal.timeout(6000) });
      const j = (await r.json()) as { features?: { geometry: { coordinates: [number, number] }; properties: { score: number } }[] };
      const f = j.features?.[0];
      if (f && f.properties.score >= 0.45) {
        const [lon, lat] = f.geometry.coordinates;
        await session.sb.from("prospects").update({ latitude: lat, longitude: lon }).eq("id", p.id);
        places++;
      }
    } catch { /* adresse suivante */ }
  }
  const { count } = await session.sb.from("prospects").select("id", { count: "exact", head: true }).is("latitude", null);
  return NextResponse.json({ places, restants: count ?? 0 });
}
