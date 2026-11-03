# Liste de vérification de livraison (à cocher pour chaque client)

## Avant production
- [ ] Devis signé, avec « Bon pour accord »
- [ ] Acompte de 50 % reçu, puis vente ajoutée dans `crm/donnees/ventes.csv`
- [ ] Questionnaire rempli, fiche JSON créée
- [ ] Photos et logo reçus, droits confirmés par le client

## Production (Claude)
- [ ] `python outils/generer_site.py clients/{slug}/fiche.json --sortie clients/{slug}` lancé sans erreur
- [ ] Plus aucun avertissement « Mentions légales manquant »
- [ ] Vérification navigateur : aucune erreur, aucun débordement sur mobile (375 px), liens d'appel et WhatsApp testés
- [ ] Textes relus : orthographe, aucun atout invérifiable

## Validation
- [ ] Version envoyée au client (capture ou lien privé)
- [ ] Retours intégrés (1 série incluse)
- [ ] Validation écrite du client (email ou message)

## Mise en ligne (avec le client)
- [ ] Compte d'hébergement créé **au nom du client**, avec **son** email (le client saisit lui-même son mot de passe ; ne jamais le stocker)
- [ ] Dossier du site déposé (procédure dans `docs/DEPLOIEMENT.md`)
- [ ] Formulaire testé : un envoi réel est bien reçu
- [ ] Nom de domaine relié, si le client en a acheté un
- [ ] Mentions légales : coordonnées réelles de l'hébergeur renseignées

## Clôture
- [ ] Facture de solde envoyée, puis paiement reçu et enregistré dans le suivi (statut du prospect : `gagne`)
- [ ] Fichiers sources remis au client (zip)
- [ ] Option Sérénité proposée (si acceptée : ligne dans `abonnements.csv`)
- [ ] À J+15 : demande d'avis, uniquement si le client est satisfait (modèle n° 9)
- [ ] Accord écrit demandé pour citer le site en référence
