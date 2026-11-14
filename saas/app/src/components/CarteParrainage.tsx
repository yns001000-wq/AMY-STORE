"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, X } from "lucide-react";

/** Carte de parrainage proposée au bon moment (jamais bloquante, se ferme d'un clic, au plus une fois par semaine). */
export function CarteParrainage({ moment }: { moment: "publication" | "devis" }) {
  const [voir, setVoir] = useState(false);
  useEffect(() => {
    fetch("/api/parrainage/carte").then((r) => r.json()).then((j) => setVoir(!!j.afficher)).catch(() => {});
  }, []);
  if (!voir) return null;
  return (
    <aside className="carte carte-parrainage" aria-label="Parrainage">
      <span className="pastille p-rose" aria-hidden><Gift /></span>
      <div>
        <strong>{moment === "publication" ? "Bravo pour ce site en ligne ! 🎉" : "Devis accepté, bravo ! 🎉"}</strong>
        <p>Tu connais quelqu&apos;un que MySite aiderait ? Invite-le : il a -20 % sur son 1er paiement, et toi tu gagnes 29 € quand il paie son 2e mois.</p>
        <Link className="btn p" href="/espace/parrainage">Inviter un ami</Link>
      </div>
      <button type="button" className="ed-ico fermer-carte" aria-label="Fermer" onClick={() => setVoir(false)}><X aria-hidden /></button>
    </aside>
  );
}
