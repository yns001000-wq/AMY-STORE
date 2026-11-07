#!/usr/bin/env python3
"""Génère des images d'illustration avec l'API d'OpenAI (modèles GPT Image), pour les maquettes et les sites.

RÈGLES (non négociables) :
  1. Aucune dépense sans accord : sans --confirmer-depense, l'outil affiche seulement le coût estimé.
     Avec --confirmer-depense MONTANT, il refuse si l'estimation dépasse MONTANT (en dollars US).
  2. Chaque génération est notée dans crm/donnees/depenses.csv (montant estimé, date d'accord).
  3. Une image IA est une ILLUSTRATION : jamais une « réalisation », un produit vendu ou une photo
     d'équipe présentée comme vraie. Le générateur de sites refuse ces usages sur un site final.

Usage :
    python outils/generer_images.py --metiers Plombier,Coiffure              # estimation seule
    python outils/generer_images.py --metiers Plombier --confirmer-depense 1  # génère (accord donné)
    python outils/generer_images.py --prompt "..." --nom salon-lumineux --confirmer-depense 0.3

Clé : variable OPENAI_API_KEY (sur votre PC), ou secret réseau enregistré pour api.openai.com
dans l'environnement cloud (le proxy l'ajoute lui-même : ne jamais écrire la clé dans un fichier).
Bibliothèque standard + Pillow (facultatif, pour convertir en WebP).
"""
from __future__ import annotations

import argparse
import base64
import csv
import datetime as dt
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / "modeles-sites" / "images-ia"
DEPENSES = RACINE / "crm" / "donnees" / "depenses.csv"
API = "https://api.openai.com/v1/images/generations"
MODELE = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-2")
TAILLE = "1536x1024"
# Prix estimés en dollars par image paysage (1536x1024), novembre 2026, sources : voir SOURCES.md.
# À revérifier sur la page de tarifs d'OpenAI avant une grosse série.
PRIX = {"low": 0.006, "medium": 0.045, "high": 0.18}

STYLE = ("Editorial photograph, natural daylight, realistic textures, shallow depth of field, calm premium mood, "
         "French small business, no text, no letters, no logos, no watermarks, no brand names. ")
