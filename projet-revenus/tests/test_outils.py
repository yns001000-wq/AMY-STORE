"""Tests automatisés des outils. Lancer depuis projet-revenus/ :
    python -m unittest discover -s tests -v
Aucun accès réseau : l'API est simulée.
"""
import csv
import datetime as dt
import json
import sys
import tempfile
import unittest
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RACINE / "outils"))

import crm  # noqa: E402
import generer_site  # noqa: E402
import prospects_osm  # noqa: E402
import rapport  # noqa: E402
import trouver_prospects  # noqa: E402
import preparer_apercus  # noqa: E402
import exporter_cockpit  # noqa: E402
import construire_site  # noqa: E402


def charger(fichier, /, **surcharges):
    f = json.loads((RACINE / "modeles-sites" / f"fiche-exemple-{fichier}.json").read_text(encoding="utf-8"))
    f.update(surcharges)
    return f


def fiche_artisan(**surcharges):
    return charger("artisan", **surcharges)


class TestGenerateur(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())

    def lire(self, dossier, nom="index.html"):
        return (dossier / nom).read_text(encoding="utf-8")

    def test_trois_modeles_complets(self):
        for nom in ("artisan", "commande", "beaute"):
            dossier, _ = generer_site.generer(charger(nom), self.tmp)
            page = self.lire(dossier)
            self.assertNotIn("{{", page)
            self.assertTrue((dossier / "img").is_dir(), nom)
            for f in ("mentions-legales.html", "merci.html"):
                self.assertTrue((dossier / f).exists())
            # toutes les images référencées existent
            for src in __import__("re").findall(r'(?:src="|url\(\x27)(img/[^"\x27]+)', page):
                self.assertTrue((dossier / src).is_file(), src)

    def test_artisan_contenu(self):
        dossier, _ = generer_site.generer(fiche_artisan(), self.tmp)
        page = self.lire(dossier)
        self.assertIn("Votre plombier à Villeurbanne", page)
        self.assertIn('href="tel:0600000000"', page)
        self.assertIn("À partir de 90 €", page)
        self.assertIn("data-ouverture", page)
        self.assertIn("Site de démonstration", page)

    def test_avis_demo_signales_et_non_declares_aux_moteurs(self):
        dossier, _ = generer_site.generer(fiche_artisan(), self.tmp)
        page = self.lire(dossier)
        self.assertIn("avis d'exemple", page)
        self.assertNotIn("aggregateRating", page)  # pas de note structurée pour une démo
        reel = fiche_artisan(demo=False)
        dossier, _ = generer_site.generer(reel, self.tmp / "reel")
        page = self.lire(dossier)
        self.assertNotIn("avis d'exemple", page)
        self.assertIn("aggregateRating", page)
        self.assertIn('data-netlify="true"', page)

    def test_sections_facultatives_absentes(self):
        f = fiche_artisan()
        for cle in ("avis", "faq", "images", "atouts"):
            f.pop(cle)
        dossier, avert = generer_site.generer(f, self.tmp)
        page = self.lire(dossier)
        self.assertNotIn('id="avis"', page)
        self.assertNotIn('id="faq"', page)
        self.assertNotIn('class="galerie"', page)
        self.assertTrue(any("photo principale" in a for a in avert))

    def test_echappement_html(self):
        dossier, _ = generer_site.generer(fiche_artisan(nom='<script>alert(1)</script>', demo=False), self.tmp)
        page = self.lire(dossier)
        self.assertNotIn("<script>alert(1)</script>", page)
        self.assertIn("&lt;script&gt;", page)

    def test_json_dans_script_ne_casse_pas_la_balise(self):
        f = charger("commande", nom="Test </script><b>")
        dossier, _ = generer_site.generer(f, self.tmp)
        page = self.lire(dossier)
        normal, _ = generer_site.generer(charger("commande"), self.tmp / "n")
        self.assertEqual(page.count("</script>"), self.lire(normal).count("</script>"))

    def test_apercu_non_indexable(self):
        dossier, _ = generer_site.generer(fiche_artisan(), self.tmp, apercu=True)
        page = self.lire(dossier)
        self.assertTrue(dossier.name.endswith("-apercu"))
        self.assertIn('content="noindex, nofollow"', page)
        self.assertIn("non contractuel", page)
        self.assertTrue((dossier / "robots.txt").exists())
        # un aperçu n'est pas en ligne : formulaire désactivé, même pour une fiche réelle
        dossier, _ = generer_site.generer(fiche_artisan(demo=False), self.tmp / "ap", apercu=True)
        page = self.lire(dossier)
        self.assertIn("Aperçu non publié : le formulaire est désactivé", page)
        self.assertNotIn("data-netlify", page)

    def test_polices_et_images_optimisees(self):
        dossier, _ = generer_site.generer(charger("beaute"), self.tmp)
        page = self.lire(dossier)
        self.assertTrue((dossier / "polices" / "marcellus-latin.woff2").is_file())
        self.assertIn('rel="icon" href="data:image/svg+xml', page)
        try:
            import PIL  # noqa: F401
        except ImportError:
            return
        self.assertIn("srcset=", page)
        self.assertTrue(list((dossier / "img").glob("*.webp")))
        self.assertFalse(list((dossier / "img").glob("*.jpg")))

    def test_contraste_couleur_client(self):
        for couleur in ("#ffd400", "#1d5fd1", "#b0466b", "#f2f2f2"):
            pal = generer_site.palette(couleur, "#0f1b2d")
            self.assertGreaterEqual(generer_site.contraste(pal["accent-texte"], "#ffffff"), 4.5, couleur)
            self.assertGreaterEqual(generer_site.contraste(pal["accent"], pal["sur-accent"]), 4.5, couleur)
            self.assertGreaterEqual(generer_site.contraste(pal["accent-clair"], "#0f1b2d"), 4.5, couleur)

    def test_fiche_invalide(self):
        cas = [dict(telephone=""), dict(slug="Avec Espaces"), dict(whatsapp="+33 6 00"), dict(couleur="red"),
               dict(pays="DE"), dict(modele="inconnu"), dict(avis={"note": 7}),
               dict(avis={"liste": [{"texte": "sans auteur"}]}), dict(images={"hero": "images-demo/absente.jpg"}),
               dict(horaires_semaine={"lun": "8h-18h"})]
        for surcharge in cas:
            with self.assertRaises(generer_site.FicheInvalide, msg=str(surcharge)):
                generer_site.generer(fiche_artisan(**surcharge), self.tmp)
        with self.assertRaises(generer_site.FicheInvalide):
            generer_site.generer(charger("beaute", prestations=[]), self.tmp)

    def test_avertissement_mentions_manquantes(self):
        f = fiche_artisan(demo=False)
        del f["numero_entreprise"]
        dossier, avert = generer_site.generer(f, self.tmp)
        self.assertTrue(any("numero_entreprise" in a for a in avert))
        self.assertIn("[À COMPLÉTER]", self.lire(dossier, "mentions-legales.html"))

    def test_mentions_par_pays(self):
        for code, attendu, autorite in [("FR", "SIRET", "CNIL"), ("BE", "BCE", "autoriteprotectiondonnees.be"), ("CH", "IDE", "edoeb.admin.ch")]:
            f = fiche_artisan(pays=code, slug=f"test-{code.lower()}", numero_entreprise="123")
            dossier, avert = generer_site.generer(f, self.tmp)
            mentions = self.lire(dossier, "mentions-legales.html")
            self.assertIn(attendu, mentions)
            self.assertIn(autorite, mentions)
            self.assertIn(f'"addressCountry": "{code}"', self.lire(dossier))
            self.assertIn(f'lang="fr-{code}"', self.lire(dossier))

    def test_commande_produits_et_photos(self):
        f = charger("commande")
        dossier, _ = generer_site.generer(f, self.tmp)
        page = self.lire(dossier)
        self.assertEqual(page.count("data-produit "), len(f["produits"]))
        self.assertIn("32 €", page)
        self.assertIn('"33600000001"', page)
        self.assertIn("Le plus commandé", page)
        self.assertIn('id="cat-1"', page)  # 2 catégories

    def test_beaute_tarifs_et_reservation(self):
        f = charger("beaute", reservation_url="https://reservation.exemple.invalid/nova")
        dossier, _ = generer_site.generer(f, self.tmp)
        page = self.lire(dossier)
        self.assertIn("Prestations &amp; tarifs", page)
        self.assertIn("dès 115 €", page)
        self.assertIn("https://reservation.exemple.invalid/nova", page)
        self.assertIn("Itinéraire", page)


