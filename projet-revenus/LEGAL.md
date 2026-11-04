# LEGAL.md — Liste de vérification juridique et administrative

> Il s'agit d'informations générales, rassemblées à partir de sources officielles quand elles existent (voir SOURCES.md). Ce n'est pas un conseil juridique personnalisé. En cas de doute : guichet de l'URSSAF, service des impôts des entreprises, CCI ou chambre de métiers.

## 1. Statut
- [ ] Créer la micro-entreprise **uniquement** sur formalites.entreprise.gouv.fr (gratuit). Des sites privés facturent ce service : ils ne sont pas obligatoires.
- [ ] Activité déclarée : « création de sites internet ». Notez si elle est classée en **BIC prestations de services** (cotisations d'environ 21,2 % en 2026) ou en **BNC** (environ 25,6 % en 2026). C'est ce qui fixe votre taux. Vérifiez sur autoentrepreneur.urssaf.fr.
- [ ] Renseignez-vous sur l'**ACRE** (réduction de cotisations la première année) au moment de la création. Les règles ont évolué en 2026 : vérifiez votre éligibilité auprès de l'URSSAF.
- [ ] Franchise en base de TVA : en dessous de 37 500 € de chiffre d'affaires annuel en services (seuil 2026 d'après des sources secondaires), pas de TVA. Il faut alors écrire sur les devis et factures : « TVA non applicable, article 293 B du CGI ».
- [ ] Déclarer le chiffre d'affaires chaque mois ou chaque trimestre sur autoentrepreneur.urssaf.fr, **même s'il est de 0 €**.
- [ ] Tenir un livre des recettes : le fichier `crm/donnees/ventes.csv` peut servir de base, à compléter avec le mode de paiement.

## 2. Facturation
- **Outil :** le Cockpit (onglets Facturation et Légal) crée des devis, factures et avoirs conformes en PDF, tient le livre des recettes et prépare la déclaration URSSAF. Voir `docs/COCKPIT.md`.
- [ ] Mentions obligatoires sur chaque facture : voir `ventes/facture_modele.md`.
- [ ] Facturation électronique : vous devez déjà pouvoir **recevoir** des factures électroniques (depuis le 1er septembre 2026). L'**émission** sera obligatoire pour les micro-entreprises à partir du 1er septembre 2027. Choisissez une plateforme agréée avant cette date (l'administration publie la liste des plateformes).

## 3. Votre propre site (page de l'offre)
- [ ] Mentions légales complètes (`site/mentions-legales.html`) : remplacer **chaque** `[À COMPLÉTER]`, y compris les coordonnées exactes de l'hébergeur.
- [ ] Pas de faux avis, pas de fausses références : les démos sont signalées comme « exemple fictif ».
- [ ] Aucun cookie de mesure d'audience ou de publicité n'est utilisé. Si vous en ajoutez un jour, il faudra un bandeau de consentement.
- [ ] Polices de caractères : le site utilise les polices du système, pas Google Fonts, ce qui évite tout transfert de données vers Google.

## 4. Prospection (règles intégrées aux modèles de messages)
- **Email à un professionnel** : autorisé sans consentement préalable si le message est **en rapport avec sa profession**. Il doit dire **qui vous êtes** et offrir **un moyen simple de refuser** les messages suivants (CNIL). Les adresses génériques (contact@, info@) d'une société ne sont pas soumises à ces principes, mais nous appliquons quand même la même politesse.
- **Ne pas deviner** d'adresses email nominatives (prenom.nom@…) : la CNIL a précisé en octobre 2026 que cette pratique n'est ni automatique ni systématiquement licite.
- **Téléphone** : depuis le 11 août 2026, le démarchage téléphonique des **consommateurs** exige leur consentement préalable (DGCCRF). Le démarchage **entre professionnels** n'est pas concerné, mais il reste soumis au RGPD. En pratique, n'appelez que des **numéros professionnels publiés**, pour parler de **leur activité**. Si un numéro semble être celui d'une personne à titre privé, privilégiez la visite ou l'email professionnel.
- **Numéros trouvés sur OpenStreetMap** (`outils/prospects_osm.py`) : ce sont des numéros publiés pour l'activité (commerces et artisans). Les données sont sous licence ODbL : usage interne de prospection, source notée dans chaque fiche, et mention « © contributeurs OpenStreetMap » en cas de publication.
- **Droit d'opposition** : toute personne qui dit non ou « stop » passe en `ne_pas_contacter`, ce qui est définitif. L'outil de prospection exclut d'office les entreprises qui ont fait opposition à l'usage commercial de leurs données dans le répertoire Sirene.
- **Durée de conservation** : supprimez les prospects sans suite au bout de 3 ans après le dernier contact.
- **Données des prospects** : elles sont stockées uniquement dans `crm/donnees/`, dossier **exclu de Git** (fichier .gitignore). Elles ne sont donc jamais publiées sur GitHub ni sur le site.

## 5. Sites des clients
- [ ] Chaque site client a des mentions légales générées automatiquement. Le générateur signale les champs manquants.
- [ ] Les photos et logos sont fournis par le client, qui confirme en avoir les droits (questionnaire).
- [ ] Aucune affirmation invérifiable (« n° 1 », labels non justifiés).
- [ ] L'hébergement et le nom de domaine sont **au nom du client**. Vous ne conservez jamais ses mots de passe.

## 6. Hébergement : conditions d'utilisation
- La formule gratuite **Vercel Hobby** est réservée à un usage **personnel et non commercial** (documentation de Vercel). Ne l'utilisez pas pour l'activité ni pour les sites des clients.
- Netlify indique sur son blog officiel que sa formule gratuite permet les projets commerciaux. Relisez ses conditions à l'inscription, car elles peuvent changer.
- Cloudflare Pages sert de solution de remplacement (usage commercial autorisé d'après des sources secondaires, à confirmer dans ses conditions).

## 7. Assurance (recommandée, non obligatoire)
- [ ] Demander 2 ou 3 devis de responsabilité civile professionnelle pour l'activité « création de sites web ». 🔐 Rien n'est souscrit sans votre accord.

## 8. Belgique et Suisse
Les règles de prospection (email, téléphone), de facturation (autoliquidation, DES, mentions TVA) et de mentions légales propres à ces deux pays sont détaillées dans **[MARCHES.md](MARCHES.md)**. À faire valider par un comptable avant la première vente dans chacun de ces pays.
