"""Bande-son de la vidéo MySite : ambiance lo-fi détendue (piano électrique, batterie lente, basse ronde, grain de vinyle)
et bruitages doux synchronisés avec l'image. Tout est synthétisé : aucun droit d'auteur.
Usage : python3 bande_son.py [sortie.wav]"""
import sys
import wave
import numpy as np

SR = 48000
DUREE = 48.0
N = int(SR * DUREE)
rng = np.random.default_rng(11)
mix = np.zeros((N, 2))
SORTIE = sys.argv[1] if len(sys.argv) > 1 else "bande_son.wav"

def t_(d):
    return np.arange(int(SR * d)) / SR

def poser(sig, debut, gain=1.0, pan=0.0, cible=None):
    cible = mix if cible is None else cible
    i = int(debut * SR)
    if i >= N or i + len(sig) <= 0:
        return
    g, d = np.cos((pan + 1) * np.pi / 4) * 1.414, np.sin((pan + 1) * np.pi / 4) * 1.414
    fin = min(N, i + len(sig))
    cible[i:fin, 0] += sig[: fin - i] * gain * g
    cible[i:fin, 1] += sig[: fin - i] * gain * d

def adoucir(sig, largeur):
    """Passe-bas simple (moyenne glissante) : enlève le côté « électronique » des sons."""
    k = np.ones(largeur) / largeur
    return np.convolve(sig, k, mode="same")

def hz(nom):
    notes = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    return 440 * 2 ** ((notes[nom[:-1]] + (int(nom[-1]) - 4) * 12) / 12)

# ------------------------------------------------------------ instruments lo-fi
def rhodes(f, d, force=1.0):
    """Piano électrique : fondamentale chaude, « tine » métallique à l'attaque, léger trémolo."""
    t = t_(d)
    corps = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3)
    cloche = 0.22 * np.sin(2 * np.pi * f * 7.02 * t) * np.exp(-t * 14) * force
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.3 * t)
    e = (1 - np.exp(-t * 180)) * np.exp(-t * 0.9)
    return (corps + cloche) * trem * e

def accord_rhodes(notes, d, force=1.0, egrene=0.018):
    out = np.zeros(int(SR * (d + egrene * len(notes))))
    for k, n in enumerate(notes):
        s = rhodes(hz(n), d, force)
        i = int(k * egrene * SR)
        out[i:i + len(s)] += s
    return out / len(notes)

def basse(f, d):
    t = t_(d)
    s = np.sin(2 * np.pi * f * t) + 0.12 * np.sin(2 * np.pi * 2 * f * t)
    return s * (1 - np.exp(-t * 60)) * np.exp(-t * 1.6)

def kick_doux():
    t = t_(0.5)
    f = 46 + 70 * np.exp(-t * 22)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.5)

def caisse_douce():
    """Caisse claire étouffée façon lo-fi : bruit filtré + corps."""
    t = t_(0.35)
    bruit = adoucir(rng.standard_normal(len(t)), 6) * np.exp(-t * 16)
    corps = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 26)
    return 0.6 * bruit + 0.35 * corps

def shaker():
    t = t_(0.09)
    return adoucir(np.diff(rng.standard_normal(len(t)), prepend=0), 3) * np.exp(-t * 45) * 0.5

def vinyle():
    """Grain de vinyle : souffle très bas et craquements épars."""
    souffle = adoucir(rng.standard_normal(N), 40) * 0.05
    craq = np.zeros(N)
    pos = rng.integers(0, N - 200, 260)
    for p in pos:
        craq[p:p + 60] += rng.standard_normal(60) * np.exp(-np.arange(60) / 8) * rng.uniform(0.05, 0.25)
    return souffle + adoucir(craq, 2)

# ------------------------------------------------------------ bruitages doux
def souffle(d=0.8, f0=250, f1=2600):
    t = t_(d)
    s = np.zeros_like(t)
    centre = f0 * (f1 / f0) ** (t / d)
    for f in np.geomspace(120, 5000, 50):
        poids = np.exp(-((np.log(f) - np.log(centre)) ** 2) / 0.3)
        s += poids * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28))
    return s * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 / 8

def bulle(f=520):
    """Petite bulle ronde (remplace les « pop » trop vifs)."""
    t = t_(0.16)
    fr = f * (1 + 0.35 * t / 0.16)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * (1 - np.exp(-t * 400)) * np.exp(-t * 22)

