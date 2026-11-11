/* Point d'entrée de la démo MySite : vrais composants de l'application, faux serveur dans le navigateur. */
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { RotateCcw, Sparkles } from "lucide-react";
import { Logo } from "../src/components/Logo";
import { MenuApp } from "../src/components/MenuApp";
import { ORDRE_PLANS, PLANS, type PlanId } from "../src/lib/plans";
import { db, plan, reinitialiser, sauver } from "./donnees";
import { installerFauxServeur } from "./api";
import { ecouterAnnonces, annoncer } from "./annonce";
import { demarrerDepuisHash, naviguer, rafraichir, useEtat } from "./shims/routeur";
import * as P from "./pages";

installerFauxServeur();
demarrerDepuisHash();

function Vue({ chemin }: { chemin: string }) {
  const m = (re: RegExp) => chemin.match(re);
  let r: RegExpMatchArray | null;
  if (chemin === "/espace/pipeline") return <P.Pipeline />;
  if (chemin === "/espace/carte") return <P.Carte />;
  if (chemin === "/espace/studio") return <P.StudioListe />;
  if (chemin === "/espace/studio/photos") return <P.Banque />;
  if ((r = m(/^\/espace\/studio\/(.+)$/))) return <P.StudioSite id={r[1]} />;
  if ((r = m(/^\/espace\/prospects\/(.+)$/))) return <P.Fiche key={r[1]} id={r[1]} />;
  if (chemin === "/espace/factures/entreprise") return <P.Entreprise />;
  if (chemin === "/espace/factures") return <P.Factures />;
  if ((r = m(/^\/espace\/factures\/(.+)$/))) return <P.Document id={r[1]} />;
  if (chemin === "/espace/academie") return <P.Academie />;
  if ((r = m(/^\/espace\/academie\/(.+)$/))) return <P.Lecon id={r[1]} />;
  if ((r = m(/^\/espace\/livraison\/(.+)$/))) return <P.Livraison id={r[1]} />;
  if (chemin === "/espace/abonnement") return <P.Offres changer={changerOffre} />;
  if (chemin === "/espace/bienvenue") return <P.Zone />;
  if (chemin === "/espace/suivi") return <P.Suivi />;
  return <P.Accueil />;
}

function changerOffre(p: PlanId) {
  db().profil.plan = p; sauver(); rafraichir();
  annoncer(`Offre de démo : ${PLANS[p].nom}. Le Studio, les quotas et les devis s'adaptent.`);
}

function App() {
  const { chemin } = useEtat();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  useEffect(() => ecouterAnnonces((m) => { setMsg(m); window.clearTimeout((window as any).__t); (window as any).__t = window.setTimeout(() => setMsg(null), 5200); }), []);
  return (
    <>
      <div className="bandeau-demo">
        <span className="bd-titre"><Sparkles aria-hidden />Démo MySite · données fictives, rien n&apos;est envoyé</span>
        <div className="bd-offres" role="group" aria-label="Offre de démonstration">
          <span>Offre :</span>
          {ORDRE_PLANS.map((p) => <button key={p} type="button" aria-pressed={plan() === p} onClick={() => changerOffre(p)}>{PLANS[p].nom}</button>)}
        </div>
        {confirmer
          ? <span className="bd-confirme">Tout effacer ?<button type="button" onClick={() => { reinitialiser(); setConfirmer(false); naviguer("/espace"); annoncer("Démo réinitialisée."); }}>Oui</button><button type="button" onClick={() => setConfirmer(false)}>Non</button></span>
          : <button type="button" className="bd-reset" onClick={() => setConfirmer(true)}><RotateCcw aria-hidden />Réinitialiser</button>}
      </div>
      <div className="app">
        <aside className="cote">
          <Logo />
          <nav aria-label="Menu"><MenuApp /></nav>
          <div className="carte-offre">
            <strong style={{ display: "flex", gap: ".4rem", alignItems: "center" }}><Sparkles size={16} aria-hidden />Offre {PLANS[plan()].nom}</strong>
            <p>Changez d&apos;offre en haut de la page pour voir ce que chacune débloque.</p>
          </div>
        </aside>
        <main className="principal"><Vue chemin={chemin} /></main>
      </div>
      {msg && <div className="toast-demo" role="status">{msg}</div>}
    </>
  );
}

createRoot(document.getElementById("racine")!).render(<App />);
