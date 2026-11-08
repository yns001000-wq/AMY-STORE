"""Assemble video.html (version motion) à partir du modèle et de la chronologie calée sur la voix."""
import json, sys
s = json.load(open("script.json"))
durees = [x.get("duree", 3.6) for x in s]
t = 0.3; tl = []
for k, x in enumerate(s):
    d = t; v = d + 0.35; f = v + durees[k] + (2.4 if k == len(s) - 1 else 0.45)
    tl.append({"id": x["id"], "debut": round(d, 3), "voix": round(v, 3), "fin": round(f, 3), "duree": durees[k], "texte": x["texte"]}); t = f
tl = {"scenes": tl, "total": round(t, 2)}
json.dump(tl, open("timeline.json", "w"), ensure_ascii=False, indent=1)
S = {x["id"]: x for x in tl["scenes"]}; ids = [x["id"] for x in tl["scenes"]]
h = open("modele.html").read()
for k, i in enumerate(ids):
    suivant = S[ids[k + 1]]["debut"] + 0.8 if k + 1 < len(ids) else 999
    h = h.replace(f"@@{i}@@", f'--s:{S[i]["debut"]}s;--f:{round(suivant, 3)}s')
h = h.replace("@@cpt_devis@@", f'{S["devis"]["debut"] + 1.3},{S["devis"]["debut"] + 2.1}')
h = h.replace("@@cpt_encaisser@@", f'{S["encaisser"]["debut"] + 0.3},{S["encaisser"]["debut"] + 1.6}')
h = h.replace("@@tape_enligne@@", f'{S["enligne"]["debut"] + 1.6},{S["enligne"]["debut"] + 2.3}')
h = h.replace("@@fondu@@", f'{tl["total"] - 0.45}s')
h = h.replace("@@TIMELINE@@", json.dumps(tl, ensure_ascii=False))
assert "@@" not in h, [l for l in h.split("\n") if "@@" in l][:3]
open("video.html", "w").write(h)
print("ok", tl["total"])
