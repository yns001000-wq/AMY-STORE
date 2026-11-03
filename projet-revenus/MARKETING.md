# MARKETING.md — Stratégie marketing

> **Règle absolue :** tout ce qui figure dans ce dossier est **préparé, pas diffusé**. Aucune publication, aucun message à un prospect et aucune publicité payante ne part sans votre accord explicite. Quand une action sera réellement lancée, elle sera notée avec sa date dans PROGRESS.md.

---

## 1. Clients visés (profils)

### Segment A — l'artisan débordé
- **Qui** : plombier, électricien, peintre, menuisier, paysagiste. Souvent seul ou avec 1 ou 2 salariés, installé depuis 0 à 3 ans.
- **Ce qu'il vit** : son travail vient surtout du bouche-à-oreille, mais le client recommandé le cherche sur Google avant d'appeler. Le soir, il fait ses devis. Il n'a ni le temps ni l'envie de « faire un site ».
- **Ce qu'il veut** : paraître sérieux, être appelé, ne pas être embêté.
- **Où le trouver** : répertoire Sirene (codes NAF 43.xx et 81.xx), sur ses chantiers, chez les fournisseurs (négoces de matériaux, le matin tôt), dans les groupes Facebook locaux d'artisans.

### Segment B — la petite entreprise de bouche ou de beauté qui vit sur WhatsApp et Instagram
- **Qui** : traiteur, pâtissier à domicile, snack, food truck, coiffeuse, esthéticienne, onglerie.
- **Ce qu'elle vit** : elle reçoit les commandes ou rendez-vous en messages privés, dans le désordre, et répète sans cesse la même carte et les mêmes prix.
- **Ce qu'elle veut** : une carte propre à partager, des commandes claires et aucune commission.
- **Où la trouver** : Sirene (56.xx, 10.71x, 96.02x), Instagram local (mots-clés de la ville), marchés et salons.

---

## 2. Objections et réponses (à utiliser à l'oral comme à l'écrit)

| Objection | Réponse honnête |
|---|---|
| « J'ai assez de travail. » | « Tant mieux ! Le site sert surtout aux personnes qu'on vous recommande : elles vous cherchent avant d'appeler. Si elles ne trouvent rien, certaines appellent quelqu'un d'autre. 390 €, une fois, et c'est réglé. » |
| « Ma page Facebook suffit. » | « Elle est très bien pour vos habitués. Un site apparaît mieux dans Google et ne demande pas de compte pour être consulté. Les deux se complètent : votre site renvoie vers votre page. » |
| « Mon neveu peut me le faire. » | « C'est une très bonne option s'il a le temps. Notre différence : délai garanti de 5 jours, mentions légales faites, et quelqu'un à appeler si quelque chose ne va pas. » |
| « Wix, c'est moins cher. » | « Wix coûte environ 12 à 17 €/mois, et c'est vous qui construisez le site. Chez nous, c'est payé une fois et c'est fait pour vous. Au bout de 2 ans, le coût est comparable, sans le temps passé. » |
| « On m'a déjà vendu un site très cher qui n'a rien rapporté. » | « Je comprends. C'est pour cela que nous ne vous engageons sur rien : vous voyez l'aperçu gratuit d'abord, le prix est fixe et il n'y a pas d'abonnement. Je ne vous promets pas de clients, je vous promets un site propre et livré. » |
| « Je n'ai pas le temps. » | « 15 minutes au téléphone, c'est tout ce qu'il nous faut. Nous rédigeons les textes, vous n'avez qu'à relire. » |
| « Vous êtes nouveau, pourquoi vous faire confiance ? » | « C'est vrai, nous démarrons. C'est pour cela que vous ne payez rien avant d'avoir vu l'aperçu, et que l'acompte n'est que de 50 %. » |
| « Est-ce que je serai premier sur Google ? » | « Personne ne peut honnêtement vous le garantir. Votre site sera construit correctement, et la fiche Google, en option, est ce qui compte le plus pour les recherches locales. » |

---

## 3. Stratégie d'acquisition (canaux gratuits d'abord)

**Zone : toute la France, la Belgique francophone et la Suisse romande.** La vente se fait à distance. Les règles diffèrent selon le pays, surtout pour l'email : voir **[MARCHES.md](MARCHES.md)** avant tout contact en Belgique ou en Suisse.

**Hypothèse centrale à vérifier : l'aperçu personnalisé.** Montrer au prospect « son » site déjà maquetté devrait obtenir beaucoup plus de réponses qu'un message générique. Claude produit cet aperçu en quelques minutes avec `outils/generer_site.py --apercu`.

**Règle de confidentialité :** l'aperçu n'est **jamais publié en ligne** sans l'accord du prospect. On le montre sur votre téléphone, ou en capture d'écran jointe à l'email.

