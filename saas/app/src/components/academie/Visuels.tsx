"use client";
import { Check, Phone, X } from "lucide-react";
import type { Visuel } from "@/lib/academie/types";

/** Rendu animé d'une scène. `p` (0 → 1) fait apparaître les éléments les uns après les autres. */
export function RenduVisuel({ v, p }: { v: Visuel; p: number }) {
  const vu = (i: number, n: number) => (p >= (i + 0.2) / (n + 0.4) ? " vu" : "");
  switch (v.type) {
    case "titre":
      return (
        <div className="vi-titre">
          {v.surtitre && <span className="vi-surtitre vu">{v.surtitre}</span>}
          <h3 className="vi-grand vu">{v.texte}</h3>
          {v.sous && <p className={`vi-sous${p > 0.25 ? " vu" : ""}`}>{v.sous}</p>}
        </div>
      );
    case "points":
      return (
        <div className="vi-bloc">
          {v.titre && <h4 className="vi-h vu">{v.titre}</h4>}
          <ul className="vi-points">{v.items.map((x, i) => <li key={i} className={`vi-apparait${vu(i, v.items.length)}`}><span className="vi-puce">{i + 1}</span>{x}</li>)}</ul>
        </div>
      );
    case "check":
      return (
        <div className="vi-bloc">
          {v.titre && <h4 className="vi-h vu">{v.titre}</h4>}
          <ul className="vi-points">{v.items.map((x, i) => <li key={i} className={`vi-apparait${vu(i, v.items.length)}`}><span className="vi-coche"><Check /></span>{x}</li>)}</ul>
        </div>
      );
    case "chiffre":
      return (
        <div className="vi-titre">
          <p className="vi-chiffre vu">{v.valeur}</p>
          <p className={`vi-sous${p > 0.3 ? " vu" : ""}`}>{v.legende}</p>
          {v.note && <span className={`vi-note${p > 0.55 ? " vu" : ""}`}>{v.note}</span>}
        </div>
      );
    case "etapes":
      return (
        <div className="vi-bloc">
          {v.titre && <h4 className="vi-h vu">{v.titre}</h4>}
          <ol className="vi-etapes">{v.etapes.map((x, i) => (
            <li key={i} className={`vi-apparait${vu(i, v.etapes.length)}${p >= (i + 1) / v.etapes.length ? " fait" : ""}`}><span>{i + 1}</span><b>{x}</b></li>
          ))}</ol>
        </div>
      );
    case "sms":
      return (
        <div className="vi-tel">
          <div className="vi-tel-ecran">
            <p className="vi-tel-tete">Messages</p>
            {v.messages.map((m, i) => <p key={i} className={`vi-bulle ${m.de}${vu(i, v.messages.length)}`}>{m.texte}</p>)}
          </div>
        </div>
      );
    case "dialogue":
      return (
        <div className="vi-dialogue">{v.lignes.map((l, i) => (
          <div key={i} className={`vi-replique ${i % 2 ? "droite" : "gauche"} vi-apparait${vu(i, v.lignes.length)}`}><b>{l.qui}</b><p>{l.texte}</p></div>
        ))}</div>
      );
    case "telephone":
      return (
        <div className="vi-tel">
          <div className="vi-tel-ecran site">
            <p className="vi-site-nom vu">{v.titre}</p>
            {v.lignes.map((x, i) => <p key={i} className={`vi-site-ligne vi-apparait${vu(i, v.lignes.length + 1)}`}>{x}</p>)}
            {v.bouton && <p className={`vi-site-bouton vi-apparait${vu(v.lignes.length, v.lignes.length + 1)}`}><Phone />{v.bouton}</p>}
          </div>
        </div>
      );
    case "dns":
      return (
        <div className="vi-bloc">
          <h4 className="vi-h vu">Zone DNS · {v.domaine}</h4>
          <table className="vi-dns"><thead><tr><th>Type</th><th>Nom</th><th>Valeur</th></tr></thead>
            <tbody>{v.lignes.map((l, i) => <tr key={i} className={`vi-apparait${vu(i, v.lignes.length)}`}><td>{l.type}</td><td>{l.nom}</td><td><code>{l.valeur}</code></td></tr>)}</tbody></table>
        </div>
      );
    case "facture":
      return (
        <div className="vi-facture vu">
          <p className="vi-facture-titre">{v.titre}</p>
          {v.lignes.map(([a, b], i) => <p key={i} className={`vi-facture-ligne vi-apparait${vu(i, v.lignes.length + 1)}`}><span>{a}</span><b>{b}</b></p>)}
          <p className={`vi-facture-total vi-apparait${vu(v.lignes.length, v.lignes.length + 1)}`}><span>Total</span><b>{v.total}</b></p>
          {v.mention && <small className={p > 0.85 ? "vu" : ""}>{v.mention}</small>}
        </div>
      );
    case "comparaison":
      return (
        <div className="vi-comparaison">
          {[{ c: v.gauche, k: "non" }, { c: v.droite, k: "oui" }].map(({ c, k }, j) => (
            <div key={k} className={`vi-colonne ${k} vi-apparait${j === 0 || p > 0.45 ? " vu" : ""}`}>
              <h4>{c.titre}</h4>
              <ul>{c.items.map((x, i) => <li key={i}>{k === "non" ? <X /> : <Check />}{x}</li>)}</ul>
            </div>
          ))}
        </div>
      );
  }
}
