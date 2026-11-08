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
- **Page publique « Retirer mon entreprise »** (droit d'opposition) : l'entreprise est exclue chez tous les utilisateurs.
- **Pages légales** en brouillon. Les informations à compléter sont surlignées en jaune.

## Tests
- `npm test` : 13 tests sur les offres, les quotas et les garde-fous RGPD de la recherche.
- `LIVE=1 npm test` : en plus, un vrai appel à l'API Sirene.
- `supabase/tests/test_rls.sql` : sécurité de la base, testée sur Postgres 16. Chaque utilisateur est isolé, personne ne peut se donner une offre, les quotas sont atomiques, chaque événement Stripe n'est traité qu'une fois.
- `npm run build` : compilation de production.

## Mise en route (à faire avec les comptes du propriétaire)
1. **Supabase**. Créez un projet, de préférence en région UE. Dans l'éditeur SQL, exécutez `supabase/migrations/0001_init.sql`. Dans Authentication > URL configuration, ajoutez l'URL du site et `/auth/callback`.
2. **Stripe**, en mode test :
   - créez 3 produits (Pro, Premium, Ultra), chacun avec un prix mensuel et un prix annuel TTC ;
   - activez le portail client, avec la résiliation et le changement d'offre ;
   - créez un webhook vers `/api/stripe/webhook` avec les événements `checkout.session.completed` et `customer.subscription.*`.
3. Copiez `.env.example` vers `.env.local` et remplissez-le. **La clé `service_role` et les clés Stripe ne doivent jamais être exposées au navigateur.**
4. Lancez `npm install`, puis `npm run dev`, et testez un paiement avec la carte 4242 4242 4242 4242.
5. **Vercel** : importez le dépôt avec `saas/app` comme dossier racine, recopiez les variables d'environnement, puis branchez le nom de domaine.

## Suite (phases 2 et 3)
- Fiche prospect, pipeline, journal, rappels et carte, repris du cockpit.
- IA côté serveur : étude d'établissement, messages, site sur mesure. Les quotas `messages_ia` et `sites_ia` existent déjà en base.