def ecrire_csv(dossier: Path, nom: str, lignes: list[dict]):
    with (crm.MODELES / nom).open(encoding="utf-8") as f:
        cols = next(csv.reader(f))
    with (dossier / nom).open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for l in lignes:
            w.writerow({c: "" for c in cols} | l)


class TestCRM(unittest.TestCase):
    def setUp(self):
        self.d = Path(tempfile.mkdtemp())
        self.jour = dt.date(2026, 11, 20)

    def test_fichiers_vides(self):
        crm.initialiser(self.d)
        ind = crm.calculer(self.d, self.jour)
        self.assertEqual(ind.entonnoir.total, 0)
        self.assertIsNone(ind.entonnoir.taux_reponse)
        self.assertEqual(ind.total_mois, 0)
        md = rapport.markdown(ind)
        self.assertIn("Aucun prospect contacté", md)

    def test_entonnoir_et_exclusion_opposition(self):
        ecrire_csv(self.d, "prospects.csv", [
            {"statut": "gagne", "segment": "A", "canal": "visite"},
            {"statut": "refus", "segment": "A", "canal": "email"},
            {"statut": "contacte", "segment": "A", "canal": "email"},
            {"statut": "nouveau", "segment": "A"},
            {"statut": "ne_pas_contacter", "segment": "A"},
        ])
        ind = crm.calculer(self.d, self.jour)
        e = ind.entonnoir
        self.assertEqual(list(ind.par_pays), ["FR"])
        self.assertEqual((e.total, e.contactes, e.reponses, e.gagnes, e.a_contacter), (4, 3, 2, 1, 1))

    def test_regles_de_decision(self):
        s = crm.Entonnoir()
        for _ in range(5):
            s.ajouter("repondu")
        self.assertIn("trop tôt", s.decision())  # 5 contacts : pas de conclusion
        s = crm.Entonnoir()
        for st in ["rdv"] * 3 + ["contacte"] * 17:
            s.ajouter(st)
        self.assertTrue(s.decision().startswith("GARDER"))
        s = crm.Entonnoir()
        for st in ["refus"] + ["sans_reponse"] * 59:
            s.ajouter(st)
        self.assertTrue(s.decision().startswith("ABANDONNER"))
        s = crm.Entonnoir()
        for st in ["refus"] * 4 + ["sans_reponse"] * 56:
            s.ajouter(st)
        self.assertTrue(s.decision().startswith("AJUSTER"))

    def test_argent_mrr_impayes_et_depense_non_approuvee(self):
        ecrire_csv(self.d, "ventes.csv", [
            {"date": "2026-11-02", "client": "X", "montant": "390", "montant_encaisse": "195"},
            {"date": "2026-10-01", "client": "Y", "montant": "290", "montant_encaisse": "290"},
        ])
        ecrire_csv(self.d, "abonnements.csv", [
            {"client": "Y", "montant_mensuel": "19", "date_debut": "2026-10-15"},
            {"client": "Z", "montant_mensuel": "19", "date_debut": "2026-01-01", "date_fin": "2026-06-30"},
        ])
        ecrire_csv(self.d, "depenses.csv", [{"date": "2026-11-03", "poste": "Pub", "montant": "20"}])
        ind = crm.calculer(self.d, self.jour)
        self.assertEqual(ind.ca_mois, 390)
        self.assertEqual(ind.mrr, 19)
        self.assertEqual(ind.total_mois, 409)
        self.assertEqual(len(ind.impayes), 1)
        self.assertTrue(any("sans date d'approbation" in a for a in ind.alertes))

    def test_actions_du_jour_et_statut_inconnu(self):
        ecrire_csv(self.d, "prospects.csv", [
            {"entreprise": "Retard", "statut": "contacte", "prochaine_action": "Relance", "date_prochaine_action": "2026-11-15"},
            {"entreprise": "Futur", "statut": "contacte", "prochaine_action": "Relance", "date_prochaine_action": "2026-12-01"},
            {"entreprise": "Bizarre", "statut": "peut-etre"},
        ])
        ind = crm.calculer(self.d, self.jour)
        self.assertEqual([a["entreprise"] for a in ind.actions_du_jour], ["Retard"])
        self.assertEqual(ind.actions_du_jour[0]["retard"], 5)
        self.assertTrue(ind.problemes_donnees)

    def test_rapport_complet_sur_donnees_exemple(self):
        out = Path(tempfile.mkdtemp())
        code = rapport.main(["--donnees", str(RACINE / "crm" / "exemple"), "--date", "2026-11-20", "--sortie", str(out)])
        self.assertEqual(code, 0)
        html = (out / "tableau-de-bord.html").read_text(encoding="utf-8")
        self.assertIn("<svg", html)
        self.assertIn("Décision par segment", html)
        self.assertTrue((out / "rapport-2026-11-20.md").exists())


