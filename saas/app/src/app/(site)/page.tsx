import Link from "next/link";
import { ArrowRight, BadgeEuro, Check, ChartLine, Croissant, GraduationCap, Hammer, Handshake, MapPin, MessageSquareText, MonitorSmartphone, ReceiptText, Rocket, Scissors, Search, ShieldCheck, Store, UtensilsCrossed, WandSparkles, Wrench, Zap } from "lucide-react";
import { Tarifs } from "@/components/Tarifs";
import { ApercuCockpit } from "@/components/ApercuCockpit";
import { Provenance } from "@/components/Provenance";
import { PLANS } from "@/lib/plans";

const METHODE = [
  { ico: Search, t: "Trouver", d: "Vous choisissez un métier et un département. MySite cherche les commerces indépendants dans le registre officiel des entreprises, et vous les réserve." },
  { ico: MessageSquareText, t: "Contacter", d: "Pour chaque commerce, un premier message court et personnel est rédigé. Vous relisez, puis vous l'envoyez vous-même." },
  { ico: MonitorSmartphone, t: "Montrer", d: "En un clic, une maquette de site à son nom. Vous la montrez sur votre téléphone : le commerçant voit son futur site." },
  { ico: Handshake, t: "Signer et livrer", d: "Devis, mise en ligne en un clic, branchement de son nom de domaine : chaque étape est guidée." },
  { ico: BadgeEuro, t: "Encaisser", d: "Factures numérotées, suivi des paiements et total encaissé. Vos prix restent les vôtres." },
];
const POUR_QUI = [
  { t: "Vous débutez", d: "Pas besoin de savoir coder ni vendre. L'Académie vous guide pas à pas, du statut à la première facture." },
  { t: "Vous êtes freelance", d: "Vous savez faire des sites, mais chercher des clients vous prend trop de temps. MySite prépare vos journées de prospection." },
  { t: "Vous avez une agence", d: "Plusieurs départements, gros volumes, sites sans mention MySite : l'offre Ultra est faite pour ça." },
];
const FONCTIONS = [
  { ico: WandSparkles, coul: "p-rose", t: "Des messages écrits pour chacun", d: "Adaptés au métier, à la ville et à la situation du commerce, avec la mention pour refuser. Rien n'est envoyé sans vous." },
  { ico: Store, coul: "p-cyan", t: "Le Studio de sites", d: "Restaurant, pizzeria, coiffure, artisan : un site complet, modifiable, prêt pour le téléphone." },
  { ico: ChartLine, coul: "p-orange", t: "Un suivi clair", d: "Statuts, rappels, historique : vous savez toujours qui rappeler, et quand." },
  { ico: MapPin, coul: "p-vert", t: "La carte de vos prospects", d: "Regroupez vos visites par quartier et organisez vos tournées." },
  { ico: ReceiptText, coul: "p-violet", t: "Devis et factures", d: "Mentions usuelles, numérotation, suivi des encaissements (dès l'offre Premium)." },
  { ico: ShieldCheck, coul: "p-indigo", t: "Dans les règles", d: "Registres publics uniquement, entreprises opposées exclues, un seul utilisateur par commerce." },
];
const SECTEURS = [[UtensilsCrossed, "Restaurants et snacks"], [Croissant, "Boulangeries et traiteurs"], [Hammer, "Artisans du bâtiment"], [Scissors, "Coiffure et beauté"], [Wrench, "Services de proximité"]] as const;
const FAQ = [
  ["Faut-il savoir créer un site ?", "Non. Le Studio crée le site à partir du nom et du métier du commerce. Vous changez les textes, les photos et les couleurs dans un panneau simple, sans une ligne de code."],
  ["Je n'ai jamais rien vendu. C'est pour moi ?", "Oui, si vous êtes prêt à contacter des commerçants. L'Académie explique chaque étape : le statut, l'offre, le premier message, la visite, le devis, la livraison."],
  ["Est-ce que je vais gagner de l'argent ?", "MySite vous fait gagner du temps (recherche, messages, maquettes, suivi), mais ne garantit aucun revenu : vos ventes dépendent de votre travail, de votre offre et de votre zone."],
  ["À quel prix vendre un site ?", "Vous fixez vos prix librement. L'Académie donne des repères et un exemple d'offre (un prix de création fixe, puis un petit abonnement mensuel)."],
  ["D'où viennent les commerces proposés ?", "Du registre officiel des entreprises (base Sirene de l'INSEE), complété par OpenStreetMap. Les entreprises qui s'opposent à l'usage commercial de leurs données sont exclues automatiquement."],
  ["Les commerces proposés ont-ils déjà un site ?", "Certains, oui : le registre ne le dit pas. Chaque fiche a un lien pour le vérifier en un clic avant de contacter le commerce."],
  ["Faut-il une entreprise pour s'inscrire ?", "Non pour essayer. Pour facturer vos clients, il vous faudra un statut : la micro-entreprise se crée gratuitement en ligne, et l'Académie vous montre comment."],
  ["Puis-je essayer avant de payer ?", "Oui, avec l'offre Gratuite, sans limite de durée et sans carte bancaire : vos premiers commerces chaque mois, les maquettes express et les deux premiers modules de l'Académie pour comprendre la méthode."],
  ["Puis-je résilier quand je veux ?", "Oui, en ligne, en quelques clics, sans frais ni justification. La résiliation prend effet à la fin de la période payée, et vos données restent accessibles en offre Gratuite."],
];

