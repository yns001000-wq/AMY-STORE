"""Assemble <nom>.html : chronologie calée sur les durées de la voix + découpage visuel (<nom>.scenes.json).
Usage : python3 construire.py <nom> <dossier de travail>   (les durées par défaut permettent un aperçu avant la voix)"""
import json, os, sys
nom, travail = sys.argv[1], sys.argv[2]
ici = os.path.dirname(os.path.abspath(__file__))
voix = json.load(open(f"{ici}/{nom}.json"))["scenes"]
vis = json.load(open(f"{ici}/{nom}.scenes.json"))
t = 0.15; tl = []
for k, x in enumerate(voix):
    duree = x.get("duree", round(len(x["texte"]) * 0.062 + 0.4, 2))
    d = t; v = d + (0.12 if k == 0 else 0.3); f = v + duree + (2.3 if k == len(voix) - 1 else 0.3)
    tl.append({"id": x["id"], "debut": round(d, 3), "voix": round(v, 3), "fin": round(f, 3), "duree": duree, "texte": x["texte"]}); t = f
S = {x["id"]: x for x in tl}
for s in vis["scenes"]:
    V = S[s["de"]]; a, b = s.get("part", [0, 1]); L = V["fin"] - V["debut"]
    s["debut"], s["fin"] = round(V["debut"] + a * L, 3), round(V["debut"] + b * L, 3)
vis["timeline"] = {"scenes": tl, "total": round(t, 2)}
json.dump(vis["timeline"] | {"visuel": [{k: s.get(k) for k in ("id", "type", "debut", "fin", "tap")} for s in vis["scenes"]]}, open(f"{travail}/timeline.json", "w"), ensure_ascii=False, indent=1)
h = open(f"{ici}/modele.html").read().replace("@@PUB@@", json.dumps(vis, ensure_ascii=False))
open(f"{ici}/{nom}.html", "w").write(h)
print(nom, "durée", vis["timeline"]["total"], "s")
