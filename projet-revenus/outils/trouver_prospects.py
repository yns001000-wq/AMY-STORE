#!/usr/bin/env python3
"""Trouve des entreprises locales récentes via l'API publique officielle « Recherche d'entreprises »
(https://recherche-entreprises.api.gouv.fr — gratuite, sans clé, données Sirene sous Licence Ouverte).

Ce que fait l'outil :
  - interroge l'API par code NAF (métier) et code postal ou département ;
  - garde les établissements ACTIFS, créés depuis la date choisie ;
  - EXCLUT les entreprises ayant fait opposition à l'utilisation commerciale de leurs données ;
  - ajoute les nouveaux prospects (sans doublon) au fichier de suivi avec le statut « nouveau ».

Ce qu'il ne fait PAS : il ne récupère ni téléphone ni email (l'API n'en fournit pas) et n'envoie
aucun message. Les coordonnées se complètent à la main depuis des sources publiques.

Exemples :
    python outils/trouver_prospects.py --naf 43.22A,43.21A --code-postal 69100 --segment A-artisans --depuis 2024-01-01
    python outils/trouver_prospects.py --naf 56.21Z,10.71D --departement 42 --segment B-food-beaute --max 20 --essai
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import crm  # noqa: E402

API = "https://recherche-entreprises.api.gouv.fr/search"
PAUSE = 0.25  # l'API autorise au maximum 7 requêtes/seconde : on reste largement en dessous
AGENT = "projet-revenus-prospection/1.0 (outil interne, faible volume)"

METIERS = {
    "43.21A": "Électricien", "43.22A": "Plombier", "43.22B": "Chauffagiste",
    "43.32A": "Menuisier", "43.33Z": "Carreleur / solier", "43.34Z": "Peintre",
    "43.91B": "Couvreur", "81.21Z": "Nettoyage", "81.30Z": "Paysagiste / jardinier",
    "56.10A": "Restaurant", "56.10C": "Restauration rapide", "56.21Z": "Traiteur",
    "10.71C": "Boulangerie-pâtisserie", "10.71D": "Pâtisserie",
    "96.02A": "Coiffure", "96.02B": "Soins de beauté", "96.04Z": "Bien-être",
    "74.20Z": "Photographe", "85.51Z": "Coach sportif",
}

COLONNES = None  # lues depuis le modèle CSV


def colonnes() -> list[str]:
    global COLONNES
    if COLONNES is None:
        with (crm.MODELES / "prospects.csv").open(encoding="utf-8") as f:
            COLONNES = next(csv.reader(f))
    return COLONNES


def appeler_api(params: dict) -> dict:
    url = API + "?" + urllib.parse.urlencode(params)
    for essai in range(4):
        req = urllib.request.Request(url, headers={"User-Agent": AGENT, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as err:
            if err.code == 429 and essai < 3:
                time.sleep(2 ** (essai + 1))
                continue
            raise
        except urllib.error.URLError:
            if essai < 3:
                time.sleep(2 ** (essai + 1))
                continue
            raise
    raise RuntimeError("API indisponible")


def extraire(resultat: dict, depuis: dt.date | None) -> dict | None:
    """Transforme un résultat d'API en ligne de prospect, ou None s'il faut l'écarter."""
    if resultat.get("opposition_diffusion_commerciale"):
        return None  # la personne s'est opposée à la prospection : on respecte
    if resultat.get("etat_administratif") != "A":
        return None
    etabs = [e for e in (resultat.get("matching_etablissements") or []) if e.get("etat_administratif") == "A"]
    if not etabs:
        return None
    et = etabs[0]
    creation = crm.date(et.get("date_creation") or "") or crm.date(resultat.get("date_creation") or "")
    if depuis and (not creation or creation < depuis):
        return None
    enseignes = et.get("liste_enseignes") or []
    nom = et.get("nom_commercial") or (enseignes[0] if enseignes else "") or resultat.get("nom_complet", "")
    naf = et.get("activite_principale") or resultat.get("activite_principale", "")
    siren = resultat.get("siren", "")
    return {
        "entreprise": nom.title() if nom.isupper() else nom,
        "metier": METIERS.get(naf, naf),
        "naf": naf,
        "ville": (et.get("libelle_commune") or "").title(),
        "code_postal": et.get("code_postal", ""),
        "adresse": et.get("adresse", ""),
        "siren": siren,
        "site_existant": "à vérifier",
        "source": "API Recherche d'entreprises (Sirene)",
        "statut": "nouveau",
        "notes": f"Créé le {creation.isoformat() if creation else '?'} — fiche : https://annuaire-entreprises.data.gouv.fr/entreprise/{siren}",
    }


