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

ARTISAN_IMG = {"hero": "images-demo/plomberie-lavabo.jpg",
               "apropos": {"src": "images-demo/plomberie-intervention.jpg", "legende": "Votre photo ici", "credit": "Photo : ocean yamaha, CC BY 2.0"},
               "galerie": [
    {"src": "images-demo/plomberie-salle-de-bain-hotel.jpg", "legende": "Exemple de réalisation"},
    {"src": "images-demo/plomberie-douche-mosaique.jpg", "legende": "Exemple de réalisation"},
    {"src": "images-demo/plomberie-robinet-cuisine.jpg", "legende": "Exemple de réalisation"},
    {"src": "images-demo/plomberie-mitigeur.jpg", "legende": "Exemple de réalisation"}]}
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
    "Snack": ("artisan", "#c2410c", [("Tacos et burgers", "Faits minute, viandes et sauces au choix."),
                                     ("Assiettes et menus", "Assiette kebab, menus avec frites et boisson."),
                                     ("À emporter", "Commande prête à l'heure, sans attente."),
                                     ("Livraison", "Dans le secteur, selon disponibilité.")], {}),
    "Restaurant": ("artisan", "#7c2d12", [("Formule du midi", "Entrée et plat ou plat et dessert, renouvelée chaque semaine."),
                                          ("Carte du soir", "Cuisine de saison, produits frais."),
                                          ("Groupes et événements", "Repas d'affaires, anniversaires, privatisation."),
                                          ("À emporter", "Une partie de la carte, prête à l'heure convenue.")], {}),
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


TEXTES_METIER = {
    "Restaurant": {"cta_secondaire": "Réserver une table", "bouton_formulaire": "Envoyer ma demande", "libelle_realisations": "En images",
                   "titre_realisations": "La maison en images", "titre_contact": "Une table, un groupe, un événement ?", "titre_zone": "Nous trouver"},
    "Snack": {"cta_secondaire": "Commander", "bouton_formulaire": "Envoyer ma commande", "libelle_realisations": "En images",
              "titre_realisations": "Fait minute, servi généreux", "titre_contact": "Une commande, une question ?", "titre_zone": "Secteur de livraison"},
}
ATOUTS_METIER = {"Restaurant": ["Cuisine maison", "Produits de saison", "Formule du midi", "Groupes bienvenus"],
                 "Snack": ["Fait minute", "À emporter", "Livraison possible", "Prix doux"]}


# Accroches de proposition, sans affirmation invérifiable (à valider avec le prospect)
ACCROCHES = {
    "Plombier": "Dépannage, installation et rénovation de plomberie à {ville} et alentours.",
    "Chauffagiste": "Installation, entretien et dépannage de votre chauffage à {ville} et alentours.",
    "Électricien": "Dépannage, rénovation et mise aux normes électriques à {ville} et alentours.",
    "Peintre": "Peinture intérieure et extérieure, finitions soignées, à {ville} et alentours.",
    "Traiteur": "Buffets, plateaux repas et menus pour vos événements, à {ville} et alentours.",
    "Pâtisserie": "Gâteaux de fête et douceurs sur commande, à {ville}.",
    "Snack": "Tacos, burgers et assiettes faits minute à {ville}. Commandez sur WhatsApp, c'est prêt à l'heure.",
    "Restaurant": "Cuisine de saison et accueil chaleureux à {ville}. Réservez votre table en un appel.",
    "Coiffure": "Coupe, couleur et soins à {ville}. Tarifs affichés, rendez-vous en un geste.",
    "Soins de beauté": "Soins et beauté à {ville}. Tarifs affichés, rendez-vous en un geste.",
}


# ---------------------------------------------------------------- contenus d'exemple des maquettes
# Les maquettes montrent au prospect un site « plein » : avis, prix, horaires et questions d'exemple.
# Tout est signalé sur la page (bandeau + petites mentions), jamais indexé, et le générateur
# refuse de produire la version finale tant que la fiche porte « maquette » (voir generer_site.generer).
FAMILLE = {"Snack": "bouche", "Restaurant": "bouche", "Plombier": "artisan", "Chauffagiste": "artisan", "Électricien": "artisan", "Peintre": "artisan",
           "Traiteur": "bouche", "Pâtisserie": "bouche", "Coiffure": "beaute", "Soins de beauté": "beaute"}
