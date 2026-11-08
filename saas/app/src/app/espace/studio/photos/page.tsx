import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Images, Lock } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import type { PhotoPerso } from "@/lib/studio";
import { BanquePhotos } from "@/components/studio/BanquePhotos";

export const metadata = { title: "Ma banque de photos" };

export default async function PageBanque() {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const { plan } = await profilEtPlan(session.user.id);
  const cap = PLANS[plan].studio;
  const { data } = cap.banquePerso > 0
    ? await session.sb.from("photos_perso").select("id, url, legende, portee, prospect_id, prospects(nom)").order("cree_le", { ascending: false }).limit(cap.banquePerso)
    : { data: [] };
  const photos: PhotoPerso[] = (data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string, url: p.url as string, legende: p.legende as string, portee: p.portee as "commerce" | "tous", prospect_id: p.prospect_id as string | null,
    prospect_nom: ((Array.isArray(p.prospects) ? p.prospects[0] : p.prospects) as { nom?: string } | null)?.nom ?? (p.prospect_id ? null : "Commerce retiré"),
  }));
  return (
    <>
      <Link href="/espace/studio" className="note" style={{ display: "inline-flex", gap: ".3rem", alignItems: "center", textDecoration: "none" }}><ArrowLeft size={16} aria-hidden />Mes sites</Link>
      <div className="barre-haut" style={{ marginTop: ".6rem" }}>
        <div><p className="note" style={{ margin: "0 0 .3rem" }}>Réutilisez vos vraies photos d&apos;un site à l&apos;autre</p><h1>Ma banque de photos</h1></div>
      </div>
      {cap.banquePerso > 0 ? (
        <div className="carte" style={{ maxWidth: "60rem" }}>
          <ul className="regles-banque">
            <li><b>Photos d&apos;un commerce</b> (devanture, salle, plats, équipe) : proposées uniquement sur les sites de ce commerce. Les montrer ailleurs serait trompeur.</li>
            <li><b>Photos pour tous mes sites</b> : uniquement des photos dont vous détenez les droits et sans élément propre à un commerce.</li>
            <li>L&apos;IA du Studio utilise automatiquement ces photos quand leur légende correspond : soignez les légendes.</li>
          </ul>
          <BanquePhotos photos={photos} max={cap.banquePerso} />
        </div>
      ) : (
        <div className="carte vide"><Images aria-hidden /><h2>Gardez vos vraies photos pour vos prochains sites</h2>
          <p className="note">Avec l&apos;offre Premium, chaque photo envoyée peut rejoindre votre banque personnelle ({PLANS.premium.studio.banquePerso} photos, {PLANS.ultra.studio.banquePerso} en Ultra). Elle vous est reproposée sur les sites suivants, et l&apos;IA s&apos;en sert automatiquement.</p>
          <Link className="btn p" href="/espace/abonnement"><Lock aria-hidden />Voir l&apos;offre Premium</Link></div>
      )}
    </>
  );
}
