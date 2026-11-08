import { NextResponse } from "next/server";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { profilEtPlan } from "@/lib/quotas";
import { PLANS } from "@/lib/plans";
import { controleEmission, echeanceParDefaut, nettoyerLignes, totaux } from "@/lib/factures";
import { ajouterJournal } from "@/lib/pipeline";

type Ctx = { params: Promise<{ id: string }> };
const ID = /^[0-9a-f-]{36}$/i;
const txt = (v: unknown, n: number) => String(v ?? "").replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").trim().slice(0, n);

async function contexte(params: Ctx["params"]) {
  const session = await utilisateurConnecte();
  if (!session) return { erreur: NextResponse.json({ erreur: "Non connecté" }, { status: 401 }) } as const;
  const id = (await params).id;
  if (!ID.test(id)) return { erreur: NextResponse.json({ erreur: "Document introuvable" }, { status: 404 }) } as const;
  const { data: doc } = await session.sb.from("documents").select("*").eq("id", id).maybeSingle();
  if (!doc) return { erreur: NextResponse.json({ erreur: "Document introuvable" }, { status: 404 }) } as const;
  return { session, doc } as const;
}

/** Enregistre un brouillon (le total est toujours recalculé côté serveur). */
export async function PATCH(req: Request, { params }: Ctx) {
  const c = await contexte(params);
  if ("erreur" in c) return c.erreur;
  if (c.doc.numero) return NextResponse.json({ erreur: "Document émis : il ne peut plus être modifié." }, { status: 409 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const cl = (b.client ?? {}) as Record<string, unknown>;
  const lignes = nettoyerLignes(b.lignes);
  const { data: e } = await c.session.sb.from("entreprises").select("tva, taux_tva").maybeSingle();
  const taux = e && e.tva !== "franchise" ? Number(e.taux_tva) || 0 : 0;
  const ech = typeof b.date_echeance === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date_echeance) ? b.date_echeance : echeanceParDefaut();
  const { error } = await c.session.sb.from("documents").update({
    client: { nom: txt(cl.nom, 150), adresse: txt(cl.adresse, 250), siret: txt(cl.siret, 20), email: txt(cl.email, 150), hors_etablissement: cl.hors_etablissement === true },
    lignes, total_ht: totaux(lignes, taux).ht, taux_tva: taux, date_echeance: ech, conditions: txt(b.conditions, 1000),
  }).eq("id", c.doc.id);
  if (error) return NextResponse.json({ erreur: "Enregistrement impossible" }, { status: 500 });
  return NextResponse.json({ ok: true, totaux: totaux(lignes, taux), taux });
}

/** Actions : emettre, accepter, refuser, payer, annuler (avoir), facturer (devis accepté → facture). */
export async function POST(req: Request, { params }: Ctx) {
  const c = await contexte(params);
  if ("erreur" in c) return c.erreur;
  const { session, doc } = c;
  const { action, date } = (await req.json().catch(() => ({}))) as { action?: string; date?: string };
  const { plan } = await profilEtPlan(session.user.id);
  const journal = async (t: string) => {
    if (!doc.prospect_id) return;
    const { data: p } = await session.sb.from("prospects").select("journal").eq("id", doc.prospect_id).maybeSingle();
    if (p) await session.sb.from("prospects").update({ journal: ajouterJournal(p.journal, t) }).eq("id", doc.prospect_id);
  };
  switch (action) {
    case "emettre": {
      if (!PLANS[plan].facturation) return NextResponse.json({ erreur: "Devis et factures inclus dès l'offre Premium.", plan }, { status: 402 });
      const { data: e } = await session.sb.from("entreprises").select("*").maybeSingle();
      const pb = controleEmission(e, doc.client ?? {}, nettoyerLignes(doc.lignes));
      if (pb.length) return NextResponse.json({ erreur: pb.join(" ") }, { status: 400 });
      const { data: numero, error } = await session.sb.rpc("emettre_document", { p_id: doc.id });
      if (error) return NextResponse.json({ erreur: error.message }, { status: 400 });
      await journal(`${doc.type === "devis" ? "Devis" : "Facture"} ${numero} émis(e)`);
      if (doc.type === "devis" && doc.prospect_id) await session.sb.from("prospects").update({ statut: "devis" }).eq("id", doc.prospect_id).in("statut", ["nouveau", "contacte", "repondu", "rdv"]);
      return NextResponse.json({ numero });
    }
    case "accepter": case "refuser": {
      if (doc.type !== "devis" || !doc.numero) return NextResponse.json({ erreur: "Action impossible" }, { status: 409 });
      await session.sb.from("documents").update({ statut: action === "accepter" ? "accepte" : "refuse" }).eq("id", doc.id);
      await journal(`Devis ${doc.numero} ${action === "accepter" ? "accepté" : "refusé"}`);
      if (doc.prospect_id) await session.sb.from("prospects").update({ statut: action === "accepter" ? "gagne" : "perdu" }).eq("id", doc.prospect_id);
      return NextResponse.json({ ok: true });
    }
    case "payer": {
      if (doc.type !== "facture" || doc.statut !== "emise") return NextResponse.json({ erreur: "Action impossible" }, { status: 409 });
      const le = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
      await session.sb.from("documents").update({ statut: "payee", paye_le: le }).eq("id", doc.id);
      await journal(`Facture ${doc.numero} payée`);
      return NextResponse.json({ ok: true });
    }
    case "annuler": {
      const { data: avoir, error } = await session.sb.rpc("annuler_facture", { p_id: doc.id });
      if (error) return NextResponse.json({ erreur: error.message }, { status: 400 });
      await journal(`Facture ${doc.numero} annulée par un avoir`);
      return NextResponse.json({ id: avoir });
    }
    case "facturer": {
      if (!PLANS[plan].facturation) return NextResponse.json({ erreur: "Devis et factures inclus dès l'offre Premium.", plan }, { status: 402 });
      if (doc.type !== "devis" || doc.statut !== "accepte") return NextResponse.json({ erreur: "Le devis doit d'abord être accepté." }, { status: 409 });
      const { data: f, error } = await session.sb.from("documents").insert({
        user_id: session.user.id, prospect_id: doc.prospect_id, type: "facture", client: doc.client, lignes: doc.lignes, total_ht: doc.total_ht, taux_tva: doc.taux_tva,
        date_echeance: echeanceParDefaut(), conditions: `Selon devis ${doc.numero}.`, origine_id: doc.id,
      }).select("id").single();
      if (error || !f) return NextResponse.json({ erreur: "Création impossible" }, { status: 500 });
      return NextResponse.json({ id: f.id });
    }
    default: return NextResponse.json({ erreur: "Action inconnue" }, { status: 400 });
  }
}

/** Seuls les brouillons se suppriment (la base l'impose aussi). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const c = await contexte(params);
  if ("erreur" in c) return c.erreur;
  if (c.doc.numero) return NextResponse.json({ erreur: "Un document émis se conserve (10 ans pour les factures)." }, { status: 409 });
  await c.session.sb.from("documents").delete().eq("id", c.doc.id);
  return NextResponse.json({ ok: true });
}
