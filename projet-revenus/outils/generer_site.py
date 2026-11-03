#!/usr/bin/env python3
"""Génère un site client (ou un aperçu pour un prospect) à partir d'une fiche JSON.

Usage :
    python outils/generer_site.py chemin/vers/fiche.json [--apercu] [--sortie dossier]

Modèles disponibles (champ "modele") :
  - artisan            : artisans et services à domicile (appel, devis, réalisations, zone)
  - commande-whatsapp  : métiers de bouche (carte avec photos, panier, commande envoyée sur WhatsApp)
  - beaute             : coiffure, esthétique, bien-être (prestations avec durée et prix, prise de rendez-vous)

Options :
  --apercu : bandeau « aperçu non contractuel » et interdiction d'indexation (pour un prospect).
  Sans --apercu : version finale, à n'utiliser qu'avec l'accord du client.

Les sections facultatives (avis, galerie, FAQ, zone…) n'apparaissent que si la fiche les renseigne.
Règle : uniquement des informations VRAIES fournies par le client (avis réels, labels justifiés).
Bibliothèque standard Python uniquement. Format de la fiche : voir modeles-sites/fiche-exemple-*.json
"""
from __future__ import annotations

import argparse
import datetime as _dt
import html
import json
import re
import shutil
import sys
from pathlib import Path
from urllib.parse import quote

RACINE = Path(__file__).resolve().parent.parent
MODELES = RACINE / "modeles-sites"
MODELES_DISPONIBLES = ("artisan", "commande-whatsapp", "beaute")
A_COMPLETER = "[À COMPLÉTER]"
CHAMPS_OBLIGATOIRES = ("modele", "slug", "nom", "metier", "ville", "accroche", "description", "telephone")

# Particularités par pays (mentions légales). Voir MARCHES.md.
PAYS = {
    "FR": {"nom": "France", "id_label": "SIRET", "autorite": "la CNIL (www.cnil.fr)"},
    "BE": {"nom": "Belgique", "id_label": "Numéro d'entreprise (BCE)", "autorite": "l'Autorité de protection des données (www.autoriteprotectiondonnees.be)"},
    "CH": {"nom": "Suisse", "id_label": "Numéro IDE (CHE-…)", "autorite": "le Préposé fédéral à la protection des données et à la transparence (www.edoeb.admin.ch)"},
}
JOURS = (("lun", "Lundi"), ("mar", "Mardi"), ("mer", "Mercredi"), ("jeu", "Jeudi"), ("ven", "Vendredi"), ("sam", "Samedi"), ("dim", "Dimanche"))

