"""Voix off plus naturelle : le texte est dit en quelques longs blocs (plusieurs phrases d'affilée) au lieu d'une phrase à la fois,
avec un réglage plus expressif de Chatterbox. Chaque bloc est ensuite découpé par scène grâce aux horodatages mot à mot de Whisper,
pour garder les sous-titres et les animations calés.
Usage : python voix-blocs.py <script.json> <dossier de travail> <référence.wav>   (écrit prise-<scène>-0.wav, puis lancer finir.py avec TRAITEMENT=leger)"""
import json, os, re, sys, difflib, unicodedata
import numpy as np, torch, torchaudio as ta, librosa, soundfile as sf
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel

script, dossier, ref = sys.argv[1:4]
torch.set_num_threads(4)
s = json.load(open(script)); scenes = s["scenes"]
# Blocs de scènes dites d'une traite : l'accroche seule, puis par deux ou trois phrases, la fin seule.
n = len(scenes)
BLOCS = [[0]] + [list(range(i, min(i + 2, n - 1))) for i in range(1, n - 1, 2)] + [[n - 1]]
tts = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
asr = WhisperModel("small", device="cpu", compute_type="int8")
norm = lambda t: re.sub(r"[^a-z0-9 ]", " ", unicodedata.normalize("NFD", t.lower()).encode("ascii", "ignore").decode()).split()

for b, idx in enumerate(BLOCS):
    texte = " ".join(scenes[i]["tts"] for i in idx)
    attendu = " ".join(scenes[i]["texte"] for i in idx).replace("MySite", "My Site")
    meilleur = None
    for essai in range(3):
        torch.manual_seed(100 + 7 * essai)
        w = tts.generate(texte, language_id="fr", audio_prompt_path=ref, exaggeration=0.7, cfg_weight=0.3, temperature=0.8)
        y = w.squeeze(0).numpy(); sr = tts.sr
        segs, _ = asr.transcribe(librosa.resample(y, orig_sr=sr, target_sr=16000), language="fr", word_timestamps=True)
        mots = [m for sg in segs for m in sg.words]
        score = difflib.SequenceMatcher(None, norm(attendu), norm(" ".join(m.word for m in mots))).ratio()
        print(f"bloc {b} essai {essai} : {score:.3f} | {' '.join(m.word for m in mots).strip()}", flush=True)
        if not meilleur or score > meilleur[0]: meilleur = (score, y, mots)
        if score >= 0.95: break
    score, y, mots = meilleur
    # Coupe entre les scènes : au milieu du silence qui précède le premier mot de chaque scène suivante.
    coupes, pos = [0], 0
    for i in idx[1:]:
        cible = len(norm(" ".join(scenes[j]["texte"] for j in idx if j < i).replace("MySite", "My Site")))
        k = min(cible, len(mots) - 1)
        debut = mots[k].start; fin_prec = mots[k - 1].end if k > 0 else debut
        coupes.append(int((fin_prec + debut) / 2 * sr))
    coupes.append(len(y))
    for j, i in enumerate(idx):
        sf.write(f"{dossier}/prise-{i}-0.wav", y[coupes[j]:coupes[j + 1]], sr)
        scenes[i]["prise"], scenes[i]["comprehension"] = 0, round(score, 3)
json.dump(s, open(script, "w"), ensure_ascii=False, indent=1)
print("fini")