export default function Accueil() {
  const pro = PLANS.pro.prixMensuel, exemple = 490;
  return (
    <>
      <Provenance />
      <section className="hero">
        <div className="conteneur hero-grille">
          <div>
            <span className="surtitre"><Zap aria-hidden />Débutants, freelances, agences</span>
            <h1>Vendez des sites web aux <span className="degrade-texte">commerces de votre ville.</span></h1>
            <p className="chapo">MySite trouve les commerces à contacter, rédige votre premier message, crée une maquette de site à leur nom et prépare le devis, la mise en ligne et la facture. Vous, vous allez les voir.</p>
            <div className="actions">
              <Link className="btn p grand" href="/connexion?mode=inscription">Commencer gratuitement <ArrowRight aria-hidden /></Link>
              <Link className="btn grand fantome" href="#methode">Voir comment ça marche</Link>
            </div>
            <ul className="preuves">
              <li><Check aria-hidden />Sans carte bancaire</li><li><Check aria-hidden />Offre gratuite sans limite de durée</li><li><Check aria-hidden />Résiliable en ligne</li>
            </ul>
          </div>
          <div><ApercuCockpit /><p className="note" style={{ textAlign: "center", marginTop: ".9rem", fontSize: ".8rem" }}>Aperçu du cockpit, avec des données d&apos;exemple.</p></div>
        </div>
      </section>

      <section className="conteneur" aria-label="Secteurs disponibles">
        <ul className="secteurs">{SECTEURS.map(([Ico, t]) => <li key={t}><Ico aria-hidden />{t}</li>)}</ul>
      </section>

      <section className="bloc" id="methode">
        <div className="conteneur">
          <div className="tete"><span className="surtitre"><Rocket aria-hidden />La méthode</span><h2>Cinq étapes, un seul outil</h2><p>Du premier contact à la facture payée, vous savez toujours quoi faire ensuite.</p></div>
          <div className="methode-grille">
            <ol className="methode">
              {METHODE.map(({ ico: Ico, t, d }, i) => <li key={t} className="carte"><span className="num">{i + 1}</span><div><h3><Ico aria-hidden />{t}</h3><p>{d}</p></div></li>)}
            </ol>
            <figure className="tel-video">
              <video controls playsInline preload="none" poster="/video/mysite-methode.jpg" aria-label="Vidéo : comment fonctionne MySite, en 40 secondes">
                <source src="/video/mysite-methode.mp4" type="video/mp4" />
              </video>
              <figcaption className="note">La méthode en 40 secondes. Écrans de démonstration, données d&apos;exemple.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="bloc" style={{ paddingTop: 0 }}>
        <div className="conteneur">
          <div className="tete"><h2>Pour qui ?</h2></div>
          <div className="grille">{POUR_QUI.map(({ t, d }) => <article key={t} className="carte"><h3>{t}</h3><p className="note" style={{ margin: 0, fontSize: "1rem" }}>{d}</p></article>)}</div>
        </div>
      </section>

      <section className="bloc" id="fonctionnalites" style={{ paddingTop: 0 }}>
        <div className="conteneur">
          <div className="tete"><h2>Tout ce qu&apos;il faut, au même endroit</h2><p>Fini les tableurs, les heures sur les annuaires et les sites refaits de zéro.</p></div>
          <div className="grille">
            {FONCTIONS.map(({ ico: Ico, coul, t, d }) => <article key={t} className="carte fonction"><span className={`pastille ${coul}`}><Ico aria-hidden /></span><h3>{t}</h3><p>{d}</p></article>)}
          </div>
        </div>
      </section>

      <section className="bloc" style={{ paddingTop: 0 }}>
        <div className="conteneur duo">
          <article className="carte">
            <span className="pastille p-violet"><GraduationCap aria-hidden /></span>
            <h2 style={{ fontSize: "1.6rem" }}>L&apos;Académie : apprenez à vendre un site</h2>
            <p>Des leçons courtes, en vidéo et en texte, avec un quiz et une mission à faire dans l&apos;outil : se lancer en règle, construire son offre, écrire le premier message, réussir la visite, faire le devis, livrer.</p>
            <p>Les deux premiers modules, <b>Démarrer</b> et <b>Prospecter</b>, sont inclus dans l&apos;offre Gratuite. L&apos;Académie complète est incluse dès l&apos;offre Pro.</p>
            <p className="note" style={{ margin: 0 }}>Informations générales, pas un conseil juridique ou fiscal personnalisé, ni une promesse de revenus.</p>
          </article>
          <article className="carte">
            <span className="pastille p-vert"><BadgeEuro aria-hidden /></span>
            <h2 style={{ fontSize: "1.6rem" }}>Un exemple de calcul</h2>
            <p>Vous fixez vos prix. Si vous vendez un site {exemple} €, l&apos;offre Pro à {pro} € par mois représente environ {Math.round((pro / exemple) * 100)} % de cette seule vente.</p>
            <p className="note" style={{ margin: 0 }}>C&apos;est une simple division, pas une promesse : le nombre de ventes dépend de votre travail. Commencez en Gratuit, et ne payez que si l&apos;outil vous sert.</p>
          </article>
        </div>
      </section>

      <section className="bloc" id="tarifs" style={{ paddingTop: 0 }}>
        <div className="conteneur">
          <div className="tete"><span className="surtitre">Tarifs</span><h2>Gratuit pour commencer, sans engagement ensuite</h2><p>Prix TTC. Vous changez d&apos;offre ou vous arrêtez quand vous voulez, en ligne.</p></div>
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
          <h2>Vos premiers commerces en 2 minutes</h2>
          <p>Créez votre compte gratuit, choisissez un métier et un département : la première recherche part toute seule.</p>
          <Link className="btn grand" href="/connexion?mode=inscription">Créer mon compte gratuit <ArrowRight aria-hidden /></Link>
        </div>
      </section>
      <div className="cta-mobile"><Link className="btn p bloc" href="/connexion?mode=inscription">Commencer gratuitement <ArrowRight aria-hidden /></Link></div>
    </>
  );
}