SANS_VISAGE = "If a person appears, show only hands or a figure from behind, never a recognisable face. "
SUJETS = {
    "Plombier": [("accueil", "A refined modern bathroom with a dark stone washbasin, brushed brass mixer tap, soft side light, tidy and luxurious."),
                 ("geste", "Close-up of a plumber's hands tightening a chrome fitting under a clean white sink with a professional wrench, organised tools nearby."),
                 ("douche", "A walk-in shower with large-format grey tiles, frameless glass and a matte black rain shower head, freshly finished."),
                 ("chauffe-eau", "A neat utility room with a new white water heater and copper pipes cleanly installed, insulated, labelled valves.")],
    "Chauffagiste": [("accueil", "A warm modern living room in winter with a sleek designer radiator, soft evening light, cosy atmosphere."),
                     ("geste", "Close-up of a technician's hands checking a pressure gauge on a modern wall-mounted gas boiler, tidy pipework."),
                     ("pompe", "An outdoor heat pump unit installed neatly against a light rendered wall of a French house, gravel and plants around."),
                     ("thermostat", "A hand adjusting a minimalist smart thermostat on a light wall, warm interior blurred behind.")],
    "Électricien": [("accueil", "A bright contemporary kitchen with elegant pendant lights and under-cabinet LED strips, evening ambience."),
                    ("geste", "Close-up of an electrician's gloved hands wiring a clean, well-labelled modern electrical panel."),
                    ("borne", "An electric vehicle charging wall box neatly mounted in a clean garage, cable coiled, soft light."),
                    ("eclairage", "A living room with warm recessed spotlights and a designer floor lamp, calm evening mood.")],
    "Peintre": [("accueil", "A freshly painted living room in a soft sage green with crisp white skirting boards, morning light, minimal decor."),
                ("geste", "Close-up of a painter's hand cutting in a perfectly straight line with a brush along a ceiling edge."),
                ("facade", "The freshly renovated cream facade of a small French house with blue shutters, sunny day."),
                ("outils", "Neatly arranged painting tools on a drop cloth: rollers, brushes, paint tins in neutral tones, top view.")],
    "Traiteur": [("accueil", "An elegant buffet table for a celebration with colourful canapés, verrines and fresh herbs, natural light, linen tablecloth."),
                 ("plateau", "A beautifully arranged lunch box tray with salad, quiche, cheese and dessert, top view, business meeting setting."),
                 ("geste", "A caterer's hands garnishing small appetizers with fresh herbs on a wooden board in a professional kitchen."),
                 ("evenement", "A long outdoor wedding dinner table with candles and seasonal dishes at golden hour in the French countryside.")],
    "Pâtisserie": [("accueil", "An elegant strawberry layered celebration cake on a marble counter, soft window light, pastry shop atmosphere."),
                   ("vitrine", "A refined pastry display with tarts, éclairs and entremets in neat rows, warm light."),
                   ("geste", "A pastry chef's hands piping cream rosettes on a cake, focus on the piping bag and cream."),
                   ("boite", "A box of assorted macarons and small pastries on a light table, top view, gift presentation.")],
    "Snack": [("accueil", "A generous French tacos cut in half showing grilled chicken, melted cheese sauce and fries inside, on kraft paper with a side of fries, warm street-food lighting."),
              ("burger", "A gourmet smash burger with melted cheddar, caramelised onions and a brioche bun, crispy fries in a paper cone, dark wooden table."),
              ("assiette", "A kebab plate with sliced grilled meat, fresh salad, tomatoes, onions, white sauce and fries, appetising and clean presentation."),
              ("comptoir", "A clean modern snack bar counter with a menu board without readable text, warm lights, takeaway bags ready, no people.")],
    "Restaurant": [("accueil", "A warm French bistro dining room in the evening, wooden tables set with glasses, soft pendant lights, no people."),
                   ("plat", "A refined plated main course in a French bistro: seared fish on vegetables with a light sauce, white plate, natural light."),
                   ("geste", "A chef's hands plating a dish with tweezers in a professional kitchen, steam and warm light, face not visible."),
                   ("terrasse", "A sunny restaurant terrace in a French town square with set tables and plants, inviting atmosphere, no people.")],
    "Restaurant traditionnel": [("bourguignon", "Boeuf bourguignon in a small cast-iron cocotte, tender beef, carrots, lardons, glossy red-wine sauce, a slice of country bread beside it."),
("blanquette", "Blanquette de veau a l'ancienne in a deep white plate, creamy sauce, mushrooms and small onions, a side of white rice."),
("quenelle", "A Lyon pike quenelle baked in a small gratin dish with a golden Nantua crayfish sauce, typical Lyon bouchon dish."),
("confit", "Duck leg confit with crispy golden skin and sarladaise potatoes with parsley and garlic, served on a classic plate."),
("oignon", "French onion soup in a traditional brown earthenware bowl with a thick golden melted cheese crust and croutons."),
("oeuf-meurette", "Oeufs en meurette: poached eggs in a dark red-wine sauce with lardons and croutons, served in a shallow bowl."),
("lyonnaise", "Salade lyonnaise with frisee lettuce, crispy lardons, croutons and a soft poached egg, rustic table."),
("creme-brulee", "Creme brulee in a white ramekin with a caramelised crust just cracked by a spoon, vanilla bean visible."),
("tatin", "A slice of tarte Tatin with deeply caramelised apples and a spoonful of creme fraiche on the side."),
("ile-flottante", "Ile flottante: soft poached meringue floating on vanilla creme anglaise with a thin caramel drizzle, glass coupe."),
("ardoise", "A French bistro dining room at lunch time, zinc bar, bentwood chairs, a blank chalk menu board without any writing, warm daylight, no people."),
("table", "A set bistro table seen from above with several traditional French dishes shared: terrine, salad, bread basket, carafe of red wine, natural light.")],
    "Coiffure": [("accueil", "A bright modern hair salon interior with wooden floor, round mirrors, plants and cognac leather chairs, no people."),
                 ("geste", "A hairdresser's hands blow-drying long glossy brown hair, client seen from behind, soft salon light."),
                 ("couleur", "Close-up of a colourist's brush applying balayage on hair sections with foils, seen from behind."),
                 ("produits", "Professional hair care products and brushes arranged on a wooden shelf in a calm salon.")],
    "Soins de beauté": [("accueil", "A serene beauty institute treatment room with a white treatment bed, folded towels, plants and soft warm light, no people."),
                        ("ongles", "Close-up of a manicurist's hands applying nude nail polish, elegant and clean, soft light."),
                        ("soin", "Skincare products, a jade roller and fresh flowers on a stone tray, spa atmosphere, top view."),
                        ("cabine", "A calm spa cabin with candles, rolled towels and a wooden bench, warm ambience.")],
}


