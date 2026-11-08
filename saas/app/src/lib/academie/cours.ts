/**
 * Contenu de l'Académie MySite.
 * Règles éditoriales : aucune promesse de gain, aucune statistique invérifiable, les exemples chiffrés sont présentés comme des exemples,
 * et les points juridiques renvoient aux sources officielles (à vérifier : la réglementation évolue).
 */
import type { Lecon, Module, QuizQ } from "./types";

/** Mélange stable des réponses (même ordre à chaque affichage, mais la bonne réponse n'est pas toujours la première). */
export function melanger(q: QuizQ): QuizQ {
  let g = [...q.question].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7);
  const ordre = q.choix.map((_, i) => i);
  for (let i = ordre.length - 1; i > 0; i--) { g = (Math.imul(g, 1103515245) + 12345) >>> 0; const j = g % (i + 1); [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; }
  return { ...q, choix: ordre.map((i) => q.choix[i]), bonne: ordre.indexOf(q.bonne) };
}
const prep = (ls: Lecon[]): Lecon[] => ls.map((l) => ({ ...l, quiz: l.quiz.map(melanger), video: l.video.map((s) => (s.quiz ? { ...s, quiz: melanger(s.quiz) } : s)) }));

const demarrer: Lecon[] = [
  {
    id: "demarrer-statut", titre: "Se lancer en règle", minutes: 6,
    resume: "Statut, déclaration, compte bancaire et assurance : le minimum pour vendre des sites sereinement.",
    video: [
      { son: "whoosh", voix: "Bienvenue dans l'Académie MySite. Première étape : vendre en toute légalité.", visuel: { type: "titre", surtitre: "Module 1 · Démarrer", texte: "Se lancer en règle", sous: "Le minimum, sans paperasse inutile" } },
      { son: "pop", voix: "Pour facturer vos clients, il vous faut un statut. Le plus simple pour commencer, c'est la micro-entreprise.", visuel: { type: "points", titre: "Pourquoi la micro-entreprise", items: ["Création gratuite en ligne", "Comptabilité simplifiée", "Cotisations calculées sur ce que vous encaissez", "Pas de chiffre d'affaires : pas de cotisations"] } },
      { son: "pop", voix: "La déclaration se fait sur le guichet unique de l'INPI. Comptez une vingtaine de minutes.", visuel: { type: "etapes", titre: "Créer sa micro-entreprise", etapes: ["formalites.entreprises.gouv.fr", "Activité : création de sites", "Numéro SIRET reçu", "Compte Urssaf activé"] } },
      { son: "pop", voix: "Ouvrez un compte bancaire séparé pour votre activité : c'est obligatoire au-delà d'un certain chiffre d'affaires, et ça vous simplifie la vie dès le premier jour.", visuel: { type: "check", titre: "Les bons réflexes", items: ["Un compte dédié à l'activité", "Une assurance responsabilité civile professionnelle", "Un tableau des encaissements : MySite le fait pour vous"] } },
      { son: "cloche", voix: "Petit test avant de continuer.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Sur quoi sont calculées les cotisations d'un micro-entrepreneur ?", choix: ["Sur le chiffre d'affaires encaissé", "Sur un forfait fixe mensuel", "Sur le bénéfice après impôts"], bonne: 0, explication: "Exact : pas d'encaissement, pas de cotisations. C'est ce qui rend ce statut idéal pour démarrer." } },
      { son: "succes", voix: "Vous êtes prêt. Dans la leçon suivante, on construit une offre qui se vend.", visuel: { type: "titre", surtitre: "À retenir", texte: "Statut, compte, assurance", sous: "Et MySite tient vos factures en règle" } },
    ],
    contenu: [
      { titre: "Le statut", texte: "La micro-entreprise convient bien pour démarrer : création gratuite sur le guichet unique (formalites.entreprises.gouv.fr), cotisations proportionnelles au chiffre d'affaires encaissé, comptabilité allégée. La création de sites relève en général d'une activité libérale (BNC) ; le centre de formalités le confirme lors de la déclaration." },
      { titre: "Les obligations à connaître", liste: ["Déclarer son chiffre d'affaires à l'Urssaf (chaque mois ou chaque trimestre), même s'il est nul.", "Ouvrir un compte bancaire dédié : obligatoire dès que le chiffre d'affaires dépasse 10 000 € deux années civiles de suite, conseillé dès le début.", "Tenir un livre des recettes : la page Devis et factures vous donne le total encaissé.", "Respecter les plafonds de chiffre d'affaires et le seuil de franchise de TVA : vérifiez les montants en vigueur sur autoentrepreneur.urssaf.fr et impots.gouv.fr."] },
      { titre: "L'assurance", texte: "La responsabilité civile professionnelle n'est pas obligatoire pour cette activité, mais elle vous couvre si un client vous reproche une erreur (site indisponible, contenu litigieux). Comparez plusieurs devis." },
      { titre: "Les aides", texte: "Selon votre situation (demandeur d'emploi, jeune, etc.), des aides comme l'ACRE peuvent réduire vos cotisations la première année. Les conditions changent : renseignez-vous auprès de l'Urssaf ou de France Travail." },
    ],
    quiz: [
      { question: "Où créer sa micro-entreprise ?", choix: ["Sur le guichet unique formalites.entreprises.gouv.fr", "Auprès de sa banque", "Sur MySite"], bonne: 0, explication: "Le guichet unique de l'INPI centralise toutes les créations d'entreprise, gratuitement." },
      { question: "Un compte bancaire dédié est-il utile dès le départ ?", choix: ["Oui, il sépare clairement l'activité et le personnel", "Non, jamais", "Seulement pour les sociétés"], bonne: 0, explication: "Il devient obligatoire au-delà d'un seuil, et il simplifie tout dès le premier client." },
      { question: "Quand déclare-t-on son chiffre d'affaires à l'Urssaf ?", choix: ["Chaque mois ou chaque trimestre, même s'il est nul", "Une fois par an seulement", "Uniquement quand on dépasse 1 000 €"], bonne: 0, explication: "La déclaration est périodique et obligatoire, même à zéro." },
    ],
    actions: [{ lib: "Renseigner mon entreprise pour les factures", href: "/espace/factures/entreprise" }],
  },
  {
    id: "demarrer-offre", titre: "Construire une offre qui se vend", minutes: 5,
    resume: "Un prix de création clair, un abonnement mensuel, et une promesse simple : le client est visible et joignable.",
    video: [
      { son: "whoosh", voix: "Un commerçant n'achète pas un site. Il achète des clients qui l'appellent et qui le trouvent.", visuel: { type: "titre", surtitre: "Module 1 · Démarrer", texte: "Une offre qui se vend", sous: "Simple, claire, rassurante" } },
      { son: "pop", voix: "Votre offre tient en deux lignes : une création à prix fixe, puis un petit abonnement mensuel.", visuel: { type: "facture", titre: "Exemple d'offre", lignes: [["Création du site vitrine", "490 €"], ["Hébergement et petites modifications", "29 € / mois"]], total: "Prix d'exemple", mention: "Fixez vos propres prix" } },
      { son: "pop", voix: "Le prix fixe rassure. Le commerçant sait exactement ce qu'il paie, sans surprise.", visuel: { type: "comparaison", gauche: { titre: "Ce qui fait fuir", items: ["Devis flou", "Jargon technique", "Délais vagues"] }, droite: { titre: "Ce qui fait signer", items: ["Prix fixe annoncé", "Maquette déjà prête", "En ligne en quelques jours"] } } },
      { son: "pop", voix: "L'abonnement, lui, crée votre revenu récurrent. Chaque client ajoute un peu chaque mois, et ça s'additionne.", visuel: { type: "chiffre", valeur: "20 × 29 €", legende: "= 580 € par mois, chaque mois", note: "Exemple de calcul, pas une promesse" } },
      { son: "cloche", voix: "Vérifions.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Quel élément crée un revenu qui revient chaque mois ?", choix: ["L'abonnement d'hébergement et de modifications", "Le prix de création", "Les cartes de visite"], bonne: 0, explication: "Oui : la création paie votre travail, l'abonnement construit votre revenu stable." } },
      { son: "succes", voix: "Votre offre est prête. Passons à la prospection.", visuel: { type: "titre", surtitre: "À retenir", texte: "Prix fixe + abonnement", sous: "Et une maquette pour le prouver" } },
    ],
    contenu: [
      { titre: "La promesse", texte: "Parlez résultats concrets pour le commerçant : être trouvé sur Google et sur Maps, afficher ses horaires et sa carte, être appelé en un geste depuis un téléphone. Évitez le jargon (hébergement, responsive, SEO) au premier rendez-vous." },
      { titre: "Le prix", liste: ["Un prix de création fixe, annoncé tout de suite.", "Un abonnement mensuel simple (hébergement, mises à jour, petites modifications).", "Des options claires : nom de domaine, photos professionnelles, fiche Google.", "Les prix de MySite sont des exemples : fixez les vôtres selon votre région et votre temps."] },
      { titre: "Ce que vous ne promettez jamais", texte: "Pas de « première position sur Google », pas de « +50 % de clients » : vous ne maîtrisez pas ces résultats, et ce serait une pratique commerciale trompeuse. Promettez ce que vous livrez." },
    ],
    quiz: [
      { question: "Que faut-il éviter de promettre ?", choix: ["Une première position garantie sur Google", "Un site lisible sur téléphone", "Des horaires à jour"], bonne: 0, explication: "Personne ne peut garantir un classement : le promettre serait trompeur." },
      { question: "Pourquoi un prix fixe ?", choix: ["Il rassure et accélère la décision", "Il est obligatoire", "Il évite de faire un devis"], bonne: 0, explication: "Le commerçant sait ce qu'il paie : la décision est plus facile. Le devis reste conseillé." },
      { question: "Les prix proposés par MySite sont…", choix: ["Des exemples à adapter", "Des prix imposés", "Des prix minimum légaux"], bonne: 0, explication: "Vous êtes libre de vos prix." },
    ],
  },
];

