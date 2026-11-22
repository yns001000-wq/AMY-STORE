import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { jetonValide } from "@/lib/relances";

/**
 * Désinscription des e-mails de relance, sans connexion : lien signé présent dans chaque e-mail.
 * GET : clic sur le lien (page de confirmation). POST : désinscription « en un clic » des messageries (RFC 8058).
 */
async function desinscrire(req: Request): Promise<boolean> {
  const u = new URL(req.url), id = u.searchParams.get("u") ?? "", t = u.searchParams.get("t") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(id) || !jetonValide(id, t)) return false;
  const { error } = await supabaseAdmin().from("profils").update({ relances_desinscrit: true }).eq("id", id);
  return !error;
}

const page = (ok: boolean) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Désinscription · MySite</title>
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f4f2ff;color:#0f1222;display:grid;place-items:center;min-height:100vh;padding:16px}main{background:#fff;border-radius:20px;padding:28px;max-width:460px;box-shadow:0 12px 32px -12px rgba(43,48,90,.25)}a{color:#6d4aff}</style></head>
<body><main>${ok
  ? "<h1>C'est noté ✅</h1><p>Tu ne recevras plus les e-mails de conseils et de relance de MySite. Les e-mails liés à ton compte (mot de passe, abonnement, factures) restent envoyés, car ils sont nécessaires au service.</p>"
  : "<h1>Lien invalide</h1><p>Ce lien de désinscription est incomplet ou a été modifié. Écris-nous depuis l'adresse de ton compte (voir les <a href=\"/mentions-legales\">mentions légales</a>) et nous te désinscrirons.</p>"}
<p><a href="/">Retour à MySite</a></p></main></body></html>`;

export async function GET(req: Request) {
  const ok = await desinscrire(req);
  return new NextResponse(page(ok), { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const ok = await desinscrire(req);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
