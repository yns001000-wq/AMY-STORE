import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { consommer, profilEtPlan, rembourser } from "@/lib/quotas";
import { anthropic, consigneMessage, type Canal } from "@/lib/ia";
import { ajouterJournal } from "@/lib/pipeline";
import { MODELE_IA } from "@/lib/plans";

/** Rédige un message de prospection pour UN prospect de l'utilisateur (quota messages_ia). */
export async function POST(req: Request) {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  const { id, canal } = (await req.json().catch(() => ({}))) as { id?: string; canal?: Canal };
  if (!id || !["sms", "email", "appel"].includes(canal ?? "")) return NextResponse.json({ erreur: "Requête invalide" }, { status: 400 });
  // Lecture via le client de l'utilisateur : RLS garantit qu'il s'agit de SON prospect.
  const { data: p } = await session.sb.from("prospects").select("nom, metier, ville, indices, notes, statut, journal").eq("id", id).single();
  if (!p) return NextResponse.json({ erreur: "Prospect introuvable" }, { status: 404 });
  if (p.statut === "refus") return NextResponse.json({ erreur: "Ce prospect ne souhaite plus être contacté." }, { status: 409 });

  const { profil, plan, essai } = await profilEtPlan(session.user.id);
  if (!(await consommer(session.user.id, plan, "messages_ia", 1, essai))) return NextResponse.json({ erreur: "quota", plan }, { status: 402 });
  const rendre = () => rembourser(session.user.id, "messages_ia");

  const expediteur = `${(profil.prenom as string) || "[votre prénom]"}, création de sites internet pour les commerçants et artisans`;
  try {
    const rep = await anthropic().beta.messages.create({
      model: MODELE_IA.message,
      max_tokens: 1500, // un message, un e-mail ou un script d'appel tient largement ; plafonne aussi le coût (voir COUT_MAX_IA)
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content: consigneMessage(p, canal!, expediteur) }],
    });
    if (rep.stop_reason === "refusal") { await rendre(); return NextResponse.json({ erreur: "L'IA n'a pas pu rédiger ce message." }, { status: 422 }); }
    const texte = rep.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
    if (!texte) { await rendre(); return NextResponse.json({ erreur: "Réponse vide, réessayez." }, { status: 502 }); }
    await session.sb.from("prospects").update({ journal: ajouterJournal(p.journal, `Message IA préparé (${canal})`) }).eq("id", id);
    return NextResponse.json({ texte });
  } catch (e) {
    await rendre();
    if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ erreur: "Trop de demandes : réessayez dans une minute." }, { status: 429 });
    if (e instanceof Anthropic.APIError) return NextResponse.json({ erreur: "Le service d'IA est indisponible pour le moment." }, { status: 502 });
    throw e;
  }
}
