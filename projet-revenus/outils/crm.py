"""Lecture des fichiers de suivi (CSV) et calcul des indicateurs.

Fichiers attendus dans crm/donnees/ (copiés depuis crm/modeles/ au premier usage) :
  prospects.csv, ventes.csv, abonnements.csv, depenses.csv
Bibliothèque standard uniquement.
"""
from __future__ import annotations

import csv
import datetime as dt
import shutil
from collections import OrderedDict
from dataclasses import dataclass, field
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
DONNEES = RACINE / "crm" / "donnees"
MODELES = RACINE / "crm" / "modeles"
FICHIERS = ("prospects.csv", "ventes.csv", "abonnements.csv", "depenses.csv")

# Statuts du suivi (voir crm/STATUTS.md)
STATUTS = (
    "nouveau", "contacte", "sans_reponse", "refus", "repondu",
    "rdv", "devis", "gagne", "perdu", "ne_pas_contacter",
)
CONTACTES = {"contacte", "sans_reponse", "refus", "repondu", "rdv", "devis", "gagne", "perdu"}
REPONSES = {"refus", "repondu", "rdv", "devis", "gagne", "perdu"}
RDV = {"rdv", "devis", "gagne"}
DEVIS = {"devis", "gagne"}
GAGNES = {"gagne"}
CLOS = {"gagne", "perdu", "refus", "sans_reponse", "ne_pas_contacter"}

OBJECTIF_MENSUEL = 1000.0
TAUX_COTISATIONS = 0.256  # hypothèse prudente (BNC non réglementé 2026) — à ajuster selon votre déclaration

# Règles de décision par segment (voir PLAN.md, phase 4)
SEUIL_CONTACTS_DECISION = 60
MINIMUM_ECHANTILLON = 20  # en dessous, aucune conclusion (échantillon trop petit)
SEUIL_REPONSE_HAUT = 0.10
SEUIL_REPONSE_BAS = 0.03


def initialiser(dossier: Path = DONNEES) -> list[Path]:
    """Crée les fichiers de données vides (en-têtes seuls) s'ils n'existent pas."""
    dossier.mkdir(parents=True, exist_ok=True)
    crees = []
    for nom in FICHIERS:
        cible = dossier / nom
        if not cible.exists():
            shutil.copyfile(MODELES / nom, cible)
            crees.append(cible)
    return crees


def lire(dossier: Path, nom: str) -> list[dict]:
    chemin = dossier / nom
    if not chemin.exists():
        return []
    with chemin.open(encoding="utf-8-sig", newline="") as f:
        lignes = list(csv.DictReader(f))
    return [{k.strip(): (v or "").strip() for k, v in ligne.items() if k} for ligne in lignes]


def date(texte: str) -> dt.date | None:
    texte = (texte or "").strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return dt.datetime.strptime(texte, fmt).date()
        except ValueError:
            pass
    return None


def montant(texte: str) -> float:
    texte = (texte or "").replace("€", "").replace(" ", "").replace(" ", "").replace(",", ".")
    try:
        return float(texte)
    except ValueError:
        return 0.0


@dataclass
class Entonnoir:
    total: int = 0
    a_contacter: int = 0
    contactes: int = 0
    reponses: int = 0
    rdv: int = 0
    devis: int = 0
    gagnes: int = 0

    def ajouter(self, statut: str) -> None:
        if statut == "ne_pas_contacter":
            return
        self.total += 1
        if statut in ("nouveau", ""):
            self.a_contacter += 1
        if statut in CONTACTES:
            self.contactes += 1
        if statut in REPONSES:
            self.reponses += 1
        if statut in RDV:
            self.rdv += 1
        if statut in DEVIS:
            self.devis += 1
        if statut in GAGNES:
            self.gagnes += 1

    @property
    def taux_reponse(self) -> float | None:
        return self.reponses / self.contactes if self.contactes else None

    @property
    def taux_vente(self) -> float | None:
        return self.gagnes / self.contactes if self.contactes else None

    def decision(self) -> str:
        """Applique la règle de décision du PLAN (phase 4)."""
        if self.contactes == 0:
            return "Pas encore de contact"
        t = self.taux_reponse
        if self.contactes < MINIMUM_ECHANTILLON:
            return f"Continuer le test ({self.contactes}/{SEUIL_CONTACTS_DECISION} contacts — trop tôt pour conclure)"
        if t >= SEUIL_REPONSE_HAUT and self.rdv >= 1:
            return "GARDER — augmenter le rythme"
        if self.contactes < SEUIL_CONTACTS_DECISION:
            return f"Continuer le test ({self.contactes}/{SEUIL_CONTACTS_DECISION} contacts)"
        if t < SEUIL_REPONSE_BAS:
            return "ABANDONNER ce segment/canal — tester un autre métier ou une autre ville"
        return "AJUSTER le message ou le canal, puis retester 30 contacts"


