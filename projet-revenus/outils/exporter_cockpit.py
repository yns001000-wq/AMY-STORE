#!/usr/bin/env python3
"""Prépare l'envoi des prospects du suivi local vers le Cockpit Mysite (base privée de l'artifact).

Usage :
    python outils/exporter_cockpit.py                 # tous les prospects
    python outils/exporter_cockpit.py --depuis 2026-11-10   # seulement ceux ajoutés depuis cette date

Écrit dans sorties/cockpit/ : un fichier JSON par prospect et `writes.json`, la liste prête pour
l'outil ArtifactData de Claude (action « batch », 50 écritures maximum par appel ; le script découpe
en writes-1.json, writes-2.json… si besoin). Identifiant de document : « p » + SIREN, comme dans le cockpit,
donc un prospect déjà présent n'est jamais dupliqué. Les champs modifiés dans le cockpit (statut, notes…)
ne sont PAS écrasés si Claude utilise l'action « update » au lieu de « set » pour les prospects existants.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import crm  # noqa: E402

CHAMPS = ["pays", "segment", "entreprise", "metier", "naf", "ville", "code_postal", "adresse", "siren", "telephone", "email",
          "site_existant", "source", "statut", "canal", "date_dernier_contact", "prochaine_action", "date_prochaine_action", "notes"]


def documents(lignes: list[dict]) -> dict[str, dict]:
    docs = {}
    for r in lignes:
        doc = {k: r.get(k, "") for k in CHAMPS}
        doc["statut"] = doc["statut"] or "nouveau"
        doc["cree_le"] = r.get("date_ajout", "")
        doc["journal"] = [{"d": r.get("date_ajout", ""), "t": "Trouvé dans le répertoire officiel des entreprises"}]
        docs["p" + (r.get("siren") or r.get("id", "0"))] = doc
    return docs


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--depuis", help="Date d'ajout minimale AAAA-MM-JJ")
    ap.add_argument("--donnees", type=Path, default=crm.DONNEES)
    ap.add_argument("--sortie", type=Path, default=crm.RACINE / "sorties" / "cockpit")
    a = ap.parse_args(argv)
    lignes = [l for l in crm.lire(a.donnees, "prospects.csv") if not a.depuis or l.get("date_ajout", "") >= a.depuis]
    docs = documents(lignes)
    a.sortie.mkdir(parents=True, exist_ok=True)
    writes = []
    for did, doc in docs.items():
        f = a.sortie / f"{did}.json"
        f.write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        writes.append({"op": "set", "collection": "prospects", "doc_id": did, "file_path": str(f.resolve())})
    for n in range(0, len(writes), 50):
        nom = "writes.json" if len(writes) <= 50 else f"writes-{n // 50 + 1}.json"
        (a.sortie / nom).write_text(json.dumps(writes[n:n + 50], ensure_ascii=False), encoding="utf-8")
    print(f"{len(writes)} prospect(s) prêts pour le cockpit dans {a.sortie}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
