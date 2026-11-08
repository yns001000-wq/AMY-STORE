/**
 * Sons des vidéos de l'Académie, générés en direct par le navigateur (Web Audio) : aucun fichier, aucun droit d'auteur.
 * - bruitages : transition (whoosh), apparition (pop), clic, réussite, cloche, erreur ;
 * - musique d'ambiance douce (accords et arpèges), baissée automatiquement quand la voix parle.
 */
import type { Son } from "./types";

let ctx: AudioContext | null = null;
let maitre: GainNode | null = null;
let musiqueGain: GainNode | null = null;
let minuterie: ReturnType<typeof setInterval> | null = null;
let volumeMusique = 0.055;

export function initAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    maitre = ctx.createGain(); maitre.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
    maitre.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function enveloppe(g: GainNode, t: number, attaque: number, pic: number, duree: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(pic, t + attaque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
}

function note(freq: number, t: number, duree: number, type: OscillatorType, pic: number, sortie: AudioNode) {
  const o = ctx!.createOscillator(), g = ctx!.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  enveloppe(g, t, 0.01, pic, duree);
  o.connect(g).connect(sortie); o.start(t); o.stop(t + duree + 0.05);
  return o;
}

export function jouerSon(son: Son | "erreur") {
  const c = initAudio(); if (!c || !maitre) return;
  const t = c.currentTime + 0.01;
  switch (son) {
    case "whoosh": {
      const buf = c.createBuffer(1, c.sampleRate * 0.6, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = c.createBufferSource(); src.buffer = buf;
      const f = c.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.4;
      f.frequency.setValueAtTime(350, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.45);
      const g = c.createGain(); enveloppe(g, t, 0.12, 0.35, 0.55);
      src.connect(f).connect(g).connect(maitre); src.start(t); src.stop(t + 0.6);
      break;
    }
    case "pop": {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(980, t + 0.07);
      enveloppe(g, t, 0.005, 0.22, 0.12); o.connect(g).connect(maitre); o.start(t); o.stop(t + 0.15);
      break;
    }
    case "clic": note(1900, t, 0.04, "square", 0.05, maitre); break;
    case "succes": [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, t + i * 0.085, 0.35, "triangle", 0.16, maitre!)); break;
    case "cloche": note(880, t, 1.3, "sine", 0.18, maitre); note(1318.5, t, 0.9, "sine", 0.07, maitre); break;
    case "erreur": note(233, t, 0.18, "sawtooth", 0.07, maitre); note(185, t + 0.16, 0.25, "sawtooth", 0.07, maitre); break;
  }
}

/* -------------------------------- musique -------------------------------- */
const ACCORDS = [
  [130.81, 164.81, 196.0, 246.94], // do majeur 7
  [110.0, 130.81, 164.81, 196.0],  // la mineur 7
  [87.31, 110.0, 130.81, 164.81],  // fa majeur 7
  [98.0, 123.47, 146.83, 164.81],  // sol 6
];

export function demarrerMusique() {
  const c = initAudio(); if (!c || !maitre || minuterie) return;
  musiqueGain = c.createGain(); musiqueGain.gain.value = 0.0001;
  musiqueGain.gain.exponentialRampToValueAtTime(volumeMusique, c.currentTime + 2);
  const filtre = c.createBiquadFilter(); filtre.type = "lowpass"; filtre.frequency.value = 1400;
  musiqueGain.connect(filtre).connect(maitre);
  let i = 0;
  const mesure = () => {
    if (!ctx || !musiqueGain) return;
    const t = ctx.currentTime + 0.05, ac = ACCORDS[i++ % ACCORDS.length];
    ac.forEach((f) => [0, 3].forEach((desac) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain();
      o.type = "triangle"; o.frequency.value = f * 2; o.detune.value = desac;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.3);
      o.connect(g).connect(musiqueGain!); o.start(t); o.stop(t + 4.4);
    }));
    [0, 1, 2, 3, 2, 1, 2, 3].forEach((k, j) => note(ac[k] * 4, t + j * 0.5, 0.45, "sine", 0.05, musiqueGain!));
  };
  mesure();
  minuterie = setInterval(mesure, 4000);
}

export function arreterMusique() {
  if (minuterie) { clearInterval(minuterie); minuterie = null; }
  if (ctx && musiqueGain) {
    const g = musiqueGain; g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    setTimeout(() => g.disconnect(), 800);
  }
  musiqueGain = null;
}

/** La musique s'efface sous la voix. */
export function attenuerMusique(parle: boolean) {
  if (!ctx || !musiqueGain) return;
  musiqueGain.gain.setTargetAtTime(parle ? volumeMusique * 0.45 : volumeMusique, ctx.currentTime, 0.25);
}

/* --------------------------------- voix ---------------------------------- */
let voixChoisie: SpeechSynthesisVoice | null = null;

/** Meilleure voix française disponible sur l'appareil (les voix « naturelles » ou « Google » sont plus agréables). */
export function choisirVoix(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voix = window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("fr"));
  if (!voix.length) return null;
  const score = (v: SpeechSynthesisVoice) => (/natural|neural|online/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 3 : 0) + (/amélie|amelie|audrey|thomas|denise|henri|vivienne/i.test(v.name) ? 2 : 0) + (v.lang === "fr-FR" ? 1 : 0);
  voixChoisie = voix.sort((a, b) => score(b) - score(a))[0];
  return voixChoisie;
}

export const voixDisponible = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function parler(texte: string, fin: () => void): () => void {
  if (!voixDisponible()) { fin(); return () => {}; }
  const s = window.speechSynthesis;
  s.cancel();
  const u = new SpeechSynthesisUtterance(texte);
  u.lang = "fr-FR"; u.rate = 1.04; u.pitch = 1;
  const v = voixChoisie ?? choisirVoix(); if (v) u.voice = v;
  let fini = false;
  const terminer = () => { if (!fini) { fini = true; attenuerMusique(false); fin(); } };
  u.onend = terminer; u.onerror = terminer;
  attenuerMusique(true);
  s.speak(u);
  // Sécurité : certains navigateurs ne déclenchent pas « onend »
  const garde = setTimeout(terminer, Math.max(4000, texte.length * 95));
  return () => { clearTimeout(garde); fini = true; s.cancel(); attenuerMusique(false); };
}

export function taireVoix() { if (voixDisponible()) window.speechSynthesis.cancel(); }
