# Sites clients : modèles, réglages et contrôle qualité

Le générateur `outils/generer_site.py` produit un site complet à partir d'une fiche JSON. Les fiches d'exemple se trouvent dans `modeles-sites/fiche-exemple-*.json`. Le générateur sert aux démos, aux aperçus pour les prospects et aux vrais sites clients.

## Trois directions artistiques, une par métier
| Modèle | Direction | Police de titre | Ce qui fait vendre |
|---|---|---|---|
| `artisan` | « Carnet de chantier » : filets, bandes sombres, prix alignés | Archivo | Gros bouton d'appel, devis, zone desservie, réalisations, étapes |
| `commande-whatsapp` | « Carte de maison » : éditoriale, photos de produits | Gloock | Carte par catégories, panier, commande rédigée sur WhatsApp, délai, retrait ou livraison, paiement |
| `beaute` | « Salon calme » : photo et texte côte à côte, tarifs avec points de conduite | Marcellus | Tarifs et durées, mosaïque de photos, réservation, accès et horaires |

Règles communes :
- pas de cartes empilées, pas de dégradés décoratifs, pas d'emojis : les icônes sont en SVG ;
- les polices sont hébergées avec le site (licence OFL, `modeles-sites/polices/LICENCE.txt`) : aucune ressource tierce, aucun cookie.

Les styles se trouvent dans `modeles-sites/themes/` : `base.css`, commun aux trois modèles, plus un fichier par modèle. Ils sont intégrés dans la page lors de la génération.

## Ce que le générateur fait automatiquement
- **Couleur du client** (`couleur`) : le générateur calcule des variantes dont le contraste respecte le niveau AA (4,5:1), sur fond blanc comme sur les fonds gris des thèmes. Ces variantes servent aux textes sur fond blanc, aux boutons et aux bandes sombres. Une couleur trop claire reste donc lisible.
- **Photos** : conversion en WebP, en 720 et 1440 px, avec `srcset`. Cette étape demande Pillow (`pip install Pillow`). Sans Pillow, les photos sont copiées telles quelles et un avertissement s'affiche.
- **Favicon** : l'initiale du client sur sa couleur.
- **Statut « Ouvert / Fermé »** calculé à partir des horaires, avec le jour courant surligné.
- **Données structurées** `LocalBusiness`. La note (`aggregateRating`) n'est déclarée que pour un vrai client, jamais pour une démo.
- **Formulaire** relié à Netlify Forms sur un vrai site. Sur une démo ou un aperçu, il est **désactivé**, avec un message clair : aucune donnée n'est envoyée.
- **Sans numéro de téléphone** (aperçu) : aucun lien `tel:` vide n'est créé. Les boutons mènent au formulaire ou aux informations d'accès.

## Champs facultatifs utiles
| Champ | Effet |
|---|---|
| `titre`, `accroche`, `bandeau` | Titre du haut de page, phrase d'accroche, courte mention sous les boutons (artisan) |
| `atouts` | Bande de 3 ou 4 points forts **vérifiables** |
| `avis` | Note, nombre, lien et liste d'avis **réels** (source et date). `avis_a_venir: true` affiche un emplacement vide pour un aperçu |
| `libelle_realisations`, `titre_realisations`, `titre_contact`, `texte_whatsapp`, `titre_zone`, `titre_apropos`, `etapes` | Textes du modèle artisan, à adapter quand il sert à un autre métier (traiteur par exemple) |
| `reservation_url` | Lien de réservation en ligne (beauté). Sinon WhatsApp, puis le téléphone |
| `modes`, `delai_commande`, `mode_retrait`, `paiement`, `allergenes` | Panier et informations pratiques (commande) |

## Snacks et restaurants (06/11/2026)
- Les **snacks** dont le numéro est un portable reçoivent le modèle « commande WhatsApp » : carte d'exemple (tacos, burger, assiette kebab, menu enfant), prix indicatifs, retrait ou livraison. Les autres reçoivent le modèle artisan, avec les textes des métiers de bouche.
- Les **restaurants** reçoivent le modèle artisan avec les textes des métiers de bouche : formule du midi, carte du soir, groupes, à emporter.
- Recherche de prospects : `amenity=fast_food` et `amenity=restaurant` dans OpenStreetMap, codes NAF 56.10C (Snack) et 56.10A (Restaurant) dans le répertoire Sirene.

