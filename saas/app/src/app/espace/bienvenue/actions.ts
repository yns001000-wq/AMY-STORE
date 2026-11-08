"use server";
import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { secteurParId } from "@/lib/secteurs";
import { DEPARTEMENTS } from "@/lib/departements";

export async function enregistrerAccueil(form: FormData) {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const secteur = String(form.get("secteur")), statut = String(form.get("statut"));
  const codes = new Set(DEPARTEMENTS.map((d) => d[0]));
  const departements = form.getAll("departements").map(String).filter((d) => codes.has(d)).slice(0, 100);
  if (!secteurParId(secteur) || !departements.length || !["professionnel", "particulier"].includes(statut) || form.get("cgu") !== "oui") {
    redirect("/espace/bienvenue?erreur=1");
  }
  const { error } = await session.sb.from("profils").update({
    prenom: String(form.get("prenom") ?? "").slice(0, 60) || null, secteur, departements, statut_utilisateur: statut, cgu_acceptees_le: new Date().toISOString(),
  }).eq("id", session.user.id);
  if (error) redirect("/espace/bienvenue?erreur=2");
  redirect("/espace?bienvenue=1");
}
