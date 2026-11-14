"""Monte une publicité sur une voix déjà enregistrée (par exemple une vidéo refaite dans CapCut) :
les scènes et les sous-titres sont calés sur les vrais mots, retrouvés par Whisper dans la bande-son.
Usage : python3 construire-voix-externe.py <nom> <travail> <mots.json> <durée totale en s> [modèle.html]
 - mots.json : liste {m, d, f} (mot, début, fin) produite par faster-whisper ;
 - écrit <nom>.html (avec le modèle donné, par défaut modele-pro.html) et <travail>/timeline.json."""
import difflib, json, os, re, sys, unicodedata

nom, travail, fmots, total = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
modele = sys.argv[5] if len(sys.argv) > 5 else "modele-pro.html"
ici = os.path.dirname(os.path.abspath(__file__))
voix = json.load(open(f"{ici}/{nom}.json"))["scenes"]
vis = json.load(open(f"{ici}/{nom}.scenes.json"))
mots = json.load(open(fmots))
norm = lambda t: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", t.lower().replace("mysite", "maisait")).encode("ascii", "ignore").decode())

# Mots du texte (avec leur ponctuation, comme les sous-titres les découpent) et correspondance avec les mots entendus.
texte = [(k, m) for k, x in enumerate(voix) for m in x["texte"].replace("MySite", "My Site").replace(" ?", " ?").replace(" :", " :").split(" ")]
a, b = [norm(m) for _, m in texte], [norm(m["m"]) for m in mots]
heures = [None] * len(a)
for bloc in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
    for j in range(bloc.size): heures[bloc.a + j] = mots[bloc.b + j]["d"]
# Mots non retrouvés : heure interpolée entre les voisins connus.
connus = [i for i, h in enumerate(heures) if h is not None]
for i, h in enumerate(heures):
    if h is None:
        avant = max([j for j in connus if j < i], default=None); apres = min([j for j in connus if j > i], default=None)
        if avant is None: heures[i] = heures[apres] - 0.3 * (apres - i)
        elif apres is None: heures[i] = heures[avant] + 0.3 * (i - avant)
        else: heures[i] = heures[avant] + (heures[apres] - heures[avant]) * (i - avant) / (apres - avant)
fins = {}
for i, (k, _) in enumerate(texte): fins[k] = max(fins.get(k, 0), heures[i] + 0.35)

tl = []
for k, x in enumerate(voix):
    hs = [round(heures[i], 3) for i, (kk, _) in enumerate(texte) if kk == k]
    debut = 0.0 if k == 0 else round(hs[0] - 0.4, 3)
    tl.append({"id": x["id"], "debut": debut, "voix": hs[0], "texte": x["texte"].replace("MySite", "My Site").replace("My Site", "MySite"), "heures": hs, "finVoix": round(fins[k], 3)})
for k, sc in enumerate(tl):
    sc["fin"] = tl[k + 1]["debut"] if k + 1 < len(tl) else total
    sc["duree"] = round(sc["finVoix"] - sc["voix"], 3)
# Les sous-titres découpent le texte d'origine (avec « MySite ») : on garde son nombre de mots.
for k, sc in enumerate(tl):
    n = len(sc["texte"].replace(" ?", " ?").replace(" :", " :").split(" "))
    if len(sc["heures"]) != n:  # « My Site » compte pour deux mots entendus : on fusionne
        h = sc["heures"]; t = sc["texte"].split(" "); fus = []; i = 0
        for m in t: fus.append(h[min(i, len(h) - 1)]); i += 2 if m.startswith("MySite") else 1
        sc["heures"] = fus
S = {x["id"]: x for x in tl}
for s in vis["scenes"]:
    V = S[s["de"]]; a_, b_ = s.get("part", [0, 1]); L = V["fin"] - V["debut"]
    s["debut"], s["fin"] = round(V["debut"] + a_ * L, 3), round(V["debut"] + b_ * L, 3)
vis["timeline"] = {"scenes": tl, "total": round(total, 2)}
json.dump(vis["timeline"] | {"visuel": [{k: s.get(k) for k in ("id", "type", "debut", "fin", "tap")} for s in vis["scenes"]]}, open(f"{travail}/timeline.json", "w"), ensure_ascii=False, indent=1)
open(f"{ici}/{nom}.html", "w").write(open(f"{ici}/{modele}").read().replace("@@PUB@@", json.dumps(vis, ensure_ascii=False)))
for sc in tl: print(f"{sc['debut']:6.2f} → {sc['fin']:6.2f}  voix {sc['voix']:6.2f}-{sc['finVoix']:6.2f}  {sc['texte'][:60]}")