# Familles de sites sur mesure du cockpit (pizzeria, cuisine asiatique, cuisines du monde, café, restauration rapide, desserts)
SUJETS.update({
    "Pizzeria": [("four", "A Neapolitan pizza baking inside a wood-fired brick oven, visible flames and glowing embers, a long pizza peel, warm light."),
                 ("margherita", "A Neapolitan margherita pizza with leopard-spotted puffy crust, San Marzano tomato, melted fior di latte and fresh basil, on a rustic wooden board."),
                 ("diavola", "A diavola pizza with spicy salami slices curling at the edges, tomato, mozzarella, a drizzle of chili oil, on a metal tray."),
                 ("quatre-fromages", "A four-cheese white pizza with golden bubbling mozzarella, gorgonzola and goat cheese, fresh thyme, on a marble table."),
                 ("vegetarienne", "A vegetarian pizza with grilled zucchini, peppers, cherry tomatoes, mushrooms, olives and basil, colourful and fresh."),
                 ("calzone", "A golden folded calzone just out of the oven, cut open to show ham, mozzarella and tomato inside, on a white plate."),
                 ("pate", "Close-up of hands stretching fresh pizza dough on a floured marble counter, semolina dust, soft side light."),
                 ("salle", "A cosy Italian pizzeria dining room with a tiled wood-fired oven in the background, wooden tables, warm evening light, no people."),
                 ("tiramisu", "A generous portion of tiramisu in a glass dish, layers of mascarpone and coffee-soaked ladyfingers, dusted with cocoa.")],
    "Asiatique": [("sushi", "An assorted sushi platter with salmon and tuna nigiri, maki and california rolls, wasabi and pickled ginger, on a dark slate."),
                  ("ramen", "A bowl of tonkotsu ramen with chashu pork, soft-boiled marinated egg, nori, spring onions and noodles lifted with chopsticks."),
                  ("pho", "A steaming bowl of Vietnamese pho with thin slices of beef, rice noodles, fresh herbs, lime and bean sprouts on the side."),
                  ("wok", "Pad thai with prawns, rice noodles, crushed peanuts, bean sprouts and lime, served on a plate, wok kitchen atmosphere."),
                  ("dim-sum", "Bamboo steamer baskets with shrimp dumplings and siu mai, steam rising, soy sauce dish, chopsticks.")],
    "Cuisines du monde": [("couscous", "A traditional couscous royal in a large earthenware dish: fluffy semolina, vegetables, chickpeas, merguez and chicken, broth on the side."),
                          ("tajine", "A lamb tajine with prunes and toasted almonds in an open terracotta tajine pot, Moroccan atmosphere."),
                          ("mezze", "A Lebanese mezze spread: hummus with olive oil, tabbouleh, falafel, moutabal, warm pita bread, top view on a table."),
                          ("steak-frites", "A grilled rib-eye steak with herb butter and golden homemade French fries on a white plate, bistro setting."),
                          ("pates", "Fresh tagliatelle with a creamy mushroom sauce and grated parmesan in a white bowl, Italian trattoria table."),
                          ("salade", "A generous fresh composed salad with grilled chicken, avocado, cherry tomatoes, parmesan shavings and croutons."),
                          ("curry", "Indian chicken tikka masala in a copper bowl with basmati rice and garlic naan bread, warm spices."),
                          ("grillades", "Mixed grill skewers of marinated lamb and chicken with grilled vegetables and rice, Mediterranean restaurant.")],
    "Café": [("cappuccino", "A cappuccino with delicate latte art in a ceramic cup on a wooden café table, morning light."),
             ("viennoiseries", "Freshly baked butter croissants and pains au chocolat on a wooden board, flaky layers, French bakery."),
             ("brunch", "A generous brunch plate with eggs benedict, avocado toast, fresh fruit and orange juice, bright café table."),
             ("salle", "A charming French café interior with small marble tables, bentwood chairs, plants and a counter with an espresso machine, no people."),
             ("baguettes", "Golden crusty French baguettes standing in a wicker basket in a traditional bakery, warm light.")],
    "Restauration rapide": [("kebab", "A doner kebab in a warm pita bread with shaved grilled meat, lettuce, tomato, onion and white sauce, fries on the side."),
                            ("frites", "A paper cone of crispy golden fries with a small pot of sauce, street-food setting."),
                            ("poulet", "Crispy fried chicken tenders with a dipping sauce and coleslaw, in a basket lined with paper."),
                            ("wrap", "A grilled chicken wrap cut in half showing lettuce, tomato and sauce, served with fries.")],
    "Desserts": [("panna-cotta", "A vanilla panna cotta with red berry coulis and fresh raspberries in a glass, elegant restaurant dessert.")],
})
FAMILLES_REPAS = {"Pizzeria", "Asiatique", "Cuisines du monde", "Café", "Restauration rapide", "Desserts"}
STYLE_REPAS = ("Authentic documentary food photograph taken in a real restaurant, 35mm lens, soft natural light, subtle film grain, "
               "realistic small imperfections, appetising but not glossy, natural colours without oversaturation, not a 3D render, "
               "no text, no letters, no logos, no watermarks, no brand names. ")


