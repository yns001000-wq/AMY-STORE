import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { verifierDNS } from "@/lib/dns";
import { AssistantLivraison } from "@/components/AssistantLivraison";

export const metadata = { title: "Livraison du site" };

/** Assistant pas à pas pour finaliser une vente : les étapes automatiques se cochent d'après les devis, factures et publications. */
export default async function PageLivraison({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = session.sb;
  const { data: p } = await sb.from("prospects").select("id, nom, ville").eq("id", id).maybeSingle();
  if (!p) notFound();
  const [{ data: l }, { data: docs }, { data: sites }] = await Promise.all([
    sb.from("livraisons").select("etapes, domaine").eq("prospect_id", id).maybeSingle(),
    sb.from("documents").select("id, type, statut, numero").eq("prospect_id", id),
    sb.from("sites").select("id, maj_le").eq("prospect_id", id).order("maj_le", { ascending: false }),
  ]);
  const idsSites = (sites ?? []).map((s) => s.id);
  const { data: pubs } = idsSites.length ? await sb.from("publications").select("site_id, slug, domaine").in("site_id", idsSites) : { data: [] };
  const pub = pubs?.[0] ?? null;
  const domaine = pub?.domaine ?? (l?.domaine as string | null) ?? null;
  const dns = pub?.domaine ? await verifierDNS(pub.domaine) : null;
  const auto: Record<string, boolean> = {
    accord: (docs ?? []).some((d) => d.type === "devis" && d.statut === "accepte"),
    en_ligne: !!pub,
    dns: !!dns?.ok,
    facture: (docs ?? []).some((d) => d.type === "facture" && d.statut === "payee"),
  };
  return (
    <>
      <Link href={`/espace/prospects/${id}`} className="note" style={{ display: "inline-flex", gap: ".3rem", alignItems: "center", textDecoration: "none" }}><ArrowLeft size={16} aria-hidden />Fiche de {p.nom}</Link>
      <div className="barre-haut" style={{ marginTop: ".6rem" }}><div><p className="note" style={{ margin: "0 0 .3rem" }}>Assistant de livraison · de l&apos;accord au premier avis</p><h1>Livrer le site de {p.nom}</h1></div></div>
      <AssistantLivraison prospect={{ id: p.id, nom: p.nom, ville: p.ville }} manuelles={(l?.etapes as Record<string, string>) ?? {}} auto={auto}
        domaine={domaine} dns={dns} siteId={pub?.site_id ?? sites?.[0]?.id ?? null} devisAccepte={(docs ?? []).find((d) => d.type === "devis" && d.statut === "accepte")?.id ?? null} />
    </>
  );
}
