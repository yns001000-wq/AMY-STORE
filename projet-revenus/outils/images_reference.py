"""Refait des photos de plats avec l'API Images d'OpenAI en partant d'une photo de référence (endpoint « edits »).

Usage : python outils/images_reference.py PLAN.json DOSSIER_SORTIE --confirmer-depense 1.00
PLAN.json : [{"nom": "napolitaine", "ref": "chemin/photo.jpg" | null, "prompt": "...", "taille": "1024x1024"}]
Mêmes garde-fous que generer_images.py : plafond explicite, coût réel, arrêt avant dépassement,
aucune image regénérée, chaque dépense notée dans crm/donnees/depenses.csv.
"""
import argparse, base64, json, mimetypes, os, sys, time, urllib.error, urllib.request, uuid
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from generer_images import MODELE, cout_reel, noter_depense  # noqa: E402

PRIX_ESTIME = {"1024x1024": 0.065, "1536x1024": 0.07, "1024x1536": 0.07}  # coût réel constaté : 0,06 $ en carré (image de référence comprise)


def multipart(champs: dict, fichiers: list) -> tuple[bytes, str]:
    b = uuid.uuid4().hex
    out = []
    for k, v in champs.items():
        out += [f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n".encode()]
    for k, chemin in fichiers:
        typ = mimetypes.guess_type(chemin)[0] or "image/jpeg"
        out += [f"--{b}\r\nContent-Disposition: form-data; name=\"{k}\"; filename=\"{Path(chemin).name}\"\r\nContent-Type: {typ}\r\n\r\n".encode(),
                Path(chemin).read_bytes(), b"\r\n"]
    out.append(f"--{b}--\r\n".encode())
    return b"".join(out), f"multipart/form-data; boundary={b}"


def appeler(e: dict) -> tuple[bytes, float]:
    cle = os.environ.get("OPENAI_API_KEY") or "cle-ajoutee-par-le-proxy"
    champs = {"model": MODELE, "prompt": e["prompt"], "size": e.get("taille", "1024x1024"), "quality": "medium",
              "n": "1", "stream": "true", "partial_images": "1"}
    if e.get("ref"):
        corps, typ = multipart(champs, [("image[]", e["ref"])])
        url = "https://api.openai.com/v1/images/edits"
    else:
        champs.update(n=1, stream=True, partial_images=1)
        corps, typ = json.dumps(champs).encode(), "application/json"
        url = "https://api.openai.com/v1/images/generations"
    req = urllib.request.Request(url, data=corps, headers={"Authorization": f"Bearer {cle}", "Content-Type": typ})
    for essai in range(3):
        try:
            final = None
            with urllib.request.urlopen(req, timeout=300) as r:
                for ligne in r:
                    ligne = ligne.decode("utf-8", "replace").strip()
                    if not ligne.startswith("data:"):
                        continue
                    ev = json.loads(ligne[5:].strip() or "{}")
                    if ev.get("type", "").endswith("completed"):
                        final = ev
                    elif ev.get("type") == "error" or "error" in ev:
                        raise SystemExit(f"OpenAI a signalé une erreur : {json.dumps(ev)[:300]}")
            if not final or not final.get("b64_json"):
                raise urllib.error.URLError("flux terminé sans image")
            return base64.b64decode(final["b64_json"]), cout_reel(final.get("usage") or {})
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", "replace")[:300]
            if err.code >= 500 and essai < 2:
                time.sleep(20); continue
            raise SystemExit(f"OpenAI a refusé la demande ({err.code}) : {detail}")
        except (TimeoutError, urllib.error.URLError) as err:
            if essai < 2:
                time.sleep(20); continue
            raise SystemExit(f"Connexion à OpenAI impossible : {err}")


def main() -> int:
    a = argparse.ArgumentParser()
    a.add_argument("plan"); a.add_argument("sortie")
    a.add_argument("--confirmer-depense", type=float, default=0.0)
    a.add_argument("--objet", default="photos de plats")
    a = a.parse_args()
    plan = json.loads(Path(a.plan).read_text(encoding="utf-8"))
    sortie = Path(a.sortie); sortie.mkdir(parents=True, exist_ok=True)
    a_faire = [e for e in plan if not (sortie / f"{e['nom']}.webp").exists()]
    estimation = sum(PRIX_ESTIME.get(e.get("taille", "1024x1024"), 0.07) for e in a_faire)
    print(f"{len(a_faire)} image(s) à créer, estimation {estimation:.2f} $")
    if a.confirmer_depense <= 0:
        print("Aucune dépense sans --confirmer-depense PLAFOND."); return 0
    depense = 0.0
    from io import BytesIO
    from PIL import Image
    for e in a_faire:
        prevu = PRIX_ESTIME.get(e.get("taille", "1024x1024"), 0.07)
        if depense + prevu > a.confirmer_depense:
            print(f"Arrêt : {e['nom']} dépasserait le plafond ({depense:.3f} $ dépensés)."); break
        brut, cout = appeler(e)
        cout = cout or prevu; depense += cout
        Image.open(BytesIO(brut)).convert("RGB").save(sortie / f"{e['nom']}.webp", "WEBP", quality=86, method=6)
        noter_depense(cout, f"{a.objet} / {e['nom']} (medium)", a.confirmer_depense)
        print(f"  {e['nom']} : {cout:.4f} $ (cumul {depense:.3f} $)", flush=True)
    print(f"Total réel : {depense:.3f} $")
    return 0


if __name__ == "__main__":
    sys.exit(main())