class TestProspects(unittest.TestCase):
    def resultat(self, siren, opposition=False, etat="A", creation="2025-06-01", etab_etat="A"):
        return {
            "siren": siren, "nom_complet": "JEAN TEST (PLOMBERIE TEST)", "etat_administratif": etat,
            "opposition_diffusion_commerciale": opposition, "date_creation": creation, "activite_principale": "43.22A",
            "matching_etablissements": [{"etat_administratif": etab_etat, "date_creation": creation, "nom_commercial": "PLOMBERIE TEST",
                                         "liste_enseignes": None, "activite_principale": "43.22A", "libelle_commune": "VILLEURBANNE",
                                         "code_postal": "69100", "adresse": "1 RUE TEST 69100 VILLEURBANNE"}],
        }

    def test_filtres(self):
        depuis = dt.date(2025, 1, 1)
        self.assertIsNotNone(trouver_prospects.extraire(self.resultat("1"), depuis))
        self.assertIsNone(trouver_prospects.extraire(self.resultat("2", opposition=True), depuis))
        self.assertIsNone(trouver_prospects.extraire(self.resultat("3", etat="C"), depuis))
        self.assertIsNone(trouver_prospects.extraire(self.resultat("4", creation="2019-01-01"), depuis))
        self.assertIsNone(trouver_prospects.extraire(self.resultat("5", etab_etat="F"), depuis))
        ligne = trouver_prospects.extraire(self.resultat("1"), depuis)
        self.assertEqual(ligne["entreprise"], "Plomberie Test")
        self.assertEqual(ligne["metier"], "Plombier")
        self.assertEqual(ligne["statut"], "nouveau")
        self.assertEqual(ligne["pays"], "FR")

    def test_recherche_dedoublonnage_et_ecriture(self):
        pages = {1: {"results": [self.resultat("111"), self.resultat("222"), self.resultat("333", opposition=True)], "total_pages": 2},
                 2: {"results": [self.resultat("111"), self.resultat("444")], "total_pages": 2}}
        appels = []

        def faux_appel(params):
            appels.append(params)
            return pages[params["page"]]

        trouver_prospects.PAUSE = 0
        lignes = trouver_prospects.chercher(["43.22A"], {"code_postal": "69100"}, None, 10, 5, False, {"222"}, appel=faux_appel)
        self.assertEqual([l["siren"] for l in lignes], ["111", "444"])
        self.assertEqual(len(appels), 2)
        d = Path(tempfile.mkdtemp())
        fichier = d / "prospects.csv"
        trouver_prospects.ajouter(fichier, lignes, "A-artisans")
        trouver_prospects.ajouter(fichier, [self.resultat_ligne("555")], "A-artisans")
        lus = crm.lire(d, "prospects.csv")
        self.assertEqual([l["id"] for l in lus], ["1", "2", "3"])
        self.assertEqual(lus[0]["segment"], "A-artisans")
        self.assertEqual(trouver_prospects.sirens_existants(fichier), {"111", "444", "555"})

    def test_nouvel_etablissement_entreprise_ancienne_exclu(self):
        r = self.resultat("8", creation="2025-06-01")
        r["date_creation"] = "1998-01-01"
        self.assertIsNone(trouver_prospects.extraire(r, dt.date(2025, 1, 1)))

    def test_joli_nom(self):
        self.assertEqual(trouver_prospects.joli_nom("TLBT PLOMBERIE"), "TLBT Plomberie")
        self.assertEqual(trouver_prospects.joli_nom("JH CONFORT"), "JH Confort")
        self.assertEqual(trouver_prospects.joli_nom("C'EST MOMO QUI REGALE"), "C'est Momo qui Regale")
        self.assertEqual(trouver_prospects.joli_nom("  Déjà Bien  "), "Déjà Bien")
        self.assertEqual(trouver_prospects.joli_nom("MORPHEE CLEMENT (CLEMENT)"), "Morphee Clement (Clement)")

    def test_metier_hors_cible_exclu(self):
        r = self.resultat("9")
        r["matching_etablissements"][0]["activite_principale"] = "70.10Z"
        self.assertIsNone(trouver_prospects.extraire(r, None, ["43.22A"]))
        self.assertIsNotNone(trouver_prospects.extraire(self.resultat("9"), None, ["43.22A"]))

    def test_migration_ancien_format(self):
        d = Path(tempfile.mkdtemp())
        fichier = d / "prospects.csv"
        fichier.write_text("id,date_ajout,segment,entreprise,statut,notes\n1,2026-11-01,A,Ancienne,contacte,garder\n", encoding="utf-8")
        trouver_prospects.ajouter(fichier, [self.resultat_ligne("777")], "A")
        lus = crm.lire(d, "prospects.csv")
        self.assertEqual(lus[0]["entreprise"], "Ancienne")
        self.assertEqual(lus[0]["notes"], "garder")
        self.assertEqual(lus[1]["pays"], "FR")
        self.assertEqual(lus[1]["statut"], "nouveau")
        self.assertEqual(lus[1]["id"], "2")

    def resultat_ligne(self, siren):
        return trouver_prospects.extraire(self.resultat(siren), None)


