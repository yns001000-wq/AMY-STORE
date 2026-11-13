import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { retirerDomaine } from "@/lib/vercel";
import { journaliser } from "@/lib/journal";
import { envoyerEmail } from "@/lib/email";

/**
 * Droit à l'effacement (RGPD, art. 17) : suppression définitive du compte et de ses données.
 * L'abonnement est arrêté, les sites publiés sont retirés, les photos supprimées, puis le compte (suppression en cascade).
 * Les factures émises par MySite restent chez Stripe (obligation comptable de 10 ans) ; une trace de la demande est conservée.
 */
export async function POST(req: Request) {
  const session = await utilisateurConnecte();
  if (!session) return NextResponse.json({ erreur: "Non connecté" }, { status: 401 });
  const { confirmation } = (await req.json().catch(() => ({}))) as { confirmation?: string };
  if (confirmation !== "SUPPRIMER") return NextResponse.json({ erreur: "Tapez SUPPRIMER pour confirmer." }, { status: 400 });
  const admin = supabaseAdmin(), uid = session.user.id, email = session.user.email;
  const { data: p } = await admin.from("profils").select("stripe_subscription_id").eq("id", uid).single();
  if (p?.stripe_subscription_id) { try { await stripe().subscriptions.cancel(p.stripe_subscription_id, { prorate: false }); } catch { /* déjà arrêté */ } }
  const { data: pubs } = await admin.from("publications").select("domaine").eq("user_id", uid);
  for (const x of pubs ?? []) if (x.domaine) await retirerDomaine(x.domaine);
  const st = admin.storage.from("studio");
  const { data: fichiers } = await st.list(uid, { limit: 1000 });
  if (fichiers?.length) await st.remove(fichiers.map((f) => `${uid}/${f.name}`));
  await journaliser(uid, email, "suppression_compte", { abonnement_arrete: !!p?.stripe_subscription_id, sites_retires: pubs?.length ?? 0 });
  const { error } = await admin.auth.admin.deleteUser(uid);
  if (error) return NextResponse.json({ erreur: "Suppression impossible pour le moment : contactez-nous." }, { status: 500 });
  await envoyerEmail(email ?? "", "👋 Ton compte MySite a été supprimé", {
    emoji: "👋", titre: "Ton compte a bien été supprimé",
    paragraphes: [
      "Ton compte MySite et ses données ont été supprimés, comme demandé.",
      "Tes factures d'abonnement restent conservées par notre prestataire de paiement, pour les obligations comptables.",
      "Merci d'avoir essayé MySite. Si tu veux revenir un jour, tu seras le bienvenu. 💜",
    ],
  });
  return NextResponse.json({ ok: true });
}
