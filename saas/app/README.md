# MySite : l'application SaaS

Ce dossier contient le socle de la phase 1. Le plan complet est dans `../PLAN.md`.

## Ce qui fonctionne
- **Page d'accueil et tarifs** : Gratuit, Pro 29 €, Premium 59 €, Ultra 119 €, avec l'annuel à 2 mois offerts. Les offres viennent toutes de `src/lib/plans.ts`.
- **Inscription et connexion** par e-mail et mot de passe (Supabase Auth), avec confirmation de l'e-mail.
- **Accueil guidé** : prénom, secteur, départements, situation (professionnel ou particulier), acceptation des CGU et CGV.
- **Cockpit** :
  - quotas du mois et recherche de prospects dans la base Sirene, avec tous les garde-fous RGPD (`src/lib/sourcing.ts`) ;
  - liste des prospects avec liens pour trouver le numéro ;
  - incitation à passer à l'offre supérieure quand la limite est atteinte ;
  - pas d'essai des offres payantes : l'offre Gratuite, sans limite de durée, sert de découverte.
- **Abonnement** :
  - Stripe Checkout, avec la case de renonciation au délai de rétractation pour les particuliers ;
  - portail client Stripe pour changer d'offre, consulter les factures, changer de carte ou résilier en 3 clics ;
  - webhook signé et idempotent, seule source de vérité pour l'offre.
- **Chacun ses prospects** :
  - **isolation** : un utilisateur ne voit jamais les données d'un autre (RLS) ;
  - **exclusivité** : une entreprise n'est attribuée qu'à un seul utilisateur à la fois (table `attributions`, réservation atomique).

  L'entreprise est libérée si l'utilisateur la retire, ou si elle n'a jamais été contactée 60 jours après son attribution (anti-accaparement : `liberer_reservations_dormantes()`, à planifier chaque nuit).
- **Fiche prospect** : étape du suivi (8 étapes), coordonnées, liens pour trouver le numéro, prochaine action et date, notes, historique, retrait.
- **Pipeline** en colonnes, avec les rappels dus en rouge.
- **Messages IA** (Claude Opus 5.5, quota `messages_ia`) : SMS, e-mail ou script d'appel pour chaque prospect.
  - Les règles légales sont imposées : expéditeur identifié, mention STOP, aucun fait inventé.
  - Le quota est remboursé en cas d'échec.
  - Rien n'est envoyé automatiquement.
- **Studio de sites** (menu Studio, et bouton « Son futur site » sur chaque fiche prospect) :
  - **maquette express** instantanée et sans IA, pour toutes les offres ;
  - **site sur mesure par l'IA**, en 2 temps :
    1. l'IA étudie le vrai type d'établissement (le code d'activité est souvent faux : snack ou restaurant ?), avec un indice de confiance et des hypothèses ;
    2. l'utilisateur confirme ou corrige, ajoute ce qu'il sait, puis l'IA rédige tout le site : carte complète, textes, FAQ, horaires, photos.

    Quota `sites_ia`, remboursé si l'étude échoue, 3 essais de rédaction par étude.
  - **retouches en langage naturel** (« ajoute une formule midi »), quota `retouches_ia`, remboursé en cas d'échec ;
  - **panneau de modification**, avec aperçu en direct sur ordinateur et téléphone, annulation et Ctrl+S. Sa puissance dépend de l'offre :
    - **Gratuit** : textes, palettes, sections et banque de photos, avec la mention « Fait avec MySite » ;
    - **Pro** : en plus, la carte et les services, les horaires, la FAQ, le référencement, les couleurs libres, le modèle, les retouches IA, 5 versions et la version finale sans bandeau ;
    - **Premium** : en plus, les polices, vos propres photos et 20 versions ;
    - **Ultra** : réflexion maximale de l'IA, marque blanche et 50 versions.
  - **Banque de photos personnelle** (Premium : 300 photos, Ultra : 2 000), page Studio > Ma banque de photos :
    - à chaque envoi de photo, l'outil **propose de la garder pour les prochains sites** (case cochée par défaut) ;
    - **portée** : « seulement pour ce commerce » par défaut, ou « pour tous mes sites » pour une photo dont l'utilisateur détient les droits. Les photos d'un commerce ne sont jamais proposées sur le site d'un autre, ce qui serait trompeur ;
    - les maquettes express placent d'office les vraies photos du commerce ;
    - l'IA les utilise en priorité (rédaction et retouches) quand la légende correspond.
  - **Le serveur refiltre toute modification selon l'offre** (`appliquerEdition`) : le navigateur n'est jamais cru sur parole.
  - **Téléchargement** d'un fichier HTML autonome : la maquette avec son bandeau, ou la version finale sans bandeau et indexable (dès Pro, après confirmation que le contenu a été vérifié avec le gérant).
- **Mise en ligne en un clic** (Studio, onglet Publier ; Pro 3 sites, Premium 20, Ultra 150) :
  - site final sans bandeau, indexable, avec **mentions légales obligatoires** saisies et insérées en bas du site (éditeur, directeur de la publication, hébergeur, confidentialité) ;
  - adresse `<adresse>.NEXT_PUBLIC_DOMAINE_SITES` (ou `/s/<adresse>` en secours), `robots.txt` et `sitemap.xml` générés ;
  - **nom de domaine du client** : réglages DNS affichés, vérification DNS en direct, ajout automatique au projet Vercel si `VERCEL_TOKEN` est configuré ;
  - le site est servi dans une origine isolée (CSP sandbox) : il ne peut jamais lire les cookies de l'application ;
  - fin d'abonnement : 15 jours de grâce puis retrait (`retirer_publications_hors_offre()`, à planifier chaque nuit).
- **Carte des prospects** (Leaflet) : coordonnées fournies par la base Sirene, ou calculées avec la Base Adresse Nationale ; filtres par étape, totaux par département.
- **Export CSV** (Pro et plus) : compatible Excel, protégé contre l'injection de formules.
- **Devis, factures et avoirs** (Premium et Ultra) :
  - numérotation continue par type et par année, attribuée par la base à l'émission ;
  - document émis non modifiable et non supprimable ; annulation par avoir ;
  - identité du vendeur figée à l'émission ; mentions obligatoires (TVA, pénalités, 40 €) ;
  - **vente chez le commerçant** (art. L221-3 du code de la consommation) : rétractation de 14 jours, aucun paiement avant 7 jours et formulaire de rétractation ajoutés au devis ;
  - impression ou PDF ; encaissé du mois et de l'année (à déclarer à l'Urssaf).
