"""Après la voix : nettoie la meilleure prise de chaque phrase, mesure sa durée, puis enchaîne montage, mixage et rendu.
Usage : python3 finir.py <nom> <dossier de travail> <sortie.mp4>"""
import json, os, subprocess, sys
nom, travail, sortie = sys.argv[1:4]
ici = os.path.dirname(os.path.abspath(__file__))
s = json.load(open(f"{ici}/{nom}.json"))
hauteur = "1.02" if s["voix"] == "homme" else "1.045"   # voix très légèrement rajeunie, formants préservés
filtre = (f"rubberband=pitch={hauteur}:formant=preserved,aresample=48000,"
          "silenceremove=start_periods=1:start_threshold=-42dB,areverse,silenceremove=start_periods=1:start_threshold=-42dB,areverse,"
          "highpass=f=70,equalizer=f=180:t=q:w=1:g=1,equalizer=f=350:t=q:w=1:g=-1.5,equalizer=f=4500:t=q:w=1.3:g=2.5,"
          "acompressor=threshold=-20dB:ratio=2.5:attack=6:release=110,aecho=0.85:0.5:24|41:0.05|0.03")
# TRAITEMENT=leger : aucun changement de hauteur ni écho (ils rendent la voix plus artificielle), seulement nettoyage et compression douce.
if os.environ.get("TRAITEMENT") == "leger":
    filtre = ("aresample=48000,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
              "highpass=f=60,acompressor=threshold=-22dB:ratio=2:attack=10:release=150")
for i, x in enumerate(s["scenes"]):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"{travail}/prise-{i}-{x['prise']}.wav", "-af", filtre, "-ac", "1", f"{travail}/voix-{i}.wav"], check=True)
    x["duree"] = round(float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{travail}/voix-{i}.wav"], capture_output=True, text=True).stdout), 3)
json.dump(s, open(f"{ici}/{nom}.json", "w"), ensure_ascii=False, indent=1)
subprocess.run([sys.executable, f"{ici}/construire.py", nom, travail], check=True)
subprocess.run([sys.executable, "-I", f"{ici}/mixage.py", travail], check=True)
subprocess.run(["node", f"{ici}/rendu.js", nom, travail, sortie], check=True)
