# Mémoire du projet MySite (à jour au 14 novembre 2026)

Ce document est la mémoire complète du projet. Il est fait pour être ajouté aux **connaissances d'un Projet Claude** sur claude.ai : chaque conversation de ce projet repart alors avec tout le contexte.

---

## 1. Qui je suis et ce que je veux

- Je vends **MySite**, un logiciel en ligne par abonnement. Je ne prospecte pas moi-même : mon revenu vient des abonnements.
- L'entreprise est une micro-entreprise au nom de **Lamia Bayane**, SIREN **132 780 552** (validée par l'Urssaf le 12/11/2026). C'est elle, légalement, l'éditrice et la vendeuse de MySite.
- Contact affiché sur le site : 06 65 50 40 25 · ybayaneline@gmail.com. **L'adresse postale ne doit jamais être divulguée.**
- Tutoiement entre nous, réponses en français simple, pas de jargon.

## 2. Mes règles (à respecter à chaque fois)

- Demander mon **accord explicite** avant : toute dépense ou tout abonnement, toute publicité payante, toute publication en mon nom, tout message envoyé à des prospects, tout engagement contractuel, tout paiement ou réglage sensible.
- Ne jamais me demander un mot de passe, ni l'écrire quelque part. Les clés secrètes ne se collent pas dans une discussion.
- Pas de faux témoignage, pas de faux chiffre, pas de promesse de revenus, pas de spam, rien de trompeur.
- Ne jamais dire qu'une publicité est diffusée si elle est seulement préparée. Ne jamais dire qu'une tâche est finie sans preuve.
- Signaler clairement ce qui demande une connexion, un paiement ou une action de ma part.
- Contenus faits avec l'IA : cocher « contenu généré par IA » à la publication ; « Image virtuelle » pour une personne inventée.

## 3. Le produit

**Promesse** : « Vendez des sites web aux commerces de votre ville. » Pour débutants, freelances et agences.