const prospecter: Lecon[] = [
  {
    id: "prospecter-cibler", titre: "Choisir ses prospects et organiser ses tournées", minutes: 5,
    resume: "Les bons commerces, au bon moment, dans le bon ordre : la carte fait gagner des heures.",
    video: [
      { son: "whoosh", voix: "Prospecter, ce n'est pas contacter tout le monde. C'est contacter les bons, au bon moment.", visuel: { type: "titre", surtitre: "Module 2 · Prospecter", texte: "Cibler et organiser", sous: "Moins de kilomètres, plus de rendez-vous" } },
      { son: "pop", voix: "MySite vous réserve des commerces de votre zone, sans site, et vous êtes le seul à les recevoir.", visuel: { type: "check", titre: "Vos prospects MySite", items: ["Issus du registre officiel des entreprises", "Exclusifs : un seul utilisateur par entreprise", "Les entreprises opposées sont exclues"] } },
      { son: "pop", voix: "Ouvrez la carte. Les commerces proches se démarchent le même jour : regroupez-les par quartier.", visuel: { type: "etapes", titre: "Une tournée efficace", etapes: ["Carte des prospects", "Un quartier par demi-journée", "8 à 12 visites", "Notes dans chaque fiche"] } },
      { son: "pop", voix: "Le bon moment compte. Pour un restaurant, évitez les services : le milieu d'après-midi est souvent plus calme.", visuel: { type: "comparaison", gauche: { titre: "À éviter", items: ["11 h 30 – 14 h (service)", "Samedi soir", "Jour de marché"] }, droite: { titre: "Plutôt", items: ["14 h 30 – 17 h 30", "Matinée pour les artisans", "Jours calmes"] } } },
      { son: "cloche", voix: "Question rapide.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Quand passer voir un restaurant ?", choix: ["En dehors du service, l'après-midi", "En plein service du midi", "Le samedi soir"], bonne: 0, explication: "Un gérant en plein service ne vous écoutera pas : choisissez un moment calme." } },
      { son: "succes", voix: "Ouvrez la carte et préparez votre première tournée.", visuel: { type: "titre", surtitre: "À retenir", texte: "Bons prospects, bon moment", sous: "La carte organise vos journées" } },
    ],
    contenu: [
      { titre: "Qui cibler", liste: ["Les commerces sans site ou avec une page datée.", "Les métiers où le téléphone compte : restauration, beauté, artisans du bâtiment.", "Les entreprises récentes : elles construisent leur visibilité."] },
      { titre: "Organiser ses journées", texte: "Utilisez la carte pour regrouper vos visites par quartier, notez chaque échange dans la fiche, et fixez une prochaine action datée : le pipeline vous rappelle qui relancer." },
      { titre: "Respecter les refus", texte: "Si un commerçant ne souhaite pas être recontacté, passez-le à l'étape « Refus » : MySite bloque alors les messages pour lui. Une entreprise peut aussi s'opposer publiquement via la page « Retirer mon entreprise »." },
    ],
    quiz: [
      { question: "Un prospect MySite peut-il être démarché par un autre utilisateur en même temps ?", choix: ["Non, il vous est réservé", "Oui, par tous", "Oui, par trois utilisateurs"], bonne: 0, explication: "L'exclusivité évite qu'un commerçant soit sollicité par plusieurs personnes." },
      { question: "Que faire si un commerçant dit « ne me recontactez plus » ?", choix: ["Le passer à l'étape Refus", "Le relancer dans une semaine", "Changer de numéro pour l'appeler"], bonne: 0, explication: "Le refus doit être respecté immédiatement." },
      { question: "À quoi sert la carte ?", choix: ["Regrouper les visites par quartier", "Choisir ses prix", "Envoyer des e-mails"], bonne: 0, explication: "Moins de trajets, plus de visites dans la journée." },
    ],
    actions: [{ lib: "Ouvrir la carte", href: "/espace/carte" }],
  },
  {
    id: "prospecter-messages", titre: "Premier contact : SMS, e-mail, appel… et la loi", minutes: 6,
    resume: "Un message court, personnalisé, identifié, avec un moyen simple de refuser.",
    video: [
      { son: "whoosh", voix: "Le premier message ne vend pas un site. Il obtient une réponse.", visuel: { type: "titre", surtitre: "Module 2 · Prospecter", texte: "Le premier contact", sous: "Court, personnel, honnête" } },
      { son: "pop", voix: "Voici la structure qui fonctionne : qui vous êtes, pourquoi lui, et une proposition sans engagement.", visuel: { type: "sms", messages: [{ de: "moi", texte: "Bonjour, je crée des sites pour les commerces du quartier. J'ai préparé gratuitement une maquette pour votre pizzeria : je peux vous la montrer en 2 minutes ? Noa. STOP pour ne plus être contacté." }, { de: "lui", texte: "Bonjour, envoyez-moi ça" }] } },
      { son: "pop", voix: "Entre professionnels, la prospection par e-mail ou SMS est possible, à trois conditions.", visuel: { type: "check", titre: "Les règles de la prospection B2B", items: ["Le message concerne son activité professionnelle", "Vous vous identifiez clairement", "Il peut refuser simplement, et vous respectez ce refus"] } },
      { son: "pop", voix: "Pas de faux prétextes, pas de fausse urgence, pas de faux avis. Restez vrai : c'est aussi ce qui fait signer.", visuel: { type: "comparaison", gauche: { titre: "Interdit ou toxique", items: ["« Dernière place aujourd'hui »", "Se faire passer pour Google", "Envoyer en masse sans tri"] }, droite: { titre: "Efficace et légal", items: ["Une maquette réelle", "Un message par commerce", "Une relance, pas dix"] } } },
      { son: "cloche", voix: "À vous.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Que doit toujours contenir un message de prospection ?", choix: ["Votre identité et un moyen simple de refuser", "Une offre limitée dans le temps", "Le chiffre d'affaires du concurrent"], bonne: 0, explication: "L'identification et la possibilité de s'opposer sont des obligations." } },
      { son: "succes", voix: "L'IA de MySite rédige vos messages en respectant ces règles. Vous relisez, vous envoyez.", visuel: { type: "titre", surtitre: "À retenir", texte: "Identifié, pertinent, refus respecté", sous: "Rien n'est envoyé sans vous" } },
    ],
    contenu: [
      { titre: "La structure d'un bon message", liste: ["Qui vous êtes, en une phrase.", "Pourquoi lui : un détail réel (son quartier, son métier).", "Une proposition concrète et sans engagement : voir la maquette.", "La mention pour refuser (« STOP »)."] },
      { titre: "Ce que dit la loi (entre professionnels)", texte: "La CNIL admet la prospection par e-mail vers une adresse professionnelle sans accord préalable si le message est en rapport avec l'activité de la personne, si l'expéditeur est identifié et si le destinataire peut s'y opposer simplement. Les coordonnées d'un entrepreneur individuel sont des données personnelles : respectez les refus et ne conservez pas de données inutiles. Plus d'informations sur cnil.fr (prospection commerciale)." },
      { titre: "Relancer sans harceler", texte: "Une relance quelques jours plus tard est normale. Au-delà, changez de canal (visite) ou passez à autre chose. Notez tout dans le journal de la fiche." },
    ],
    quiz: [
      { question: "Un SMS de prospection à un commerçant doit…", choix: ["Identifier l'expéditeur et permettre de refuser", "Être envoyé à 22 h pour être lu", "Être identique pour 500 commerces"], bonne: 0, explication: "Identification et opposition simple : c'est la base légale et la base du respect." },
      { question: "Combien de relances par écrit ?", choix: ["Une, puis on change d'approche", "Une par jour", "Aucune limite"], bonne: 0, explication: "Une relance suffit ; ensuite, une visite ou on passe au suivant." },
      { question: "Un commerçant répond « STOP ». Que faire ?", choix: ["Ne plus le contacter et le passer en Refus", "Lui envoyer une dernière offre", "Lui écrire par e-mail à la place"], bonne: 0, explication: "Le refus vaut pour tous les canaux." },
    ],
  },
  {
    id: "prospecter-visite", titre: "La visite en personne", minutes: 5,
    resume: "Deux minutes, un téléphone avec sa maquette, une question ouverte : la visite reste l'arme la plus efficace.",
    video: [
      { son: "whoosh", voix: "Rien ne remplace une visite. Le commerçant voit qui vous êtes, et voit son futur site.", visuel: { type: "titre", surtitre: "Module 2 · Prospecter", texte: "La visite", sous: "Deux minutes qui comptent" } },
      { son: "pop", voix: "Entrez au bon moment, présentez-vous en une phrase, et sortez votre téléphone.", visuel: { type: "dialogue", lignes: [{ qui: "Vous", texte: "Bonjour, je suis Noa, je fais les sites des commerces du quartier. J'ai préparé le vôtre, je vous le montre ?" }, { qui: "Gérant", texte: "Euh… allez-y, rapidement." }] } },
      { son: "pop", voix: "Montrez la maquette sur le téléphone : son nom, sa carte, son bouton pour appeler. C'est là que tout se joue.", visuel: { type: "telephone", titre: "Pizza Bella", lignes: ["Pizzeria à Lyon 3e", "Ouvert · ferme à 22 h", "La carte", "Plan d'accès"], bouton: "Appeler" } },
      { son: "pop", voix: "Puis posez une question ouverte, et écoutez.", visuel: { type: "points", titre: "Questions qui ouvrent", items: ["Comment vos clients vous trouvent-ils aujourd'hui ?", "On vous appelle souvent pour les horaires ?", "Qu'est-ce que vous aimeriez qu'on voie en premier ?"] } },
      { son: "cloche", voix: "Question.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Quel est le cœur de la visite ?", choix: ["Montrer sa maquette sur un téléphone", "Expliquer l'hébergement", "Parler de vos tarifs pendant 10 minutes"], bonne: 0, explication: "La maquette rend l'offre concrète : il voit déjà son site." } },
      { son: "succes", voix: "Notez tout dans la fiche dès la sortie, et fixez la prochaine action.", visuel: { type: "titre", surtitre: "À retenir", texte: "Montrer, demander, écouter", sous: "Puis noter dans la fiche" } },
    ],
    contenu: [
      { titre: "Avant d'entrer", liste: ["Créez la maquette express (ou sur mesure) dans le Studio.", "Téléchargez-la ou ouvrez-la sur votre téléphone.", "Relisez la fiche : nom, métier, détails notés."] },
      { titre: "Pendant", texte: "Une phrase de présentation, la maquette, une question ouverte. Ne parlez pas technique. Si ce n'est pas le moment, demandez quand repasser et notez-le." },
      { titre: "Après", texte: "Notez dans le journal ce que vous avez appris (horaires, plats phares, objections). Ces notes servent à l'IA pour un site sur mesure encore plus juste." },
    ],
    quiz: [
      { question: "Le gérant est occupé. Que faire ?", choix: ["Demander quand repasser et le noter", "Insister", "Laisser la maquette sur le comptoir sans rien dire"], bonne: 0, explication: "Respecter son temps, c'est déjà vendre." },
      { question: "Où noter ce que vous apprenez ?", choix: ["Dans le journal de la fiche prospect", "Nulle part", "Sur un ticket de caisse"], bonne: 0, explication: "Les notes alimentent vos relances et l'IA du Studio." },
      { question: "Faut-il expliquer l'hébergement à la première visite ?", choix: ["Non, restez sur le concret", "Oui, en détail", "Oui, avec un schéma"], bonne: 0, explication: "Le concret d'abord : visibilité, appels, horaires." },
    ],
  },
];

