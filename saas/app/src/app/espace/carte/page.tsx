import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { CarteProspects } from "@/components/CarteProspects";
import { scoreProspect } from "@/lib/score";

export const metadata = { title: "Carte des prospects" };

export default async function PageCarte() {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const { data } = await session.sb.from("prospects").select("id, nom, metier, naf, indices, ville, departement, statut, latitude, longitude, telephone, date_creation, tranche_effectif").order("cree_le", { ascending: false }).limit(3000);
  return (
    <>
      <div className="barre-haut"><div><p className="note" style={{ margin: "0 0 .3rem" }}>Organisez vos tournées : les prospects proches se démarchent le même jour</p><h1>Carte des prospects</h1></div></div>
      <CarteProspects prospects={(data ?? []).map(({ naf: _n, indices: _i, date_creation: _d, tranche_effectif: _t, ...p }, k) => ({ ...p, score: scoreProspect((data ?? [])[k]) }))} tuiles={process.env.NEXT_PUBLIC_TUILES_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
        attribution={process.env.NEXT_PUBLIC_TUILES_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">les contributeurs d’OpenStreetMap</a>'} />
    </>
  );
}