def clic_doux():
    t = t_(0.03)
    return adoucir(rng.standard_normal(len(t)), 4) * np.exp(-t * 180) * 0.5

def touche():
    t = t_(0.025)
    return adoucir(rng.standard_normal(len(t)), 5) * np.exp(-t * 200) * 0.3

def cloche(notes, pas=0.09, d=1.8):
    """Cloche douce (partiels de vibraphone), attaque arrondie."""
    out = np.zeros(int(SR * (d + pas * len(notes))))
    for k, n in enumerate(notes):
        t = t_(d)
        f = hz(n)
        s = (np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t * 6)) * (1 - np.exp(-t * 300)) * np.exp(-t * 2.6)
        i = int(k * pas * SR)
        out[i:i + len(s)] += s
    return out / 2

def tampon_doux():
    t = t_(0.45)
    return np.sin(2 * np.pi * (55 + 50 * np.exp(-t * 20)) * t) * np.exp(-t * 10) + adoucir(rng.standard_normal(len(t)), 8) * np.exp(-t * 30) * 0.4

def gonfle(d):
    """Montée douce avant la fin : souffle filtré qui grandit."""
    t = t_(d)
    return souffle(d, 200, 1800) * (t / d) ** 1.5 * 1.4

def nappe_finale(d):
    t = t_(d)
    s = sum(np.sin(2 * np.pi * hz(n) * t) * (1 + 0.08 * np.sin(2 * np.pi * 0.3 * t + k)) for k, n in enumerate(["C3", "G3", "E4", "B4", "D5"]))
    return s * (1 - np.exp(-t * 3)) * np.exp(-t * 0.6) / 5

# ------------------------------------------------------------ musique (tempo 80, grille sur les mesures de 2 s ... en demi-temps)
# Les changements de scène tombent toutes les 0,5 s : la musique reste calée sur cette grille, mais en ressenti lent.
GRILLE = [
    (["F3", "A3", "C4", "E4", "G4"], "F1"),   # Fa majeur 9
    (["E3", "G3", "B3", "D4"], "E1"),          # Mi mineur 7
    (["D3", "F3", "A3", "C4", "E4"], "D2"),   # Ré mineur 9
    (["C3", "E3", "G3", "B3", "D4"], "C2"),   # Do majeur 9
]
musique = np.zeros((N, 2))
for k, debut in enumerate(np.arange(0, 45, 2.0)):
    notes, bas = GRILLE[k % 4]
    poser(accord_rhodes(notes, 2.6, 0.9), debut, 0.55, pan=-0.15, cible=musique)
    if 3 <= debut < 43:
        poser(accord_rhodes(notes[1:], 1.2, 0.5), debut + 1.25, 0.22, pan=0.2, cible=musique)   # rappel syncopé
        poser(basse(hz(bas), 1.4), debut, 0.42, cible=musique)
        poser(basse(hz(bas) * 1.5, 0.5), debut + 1.5, 0.22, cible=musique)

# petite mélodie au piano, pentatonique, très espacée
MELODIE = [(5.0, "E5"), (5.75, "G5"), (7.0, "A5"), (13.0, "C6"), (13.5, "A5"), (15.0, "G5"), (21.0, "E5"), (21.75, "D5"),
           (23.0, "C5"), (29.0, "G5"), (29.5, "A5"), (31.0, "E5"), (37.0, "C6"), (37.75, "A5"), (39.0, "G5")]
for d, n in MELODIE:
    poser(rhodes(hz(n), 1.6, 0.7) * 0.5, d, 0.3, pan=0.25, cible=musique)

# batterie lente et chaloupée (grosse caisse sur les temps 1 et le contretemps, caisse claire sur le 3)
for mesure in np.arange(3.0, 42.99, 2.0):
    poser(kick_doux(), mesure, 0.7, cible=musique)
    poser(kick_doux(), mesure + 0.75 + 0.03, 0.45, cible=musique)
    poser(caisse_douce(), mesure + 1.0 + 0.02, 0.38, cible=musique)
    for j in range(8):
        retard = 0.035 if j % 2 else 0.0  # swing
        poser(shaker(), mesure + j * 0.25 + retard, 0.16 if j % 2 else 0.09, pan=0.35, cible=musique)

