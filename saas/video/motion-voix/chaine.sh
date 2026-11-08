set -e
. /tmp/venv-voix/bin/activate
python voix.py > voix.log 2>&1
deactivate
python3 - <<'PY'
import json, subprocess
s = json.load(open("script.json"))
for i, x in enumerate(s):
    f = ("rubberband=pitch=1.02:formant=preserved,aresample=48000,"
         "silenceremove=start_periods=1:start_threshold=-42dB,areverse,silenceremove=start_periods=1:start_threshold=-42dB,areverse,"
         "highpass=f=70,equalizer=f=180:t=q:w=1:g=1,equalizer=f=350:t=q:w=1:g=-1.5,equalizer=f=4500:t=q:w=1.3:g=2.5,acompressor=threshold=-20dB:ratio=2.5:attack=6:release=110,aecho=0.85:0.5:24|41:0.05|0.03")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", f"prise-{i}-{x['prise']}.wav", "-af", f, "-ac", "1", f"voix-{i}.wav"], check=True)
    x["duree"] = round(float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"voix-{i}.wav"], capture_output=True, text=True).stdout), 3)
json.dump(s, open("script.json", "w"), ensure_ascii=False, indent=1)
PY
python3 construire.py
python3 -I mixage.py
node rendu.js > rendu.log 2>&1
echo CHAINE_OK
