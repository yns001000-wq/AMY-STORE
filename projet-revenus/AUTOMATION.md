# AUTOMATION.md — Automatisations prévues et réalisées

**Légende :**
- ✅ **Opérationnel** : construit et testé, avec la preuve indiquée.
- 🔌 **À connecter** : nécessite un compte ou un réglage de votre part.
- 🔐 **Autorisation requise** : action externe, dépense ou envoi.
- 🗓️ **Prévu** : pas encore construit.

## 1. État des lieux

| # | Tâche | Outil | Statut | Preuve ou condition |
|---|---|---|---|---|
| 1 | Trouver des prospects (entreprises actives récentes, par métier et par zone), sans doublon, en excluant les entreprises qui ont fait opposition | `outils/trouver_prospects.py`, qui interroge l'API officielle Recherche d'entreprises | ✅ | Testé en conditions réelles le 03/11/2026 (8 résultats à Villeurbanne, en mode essai, sans rien écrire), plus 2 tests automatisés avec une API simulée |
| 1 bis | Trouver des prospects en Belgique et en Suisse | KBO Open Data (BE) / API Zefix (CH) | 🔌🔐 | Non construit : conditions de réutilisation (BE) et identifiants (CH) à obtenir d'abord. En attendant, recherche manuelle (voir MARCHES.md) |
| 2 | Organiser les contacts (suivi en fichiers CSV avec statuts, canaux et prochaines actions) | `crm/donnees/*.csv` + `crm/STATUTS.md` | ✅ | Fichiers créés au premier lancement de `rapport.py`. Validation des statuts testée |
| 3 | Générer un aperçu de site personnalisé pour un prospect (non indexable, avec bandeau « non contractuel ») | `outils/generer_site.py --apercu` | ✅ | 7 tests automatisés, vérification dans le navigateur à 375 px et 1 280 px |
| 4 | Produire le site final d'un client (2 modèles : artisan, commande WhatsApp) avec mentions légales et page de remerciement | `outils/generer_site.py` | ✅ | Démos dans `site/exemples/`. Parcours panier → WhatsApp testé dans le navigateur |
| 5 | Calculer les indicateurs, les actions du jour, les alertes, la décision par segment et les recommandations | `outils/rapport.py` → `rapports/rapport-AAAA-MM-JJ.md` | ✅ | 6 tests automatisés, rapport complet sur des données fictives |
| 6 | Tableau de bord visuel (prospects, conversions, chiffre d'affaires, coûts) | `rapports/tableau-de-bord.html`, généré par `rapport.py` | ✅ | Capture vérifiée. Fonctionne hors ligne |
| 7 | Alerte en cas de dépense sans approbation | `rapport.py` | ✅ | Testé : toute ligne de `depenses.csv` sans date d'approbation déclenche une alerte |
| 8 | Préparer les messages de prospection et de relance | `marketing/messages_prospection.md` + Claude | ✅ (préparation) | Les modèles existent. Claude les personnalise sur demande. **L'envoi reste manuel** 🔐 |
| 9 | Préparer les réponses aux clients (devis, récapitulatif, objections) | `ventes/*` + Claude | ✅ (préparation) | Modèles prêts. Claude complète à partir du questionnaire |
| 10 | Rédiger le contenu marketing hebdomadaire | `marketing/calendrier_contenu.md` + Claude | ✅ (préparation) | 4 semaines rédigées. **La publication reste manuelle** 🔐 |
| 11 | Recevoir les demandes de la page de l'offre | Netlify Forms (formulaire `demande-apercu`) | 🔌 | Fonctionne une fois le site déployé sur Netlify. Activer la notification par email dans Netlify → Forms → Notifications |
| 12 | Importer les demandes du formulaire dans le suivi | Export CSV de Netlify → ajout dans `prospects.csv` par Claude | 🔌 | Manuel pour l'instant (1 min par semaine). Automatisable plus tard via l'API Netlify, ce qui demande un jeton d'accès créé par vous 🔐 |
| 13 | Créer les brouillons d'emails dans votre boîte | Connecteur Gmail de Claude (création de brouillons uniquement) | 🔌🔐 | Seulement si vous connectez Gmail à Claude. Claude crée des **brouillons**, et c'est vous qui appuyez sur « Envoyer » |
| 14 | Lancer automatiquement la routine du lundi | Tâches planifiées de Cowork, si disponibles sur votre compte | 🔌 | **À vérifier dans votre application.** Sinon, collez le message de la §2 chaque lundi |
| 15 | Programmer les publications sur les réseaux sociaux | Meta Business Suite (gratuit) | 🔌🔐 | Vous connectez vos comptes. Claude ne publie rien en votre nom |
| 16 | Suivi des visites du site sans cookie | Netlify Analytics (payant) ou outil sans cookie à choisir | 🗓️ 🔐 | Non prioritaire : on mesure d'abord les demandes reçues, plus utiles que les visites |
| 17 | Facturation électronique | Plateforme agréée gratuite, à choisir | 🗓️ | Avant septembre 2027 (voir LEGAL.md) |

**Ce qui n'est volontairement PAS automatisé :**
- l'envoi de messages aux prospects ;
- la publication ;
- les paiements ;
- la collecte massive de téléphones ou d'emails (la récupération automatique en masse de Google Maps est contraire aux conditions de Google) ;
- la création de comptes en votre nom.

## 2. Routine hebdomadaire — message à donner à Claude (Cowork) chaque lundi

```
Routine du lundi pour projet-revenus :
1. Lance `python outils/rapport.py` et résume-moi le rapport en 10 lignes (actions du jour, alertes, décision par segment).
2. S'il reste moins de 20 prospects « nouveau », lance `python outils/trouver_prospects.py` avec les paramètres de la semaine
   (segment et zone indiqués dans PROGRESS.md, section « Paramètres de prospection »), 30 prospects maximum.
3. Pour les 5 prospects les plus récents qui ont un téléphone renseigné, prépare une fiche JSON et génère un aperçu
   avec `outils/generer_site.py --apercu --sortie sorties/apercus`, puis une capture d'écran mobile.
4. Prépare les messages personnalisés (modèles 2 et 3 de marketing/messages_prospection.md) pour ces 5 prospects
   et pour les relances du jour. NE LES ENVOIE PAS.
5. Rédige les 2 brouillons de contenu de la semaine dans marketing/calendrier_contenu.md.
6. Mets à jour PROGRESS.md (date, chiffres clés, problèmes rencontrés).
```

## 3. Commandes utiles (depuis le dossier `projet-revenus/`)

```
python outils/rapport.py                                    # rapport + tableau de bord
python outils/trouver_prospects.py --naf 43.22A --code-postal 69100 --segment A-artisans --depuis 2024-01-01 --essai
python outils/generer_site.py clients/mon-client/fiche.json --apercu
python -m unittest discover -s tests -v                     # tests automatisés
node tests/verifier_pages.js                                # vérification navigateur (nécessite Node + Playwright)
```

Sous Windows, si `python` n'est pas reconnu : soit vous laissez Claude (Cowork) lancer les commandes dans son environnement, soit vous installez Python depuis python.org ou le Microsoft Store (gratuit).

## 4. Prochaines automatisations, par ordre de valeur
1. Import automatique des demandes Netlify dans le suivi (🔐 jeton d'accès Netlify).
2. Capture d'écran automatique des aperçus pour l'email (un script Playwright existe déjà pour les tests et serait à adapter).
3. Génération automatique du devis en PDF à partir de la fiche client.
4. Alerte « contrats Sérénité » : rappel mensuel de vérification de chaque site client.