const convaincre: Lecon[] = [
  {
    id: "convaincre-maquette", titre: "Montrer la maquette : le moment clé", minutes: 4,
    resume: "Une maquette fidèle, montrée sur téléphone, avec les détails qui parlent au gérant.",
    video: [
      { son: "whoosh", voix: "Votre meilleur argument, c'est sa maquette. Il voit son propre commerce, en beau.", visuel: { type: "titre", surtitre: "Module 3 · Convaincre", texte: "La maquette", sous: "Votre meilleur vendeur" } },
      { son: "pop", voix: "Le site sur mesure de MySite étudie d'abord le vrai type d'établissement, puis rédige la carte, les horaires et les textes.", visuel: { type: "etapes", titre: "Site sur mesure", etapes: ["Étude de l'établissement", "Vous confirmez", "Rédaction complète", "Retouches en une phrase"] } },
      { son: "pop", voix: "Ajoutez ce que vous avez vu sur place : plats, ambiance, terrasse. Plus c'est précis, plus il se reconnaît.", visuel: { type: "check", titre: "Les détails qui font mouche", items: ["Ses vrais plats et ses vrais prix", "Ses horaires exacts", "Une vraie photo de sa devanture", "Son quartier dans le titre"] } },
      { son: "pop", voix: "Soyez honnête : c'est une maquette. Les textes et photos d'exemple seront remplacés par les siens.", visuel: { type: "points", titre: "Transparence", items: ["Bandeau « maquette » visible", "Photos d'illustration signalées", "Rien n'est publié sans son accord"] } },
      { son: "cloche", voix: "Question.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Qu'est-ce qui rend une maquette convaincante ?", choix: ["Les vrais détails de son commerce", "Le plus d'animations possible", "Des avis clients inventés"], bonne: 0, explication: "Les vrais détails. Et jamais d'avis inventés : c'est interdit." } },
      { son: "succes", voix: "Préparez votre prochaine maquette dans le Studio.", visuel: { type: "titre", surtitre: "À retenir", texte: "Fidèle, précise, honnête", sous: "Il doit se reconnaître" } },
    ],
    contenu: [
      { titre: "Préparer", liste: ["Maquette express pour un premier passage rapide.", "Site sur mesure quand vous avez des informations : l'IA vérifie d'abord le type d'établissement.", "Retouches en langage courant : « ajoute une formule midi »."] },
      { titre: "Montrer", texte: "Sur votre téléphone, en mode portrait : c'est ainsi que ses clients le verront. Faites défiler lentement : nom, horaires, bouton d'appel, carte, plan d'accès." },
      { titre: "Rester honnête", texte: "Ne présentez jamais d'avis, de notes ou de chiffres inventés. La maquette indique ce qui reste à vérifier : servez-vous-en comme liste de questions." },
    ],
    quiz: [
      { question: "Que faire des éléments « à vérifier » de la maquette ?", choix: ["Les utiliser comme questions pour le gérant", "Les cacher", "Les inventer"], bonne: 0, explication: "C'est votre liste de questions pour finaliser." },
      { question: "Sur quel écran montrer la maquette ?", choix: ["Sur un téléphone", "Sur un ordinateur uniquement", "Imprimée en noir et blanc"], bonne: 0, explication: "Ses clients la verront surtout sur téléphone." },
      { question: "Peut-on ajouter de faux avis pour rassurer ?", choix: ["Non, jamais", "Oui, s'ils sont positifs", "Oui, sur la maquette seulement"], bonne: 0, explication: "Les faux avis sont une pratique commerciale trompeuse." },
    ],
    actions: [{ lib: "Ouvrir le Studio", href: "/espace/studio" }],
  },
  {
    id: "convaincre-objections", titre: "Répondre aux objections", minutes: 6,
    resume: "« Pas le temps », « trop cher », « j'ai Facebook » : écouter, reformuler, répondre simplement.",
    video: [
      { son: "whoosh", voix: "Une objection n'est pas un refus. C'est une question déguisée.", visuel: { type: "titre", surtitre: "Module 3 · Convaincre", texte: "Les objections", sous: "Écouter, reformuler, répondre" } },
      { son: "pop", voix: "J'ai déjà Facebook. Réponse : très bien, gardez-le ! Le site, lui, apparaît sur Google et vous appartient.", visuel: { type: "dialogue", lignes: [{ qui: "Gérant", texte: "J'ai déjà une page Facebook." }, { qui: "Vous", texte: "Gardez-la ! Le site complète : il apparaît quand on cherche « pizzeria Lyon 3 » et il est à vous." }] } },
      { son: "pop", voix: "C'est trop cher. Ramenez le prix à quelque chose de concret, sans inventer de chiffres.", visuel: { type: "dialogue", lignes: [{ qui: "Gérant", texte: "C'est trop cher." }, { qui: "Vous", texte: "Je comprends. Combien vous rapporte un client fidèle sur une année ? Le site sert surtout à ce qu'on vous trouve et qu'on vous appelle." }] } },
      { son: "pop", voix: "Je n'ai pas le temps. Justement : vous vous occupez de tout, il valide en dix minutes.", visuel: { type: "dialogue", lignes: [{ qui: "Gérant", texte: "Je n'ai pas le temps pour ça." }, { qui: "Vous", texte: "Justement, tout est déjà prêt. Vous relisez dix minutes, je m'occupe du reste." }] } },
      { son: "cloche", voix: "À vous de répondre.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "« J'ai déjà Facebook. » La meilleure réponse ?", choix: ["Gardez-le, le site le complète sur Google", "Facebook va disparaître", "Facebook est interdit pour les pros"], bonne: 0, explication: "On ne dénigre pas : on complète. Et on n'invente rien." } },
      { son: "succes", voix: "Notez les objections dans la fiche : l'IA en tiendra compte dans vos relances.", visuel: { type: "titre", surtitre: "À retenir", texte: "Comprendre avant de répondre", sous: "Et ne jamais inventer" } },
    ],
    contenu: [
      { titre: "La méthode", liste: ["Écouter jusqu'au bout.", "Reformuler : « si je comprends bien, c'est le prix qui vous fait hésiter ? »", "Répondre simplement, avec du concret.", "Proposer une petite étape : « je vous laisse la maquette, je repasse jeudi ? »"] },
      { titre: "Les grandes objections", liste: ["« J'ai Facebook » : gardez-le, le site complète et vous appartient.", "« Trop cher » : prix fixe, abonnement résiliable, comparez au coût d'un client perdu.", "« Pas le temps » : tout est prêt, dix minutes de relecture.", "« Mon neveu va le faire » : très bien, la maquette est à lui s'il veut s'en inspirer… et votre numéro aussi.", "« Je réfléchis » : proposez une date de rappel et notez-la."] },
      { titre: "Ce qu'on ne fait pas", texte: "Pas de dénigrement des concurrents, pas de chiffres inventés, pas de pression artificielle. Un « non » respecté laisse la porte ouverte pour plus tard." },
    ],
    quiz: [
      { question: "Premier réflexe face à une objection ?", choix: ["Écouter et reformuler", "Baisser le prix tout de suite", "Insister plus fort"], bonne: 0, explication: "Comprendre la vraie question avant de répondre." },
      { question: "« Je réfléchis. » Que faire ?", choix: ["Proposer une date de rappel et la noter", "Partir sans rien dire", "Rappeler le soir même"], bonne: 0, explication: "Une date précise dans la fiche, et le pipeline vous la rappelle." },
      { question: "Peut-on dire « vos concurrents ont tous un site » ?", choix: ["Seulement si c'est vrai et vérifié", "Oui, toujours", "Oui, ça crée l'urgence"], bonne: 0, explication: "Une affirmation invérifiable est trompeuse." },
    ],
  },
];

