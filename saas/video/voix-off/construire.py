"""Assemble video-voix.html à partir du modèle et de la chronologie calée sur la voix."""
import json
tl = json.load(open("timeline.json"))
S = {x["id"]: x for x in tl["scenes"]}
h = open("modele.html").read()
st = lambda a, b: f"--s:{a}s;--f:{b}s"
h = h.replace("@@rue_constat@@", st(S["rue"]["debut"], S["constat"]["fin"]))
h = h.replace("@@s_constat@@", f'{S["constat"]["debut"]}s')
for k in ["trouver", "maquette", "visite", "devis", "enligne", "encaisser", "academie"]:
    h = h.replace(f"@@{k}@@", st(S[k]["debut"], S[k]["fin"]))
h = h.replace("@@fin@@", f'--s:{S["fin"]["debut"]}s')
h = h.replace("@@tape_trouver@@", f'{S["trouver"]["debut"] + 0.5},{S["trouver"]["debut"] + 1.4}')
h = h.replace("@@tape_enligne@@", f'{S["enligne"]["debut"] + 0.6},{S["enligne"]["debut"] + 1.5}')
h = h.replace("@@fondu@@", f'{tl["total"] - 0.5}s')
h = h.replace("@@TIMELINE@@", json.dumps(tl, ensure_ascii=False))
assert "@@" not in h, [l for l in h.split("\n") if "@@" in l]
open("video-voix.html", "w").write(h)
print("ok", tl["total"])
