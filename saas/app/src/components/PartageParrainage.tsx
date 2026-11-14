"use client";
import { useEffect, useState } from "react";
import { Check, Copy, Mail, MessageCircle, MessageSquareText, Share2 } from "lucide-react";
import { messagePartage } from "@/lib/parrainage";

/**
 * Bloc de partage du lien de parrainage. Rien n'est jamais envoyé automatiquement :
 * chaque bouton ouvre l'application choisie (WhatsApp, SMS, e-mail, partage du téléphone) avec le message, que l'utilisateur envoie lui-même.
 */
export function PartageParrainage({ lien, code }: { lien: string; code: string }) {
  const [message, setMessage] = useState(messagePartage(lien));
  const [copie, setCopie] = useState(false);
  const [natif, setNatif] = useState(false);
  useEffect(() => { setNatif(typeof navigator !== "undefined" && typeof navigator.share === "function"); }, []);

  async function copier() {
    try { await navigator.clipboard.writeText(lien); }
    catch {
      const t = document.createElement("textarea"); t.value = lien; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
    }
    setCopie(true); setTimeout(() => setCopie(false), 2500);
  }
  const texte = encodeURIComponent(message);

  return (
    <section className="carte partage" aria-labelledby="titre-partage">
      <h2 id="titre-partage">Ton lien à partager</h2>
      <div className="lien-parrainage">
        <output aria-label="Ton lien de parrainage">{lien.replace(/^https?:\/\//, "")}</output>
        <button type="button" className="btn p" onClick={copier} aria-live="polite">{copie ? <><Check aria-hidden />Lien copié ✓</> : <><Copy aria-hidden />Copier</>}</button>
      </div>
      <p className="note">Ton code : <b className="code-parrainage">{code}</b></p>
      <label className="ed-champ"><span>Ton message (tu peux le modifier)</span>
        <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={600} />
      </label>
      <div className="boutons-partage">
        {natif && <button type="button" className="btn" onClick={() => navigator.share({ text: message }).catch(() => {})}><Share2 aria-hidden />Partager</button>}
        <a className="btn" href={`https://wa.me/?text=${texte}`} target="_blank" rel="noopener"><MessageCircle aria-hidden />WhatsApp</a>
        <a className="btn" href={`sms:?&body=${texte}`}><MessageSquareText aria-hidden />SMS</a>
        <a className="btn" href={`mailto:?subject=${encodeURIComponent("-20 % sur MySite avec mon lien de parrainage")}&body=${texte}`}><Mail aria-hidden />E-mail</a>
      </div>
      <p className="note" style={{ margin: 0 }}>Rien ne part tout seul : c&apos;est toi qui envoies le message, aux personnes de ton choix (pas d&apos;envoi en masse). Si tu publies ton lien sur les réseaux sociaux, indique que c&apos;est un lien de parrainage. En partageant ton lien, tu acceptes le <a href="/reglement-parrainage">règlement du parrainage</a>.</p>
    </section>
  );
}
