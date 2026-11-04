#!/usr/bin/env python3
"""Trouve des prospects AVEC numéro de téléphone grâce à OpenStreetMap (sans Google Maps).

Principe : OpenStreetMap recense des artisans et commerces avec leur téléphone public.
On garde ceux qui ont un téléphone mais AUCUN site web : ce sont les meilleures cibles.
L'outil peut aussi compléter le téléphone des prospects déjà suivis (même nom, même ville).

Usage :
    python outils/prospects_osm.py --departements 69,42,38            # aperçu (rien n'est écrit)
    python outils/prospects_osm.py --departements 69 --ajouter         # ajoute au suivi crm/donnees/prospects.csv
    python outils/prospects_osm.py --departements 69 --completer       # complète les téléphones manquants

Données © contributeurs OpenStreetMap, licence ODbL (usage interne de prospection ; citer la source si publication).
Les numéros sont professionnels (publiés pour l'activité). Prospection B2B : voir LEGAL.md et MARCHES.md.
Bibliothèque standard Python uniquement.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import crm  # noqa: E402

SERVEURS = ["https://overpass-api.de/api/interpreter",
            "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter"]
if os.environ.get("OVERPASS_URL"):  # pour forcer un serveur précis
    SERVEURS = [os.environ["OVERPASS_URL"]]
UA = {"User-Agent": "Mysite-prospection/1.0 (outil interne, respect des conditions Overpass)"}

# Étiquettes OpenStreetMap → métier du suivi (les mêmes que trouver_prospects.py)
CIBLES = {
    ("craft", "plumber"): "Plombier", ("craft", "hvac"): "Chauffagiste", ("craft", "heating_engineer"): "Chauffagiste",
    ("craft", "electrician"): "Électricien", ("craft", "painter"): "Peintre", ("craft", "caterer"): "Traiteur",
    ("shop", "pastry"): "Pâtisserie", ("shop", "hairdresser"): "Coiffure", ("shop", "beauty"): "Soins de beauté",
}
SEGMENT = {"Plombier": "A", "Chauffagiste": "A", "Électricien": "A", "Peintre": "A"}


def requete(departement: str) -> str:
    """Une requête par département. Le Rhône est découpé en 69D (Rhône) et 69M (Métropole de Lyon)."""
    code = "^(69|69D|69M)$" if departement == "69" else f"^{departement}$"
    corps = "".join(f'nwr(area.d)["{cle}"="{val}"]["name"];' for (cle, val) in CIBLES)
    return f'[out:json][timeout:150];area["ref:INSEE"~"{code}"]["admin_level"="6"]->.d;({corps});out center tags;'


def interroger(q: str, essais: int = 3) -> dict:
    derniere = None
    for tentative in range(essais):
        for url in SERVEURS:
            try:
                req = urllib.request.Request(url, data=urllib.parse.urlencode({"data": q}).encode(), headers=UA)
                with urllib.request.urlopen(req, timeout=170) as r:
                    return json.load(r)
            except Exception as err:  # serveur saturé ou injoignable : on essaie le suivant, puis on patiente
                derniere = err
        time.sleep(15 * (tentative + 1))
    raise RuntimeError(f"Aucun serveur Overpass n'a répondu ({derniere})")


def tel_fr(brut: str) -> str:
    """« +33 4 72 00 00 00 » → « 04 72 00 00 00 ». Garde le premier numéro s'il y en a plusieurs."""
    brut = re.split(r"[;,/]", brut)[0]
    c = re.sub(r"[^\d+]", "", brut)
    if c.startswith("+33"):
        c = "0" + c[3:]
    elif c.startswith("0033"):
        c = "0" + c[4:]
    if re.fullmatch(r"0\d{9}", c):
        return " ".join(c[i:i + 2] for i in range(0, 10, 2))
    return brut.strip()


def cle_nom(nom: str) -> str:
    t = unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode().lower()
    t = re.sub(r"\b(sarl|sas|sasu|eurl|ei|ets|entreprise)\b", " ", t)
    return re.sub(r"[^a-z0-9]+", "", t)


def extraire(donnees: dict) -> list[dict]:
    res = []
    for el in donnees.get("elements", []):
        t = el.get("tags", {})
        metier = next((m for (k, v), m in CIBLES.items() if t.get(k) == v), None)
        tel = t.get("phone") or t.get("contact:phone") or t.get("contact:mobile") or t.get("mobile")
        if not metier or not tel:
            continue
        site = t.get("website") or t.get("contact:website") or t.get("url")
        res.append({
            "entreprise": t["name"], "metier": metier, "telephone": tel_fr(tel),
            "ville": t.get("addr:city", ""), "code_postal": t.get("addr:postcode", ""),
            "adresse": " ".join(x for x in (t.get("addr:housenumber"), t.get("addr:street"), t.get("addr:postcode"), t.get("addr:city")) if x),
            "email": t.get("email") or t.get("contact:email") or "",
            "site_existant": site or "", "facebook": t.get("contact:facebook") or t.get("facebook") or "",
            "osm": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
            "lat": el.get("lat") or (el.get("center") or {}).get("lat"), "lon": el.get("lon") or (el.get("center") or {}).get("lon"),
        })
    return res