const conclure: Lecon[] = [
  {
    id: "conclure-devis", titre: "Le devis qui se signe", minutes: 5,
    resume: "Un devis clair, émis en deux minutes, avec toutes les mentions obligatoires.",
    video: [
      { son: "whoosh", voix: "Il a dit oui. Maintenant, on formalise, proprement.", visuel: { type: "titre", surtitre: "Module 4 · Conclure", texte: "Le devis", sous: "Clair, complet, signé" } },
      { son: "pop", voix: "Depuis la fiche du prospect, créez le devis : ses coordonnées sont déjà remplies.", visuel: { type: "facture", titre: "Devis D-2026-0001", lignes: [["Création du site vitrine", "490 €"], ["Hébergement et modifications × 12", "348 €"]], total: "838 €", mention: "TVA non applicable, art. 293 B du CGI" } },
      { son: "pop", voix: "MySite ajoute les mentions obligatoires, la durée de validité et la case Bon pour accord.", visuel: { type: "check", titre: "Ajouté automatiquement", items: ["Numéro unique et date", "Votre identité et votre SIRET", "Mention de TVA", "Validité et « Bon pour accord »"] } },
      { son: "pop", voix: "Signé chez lui ? Cochez la case dédiée : MySite ajoute le délai de rétractation et le formulaire obligatoires.", visuel: { type: "points", titre: "Vente chez le commerçant", items: ["Rétractation possible pendant 14 jours", "Aucun paiement avant 7 jours", "Formulaire de rétractation joint"] } },
      { son: "cloche", voix: "Question.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Un devis émis peut-il être modifié ?", choix: ["Non, on en émet un nouveau", "Oui, à tout moment", "Oui, mais seulement le prix"], bonne: 0, explication: "Un document émis est figé : c'est ce qui le rend fiable." } },
      { son: "succes", voix: "Imprimez-le ou envoyez-le en PDF, puis marquez-le accepté quand il revient signé.", visuel: { type: "titre", surtitre: "À retenir", texte: "Émettre, signer, accepter", sous: "Le pipeline avance tout seul" } },
    ],
    contenu: [
      { titre: "Le devis dans MySite", liste: ["Depuis la fiche : coordonnées du client préremplies.", "Lignes types à adapter : création, abonnement, options.", "Émission : numéro définitif, mentions légales, PDF.", "Accepté : le prospect passe en « Gagné », la facture se crée en un clic."] },
      { titre: "Les mentions", texte: "Votre identité (nom, mention EI le cas échéant, SIRET, adresse), celle du client, la date, la durée de validité, le détail des prestations et des prix, la mention de TVA. MySite les ajoute ; à vous de vérifier votre identité dans « Mon entreprise »." },
    ],
    quiz: [
      { question: "Où renseigner votre SIRET pour les devis ?", choix: ["Dans « Mon entreprise »", "Dans chaque ligne", "Nulle part"], bonne: 0, explication: "Une fois pour toutes : il est copié sur chaque document émis." },
      { question: "Le devis est accepté. Ensuite ?", choix: ["Créer la facture en un clic", "Tout ressaisir", "Attendre la fin de l'année"], bonne: 0, explication: "La facture reprend les lignes du devis." },
      { question: "Que garantit la numérotation de MySite ?", choix: ["Une suite continue, sans trou", "Des numéros au hasard", "Un numéro choisi à la main"], bonne: 0, explication: "C'est une obligation pour les factures." },
    ],
    actions: [{ lib: "Devis et factures", href: "/espace/factures" }],
  },
  {
    id: "conclure-acompte", titre: "Acompte, signature et vente chez le client", minutes: 6,
    resume: "Les règles protectrices quand vous signez chez un petit commerçant, et comment demander un acompte correctement.",
    video: [
      { son: "whoosh", voix: "Point juridique important : la vente chez le commerçant.", visuel: { type: "titre", surtitre: "Module 4 · Conclure", texte: "Signer chez le client", sous: "Les règles à connaître" } },
      { son: "pop", voix: "Si vous signez dans sa boutique avec un professionnel de cinq salariés au plus, et que le site n'est pas son métier, il est protégé comme un consommateur.", visuel: { type: "check", titre: "Article L221-3 du code de la consommation", items: ["Contrat signé hors de vos locaux", "Client : 5 salariés au plus", "Le site n'est pas son activité principale"] } },
      { son: "pop", voix: "Conséquence : il peut se rétracter pendant quatorze jours, et vous ne pouvez rien encaisser pendant les sept premiers jours.", visuel: { type: "etapes", titre: "Le calendrier", etapes: ["Jour 0 : signature + formulaire", "Jours 1 à 7 : aucun paiement", "Jour 14 : fin de rétractation", "Acompte et lancement"] } },
      { son: "pop", voix: "S'il veut démarrer plus vite, il doit le demander expressément, par écrit. Il paiera alors le travail déjà fait s'il se rétracte.", visuel: { type: "points", titre: "Démarrer avant 14 jours", items: ["Demande écrite et expresse du client", "Paiement proportionnel en cas de rétractation", "Gardez une trace (e-mail, SMS)"] } },
      { son: "cloche", voix: "Question.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Signé chez un restaurateur de 3 salariés : quand encaisser l'acompte ?", choix: ["Pas avant 7 jours après la signature", "Immédiatement en liquide", "Avant de signer"], bonne: 0, explication: "Aucun paiement ne peut être reçu avant 7 jours (art. L221-10)." } },
      { son: "succes", voix: "Dans MySite, cochez « Signé chez le commerçant » : tout est ajouté au devis.", visuel: { type: "titre", surtitre: "À retenir", texte: "14 jours, 7 jours, un formulaire", sous: "Et une trace écrite" } },
    ],
    contenu: [
      { titre: "Quand ces règles s'appliquent", texte: "L'article L221-3 du code de la consommation étend les règles des contrats conclus hors établissement aux professionnels qui emploient 5 salariés au plus, lorsque l'objet du contrat n'entre pas dans le champ de leur activité principale. Un site internet vendu à un restaurant ou à un artisan est généralement dans ce cas. En cas de doute, appliquez ces règles : elles protègent aussi votre vente." },
      { titre: "Ce qu'il faut faire", liste: ["Remettre les informations précontractuelles et le formulaire de rétractation (le devis MySite les ajoute quand vous cochez la case).", "Ne recevoir aucun paiement avant 7 jours (art. L221-10).", "Laisser 14 jours de rétractation (art. L221-18) ; démarrer avant seulement sur demande expresse du client.", "Garder une trace écrite de tout."] },
      { titre: "Acompte ou arrhes ?", texte: "Un acompte engage les deux parties ; des arrhes permettent de se dédire en les perdant. Pour un site, on parle en général d'acompte (souvent 30 à 50 %), versé après les délais ci-dessus. Établissez une facture d'acompte." },
      { titre: "Signer à distance", texte: "Un devis envoyé et accepté par e-mail obéit à d'autres règles. Quelle que soit la méthode, soyez transparent sur le prix, le contenu et les délais. Pour un cas précis, renseignez-vous auprès d'un juriste." },
    ],
    quiz: [
      { question: "Combien de temps dure le délai de rétractation dans ce cas ?", choix: ["14 jours", "7 jours", "Aucun"], bonne: 0, explication: "14 jours à compter de la conclusion du contrat pour une prestation de services." },
      { question: "Le client veut démarrer tout de suite. Que faire ?", choix: ["Obtenir sa demande expresse par écrit", "Démarrer sans rien dire", "Refuser par principe"], bonne: 0, explication: "Avec sa demande expresse, vous pouvez commencer ; il paiera le travail fait s'il se rétracte." },
      { question: "Où trouver le formulaire de rétractation ?", choix: ["Sur le devis MySite, case « Signé chez le commerçant »", "Il n'existe pas", "Chez Google"], bonne: 0, explication: "Le modèle officiel est ajouté au devis." },
    ],
  },
];

