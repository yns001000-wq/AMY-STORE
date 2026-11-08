"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPinned } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { ETAPES } from "@/lib/pipeline";
import { nomDepartement } from "@/lib/departements";

interface P { id: string; nom: string; metier: string | null; ville: string | null; departement: string | null; statut: string; latitude: number | null; longitude: number | null; telephone: string | null }

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Carte de France des prospects (Leaflet), colorés par étape du suivi, filtrables. */
export function CarteProspects({ prospects, tuiles, attribution }: { prospects: P[]; tuiles: string; attribution: string }) {
  const router = useRouter();
  const div = useRef<HTMLDivElement>(null);
  const carte = useRef<import("leaflet").Map | null>(null);
  const couche = useRef<import("leaflet").LayerGroup | null>(null);
  const [actives, setActives] = useState<Set<string>>(new Set(ETAPES.map((e) => e.id).filter((e) => e !== "perdu" && e !== "refus")));
  const [geo, setGeo] = useState<{ charge?: boolean; message?: string }>({});

  const places = useMemo(() => prospects.filter((p) => p.latitude != null && p.longitude != null), [prospects]);
  const visibles = useMemo(() => places.filter((p) => actives.has(p.statut)), [places, actives]);
  const sansCoord = prospects.length - places.length;
  const parDep = useMemo(() => {
    const m = new Map<string, number>();
    prospects.filter((p) => actives.has(p.statut)).forEach((p) => m.set(p.departement ?? "?", (m.get(p.departement ?? "?") ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [prospects, actives]);

  useEffect(() => {
    let annule = false;
    import("leaflet").then((L) => {
      if (annule || !div.current || carte.current) return;
      const c = L.map(div.current, { zoomControl: true, scrollWheelZoom: true }).setView([46.6, 2.4], 6);
      L.tileLayer(tuiles, { attribution, maxZoom: 19 }).addTo(c);
      carte.current = c; couche.current = L.layerGroup().addTo(c);
      dessiner(L);
    });
    return () => { annule = true; carte.current?.remove(); carte.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function dessiner(L: typeof import("leaflet")) {
    const c = carte.current, g = couche.current;
    if (!c || !g) return;
    g.clearLayers();
    const coul = Object.fromEntries(ETAPES.map((e) => [e.id, e.couleur]));
    visibles.forEach((p) => {
      L.circleMarker([p.latitude!, p.longitude!], { radius: 8, color: "#fff", weight: 2, fillColor: coul[p.statut] ?? "#6d4aff", fillOpacity: 0.95 })
        .bindPopup(`<b>${esc(p.nom)}</b><br>${esc(p.metier)} · ${esc(p.ville)}${p.telephone ? `<br>${esc(p.telephone)}` : ""}<br><a href="/espace/prospects/${p.id}">Ouvrir la fiche</a>`)
        .addTo(g);
    });
    if (visibles.length) c.fitBounds(L.latLngBounds(visibles.map((p) => [p.latitude!, p.longitude!] as [number, number])).pad(0.15), { maxZoom: 13 });
  }
  useEffect(() => { import("leaflet").then(dessiner); }, [visibles]); // eslint-disable-line react-hooks/exhaustive-deps

  async function geocoder() {
    setGeo({ charge: true });
    try {
      const r = await fetch("/api/prospects/geocoder", { method: "POST" });
      const j = await r.json();
      setGeo({ message: r.ok ? `${j.places} prospect(s) placé(s)${j.restants ? `, ${j.restants} sans adresse localisable` : ""}.` : j.erreur });
      if (r.ok && j.places) router.refresh();
    } catch { setGeo({ message: "Connexion impossible." }); }
  }

  const basculer = (id: string) => setActives((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <div className="carte-grille">
      <div className="carte carte-fond"><div ref={div} className="carte-leaflet" role="application" aria-label="Carte des prospects" /></div>
      <aside className="carte pile carte-cote">
        <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Étapes affichées</h2>
        <div className="legende">
          {ETAPES.map((e) => (
            <button key={e.id} type="button" aria-pressed={actives.has(e.id)} onClick={() => basculer(e.id)}>
              <i style={{ background: e.couleur }} />{e.nom}<small>{prospects.filter((p) => p.statut === e.id).length}</small>
            </button>
          ))}
        </div>
        {sansCoord > 0 && <div className="alerte" style={{ display: "grid", gap: ".5rem", margin: 0 }}>
          <span>{sansCoord} prospect(s) ne sont pas encore sur la carte.</span>
          <button type="button" className="btn" onClick={geocoder} disabled={geo.charge}><MapPinned aria-hidden />{geo.charge ? "Localisation…" : "Les placer sur la carte"}</button>
          {geo.message && <small>{geo.message}</small>}
        </div>}
        <h2 style={{ fontSize: "1.05rem", margin: 0 }}>Par département</h2>
        <ul className="par-dep">{parDep.map(([d, n]) => <li key={d}><span>{d} · {nomDepartement(d) ?? ""}</span><b>{n}</b></li>)}</ul>
        <p className="note" style={{ margin: 0 }}>Astuce : regroupez vos visites par quartier, entre 14 h 30 et 17 h 30 pour les restaurants (après le service du midi).</p>
      </aside>
    </div>
  );
}
