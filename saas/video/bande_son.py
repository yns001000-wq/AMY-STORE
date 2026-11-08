"""Bande-son de la vidéo MySite : musique 120 BPM et bruitages synchronisés, entièrement synthétisés (aucun droit d'auteur)."""
import wave
import numpy as np

SR = 48000
DUREE = 48.0
N = int(SR * DUREE)
rng = np.random.default_rng(7)
mix = np.zeros((N, 2))

def t_(d):
    return np.arange(int(SR * d)) / SR

def poser(sig, debut, gain=1.0, pan=0.0):
    """Ajoute un son mono (ou stéréo) au mix à l'instant `debut` (s)."""
    i = int(debut * SR)
    if i >= N:
        return
    if sig.ndim == 1:
        g, d = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * g * 1.414, sig * d * 1.414], axis=1)
    fin = min(N, i + len(sig))
    mix[i:fin] += sig[: fin - i] * gain

def env(n, att, rel, total=None):
    e = np.ones(n)
    a, r = int(att * SR), int(rel * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r) ** 2
    return e

def note_hz(nom):
    notes = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    n, o = nom[:-1], int(nom[-1])
    return 440 * 2 ** ((notes[n] + (o - 4) * 12) / 12)

# ---------------------------------------------------------------- instruments
def kick():
    t = t_(0.42)
    f = 48 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7.5) + 0.25 * np.sin(ph * 2) * np.exp(-t * 30)

def clap():
    t = t_(0.3)
    n = rng.standard_normal(len(t))
    n = np.diff(n, prepend=0)  # passe-haut
    e = np.exp(-t * 18) * (1 + 0.6 * (np.sin(2 * np.pi * 90 * t) > 0) * (t < 0.03))
    return 0.55 * n * e + 0.25 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)

def hat(ouvert=False):
    t = t_(0.18 if ouvert else 0.06)
    n = np.diff(np.diff(rng.standard_normal(len(t)), prepend=0), prepend=0)
    return 0.22 * n * np.exp(-t * (14 if ouvert else 70))

def voix_synth(f, d, harmos=(1, .5, .33, .25, .2, .14), detune=0.0):
    t = t_(d)
    s = np.zeros_like(t)
    for k, a in enumerate(harmos, start=1):
        s += a * np.sin(2 * np.pi * f * k * (1 + detune) * t + k)
    return s

def nappe(accord, d):
    s = sum(voix_synth(note_hz(n), d, (1, .35, .18, .1), dt) for n in accord for dt in (-0.004, 0.004))
    return s * env(len(s), 0.25, 0.6) / (len(accord) * 2)

def basse(nom, d):
    f = note_hz(nom)
    t = t_(d)
    s = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) + 0.2 * np.sign(np.sin(2 * np.pi * f * t)) * 0.4
    return s * env(len(t), 0.005, 0.08) * np.exp(-t * 1.2)

def pincee(f, d=0.22):
    t = t_(d)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 16)

# ---------------------------------------------------------------- bruitages
def souffle(d=0.7, f0=300, f1=5000, montee=True):
    """Whoosh : bruit coloré dont la bande de fréquences balaie f0 → f1."""
    t = t_(d)
    s = np.zeros_like(t)
    centre = f0 * (f1 / f0) ** (t / d) if montee else f1 * (f0 / f1) ** (t / d)
    for f in np.geomspace(150, 9000, 70):
        poids = np.exp(-((np.log(f) - np.log(centre)) ** 2) / 0.35)
        s += poids * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * (1 + 0.3 * rng.standard_normal())
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return s * e / 9

def pop(f=700):
    t = t_(0.11)
    f_t = f * (1 + 0.7 * t / 0.11)
    return np.sin(2 * np.pi * np.cumsum(f_t) / SR) * np.exp(-t * 30)

def clic():
    t = t_(0.035)
    return np.diff(rng.standard_normal(len(t)), prepend=0) * np.exp(-t * 160) * 0.6 + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 120) * 0.3

def frappe():
    t = t_(0.025)
    return np.diff(rng.standard_normal(len(t)), prepend=0) * np.exp(-t * 220) * 0.35