const livrer: Lecon[] = [
  {
    id: "livrer-domaine", titre: "Nom de domaine : le client propriétaire", minutes: 6,
    resume: "Choisir le nom, le faire acheter au nom du client, et garder un accès pour le brancher.",
    video: [
      { son: "whoosh", voix: "Le nom de domaine, c'est l'adresse du site. Règle d'or : il appartient au client.", visuel: { type: "titre", surtitre: "Module 5 · Livrer", texte: "Le nom de domaine", sous: "Au nom du client, toujours" } },
      { son: "pop", voix: "Choisissez un nom court, facile à dire au téléphone, avec le nom du commerce, et parfois la ville.", visuel: { type: "points", titre: "Un bon nom", items: ["pizzabella.fr", "pizzabella-lyon.fr", "Court, sans accent, facile à épeler", "Extension .fr : rassurante en France"] } },
      { son: "pop", voix: "Le client l'achète chez un registraire, par exemple OVHcloud, Gandi, Infomaniak ou IONOS, à son nom et avec sa carte. Comptez quelques euros à une quinzaine d'euros par an.", visuel: { type: "etapes", titre: "L'achat", etapes: ["Vérifier la disponibilité", "Compte au nom du client", "Paiement par le client", "Vous recevez un accès délégué"] } },
      { son: "pop", voix: "Pourquoi à son nom ? Parce que s'il change de prestataire un jour, il garde son adresse. C'est honnête, et c'est un argument de vente.", visuel: { type: "comparaison", gauche: { titre: "À éviter", items: ["Domaine à votre nom", "Client otage de son prestataire"] }, droite: { titre: "Bonne pratique", items: ["Domaine au nom du client", "Vous avez un accès technique", "Confiance totale"] } } },
      { son: "cloche", voix: "Question.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Au nom de qui enregistrer le domaine ?", choix: ["Au nom du client", "Au vôtre", "Au nom de MySite"], bonne: 0, explication: "Le client reste propriétaire de son adresse, quoi qu'il arrive." } },
      { son: "succes", voix: "L'assistant de livraison vérifie pour vous si le nom est libre.", visuel: { type: "titre", surtitre: "À retenir", texte: "Court, en .fr, au nom du client", sous: "Vous gardez un accès technique" } },
    ],
    contenu: [
      { titre: "Choisir", liste: ["Le nom du commerce, sans accent ni caractère spécial.", "Ajouter la ville si le nom est pris ou trop générique.", "Préférer .fr en France (.be en Belgique, .ch en Suisse), .com en complément."] },
      { titre: "Acheter", texte: "Le client crée un compte chez un registraire (OVHcloud, Gandi, Infomaniak, IONOS…) et achète le domaine à son nom. Vous pouvez l'accompagner à côté de lui, ou lui envoyer un lien. Demandez-lui ensuite un accès à la zone DNS (ou de saisir les réglages que MySite indique)." },
      { titre: "Brancher", texte: "Dans le Studio, onglet Publier : saisissez le domaine, MySite affiche les réglages DNS à copier et vérifie quand ils sont actifs. La propagation prend de quelques minutes à 48 heures." },
    ],
    quiz: [
      { question: "Quelle extension privilégier pour un commerce en France ?", choix: [".fr", ".xyz", ".io"], bonne: 0, explication: ".fr rassure la clientèle locale." },
      { question: "Combien de temps pour qu'un réglage DNS soit actif ?", choix: ["De quelques minutes à 48 heures", "Une semaine", "Instantané, toujours"], bonne: 0, explication: "Le temps de propagation varie ; MySite vérifie pour vous." },
      { question: "Qui paie le nom de domaine ?", choix: ["Le client, à son nom", "Vous, à votre nom", "Personne"], bonne: 0, explication: "Ou vous l'incluez dans votre prix, mais il reste à son nom." },
    ],
    actions: [{ lib: "Assistant de livraison (depuis une fiche prospect)", href: "/espace/pipeline" }],
  },
  {
    id: "livrer-mise-en-ligne", titre: "Mise en ligne et branchement du domaine", minutes: 5,
    resume: "Un clic pour publier, des mentions légales complètes, puis le domaine du client.",
    video: [
      { son: "whoosh", voix: "Le gérant a validé. On met en ligne.", visuel: { type: "titre", surtitre: "Module 5 · Livrer", texte: "Mettre en ligne", sous: "Un clic, pour de vrai" } },
      { son: "pop", voix: "Dans le Studio, onglet Publier : choisissez l'adresse, complétez les mentions légales, et cliquez.", visuel: { type: "etapes", titre: "Publier", etapes: ["Adresse du site", "Mentions légales", "Validation du gérant", "En ligne"] } },
      { son: "pop", voix: "Les mentions légales sont obligatoires : qui édite le site, qui l'héberge, comment le contacter.", visuel: { type: "check", titre: "Mentions légales", items: ["Éditeur : le commerce, son adresse, son SIRET", "Directeur de la publication : le gérant", "Hébergeur", "Confidentialité : aucun cookie"] } },
      { son: "pop", voix: "Puis branchez son domaine : copiez ces deux lignes dans sa zone DNS.", visuel: { type: "dns", domaine: "pizzabella.fr", lignes: [{ type: "A", nom: "@", valeur: "76.76.21.21" }, { type: "CNAME", nom: "www", valeur: "cname.vercel-dns.com" }] } },
      { son: "cloche", voix: "Question.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Qui est le directeur de la publication du site d'une pizzeria ?", choix: ["En général le gérant de la pizzeria", "Vous", "L'hébergeur"], bonne: 0, explication: "C'est l'éditeur du site, donc le commerce, qui en est responsable." } },
      { son: "succes", voix: "Le site est en ligne. MySite vérifie le domaine et vous dit quand il est actif.", visuel: { type: "titre", surtitre: "À retenir", texte: "Publier, mentions, domaine", sous: "Et vérifier que tout est vert" } },
    ],
    contenu: [
      { titre: "Publier", liste: ["Le gérant valide les textes, prix, horaires et photos.", "Choisissez l'adresse MySite (ex. pizza-bella-lyon).", "Complétez les mentions légales : elles sont ajoutées en bas du site.", "Cliquez sur « Mettre en ligne ». Pour modifier ensuite : Studio, puis « Mettre à jour »."] },
      { titre: "Le domaine", texte: "Saisissez le domaine du client dans l'onglet Publier. Copiez les réglages affichés dans sa zone DNS (enregistrement A pour le domaine nu, CNAME pour www). Le bouton « Vérifier le domaine » vous dit quand c'est actif ; le certificat HTTPS est automatique." },
      { titre: "Si l'abonnement s'arrête", texte: "Les sites en ligne sont hébergés tant que votre abonnement MySite est actif (15 jours de grâce ensuite). Vous pouvez toujours télécharger la version finale pour l'héberger ailleurs : prévenez-en vos clients." },
    ],
    quiz: [
      { question: "Où ajouter les mentions légales ?", choix: ["Dans l'onglet Publier du Studio", "Dans un e-mail", "Elles sont facultatives"], bonne: 0, explication: "Elles sont obligatoires et ajoutées automatiquement en bas du site." },
      { question: "Le site a été modifié dans le Studio. Est-il à jour en ligne ?", choix: ["Après « Mettre à jour le site en ligne »", "Oui, instantanément", "Jamais"], bonne: 0, explication: "Vous gardez la main : rien ne change en ligne sans votre clic." },
      { question: "Quel enregistrement DNS pour www ?", choix: ["CNAME vers cname.vercel-dns.com", "MX", "TXT"], bonne: 0, explication: "Le CNAME fait pointer www vers l'hébergement." },
    ],
    actions: [{ lib: "Ouvrir le Studio", href: "/espace/studio" }],
  },
  {
    id: "livrer-google", titre: "La fiche Google de l'établissement", minutes: 5,
    resume: "La fiche Google Business Profile, reliée au site : souvent le premier contact des clients.",
    video: [
      { son: "whoosh", voix: "Beaucoup de clients découvrent un commerce par sa fiche Google, sur Maps. Elle doit pointer vers le nouveau site.", visuel: { type: "titre", surtitre: "Module 5 · Livrer", texte: "La fiche Google", sous: "Gratuite et essentielle" } },
      { son: "pop", voix: "La fiche est gratuite. Elle se crée ou se revendique sur business.google.com, par le gérant ou avec lui.", visuel: { type: "etapes", titre: "La fiche en 4 étapes", etapes: ["business.google.com", "Revendiquer ou créer", "Vérification par Google", "Horaires, photos, site"] } },
      { son: "pop", voix: "Ajoutez l'adresse du site, les horaires identiques à ceux du site, et de vraies photos.", visuel: { type: "check", titre: "Une fiche cohérente", items: ["Lien vers le site", "Mêmes horaires partout", "Catégorie exacte", "Photos réelles"] } },
      { son: "pop", voix: "La vérification dépend de Google : vidéo, appel ou courrier. Prévenez le gérant.", visuel: { type: "points", titre: "Vérification", items: ["Méthode choisie par Google", "Le gérant doit être disponible", "Quelques jours parfois"] } },
      { son: "cloche", voix: "Question.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Les horaires de la fiche Google doivent être…", choix: ["Identiques à ceux du site", "Plus larges pour attirer", "Laissés vides"], bonne: 0, explication: "Des informations cohérentes rassurent les clients et Google." } },
      { son: "succes", voix: "Proposez la fiche Google comme option : c'est un vrai service rendu.", visuel: { type: "titre", surtitre: "À retenir", texte: "Fiche Google + site", sous: "Cohérents et à jour" } },
    ],
    contenu: [
      { titre: "Pourquoi", texte: "Quand on cherche un commerce près de chez soi, la fiche Google (Maps) apparaît souvent avant les sites. Reliée au site, avec des horaires à jour, elle donne une image sérieuse." },
      { titre: "Comment", liste: ["Le gérant se connecte avec son compte Google sur business.google.com.", "Il crée ou revendique la fiche de son établissement.", "Google demande une vérification (vidéo, appel ou courrier selon les cas).", "Ajoutez le lien du site, les horaires, la catégorie et de vraies photos.", "Vous pouvez être ajouté comme gestionnaire, sans être propriétaire."] },
      { titre: "À ne jamais faire", texte: "Créer de faux avis, en acheter, ou en échanger contre une réduction : c'est interdit par la loi et par les règles de Google." },
    ],
    quiz: [
      { question: "Qui doit être propriétaire de la fiche Google ?", choix: ["Le gérant du commerce", "Vous", "MySite"], bonne: 0, explication: "Vous pouvez être gestionnaire, le gérant reste propriétaire." },
      { question: "La fiche Google est-elle payante ?", choix: ["Non, elle est gratuite", "Oui, 30 € par mois", "Oui, à l'avis"], bonne: 0, explication: "Elle est gratuite ; votre accompagnement peut être facturé." },
      { question: "Peut-on offrir une réduction contre un avis 5 étoiles ?", choix: ["Non", "Oui", "Oui, si c'est petit"], bonne: 0, explication: "Les avis incités ou faux sont interdits." },
    ],
  },
];

