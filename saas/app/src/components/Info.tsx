import { AFaire } from "@/components/AFaire";

/** Affiche une information de l'éditeur, ou un repère « à compléter » si la variable d'environnement est vide. */
export function Info({ v, manque, lien }: { v: string; manque: string; lien?: "mail" | "tel" }) {
  if (!v) return <AFaire>{manque}</AFaire>;
  if (lien === "mail") return <a href={`mailto:${v}`}>{v}</a>;
  if (lien === "tel") return <a href={`tel:${v.replace(/\s/g, "")}`}>{v}</a>;
  return <>{v}</>;
}