def slug(t: str) -> str:
    import unicodedata
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")


STYLE_CUISINE = ("Authentic documentary food photograph taken in a real traditional French bistro, 35mm lens, soft natural window light, "
                 "subtle film grain, realistic small imperfections, classic white or earthenware plates, wooden or zinc table, appetising but not glossy, "
                 "natural colours without oversaturation, not a 3D render, no text, no letters, no logos, no watermarks. ")


def commandes(metiers: list[str], prompt: str | None, nom: str | None, qualite: str) -> list[dict]:
    if prompt:
        return [{"metier": "Personnalisé", "sujet": nom or "image", "prompt": STYLE + SANS_VISAGE + prompt, "qualite": qualite}]
    res = []
    for m in metiers:
        if m not in SUJETS:
            raise SystemExit(f"Métier inconnu : {m}. Choix : {', '.join(SUJETS)}")
        for sujet, p in SUJETS[m]:
            res.append({"metier": m, "sujet": sujet, "prompt": (STYLE_CUISINE if m == "Restaurant traditionnel" else STYLE_REPAS if m in FAMILLES_REPAS else STYLE) + SANS_VISAGE + p,
                        "qualite": "high" if sujet == "accueil" and qualite == "auto" else ("medium" if qualite == "auto" else qualite)})
    return res


def estimer(cmds: list[dict]) -> float:
    return round(sum(PRIX[c["qualite"]] for c in cmds), 3)


# Tarifs officiels par million de jetons (page de tarifs OpenAI, nov. 2026) : coût RÉEL calculé avec l'usage renvoyé.
PRIX_JETONS = {"image_sortie": 30.0, "texte_entree": 5.0, "image_entree": 8.0}


def cout_reel(usage: dict) -> float:
    if not usage:
        return 0.0
    det_in = usage.get("input_tokens_details") or {}
    det_out = usage.get("output_tokens_details") or {}
    return round((det_out.get("image_tokens", usage.get("output_tokens", 0)) * PRIX_JETONS["image_sortie"]
                  + det_in.get("text_tokens", 0) * PRIX_JETONS["texte_entree"]
                  + det_in.get("image_tokens", 0) * PRIX_JETONS["image_entree"]) / 1e6, 4)


def appeler(c: dict) -> tuple[bytes, float]:
    cle = os.environ.get("OPENAI_API_KEY") or "cle-ajoutee-par-le-proxy"
    # Mode « stream » : OpenAI envoie des données pendant la génération, ce qui évite qu'un proxy coupe une
    # connexion restée silencieuse (erreur 502 constatée sur les images en haute qualité).
    corps = json.dumps({"model": MODELE, "prompt": c["prompt"], "size": TAILLE, "quality": c["qualite"], "n": 1,
                        "stream": True, "partial_images": 1}).encode()
    req = urllib.request.Request(API, data=corps, headers={"Authorization": f"Bearer {cle}", "Content-Type": "application/json"})
    import time
    for essai in range(3):  # pannes passagères (5xx) : deux nouvelles tentatives
        try:
            final = None
            with urllib.request.urlopen(req, timeout=300) as r:
                for ligne in r:
                    ligne = ligne.decode("utf-8", "replace").strip()
                    if not ligne.startswith("data:"):
                        continue
                    ev = json.loads(ligne[5:].strip() or "{}")
                    if ev.get("type", "").endswith("completed"):
                        final = ev
                    elif ev.get("type") == "error" or "error" in ev:
                        raise SystemExit(f"OpenAI a signalé une erreur : {json.dumps(ev)[:300]}")
            if not final or not final.get("b64_json"):
                raise urllib.error.URLError("flux terminé sans image")
            return base64.b64decode(final["b64_json"]), cout_reel(final.get("usage") or {})
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", "replace")[:300]
            if err.code >= 500 and essai < 2:
                print(f"  (panne passagère {err.code}, nouvel essai dans 20 s)", flush=True)
                time.sleep(20)
                continue
            raise SystemExit(f"OpenAI a refusé la demande ({err.code}) : {detail}")
        except (TimeoutError, urllib.error.URLError) as err:
            if essai < 2:
                print(f"  (connexion interrompue : {err}, nouvel essai dans 20 s)", flush=True)
                time.sleep(20)
                continue
            raise SystemExit(f"Connexion à OpenAI impossible : {err}")