class TestSiteAgence(unittest.TestCase):
    def test_blocs_conditionnels_imbriques(self):
        g = "<div><!--si:a--><p>A<!--si:b-->B<!--/si--><!--si:c-->C<!--/si--></p><!--/si--></div>"
        self.assertEqual(construire_site.assembler(g, {}, {"a": False}, ""), "<div></div>")
        self.assertEqual(construire_site.assembler(g, {}, {"a": True, "b": False, "c": True}, ""), "<div><p>AC</p></div>")

    def test_construction_complete_et_balises_equilibrees(self):
        from html.parser import HTMLParser
        out = Path(tempfile.mkdtemp())
        manquants = construire_site.construire(sortie=out)
        self.assertTrue(manquants)  # infos.json vide dans le dépôt : emplacements à compléter
        for nom in construire_site.PAGES:
            page = (out / nom).read_text(encoding="utf-8")
            self.assertNotIn("{{", page)
            pile = []
            vides = {"meta", "link", "img", "input", "br", "hr", "source"}
            class P(HTMLParser):
                def handle_starttag(self, tag, attrs):
                    if tag not in vides:
                        pile.append(tag)
                def handle_endtag(self, tag):
                    self_ = pile.pop() if pile else None
                    if self_ != tag:
                        raise AssertionError(f"{nom} : </{tag}> ferme <{self_}>")
            P().feed(page)
            self.assertEqual(pile, [], nom)
        self.assertIn("[À COMPLÉTER", (out / "mentions-legales.html").read_text(encoding="utf-8"))
        self.assertTrue((out / "_headers").exists() and (out / "robots.txt").exists())
        self.assertIn('href="/assets/styles.css"', (out / "404.html").read_text(encoding="utf-8"))


