# PROGRESS.md — Avancement, problèmes et prochaines étapes

_Dernière mise à jour : 4 novembre 2026 (refonte des sites clients)._

## Indicateurs réels
| Indicateur | Valeur | Commentaire |
|---|---|---|
| Prospects contactés | **0** | 40 prospects trouvés et 6 aperçus prêts ; aucun contact sans votre accord |
| Ventes | **0** | — |
| Chiffre d'affaires | **0 €** | — |
| Dépenses engagées | **0 €** | Aucun budget approuvé |
| Publicités diffusées | **Aucune** | Textes seulement préparés (`marketing/annonces.md`) |
| Messages envoyés à des prospects | **Aucun** | Modèles seulement préparés |
| Publications | **Aucune** | Brouillons seulement préparés |

## Journal
### 03/11/2026 — Phases 0 et 1 terminées
**Fait :**
- Étude de 8 modèles économiques, plus 2 écartés, et choix du **site vitrine à prix fixe pour TPE locales** (BUSINESS_MODEL.md, avec sources dans SOURCES.md).
- Plan en 7 phases (PLAN.md), budget à 0 € (BUDGET.md), liste de vérification juridique (LEGAL.md).
- Outils construits et testés :

| Livrable | Preuve |
|---|---|
| `outils/generer_site.py` + 2 modèles (artisan, commande WhatsApp) | 7 tests automatisés OK. Démos générées dans `site/exemples/` |
| `outils/trouver_prospects.py` (API officielle Sirene) | Exécution réelle OK le 03/11/2026 (mode essai, rien enregistré) + 2 tests OK |
| `outils/crm.py` + `outils/rapport.py` (rapport + tableau de bord) | 6 tests OK. Rapport et tableau de bord générés sur des données fictives (`crm/exemple/`) et vérifiés visuellement |
| Page de l'offre `site/` (accueil, mentions légales, remerciement) | Vérification navigateur : 0 erreur JS, 0 débordement à 375 px et 1 280 px, liens internes valides |
| Parcours panier → WhatsApp (modèle commande) | Test navigateur : ajout, quantité, message pré-rempli et total corrects |
| Marketing : stratégie, objections, 9 modèles de messages, publicités (longueurs vérifiées), calendrier sur 4 semaines, 2 visuels SVG | Relu. Visuels contrôlés après rendu |
| Vente : devis, facture, CGV (projet), questionnaire, liste de vérification de livraison | Relus |

- **Total des tests : 15 tests unitaires OK, et vérification navigateur OK sur 6 pages × 2 largeurs.**

**Problèmes et limites identifiés :**
1. Le chiffre « part des TPE sans site » (environ 20 %) vient d'une source secondaire. À confirmer dans le rapport France Num 2025.
2. Les taux de cotisations 2026 (BNC 25,6 %) et le seuil de TVA (37 500 €) viennent de sources concordantes mais en partie secondaires. À vérifier sur urssaf.fr et impots.gouv.fr à la création.
3. Le formulaire Netlify n'est vérifiable qu'après la mise en ligne (phase 3).
4. La boutique AMY Store a été retirée du dépôt à votre demande. **Le site déjà publié sur Vercel reste en ligne** tant que vous n'avez pas supprimé le projet dans Vercel.
5. Nom choisi : « Mysite ». Vérification INPI impossible en automatique (la base bloque les robots) : **à faire par vous sur data.inpi.fr**. Les domaines mysite.fr, mysite.com et mysite.ch sont déjà pris ; mysite-pro.fr était libre le 03/11/2026. Nom très générique : faible protection en tant que marque.
6. Zone définie : France entière + Belgique francophone + Suisse romande. La recherche automatique de prospects ne couvre que la France ; la Belgique et la Suisse demandent une recherche manuelle ou des accès à obtenir (MARCHES.md).

### 03/11/2026 (soir) — Extension à la Belgique et à la Suisse
- Zone élargie à toute la France, la Belgique francophone et la Suisse romande, avec une vente à distance.
- Recherche des règles propres à chaque pays (prospection, facturation, sources de données), synthétisée dans MARCHES.md.
- Générateur : nouveau champ `pays` (FR, BE ou CH) qui adapte les mentions légales (SIRET, BCE ou IDE ; CNIL, APD ou PFPDT).
- Suivi : nouvelle colonne `pays`, et rapport par pays.
- Recherche de prospects : plusieurs départements possibles en une seule commande. Test réel réussi sur les départements 59 et 62.
- Tests : 16 tests unitaires OK.

