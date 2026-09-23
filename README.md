# AMY Store 30K — Déploiement gratuit sur Vercel

Ce dossier contient le site prêt à déployer : un seul fichier `index.html` (tout le CSS, le JS et les images produits sont déjà intégrés dedans, pas de dépendances externes à installer).

## Méthode simple — 100% dans le navigateur (pas de VS Code, pas de ligne de commande)

Comme les comptes GitHub et Vercel sont déjà liés entre eux, il ne manque
que le dépôt (le "repo") où mettre le code. On le crée directement sur
le site de GitHub, en glissant les fichiers avec la souris.

### 1. Dézippe ce fichier
Tu dois obtenir un dossier avec 3 fichiers dedans : `index.html`,
`vercel.json`, `README.md`.

### 2. Créer le dépôt sur GitHub (sans rien installer)
1. Va sur https://github.com/new
2. Donne un nom au dépôt, par exemple `amy-store30k`.
3. Laisse-le en **Public** ou **Private**, peu importe.
4. Clique sur **Create repository**.
5. Sur la page qui s'ouvre, cherche le lien **uploading an existing file**
   (souvent en bleu, dans le texte d'aide) et clique dessus.
6. Glisse les 3 fichiers du dossier dézippé (pas le dossier lui-même,
   les fichiers qui sont dedans) dans la zone de dépôt.
7. En bas de page, clique sur **Commit changes** (le bouton vert).

Ton code est maintenant sur GitHub, sans avoir touché à une seule
ligne de commande.

### 3. Importer le dépôt dans Vercel
1. Va sur https://vercel.com/new
2. Comme ton compte GitHub est déjà lié, le dépôt `amy-store30k` doit
   apparaître dans la liste. S'il n'apparaît pas tout de suite, clique
   sur **Adjust GitHub App Permissions** et autorise l'accès à ce dépôt.
3. Clique sur **Import** à côté de `amy-store30k`.
4. Ne change aucun réglage (Vercel détecte tout seul que c'est un site
   statique — pas de "Build Command", pas de "Output Directory" à
   remplir).
5. Clique sur **Deploy**. En moins d'une minute, le site est en ligne.

## Méthode alternative — glisser-déposer direct sur Vercel (sans GitHub)
1. Va sur https://vercel.com et connecte-toi.
2. Clique sur **Add New... > Project**.
3. Cherche l'option pour déposer un dossier directement (selon les
   versions de l'interface, elle peut être en bas de la page d'import).
4. Dépose le dossier dézippé.
5. Clique sur **Deploy**.

Cette méthode marche aussi, mais l'avantage de passer par GitHub
(méthode ci-dessus) c'est que chaque futur changement se refait en 30
secondes : tu modifies `index.html` sur GitHub (bouton crayon ✏️ en
haut à droite du fichier), tu commit, et Vercel republie tout seul.

## 4. Ton domaine gratuit
Une fois déployé, Vercel te donne automatiquement une adresse gratuite du type :
```
https://store30k.vercel.app
```
Tu peux la personnaliser dans **Project Settings > Domains** (le sous-domaine `.vercel.app` reste gratuit ; un vrai nom de domaine comme `.com` est payant à part, mais pas obligatoire).

## 5. Mettre à jour le site plus tard
Si tu modifies `index.html` (nouveaux produits, prix, numéro WhatsApp...) :
- Si tu es passé par GitHub : commit + push depuis VS Code (Source Control > coche les fichiers > message > **Commit** > **Sync Changes**). Vercel redéploie automatiquement.
- Si tu es passé par le glisser-déposer : reviens sur vercel.com et redépose le dossier mis à jour.

## À vérifier avant de mettre le site en ligne pour de vrai
- Le numéro WhatsApp est réglé sur `33665504025` dans le script (variable `WHATSAPP_NUMBER`) — vérifie qu'il est bon.
- Les prix, tailles et stocks sont dans la variable `products` en haut du `<script>`.
