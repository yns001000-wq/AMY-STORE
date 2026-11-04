#!/usr/bin/env python3
"""Prépare automatiquement des aperçus de sites pour des prospects du suivi (aucun envoi).

Usage :
    python outils/preparer_apercus.py --ids 3,5,14        # prospects précis (colonne id)
    python outils/preparer_apercus.py --nombre 5          # les 5 premiers prospects « nouveau »

Pour chaque prospect : crée une fiche JSON (sorties/apercus/fiches/), génère l'aperçu non indexable
(sorties/apercus/<slug>-apercu/) et met à jour le suivi (colonne apercu = oui, prochaine action).

Règles : aucun avis, aucun label, aucun chiffre inventé. Les textes sont des propositions génériques
du métier, signalées « à valider ensemble ». Les photos sont des photos libres de démonstration (CC0).
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import crm  # noqa: E402
import generer_site  # noqa: E402

SORTIE = crm.RACINE / "sorties" / "apercus"
TEL_DEFAUT = "Votre numéro"

ARTISAN_IMG = {"hero": "images-demo/plomberie-robinet.jpg", "galerie": [
    {"src": "images-demo/plomberie-salle-de-bain.jpg", "legende": "Exemple de réalisation"},
    {"src": "images-demo/plomberie-douche.jpg", "legende": "Exemple de réalisation"},
    {"src": "images-demo/plomberie-tuyaux.jpg", "legende": "Exemple de réalisation"},
    {"src": "images-demo/plomberie-cuisine.jpg", "legende": "Exemple de réalisation"}]}
BEAUTE_IMG = {"hero": "images-demo/beaute-salon.jpg", "galerie": [
    {"src": "images-demo/beaute-bac.jpg", "legende": "Vos photos ici"}, {"src": "images-demo/beaute-vernis.jpg", "legende": "Vos photos ici"},
    {"src": "images-demo/beaute-ongles.jpg", "legende": "Vos photos ici"}]}
BOUCHE_IMG = {"hero": "images-demo/patisserie-hero.jpg", "galerie": [
    {"src": "images-demo/patisserie-fraisier.jpg", "legende": "Vos créations ici"}, {"src": "images-demo/patisserie-chocolat.jpg", "legende": "Vos créations ici"},
    {"src": "images-demo/patisserie-citron.jpg", "legende": "Vos créations ici"}, {"src": "images-demo/patisserie-cookies.jpg", "legende": "Vos créations ici"}]}

# Contenu générique par métier : (modèle, couleur, services ou prestations, images)
METIERS = {
    "Plombier": ("artisan", "#1d5fd1", [("Dépannage et fuites", "Robinetterie, WC, évacuations, recherche de fuite."),
                                        ("Salle de bain", "Douche, baignoire, meubles vasques, rénovation."),
                                        ("Chauffe-eau", "Remplacement et entretien."),
                                        ("Installation neuve", "Raccordements et réseaux d'eau.")], ARTISAN_IMG),
    "Chauffagiste": ("artisan", "#c2410c", [("Chaudières et pompes à chaleur", "Installation, remplacement, mise en service."),
                                            ("Entretien annuel", "Contrôle, nettoyage et attestation d'entretien."),
                                            ("Radiateurs et planchers chauffants", "Pose, équilibrage, désembouage."),
                                            ("Climatisation", "Installation et entretien.")], ARTISAN_IMG),
    "Électricien": ("artisan", "#ca8a04", [("Dépannage électrique", "Pannes, disjonctions, remise en service."),
                                           ("Rénovation et mise aux normes", "Tableau, prises, circuits."),
                                           ("Éclairage", "Intérieur, extérieur, LED."),
                                           ("Bornes et équipements", "Borne de recharge, VMC, chauffage électrique.")], {}),
    "Peintre": ("artisan", "#0f766e", [("Peinture intérieure", "Murs, plafonds, boiseries, finitions soignées."),
                                       ("Façades", "Ravalement, nettoyage, peinture extérieure."),
                                       ("Préparation des supports", "Enduits, rebouchage, ponçage."),
                                       ("Revêtements", "Papiers peints, toile de verre.")], {}),
    "Traiteur": ("artisan", "#9a3412", [("Buffets et repas", "Pour vos fêtes, mariages et anniversaires."),
                                        ("Plateaux repas", "Pour les entreprises et réunions."),
                                        ("Événements", "Menus sur mesure selon votre budget."),
                                        ("Livraison", "Dans votre secteur, à l'heure convenue.")], BOUCHE_IMG),
    "Pâtisserie": ("artisan", "#b0466b", [("Gâteaux de fête", "Anniversaires, baptêmes, mariages."),
                                          ("Douceurs du quotidien", "Tartes, entremets, biscuits."),
                                          ("Sur mesure", "Personnalisation selon votre thème."),
                                          ("Commande facile", "Retrait ou livraison selon disponibilité.")], BOUCHE_IMG),
    "Coiffure": ("beaute", "#8a5a44", [("Coiffure", [("Coupe + brushing", "", "Tarif à préciser"), ("Couleur", "", "Tarif à préciser"),
                                                    ("Balayage", "", "Tarif à préciser"), ("Coupe homme", "", "Tarif à préciser")])], BEAUTE_IMG),
    "Soins de beauté": ("beaute", "#9d4e6a", [("Soins", [("Soin du visage", "", "Tarif à préciser"), ("Épilations", "", "Tarif à préciser"),
                                                         ("Manucure", "", "Tarif à préciser"), ("Semi-permanent", "", "Tarif à préciser")])], BEAUTE_IMG),
}


# Textes du modèle artisan adaptés aux métiers de bouche (traiteur, pâtisserie)
BOUCHE_TEXTES = {
    "libelle_realisations": "Créations", "titre_realisations": "Nos dernières créations",
    "titre_contact": "Une date, un événement, une envie ?", "texte_whatsapp": "Nous écrire sur WhatsApp",
    "titre_zone": "Secteur de livraison", "titre_apropos": "Fait maison, près de chez vous",
    "etapes": [{"titre": "Vous nous contactez", "texte": "Date, nombre de personnes, envies : quelques mots suffisent."},
               {"titre": "Une proposition claire", "texte": "Un menu et un prix annoncés avant de commander."},
               {"titre": "Prêt à l'heure convenue", "texte": "Retrait ou livraison, selon ce qui vous arrange."}],
}


# Accroches de proposition, sans affirmation invérifiable (à valider avec le prospect)
ACCROCHES = {
    "Plombier": "Dépannage, installation et rénovation de plomberie à {ville} et alentours.",
    "Chauffagiste": "Installation, entretien et dépannage de votre chauffage à {ville} et alentours.",
    "Électricien": "Dépannage, rénovation et mise aux normes électriques à {ville} et alentours.",
    "Peintre": "Peinture intérieure et extérieure, finitions soignées, à {ville} et alentours.",
    "Traiteur": "Buffets, plateaux repas et menus pour vos événements, à {ville} et alentours.",
    "Pâtisserie": "Gâteaux de fête et douceurs sur commande, à {ville}.",
    "Coiffure": "Coupe, couleur et soins à {ville}. Tarifs affichés, rendez-vous en un geste.",
    "Soins de beauté": "Soins et beauté à {ville}. Tarifs affichés, rendez-vous en un geste.",
}


def slugifier(texte: str) -> str:
    t = unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:50] or "prospect"


def nettoyer_nom(nom: str) -> str:
    nom = re.sub(r"\s*\([^)]*\)", "", nom).strip()  # retire « (sigle) »
    return re.sub(r"^(Sarl|Sas|Sasu|Eurl)\s+", "", nom, flags=re.I).strip() or nom


def fiche_pour(prospect: dict) -> dict | None:
    metier = prospect.get("metier", "")
    if metier not in METIERS:
        return None
    modele, couleur, contenu, images = METIERS[metier]
    nom = nettoyer_nom(prospect["entreprise"])
    ville = prospect.get("ville") or "votre ville"
    fiche = {
        "_note": f"Aperçu généré automatiquement le {dt.date.today():%d/%m/%Y} pour le prospect n°{prospect.get('id')} — à valider avec lui.",
        "modele": modele, "pays": prospect.get("pays") or "FR", "slug": slugifier(nom + "-" + ville),
        "nom": nom, "metier": metier if modele != "beaute" else f"{metier}", "ville": ville,
        "zone": f"{ville} et alentours (zone à préciser).",
        "accroche": ACCROCHES.get(metier, "Votre activité présentée clairement, joignable en un geste depuis un téléphone.").format(ville=ville),
        "description": f"{nom}, {metier.lower()} à {ville}. Ce texte sera remplacé par votre présentation : votre parcours, votre façon de travailler et ce que vos clients apprécient.",
        "telephone": prospect.get("telephone") or TEL_DEFAUT, "couleur": couleur,
        "images": images, "numero_entreprise": prospect.get("siren", ""),
        "avis_a_venir": True,  # emplacement des VRAIS avis Google du prospect, jamais d'avis inventés
    }
    if modele == "artisan":
        fiche["services"] = [{"titre": t, "texte": x} for t, x in contenu]
        if metier in ("Traiteur", "Pâtisserie"):
            fiche.update(BOUCHE_TEXTES)
            fiche["titre"] = f"{metier} à {ville}"
    else:
        fiche["prestations"] = [{"categorie": c, "liste": [{"nom": n, "duree": d, "prix": p} for n, d, p in lst]} for c, lst in contenu]
    if not fiche["images"]:
        fiche.pop("images")
    return fiche


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--ids", help="Identifiants (colonne id) séparés par des virgules")
    g.add_argument("--nombre", type=int, help="Nombre de prospects « nouveau » à traiter")
    ap.add_argument("--fichier", type=Path, default=crm.DONNEES / "prospects.csv")
    ap.add_argument("--sortie", type=Path, default=SORTIE)
    a = ap.parse_args(argv)

    with a.fichier.open(encoding="utf-8-sig", newline="") as f:
        lecteur = csv.DictReader(f)
        colonnes, lignes = lecteur.fieldnames, list(lecteur)
    if a.ids:
        voulus = {i.strip() for i in a.ids.split(",")}
        cibles = [l for l in lignes if l.get("id") in voulus]
    else:
        cibles = [l for l in lignes if l.get("statut") == "nouveau" and l.get("apercu") != "oui" and l.get("metier") in METIERS][: a.nombre]
    (a.sortie / "fiches").mkdir(parents=True, exist_ok=True)
    faits = 0
    for l in cibles:
        if l.get("statut") == "ne_pas_contacter":
            print(f"- {l['entreprise']} : ignoré (ne pas contacter)")
            continue
        fiche = fiche_pour(l)
        if not fiche:
            print(f"- {l['entreprise']} : métier « {l.get('metier')} » sans modèle d'aperçu, ignoré")
            continue
        (a.sortie / "fiches" / f"{fiche['slug']}.json").write_text(json.dumps(fiche, ensure_ascii=False, indent=2), encoding="utf-8")
        dossier, _ = generer_site.generer(fiche, a.sortie, apercu=True, base=generer_site.MODELES)
        l["apercu"] = "oui"
        if not l.get("prochaine_action"):
            l["prochaine_action"] = "Montrer l'aperçu (appel ou visite) — compléter le téléphone avant"
            l["date_prochaine_action"] = dt.date.today().isoformat()
        print(f"- {l['entreprise']} → {dossier / 'index.html'}")
        faits += 1
    with a.fichier.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=colonnes)
        w.writeheader()
        w.writerows(lignes)
    print(f"\n{faits} aperçu(s) prêt(s). Rien n'a été envoyé : à montrer au prospect avec son accord.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
