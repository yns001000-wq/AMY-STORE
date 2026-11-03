# Projet revenus — « Enseigne Web » (nom provisoire)

Activité choisie : **création de sites vitrines à prix fixe pour artisans, commerçants et indépendants**, livrés en 5 jours, sans abonnement obligatoire. Pourquoi ce choix : voir [BUSINESS_MODEL.md](BUSINESS_MODEL.md).

> Ce dossier est séparé de votre boutique AMY Store 30K, qui n'a pas été modifiée.

## Par où commencer
1. Lire **[PROGRESS.md](PROGRESS.md)** : où on en est et ce qu'il vous reste à faire.
2. Lire **[PLAN.md](PLAN.md)** : les phases, avec 👤 (vous), 🤖 (Claude) et 🔐 (votre autorisation requise).
3. Ouvrir **`site/index.html`** dans votre navigateur : la page de présentation de l'offre.

## Contenu du dossier
| Fichier / dossier | Rôle |
|---|---|
| `PLAN.md` | Plan d'exécution par phases |
| `BUSINESS_MODEL.md` | Comparatif des modèles, modèle retenu, offre et prix |
| `MARKETING.md` | Clients visés, objections, canaux, mesure |
| `AUTOMATION.md` | Ce qui est automatisé, à connecter ou soumis à autorisation, et la routine du lundi |
| `BUDGET.md` | Coûts (0 € à ce jour) et hypothèses |
| `PROGRESS.md` | Avancement, preuves, problèmes, prochaines étapes |
| `LEGAL.md` | Statut, facturation, prospection légale, mentions légales |
| `SOURCES.md` | Sources consultées, avec leur niveau de fiabilité |
| `site/` | Page de l'offre (prête à déposer sur Netlify) et démos fictives |
| `modeles-sites/` | Modèles de sites clients et fiches d'exemple |
| `outils/` | `trouver_prospects.py`, `generer_site.py`, `rapport.py` (Python, aucune dépendance) |
| `crm/` | Suivi : modèles CSV, statuts, données fictives de test. **Vos vraies données vont dans `crm/donnees/`, jamais publié** |
| `marketing/` | Messages de prospection, publicités préparées, calendrier, visuels |
| `ventes/` | Devis, facture, CGV (projet), questionnaire, liste de vérification de livraison |
| `docs/` | Mise en ligne, note sur l'hébergement d'AMY Store |
| `tests/` | Tests automatisés |

## Vérifier que tout fonctionne
```
cd projet-revenus
python -m unittest discover -s tests -v
```
