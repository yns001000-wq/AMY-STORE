"""Mixage de la version voix off : voix (Piper, voix SIWIS, CC BY 4.0), fond lo-fi atténué sous la voix, bruitages doux."""
import json, wave
import numpy as np
src = open("bande_son.py").read()
exec(src.split("# ------------------------------------------------------------ musique")[0])  # instruments et bruitages
tl = json.load(open("timeline.json"))
S = {x["id"]: x for x in tl["scenes"]}
DUREE = tl["total"]; N = int(SR * DUREE)
mix = np.zeros((N, 2)); musique = np.zeros((N, 2)); voix = np.zeros(N)
tt = np.arange(N) / SR

def lire(fichier):
    with wave.open(fichier) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(float) / 32768

# --- voix
for k, sc in enumerate(tl["scenes"]):
    v = lire(f"voix-{k}.wav")
    i = int(sc["voix"] * SR); voix[i:i + len(v)] += v[: N - i]
voix /= np.max(np.abs(voix)) / 0.8

# --- fond lo-fi (mêmes accords que la version musicale, sans mélodie pour laisser la place à la voix)
GRILLE = [(["F3", "A3", "C4", "E4", "G4"], "F1"), (["E3", "G3", "B3", "D4"], "E1"), (["D3", "F3", "A3", "C4", "E4"], "D2"), (["C3", "E3", "G3", "B3", "D4"], "C2")]
for k, debut in enumerate(np.arange(0, DUREE - 1, 2.0)):
    notes, bas = GRILLE[k % 4]
    poser(accord_rhodes(notes, 2.6, 0.8), debut, 0.5, pan=-0.15, cible=musique)
    poser(basse(hz(bas), 1.4), debut, 0.38, cible=musique)
    if debut + 2 < DUREE - 3:
        poser(kick_doux(), debut, 0.6, cible=musique)
        poser(kick_doux(), debut + 0.78, 0.38, cible=musique)
        poser(caisse_douce(), debut + 1.02, 0.32, cible=musique)
        for j in range(8):
            poser(shaker(), debut + j * 0.25 + (0.035 if j % 2 else 0), 0.13 if j % 2 else 0.07, pan=0.35, cible=musique)
vin = vinyle()[:N] if len(vinyle()) >= N else np.pad(vinyle(), (0, N - len(vinyle())))
musique[:, 0] += vin * 0.7; musique[:, 1] += np.roll(vin, 337) * 0.7

# --- atténuation de la musique sous la voix (enveloppe lissée)
actif = np.convolve((np.abs(voix) > 0.02).astype(float), np.ones(int(SR * 0.25)) / int(SR * 0.25), mode="same")
actif = np.convolve(np.clip(actif * 4, 0, 1), np.ones(int(SR * 0.15)) / int(SR * 0.15), mode="same")
gain_m = 0.55 - 0.33 * actif
musique *= gain_m[:, None]
mix += musique
mix[:, 0] += voix; mix[:, 1] += voix

# --- bruitages doux, calés sur l'image
for sc in tl["scenes"][1:]:
    poser(souffle(0.7), sc["debut"] - 0.3, 0.16, pan=-0.2)
r = S["rue"]["debut"]
for o in [0.3, 0.5, 0.7]: poser(tampon_doux()[: int(SR * 0.25)], r + o + 0.35, 0.25, pan=-0.3 + o)
c = S["constat"]["debut"]
for o in [0.7, 1.3, 1.9]: poser(bulle(520), c + o + 0.05, 0.18, pan=0.3)
t3 = S["trouver"]["debut"]
for k in range(16): poser(touche(), t3 + 0.5 + k * 0.056, 0.3, pan=0.3)
for k, o in enumerate([1.6, 1.85, 2.1, 2.35]): poser(bulle(440 + 40 * k), t3 + o + 0.1, 0.16, pan=-0.3)
m = S["maquette"]["debut"]
for o in [1.6, 2.4, 3.3]: poser(bulle(560), m + o + 0.05, 0.16, pan=0.3)
v = S["visite"]["debut"]
poser(cloche(["E5", "G5", "C6"], pas=0.1), v + 1.9, 0.14, pan=0.3)
d = S["devis"]["debut"]
poser(tampon_doux(), d + 2.4, 0.4); poser(cloche(["C5", "E5", "G5"]), d + 2.5, 0.14)
e = S["enligne"]["debut"]
for k in range(13): poser(touche(), e + 0.6 + k * 0.07, 0.3, pan=0.3)
poser(cloche(["E5", "G5", "C6", "E6"], pas=0.08), e + 1.7, 0.16)
f = S["encaisser"]["debut"]
poser(tampon_doux()[: int(SR * 0.3)], f + 1.3, 0.3); poser(cloche(["G5", "E6"], pas=0.14), f + 1.32, 0.16)
a = S["academie"]["debut"]
for o in [1.0, 1.5, 2.0]: poser(bulle(500), a + o + 0.1, 0.14)
z = S["fin"]["debut"]
poser(nappe_finale(4.0), z, 0.4); poser(cloche(["C5", "E5", "G5", "B5", "D6"], pas=0.1, d=2.4), z + 0.15, 0.16)

fin = np.clip((DUREE - tt) / 1.4, 0, 1)[:, None]; deb = np.clip(tt / 0.3, 0, 1)[:, None]
mix = np.tanh(mix * fin * deb * 0.95); mix /= np.max(np.abs(mix)) / 0.89
with wave.open("mix-voix.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype("<i2").tobytes())
print("ok", DUREE)
