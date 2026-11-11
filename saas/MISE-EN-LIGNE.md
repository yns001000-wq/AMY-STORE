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

- [x] Compte créé, projet actif en Europe (Francfort), référence `dzxqlgcaaqzxemjkodbp`.
- [x] Les 8 migrations installées (vérifié : 18 tables, toutes protégées par les règles d'accès, espace de stockage « studio », création automatique du profil à l'inscription).
- [ ] Remplacer le jeton d'accès Supabase à la fin de l'installation (il a été collé dans une discussion).

## 3. Vercel (hébergement du site)

- [x] Projet `amy-store` relié au dépôt GitHub (branche `main`, dossier `saas/app`) : chaque envoi sur `main` redéploie le site.
- [x] Site en ligne : https://amy-store-six.vercel.app
- [x] Clés Supabase déjà présentes (posées par l'intégration Supabase de Vercel) et pointant vers le bon projet.
- [x] Variables ajoutées : adresse du site, 6 prix Stripe, secret des tâches planifiées, région Supabase.

## 4. Branchements

- [x] Webhook Stripe (mode test) vers `/api/stripe/webhook` ; son secret est allé directement dans Vercel, sans être affiché.
- [x] Adresse du site renseignée dans Supabase (liens de confirmation par e-mail).

### Il manque encore, dans Vercel → Settings → Environment Variables

| Variable | Valeur | Sans elle |
|---|---|---|
| `STRIPE_SECRET_KEY` | ta clé secrète Stripe de test (`sk_test_…`) | le paiement ne démarre pas |
| `ANTHROPIC_API_KEY` | une clé créée sur console.anthropic.com (payant à l'usage) | pas de messages ni de sites rédigés par l'IA |
| `ADMIN_EMAILS` | ton adresse e-mail de connexion à MySite | la page « Suivi des ventes » reste cachée |
| `RESEND_API_KEY`, `EMAIL_EXPEDITEUR` | compte gratuit sur resend.com | pas d'e-mails de service (bienvenue, résiliation, fin d'essai) |
| `CONTACT_EMAIL`, `EDITEUR_NOM`, `EDITEUR_ADRESSE`, `EDITEUR_TELEPHONE`, `EDITEUR_SIREN`, `MEDIATEUR_CONSOMMATION` | ton identité d'entrepreneur | pages légales incomplètes |

Après un ajout, il faut redéployer (Vercel → Deployments → « Redeploy »).

### Limite à connaître

Supabase n'envoie que **2 e-mails de confirmation par heure** avec son service d'envoi par défaut. Avant d'ouvrir au public, il faut y brancher Resend (Supabase → Authentication → Emails → SMTP), sinon la troisième personne qui s'inscrit dans l'heure ne recevra pas son e-mail.

## 5. Avant d'ouvrir au public

- [ ] Micro-entreprise créée, SIRET reçu.
- [ ] Identité de l'éditeur renseignée (pages légales), médiateur de la consommation choisi.
- [ ] Un parcours complet testé avec une carte de test Stripe.
- [ ] Passage de Stripe en mode réel.
