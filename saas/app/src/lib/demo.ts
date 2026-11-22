/**
 * Démo publique de la page d'accueil : COMPTE les entreprises qu'un utilisateur pourrait démarcher dans un code postal,
 * avec les mêmes filtres que la vraie recherche (lib/sourcing.ts : entreprises actives, diffusion publique, opposition
 * commerciale et liste d'opposition MySite exclues, pas de chaînes).
 * RGPD : la réponse ne contient AUCUN nom, adresse, SIRET ni téléphone. Seulement un total, une répartition par grand métier
 * et des points arrondis à une grille d'environ 1 km, décalés dans leur case (impossible de retrouver une adresse).
 */
import { SECTEURS, type Secteur } from "./secteurs";
import { API_SIRENE, VARIANTES, versProspect, type Opposition, type ResultatApi } from "./sourcing";

export interface ResultatDemo {
  codePostal: string;
  commune: string | null;
  total: number;
  /** true si la recherche s'est arrêtée avant la fin (on affiche alors « plus de N »). */
  partiel: boolean;
  parMetier: { id: string; nom: string; n: number }[];
  points: { lat: number; lon: number; n: number }[];
  source: string;
  le: string;
}

/** Département d'un code postal de métropole, ou null (outre-mer et codes invalides : pas encore couverts). */
export function departementDuCp(cp: string): string | null {
  if (!/^\d{5}$/.test(cp)) return null;
  if (cp.startsWith("20")) return "2A"; // la Corse est vérifiée sur le préfixe « 20 » (voir cpDansDepartement)
  const d = cp.slice(0, 2);
  return d === "00" || d === "96" || d === "97" || d === "98" || d === "99" ? null : d;
}

const PAS = 0.01; // environ 1 km de latitude
/** Décalage stable dans la case (le même point reste au même endroit), sans jamais révéler la vraie position. */
function decalage(lat: number, lon: number): [number, number] {
  const h = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453) % 1, h2 = Math.abs(Math.sin(lat * 39.346 + lon * 11.135) * 24634.6345) % 1;
  return [(h - 0.5) * PAS * 0.6, (h2 - 0.5) * PAS * 0.6];
}

/** Regroupe les positions exactes en cases d'environ 1 km. Les positions exactes ne sortent jamais de cette fonction. */
export function pointsFloutes(positions: { latitude: number | null; longitude: number | null }[]): ResultatDemo["points"] {
  const cases = new Map<string, { lat: number; lon: number; n: number }>();
  for (const p of positions) {
    if (p.latitude == null || p.longitude == null) continue;
    const la = Math.round(p.latitude / PAS) * PAS, lo = Math.round(p.longitude / PAS) * PAS, cle = `${la.toFixed(2)}|${lo.toFixed(2)}`;
    const c = cases.get(cle);
    if (c) c.n++; else { const [dla, dlo] = decalage(la, lo); cases.set(cle, { lat: Number((la + dla).toFixed(4)), lon: Number((lo + dlo).toFixed(4)), n: 1 }); }
  }
  return [...cases.values()];
}

export function urlDemo(secteur: Secteur, cp: string, page: number, variante: Record<string, string>): string {
  const q = new URLSearchParams({ activite_principale: secteur.naf.join(","), code_postal: cp, etat_administratif: "A", per_page: "25", page: String(page), ...variante });
  return `${API_SIRENE}?${q}`;
}

const titre = (t: string) => t.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase());

/**
 * Parcourt chaque grand métier (2 variantes, quelques pages au plus) et compte les entreprises retenues par les filtres.
 * Lève une erreur si l'API Sirene ne répond pas : l'appelant affiche alors un message, jamais un chiffre inventé.
 */
export async function compterDemo(opts: {
  cp: string; opposition: Opposition; fetchFn?: typeof fetch; pause?: (ms: number) => Promise<void>; maxPages?: number;
}): Promise<ResultatDemo> {
  const dep = departementDuCp(opts.cp);
  if (!dep) throw new Error("code postal non couvert");
  const f = opts.fetchFn ?? fetch, pause = opts.pause ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const maxPages = opts.maxPages ?? 2;
  // Les métiers sont parcourus en parallèle, mais les requêtes partent au plus toutes les 150 ms (limite de l'API : 7 par seconde).
  let prochain = 0;
  const tour = async () => { const t = Math.max(0, prochain - Date.now()); prochain = Math.max(Date.now(), prochain) + 150; if (t) await pause(t); };
  const appel = async (url: string) => {
    await tour();
    let rep = await f(url, { headers: { "User-Agent": "MySite/0.1 (démo publique, comptage)" } });
    if (rep.status === 429) { await pause(1500); await tour(); rep = await f(url, { headers: { "User-Agent": "MySite/0.1 (démo publique, comptage)" } }); }
    if (!rep.ok) throw new Error(`API Sirene : ${rep.status}`);
    return (await rep.json()) as { results?: ResultatApi[]; total_pages?: number };
  };
  const vus = new Set<string>(), positions: { latitude: number | null; longitude: number | null }[] = [], communes = new Map<string, number>();
  let partiel = false;
  const comptes = await Promise.all(SECTEURS.map(async (secteur) => {
    let n = 0;
    for (const variante of VARIANTES) {
      for (let page = 1; page <= maxPages; page++) {
        const d = await appel(urlDemo(secteur, opts.cp, page, variante));
        for (const r of d.results ?? []) {
          const p = versProspect(r, secteur, dep, opts.opposition);
          if (!p || p.code_postal !== opts.cp || vus.has(p.siret)) continue;
          vus.add(p.siret); n++;
          positions.push({ latitude: p.latitude, longitude: p.longitude });
          if (p.ville) communes.set(p.ville, (communes.get(p.ville) ?? 0) + 1);
        }
        if (!d.total_pages || page >= d.total_pages) break;
        if (page === maxPages) partiel = true;
      }
    }
    return { id: secteur.id, nom: secteur.nom, n };
  }));
  const parMetier = comptes.filter((c) => c.n > 0);
  // Commune la plus représentée (un code postal peut couvrir plusieurs communes).
  const commune = [...communes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return {
    codePostal: opts.cp, commune: commune ? titre(commune) : null, total: vus.size, partiel, parMetier: parMetier.sort((a, b) => b.n - a.n), points: pointsFloutes(positions),
    source: "Base Sirene (INSEE), API Recherche d'entreprises, licence ouverte", le: new Date().toISOString(),
  };
}
