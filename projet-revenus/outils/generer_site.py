#!/usr/bin/env python3
"""Génère un site client (ou un aperçu pour un prospect) à partir d'une fiche JSON.

Usage :
    python outils/generer_site.py chemin/vers/fiche.json [--apercu] [--sortie dossier]

- --apercu : ajoute un bandeau « aperçu non contractuel » et interdit l'indexation
  par les moteurs de recherche (à utiliser pour montrer une proposition à un prospect).
- Sans --apercu : version finale, à n'utiliser qu'avec l'accord du client.

Aucune dépendance : bibliothèque standard Python uniquement.
Voir modeles-sites/fiche-exemple-artisan.json pour le format de la fiche.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import html
import json
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
MODELES = RACINE / "modeles-sites"
MODELES_DISPONIBLES = ("artisan", "commande-whatsapp")
A_COMPLETER = "[À COMPLÉTER]"

# Particularités par pays (mentions légales). Voir MARCHES.md.
PAYS = {
    "FR": {"nom": "France", "id_label": "SIRET", "autorite": "la CNIL (www.cnil.fr)"},
    "BE": {"nom": "Belgique", "id_label": "Numéro d'entreprise (BCE)", "autorite": "l'Autorité de protection des données (www.autoriteprotectiondonnees.be)"},
    "CH": {"nom": "Suisse", "id_label": "Numéro IDE (CHE-…)", "autorite": "le Préposé fédéral à la protection des données et à la transparence (www.edoeb.admin.ch)"},
}

CHAMPS_OBLIGATOIRES = ("modele", "slug", "nom", "metier", "ville", "accroche", "description", "telephone")


class FicheInvalide(ValueError):
    """Erreur de contenu dans la fiche JSON."""


def e(valeur) -> str:
    """Échappe une valeur pour l'insérer dans du HTML."""
    return html.escape(str(valeur), quote=True)


def json_sur(valeur) -> str:
    """JSON insérable sans risque dans une balise <script>."""
    return (
        json.dumps(valeur, ensure_ascii=False)
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("&", "\\u0026")
    )


def chiffres(tel: str) -> str:
    return re.sub(r"[^0-9+]", "", tel or "")


def valider(fiche: dict) -> list[str]:
    """Retourne la liste des avertissements (non bloquants). Lève FicheInvalide si bloquant."""
    manquants = [c for c in CHAMPS_OBLIGATOIRES if not str(fiche.get(c, "")).strip()]
    if manquants:
        raise FicheInvalide("Champs obligatoires manquants : " + ", ".join(manquants))
    if fiche["modele"] not in MODELES_DISPONIBLES:
        raise FicheInvalide(f"Modèle inconnu « {fiche['modele']} ». Choix : {', '.join(MODELES_DISPONIBLES)}")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", fiche["slug"]):
        raise FicheInvalide("Le slug doit contenir uniquement des minuscules, chiffres et tirets (ex. plomberie-martin)")
    if fiche.get("pays", "FR") not in PAYS:
        raise FicheInvalide(f"Pays inconnu « {fiche.get('pays')} ». Choix : {', '.join(PAYS)}")
    couleur = fiche.get("couleur", "#1f5fbf")
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", couleur):
        raise FicheInvalide("La couleur doit être au format #RRGGBB")
    wa = fiche.get("whatsapp", "")
    if wa and not re.fullmatch(r"[1-9][0-9]{7,14}", wa):
        raise FicheInvalide("Le numéro WhatsApp doit être au format international sans + ni espaces (ex. 33612345678)")
    if fiche["modele"] == "commande-whatsapp":
        if not wa:
            raise FicheInvalide("Le modèle commande-whatsapp exige un numéro « whatsapp »")
        produits = fiche.get("produits") or []
        if not produits:
            raise FicheInvalide("Le modèle commande-whatsapp exige au moins un produit")
        for p in produits:
            if not p.get("nom") or not isinstance(p.get("prix"), (int, float)) or p["prix"] < 0:
                raise FicheInvalide(f"Produit invalide : {p!r} (nom et prix positif obligatoires)")

    avertissements = []
    for champ in ("numero_entreprise", "statut_juridique", "adresse_editeur", "responsable_publication", "hebergeur"):
        valeur = fiche.get(champ) or (fiche.get("siret") if champ == "numero_entreprise" else "")
        if not str(valeur or "").strip():
            avertissements.append(f"Mentions légales : « {champ} » manquant (affiché {A_COMPLETER}).")
    if not fiche.get("services") and fiche["modele"] == "artisan":
        avertissements.append("Aucun service renseigné.")
    return avertissements


