import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { utilisateurConnecte } from "@/lib/supabase/serveur";
import { LECONS, lecon } from "@/lib/academie/cours";
import { LeconInteractive } from "@/components/academie/LeconInteractive";

export async function generateMetadata({ params }: { params: Promise<{ lecon: string }> }) {
  return { title: lecon((await params).lecon)?.titre ?? "Académie" };
}

export default async function PageLecon({ params }: { params: Promise<{ lecon: string }> }) {
  const id = (await params).lecon;
  const session = await utilisateurConnecte();
  if (!session) redirect("/connexion");
  const l = lecon(id);
  if (!l) notFound();
  const { data } = await session.sb.from("progression_cours").select("lecon").eq("lecon", id).maybeSingle();
  const k = LECONS.findIndex((x) => x.id === id), suivante = LECONS[k + 1];
  return (
    <>
      <Link href="/espace/academie" className="note" style={{ display: "inline-flex", gap: ".3rem", alignItems: "center", textDecoration: "none" }}><ArrowLeft size={16} aria-hidden />Académie</Link>
      <div className="barre-haut" style={{ marginTop: ".6rem" }}>
        <div><p className="note" style={{ margin: "0 0 .3rem", color: l.module.couleur, fontWeight: 700 }}>{l.module.titre} · leçon {l.module.lecons.findIndex((x) => x.id === id) + 1}/{l.module.lecons.length}</p><h1>{l.titre}</h1></div>
        <span className="badge-offre"><Clock aria-hidden />{l.minutes} min</span>
      </div>
      <LeconInteractive l={{ ...l, module: undefined } as unknown as typeof l} couleur={l.module.couleur} dejaFaite={!!data} suivante={suivante ? { id: suivante.id, titre: suivante.titre } : null} />
    </>
  );
}
