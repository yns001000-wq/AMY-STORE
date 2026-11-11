"""Voix off des publicités : Chatterbox multilingue (Resemble AI, licence MIT), guidé par une vraie voix française.
Usage : python voix.py <script.json> <dossier de travail> <référence.wav>
Chaque phrase est générée jusqu'à 2 fois ; une transcription Whisper garde la prise la mieux comprise."""
import json, os, re, sys, unicodedata, difflib, torch, torchaudio as ta, librosa
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel
script, dossier, ref = sys.argv[1:4]
torch.set_num_threads(4); torch.manual_seed(int(os.environ.get("GRAINE", 7)))
tts = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
asr = WhisperModel("small", device="cpu", compute_type="int8")
norm = lambda s: re.sub(r"[^a-z0-9 ]", " ", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()).split()
s = json.load(open(script))
for i, x in enumerate(s["scenes"]):
    if "prise" in x: continue  # déjà enregistrée : on reprend où l'on s'était arrêté
    meilleur = (-1, None)
    for essai in range(2):
        w = tts.generate(x["tts"], language_id="fr", audio_prompt_path=ref, exaggeration=0.6, cfg_weight=0.45, temperature=0.75)
        ta.save(f"{dossier}/prise-{i}-{essai}.wav", w, tts.sr)
        txt = " ".join(seg.text for seg in asr.transcribe(librosa.load(f"{dossier}/prise-{i}-{essai}.wav", sr=16000)[0], language="fr")[0])
        score = difflib.SequenceMatcher(None, norm(x["texte"].replace("MySite", "My Site")), norm(txt)).ratio()
        print(i, essai, round(score, 3), "|", txt.strip(), flush=True)
        if score > meilleur[0]: meilleur = (score, essai)
        if score >= float(os.environ.get("SEUIL", 0.82)): break  # Whisper entend mal « MySite » et les homophones : 0,82 suffit
    x["prise"], x["comprehension"] = meilleur[1], round(meilleur[0], 3)
    json.dump(s, open(script, "w"), ensure_ascii=False, indent=1)
json.dump(s, open(script, "w"), ensure_ascii=False, indent=1)
print("fini")
