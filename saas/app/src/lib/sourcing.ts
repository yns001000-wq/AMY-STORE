/**
 * Recherche de prospects dans la base Sirene (API Recherche d'entreprises de l'État, licence ouverte).
 * Garde-fous RGPD intégrés (voir PLAN.md § 4.1) :
 *  - exclusion des personnes en diffusion partielle (statut_diffusion « P ») ;
 *  - exclusion des entreprises qui s'opposent à l'usage commercial de leurs données (opposition_diffusion_commerciale) ;
 *  - exclusion de la liste d'opposition MySite (SIREN ou SIRET) ;
 *  - uniquement des établissements actifs, dans le département demandé, avec le bon code d'activité ;
 *  - pas de chaînes (plus de 3 établissements ouverts : elles ont déjà leur site).
 */
import { cpDansDepartement } from "./departements";
import type { Secteur } from "./secteurs";

export const API_SIRENE = "https://recherche-entreprises.api.gouv.fr/search";
export const SOURCE_SIRENE = "Base Sirene (INSEE), API Recherche d'entreprises, licence ouverte";

interface EtablissementApi {
  siret?: string; adresse?: string | null; code_postal?: string | null; libelle_commune?: string | null;
  liste_enseignes?: string[] | null; nom_commercial?: string | null; etat_administratif?: string;
  activite_principale?: string | null; statut_diffusion_etablissement?: string | null;
}
export interface ResultatApi {
  siren?: string; nom_complet?: string; nom_raison_sociale?: string | null; activite_principale?: string | null;
  statut_diffusion?: string | null; opposition_diffusion_commerciale?: boolean | null; etat_administratif?: string;
  date_creation?: string | null; nombre_etablissements_ouverts?: number | null;
  siege?: EtablissementApi | null; matching_etablissements?: EtablissementApi[] | null;
}

export interface ProspectTrouve {
  siren: string; siret: string; nom: string; enseigne: string | null; naf: string; metier: string;
  adresse: string; code_postal: string; ville: string; departement: string; source: string; indices: string;
}

export interface Opposition { sirens: Set<string>; sirets: Set<string> }

const titre = (t: string) => t.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase());

/** Transforme un résultat de l'API en prospect, ou null s'il doit être écarté. */
export function versProspect(r: ResultatApi, secteur: Secteur, dep: string, opp: Opposition): ProspectTrouve | null {
  if (!r.siren || r.etat_administratif !== "A") return null;
  if (r.statut_diffusion && r.statut_diffusion !== "O") return null;
  if (r.opposition_diffusion_commerciale) return null;
  if (opp.sirens.has(r.siren)) return null;
  if ((r.nombre_etablissements_ouverts ?? 1) > 3) return null;
  const candidats = [...(r.matching_etablissements ?? []), ...(r.siege ? [r.siege] : [])];
  const e = candidats.find((x) => x.siret && x.etat_administratif === "A"
    && (!x.statut_diffusion_etablissement || x.statut_diffusion_etablissement === "O")
    && cpDansDepartement(x.code_postal, dep)
    && secteur.naf.includes(x.activite_principale ?? r.activite_principale ?? ""));
  if (!e || !e.siret || opp.sirets.has(e.siret)) return null;
  const naf = e.activite_principale ?? r.activite_principale ?? "";
  const enseigne = (e.liste_enseignes?.[0] || e.nom_commercial || "").trim() || null;
  const nom = titre(enseigne || r.nom_raison_sociale || r.nom_complet || "Entreprise");
  const indices = [`Code d'activité ${naf} (${secteur.metier(naf)})`, enseigne ? `enseigne : ${titre(enseigne)}` : "", r.date_creation ? `créée en ${r.date_creation.slice(0, 4)}` : ""]
    .filter(Boolean).join(" · ");
  return {
    siren: r.siren, siret: e.siret, nom, enseigne: enseigne ? titre(enseigne) : null, naf, metier: secteur.metier(naf),
    adresse: e.adresse ?? "", code_postal: e.code_postal ?? "", ville: titre(e.libelle_commune ?? ""), departement: dep,
    source: SOURCE_SIRENE, indices,
  };
}

/** L'API classe d'abord les grandes entreprises : on cible directement les entrepreneurs individuels puis les très petites sociétés. */
export const VARIANTES: Record<string, string>[] = [
  { est_entrepreneur_individuel: "true" },
  { categorie_entreprise: "PME", tranche_effectif_salarie: "NN,00,01,02" },
];

export function urlRecherche(secteur: Secteur, dep: string, page: number, variante: Record<string, string> = VARIANTES[0]): string {
  const q = new URLSearchParams({ activite_principale: secteur.naf.join(","), departement: dep, etat_administratif: "A", per_page: "25", page: String(page), ...variante });
  return `${API_SIRENE}?${q}`;
}

/**
 * Cherche jusqu'à `max` nouveaux prospects dans un département, en sautant ceux déjà connus.
 * Parcourt les variantes (entrepreneurs individuels, puis petites sociétés), `maxPages` pages chacune au plus.
 * Respecte la limite de l'API (7 requêtes par seconde) : une requête toutes les 200 ms au plus.
 */
export async function chercherProspects(opts: {
  secteur: Secteur; dep: string; max: number; dejaConnus: Set<string>; opposition: Opposition;
  maxPages?: number; fetchFn?: typeof fetch; pause?: (ms: number) => Promise<void>;
}): Promise<{ prospects: ProspectTrouve[]; requetes: number }> {
  const f = opts.fetchFn ?? fetch, pause = opts.pause ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const res: ProspectTrouve[] = [];
  let requetes = 0;
  for (const variante of VARIANTES) {
    let page = 1, essais429 = 0;
    while (res.length < opts.max && page <= (opts.maxPages ?? 6)) {
      if (requetes) await pause(200);
      requetes++;
      const rep = await f(urlRecherche(opts.secteur, opts.dep, page, variante), { headers: { "User-Agent": "MySite/0.1 (recherche de prospects B2B)" } });
      if (rep.status === 429 && essais429++ < 3) { await pause(1500); continue; }
      if (!rep.ok) throw new Error(`API Sirene : ${rep.status}`);
      const d = (await rep.json()) as { results?: ResultatApi[]; total_pages?: number };
      for (const r of d.results ?? []) {
        const p = versProspect(r, opts.secteur, opts.dep, opts.opposition);
        if (p && !opts.dejaConnus.has(p.siret)) { res.push(p); opts.dejaConnus.add(p.siret); if (res.length >= opts.max) break; }
      }
      if (!d.total_pages || page >= d.total_pages) break;
      page++;
    }
    if (res.length >= opts.max) break;
  }
  return { prospects: res, requetes };
}
