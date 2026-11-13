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
- [x] Site en ligne : **https://mysite-app.com** (domaine acheté chez Vercel le 12 novembre ; `www.mysite-app.com` redirige vers lui). L'ancienne adresse https://amy-store-six.vercel.app fonctionne toujours.
- [x] Adresse du site mise à jour dans Vercel, Supabase (liens des e-mails) et le webhook Stripe.
- [x] Clés Supabase déjà présentes (posées par l'intégration Supabase de Vercel) et pointant vers le bon projet.
- [x] Variables ajoutées : adresse du site, 6 prix Stripe, secret des tâches planifiées, région Supabase.

## 4. Branchements

- [x] Webhook Stripe (mode test) vers `/api/stripe/webhook` ; son secret est allé directement dans Vercel, sans être affiché.
- [x] Adresse du site renseignée dans Supabase (liens de confirmation par e-mail).

- [x] Clé Anthropic en place : l'IA du site a rédigé un SMS, un e-mail et un script d'appel lors d'un test réel (12 novembre), avec un compte temporaire supprimé ensuite.

- [x] Clé Stripe de test en place. Vérifié le 12 novembre avec un compte temporaire, supprimé ensuite :
  - le site ouvre la page de paiement Stripe, avec le bon prix et le texte légal ;
  - un abonnement de test fait passer le compte en Pro ; sa résiliation le ramène en Gratuit.
  - Non vérifié : la saisie de la carte sur la page Stripe (leur protection bloque les navigateurs automatisés). À faire une fois à la main avec la carte de test `4242 4242 4242 4242`.
- [x] « Managed Payments » de Stripe coupé pour nos paiements : ce mode, activé par défaut sur les nouveaux comptes, fait de Stripe le vendeur officiel à ta place. Nos CGV te désignent comme vendeur. Si tu préfères que Stripe gère la vente et la TVA (contre des frais plus élevés), il faudra réécrire les CGV.

### Il manque encore, dans Vercel → Settings → Environment Variables

| Variable | Valeur | Sans elle |
|---|---|---|
| `ADMIN_EMAILS` | ton adresse e-mail de connexion à MySite | la page « Suivi des ventes » reste cachée |
| `CONTACT_EMAIL`, `EDITEUR_NOM`, `EDITEUR_ADRESSE`, `EDITEUR_TELEPHONE`, `EDITEUR_SIREN`, `MEDIATEUR_CONSOMMATION` | ton identité d'entrepreneur | pages légales incomplètes |

Après un ajout, il faut redéployer (Vercel → Deployments → « Redeploy »).

### Limite à connaître

Supabase n'envoie que **2 e-mails de confirmation par heure** avec son service d'envoi par défaut. Avant d'ouvrir au public, il faut y brancher Resend (Supabase → Authentication → Emails → SMTP), sinon la troisième personne qui s'inscrit dans l'heure ne recevra pas son e-mail.

## Sites des clients des abonnés

- [x] Chaque site mis en ligne a sa propre adresse : `nom-du-commerce.mysite-app.com` (domaine générique relié au projet). Vérifié le 13 novembre : mise en ligne, page isolée de l'application, mentions légales complètes, retrait.
- [x] Mentions légales de ces sites : Vercel ne publie aucun numéro de téléphone ; son adresse de contact (vercel.com/help) est indiquée à la place.
- [ ] Branchement automatique du nom de domaine d'un commerçant : identifiants du projet réglés, il manque `VERCEL_TOKEN` (jeton Vercel à coller par toi dans les variables d'environnement). Sans lui, l'ajout se fait à la main dans Vercel.

## E-mails aux couleurs de MySite

- [x] Domaine `mysite-app.com` vérifié chez Resend (région Irlande), le 13 novembre.
- [x] E-mails envoyés par le site (bienvenue, résiliation, rétractation, renouvellement annuel, suppression de compte, signalement) : en-tête « ✨ MySite », emoji, bouton, version texte. Expéditeur `MySite <bonjour@mysite-app.com>`, clé d'envoi seule dans Vercel.
- [x] E-mails d'inscription et de mot de passe oublié : Supabase envoie par Resend (expéditeur « MySite »), avec les modèles MySite (`app/scripts/modeles-supabase.ts`). Limite relevée à 100 e-mails par heure. Vérifié par une inscription de test : e-mail parti et livré.
- [x] Clé Resend en accès complet supprimée le 13 novembre. Restent : « MySite site (envoi) » et « MySite Supabase (SMTP) », qui ne peuvent qu'envoyer, plus la clé « Onboarding » créée à l'inscription, qui ne sert à rien.

## Coût de l'IA et marge

Formule mixte : Claude Opus 5.5 rédige les sites sur mesure (ce que l'abonné montre à son client) ; Claude Sonnet 5.5, moitié moins cher, rédige les messages et les retouches.

Les quotas sont réglés pour que l'IA ne puisse jamais coûter plus de 40 % de ce qu'une offre rapporte, même si l'abonné utilise tout. Un test automatique le vérifie (`app/src/lib/plans.test.ts`). Avec la formule mixte, le maximum tombe à environ 27 %.

| Offre | Messages | Sites sur mesure | Retouches | Coût maximal de l'IA par mois | Recette la plus basse par mois (abonnement annuel) |
|---|---|---|---|---|---|
| Gratuit | 5 | 0 | 0 | 0,09 $ | 0 € |
| Pro | 100 | 5 | 12 | 6,07 $ | 24,17 € |
| Premium | 200 | 12 | 22 | 12,93 $ | 49,17 € |
| Ultra | 400 | 25 | 44 | 26,39 $ | 99,17 € |

Ces coûts sont des maximums calculés (chaque appel poussé à sa longueur maximale, tarifs relevés le 3 novembre 2026), pas des mesures. Le coût réel devrait être 2 à 3 fois plus bas. À recalculer si un modèle ou son tarif change.

La qualité de Sonnet sur les messages et les retouches n'a pas encore été comparée à celle d'Opus : à faire dès qu'une clé Anthropic est en place (moins d'un euro). Les modèles se règlent en un seul endroit, `MODELE_IA` dans `app/src/lib/plans.ts`.

Sécurité supplémentaire conseillée : fixer un plafond de dépense mensuel dans la console Anthropic.

## 5. Avant d'ouvrir au public

- [ ] Micro-entreprise créée, SIRET reçu.
- [ ] Identité de l'éditeur renseignée (pages légales), médiateur de la consommation choisi.
- [ ] Un parcours complet testé avec une carte de test Stripe.
- [ ] Passage de Stripe en mode réel.
