# Publicités MySite pour TikTok, Reels et Shorts (9:16, environ 25 à 30 s)

Trois vidéos courtes, chacune avec une accroche différente. Toutes montrent les **vrais écrans de l'application** (capturés dans la démo, avec des données d'exemple), animés dans un téléphone.

| Vidéo | Accroche | Ce qu'elle explique | Voix |
|---|---|---|---|
| `methode` | « Vendre un site web à un commerce de ta ville ? Voilà comment ça marche. » | Toute la méthode : choisir, trouver, message, maquette, devis | Homme |
| `clients` | « Tu sais faire des sites, mais tu ne sais pas à qui les vendre ? » | Trouver des commerces : registre officiel, exclusivité, carte, suivi | Femme |
| `montrer` | « Arrête d'expliquer ce qu'est un site. Montre-le. » | La maquette et le Studio, le rendez-vous, l'Académie | Homme |

## Règles suivies

- Aucune promesse de revenus, aucun faux chiffre, aucun faux témoignage.
- Rien n'est affirmé que l'outil ne fait pas (par exemple, il ne sait pas si un commerce a déjà un site).
- Une mention reste à l'écran : « Écrans de démonstration · données d'exemple · voix de synthèse ».

## À la publication

- Cochez l'option **« contenu généré par IA »** de la plateforme (la voix est synthétique).
- Mettez un lien différent dans chaque bio pour savoir ce qui marche : `mysite-app.com/?src=tiktok`, `?src=instagram`, `?src=shorts`. Le résultat apparaît dans « Suivi des ventes ».
- Exemple de description : « Comment vendre des sites web aux commerces de ta ville, étape par étape. Gratuit pour commencer, lien en bio. Voix de synthèse. »

## Voix

**Chatterbox multilingue** (Resemble AI, licence MIT), guidé par de vraies voix françaises :

- voix d'homme : un lecteur bénévole de LibriVox (enregistrement du domaine public) ;
- voix de femme : le corpus SIWIS (université d'Édimbourg, licence CC BY 4.0).

Chaque phrase est contrôlée par une transcription automatique (Whisper). Les fichiers de référence ne sont pas versionnés.

Pour une voix encore plus naturelle, les textes de `*.json` peuvent être enregistrés avec un service payant comme ElevenLabs : il suffit de déposer un fichier `prise-<n>-0.wav` par phrase dans le dossier de travail, puis de lancer `finir.py`.

## Fabrication

```bash
python voix.py methode.json <travail> <référence.wav>   # prises de voix (torch, chatterbox-tts, faster-whisper)
python3 finir.py methode <travail> MySite-pub-methode.mp4  # nettoyage de la voix, montage, mixage, rendu
node apercus.js methode <dossier> 2,8,15                   # images de contrôle
```

- `modele.html` : le montage (animations CSS, `window.rendre(t)` place la vidéo à l'instant `t`).
- `<nom>.json` : le texte de la voix. `<nom>.scenes.json` : le découpage visuel (écran, défilement, appui du doigt, étiquettes).
- `images/` : captures des écrans de l'application.
- `mixage.py` : fond lo-fi et bruitages synthétisés (aucun droit d'auteur), via `../bande_son.py`.
