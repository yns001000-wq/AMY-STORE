"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServeur } from "@/lib/supabase/serveur";

const sur = (s: FormDataEntryValue | null) => (typeof s === "string" && s.startsWith("/espace") ? s : "/espace");

export async function seConnecter(form: FormData) {
  const sb = await supabaseServeur();
  const { error } = await sb.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("mdp")) });
  if (error) redirect("/connexion?erreur=identifiants");
  redirect(sur(form.get("suite")));
}

export async function sInscrire(form: FormData) {
  const mdp = String(form.get("mdp"));
  if (mdp.length < 10) redirect("/connexion?mode=inscription&erreur=mdp");
  const origine = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const sb = await supabaseServeur();
  const { error } = await sb.auth.signUp({ email: String(form.get("email")), password: mdp, options: { emailRedirectTo: `${origine}/auth/callback?suite=/espace/bienvenue` } });
  if (error) redirect("/connexion?mode=inscription&erreur=inscription");
  redirect("/connexion?verifier=1");
}

export async function seDeconnecter() {
  const sb = await supabaseServeur();
  await sb.auth.signOut();
  redirect("/");
}
