import Link from "next/link";
import { ArrowRight, BadgeEuro, Check, Croissant, GraduationCap, Hammer, Handshake, MessageSquareText, MonitorSmartphone, ReceiptText, Rocket, Scissors, Search, ShieldCheck, UtensilsCrossed, WandSparkles, Wrench, Zap } from "lucide-react";
import { Tarifs } from "@/components/Tarifs";
import { DemoCodePostal } from "@/components/DemoCodePostal";
import { Captures } from "@/components/Captures";
import { Temoignages } from "@/components/Temoignages";
import { Provenance } from "@/components/Provenance";
import { PLANS } from "@/lib/plans";
import { prixOffre } from "@/lib/lancement";

const ETAPES = [
  { ico: Search, coul: "p-violet", t: "Trouvez", d: "Indiquez votre zone : MySite liste les petites entreprises indépendantes autour de vous, et vous les réserve." },
  { ico: MessageSquareText, coul: "p-rose", t: "Contactez", d: "Un premier message court et personnel est rédigé pour chacune. Vous relisez, vous l'envoyez." },
  { ico: MonitorSmartphone, coul: "p-cyan", t: "Montrez", d: "En un clic, une maquette de site à son nom. Le gérant voit son futur site sur votre téléphone." },
];
const ENSUITE = [
  { ico: Handshake, t: "Devis et mise en ligne en un clic", d: "dès l'offre Pro" },
  { ico: BadgeEuro, t: "Factures et suivi des encaissements", d: "dès l'offre Premium" },
];
const POUR_QUI = [
  { t: "Vous débutez", d: "Pas besoin de savoir coder ni vendre. L'Académie vous guide pas à pas, du statut à la première facture." },
  { t: "Vous êtes freelance", d: "Vous savez faire des sites, mais chercher des clients vous prend trop de temps. MySite prépare vos journées de prospection." },
  { t: "Vous avez une agence", d: "Plusieurs départements, gros volumes, sites sans mention MySite : l'offre Ultra est faite pour ça." },
];
const AUSSI = [
  { ico: WandSparkles, coul: "p-rose", t: "Messages écrits pour chacun", d: "SMS, e-mail ou script d'appel, avec la mention pour refuser. Rien n'est envoyé sans vous." },
  { ico: ReceiptText, coul: "p-violet", t: "Devis et factures", d: "Mentions usuelles, numérotation, total encaissé. Dès l'offre Premium." },
  { ico: ShieldCheck, coul: "p-indigo", t: "Dans les règles", d: "Registres publics, entreprises opposées exclues, un seul utilisateur par entreprise." },
];
const SECTEURS = [[UtensilsCrossed, "Restaurants et snacks"], [Croissant, "Boulangeries et traiteurs"], [Hammer, "Artisans du bâtiment"], [Scissors, "Coiffure et beauté"], [Wrench, "Services de proximité"]] as const;
const FAQ = [
  ["Faut-il savoir créer un site ?", "Non. Le Studio crée le site à partir du nom et du métier de l'entreprise. Vous changez les textes, les photos et les couleurs dans un panneau simple, sans une ligne de code."],
  ["Je n'ai jamais rien vendu. C'est pour moi ?", "Oui, si vous êtes prêt à contacter des gérants d'entreprise. L'Académie explique chaque étape : le statut, l'offre, le premier message, la visite, le devis, la livraison."],
  ["Est-ce que je vais gagner de l'argent ?", "MySite vous fait gagner du temps (recherche, messages, maquettes, suivi), mais ne garantit aucun revenu : vos ventes dépendent de votre travail, de votre offre et de votre zone."],
  ["À quel prix vendre un site ?", "Vous fixez vos prix librement. L'Académie donne des repères et un exemple d'offre (un prix de création fixe, puis un petit abonnement mensuel)."],
  ["D'où viennent les entreprises proposées ?", "Du registre officiel des entreprises (base Sirene de l'INSEE), complété par OpenStreetMap. Les entreprises qui s'opposent à l'usage commercial de leurs données sont exclues automatiquement."],
  ["Les entreprises proposées ont-elles déjà un site ?", "Certains, oui : le registre ne le dit pas. Chaque fiche a un lien pour le vérifier en un clic avant de contacter l'entreprise."],
  ["Faut-il une entreprise pour s'inscrire ?", "Non pour essayer. Pour facturer vos clients, il vous faudra un statut : la micro-entreprise se crée gratuitement en ligne, et l'Académie vous montre comment."],
  ["Puis-je essayer avant de payer ?", "Oui, avec l'offre Gratuite, sans limite de durée et sans carte bancaire : vos premières entreprises chaque mois, les maquettes express et les deux premiers modules de l'Académie pour comprendre la méthode."],
  ["Puis-je résilier quand je veux ?", "Oui, en ligne, en quelques clics, sans frais ni justification. La résiliation prend effet à la fin de la période payée, et vos données restent accessibles en offre Gratuite."],
];