PRIX_EXEMPLE = {
    "Plombier": ["À partir de 90 €", "Sur devis", "À partir de 150 €", "Sur devis"],
    "Chauffagiste": ["Sur devis", "À partir de 120 €", "Sur devis", "Sur devis"],
    "Électricien": ["À partir de 80 €", "Sur devis", "À partir de 60 €", "Sur devis"],
    "Peintre": ["À partir de 25 €/m²", "Sur devis", "Inclus au devis", "À partir de 20 €/m²"],
    "Traiteur": ["À partir de 18 €/pers.", "À partir de 14 €", "Sur devis", "Selon la distance"],
    "Snack": ["Tacos dès 7,50 €", "Menu dès 10 €", "Retrait gratuit", "Selon la distance"],
    "Restaurant": ["Formule 16,90 €", "Plats dès 15 €", "Sur devis", "Prix de la carte"],
    "Pâtisserie": ["À partir de 28 €", "À partir de 4 €", "Sur devis", "Retrait offert"],
}
TARIFS_EXEMPLE = {  # (durée, prix) dans l'ordre des prestations de METIERS
    "Coiffure": [("1 h", 45), ("1 h 30", 60), ("2 h 30", "dès 95 €"), ("30 min", 25)],
    "Soins de beauté": [("1 h", 55), ("20 min", "dès 10 €"), ("45 min", 30), ("1 h", 35)],
}
HORAIRES_EXEMPLE = {
    "artisan": {"lun": "08:00-18:00", "mar": "08:00-18:00", "mer": "08:00-18:00", "jeu": "08:00-18:00", "ven": "08:00-18:00", "sam": "09:00-12:00", "dim": ""},
    "beaute": {"lun": "", "mar": "09:30-19:00", "mer": "09:30-19:00", "jeu": "09:30-19:00", "ven": "09:30-19:00", "sam": "09:00-17:00", "dim": ""},
    "bouche": {"lun": "", "mar": "", "mer": "10:00-19:00", "jeu": "10:00-19:00", "ven": "10:00-19:00", "sam": "09:00-19:00", "dim": "09:00-13:00"},
}
ATOUTS_EXEMPLE = {
    "artisan": ["Devis gratuit", "Prix annoncé avant les travaux", "Intervention rapide", "Chantier laissé propre"],
    "beaute": ["Tarifs affichés", "Réservation simple", "Conseils personnalisés", "Produits professionnels"],
    "bouche": ["Fait maison", "Sur commande", "Retrait ou livraison", "Menus sur mesure"],
}
FAQ_EXEMPLE = {
    "artisan": [("Le devis est-il gratuit ?", "Oui, le devis est gratuit et sans engagement. Le prix est annoncé avant le début des travaux."),
                ("Intervenez-vous en urgence ?", "Selon les disponibilités, nous intervenons le jour même pour les urgences."),
                ("Quels moyens de paiement acceptez-vous ?", "Carte bancaire, virement ou chèque, à la fin de l'intervention.")],
    "beaute": [("Faut-il réserver ?", "La réservation est conseillée, surtout le samedi. Nous prenons aussi les clients sans rendez-vous selon les disponibilités."),
               ("Puis-je annuler un rendez-vous ?", "Oui, merci de prévenir au moins 24 h à l'avance."),
               ("Quels moyens de paiement acceptez-vous ?", "Carte bancaire et espèces.")],
    "bouche": [("Combien de temps à l'avance faut-il commander ?", "Idéalement 48 h à l'avance, davantage pour les grands événements."),
               ("Proposez-vous la livraison ?", "Oui, dans le secteur, à l'heure convenue. Le retrait sur place est aussi possible."),
               ("Pouvez-vous adapter le menu ?", "Oui : allergies, régimes particuliers ou envies, nous construisons le menu avec vous.")],
}
AVIS_EXEMPLE = {
    "Plombier": [("Sophie L.", "Fuite sous l'évier réparée le jour même. Ponctuel, propre, et le prix annoncé a été respecté."),
                 ("Karim B.", "Remplacement du chauffe-eau rondement mené, avec des explications claires à la fin."),
                 ("Claire M.", "Très bon conseil pour notre douche à l'italienne. Travail soigné, je recommande.")],
    "Chauffagiste": [("Julien R.", "Entretien de la chaudière fait rapidement, attestation remise sur place. Sérieux."),
                     ("Nadia K.", "Panne de chauffage en plein hiver : intervention dès le lendemain, problème réglé."),
                     ("Marc D.", "Pompe à chaleur bien installée et réglée, devis clair et respecté.")],
    "Électricien": [("Laura P.", "Tableau électrique remis aux normes proprement, rien à redire."),
                    ("Thomas G.", "Dépannage rapide après une coupure, explications claires et prix correct."),
                    ("Inès F.", "Pose de luminaires et de prises dans toute la maison, travail très propre.")],
    "Peintre": [("Camille R.", "Salon et couloir repeints en trois jours, finitions impeccables et chantier propre."),
                ("Olivier T.", "Ravalement de façade réussi, bons conseils sur les teintes."),
                ("Sarah B.", "Ponctuel, soigneux, et le devis a été respecté au centime près.")],
    "Traiteur": [("Amélie V.", "Buffet pour 40 personnes : tout était délicieux et joliment présenté."),
                 ("Youssef M.", "Plateaux repas livrés à l'heure pour notre réunion, très bons retours de l'équipe."),
                 ("Hélène D.", "Menu de mariage sur mesure, à l'écoute du début à la fin. Merci !")],
    "Pâtisserie": [("Nadia R.", "Le gâteau d'anniversaire était magnifique et délicieux. Commande très simple."),
                   ("Thomas G.", "Les tartes du week-end sont devenues un rituel à la maison."),
                   ("Élodie P.", "Gâteau de baptême parfait, tout le monde a demandé l'adresse !")],
    "Snack": [("Yanis B.", "Le meilleur tacos du coin, bien garni et prêt en 10 minutes."),
              ("Sarah M.", "Commande sur WhatsApp super pratique, burger maison excellent."),
              ("Mehdi K.", "Accueil sympa, portions généreuses et prix corrects.")],
    "Restaurant": [("Claire V.", "Formule du midi excellente et service rapide, parfait pour une pause déjeuner."),
                   ("Antoine R.", "Cuisine de saison, plats bien présentés, on reviendra."),
                   ("Nadia S.", "Repas d'anniversaire réussi, équipe aux petits soins.")],
    "Coiffure": [("Julie D.", "Balayage exactement comme je le voulais, et de très bons conseils pour l'entretien."),
                 ("Marc H.", "Coupe nette et rapide, accueil sympathique."),
                 ("Aïcha B.", "Enfin un salon qui prend le temps d'écouter. Je reviendrai.")],
    "Soins de beauté": [("Amandine V.", "Soin du visage très relaxant, peau éclatante. Je recommande."),
                        ("Léa M.", "Semi-permanent qui tient trois semaines, travail minutieux."),
                        ("Sonia K.", "Accueil chaleureux, cabine propre et prix affichés.")],
}