def carillon(notes=("C6", "E6", "G6", "C7"), pas=0.07, d=0.9):
    out = np.zeros(int(SR * (d + pas * len(notes))))
    for k, n in enumerate(notes):
        t = t_(d)
        s = (np.sin(2 * np.pi * note_hz(n) * t) + 0.25 * np.sin(2 * np.pi * note_hz(n) * 2.01 * t)) * np.exp(-t * 4.5)
        i = int(k * pas * SR)
        out[i:i + len(s)] += s
    return out / 2

def tampon():
    t = t_(0.5)
    sourd = np.sin(2 * np.pi * (60 + 80 * np.exp(-t * 25)) * t) * np.exp(-t * 9)
    bruit = rng.standard_normal(len(t)) * np.exp(-t * 35) * 0.5
    return sourd + bruit

def caisse():
    """« Ding » de caisse enregistreuse, synthétique."""
    a = carillon(("E7", "C7"), pas=0.11, d=1.1)
    t = t_(0.08)
    tiroir = rng.standard_normal(len(t)) * np.exp(-t * 60) * 0.3
    out = np.zeros(len(a)); out[:len(tiroir)] += tiroir
    return out + a * 1.2

def montee(d):
    t = t_(d)
    bruit = souffle(d, 200, 9000) * (t / d) ** 2 * 1.6
    ton = np.sin(2 * np.pi * np.cumsum(200 * 2 ** (t / d * 3)) / SR) * (t / d) ** 3 * 0.25
    return bruit + ton

def impact():
    t = t_(2.2)
    sub = np.sin(2 * np.pi * (38 + 60 * np.exp(-t * 8)) * t) * np.exp(-t * 2.2)
    crash = np.diff(rng.standard_normal(len(t)), prepend=0) * np.exp(-t * 3.2) * 0.35
    return sub + crash

# ---------------------------------------------------------------- musique
BPM, BATTEMENT = 120, 0.5
GRILLE = [("A", ["A3", "C4", "E4"], "A1"), ("F", ["F3", "A3", "C4"], "F1"), ("C", ["C4", "E4", "G4"], "C2"), ("G", ["G3", "B3", "D4"], "G1")]
musique = np.zeros((N, 2))

def poser_m(sig, debut, gain=1.0, pan=0.0):
    global mix
    sauve = mix.copy(); mix[:] = 0
    poser(sig, debut, gain, pan)
    musique[:] += mix
    mix[:] = sauve

# nappe pendant tout le morceau (mesures de 2 s)
for k, debut in enumerate(np.arange(0, 47, 2.0)):
    nom, accord, bas = GRILLE[k % 4]
    if debut >= 45:
        accord, bas = ["C4", "E4", "G4", "B4"], "C2"
    poser_m(nappe(accord, 2.4), debut, 0.42 if 3 <= debut < 43 else 0.6)
    if 3 <= debut < 43:
        for b in range(4):
            poser_m(basse(bas, 0.45), debut + b * BATTEMENT, 0.5)
            poser_m(basse(bas, 0.2), debut + b * BATTEMENT + 0.25, 0.28)
        arp = [note_hz(n) * 2 for n in accord]
        for j in range(16):
            poser_m(pincee(arp[[0, 1, 2, 1][j % 4]] * (2 if j % 8 == 7 else 1)), debut + j * 0.125, 0.11, pan=0.4 if j % 2 else -0.4)

# batterie
for b in np.arange(3.0, 42.99, BATTEMENT):
    poser_m(kick(), b, 0.95)
    if int(round((b - 3) / BATTEMENT)) % 2 == 1:
        poser_m(clap(), b, 0.45)
    poser_m(hat(), b + 0.25, 0.32, pan=0.3)
    poser_m(hat(), b, 0.14, pan=-0.3)
    if int(round((b - 3) / BATTEMENT)) % 8 == 7:
        poser_m(hat(True), b + 0.25, 0.4, pan=0.3)

# compression « pompe » au rythme de la grosse caisse (effet moderne)
tt = np.arange(N) / SR
phase = ((tt - 3.0) % BATTEMENT) / BATTEMENT
pompe = np.where((tt >= 3) & (tt < 43), 0.45 + 0.55 * np.clip(phase / 0.45, 0, 1) ** 0.7, 1.0)
musique[:, 0] *= pompe; musique[:, 1] *= pompe
mix += musique

# ---------------------------------------------------------------- bruitages synchronisés avec l'image
poser(impact(), 0.15, 0.5)
poser(carillon(("E5", "A5", "C#6", "E6")), 0.25, 0.35)
poser(montee(2.6), 0.4, 0.35)
poser(impact(), 3.0, 0.75)
for s in [8.0, 12.5, 19.0, 24.0, 29.5, 34.5, 39.0]:
    poser(souffle(0.75), s - 0.32, 0.55, pan=-0.2)
