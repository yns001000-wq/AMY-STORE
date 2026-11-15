import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
import wave, numpy as np
w = wave.open(sys.argv[1]); a = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768
segs, info = m.transcribe(a, language="fr", word_timestamps=True, vad_filter=True)
out = []
for s in segs:
    out.append({"debut": round(s.start, 2), "fin": round(s.end, 2), "texte": s.text.strip(), "mots": [[round(w.start, 2), round(w.end, 2), w.word] for w in s.words]})
    print(f"[{s.start:6.2f} → {s.end:6.2f}] {s.text.strip()}")
json.dump(out, open("transcription.json", "w"), ensure_ascii=False, indent=1)
