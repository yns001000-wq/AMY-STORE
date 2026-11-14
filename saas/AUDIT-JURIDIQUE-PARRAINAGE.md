# Audit juridique du parrainage MySite (14 novembre 2026)

Ce document est une revue faite à partir des textes : Code civil, Code de la consommation, RGPD, loi Informatique et Libertés, recommandations de la CNIL, loi sur l'influence commerciale, Code monétaire et financier. **Ce n'est pas une consultation d'avocat.** Il sert à arriver chez l'avocat avec un dossier déjà corrigé et une liste courte de questions.

Pages concernées : `/reglement-parrainage`, `/cgv` (article 7 bis), `/cgu` (article 7 bis), `/confidentialite` (partie F), page d'inscription, section « Parrainage ».

## Résumé

| # | Sujet | Texte | Avant | Maintenant |
|---|---|---|---|---|
| 1 | Cookie de parrainage | Loi Informatique et Libertés, art. 82 ; CNIL, FAQ cookies, question 13 | ❌ Déposé automatiquement | ✅ Déposé seulement après un clic, retirable |
| 2 | Intention commerciale du parrain | C. conso. L121-3 ; loi n° 2023-451 | ⚠️ Message muet sur l'avantage du parrain | ✅ « lien de parrainage » + « je reçois un avantage » |
| 3 | Clarté de l'offre promotionnelle | C. conso. L121-1, L121-2 ; LCEN art. 20 | ⚠️ « Compte neuf » peu visible | ✅ Précisé sur le bandeau, l'inscription et la page de paiement |
| 4 | Prix de référence de la réduction | C. conso. L112-1-1 | ✅ | ✅ (prix jamais modifiés) |
| 5 | Conditions générales, clauses abusives | C. civ. 1119, 1171, 1190 ; C. conso. L212-1, R212-1, R212-2 | ⚠️ Modification sans préavis, retrait sans contradictoire, pas de définitions | ✅ Définitions, préavis de 30 jours, droits acquis, contradictoire, contestation |
| 6 | Droit de rétractation du filleul | C. conso. L221-18, L221-25 | ✅ | ✅ (réduction jamais réclamée, dit explicitement) |
| 7 | Données personnelles | RGPD art. 5, 6, 13, 22 | ⚠️ Filleul pas informé à l'inscription, pas de recours humain | ✅ Information à l'inscription, bases légales, contestation par une personne |
| 8 | Prospection par e-mail et SMS | CPCE L34-5 | ✅ | ✅ (MySite n'envoie rien ; spam interdit) |
| 9 | Nature du crédit | C. monétaire et financier L525-4 | ✅ | ✅ (crédit utilisable seulement chez MySite) |
| 10 | Cotisations et fiscalité | Régime micro-entreprise | ✅ | ✅ (à confirmer avec le comptable pour l'affichage sur facture) |
| 11 | Vente avec prime, loterie | C. conso. L121-1 ; Code de la sécurité intérieure L322-1 | ✅ | ✅ |

## Détail

### 1. Cookie de parrainage : il fallait un consentement

- **Texte.** Article 82 de la loi Informatique et Libertés : un traceur ne peut être déposé sans consentement que s'il est strictement nécessaire à un service expressément demandé.
- **Position de la CNIL.** Dans sa FAQ cookies (question 13), la CNIL répond « Non » à la question « Les traceurs utilisés pour la facturation des opérations d'affiliation sont-ils exemptés de consentement ? ». À l'inverse, la question 14 exempte les services de cashback expressément demandés par l'internaute (Conseil d'État, 8 avril 2022, n° 452668).
- **Problème.** Le cookie `mysite_parrain` sert aussi à récompenser le parrain : c'est de l'affiliation. Il était déposé automatiquement dès l'arrivée par un lien.
- **Correction.**
  - Plus aucun cookie automatique.
  - Le bandeau propose « Garder mon invitation 30 jours » (consentement par un clic) et un bouton « Retirer ».
  - Sans cookie, l'invitation marche quand même pendant la visite : le code suit le visiteur dans les liens jusqu'au formulaire d'inscription, sans rien stocker.
- **Résidu.** Entre la mise en ligne du 14/11 et cette correction, le cookie a pu être déposé chez quelques visiteurs arrivés par un lien de parrainage, sans doute aucun. Il expire seul au bout de 30 jours.

### 2. Le parrain doit dire qu'il y gagne quelque chose

- **Omission trompeuse.** L'article L121-3 du Code de la consommation qualifie de trompeuse une pratique qui « n'indique pas sa véritable intention commerciale » lorsqu'elle ne ressort pas du contexte.
- **Influence commerciale.** La loi n° 2023-451 du 9 juin 2023 impose d'indiquer le caractère commercial d'une promotion faite contre un avantage sur les réseaux sociaux. Son application à un particulier qui partage un lien de parrainage n'est pas tranchée.
- **Correction.**
  - Le message proposé dit « mon lien de parrainage » et « je reçois un avantage si tu t'abonnes ».
  - Le règlement (article 3), les CGU (7 bis) et la page de partage obligent à le dire en cas de publication publique.
- **Écart avec la demande initiale.** Le texte du message n'est plus exactement celui que tu avais demandé : c'est volontaire.

### 3. Une offre promotionnelle claire

- **Textes.** Articles L121-1 et L121-2 du Code de la consommation (pratique trompeuse sur le prix ou les conditions de vente) et article 20 de la LCEN (publicité identifiable).
- **Déjà en place.** La page des offres affiche le prix barré et « puis 29 €/mois ».
- **Ajouté.**
  - « (nouveau compte) » sur le bandeau.
  - La phrase sur la page de paiement Stripe : « Parrainage : -20 % sur ce 1er paiement uniquement, puis prix normal… ».
  - La mention « ne se cumule pas avec un autre code ».

### 4. Prix de référence

- **Texte.** L'article L112-1-1 impose qu'une réduction annoncée se calcule sur le prix le plus bas pratiqué dans les 30 jours précédents.
- **Constat.** Les prix (29, 59, 119 €) n'ont jamais changé, donc le prix barré est le bon.
- **Point de vigilance.** Si un jour une promotion générale baisse les prix, le prix barré du parrainage devra partir du prix le plus bas des 30 derniers jours.

### 5. Conditions générales et clauses abusives

- **Article 1119 du Code civil.** Des conditions générales ne s'appliquent que si elles ont été portées à la connaissance de l'autre partie et acceptées.
  - Le règlement fait partie des CGV et des CGU.
  - Partager son lien ou s'inscrire avec un lien vaut acceptation, et c'est écrit à l'endroit du geste : sous les boutons de partage et sur le formulaire d'inscription.
  - Les utilisateurs déjà inscrits n'ont rien à réaccepter : le programme est facultatif et ne change rien pour celui qui n'y participe pas. À confirmer par l'avocat.
- **Article 1190 du Code civil.** Dans un contrat d'adhésion, un doute s'interprète contre celui qui l'a rédigé.
  - Ajout de **définitions** : compte neuf, paiement (facture supérieure à 0 € effectivement payée), validation, année civile.
  - Précisions ajoutées : une résiliation « même prévue pour la fin de la période » annule, une récompense validée reste acquise, le crédit est perdu à la suppression du compte.
- **Article 1171 du Code civil et articles L212-1, R212-1 et R212-2 du Code de la consommation.** Ils interdisent ou présument abusives les clauses créant un déséquilibre significatif, notamment celle qui laisse le professionnel modifier seul le contrat ou décider seul d'un manquement.
  - **Modification :** seulement pour l'avenir, avec 30 jours de préavis et un e-mail aux parrains concernés. Les parrainages en cours et les récompenses acquises gardent l'ancien règlement.
  - **Fraude :** un retrait de récompense n'intervient qu'après information du parrain et 15 jours pour s'expliquer.
  - **Contestation :** réexamen par une personne, et médiateur pour un consommateur.
  - **Source non vérifiée :** je n'ai pas pu ouvrir le texte officiel de R212-1 (le site de la DGCCRF a refusé l'accès). Le numéro exact de la clause noire sur la modification unilatérale est à confirmer sur Légifrance.

