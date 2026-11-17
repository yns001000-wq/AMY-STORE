"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Mail, MessageSquare, PhoneCall, WandSparkles } from "lucide-react";

const CANAUX = [["sms", "SMS", MessageSquare], ["email", "E-mail", Mail], ["appel", "Script d'appel", PhoneCall]] as const;

/** Rédaction IA d'un message pour ce prospect. L'utilisateur relit, copie et envoie lui-même : rien ne part automatiquement. */
export function GenerateurMessage({ id, bloque }: { id: string; bloque?: string }) {
  const [canal, setCanal] = useState<"sms" | "email" | "appel">("sms");
  const router = useRouter();
  const [etat, setEtat] = useState<{ charge?: boolean; texte?: string; erreur?: string; reste?: number; plan?: string }>({});
  async function rediger() {
    setEtat({ charge: true });
    try {
      const r = await fetch("/api/ia/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, canal }) });
      const d = await r.json();
      if (r.status === 402) { router.push(`/espace/limite?type=${d.type ?? "messages_ia"}`); return; } // limite atteinte : page dédiée
      else if (!r.ok) setEtat({ erreur: d.erreur ?? "La rédaction n'a pas abouti." });
      else setEtat({ texte: d.texte, reste: d.reste, plan: d.plan });
    } catch { setEtat({ erreur: "Connexion impossible. Réessayez." }); }
  }
  return (
    <div className="carte">
      <h2 style={{ fontSize: "1.15rem", display: "flex", gap: ".5rem", alignItems: "center" }}><WandSparkles size={18} style={{ color: "var(--violet)" }} aria-hidden />Message rédigé par l&apos;IA</h2>
      {bloque ? <p className="note">{bloque}</p> : <>
        <div className="bascule" role="group" aria-label="Type de message" style={{ marginBottom: "1rem" }}>
          {CANAUX.map(([c, lib, Ico]) => <button key={c} type="button" aria-pressed={canal === c} onClick={() => setCanal(c)}><Ico size={15} aria-hidden />{lib}</button>)}
        </div>
        <button className="btn p bloc" type="button" onClick={rediger} disabled={etat.charge}>{etat.charge ? "Rédaction en cours…" : "Rédiger avec l'IA"}</button>
        {etat.erreur && <p className="alerte" role="alert" style={{ marginTop: "1rem" }}>{etat.erreur}</p>}
        {etat.texte && <>
          <label style={{ marginTop: "1rem" }}>Votre message (modifiable)<textarea rows={canal === "appel" ? 12 : 7} defaultValue={etat.texte} id="texte-ia" /></label>
          <button className="btn" type="button" style={{ marginTop: ".6rem" }} onClick={() => { const t = (document.getElementById("texte-ia") as HTMLTextAreaElement).value; navigator.clipboard?.writeText(t); }}><Copy aria-hidden />Copier</button>
          <p className="note" style={{ marginTop: ".6rem" }}>Relisez avant d&apos;envoyer : vous en êtes l&apos;expéditeur. Rien n&apos;est envoyé automatiquement.</p>
          {/* Prévenir avant la limite, sans fausse urgence : l'information exacte, et où voir la suite. */}
          {etat.reste === 1 && <p className="dernier-essai">Plus qu&apos;1 message {etat.plan === "gratuit" ? "gratuit " : ""}ce mois-ci. <Link href="/espace/abonnement">Voir les offres</Link></p>}
          {etat.reste === 0 && <p className="dernier-essai">C&apos;était votre dernier message du mois. <Link href="/espace/limite?type=messages_ia">Voir comment continuer</Link></p>}
        </>}
      </>}
    </div>
  );
}
