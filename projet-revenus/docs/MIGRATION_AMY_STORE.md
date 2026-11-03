# AMY Store 30K : point d'attention sur l'hébergement (RIEN N'A ÉTÉ MODIFIÉ)

**Constat :** votre boutique (`index.html` à la racine du dépôt) est déployée sur Vercel. D'après la documentation officielle de Vercel, la formule gratuite **Hobby est réservée à un usage personnel et non commercial**. Une boutique qui vend des articles est a priori un usage commercial.

**Risque :** Vercel peut suspendre le projet. Cela ne s'est pas forcément produit, mais c'est contraire à ses conditions.

**Options (votre décision 🔐) :**
1. **Passer sur Netlify (gratuit)**, en environ 10 minutes :
   - glissez le dossier contenant `index.html` sur https://app.netlify.com/drop ;
   - vérifiez que la boutique fonctionne (panier, puis WhatsApp) ;
   - mettez à jour les liens partagés vers la nouvelle adresse ;
   - supprimez ensuite le projet sur Vercel.
2. **Passer sur Cloudflare Pages (gratuit)** : même principe.
3. **Rester sur Vercel en formule Pro (payante)** : 🔐 dépense à approuver. Le tarif est à vérifier sur vercel.com/pricing.

**Je n'ai rien modifié** : ni `index.html`, ni `vercel.json`, ni `README.md`. Le seul ajout à la racine est `.vercelignore`, qui empêche le dossier `projet-revenus/` d'être publié avec votre boutique. Vos documents internes ne sont donc pas exposés sur l'adresse de la boutique.
