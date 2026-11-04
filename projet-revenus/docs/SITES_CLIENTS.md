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
- **Couleur du client** (`couleur`) : le générateur calcule des variantes dont le contraste respecte le niveau AA (4,5:1). Ces variantes servent aux textes sur fond blanc, aux boutons et aux bandes sombres. Une couleur trop claire reste donc lisible.
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