## Champs ajoutés après l'étude des concurrents
| Champ | Effet |
|---|---|
| `delai_reponse` | Promesse de réponse sous les boutons d'accueil et sous le formulaire |
| `tarifs_depannage` | `taux_horaire`, `deplacement`, `forfaits`, `majorations`, `devis` : bloc « Tarifs de dépannage », avec la mention de l'arrêté du 24 janvier 2017 |
| `qualifications` | Liste des qualifications **réelles** (RGE, Qualibat…), jamais affichée sur une maquette |
| `avant_apres` | Paires `{avant, apres, legende}` de **vraies** photos de chantier |
| `domaine` | Site final : adresse canonique, `robots.txt` et `sitemap.xml` |

## Images générées par IA
- Bibliothèque : `modeles-sites/images-ia/` (catalogue dans `catalogue.json`). Elle contient 4 illustrations par métier : plombier, chauffagiste, électricien, peintre, traiteur, pâtisserie, snack, restaurant, coiffure et soins de beauté. Elles sont générées avec gpt-image-2 en qualité moyenne, au format 1536×1024, pour environ 0,044 $ chacune.
- L'outil travaille en **mode streaming**. Sans lui, le proxy de l'environnement cloud coupait les longues générations (erreur 502). Le **coût réel** de chaque image est calculé à partir de la consommation renvoyée par OpenAI, puis noté. L'outil s'arrête avant de dépasser le plafond accordé, et une image déjà générée n'est jamais regénérée.
- `outils/generer_images.py` crée des illustrations avec l'API d'OpenAI. Sans accord explicite sur un plafond de dépense (`--confirmer-depense`), il n'affiche qu'une estimation. Chaque dépense est notée dans `crm/donnees/depenses.csv`.
- **Sur une maquette**, ces images peuvent servir partout : le bandeau précise que les photos sont des exemples.
- **Sur un site final**, une image IA ne peut servir que d'illustration d'accueil. Elle reçoit le texte alternatif « Illustration : … » et une mention dans les mentions légales. Le générateur **refuse** une image IA utilisée comme réalisation, produit, avant/après ou photo d'équipe.

## Maquettes pour les prospects
`outils/preparer_apercus.py` et le Studio du cockpit produisent des **maquettes** : le site est « plein » pour que le prospect se projette. Les avis, les prix, les horaires et les questions sont des **exemples**, et chaque bloc le signale par une petite mention lisible. Le bandeau du haut le rappelle aussi.

Garde-fous :
- une fiche marquée `maquette` ne peut **pas** produire de site final (`generer_site.py` refuse sans l'option `--apercu`) ;
- les maquettes ne sont jamais indexées par les moteurs de recherche ;
- la note d'exemple n'est jamais déclarée aux moteurs de recherche (`aggregateRating`) ;
- le formulaire d'une maquette est désactivé.

Photos de plomberie (novembre 2026) : lavabo en pierre sombre, salle de bain d'hôtel, douche en mosaïque, robinetterie, et un plombier en intervention pour « Qui sommes-nous ». Crédits dans `modeles-sites/images-demo/CREDITS.md` ; une photo est sous CC BY 2.0, son crédit est affiché sous la photo.

## Contrôle qualité
Les sites doivent être servis en HTTP, car le mode `file://` bloque les polices :
```
cd site && python -m http.server 8080
node tests/qa_demos.js http://127.0.0.1:8080/exemples chemin/axe.min.js
BASE=http://127.0.0.1:8080 node tests/verifier_pages.js
```
`qa_demos.js` contrôle, pour chaque site :
- 7 largeurs, de 320 à 1920 px : pas de débordement, pas d'erreur, images chargées, cibles tactiles d'au moins 24 px ;
- le menu mobile au clavier (Échap, retour du focus) et le lien d'évitement ;
- le formulaire : erreurs en français, focus, désactivation sur une démo ou un aperçu ;
- axe-core, selon WCAG 2.2 AA et les bonnes pratiques.

Pour d'autres sites, comme les aperçus : `SITES=dossier1,dossier2 node tests/qa_demos.js http://127.0.0.1:8081 axe.min.js`.

Résultats du 4 novembre 2026 sur les 3 démos et les 6 aperçus : QA conforme, 0 violation axe. Lighthouse sur les démos :
- mobile : performance de 97 à 100, accessibilité, bonnes pratiques et référencement à 100 ;
- ordinateur : 100 partout.