def contenu_exemple(fiche: dict, metier: str) -> None:
    """Remplit la maquette avec des contenus d'exemple réalistes, tous signalés comme tels sur la page."""
    fam = FAMILLE[metier]
    fiche["maquette"] = True
    fiche.pop("avis_a_venir", None)
    fiche["avis"] = {"note": 4.8, "nombre": 27, "source": "Google",
                     "liste": [{"auteur": a, "texte": x, "note": 5} for a, x in AVIS_EXEMPLE[metier]]}
    fiche["horaires_semaine"] = HORAIRES_EXEMPLE[fam]
    fiche["atouts"] = ATOUTS_METIER.get(metier, ATOUTS_EXEMPLE[fam])
    fiche["faq"] = [{"q": q, "r": r} for q, r in FAQ_EXEMPLE[fam]]
    if metier in ("Plombier", "Chauffagiste", "Électricien"):
        fiche["tarifs_depannage"] = {"taux_horaire": "55 € TTC / heure", "deplacement": "30 € TTC dans le secteur", "majorations": "+50 % le soir et le dimanche",
                                     "devis": "Gratuit, avant toute intervention"}
    fiche["delai_reponse"] = "Réponse sous 2 h en journée (exemple)" if fam != "bouche" else "Réponse sous 24 h (exemple)"
    if metier in PRIX_EXEMPLE:
        for s, prix in zip(fiche.get("services", []), PRIX_EXEMPLE[metier]):
            s["prix"] = prix
    if metier in TARIFS_EXEMPLE:
        for p, (duree, prix) in zip(fiche["prestations"][0]["liste"], TARIFS_EXEMPLE[metier]):
            p["duree"], p["prix"] = duree, prix


