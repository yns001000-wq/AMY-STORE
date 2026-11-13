import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Croissant, GraduationCap, Hammer, Map as IconeCarte, ReceiptText, Rocket, Scissors, ShieldCheck, Store, UtensilsCrossed, Wrench } from "lucide-react";
import { Tarifs } from "@/components/Tarifs";
import { Provenance } from "@/components/Provenance";
import { PLANS } from "@/lib/plans";

/** Page d'accueil : une idée par écran, de vrais écrans de l'application, un seul geste demandé (commencer gratuitement). */
const ETAPES = [
  { mot: "Trouvez.", d: "Choisissez un métier et un département. MySite vous réserve les commerces de votre zone, depuis le registre officiel des entreprises.", img: "/accueil/cockpit.webp", w: 640, h: 1382, cadre: "tel", couleur: "#6d4aff" },
  { mot: "Contactez.", d: "Pour chaque commerce, un premier message court et personnel est déjà rédigé. Vous relisez, vous envoyez.", img: "/accueil/message.webp", w: 760, h: 1298, cadre: "carte", couleur: "#ec4899" },
  { mot: "Montrez.", d: "En un clic, une maquette de site à son nom. Le commerçant voit son futur site, sur votre téléphone.", img: "/accueil/site.webp", w: 640, h: 1383, cadre: "tel", couleur: "#f97316" },
  { mot: "Encaissez.", d: "Devis, mise en ligne, facture : chaque étape est guidée. Vos prix restent les vôtres.", img: "/accueil/devis.webp", w: 760, h: 784, cadre: "carte", couleur: "#10b981" },
] as const;
const TUILES = [
  { ico: IconeCarte, t: "La carte", d: "Vos visites regroupées par quartier.", couleur: "#10b981" },
  { ico: GraduationCap, t: "L'Académie", d: "Apprendre à vendre, pas à pas. Deux modules offerts.", couleur: "#6d4aff" },
  { ico: Store, t: "Le Studio", d: "Textes, photos, couleurs. Sans une ligne de code.", couleur: "#0ea5c6" },
  { ico: Rocket, t: "En ligne en un clic", d: "nom-du-commerce.mysite-app.com, ou son propre domaine.", couleur: "#f97316" },
  { ico: ReceiptText, t: "Devis et factures", d: "Numérotés, avec les mentions usuelles.", couleur: "#ec4899" },
  { ico: ShieldCheck, t: "Dans les règles", d: "Registres publics, refus respectés, un commerce par abonné.", couleur: "#3b5bfd" },
];
const SECTEURS = [[UtensilsCrossed, "Restaurants"], [Croissant, "Boulangeries"], [Hammer, "Artisans"], [Scissors, "Coiffure, beauté"], [Wrench, "Services"]] as const;
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

const Cadre = ({ e, prio }: { e: (typeof ETAPES)[number]; prio?: boolean }) => (
  <div className={e.cadre === "tel" ? "pa-tel" : "pa-carte"}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={e.img} width={e.w} height={e.h} alt="" loading={prio ? "eager" : "lazy"} decoding="async" />
  </div>
);