# léger effet de respiration sur la grosse caisse (bien plus discret qu'avant)
tt = np.arange(N) / SR
phase = ((tt - 3.0) % 2.0) / 2.0
respire = np.where((tt >= 3) & (tt < 43), 0.82 + 0.18 * np.clip(((tt - 3.0) % 1.0) / 0.35, 0, 1), 1.0)
musique *= respire[:, None]
musique[:, 0] = adoucir(musique[:, 0], 3)
musique[:, 1] = adoucir(musique[:, 1], 3)
mix += musique
vin = vinyle()
mix[:, 0] += vin * 0.9
mix[:, 1] += np.roll(vin, 337) * 0.9

# ------------------------------------------------------------ bruitages synchronisés avec l'image (doux)
poser(cloche(["C5", "G5", "E6"], pas=0.12), 0.25, 0.25)
poser(gonfle(2.4), 0.6, 0.18)
poser(kick_doux(), 3.0, 0.5)
for s in [8.0, 12.5, 19.0, 24.0, 29.5, 34.5, 39.0]:
    poser(souffle(0.8), s - 0.38, 0.28, pan=-0.2)
for k in range(15):
    poser(touche(), 3.6 + k * 0.062, 0.45, pan=0.3)
poser(clic_doux(), 4.65, 0.6)
for k, s in enumerate([4.9, 5.05, 5.2, 5.35]):
    poser(bulle(440 + 50 * k), s + 0.05, 0.2, pan=0.3)
for k in range(6):
    poser(bulle(400 + 40 * k), 8.65 + k * 0.18, 0.2, pan=0.4)
for s in [10.9, 11.2]:
    poser(bulle(620), s, 0.16, pan=0.3)
for k, s in enumerate([14.0, 14.6, 15.5, 16.4]):
    poser(bulle(500 + 40 * k), s + 0.05, 0.2, pan=[-0.4, 0.5, -0.4, 0.5][k])
for s in [20.3, 21.6]:
    poser(clic_doux(), s, 0.6, pan=-0.3)
    poser(cloche(["G5"], d=0.9), s + 0.08, 0.12, pan=0.3)
for s in [25.0, 25.4]:
    poser(bulle(460), s + 0.05, 0.2, pan=0.3)
for k in range(8):
    poser(touche(), 25.8 + k * 0.13, 0.3, pan=0.3)
poser(tampon_doux(), 27.5, 0.55)
poser(cloche(["C5", "E5", "G5", "C6"]), 27.62, 0.22)
poser(clic_doux(), 30.6, 0.65, pan=-0.3)
poser(souffle(0.7, 300, 2200), 30.75, 0.22, pan=0.3)
for k in range(13):
    poser(touche(), 31.2 + k * 0.055, 0.45, pan=0.3)
poser(cloche(["E5", "G5", "C6"]), 32.3, 0.22, pan=0.3)
for k, s in enumerate([32.6, 32.8, 33.0]):
    poser(bulle(480 + 40 * k), s + 0.05, 0.16)
poser(tampon_doux(), 36.6, 0.35, pan=-0.3)
poser(cloche(["G5", "E6"], pas=0.14), 36.62, 0.25, pan=-0.2)
for k in range(7):
    poser(bulle(420 + 30 * k), 40.0 + k * 0.25, 0.13, pan=0.3)
poser(cloche(["A4", "C5", "E5", "A5"]), 41.65, 0.2, pan=0.2)
poser(gonfle(1.9), 41.1, 0.25)
# mots finaux : un accord doux par mot
for k, s in enumerate([43.05, 43.4, 43.75, 44.1, 44.45]):
    poser(kick_doux(), s, 0.45)
    poser(accord_rhodes(GRILLE[k % 4][0], 0.6, 1.0), s, 0.35)
poser(nappe_finale(3.2), 45.0, 0.5)
poser(kick_doux(), 45.0, 0.5)
poser(cloche(["C5", "E5", "G5", "B5", "D6"], pas=0.1, d=2.2), 45.05, 0.22)

# ------------------------------------------------------------ finition
fin = np.clip((DUREE - tt) / 1.6, 0, 1)[:, None]
debut = np.clip(tt / 0.3, 0, 1)[:, None]
mix *= fin * debut
mix = np.tanh(mix * 0.8)
mix /= np.max(np.abs(mix)) / 0.89
with wave.open(SORTIE, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("ok", SORTIE)
