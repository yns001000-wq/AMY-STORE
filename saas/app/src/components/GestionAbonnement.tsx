"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX2, RotateCcw, Undo2 } from "lucide-react";

interface Props { offre: string; fin: string | null; resiliationPrevue: boolean; retractation: { ok: boolean; jusquau: string | null } }

/**
 * Résiliation en ligne (art. L215-1-1 du Code de la consommation) : un bouton visible « Résilier mon abonnement »,
 * une page de confirmation qui rappelle la date d'effet, puis la confirmation. Et la rétractation pour les consommateurs (14 jours).
 */
export function GestionAbonnement({ offre, fin, resiliationPrevue, retractation }: Props) {
  const router = useRouter();
  const [etape, setEtape] = useState<"repos" | "confirmer" | "retractation">("repos");
  const [msg, setMsg] = useState<{ ok?: boolean; t: string } | null>(null);
  const [charge, setCharge] = useState(false);
  const dateFin = fin ? new Date(fin).toLocaleDateString("fr-FR") : "la fin de la période payée";

  async function appel(url: string, succes: (j: Record<string, unknown>) => string) {
    setCharge(true);
    try {
      const r = await fetch(url, { method: "POST" }); const j = await r.json();
      if (!r.ok) setMsg({ t: String(j.erreur ?? "Action impossible pour le moment.") });
      else { setMsg({ ok: true, t: succes(j) }); setEtape("repos"); router.refresh(); }
    } catch { setMsg({ t: "Connexion impossible. Réessayez." }); } finally { setCharge(false); }
  }
  const euros = (c: unknown) => (Number(c) / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  return (
    <section className="carte pile resiliation" id="resilier" aria-labelledby="titre-resilier">
      <h2 id="titre-resilier" style={{ fontSize: "1.2rem", margin: 0 }}>Résilier mon abonnement</h2>
      {msg && <p className={`alerte${msg.ok ? " ok" : ""}`} role="status" style={{ margin: 0 }}>{msg.t}</p>}
      {resiliationPrevue ? <>
        <p style={{ margin: 0 }}>Votre abonnement {offre} est <b>résilié</b> : vous gardez l&apos;accès jusqu&apos;au <b>{dateFin}</b>, puis votre compte repasse en offre Gratuite. Aucun autre prélèvement.</p>
        <button type="button" className="btn" disabled={charge} onClick={() => appel("/api/abonnement/reprendre", () => "Résiliation annulée : votre abonnement continue.")}><Undo2 aria-hidden />Reprendre mon abonnement</button>
      </> : etape === "repos" ? <>
        <p className="note" style={{ margin: 0 }}>Sans frais, sans justification. Vous gardez l&apos;accès jusqu&apos;à la fin de la période payée ({dateFin}).</p>
        <div className="ed-ligne" style={{ flexWrap: "wrap" }}>
          <button type="button" className="btn" onClick={() => { setMsg(null); setEtape("confirmer"); }}><CalendarX2 aria-hidden />Résilier mon abonnement</button>
          {retractation.ok && <button type="button" className="btn fantome" onClick={() => { setMsg(null); setEtape("retractation"); }}><RotateCcw aria-hidden />Me rétracter (14 jours)</button>}
        </div>
      </> : etape === "confirmer" ? <>
        <div className="alerte" style={{ margin: 0, display: "grid", gap: ".3rem" }}>
          <b>Vous allez résilier votre abonnement {offre}.</b>
          <span>Date d&apos;effet : <b>{dateFin}</b>. Jusque-là, rien ne change. Ensuite : offre Gratuite, vos prospects, sites et factures restent accessibles ; les sites en ligne sont retirés 15 jours plus tard.</span>
          <span>Une confirmation vous est envoyée par e-mail.</span>
        </div>
        <div className="ed-ligne" style={{ flexWrap: "wrap" }}>
          <button type="button" className="btn p" disabled={charge} onClick={() => appel("/api/abonnement/resilier", (j) => `Résiliation confirmée. Accès maintenu jusqu'au ${j.fin ? new Date(String(j.fin)).toLocaleDateString("fr-FR") : dateFin}.${j.email ? " Un e-mail de confirmation vous a été envoyé." : ""}`)}>{charge ? "Résiliation…" : "Confirmer la résiliation"}</button>
          <button type="button" className="btn" onClick={() => setEtape("repos")}>Annuler</button>
        </div>
      </> : <>
        <div className="alerte" style={{ margin: 0, display: "grid", gap: ".3rem" }}>
          <b>Rétractation (jusqu&apos;au {retractation.jusquau ? new Date(retractation.jusquau).toLocaleDateString("fr-FR") : ""})</b>
          <span>L&apos;abonnement s&apos;arrête tout de suite et vous êtes remboursé, déduction faite des jours déjà utilisés (art. L221-25 du Code de la consommation).</span>
        </div>
        <div className="ed-ligne" style={{ flexWrap: "wrap" }}>
          <button type="button" className="btn p" disabled={charge} onClick={() => appel("/api/abonnement/retractation", (j) => `Rétractation confirmée : ${euros(j.rembourse)} remboursés sur votre carte.`)}>{charge ? "Traitement…" : "Confirmer ma rétractation"}</button>
          <button type="button" className="btn" onClick={() => setEtape("repos")}>Annuler</button>
        </div>
      </>}
    </section>
  );
}
