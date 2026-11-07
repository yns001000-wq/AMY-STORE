"""Construit les données embarquées de la carte de France du cockpit (cockpit/index.html).

Le cockpit ne peut charger aucune donnée externe : contours et coordonnées sont intégrés à la page.

Préparation (une fois) :
  curl -o dep.geojson https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson
  curl -o communes.json "https://geo.api.gouv.fr/communes?fields=nom,codesPostaux,centre,codeDepartement,population&format=json"
  npx mapshaper@0.6.102 dep.geojson -simplify 30% keep-shapes -o dep-s.geojson precision=0.0005
Puis :
  python outils/carte_cockpit.py DOSSIER 10000
écrit DOSSIER/carte-data.js, à coller dans cockpit/index.html à la place du bloc « var CARTE_W … CARTE_NOMS ».

Sources : contours IGN Admin Express (projet france-geojson, licence ouverte Etalab 2.0) ;
centres des communes : API Découpage administratif (geo.api.gouv.fr, licence ouverte).
Le second argument est la population minimale d'une commune pour être retrouvée par son nom
(quand le code postal manque) ; seuls les noms uniques en France sont retenus, pour ne jamais placer
un prospect dans la mauvaise commune.
"""
import json, math, sys, unicodedata
D = sys.argv[1]
K, LON0, LAT0, COS = 100.0, -5.3, 51.15, math.cos(math.radians(46.5))
def proj(lon, lat): return ((lon - LON0) * COS * K, (LAT0 - lat) * K)
ALPHA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"
def enc(v):  # 2 caractères, pas de 0,25 unité
    n = max(0, min(4095, round(v * 4)));  return ALPHA[n // 64] + ALPHA[n % 64]
def norm(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("-", " ").replace("'", " ").replace("’", " ")
    s = " ".join(("saint" if w == "st" else "sainte" if w == "ste" else w) for w in s.split())
    return s
deps = json.load(open(D + "/dep-s.geojson"))["features"]
sortie, W, H = [], 0, 0
for f in deps:
    g = f["geometry"]; polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    d, best = [], (0, 0, 0)
    for poly in polys:
        for k, ring in enumerate(poly):
            pts = [proj(*p) for p in ring]
            if pts[0] == pts[-1]: pts = pts[:-1]
            seg, prev = [], None
            for i, (x, y) in enumerate(pts):
                xi, yi = round(x * 10), round(y * 10)
                if i == 0: seg.append("M%s %s" % (xi / 10, yi / 10)); px, py = xi, yi
                else:
                    dx, dy = xi - px, yi - py
                    if dx == 0 and dy == 0: continue
                    seg.append("l%s %s" % (dx / 10, dy / 10)); px, py = xi, yi
            d.append("".join(seg).replace(".0 ", " ").replace(".0l", "l") + "z")
            if k == 0:  # centroïde de l'anneau extérieur le plus grand
                a = cx = cy = 0
                for i in range(len(pts)):
                    x0, y0 = pts[i]; x1, y1 = pts[(i + 1) % len(pts)]; c = x0 * y1 - x1 * y0
                    a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
                if abs(a) > abs(best[0]): best = (a, cx / (3 * a), cy / (3 * a))
            for x, y in pts: W, H = max(W, x), max(H, y)
    sortie.append([f["properties"]["code"], f["properties"]["nom"], "".join(d), round(best[1], 1), round(best[2], 1)])
sortie.sort()
communes = json.load(open(D + "/communes.json"))
cp, noms, vus = {}, {}, {}
for c in communes:
    if c.get("centre"): vus[norm(c["nom"])] = vus.get(norm(c["nom"]), 0) + 1
for c in communes:
    if not c.get("centre") or c["codeDepartement"] > "95": continue
    x, y = proj(*c["centre"]["coordinates"]); pop = c.get("population") or 0
    for code in c.get("codesPostaux", []):
        if code not in cp or pop > cp[code][2]: cp[code] = (x, y, pop)
    n = norm(c["nom"])
    if pop >= int(sys.argv[2]) and vus[n] == 1: noms[n] = (x, y, pop, c["codeDepartement"])
CP = "".join(k + enc(v[0]) + enc(v[1]) for k, v in sorted(cp.items()))
NOMS = "|".join(k + "=" + enc(v[0]) + enc(v[1]) + v[3] for k, v in sorted(noms.items()))
js = ("/* Carte de France : contours des départements (IGN Admin Express via france-geojson, licence ouverte Etalab 2.0), simplifiés avec mapshaper ;\n"
      "   centres des communes : API Découpage administratif (geo.api.gouv.fr). Projection équirectangulaire (cos 46,5°), 1 unité ≈ 1,1 km. */\n"
      "var CARTE_W = %d, CARTE_H = %d;\nvar CARTE_DEPTS = %s;\nvar CARTE_CP = \"%s\";\nvar CARTE_NOMS = \"%s\";\n"
      % (math.ceil(W) + 4, math.ceil(H) + 4, json.dumps(sortie, ensure_ascii=False, separators=(",", ":")), CP, NOMS))
open(D + "/carte-data.js", "w").write(js)
print("dép.", len(sortie), "CP", len(cp), "noms", len(noms), "taille", len(js.encode()), "W,H", W, H,
      "chemins", sum(len(s[2]) for s in sortie), "CP", len(CP), "NOMS", len(NOMS))