### 6. Droit de rétractation du filleul

- Les articles L221-18 et L221-25 restent intacts.
- La rétractation annule le parrainage, mais la réduction n'est jamais réclamée au filleul. C'est écrit dans le règlement (article 5).

### 7. Données personnelles

- **Minimisation (RGPD, art. 5.1.c).** Le parrain voit seulement le prénom, l'initiale du nom, la date d'inscription et l'étape. Les empreintes de cartes sont comparées, jamais stockées par MySite.
- **Bases légales (art. 6).**
  - Affichage au parrain : exécution du programme auquel le filleul participe (6.1.b).
  - Lutte contre la fraude : intérêt légitime (6.1.f, considérant 47).
- **Information (art. 13).** Le filleul est maintenant prévenu sur le formulaire d'inscription de ce que son parrain verra. La politique de confidentialité est complétée.
- **Décision automatisée (art. 22).** Une annulation automatique (même carte ou même e-mail) peut être contestée et réexaminée par une personne.

### 8. Prospection

- **Texte.** L'article L34-5 du CPCE exige un consentement pour la prospection commerciale par e-mail ou SMS automatisés.
- **Constat.** MySite n'envoie rien aux personnes invitées : le parrain envoie lui-même, depuis son téléphone, à des personnes qu'il connaît.
- **Encadrement.** Le règlement interdit l'envoi en masse et l'achat de listes de contacts.

