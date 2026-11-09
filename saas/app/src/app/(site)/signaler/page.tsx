import { FormulaireSignalement } from "@/components/FormulaireSignalement";

export const metadata = { title: "Signaler un contenu" };

/** Mécanisme de notification des contenus illicites (règlement européen sur les services numériques, art. 16). */
export default async function Signaler({ searchParams }: { searchParams: Promise<{ site?: string; url?: string }> }) {
  const q = await searchParams;
  const url = q.url ?? (q.site ? `https://${q.site}` : "");
  return (
    <article className="legal">
      <h1 style={{ fontSize: "2rem" }}>Signaler un contenu</h1>
      <p>Un site publié avec MySite contient un contenu qui vous semble illicite : photos utilisées sans droits, informations trompeuses, usurpation d&apos;un commerce, données personnelles, contenu haineux… Signalez-le ici.</p>
      <p>Nous examinons chaque signalement avec diligence. Si le contenu est manifestement illicite, nous le retirons ou rendons le site inaccessible, et nous informons la personne qui l&apos;a publié de notre décision et de ses motifs. Vous êtes informé de la suite donnée si vous laissez votre e-mail.</p>
      <FormulaireSignalement urlInitiale={url} />
      <p className="note">Un signalement abusif ou mensonger peut engager votre responsabilité. Pour signaler une entreprise qui ne souhaite plus figurer dans MySite, utilisez la page « Retirer mon entreprise ».</p>
    </article>
  );
}