@dataclass
class Indicateurs:
    aujourd_hui: dt.date
    entonnoir: Entonnoir = field(default_factory=Entonnoir)
    par_segment: "OrderedDict[str, Entonnoir]" = field(default_factory=OrderedDict)
    par_canal: "OrderedDict[str, Entonnoir]" = field(default_factory=OrderedDict)
    par_pays: "OrderedDict[str, Entonnoir]" = field(default_factory=OrderedDict)
    actions_du_jour: list = field(default_factory=list)
    alertes: list = field(default_factory=list)
    ca_mois: float = 0.0
    encaisse_mois: float = 0.0
    mrr: float = 0.0
    depenses_mois: float = 0.0
    depenses_recurrentes: float = 0.0
    impayes: list = field(default_factory=list)
    ca_par_mois: "OrderedDict[str, float]" = field(default_factory=OrderedDict)
    nb_ventes_mois: int = 0
    problemes_donnees: list = field(default_factory=list)

    @property
    def total_mois(self) -> float:
        """Chiffre d'affaires du mois = ventes facturées + abonnements actifs."""
        return self.ca_mois + self.mrr

    @property
    def progression_objectif(self) -> float:
        return self.total_mois / OBJECTIF_MENSUEL

    @property
    def cotisations_estimees(self) -> float:
        return (self.encaisse_mois + self.mrr) * TAUX_COTISATIONS


def calculer(dossier: Path = DONNEES, aujourd_hui: dt.date | None = None) -> Indicateurs:
    aujourd_hui = aujourd_hui or dt.date.today()
    ind = Indicateurs(aujourd_hui=aujourd_hui)
    mois = aujourd_hui.strftime("%Y-%m")

    # Prospects
    for i, p in enumerate(lire(dossier, "prospects.csv"), start=2):
        statut = p.get("statut", "").lower() or "nouveau"
        if statut not in STATUTS:
            ind.problemes_donnees.append(f"prospects.csv ligne {i} : statut inconnu « {statut} » (voir crm/STATUTS.md)")
            continue
        seg = p.get("segment") or "(sans segment)"
        canal = p.get("canal") or "(pas encore contacté)"
        ind.entonnoir.ajouter(statut)
        ind.par_segment.setdefault(seg, Entonnoir()).ajouter(statut)
        ind.par_pays.setdefault((p.get("pays") or "FR").upper(), Entonnoir()).ajouter(statut)
        if statut in CONTACTES:
            ind.par_canal.setdefault(canal, Entonnoir()).ajouter(statut)

        if statut in CLOS:
            continue
        nom = p.get("entreprise") or f"ligne {i}"
        echeance = date(p.get("date_prochaine_action", ""))
        dernier = date(p.get("date_dernier_contact", ""))
        if echeance and echeance <= aujourd_hui:
            retard = (aujourd_hui - echeance).days
            ind.actions_du_jour.append({
                "entreprise": nom,
                "action": p.get("prochaine_action") or "(action à préciser)",
                "telephone": p.get("telephone", ""),
                "retard": retard,
                "statut": statut,
            })
        elif statut != "nouveau" and not echeance:
            ind.alertes.append(f"{nom} : statut « {statut} » sans prochaine action datée.")
        if statut == "contacte" and dernier and (aujourd_hui - dernier).days > 21:
            ind.alertes.append(f"{nom} : contacté il y a {(aujourd_hui - dernier).days} jours sans réponse — passer en « sans_reponse » après la dernière relance.")
    ind.actions_du_jour.sort(key=lambda a: -a["retard"])

    # Ventes
    for i, v in enumerate(lire(dossier, "ventes.csv"), start=2):
        d = date(v.get("date", ""))
        if not d:
            ind.problemes_donnees.append(f"ventes.csv ligne {i} : date invalide (format attendu AAAA-MM-JJ)")
            continue
        m, enc = montant(v.get("montant")), montant(v.get("montant_encaisse"))
        cle = d.strftime("%Y-%m")
        ind.ca_par_mois[cle] = ind.ca_par_mois.get(cle, 0.0) + m
        if cle == mois:
            ind.ca_mois += m
            ind.encaisse_mois += enc
            ind.nb_ventes_mois += 1
        if enc + 0.005 < m and (aujourd_hui - d).days > 15:
            ind.impayes.append({"client": v.get("client", f"ligne {i}"), "reste": m - enc, "jours": (aujourd_hui - d).days})
    ind.ca_par_mois = OrderedDict(sorted(ind.ca_par_mois.items()))

    # Abonnements actifs
    for a in lire(dossier, "abonnements.csv"):
        debut, fin = date(a.get("date_debut", "")), date(a.get("date_fin", ""))
        if debut and debut <= aujourd_hui and (not fin or fin >= aujourd_hui):
            ind.mrr += montant(a.get("montant_mensuel"))

    # Dépenses
    for i, dep in enumerate(lire(dossier, "depenses.csv"), start=2):
        d = date(dep.get("date", ""))
        val = montant(dep.get("montant"))
        if d and d.strftime("%Y-%m") == mois:
            ind.depenses_mois += val
        if dep.get("recurrent", "").lower() in ("oui", "o", "yes", "1"):
            ind.depenses_recurrentes += val
        if val > 0 and not dep.get("approuve_le"):
            ind.alertes.append(f"Dépense « {dep.get('poste', f'ligne {i}')} » ({val:.2f} €) sans date d'approbation : toute dépense doit être approuvée par vous.")

    # Alertes générales
    if ind.entonnoir.a_contacter < 10:
        ind.alertes.append(f"Seulement {ind.entonnoir.a_contacter} prospect(s) à contacter : lancer outils/trouver_prospects.py.")
    for imp in ind.impayes:
        ind.alertes.append(f"Impayé : {imp['client']} doit encore {imp['reste']:.2f} € (vente il y a {imp['jours']} jours).")
    return ind


def pct(x: float | None) -> str:
    return "—" if x is None else f"{x * 100:.1f} %".replace(".", ",")


def euros(x: float) -> str:
    return f"{x:,.2f} €".replace(",", " ").replace(".", ",")