export default function Accueil() {
  const pro = prixOffre("pro", "mensuel"), exemple = 490;
  return (
    <>
      <Provenance />
      <section className="hero">
        <div className="conteneur hero-grille">
          <div>
            <span className="surtitre"><Zap aria-hidden />Débutants, freelances, agences</span>
            <h1>Montrez à une entreprise son futur site <span className="degrade-texte">avant même de l&apos;appeler.</span></h1>
            <p className="chapo">MySite trouve les petites entreprises à démarcher autour de vous, écrit le premier message et crée la maquette à leur nom en un clic.</p>
            <div className="actions">
              <Link className="btn p grand" href="/connexion?mode=inscription">Commencer gratuitement <ArrowRight aria-hidden /></Link>
              <Link className="btn grand fantome" href="#methode">Comment ça marche</Link>
            </div>
            <ul className="preuves">
              <li><Check aria-hidden />Sans carte bancaire</li><li><Check aria-hidden />Offre gratuite sans limite de durée</li><li><Check aria-hidden />Résiliable en ligne</li>
            </ul>
          </div>
          <div className="hero-demo"><span className="demo-badge">Essayez sans inscription</span><h2 className="demo-titre">Combien d&apos;entreprises à démarcher près de chez vous ?</h2><DemoCodePostal /></div>
        </div>
      </section>

      <section className="conteneur" aria-label="Secteurs disponibles">
        <ul className="secteurs">{SECTEURS.map(([Ico, t]) => <li key={t}><Ico aria-hidden />{t}</li>)}</ul>
      </section>

      <section className="bloc" id="methode">
        <div className="conteneur">
          <div className="tete"><span className="surtitre"><Rocket aria-hidden />Comment ça marche</span><h2>Votre premier client en 3 étapes</h2><p>Pas besoin de savoir coder ni de connaître la vente : MySite prépare chaque étape, vous allez à la rencontre des gérants.</p></div>
          <div className="etapes-grille">
            <ol className="etapes3">
              {ETAPES.map(({ ico: Ico, coul, t, d }, i) => (
                <li key={t} className="carte">
                  <span className={`pastille ${coul}`}><Ico aria-hidden /></span>
                  <span className="etape-num">Étape {i + 1}</span>
                  <h3>{t}</h3><p>{d}</p>
                </li>
              ))}
            </ol>
            <figure className="tel-video">
              <video controls playsInline preload="none" poster="/video/mysite-etapes.jpg" aria-label="Vidéo : vendre ton premier site en 3 étapes avec MySite">
                <source src="/video/mysite-etapes.mp4" type="video/mp4" />
              </video>
              <figcaption className="note">Les 3 étapes en 40 secondes.</figcaption>
            </figure>
          </div>
          <div className="ensuite"><strong>Il accepte ?</strong> MySite vous guide jusqu&apos;au bout :{ENSUITE.map(({ ico: Ico, t, d }) => <span key={t}><Ico aria-hidden />{t} <small>({d})</small></span>)}</div>
        </div>
      </section>

      <Captures />

      <section className="bloc" id="fonctionnalites" style={{ paddingTop: 0 }}>
        <div className="conteneur">
          <div className="tete"><h2>Et aussi</h2></div>
          <div className="aussi">
            {AUSSI.map(({ ico: Ico, coul, t, d }) => <article key={t} className="aussi-item"><span className={`pastille ${coul}`}><Ico aria-hidden /></span><div><h3>{t}</h3><p>{d}</p></div></article>)}
          </div>
        </div>
      </section>

      <section className="bloc" style={{ paddingTop: 0 }}>
        <div className="conteneur">
          <div className="tete"><h2>Pour qui ?</h2></div>
          <div className="grille">{POUR_QUI.map(({ t, d }) => <article key={t} className="carte"><h3>{t}</h3><p className="note" style={{ margin: 0, fontSize: "1rem" }}>{d}</p></article>)}</div>
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

      <Temoignages />

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
          <h2>Vos premières entreprises en 2 minutes</h2>
          <p>Créez votre compte gratuit, choisissez un métier et un département : la première recherche part toute seule.</p>
          <Link className="btn grand" href="/connexion?mode=inscription">Créer mon compte gratuit <ArrowRight aria-hidden /></Link>
        </div>
      </section>
      <div className="cta-mobile"><Link className="btn p bloc" href="/connexion?mode=inscription">Commencer gratuitement <ArrowRight aria-hidden /></Link></div>
    </>
  );
}
