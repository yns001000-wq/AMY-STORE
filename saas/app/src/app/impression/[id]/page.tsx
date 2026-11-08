import { notFound, redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { LIBELLES } from "@/lib/factures";
import { ApercuDocument } from "@/components/factures/ApercuDocument";
import { BoutonImprimer } from "@/components/factures/BoutonImprimer";

export async function generateMetadata() { return { title: "Impression", robots: { index: false } }; }

/** Version imprimable (et « Enregistrer en PDF » du navigateur) d'un devis, d'une facture ou d'un avoir. */
export default async function Impression({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: doc } = await session.sb.from("documents").select("*").eq("id", id).maybeSingle();
  if (!doc) notFound();
  const { data: ent } = doc.numero ? { data: doc.emetteur } : await session.sb.from("entreprises").select("*").maybeSingle();
  const { data: orig } = doc.origine_id ? await session.sb.from("documents").select("numero, type").eq("id", doc.origine_id).maybeSingle() : { data: null };
  return (
    <main className="impression">
      <BoutonImprimer titre={`${LIBELLES[doc.type as "devis"]} ${doc.numero ?? "brouillon"}`} />
      <ApercuDocument doc={doc} emetteur={ent} origine={orig?.numero ?? null} />
    </main>
  );
}
