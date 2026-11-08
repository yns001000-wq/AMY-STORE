import "server-only";

/**
 * Branchement des noms de domaine des clients sur le projet Vercel (API officielle).
 * Facultatif : sans VERCEL_TOKEN et VERCEL_PROJECT_ID, le domaine est enregistré et l'ajout se fait à la main dans Vercel.
 */
const conf = () => ({ token: process.env.VERCEL_TOKEN, projet: process.env.VERCEL_PROJECT_ID, equipe: process.env.VERCEL_TEAM_ID });
export const vercelConfigure = () => !!(conf().token && conf().projet);
const url = (chemin: string) => `https://api.vercel.com${chemin}${conf().equipe ? `?teamId=${encodeURIComponent(conf().equipe!)}` : ""}`;

async function appel(methode: string, chemin: string, corps?: unknown): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const r = await fetch(url(chemin), { method: methode, headers: { Authorization: `Bearer ${conf().token}`, "Content-Type": "application/json" }, body: corps ? JSON.stringify(corps) : undefined });
  return { ok: r.ok, status: r.status, data: (await r.json().catch(() => ({}))) as Record<string, unknown> };
}

export async function ajouterDomaine(domaine: string): Promise<{ ok: boolean; message?: string }> {
  if (!vercelConfigure()) return { ok: false, message: "manuel" };
  const p = encodeURIComponent(conf().projet!);
  const r = await appel("POST", `/v10/projects/${p}/domains`, { name: domaine });
  if (r.ok || r.status === 409) {
    if (!domaine.startsWith("www.") && domaine.split(".").length === 2) await appel("POST", `/v10/projects/${p}/domains`, { name: `www.${domaine}`, redirect: domaine });
    return { ok: true };
  }
  return { ok: false, message: String((r.data.error as { message?: string } | undefined)?.message ?? `Erreur ${r.status}`) };
}

export async function retirerDomaine(domaine: string): Promise<void> {
  if (!vercelConfigure()) return;
  const p = encodeURIComponent(conf().projet!);
  await appel("DELETE", `/v9/projects/${p}/domains/${encodeURIComponent(domaine)}`);
  if (domaine.split(".").length === 2) await appel("DELETE", `/v9/projects/${p}/domains/${encodeURIComponent(`www.${domaine}`)}`);
}
