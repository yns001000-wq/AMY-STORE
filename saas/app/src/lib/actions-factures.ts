"use server";
import { redirect } from "next/navigation";
import { utilisateurConnecte } from "./supabase/serveur";

const txt = (f: FormData, k: string, n: number) => String(f.get(k) ?? "").replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").trim().slice(0, n);

/** Identité du vendeur (mentions obligatoires des factures). */
export async function enregistrerEntreprise(f: FormData) {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const assujetti = f.get("regime") === "assujetti";
  const taux = Number(String(f.get("taux_tva") ?? "20").replace(",", "."));
  await session.sb.from("entreprises").upsert({
    user_id: session.user.id, nom: txt(f, "nom", 150), siret: txt(f, "siret", 20).replace(/\s/g, ""), adresse: txt(f, "adresse", 250), email: txt(f, "email", 150),
    telephone: txt(f, "telephone", 30), tva: assujetti ? txt(f, "tva", 20).toUpperCase() || "assujetti" : "franchise", taux_tva: assujetti && Number.isFinite(taux) && taux >= 0 && taux <= 30 ? taux : 0,
    iban: txt(f, "iban", 40).toUpperCase(), conditions: txt(f, "conditions", 600), maj_le: new Date().toISOString(),
  });
  redirect("/espace/factures/entreprise?ok=1");
}
