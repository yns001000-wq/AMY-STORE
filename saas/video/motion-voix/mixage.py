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

# --- bruitages : souffle sur chaque révélation, impacts doux sur les temps forts
for sc in tl["scenes"][1:]:
    poser(souffle(0.75, 300, 3200), sc["debut"] - 0.32, 0.22, pan=-0.15)
s0 = S["stop"]["debut"]
poser(kick_doux(), s0 + 0.32, 0.8); poser(tampon_doux(), s0 + 0.34, 0.45)
poser(souffle(0.9, 200, 2000), s0 + 0.85, 0.2, pan=0.3)
p = S["pasdesite"]["debut"]
for o, g in [(0.55, 0.5), (1.6, 0.3), (1.85, 0.3)]: poser(tampon_doux(), p + o, g, pan=0.2 * o - 0.2)
t3 = S["trouver"]["debut"]
for o in [0.2, 0.9]: poser(cloche(["A5"], d=1.2), t3 + o, 0.08, pan=0.3)
for k, o in enumerate([0.6, 0.85, 1.1, 1.35]): poser(bulle(420 + 50 * k), t3 + o + 0.25, 0.18, pan=-0.3 + 0.2 * k)
m = S["maquette"]["debut"]
for o in [1.3, 2.1, 2.9]: poser(bulle(560), m + o + 0.05, 0.16, pan=0.3)
mo = S["montrer"]["debut"]
poser(gonfle(2.2), mo + 0.1, 0.16); poser(cloche(["E5", "G5", "C6", "E6"], pas=0.12), mo + 1.2, 0.14, pan=0.3)
d = S["devis"]["debut"]
for k in range(8): poser(touche(), d + 1.3 + k * 0.1, 0.25, pan=0.3)
poser(kick_doux(), d + 2.22, 0.7); poser(tampon_doux(), d + 2.22, 0.5); poser(cloche(["C5", "E5", "G5", "C6"]), d + 2.3, 0.16)
e = S["enligne"]["debut"]
poser(clic_doux(), e + 1.0, 0.7); poser(kick_doux(), e + 1.05, 0.6); poser(souffle(0.8, 300, 4000), e + 1.1, 0.25)
for k in range(13): poser(touche(), e + 1.6 + k * 0.055, 0.3, pan=0.3)
poser(cloche(["E5", "G5", "C6", "E6", "G6"], pas=0.07), e + 2.2, 0.18)
f = S["encaisser"]["debut"]
for k in range(10): poser(touche(), f + 0.3 + k * 0.13, 0.22, pan=0.3)
poser(cloche(["G5", "E6"], pas=0.14), f + 1.6, 0.16)
for k in range(6): poser(bulle(440 + 40 * k), f + 2.0 + k * 0.25, 0.13, pan=-0.3)
a2 = S["academie"]["debut"]
poser(cloche(["A4", "C5", "E5", "A5"]), a2 + 2.6, 0.16)
for o in [1.2, 1.5, 1.8]: poser(bulle(500), a2 + o, 0.14)
z = S["fin"]["debut"]
poser(kick_doux(), z + 0.1, 0.6); poser(nappe_finale(4.4), z, 0.42); poser(cloche(["C5", "E5", "G5", "B5", "D6"], pas=0.1, d=2.6), z + 0.2, 0.16)

fin = np.clip((DUREE - tt) / 1.4, 0, 1)[:, None]; deb = np.clip(tt / 0.3, 0, 1)[:, None]
mix = np.tanh(mix * fin * deb * 0.95); mix /= np.max(np.abs(mix)) / 0.89
with wave.open("mix-voix.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype("<i2").tobytes())
print("ok", DUREE)