def _commun(fiche: dict, apercu: bool) -> dict:
    tel = fiche["telephone"]
    wa = fiche.get("whatsapp", "")
    annee = str(_dt.date.today().year)
    meta = fiche.get("meta_description") or f"{fiche['nom']}, {fiche['metier'].lower()} à {fiche['ville']}. {fiche['accroche']}"
    jsonld = {
        "@context": "https://schema.org",
        "@type": fiche.get("type_schema", "LocalBusiness"),
        "name": fiche["nom"],
        "description": fiche["description"],
        "telephone": tel,
        "areaServed": fiche.get("zone", fiche["ville"]),
        "address": {"@type": "PostalAddress", "addressLocality": fiche["ville"], "addressCountry": fiche.get("pays", "FR")},
    }
    if fiche.get("email"):
        jsonld["email"] = fiche["email"]
    ctx = {
        "nom": e(fiche["nom"]),
        "metier": e(fiche["metier"]),
        "ville": e(fiche["ville"]),
        "accroche": e(fiche["accroche"]),
        "description": e(fiche["description"]),
        "zone": e(fiche.get("zone", fiche["ville"])),
        "telephone": e(tel),
        "telephone_lien": e(chiffres(tel)),
        "couleur": fiche.get("couleur", "#1f5fbf"),
        "annee": annee,
        "meta_description": e(meta[:300]),
        "jsonld_raw": json_sur(jsonld),
        "robots_html": '<meta name="robots" content="noindex, nofollow">' if apercu else "",
        "apercu_html": (
            '<div class="apercu">Aperçu de proposition réalisé pour '
            + e(fiche["nom"])
            + " — non publié, non contractuel. Textes et visuels à valider ensemble.</div>"
        ) if apercu else "",
        "email_html": f'<p><strong>Email :</strong> <a href="mailto:{e(fiche["email"])}">{e(fiche["email"])}</a></p>' if fiche.get("email") else "",
        "email_br_html": f'<br><a href="mailto:{e(fiche["email"])}">{e(fiche["email"])}</a>' if fiche.get("email") else "",
        "adresse_html": f'<p><strong>Adresse :</strong> {e(fiche["adresse"])}</p>' if fiche.get("adresse") else "",
        "whatsapp_json": json_sur(wa),
        "nom_json": json_sur(fiche["nom"]),
    }
    wa_lien = f"https://wa.me/{wa}?text=" + _url_quote(f"Bonjour {fiche['nom']}, je souhaite un devis pour : ") if wa else ""
    ctx["whatsapp_bouton_html"] = f'<a class="btn btn-wa" href="{e(wa_lien)}" target="_blank" rel="noopener">WhatsApp</a>' if wa else ""
    ctx["whatsapp_bar_html"] = f'<a class="btn btn-wa" href="{e(wa_lien)}" target="_blank" rel="noopener">WhatsApp</a>' if wa else '<a class="btn btn-ghost" href="#contact">Devis</a>'
    if fiche.get("demo"):
        ctx["form_attrs_html"] = 'name="demo" onsubmit="alert(\'Site de démonstration : formulaire désactivé.\');return false;"'
    else:
        ctx["form_attrs_html"] = 'name="contact" method="POST" action="/merci" data-netlify="true" netlify-honeypot="site_web"'
    horaires = fiche.get("horaires") or []
    ctx["horaires_html"] = "".join(f"<tr><td>{e(j)}</td><td>{e(h)}</td></tr>" for j, h in horaires) or f"<tr><td>Sur rendez-vous</td><td>{e(tel)}</td></tr>"
    ctx["horaires_texte_html"] = "<br>".join(f"{e(j)} : {e(h)}" for j, h in horaires) or "Sur commande"
    return ctx


def _url_quote(texte: str) -> str:
    from urllib.parse import quote
    return quote(texte, safe="")


