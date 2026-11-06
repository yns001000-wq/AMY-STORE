# Ce qui fait vendre un site de petite entreprise, et comment nos modèles l'appliquent

_Synthèse du 03/11/2026. Les sources sont surtout des agences et des éditeurs de logiciels : ce sont des **bonnes pratiques convergentes**, pas des garanties chiffrées. Les vrais résultats se mesurent sur chaque site (demandes reçues)._

## Principes communs à tous les métiers
| Principe | Pourquoi | Dans nos modèles |
|---|---|---|
| Action principale visible en permanence sur mobile | La majorité des visites locales se font sur téléphone, et l'appel ou la commande doit être à un geste | Barre fixe en bas d'écran (Appeler / WhatsApp / Réserver / Panier), bouton dans l'en-tête |
| Avis clients près des boutons d'action | Selon BrightLocal (enquête annuelle), une très large majorité de consommateurs lit les avis avant de choisir un commerce local (96 à 98 % selon les éditions et les sources) | Note et nombre d'avis dans le haut de page, section avis avec auteur, date et source |
| Preuves de confiance concrètes | Assurance, devis gratuit, délais : elles rassurent avant le premier contact | Bande « confiance » sous le haut de page (**uniquement des éléments vrais et justifiables**) |
| Vraies photos | Elles montrent le travail réel, sont plus crédibles que des images génériques, et rendent les produits plus appétissants | Grande photo de haut de page, galerie de réalisations, photo par produit |
| Prix ou « à partir de » affichés | Ils réduisent l'hésitation et filtrent les demandes non adaptées | Prix sur les services, carte de tarifs complète (beauté), prix des produits |
| Process clair en 3 étapes | Il rend la démarche simple | Section « Comment ça se passe » |
| Informations pratiques | Horaires, zone, adresse | « Ouvert maintenant » calculé en direct, horaires du jour surlignés, communes desservies, bouton Itinéraire |
| Réponses aux objections | Elles lèvent les derniers freins | FAQ dépliable |
| Page rapide, sans dépendance externe | La lenteur fait fuir sur mobile | Fichier unique, polices du système, images optimisées et chargées au fil du défilement |

## Par métier
**Artisans** : téléphone en très grand, devis gratuit, intervention rapide, assurance, réalisations, zone d'intervention et communes, urgence.

**Métiers de bouche** : carte en HTML (pas en PDF) avec photos, catégories, badges « le plus commandé » (seulement si c'est vrai), total visible, choix retrait ou livraison et date, délai de commande, allergènes, et zéro création de compte (la commande part sur WhatsApp).

**Beauté** : grille de tarifs avec durées, bouton « Réserver » permanent (vers l'outil de réservation du client ou WhatsApp), galerie d'ambiance, avis, horaires.

## Règles sur les avis (non négociables)
- Seulement des **avis réels**, recopiés **sans modification**, avec leur **source** et leur **date**, et sans tri qui ne garderait que les bons.
- **Jamais** d'avis inventé, rédigé à la place du client ou obtenu contre une contrepartie. Les faux avis sont des pratiques commerciales trompeuses sanctionnées (Code de la consommation, contrôles de la DGCCRF).
- Les démos fictives affichent un **avertissement visible** (« avis d'exemple ») et ne déclarent pas de note aux moteurs de recherche.
- Pour un vrai client, la note n'est déclarée aux moteurs de recherche (`aggregateRating`) que si elle correspond à ses vrais avis.

## Sources
- BrightLocal, Local Consumer Review Survey — https://www.brightlocal.com/research/local-consumer-review-survey/
- FieldPro Max, conseils pour une page de plombier qui convertit — https://www.fieldpromax.com/blog/9-tips-for-converting-plumbing-landing-page
- PushLeads, éléments de conversion d'un site de plombier — https://pushleads.com/plumber-seo-guide/conversion-elements-every-successful-plumbers-website-needs/
- Chowly, 7 éléments d'un site de restaurant qui convertit — https://chowly.com/resources/blogs/restaurant-website-design-7-elements-of-a-high-converting-restaurant-website/
- Fiducial MyHair, prise de rendez-vous en ligne pour salon — https://www.fiducial.fr/MyHAIR/Blog/Pourquoi-et-comment-proposer-la-prise-de-rendez-vous-en-ligne-pour-un-salon-de-coiffure
- independant.io, site internet de salon de coiffure — https://independant.io/site-internet-salon-coiffure/
- Faux avis en ligne : état du droit en 2026 — https://consultation.avocat.fr/blog/etienne-bucher/article-2981104-faux-avis-en-ligne-etat-du-droit-et-des-risques-en-2026.html
- Photos de démonstration : Wikimedia Commons, licence CC0 — voir `modeles-sites/images-demo/CREDITS.md`

## Étude des concurrents (6 novembre 2026)
Ce sont des micro-entrepreneurs et de petites agences qui vendent des sites vitrines aux artisans. Pages lues : Kacz Web (« Site internet pour plombier chauffagiste »), une offre ComeUp « site premium d'artisan plombier, 19 pages », un article de Kolonell sur les demandes de devis en ligne. Liens dans SOURCES.md. **Tous leurs chiffres de conversion sont des affirmations de vendeurs, sans source vérifiable.**

**Ce qu'ils mettent sur les sites livrés :**
- bouton d'appel dès le premier écran mobile, numéro répété en bas de page ;
- **tarifs de dépannage affichés**, présentés comme une obligation (arrêté du 24 janvier 2017) : taux horaire TTC, déplacement, forfaits, coût éventuel du devis ;
- qualifications (RGE, QualiPAC, Qualibat) : « seulement ce que vous détenez » ;
- formulaire de **4 champs** : nom, téléphone, commune, besoin ;
- avis avec lien vers la fiche Google, galerie avant/après, WhatsApp, prise de rendez-vous ;
- référencement local : pages par service et par ville voisine, données structurées LocalBusiness, sitemap.

**Leurs offres :**
- 690 € payés une fois, 1 à 3 pages, en 1 à 2 semaines, avec 2 mois d'accompagnement, puis 22 €/mois facultatif ;
- environ 48 $ sur une plateforme de freelances, pour 19 pages en 3 jours (service affiché comme indisponible) ;
- 380 € à 1 220 € environ chez une agence étrangère.

**Ce que nous avons repris (modèles et Studio) :**
- formulaire en 4 champs, avec la commune facultative ;
- promesse de délai de réponse sous les boutons et sous le formulaire ;
- bloc « Tarifs de dépannage » pour les plombiers, chauffagistes et électriciens ;
- qualifications réelles uniquement, jamais sur une maquette ;
- galerie avant/après, réservée aux vraies photos ;
- données structurées enrichies (horaires, communes desservies, services, réseaux), adresse canonique, `sitemap.xml` et `robots.txt` pour le site final.

**Non repris pour l'instant :** les pages « par ville ». Copiées d'un modèle, elles sont pénalisées par Google comme pages satellites. À proposer en option uniquement avec un vrai contenu propre à chaque page.

