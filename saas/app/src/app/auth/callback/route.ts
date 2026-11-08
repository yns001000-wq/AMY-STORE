import { NextResponse } from "next/server";
import { supabaseServeur } from "@/lib/supabase/serveur";

/** Retour du lien de confirmation d'e-mail : ouvre la session puis redirige vers l'espace. */
export async function GET(req: Request) {
  const url = new URL(req.url), code = url.searchParams.get("code");
  const suite = url.searchParams.get("suite")?.startsWith("/espace") ? url.searchParams.get("suite")! : "/espace";
  if (code) {
    const sb = await supabaseServeur();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(suite, url.origin));
  }
  return NextResponse.redirect(new URL("/connexion?erreur=lien", url.origin));
}
