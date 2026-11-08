import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { consommation, profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import { FAMILLES } from "@/lib/studio";
import { photosDuCommerce } from "@/lib/studio/serveur";
import { EditeurStudio } from "@/components/studio/EditeurStudio";
import type { Etude } from "@/components/studio/EtudeIA";

export const metadata = { title: "Studio" };

export default async function PageStudio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: site } = await session.sb.from("sites").select("*").eq("id", id).maybeSingle();
  if (!site) notFound();
  const { plan } = await profilEtPlan(session.user.id);
  const cap = PLANS[plan].studio;
  const [{ data: versions }, conso, photosPerso] = await Promise.all([
    cap.versions > 0 ? session.sb.from("sites_versions").select("id, libelle, cree_le").eq("site_id", id).order("cree_le", { ascending: false }).limit(cap.versions) : Promise.resolve({ data: [] }),
    consommation(session.user.id),
    photosDuCommerce(session.sb, cap, site.prospect_id, 300),
  ]);
  return (
    <>
      <div className="barre-haut" style={{ marginBottom: "1rem" }}>
        <div>
          <Link href={site.prospect_id ? `/espace/prospects/${site.prospect_id}` : "/espace/studio"} className="note" style={{ display: "inline-flex", gap: ".3rem", alignItems: "center", textDecoration: "none" }}><ArrowLeft size={16} aria-hidden />{site.prospect_id ? "Fiche du prospect" : "Mes sites"}</Link>
          <h1 style={{ marginTop: ".3rem" }}>{site.donnees?.nom ?? "Site"}</h1>
        </div>
        <span className="badge-offre">{site.type === "ia" ? "Sur mesure" : "Maquette express"} · {FAMILLES[site.donnees?.famille]?.lib.split(" (")[0] ?? ""} · Studio {PLANS[plan].nom}</span>
      </div>
      <EditeurStudio id={site.id} initial={site.donnees} etude={(site.etude as Etude) ?? null} plan={plan} cap={cap}
        versions={versions ?? []} retouches={{ utilise: conso.retouches_ia, max: PLANS[plan].quotas.retouches_ia }}
        photosPerso={photosPerso} prospectId={site.prospect_id} />
    </>
  );
}
