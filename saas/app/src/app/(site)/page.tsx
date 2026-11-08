import Link from "next/link";
import { ArrowRight, ChartLine, Check, Croissant, Hammer, MapPin, Rocket, Scissors, ShieldCheck, Store, Target, UtensilsCrossed, WandSparkles, Wrench, Zap } from "lucide-react";
import { Tarifs } from "@/components/Tarifs";
import { ApercuCockpit } from "@/components/ApercuCockpit";

const FONCTIONS = [
  { ico: Target, coul: "p-violet", t: "Des prospects qualifiés, près de chez vous", d: "Secteur et départements : MySite cherche les entreprises actives dans la base officielle Sirene, sans les chaînes, et vous montre les indices utiles." },
  { ico: WandSparkles, coul: "p-rose", t: "Des messages écrits pour chacun", d: "L'IA rédige un premier message adapté au métier, à la ville et au besoin du commerce. Vous relisez et vous envoyez." },
  { ico: Store, coul: "p-cyan", t: "Une maquette de site par prospect", d: "Montrez au commerçant son futur site pendant le rendez-vous : c'est souvent ce qui fait la différence." },
  { ico: ChartLine, coul: "p-orange", t: "Un pipeline clair", d: "Statuts, rappels, historique : vous savez toujours qui rappeler, et quand." },
  { ico: MapPin, coul: "p-vert", t: "La carte de vos prospects", d: "Visualisez votre territoire et organisez vos tournées par quartier." },
  { ico: ShieldCheck, coul: "p-indigo", t: "Conforme par défaut", d: "Données publiques uniquement, entreprises opposées exclues, modèles de messages avec mention STOP." },
];
const SECTEURS = [[UtensilsCrossed, "Restaurants et snacks"], [Croissant, "Boulangeries et traiteurs"], [Hammer, "Artisans du bâtiment"], [Scissors, "Coiffure et beauté"], [Wrench, "Services de proximité"]] as const;
const FAQ = [
  ["D'où viennent les prospects ?", "De registres publics officiels : la base Sirene de l'INSEE (et OpenStreetMap pour certains numéros). Les entreprises qui se sont opposées à l'usage commercial de leurs données sont exclues automatiquement."],
  ["Est-ce que je vais gagner de l'argent ?", "MySite vous fait gagner beaucoup de temps (recherche, messages, maquettes, suivi), mais ne garantit aucun revenu : les ventes dépendent de votre travail et de votre offre."],
  ["Puis-je résilier quand je veux ?", "Oui, en quelques clics depuis « Mon abonnement ». La résiliation prend effet à la fin de la période payée, sans frais, et vos données restent accessibles en offre Gratuite."],
  ["Faut-il une entreprise pour s'inscrire ?", "Non pour essayer. Pour prospecter et facturer vos clients, il vous faudra un statut (la micro-entreprise se crée gratuitement en ligne)."],
  ["L'essai Premium est-il vraiment gratuit ?", "Oui : 7 jours, sans carte bancaire, une fois par compte. Aucun prélèvement à la fin : vous repassez automatiquement en Gratuit."],
];

export default function Accueil() {
  return (
    <>
      <section className="hero">
        <div className="conteneur hero-grille">
          <div>
            <span className="surtitre"><Zap aria-hidden />Prospection locale assistée par IA</span>
            <h1>Vos prochains clients sont <span className="degrade-texte">à côté de chez vous.</span></h1>
            <p className="chapo">Choisissez votre secteur et votre région. MySite trouve les commerces à démarcher, rédige vos messages, prépare une maquette de site pour chacun et suit vos ventes.</p>
            <div className="actions">
              <Link className="btn p grand" href="/connexion?mode=inscription">Commencer gratuitement <ArrowRight aria-hidden /></Link>
              <Link className="btn grand fantome" href="#tarifs">Voir les tarifs</Link>
            </div>
            <ul className="preuves">
              <li><Check aria-hidden />Sans carte bancaire</li><li><Check aria-hidden />Essai Premium 7 jours</li><li><Check aria-hidden />Résiliable en 3 clics</li>
            </ul>
          </div>
          <ApercuCockpit />
        </div>
      </section>

      <section className="conteneur" aria-label="Secteurs disponibles">
        <ul className="secteurs">{SECTEURS.map(([Ico, t]) => <li key={t}><Ico aria-hidden />{t}</li>)}</ul>
      </section>

      <section className="bloc" id="fonctionnalites">
        <div className="conteneur">
          <div className="tete"><span className="surtitre"><Rocket aria-hidden />Tout au même endroit</span><h2>De la recherche à la signature</h2><p>Fini les tableurs et les heures sur Google Maps : MySite prépare le terrain, vous vous concentrez sur la vente.</p></div>
          <div className="grille">
            {FONCTIONS.map(({ ico: Ico, coul, t, d }) => <article key={t} className="carte fonction"><span className={`pastille ${coul}`}><Ico aria-hidden /></span><h3>{t}</h3><p>{d}</p></article>)}
          </div>
        </div>
      </section>

      <section className="bloc" style={{ paddingTop: 0 }}>
        <div className="conteneur">
          <div className="tete"><h2>Prêt en 3 minutes</h2></div>
          <div className="etapes">
            {[["Choisissez votre zone", "Secteur, départements : votre territoire de chasse."], ["Recevez vos prospects", "Les commerces actifs de la zone arrivent dans votre cockpit."], ["Contactez, montrez, signez", "Message IA, maquette, rappel : vous suivez chaque affaire."]].map(([t, d]) => (
              <div key={t} className="carte etape"><h3>{t}</h3><p className="note" style={{ margin: 0 }}>{d}</p></div>))}
          </div>
        </div>
      </section>

      <section className="bloc" id="tarifs" style={{ paddingTop: 0 }}>
        <div className="conteneur">
          <div className="tete"><span className="surtitre">Tarifs simples</span><h2>Commencez gratuitement, évoluez quand vous vendez</h2><p>Prix TTC, sans engagement. Une seule vente de site rembourse plusieurs mois de Pro.</p></div>
          <Tarifs mode="inscription" />
        </div>
      </section>

      <section className="bloc" id="faq" style={{ paddingTop: 0 }}>
        <div className="conteneur">
          <div className="tete"><h2>Questions fréquentes</h2></div>
          <div className="faq">{FAQ.map(([q, r]) => <details key={q}><summary>{q}</summary><p>{r}</p></details>)}</div>
        </div>
      </section>

      <section className="conteneur" style={{ paddingBottom: "1rem" }}>
        <div className="appel">
          <h2>Votre premier prospect est à 3 minutes</h2>
          <p>Créez votre cockpit gratuitement, choisissez votre zone et découvrez les commerces à contacter dès aujourd&apos;hui.</p>
          <Link className="btn grand" href="/connexion?mode=inscription">Créer mon cockpit gratuit <ArrowRight aria-hidden /></Link>
        </div>
      </section>
    </>
  );
}
