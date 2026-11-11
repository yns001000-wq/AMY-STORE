import { NextResponse } from "next/server";
import { cronAutorise } from "@/lib/securite";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mailEssaiDu } from "@/lib/croissance";
import { envoyerEmail, signature } from "@/lib/email";

/**
 * À appeler une fois par jour (Vercel Cron, en-tête Authorization: Bearer CRON_SECRET).
 * Informe de la fin de l'essai Premium : 2 jours avant, puis le jour de la fin. Deux e-mails au plus par compte,
 * désactivables dans « Mon compte ». Aucun prélèvement n'est lié à l'essai : les messages le rappellent.
 */
export async function GET(req: Request) {
  if (!cronAutorise(req)) return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  const admin = supabaseAdmin(), site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const depuis = new Date(Date.now() - 4 * 86400000).toISOString();
  const { data } = await admin.from("profils").select("id, prenom, plan, essai_fin, emails_essai, mail_essai_j2_le, mail_essai_fin_le").eq("plan", "gratuit").eq("emails_essai", true).gt("essai_fin", depuis).limit(5000);
  let envoyes = 0;
  for (const p of data ?? []) {
    const fin = new Date(p.essai_fin as string);
    const type = mailEssaiDu({ plan: p.plan, essaiFin: fin, emailsEssai: p.emails_essai, j2EnvoyeLe: p.mail_essai_j2_le ? new Date(p.mail_essai_j2_le) : null, finEnvoyeLe: p.mail_essai_fin_le ? new Date(p.mail_essai_fin_le) : null });
    if (!type) continue;
    const { data: u } = await admin.auth.admin.getUserById(p.id);
    const email = u?.user?.email; if (!email) continue;
    const bonjour = `Bonjour${p.prenom ? ` ${p.prenom}` : ""},\n\n`;
    const pied = `\n\nVous recevez ce message parce que vous avez démarré un essai Premium. Pour ne plus recevoir ces informations : ${site}/espace/compte${signature()}`;
    const jour = fin.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" });
    const ok = type === "j2"
      ? await envoyerEmail(email, "Votre essai Premium MySite se termine bientôt",
        `${bonjour}Votre essai Premium se termine le ${jour}.\n\nSans action de votre part, votre compte repasse en offre Gratuite : aucun prélèvement, et vos prospects, sites et messages restent accessibles.\n\nPour garder les sites sur mesure, les 1 000 prospects par mois et les devis et factures, choisissez une offre ici : ${site}/espace/abonnement\nLes offres sont sans engagement et résiliables en ligne à tout moment.${pied}`)
      : await envoyerEmail(email, "Votre essai Premium MySite est terminé",
        `${bonjour}Votre essai Premium est terminé : votre compte est repassé en offre Gratuite, sans aucun prélèvement.\n\nTout ce que vous avez créé reste dans votre cockpit : ${site}/espace\n\nSi vous voulez retrouver les fonctions Premium ou choisir l'offre Pro, c'est ici : ${site}/espace/abonnement${pied}`);
    if (!ok) continue;
    await admin.from("profils").update(type === "j2" ? { mail_essai_j2_le: new Date().toISOString() } : { mail_essai_fin_le: new Date().toISOString() }).eq("id", p.id);
    envoyes++;
  }
  return NextResponse.json({ envoyes });
}
