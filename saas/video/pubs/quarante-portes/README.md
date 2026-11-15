# « Quarante portes » : motion design sur le film d'animation

Le film d'origine (53 s, 752 × 560) est agrandi en 1504 × 1120. Par-dessus, `montage.html` anime :

- des compteurs (« 40 commerces démarchés à pied », tampon « 0 site vendu », « 15 commerces trouvés ») ;
- un téléphone avec les **vrais écrans de MySite** (carte des prospects, tableau de bord, message rédigé, Académie, issus de `../images/`) ;
- une **maquette générée par le moteur du Studio** pour un restaurant fictif (« La Table d'en Bas ») au moment où la grand-mère dit « C'est le restaurant d'en bas », puis une boulangerie fictive ;
- des étiquettes calées sur les répliques, la carte de fin (mysite-app.com, lien en bio) et des sous-titres corrigés.

Mention permanente quand le téléphone est à l'écran : « Écrans réels de l'application MySite · données d'exemple ».

## Fabrication

1. Images du film : `ffmpeg -i film.mp4 -vf scale=1504:1120:flags=lanczos -q:v 2 images/%05d.jpg`
2. Écrans : `ecrans/` (captures de `../images/` et maquettes du Studio capturées au format téléphone).
3. Contrôle : `node apercus.js 4.8,15.5,35`
4. Rendu : `node rendu-qp.js sortie.mp4` (ajouter `sansSous` pour la version sans sous-titres). Le son d'origine est copié tel quel.

`transcrire.py` : minutage des répliques (faster-whisper, mots horodatés).