class TestCockpit(unittest.TestCase):
    def test_export_identifiants_stables_et_decoupage(self):
        d = Path(tempfile.mkdtemp())
        ecrire_csv(d, "prospects.csv", [{"id": str(i), "siren": str(100000000 + i), "entreprise": f"E{i}", "date_ajout": "2026-11-03"} for i in range(55)])
        out = d / "out"
        exporter_cockpit.main(["--donnees", str(d), "--sortie", str(out)])
        w1 = json.loads((out / "writes-1.json").read_text(encoding="utf-8"))
        w2 = json.loads((out / "writes-2.json").read_text(encoding="utf-8"))
        self.assertEqual((len(w1), len(w2)), (50, 5))
        self.assertEqual(w1[0]["doc_id"], "p100000000")
        doc = json.loads(Path(w1[0]["file_path"]).read_text(encoding="utf-8"))
        self.assertEqual(doc["statut"], "nouveau")


class TestApercus(unittest.TestCase):
    def test_preparation_sans_avis_ni_invention(self):
        d = Path(tempfile.mkdtemp())
        ecrire_csv(d, "prospects.csv", [
            {"id": "1", "pays": "FR", "entreprise": "SARL Test Chauffage (TC)", "metier": "Chauffagiste", "ville": "Lyon", "statut": "nouveau", "siren": "123"},
            {"id": "2", "entreprise": "Inconnu", "metier": "70.10Z", "statut": "nouveau"},
            {"id": "3", "entreprise": "Salon X", "metier": "Coiffure", "ville": "Lyon", "statut": "ne_pas_contacter"},
        ])
        code = preparer_apercus.main(["--ids", "1,2,3", "--fichier", str(d / "prospects.csv"), "--sortie", str(d / "out")])
        self.assertEqual(code, 0)
        page = (d / "out" / "test-chauffage-lyon-apercu" / "index.html").read_text(encoding="utf-8")
        self.assertIn("noindex", page)
        # maquette : contenus d'exemple présents mais signalés, jamais déclarés aux moteurs
        page = __import__("html").unescape(page)
        self.assertIn("Avis d'exemple pour la maquette", page)
        self.assertIn("Horaires d'exemple", page)
        self.assertIn("Prix indicatifs d'exemple", page)
        self.assertIn("sont des exemples à remplacer", page)
        self.assertNotIn("aggregateRating", page)
        fiche = json.loads(next((d / "out" / "fiches").glob("*.json")).read_text(encoding="utf-8"))
        with self.assertRaises(generer_site.FicheInvalide):  # pas de version finale avec du contenu d'exemple
            generer_site.generer(fiche, d / "final")
        self.assertNotIn('href="tel:"', page)  # aucun bouton d'appel factice sans numéro
        self.assertIn("Test Chauffage", page)
        lus = crm.lire(d, "prospects.csv")
        self.assertEqual([l["apercu"] for l in lus], ["oui", "", ""])
        self.assertFalse((d / "out" / "salon-x-lyon-apercu").exists())