export default function Accueil() {
  return (
    <div className="pa">
      <Provenance />

      <section className="pa-hero">
        <p className="pa-sur">Pour les créateurs de sites web</p>
        <h1>Vos clients sont<br /><span className="degrade-texte">au coin de la rue.</span></h1>
        <p className="pa-chapo">Trouvez les commerces de votre ville, montrez-leur leur futur site, encaissez. Tout depuis votre téléphone.</p>
        <div className="pa-actions">
          <Link className="btn p grand" href="/connexion?mode=inscription">Commencer gratuitement</Link>
          <a className="pa-lien" href="#video">Voir la vidéo <ChevronRight aria-hidden /></a>
        </div>
        <p className="pa-garanties"><span><Check aria-hidden />Gratuit, sans carte bancaire</span><span><Check aria-hidden />Prêt en 2 minutes</span></p>
        <div className="pa-hero-visuel">
          <Cadre e={ETAPES[0]} prio />
        </div>
        <p className="pa-legende">Écran réel de l&apos;application, avec des données d&apos;exemple.</p>
      </section>

      <section className="pa-secteurs" aria-label="Métiers disponibles">
        <ul>{SECTEURS.map(([Ico, t]) => <li key={t}><Ico aria-hidden />{t}</li>)}</ul>
      </section>

      <section className="pa-sombre" id="video">
        <h2>35 secondes.<br />Toute la méthode.</h2>
        <figure className="pa-video">
          <video autoPlay muted loop playsInline controls preload="metadata" poster="/video/mysite-methode.jpg" aria-label="Vidéo : comment fonctionne MySite">
            <source src="/video/mysite-methode.mp4" type="video/mp4" />
          </video>
        </figure>
        <p className="pa-legende">Écrans de démonstration · voix de synthèse · touchez la vidéo pour le son.</p>
      </section>

      {ETAPES.map((e, k) => (
        <section key={e.mot} className={`pa-etape${k % 2 ? " pa-gris" : ""}`} style={{ "--c": e.couleur } as React.CSSProperties}>
          <div className="pa-etape-texte">
            <p className="pa-num">{k + 1} / {ETAPES.length}</p>
            <h2>{e.mot}</h2>
            <p>{e.d}</p>
          </div>
          <div className="pa-etape-visuel"><Cadre e={e} /></div>
        </section>
      ))}

      <section className="pa-bloc">
        <h2>Et tout le reste.</h2>
        <div className="pa-tuiles">
          {TUILES.map(({ ico: Ico, t, d, couleur }) => (
            <article key={t} className="pa-tuile" style={{ "--c": couleur } as React.CSSProperties}><Ico aria-hidden /><h3>{t}</h3><p>{d}</p></article>
          ))}
        </div>
      </section>

      <section className="pa-bloc pa-gris pa-academie">
        <div>
          <h2>Jamais vendu de site&nbsp;?<br /><span className="degrade-texte">On vous apprend.</span></h2>
          <p>Des leçons de 5 minutes, en vidéo, avec un quiz et une mission dans l&apos;outil : se lancer en règle, construire son offre, le premier message, la visite, le devis.</p>
          <p className="pa-petit">Les modules Démarrer et Prospecter sont inclus dans l&apos;offre Gratuite.</p>
        </div>
        <div className="pa-tel pa-petit-tel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/accueil/academie.webp" width={640} height={1382} alt="" loading="lazy" decoding="async" />
        </div>
      </section>

      <section className="pa-bloc" id="tarifs">
        <h2>Commencez gratuitement.</h2>
        <p className="pa-sous">Passez à une offre payante seulement si l&apos;outil vous sert. Sans engagement, résiliable en ligne.</p>
        <Tarifs mode="inscription" />
        <p className="pa-petit pa-centre">Un exemple : si vous vendez un site 490&nbsp;€, l&apos;offre Pro à {PLANS.pro.prixMensuel}&nbsp;€ représente {Math.round((PLANS.pro.prixMensuel / 490) * 100)}&nbsp;% de cette seule vente. C&apos;est une simple division, pas une promesse de revenus.</p>
      </section>

      <section className="pa-bloc pa-gris" id="faq">
        <h2>Questions fréquentes.</h2>
        <div className="faq pa-faq">{FAQ.map(([q, r]) => <details key={q}><summary>{q}</summary><p>{r}</p></details>)}</div>
      </section>

      <section className="pa-final">
        <h2>Votre premier client<br />est peut-être en bas de chez vous.</h2>
        <Link className="btn grand pa-blanc" href="/connexion?mode=inscription">Créer mon compte gratuit <ArrowRight aria-hidden /></Link>
        <p>Sans carte bancaire · Résiliable en ligne</p>
      </section>

      <div className="cta-mobile"><Link className="btn p bloc" href="/connexion?mode=inscription">Commencer gratuitement <ArrowRight aria-hidden /></Link></div>
    </div>
  );
}
