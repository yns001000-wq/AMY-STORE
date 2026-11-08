import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { enregistrerEntreprise } from "@/lib/actions-factures";

export const metadata = { title: "Mon entreprise" };

export default async function PageEntreprise({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const { ok } = await searchParams;
  const { data: e } = await session.sb.from("entreprises").select("*").maybeSingle();
  const v = (k: string) => (e?.[k] as string | undefined) ?? "";
  return (
    <>
      <Link href="/espace/factures" className="note" style={{ display: "inline-flex", gap: ".3rem", alignItems: "center", textDecoration: "none" }}><ArrowLeft size={16} aria-hidden />Devis et factures</Link>
      <div className="barre-haut" style={{ marginTop: ".6rem" }}><div><p className="note" style={{ margin: "0 0 .3rem" }}>Ces informations figurent sur vos devis et factures</p><h1>Mon entreprise</h1></div></div>
      {ok && <p className="alerte ok">Enregistré. Les documents déjà émis gardent les informations du jour de leur émission.</p>}
      <form action={enregistrerEntreprise} className="carte pile" style={{ maxWidth: "46rem" }}>
        <label>Nom et prénom, ou raison sociale<input name="nom" defaultValue={v("nom")} required placeholder="Ex. Yanis Dupont EI" /></label>
        <p className="note" style={{ margin: "-.4rem 0 0" }}>Entrepreneur individuel : faites suivre votre nom de la mention « EI » ou « entrepreneur individuel ».</p>
        <div className="deux-col">
          <label>SIRET<input name="siret" defaultValue={v("siret")} required inputMode="numeric" pattern="[0-9 ]{14,17}" /></label>
          <label>Téléphone<input name="telephone" defaultValue={v("telephone")} type="tel" /></label>
        </div>
        <label>Adresse<input name="adresse" defaultValue={v("adresse")} required /></label>
        <label>E-mail<input name="email" defaultValue={v("email")} type="email" /></label>
        <fieldset className="choix" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 700, marginBottom: ".5rem" }}>TVA</legend>
          <label><input type="radio" name="regime" value="franchise" defaultChecked={!e || e.tva === "franchise"} />Franchise en base (micro-entreprise le plus souvent) : « TVA non applicable, art. 293 B du CGI »</label>
          <label><input type="radio" name="regime" value="assujetti" defaultChecked={!!e && e.tva !== "franchise"} />Assujetti à la TVA</label>
        </fieldset>
        <div className="deux-col">
          <label>N° de TVA intracommunautaire (si assujetti)<input name="tva" defaultValue={e && e.tva !== "franchise" ? e.tva : ""} placeholder="FR…" /></label>
          <label>Taux de TVA (%)<input name="taux_tva" defaultValue={e?.taux_tva ?? 20} inputMode="decimal" /></label>
        </div>
        <label>IBAN (affiché sur les factures, facultatif)<input name="iban" defaultValue={v("iban")} /></label>
        <label>Conditions particulières (facultatif)<textarea name="conditions" rows={3} defaultValue={v("conditions")} placeholder="Ex. acompte de 30 % à la commande." /></label>
        <button className="btn p" type="submit">Enregistrer</button>
        <p className="note" style={{ margin: 0 }}>Le seuil de la franchise en base et les règles de facturation électronique évoluent : vérifiez votre situation sur impots.gouv.fr ou auprès d&apos;un expert-comptable.</p>
      </form>
    </>
  );
}
