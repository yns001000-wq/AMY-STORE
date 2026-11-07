# BUDGET.md — Dépenses, coûts récurrents et hypothèses

**Budget approuvé à ce jour : 0 €.** Aucune dépense n'a été engagée. Toute dépense future doit être approuvée par vous (🔐) et notée dans `crm/donnees/depenses.csv`, **avec sa date d'approbation**. Le rapport signale toute ligne qui n'en a pas.

## 1. Coûts de démarrage
| Poste | Coût | Obligatoire ? | Statut |
|---|---|---|---|
| Création de la micro-entreprise (guichet officiel) | 0 € | Oui, avant de facturer | À faire 👤 |
| Claude Pro (déjà détenu) | Déjà payé | — | Existant |
| Outils construits (Python, HTML) | 0 € | — | ✅ |
| Hébergement de la page de l'offre (Netlify, formule gratuite) | 0 € | Oui | À faire 👤 |
| Adresse email dédiée (Gmail) | 0 € | Recommandé | À faire 👤 |
| Cartes de visite (facultatif, pour les visites) | Environ 10 à 20 € pour 100 cartes, à vérifier | Non | 🔐 Proposé |
| Nom de domaine pour l'activité | Environ 10 à 15 €/an, à vérifier chez le registraire | Non (un sous-domaine gratuit suffit au départ) | 🔐 Proposé plus tard |
| Assurance RC Pro | Sur devis | Non (recommandée) | 🔐 Devis à demander |
| **Total minimum** | **0 €** | | |

## 2. Coûts récurrents
| Poste | Coût | Remarque |
|---|---|---|
| Cotisations sociales | 21,2 % (BIC) ou 25,6 % (BNC) du chiffre d'affaires **encaissé** | Taux 2026, à confirmer selon votre déclaration |
| Formation professionnelle (CFP) | 0,1 % à 0,3 % du chiffre d'affaires | Prélevée avec les cotisations |
| Impôt sur le revenu | Selon votre foyer, ou versement libératoire (1,7 % en BIC services, 2,2 % en BNC) si vous êtes éligible | À choisir à la création |
| Hébergement des sites des clients | 0 € pour vous | Les comptes sont au nom des clients |
| Domaines des clients | 0 € pour vous | Payés directement par les clients |
| Frais bancaires | 0 à quelques €/mois | Un compte dédié est obligatoire au-delà de 10 000 € de chiffre d'affaires sur 2 années consécutives (à vérifier) |

## 3. Budget publicitaire proposé (NON approuvé)
- Test Google Ads : plafond de 100 €.
- Test Meta : plafond de 50 €.
- **Total proposé : 150 €**, seulement après 3 ventes obtenues gratuitement. Détails et critères d'arrêt dans `marketing/annonces.md`.

## 4. Hypothèses de rentabilité (à remplacer par les vraies mesures)
| Hypothèse | Valeur de départ | Source |
|---|---|---|
| Prix moyen d'une vente | 420 € | Mélange des offres Vitrine et Vitrine + commande WhatsApp |
| Temps de production par site | 4 à 6 h | Estimation avec modèles et IA, **à mesurer** |
| Temps commercial par vente | 6 à 10 h (prospection et rendez-vous) | Estimation, **à mesurer** |
| Taux de réponse | 10 % | Hypothèse, **à mesurer** (règle de décision à 60 contacts) |
| Taux de vente sur les contacts | 2 % | Hypothèse, **à mesurer** |
| Part des clients qui prennent Sérénité | 50 % | Hypothèse, **à mesurer** |

**Exemple de mois « objectif » :**
- 2 sites, soit 840 € ;
- \+ 9 abonnements Sérénité, soit 171 € ;
- **= 1 011 € de chiffre d'affaires** ;
- − environ 21 à 26 % de cotisations ;
- **≈ 750 à 800 € avant impôt et avant dépenses.**

Cela représente environ 20 à 30 h de travail humain par mois.

**Seuil de rentabilité :** comme il n'y a aucun coût fixe obligatoire, chaque vente est rentable dès la première, hors valeur de votre temps.

## OpenAI : images d'illustration (06/11/2026)
- Budget approuvé : **plafond de 3 $** (32 images, estimation de 2,52 $).
- Plafond relevé à **3,50 $** à votre demande (06/11/2026), une fois le crédit ajouté.
- Dépensé (coût réel calculé à partir de la consommation renvoyée par OpenAI) : **1,82 $** pour 40 illustrations et 2 essais.
- Point à vérifier : 6 tentatives coupées par le proxy, peut-être facturées (au pire environ 1,08 $). Total maximal : environ 2,90 $, sous le plafond.
- Chaque image générée est notée automatiquement dans `crm/donnees/depenses.csv`.
- 07/11/2026 : budget complémentaire d'1 € accordé pour des photos de restaurant. Dépensé : **0,53 $** (12 photos). Total réel OpenAI : environ **2,35 $**, plus d'éventuelles tentatives coupées le 06/11 (à vérifier dans Usage).
