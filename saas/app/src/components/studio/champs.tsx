"use client";
import Link from "next/link";
import { Lock, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

/** Fonction réservée à une offre supérieure : affichée, mais verrouillée avec un lien vers les offres. */
export function Verrou({ ok, offre, children, titre }: { ok: boolean; offre: string; titre: string; children: React.ReactNode }) {
  return (
    <fieldset className={`ed-bloc${ok ? "" : " verrouille"}`} disabled={!ok}>
      <legend>{titre}{!ok && <Link href="/espace/abonnement" className="badge-verrou"><Lock aria-hidden />Dès {offre}</Link>}</legend>
      {children}
    </fieldset>
  );
}

export function Texte({ label, valeur, onChange, max, lignes, aide }: { label: string; valeur: string | undefined; onChange: (v: string) => void; max: number; lignes?: number; aide?: string }) {
  const v = valeur ?? "";
  return (
    <label className="ed-champ">
      <span>{label}<small className={v.length > max ? "trop" : ""}>{v.length}/{max}</small></span>
      {lignes ? <textarea rows={lignes} value={v} onChange={(e) => onChange(e.target.value)} /> : <input value={v} onChange={(e) => onChange(e.target.value)} />}
      {aide && <em>{aide}</em>}
    </label>
  );
}

export function ListeTextes({ label, valeurs, onChange, max, n }: { label: string; valeurs: string[] | undefined; onChange: (v: string[]) => void; max: number; n: number }) {
  const l = valeurs ?? [];
  return (
    <div className="ed-champ">
      <span>{label}<small>{l.length}/{n}</small></span>
      {l.map((x, i) => (
        <div className="ed-ligne" key={i}>
          <input value={x} maxLength={max} onChange={(e) => onChange(l.map((y, j) => (j === i ? e.target.value : y)))} aria-label={`${label} ${i + 1}`} />
          <button type="button" className="ed-ico" onClick={() => onChange(l.filter((_, j) => j !== i))} aria-label="Retirer"><Trash2 aria-hidden /></button>
        </div>
      ))}
      {l.length < n && <button type="button" className="ed-ajout" onClick={() => onChange([...l, ""])}><Plus aria-hidden />Ajouter</button>}
    </div>
  );
}

export interface Article { nom?: string; desc?: string; prix?: string | number | null; duree?: string; photo?: string }

export function Articles({ articles, onChange, n, duree }: { articles: Article[] | undefined; onChange: (a: Article[]) => void; n: number; duree?: boolean }) {
  const l = articles ?? [];
  const maj = (i: number, a: Partial<Article>) => onChange(l.map((x, j) => (j === i ? { ...x, ...a } : x)));
  const bouger = (i: number, s: number) => { const c = [...l]; const [x] = c.splice(i, 1); c.splice(i + s, 0, x); onChange(c); };
  return (
    <div className="ed-articles">
      {l.map((a, i) => (
        <div className="ed-article" key={i}>
          <div className="ed-ligne">
            <input value={a.nom ?? ""} placeholder="Nom" maxLength={70} onChange={(e) => maj(i, { nom: e.target.value })} aria-label="Nom" />
            <input className="ed-prix" value={a.prix ?? ""} placeholder="Prix" maxLength={20} onChange={(e) => maj(i, { prix: e.target.value })} aria-label="Prix" />
          </div>
          <textarea rows={2} value={a.desc ?? ""} placeholder="Description" maxLength={180} onChange={(e) => maj(i, { desc: e.target.value })} aria-label="Description" />
          {duree && <input value={a.duree ?? ""} placeholder="Durée (ex. 45 min)" maxLength={30} onChange={(e) => maj(i, { duree: e.target.value })} aria-label="Durée" />}
          <div className="ed-actions">
            <button type="button" className="ed-ico" disabled={i === 0} onClick={() => bouger(i, -1)} aria-label="Monter"><ArrowUp aria-hidden /></button>
            <button type="button" className="ed-ico" disabled={i === l.length - 1} onClick={() => bouger(i, 1)} aria-label="Descendre"><ArrowDown aria-hidden /></button>
            <button type="button" className="ed-ico" onClick={() => onChange(l.filter((_, j) => j !== i))} aria-label="Supprimer"><Trash2 aria-hidden /></button>
          </div>
        </div>
      ))}
      {l.length < n && <button type="button" className="ed-ajout" onClick={() => onChange([...l, { nom: "", desc: "", prix: "" }])}><Plus aria-hidden />Ajouter un article</button>}
    </div>
  );
}