def enregistrer(c: dict, brut: bytes) -> Path:
    SORTIE.mkdir(parents=True, exist_ok=True)
    nom = f"ia-{slug(c['metier'])}-{slug(c['sujet'])}"
    try:
        from io import BytesIO
        from PIL import Image
        chemin = SORTIE / f"{nom}.webp"
        Image.open(BytesIO(brut)).convert("RGB").save(chemin, "WEBP", quality=84, method=6)
    except ImportError:
        chemin = SORTIE / f"{nom}.png"
        chemin.write_bytes(brut)
    cat = SORTIE / "catalogue.json"
    entrees = json.loads(cat.read_text(encoding="utf-8")) if cat.exists() else []
    entrees = [e for e in entrees if e["fichier"] != chemin.name]
    entrees.append({"fichier": chemin.name, "metier": c["metier"], "sujet": c["sujet"], "ia": True, "modele": MODELE,
                    "qualite": c["qualite"], "date": dt.date.today().isoformat(), "prompt": c["prompt"],
                    "usage": "illustration (jamais présentée comme une réalisation du client)"})
    cat.write_text(json.dumps(entrees, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return chemin


def noter_depense(montant: float, objet: str, accord: float) -> None:
    if not DEPENSES.exists():
        return
    with DEPENSES.open("a", encoding="utf-8", newline="") as f:
        csv.writer(f).writerow([dt.date.today().isoformat(), "OpenAI API (images)", f"{montant:.4f} USD", "non",
                                dt.date.today().isoformat(), f"{objet} ; plafond accordé {accord} USD"])


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--metiers", default="", help="Métiers séparés par des virgules (4 images chacun)")
    ap.add_argument("--prompt", help="Une image à partir de votre propre description (en anglais de préférence)")
    ap.add_argument("--nom", help="Nom de fichier pour --prompt")
    ap.add_argument("--qualite", choices=["auto", "low", "medium", "high"], default="auto", help="auto = haute pour l'image d'accueil, moyenne sinon")
    ap.add_argument("--confirmer-depense", type=float, help="Plafond accepté en dollars. Sans lui : estimation seule, rien n'est dépensé")
    a = ap.parse_args(argv)
    metiers = [m.strip() for m in a.metiers.split(",") if m.strip()]
    if not metiers and not a.prompt:
        ap.error("indiquez --metiers ou --prompt")
    cmds = commandes(metiers, a.prompt, a.nom, a.qualite)
    total = estimer(cmds)
    print(f"{len(cmds)} image(s), modèle {MODELE}, format {TAILLE} : coût estimé {total:.2f} $ (environ {total * 0.92:.2f} €).")
    if a.confirmer_depense is None:
        print("Estimation seule : rien n'a été généré ni dépensé. Relancez avec --confirmer-depense MONTANT après accord.")
        return 0
    if total > a.confirmer_depense:
        print(f"REFUS : l'estimation ({total:.2f} $) dépasse le plafond accordé ({a.confirmer_depense:.2f} $). Rien n'a été dépensé.")
        return 2
    deja = [c for c in cmds if any((SORTIE / f"ia-{slug(c['metier'])}-{slug(c['sujet'])}.{x}").exists() for x in ("webp", "png"))]
    if deja:
        print(f"{len(deja)} image(s) déjà présente(s), ignorée(s) : rien n'est repayé.")
        cmds = [c for c in cmds if c not in deja]
    faits, depense = 0, 0.0
    for c in cmds:
        if depense + PRIX[c["qualite"]] > a.confirmer_depense:  # garde-fou sur le cumul RÉEL
            print(f"ARRÊT : la prochaine image dépasserait le plafond ({depense:.3f} $ déjà dépensés sur {a.confirmer_depense:.2f} $).")
            break
        brut, cout = appeler(c)
        cout = cout or PRIX[c["qualite"]]
        chemin = enregistrer(c, brut)
        faits += 1
        depense += cout
        noter_depense(cout, f"{c['metier']} / {c['sujet']} ({c['qualite']})", a.confirmer_depense)
        print(f"  + {chemin.relative_to(RACINE)} ({cout:.3f} $, cumul {depense:.3f} $)", flush=True)
    print(f"{faits} image(s) générée(s), coût réel {depense:.3f} $ (noté dans crm/donnees/depenses.csv). À vérifier visuellement avant usage.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