# Ambiance graphique par modèle (polices système uniquement : rapide et sans transfert de données)
STYLES = {
    "artisan": {"titre": 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif', "bg2": "#f4f6f9"},
    "commande-whatsapp": {"titre": 'Georgia,"Iowan Old Style","Palatino Linotype",serif', "bg2": "#f8f3ec"},
    "beaute": {"titre": '"Didot","Bodoni MT","Iowan Old Style",Georgia,serif', "bg2": "#f7f2f0"},
}
ETAPES_DEFAUT = {
    "artisan": [("Vous appelez ou écrivez", "Décrivez votre besoin, photos à l'appui si possible."),
                ("Devis clair et gratuit", "Un prix annoncé avant le début des travaux, sans surprise."),
                ("Intervention soignée", "Travail propre, chantier rangé, explications à la fin.")],
    "commande-whatsapp": [("Choisissez", "Ajoutez vos produits au panier."),
                          ("Envoyez", "La commande part sur WhatsApp, déjà rédigée."),
                          ("Récupérez", "Nous confirmons l'heure de retrait ou de livraison.")],
    "beaute": [("Choisissez votre prestation", "Tarifs et durées affichés, sans surprise."),
               ("Réservez", "En ligne ou par message, au créneau qui vous arrange."),
               ("Profitez", "On s'occupe de vous, du conseil jusqu'au résultat.")],
}


class FicheInvalide(ValueError):
    """Erreur de contenu dans la fiche JSON."""


def e(valeur) -> str:
    return html.escape(str(valeur), quote=True)


def json_sur(valeur) -> str:
    """JSON insérable sans risque dans une balise <script>."""
    return json.dumps(valeur, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


def chiffres(tel: str) -> str:
    return re.sub(r"[^0-9+]", "", tel or "")


def euros(montant: float) -> str:
    return (f"{montant:.2f}".replace(".", ",") + " €").replace(",00 €", " €")


# ---------------------------------------------------------------- validation
def valider(fiche: dict, base: Path | None = None) -> list[str]:
    manquants = [c for c in CHAMPS_OBLIGATOIRES if not str(fiche.get(c, "")).strip()]
    if manquants:
        raise FicheInvalide("Champs obligatoires manquants : " + ", ".join(manquants))
    if fiche["modele"] not in MODELES_DISPONIBLES:
        raise FicheInvalide(f"Modèle inconnu « {fiche['modele']} ». Choix : {', '.join(MODELES_DISPONIBLES)}")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", fiche["slug"]):
        raise FicheInvalide("Le slug doit contenir uniquement des minuscules, chiffres et tirets (ex. plomberie-martin)")
    if fiche.get("pays", "FR") not in PAYS:
        raise FicheInvalide(f"Pays inconnu « {fiche.get('pays')} ». Choix : {', '.join(PAYS)}")
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", fiche.get("couleur", "#1f5fbf")):
        raise FicheInvalide("La couleur doit être au format #RRGGBB")
    wa = fiche.get("whatsapp", "")
    if wa and not re.fullmatch(r"[1-9][0-9]{7,14}", wa):
        raise FicheInvalide("Le numéro WhatsApp doit être au format international sans + ni espaces (ex. 33612345678)")
    if fiche["modele"] == "commande-whatsapp":
        if not wa:
            raise FicheInvalide("Le modèle commande-whatsapp exige un numéro « whatsapp »")
        if not fiche.get("produits"):
            raise FicheInvalide("Le modèle commande-whatsapp exige au moins un produit")
        for p in fiche["produits"]:
            if not p.get("nom") or not isinstance(p.get("prix"), (int, float)) or p["prix"] < 0:
                raise FicheInvalide(f"Produit invalide : {p!r} (nom et prix positif obligatoires)")
    if fiche["modele"] == "beaute" and not fiche.get("prestations"):
        raise FicheInvalide("Le modèle beaute exige au moins une catégorie de « prestations »")
    avis = fiche.get("avis")
    if avis:
        note = avis.get("note")
        if note is not None and not (isinstance(note, (int, float)) and 0 <= note <= 5):
            raise FicheInvalide("avis.note doit être un nombre entre 0 et 5")
        for a in avis.get("liste", []):
            if not a.get("texte") or not a.get("auteur"):
                raise FicheInvalide("Chaque avis doit avoir un auteur et un texte (avis réels uniquement)")
    for chemin in chemins_images(fiche):
        if not re.match(r"https?://", chemin) and not ((base or MODELES) / chemin).is_file():
            raise FicheInvalide(f"Image introuvable : {chemin}")
    for horaire in (fiche.get("horaires_semaine") or {}).values():
        if horaire and not re.fullmatch(r"\d{2}:\d{2}-\d{2}:\d{2}(,\d{2}:\d{2}-\d{2}:\d{2})*", horaire):
            raise FicheInvalide(f"Horaire invalide « {horaire} » (format 08:00-12:00,14:00-18:30)")

    avertissements = []
    for champ in ("numero_entreprise", "statut_juridique", "adresse_editeur", "responsable_publication", "hebergeur"):
        valeur = fiche.get(champ) or (fiche.get("siret") if champ == "numero_entreprise" else "")
        if not str(valeur or "").strip():
            avertissements.append(f"Mentions légales : « {champ} » manquant (affiché {A_COMPLETER}).")
    if not fiche.get("images", {}).get("hero"):
        avertissements.append("Pas de photo principale (images.hero) : le haut de page sera sur fond uni.")
    if avis and avis.get("liste") and not fiche.get("demo") and not avis.get("source"):
        avertissements.append("Avis sans source : indiquez d'où ils viennent (ex. Google) et ne publiez que de vrais avis.")
    return avertissements


def chemins_images(fiche: dict) -> list[str]:
    imgs = fiche.get("images") or {}
    chemins = [imgs["hero"]] if imgs.get("hero") else []
    chemins += [g["src"] for g in imgs.get("galerie", []) if g.get("src")]
    chemins += [p["image"] for p in fiche.get("produits", []) if p.get("image")]
    return chemins


# ---------------------------------------------------------------- composants
def entete_section(surtitre: str, titre: str, texte: str = "") -> str:
    return (f'<div class="titre-section"><div class="surtitre">{e(surtitre)}</div><h2>{e(titre)}</h2>'
            + (f"<p>{e(texte)}</p>" if texte else "") + "</div>")


def etoiles(note: float) -> str:
    pleines = int(round(note))
    return "★" * pleines + "☆" * (5 - pleines)


def initiales(nom: str) -> str:
    morceaux = [m for m in re.split(r"[\s.-]+", nom) if m]
    return "".join(m[0] for m in morceaux[:2]).upper() or "?"


def bloc_note_hero(fiche: dict) -> str:
    avis = fiche.get("avis") or {}
    if avis.get("note") is None or not avis.get("nombre"):
        return ""
    src = f" {e(avis['source'])}" if avis.get("source") else ""
    return (f'<div class="note-hero"><span class="etoiles" aria-hidden="true">{etoiles(avis["note"])}</span>'
            f'<span><strong>{str(avis["note"]).replace(".", ",")}/5</strong> · {int(avis["nombre"])} avis{src}</span></div>')


def section_avis(fiche: dict) -> str:
    """Bloc d'avis façon widget (note, nombre, cartes). Uniquement des avis réels pour un vrai client."""
    avis = fiche.get("avis") or {}
    liste = avis.get("liste") or []
    source = avis.get("source", "Google")
    if not liste:
        if not fiche.get("avis_a_venir"):
            return ""
        squelettes = "".join('<div class="avis-carte squelette" aria-hidden="true"><div class="av-tete"><span class="avatar"></span>'
                             '<span class="barre" style="width:40%"></span></div><span class="barre"></span><span class="barre"></span>'
                             '<span class="barre" style="width:70%"></span></div>' for _ in range(3))
        return (f'<section id="avis"><div class="wrap">{entete_section("Avis clients", "Vos avis Google, mis en avant")}'
                '<div class="avis-grille"><div class="avis-resume"><div class="avis-note">★</div><p><strong>Vos vrais avis apparaîtront ici</strong></p>'
                '<p class="petit">Votre note, le nombre d\'avis et vos derniers commentaires Google, recopiés tels quels avec votre accord. '
                'Aucun avis n\'est inventé.</p></div>'
                f'<div class="avis-cartes">{squelettes}</div></div></div></section>')
    resume = ""
    if avis.get("note") is not None and avis.get("nombre"):
        boutons = ""
        if avis.get("lien"):
            boutons = f'<a class="btn btn-ghost" href="{e(avis["lien"])}" target="_blank" rel="noopener">Voir les avis sur {e(source)}</a>'
        resume = (f'<div class="avis-resume"><div class="avis-source">Avis {e(source)}</div>'
                  f'<div class="avis-note">{str(avis["note"]).replace(".", ",")}<small>/5</small></div>'
                  f'<div class="etoiles grandes" aria-label="{avis["note"]} sur 5">{etoiles(avis["note"])}</div>'
                  f'<p class="petit">Basé sur {int(avis["nombre"])} avis</p>{boutons}</div>')
    demo = ('<div class="mention-demo">Démonstration : avis d\'exemple, entreprise fictive. '
            "Sur votre site, seuls vos vrais avis clients apparaîtront, avec leur source.</div>") if fiche.get("demo") else ""
    cartes = "".join(
        f'<blockquote class="avis-carte"><div class="av-tete"><span class="avatar" aria-hidden="true">{e(initiales(a["auteur"]))}</span>'
        f'<span><strong>{e(a["auteur"])}</strong><br><span class="petit">{e(a.get("date", ""))}</span></span>'
        f'<span class="av-src">{e(source)}</span></div>'
        f'<div class="etoiles" aria-label="{int(a.get("note", 5))} sur 5">{etoiles(a.get("note", 5))}</div>'
        f'<p>{e(a["texte"])}</p></blockquote>'
        for a in liste)
    return (f'<section id="avis"><div class="wrap">{entete_section("Avis clients", fiche.get("titre_avis", "Ils nous ont fait confiance"))}'
            f'{demo}<div class="avis-grille">{resume}<div class="avis-cartes">{cartes}</div></div></div></section>')


def section_galerie(fiche: dict, imgs: dict, titre: str, surtitre: str) -> str:
    galerie = (fiche.get("images") or {}).get("galerie") or []
    if not galerie:
        return ""
    figs = "".join(
        f'<figure><img src="{e(imgs[g["src"]])}" alt="{e(g.get("legende") or fiche["metier"])}" loading="lazy" width="900" height="675">'
        + (f"<figcaption>{e(g['legende'])}</figcaption>" if g.get("legende") else "") + "</figure>"
        for g in galerie)
    return f'<section class="alt" id="realisations"><div class="wrap">{entete_section(surtitre, titre)}<div class="galerie">{figs}</div></div></section>'


def section_etapes(fiche: dict) -> str:
    etapes = fiche.get("etapes") or [{"titre": t, "texte": x} for t, x in ETAPES_DEFAUT[fiche["modele"]]]
    cartes = "".join(f'<div class="etape"><h3>{e(s["titre"])}</h3><p>{e(s["texte"])}</p></div>' for s in etapes)
    return f'<section id="methode"><div class="wrap">{entete_section("Comment ça se passe", "Simple, du premier contact au résultat")}<div class="etapes">{cartes}</div></div></section>'


def section_faq(fiche: dict) -> str:
    faq = fiche.get("faq") or []
    if not faq:
        return ""
    items = "".join(f'<details class="faq"><summary>{e(q["q"])}</summary><p>{e(q["r"])}</p></details>' for q in faq)
    return f'<section class="alt" id="faq"><div class="wrap" style="max-width:820px">{entete_section("Questions fréquentes", "Vous vous demandez peut-être…")}{items}</div></section>'


def tableau_horaires(fiche: dict) -> str:
    semaine = fiche.get("horaires_semaine")
    if semaine:
        lignes = []
        for code, nom in JOURS:
            h = semaine.get(code, "")
            texte = " · ".join(p.replace(":", "h").replace("-", " – ") for p in h.split(",")) if h else "Fermé"
            lignes.append(f'<tr data-jour="{code}"><td>{nom}</td><td>{e(texte)}</td></tr>')
        return '<table class="horaires">' + "".join(lignes) + "</table>"
    horaires = fiche.get("horaires") or []
    if horaires:
        return '<table class="horaires">' + "".join(f"<tr><td>{e(j)}</td><td>{e(h)}</td></tr>" for j, h in horaires) + "</table>"
    return f'<p>Sur rendez-vous : <a href="tel:{e(chiffres(fiche["telephone"]))}">{e(fiche["telephone"])}</a></p>'


def section_infos(fiche: dict, titre_zone: str) -> str:
    zone = e(fiche.get("zone", fiche["ville"]))
    communes = fiche.get("communes") or []
    chips = ('<ul class="chips">' + "".join(f"<li>{e(c)}</li>" for c in communes) + "</ul>") if communes else ""
    carte = ""
    if fiche.get("adresse"):
        q = quote(f"{fiche['adresse']}, {fiche['ville']}")
        carte = f'<p style="margin-top:16px"><a class="btn btn-ghost" href="https://www.google.com/maps/search/?api=1&query={q}" target="_blank" rel="noopener">📍 Itinéraire</a></p>'
    return (f'<section id="infos"><div class="wrap deux"><div>{entete_section("Où nous trouver", titre_zone)}'
            f'<p style="font-size:17px">{zone}</p>{chips}{carte}</div>'
            f'<div>{entete_section("Horaires", "Quand nous joindre")}{tableau_horaires(fiche)}</div></div></section>')


def section_confiance(fiche: dict) -> str:
    atouts = fiche.get("atouts") or []
    if not atouts:
        return ""
    icones = ["✓", "★", "⏱", "🛡", "€", "♥"]
    items = "".join(f'<li><span class="ic" aria-hidden="true">{icones[i % len(icones)]}</span>{e(a)}</li>' for i, a in enumerate(atouts))
    return f'<div class="confiance"><div class="wrap"><ul>{items}</ul></div></div>'


def formulaire(fiche: dict, champs_extra: str = "", bouton: str = "Envoyer ma demande") -> str:
    if fiche.get("demo"):
        attrs = 'name="demo" onsubmit="alert(\'Site de démonstration : formulaire désactivé.\');return false;"'
    else:
        attrs = 'name="contact" method="POST" action="/merci" data-netlify="true" netlify-honeypot="site_web"'
    return (f'<form class="contact" {attrs}><input type="hidden" name="form-name" value="contact">'
            '<p class="hp"><label>Ne pas remplir : <input name="site_web" tabindex="-1" autocomplete="off"></label></p>'
            '<div><label for="f-nom">Nom</label><input id="f-nom" name="nom" required autocomplete="name"></div>'
            '<div><label for="f-tel">Téléphone</label><input id="f-tel" name="telephone" type="tel" required autocomplete="tel"></div>'
            f'{champs_extra}<div><label for="f-msg">Votre message</label><textarea id="f-msg" name="message" required></textarea></div>'
            '<p class="petit">Vos informations servent uniquement à répondre à votre demande. Voir les <a href="mentions-legales.html">mentions légales</a>.</p>'
            f'<button class="btn btn-main" type="submit">{e(bouton)}</button></form>')


def section_contact(fiche: dict, titre: str, texte: str, extra: str = "", bouton: str = "Envoyer ma demande") -> str:
    tel = e(fiche["telephone"])
    coord = [f'<p><strong>Téléphone :</strong> <a href="tel:{e(chiffres(fiche["telephone"]))}">{tel}</a></p>']
    if fiche.get("email"):
        coord.append(f'<p><strong>Email :</strong> <a href="mailto:{e(fiche["email"])}">{e(fiche["email"])}</a></p>')
    if fiche.get("adresse"):
        coord.append(f'<p><strong>Adresse :</strong> {e(fiche["adresse"])}</p>')
    if fiche.get("delai_reponse"):
        coord.append(f'<p class="petit">{e(fiche["delai_reponse"])}</p>')
    return (f'<section class="alt" id="contact"><div class="wrap deux"><div>{entete_section("Contact", titre, texte)}'
            f'<div class="coord">{"".join(coord)}</div></div>{formulaire(fiche, extra, bouton)}</div></section>')


def pied(fiche: dict) -> str:
    reseaux = fiche.get("reseaux") or {}
    liens = " · ".join(f'<a href="{e(u)}" target="_blank" rel="noopener">{e(n.capitalize())}</a>' for n, u in reseaux.items() if u)
    return (f'<footer class="bas"><div class="wrap"><div><h3>{e(fiche["nom"])}</h3><p>{e(fiche["metier"])} — {e(fiche["ville"])}</p>'
            + (f"<p>{liens}</p>" if liens else "") + "</div>"
            f'<div><h3>Contact</h3><p><a href="tel:{e(chiffres(fiche["telephone"]))}">{e(fiche["telephone"])}</a></p>'
            + (f'<p><a href="mailto:{e(fiche["email"])}">{e(fiche["email"])}</a></p>' if fiche.get("email") else "") + "</div>"
            f'<div><h3>Informations</h3><p><a href="mentions-legales.html">Mentions légales</a></p><p>© {_dt.date.today().year} {e(fiche["nom"])}</p></div>'
            "</div></footer>")


def script_ouverture(fiche: dict) -> str:
    """Badge « Ouvert / Fermé maintenant » et surlignage du jour (heure du navigateur du visiteur)."""
    if not fiche.get("horaires_semaine"):
        return ""
    return """<script>(function(){
  var H = %s, codes = ["dim","lun","mar","mer","jeu","ven","sam"], now = new Date(), code = codes[now.getDay()];
  var row = document.querySelector('tr[data-jour="' + code + '"]'); if (row) row.className = "aujourdhui";
  var m = now.getHours() * 60 + now.getMinutes(), ouvert = false;
  (H[code] || "").split(",").forEach(function(p){ if(!p) return; var t = p.split("-"), a = t[0].split(":"), b = t[1].split(":");
    if (m >= +a[0]*60 + +a[1] && m < +b[0]*60 + +b[1]) ouvert = true; });
  document.querySelectorAll("[data-ouverture]").forEach(function(el){
    el.textContent = ouvert ? "Ouvert maintenant" : "Fermé pour le moment"; el.className = "pill " + (ouvert ? "ouvert" : "ferme"); el.hidden = false; });
})();</script>""" % json_sur(fiche["horaires_semaine"])


# ---------------------------------------------------------------- pages
def page(fiche: dict, imgs: dict, apercu: bool, corps: str, menu: list[tuple[str, str]], cta_entete: str,
         barre: str, scripts: str = "") -> str:
    style = STYLES[fiche["modele"]]
    css = (MODELES / "commun.css").read_text(encoding="utf-8")
    pays = fiche.get("pays", "FR")
    meta = fiche.get("meta_description") or f"{fiche['nom']}, {fiche['metier'].lower()} à {fiche['ville']}. {fiche['accroche']}"
    jsonld = {"@context": "https://schema.org", "@type": fiche.get("type_schema", "LocalBusiness"), "name": fiche["nom"],
              "description": fiche["description"], "telephone": fiche["telephone"], "areaServed": fiche.get("zone", fiche["ville"]),
              "address": {"@type": "PostalAddress", "addressLocality": fiche["ville"], "addressCountry": pays}}
    if fiche.get("email"):
        jsonld["email"] = fiche["email"]
    avis = fiche.get("avis") or {}
    if avis.get("note") is not None and avis.get("nombre") and not fiche.get("demo"):
        jsonld["aggregateRating"] = {"@type": "AggregateRating", "ratingValue": avis["note"], "reviewCount": avis["nombre"]}
    if (fiche.get("images") or {}).get("hero"):
        jsonld["image"] = imgs[fiche["images"]["hero"]]
    nav = "".join(f'<a href="#{a}">{e(t)}</a>' for a, t in menu)
    return f"""<!DOCTYPE html>
<html lang="fr-{pays}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(fiche['nom'])} — {e(fiche['metier'])} à {e(fiche['ville'])}</title>
<meta name="description" content="{e(meta[:300])}">
{'<meta name="robots" content="noindex, nofollow">' if apercu else ''}
<meta property="og:title" content="{e(fiche['nom'])} — {e(fiche['metier'])} à {e(fiche['ville'])}">
<meta property="og:description" content="{e(meta[:300])}">
<meta property="og:type" content="website">
<meta name="theme-color" content="{fiche.get('couleur', '#1f5fbf')}">
<script type="application/ld+json">{json_sur(jsonld)}</script>
<style>{css}
:root{{--brand:{fiche.get('couleur', '#1f5fbf')};--titre:{style['titre']};--bg2:{style['bg2']}}}</style>
</head>
<body>
{('<div class="apercu">Aperçu de proposition réalisé pour ' + e(fiche['nom']) + ' — non publié, non contractuel. Textes et visuels à valider ensemble.</div>') if apercu else ''}
{'<div class="apercu">Site de démonstration réalisé par Mysite — entreprise, avis et coordonnées fictifs.</div>' if fiche.get('demo') and not apercu else ''}
{('<div class="bandeau">' + e(fiche['bandeau']) + '</div>') if fiche.get('bandeau') else ''}
<header class="top"><div class="wrap">
  <a class="logo" href="#">{e(fiche['nom'])}<small>{e(fiche['metier'])} · {e(fiche['ville'])}</small></a>
  <nav class="menu" aria-label="Menu principal">{nav}</nav>
  {cta_entete}
</div></header>
<main>
{corps}
</main>
{pied(fiche)}
<div class="barre-mobile">{barre}</div>
{script_ouverture(fiche)}
{scripts}
</body>
</html>
"""


def hero(fiche: dict, imgs: dict, boutons: str, kicker_extra: str = "") -> str:
    """Haut de page moderne : texte à gauche, grande photo arrondie à droite avec badge flottant."""
    h = (fiche.get("images") or {}).get("hero")
    ouverture = '<span class="pill" data-ouverture hidden></span>' if fiche.get("horaires_semaine") else ""
    titre = fiche.get("titre") or f"{fiche['metier']} à {fiche['ville']}"
    avis = fiche.get("avis") or {}
    badge = ""
    if avis.get("note") is not None and avis.get("nombre"):
        badge = (f'<div class="flottant"><span class="etoiles">★</span><span><strong>{str(avis["note"]).replace(".", ",")}/5</strong>'
                 f'<br><span class="petit">{int(avis["nombre"])} avis {e(avis.get("source", ""))}</span></span></div>')
    elif fiche.get("atouts"):
        badge = f'<div class="flottant"><span class="etoiles">✓</span><span><strong>{e(fiche["atouts"][0])}</strong></span></div>'
    visuel = (f'<div class="visuel"><img src="{e(imgs[h])}" alt="{e(fiche["nom"])}" width="900" height="700" fetchpriority="high">{badge}</div>'
              if h else "")
    return (f'<section class="hero2{" sans-photo" if not h else ""}"><div class="wrap"><div class="txt"><div class="kicker">{ouverture}{kicker_extra}'
            f'<span class="pill">📍 {e(fiche.get("zone_courte") or fiche["ville"])}</span></div>'
            f'<h1>{e(titre)}</h1><p class="lead">{e(fiche["accroche"])}</p><div class="cta">{boutons}</div>{bloc_note_hero(fiche)}</div>'
            f'{visuel}</div></section>')


def bande_cta(fiche: dict, titre: str, texte: str, boutons: str) -> str:
    return f'<section class="cta-final"><div class="wrap"><h2>{e(titre)}</h2><p>{e(texte)}</p><div class="cta">{boutons}</div></div></section>'


def lien_wa(fiche: dict, texte: str) -> str:
    return f"https://wa.me/{fiche['whatsapp']}?text=" + quote(texte, safe="")


def corps_artisan(fiche: dict, imgs: dict) -> tuple[str, list, str, str, str]:
    tel_lien = e(chiffres(fiche["telephone"]))
    wa = fiche.get("whatsapp")
    libelle = f"Appeler le {e(fiche['telephone'])}" if re.search(r"\d", fiche["telephone"]) else "Appeler"
    boutons = f'<a class="btn btn-main" href="tel:{tel_lien}">📞 {libelle}</a>'
    if wa:
        boutons += f'<a class="btn btn-wa" href="{e(lien_wa(fiche, "Bonjour, je souhaite un devis pour : "))}" target="_blank" rel="noopener">WhatsApp</a>'
    boutons += '<a class="btn btn-light" href="#contact">Devis gratuit</a>'
    services = "".join(
        f'<div class="card"><div class="ic" aria-hidden="true">{e(s.get("icone", "🔧"))}</div><h3>{e(s["titre"])}</h3><p>{e(s.get("texte", ""))}</p>'
        + (f'<div class="prix">{e(s["prix"])}</div>' if s.get("prix") else "") + "</div>"
        for s in fiche.get("services") or [])
    corps = (hero(fiche, imgs, boutons) + section_confiance(fiche)
             + (f'<section id="services"><div class="wrap">{entete_section("Nos services", "Ce que nous faisons pour vous", fiche.get("intro_services", ""))}<div class="grid">{services}</div></div></section>' if services else "")
             + section_galerie(fiche, imgs, "Quelques réalisations", "Réalisations")
             + section_etapes(fiche) + section_avis(fiche)
             + f'<section class="alt"><div class="wrap deux"><div>{entete_section("Qui sommes-nous ?", fiche.get("titre_apropos", "Un artisan près de chez vous"))}<p style="font-size:17px">{e(fiche["description"])}</p></div>'
             + f'<div>{entete_section(*fiche.get("bloc_appel", ("Urgence ?", "Appelez directement")))}<p><a class="btn btn-main" href="tel:{tel_lien}">📞 {e(fiche["telephone"])}</a></p><p class="petit">{e(fiche.get("delai_reponse", ""))}</p></div></div></section>'
             + section_infos(fiche, "Zone d'intervention") + section_faq(fiche)
             + bande_cta(fiche, "Un problème ? Une question ?", "Appelez maintenant ou demandez votre devis : réponse rapide.",
                         f'<a class="btn btn-light" href="tel:{tel_lien}">📞 {libelle}</a><a class="btn btn-ghost-clair" href="#contact">Demander un devis</a>')
             + section_contact(fiche, "Demandez votre devis gratuit", "Décrivez votre besoin : réponse rapide, sans engagement.", bouton="Recevoir mon devis"))
    menu = [("services", "Services"), ("realisations", "Réalisations"), ("avis", "Avis"), ("infos", "Zone"), ("contact", "Contact")]
    entete = f'<a class="btn btn-main" href="tel:{tel_lien}">📞 Appeler</a>'
    barre = f'<a class="btn btn-main" href="tel:{tel_lien}">📞 Appeler</a>' + (
        f'<a class="btn btn-wa" href="{e(lien_wa(fiche, "Bonjour, je souhaite un devis pour : "))}" target="_blank" rel="noopener">WhatsApp</a>' if wa
        else '<a class="btn btn-ghost" href="#contact">Devis</a>')
    return corps, menu, entete, barre, ""


def corps_beaute(fiche: dict, imgs: dict) -> tuple[str, list, str, str, str]:
    resa = fiche.get("reservation_url") or (lien_wa(fiche, "Bonjour, je souhaite prendre rendez-vous pour : ") if fiche.get("whatsapp") else f"tel:{chiffres(fiche['telephone'])}")
    cible = ' target="_blank" rel="noopener"' if resa.startswith("http") else ""
    boutons = f'<a class="btn btn-main" href="{e(resa)}"{cible}>Prendre rendez-vous</a><a class="btn btn-light" href="#tarifs">Voir les tarifs</a>'
    cats = []
    for c in fiche["prestations"]:
        lignes = "".join(
            f'<tr><td><strong>{e(p["nom"])}</strong>' + (f'<br><span class="petit">{e(p["desc"])}</span>' if p.get("desc") else "")
            + f'</td><td class="petit" style="white-space:nowrap">{e(p.get("duree", ""))}</td><td style="text-align:right;font-weight:700;white-space:nowrap">{e(p["prix"]) if isinstance(p.get("prix"), str) else euros(p.get("prix", 0))}</td></tr>'
            for p in c.get("liste", []))
        cats.append(f'<div class="card" style="padding:8px 8px 4px"><h3 style="padding:14px 14px 4px">{e(c["categorie"])}</h3><table class="horaires" style="border:none">{lignes}</table></div>')
    tarifs = (f'<section id="tarifs"><div class="wrap">{entete_section("Prestations & tarifs", "Des prix clairs, affichés", fiche.get("intro_tarifs", ""))}'
              f'<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">{"".join(cats)}</div>'
              f'<p style="margin-top:24px"><a class="btn btn-main" href="{e(resa)}"{cible}>Réserver mon créneau</a></p></div></section>')
    corps = (hero(fiche, imgs, boutons) + section_confiance(fiche) + tarifs
             + section_galerie(fiche, imgs, "L'ambiance du salon", "En images")
             + section_avis(fiche) + section_etapes(fiche)
             + f'<section class="alt"><div class="wrap" style="max-width:820px">{entete_section("À propos", fiche.get("titre_apropos", "Une équipe à votre écoute"))}<p style="font-size:17px">{e(fiche["description"])}</p></div></section>'
             + section_infos(fiche, "Le salon") + section_faq(fiche)
             + bande_cta(fiche, "Envie de vous faire plaisir ?", "Réservez en quelques secondes.", f'<a class="btn btn-light" href="{e(resa)}"{cible}>Prendre rendez-vous</a><a class="btn btn-ghost-clair" href="tel:{e(chiffres(fiche["telephone"]))}">📞 Appeler</a>'))
    menu = [("tarifs", "Tarifs"), ("realisations", "Galerie"), ("avis", "Avis"), ("infos", "Infos")]
    entete = f'<a class="btn btn-main" href="{e(resa)}"{cible}>Réserver</a>'
    barre = f'<a class="btn btn-light" href="tel:{e(chiffres(fiche["telephone"]))}">📞 Appeler</a><a class="btn btn-main" href="{e(resa)}"{cible}>Réserver</a>'
    return corps, menu, entete, barre, ""


def corps_commande(fiche: dict, imgs: dict) -> tuple[str, list, str, str, str]:
    boutons = '<a class="btn btn-main" href="#carte">Voir la carte et commander</a>'
    if fiche.get("reseaux", {}).get("instagram"):
        boutons += f'<a class="btn btn-light" href="{e(fiche["reseaux"]["instagram"])}" target="_blank" rel="noopener">Instagram</a>'
    categories: dict[str, list] = {}
    for i, p in enumerate(fiche["produits"]):
        categories.setdefault(p.get("categorie", "La carte"), []).append((i, p))
    onglets = "".join(f'<a class="pill-cat" href="#cat-{k}">{e(c)}</a>' for k, c in enumerate(categories)) if len(categories) > 1 else ""
    blocs = []
    for k, (cat, prods) in enumerate(categories.items()):
        cartes = []
        for i, p in prods:
            img = (f'<div class="pimg"><img src="{e(imgs[p["image"]])}" alt="{e(p["nom"])}" loading="lazy" width="900" height="675">'
                   + (f'<span class="badge">{e(p["badge"])}</span>' if p.get("badge") else "") + "</div>") if p.get("image") else ""
            opts = "".join(f"<option>{e(o)}</option>" for o in p.get("options") or [])
            select = f'<select aria-label="Option pour {e(p["nom"])}">{opts}</select>' if opts else ""
            cartes.append(f'<article class="produit" data-produit data-nom="{e(p["nom"])}" data-prix="{float(p["prix"]):.2f}">{img}'
                          f'<div class="pcorps"><h3>{e(p["nom"])}</h3><p>{e(p.get("desc", ""))}</p>{select}'
                          f'<div class="pbas"><span class="pprix">{euros(float(p["prix"]))}</span><button class="btn btn-main btn-add" type="button">Ajouter</button></div></div></article>')
        blocs.append(f'<h3 class="cat" id="cat-{k}">{e(cat)}</h3><div class="produits">{"".join(cartes)}</div>')
    infos_cmd = "".join(f"<li>{e(x)}</li>" for x in [fiche.get("delai_commande", ""), fiche.get("mode_retrait", ""), fiche.get("allergenes", "")] if x)
    carte = (f'<section id="carte"><div class="wrap">{entete_section("La carte", fiche.get("titre_carte", "Faites-vous plaisir"), "Ajoutez vos produits au panier, puis envoyez la commande sur WhatsApp en un geste.")}'
             + (f'<nav class="onglets">{onglets}</nav>' if onglets else "") + "".join(blocs)
             + (f'<ul class="infos-cmd">{infos_cmd}</ul>' if infos_cmd else "") + "</div></section>")
    corps = (hero(fiche, imgs, boutons) + section_confiance(fiche) + carte + section_etapes(fiche) + section_avis(fiche)
             + section_galerie(fiche, imgs, "Nos créations", "En images")
             + f'<section class="alt"><div class="wrap" style="max-width:820px">{entete_section("Notre histoire", fiche.get("titre_apropos", "Fait maison, avec amour"))}<p style="font-size:17px">{e(fiche["description"])}</p></div></section>'
             + section_infos(fiche, "Retrait et livraison") + section_faq(fiche)
             + bande_cta(fiche, "Une envie gourmande ?", "Composez votre commande en deux minutes.", '<a class="btn btn-light" href="#carte">Voir la carte</a>'))
    menu = [("carte", "La carte"), ("avis", "Avis"), ("infos", "Infos pratiques"), ("faq", "FAQ")]
    entete = '<a class="btn btn-main" href="#carte">Commander</a>'
    barre = ('<button class="btn btn-wa" id="ouvrirPanier" type="button" disabled>🛒 <span id="panierResume">Panier vide</span></button>')
    style = """<style>
.onglets{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 8px;position:sticky;top:64px;z-index:5;background:var(--bg);padding:10px 0}
.pill-cat{border:1px solid var(--line);border-radius:999px;padding:8px 16px;text-decoration:none;color:var(--ink);font-weight:600;font-size:14px;background:#fff}
.pill-cat:hover{border-color:var(--brand);color:var(--brand)}
h3.cat{font-size:24px;margin:28px 0 14px;scroll-margin-top:130px}
.produits{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.produit{background:#fff;border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--shadow)}
.pimg{position:relative;aspect-ratio:4/3;background:#eee}.pimg img{width:100%;height:100%;object-fit:cover}
.badge{position:absolute;top:12px;left:12px;background:var(--brand);color:var(--brand-ink);font-size:12px;font-weight:700;border-radius:999px;padding:5px 10px}
.pcorps{padding:18px;display:flex;flex-direction:column;gap:10px;flex:1}.pcorps h3{margin:0;font-size:19px}.pcorps p{margin:0;color:var(--soft);font-size:15px;flex:1}
.pcorps select{padding:10px;border-radius:10px;border:1px solid #d6d0c4;font:inherit}
.pbas{display:flex;justify-content:space-between;align-items:center;gap:8px}.pprix{font-weight:800;font-size:20px}.btn-add{padding:10px 18px;font-size:15px}
.infos-cmd{margin:28px 0 0;padding:16px 20px 16px 36px;background:var(--bg2);border-radius:12px;color:var(--soft)}
.panier{position:fixed;inset:0;z-index:60;display:none}.panier.ouvert{display:block}
.panier .fond{position:absolute;inset:0;background:rgba(0,0,0,.45)}
.panier .tiroir{position:absolute;right:0;top:0;bottom:0;width:min(440px,100%);background:#fff;display:flex;flex-direction:column;box-shadow:-10px 0 30px rgba(0,0,0,.2)}
.tiroir header{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid var(--line)}.tiroir header h2{margin:0;font-size:22px}
.tiroir .lignes{flex:1;overflow:auto;padding:8px 20px;margin:0;list-style:none}
.tiroir .lignes li{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid var(--line)}
.qte{display:flex;align-items:center;gap:8px}.qte button{width:32px;height:32px;border-radius:8px;border:1px solid var(--line);background:#fff;font-size:18px;cursor:pointer}
.tiroir .pied{padding:16px 20px calc(16px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line);display:grid;gap:10px}
.tiroir .pied label{font-weight:600;font-size:14px}.tiroir .pied input,.tiroir .pied select{width:100%;padding:11px;border:1px solid #cfd3da;border-radius:10px;font:inherit}
.total{display:flex;justify-content:space-between;font-size:20px;font-weight:800}
.fermer{border:none;background:none;font-size:26px;cursor:pointer}
.panier-flottant{position:fixed;right:24px;bottom:24px;z-index:45;display:none}@media(min-width:760px){.panier-flottant:not([disabled]){display:inline-flex}}
</style>"""
    modes = fiche.get("modes") or ["Retrait"]
    panier = f"""<button class="btn btn-wa panier-flottant" id="ouvrirPanier2" type="button" disabled>🛒 <span id="panierResume2">Panier vide</span></button>
<div class="panier" id="panier" aria-hidden="true"><div class="fond" data-fermer></div><aside class="tiroir" role="dialog" aria-label="Votre panier">
<header><h2>Votre commande</h2><button class="fermer" type="button" data-fermer aria-label="Fermer">×</button></header>
<ul class="lignes" id="lignes"></ul>
<div class="pied"><div class="total"><span>Total</span><span id="total">0 €</span></div>
<div><label for="c-nom">Votre prénom</label><input id="c-nom" autocomplete="given-name"></div>
<div><label for="c-mode">Retrait ou livraison</label><select id="c-mode">{"".join(f"<option>{e(m)}</option>" for m in modes)}</select></div>
<div><label for="c-date">Pour quand ?</label><input id="c-date" placeholder="ex. samedi 14h"></div>
<a class="btn btn-wa" id="envoyer" href="#" target="_blank" rel="noopener">Envoyer la commande sur WhatsApp</a>
<p class="petit" style="margin:0">Aucun paiement en ligne : la commande est confirmée par message, puis réglée selon les modalités convenues.</p></div>
</aside></div>"""
    script = """<script>(function(){
  var WA = %s, NOM = %s, panier = [];
  function eur(n){ return n.toFixed(2).replace('.', ',').replace(',00','') + ' €'; }
  function total(){ return panier.reduce(function(s,i){ return s + i.prix * i.qte; }, 0); }
  function message(){
    var l = ['Bonjour ' + NOM + ', je souhaite commander :'];
    panier.forEach(function(i){ l.push('- ' + i.qte + ' × ' + i.nom + (i.option ? ' (' + i.option + ')' : '') + ' — ' + eur(i.prix * i.qte)); });
    l.push('Total : ' + eur(total()));
    var n = document.getElementById('c-nom').value.trim(), m = document.getElementById('c-mode').value, d = document.getElementById('c-date').value.trim();
    l.push('Mode : ' + m + (d ? ' — ' + d : ''));
    if (n) l.push('Prénom : ' + n);
    l.push('Merci de me confirmer la disponibilité.');
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(l.join('\\n'));
  }
  function rendre(){
    var ul = document.getElementById('lignes'); ul.textContent = '';
    panier.forEach(function(it, i){
      var li = document.createElement('li'), t = document.createElement('span'), q = document.createElement('span');
      t.textContent = it.nom + (it.option ? ' (' + it.option + ')' : '') + ' — ' + eur(it.prix * it.qte); q.className = 'qte';
      [['−',-1],['+',1]].forEach(function(b, j){
        var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = b[0];
        bt.setAttribute('aria-label', (b[1] > 0 ? 'Ajouter un ' : 'Retirer un ') + it.nom);
        bt.onclick = function(){ it.qte += b[1]; if (it.qte <= 0) panier.splice(i, 1); rendre(); };
        q.appendChild(bt); if (j === 0) { var s = document.createElement('strong'); s.textContent = it.qte; q.appendChild(s); }
      });
      li.appendChild(t); li.appendChild(q); ul.appendChild(li);
    });
    var nb = panier.reduce(function(s,i){ return s + i.qte; }, 0), txt = nb ? nb + ' article' + (nb > 1 ? 's' : '') + ' · ' + eur(total()) : 'Panier vide';
    ['panierResume','panierResume2'].forEach(function(id){ document.getElementById(id).textContent = txt; });
    ['ouvrirPanier','ouvrirPanier2'].forEach(function(id){ document.getElementById(id).disabled = !nb; });
    document.getElementById('total').textContent = eur(total());
    var env = document.getElementById('envoyer');
    if (!nb) { fermer(); env.href = '#'; } else { env.href = message(); }
  }
  function ouvrir(){ var p = document.getElementById('panier'); p.classList.add('ouvert'); p.setAttribute('aria-hidden','false'); }
  function fermer(){ var p = document.getElementById('panier'); p.classList.remove('ouvert'); p.setAttribute('aria-hidden','true'); }
  ['ouvrirPanier','ouvrirPanier2'].forEach(function(id){ document.getElementById(id).onclick = ouvrir; });
  document.querySelectorAll('[data-fermer]').forEach(function(b){ b.onclick = fermer; });
  ['c-nom','c-mode','c-date'].forEach(function(id){ document.getElementById(id).addEventListener('input', function(){ if (panier.length) document.getElementById('envoyer').href = message(); }); });
  document.querySelectorAll('[data-produit]').forEach(function(c){
    c.querySelector('.btn-add').addEventListener('click', function(){
      var s = c.querySelector('select'), o = s ? s.value : '', nom = c.getAttribute('data-nom'), prix = parseFloat(c.getAttribute('data-prix'));
      var f = panier.find(function(i){ return i.nom === nom && i.option === o; });
      if (f) f.qte++; else panier.push({nom: nom, option: o, prix: prix, qte: 1});
      rendre(); this.textContent = 'Ajouté ✓'; var b = this; setTimeout(function(){ b.textContent = 'Ajouter'; }, 1200);
    });
  });
  rendre();
})();</script>""" % (json_sur(fiche["whatsapp"]), json_sur(fiche["nom"]))
    return corps, menu, entete, barre, style + panier + script


CONSTRUCTEURS = {"artisan": corps_artisan, "beaute": corps_beaute, "commande-whatsapp": corps_commande}


def page_mentions(fiche: dict) -> str:
    def v(cle):
        val = str(fiche.get(cle, "")).strip()
        return e(val) if val else A_COMPLETER

    pays = PAYS[fiche.get("pays", "FR")]
    identifiant = str(fiche.get("numero_entreprise") or fiche.get("siret") or "").strip()
    identifiant = e(identifiant) if identifiant else A_COMPLETER
    credits = ""
    if fiche.get("demo"):
        credits = "<h2>Crédits photos</h2><p>Photos de démonstration sous licence CC0 (domaine public), issues de Wikimedia Commons. Détail : modeles-sites/images-demo/CREDITS.md.</p>"
    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mentions légales — {e(fiche['nom'])}</title>
<style>body{{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;max-width:760px;margin:0 auto;padding:32px 20px;line-height:1.6;color:#16181d;background:#fff}}h1{{font-size:26px}}h2{{font-size:18px;margin-top:28px}}</style>
</head><body>
<p><a href="index.html">← Retour au site</a></p>
<h1>Mentions légales</h1>
<h2>Éditeur du site</h2>
<p>{e(fiche['nom'])}<br>Statut : {v('statut_juridique')}<br>{e(pays['id_label'])} : {identifiant}<br>Adresse : {v('adresse_editeur')}<br>Téléphone : {e(fiche['telephone'])}{('<br>Email : ' + e(fiche['email'])) if fiche.get('email') else ''}</p>
<p>Responsable de la publication : {v('responsable_publication')}</p>
<h2>Hébergeur</h2>
<p>{v('hebergeur')}</p>
<h2>Données personnelles</h2>
<p>Les informations envoyées via le formulaire de contact ou par WhatsApp sont utilisées uniquement pour répondre à votre demande et ne sont ni vendues ni cédées. Elles sont conservées au maximum 3 ans après le dernier contact. Vous pouvez demander leur consultation, rectification ou suppression en écrivant à l'éditeur (coordonnées ci-dessus). Vous pouvez également adresser une réclamation auprès de {pays['autorite']}.</p>
<p>Ce site n'utilise pas de cookies de mesure d'audience ni de publicité.</p>
<h2>Avis clients</h2>
<p>Les avis affichés sont des avis réels, reproduits sans modification avec leur source et leur date. Ils ne font l'objet d'aucune contrepartie.</p>
<h2>Propriété intellectuelle</h2>
<p>Les textes et images de ce site appartiennent à {e(fiche['nom'])} ou sont utilisés avec autorisation.</p>
{credits}
</body></html>
"""


def page_merci(fiche: dict) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Merci — {e(fiche['nom'])}</title><meta name="robots" content="noindex">
<style>body{{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;padding:64px 20px;text-align:center;color:#16181d;background:#fff}}</style>
</head><body><h1>Merci, votre demande est envoyée.</h1><p>{e(fiche['nom'])} vous recontacte rapidement. Urgent ? Appelez le <a href="tel:{e(chiffres(fiche['telephone']))}">{e(fiche['telephone'])}</a>.</p><p><a href="index.html">Retour au site</a></p></body></html>
"""


def generer(fiche: dict, sortie: Path, apercu: bool = False, base: Path | None = None) -> tuple[Path, list[str]]:
    """Génère le site. `base` = dossier de référence des chemins d'images (défaut : modeles-sites/)."""
    base = base or MODELES
    avertissements = valider(fiche, base)
    dossier = sortie / (fiche["slug"] + ("-apercu" if apercu else ""))
    dossier.mkdir(parents=True, exist_ok=True)
    imgs = {}
    for chemin in chemins_images(fiche):
        if re.match(r"https?://", chemin):
            imgs[chemin] = chemin
            continue
        source = base / chemin
        (dossier / "img").mkdir(exist_ok=True)
        shutil.copyfile(source, dossier / "img" / source.name)
        imgs[chemin] = "img/" + source.name
    if fiche.get("demo") and avertissements:
        avertissements = [a for a in avertissements if not a.startswith("Mentions légales")]
    corps, menu, entete, barre, scripts = CONSTRUCTEURS[fiche["modele"]](fiche, imgs)
    (dossier / "index.html").write_text(page(fiche, imgs, apercu, corps, menu, entete, barre, scripts), encoding="utf-8")
    (dossier / "mentions-legales.html").write_text(page_mentions(fiche), encoding="utf-8")
    (dossier / "merci.html").write_text(page_merci(fiche), encoding="utf-8")
    if apercu:
        (dossier / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
    return dossier, avertissements


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("fiche", type=Path, help="Fiche JSON du client ou du prospect")
    parser.add_argument("--apercu", action="store_true", help="Génère un aperçu non indexable avec bandeau")
    parser.add_argument("--sortie", type=Path, default=RACINE / "sorties", help="Dossier de sortie (défaut : projet-revenus/sorties)")
    args = parser.parse_args(argv)
    try:
        fiche = json.loads(args.fiche.read_text(encoding="utf-8"))
        dossier, avertissements = generer(fiche, args.sortie, args.apercu, base=args.fiche.resolve().parent)
    except (FicheInvalide, json.JSONDecodeError, FileNotFoundError) as err:
        print(f"ERREUR : {err}", file=sys.stderr)
        return 1
    for a in avertissements:
        print(f"Attention : {a}")
    print(f"Site généré dans : {dossier}")
    print("Ouvrez index.html dans votre navigateur pour le vérifier.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
