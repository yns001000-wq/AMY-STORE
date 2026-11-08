"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Captions, ChevronLeft, ChevronRight, Maximize, Music, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { QuizQ, Scene } from "@/lib/academie/types";
import { arreterMusique, choisirVoix, demarrerMusique, initAudio, jouerSon, parler, taireVoix, voixDisponible } from "@/lib/academie/audio";
import { RenduVisuel } from "./Visuels";

type Phase = "accueil" | "lecture" | "pause" | "quiz" | "fin";

/** Durée minimale d'une scène : le temps de lire la narration, ou la durée imposée. */
const dureeScene = (s: Scene) => s.duree ?? Math.max(4.5, s.voix.split(/\s+/).length * 0.36 + 1.2);

/**
 * Vidéo interactive : scènes animées, narration en français (synthèse vocale de l'appareil), bruitages et musique générés,
 * sous-titres, chapitres cliquables et questions qui mettent la vidéo en pause.
 */
export function VideoInteractive({ titre, scenes, couleur, onTermine }: { titre: string; scenes: Scene[]; couleur: string; onTermine?: () => void }) {
  const [phase, setPhase] = useState<Phase>("accueil");
  const [i, setI] = useState(0);
  const [t, setT] = useState(0);
  const [voix, setVoix] = useState(true);
  const [musique, setMusique] = useState(true);
  const [sousTitres, setSousTitres] = useState(true);
  const [reponse, setReponse] = useState<{ choix: number; ok: boolean } | null>(null);
  const [voixOk, setVoixOk] = useState(false); // connu seulement dans le navigateur (évite un écart avec le rendu serveur)
  const cadre = useRef<HTMLDivElement>(null);
  const voixFinie = useRef(false), arretVoix = useRef<() => void>(() => {}), debut = useRef(0), dejaTermine = useRef(false);
  const scene = scenes[i];

  useEffect(() => {
    if (!voixDisponible()) { setVoix(false); return; }
    setVoixOk(true);
    choisirVoix();
    window.speechSynthesis.onvoiceschanged = () => choisirVoix();
    return () => { taireVoix(); arreterMusique(); };
  }, []);

  /** Démarre la scène n : bruitage, narration, horloge. */
  const lancerScene = useCallback((n: number) => {
    arretVoix.current();
    setI(n); setT(0); setReponse(null);
    const s = scenes[n];
    if (s.son) jouerSon(s.son);
    voixFinie.current = !voix;
    debut.current = performance.now();
    if (voix) arretVoix.current = parler(s.voix, () => { voixFinie.current = true; });
    setPhase("lecture");
  }, [scenes, voix]);

  // Horloge de lecture : fait avancer les animations et passe à la scène suivante.
  useEffect(() => {
    if (phase !== "lecture") return;
    let raf = 0;
    const tic = () => {
      const ecoule = (performance.now() - debut.current) / 1000;
      setT(ecoule);
      const s = scenes[i];
      if (ecoule >= dureeScene(s) && voixFinie.current) {
        if (s.quiz) { setPhase("quiz"); jouerSon("cloche"); return; }
        if (i + 1 < scenes.length) { lancerScene(i + 1); return; }
        setPhase("fin"); arreterMusique(); jouerSon("succes");
        if (!dejaTermine.current) { dejaTermine.current = true; onTermine?.(); }
        return;
      }
      raf = requestAnimationFrame(tic);
    };
    raf = requestAnimationFrame(tic);
    return () => cancelAnimationFrame(raf);
  }, [phase, i, scenes, lancerScene, onTermine]);

  function demarrer() {
    initAudio();
    if (musique) demarrerMusique();
    lancerScene(0);
  }
  function basculerLecture() {
    if (phase === "accueil" || phase === "fin") { dejaTermine.current = phase === "fin" ? dejaTermine.current : false; demarrer(); return; }
    if (phase === "lecture") { arretVoix.current(); setPhase("pause"); arreterMusique(); jouerSon("clic"); return; }
    if (phase === "pause") { if (musique) demarrerMusique(); lancerScene(i); }
  }
  function aller(n: number) {
    if (n < 0 || n >= scenes.length) return;
    if (phase === "accueil") { initAudio(); if (musique) demarrerMusique(); }
    jouerSon("clic"); lancerScene(n);
  }
  function repondre(q: QuizQ, c: number) {
    const ok = c === q.bonne;
    setReponse({ choix: c, ok });
    jouerSon(ok ? "succes" : "erreur");
  }
  function continuer() {
    if (i + 1 < scenes.length) lancerScene(i + 1);
    else { setPhase("fin"); arreterMusique(); if (!dejaTermine.current) { dejaTermine.current = true; onTermine?.(); } }
  }
  function basculerMusique() {
    const v = !musique; setMusique(v);
    if (v && (phase === "lecture" || phase === "quiz")) demarrerMusique(); else arreterMusique();
  }
  function basculerVoix() { const v = !voix; setVoix(v); if (!v) { arretVoix.current(); voixFinie.current = true; } }
  function pleinEcran() { const el = cadre.current; if (!el) return; if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.(); }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!cadre.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (e.key === " ") { e.preventDefault(); basculerLecture(); }
      if (e.key === "ArrowRight") aller(i + 1);
      if (e.key === "ArrowLeft") aller(i - 1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const p = phase === "lecture" ? Math.min(1, t / (dureeScene(scene) * 0.72)) : phase === "accueil" ? 0 : 1;
  const enCours = phase === "lecture" || phase === "pause" || phase === "quiz";
  return (
    <div className="vi" ref={cadre} style={{ "--vi-couleur": couleur } as React.CSSProperties} tabIndex={-1}>
      <div className="vi-scene" aria-live="polite">
        <div className="vi-fond" aria-hidden><i /><i /><i /></div>
        {phase === "accueil" ? (
          <button type="button" className="vi-depart" onClick={demarrer}>
            <span className="vi-lecture"><Play /></span>
            <b>{titre}</b>
            <small>Vidéo interactive · voix, musique et questions · {Math.round(scenes.reduce((s, x) => s + dureeScene(x), 0) / 60) || 1} min</small>
          </button>
        ) : (
          <div key={i} className="vi-contenu"><RenduVisuel v={scene.visuel} p={p} /></div>
        )}
        {phase === "quiz" && scene.quiz && (
          <div className="vi-quiz" role="dialog" aria-label="Question">
            <p className="vi-quiz-q">{scene.quiz.question}</p>
            <div className="vi-quiz-choix">
              {scene.quiz.choix.map((c, n) => (
                <button key={n} type="button" disabled={!!reponse?.ok} onClick={() => repondre(scene.quiz!, n)}
                  className={reponse?.choix === n ? (reponse.ok ? "bon" : "faux") : undefined}>{c}</button>
              ))}
            </div>
            {reponse && <p className={`vi-quiz-retour ${reponse.ok ? "bon" : "faux"}`}>{reponse.ok ? scene.quiz.explication : "Pas tout à fait : réessayez !"}</p>}
            {reponse?.ok && <button type="button" className="btn p" onClick={continuer}>Continuer <ChevronRight /></button>}
          </div>
        )}
        {phase === "fin" && (
          <div className="vi-fin">
            <p>Vidéo terminée</p>
            <button type="button" className="btn" onClick={() => { setPhase("accueil"); }}><RotateCcw />Revoir</button>
          </div>
        )}
        {phase === "pause" && <button type="button" className="vi-pause-voile" onClick={basculerLecture} aria-label="Reprendre"><Play /></button>}
        {sousTitres && enCours && <p className="vi-sous-titres">{scene.voix}</p>}
      </div>

      <div className="vi-barre">
        <button type="button" onClick={basculerLecture} aria-label={phase === "lecture" ? "Pause" : "Lecture"}>{phase === "lecture" ? <Pause /> : <Play />}</button>
        <button type="button" onClick={() => aller(i - 1)} disabled={i === 0 || phase === "accueil"} aria-label="Scène précédente"><ChevronLeft /></button>
        <button type="button" onClick={() => aller(i + 1)} disabled={i >= scenes.length - 1} aria-label="Scène suivante"><ChevronRight /></button>
        <div className="vi-chapitres" role="group" aria-label="Chapitres">
          {scenes.map((s, n) => (
            <button key={n} type="button" onClick={() => aller(n)} aria-label={`Aller à la scène ${n + 1}`} className={s.quiz ? "q" : undefined}>
              <i style={{ width: `${n < i || phase === "fin" ? 100 : n === i && phase !== "accueil" ? Math.min(100, (t / dureeScene(s)) * 100) : 0}%` }} />
            </button>
          ))}
        </div>
        <button type="button" onClick={basculerVoix} aria-pressed={voix} aria-label="Voix" disabled={!voixOk}>{voix ? <Volume2 /> : <VolumeX />}</button>
        <button type="button" onClick={basculerMusique} aria-pressed={musique} aria-label="Musique"><Music /></button>
        <button type="button" onClick={() => setSousTitres(!sousTitres)} aria-pressed={sousTitres} aria-label="Sous-titres"><Captions /></button>
        <button type="button" onClick={pleinEcran} aria-label="Plein écran"><Maximize /></button>
      </div>
    </div>
  );
}
