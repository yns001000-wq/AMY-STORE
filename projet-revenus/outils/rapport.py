#!/usr/bin/env python3
"""Produit le rapport hebdomadaire (Markdown) et le tableau de bord (HTML) à partir du suivi.

Usage :
    python outils/rapport.py                 # lit crm/donnees/, écrit dans rapports/
    python outils/rapport.py --donnees crm/exemple --date 2026-11-20

Sorties :
    rapports/rapport-AAAA-MM-JJ.md
    rapports/tableau-de-bord.html   (à ouvrir dans un navigateur, aucune connexion requise)
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import crm  # noqa: E402

RAPPORTS = crm.RACINE / "rapports"


def markdown(ind: crm.Indicateurs) -> str:
    e = ind.entonnoir
    l = [
        f"# Rapport du {ind.aujourd_hui:%d/%m/%Y}",
        "",
        "_Rapport généré automatiquement à partir de vos fichiers de suivi. Les chiffres reflètent uniquement ce qui a été saisi._",
        "",
        "## Argent (mois en cours)",
        "",
        "| Indicateur | Valeur |",
        "|---|---|",
        f"| Ventes facturées ce mois ({ind.nb_ventes_mois}) | {crm.euros(ind.ca_mois)} |",
        f"| Encaissé ce mois | {crm.euros(ind.encaisse_mois)} |",
        f"| Abonnements actifs (revenu mensuel récurrent) | {crm.euros(ind.mrr)} |",
        f"| **Total du mois vs objectif {crm.euros(crm.OBJECTIF_MENSUEL)}** | **{crm.euros(ind.total_mois)} ({crm.pct(ind.progression_objectif)})** |",
        f"| Dépenses du mois | {crm.euros(ind.depenses_mois)} |",
        f"| Cotisations estimées ({crm.pct(crm.TAUX_COTISATIONS)} de l'encaissé + abonnements) | {crm.euros(ind.cotisations_estimees)} |",
        "",
        "## Entonnoir de prospection (cumulé)",
        "",
        "| Étape | Nombre | Taux |",
        "|---|---|---|",
        f"| Prospects dans le suivi | {e.total} | |",
        f"| Encore à contacter | {e.a_contacter} | |",
        f"| Contactés | {e.contactes} | |",
        f"| Ont répondu | {e.reponses} | {crm.pct(e.taux_reponse)} des contactés |",
        f"| Rendez-vous | {e.rdv} | |",
        f"| Devis envoyés | {e.devis} | |",
        f"| Ventes | {e.gagnes} | {crm.pct(e.taux_vente)} des contactés |",
        "",
        "## Décision par segment (règle du PLAN, phase 4)",
        "",
        "| Segment | Contactés | Réponses | Taux | RDV | Ventes | Décision |",
        "|---|---|---|---|---|---|---|",
    ]
    for nom, s in ind.par_segment.items():
        l.append(f"| {nom} | {s.contactes} | {s.reponses} | {crm.pct(s.taux_reponse)} | {s.rdv} | {s.gagnes} | {s.decision()} |")
    l += ["", "## Par pays", "", "| Pays | Prospects | Contactés | Réponses | Taux | Ventes |", "|---|---|---|---|---|---|"]
    for nom, s in ind.par_pays.items():
        l.append(f"| {nom} | {s.total} | {s.contactes} | {s.reponses} | {crm.pct(s.taux_reponse)} | {s.gagnes} |")
    l += ["", "## Par canal de contact", "", "| Canal | Contactés | Réponses | Taux | RDV | Ventes |", "|---|---|---|---|---|---|"]
    for nom, s in ind.par_canal.items():
        l.append(f"| {nom} | {s.contactes} | {s.reponses} | {crm.pct(s.taux_reponse)} | {s.rdv} | {s.gagnes} |")
    l += ["", f"## Actions à faire aujourd'hui ({len(ind.actions_du_jour)})", ""]
    if ind.actions_du_jour:
        for a in ind.actions_du_jour:
            retard = f" — **en retard de {a['retard']} j**" if a["retard"] else ""
            tel = f" ({a['telephone']})" if a["telephone"] else ""
            l.append(f"- [ ] {a['entreprise']}{tel} : {a['action']}{retard}")
    else:
        l.append("Aucune action datée pour aujourd'hui.")
    l += ["", f"## Alertes ({len(ind.alertes) + len(ind.problemes_donnees)})", ""]
    for a in ind.problemes_donnees + ind.alertes:
        l.append(f"- ⚠️ {a}")
    if not (ind.alertes or ind.problemes_donnees):
        l.append("Aucune alerte.")
    l += ["", "## Recommandations automatiques", ""] + [f"- {r}" for r in recommandations(ind)]
    return "\n".join(l) + "\n"


def recommandations(ind: crm.Indicateurs) -> list[str]:
    r = []
    e = ind.entonnoir
    if e.contactes == 0:
        r.append("Aucun prospect contacté pour l'instant : commencer par 5 contacts par jour (voir marketing/messages_prospection.md).")
    if e.contactes >= 20 and e.reponses == 0:
        r.append("20 contacts ou plus sans aucune réponse : changer d'accroche et privilégier la visite en personne ou l'appel avec un aperçu personnalisé.")
    if e.reponses and e.rdv == 0 and e.reponses >= 5:
        r.append("Des réponses mais aucun rendez-vous : proposer systématiquement un créneau de 15 min précis dans la réponse.")
    if e.devis >= 3 and e.gagnes == 0:
        r.append("3 devis ou plus sans vente : revoir le prix pilote, rappeler 48 h après chaque devis, lister les objections entendues.")
    meilleurs = [(n, s) for n, s in ind.par_canal.items() if s.contactes >= 10 and s.taux_reponse is not None]
    if len(meilleurs) >= 2:
        n, s = max(meilleurs, key=lambda x: x[1].taux_reponse)
        r.append(f"Canal le plus efficace à ce stade : « {n} » ({crm.pct(s.taux_reponse)} de réponses). Y consacrer plus de contacts.")
    if ind.total_mois >= crm.OBJECTIF_MENSUEL:
        r.append("Objectif mensuel atteint ce mois-ci : documenter ce qui a marché et envisager l'étape suivante du PLAN (phase 7).")
    if not r:
        r.append("Continuer le rythme prévu et saisir chaque résultat dans le suivi le jour même.")
    return r


def _barres(titre: str, donnees: list[tuple[str, float]], format_val, id_svg: str) -> str:
    """Graphique en barres horizontales, une seule série (pas de légende nécessaire)."""
    if not donnees:
        return f'<p class="vide">{html.escape(titre)} : pas encore de données.</p>'
    maxi = max(v for _, v in donnees) or 1
    h_ligne, larg_label, larg_barre = 34, 150, 360
    hauteur = h_ligne * len(donnees)
    lignes = []
    for i, (label, v) in enumerate(donnees):
        y = i * h_ligne
        w = max(2, v / maxi * larg_barre) if v > 0 else 0
        val = html.escape(format_val(v))
        lab = html.escape(label)
        lignes.append(
            f'<g class="bar"><title>{lab} : {val}</title>'
            f'<rect class="hit" x="0" y="{y}" width="{larg_label + larg_barre + 90}" height="{h_ligne}"></rect>'
            f'<text class="lab" x="{larg_label - 10}" y="{y + 21}" text-anchor="end">{lab}</text>'
            + (f'<rect class="mark" x="{larg_label}" y="{y + 9}" width="{w:.1f}" height="16" rx="4"></rect>' if w else "")
            + f'<text class="val" x="{larg_label + w + 8:.1f}" y="{y + 21}">{val}</text></g>'
        )
    return (
        f'<figure><figcaption>{html.escape(titre)}</figcaption>'
        f'<svg id="{id_svg}" viewBox="0 0 {larg_label + larg_barre + 90} {hauteur}" role="img" aria-label="{html.escape(titre)}">'
        + "".join(lignes) + "</svg></figure>"
    )


def tableau_de_bord(ind: crm.Indicateurs) -> str:
    e = ind.entonnoir
    esc = html.escape
    progression = min(ind.progression_objectif, 1.0)
    tuiles = [
        ("Total du mois", crm.euros(ind.total_mois), f"Objectif {crm.euros(crm.OBJECTIF_MENSUEL)} — {crm.pct(ind.progression_objectif)}"),
        ("Revenu récurrent mensuel", crm.euros(ind.mrr), "Abonnements Sérénité actifs"),
        ("Prospects contactés", str(e.contactes), f"{e.a_contacter} encore à contacter"),
        ("Taux de réponse", crm.pct(e.taux_reponse), f"{e.reponses} réponses, {e.gagnes} vente(s)"),
    ]
    tuiles_html = "".join(f'<div class="tile"><div class="t-label">{esc(a)}</div><div class="t-val">{esc(b)}</div><div class="t-sub">{esc(c)}</div></div>' for a, b, c in tuiles)
    entonnoir = [("Contactés", e.contactes), ("Ont répondu", e.reponses), ("Rendez-vous", e.rdv), ("Devis", e.devis), ("Ventes", e.gagnes)]
    mois = list(ind.ca_par_mois.items())[-6:]
    seg_lignes = "".join(
        f"<tr><td>{esc(n)}</td><td>{s.contactes}</td><td>{s.reponses}</td><td>{crm.pct(s.taux_reponse)}</td><td>{s.rdv}</td><td>{s.gagnes}</td><td>{esc(s.decision())}</td></tr>"
        for n, s in ind.par_segment.items()
    ) or '<tr><td colspan="7">Aucun prospect.</td></tr>'
    actions = "".join(
        f"<li><strong>{esc(a['entreprise'])}</strong> {esc(a['telephone'])} — {esc(a['action'])}"
        + (f' <span class="retard">en retard de {a["retard"]} j</span>' if a["retard"] else "") + "</li>"
        for a in ind.actions_du_jour
    ) or "<li>Aucune action datée pour aujourd'hui.</li>"
    alertes = "".join(f"<li>{esc(a)}</li>" for a in ind.problemes_donnees + ind.alertes) or "<li>Aucune alerte.</li>"
    recos = "".join(f"<li>{esc(r)}</li>" for r in recommandations(ind))
    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tableau de bord</title>
<style>
:root{{color-scheme:light;--surface-1:#fcfcfb;--surface-2:#ffffff;--line:#e3e2de;--text-primary:#0b0b0b;--text-secondary:#52514e;--series-1:#2a78d6;--track:#d6e6f8;--warn:#a35a00}}
@media (prefers-color-scheme: dark){{:root:where(:not([data-theme="light"])){{color-scheme:dark;--surface-1:#1a1a19;--surface-2:#232322;--line:#3a3a38;--text-primary:#f0efec;--text-secondary:#c3c2b7;--series-1:#3987e5;--track:#21364f;--warn:#f0a64a}}}}
:root[data-theme="dark"]{{color-scheme:dark;--surface-1:#1a1a19;--surface-2:#232322;--line:#3a3a38;--text-primary:#f0efec;--text-secondary:#c3c2b7;--series-1:#3987e5;--track:#21364f;--warn:#f0a64a}}
body{{margin:0;background:var(--surface-1);color:var(--text-primary);font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.5}}
main{{max-width:1080px;margin:0 auto;padding:24px 16px 48px}}
h1{{font-size:24px;margin:0 0 4px}} h2{{font-size:18px;margin:32px 0 12px}}
.sub{{color:var(--text-secondary);font-size:14px;margin:0 0 20px}}
.tiles{{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}}
.tile{{background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:14px 16px}}
.t-label{{font-size:13px;color:var(--text-secondary)}} .t-val{{font-size:26px;font-weight:600;margin:2px 0}} .t-sub{{font-size:13px;color:var(--text-secondary)}}
.meter{{height:8px;border-radius:4px;background:var(--track);margin-top:16px;overflow:hidden}} .meter span{{display:block;height:100%;background:var(--series-1);border-radius:4px}}
.charts{{display:grid;gap:16px;grid-template-columns:1fr}} @media(min-width:860px){{.charts{{grid-template-columns:1fr 1fr}}}}
figure{{margin:0;background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:14px}}
figcaption{{font-weight:600;margin-bottom:8px}}
svg{{width:100%;height:auto;display:block}}
svg .lab,svg .val{{fill:var(--text-secondary);font-size:13px}} svg .val{{fill:var(--text-primary)}}
svg .mark{{fill:var(--series-1)}} svg .hit{{fill:transparent}} svg .bar:hover .hit{{fill:var(--line);opacity:.5}}
.table-wrap{{overflow-x:auto}}
table{{border-collapse:collapse;width:100%;background:var(--surface-2);border:1px solid var(--line);border-radius:12px;font-size:14px}}
th,td{{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line)}} th{{color:var(--text-secondary);font-weight:600}}
ul{{padding-left:20px}} li{{margin:4px 0}} .retard{{color:var(--warn);font-weight:600}} .vide{{color:var(--text-secondary)}}
footer{{margin-top:32px;font-size:13px;color:var(--text-secondary)}}
</style></head><body><main>
<h1>Tableau de bord</h1>
<p class="sub">Généré le {ind.aujourd_hui:%d/%m/%Y} à partir de vos fichiers de suivi. Pour le mettre à jour : <code>python outils/rapport.py</code></p>
<div class="tiles">{tuiles_html}</div>
<div class="meter" role="img" aria-label="Progression vers l'objectif : {crm.pct(ind.progression_objectif)}"><span style="width:{progression * 100:.1f}%"></span></div>
<h2>Prospection et chiffre d'affaires</h2>
<div class="charts">
{_barres("Entonnoir de prospection (cumulé)", entonnoir, lambda v: str(int(v)), "entonnoir")}
{_barres("Ventes facturées par mois (6 derniers mois)", mois, crm.euros, "ca-mois")}
</div>
<h2>Décision par segment</h2>
<div class="table-wrap"><table><thead><tr><th>Segment</th><th>Contactés</th><th>Réponses</th><th>Taux</th><th>RDV</th><th>Ventes</th><th>Décision</th></tr></thead><tbody>{seg_lignes}</tbody></table></div>
<h2>Actions du jour ({len(ind.actions_du_jour)})</h2><ul>{actions}</ul>
<h2>Alertes</h2><ul>{alertes}</ul>
<h2>Recommandations</h2><ul>{recos}</ul>
<footer>Dépenses du mois : {crm.euros(ind.depenses_mois)} · Coûts récurrents : {crm.euros(ind.depenses_recurrentes)} · Cotisations estimées : {crm.euros(ind.cotisations_estimees)}</footer>
</main></body></html>
"""


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--donnees", type=Path, default=crm.DONNEES)
    parser.add_argument("--sortie", type=Path, default=RAPPORTS)
    parser.add_argument("--date", help="Date du rapport AAAA-MM-JJ (défaut : aujourd'hui)")
    args = parser.parse_args(argv)
    if args.donnees == crm.DONNEES:
        for f in crm.initialiser():
            print(f"Fichier de suivi créé : {f}")
    jour = dt.date.fromisoformat(args.date) if args.date else dt.date.today()
    ind = crm.calculer(args.donnees, jour)
    args.sortie.mkdir(parents=True, exist_ok=True)
    md = args.sortie / f"rapport-{jour.isoformat()}.md"
    md.write_text(markdown(ind), encoding="utf-8")
    tdb = args.sortie / "tableau-de-bord.html"
    tdb.write_text(tableau_de_bord(ind), encoding="utf-8")
    print(f"Rapport : {md}")
    print(f"Tableau de bord : {tdb}")
    print(f"Actions du jour : {len(ind.actions_du_jour)} — Alertes : {len(ind.alertes) + len(ind.problemes_donnees)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
