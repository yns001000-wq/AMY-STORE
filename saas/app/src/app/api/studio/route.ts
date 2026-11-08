import { NextResponse } from "next/server";
import { contexteStudio, photosDuCommerce } from "@/lib/studio/serveur";
import { FAMILLES, poserPhotosCommerce, siteExpress } from "@/lib/studio";
import { ajouterJournal } from "@/lib/pipeline";

const CHAMPS_PROSPECT = "id, nom, metier, ville, code_postal, adresse, telephone, email, indices, notes, statut, journal";

/** Maquette express (sans IA) pour un prospect de l'utilisateur. Toutes les offres. */
export async function POST(req: Request) {
  const ctx = await contexteStudio();
  if ("erreur" in ctx) return ctx.erreur;
  const { session, cap, plan } = ctx;
  const { prospect_id, famille } = (await req.json().catch(() => ({}))) as { prospect_id?: string; famille?: string };
  if (!prospect_id) return NextResponse.json({ erreur: "Requête invalide" }, { status: 400 });
  const { data: p } = await session.sb.from("prospects").select(CHAMPS_PROSPECT).eq("id", prospect_id).maybeSingle();
  if (!p) return NextResponse.json({ erreur: "Prospect introuvable" }, { status: 404 });
  const { count } = await session.sb.from("sites").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= cap.sitesMax) return NextResponse.json({ erreur: `Votre offre conserve ${cap.sitesMax} sites : supprimez-en un ou passez à l'offre supérieure.`, plan }, { status: 402 });
  const donnees = poserPhotosCommerce(siteExpress(p, famille && FAMILLES[famille] ? famille : undefined), await photosDuCommerce(session.sb, cap, p.id));
  const { data: site, error } = await session.sb.from("sites").insert({ user_id: session.user.id, prospect_id: p.id, type: "express", donnees }).select("id").single();
  if (error || !site) return NextResponse.json({ erreur: "Création impossible" }, { status: 500 });
  await session.sb.from("prospects").update({ journal: ajouterJournal(p.journal, "Maquette express créée dans le Studio") }).eq("id", p.id);
  return NextResponse.json({ id: site.id });
}