### 9. Le crédit n'est pas de la monnaie électronique

- **Texte.** L'article L525-4 du Code monétaire et financier exclut de la monnaie électronique les valeurs utilisables seulement pour acheter les services de l'émetteur.
- **Constat.** C'est le cas du crédit MySite : non convertible en argent et non transférable.
- **Pourquoi ce n'est pas abusif.** Le crédit est un avantage promotionnel gratuit, pas une somme payée d'avance. Ne pas le rembourser en argent n'est donc pas abusif.

### 10. Cotisations et fiscalité

- **Pour MySite (micro-entreprise).** Les cotisations portent sur le chiffre d'affaires encaissé. Un crédit réduit ce qui est encaissé, donc il ne supporte pas de cotisations. C'est l'hypothèse du calcul de rentabilité, avec 25,6 % en BNC (21,2 % en BIC).
- **Pour le parrain.**
  - Particulier : c'est une réduction de prix, pas un revenu.
  - Professionnel : c'est un rabais sur une dépense.
- **À confirmer avec le comptable.** La facture Stripe affiche le prix plein puis « solde appliqué » : vérifier que cette présentation convient aux mentions obligatoires des factures.

### 11. Vente avec prime et loterie

- **Vente avec prime.** Depuis l'arrêt de la Cour de justice de l'Union européenne du 23 avril 2009 (Total Belgium, C-261/07 et C-299/07), une vente avec prime n'est interdite que si elle est déloyale ou trompeuse, ce qui n'est pas le cas ici.
- **Loterie.** Aucun hasard n'intervient, donc ce n'est pas une loterie au sens de l'article L322-1 du Code de la sécurité intérieure.

## Questions restantes pour l'avocat (liste courte)

1. Les utilisateurs inscrits avant le 14/11 doivent-ils réaccepter les CGU, ou l'ajout d'un programme facultatif et favorable suffit-il, à la lumière de l'article 12 des CGU ?
2. La base légale « exécution du programme » (6.1.b) est-elle la bonne pour montrer au parrain le prénom et l'étape du filleul ?
3. La loi n° 2023-451 s'applique-t-elle à un utilisateur qui publie son lien de parrainage sur un réseau social, et la mention « lien de parrainage » suffit-elle ?
4. Relecture générale du règlement au regard des articles R212-1 et R212-2 (numérotation à confirmer).

Question pour le comptable : l'affichage du crédit sur les factures Stripe (« solde appliqué ») convient-il aux mentions obligatoires des factures ?

## Sources consultées

- [CNIL, questions-réponses cookies et autres traceurs (questions 13 et 14)](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ)
- [Conseil d'État, 8 avril 2022, n° 452668](https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2022-04-08/452668)
- [DGCCRF, annonces de réduction de prix](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/annonces-de-reduction-de-prix-ce-que-vous-devez-savoir)
- [DGCCRF, pratiques commerciales trompeuses](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/pratiques-commerciales-trompeuses-les-cles-pour-les-reconnaitre-et-sen-premunir)
- [Sénat, loi sur l'influence commerciale (n° 2023-451)](https://www.senat.fr/lessentiel/ppl22-489.pdf)
- [economie.gouv.fr, cotisations des micro-entreprises](https://www.economie.gouv.fr/entreprises/gerer-sa-micro-entreprise/micro-entreprises-quel-est-le-montant-de-vos-cotisations-sociales)
