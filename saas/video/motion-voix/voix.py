"""Voix off : Chatterbox multilingue (licence MIT), guidé par une vraie voix féminine française (corpus SIWIS, CC BY 4.0).
Chaque phrase est générée plusieurs fois ; on garde la prise la mieux comprise par Whisper (contrôle automatique)."""
import json, re, unicodedata, difflib, torch, torchaudio as ta, librosa
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel
torch.set_num_threads(4); torch.manual_seed(3)
tts = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
asr = WhisperModel("small", device="cpu", compute_type="int8")
norm = lambda s: re.sub(r"[^a-z0-9 ]", " ", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()).split()
s = json.load(open("script.json"))
for i, x in enumerate(s):
    meilleur = (-1, None)
    for essai in range(3):
        w = tts.generate(x["tts"], language_id="fr", audio_prompt_path="ref-humaine.wav", exaggeration=0.55, cfg_weight=0.45, temperature=0.75)
        ta.save(f"prise-{i}-{essai}.wav", w, tts.sr)
        txt = " ".join(seg.text for seg in asr.transcribe(librosa.load(f"prise-{i}-{essai}.wav", sr=16000)[0], language="fr")[0])
        attendu = x["texte"].replace("MySite", "My Site")
        score = difflib.SequenceMatcher(None, norm(attendu), norm(txt)).ratio()
        print(i, essai, round(score, 3), "|", txt.strip(), flush=True)
        if score > meilleur[0]: meilleur = (score, essai)
        if score >= 0.93: break
    x["prise"], x["comprehension"] = meilleur[1], round(meilleur[0], 3)
json.dump(s, open("script.json", "w"), ensure_ascii=False, indent=1)
print("fini")
