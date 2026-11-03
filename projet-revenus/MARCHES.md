# MARCHES.md — France, Belgique francophone, Suisse romande

_Décision du 03/11/2026 : l'activité vise toute la France, la Belgique francophone (Wallonie et Bruxelles) et la Suisse romande._

Conséquence principale : la vente se fait **à distance** (téléphone, visioconférence gratuite comme Google Meet, email, messagerie). Les visites en personne restent possibles autour de chez vous, en bonus.

## 1. Ordre de lancement recommandé (et pourquoi)

| Ordre | Marché | Pourquoi | Quand |
|---|---|---|---|
| 1 | **France** | Liste de prospects automatisée et gratuite (API Sirene), règles de prospection claires, facturation la plus simple (franchise de TVA) | Dès la phase 4 |
| 2 | **Belgique francophone** | Même langue, mais email à froid plus restreint et facturation avec autoliquidation (numéro de TVA intracommunautaire nécessaire) | Après les 3 premières ventes en France, ou plus tôt sur demande entrante |
| 3 | **Suisse romande** | Prix plus élevés, mais email publicitaire à froid quasi exclu, facturation hors UE et données moins accessibles | Après la Belgique, par téléphone et demandes entrantes |

Les **demandes entrantes** (formulaire du site, recommandations, réseaux sociaux) sont acceptées **dès maintenant dans les trois pays**.

## 2. Tableau comparatif

| | 🇫🇷 France | 🇧🇪 Belgique (FR) | 🇨🇭 Suisse romande |
|---|---|---|---|
| **Source de prospects** | ✅ API Recherche d'entreprises : automatisée, gratuite, sans clé (`outils/trouver_prospects.py`) | 🔌 KBO/BCE Open Data (SPF Économie) : fichiers CSV officiels. Une réutilisation commerciale peut être soumise à redevance (arrêté royal de 2008), **à vérifier avant usage**. En attendant : recherche manuelle dans les annuaires publics | 🔌 Zefix (registre du commerce) : l'API demande des identifiants, à solliciter par email auprès de l'Office fédéral de la justice. En attendant : recherche manuelle (annuaires publics, local.ch) |
| **Email à froid vers un professionnel** | Autorisé si le sujet est lié à son métier, avec identification et désinscription simple (CNIL) | **Seulement vers une adresse impersonnelle d'une personne morale** (info@, contact@ d'une société). Pour une adresse nominative ou celle d'un indépendant personne physique, il faut un **consentement préalable** | **À éviter.** L'article 3, lettre o, de la loi contre la concurrence déloyale (LCD) exige un consentement préalable pour la publicité de masse par email. Un email individuel et personnalisé est une zone grise : on s'abstient |
| **Téléphone vers un professionnel** | Autorisé (le consentement préalable ne concerne que les consommateurs depuis le 11/08/2026) | Autorisé vers les numéros professionnels publiés. Respecter toute demande d'opposition | Autorisé, **sauf si le numéro porte un astérisque (\*) dans l'annuaire** (refus de publicité, article 3, lettre u, de la LCD) |
| **Messagerie sur les réseaux sociaux** | Message individuel personnalisé, jamais en masse | Idem | Idem |
| **Facturation** (vous êtes micro-entrepreneur français) | « TVA non applicable, art. 293 B du CGI » | Client assujetti à la TVA : facture hors taxe avec **autoliquidation**, votre numéro de TVA intracommunautaire et celui du client (BE + 10 chiffres). **Déclaration européenne de services (DES)** mensuelle. Client non assujetti : TVA française, donc franchise | Prestation à un professionnel hors UE : pas de TVA française. Mention du type « TVA non applicable – article 259 du CGI ». Pas de TVA suisse à facturer par vous en dessous du seuil suisse (à vérifier) |
| **Démarche préalable** | Aucune | Demander gratuitement un **numéro de TVA intracommunautaire** à votre service des impôts des entreprises (SIE). Vous restez en franchise | Aucune |
| **Paiement** | Virement SEPA | Virement SEPA | Virement SEPA en euros (la Suisse fait partie de la zone SEPA) |
| **Prix** | 390 / 490 € | 390 / 490 € | Mêmes montants **en euros**. Le niveau de prix suisse permettrait davantage : à tester plus tard |
| **Mentions légales du site client** | SIRET, autorité : CNIL | Numéro d'entreprise BCE, autorité : APD | Numéro IDE (CHE-…), autorité : PFPDT. Coordonnées complètes exigées pour l'e-commerce (art. 3, lettre s, de la LCD) |
| **Particularités de langue** | — | « septante », « nonante » ; « GSM » pour téléphone portable | « septante », « huitante » (Vaud, Fribourg, Valais) ou « quatre-vingts » (Genève, Neuchâtel, Jura) ; « Natel » |

Le générateur de sites gère ces différences : il suffit d'ajouter `"pays": "BE"` ou `"pays": "CH"` dans la fiche du client (voir `ventes/questionnaire_client.md`).

## 3. Prospection automatisée en France : couvrir tout le pays progressivement

L'outil accepte plusieurs départements à la fois. Pour garder des mesures exploitables, on avance par **lots de départements** plutôt que « toute la France » d'un coup.

| Semaine | Lot de départements (exemple) | Raison |
|---|---|---|
| 1 | 69, 42, 38 (Rhône, Loire, Isère) | Grandes villes et beaucoup de créations d'entreprises |
| 2 | 59, 62 (Nord, Pas-de-Calais) | Proche de la Belgique, utile pour préparer l'extension |
| 3 | 13, 83, 06 (Provence-Alpes-Côte d'Azur) | |
| 4 | 33, 31, 44 (Bordeaux, Toulouse, Nantes) | |
| ensuite | Rotation sur les autres départements | |

Exemple :
```
python outils/trouver_prospects.py --naf 43.22A,43.21A,43.34Z --departement 69,42,38 --segment A-artisans --depuis 2024-01-01 --max 30
```
Les prospects sont enregistrés avec `pays = FR`. Pour la Belgique et la Suisse, saisissez `BE` ou `CH` dans la colonne `pays` : le rapport affiche les résultats par pays.

## 4. Ce qu'il faut faire de votre côté avant la Belgique et la Suisse
- [ ] 👤 Belgique : demander le numéro de TVA intracommunautaire au SIE (gratuit, une fois la micro-entreprise créée).
- [ ] 👤 Belgique : s'informer sur la **DES** (déclaration européenne de services, sur le site des douanes) avant la première facture à un client belge assujetti.
- [ ] 👤🔐 Belgique : décider d'utiliser ou non les données KBO Open Data, après vérification des conditions de réutilisation commerciale.
- [ ] 👤🔐 Suisse : demander, si vous le souhaitez, un accès à l'API Zefix (email à l'Office fédéral de la justice).
- [ ] 👤 Faire valider la facturation BE/CH par un comptable ou par le service des impôts des entreprises avant la première vente dans ces pays.

> ⚠️ Les règles belges et suisses ci-dessus sont tirées de sources officielles (OFCOM, SPF Économie) **et** de sources secondaires (voir SOURCES.md). Il s'agit d'informations générales, pas d'un avis juridique.
