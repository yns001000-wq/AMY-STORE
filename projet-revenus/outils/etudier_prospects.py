#!/usr/bin/env python3
"""Rassemble des indices VÉRIFIABLES sur chaque prospect, pour que l'IA du cockpit classe mieux l'établissement
(snack ou restaurant, pizzeria, kebab, brasserie…) avant de créer son site sur mesure.

Sources publiques, sans clé :
- OpenStreetMap (API 0.6) : catégorie, cuisine, vente à emporter, livraison, terrasse, horaires, SIRET, enseigne ;
- API Recherche d'entreprises (Sirene, data.gouv.fr) : code NAF déclaré, enseigne, date de création.

Le résultat est un fichier JSON {id_prospect: {"indices": "texte lisible", "etude_auto": {...}}} à charger
dans le cockpit (champ « indices » des fiches prospects). Rien n'est envoyé à qui que ce soit.

Usage :
    python outils/etudier_prospects.py --dossier EXPORT_DB/prospects --sortie crm/donnees/indices.json
    python outils/etudier_prospects.py --csv crm/donnees/prospects.csv --sortie crm/donnees/indices.json
Options : --metiers Snack,Restaurant (par défaut : tous) ; --sans-sirene.
Données © contributeurs OpenStreetMap (ODbL) et INSEE (Sirene, licence ouverte). Bibliothèque standard uniquement.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

UA = {"User-Agent": "Mysite-prospection/1.0 (outil interne, faible volume)"}
OSM_API = "https://api.openstreetmap.org/api/0.6/"
SIRENE = "https://recherche-entreprises.api.gouv.fr/search?"

NAF = {
    "56.10A": "Restauration traditionnelle", "56.10B": "Cafétérias et autres libres-services", "56.10C": "Restauration de type rapide",
    "56.21Z": "Services des traiteurs", "56.29A": "Restauration collective sous contrat", "56.29B": "Autres services de restauration",
    "56.30Z": "Débits de boissons", "10.71C": "Boulangerie et boulangerie-pâtisserie", "10.71D": "Pâtisserie", "47.24Z": "Commerce de détail de pain, pâtisserie et confiserie",
    "96.02A": "Coiffure", "96.02B": "Soins de beauté", "43.22A": "Travaux d'installation d'eau et de gaz", "43.22B": "Travaux d'installation d'équipements thermiques et de climatisation",
    "43.21A": "Travaux d'installation électrique", "43.34Z": "Travaux de peinture et vitrerie", "47.11B": "Commerce d'alimentation générale",
}
CUISINES = {"pizza": "pizza", "kebab": "kebab", "burger": "burger", "sandwich": "sandwich", "french": "française", "italian": "italienne", "asian": "asiatique",
            "chinese": "chinoise", "japanese": "japonaise", "sushi": "sushi", "thai": "thaïlandaise", "vietnamese": "vietnamienne", "indian": "indienne",
            "lebanese": "libanaise", "turkish": "turque", "moroccan": "marocaine", "couscous": "couscous", "regional": "régionale", "lyonnais": "lyonnaise",
            "tacos": "tacos", "mexican": "mexicaine", "crepe": "crêpes", "chicken": "poulet", "fish_and_chips": "fish and chips", "bagel": "bagels",
            "coffee_shop": "café", "tea": "salon de thé", "steak_house": "grillades", "seafood": "fruits de mer", "african": "africaine", "korean": "coréenne",
            "greek": "grecque", "spanish": "espagnole", "portuguese": "portugaise", "vegetarian": "végétarienne", "vegan": "végane", "brunch": "brunch",
            "breakfast": "petit-déjeuner", "pasta": "pâtes", "bistro": "bistrot", "brasserie": "brasserie", "fine_dining": "gastronomique", "ice_cream": "glaces"}
OUI = {"yes": "oui", "no": "non", "only": "uniquement"}


def lire_json(url: str, essais: int = 3):
    for i in range(essais):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return json.load(r)
        except Exception as e:  # réseau capricieux : on réessaie calmement
            if i == essais - 1:
                print(f"  ! {url[:90]}… : {e}", file=sys.stderr)
                return None
            time.sleep(2 * (i + 1))


def norm(t: str) -> str:
    t = unicodedata.normalize("NFKD", t or "").encode("ascii", "ignore").decode().lower()
    t = re.sub(r"\b(sarl|sas|sasu|eurl|ei|ets|le|la|les|l|chez|restaurant|snack)\b", " ", t)
    return re.sub(r"[^a-z0-9]+", "", t)


def charger(a) -> list[dict]:
    if a.dossier:
        res = []
        for f in sorted(Path(a.dossier).glob("*.json")):
            d = json.loads(f.read_text(encoding="utf-8"))
            d = d.get("data", d)
            d.setdefault("id", f.stem)
            res.append(d)
        return res
    with open(a.csv, encoding="utf-8") as f:
        return [dict(r, id="p" + r["id"]) for r in csv.DictReader(f)]


def refs_osm(p: dict) -> tuple[str, str] | None:
    m = re.search(r"openstreetmap\.org/(node|way|relation)/(\d+)", (p.get("notes") or "") + " " + (p.get("osm") or ""))
    return (m.group(1), m.group(2)) if m else None


def tags_osm(prospects: list[dict]) -> dict[str, dict]:
    """Étiquettes OSM de chaque prospect, par lots de 100 (API officielle, pas Overpass)."""
    par_type: dict[str, list[tuple[str, str]]] = {"node": [], "way": [], "relation": []}
    for p in prospects:
        r = refs_osm(p)
        if r:
            par_type[r[0]].append((r[1], p["id"]))
    res = {}
    for typ, liste in par_type.items():
        for i in range(0, len(liste), 100):
            lot = liste[i:i + 100]
            d = lire_json(f"{OSM_API}{typ}s.json?{typ}s=" + ",".join(x[0] for x in lot))
            par_id = {str(e["id"]): e.get("tags", {}) for e in (d or {}).get("elements", [])}
            for oid, pid in lot:
                if oid in par_id:
                    res[pid] = par_id[oid]
            time.sleep(1)
    return res


def sirene(p: dict, t: dict) -> dict | None:
    """Établissement Sirene : par SIRET (OSM), par SIREN, sinon par nom + code postal (accepté seulement si le nom concorde)."""
    siret = re.sub(r"\D", "", t.get("ref:FR:SIRET", ""))
    q = siret if len(siret) == 14 else (p.get("siren") or "")
    params = {"q": q or p.get("entreprise", ""), "per_page": 5}
    cp = p.get("code_postal") or ""
    if not q and re.fullmatch(r"\d{5}", cp):
        params["code_postal"] = cp
    d = lire_json(SIRENE + urllib.parse.urlencode(params))
    time.sleep(0.25)  # limite de l'API : 7 requêtes par seconde
    cible = norm(p.get("entreprise", ""))
    for r in (d or {}).get("results", []):
        for e in r.get("matching_etablissements", []) or []:
            noms = [r.get("nom_complet", "")] + (e.get("liste_enseignes") or []) + [e.get("nom_commercial") or ""]
            if q or (cible and any(cible and (cible in norm(n) or norm(n) in cible) and len(norm(n)) > 2 for n in noms)):
                if siret and e.get("siret") and e["siret"] != siret:
                    continue
                if not q and cp and e.get("code_postal") != cp:
                    continue
                return {"naf": e.get("activite_principale") or r.get("activite_principale"), "enseignes": e.get("liste_enseignes") or [],
                        "date_creation": e.get("date_creation") or r.get("date_creation"), "siret": e.get("siret"),
                        "ferme": (e.get("etat_administratif") == "F"), "par": "siret" if siret else "siren" if q else "nom + code postal"}
    return None


def resume(t: dict, s: dict | None) -> tuple[str, dict]:
    morceaux, auto = [], {}
    if t:
        cat = t.get("amenity") or t.get("shop") or t.get("craft") or ""
        auto["osm"] = {k: v for k, v in t.items() if k in ("amenity", "shop", "craft", "cuisine", "takeaway", "delivery", "outdoor_seating", "opening_hours",
                                                             "diet:vegetarian", "diet:halal", "brand", "website", "contact:website", "wheelchair", "capacity", "drive_through", "description")}
        lib = {"fast_food": "restauration rapide", "restaurant": "restaurant", "cafe": "café", "bar": "bar", "pastry": "pâtisserie", "bakery": "boulangerie"}.get(cat, cat)
        morceaux.append(f"OpenStreetMap : {lib}")
        if t.get("cuisine"):
            morceaux.append("cuisine : " + ", ".join(CUISINES.get(c.strip(), c.strip()) for c in t["cuisine"].split(";")))
        for k, l in (("takeaway", "à emporter"), ("delivery", "livraison"), ("outdoor_seating", "terrasse"), ("drive_through", "drive"), ("diet:halal", "halal")):
            if t.get(k) in OUI:
                morceaux.append(f"{l} : {OUI[t[k]]}")
        if t.get("opening_hours"):
            morceaux.append("horaires (OSM, à vérifier) : " + t["opening_hours"])
        if t.get("brand"):
            morceaux.append("marque/franchise : " + t["brand"])
        if t.get("description"):
            morceaux.append("description OSM : " + t["description"][:160])
    if s:
        auto["sirene"] = s
        txt = f"Sirene : NAF {s['naf']} ({NAF.get(s['naf'] or '', 'code déclaré')})" if s.get("naf") else "Sirene : NAF inconnu"
        if s.get("enseignes"):
            txt += " · enseigne : " + ", ".join(s["enseignes"][:2])
        if s.get("date_creation"):
            txt += " · établissement créé en " + s["date_creation"][:4]
        if s.get("ferme"):
            txt += " · ATTENTION : établissement fermé selon Sirene"
        if s.get("par") == "nom + code postal":
            txt += " (rapprochement par nom, à confirmer)"
        morceaux.append(txt)
    return " · ".join(morceaux), auto


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dossier", help="Dossier de fiches JSON exportées du cockpit (une par prospect)")
    g.add_argument("--csv", help="Fichier prospects.csv")
    ap.add_argument("--sortie", required=True)
    ap.add_argument("--metiers", default="")
    ap.add_argument("--sans-sirene", action="store_true")
    a = ap.parse_args()
    pros = charger(a)
    if a.metiers:
        garde = {m.strip() for m in a.metiers.split(",")}
        pros = [p for p in pros if p.get("metier") in garde]
    print(f"{len(pros)} prospect(s) à étudier")
    osm = tags_osm(pros)
    print(f"  OpenStreetMap : {len(osm)} fiche(s) lue(s)")
    sortie, n_sir = {}, 0
    for i, p in enumerate(pros, 1):
        t = osm.get(p["id"], {})
        s = None if a.sans_sirene else sirene(p, t)
        n_sir += bool(s)
        txt, auto = resume(t, s)
        if txt:
            auto["maj"] = dt.date.today().isoformat()
            sortie[p["id"]] = {"indices": txt, "etude_auto": auto}
        if i % 25 == 0:
            print(f"  {i}/{len(pros)}…")
    Path(a.sortie).write_text(json.dumps(sortie, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  Sirene : {n_sir} établissement(s) rapproché(s)")
    print(f"{len(sortie)} fiche(s) d'indices écrites dans {a.sortie}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
