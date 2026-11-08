"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { utilisateurConnecte } from "./supabase/serveur";
import { ajouterJournal, estEtape, etape } from "./pipeline";

/** Toutes ces actions passent par le client de l'utilisateur : les règles RLS garantissent qu'il ne touche qu'à SES prospects. */
async function prospect(id: string) {
  const s = await utilisateurConnecte();
  if (!s) redirect("/connexion");
  const { data } = await s.sb.from("prospects").select("id, statut, journal").eq("id", id).single();
  if (!data) redirect("/espace");
  return { sb: s.sb, p: data };
}

export async function changerStatut(form: FormData) {
  const id = String(form.get("id")), statut = String(form.get("statut"));
  if (!estEtape(statut)) return;
  const { sb, p } = await prospect(id);
  if (p.statut === statut) return;
  await sb.from("prospects").update({ statut, journal: ajouterJournal(p.journal, `Étape : ${etape(statut).nom}`) }).eq("id", id);
  revalidatePath("/espace", "layout");
}

export async function enregistrerSuivi(form: FormData) {
  const id = String(form.get("id"));
  const { sb } = await prospect(id);
  const date = String(form.get("date_prochaine_action") ?? "");
  await sb.from("prospects").update({
    prochaine_action: String(form.get("prochaine_action") ?? "").slice(0, 200) || null,
    date_prochaine_action: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    telephone: String(form.get("telephone") ?? "").slice(0, 30) || null,
    email: String(form.get("email") ?? "").slice(0, 120) || null,
    notes: String(form.get("notes") ?? "").slice(0, 5000) || null,
  }).eq("id", id);
  revalidatePath(`/espace/prospects/${id}`);
}

export async function noterEchange(form: FormData) {
  const id = String(form.get("id")), texte = String(form.get("texte") ?? "").trim();
  if (!texte) return;
  const { sb, p } = await prospect(id);
  await sb.from("prospects").update({ journal: ajouterJournal(p.journal, texte) }).eq("id", id);
  revalidatePath(`/espace/prospects/${id}`);
}

/** Supprime le prospect : l'entreprise redevient disponible pour les autres utilisateurs (déclencheur SQL). */
export async function supprimerProspect(form: FormData) {
  const id = String(form.get("id"));
  const { sb } = await prospect(id);
  await sb.from("prospects").delete().eq("id", id);
  revalidatePath("/espace", "layout");
  redirect("/espace");
}
