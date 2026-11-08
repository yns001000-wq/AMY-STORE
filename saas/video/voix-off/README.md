# Version voix off (vertical 9:16, environ 52 s)

C'est une autre façon de présenter MySite : un récit à la deuxième personne (« Tu cherches un vrai complément de revenus ? »).

- **Style** : clair et coloré, avec des cartes à bordures épaisses et ombres décalées.
- **Sous-titres** : affichés mot à mot, façon TikTok.
- **Voix off** : une voix féminine française de synthèse.
- **Musique** : lo-fi, baissée automatiquement sous la voix.

## Voix

La voix est produite par **Kokoro** (modèle sous licence Apache 2.0, version `kokoro-onnx`), voix française `ff_siwis`. Cette voix a été entraînée sur le corpus SIWIS, sous licence **CC BY 4.0**.

Pour la rendre plus jeune et plus naturelle :

- débit à 1,06 ;
- hausse de 1 demi-ton ;
- égalisation douce ;
- légère ambiance de pièce.

La licence CC BY 4.0 impose de citer la voix : ajoutez par exemple « Voix : Kokoro / SIWIS (CC BY 4.0) » dans la description de la publication.

Sur TikTok et Instagram, signalez aussi le contenu comme généré ou modifié par IA : c'est une voix de synthèse.

## Fabrication

```bash
pip install kokoro-onnx soundfile
# modèles : kokoro-v1.0.onnx et voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx, releases model-files-v1.0)
# 1. voix-0.wav … voix-9.wav à partir de script.json (voix ff_siwis, speed 1.06, +1 demi-ton), puis timeline.json (durées)
python3 construire.py        # → video-voix.html, calé sur timeline.json
python3 mixage.py            # → mix-voix.wav (utilise ../bande_son.py pour les instruments)
node rendu.js                # → MySite-voix-off-vertical.mp4
```

Les textes à l'écran et ceux qui sont lus diffèrent sur un point : « MySite » est écrit « Maï Saïte » dans le texte lu (`tts`), pour que la voix le prononce à l'anglaise.
