"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Award, CheckCircle2, RotateCcw } from "lucide-react";
import type { Lecon } from "@/lib/academie/types";
import { SEUIL_REUSSITE } from "@/lib/academie/cours";
import { jouerSon } from "@/lib/academie/audio";
import { VideoInteractive } from "./VideoInteractive";

/** Leçon : vidéo interactive, l'essentiel à retenir, quiz final et validation de la progression. */
export function LeconInteractive({ l, couleur, dejaFaite, suivante }: { l: Lecon; couleur: string; dejaFaite: boolean; suivante: { id: string; titre: string } | null }) {
  const router = useRouter();
  const [rep, setRep] = useState<(number | null)[]>(l.quiz.map(() => null));
  const [corrige, setCorrige] = useState(false);
  const [valide, setValide] = useState(dejaFaite);
  const score = Math.round((rep.filter((r, k) => r === l.quiz[k].bonne).length / l.quiz.length) * 100);

  async function corriger() {
    setCorrige(true);
    if (score >= SEUIL_REUSSITE) {
      jouerSon("succes");
      const r = await fetch("/api/academie", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lecon: l.id, score }) });
      if (r.ok) { setValide(true); router.refresh(); }
    } else jouerSon("erreur");
  }

  return (
    <div className="lecon">
      <VideoInteractive titre={l.titre} scenes={l.video} couleur={couleur} />
      <div className="lecon-grille">
        <article className="carte lecon-texte">
          <h2>L&apos;essentiel</h2>
          <p className="note">{l.resume}</p>
          {l.contenu.map((s) => (
            <section key={s.titre}>
              <h3>{s.titre}</h3>
              {s.texte && <p>{s.texte}</p>}
              {s.liste && <ul>{s.liste.map((x) => <li key={x}>{x}</li>)}</ul>}
            </section>
          ))}
          {!!l.actions?.length && <div className="lecon-actions">{l.actions.map((a) => <Link key={a.href} className="btn" href={a.href}>{a.lib}<ArrowRight aria-hidden /></Link>)}</div>}
        </article>
        <aside className="carte pile lecon-quiz">
          <h2 style={{ margin: 0, display: "flex", gap: ".5rem", alignItems: "center" }}><Award aria-hidden style={{ color: couleur }} />Valider la leçon</h2>
          <p className="note" style={{ margin: 0 }}>{l.quiz.length} questions · 2 bonnes réponses sur 3 pour valider.</p>
          {l.quiz.map((q, k) => (
            <fieldset key={k} className="quiz-q">
              <legend>{k + 1}. {q.question}</legend>
              {q.choix.map((c, n) => {
                const etat = corrige ? (n === q.bonne ? "bon" : rep[k] === n ? "faux" : "") : "";
                return <label key={n} className={`quiz-choix ${etat}`}><input type="radio" name={`q${k}`} checked={rep[k] === n} disabled={corrige} onChange={() => setRep(rep.map((r, j) => (j === k ? n : r)))} />{c}</label>;
              })}
              {corrige && <p className="note" style={{ margin: ".3rem 0 0" }}>{q.explication}</p>}
            </fieldset>
          ))}
          {!corrige
            ? <button type="button" className="btn p bloc" disabled={rep.some((r) => r === null)} onClick={corriger}>Vérifier mes réponses</button>
            : score >= SEUIL_REUSSITE
              ? <p className="alerte ok" style={{ margin: 0 }}><CheckCircle2 aria-hidden />Leçon validée ({score} %) !</p>
              : <><p className="alerte" style={{ margin: 0 }}>{score} % : revoyez la vidéo et réessayez.</p><button type="button" className="btn bloc" onClick={() => { setCorrige(false); setRep(l.quiz.map(() => null)); }}><RotateCcw aria-hidden />Réessayer</button></>}
          {valide && !corrige && <p className="alerte ok" style={{ margin: 0 }}><CheckCircle2 aria-hidden />Leçon déjà validée.</p>}
          {suivante && (valide || corrige) && <Link className="btn p bloc" href={`/espace/academie/${suivante.id}`}>Leçon suivante : {suivante.titre}<ArrowRight aria-hidden /></Link>}
        </aside>
      </div>
    </div>
  );
}
