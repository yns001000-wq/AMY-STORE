# Mettre en ligne un site (page de l'offre ou site d'un client)

Les sites sont de simples fichiers HTML : aucune « compilation » n'est nécessaire.

## Option recommandée : Netlify (formule gratuite, usage commercial autorisé d'après Netlify)
1. 👤 Créez un compte sur https://app.netlify.com/signup avec **votre** email. Pour un client, c'est **son** email, et il saisit lui-même son mot de passe.
2. 👤 Allez sur https://app.netlify.com/drop.
3. 👤 Glissez-déposez le **dossier** du site :
   - pour la page de l'offre : `projet-revenus/site` ;
   - pour un client : `clients/{slug}/{slug}`, c'est-à-dire le dossier qui contient `index.html`.
4. Netlify affiche une adresse du type `nom-aleatoire.netlify.app`. Vous pouvez la renommer dans Site configuration → Change site name.
5. **Formulaires** : Netlify détecte les formulaires marqués `data-netlify="true"`. Envoyez un message de test depuis le site en ligne, puis vérifiez qu'il apparaît dans l'onglet « Forms ». Activez ensuite la notification par email (Forms → Form notifications). *Ce point n'est vérifiable qu'une fois le site en ligne : c'est le critère de fin de la phase 3.*
6. **Nom de domaine** (facultatif, 🔐 payant) : Domain management → Add a domain, puis suivez les instructions DNS de votre registraire.
7. Recopiez les coordonnées de l'hébergeur (page légale de Netlify) dans les mentions légales.

## Solution de remplacement : Cloudflare Pages
https://pages.cloudflare.com → Create a project → Direct Upload → déposez le dossier.
⚠️ Les formulaires Netlify ne fonctionnent pas sur Cloudflare : remplacez alors le formulaire par les boutons Appel, WhatsApp et Email (déjà présents sur les pages).

## Mettre à jour
Redéposez le dossier modifié au même endroit (Netlify : onglet « Deploys », zone de dépôt en bas de page).

## Ce qu'il ne faut pas faire
- Ne pas héberger l'activité ni les clients sur la formule gratuite de Vercel (Hobby), réservée à un usage non commercial.
- Ne jamais écrire un mot de passe dans un fichier du projet.