class TestConversion(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())

    def test_blocs_conversion_et_seo_local(self):
        f = fiche_artisan(demo=False, domaine="https://plomberie-martin.fr", qualifications=["Qualibat RGE"], communes=["Villeurbanne", "Bron"])
        dossier, _ = generer_site.generer(f, self.tmp)
        page = (dossier / "index.html").read_text(encoding="utf-8")
        self.assertIn("Nos tarifs de dépannage", page)
        self.assertIn("arrêté du 24 janvier 2017", page)
        self.assertIn('name="commune"', page)
        self.assertIn("Qualibat RGE", page)
        self.assertIn('"openingHoursSpecification"', page)
        self.assertIn('"areaServed": [{"@type": "City"', page)
        self.assertIn('rel="canonical" href="https://plomberie-martin.fr/"', page)
        self.assertIn("Sitemap: https://plomberie-martin.fr/sitemap.xml", (dossier / "robots.txt").read_text(encoding="utf-8"))
        self.assertTrue((dossier / "sitemap.xml").exists())

    def test_qualifications_jamais_sur_une_maquette(self):
        f = fiche_artisan(qualifications=["RGE"], maquette=True)
        dossier, _ = generer_site.generer(f, self.tmp, apercu=True)
        self.assertNotIn('class="qualifs"', (dossier / "index.html").read_text(encoding="utf-8"))

    def test_image_ia_interdite_comme_realisation(self):
        ia = Path(tempfile.mkdtemp()); (ia / "images-ia").mkdir()
        src = generer_site.MODELES / "images-demo" / "plomberie-lavabo.jpg"
        (ia / "images-ia" / "ia-plombier-accueil.webp").write_bytes(src.read_bytes())
        f = fiche_artisan(demo=False, images={"hero": "images-ia/ia-plombier-accueil.webp", "galerie": [{"src": "images-ia/ia-plombier-accueil.webp"}]})
        with self.assertRaises(generer_site.FicheInvalide):
            generer_site.generer(f, self.tmp, base=ia)
        f["images"] = {"hero": "images-ia/ia-plombier-accueil.webp"}
        dossier, _ = generer_site.generer(f, self.tmp, base=ia)
        self.assertIn('alt="Illustration : ', (dossier / "index.html").read_text(encoding="utf-8"))
        self.assertIn("générées par intelligence artificielle", (dossier / "mentions-legales.html").read_text(encoding="utf-8"))