const fideliser: Lecon[] = [
  {
    id: "fideliser-facture", titre: "Facturer et se faire payer", minutes: 5,
    resume: "Une facture conforme en un clic depuis le devis, des relances polies, des encaissements suivis.",
    video: [
      { son: "whoosh", voix: "Le site est en ligne. Il est temps d'être payé.", visuel: { type: "titre", surtitre: "Module 6 · Encaisser", texte: "Facturer", sous: "Conforme, sans tableur" } },
      { son: "pop", voix: "Depuis le devis accepté, créez la facture. Les lignes sont reprises, le numéro est attribué à l'émission.", visuel: { type: "facture", titre: "Facture F-2026-0001", lignes: [["Création du site vitrine", "490 €"]], total: "490 €", mention: "Paiement à 30 jours" } },
      { son: "pop", voix: "Une facture émise ne se modifie plus. Une erreur ? On l'annule par un avoir, et on en émet une nouvelle.", visuel: { type: "etapes", titre: "Corriger une facture", etapes: ["Facture émise", "Avoir du même montant", "Nouvelle facture correcte"] } },
      { son: "pop", voix: "Marquez la facture payée dès réception : MySite calcule votre chiffre d'affaires encaissé à déclarer.", visuel: { type: "chiffre", valeur: "Encaissé", legende: "Ce mois-ci, cette année, en attente", note: "Calculé à partir de vos factures payées" } },
      { son: "cloche", voix: "Question.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Une facture émise contient une erreur. Que faire ?", choix: ["L'annuler par un avoir et en émettre une nouvelle", "La modifier", "La supprimer"], bonne: 0, explication: "Une facture émise ne se modifie ni ne se supprime : l'avoir corrige." } },
      { son: "succes", voix: "Conservez vos factures dix ans : elles restent dans MySite.", visuel: { type: "titre", surtitre: "À retenir", texte: "Émettre, encaisser, déclarer", sous: "Corriger par un avoir" } },
    ],
    contenu: [
      { titre: "Les règles", liste: ["Numérotation continue, sans trou (MySite l'impose).", "Mentions obligatoires : identités, date, détail, prix, TVA, échéance, pénalités de retard et indemnité de 40 € entre professionnels.", "Délai de paiement : au plus 60 jours à compter de la facture (ou 45 jours fin de mois) entre professionnels.", "Conservation : 10 ans."] },
      { titre: "Se faire payer", texte: "Indiquez votre IBAN sur la facture, rappelez l'échéance poliment par SMS la veille, puis relancez par écrit si besoin. Notez chaque relance dans la fiche." },
      { titre: "Facturation électronique", texte: "La réforme impose progressivement la réception puis l'émission des factures électroniques entre entreprises, via des plateformes agréées. Vérifiez les échéances qui vous concernent sur impots.gouv.fr." },
    ],
    quiz: [
      { question: "Combien de temps conserver ses factures ?", choix: ["10 ans", "1 an", "Jusqu'au paiement"], bonne: 0, explication: "Obligation de conservation de 10 ans." },
      { question: "Que calcule MySite pour vos déclarations ?", choix: ["Le chiffre d'affaires encaissé", "Votre impôt exact", "Vos cotisations futures"], bonne: 0, explication: "Le micro-entrepreneur déclare ce qu'il encaisse." },
      { question: "Peut-on supprimer une facture émise ?", choix: ["Non, on l'annule par un avoir", "Oui", "Oui, la première semaine"], bonne: 0, explication: "La suite des numéros doit rester continue." },
    ],
    actions: [{ lib: "Devis et factures", href: "/espace/factures" }],
  },
  {
    id: "fideliser-recurrent", titre: "Le revenu récurrent : maintenance et évolutions", minutes: 5,
    resume: "L'abonnement mensuel transforme chaque vente en revenu stable. Encore faut-il rendre un vrai service.",
    video: [
      { son: "whoosh", voix: "Une vente, c'est bien. Un client qui reste, c'est mieux.", visuel: { type: "titre", surtitre: "Module 6 · Fidéliser", texte: "Le récurrent", sous: "Un service réel chaque mois" } },
      { son: "pop", voix: "Que contient l'abonnement ? Hébergement, mises à jour, et les petites modifications : un plat, un horaire, une photo.", visuel: { type: "check", titre: "L'abonnement", items: ["Hébergement du site", "Horaires et carte à jour", "Petites modifications rapides", "Un interlocuteur joignable"] } },
      { son: "pop", voix: "Avec les retouches en langage courant du Studio, une modification prend deux minutes. Répondez vite : c'est ce qui fidélise.", visuel: { type: "sms", messages: [{ de: "lui", texte: "On ferme le lundi maintenant, vous pouvez changer ?" }, { de: "moi", texte: "C'est fait, le site est à jour 👍" }] } },
      { son: "pop", voix: "Proposez des évolutions utiles : menu du jour, page événement, photos professionnelles.", visuel: { type: "points", titre: "Évolutions à proposer", items: ["Carte de saison", "Événements et fermetures", "Photos professionnelles", "Traduction anglaise"] } },
      { son: "cloche", voix: "Question.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Qu'est-ce qui fidélise le plus un client ?", choix: ["La rapidité des petites modifications", "Un contrat très long", "Des frais de résiliation élevés"], bonne: 0, explication: "Un service rapide et simple. Pas des contraintes." } },
      { son: "succes", voix: "Un client content en parle autour de lui. C'est la leçon suivante.", visuel: { type: "titre", surtitre: "À retenir", texte: "Service rapide = client fidèle", sous: "Le revenu suit" } },
    ],
    contenu: [
      { titre: "Une offre honnête", liste: ["Contenu clair de l'abonnement (ce qui est inclus, ce qui ne l'est pas).", "Résiliation simple, préavis raisonnable.", "Délai de réponse annoncé et tenu."] },
      { titre: "Faire grandir le panier", texte: "Les évolutions (photos, pages saisonnières, traduction) se facturent à part, avec un devis. Proposez-les quand elles servent vraiment le commerce." },
    ],
    quiz: [
      { question: "Une bonne clause de résiliation est…", choix: ["Simple et prévisible", "Cachée", "Très coûteuse"], bonne: 0, explication: "La transparence rassure et évite les litiges." },
      { question: "Le client demande un nouvel horaire. Délai idéal ?", choix: ["Dans la journée", "Le mois prochain", "Jamais"], bonne: 0, explication: "La rapidité est votre meilleure publicité." },
      { question: "Une traduction anglaise se facture…", choix: ["À part, sur devis", "Jamais", "En cachette"], bonne: 0, explication: "Les évolutions importantes font l'objet d'un devis." },
    ],
  },
  {
    id: "fideliser-avis", titre: "Avis, recommandations et parrainage", minutes: 4,
    resume: "Demander un vrai avis, au bon moment, et faire jouer le bouche-à-oreille entre commerçants.",
    video: [
      { son: "whoosh", voix: "Vos meilleurs vendeurs, ce sont vos clients satisfaits.", visuel: { type: "titre", surtitre: "Module 6 · Fidéliser", texte: "Avis et recommandations", sous: "Le bouche-à-oreille, honnêtement" } },
      { son: "pop", voix: "Au moment où le site est en ligne et qu'il est content, demandez simplement un avis sur votre propre fiche Google.", visuel: { type: "sms", messages: [{ de: "moi", texte: "Votre site est en ligne ! Si vous êtes satisfait, un petit avis sur ma fiche Google m'aiderait beaucoup. Merci 🙏" }] } },
      { son: "pop", voix: "Ensuite, demandez s'il connaît un commerçant qui aurait besoin d'un site. Les commerçants se parlent.", visuel: { type: "dialogue", lignes: [{ qui: "Vous", texte: "Vous connaissez un commerçant du quartier qui n'a pas encore de site ?" }, { qui: "Gérant", texte: "Le boulanger d'à côté, peut-être !" }] } },
      { son: "pop", voix: "Jamais d'avis achetés, inventés ou échangés contre une remise. C'est interdit.", visuel: { type: "comparaison", gauche: { titre: "Interdit", items: ["Faux avis", "Avis contre remise", "Avis écrits à sa place"] }, droite: { titre: "Bien", items: ["Demander simplement", "Au bon moment", "Remercier"] } } },
      { son: "cloche", voix: "Question.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Quand demander un avis ?", choix: ["Quand le client est satisfait du résultat", "Avant de commencer", "Jamais"], bonne: 0, explication: "Au moment de la satisfaction, simplement, sans contrepartie." } },
      { son: "succes", voix: "Ajoutez chaque recommandation comme prospect dans MySite.", visuel: { type: "titre", surtitre: "À retenir", texte: "Demander, remercier, recommencer", sous: "Sans jamais tricher" } },
    ],
    contenu: [
      { titre: "Les avis", texte: "Demandez un avis sur votre propre fiche Google à vos clients satisfaits, sans contrepartie. Les faux avis et les avis incités sont des pratiques commerciales trompeuses et contreviennent aux règles de Google." },
      { titre: "La recommandation", liste: ["Demandez à chaque client s'il connaît un commerçant intéressé.", "Un client qui recommande mérite un vrai merci.", "Un parrainage (réduction pour le client qui recommande) est possible s'il est transparent et ne porte pas sur des avis."] },
    ],
    quiz: [
      { question: "Un parrainage contre une recommandation est…", choix: ["Possible s'il est transparent", "Interdit", "Obligatoire"], bonne: 0, explication: "Récompenser une recommandation, oui ; acheter un avis, non." },
      { question: "Écrire l'avis à la place du client ?", choix: ["Non, jamais", "Oui, s'il est d'accord", "Oui, c'est plus rapide"], bonne: 0, explication: "Un avis doit refléter l'expérience réelle de son auteur." },
      { question: "Que faire d'une recommandation ?", choix: ["L'ajouter comme prospect", "L'oublier", "La revendre"], bonne: 0, explication: "C'est un prospect chaud : notez-le." },
    ],
  },
];

