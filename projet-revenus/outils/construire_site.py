#!/usr/bin/env python3
"""Assemble le site de l'agence Mysite (dossier site/) à partir de site-src/ et de site-src/infos.json.

Usage :
    python outils/construire_site.py            # construit, signale les informations manquantes
    python outils/construire_site.py --strict   # refuse de construire s'il manque une information légale (avant publication)

Ce que fait le script :
  - insère l'en-tête et le pied de page communs (site-src/partiels/) ;
  - remplace {{variables}} par les informations de infos.json (échappées pour le HTML) ;
  - garde ou retire les blocs <!--si:cle--> ... <!--/si--> selon que l'information existe ;
  - affiche [À COMPLÉTER : …] dans les pages légales pour toute information manquante ;
  - copie les ressources (assets/), écrit robots.txt, sitemap.xml (si le domaine est connu) et _headers (en-têtes de sécurité Netlify).
Les sites de démonstration (site/exemples/) ne sont pas touchés : ils sont produits par outils/generer_site.py.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import shutil
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
SOURCE = RACINE / "site-src"
SORTIE = RACINE / "site"
PAGES = ["index.html", "mentions-legales.html", "confidentialite.html", "merci.html", "404.html"]
PAGES_PUBLIQUES = ["index.html", "mentions-legales.html", "confidentialite.html"]
LEGAL = {"nom": "votre prénom et NOM", "siret": "votre numéro SIRET", "adresse": "votre adresse professionnelle",
         "email": "votre email professionnel", "responsable": "le nom du responsable de la publication",
         "hebergeur": "nom, adresse et téléphone de l'hébergeur (page légale officielle de l'hébergeur)",
         "garanties_transfert": "garanties de l'hébergeur pour le transfert hors UE (à lire dans sa politique de confidentialité)"}

EN_TETES = """/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; form-action 'self' https://wa.me https://api.whatsapp.com; frame-ancestors 'none'; base-uri 'self'
/assets/*
  Cache-Control: public, max-age=604800
"""


def charger_infos() -> dict:
    infos = json.loads((SOURCE / "infos.json").read_text(encoding="utf-8"))
    return {k: str(v).strip() for k, v in infos.items() if not k.startswith("_")}


def contexte(infos: dict) -> dict:
    e = lambda v: html.escape(v, quote=True)
    ctx = {k: e(v) for k, v in infos.items()}
    ctx["domaine"] = e(infos.get("domaine", "").rstrip("/"))
    ctx["telephone_lien"] = re.sub(r"[^0-9+]", "", infos.get("telephone", ""))
    ctx["annee"] = str(dt.date.today().year)
    for cle, libelle in LEGAL.items():
        ctx[cle + "_ou_vide"] = e(infos[cle]) if infos.get(cle) else f'<span class="a-completer">[À COMPLÉTER : {e(libelle)}]</span>'
    ctx["hebergeur_court"] = e(infos.get("hebergeur_court") or "l'hébergeur")
    jsonld = {"@context": "https://schema.org", "@type": "ProfessionalService", "name": "Mysite",
              "description": "Création de sites internet à prix fixe pour artisans, commerçants et indépendants.",
              "areaServed": ["France", "Belgique", "Suisse"], "priceRange": "290 € - 490 €"}
    if infos.get("domaine"):
        jsonld["url"] = infos["domaine"].rstrip("/") + "/"
    if infos.get("email"):
        jsonld["email"] = infos["email"]
    if infos.get("telephone"):
        jsonld["telephone"] = infos["telephone"]
    ctx["jsonld"] = json.dumps(jsonld, ensure_ascii=False).replace("<", "\\u003c")
    return ctx


def drapeaux(infos: dict) -> dict:
    d = {k: bool(v) for k, v in infos.items()}
    d["contact_direct"] = bool(infos.get("email") or infos.get("telephone"))
    d["manquant"] = any(not infos.get(k) for k in LEGAL)
    return d


def assembler(gabarit: str, ctx: dict, flags: dict, racine: str) -> str:
    for nom in ("entete", "pied"):
        gabarit = gabarit.replace(f"<!--inclure:{nom}-->", (SOURCE / "partiels" / f"{nom}.html").read_text(encoding="utf-8").rstrip("\n"))
    # Blocs conditionnels : on traite toujours le bloc le plus intérieur d'abord (aucun <!--si: à l'intérieur)
    interieur = re.compile(r"<!--si:([a-z_]+)-->((?:(?!<!--si:).)*?)<!--/si-->", re.S)
    while True:
        nouveau = interieur.sub(lambda m: m.group(2) if flags.get(m.group(1)) else "", gabarit)
        if nouveau == gabarit:
            break
        gabarit = nouveau
    ctx = dict(ctx, racine=racine)

    def remplacer(m):
        cle = m.group(1)
        if cle not in ctx:
            raise KeyError(f"Variable inconnue dans un gabarit : {cle}")
        return ctx[cle]

    page = re.sub(r"\{\{([a-z_]+)\}\}", remplacer, gabarit)
    if "{{" in page or "<!--si:" in page or "<!--inclure:" in page:
        raise ValueError("Gabarit mal formé : marqueur non traité")
    return page


def construire(strict: bool = False, sortie: Path = SORTIE) -> list[str]:
    infos = charger_infos()
    manquants = [f"{k} ({LEGAL[k]})" for k in LEGAL if not infos.get(k)]
    if strict and manquants:
        raise SystemExit("Construction refusée (--strict) : il manque " + ", ".join(manquants))
    ctx, flags = contexte(infos), drapeaux(infos)
    sortie.mkdir(parents=True, exist_ok=True)
    for nom in PAGES:
        gabarit = (SOURCE / nom).read_text(encoding="utf-8")
        racine = ""
        if nom == "404.html":  # servie à n'importe quelle adresse : chemins absolus
            racine = "/"
            gabarit = gabarit.replace('href="assets/', 'href="/assets/').replace('src="assets/', 'src="/assets/')
        (sortie / nom).write_text(assembler(gabarit, ctx, flags, racine), encoding="utf-8")
    if (sortie / "assets").exists():
        shutil.rmtree(sortie / "assets")
    shutil.copytree(SOURCE / "assets", sortie / "assets")
    domaine = infos.get("domaine", "").rstrip("/")
    robots = "User-agent: *\nAllow: /\n"
    if domaine:
        robots += f"Sitemap: {domaine}/sitemap.xml\n"
        urls = "".join(f"  <url><loc>{html.escape(domaine)}/{'' if p == 'index.html' else p}</loc></url>\n" for p in PAGES_PUBLIQUES)
        (sortie / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "</urlset>\n", encoding="utf-8")
    elif (sortie / "sitemap.xml").exists():
        (sortie / "sitemap.xml").unlink()
    (sortie / "robots.txt").write_text(robots, encoding="utf-8")
    (sortie / "_headers").write_text(EN_TETES, encoding="utf-8")
    return manquants


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--strict", action="store_true")
    a = ap.parse_args(argv)
    manquants = construire(a.strict)
    print(f"Site construit dans {SORTIE}")
    if manquants:
        print("À compléter dans site-src/infos.json avant publication :")
        for m in manquants:
            print(f"  - {m}")
    if not charger_infos().get("domaine"):
        print("Note : domaine inconnu, sitemap.xml non généré (ajoutez « domaine » après la mise en ligne).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
