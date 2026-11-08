# Vidéo de présentation MySite (48 s)

Deux formats : 16:9 (1920 × 1080, YouTube, site, LinkedIn) et 9:16 (1080 × 1920, TikTok, Reels, Shorts). En vertical, le texte reste hors des zones recouvertes par les boutons des applications.

Vidéo de présentation du SaaS : Trouver, Montrer, Signer, Livrer, Encaisser, puis l'Académie. Format 1920 × 1080, 30 images/s, son stéréo.

- `video.html` : le montage. Toutes les animations sont en CSS ; `window.rendre(t)` place la vidéo à l'instant `t` (en secondes). Ouvert dans un navigateur, le montage tourne en boucle.
- `bande_son.py` : ambiance lo-fi détendue (piano électrique, batterie lente, basse ronde, grain de vinyle) et bruitages doux synchronisés, entièrement synthétisés (aucun droit d'auteur). Le script produit `bande_son.wav`.
- `rendu.js` : capture chaque image avec Playwright, puis assemble la vidéo avec ffmpeg en MP4 H.264 + AAC. Le son est normalisé à −14 LUFS, le niveau attendu par YouTube, Instagram et TikTok.
- `apercus.js` : captures d'instants précis, pour vérifier le montage (`node apercus.js 5,12.3 vertical`).
- Format vertical : `video.html?vertical`. Les mêmes scènes sont recomposées (texte en haut, visuel en dessous).

Images : `telephone.jpg` et `site-ordi.jpg` sont des captures d'un site d'exemple généré par le Studio ; `ia-pizzeria-four.webp` vient de la banque de photos MySite.

```bash
python3 bande_son.py   # → bande_son.wav (numpy requis)
node rendu.js          # → MySite-presentation.mp4 (16:9 ; Playwright et ffmpeg requis, environ 7 min)
node rendu.js vertical # → MySite-presentation-vertical.mp4 (9:16)
```
