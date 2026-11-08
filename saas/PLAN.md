# MySite — plan du SaaS (version du 08/11/2026)

Objectif : transformer le cockpit privé en **logiciel en ligne par abonnement**. Chaque inscrit a son propre cockpit, avec :
- les prospects de sa région ;
- son pipeline de vente ;
- l'IA de rédaction ;
- le Studio de maquettes.

Le paiement passe par Stripe.

> Ce document est un plan de travail, pas un avis juridique. Les points marqués ⚖️ doivent être relus par un avocat (RGPD, droit de la consommation) **avant l'ouverture au public**. Un relecteur coûte en général 500 à 1 500 € pour des CGV et une politique de confidentialité de SaaS. C'est une dépense à décider.

---

## 1. Pour qui, et quelle promesse

**Cible principale** : les débutants et indépendants qui veulent vendre des sites ou des services aux commerces locaux (freelances web, étudiants, reconversions, petites agences). C'est le public qui verra les vidéos TikTok et Instagram.

**Cible secondaire** : les artisans et prestataires B2B qui cherchent des clients professionnels (nettoyage, comptabilité, photographes…). Cela suppose plus tard d'ouvrir d'autres secteurs que la création de sites.

**Promesse** : « Choisissez votre secteur et votre région : MySite trouve les commerces sans site, vous prépare les messages et une maquette pour chacun, et suit vos ventes. »

**Ce que nous ne promettons pas** : un revenu. Aucun chiffre de gains, aucun « 1 000 €/mois garantis ». C'est une pratique commerciale trompeuse (Code de la consommation, articles L121-2 et suivants), sanctionnée lourdement par la DGCCRF.

---

## 2. Offres et prix

### Repères du marché (novembre 2026)
- **Kaspr** (données de contact B2B) : gratuit avec 15 e-mails et 5 téléphones par mois, puis environ 59 € HT par mois (Starter) et 99 € HT par mois (Business). Environ 45 € et 79 € en annuel. [Sources : emelia.io, saleshandy.com]
- **Pharow** (base B2B française) : essai de 100 crédits, puis environ 99 à 149 € par mois selon les estimations publiques (tarif non affiché). [Source : derrick-app.com]
- Ces outils visent des équipes commerciales. Notre public, débutant et venu des réseaux sociaux, est **plus sensible au prix**, mais il achète un résultat complet : prospects, messages, maquettes et suivi.

### Ce que coûte un client (pour fixer des prix rentables)

| Poste | Coût estimé |
|---|---|
| IA, message de prospection (Claude Opus 5.5) | ~0,02 $ |
| IA, étude d'établissement et site sur mesure | ~0,30 à 0,60 $ |
| Hébergement (Vercel et Supabase) | 0 € au départ, puis ~45 € par mois au-delà des offres gratuites |
| Stripe (carte européenne) | 1,5 % + 0,25 € par paiement |
| Données (Sirene, OpenStreetMap) | gratuites, avec des limites d'usage |

### Grille proposée (prix TTC ; TVA non applicable tant que la franchise en base s'applique)

| | **Gratuit** | **Pro** | **Premium** ⭐ | **Ultra** |
|---|---|---|---|---|
| Prix mensuel | 0 € | **29 €** | **59 €** | **119 €** |
| Prix annuel (2 mois offerts) | — | 290 € | 590 € | 1 190 € |
| Zone | 1 département | 3 départements | 10 départements | France entière |
| Prospects ajoutés par mois | 15 | 300 | 1 000 | 3 000 |
| Messages IA par mois | 10 | 300 | 1 000 | 3 000 |
| Sites sur mesure IA par mois | 0 (1 maquette express) | 10 | 40 | 120 |
| Pipeline, rappels, carte | ✓ | ✓ | ✓ | ✓ |
| Export CSV | — | ✓ | ✓ | ✓ |
| Devis et factures | — | — | ✓ | ✓ |
| Mention « Fait avec MySite » sur les maquettes | oui | non | non | non |
| Utilisateurs | 1 | 1 | 1 | 3 |

