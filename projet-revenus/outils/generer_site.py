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
MODELES_DISPONIBLES = ("artisan", "commande-whatsapp", "beaute", "restaurant")
A_COMPLETER = "[À COMPLÉTER]"
CHAMPS_OBLIGATOIRES = ("modele", "slug", "nom", "metier", "ville", "accroche", "description", "telephone")

# Particularités par pays (mentions légales). Voir MARCHES.md.
PAYS = {
    "FR": {"nom": "France", "id_label": "SIRET", "autorite": "la CNIL (www.cnil.fr)"},
    "BE": {"nom": "Belgique", "id_label": "Numéro d'entreprise (BCE)", "autorite": "l'Autorité de protection des données (www.autoriteprotectiondonnees.be)"},
    "CH": {"nom": "Suisse", "id_label": "Numéro IDE (CHE-…)", "autorite": "le Préposé fédéral à la protection des données et à la transparence (www.edoeb.admin.ch)"},
}
JOURS = (("lun", "Lundi"), ("mar", "Mardi"), ("mer", "Mercredi"), ("jeu", "Jeudi"), ("ven", "Vendredi"), ("sam", "Samedi"), ("dim", "Dimanche"))

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



# Icônes SVG (traits simples, dessinées pour ce projet) : remplacent les emojis, qui font peu professionnel.
def _ico(chemin: str) -> str:
    return ('<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            f'stroke-linejoin="round" aria-hidden="true" focusable="false">{chemin}</svg>')


ICO_TEL = _ico('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>')
ICO_PIN = _ico('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>')
ICO_PANIER = _ico('<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="17" cy="20" r="1"/>')
ICO_CHECK = _ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>')
ICO_HORLOGE = _ico('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')

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
    if fiche["modele"] == "restaurant" and not fiche.get("carte"):
        raise FicheInvalide("Le modèle restaurant exige une « carte » (catégories de plats avec leurs prix)")
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
    if (imgs.get("apropos") or {}).get("src"):
        chemins.append(imgs["apropos"]["src"])
    for p in fiche.get("avant_apres") or []:
        chemins += [x for x in (p.get("avant"), p.get("apres")) if x]
    chemins += [p["image"] for p in fiche.get("produits", []) if p.get("image")]
    chemins += [p["image"] for p in fiche.get("specialites", []) if p.get("image")]
    return chemins


# ---------------------------------------------------------------- couleurs
THEMES = {"artisan": ("artisan.css", "archivo-latin.woff2"),
          "commande-whatsapp": ("commande.css", "gloock-latin.woff2"),
          "beaute": ("beaute.css", "marcellus-latin.woff2"), "restaurant": ("beaute.css", "marcellus-latin.woff2")}


def _rvb(hexa: str) -> tuple[float, float, float]:
    return tuple(int(hexa[i:i + 2], 16) / 255 for i in (1, 3, 5))


def _hexa(rvb) -> str:
    return "#" + "".join(f"{max(0, min(255, round(c * 255))):02x}" for c in rvb)


def _luminance(hexa: str) -> float:
    def lin(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, v, b = (lin(c) for c in _rvb(hexa))
    return 0.2126 * r + 0.7152 * v + 0.0722 * b


def contraste(a: str, b: str) -> float:
    la, lb = sorted((_luminance(a), _luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def _melange(hexa: str, autre: str, t: float) -> str:
    a, b = _rvb(hexa), _rvb(autre)
    return _hexa(tuple(x + (y - x) * t for x, y in zip(a, b)))


def palette(couleur: str, encre: str) -> dict:
    """Variantes de la couleur du client garantissant un contraste AA (4,5:1) là où elles sont utilisées."""
    sur = "#ffffff" if contraste(couleur, "#ffffff") >= 4.5 else "#111111"
    texte = couleur
    for i in range(1, 21):  # assombrit jusqu'à être lisible en texte sur blanc et sur fond gris
        if contraste(texte, "#f2f3f5") >= 4.5:  # lisible sur blanc ET sur les fonds gris des thèmes
            break
        texte = _melange(couleur, "#000000", i * 0.05)
    clair = couleur
    for i in range(1, 21):  # éclaircit jusqu'à être lisible sur le fond sombre (encre)
        if contraste(clair, encre) >= 4.5:
            break
        clair = _melange(couleur, "#ffffff", i * 0.05)
    return {"accent": couleur, "accent-fonce": _melange(couleur, "#000000", 0.18), "sur-accent": sur,
            "accent-texte": texte, "accent-clair": clair}


ENCRES = {"artisan": "#0f1b2d", "commande-whatsapp": "#231a17", "beaute": "#1b1716", "restaurant": "#1b1716"}


# ---------------------------------------------------------------- composants communs
def tete_section(surtitre: str, titre: str, texte: str = "", niveau: str = "h2", ident: str = "") -> str:
    id_attr = f' id="{ident}"' if ident else ""
    return (f'<div class="tete-section"><span class="surtitre">{e(surtitre)}</span><{niveau}{id_attr}>{e(titre)}</{niveau}>'
            + (f'<p class="chapo">{e(texte)}</p>' if texte else "") + "</div>")


def etoiles(note: float) -> str:
    pleines = int(round(note))
    return "★" * pleines + "☆" * (5 - pleines)


def note_txt(note) -> str:
    return str(note).replace(".", ",")


def ligne_note(fiche: dict) -> str:
    avis = fiche.get("avis") or {}
    if avis.get("note") is None or not avis.get("nombre"):
        return ""
    src = f" sur {e(avis['source'])}" if avis.get("source") else ""
    demo = " (exemple)" if fiche.get("demo") or fiche.get("maquette") else ""
    return (f'<p class="note-ligne"><span class="etoiles" aria-hidden="true">{etoiles(avis["note"])}</span> '
            f'<strong>{note_txt(avis["note"])}/5</strong>, {int(avis["nombre"])} avis{src}{demo}</p>')


def section_avis(fiche: dict, classe: str = "") -> str:
    """Avis réels uniquement pour un vrai client ; emplacement vide pour un aperçu ; exemples signalés pour une démo."""
    avis = fiche.get("avis") or {}
    liste = avis.get("liste") or []
    source = avis.get("source", "Google")
    tete = tete_section("Avis clients", fiche.get("titre_avis", "Ce que disent nos clients"), ident="titre-avis")
    if not liste:
        if not fiche.get("avis_a_venir"):
            return ""
        return (f'<section class="section {classe}" id="avis" aria-labelledby="titre-avis"><div class="conteneur">{tete}'
                '<p class="chapo"><strong>Vos vrais avis apparaîtront ici</strong> : votre note, le nombre d\'avis et vos derniers '
                'commentaires Google, recopiés tels quels avec votre accord. Aucun avis n\'est inventé.</p></div></section>')
    resume = ""
    if avis.get("note") is not None and avis.get("nombre"):
        lien = f' <a href="{e(avis["lien"])}" rel="noopener" target="_blank">Voir tous les avis sur {e(source)}</a>' if avis.get("lien") else ""
        resume = (f'<p class="avis-resume"><span class="note">{note_txt(avis["note"])}/5</span>'
                  f'<span class="etoiles" aria-hidden="true">{etoiles(avis["note"])}</span> '
                  f'{int(avis["nombre"])} avis sur {e(source)}.{lien}</p>')
    demo = ('<p class="mention-demo">Démonstration : avis d\'exemple pour une entreprise fictive. '
            "Sur votre site, seuls vos vrais avis apparaîtront, avec leur source.</p>") if fiche.get("demo") else ""
    if fiche.get("maquette"):
        demo = mention_exemple("Avis d'exemple pour la maquette : vos vrais avis Google les remplaceront.")
    cartes = "".join(
        f'<blockquote><span class="etoiles" aria-label="Note : {int(a.get("note", 5))} sur 5">{etoiles(a.get("note", 5))}</span>'
        f'<p>« {e(a["texte"])} »</p><footer>{e(a["auteur"])}'
        + (f", {e(a['date'])}" if a.get("date") else "") + f", {e(source)}</footer></blockquote>"
        for a in liste)
    return (f'<section class="section {classe}" id="avis" aria-labelledby="titre-avis"><div class="conteneur">{tete}{demo}{resume}'
            f'<div class="avis-liste">{cartes}</div></div></section>')


def mention_exemple(texte: str) -> str:
    """Petite mention lisible signalant un contenu d'exemple dans une maquette."""
    return f'<p class="mention-exemple">{e(texte)}</p>'


def section_faq(fiche: dict, classe: str = "") -> str:
    faq = fiche.get("faq") or []
    if not faq:
        return ""
    items = "".join(f"<details><summary>{e(q['q'])}</summary><p>{e(q['r'])}</p></details>" for q in faq)
    return (f'<section class="section {classe}" id="faq" aria-labelledby="titre-faq"><div class="conteneur" style="max-width:52rem">'
            f'{tete_section("Questions fréquentes", "Avant de nous contacter", ident="titre-faq")}'
            + (mention_exemple("Questions et réponses d'exemple, à valider ensemble.") if fiche.get("maquette") else "")
            + f'<div class="faq">{items}</div></div></section>')


def tableau_horaires(fiche: dict) -> str:
    semaine = fiche.get("horaires_semaine")
    if semaine:
        lignes = []
        for code, nom in JOURS:
            h = semaine.get(code, "")
            texte = ", ".join(p.replace(":", "h").replace("-", " à ") for p in h.split(",")) if h else "Fermé"
            lignes.append(f'<tr data-jour="{code}"><td>{nom}</td><td>{e(texte)}</td></tr>')
        return '<table class="horaires"><caption class="cache">Horaires d\'ouverture</caption>' + "".join(lignes) + "</table>"
    horaires = fiche.get("horaires") or []
    if horaires:
        return '<table class="horaires"><caption class="cache">Horaires</caption>' + "".join(f"<tr><td>{e(j)}</td><td>{e(h)}</td></tr>" for j, h in horaires) + "</table>"
    return '<p>Sur rendez-vous.</p>'


def statut_ouverture(fiche: dict) -> str:
    return '<span class="statut" data-ouverture hidden></span>' if fiche.get("horaires_semaine") else ""


def lien_itineraire(fiche: dict) -> str:
    if not fiche.get("adresse"):
        return ""
    q = quote(f"{fiche['adresse']}, {fiche['ville']}")
    return (f'<p style="margin-top:1.25rem"><a class="btn btn--ligne" href="https://www.google.com/maps/search/?api=1&amp;query={q}" '
            f'target="_blank" rel="noopener">{ICO_PIN} Itinéraire</a></p>')


def section_infos(fiche: dict, titre_zone: str, classe: str = "") -> str:
    communes = fiche.get("communes") or []
    liste = ('<ul class="communes">' + "".join(f"<li>{e(c)}</li>" for c in communes) + "</ul>") if communes else ""
    return (f'<section class="section {classe}" id="infos" aria-labelledby="titre-infos"><div class="conteneur deux">'
            f'<div>{tete_section("Où nous trouver", titre_zone, ident="titre-infos")}<p>{e(fiche.get("zone", fiche["ville"]))}</p>{liste}{lien_itineraire(fiche)}</div>'
            f'<div>{tete_section("Horaires", "Quand nous joindre")}{tableau_horaires(fiche)}'
            + (mention_exemple("Horaires d'exemple, à remplacer par les vôtres.") if fiche.get("maquette") else "")
            + '</div></div></section>')


def formulaire(fiche: dict, titre_bouton: str = "Envoyer ma demande") -> str:
    """Formulaire Netlify. Démo : désactivé avec un message clair (aucune donnée envoyée)."""
    if fiche.get("demo") or fiche.get("_apercu"):
        quoi = "Aperçu non publié" if fiche.get("_apercu") else "Site de démonstration"
        attrs = f'name="demo" data-demo="{quoi} : le formulaire est désactivé, aucune donnée n\u2019a été envoyée."'
    else:
        attrs = 'name="contact" method="POST" action="/merci" data-netlify="true" netlify-honeypot="site_web"'
    return (f'<form class="form" {attrs} novalidate><input type="hidden" name="form-name" value="contact">'
            '<p class="piege"><label for="site_web">Ne pas remplir</label><input id="site_web" name="site_web" tabindex="-1" autocomplete="off"></p>'
            '<div class="champ"><label for="f-nom">Nom</label><input id="f-nom" name="nom" autocomplete="name" required aria-describedby="e-nom"><p class="erreur" id="e-nom"></p></div>'
            '<div class="champ"><label for="f-tel">Téléphone</label><input id="f-tel" name="telephone" type="tel" autocomplete="tel" required aria-describedby="e-tel"><p class="erreur" id="e-tel"></p></div>'
            '<div class="champ"><label for="f-ville">Commune <span class="facultatif">(facultatif)</span></label><input id="f-ville" name="commune" autocomplete="address-level2"></div>'
            '<div class="champ"><label for="f-msg">Votre besoin</label><textarea id="f-msg" name="message" required aria-describedby="e-msg"></textarea><p class="erreur" id="e-msg"></p></div>'
            '<p class="petit">Vos informations servent uniquement à répondre à votre demande. <a href="mentions-legales.html">Mentions légales et données personnelles</a>.</p>'
            '<p class="retour" role="alert"></p>'
            f'<button class="btn" type="submit">{e(titre_bouton)}</button>'
            + (f'<p class="promesse-form">{ICO_HORLOGE} {e(fiche["delai_reponse"])}</p>' if fiche.get("delai_reponse") else "") + '</form>')


def pied(fiche: dict) -> str:
    reseaux = fiche.get("reseaux") or {}
    liens = "".join(f'<li><a href="{e(u)}" rel="noopener" target="_blank">{e(n.capitalize())}</a></li>' for n, u in reseaux.items() if u)
    tel = e(fiche["telephone"])
    tel_html = f'<li><a href="tel:{e(chiffres(fiche["telephone"]))}">{tel}</a></li>' if chiffres(fiche["telephone"]) else ""
    mail = f'<li><a href="mailto:{e(fiche["email"])}">{e(fiche["email"])}</a></li>' if fiche.get("email") else ""
    return (f'<footer class="pied"><div class="conteneur"><div><p class="marque" style="color:#fff">{e(fiche["nom"])}</p>'
            f'<p style="margin-top:.5rem">{e(fiche["metier"])}, {e(fiche["ville"])}</p></div>'
            + (f'<div><h2>Contact</h2><ul>{tel_html}{mail}{liens}</ul></div>' if tel_html or mail or liens else "")
            + f'<div><h2>Informations</h2><ul><li><a href="mentions-legales.html">Mentions légales</a></li><li>© {_dt.date.today().year} {e(fiche["nom"])}</li></ul></div>'
            "</div></footer>")


SCRIPT_COMMUN = """<script>(function(){
  var b = document.querySelector('.btn-menu'), n = document.getElementById('nav');
  if (b && n){ b.addEventListener('click', function(){ var o = n.classList.toggle('ouvert'); b.setAttribute('aria-expanded', o); });
    n.addEventListener('click', function(e){ if (e.target.closest('a')){ n.classList.remove('ouvert'); b.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && n.classList.contains('ouvert')){ n.classList.remove('ouvert'); b.setAttribute('aria-expanded', 'false'); b.focus(); } }); }
  var barre = document.querySelector('.barre-mobile'), haut = document.querySelector('.accueil .actions');
  if (barre && haut && 'IntersectionObserver' in window){
    new IntersectionObserver(function(es){ barre.classList.toggle('repliee', es[0].isIntersecting || es[0].boundingClientRect.top > 0); }).observe(haut); }
  var bouge = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  document.querySelectorAll('.defilant').forEach(function(d){ var p = d.querySelector('.defilant-pause'); if (!p) return;
    p.addEventListener('click', function(){ var on = d.classList.toggle('pause'); p.setAttribute('aria-pressed', on ? 'true' : 'false');
      p.setAttribute('aria-label', on ? 'Relancer le bandeau' : 'Mettre le bandeau en pause'); }); });
  var vt = document.querySelector('.ville-tourne');
  if (vt && bouge){ var vs = vt.children, i = 0;
    var tour = setInterval(function(){ var a = vs[i % vs.length]; i++; var b = vs[i % vs.length];
      a.classList.remove('actif'); a.setAttribute('aria-hidden', 'true'); b.classList.add('actif'); b.removeAttribute('aria-hidden');
      if (i >= vs.length) clearInterval(tour); }, 1900); }
  var f = document.querySelector('form.form'); if (!f) return;
  var regles = {nom:'Indiquez votre nom.', telephone:'Indiquez un numéro de téléphone valide.', message:'Décrivez votre besoin en quelques mots.'};
  function ok(c){ var v = c.value.trim(), m = '';
    if (!v) m = regles[c.name]; else if (c.name === 'telephone' && !/^[+0-9 ().-]{8,20}$/.test(v)) m = regles.telephone;
    var z = document.getElementById(c.getAttribute('aria-describedby')); if (z) z.textContent = m; c.setAttribute('aria-invalid', m ? 'true' : 'false'); return !m; }
  f.addEventListener('submit', function(e){ var r = f.querySelector('.retour'), premier = null; r.textContent = '';
    ['nom','telephone','message'].forEach(function(n){ var c = f.elements[n]; if (c && !ok(c) && !premier) premier = c; });
    if (premier){ e.preventDefault(); premier.focus(); return; }
    if (f.hasAttribute('data-demo')){ e.preventDefault(); r.textContent = f.getAttribute('data-demo'); } });
})();</script>"""


def script_ouverture(fiche: dict) -> str:
    """Statut « Ouvert / Fermé » et jour surligné, calculés avec l'heure du visiteur."""
    if not fiche.get("horaires_semaine"):
        return ""
    return """<script>(function(){
  var H = %s, codes = ["dim","lun","mar","mer","jeu","ven","sam"], d = new Date(), c = codes[d.getDay()];
  var l = document.querySelector('tr[data-jour="' + c + '"]'); if (l) l.className = "aujourdhui";
  var m = d.getHours() * 60 + d.getMinutes(), o = false;
  (H[c] || "").split(",").forEach(function(p){ if (!p) return; var t = p.split("-"), a = t[0].split(":"), b = t[1].split(":");
    if (m >= +a[0] * 60 + +a[1] && m < +b[0] * 60 + +b[1]) o = true; });
  document.querySelectorAll("[data-ouverture]").forEach(function(el){ el.textContent = o ? "Ouvert en ce moment" : "Fermé en ce moment"; el.className = "statut " + (o ? "ouvert" : "ferme"); el.hidden = false; });
})();</script>""" % json_sur(fiche["horaires_semaine"])


def lien_wa(fiche: dict, texte: str) -> str:
    return f"https://wa.me/{fiche['whatsapp']}?text=" + quote(texte, safe="")


TAILLES_DEFAUT = "(min-width: 52rem) 50vw, 100vw"


def img_tag(imgs: dict, chemin: str, alt: str, classe_lazy: bool = True, largeur: int = 900, hauteur: int = 675,
            tailles: str = TAILLES_DEFAUT) -> str:
    if imgs.get("|final") and est_ia(chemin) and not alt.startswith("Illustration"):  # site final seulement
        alt = "Illustration : " + alt
    charge = ' loading="lazy" decoding="async"' if classe_lazy else ' fetchpriority="high"'
    srcset = imgs.get(chemin + "|srcset")
    jeu = f' srcset="{e(srcset)}" sizes="{e(tailles)}"' if srcset else ""
    return f'<img src="{e(imgs[chemin])}"{jeu} alt="{e(alt)}" width="{largeur}" height="{hauteur}"{charge}>'


def optimiser_image(source: Path, dossier_img: Path) -> tuple[str, str] | None:
    """Convertit une photo en WebP (720 et 1440 px de large au plus). Nécessite Pillow ; sinon None (copie simple)."""
    try:
        from PIL import Image, ImageOps
    except ImportError:
        return None
    variantes = []
    with Image.open(source) as brute:
        im = ImageOps.exif_transpose(brute).convert("RGB")
        for largeur in (720, 1440):
            if largeur > im.width and variantes:
                break
            cible = min(largeur, im.width)
            nom = f"{source.stem}-{cible}.webp"
            im.resize((cible, round(im.height * cible / im.width)), Image.LANCZOS).save(dossier_img / nom, "WEBP", quality=78, method=4)
            variantes.append((nom, cible))
    return "img/" + variantes[0][0], ", ".join(f"img/{n} {w}w" for n, w in variantes)


# ---------------------------------------------------------------- blocs « conversion » (étude des concurrents, nov. 2026)
JOURS_SCHEMA = {"lun": "Monday", "mar": "Tuesday", "mer": "Wednesday", "jeu": "Thursday", "ven": "Friday", "sam": "Saturday", "dim": "Sunday"}


def est_ia(chemin: str) -> bool:
    """Image générée par IA (dossier images-ia ou nom ia-…) : illustration, jamais une réalisation."""
    return "images-ia/" in chemin or Path(chemin).name.startswith("ia-")


def qualifications(fiche: dict) -> str:
    """Qualifications RÉELLES du client (RGE, Qualibat…), jamais pour une maquette."""
    q = [x for x in fiche.get("qualifications") or [] if str(x).strip()]
    if not q or fiche.get("maquette"):
        return ""
    return '<ul class="qualifs" aria-label="Qualifications">' + "".join(f"<li>{ICO_CHECK}{e(x)}</li>" for x in q) + "</ul>"


def section_depannage(fiche: dict) -> str:
    """Tarifs de dépannage : affichage exigé pour les prestations de dépannage, réparation et entretien
    du bâtiment et de l'équipement de la maison (arrêté du 24 janvier 2017)."""
    t = fiche.get("tarifs_depannage") or {}
    lignes = [(lib, t.get(k)) for k, lib in (("taux_horaire", "Taux horaire"), ("deplacement", "Déplacement"),
                                              ("forfaits", "Forfaits"), ("majorations", "Soirs, week-ends et jours fériés"), ("devis", "Devis"))]
    lignes = [(lib, v) for lib, v in lignes if v]
    if not lignes:
        return ""
    dl = "".join(f"<div><dt>{e(lib)}</dt><dd>{e(v)}</dd></div>" for lib, v in lignes)
    return (f'<section class="section depannage" id="tarifs-depannage" aria-labelledby="titre-depannage"><div class="conteneur">'
            f'{tete_section("Tarifs", "Nos tarifs de dépannage", "Prix TTC, annoncés avant toute intervention.", ident="titre-depannage")}'
            f'<dl class="grille-tarifs">{dl}</dl>'
            + (mention_exemple("Tarifs d'exemple, à remplacer par les vôtres.") if fiche.get("maquette") else
               '<p class="petit">Information sur les prix conforme à l\u2019arrêté du 24 janvier 2017 relatif aux prestations de dépannage, de réparation et d\u2019entretien.</p>')
            + "</div></section>")


def section_avant_apres(fiche: dict, imgs: dict) -> str:
    """Avant / après : uniquement des photos réelles de chantiers du client."""
    paires = [p for p in fiche.get("avant_apres") or [] if p.get("avant") and p.get("apres")]
    if not paires:
        return ""
    figs = "".join(
        f'<figure class="aa"><div class="aa-duo"><div>{img_tag(imgs, p["avant"], "Avant : " + (p.get("legende") or "chantier"), True, 600, 450, "(min-width: 52rem) 25vw, 50vw")}<span>Avant</span></div>'
        f'<div>{img_tag(imgs, p["apres"], "Après : " + (p.get("legende") or "chantier"), True, 600, 450, "(min-width: 52rem) 25vw, 50vw")}<span>Après</span></div></div>'
        + (f'<figcaption>{e(p["legende"])}</figcaption>' if p.get("legende") else "") + "</figure>" for p in paires[:4])
    return (f'<section class="section" id="avant-apres" aria-labelledby="titre-aa"><div class="conteneur">'
            f'{tete_section("Avant / après", "La différence, en photos", ident="titre-aa")}<div class="aa-liste">{figs}</div></div></section>')


def jsonld_local(fiche: dict) -> dict:
    """Données structurées utiles au référencement local : horaires, zone desservie, services, réseaux."""
    d: dict = {}
    sem = fiche.get("horaires_semaine") or {}
    spec = []
    for code, jour in JOURS_SCHEMA.items():
        for plage in filter(None, (sem.get(code) or "").split(",")):
            debut, fin = plage.split("-")
            spec.append({"@type": "OpeningHoursSpecification", "dayOfWeek": jour, "opens": debut, "closes": fin})
    if spec:
        d["openingHoursSpecification"] = spec
    if fiche.get("communes"):
        d["areaServed"] = [{"@type": "City", "name": c} for c in fiche["communes"]]
    noms = [x["titre"] for x in fiche.get("services") or []] + [p["nom"] for c in fiche.get("prestations") or [] for p in c.get("liste", [])]
    if noms and not fiche.get("maquette"):
        d["makesOffer"] = [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": n}} for n in noms[:12]]
    reseaux = [u for u in (fiche.get("reseaux") or {}).values() if u and not u.rstrip("/").endswith(".com")]
    if reseaux:
        d["sameAs"] = reseaux
    return d


# ---------------------------------------------------------------- interactivité (bandeau défilant, ville animée)
ICO_PAUSE = '<svg class="ico i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
ICO_LECTURE = '<svg class="ico i-lecture" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'


def bandeau_defilant(fiche: dict) -> str:
    """Bandeau défilant (ville, communes, services ou produits, numéro). Pause accessible ; immobile si mouvement réduit."""
    if fiche.get("defilant") is False:
        return ""
    items = list(fiche.get("defilant") or [])
    if not items:
        tel = fiche["telephone"] if chiffres(fiche["telephone"]) else ""
        items = [f'{fiche["metier"]} à {fiche["ville"]}'] + [c for c in fiche.get("communes") or [] if c != fiche["ville"]][:6]
        if fiche["modele"] == "commande-whatsapp":
            items += [p["nom"] for p in fiche.get("produits") or []][:5] + ["Commande en 2 minutes sur WhatsApp"]
        elif fiche["modele"] in ("beaute", "restaurant"):
            items += [p["nom"] for c in fiche.get("carte") or fiche.get("prestations") or [] for p in c.get("liste", [])][:6]
            items.append("Réservez votre table" if fiche["modele"] == "restaurant" else "Réservation en quelques secondes")
        else:
            items += [x["titre"] for x in fiche.get("services") or []][:4]
            if fiche.get("delai_reponse"):
                items.append(re.sub(r"\s*\(exemple\)", "", fiche["delai_reponse"]))
        if tel:
            items.append(f"Tél. {tel}")
    vus, propres = set(), []
    for x in items:
        x = str(x).strip()
        if x and x.lower() not in vus:
            vus.add(x.lower()); propres.append(x)
    if len(propres) < 3:
        return ""
    lis = "".join(f"<li>{e(x)}</li>" for x in propres)
    return ('<section class="defilant" aria-label="En bref"><div class="defilant-fenetre"><div class="defilant-piste">'
            f'<ul>{lis}</ul><ul aria-hidden="true">{lis}</ul></div></div>'
            f'<button class="defilant-pause" type="button" aria-pressed="false" aria-label="Mettre le bandeau en pause">{ICO_PAUSE}{ICO_LECTURE}</button></section>')


def titre_anime(fiche: dict, titre: str) -> str:
    """Titre échappé ; la ville peut défiler entre les communes desservies (un seul tour, puis retour à la ville).
    Toutes les villes occupent la même case (grille) : la place du nom le plus long est réservée, rien ne bouge (CLS nul)."""
    t = e(titre)
    autres = [c for c in fiche.get("communes") or [] if c and c != fiche["ville"]][:6]
    v = e(fiche["ville"])
    m = re.search(re.escape(v) + r"([,.:;!?]?)", t)
    if not autres or not m:
        return t
    noms = "".join(f'<span{" class=\"actif\"" if i == 0 else " aria-hidden=\"true\""}>{e(c)}</span>' for i, c in enumerate([fiche["ville"]] + autres))
    bloc = f'<span class="insecable"><span class="ville-tourne">{noms}</span>{m.group(1)}</span>'
    return t[:m.start()] + bloc + t[m.end():]


# ---------------------------------------------------------------- page
def favicon(nom: str, pal: dict) -> str:
    """Icône d'onglet : initiale du client sur sa couleur (SVG intégré, aucun fichier à fournir)."""
    lettre = html.escape((re.sub(r"[^\w]", "", nom) or "?")[0].upper())
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='{pal['accent']}'/>"
           f"<text x='32' y='44' font-family='Arial,sans-serif' font-size='36' font-weight='700' text-anchor='middle' fill='{pal['sur-accent']}'>{lettre}</text></svg>")
    return "data:image/svg+xml," + quote(svg, safe="/:=' ,")


def page(fiche: dict, apercu: bool, corps: str, menu: list[tuple[str, str]], cta_entete: str, barre: str, scripts: str = "", imgs: dict | None = None) -> str:
    modele = fiche["modele"]
    css = (MODELES / "themes" / "base.css").read_text(encoding="utf-8") + (MODELES / "themes" / THEMES[modele][0]).read_text(encoding="utf-8")
    pal = palette(fiche.get("couleur", "#1f5fbf"), ENCRES[modele])
    variables = ":root{" + ";".join(f"--{k}:{v}" for k, v in pal.items()) + "}"
    pays = fiche.get("pays", "FR")
    titre_page = f"{fiche['nom']}, {fiche['metier'].lower()} à {fiche['ville']}"
    meta = fiche.get("meta_description") or f"{fiche['nom']}, {fiche['metier'].lower()} à {fiche['ville']}. {fiche['accroche']}"
    jsonld = {"@context": "https://schema.org", "@type": fiche.get("type_schema", "LocalBusiness"), "name": fiche["nom"],
              "description": fiche["description"], "areaServed": fiche.get("zone", fiche["ville"]),
              "address": {"@type": "PostalAddress", "addressLocality": fiche["ville"], "addressCountry": pays}}
    if chiffres(fiche["telephone"]):
        jsonld["telephone"] = fiche["telephone"]
    if fiche.get("email"):
        jsonld["email"] = fiche["email"]
    avis = fiche.get("avis") or {}
    if avis.get("note") is not None and avis.get("nombre") and not (fiche.get("demo") or fiche.get("maquette") or apercu):
        jsonld["aggregateRating"] = {"@type": "AggregateRating", "ratingValue": avis["note"], "reviewCount": avis["nombre"]}
    if imgs and (fiche.get("images") or {}).get("hero"):
        jsonld["image"] = imgs[fiche["images"]["hero"]]
    jsonld.update(jsonld_local(fiche))
    if fiche.get("domaine") and not apercu:
        jsonld["url"] = fiche["domaine"].rstrip("/") + "/"
    nav = "".join(f'<li><a href="#{a}">{e(t)}</a></li>' for a, t in menu)
    police = THEMES[modele][1]
    bandeau = ""
    if apercu:
        bandeau = (f'<aside class="bandeau-info" aria-label="Information sur cette page"><p>Maquette préparée pour {e(fiche["nom"])} : non publiée, non contractuelle. '
                   + ("Avis, prix, horaires et photos sont des exemples à remplacer par les vôtres." if fiche.get("maquette") else "Textes et visuels à valider ensemble.")
                   + '</p></aside>')
    elif fiche.get("demo"):
        bandeau = '<aside class="bandeau-info" aria-label="Information sur cette page"><p>Site de démonstration réalisé par Mysite : entreprise, avis et coordonnées fictifs.</p></aside>'
    return f"""<!DOCTYPE html>
<html lang="fr-{pays}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(titre_page)}</title>
<meta name="description" content="{e(meta[:300])}">
{'<meta name="robots" content="noindex, nofollow">' if apercu else ''}
{f'<link rel="canonical" href="{e(fiche["domaine"].rstrip("/"))}/">' if fiche.get("domaine") and not apercu else ''}
<meta property="og:title" content="{e(titre_page)}">
<meta property="og:description" content="{e(meta[:300])}">
<meta property="og:type" content="website">
<meta name="theme-color" content="{pal['accent']}">
<link rel="icon" href="{favicon(fiche['nom'], pal)}">
<link rel="preload" href="polices/{police}" as="font" type="font/woff2" crossorigin>
<script type="application/ld+json">{json_sur(jsonld)}</script>
<style>{css}{variables}</style>
</head>
<body class="{'a-barre' if barre else ''}">
<a class="evitement" href="#contenu">Aller au contenu</a>
{bandeau}
<header class="entete"><div class="conteneur">
  <a class="marque" href="#contenu">{e(fiche['nom'])}<small>{e(fiche['metier'])}, {e(fiche['ville'])}</small></a>
  <nav class="nav" id="nav" aria-label="Navigation principale"><ul>{nav}</ul></nav>
  {cta_entete}
  <button class="btn-menu" type="button" aria-expanded="false" aria-controls="nav"><span class="cache">Menu</span><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
</div></header>
<main id="contenu">
{corps}
</main>
{pied(fiche)}
{('<div class="barre-mobile" role="region" aria-label="Actions rapides">' + barre + '</div>') if barre else ''}
{SCRIPT_COMMUN}
{script_ouverture(fiche)}
{scripts}
</body>
</html>
"""


# ---------------------------------------------------------------- ARTISAN
def corps_artisan(fiche: dict, imgs: dict):
    tel = chiffres(fiche["telephone"])
    lien_tel = f"tel:{tel}" if tel else "#contact"  # sans numéro (aperçu), le bouton mène au formulaire
    a_tel = bool(re.search(r"\d", fiche["telephone"]))
    libelle = f"Appeler le {e(fiche['telephone'])}" if a_tel else "Appeler"
    wa = fiche.get("whatsapp")
    lien_devis = lien_wa(fiche, "Bonjour, je souhaite un devis pour : ") if wa else ""
    h = (fiche.get("images") or {}).get("hero")
    cta2 = fiche.get("cta_secondaire", "Demander un devis")
    actions = (f'<a class="btn btn--appel" href="{e(lien_tel)}">{ICO_TEL} {libelle}</a><a class="btn btn--ligne" href="#contact">{e(cta2)}</a>'
               if tel else f'<a class="btn btn--appel" href="#contact">{e(cta2)}</a>')
    appel = f"{ICO_TEL} Appeler" if tel else "Nous contacter"
    accueil = (f'<section class="accueil" aria-labelledby="titre-accueil"><div class="conteneur"><div>'
               f'<p class="lieu"><span>{ICO_PIN} {e(fiche.get("zone_courte") or fiche["ville"])}</span>{statut_ouverture(fiche)}</p>'
               f'<h1 id="titre-accueil">{titre_anime(fiche, fiche.get("titre") or fiche["metier"] + " à " + fiche["ville"])}</h1>'
               f'<p class="chapo">{e(fiche["accroche"])}</p><div class="actions">{actions}</div>'
               + (f'<p class="promesse">{ICO_HORLOGE} {e(fiche["delai_reponse"])}</p>' if fiche.get("delai_reponse") else "")
               + ligne_note(fiche) + qualifications(fiche)
               + (f'<p class="petit">{e(fiche["bandeau"])}</p>' if fiche.get("bandeau") else "") + "</div>"
               + (f'<div class="photo-accueil">{img_tag(imgs, h, fiche["nom"] + ", " + fiche["metier"], False, 900, 675)}</div>' if h else "")
               + "</div></section>")
    atouts = fiche.get("atouts") or []
    bande = (f'<div class="atouts"><div class="conteneur"><ul>' + "".join(f"<li>{ICO_CHECK}{e(a)}</li>" for a in atouts) + "</ul></div></div>") if atouts else ""
    services = "".join(f'<div class="service"><h3>{e(s["titre"])}</h3><p>{e(s.get("texte", ""))}</p>'
                       + (f'<span class="prix">{e(s["prix"])}</span>' if s.get("prix") else "<span></span>") + "</div>"
                       for s in fiche.get("services") or [])
    sec_services = (f'<section class="section" id="services" aria-labelledby="titre-services"><div class="conteneur">'
                    f'{tete_section("Services", fiche.get("titre_services", "Ce que nous faisons"), fiche.get("intro_services", ""), ident="titre-services")}'
                    f'<div class="services">{services}</div>'
                    + (mention_exemple("Prix indicatifs d'exemple, à remplacer par les vôtres.") if fiche.get("maquette") else "")
                    + '</div></section>') if services else ""
    galerie = (fiche.get("images") or {}).get("galerie") or []
    sec_real = (f'<section class="section gris" id="realisations" aria-labelledby="titre-real"><div class="conteneur">'
                f'{tete_section(fiche.get("libelle_realisations", "Réalisations"), fiche.get("titre_realisations", "Des chantiers récents"), ident="titre-real")}<div class="realisations">'
                + "".join(f'<figure>{img_tag(imgs, g["src"], g.get("legende") or fiche["metier"], True, 600, 600, "(min-width: 52rem) 25vw, 50vw")}'
                          + (f'<figcaption>{e(g["legende"])}</figcaption>' if g.get("legende") else "") + "</figure>" for g in galerie)
                + "</div></div></section>") if galerie else ""
    sec_depannage = section_depannage(fiche)
    sec_aa = section_avant_apres(fiche, imgs)
    etapes = fiche.get("etapes") or [{"titre": t, "texte": x} for t, x in ETAPES_DEFAUT["artisan"]]
    sec_etapes = (f'<section class="section" id="methode" aria-labelledby="titre-methode"><div class="conteneur">'
                  f'{tete_section("Comment ça se passe", "Trois étapes, sans surprise", ident="titre-methode")}<ol class="etapes">'
                  + "".join(f'<li><h3>{e(s["titre"])}</h3><p>{e(s["texte"])}</p></li>' for s in etapes) + "</ol></div></section>")
    ph = (fiche.get("images") or {}).get("apropos") or {}
    texte_apropos = f'{tete_section("Qui sommes-nous", fiche.get("titre_apropos", "Un artisan près de chez vous"), ident="titre-apropos")}<p>{e(fiche["description"])}</p>'
    if ph.get("src"):
        legende = " · ".join(x for x in (ph.get("legende"), ph.get("credit")) if x)
        apropos = (f'<section class="section gris" id="apropos" aria-labelledby="titre-apropos"><div class="conteneur apropos"><div>{texte_apropos}</div>'
                   f'<figure>{img_tag(imgs, ph["src"], ph.get("legende") or fiche["metier"] + " au travail", True, 900, 675)}'
                   + (f'<figcaption>{e(legende)}</figcaption>' if legende else "") + '</figure></div></section>')
    else:
        apropos = (f'<section class="section gris" id="apropos" aria-labelledby="titre-apropos"><div class="conteneur" style="max-width:52rem">'
                   f'{texte_apropos}</div></section>')
    contact = (f'<section class="section contact" id="contact" aria-labelledby="titre-contact"><div class="conteneur"><div>'
               f'<span class="surtitre">Contact</span><h2 id="titre-contact">{e(fiche.get("titre_contact", "Un besoin, une urgence ?"))}</h2>'
               + (f'<a class="tel-geant" href="{e(lien_tel)}">{e(fiche["telephone"])}</a>' if a_tel else "")
               + '<div class="infos-contact">'
               + (f'<p>Email : <a href="mailto:{e(fiche["email"])}">{e(fiche["email"])}</a></p>' if fiche.get("email") else "")
               + (f'<p><a href="{e(lien_devis)}" rel="noopener" target="_blank">{e(fiche.get("texte_whatsapp", "Envoyer une photo du problème sur WhatsApp"))}</a></p>' if wa else "")
               + f'</div></div>{formulaire(fiche, fiche.get("bouton_formulaire", "Recevoir mon devis"))}</div></section>')
    corps = (accueil + bandeau_defilant(fiche) + bande + sec_services + sec_depannage + sec_aa + sec_real + sec_etapes + section_avis(fiche) + apropos
             + section_infos(fiche, fiche.get("titre_zone", "Zone d'intervention")) + section_faq(fiche, "gris") + contact)
    menu = [(a, t) for a, t, ok in [("services", "Services", sec_services), ("realisations", fiche.get("libelle_realisations", "Réalisations"), sec_real),
                                     ("avis", "Avis", "id=\"avis\"" in corps), ("infos", "Zone et horaires", True)] if ok]
    entete = f'<a class="btn" href="{e(lien_tel)}">{appel}</a>'
    barre = f'<a class="btn" href="{e(lien_tel)}">{appel}</a>' + (
        f'<a class="btn btn--wa" href="{e(lien_devis)}" rel="noopener" target="_blank">WhatsApp</a>' if wa else '<a class="btn btn--ligne" href="#contact">Devis</a>')
    return corps, menu, entete, barre, ""


# ---------------------------------------------------------------- BEAUTÉ
TEXTES_BEAUTE = {
    "resa_wa": "Bonjour, je souhaite prendre rendez-vous pour : ", "alt_hero": "Intérieur du salon ", "cta_resa": "Prendre rendez-vous",
    "cta_tarifs": "Voir les tarifs", "sur_tarifs": "Prestations & tarifs", "titre_tarifs": "Nos tarifs",
    "intro_tarifs": "Prix affichés, durées indiquées. Le diagnostic est fait avec vous avant chaque couleur.",
    "mention": "Prix et durées d'exemple, à remplacer par les vôtres.", "btn_tarifs": "Réserver mon créneau",
    "sur_gal": "Le salon", "titre_gal": "En images", "alt_gal": "Le salon", "sur_apropos": "À propos", "titre_apropos": "Une équipe à votre écoute",
    "titre_reserver": "Réservez votre moment", "texte_reserver": "En ligne en quelques secondes, ou par téléphone.",
    "infos": "Le salon", "menu_tarifs": "Tarifs", "menu_gal": "Le salon", "menu_infos": "Accès et horaires", "entete": "Réserver",
}
TEXTES_RESTAURANT = {
    "resa_wa": "Bonjour, je souhaite réserver une table pour ... personnes, le ... à ... h.", "alt_hero": "Salle du restaurant ", "cta_resa": "Réserver une table",
    "cta_tarifs": "Voir la carte", "sur_tarifs": "La carte", "titre_tarifs": "Cuisine traditionnelle française",
    "intro_tarifs": "Produits frais et de saison, tout est préparé maison. La carte évolue au fil des marchés.",
    "mention": "Carte et prix d'exemple, à remplacer par les vôtres.", "btn_tarifs": "Réserver une table",
    "sur_gal": "La maison", "titre_gal": "En images", "alt_gal": "Le restaurant", "sur_apropos": "La maison", "titre_apropos": "Une cuisine de tradition",
    "titre_reserver": "Réservez votre table", "texte_reserver": "Par téléphone ou par message, pour le déjeuner comme pour le dîner.",
    "infos": "Nous trouver", "menu_tarifs": "La carte", "menu_gal": "En images", "menu_infos": "Horaires et accès", "entete": "Réserver",
}


def section_specialites(fiche: dict, imgs: dict) -> str:
    """Plats signature avec photo, nom, description et prix (restaurant)."""
    plats = [p for p in fiche.get("specialites") or [] if p.get("nom")]
    if not plats:
        return ""
    cartes = "".join(
        f'<article class="specialite">' + (f'<div class="visuel">{img_tag(imgs, p["image"], p["nom"], True, 800, 600, "(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw")}</div>' if p.get("image") else "")
        + f'<div class="ligne"><h3>{e(p["nom"])}</h3>' + (f'<span class="prix">{e(p["prix"]) if isinstance(p.get("prix"), str) else euros(p["prix"])}</span>' if p.get("prix") is not None else "")
        + f'</div><p>{e(p.get("desc", ""))}</p></article>' for p in plats[:6])
    return (f'<section class="section" id="specialites" aria-labelledby="titre-specialites"><div class="conteneur">'
            f'{tete_section("Nos spécialités", fiche.get("titre_specialites", "Les classiques de la maison"), ident="titre-specialites")}'
            f'<div class="specialites">{cartes}</div></div></section>')


def corps_beaute(fiche: dict, imgs: dict):
    T = {**(TEXTES_RESTAURANT if fiche["modele"] == "restaurant" else TEXTES_BEAUTE), **(fiche.get("textes") or {})}
    resa = (fiche.get("reservation_url")
            or (lien_wa(fiche, T["resa_wa"]) if fiche.get("whatsapp") else "")
            or (f"tel:{chiffres(fiche['telephone'])}" if chiffres(fiche["telephone"]) else "#infos"))  # aperçu sans contact : accès et horaires
    cible = ' target="_blank" rel="noopener"' if resa.startswith("http") else ""
    tel = chiffres(fiche["telephone"])
    h = (fiche.get("images") or {}).get("hero")
    accueil = (f'<section class="accueil" aria-labelledby="titre-accueil">'
               + (f'<div class="photo-accueil">{img_tag(imgs, h, T["alt_hero"] + fiche["nom"], False, 900, 1000)}</div>' if h else "")
               + f'<div class="texte"><p class="lieu"><span>{ICO_PIN} {e(fiche.get("zone_courte") or fiche["ville"])}</span>{statut_ouverture(fiche)}</p>'
               f'<h1 id="titre-accueil">{titre_anime(fiche, fiche.get("titre") or fiche["metier"] + " à " + fiche["ville"])}</h1><p class="chapo">{e(fiche["accroche"])}</p>'
               f'<div class="actions"><a class="btn" href="{e(resa)}"{cible}>{e(T["cta_resa"])}</a><a class="btn btn--ligne" href="#tarifs">{e(T["cta_tarifs"])}</a></div>'
               f'{ligne_note(fiche)}</div></section>')
    atouts = fiche.get("atouts") or []
    bande = (f'<div class="atouts"><div class="conteneur"><ul>' + "".join(f"<li>{ICO_CHECK}{e(a)}</li>" for a in atouts) + "</ul></div></div>") if atouts else ""
    cats = []
    for c in fiche.get("carte") or fiche.get("prestations") or []:
        lignes = "".join(
            f'<li><div class="ligne"><span class="nom">{e(p["nom"])}</span><span class="points" aria-hidden="true"></span>'
            f'<span class="prix">{e(p["prix"]) if isinstance(p.get("prix"), str) else euros(p.get("prix", 0))}</span></div>'
            + (f'<p class="detail">{e(p.get("duree", ""))}{" · " if p.get("duree") and p.get("desc") else ""}{e(p.get("desc", ""))}</p>' if p.get("duree") or p.get("desc") else "")
            + "</li>" for p in c.get("liste", []))
        cats.append(f'<div><h3>{e(c["categorie"])}</h3><ul>{lignes}</ul></div>')
    tarifs = (f'<section class="section" id="tarifs" aria-labelledby="titre-tarifs"><div class="conteneur">'
              f'{tete_section(T["sur_tarifs"], T["titre_tarifs"], fiche.get("intro_tarifs", T["intro_tarifs"]), ident="titre-tarifs")}'
              f'<div class="tarifs">{"".join(cats)}</div>'
              + (mention_exemple(T["mention"]) if fiche.get("maquette") else "")
              + f'<p style="margin-top:2.5rem"><a class="btn" href="{e(resa)}"{cible}>{e(T["btn_tarifs"])}</a></p></div></section>')
    galerie = (fiche.get("images") or {}).get("galerie") or []
    sec_gal = (f'<section class="section gris" id="galerie" aria-labelledby="titre-galerie"><div class="conteneur">'
               f'{tete_section(T["sur_gal"], T["titre_gal"], ident="titre-galerie")}<div class="galerie">'
               + "".join(f'<figure>{img_tag(imgs, g["src"], g.get("legende") or T["alt_gal"], True, 700, 700, "(min-width: 40rem) 60vw, 100vw")}'
                         + (f'<figcaption>{e(g["legende"])}</figcaption>' if g.get("legende") else "") + "</figure>" for g in galerie[:3])
               + "</div></div></section>") if galerie else ""
    apropos = (f'<section class="section" id="apropos" aria-labelledby="titre-apropos"><div class="conteneur" style="max-width:48rem">'
               f'{tete_section(T["sur_apropos"], fiche.get("titre_apropos", T["titre_apropos"]), ident="titre-apropos")}<p>{e(fiche["description"])}</p></div></section>')
    reserver = (f'<section class="section reserver" aria-labelledby="titre-reserver"><div class="conteneur"><h2 id="titre-reserver">{e(T["titre_reserver"])}</h2>'
                f'<p>{e(T["texte_reserver"])}</p><div class="actions"><a class="btn" href="{e(resa)}"{cible}>{e(T["cta_resa"])}</a>'
                + (f'<a class="btn btn--ligne" href="tel:{e(tel)}">{ICO_TEL} {e(fiche["telephone"])}</a>' if tel else "") + "</div></div></section>")
    sec_spe = section_specialites(fiche, imgs)
    corps = (accueil + bandeau_defilant(fiche) + bande + sec_spe + tarifs + sec_gal + section_avis(fiche) + apropos
             + section_infos(fiche, T["infos"], "gris") + section_faq(fiche) + reserver)
    menu = [(a, t) for a, t, ok in [("specialites", "Spécialités", sec_spe), ("tarifs", T["menu_tarifs"], True), ("galerie", T["menu_gal"], sec_gal),
                                     ("avis", "Avis", "id=\"avis\"" in corps), ("infos", T["menu_infos"], True)] if ok]
    entete = f'<a class="btn" href="{e(resa)}"{cible}>{e(T["entete"])}</a>'
    barre = (f'<a class="btn btn--ligne" href="tel:{e(tel)}">{ICO_TEL} Appeler</a>' if tel else "") + f'<a class="btn" href="{e(resa)}"{cible}>{e(T["entete"])}</a>'
    return corps, menu, entete, barre, ""


# ---------------------------------------------------------------- COMMANDE (métiers de bouche)
def corps_commande(fiche: dict, imgs: dict):
    h = (fiche.get("images") or {}).get("hero")
    actions = '<a class="btn" href="#carte">Voir la carte et commander</a>'
    if (fiche.get("reseaux") or {}).get("instagram"):
        actions += f'<a class="btn btn--ligne" href="{e(fiche["reseaux"]["instagram"])}" rel="noopener" target="_blank">Instagram</a>'
    accueil = (f'<section class="accueil" aria-labelledby="titre-accueil"><div class="conteneur"><div>'
               f'<span class="surtitre">{e(fiche["metier"])}, {e(fiche["ville"])}</span>'
               f'<h1 id="titre-accueil">{e(fiche.get("titre") or fiche["accroche"])}</h1><p class="chapo">{e(fiche["accroche"] if fiche.get("titre") else fiche["description"])}</p>'
               f'<div class="actions">{actions}</div>{ligne_note(fiche)}<p style="margin-top:1rem">{statut_ouverture(fiche)}</p></div>'
               + (f'<div class="photo-accueil">{img_tag(imgs, h, fiche["nom"] + " : une création de la maison", False, 1000, 800)}</div>' if h else "")
               + "</div></section>")
    pratique = [("Délai", fiche.get("delai_commande", "")), ("Retrait et livraison", fiche.get("mode_retrait", "")), ("Paiement", fiche.get("paiement", "Au retrait ou à la livraison. Aucun paiement en ligne."))]
    bande = ('<div class="pratique"><div class="conteneur"><dl>' + "".join(f"<div><dt>{e(t)}</dt><dd>{e(v)}</dd></div>" for t, v in pratique if v)
             + "</dl></div></div>")
    categories: dict[str, list] = {}
    for p in fiche["produits"]:
        categories.setdefault(p.get("categorie", "La carte"), []).append(p)
    onglets = ('<ul class="categories" aria-label="Catégories">' + "".join(f'<li><a href="#cat-{k}">{e(c)}</a></li>' for k, c in enumerate(categories)) + "</ul>") if len(categories) > 1 else ""
    blocs = []
    for k, (cat, prods) in enumerate(categories.items()):
        items = []
        for p in prods:
            visuel = (f'<div class="visuel">{img_tag(imgs, p["image"], p["nom"], True, 800, 600, "(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw")}'
                      + (f'<span class="badge">{e(p["badge"])}</span>' if p.get("badge") else "") + "</div>") if p.get("image") else ""
            opts = "".join(f"<option>{e(o)}</option>" for o in p.get("options") or [])
            select = f'<label class="cache" for="opt-{k}-{len(items)}">Format pour {e(p["nom"])}</label><select id="opt-{k}-{len(items)}">{opts}</select>' if opts else ""
            items.append(f'<article class="produit" data-produit data-nom="{e(p["nom"])}" data-prix="{float(p["prix"]):.2f}">{visuel}'
                         f'<h4>{e(p["nom"])}</h4><p>{e(p.get("desc", ""))}</p>{select}'
                         f'<div class="ligne"><span class="prix">{euros(float(p["prix"]))}</span>'
                         f'<button class="btn btn-ajout" type="button" aria-label="Ajouter {e(p["nom"])} au panier">Ajouter</button></div></article>')
        blocs.append(f'<h3 class="cat" id="cat-{k}">{e(cat)}</h3><div class="produits">{"".join(items)}</div>')
    precisions = [x for x in [fiche.get("allergenes", "")] if x]
    carte = (f'<section class="section" id="carte" aria-labelledby="titre-carte"><div class="conteneur">'
             f'{tete_section("La carte", fiche.get("titre_carte", "Choisissez, nous préparons"), "Ajoutez vos produits au panier : la commande part sur WhatsApp, déjà rédigée.", ident="titre-carte")}'
             + onglets + "".join(blocs)
             + (f'<ul class="precisions">' + "".join(f"<li>{e(x)}</li>" for x in precisions) + "</ul>" if precisions else "") + "</div></section>")
    etapes = fiche.get("etapes") or [{"titre": t, "texte": x} for t, x in ETAPES_DEFAUT["commande-whatsapp"]]
    sec_etapes = (f'<section class="section gris" id="commander" aria-labelledby="titre-commander"><div class="conteneur">'
                  f'{tete_section("Commander", "Comment ça marche", ident="titre-commander")}<ol class="etapes">'
                  + "".join(f'<li><h3>{e(s["titre"])}</h3><p>{e(s["texte"])}</p></li>' for s in etapes) + "</ol></div></section>")
    histoire = (f'<section class="section gris" id="histoire" aria-labelledby="titre-histoire"><div class="conteneur" style="max-width:48rem">'
                f'{tete_section("La maison", fiche.get("titre_apropos", "Fait maison, chaque jour"), ident="titre-histoire")}<p>{e(fiche["description"])}</p></div></section>')
    corps = accueil + bandeau_defilant(fiche) + bande + carte + sec_etapes + section_avis(fiche) + histoire + section_infos(fiche, "Retrait et livraison") + section_faq(fiche, "gris")
    menu = [(a, t) for a, t, ok in [("carte", "La carte", True), ("avis", "Avis", "id=\"avis\"" in corps), ("infos", "Infos pratiques", True), ("faq", "Questions", "id=\"faq\"" in corps)] if ok]
    entete = '<a class="btn" href="#carte">Commander</a>'
    barre = f'<button class="btn btn--wa" id="ouvrirPanier" type="button" disabled>{ICO_PANIER} <span id="panierResume">Panier vide</span></button>'
    modes = fiche.get("modes") or ["Retrait"]
    panier = f"""<button class="btn btn--wa panier-bouton" id="ouvrirPanier2" type="button" disabled>{ICO_PANIER} <span id="panierResume2">Panier vide</span></button>
<div class="panier" id="panier"><div class="fond" data-fermer></div><div class="tiroir" role="dialog" aria-modal="true" aria-labelledby="titre-panier">
<header><h2 id="titre-panier">Votre commande</h2><button class="fermer" type="button" data-fermer aria-label="Fermer le panier">×</button></header>
<ul class="lignes" id="lignes"></ul>
<div class="pied-panier"><p class="total"><span>Total</span><span id="total">0 €</span></p>
<div class="champ"><label for="c-nom">Votre prénom</label><input id="c-nom" autocomplete="given-name"></div>
<div class="champ"><label for="c-mode">Retrait ou livraison</label><select id="c-mode">{"".join(f"<option>{e(m)}</option>" for m in modes)}</select></div>
<div class="champ"><label for="c-date">Pour quand ?</label><input id="c-date" placeholder="Samedi 14h"></div>
<a class="btn btn--wa" id="envoyer" href="#" target="_blank" rel="noopener">Envoyer la commande sur WhatsApp</a>
<p class="petit">Aucun paiement en ligne : la commande est confirmée par message, puis réglée selon les modalités convenues.</p></div>
</div></div>"""
    script = """<script>(function(){
  var WA = %s, NOM = %s, panier = [], dernierFocus = null;
  function eur(n){ return n.toFixed(2).replace('.', ',').replace(',00', '') + ' €'; }
  function total(){ return panier.reduce(function(s, i){ return s + i.prix * i.qte; }, 0); }
  function message(){
    var l = ['Bonjour ' + NOM + ', je souhaite commander :'];
    panier.forEach(function(i){ l.push('- ' + i.qte + ' × ' + i.nom + (i.option ? ' (' + i.option + ')' : '') + ' — ' + eur(i.prix * i.qte)); });
    l.push('Total : ' + eur(total()));
    var n = document.getElementById('c-nom').value.trim(), m = document.getElementById('c-mode').value, d = document.getElementById('c-date').value.trim();
    l.push('Mode : ' + m + (d ? ' — ' + d : '')); if (n) l.push('Prénom : ' + n);
    l.push('Merci de me confirmer la disponibilité.');
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(l.join('\\n'));
  }
  function rendre(){
    var ul = document.getElementById('lignes'); ul.textContent = '';
    panier.forEach(function(it, i){
      var li = document.createElement('li'), t = document.createElement('span'), q = document.createElement('span');
      t.textContent = it.nom + (it.option ? ' (' + it.option + ')' : '') + ' — ' + eur(it.prix * it.qte); q.className = 'qte';
      [['−', -1], ['+', 1]].forEach(function(b, j){
        var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = b[0];
        bt.setAttribute('aria-label', (b[1] > 0 ? 'Ajouter un ' : 'Retirer un ') + it.nom);
        bt.onclick = function(){ it.qte += b[1]; if (it.qte <= 0) panier.splice(i, 1); rendre(); };
        q.appendChild(bt); if (j === 0){ var s = document.createElement('strong'); s.textContent = it.qte; q.appendChild(s); }
      });
      li.appendChild(t); li.appendChild(q); ul.appendChild(li);
    });
    var nb = panier.reduce(function(s, i){ return s + i.qte; }, 0), txt = nb ? nb + ' article' + (nb > 1 ? 's' : '') + ' · ' + eur(total()) : 'Panier vide';
    ['panierResume', 'panierResume2'].forEach(function(id){ document.getElementById(id).textContent = txt; });
    ['ouvrirPanier', 'ouvrirPanier2'].forEach(function(id){ document.getElementById(id).disabled = !nb; });
    document.getElementById('total').textContent = eur(total());
    var env = document.getElementById('envoyer');
    if (!nb){ fermer(); env.href = '#'; } else { env.href = message(); }
  }
  function ouvrir(){ dernierFocus = document.activeElement; document.getElementById('panier').classList.add('ouvert'); document.querySelector('.tiroir .fermer').focus(); }
  function fermer(){ var p = document.getElementById('panier'); if (!p.classList.contains('ouvert')) return; p.classList.remove('ouvert'); if (dernierFocus) dernierFocus.focus(); }
  ['ouvrirPanier', 'ouvrirPanier2'].forEach(function(id){ document.getElementById(id).onclick = ouvrir; });
  document.querySelectorAll('[data-fermer]').forEach(function(b){ b.onclick = fermer; });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') fermer(); });
  ['c-nom', 'c-mode', 'c-date'].forEach(function(id){ document.getElementById(id).addEventListener('input', function(){ if (panier.length) document.getElementById('envoyer').href = message(); }); });
  document.querySelectorAll('[data-produit]').forEach(function(c){
    c.querySelector('.btn-ajout').addEventListener('click', function(){
      var s = c.querySelector('select'), o = s ? s.value : '', nom = c.getAttribute('data-nom'), prix = parseFloat(c.getAttribute('data-prix'));
      var f = panier.find(function(i){ return i.nom === nom && i.option === o; });
      if (f) f.qte++; else panier.push({nom: nom, option: o, prix: prix, qte: 1});
      rendre(); var b = this; b.textContent = 'Ajouté'; setTimeout(function(){ b.textContent = 'Ajouter'; }, 1200);
    });
  });
  rendre();
})();</script>""" % (json_sur(fiche["whatsapp"]), json_sur(fiche["nom"]))
    return corps, menu, entete, barre, panier + script




CONSTRUCTEURS = {"artisan": corps_artisan, "beaute": corps_beaute, "restaurant": corps_beaute, "commande-whatsapp": corps_commande}


def page_mentions(fiche: dict) -> str:
    def v(cle):
        val = str(fiche.get(cle, "")).strip()
        return e(val) if val else A_COMPLETER

    pays = PAYS[fiche.get("pays", "FR")]
    identifiant = str(fiche.get("numero_entreprise") or fiche.get("siret") or "").strip()
    identifiant = e(identifiant) if identifiant else A_COMPLETER
    credits = ""
    imgs_f = fiche.get("images") or {}
    attributions = [x["credit"] for x in [imgs_f.get("apropos") or {}] + list(imgs_f.get("galerie") or []) if x.get("credit")]
    tous = chemins_images(fiche)
    if any(est_ia(x) for x in tous) and not (fiche.get("demo") or fiche.get("maquette") or fiche.get("_apercu")):
        attributions.append("Certaines images d'illustration de ce site ont été générées par intelligence artificielle")
    if fiche.get("demo") or attributions:
        credits = ("<h2>Crédits photos</h2><p>" + ("Photos d'illustration non contractuelles. " if fiche.get("demo") else "")
                   + " ".join(e(a) + "." for a in attributions) + "</p>")
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
    if not apercu and not fiche.get("demo"):
        im = fiche.get("images") or {}
        interdites = [x for x in [g.get("src", "") for g in im.get("galerie") or []] + [(im.get("apropos") or {}).get("src", "")]
                      + [p.get("image", "") for p in fiche.get("produits") or []] + [p.get("image", "") for p in fiche.get("specialites") or []]
                      + [v for p in fiche.get("avant_apres") or [] for v in (p.get("avant", ""), p.get("apres", ""))] if x and est_ia(x)]
        if interdites:
            raise FicheInvalide("Images générées par IA utilisées comme réalisations, produits ou photo d'équipe : " + ", ".join(interdites)
                                + ". Sur un site final, une image IA ne peut servir que d'illustration d'accueil ; le reste doit être de vraies photos du client.")
    if fiche.get("maquette") and not apercu and not fiche.get("demo"):
        raise FicheInvalide("Cette fiche est une maquette : avis, prix et horaires sont des exemples. Remplacez-les par les vraies "
                            "informations du client et retirez « maquette » avant de générer la version finale.")
    dossier = sortie / (fiche["slug"] + ("-apercu" if apercu else ""))
    dossier.mkdir(parents=True, exist_ok=True)
    if (dossier / "img").is_dir():  # dossier entièrement généré : on repart de zéro pour ne pas garder d'anciennes photos
        shutil.rmtree(dossier / "img")
    imgs = {}
    for chemin in chemins_images(fiche):
        if re.match(r"https?://", chemin):
            imgs[chemin] = chemin
            continue
        source = base / chemin
        (dossier / "img").mkdir(exist_ok=True)
        optimisee = optimiser_image(source, dossier / "img")
        if optimisee:
            imgs[chemin], imgs[chemin + "|srcset"] = optimisee
        else:
            shutil.copyfile(source, dossier / "img" / source.name)
            imgs[chemin] = "img/" + source.name
            if not any("Pillow" in a for a in avertissements):
                avertissements.append("Photos copiées sans optimisation : installez Pillow (pip install Pillow) pour des images WebP légères.")
    if fiche.get("demo") and avertissements:
        avertissements = [a for a in avertissements if not a.startswith("Mentions légales")]
    (dossier / "polices").mkdir(exist_ok=True)
    police = THEMES[fiche["modele"]][1]
    shutil.copyfile(MODELES / "polices" / police, dossier / "polices" / police)
    imgs["|final"] = not apercu and not fiche.get("demo") and not fiche.get("maquette")
    if apercu:
        fiche = {**fiche, "_apercu": True}  # formulaire désactivé : l'aperçu n'est pas en ligne
    corps, menu, entete, barre, scripts = CONSTRUCTEURS[fiche["modele"]](fiche, imgs)
    (dossier / "index.html").write_text(page(fiche, apercu, corps, menu, entete, barre, scripts, imgs), encoding="utf-8")
    (dossier / "mentions-legales.html").write_text(page_mentions(fiche), encoding="utf-8")
    (dossier / "merci.html").write_text(page_merci(fiche), encoding="utf-8")
    if apercu:
        (dossier / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
    elif fiche.get("domaine") and not fiche.get("demo"):
        url = fiche["domaine"].rstrip("/")
        (dossier / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {url}/sitemap.xml\n", encoding="utf-8")
        (dossier / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
                                             f"<url><loc>{e(url)}/</loc><lastmod>{_dt.date.today().isoformat()}</lastmod></url></urlset>\n", encoding="utf-8")
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