def ville_depuis(lat: float, lon: float) -> tuple[str, str]:
    """Commune d'un point via Nominatim (1 requête par seconde au plus, comme l'exige son règlement)."""
    time.sleep(1.1)
    url = "https://nominatim.openstreetmap.org/reverse?" + urllib.parse.urlencode({"lat": lat, "lon": lon, "format": "json", "zoom": 12})
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
            adr = json.load(r).get("address", {})
        return adr.get("city") or adr.get("town") or adr.get("village") or adr.get("municipality") or "", adr.get("postcode", "")
    except Exception:
        return "", ""


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--departements", required=True, help="Codes séparés par des virgules (ex. 69,42,38)")
    ap.add_argument("--ajouter", action="store_true", help="Ajoute au suivi les entreprises AVEC téléphone et SANS site")
    ap.add_argument("--completer", action="store_true", help="Complète le téléphone des prospects déjà suivis")
    ap.add_argument("--fichier", type=Path, default=crm.DONNEES / "prospects.csv")
    ap.add_argument("--json", type=Path, help="Utiliser une réponse Overpass déjà téléchargée (tests)")
    ap.add_argument("--max-par-metier", type=int, default=0, help="Avec --ajouter : nombre maximum de nouveaux prospects par métier")
    ap.add_argument("--villes", action="store_true", help="Avec --ajouter : retrouver la commune manquante (Nominatim, 1 requête/s)")
    a = ap.parse_args(argv)

    deps = [d.strip().upper() for d in a.departements.split(",") if d.strip()]
    if a.json:
        trouves = extraire(json.loads(a.json.read_text(encoding="utf-8")))
    else:
        trouves = []
        for d in deps:
            print(f"Département {d} : interrogation d'OpenStreetMap…", flush=True)
            try:
                trouves += extraire(interroger(requete(d)))
            except RuntimeError as err:
                print(f"  Département {d} ignoré pour cette fois : {err}. Relancez plus tard.")
    sans_site = [x for x in trouves if not x["site_existant"]]
    print(f"OpenStreetMap : {len(trouves)} entreprise(s) avec téléphone, dont {len(sans_site)} sans site web.")

    with a.fichier.open(encoding="utf-8-sig", newline="") as f:
        lecteur = csv.DictReader(f)
        colonnes, lignes = list(lecteur.fieldnames), list(lecteur)
    index = {(cle_nom(l["entreprise"]), cle_nom(l.get("ville", ""))): l for l in lignes}
    index_nom = {cle_nom(l["entreprise"]): l for l in lignes}

    completes = 0
    if a.completer:
        for x in trouves:
            l = index.get((cle_nom(x["entreprise"]), cle_nom(x["ville"]))) or index_nom.get(cle_nom(x["entreprise"]))
            if l is not None and not l.get("telephone") and l.get("statut") != "ne_pas_contacter":
                l["telephone"] = x["telephone"]
                l["notes"] = (l.get("notes", "") + f" | Tél. : OpenStreetMap {x['osm']}").strip(" |")
                completes += 1
                print(f"  + {l['entreprise']} : {x['telephone']}")
        print(f"{completes} téléphone(s) complété(s).")

    nouveaux = []
    if a.ajouter:
        prochain = max([int(l["id"]) for l in lignes if str(l.get("id", "")).isdigit()] + [0]) + 1
        par_metier: dict[str, int] = {}
        for x in sans_site:
            if cle_nom(x["entreprise"]) in index_nom:
                continue
            if a.max_par_metier and par_metier.get(x["metier"], 0) >= a.max_par_metier:
                continue
            par_metier[x["metier"]] = par_metier.get(x["metier"], 0) + 1
            ligne = {c: "" for c in colonnes}
            ligne.update({"id": str(prochain), "date_ajout": dt.date.today().isoformat(), "pays": "FR",
                          "segment": SEGMENT.get(x["metier"], "B"), "entreprise": x["entreprise"], "metier": x["metier"],
                          "ville": x["ville"], "code_postal": x["code_postal"], "adresse": x["adresse"],
                          "telephone": x["telephone"], "email": x["email"], "site_existant": "non",
                          "source": "OpenStreetMap (ODbL)", "statut": "nouveau",
                          "notes": f"Fiche OSM : {x['osm']}" + (f" | Facebook : {x['facebook']}" if x["facebook"] else "")})
            if not ligne["ville"] and x.get("lat") and a.villes:
                ligne["ville"], cp = ville_depuis(x["lat"], x["lon"])
                ligne["code_postal"] = ligne["code_postal"] or cp
            nouveaux.append(ligne)
            index_nom[cle_nom(x["entreprise"])] = ligne
            prochain += 1
        lignes += nouveaux
        print(f"{len(nouveaux)} nouveau(x) prospect(s) avec téléphone ajouté(s) au suivi.")
    else:
        for x in sans_site[:30]:
            print(f"  - {x['entreprise']} ({x['metier']}, {x['ville'] or '?'}) : {x['telephone']}")
        if len(sans_site) > 30:
            print(f"  … et {len(sans_site) - 30} autre(s). Ajoutez --ajouter pour les enregistrer.")

    if completes or nouveaux:
        with a.fichier.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=colonnes)
            w.writeheader()
            w.writerows(lignes)
    print("Rien n'a été envoyé à personne. Données © contributeurs OpenStreetMap (ODbL).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
