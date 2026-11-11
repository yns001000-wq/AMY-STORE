import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Trash2 } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { ETAPES, etape, type EntreeJournal } from "@/lib/pipeline";
import { changerStatut, enregistrerSuivi, noterEchange, supprimerProspect } from "@/lib/actions-prospects";
import { GenerateurMessage } from "@/components/GenerateurMessage";
import { BoutonsStudio } from "@/components/studio/BoutonsStudio";
import { ConclureVente } from "@/components/ConclureVente";
import { consommation, profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";

export const metadata = { title: "Fiche prospect" };

export default async function FicheProspect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  // RLS : la requête ne renvoie rien si le prospect appartient à un autre utilisateur.
  const { data: p } = await session.sb.from("prospects").select("*").eq("id", id).maybeSingle();
  if (!p) notFound();
  const [{ data: sites }, { plan, quotas }, conso, { data: docs }] = await Promise.all([
    session.sb.from("sites").select("id, type, maj_le").eq("prospect_id", id).order("maj_le", { ascending: false }),
    profilEtPlan(session.user.id), consommation(session.user.id),
    session.sb.from("documents").select("id, type, numero, statut").eq("prospect_id", id).order("cree_le", { ascending: false }),
  ]);
  const e = etape(p.statut), q = encodeURIComponent(`${p.nom} ${p.ville ?? ""}`);
  const journal = (Array.isArray(p.journal) ? p.journal : []) as EntreeJournal[];
  return (
    <>
      <Link href="/espace" className="note" style={{ display: "inline-flex", gap: ".3rem", alignItems: "center", textDecoration: "none" }}><ArrowLeft size={16} aria-hidden />Mes prospects</Link>
      <div className="barre-haut" style={{ marginTop: ".6rem" }}>
        <div><p className="note" style={{ margin: "0 0 .3rem" }}>{p.metier} · {p.ville} {p.code_postal}</p><h1>{p.nom}</h1></div>
        <span className="statut" style={{ color: e.couleur, background: `color-mix(in srgb, ${e.couleur} 14%, transparent)`, fontSize: ".9rem" }}>{e.nom}</span>
      </div>

      <form action={changerStatut} className="carte" style={{ marginBottom: "1.2rem" }}>
        <input type="hidden" name="id" value={p.id} />
        <p className="note" style={{ margin: "0 0 .6rem" }}>Étape du suivi</p>
        <div className="etapes-choix">
          {ETAPES.map((x) => <button key={x.id} name="statut" value={x.id} type="submit" className="btn" aria-pressed={x.id === p.statut}
            style={x.id === p.statut ? { background: x.couleur, borderColor: x.couleur, color: "#fff" } : undefined}>{x.nom}</button>)}
        </div>
      </form>

      <div className="fiche-grille">
        <div style={{ display: "grid", gap: "1.2rem", alignContent: "start" }}>
          <div className="carte">
            <h2 style={{ fontSize: "1.15rem" }}>Coordonnées</h2>
            <p style={{ display: "flex", gap: ".5rem" }}><MapPin size={18} aria-hidden style={{ flex: "none", marginTop: ".2rem", color: "var(--violet)" }} />{p.adresse}</p>
            {p.telephone ? <p><a className="btn p" href={`tel:${String(p.telephone).replace(/[^\d+]/g, "")}`}><Phone aria-hidden />Appeler le {p.telephone}</a></p>
              : <p className="liens-num">Trouver le numéro : <a href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noopener">Google Maps</a><a href={`https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(p.nom)}&ou=${encodeURIComponent(p.ville ?? "")}`} target="_blank" rel="noopener">Pages Jaunes</a></p>}
            <p className="note" style={{ margin: 0 }}>{p.indices}<br />SIRET {p.siret} · Source : {p.source}</p>
          </div>
          <form action={enregistrerSuivi} className="carte pile">
            <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Suivi</h2>
            <input type="hidden" name="id" value={p.id} />
            <div className="deux-col">
              <label>Téléphone<input name="telephone" type="tel" defaultValue={p.telephone ?? ""} /></label>
              <label>E-mail<input name="email" type="email" defaultValue={p.email ?? ""} /></label>
              <label>Prochaine action<input name="prochaine_action" defaultValue={p.prochaine_action ?? ""} placeholder="Ex. rappeler après le service" /></label>
              <label>Date<input name="date_prochaine_action" type="date" defaultValue={p.date_prochaine_action ?? ""} /></label>
            </div>
            <label>Notes<textarea name="notes" rows={4} defaultValue={p.notes ?? ""} placeholder="Ce que vous avez appris : horaires, besoins, interlocuteur…" /></label>
            <button className="btn p" type="submit">Enregistrer</button>
          </form>
        </div>
        <div style={{ display: "grid", gap: "1.2rem", alignContent: "start" }}>
          <BoutonsStudio prospectId={p.id} sites={sites ?? []} ia={!!PLANS[plan].studio.effortIA} restants={Math.max(0, quotas.sites_ia - conso.sites_ia)} />
          <ConclureVente prospectId={p.id} docs={docs ?? []} facturation={PLANS[plan].facturation} />
          <GenerateurMessage id={p.id} bloque={p.statut === "refus" ? "Ce prospect a demandé à ne plus être contacté." : undefined} />
          <div className="carte">
            <h2 style={{ fontSize: "1.15rem" }}>Historique</h2>
            <form action={noterEchange} style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
              <input type="hidden" name="id" value={p.id} />
              <input name="texte" placeholder="Noter un échange (appel, visite…)" style={{ flex: 1, minWidth: 0 }} required />
              <button className="btn" type="submit">Ajouter</button>
            </form>
            <ul className="journal">{journal.map((j, i) => <li key={i}><time>{j.d.split("-").reverse().join("/")}</time>{j.t}</li>)}</ul>
          </div>
          <form action={supprimerProspect}>
            <input type="hidden" name="id" value={p.id} />
            <button className="btn" type="submit" style={{ color: "#ef4444" }}><Trash2 aria-hidden />Retirer ce prospect</button>
            <p className="note" style={{ marginTop: ".4rem" }}>L&apos;entreprise redeviendra disponible pour les autres utilisateurs.</p>
          </form>
        </div>
      </div>
    </>
  );
}
