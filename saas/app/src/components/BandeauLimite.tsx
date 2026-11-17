import Link from "next/link";
import { etatLimites } from "@/lib/quotas";
import { libelleRemise, prochaineRemiseAZero } from "@/lib/limites";

const NOMS = { prospects: "commerces", messages_ia: "messages", sites_ia: "sites sur mesure", retouches_ia: "retouches" } as const;

/** Bandeau discret quand une limite du mois est atteinte : l'information, la date de remise à zéro, et où voir la suite. */
export async function BandeauLimite({ userId }: { userId: string }) {
  const { c, moisEpuise } = await etatLimites(userId);
  const epuises = (Object.keys(NOMS) as (keyof typeof NOMS)[]).filter((t) => c[t].epuise);
  if (!epuises.length) return null;
  const remise = libelleRemise(prochaineRemiseAZero());
  const texte = moisEpuise
    ? `Votre mois gratuit est utilisé : recherche, messages et nouvelles maquettes reprennent ${remise}.`
    : `Limite du mois atteinte pour les ${epuises.map((t) => NOMS[t]).join(" et les ")} : remise à zéro ${remise}.`;
  return (
    <p className="bandeau-limite" role="status">
      <span>{texte}</span>
      <Link href={`/espace/limite?type=${moisEpuise ? "mois" : epuises[0]}`}>Continuer sans attendre →</Link>
    </p>
  );
}
