# Questionnaire client (à remplir pendant l'échange de 15 min)

Claude transforme vos réponses en fiche JSON (`clients/{slug}/fiche.json`), puis génère le site avec `outils/generer_site.py`.

| Question | Champ de la fiche |
|---|---|
| Pays : France, Belgique ou Suisse | `pays` (FR, BE ou CH) |
| Nom de l'entreprise tel qu'il doit apparaître | `nom` |
| Métier en quelques mots (« plombier chauffagiste ») | `metier` |
| Ville principale / zone couverte | `ville`, `zone` |
| En une phrase : pourquoi un client vous choisit ? | `accroche` |
| Présentation en 3 ou 4 phrases (parcours, façon de travailler) | `description` |
| Vos 3 à 6 services principaux, avec une phrase chacun | `services` |
| 3 points forts **vérifiables** (devis gratuit, assurance décennale, années d'expérience…) | `atouts` |
| Horaires | `horaires` |
| Téléphone affiché / numéro WhatsApp | `telephone`, `whatsapp` |
| Email affiché (facultatif) | `email` |
| Adresse affichée ? (beaucoup d'artisans préfèrent ne pas l'afficher) | `adresse` |
| Modèle : artisan, commande-whatsapp ou beaute | `modele` |
| Couleur préférée ou couleur du logo / camion | `couleur` |
| (Commande WhatsApp) Produits : nom, description, prix, options | `produits` |
| Mentions légales : statut, numéro d'entreprise (SIRET en France, BCE en Belgique, IDE en Suisse), adresse de l'éditeur, responsable de la publication | `statut_juridique`, `numero_entreprise`, `adresse_editeur`, `responsable_publication` |
| Photos : 1 grande photo (chantier, boutique, produit phare) + 4 à 8 photos de réalisations ou de produits. Le client les fournit et **confirme en avoir les droits** | `images.hero`, `images.galerie`, `produits[].image` (fichiers dans `clients/{slug}/images/`) |
| Avis Google ou autres : note, nombre d'avis, lien, 3 avis **réels** recopiés tels quels avec prénom + initiale et date | `avis` (`note`, `nombre`, `source`, `lien`, `liste`) |
| Horaires précis par jour (pour le badge « Ouvert maintenant ») | `horaires_semaine` (ex. `"lun": "08:00-12:00,14:00-18:30"`) |
| Communes desservies | `communes` |
| 3 à 5 questions que les clients posent souvent | `faq` |
| Prix « à partir de » par service (artisan), grille de prestations avec durée (beauté), catégories de produits (bouche) | `services[].prix`, `prestations`, `produits[].categorie` |
| Lien de réservation existant (Planity, etc.) | `reservation_url` |

⚠️ **Points de vigilance :**
- n'écrire aucun atout invérifiable (« n° 1 de la région », « 500 clients satisfaits ») sans preuve ;
- ne mentionner « RGE » ou « assurance décennale » que si le client vous en a montré le justificatif.
