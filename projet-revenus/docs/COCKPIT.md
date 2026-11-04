# Cockpit Mysite — votre espace privé de prospection

**Adresse :** https://claude.ai/artifact/V6BmL9ZDXnEWohf6wTKba6 (lien privé : il ne fonctionne que pour vous, connecté à votre compte Claude)

## Ce que vous y trouvez (version IA du 04/11/2026)
| Vue | Utilité |
|---|---|
| **Aujourd'hui** | Indicateurs (chiffre du mois et objectif, prospects à contacter, taux de réponse, prospects chauds), **briefing IA du jour**, actions programmées (retards en rouge), **meilleures opportunités** classées par score, résultats par segment |
| **Pipeline** | Tableau en colonnes (À contacter, Contacté, A répondu, Rendez-vous, Devis, Gagné). On **glisse une carte** pour changer son statut, et l'historique se met à jour |
| **Prospects** | Liste triée par **score de priorité**, avec filtres et export CSV |
| **Assistant IA** | Conversation avec Claude, qui **consulte vos données** (prospects, fiches, statistiques) et peut **programmer des relances** à votre demande. Il ne contacte jamais personne |
| **Fiche prospect** | Numéro, bouton Google Maps, **copilote de vente IA** (préparer l'appel, rédiger un message, répondre à une objection), boutons de résultat en un clic, notes, aperçu, historique |
| **Ventes, Messages types** | Inchangés : suivi des ventes et de l'encaissé, modèles prêts à copier |
| **Recherche rapide** | `Ctrl + K`, puis le nom, la ville ou le numéro, et `Entrée` pour ouvrir la fiche |

## Ce qui est automatique
- **Score de priorité (0 à 100)**, calculé sans IA et expliqué sur chaque fiche :
  - statut : devis +45, RDV +40, a répondu +35, contacté +10 ;
  - numéro connu +20, aperçu prêt +15, pas de site +10, action due +10, entreprise créée depuis moins de 6 mois +10 ;
  - 2 appels ou plus sans réponse : −10.
- **Relances planifiées** à chaque résultat noté :
  - pas de réponse : rappel à J+2 ouvrés, et arrêt après 3 essais ;
  - message laissé ou devis envoyé : relance à J+3 ouvrés ;
  - RDV fixé : action à la date choisie.
- **Briefing IA** (bouton) : Claude lit l'état du pipeline et propose les 5 actions du jour. Une même analyse est réutilisée pendant 30 minutes, sans nouvelle consommation.
- **Assistant IA** : outils « chercher des prospects », « voir une fiche », « statistiques » et « programmer une action ». Chaque utilisation d'un outil s'affiche dans la conversation.
- **Copilote dans la fiche** : préparation d'appel (accroche, questions, objections probables), messages, réponses aux objections.
- **Gagné** crée automatiquement la vente.
- **Coût :** les fonctions IA utilisent votre forfait Claude, uniquement quand vous cliquez. Le premier usage demande votre autorisation.
- **Ajout de nouveaux prospects par Claude :** voir la routine du lundi dans AUTOMATION.md (`outils/exporter_cockpit.py`, puis l'outil de base de données de Claude).

## Confidentialité
- **Lien privé :** seul le propriétaire peut ouvrir le cockpit.
- **Base de données verrouillée :** seul le propriétaire peut lire et modifier les données. C'est vérifié : même une personne à qui vous donneriez l'accès « éditeur » ne verrait aucun prospect.
- **Hors de GitHub :** les données des prospects ne sont jamais publiées sur GitHub.
- **Limite :** l'accès « seulement sur ordinateur » ne peut pas être imposé techniquement. Le cockpit est accessible partout où **votre** compte Claude est connecté. Pour le protéger, sécurisez votre compte (mot de passe solide et validation en deux étapes sur l'adresse email ou le compte Google qui sert à vous connecter) et déconnectez Claude des appareils partagés.

## Pour Claude (maintenance)
- **Code de la page :** `cockpit/index.html`. Pour le republier sans perdre les données, publiez-le sur la même URL.
- **Collections :**
  - `prospects/p<SIREN>` : champs identiques au CSV, plus `journal` (liste `{d, t}`), `apercu_url`, `tentatives` et `modifie_le` ;
  - `ventes/<id>` : `client`, `offre`, `montant`, `encaisse`, `date`, `prospect`.
- **Règles d'accès :** `{path: "", read: "owner", write: "owner"}`.
- **Aperçus :** les captures sont importées comme fichiers de l'artifact, et l'adresse de chaque capture est enregistrée dans `apercu_url`.
