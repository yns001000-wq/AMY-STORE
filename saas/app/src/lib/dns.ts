import "server-only";
import { resolve4, resolveCname } from "node:dns/promises";
import { estApex } from "./publication";

/** Vérifie que le nom de domaine du client pointe bien vers l'hébergement (réglages DNS faits chez son registraire). */
export async function verifierDNS(domaine: string): Promise<{ ok: boolean; detail: string }> {
  const essai = async <T,>(f: () => Promise<T>) => { try { return await f(); } catch { return null; } };
  if (estApex(domaine)) {
    const a = await essai(() => resolve4(domaine));
    if (a?.includes("76.76.21.21")) return { ok: true, detail: "Le domaine pointe vers l'hébergement." };
    return { ok: false, detail: a?.length ? `Le domaine pointe encore vers ${a.join(", ")} : remplacez l'enregistrement A par 76.76.21.21.` : "Aucun enregistrement A trouvé pour le moment." };
  }
  const c = await essai(() => resolveCname(domaine));
  if (c?.some((x) => x.toLowerCase().includes("vercel-dns"))) return { ok: true, detail: "Le sous-domaine pointe vers l'hébergement." };
  return { ok: false, detail: c?.length ? `Le CNAME pointe vers ${c.join(", ")} : remplacez-le par cname.vercel-dns.com.` : "Aucun enregistrement CNAME trouvé pour le moment." };
}

/** Disponibilité indicative d'un nom de domaine via RDAP (registres officiels) : 404 = non enregistré. */
export async function domaineDisponible(domaine: string): Promise<boolean | null> {
  const tld = domaine.split(".").pop();
  const base: Record<string, string> = { fr: "https://rdap.nic.fr/domain/", com: "https://rdap.verisign.com/com/v1/domain/", net: "https://rdap.verisign.com/net/v1/domain/", be: "https://rdap.dns.be/domain/", ch: "https://rdap.nic.ch/domain/" };
  if (!tld || !base[tld]) return null;
  try {
    const r = await fetch(base[tld] + encodeURIComponent(domaine), { headers: { Accept: "application/rdap+json" }, signal: AbortSignal.timeout(5000) });
    return r.status === 404 ? true : r.ok ? false : null;
  } catch { return null; }
}
