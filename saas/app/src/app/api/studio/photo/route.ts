import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { contexteStudio } from "@/lib/studio/serveur";

const TYPES: Record<string, { ext: string; signature: (b: Uint8Array) => boolean }> = {
  "image/jpeg": { ext: "jpg", signature: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", signature: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/webp": { ext: "webp", signature: (b) => String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP" },
};

/**
 * Envoi d'une photo fournie par le client (offres Premium et Ultra). 5 Mo maximum, JPEG, PNG ou WebP.
 * Champs facultatifs : garder=1 (l'ajouter à la banque personnelle), portee (commerce | tous), prospect_id, legende.
 */
export async function POST(req: Request) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const { session, cap, plan } = ctx;
  if (!cap.photosPerso) return NextResponse.json({ erreur: "L'envoi de vos propres photos est inclus dès l'offre Premium.", plan }, { status: 402 });
  const form = await req.formData().catch(() => null);
  const f = form?.get("photo");
  if (!(f instanceof File)) return NextResponse.json({ erreur: "Aucune photo reçue" }, { status: 400 });
  const t = TYPES[f.type];
  if (!t || f.size > 5 * 1024 * 1024) return NextResponse.json({ erreur: "Photo JPEG, PNG ou WebP de 5 Mo maximum." }, { status: 400 });
  const octets = new Uint8Array(await f.arrayBuffer());
  if (!t.signature(octets)) return NextResponse.json({ erreur: "Fichier image invalide." }, { status: 400 });

  // Rangement dans la banque : vérifié AVANT l'envoi pour ne rien stocker inutilement.
  const garder = form?.get("garder") === "1" && cap.banquePerso > 0;
  let prospectId: string | null = String(form?.get("prospect_id") ?? "") || null;
  if (prospectId) {
    const { data: pr } = await session.sb.from("prospects").select("id").eq("id", prospectId).maybeSingle(); // RLS : uniquement ses prospects
    if (!pr) prospectId = null;
  }
  const portee = form?.get("portee") === "tous" || !prospectId ? "tous" : "commerce";
  const legende = String(form?.get("legende") ?? "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 120);
  let avertissement: string | undefined;
  if (garder) {
    const { count } = await session.sb.from("photos_perso").select("id", { count: "exact", head: true });
    if ((count ?? 0) >= cap.banquePerso) avertissement = `Votre banque est pleine (${cap.banquePerso} photos) : la photo est utilisée sur ce site mais n'a pas été gardée.`;
  }

  const chemin = `${session.user.id}/${randomUUID()}.${t.ext}`;
  const st = supabaseAdmin().storage.from("studio");
  const { error } = await st.upload(chemin, octets, { contentType: f.type, upsert: false });
  if (error) return NextResponse.json({ erreur: "Envoi impossible pour le moment." }, { status: 500 });
  const url = st.getPublicUrl(chemin).data.publicUrl;
  let photo = null;
  if (garder && !avertissement) {
    const { data } = await session.sb.from("photos_perso").insert({ user_id: session.user.id, prospect_id: prospectId, chemin, url, legende, portee }).select("id, url, legende, portee, prospect_id").single();
    photo = data;
  }
  return NextResponse.json({ url, photo, avertissement });
}
