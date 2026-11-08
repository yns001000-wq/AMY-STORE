import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import { LIBELLES, STATUTS } from "@/lib/factures";
import { EditeurDocument } from "@/components/factures/EditeurDocument";

export const metadata = { title: "Document" };

export default async function PageDocument({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: doc } = await session.sb.from("documents").select("*").eq("id", id).maybeSingle();
  if (!doc) notFound();
  const [{ data: ent }, { data: orig }, { plan }] = await Promise.all([
    doc.numero ? Promise.resolve({ data: doc.emetteur }) : session.sb.from("entreprises").select("*").maybeSingle(),
    doc.origine_id ? session.sb.from("documents").select("numero, type").eq("id", doc.origine_id).maybeSingle() : Promise.resolve({ data: null }),
    profilEtPlan(session.user.id),
  ]);
  const s = STATUTS[doc.statut];
  return (
    <>
      <Link href="/espace/factures" className="note" style={{ display: "inline-flex", gap: ".3rem", alignItems: "center", textDecoration: "none" }}><ArrowLeft size={16} aria-hidden />Devis et factures</Link>
      <div className="barre-haut" style={{ marginTop: ".6rem" }}>
        <div><p className="note" style={{ margin: "0 0 .3rem" }}>{doc.client?.nom || "Client à compléter"}</p><h1>{LIBELLES[doc.type as "devis"]} {doc.numero ?? "(brouillon)"}</h1></div>
        <span className="statut" style={{ color: s.couleur, background: `color-mix(in srgb, ${s.couleur} 14%, transparent)` }}>{s.nom}</span>
      </div>
      <EditeurDocument doc={doc} emetteur={ent} origine={orig ? `${LIBELLES[orig.type as "devis"]} ${orig.numero ?? ""}` : null} peutEmettre={PLANS[plan].facturation} />
    </>
  );
}
