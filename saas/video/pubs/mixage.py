"""Mixage d'une publicité : voix, fond lo-fi atténué sous la voix, bruitages doux calés sur l'image.
Usage : python3 -I mixage.py <dossier de travail>   (lit timeline.json et voix-*.wav, écrit mix.wav)"""
import json, os, sys, wave
import numpy as np
travail = sys.argv[1]
ici = os.path.dirname(os.path.abspath(__file__))
src = open(f"{ici}/../bande_son.py").read()
exec(src.split("# ------------------------------------------------------------ musique")[0])  # instruments et bruitages
tl = json.load(open(f"{travail}/timeline.json"))
DUREE = tl["total"]; N = int(SR * DUREE)
mix = np.zeros((N, 2)); musique = np.zeros((N, 2)); voix = np.zeros(N)
tt = np.arange(N) / SR

def lire(fichier):
    with wave.open(fichier) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(float) / 32768

# SANS_VOIX=1 : musique et bruitages seuls (pour ajouter sa propre voix ensuite, par exemple dans CapCut).
if not os.environ.get("SANS_VOIX"):
    for k, sc in enumerate(tl["scenes"]):
        v = lire(f"{travail}/voix-{k}.wav")
        i = int(sc["voix"] * SR); voix[i:i + len(v)] += v[: N - i]
    voix /= np.max(np.abs(voix)) / 0.8

# fond lo-fi : accords, basse, batterie légère, grain de vinyle
GRILLE = [(["F3", "A3", "C4", "E4", "G4"], "F1"), (["E3", "G3", "B3", "D4"], "E1"), (["D3", "F3", "A3", "C4", "E4"], "D2"), (["C3", "E3", "G3", "B3", "D4"], "C2")]
for k, debut in enumerate(np.arange(0, DUREE - 1, 2.0)):
    notes, bas = GRILLE[k % 4]
    poser(accord_rhodes(notes, 2.6, 0.8), debut, 0.5, pan=-0.15, cible=musique)
    poser(basse(hz(bas), 1.4), debut, 0.38, cible=musique)
    if debut + 2 < DUREE - 2.5:
        poser(kick_doux(), debut, 0.6, cible=musique)
        poser(kick_doux(), debut + 0.78, 0.38, cible=musique)
        poser(caisse_douce(), debut + 1.02, 0.32, cible=musique)
        for j in range(8):
            poser(shaker(), debut + j * 0.25 + (0.035 if j % 2 else 0), 0.13 if j % 2 else 0.07, pan=0.35, cible=musique)
vin = vinyle(); vin = vin[:N] if len(vin) >= N else np.pad(vin, (0, N - len(vin)))
musique[:, 0] += vin * 0.7; musique[:, 1] += np.roll(vin, 337) * 0.7

# la musique s'efface sous la voix
actif = np.convolve((np.abs(voix) > 0.02).astype(float), np.ones(int(SR * 0.25)) / int(SR * 0.25), mode="same")
actif = np.convolve(np.clip(actif * 4, 0, 1), np.ones(int(SR * 0.15)) / int(SR * 0.15), mode="same")
musique *= (0.55 - 0.33 * actif)[:, None]
mix += musique
mix[:, 0] += voix; mix[:, 1] += voix

# bruitages : souffle à chaque changement de scène, bulle sur l'appui du doigt, impacts selon le type de scène
for k, v in enumerate(tl["visuel"]):
    d = v["debut"]
    if k: poser(souffle(0.7, 300, 3200), d - 0.3, 0.2, pan=-0.15 if k % 2 else 0.15)
    if v.get("tap"): poser(clic_doux(), d + v["tap"]["o"] + 0.68, 0.6); poser(bulle(520), d + v["tap"]["o"] + 0.72, 0.2)
    if v["type"] == "eventail":
        poser(kick_doux(), d + 0.15, 0.7)
        for j in range(3): poser(bulle(420 + 60 * j), d + 0.2 + j * 0.13, 0.16, pan=-0.3 + 0.3 * j)
    elif v["type"] == "choix":
        for j, o in enumerate([0.55, 1.05, 1.6]): poser(clic_doux(), d + o, 0.45, pan=0.2)
    elif v["type"] == "feuille":
        for j in range(8): poser(touche(), d + 0.9 + j * 0.16, 0.2, pan=0.3)
        poser(tampon_doux(), d + 1.12, 0.3)
    elif v["type"] == "tel":
        poser(cloche(["A5"], d=1.0), d + 1.2, 0.06, pan=0.3)
    elif v["type"] == "fin":
        poser(kick_doux(), d + 0.1, 0.6); poser(nappe_finale(4.2), d, 0.42); poser(cloche(["C5", "E5", "G5", "B5", "D6"], pas=0.1, d=2.6), d + 0.2, 0.16)

fin = np.clip((DUREE - tt) / 1.2, 0, 1)[:, None]; deb = np.clip(tt / 0.15, 0, 1)[:, None]
mix = np.tanh(mix * fin * deb * 0.95); mix /= np.max(np.abs(mix)) / 0.89
with wave.open(f"{travail}/mix.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype("<i2").tobytes())
print("mixage ok", DUREE)
