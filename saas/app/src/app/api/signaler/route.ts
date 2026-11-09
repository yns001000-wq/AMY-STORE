import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MOTIFS_SIGNALEMENT } from "@/lib/conformite";
import { envoyerEmail } from "@/lib/email";

/** Signalement d'un contenu illicite sur un site publié avec MySite (DSA, art. 16 ; LCEN, art. 6). Ouvert à tous, sans compte. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const txt = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").trim().slice(0, n);
  const url = txt(b.url, 500), motif = txt(b.motif, 20), description = txt(b.description, 3000), email = txt(b.email, 200), nom = txt(b.nom, 120);
  if (!url || !MOTIFS_SIGNALEMENT.some(([k]) => k === motif) || description.length < 10) return NextResponse.json({ erreur: "Indiquez l'adresse de la page, le motif et une explication (10 caractères au moins)." }, { status: 400 });
  if (b.bonne_foi !== true) return NextResponse.json({ erreur: "Confirmez que votre signalement est exact et de bonne foi." }, { status: 400 });
  if (b.site_web) return NextResponse.json({ ok: true }); // champ piège anti-robots
  const { data, error } = await supabaseAdmin().from("signalements").insert({ url, motif, description, email: email || null, nom: nom || null, bonne_foi: true }).select("id").single();
  if (error) return NextResponse.json({ erreur: "Enregistrement impossible, réessayez." }, { status: 500 });
  if (process.env.CONTACT_EMAIL) await envoyerEmail(process.env.CONTACT_EMAIL, `Signalement ${motif} : ${url}`, `${description}\n\nDe : ${nom || "anonyme"} ${email}\nRéférence : ${data.id}`);
  if (email) await envoyerEmail(email, "Nous avons bien reçu votre signalement", `Bonjour,\n\nVotre signalement concernant ${url} a bien été reçu (référence ${data.id}). Nous l'examinons et vous informerons de la décision prise.\n\nMySite`);
  return NextResponse.json({ ok: true, reference: data.id });
}
