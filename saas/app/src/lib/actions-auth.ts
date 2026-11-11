"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServeur } from "@/lib/supabase/serveur";
import { nettoyerSource, offrePayante } from "@/lib/croissance";

const sur = (s: FormDataEntryValue | null) => (typeof s === "string" && s.startsWith("/espace") ? s : "/espace");
const origineSite = async () => (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

export async function seConnecter(form: FormData) {
  const sb = await supabaseServeur();
  const { error } = await sb.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("mdp")) });
  if (error) redirect("/connexion?erreur=identifiants");
  redirect(sur(form.get("suite")));
}

export async function sInscrire(form: FormData) {
  const mdp = String(form.get("mdp"));
  const source = nettoyerSource(form.get("src")), offre = offrePayante(form.get("offre"));
  const retour = new URLSearchParams({ mode: "inscription", ...(offre ? { offre } : {}), ...(source ? { src: source } : {}) });
  if (mdp.length < 10) redirect(`/connexion?${retour}&erreur=mdp`);
  const sb = await supabaseServeur();
  const { error } = await sb.auth.signUp({
    email: String(form.get("email")), password: mdp,
    options: { emailRedirectTo: `${await origineSite()}/auth/callback?suite=/espace/bienvenue`, data: { ...(source ? { source } : {}), ...(offre ? { offre } : {}) } },
  });
  if (error) redirect(`/connexion?${retour}&erreur=inscription`);
  redirect("/connexion?verifier=1");
}

/** Mot de passe oublié : envoie un lien. La réponse est la même que l'adresse existe ou non (on ne révèle pas qui est inscrit). */
export async function demanderNouveauMotDePasse(form: FormData) {
  const sb = await supabaseServeur();
  await sb.auth.resetPasswordForEmail(String(form.get("email")), { redirectTo: `${await origineSite()}/auth/callback?suite=/espace/compte/mot-de-passe` });
  redirect("/connexion?mode=oubli&envoye=1");
}

export async function changerMotDePasse(form: FormData) {
  const mdp = String(form.get("mdp"));
  if (mdp.length < 10) redirect("/espace/compte/mot-de-passe?erreur=mdp");
  const sb = await supabaseServeur();
  const { error } = await sb.auth.updateUser({ password: mdp });
  if (error) redirect("/espace/compte/mot-de-passe?erreur=1");
  redirect("/espace/compte?mdp=ok");
}

export async function seDeconnecter() {
  const sb = await supabaseServeur();
  await sb.auth.signOut();
  redirect("/");
}