- **Assistant de livraison** (depuis chaque fiche prospect) : 10 étapes de l'accord au premier avis. Les étapes automatiques se cochent d'après les devis, publications, DNS et factures. Inclut des idées de noms de domaine avec disponibilité vérifiée par RDAP (registres officiels).
- **Académie** : 7 modules, 17 leçons, de la création de la micro-entreprise à la routine hebdomadaire.
  - Chaque leçon a une **vidéo interactive** : animations, voix française (synthèse vocale de l'appareil), bruitages et musique générés par le navigateur, sous-titres, chapitres et questions dans la vidéo.
  - Elle a aussi un résumé et un quiz de validation.
  - Progression en %, 5 niveaux, badges par module.
  - **Missions « Première vente »** cochées automatiquement d'après l'activité réelle.
  - Aucune promesse de revenus : les exemples chiffrés sont signalés comme exemples.
- **Page publique « Retirer mon entreprise »** (droit d'opposition) : l'entreprise est exclue chez tous les utilisateurs.
- **Pages légales** en brouillon. Les informations à compléter sont surlignées en jaune.

## Parcours de vente (inscription → abonnement)

- **Page d'accueil** : promesse claire (vendre des sites aux commerces de sa ville), méthode en 5 étapes, vidéo, tarifs, questions. Aucun faux chiffre ni faux avis.
- **Provenance** : un lien `?src=tiktok` (ou `instagram`, `video2`…) dans la bio est repris à l'inscription, sans cookie. Il apparaît dans « Suivi des ventes ».
- **Offre choisie** : un clic sur « Choisir Pro » mène à l'inscription, puis directement à l'offre après la configuration.
- **Inscription sur téléphone** : secteur en cartes, un département en liste, autres départements repliés. Mot de passe oublié disponible.
- **Premiers pas** : la première recherche part toute seule ; le tableau de bord affiche 4 étapes à cocher, dont la première leçon gratuite de l'Académie.
- **Pas d'essai gratuit** des offres payantes : l'offre Gratuite comprend les modules Démarrer et Prospecter de l'Académie pour comprendre la méthode ; l'Académie complète est incluse dès Pro (contrôlé sur la page de leçon et à l'enregistrement de la progression).
- **Suivi des ventes** (`/espace/suivi`) : revenu mensuel, abonnés, parcours des inscrits, provenance. Réservé aux adresses de `ADMIN_EMAILS`.
- Migration `0007_croissance.sql` à exécuter après les précédentes.

## Conformité légale du SaaS
- **Résiliation en ligne** (art. L215-1-1 du Code de la consommation, dite « en 3 clics ») :
  - bouton visible « Résilier mon abonnement » dans « Mon abonnement », lien public `/resilier` en bas de toutes les pages ;
  - page de confirmation avec la date d'effet, puis confirmation à l'écran et par e-mail ;
  - effet à la fin de la période payée, et possibilité de reprendre avant cette date.
- **Rétractation de 14 jours** pour les consommateurs : bouton dédié, arrêt immédiat et remboursement au prorata des jours utilisés (art. L221-18 et L221-25). Le formulaire type figure dans les CGV.
- **Reconduction tacite** : rappel par e-mail aux abonnés annuels entre 3 mois et 1 mois avant l'échéance (art. L215-1), via une tâche planifiée quotidienne (`vercel.json`, `/api/cron/reconduction`).
- **RGPD** :
  - « Mon compte » permet d'exporter toutes ses données (JSON) et de supprimer son compte. La suppression arrête l'abonnement, retire les sites publiés et efface les photos ;
  - la politique de confidentialité liste les finalités, les durées et les sous-traitants ;
  - MySite agit comme sous-traitant pour les données des clients des utilisateurs (CGU, art. 10).
- **Contenus publiés par les utilisateurs** (sites, photos, textes) :
  - les CGU encadrent ces contenus : garanties sur les droits, contenus interdits, licence d'hébergement limitée ;
  - n'importe qui peut signaler un contenu (`/signaler`, et un lien dans les mentions légales de chaque site publié), avec une décision motivée (règlement européen DSA, art. 16 et 17 ; LCEN) ;
  - un point de contact unique figure dans les mentions légales.
- **Preuves** : le journal `journal_conformite` garde les résiliations, rétractations, exports, suppressions et rappels, même après la suppression du compte.
- **Information avant commande** : prix TTC, durée, renouvellement automatique, sans engagement et résiliable, rappelés sur les offres et dans Stripe Checkout. La majorité et l'acceptation des CGU et CGV sont demandées à l'inscription.
- **À faire par l'éditeur** :
  - compléter l'identité, le SIRET et l'e-mail dans les pages légales (passages surlignés) ;
  - choisir un médiateur de la consommation ;
  - configurer Resend (`RESEND_API_KEY`) : sans lui, aucun e-mail de confirmation ou de rappel n'est envoyé ;
  - signer les accords de sous-traitance (DPA) des prestataires ;
  - faire relire les CGU, CGV et la confidentialité par un avocat ;
  - traiter les signalements (table `signalements`).

## Tests
- `npm test` : 48 tests sur les offres, les quotas, les garde-fous RGPD de la recherche, le moteur de sites et les droits d'édition du Studio selon l'offre.
- `LIVE=1 npm test` : en plus, un vrai appel à l'API Sirene.
- `supabase/tests/test_rls.sql` (15 tests), `test_exclusivite.sql` (10 tests) et `test_studio.sql` (10 tests) `test_banque_photos.sql` (5 tests) `test_documents.sql` (22 tests) et `test_conformite.sql` (5 tests) : sécurité, numérotation des factures, documents non modifiables, exclusivité et Studio, testées sur Postgres 16. Charger `stub_supabase.sql`, puis les migrations dans l'ordre.
- `npm run build` : compilation de production.

## Mise en route (à faire avec les comptes du propriétaire)
1. **Supabase**. Créez un projet, de préférence en région UE. Dans l'éditeur SQL, exécutez dans l'ordre `0001_init.sql`, `0002_exclusivite_pipeline.sql`, `0003_studio.sql` (elle crée aussi le compartiment de stockage `studio` des photos des clients), `0004_banque_photos.sql`, `0005_vente_complete.sql` puis `0006_conformite.sql`, puis planifiez chaque nuit (Database > Cron) `liberer_reservations_dormantes()`, `purger_prospects_anciens()` et `retirer_publications_hors_offre()`. Dans Authentication > URL configuration, ajoutez l'URL du site et `/auth/callback`.
2. **Stripe**, en mode test :
   - créez 3 produits (Pro, Premium, Ultra), chacun avec un prix mensuel et un prix annuel TTC ;
   - activez le portail client, avec la résiliation et le changement d'offre ;
   - créez un webhook vers `/api/stripe/webhook` avec les événements `checkout.session.completed` et `customer.subscription.*`.
3. Copiez `.env.example` vers `.env.local` et remplissez-le. **La clé `service_role` et les clés Stripe ne doivent jamais être exposées au navigateur.**
4. Lancez `npm install`, puis `npm run dev`, et testez un paiement avec la carte 4242 4242 4242 4242.
5. **Vercel** : importez le dépôt avec `saas/app` comme dossier racine, recopiez les variables d'environnement, puis branchez le nom de domaine. La rédaction d'un site par l'IA peut durer jusqu'à 5 minutes (`maxDuration = 300`) : le plan Vercel doit l'autoriser.

## Suite
- Facturation électronique (plateforme agréée, Factur-X) avant les échéances de la réforme.
- Achat de noms de domaine directement depuis MySite (revendeur agréé).
