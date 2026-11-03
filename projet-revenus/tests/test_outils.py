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
import rapport  # noqa: E402
import trouver_prospects  # noqa: E402


def fiche_artisan(**surcharges):
    f = json.loads((RACINE / "modeles-sites" / "fiche-exemple-artisan.json").read_text(encoding="utf-8"))
    f.update(surcharges)
    return f


class TestGenerateur(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())

    def test_artisan_complet_sans_variable_restante(self):
        dossier, _ = generer_site.generer(fiche_artisan(), self.tmp)
        page = (dossier / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("{{", page)
        self.assertIn("Plombier chauffagiste à Villeurbanne", page)
        self.assertIn('href="tel:0600000000"', page)
        for f in ("mentions-legales.html", "merci.html"):
            self.assertTrue((dossier / f).exists())

    def test_echappement_html(self):
        dossier, _ = generer_site.generer(fiche_artisan(nom='<script>alert(1)</script>', demo=False), self.tmp)
        page = (dossier / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("<script>alert(1)</script>", page)
        self.assertIn("&lt;script&gt;", page)
        self.assertIn('data-netlify="true"', page)

    def test_json_dans_script_ne_casse_pas_la_balise(self):
        f = json.loads((RACINE / "modeles-sites" / "fiche-exemple-commande.json").read_text(encoding="utf-8"))
        f["nom"] = "Test </script><b>"
        dossier, _ = generer_site.generer(f, self.tmp)
        page = (dossier / "index.html").read_text(encoding="utf-8")
        self.assertEqual(page.count("</script>"), 2)  # JSON-LD + script panier, pas plus

    def test_apercu_non_indexable(self):
        dossier, _ = generer_site.generer(fiche_artisan(), self.tmp, apercu=True)
        page = (dossier / "index.html").read_text(encoding="utf-8")
        self.assertTrue(dossier.name.endswith("-apercu"))
        self.assertIn('content="noindex, nofollow"', page)
        self.assertIn("non contractuel", page)
        self.assertTrue((dossier / "robots.txt").exists())

    def test_fiche_invalide(self):
        with self.assertRaises(generer_site.FicheInvalide):
            generer_site.generer(fiche_artisan(telephone=""), self.tmp)
        with self.assertRaises(generer_site.FicheInvalide):
            generer_site.generer(fiche_artisan(slug="Avec Espaces"), self.tmp)
        with self.assertRaises(generer_site.FicheInvalide):
            generer_site.generer(fiche_artisan(whatsapp="+33 6 00"), self.tmp)
        with self.assertRaises(generer_site.FicheInvalide):
            generer_site.generer(fiche_artisan(couleur="red"), self.tmp)

    def test_avertissement_mentions_manquantes(self):
        f = fiche_artisan()
        del f["siret"]
        dossier, avert = generer_site.generer(f, self.tmp)
        self.assertTrue(any("siret" in a for a in avert))
        self.assertIn("[À COMPLÉTER]", (dossier / "mentions-legales.html").read_text(encoding="utf-8"))

    def test_commande_whatsapp_produits(self):
        f = json.loads((RACINE / "modeles-sites" / "fiche-exemple-commande.json").read_text(encoding="utf-8"))
        dossier, _ = generer_site.generer(f, self.tmp)
        page = (dossier / "index.html").read_text(encoding="utf-8")
        self.assertEqual(page.count("data-produit "), len(f["produits"]))
        self.assertIn("32,00 €", page)
        self.assertIn('"33600000001"', page)
        f["produits"] = []
        with self.assertRaises(generer_site.FicheInvalide):
            generer_site.generer(f, self.tmp)


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
        e = crm.calculer(self.d, self.jour).entonnoir
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

    def resultat_ligne(self, siren):
        return trouver_prospects.extraire(self.resultat(siren), None)


if __name__ == "__main__":
    unittest.main()