def contexte_artisan(fiche: dict, apercu: bool) -> dict:
    ctx = _commun(fiche, apercu)
    ctx["services_html"] = "".join(
        f'<div class="card"><h3>{e(s.get("titre", ""))}</h3><p>{e(s.get("texte", ""))}</p></div>'
        for s in fiche.get("services") or []
    )
    ctx["atouts_html"] = "".join(f"<li>{e(a)}</li>" for a in fiche.get("atouts") or [])
    return ctx


def contexte_whatsapp(fiche: dict, apercu: bool) -> dict:
    ctx = _commun(fiche, apercu)
    cartes = []
    for p in fiche["produits"]:
        prix = float(p["prix"])
        options = p.get("options") or []
        select = ""
        if options:
            opts = "".join(f"<option>{e(o)}</option>" for o in options)
            select = f'<select aria-label="Option pour {e(p["nom"])}">{opts}</select>'
        cartes.append(
            f'<div class="card" data-produit data-nom="{e(p["nom"])}" data-prix="{prix:.2f}">'
            f'<h3>{e(p["nom"])}</h3><p>{e(p.get("desc", ""))}</p>{select}'
            f'<div class="row"><span class="price">{_euros(prix)}</span>'
            f'<button class="btn btn-add" type="button">Ajouter</button></div></div>'
        )
    ctx["produits_html"] = "".join(cartes)
    return ctx


def _euros(montant: float) -> str:
    return f"{montant:.2f}".replace(".", ",") + " €"


def remplir(gabarit: str, ctx: dict) -> str:
    def remplacer(m: re.Match) -> str:
        cle = m.group(1)
        if cle not in ctx:
            raise KeyError(f"Variable de modèle non fournie : {cle}")
        return str(ctx[cle])

    resultat = re.sub(r"\{\{\s*([a-z_]+)\s*\}\}", remplacer, gabarit)
    if "{{" in resultat:
        raise ValueError("Des variables {{...}} n'ont pas été remplacées")
    return resultat


def page_mentions(fiche: dict) -> str:
    def v(cle):
        val = str(fiche.get(cle, "")).strip()
        return e(val) if val else A_COMPLETER

    pays = PAYS[fiche.get("pays", "FR")]
    identifiant = str(fiche.get("numero_entreprise") or fiche.get("siret") or "").strip()
    identifiant = e(identifiant) if identifiant else A_COMPLETER

    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mentions légales — {e(fiche['nom'])}</title>
<style>body{{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;max-width:760px;margin:0 auto;padding:32px 20px;line-height:1.6;color:#16181d}}h1{{font-size:26px}}h2{{font-size:18px;margin-top:28px}}</style>
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
<h2>Propriété intellectuelle</h2>
<p>Les textes et images de ce site appartiennent à {e(fiche['nom'])} ou sont utilisés avec autorisation.</p>
</body></html>
"""


def page_merci(fiche: dict) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Merci — {e(fiche['nom'])}</title><meta name="robots" content="noindex">
<style>body{{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;max-width:640px;margin:0 auto;padding:64px 20px;text-align:center;color:#16181d}}</style>
</head><body><h1>Merci, votre demande est envoyée.</h1><p>{e(fiche['nom'])} vous recontacte rapidement. Urgent ? Appelez le <a href="tel:{e(chiffres(fiche['telephone']))}">{e(fiche['telephone'])}</a>.</p><p><a href="index.html">Retour au site</a></p></body></html>
"""


def generer(fiche: dict, sortie: Path, apercu: bool = False) -> tuple[Path, list[str]]:
    avertissements = valider(fiche)
    gabarit = (MODELES / fiche["modele"] / "index.html").read_text(encoding="utf-8")
    ctx = contexte_artisan(fiche, apercu) if fiche["modele"] == "artisan" else contexte_whatsapp(fiche, apercu)
    dossier = sortie / (fiche["slug"] + ("-apercu" if apercu else ""))
    dossier.mkdir(parents=True, exist_ok=True)
    (dossier / "index.html").write_text(remplir(gabarit, ctx), encoding="utf-8")
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
        dossier, avertissements = generer(fiche, args.sortie, args.apercu)
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