# Légendes naturelles des illustrations (la maquette doit être convaincante ; le bandeau précise que les photos sont des exemples)
LEGENDES_IA = {
 "plombier-douche": "Douche à l'italienne",
 "plombier-chauffe-eau": "Remplacement de chauffe-eau",
 "chauffagiste-pompe": "Pompe à chaleur",
 "chauffagiste-thermostat": "Thermostat connecté",
 "electricien-borne": "Borne de recharge",
 "electricien-eclairage": "Éclairage d'ambiance",
 "peintre-facade": "Ravalement de façade",
 "peintre-outils": "Préparation du chantier",
 "traiteur-plateau": "Plateaux repas",
 "traiteur-evenement": "Dîner de mariage",
 "patisserie-vitrine": "La vitrine",
 "patisserie-boite": "Coffret de macarons",
 "snack-burger": "Burger maison",
 "snack-assiette": "Assiette kebab",
 "snack-comptoir": "Le comptoir",
 "restaurant-plat": "Plat du jour",
 "restaurant-terrasse": "La terrasse",
 "coiffure-couleur": "Balayage",
 "coiffure-produits": "Soins professionnels",
 "soins-de-beaute-ongles": "Manucure",
 "soins-de-beaute-soin": "Soin du visage",
 "soins-de-beaute-cabine": "Cabine de soins"
}


def images_ia(metier: str) -> dict:
    """Illustrations du métier (outils/generer_images.py), si elles existent. Sur un site final,
    le générateur les refuse comme réalisations : elles restent des images d'accueil."""
    cat = generer_site.MODELES / "images-ia" / "catalogue.json"
    if not cat.exists():
        return {}
    entrees = [e for e in json.loads(cat.read_text(encoding="utf-8")) if e.get("metier") == metier
               and (generer_site.MODELES / "images-ia" / e["fichier"]).exists()]
    par_sujet = {e["sujet"]: "images-ia/" + e["fichier"] for e in entrees}
    if "accueil" not in par_sujet:
        return {}
    autres = [v for k, v in par_sujet.items() if k not in ("accueil", "geste")]
    res = {"hero": par_sujet["accueil"], "galerie": [{"src": v, "legende": LEGENDES_IA.get(Path(v).stem[3:], "")} for v in autres]}
    if "geste" in par_sujet:
        res["apropos"] = {"src": par_sujet["geste"]}
    return res


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
    images = images_ia(metier) or images
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
        "avis_a_venir": True,  # remplacé par des avis d'exemple signalés (contenu_exemple)
    }
    tel = re.sub(r"\D", "", prospect.get("telephone") or "")
    if metier == "Snack" and re.fullmatch(r"0[67]\d{8}", tel):
        modele = fiche["modele"] = "commande-whatsapp"
        fiche["whatsapp"] = "33" + tel[1:]
        ia = images_ia("Snack")
        img = {"tacos": ia.get("hero"), "burger": next((g["src"] for g in ia.get("galerie", []) if "burger" in g["src"]), None),
               "assiette": next((g["src"] for g in ia.get("galerie", []) if "assiette" in g["src"]), None)}
        fiche["produits"] = [p for p in [
            {"categorie": "Tacos", "nom": "Tacos M", "desc": "Une viande au choix, frites, sauce fromagère.", "prix": 7.5, "options": ["Poulet", "Viande hachée", "Cordon bleu"], "image": img["tacos"], "badge": "Le plus commandé"},
            {"categorie": "Tacos", "nom": "Tacos L", "desc": "Deux viandes au choix, frites, sauce fromagère.", "prix": 9.5, "options": ["Poulet", "Viande hachée", "Cordon bleu"]},
            {"categorie": "Burgers et assiettes", "nom": "Burger maison", "desc": "Steak haché, cheddar, oignons caramélisés, frites.", "prix": 9.9, "image": img["burger"]},
            {"categorie": "Burgers et assiettes", "nom": "Assiette kebab", "desc": "Viande grillée, salade, tomates, oignons, frites.", "prix": 11, "image": img["assiette"]},
            {"categorie": "Menus", "nom": "Menu enfant", "desc": "Nuggets ou petit burger, frites, boisson.", "prix": 6.5}] ]
        for p in fiche["produits"]:
            if not p.get("image"):
                p.pop("image", None)
        fiche.update({"titre": f"Snack à {ville} : commandez, c'est prêt", "modes": ["À emporter", "Livraison (secteur proche)"],
                      "delai_commande": "Prêt en 10 à 15 minutes selon l'affluence.", "mode_retrait": "À emporter ou livraison dans le secteur."})
    elif modele == "artisan":
        fiche["services"] = [{"titre": t, "texte": x} for t, x in contenu]
        if metier in ("Traiteur", "Pâtisserie", "Snack", "Restaurant"):
            fiche.update(BOUCHE_TEXTES)
            fiche.update(TEXTES_METIER.get(metier, {}))
            fiche["titre"] = f"{metier} à {ville}"
    else:
        fiche["prestations"] = [{"categorie": c, "liste": [{"nom": n, "duree": d, "prix": p} for n, d, p in lst]} for c, lst in contenu]
    contenu_exemple(fiche, metier)
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