### 03/11/2026 (nuit) — Modèles de sites clients refaits
- Recherche sur ce qui fait vendre par métier (`docs/CONVERSION.md`).
- 3 modèles : **artisan**, **commande WhatsApp** (métiers de bouche) et **beauté** (nouveau). Ils incluent : grande photo, note et avis, bande de confiance, galerie, prix, étapes, FAQ, « ouvert maintenant », barre d'action mobile, panier avec retrait ou livraison et date.
- 14 photos libres de droits (CC0, Wikimedia Commons) pour les démos, avec leurs crédits. Les vrais sites utiliseront les photos des clients.
- Avis : uniquement de vrais avis pour les clients. Les démos portent un avertissement visible.
- Tests : 20 tests unitaires OK, et vérification navigateur OK (7 pages × 2 largeurs, images, panier).

### 03/11/2026 (nuit) — Nom « Mysite » et première prospection préparée
- Nom remplacé partout par **Mysite**. INPI : la base bloque les recherches automatiques (protection anti-robots), **vérification à faire par vous** sur data.inpi.fr. Domaines mysite.fr, .com et .ch déjà pris.
- Recherche de prospects corrigée : seulement des entreprises **créées depuis 2025** (et non de nouveaux établissements d'entreprises anciennes), métier vérifié, noms bien écrits (sigles conservés).
- **40 prospects** (Rhône, Loire, Isère) : 17 plombiers, 3 peintres, 7 traiteurs, 1 pâtisserie, 12 coiffure ou beauté. 9 vérifiés en ligne : aucun site trouvé.
- Nouvel outil `outils/preparer_apercus.py` : **6 aperçus** prêts (Imperial Habitat, JH Confort, TLBT Plomberie, Slay Station, Black Chic Coiffure, C'est Momo qui Régale). Aucun avis ni label inventé.
- **Personne n'a été contacté.** Les données des prospects restent hors de GitHub.
- Tests : 25 tests unitaires OK, vérification navigateur OK.

### 03/11/2026 (nuit) — Cockpit privé
- **Cockpit Mysite** publié (https://claude.ai/artifact/V6BmL9ZDXnEWohf6wTKba6) : 40 prospects et 6 aperçus chargés ; actions planifiées automatiquement ; ventes ; messages ; rédaction par Claude ; export CSV.
- Accès vérifié : la base n'est lisible que par le propriétaire (test au niveau « éditeur » et « lecteur » : rien de visible).
- Nouvel outil `outils/exporter_cockpit.py` pour ajouter de nouveaux prospects sans doublon. 26 tests OK.

### 03/11/2026 (nuit) — Design modernisé et bloc « Avis Google »
- Nouveau haut de page (texte et grande photo arrondie avec badge de note), en-tête translucide, cartes animées au survol, bande d'appel à l'action en couleur, bloc d'avis façon widget (note, nombre d'avis, cartes avec initiales).
- Aperçus des prospects : emplacement « Vos avis Google, mis en avant » **sans aucun avis inventé** (cartes vides). Leurs vrais avis seront ajoutés avec leur accord.
- 6 aperçus régénérés et remplacés dans le cockpit. 26 tests et vérification navigateur OK.

### 04/11/2026 — Cockpit IA
- Remise à zéro de la fiche Black Chic Coiffure (clics d'essai). Aucune vente d'essai à supprimer.
- Cockpit refait : briefing IA du jour, score de priorité expliqué, pipeline par glisser-déposer, assistant IA avec accès à vos données (lecture et programmation de relances), copilote de vente dans chaque fiche, recherche rapide Ctrl+K, nouveau design.
- Testé dans un navigateur avec une IA simulée (briefing, glisser-déposer, assistant et outils, copilote, recherche) : aucune erreur, affichage mobile correct. Données et règles d'accès vérifiées après publication (propriétaire seul).

### 04/11/2026 — Facturation et Légal dans le cockpit
- Devis, factures et avoirs numérotés, en PDF, avec les mentions obligatoires (EI, SIRET, mentions de TVA par pays, pénalités et 40 €), factures d'acompte et de solde depuis un devis, paiements et retards.
- Onglet Légal : informations d'entreprise, déclaration URSSAF (encaissé, cotisations, date limite), seuils TVA et micro, livre des recettes automatique avec export CSV, registre des oppositions, checklist de 12 obligations.
- Testé de bout en bout dans un navigateur avec une IA simulée : devis, puis acompte, puis paiement, puis livre des recettes, et PDF vérifiés (texte extrait et rendu visuel). Toutes les vues sans débordement à 400 px.

### 04/11/2026 — Site de l'agence refait au niveau « agence »
- Nouvelle direction artistique « fiche technique d'atelier » : filets plutôt que cartes, un seul accent, police de titre hébergée localement, aucun emoji, aucun dégradé décoratif.
- Source séparée (`site-src/`), construction par `outils/construire_site.py` à partir de `infos.json`, emplacements légaux « À COMPLÉTER » visibles, en-têtes de sécurité Netlify.
- Tests : QA complète (7 largeurs, liens, clavier, menu, formulaire, axe : 0 violation) ; Lighthouse mobile 99 / 100 / 100 / 100 et ordinateur 100 partout ; 28 tests unitaires.
- Auto-évaluation : 90/100 (détail dans le compte rendu). Emojis retirés des démos (icônes SVG).

### 04/11/2026 — Sites clients refaits au niveau « agence »
- Trois directions artistiques distinctes : artisan « carnet de chantier », commande « carte de maison », beauté « salon calme ». Polices hébergées localement, aucune carte empilée, aucun dégradé, aucun emoji (`docs/SITES_CLIENTS.md`).
- Générateur :
  - contraste AA garanti quelle que soit la couleur du client ;
  - photos converties en WebP avec `srcset` ;
  - favicon ;
  - formulaire désactivé sur les démos **et les aperçus** (avant, un aperçu pouvait tenter un envoi réel) ;
  - plus aucun bouton d'appel vide quand le numéro manque ;
  - textes adaptables au métier (un traiteur ne voit plus « Des chantiers récents »).
- Démos, captures du site de l'agence et 6 aperçus prospects régénérés. Captures des aperçus remplacées dans le cockpit.
- Preuves :
  - nouvelle QA `tests/qa_demos.js` (7 largeurs, clavier, formulaire, axe) : conforme sur les 3 démos et les 6 aperçus, 0 violation ;
  - panier vérifié ;
  - Lighthouse sur les démos : 97 à 100 en performance sur mobile, 100 sur ordinateur, et 100 en accessibilité, bonnes pratiques et référencement ;
  - QA du site de l'agence conforme ;
  - 30 tests unitaires OK.

## Paramètres de prospection (à compléter par vous)
- Zone : **toute la France, Belgique francophone, Suisse romande** (décision du 03/11/2026). Ordre : France → Belgique → Suisse (MARCHES.md)
- Premier lot de départements (semaine 1) : `69,42,38`
- Segment A (artisans) : codes NAF `43.22A,43.22B,43.21A,43.34Z,43.32A,81.30Z`
- Segment B (bouche / beauté) : codes NAF `56.21Z,56.10C,10.71D,96.02A,96.02B`
- Créés depuis : `2024-01-01` (entreprises jeunes, souvent sans site)

## Prochaines étapes
| # | Étape | Qui | Autorisation |
|---|---|---|---|
| 1 | Vérifier « Mysite » sur data.inpi.fr (classes 35 et 42) | 👤 | — |
| 2 | Créer la micro-entreprise (gratuit, formalites.entreprise.gouv.fr) | 👤 | — |
| 3 | Créer le compte Netlify et y déposer `site/` | 👤 | 🔐 Publication publique |
| 4 | Compléter mentions légales, devis et CGV avec votre SIRET | 🤖 dès réception | — |
| 5 | Lancer la première liste de 60 prospects (2 segments × 30) et 10 aperçus | 🤖 | — (aucun envoi) |
| 6 | Premiers contacts (5 par jour) | 👤 | 🔐 Prise de contact en votre nom |
| 7 | Supprimer l'ancien projet AMY Store dans Vercel, si vous voulez qu'il disparaisse d'internet | 👤 | 🔐 |
