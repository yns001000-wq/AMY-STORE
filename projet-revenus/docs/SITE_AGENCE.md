# Site de l'agence Mysite — mode d'emploi

## Organisation
| Dossier ou fichier | Rôle |
|---|---|
| `site-src/` | **Source à modifier** : pages (`index.html`, `mentions-legales.html`, `confidentialite.html`, `merci.html`, `404.html`), en-tête et pied communs (`partiels/`), styles et script (`assets/`), police hébergée localement, images WebP |
| `site-src/infos.json` | **Vos informations** (nom, SIRET, adresse, email, téléphone, domaine, hébergeur). Aucun mot de passe |
| `outils/construire_site.py` | Assemble le site final dans `site/` |
| `site/` | **Dossier à mettre en ligne** (sans le modifier à la main) |
| `tests/qa_site_agence.js` | Contrôle qualité complet |

## Lancer le site en local
```
python outils/construire_site.py
cd site && python -m http.server 8080      # puis ouvrir http://127.0.0.1:8080
```
Ouvrir `index.html` par double-clic fonctionne aussi, mais la police de titre ne se charge pas dans ce mode : le navigateur l'interdit hors serveur.

## Ce qui fonctionne
- Une page d'accueil complète : accueil, ce qui est inclus, exemples, offres et prix, méthode J1 à J5, comparatif, questions, contact. S'y ajoutent les pages mentions légales, confidentialité, remerciement et 404.
- Menu mobile accessible (clavier, Échap, `aria-expanded`), bouton « Aperçu gratuit » toujours visible sur mobile.
- Formulaire avec validation en français :
  - erreurs annoncées aux lecteurs d'écran et focus placé sur le premier champ en erreur ;
  - envoi sans rechargement ;
  - message clair en cas d'échec ;
  - redirection vers la page de remerciement en cas de succès ;
  - champ piège anti-robots ;
  - validation par le navigateur si JavaScript est désactivé.
- Référencement : titre et description par page, URL canonique et plan du site générés dès que le domaine est connu, `robots.txt`, données structurées exactes (aucune note ni avis inventé).
- Sécurité : en-têtes Netlify (`_headers`) avec politique de sécurité du contenu, anti-intégration, `nosniff` et cache des ressources.
- Aucun cookie, aucun traceur, aucune ressource tierce : pas de bandeau de consentement nécessaire.

## Ce qui reste à configurer ou à fournir
1. **Vos informations** dans `site-src/infos.json` : nom, SIRET, adresse, email, responsable de la publication. Tant qu'elles manquent, les pages légales affichent un emplacement « [À COMPLÉTER] » surligné. `python outils/construire_site.py --strict` refuse de construire s'il en manque.
2. **Hébergeur** : recopier les coordonnées exactes de Netlify depuis sa page légale officielle, ainsi que ses garanties pour le transfert des données hors de l'Union européenne. Les sources publiques consultées donnent des adresses contradictoires : je ne les ai donc pas inventées.
3. **Réception du formulaire** : elle fonctionne avec **Netlify Forms**, une fois le site déployé sur Netlify. Activez ensuite la notification par email dans Netlify (Forms, puis Form notifications). **Elle n'a pas pu être testée ici**, faute de déploiement : le succès a été simulé. À vérifier après la mise en ligne avec un vrai envoi.
4. **Domaine** : après la mise en ligne, ajoutez l'adresse dans `infos.json` (« domaine ») et reconstruisez. Cela génère l'URL canonique et `sitemap.xml`.

## Mettre en ligne (Netlify, gratuit)
1. `python outils/construire_site.py --strict` : la commande échoue tant que les informations légales manquent.
2. Sur https://app.netlify.com/drop, glissez le dossier `site/`. Netlify lit `_headers` et sert `404.html` automatiquement.
3. Envoyez une demande de test depuis le site en ligne, puis vérifiez qu'elle apparaît dans l'onglet Forms et dans votre boîte email.
4. Ajoutez le domaine dans `infos.json`, reconstruisez, puis déposez à nouveau le dossier.

## Tests réellement exécutés (04/11/2026)
- `tests/qa_site_agence.js` sur un serveur local :
  - 5 pages × 7 largeurs (320, 375, 390, 430, 768, 1366, 1920) : aucune erreur de console, aucune ressource manquante, aucun débordement, images chargées, cibles tactiles d'au moins 24 px ;
  - 14 liens internes et ancres valides ;
  - clavier : le lien d'évitement arrive en premier et le focus est visible ;
  - menu mobile : ouverture, touche Échap, fermeture après un clic ;
  - formulaire : erreurs de saisie, échec réseau réel (serveur local) et succès simulé, avec vérification des données envoyées ;
  - axe-core (règles WCAG 2.0, 2.1 et 2.2 de niveaux A et AA, et bonnes pratiques) sur toutes les pages : **0 violation**.
- **Lighthouse 12** (page d'accueil) :
  - mobile : Performance 99, Accessibilité 100, Bonnes pratiques 100, SEO 100 (affichage principal en 2,1 s, aucun décalage de mise en page, 198 Ko au total) ;
  - ordinateur : 100 / 100 / 100 / 100.
- Tests unitaires : 28 réussis, dont la construction du site et l'équilibre des balises HTML.
- **Non testé :** la réception réelle des formulaires (nécessite le déploiement) et l'audit WCAG complet par une personne. Les tests automatiques ne détectent qu'une partie des problèmes d'accessibilité.

## Défauts restants connus
- **Exemples :** les sites de démonstration présentés suivent encore l'ancien modèle commun (cartes et dégradés). Ils seront refaits avec une direction artistique propre à chaque métier.
- **Preuves :** aucune référence client réelle pour l'instant. La crédibilité repose sur la transparence (prix, méthode, ce qui n'est pas inclus) jusqu'aux premiers clients.
