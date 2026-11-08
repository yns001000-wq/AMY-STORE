/** CSV lisible par Excel en français : séparateur « ; », BOM UTF-8, guillemets échappés, protection contre l'injection de formules. */
export function celluleCSV(v: unknown): string {
  let s = v == null ? "" : Array.isArray(v) ? v.join(" | ") : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // une cellule « =… » ne doit jamais être exécutée par le tableur
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function versCSV(colonnes: [string, string][], lignes: Record<string, unknown>[]): string {
  const tete = colonnes.map(([, lib]) => celluleCSV(lib)).join(";");
  const corps = lignes.map((l) => colonnes.map(([k]) => celluleCSV(l[k])).join(";"));
  return "﻿" + [tete, ...corps].join("\r\n") + "\r\n";
}