def chercher(naf: list[str], zone: dict, depuis: dt.date | None, maximum: int, pages_max: int,
             ei_seulement: bool, deja: set[str], appel=appeler_api) -> list[dict]:
    trouves: list[dict] = []
    for code in naf:
        for page in range(1, pages_max + 1):
            params = {"activite_principale": code, "etat_administratif": "A", "per_page": 25, "page": page,
                      "limite_matching_etablissements": 3, **zone}
            if ei_seulement:
                params["est_entrepreneur_individuel"] = "true"
            data = appel(params)
            for r in data.get("results", []):
                ligne = extraire(r, depuis)
                if ligne and ligne["siren"] not in deja:
                    deja.add(ligne["siren"])
                    trouves.append(ligne)
                    if len(trouves) >= maximum:
                        return trouves
            if page >= data.get("total_pages", 0):
                break
            time.sleep(PAUSE)
        time.sleep(PAUSE)
    return trouves


def sirens_existants(chemin: Path) -> set[str]:
    return {p.get("siren", "") for p in crm.lire(chemin.parent, chemin.name) if p.get("siren")}


def ajouter(chemin: Path, lignes: list[dict], segment: str) -> None:
    existant = crm.lire(chemin.parent, chemin.name)
    prochain_id = max([int(p["id"]) for p in existant if p.get("id", "").isdigit()] + [0]) + 1
    aujourd_hui = dt.date.today().isoformat()
    nouveau_fichier = not chemin.exists() or chemin.stat().st_size == 0
    with chemin.open("a", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=colonnes())
        if nouveau_fichier:
            w.writeheader()
        for i, l in enumerate(lignes):
            w.writerow({c: "" for c in colonnes()} | l | {"id": prochain_id + i, "date_ajout": aujourd_hui, "segment": segment})


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--naf", required=True, help="Codes NAF séparés par des virgules (ex. 43.22A,43.21A)")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--code-postal", help="Un ou plusieurs codes postaux séparés par des virgules")
    g.add_argument("--departement", help="Code département (ex. 69)")
    p.add_argument("--segment", required=True, help="Nom du segment testé (ex. A-artisans)")
    p.add_argument("--depuis", help="Établissements créés depuis cette date AAAA-MM-JJ (ex. 2024-01-01)")
    p.add_argument("--max", type=int, default=30, help="Nombre maximum de prospects ajoutés (défaut 30)")
    p.add_argument("--pages", type=int, default=8, help="Pages max par code NAF (25 résultats/page)")
    p.add_argument("--ei", action="store_true", help="Uniquement les entrepreneurs individuels")
    p.add_argument("--fichier", type=Path, default=crm.DONNEES / "prospects.csv")
    p.add_argument("--essai", action="store_true", help="Affiche les résultats sans rien écrire")
    a = p.parse_args(argv)

    zone = {"code_postal": a.code_postal} if a.code_postal else {"departement": a.departement}
    depuis = dt.date.fromisoformat(a.depuis) if a.depuis else None
    naf = [c.strip().upper() for c in a.naf.split(",") if c.strip()]
    if a.fichier == crm.DONNEES / "prospects.csv":
        crm.initialiser()
    deja = sirens_existants(a.fichier)
    try:
        lignes = chercher(naf, zone, depuis, a.max, a.pages, a.ei, deja)
    except (urllib.error.URLError, RuntimeError) as err:
        print(f"ERREUR : impossible de joindre l'API ({err}). Réessayez plus tard.", file=sys.stderr)
        return 1
    for l in lignes:
        print(f"- {l['entreprise']} | {l['metier']} | {l['ville']} | {l['notes'].split(' — ')[0]}")
    if a.essai:
        print(f"\n{len(lignes)} prospect(s) trouvé(s) — mode essai, rien n'a été écrit.")
        return 0
    if lignes:
        ajouter(a.fichier, lignes, a.segment)
    print(f"\n{len(lignes)} nouveau(x) prospect(s) ajouté(s) à {a.fichier}")
    print("Étape suivante : compléter téléphone / site existant depuis des sources publiques, puis contacter.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
