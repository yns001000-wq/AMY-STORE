import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { urlSite } from "@/lib/email";
import { anneeParis, compteurs, lienParrainage, nomAffiche, type StatutParrainage, type TypeRecompense } from "@/lib/parrainage";
import { assurerCode } from "@/lib/parrainage-serveur";
import { VueParrainage } from "@/components/VueParrainage";

export const metadata = { title: "Parrainage" };
export const dynamic = "force-dynamic";

export default async function Parrainage() {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion?suite=/espace/parrainage");
  const admin = supabaseAdmin();
  const { data: profil } = await admin.from("profils").select("prenom, stripe_customer_id, pro_offert_jusqu").eq("id", session.user.id).single();
  const code = await assurerCode(session.user.id, profil?.prenom as string | null);
  const [{ data: liste }, { data: recs }] = await Promise.all([
    admin.from("parrainages").select("id, filleul_id, statut, periode, cree_le").eq("parrain_id", session.user.id).order("cree_le", { ascending: false }).limit(200),
    admin.from("recompenses_parrainage").select("parrainage_id, type, montant_centimes, annee, statut").eq("parrain_id", session.user.id).limit(500),
  ]);
  const ids = (liste ?? []).map((l) => l.filleul_id as string);
  const { data: prenoms } = ids.length ? await admin.from("profils").select("id, prenom").in("id", ids) : { data: [] };
  const prenomDe = new Map((prenoms ?? []).map((p) => [p.id as string, p.prenom as string | null]));
  const recDe = new Map((recs ?? []).map((r) => [r.parrainage_id as string, r]));
  const total = (liste ?? []).length;
  const filleuls = (liste ?? []).map((l, i) => {
    const r = recDe.get(l.id as string);
    return {
      nom: nomAffiche(prenomDe.get(l.filleul_id as string), total - i), statut: l.statut as StatutParrainage, periode: (l.periode as "mensuel" | "annuel" | null) ?? null,
      recompense: (r?.type as TypeRecompense | undefined) ?? null, creditCentimes: r?.type === "credit" ? (r.montant_centimes as number) : 0,
      depuis: new Date(l.cree_le as string).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }),
    };
  });
  // Crédit restant : solde client Stripe (négatif = crédit en faveur de l'abonné).
  let creditRestant = 0;
  if (profil?.stripe_customer_id) {
    const c = await stripe().customers.retrieve(profil.stripe_customer_id as string).catch(() => null);
    if (c && !c.deleted && c.balance < 0) creditRestant = -c.balance;
  }
  const annee = anneeParis(new Date());
  return (
    <VueParrainage d={{
      lien: lienParrainage(urlSite() || "https://mysite-app.com", code), code, filleuls, compteurs: compteurs(filleuls),
      creditRestantCentimes: creditRestant,
      recompensesAnnee: (recs ?? []).filter((r) => r.annee === annee && (r.type === "credit" || r.type === "pro_offert")).length,
      proOffertJusquau: (profil?.pro_offert_jusqu as string | null) ?? null,
    }} />
  );
}
