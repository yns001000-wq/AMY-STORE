"use server";
import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { secteurParId } from "@/lib/secteurs";
import { DEPARTEMENTS } from "@/lib/departements";
import { envoyerEmail, signature } from "@/lib/email";
import { offrePayante } from "@/lib/croissance";

export async function enregistrerAccueil(form: FormData) {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const secteur = String(form.get("secteur")), statut = String(form.get("statut"));
  const codes = new Set(DEPARTEMENTS.map((d) => d[0]));
  // Le premier département (liste déroulante) reste en tête : c'est celui utilisé par l'offre Gratuite.
  const departements = [...new Set(form.getAll("departements").map(String).filter((d) => codes.has(d)))].slice(0, 100);
  if (!secteurParId(secteur) || !departements.length || !["professionnel", "particulier"].includes(statut) || form.get("cgu") !== "oui") {
    redirect("/espace/bienvenue?erreur=1");
  }
  const { data: avant } = await session.sb.from("profils").select("cgu_acceptees_le, offre_voulue").eq("id", session.user.id).single();
  const premiere = !avant?.cgu_acceptees_le;
  const prenom = String(form.get("prenom") ?? "").slice(0, 60) || null;
  const { error } = await session.sb.from("profils").update({
    prenom, secteur, departements, statut_utilisateur: statut, ...(premiere ? { cgu_acceptees_le: new Date().toISOString() } : {}),
  }).eq("id", session.user.id);
  if (error) redirect("/espace/bienvenue?erreur=2");
  if (!premiere) redirect("/espace");
  // E-mail de bienvenue (message de service : accès au compte et premiers pas). Sans effet si l'envoi d'e-mails n'est pas configuré.
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await envoyerEmail(session.user.email ?? "", "Bienvenue sur MySite : vos 3 premiers pas",
    `Bonjour${prenom ? ` ${prenom}` : ""},\n\nVotre cockpit est prêt : ${site}/espace\n\nVos 3 premiers pas :\n1. Trouvez vos premiers commerces (un clic sur le tableau de bord).\n2. Ouvrez une fiche : le premier message est rédigé pour ce commerce.\n3. Créez une maquette de site à son nom, à lui montrer.\n\nL'Académie (dans le menu) explique comment vendre un site, étape par étape.\n\nVotre offre Gratuite n'a pas de limite de durée. Vous pouvez essayer Premium pendant 7 jours, sans carte bancaire, depuis « Mon abonnement ».${signature()}`);
  redirect(offrePayante(avant?.offre_voulue) ? `/espace/abonnement?offre=${avant!.offre_voulue}` : "/espace?bienvenue=1");
}
