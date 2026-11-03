# PLAN.md — Plan d'exécution

**Modèle retenu :** site vitrine à prix fixe pour TPE locales (voir [BUSINESS_MODEL.md](BUSINESS_MODEL.md)).
**Légende :** 🤖 = Claude peut le faire seul · 👤 = action de votre part · 🔐 = votre autorisation explicite est nécessaire.

---

## Phase 0 — Étude et cadrage ✅ (terminée)
- **Objectif :** choisir un modèle sur des éléments vérifiables.
- **Livrables :** BUSINESS_MODEL.md, SOURCES.md, PLAN.md, BUDGET.md.
- **Critère de fin :** le comparatif est fait, un modèle est choisi et sourcé. ✅
- **Coût :** 0 €.

## Phase 1 — Construire l'outillage ✅ (fait par Claude, voir PROGRESS.md pour les preuves)
- **Objectif :** que tout soit prêt pour prospecter et livrer un site sans rien dépenser.
- **Actions 🤖 :**
  - page de présentation de l'offre ;
  - 3 modèles de sites clients (artisan, commande WhatsApp, beauté) et le générateur d'aperçus ;
  - outil de recherche de prospects (API Sirene officielle) ;
  - système de suivi (fichiers CSV) et tableau de bord ;
  - rapport automatique ;
  - messages de prospection, publicités préparées et calendrier de contenu ;
  - documents commerciaux (devis, CGV, questionnaire client) ;
  - tests automatisés.
- **Outils :** Python (bibliothèque standard uniquement) et HTML/CSS/JS sans dépendance.
- **Critère de fin :** les tests automatisés passent (`python -m unittest` dans `projet-revenus/`) et une capture de chaque page est vérifiée.
- **Coût :** 0 €.
- **Risque :** bug dans un outil. **Parade :** tests automatisés, et chaque outil fonctionne aussi à la main.