**Méthode en 4 étapes** : Trouver (commerces du registre officiel Sirene, réservés à un seul abonné) · Contacter (premier message rédigé par l'IA) · Montrer (maquette de site au nom du commerce) · Encaisser (devis, mise en ligne, factures).

**Fonctions** : recherche de commerces, carte, suivi (pipeline), messages IA (SMS, e-mail, script d'appel), Studio de sites (maquette express gratuite, site sur mesure par l'IA, retouches), mise en ligne en un clic sur `nom-du-commerce.mysite-app.com` ou sur le domaine du commerçant (branché automatiquement), devis et factures, Académie (7 modules), page « Suivi des ventes » réservée au propriétaire.

**Offres** (prix TTC, TVA non applicable) :

| Offre | Prix | Prospects/mois | Messages IA | Sites sur mesure | Retouches | Départements | Académie |
|---|---|---|---|---|---|---|---|
| Gratuit | 0 € | 15 | 5 | 0 | 0 | 1 | Modules Démarrer et Prospecter |
| Pro | 29 €/mois ou 290 €/an | 300 | 100 | 5 | 12 | 3 | Complète |
| Premium | 59 €/mois ou 590 €/an | 1 000 | 200 | 12 | 22 | 10 | Complète + factures |
| Ultra | 119 €/mois ou 1 190 €/an | 3 000 | 400 | 25 | 44 | France | Complète + marque blanche, 3 utilisateurs |

- **Pas d'essai gratuit** des offres payantes (supprimé le 13/11) : l'offre Gratuite sert de découverte.
- **IA « formule mixte »** : Claude Opus 5.5 rédige les sites sur mesure, Claude Sonnet 5.5 (moitié moins cher) rédige les messages et les retouches. Les quotas garantissent que l'IA ne coûte jamais plus d'environ 27 % de ce que rapporte une offre, même utilisée à fond (vérifié par un test automatique).
- Les commerces trouvés n'ont pas de téléphone (le registre ne le publie pas) : liens Google Maps et Pages Jaunes sur chaque fiche.

## 4. Où tout se trouve

| Élément | Où |
|---|---|
| Site en ligne | https://mysite-app.com (domaine acheté chez Vercel le 12/11) |
| Code | GitHub `yns001000-wq/AMY-STORE`, dossier `saas/app` (Next.js). Branche `main` = site en ligne |
| Hébergement | Vercel, projet `amy-store` (équipe `yl-ine`). Chaque envoi sur `main` redéploie |
| Base de données | Supabase, projet `dzxqlgcaaqzxemjkodbp`, Europe (Francfort), 8 migrations installées |
| Paiements | Stripe, **mode test** : 3 offres, 6 prix, webhook vers `/api/stripe/webhook`. « Managed Payments » coupé (le vendeur reste Lamia Bayane, comme dans les CGV) |
| E-mails | Resend, domaine `mysite-app.com` vérifié, expéditeur `MySite <bonjour@mysite-app.com>`. Supabase envoie aussi par Resend (100 e-mails/heure) avec des modèles « ✨ MySite » et emojis |
| IA du site | Clé Anthropic dans Vercel (testée en vrai le 12/11) |
| Suivi d'avancement détaillé | `saas/MISE-EN-LIGNE.md` |
| Vidéos et sources | `saas/videos-pub/` (MP4), `saas/video/pubs/` (montage) |
| Profil Instagram (textes, photo) | `saas/instagram/` |
| Scénario vidéo avec une personne virtuelle (Léa) | `saas/video/scenario-ia/SCENARIO.md` |

## 5. Ce qui est fait et vérifié en ligne

- Inscription, connexion, mot de passe oublié, e-mails de confirmation et de bienvenue livrés.
- Recherche de commerces (15 trouvés en 5 s dans le Rhône), maquette express, messages IA.
- Paiement de test : l'offre s'active, la résiliation ramène en Gratuit. Rétractation de 14 jours avec remboursement au prorata, automatique.
- Académie : cadenas en Gratuit, tout ouvert en Pro (contrôlé côté serveur).
- Mise en ligne d'un site client sur sa propre adresse, branchement et retrait automatiques du domaine d'un commerçant.
- Pages légales (CGU, CGV, confidentialité, mentions légales) avec le nom et le SIREN.

## 6. Ce qui reste avant d'ouvrir au public

1. **Activer Stripe pour les vrais paiements** (moi : identité, IBAN du compte pro). Ensuite : créer les prix réels et le webhook réel, remplacer la clé dans Vercel.
2. **Adresse dans les mentions légales** : obligatoire ; je ne veux pas afficher mon domicile → **domiciliation** (environ 10 à 30 €/mois, à décider).
3. **Médiateur de la consommation** : obligatoire pour vendre aux particuliers. Choix conseillé : **CM2C**, 48 € pour 3 ans, 36 € par médiation (https://www.cm2c.net/inscription-professionnel.php). Pas encore payé.
4. **Page « Suivi des ventes »** : ajouter mon e-mail dans la variable `ADMIN_EMAILS` de Vercel.
5. **Sécurité** : remplacer le jeton Supabase et la clé Stripe de test, qui ont été collés en clair dans une discussion ; supprimer la clé Resend « Onboarding » inutile.
6. Conseillé : relecture des CGV et CGU par un avocat ; Google Search Console ; plafond de dépense dans la console Anthropic.

## 7. En attente de ma décision

- **Nouvelle page d'accueil** (style épuré inspiré d'Apple, pensée pour le téléphone) : prête sur la branche `claude/automated-revenue-machine-nt8psg`, pas encore en ligne. À valider avant de la passer sur `main`.

## 8. Marketing en format organique

- **Vidéos verticales** (TikTok, Reels) qui montrent les vrais écrans de l'application :
  - « La méthode » : version finale en ligne sur la page d'accueil, avec voix CapCut et motion design amélioré (`MySite-methode-motion-pro.mp4`) ;
  - « Trouver des clients » et « Montrer » : versions sans voix prêtes pour CapCut, avec le texte et le minutage (`texte-*-capcut.md`). Après avoir ajouté la voix, elles peuvent recevoir le même motion design.
- Les voix de synthèse gratuites ont été jugées trop robotiques. Solutions retenues : voix CapCut, ou ma propre voix, ou ElevenLabs (environ 5 $/mois, non souscrit).
- **Instagram** : compte créé ; biographie conseillée : « Vends des sites web aux commerces de ta ville 🏪 / Trouver · Contacter · Montrer · Encaisser / Gratuit pour commencer 👇 ». Lien de bio : `https://mysite-app.com/?src=instagram` (et `?src=tiktok`) pour savoir d'où viennent les inscrits.
- **Higgsfield** relié à Claude mais connexion **incomplète** : à terminer sur https://claude.ai/customize/connectors, puis ouvrir une nouvelle discussion. Prochaine étape : générer l'image de Léa et la valider avant les plans vidéo (chaque génération coûte des crédits Higgsfield).
- **Publicité payante Meta** : envisagée, rien de lancé. Test conseillé : environ 5 €/jour pendant 7 jours, seulement quand le site sera ouvert, et avec mon accord sur le budget.

## 9. Droit : ce qu'il faut savoir

- Particulier dans les 14 jours : droit de rétractation, remboursé au prorata des jours utilisés (bouton « Me rétracter », automatique).
- Après 14 jours, ou professionnel : pas de remboursement, résiliation pour la fin de la période payée.
- Résiliation en ligne en 3 clics, rappel avant renouvellement d'un abonnement annuel : en place.
- Micro-entreprise : déclarer le chiffre d'affaires à l'Urssaf même à zéro ; vérifier l'ACRE (délai court après la création).

## 10. Comment travailler avec Claude

- **Conversation normale (Projet Claude)** : stratégie, textes, scripts de vidéos, réponses aux questions, préparation des publications.
- **Claude Code** (claude.ai/code, dépôt `yns001000-wq/AMY-STORE`) : tout ce qui touche au code et aux services en ligne (déploiement, base de données, Stripe, Resend, vidéos). Ces réglages se font avec des formulaires sécurisés, jamais en collant une clé dans la discussion.