poser(souffle(0.6, 6000, 400, montee=False), 3.0, 0.35)
for k in range(15):  # frappe au clavier : recherche
    poser(frappe(), 3.6 + k * 0.062 + (0.015 if k % 3 == 0 else 0), 0.7, pan=0.3)
poser(clic(), 4.65, 0.8)
for k, s in enumerate([4.9, 5.05, 5.2, 5.35]):
    poser(pop(620 + 90 * k), s + 0.05, 0.45, pan=0.35)
for k in range(6):  # épingles sur la carte
    poser(pop(500 + 70 * k), 8.65 + k * 0.18, 0.45, pan=0.5)
poser(souffle(1.4, 400, 3000), 9.7, 0.25, pan=0.5)
for s in [10.9, 11.2]:
    poser(pop(900), s, 0.35, pan=0.4)
for k, s in enumerate([14.0, 14.6, 15.5, 16.4]):
    poser(pop(700 + 60 * k), s + 0.05, 0.45, pan=[-0.4, 0.6, -0.4, 0.6][k])
poser(souffle(1.2, 300, 2000), 13.4, 0.18, pan=0.4)
poser(souffle(1.2, 2000, 300, montee=False), 16.6, 0.18, pan=0.4)
for s in [20.3, 21.6]:
    poser(clic(), s, 0.8, pan=-0.4)
    poser(carillon(("G6", "D7"), pas=0.05, d=0.4), s + 0.08, 0.25, pan=0.4)
for s in [25.0, 25.4]:
    poser(pop(560), s + 0.05, 0.45, pan=0.4)
for k, s in enumerate([25.2, 25.45, 25.7, 25.95]):
    poser(pop(800 + 80 * k), s + 0.05, 0.3, pan=-0.4)
for k in range(10):  # compteur qui défile
    poser(frappe(), 25.8 + k * 0.1, 0.5, pan=0.4)
poser(tampon(), 27.5, 1.0)
poser(carillon(), 27.62, 0.45)
poser(clic(), 30.6, 0.9, pan=-0.3)
poser(impact()[: int(SR * 0.8)], 30.62, 0.35)
poser(souffle(0.6, 300, 4000), 30.75, 0.4, pan=0.4)
for k in range(13):
    poser(frappe(), 31.2 + k * 0.055, 0.7, pan=0.4)
poser(carillon(("C6", "G6", "C7")), 32.3, 0.45, pan=0.4)
for k, s in enumerate([32.6, 32.8, 33.0]):
    poser(pop(700 + 100 * k), s + 0.05, 0.35)
for k in range(7):
    poser(pop(400 + 80 * k), 35.6 + k * 0.1, 0.22, pan=0.4)
poser(tampon()[: int(SR * 0.25)], 36.6, 0.6, pan=-0.4)
poser(caisse(), 36.62, 0.55, pan=-0.2)
for k in range(7):
    poser(pop(600 + 70 * k), 40.0 + k * 0.25, 0.3, pan=0.4)
poser(carillon(("A5", "C#6", "E6", "A6", "C#7")), 41.65, 0.45, pan=0.3)
poser(montee(2.0), 41.05, 0.5)
# mots finaux : un coup par mot, sur le rythme
for k, s in enumerate([43.05, 43.4, 43.75, 44.1, 44.45]):
    poser(kick(), s, 0.9)
    poser(clap(), s, 0.45)
    accord = GRILLE[k % 4][1]
    poser(sum(pincee(note_hz(n) * 2, 0.4) for n in accord) / 2, s, 0.35)
poser(impact(), 45.0, 0.9)
poser(carillon(("C6", "E6", "G6", "B6", "C7", "E7"), pas=0.06, d=1.6), 45.05, 0.45)

# ---------------------------------------------------------------- finition
fin = np.clip((DUREE - tt) / 1.2, 0, 1)[:, None]
debut = np.clip(tt / 0.05, 0, 1)[:, None]
mix *= fin * debut
mix = np.tanh(mix * 0.9)
mix /= np.max(np.abs(mix)) / 0.89
with wave.open("bande_son.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("ok", mix.shape, float(np.sqrt(np.mean(mix ** 2))))