**Pourquoi ces prix**
- **29 €** est la porte d'entrée. C'est moins qu'un abonnement de téléphone, et cela se rembourse avec **une seule vente** de site (un site vitrine se vend 120 à 490 €). Ce calcul simple est l'argument central des vidéos, présenté sans promesse de résultat.
- **59 € est mis en avant** (« le plus choisi »). L'offre à 119 € sert d'**ancre** : à côté d'elle, 59 € paraît raisonnable. Le Premium est conçu pour être l'offre de meilleure valeur.
- **Marge** : un Pro qui utilise tout son quota coûte environ 300 × 0,02 + 10 × 0,5 ≈ 11 $ d'IA. La marge reste supérieure à 50 %. La plupart des abonnés n'utilisent pas tout.
- **Annuel à -17 %** (2 mois offerts) : de l'argent encaissé tout de suite et moins de départs.

### Passer du gratuit au payant, sans piège

Le gratuit doit **faire goûter la valeur**, puis **montrer clairement la limite**. Il ne doit pas piéger.
- **Leviers efficaces et légaux** :
  - quota de 15 prospects : on voit la qualité, mais on en veut plus ;
  - 1 seule zone ;
  - pas de site sur mesure IA : on voit la maquette express, et le site sur mesure se débloque en Pro ;
  - la mention « Fait avec MySite » ;
  - les rappels de quota (« 12 prospects sur 15 utilisés ce mois-ci ») ;
  - un comparatif clair au moment où l'on bute sur la limite ;
  - **un essai Premium de 7 jours**, sans carte et une seule fois.
- **Interdit (« dark patterns »)** :
  - faux compte à rebours, faux « plus que 3 places » ;
  - cases précochées ;
  - frais cachés ;
  - résiliation difficile ;
  - données de l'utilisateur prises en otage.

  Le règlement européen sur les services numériques (DSA, article 25) et le Code de la consommation l'interdisent. **La résiliation doit se faire en 3 clics depuis l'espace client** (loi du 16 août 2022), ce que fait le portail client de Stripe.
- **Les données restent à l'utilisateur** : en gratuit, il garde l'accès en lecture à ses prospects et à son historique. On bloque l'ajout, pas la consultation.

---

## 3. Parcours utilisateur
1. **Vidéo** (TikTok, Instagram), puis le lien en bio, puis la page d'accueil MySite (promesse, démonstration, tarifs).
2. **Inscription** : e-mail et mot de passe ou lien magique, acceptation des CGU et CGV (case non précochée), déclaration « j'agis à titre professionnel » ou « je me lance ».
3. **Accueil guidé** : choix du secteur à démarcher (restaurants, snacks, artisans du bâtiment, beauté…) et des départements, selon l'offre.
4. **Premiers prospects** : MySite interroge les sources publiques et remplit le cockpit. Chaque fiche montre ses **indices** (cuisine, vente à emporter, code d'activité…).
5. **Action** : messages IA, maquette, appel, puis on note le résultat dans le pipeline.
6. **Limite atteinte** : comparatif des offres, paiement par Stripe Checkout, retour immédiat au cockpit débloqué.

---

## 4. Cadre légal ⚖️ (le cœur du sujet)

### 4.1 Les données de prospects (RGPD) — le risque principal
- Une entreprise individuelle (« Serrière Olivier, plombier ») est **une personne physique** : ses nom, téléphone et adresse sont des **données personnelles**. La CNIL a sanctionné des vendeurs et des acheteurs de fichiers : Hubside, 525 000 € en 2024, pour une prospection faite à partir de fichiers achetés. [Source : donneespersonnelles.fr]
- **Notre choix** : MySite **ne vend pas de fichier**. C'est un **outil de recherche** dans des **registres publics officiels**, comme le font les annuaires d'entreprises légaux. Garde-fous, intégrés au code :
  1. **Sources** : base Sirene (API Recherche d'entreprises de l'État, licence ouverte) et OpenStreetMap (licence ODbL), uniquement des coordonnées **publiées pour l'activité professionnelle**.
  2. **Exclusion automatique** des entrepreneurs qui ont demandé que leurs données ne soient pas diffusées (statut de diffusion Sirene « P ») et des établissements fermés.
  3. **Liste d'opposition commune** : une page publique « Retirer mon entreprise de MySite ». Une fois retirée, l'entreprise disparaît **pour tous les utilisateurs** et ne sera plus jamais proposée.
  4. **Information des personnes (article 14 du RGPD)** : une politique de confidentialité dédiée aux « professionnels référencés », et une mention de la source et du droit d'opposition dans les modèles de messages.
  5. **Durée de conservation** : un prospect sans échange depuis 3 ans est supprimé.
  6. **Pas de données de particuliers**, uniquement des établissements actifs.
- **OpenStreetMap (ODbL)** : citer « © contributeurs OpenStreetMap », et rendre disponible sur demande, sous licence ODbL, la base dérivée des données OSM.
- **Rôles** : MySite est **responsable de traitement** pour la base de référence. Chaque utilisateur est **responsable de sa propre prospection**. Les CGU l'engagent à respecter les règles (prospection B2B liée à l'activité de la personne, mention STOP, pas de démarchage des particuliers inscrits sur Bloctel).
- **À faire avant l'ouverture** : registre des traitements, analyse d'intérêt légitime documentée, contrats avec les sous-traitants (Supabase, Vercel, Anthropic, Stripe), choix d'hébergement en UE si possible (Supabase propose Francfort ou Paris).