## Phase 2 — Mise en place administrative 👤 (semaine 1)
- **Objectif :** pouvoir facturer légalement.
- **Actions :**
  1. 👤 Créer la micro-entreprise sur **formalites.entreprise.gouv.fr** (gratuit). Activité : « création de sites internet ». Notez la catégorie retenue (BIC ou BNC), car elle fixe le taux de cotisation.
  2. 👤 Choisir un nom définitif. « Enseigne Web » est un **nom provisoire** : vérifiez sur data.inpi.fr et chez un registraire de noms de domaine qu'il est libre.
  3. 👤 Créer une adresse email dédiée (gratuite), par exemple via Gmail.
  4. 🤖 Compléter les mentions légales, CGV et modèles de devis/facture avec votre SIRET (des emplacements sont prévus).
  5. 🔐 Facultatif : souscrire une assurance RC Pro (demander des devis, rien n'est souscrit sans vous).
- **Livrables :** SIRET obtenu, fichiers `ventes/*` complétés.
- **Critère de fin :** SIRET reçu, mentions légales sans aucun emplacement `[À COMPLÉTER]`.
- **Coût :** 0 € (assurance en option).
- **Risque :** sites payants qui imitent le guichet officiel. **Parade :** utiliser uniquement le site en `.gouv.fr`.

## Phase 3 — Mise en ligne de la page de l'offre 🔐 (semaine 1)
- **Objectif :** avoir une adresse à donner aux prospects.
- **Actions :**
  - 👤🔐 Créer un compte Netlify gratuit, avec votre email et votre mot de passe saisis **par vous**, jamais stockés dans les fichiers.
  - 👤🔐 Glisser-déposer le dossier `site/` (procédure dans `docs/DEPLOIEMENT.md`).
  - 🤖 Vérifier ensuite le site en ligne : affichage mobile, liens, formulaire.
- **Critère de fin :** la page est en ligne, le formulaire de test est reçu dans Netlify et les liens d'appel et WhatsApp fonctionnent.
- **Coût :** 0 € (nom de domaine facultatif, environ 10 à 15 €/an, 🔐).
- **Remplacement :** Cloudflare Pages.

## Phase 4 — Test de la demande, sans dépenser (semaines 2 à 5)
- **Zone :** toute la France, en commençant par des lots de 2 ou 3 départements par semaine (voir [MARCHES.md](MARCHES.md)). La vente se fait à distance (téléphone, visio, email).
- **Objectif :** mesurer de vrais taux de réponse **avant** d'investir du temps ou de l'argent.
- **Actions :**
  - 🤖 Chaque semaine, `outils/trouver_prospects.py` produit une liste de prospects dans votre zone (2 segments × 30 entreprises).
  - 👤 Vous complétez téléphone et site éventuel à partir des sources publiques (fiche Google, Pages Jaunes). Claude dans Chrome peut vous aider **sous votre supervision**, sans collecte massive automatisée.
  - 🤖 Pour les prospects les plus prometteurs, Claude génère un aperçu personnalisé (`outils/generer_site.py`).
  - 👤🔐 Prise de contact : visite en personne, appel ou email. **Rien n'est envoyé par Claude sans votre accord.** Les modèles de messages sont dans `marketing/messages_prospection.md`.
  - 🤖 Chaque lundi, mise à jour du suivi et rapport (`outils/rapport.py`).
- **Critère de fin :** 60 prospects contactés par segment, avec résultats saisis dans le suivi.
- **Règles de décision (appliquées par le rapport) :**
  - taux de réponse ≥ 10 % **et** au moins 1 rendez-vous → on **garde** ce segment et on augmente le rythme ;
  - taux de réponse entre 3 et 10 % → on **change le message ou le canal**, puis on retente 30 contacts ;
  - taux de réponse < 3 % après 60 contacts → on **abandonne** ce segment et on teste un autre métier ou une autre ville.
- **Coût :** 0 €.
- **Risque :** manque de temps. **Parade :** un minimum de 5 contacts par jour, préparés par Claude la veille.

## Phase 4 bis — Extension Belgique francophone et Suisse romande (après les 3 premières ventes en France)
- **Objectif :** ouvrir les deux autres marchés en respectant leurs règles de prospection et de facturation.
- **Actions :**
  - 👤 numéro de TVA intracommunautaire (gratuit) ;
  - 👤 se renseigner sur la DES pour la Belgique ;
  - 🔐 décider d'utiliser ou non les sources de données officielles (KBO, Zefix) ;
  - 🤖 adaptation des messages et des mentions légales (déjà prise en charge par le générateur via le champ `pays`).
- **Prospection :**
  - Belgique : téléphone, et email seulement vers les adresses génériques des sociétés ;
  - Suisse : téléphone (sauf numéros marqués d'un astérisque) et demandes entrantes ; **pas d'email à froid**.
- **Critère de fin :** 30 prospects contactés par pays, résultats saisis avec la colonne `pays`.
- **Les demandes entrantes** de Belgique et de Suisse sont acceptées dès maintenant.

## Phase 5 — Premiers clients pilotes (semaines 3 à 8)
- **Objectif :** 3 clients livrés et satisfaits, qui deviennent vos premières références.
- **Actions :**
  - 👤 Rendez-vous, appuyé sur le guide d'entretien ;
  - 🤖 Devis généré ;
  - 👤🔐 Signature et acompte par virement ;
  - 🤖 Production du site ;
  - 👤 Validation par le client ;
  - 👤🔐 Mise en ligne sur le compte du client ;
  - 🤖 Facture.
- **Livrables :** pour chaque client, un dossier `clients/<nom>/` (local, non versionné) contenant brief, devis, site et facture.
- **Critère de fin :** 3 sites en ligne, payés intégralement. Un avis n'est demandé que s'il est sincère.
- **Coût :** 0 €. Le domaine éventuel est payé par le client.
- **Risque :** demandes qui débordent du devis. **Parade :** le périmètre est écrit dans le devis.

## Phase 6 — Régularité et automatisation (mois 2 à 4)
- **Objectif :** 2 ventes par mois et la base de maintenance qui grandit.
- **Actions 🤖 :**
  - routine hebdomadaire Cowork : prospects, aperçus, relances et rapport (voir AUTOMATION.md) ;
  - calendrier de contenu ;
  - page « Réalisations » avec les vrais sites clients, avec leur accord.
- **Critère de fin :** 4 semaines consécutives avec au moins 20 contacts par semaine et le rapport hebdomadaire produit.
- **Coût :** 0 €.

## Phase 7 — Accélération (mois 4 et après, seulement si les mesures le justifient)
Uniquement si le coût d'acquisition mesuré le permet :
- 🔐 test de publicité payante (budget proposé dans MARKETING.md, **soumis à votre accord**) ;
- 🔐 paiement en ligne par Stripe ;
- 🔐 nom de domaine professionnel ;
- programme de parrainage.

**Critère pour lancer la publicité :** au moins 3 ventes obtenues grâce aux canaux gratuits, et un coût maximal acceptable par vente calculé à partir de la marge réelle.

---

## Routine type une fois lancé (environ 1 h 15 par jour de votre côté)
| Moment | Vous 👤 | Claude 🤖 |
|---|---|---|
| Lundi matin | Lire le rapport (10 min) | Rapport, nouvelle liste de prospects, relances du jour |
| Chaque jour | 5 contacts (45 min) et mise à jour du suivi (5 min) | Préparer les messages et les aperçus de la veille |
| Après chaque rendez-vous | Noter le résultat | Rédiger devis et compte rendu |
| Vendredi | Publier 1 contenu (🔐 à valider) | Rédiger le contenu de la semaine suivante |
