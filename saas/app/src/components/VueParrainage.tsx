import Link from "next/link";
import { BadgeEuro, Gift, Send, Sparkles, UserPlus } from "lucide-react";
import { PartageParrainage } from "./PartageParrainage";
import { etapeFilleul, RECOMPENSES_MAX_PAR_AN, type LigneFilleul } from "@/lib/parrainage";

export interface DonneesParrainage {
  lien: string;
  code: string;
  filleuls: (LigneFilleul & { nom: string; depuis: string })[];
  compteurs: { inscrits: number; enAttente: number; valides: number; creditGagneCentimes: number };
  creditRestantCentimes: number;
  recompensesAnnee: number;
  proOffertJusquau: string | null;
}

const euros = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: c % 100 ? 2 : 0 });

const FAQ: [string, string][] = [
  ["Quand est-ce que je reçois mes 29 € ?", "Dès que ton ami paie son 2e mois. S'il a choisi l'abonnement annuel, 14 jours après son paiement (le temps du délai de rétractation). Tu reçois un e-mail à chaque étape."],
  ["Comment le crédit est utilisé ?", "Les 29 € sont ajoutés à ton compte et déduits automatiquement de ta prochaine facture MySite. S'il en reste, ils passent sur les mois suivants. Le crédit ne peut pas être converti en argent ni donné à quelqu'un d'autre."],
  ["Et si je suis en Gratuit ?", "Tu reçois 1 mois de l'offre Pro offert (30 jours) à la place, sans carte bancaire. S'il y en a plusieurs, ils s'ajoutent. À la fin, ton compte repasse simplement en Gratuit."],
  ["Et si mon ami annule ?", "S'il se rétracte, est remboursé, conteste le paiement ou résilie avant la validation, le parrainage est annulé, sans récompense. Ton ami garde sa réduction déjà utilisée."],
  ["Y a-t-il une limite ?", `Oui : ${RECOMPENSES_MAX_PAR_AN} récompenses par année civile. Au-delà, tes parrainages sont comptés et affichés, mais sans récompense. Le compteur repart à zéro le 1er janvier.`],
];

/** Section « Parrainage » : affichage seul (les données viennent de la page). Pensée d'abord pour le téléphone. */
export function VueParrainage({ d }: { d: DonneesParrainage }) {
  const limite = d.recompensesAnnee >= RECOMPENSES_MAX_PAR_AN;
  return (
    <div className="parrainage">
      <header className="parrainage-tete">
        <span className="pastille p-rose" aria-hidden><Gift /></span>
        <h1>Invite un ami, gagne 29 €</h1>
        <p>Invite un ami : il a -20 % sur son 1er paiement, et toi tu gagnes 29 € de crédit dès qu&apos;il paie son 2e mois.</p>
      </header>

      <ol className="etapes-parrainage" aria-label="Comment ça marche">
        <li><span className="pastille p-violet" aria-hidden><Send /></span><span><b>1.</b> Partage ton lien</span></li>
        <li><span className="pastille p-cyan" aria-hidden><UserPlus /></span><span><b>2.</b> Ton ami s&apos;abonne avec -20 % sur son 1er paiement</span></li>
        <li><span className="pastille p-vert" aria-hidden><BadgeEuro /></span><span><b>3.</b> Il paie son 2e mois → tu gagnes 29 €, déduits de ta prochaine facture (ou 1 mois de Pro offert si tu es en Gratuit)</span></li>
      </ol>

      <PartageParrainage lien={d.lien} code={d.code} />

      <section aria-labelledby="titre-compteur">
        <h2 id="titre-compteur" className="cache">Tes parrainages en chiffres</h2>
        <div className="compteur-parrainage">
          <div className="carte"><b>{d.compteurs.inscrits}</b><small>Amis inscrits</small></div>
          <div className="carte"><b>{d.compteurs.enAttente}</b><small>En attente</small></div>
          <div className="carte"><b>{d.compteurs.valides}</b><small>Validés</small></div>
          <div className="carte"><b>{euros(d.compteurs.creditGagneCentimes)}</b><small>Crédit gagné</small></div>
        </div>
        <p className="ligne-credit">
          <span>Crédit restant : <b>{euros(d.creditRestantCentimes)}</b></span>
          <span className={limite ? "limite-atteinte" : undefined}>{d.recompensesAnnee}/{RECOMPENSES_MAX_PAR_AN} récompenses cette année</span>
        </p>
        {limite && <p className="alerte" role="status">Tu as atteint la limite de {RECOMPENSES_MAX_PAR_AN} récompenses cette année. Tes prochains parrainages sont comptés, mais sans récompense jusqu&apos;au 1er janvier.</p>}
        {d.proOffertJusquau && new Date(d.proOffertJusquau).getTime() > Date.now() && (
          <p className="alerte ok" role="status"><Sparkles aria-hidden size={18} />Offre Pro offerte jusqu&apos;au {new Date(d.proOffertJusquau).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })} grâce au parrainage.</p>
        )}
      </section>

      <section className="carte" aria-labelledby="titre-filleuls">
        <h2 id="titre-filleuls">Tes filleuls</h2>
        {d.filleuls.length ? (
          <ul className="filleuls">
            {d.filleuls.map((f, i) => {
              const e = etapeFilleul(f);
              return (
                <li key={i}>
                  <div className="filleul-ligne"><b>{f.nom}</b><span className={`badge-filleul ${e.ton}`}>{e.badge}</span></div>
                  <div className="progres" role="progressbar" aria-label={`Avancement du parrainage de ${f.nom}`} aria-valuemin={0} aria-valuemax={3} aria-valuenow={e.etape}>
                    {[1, 2, 3].map((n) => <span key={n} className={e.ton === "annule" ? "annule" : n <= e.etape ? "fait" : ""} />)}
                  </div>
                  <small className="note">Inscrit le {f.depuis}</small>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="vide-parrainage">
            <p><b>Aucun filleul pour l&apos;instant.</b></p>
            <p className="note">Pense à un collègue freelance, un ami qui se lance ou un membre de ton groupe WhatsApp « indépendants » : un message suffit. Ton lien est juste au-dessus 👆</p>
          </div>
        )}
      </section>

      <section aria-labelledby="titre-faq">
        <h2 id="titre-faq">Questions fréquentes</h2>
        <div className="faq">
          {FAQ.map(([q, r]) => <details key={q}><summary>{q}</summary><p>{r}</p></details>)}
        </div>
        <p className="note" style={{ textAlign: "center", marginTop: "1rem" }}><Link href="/reglement-parrainage">Lire le règlement complet du parrainage</Link></p>
      </section>
    </div>
  );
}
