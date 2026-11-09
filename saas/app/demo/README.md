# Démo interactive de MySite

C'est une version de démonstration de l'application qui fonctionne entièrement dans le navigateur, sans compte ni serveur.

- **Les vrais composants** : Studio, devis et factures, Académie, carte, assistant de livraison et messages sont ceux de l'application, inchangés.
- **`api.ts`, le faux serveur** : il intercepte les appels `/api/*` et y répond avec les mêmes règles que le serveur réel (offres, quotas, numérotation des factures, documents émis figés). Les services externes sont simulés et le signalent : IA, Sirene, Stripe, DNS.
- **`donnees.ts`** : un compte fictif (Noa, Lyon, restauration) avec des commerces, sites, devis et factures d'exemple. L'état est gardé dans le `localStorage`, et un bouton « Réinitialiser » remet les exemples.
- **Sélecteur d'offre** (en haut) : passer de Gratuit à Ultra pour voir ce que débloque chaque abonnement.
- **`shims/`** : remplacent `next/link` et `next/navigation` par un routeur en mémoire.

## Construire

```bash
npm i --prefix /tmp/esb esbuild@0.24.2
node demo/build.mjs <dossier-de-sortie>   # → index.html, app.js, app.css, style.css, photos/, polices/
```

Le fond de carte de la démo (`tuiles/`, région lyonnaise, zooms 10 à 14) est téléchargé une seule fois depuis OpenStreetMap (© contributeurs OpenStreetMap). En effet, la page publiée ne peut pas charger d'images externes.
