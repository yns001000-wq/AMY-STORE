import Link from "next/link";
import { FilePlus2, Lock, PackageCheck } from "lucide-react";
import { LIBELLES, STATUTS } from "@/lib/factures";

/** Carte « Conclure et livrer » de la fiche prospect : devis, factures et assistant de livraison. */
export function ConclureVente({ prospectId, docs, facturation }: { prospectId: string; docs: { id: string; type: string; numero: string | null; statut: string }[]; facturation: boolean }) {
  return (
    <div className="carte pile">
      <h2 style={{ fontSize: "1.15rem", margin: 0, display: "flex", gap: ".5rem", alignItems: "center" }}><PackageCheck size={18} style={{ color: "var(--violet)" }} aria-hidden />Conclure et livrer</h2>
      <Link className="btn p bloc" href={`/espace/livraison/${prospectId}`}><PackageCheck aria-hidden />Assistant de livraison pas à pas</Link>
      {facturation
        ? <form action="/api/documents" method="post"><input type="hidden" name="type" value="devis" /><input type="hidden" name="prospect_id" value={prospectId} /><button className="btn bloc" type="submit"><FilePlus2 aria-hidden />Créer un devis prérempli</button></form>
        : <Link className="btn bloc" href="/espace/abonnement"><Lock aria-hidden />Devis et factures : dès Premium</Link>}
      {docs.length > 0 && <ul className="sites-prospect">{docs.map((d) => (
        <li key={d.id}><Link href={`/espace/factures/${d.id}`}>{LIBELLES[d.type as "devis"]} {d.numero ?? "brouillon"}</Link><small style={{ color: STATUTS[d.statut]?.couleur }}>{STATUTS[d.statut]?.nom}</small></li>
      ))}</ul>}
    </div>
  );
}