class TestSnackRestaurant(unittest.TestCase):
    def test_maquettes_snack_et_restaurant(self):
        snack = preparer_apercus.fiche_pour({"id": "1", "entreprise": "Tacos Avenue", "metier": "Snack", "ville": "Vénissieux", "telephone": "06 11 22 33 44"})
        self.assertEqual(snack["modele"], "commande-whatsapp")
        self.assertEqual(snack["whatsapp"], "33611223344")
        self.assertTrue(any(p["nom"] == "Tacos M" for p in snack["produits"]))
        resto = preparer_apercus.fiche_pour({"id": "2", "entreprise": "Le Genova", "metier": "Restaurant", "ville": "Lyon", "telephone": "04 72 68 06 67"})
        self.assertEqual(resto["modele"], "artisan")
        self.assertEqual(resto["cta_secondaire"], "Réserver une table")
        d = Path(tempfile.mkdtemp())
        for f in (snack, resto):
            dossier, _ = generer_site.generer(f, d, apercu=True, base=generer_site.MODELES)
            self.assertIn("Maquette préparée", (dossier / "index.html").read_text(encoding="utf-8"))


class TestProspectsOSM(unittest.TestCase):
    def test_telephone_sans_site_et_completion(self):
        d = Path(tempfile.mkdtemp())
        ecrire_csv(d, "prospects.csv", [
            {"id": "1", "entreprise": "SARL Plomberie Dupont", "metier": "Plombier", "ville": "Lyon", "statut": "nouveau"},
            {"id": "2", "entreprise": "Salon Refus", "metier": "Coiffure", "ville": "Lyon", "statut": "ne_pas_contacter"}])
        osm = {"elements": [
            {"type": "node", "id": 1, "tags": {"craft": "plumber", "name": "Plomberie Dupont", "phone": "+33 4 72 00 00 01", "addr:city": "Lyon"}},
            {"type": "node", "id": 2, "tags": {"shop": "hairdresser", "name": "Salon Refus", "phone": "0472000002"}},
            {"type": "node", "id": 3, "tags": {"shop": "hairdresser", "name": "Coiff Neuf", "contact:phone": "06.00.00.00.03", "addr:city": "Bron"}},
            {"type": "node", "id": 4, "tags": {"shop": "beauty", "name": "Avec Site", "phone": "0472000004", "website": "https://x.fr"}},
            {"type": "node", "id": 5, "tags": {"shop": "bakery", "name": "Hors cible", "phone": "0472000005"}},
            {"type": "node", "id": 6, "tags": {"craft": "painter", "name": "Sans Tel"}}]}
        (d / "osm.json").write_text(json.dumps(osm), encoding="utf-8")
        prospects_osm.main(["--departements", "69", "--json", str(d / "osm.json"), "--completer", "--ajouter", "--fichier", str(d / "prospects.csv")])
        lignes = {l["entreprise"]: l for l in crm.lire(d, "prospects.csv")}
        self.assertEqual(lignes["SARL Plomberie Dupont"]["telephone"], "04 72 00 00 01")
        self.assertEqual(lignes["Salon Refus"]["telephone"], "")  # refus respecté
        self.assertEqual(lignes["Coiff Neuf"]["telephone"], "06 00 00 00 03")
        self.assertEqual(lignes["Coiff Neuf"]["source"], "OpenStreetMap (ODbL)")
        self.assertNotIn("Avec Site", lignes)
        self.assertNotIn("Hors cible", lignes)
        self.assertNotIn("Sans Tel", lignes)
        self.assertEqual(len(lignes), 3)


if __name__ == "__main__":
    unittest.main()
