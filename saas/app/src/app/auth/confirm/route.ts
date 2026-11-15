import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServeur } from "@/lib/supabase/serveur";

/** Où mène chaque lien reçu par e-mail, une fois vérifié. */
const SUITE: Record<string, string> = {
  signup: "/espace/bienvenue", email: "/espace/bienvenue", invite: "/espace/bienvenue",
  recovery: "/espace/compte/mot-de-passe", email_change: "/espace/compte", magiclink: "/espace",
};

/**
 * Liens des e-mails (confirmation d'inscription, mot de passe oublié, changement d'adresse…), vérifiés par jeton.
 * Contrairement à l'échange de code (/auth/callback), ce lien fonctionne dans n'importe quel navigateur : sur téléphone,
 * l'appli de messagerie (Gmail, Mail…) l'ouvre souvent dans un autre navigateur que celui de l'inscription.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash"), type = url.searchParams.get("type") as EmailOtpType | null;
  if (token_hash && type && SUITE[type]) {
    const sb = await supabaseServeur();
    const { error } = await sb.auth.verifyOtp({ token_hash, type });
    if (!error) return NextResponse.redirect(new URL(SUITE[type], url.origin));
  }
  return NextResponse.redirect(new URL("/connexion?erreur=lien", url.origin));
}
