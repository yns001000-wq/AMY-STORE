# Cockpit Mysite — votre espace privé de prospection

**Adresse :** https://claude.ai/artifact/V6BmL9ZDXnEWohf6wTKba6 (lien privé : il ne fonctionne que pour vous, connecté à votre compte Claude)

## Ce que vous y trouvez
| Onglet | Utilité |
|---|---|
| **Aujourd'hui** | Chiffre du mois et objectif de 1 000 €, actions à faire (relances, RDV, avec les retards en rouge), prochains prospects à appeler, résultats par segment |
| **Prospects** | Tous vos prospects : recherche, filtres (statut, segment, métier), numéro de téléphone, statut, prochaine action. Un clic ouvre la fiche |
| **Fiche prospect** | Numéro à copier ou appeler, bouton « Chercher sur Google Maps » si le numéro manque, boutons de résultat en un clic (pas de réponse, intéressé, RDV, devis, gagné, refus, ne plus contacter), notes, historique, aperçu du site préparé, rédaction d'un message par Claude |
| **Ventes** | Ventes, encaissé et reste à encaisser, bouton « Solde reçu » |
| **Messages types** | Script d'appel, SMS, email, relance et récapitulatif, remplis automatiquement avec le nom du prospect, plus les avertissements par pays |

## Ce qui est automatique
- **Les prochaines actions se planifient seules** à chaque résultat noté :
  - appel sans réponse : rappel 2 jours ouvrés plus tard, et arrêt après 3 tentatives ;
  - message laissé : relance à J+3 ouvrés ;
  - devis envoyé : relance du devis à J+3 ouvrés ;
  - RDV fixé : action à la date choisie.
- **L'historique** se remplit tout seul (50 dernières entrées par prospect).
- **Une vente gagnée** crée la ligne de vente (montant et acompte pré-remplis selon l'offre) et met à jour l'objectif du mois.
- **Claude rédige** un SMS, un email, un message Instagram ou un script d'appel à partir de la fiche. La première fois, Claude vous demande l'autorisation : cela consomme votre forfait Claude. **Rien n'est envoyé automatiquement.**
- **Export CSV** (bouton dans Prospects) pour garder une copie sur votre ordinateur. Une confirmation vous est demandée avant l'enregistrement.
- **Ajout de nouveaux prospects par Claude** : la routine du lundi trouve de nouvelles entreprises (`outils/trouver_prospects.py`), prépare l'envoi (`outils/exporter_cockpit.py`), puis Claude les ajoute au cockpit avec son outil de base de données. Les prospects déjà présents ne sont jamais dupliqués, car leur identifiant est fixe : « p » + SIREN.

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