const echelle: Lecon[] = [
  {
    id: "echelle-routine", titre: "Une routine hebdomadaire réaliste", minutes: 5,
    resume: "Des blocs fixes chaque semaine : prospection, rendez-vous, production, suivi. La régularité fait le résultat.",
    video: [
      { son: "whoosh", voix: "Le secret n'est pas de travailler plus. C'est de travailler régulièrement.", visuel: { type: "titre", surtitre: "Module 7 · Passer à l'échelle", texte: "La routine", sous: "Chaque semaine, les mêmes blocs" } },
      { son: "pop", voix: "Voici une semaine type. Adaptez-la à votre temps disponible.", visuel: { type: "etapes", titre: "Semaine type", etapes: ["Lundi : nouveaux prospects", "Mardi–mercredi : tournées", "Jeudi : maquettes et devis", "Vendredi : relances et suivi"] } },
      { son: "pop", voix: "Faites le calcul de votre objectif. Ce sont des exemples, pas des promesses : vos chiffres dépendront de vous et de votre zone.", visuel: { type: "chiffre", valeur: "2 sites × 490 €", legende: "+ 10 abonnements × 29 € = 1 270 € ce mois-là", note: "Exemple de calcul à adapter" } },
      { son: "pop", voix: "Mesurez votre propre taux : combien de visites pour un rendez-vous, combien de rendez-vous pour une vente. Ce sont vos chiffres qui comptent.", visuel: { type: "points", titre: "Vos indicateurs", items: ["Visites par semaine", "Rendez-vous obtenus", "Devis émis", "Ventes conclues"] } },
      { son: "cloche", voix: "Question.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Les chiffres de cet exemple sont…", choix: ["Un exemple de calcul, à adapter", "Une garantie de revenus", "Une moyenne nationale"], bonne: 0, explication: "Seuls vos propres chiffres comptent : mesurez-les." } },
      { son: "succes", voix: "Bloquez ces créneaux dans votre agenda dès aujourd'hui.", visuel: { type: "titre", surtitre: "À retenir", texte: "Régularité > intensité", sous: "Mesurez, ajustez" } },
    ],
    contenu: [
      { titre: "La semaine type", liste: ["Un bloc pour ajouter des prospects et préparer les tournées.", "Deux demi-journées de visites groupées par quartier.", "Un bloc de production : maquettes, devis, mises en ligne.", "Un bloc de suivi : relances, factures, modifications clients."] },
      { titre: "Fixer son objectif", texte: "Partez du revenu visé et remontez : combien de ventes et d'abonnements ? Combien de rendez-vous pour y arriver ? Combien de visites ? Les ratios varient beaucoup selon les personnes et les zones : mesurez les vôtres pendant un mois, puis ajustez." },
    ],
    quiz: [
      { question: "Qu'est-ce qui compte le plus ?", choix: ["La régularité", "Une semaine très intense puis rien", "Le hasard"], bonne: 0, explication: "Des blocs fixes chaque semaine." },
      { question: "Comment connaître votre taux de conversion ?", choix: ["En mesurant vos propres résultats", "En copiant celui d'un autre", "Il est fixe pour tous"], bonne: 0, explication: "Vos chiffres dépendent de vous, de votre zone et de votre offre." },
      { question: "Quand préparer les maquettes ?", choix: ["Dans un bloc dédié, avant les visites", "Pendant la visite", "Jamais"], bonne: 0, explication: "Une maquette prête rend la visite efficace." },
    ],
  },
  {
    id: "echelle-pilotage", titre: "Piloter avec le pipeline", minutes: 4,
    resume: "Chaque prospect a une étape et une prochaine action : rien ne se perd.",
    video: [
      { son: "whoosh", voix: "Un prospect sans prochaine action est un prospect perdu.", visuel: { type: "titre", surtitre: "Module 7 · Passer à l'échelle", texte: "Piloter", sous: "Le pipeline travaille pour vous" } },
      { son: "pop", voix: "Le pipeline montre où en est chaque commerce : nouveau, contacté, rendez-vous, devis, gagné.", visuel: { type: "etapes", titre: "Le pipeline", etapes: ["Nouveau", "Contacté", "Rendez-vous", "Devis", "Gagné"] } },
      { son: "pop", voix: "Chaque fois que vous fermez une fiche, fixez une prochaine action et une date. Les rappels dus s'affichent en rouge.", visuel: { type: "check", titre: "La règle d'or", items: ["Une étape à jour", "Une prochaine action", "Une date", "Une note sur l'échange"] } },
      { son: "pop", voix: "Chaque semaine, regardez où ça bloque. Beaucoup de contacts mais peu de rendez-vous ? Retravaillez votre premier message.", visuel: { type: "comparaison", gauche: { titre: "Symptôme", items: ["Peu de réponses", "Peu de rendez-vous", "Devis non signés"] }, droite: { titre: "Action", items: ["Revoir le message", "Plus de visites", "Clarifier l'offre"] } } },
      { son: "cloche", voix: "Question.", visuel: { type: "titre", texte: "Question" }, quiz: { question: "Que faire en fermant une fiche prospect ?", choix: ["Fixer une prochaine action datée", "Rien", "Le supprimer"], bonne: 0, explication: "Le pipeline vous rappellera au bon moment." } },
      { son: "succes", voix: "Bravo, vous avez terminé le parcours. Place à l'action !", visuel: { type: "titre", surtitre: "Parcours terminé", texte: "À vous de jouer", sous: "Vos missions vous attendent" } },
    ],
    contenu: [
      { titre: "Le rituel du vendredi", liste: ["Ouvrir le pipeline.", "Traiter les rappels en rouge.", "Relancer les devis en attente.", "Repérer l'étape où vous perdez le plus de prospects, et agir dessus."] },
    ],
    quiz: [
      { question: "Les rappels dus apparaissent…", choix: ["En rouge dans le pipeline", "Par courrier", "Nulle part"], bonne: 0, explication: "Le pipeline met en évidence les actions en retard." },
      { question: "Beaucoup de devis non signés : piste ?", choix: ["Clarifier l'offre et le prix", "Envoyer plus de SMS", "Baisser la qualité"], bonne: 0, explication: "Le blocage est au moment de la décision : rendez l'offre plus claire." },
      { question: "Une fiche sans prochaine action…", choix: ["Risque d'être oubliée", "Est parfaite", "Est supprimée automatiquement"], bonne: 0, explication: "D'où la règle : toujours une prochaine action datée." },
    ],
    actions: [{ lib: "Ouvrir le pipeline", href: "/espace/pipeline" }],
  },
];

