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
  - essai Premium de 7 jours sans carte, une fois par compte.
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
- **Page publique « Retirer mon entreprise »** (droit d'opposition) : l'entreprise est exclue chez tous les utilisateurs.
- **Pages légales** en brouillon. Les informations à compléter sont surlignées en jaune.

## Tests
- `npm test` : 31 tests sur les offres, les quotas, les garde-fous RGPD de la recherche, le moteur de sites et les droits d'édition du Studio selon l'offre.
- `LIVE=1 npm test` : en plus, un vrai appel à l'API Sirene.
- `supabase/tests/test_rls.sql` (15 tests), `test_exclusivite.sql` (10 tests) et `test_studio.sql` (10 tests) et `test_banque_photos.sql` (5 tests) : sécurité, exclusivité et Studio, testées sur Postgres 16. Charger `stub_supabase.sql`, puis les migrations dans l'ordre.
- `npm run build` : compilation de production.

## Mise en route (à faire avec les comptes du propriétaire)
1. **Supabase**. Créez un projet, de préférence en région UE. Dans l'éditeur SQL, exécutez dans l'ordre `0001_init.sql`, `0002_exclusivite_pipeline.sql`, `0003_studio.sql` (elle crée aussi le compartiment de stockage `studio` des photos des clients) puis `0004_banque_photos.sql`, puis planifiez chaque nuit (Database > Cron) `liberer_reservations_dormantes()` et `purger_prospects_anciens()`. Dans Authentication > URL configuration, ajoutez l'URL du site et `/auth/callback`.
2. **Stripe**, en mode test :
   - créez 3 produits (Pro, Premium, Ultra), chacun avec un prix mensuel et un prix annuel TTC ;
   - activez le portail client, avec la résiliation et le changement d'offre ;
   - créez un webhook vers `/api/stripe/webhook` avec les événements `checkout.session.completed` et `customer.subscription.*`.
3. Copiez `.env.example` vers `.env.local` et remplissez-le. **La clé `service_role` et les clés Stripe ne doivent jamais être exposées au navigateur.**
4. Lancez `npm install`, puis `npm run dev`, et testez un paiement avec la carte 4242 4242 4242 4242.
5. **Vercel** : importez le dépôt avec `saas/app` comme dossier racine, recopiez les variables d'environnement, puis branchez le nom de domaine. La rédaction d'un site par l'IA peut durer jusqu'à 5 minutes (`maxDuration = 300`) : le plan Vercel doit l'autoriser.

## Suite
- Carte de France des prospects.
- Mise en ligne en un clic des sites finaux (sous-domaine MySite ou nom de domaine du client).
- Export CSV (Pro et plus), devis et factures (Premium et plus).
