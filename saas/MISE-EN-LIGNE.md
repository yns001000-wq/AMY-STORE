# Mise en ligne de MySite : où on en est

Une étape à la fois. Les cases cochées sont faites et vérifiées.

## 1. Stripe (paiements), en mode test

- [x] Compte Stripe créé (France, euros).
- [x] 3 offres et 6 prix créés en mode test, vérifiés par relecture dans Stripe.
- [ ] Webhook à créer quand le site aura une adresse (étape 4).
- [ ] Activation du compte pour encaisser en vrai : à faire par toi dans Stripe (identité, IBAN), une fois la micro-entreprise créée.

Identifiants des prix de test (non secrets), à mettre dans les variables d'environnement de Vercel :

```
STRIPE_PRICE_PRO_MENSUEL=price_1UaiAXC9ZNFqqI3Uoqijbe68
STRIPE_PRICE_PRO_ANNUEL=price_1UaiAYC9ZNFqqI3Uxzc3qt25
STRIPE_PRICE_PREMIUM_MENSUEL=price_1UaiAYC9ZNFqqI3UbE0kjicQ
STRIPE_PRICE_PREMIUM_ANNUEL=price_1UaiAYC9ZNFqqI3UlwYWC11K
STRIPE_PRICE_ULTRA_MENSUEL=price_1UaiAZC9ZNFqqI3U81O6vzLm
STRIPE_PRICE_ULTRA_ANNUEL=price_1UaiAZC9ZNFqqI3U59K1CefB
```

Quand le compte passera en mode réel, il faudra recréer les mêmes prix en réel : les identifiants changeront.

## 2. Supabase (base de données et comptes des utilisateurs)

- [ ] Créer un compte gratuit sur supabase.com (bouton « Continue with GitHub »).
- [ ] Créer un projet, région Europe (Paris ou Francfort).
- [ ] Exécuter les migrations du dossier `app/supabase/migrations`, dans l'ordre.

## 3. Vercel (hébergement du site)

- [ ] Créer un compte gratuit sur vercel.com (bouton « Continue with GitHub »).
- [ ] Importer le dépôt `AMY-STORE`, dossier racine `saas/app`.
- [ ] Renseigner les variables d'environnement (liste dans `app/.env.example`).

## 4. Branchements

- [ ] Webhook Stripe vers `/api/stripe/webhook`.
- [ ] Adresse du site dans Supabase (liens de confirmation par e-mail).
- [ ] Resend (e-mails de service) et secret des tâches planifiées.

## 5. Avant d'ouvrir au public

- [ ] Micro-entreprise créée, SIRET reçu.
- [ ] Identité de l'éditeur renseignée (pages légales), médiateur de la consommation choisi.
- [ ] Un parcours complet testé avec une carte de test Stripe.
- [ ] Passage de Stripe en mode réel.