### 4.2 La prospection faite par les utilisateurs
- **E-mail et SMS vers des professionnels** : autorisés sans consentement préalable si le message concerne leur activité, à condition **d'identifier l'expéditeur** et d'offrir un **moyen simple de s'opposer**.
- **Appels** : les professionnels ne relèvent pas de Bloctel, mais un entrepreneur individuel joint sur son portable personnel peut le devenir. Prudence, et respect immédiat des refus.
- Le cockpit intègre : des modèles conformes, une liste STOP partagée, et des limites d'envoi quotidiennes (anti-spam).

### 4.3 Vente de l'abonnement (droit de la consommation, car beaucoup de débutants seront des particuliers)
- **Prix affichés TTC**, durée, reconduction et conditions de résiliation clairs avant le paiement.
- **Droit de rétractation de 14 jours** pour un consommateur. Pour démarrer tout de suite, il faut une **case dédiée non précochée** : « Je demande l'accès immédiat et je reconnais perdre mon droit de rétractation une fois le service pleinement exécuté » (Code de la consommation, article L221-28). Sinon, remboursement au prorata.
- **Résiliation en 3 clics** depuis l'espace client (portail Stripe).
- **Médiateur de la consommation** obligatoire (adhésion de 50 à 150 € par an) : **dépense à décider**.
- **Factures** automatiques par Stripe, avec la mention « TVA non applicable, art. 293 B du CGI » tant que la franchise s'applique.

### 4.4 Entreprise et paiement
- **Stripe exige une entreprise déclarée**. La micro-entreprise suffit au démarrage : activité de **services, édition de logiciel en ligne**, à créer sur formalites.entreprise.gouv.fr. C'est gratuit, et c'est vous qui le faites.
- Vérifier le nom « MySite » sur l'INPI (classes 9, 35 et 42). Un nom très générique est difficile à protéger : envisager une variante distinctive (étape déjà notée).

### 4.5 Les vidéos marketing générées par IA ⚖️

Votre idée : une jeune femme créée par IA appelle des commerçants, la conversation dure 30 secondes, puis « faites comme moi, lien en bio ». C'est possible, **à ces conditions** :
1. **Afficher clairement que c'est de l'IA et une mise en scène.** Mentions « Image virtuelle » et « Scène fictive générée par IA » à l'écran pendant toute la vidéo, plus le label « contenu IA » de TikTok et Instagram. Base légale : loi Influence de 2023 (mention « Image virtuelle » pour un visage ou une silhouette généré par IA dans un contenu commercial), AI Act européen (article 50, transparence des contenus synthétiques, applicable à partir d'août 2026), règles des plateformes.
2. **Signaler que c'est une publicité** : « Publicité MySite » ou le paramètre « contenu de marque » de la plateforme.
3. **Pas de faux résultats.** Le personnage ne dit pas « j'ai gagné 3 000 € ce mois-ci » et ne présente pas de faux témoignage. Il peut montrer *comment* on utilise l'outil.
4. **Les « prospects » de la vidéo sont fictifs.** Ni le nom, ni la voix, ni la devanture d'un vrai commerce. Ne jamais cloner une voix réelle.
5. **« Faites comme moi » devient « Essayez gratuitement »** : le personnage est fictif, donc il ne peut pas prétendre être un vrai utilisateur.

Exemple de script conforme :
> [Bandeau en haut : « Personnage et scène générés par IA · Publicité MySite »]
> — « Bonjour, la pizzeria Bella ? Je vous appelle parce que je n'ai pas trouvé votre site sur Google… » (le commerçant fictif répond)
> — À la fin, face caméra : « Les commerces à appeler, le message et la maquette : c'est MySite qui me les prépare. Essai gratuit, lien en bio. »

---

## 5. Architecture technique