| # | Canal | Coût | Effort | Utilisation | Ordre de test |
|---|---|---|---|---|---|
| 1 | **Visite en personne** (commerces, ateliers) avec l'aperçu sur téléphone | 0 € | Élevé | Seulement autour de chez vous, en complément de la vente à distance | Semaine 2 |
| 2 | **Appel téléphonique** au numéro professionnel public, puis rendez-vous en visio (Google Meet, gratuit) | 0 € | Moyen | Canal principal à distance, dans les 3 pays. En Suisse, jamais vers un numéro marqué d'un astérisque (\*). Mardi à jeudi, 10h-11h30 ou 14h-16h | Semaine 2 |
| 3 | **Email professionnel** avec la capture d'écran de l'aperçu | 0 € | Faible | France : adresse professionnelle publiée. Belgique : **seulement** l'adresse générique d'une société (info@…). Suisse : **pas d'email à froid**. Désinscription dans chaque message | Semaine 3 |
| 4 | **Message Instagram** (segment B) | 0 € | Faible | Pour les comptes professionnels uniquement, avec un message personnalisé, jamais en masse | Semaine 3 |
| 5 | **Réseau personnel** (famille, amis, anciens collègues) | 0 € | Faible | Annonce unique : « je lance mon activité, connaissez-vous un artisan sans site ? » | Semaine 1 |
| 6 | **Fiche Google** de votre propre activité, une fois immatriculé | 0 € | Faible | Être trouvé sur « création site internet + ville » | Semaine 2 |
| 7 | **Groupes Facebook locaux** (entrepreneurs, commerçants de la ville) | 0 € | Faible | Contenu utile, sans spam. Respecter le règlement de chaque groupe | Semaine 4 |
| 8 | **Parrainage** : 30 € de réduction pour le client qui recommande, et 30 € pour le filleul | Coût seulement si vente | Faible | À partir du premier client satisfait | Phase 5 |
| 9 | **Publicité payante** (Google Ads ou Meta) | 🔐 Budget à approuver | — | Voir `marketing/annonces.md`. Seulement après 3 ventes obtenues gratuitement | Phase 7 |

**Ce qu'on s'interdit :**
- acheter des fichiers d'adresses ;
- deviner des adresses email personnelles ;
- envoyer des messages en masse ;
- dénigrer un concurrent nommément ;
- publier de faux avis ou de faux chiffres ;
- prétendre avoir des clients qu'on n'a pas.

---

## 4. Messages

Tous les modèles sont dans [`marketing/messages_prospection.md`](marketing/messages_prospection.md) :
- visite ;
- appel ;
- email initial et 2 relances ;
- message Instagram ;
- message au réseau personnel ;
- suite après un rendez-vous ;
- demande d'avis, uniquement s'il est sincère.

---

## 5. Publicités (préparées, **non diffusées**)

Voir [`marketing/annonces.md`](marketing/annonces.md) : textes et variantes, audiences, budget de test proposé (🔐 à approuver), concepts vidéo et indicateurs d'arrêt.

## 6. Calendrier de contenu

Voir [`marketing/calendrier_contenu.md`](marketing/calendrier_contenu.md) : 4 semaines de publications prêtes à relire, à faire valider par vous avant toute publication. Les visuels modifiables sont dans `marketing/visuels/`.

---

## 7. Mesure

Chaque contact est saisi dans `crm/donnees/prospects.csv`, avec son statut et son canal (règles dans `crm/STATUTS.md`). `outils/rapport.py` calcule chaque semaine :
- le taux de réponse par segment et par canal ;
- la conversion en vente ;
- le chiffre d'affaires et le revenu récurrent ;
- les actions du jour et les alertes ;
- la **décision par segment** : garder, ajuster ou abandonner, selon la règle de PLAN.md.

**Indicateurs clés à suivre :**
1. taux de réponse (objectif ≥ 10 %) ;
2. passage de la réponse au rendez-vous ;
3. passage du rendez-vous à la vente ;
4. temps passé par vente ;
5. coût d'acquisition (= dépenses marketing / ventes ; 0 € tant que tout est gratuit).

## 8. Tâches marketing récurrentes
| Fréquence | Tâche | Qui |
|---|---|---|
| Lundi | Rapport, puis 30 nouveaux prospects, puis 5 aperçus pour les plus prometteurs | 🤖 Claude, puis 👤 vous lisez |
| Chaque jour ouvré | 5 contacts et saisie dans le suivi | 👤 |
| Mercredi | Relances des contacts à J+3 et J+7 (liste fournie par le rapport) | 🤖 prépare, 👤 envoie |
| Vendredi | 1 publication (fiche Google, Instagram ou LinkedIn) | 🤖 rédige, 👤 valide et publie |
| Fin de mois | Bilan : quel segment, quel canal, quel message ont le mieux marché ? Mise à jour de ce fichier | 🤖 + 👤 |
