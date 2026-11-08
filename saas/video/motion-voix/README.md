# Version « motion » avec voix off (vertical 9:16, environ 54 s)

Une troisième version, avec un motion design très dynamique :

- transitions par révélation circulaire, d'une couleur différente à chaque scène ;
- scènes en 3D avec perspective : boutiques qui pivotent, cartes qui arrivent du fond, téléphone qui tourne, devis qui bascule ;
- sol en grille animé, halos lumineux, reflets qui balaient les cartes, secousses sur les impacts, confettis et particules ;
- gros sous-titres façon TikTok : 1 à 3 mots à la fois, mot prononcé mis en couleur.

## Voix

La voix est **Chatterbox multilingue** (Resemble AI, licence **MIT**), guidée par de vraies phrases d'une locutrice française.

Ces phrases viennent du corpus **SIWIS** (université d'Édimbourg, licence **CC BY 4.0**), téléchargées dans `ref-humaine.wav`, qui n'est pas versionné.

Chaque phrase est générée jusqu'à 3 fois. Une transcription Whisper vérifie automatiquement qu'elle est bien comprise et garde la meilleure prise (`voix.py`). La voix est ensuite légèrement rajeunie : hausse de hauteur de 4,5 % avec formants préservés.

Mentions conseillées dans la description de la publication :

- « Voix de synthèse (Chatterbox, référence SIWIS CC BY 4.0) » ;
- l'option « contenu généré par IA » de la plateforme.

## Fabrication

```bash
# environnement : torch (CPU), chatterbox-tts, faster-whisper, librosa (voir voix.py)
python voix.py         # → prise-*.wav et choix de la meilleure prise dans script.json
python3 construire.py  # → video.html, calé sur les durées de la voix
python3 mixage.py      # → mix-voix.wav (utilise ../bande_son.py)
node rendu.js          # → MySite-motion-voix.mp4
```

## Version voix d'homme

`chaine.sh` enchaîne tout : la voix, le traitement, le montage, le mixage et le rendu. Le résultat est `MySite-motion-voix-homme.mp4`.

La voix est guidée par un lecteur bénévole de LibriVox (« Cinq semaines en ballon », enregistrement du **domaine public**), dont on prend un extrait de 16 s. Ce lecteur a été choisi par analyse automatique de trois voix d'homme : hauteur d'environ 115 Hz, intonation vivante, peu de bruit de fond. Le texte et ses prises sont dans `script-homme.json`.