export const MODULES: Module[] = [
  { id: "demarrer", titre: "Démarrer", couleur: "#6d4aff", icone: "rocket", description: "Statut, obligations et une offre qui se vend.", lecons: prep(demarrer) },
  { id: "prospecter", titre: "Prospecter", couleur: "#0ea5c6", icone: "target", description: "Cibler, contacter dans les règles, visiter.", lecons: prep(prospecter) },
  { id: "convaincre", titre: "Convaincre", couleur: "#ec4899", icone: "sparkles", description: "La maquette qui fait signer et les objections.", lecons: prep(convaincre) },
  { id: "conclure", titre: "Conclure", couleur: "#f97316", icone: "pen", description: "Devis, acompte et vente chez le client.", lecons: prep(conclure) },
  { id: "livrer", titre: "Livrer", couleur: "#10b981", icone: "globe", description: "Nom de domaine, mise en ligne, fiche Google.", lecons: prep(livrer) },
  { id: "fideliser", titre: "Encaisser et fidéliser", couleur: "#3b5bfd", icone: "wallet", description: "Factures, abonnement et recommandations.", lecons: prep(fideliser) },
  { id: "echelle", titre: "Passer à l'échelle", couleur: "#a855f7", icone: "trending", description: "Routine, objectifs et pilotage.", lecons: prep(echelle) },
];

export const LECONS = MODULES.flatMap((m) => m.lecons.map((l) => ({ ...l, module: m })));
export const lecon = (id: string) => LECONS.find((l) => l.id === id);

/** Niveau selon le pourcentage du parcours terminé. */
export const NIVEAUX: [number, string][] = [[0, "Débutant"], [25, "Prospecteur"], [50, "Vendeur"], [75, "Expert"], [100, "Maître MySite"]];
export function niveau(pct: number): { nom: string; suivant: string | null; seuil: number | null } {
  let i = 0; NIVEAUX.forEach(([s], j) => { if (pct >= s) i = j; });
  return { nom: NIVEAUX[i][1], suivant: NIVEAUX[i + 1]?.[1] ?? null, seuil: NIVEAUX[i + 1]?.[0] ?? null };
}

export function progression(terminees: Set<string>) {
  const total = LECONS.length, faites = LECONS.filter((l) => terminees.has(l.id)).length;
  const pct = Math.round((faites / total) * 100);
  const parModule = MODULES.map((m) => ({ id: m.id, pct: Math.round((m.lecons.filter((l) => terminees.has(l.id)).length / m.lecons.length) * 100) }));
  const prochaine = LECONS.find((l) => !terminees.has(l.id)) ?? null;
  return { total, faites, pct, parModule, prochaine, niveau: niveau(pct) };
}

/** Réussite d'un quiz : 2 bonnes réponses sur 3 au moins. */
export const SEUIL_REUSSITE = 66;
