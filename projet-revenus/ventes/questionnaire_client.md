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
| Couleur préférée ou couleur du logo / camion | `couleur` |
| (Commande WhatsApp) Produits : nom, description, prix, options | `produits` |
| Mentions légales : statut, numéro d'entreprise (SIRET en France, BCE en Belgique, IDE en Suisse), adresse de l'éditeur, responsable de la publication | `statut_juridique`, `numero_entreprise`, `adresse_editeur`, `responsable_publication` |
| Photos et logo : le client les fournit et **confirme en avoir les droits** | (dossier `clients/{slug}/images/`) |

⚠️ **Points de vigilance :**
- n'écrire aucun atout invérifiable (« n° 1 de la région », « 500 clients satisfaits ») sans preuve ;
- ne mentionner « RGE » ou « assurance décennale » que si le client vous en a montré le justificatif.