- **Application web Next.js** (dossier `saas/app`), hébergée sur Vercel.
- **Supabase** : authentification et base Postgres. **Chaque table est protégée par des règles par utilisateur (RLS)** : un utilisateur ne voit jamais les données d'un autre.
- **Stripe** :
  - Checkout pour les abonnements ;
  - portail client pour changer d'offre, mettre à jour la carte ou résilier ;
  - webhooks signés et traités une seule fois, qui mettent à jour l'offre de l'utilisateur.
- **Prospects** :
  - source principale : l'API Recherche d'entreprises (Sirene), interrogée côté serveur par département et par code d'activité ;
  - téléphone ajouté depuis OpenStreetMap ;
  - mise en cache partagée pour ne pas solliciter les API publiques plusieurs fois.
- **IA** : l'API Claude côté serveur (clé d'API Anthropic). Quotas vérifiés avant chaque appel, coût suivi par utilisateur.
- **Le cockpit actuel** (l'artefact Claude) reste votre outil personnel. Ses fonctions sont reprises une à une dans l'application : pipeline, fiche, IA, carte, Studio. Le code de génération de sites (`pageSM`, `pageS`) est réutilisable tel quel côté serveur.

---

## 6. Feuille de route

| Phase | Contenu | État |
|---|---|---|
| 0 | Plan, prix, cadre légal | ✅ ce document |
| 1 | Socle : inscription, accueil guidé, offres et quotas, Stripe, recherche de prospects conforme, page d'opposition, pages légales en brouillon | 🔨 commencé (`saas/app`) |
| 2 | Cockpit dans l'application : exclusivité des prospects, fiche, pipeline, journal, rappels, messages IA | ✅ fait, carte de France comprise |
| 3 | Studio : maquette express, étude d'établissement et site sur mesure par l'IA, retouches IA, panneau de modification dont la puissance dépend de l'offre, versions, téléchargement | fait (code et tests ; appel IA réel à valider avec la clé Anthropic) |
| 3 bis | Vente complète : mise en ligne en un clic (sous-domaine ou domaine du client, mentions légales), export CSV, devis/factures/avoirs conformes, assistant de livraison, Académie (17 leçons, vidéos interactives, progression, missions) | fait (code et tests ; à valider en production : domaine des sites, jeton Vercel, fond de carte) |
| 4 | Pages légales relues par un avocat, médiateur, registre RGPD, tests de paiement réels | à faire, avec vous |
| 5 | Lancement : vidéos IA conformes, page d'accueil, suivi des inscriptions | à faire |

---

## 7. Ce qu'il vous faudra faire (je ne peux pas le faire à votre place)

1. **Créer la micro-entreprise** (gratuit). Le numéro SIRET est indispensable pour Stripe et les mentions légales.
2. **Créer les comptes** et me donner l'accès par les mécanismes sécurisés (jamais de mot de passe dans le chat) :
   - **Supabase** : offre gratuite au départ, région UE ;
   - **Stripe** : mode test d'abord ;
   - **Vercel** : offre gratuite au départ ;
   - **Anthropic** : clé d'API, payante à l'usage. **Budget à fixer**, par exemple une limite de 20 $ par mois au démarrage.
3. **Acheter un nom de domaine**, environ 10 à 15 € par an. **Dépense à valider.**
4. **Décider** : relecture par un avocat, adhésion à un médiateur de la consommation.
5. **Valider les prix** ci-dessus, ou me demander d'autres scénarios.

Sources :
- [Kaspr : tarifs 2026 (emelia.io)](https://emelia.io/hub/kaspr-pricing), [saleshandy.com](https://www.saleshandy.com/blog/kaspr-pricing/)
- [Pharow : tarifs (derrick-app.com)](https://derrick-app.com/fr/tools/pharow-pricing)
- [Achat de fichiers de prospection : règles 2026 (donneespersonnelles.fr)](https://www.donneespersonnelles.fr/achat-fichier-prospection)
- [CNIL : vente de fichiers clients](https://www.cnil.fr/fr/node/897)
- [Encadrement juridique de l'IA en 2026 (avocat.fr)](https://consultation.avocat.fr/blog/romain-briere/article-2982080-ia-l-encadrement-juridique-de-l-intelligence-artificielle-en-2026.html)
- [Question écrite au Sénat, avril 2026, sur la mention « image virtuelle »](https://www.senat.fr/questions/base/2026/qSEQ26041070S.html)
