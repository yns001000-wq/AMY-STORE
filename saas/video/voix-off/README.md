# Version voix off (vertical 9:16, environ 52 s)

C'est une autre façon de présenter MySite : un récit à la deuxième personne (« Tu cherches un vrai complément de revenus ? »).

- **Style** : clair et coloré, avec des cartes à bordures épaisses et ombres décalées.
- **Sous-titres** : affichés mot à mot, façon TikTok.
- **Voix off** : une voix féminine française de synthèse.
- **Musique** : lo-fi, baissée automatiquement sous la voix.

## Voix

La voix est **Piper** (logiciel libre), voix française « SIWIS », sous licence **CC BY 4.0**.

Cette licence impose de citer la voix : ajoutez par exemple « Voix : Piper / SIWIS (CC BY 4.0) » dans la description de la publication.

Sur TikTok et Instagram, signalez aussi le contenu comme généré ou modifié par IA : c'est une voix de synthèse.

## Fabrication

```bash
pip install piper-tts
# modèles : https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis/medium (fr_FR-siwis-medium.onnx et .onnx.json)
# 1. voix-0.wav … voix-9.wav à partir de script.json (piper, --length-scale 0.93), puis timeline.json (durées)
python3 construire.py        # → video-voix.html, calé sur timeline.json
python3 mixage.py            # → mix-voix.wav (utilise ../bande_son.py pour les instruments)
node rendu.js                # → MySite-voix-off-vertical.mp4
```

Les textes à l'écran et ceux qui sont lus diffèrent sur un point : « MySite » est écrit « Maï Saïte » dans le texte lu (`tts`), pour que la voix le prononce à l'anglaise.
