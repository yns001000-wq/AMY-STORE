import { redirect } from "next/navigation";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { CarteProspects } from "@/components/CarteProspects";

export const metadata = { title: "Carte des prospects" };

export default async function PageCarte() {
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const { data } = await session.sb.from("prospects").select("id, nom, metier, ville, departement, statut, latitude, longitude, telephone").order("cree_le", { ascending: false }).limit(3000);
  return (
    <>
      <div className="barre-haut"><div><p className="note" style={{ margin: "0 0 .3rem" }}>Organisez vos tournées : les prospects proches se démarchent le même jour</p><h1>Carte des prospects</h1></div></div>
      <CarteProspects prospects={data ?? []} tuiles={process.env.NEXT_PUBLIC_TUILES_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png"}
        attribution={process.env.NEXT_PUBLIC_TUILES_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">les contributeurs d’OpenStreetMap</a>'} />
    </>
  );
}
