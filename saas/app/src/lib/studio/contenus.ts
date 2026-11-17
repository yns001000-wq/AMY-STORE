/**
 * Contenu d'exemple de la maquette express, adapté à chaque métier (sans IA).
 * Règle : aucun mot hors sujet pour le commerce (pas de « devis » pour une boulangerie, pas de « formule midi » pour un plombier).
 * Tout reste signalé comme exemple à remplacer : prix, produits et horaires sont plausibles, jamais présentés comme réels.
 */

type Article = { nom: string; desc: string; prix: number | string };
export interface ContenuMetier {
  atouts: string[];
  defilant: string[];          // le premier élément (« métier à ville ») est ajouté par siteExpress
  offre: { nav: string; surtitre: string; titre: string; texte: string; pied: string; onglets: { nom: string; articles: Article[] }[] };
  engagements: { titre: string; texte: string; icone: string }[];
  bonASavoir: string[];
  faq: { q: string; r: string }[];
  final: { titre: string; texte: string };
  /** Suggestions de retouches proposées dans le Studio pour ce métier. */
  suggestions: string[];
  /** Nom de l'onglet « carte » dans l'éditeur (La carte, Les tarifs, Nos services…). */
  ongletCarte: string;
}

const CARTE = "Carte d'exemple : à remplacer par la vôtre.";
const PRIX_TTC = "Prix TTC. Allergènes sur demande.";

export const CONTENUS: Record<string, ContenuMetier> = {
  pizzeria: {
    atouts: ["Pâte maison", "Cuisson au four", "Sur place", "À emporter"],
    defilant: ["Pâte maison", "Pizzas à emporter", "Commandez par téléphone", "Près de chez vous"],
    offre: { nav: "La carte", surtitre: "Au four", titre: "Nos pizzas", texte: CARTE, pied: PRIX_TTC, onglets: [
      { nom: "Les classiques", articles: [{ nom: "Margherita", desc: "Tomate, mozzarella, basilic frais.", prix: 10.5 }, { nom: "Regina", desc: "Tomate, mozzarella, jambon, champignons.", prix: 12.5 }, { nom: "Quatre fromages", desc: "Mozzarella, gorgonzola, chèvre, parmesan.", prix: 13.5 }] },
      { nom: "Spécialités", articles: [{ nom: "Calzone", desc: "Pizza chausson garnie.", prix: 13.9 }, { nom: "Pizza du moment", desc: "Selon l'envie du pizzaïolo.", prix: 14 }] },
      { nom: "Desserts", articles: [{ nom: "Tiramisu maison", desc: "La recette de la maison.", prix: 5.5 }] }] },
    engagements: [{ titre: "Pâte maison", texte: "Préparée chaque jour, longue fermentation.", icone: "feuille" }, { titre: "Au four", texte: "Cuite minute, servie bien chaude.", icone: "etoile" }],
    bonASavoir: ["Sur place et à emporter", "Commande par téléphone", "Paiement par carte"],
    faq: [{ q: "Peut-on commander à emporter ?", r: "Oui : appelez-nous, votre pizza est prête à l'heure convenue." }],
    final: { titre: "Une envie de pizza ? Appelez-nous.", texte: "Commande à emporter par téléphone." },
    suggestions: ["Ajoute une pizza végétarienne", "Mets en avant la vente à emporter", "Ajoute une catégorie Boissons à la carte", "Rends le ton plus chaleureux", "Écris une FAQ plus complète"],
    ongletCarte: "La carte",
  },
  rapide: {
    atouts: ["Fait minute", "Sur place", "À emporter", "Prix doux"],
    defilant: ["Fait minute", "Sur place ou à emporter", "Commandez par téléphone", "Près de chez vous"],
    offre: { nav: "La carte", surtitre: "Fait minute", titre: "La carte", texte: CARTE, pied: PRIX_TTC, onglets: [
      { nom: "Burgers & tacos", articles: [{ nom: "Burger maison", desc: "Steak, cheddar, sauce maison.", prix: 9.5 }, { nom: "Tacos", desc: "Viande au choix, frites, sauce fromagère.", prix: 8.5 }, { nom: "Assiette kebab", desc: "Viande, frites, salade, sauce.", prix: 11 }] },
      { nom: "Menus", articles: [{ nom: "Menu burger", desc: "Burger, frites et boisson.", prix: 12.5 }, { nom: "Menu enfant", desc: "Petit burger, frites, boisson.", prix: 7.5 }] },
      { nom: "Boissons", articles: [{ nom: "Boisson fraîche", desc: "33 cl.", prix: 2.5 }] }] },
    engagements: [{ titre: "Fait minute", texte: "Préparé à la commande.", icone: "horloge" }, { titre: "Généreux", texte: "Des portions qui calent.", icone: "coeur" }],
    bonASavoir: ["Sur place et à emporter", "Commande par téléphone", "Paiement par carte"],
    faq: [{ q: "Peut-on commander à l'avance ?", r: "Oui : appelez-nous, votre commande est prête à votre arrivée." }],
    final: { titre: "Une faim de loup ? Appelez-nous.", texte: "Commande à emporter par téléphone." },
    suggestions: ["Ajoute un menu étudiant", "Mets en avant la vente à emporter", "Ajoute des desserts à la carte", "Rends le ton plus fun", "Écris une FAQ plus complète"],
    ongletCarte: "La carte",
  },
  restaurant: {
    atouts: ["Fait maison", "Produits frais", "Réservation", "Accueil chaleureux"],
    defilant: ["Fait maison", "Produits frais", "Réservez votre table", "Près de chez vous"],
    offre: { nav: "La carte", surtitre: "Fait maison", titre: "La carte", texte: CARTE, pied: PRIX_TTC, onglets: [
      { nom: "Entrées", articles: [{ nom: "Entrée du jour", desc: "Selon le marché.", prix: 7.5 }, { nom: "Salade de saison", desc: "Légumes frais, vinaigrette maison.", prix: 8 }] },
      { nom: "Plats", articles: [{ nom: "Plat signature", desc: "La spécialité de la maison.", prix: 18 }, { nom: "Plat du jour", desc: "Selon l'arrivage.", prix: 14.5 }, { nom: "Formule midi", desc: "Entrée et plat, ou plat et dessert.", prix: 17.9 }] },
      { nom: "Desserts", articles: [{ nom: "Dessert maison", desc: "La gourmandise du chef.", prix: 6.5 }] }] },
    engagements: [{ titre: "Fait maison", texte: "Une cuisine préparée sur place.", icone: "etoile" }, { titre: "Produits frais", texte: "Selon le marché et la saison.", icone: "feuille" }],
    bonASavoir: ["Réservation conseillée le week-end", "Paiement par carte"],
    faq: [{ q: "Faut-il réserver ?", r: "C'est conseillé le week-end : appelez-nous." }],
    final: { titre: "Réservez votre table.", texte: "Nous vous répondons avec plaisir." },
    suggestions: ["Ajoute une formule du midi", "Rends le ton plus chic", "Ajoute une catégorie Vins à la carte", "Mets en avant la terrasse", "Écris une FAQ plus complète"],
    ongletCarte: "La carte",
  },
  asiatique: {
    atouts: ["Préparé minute", "Produits frais", "Sur place", "À emporter"],
    defilant: ["Préparé minute", "Sur place ou à emporter", "Commandez par téléphone", "Près de chez vous"],
    offre: { nav: "La carte", surtitre: "Préparé minute", titre: "La carte", texte: CARTE, pied: PRIX_TTC, onglets: [
      { nom: "Sushis & makis", articles: [{ nom: "Plateau découverte", desc: "Assortiment de sushis et makis.", prix: 16.9 }, { nom: "Makis saumon", desc: "6 pièces.", prix: 6.5 }] },
      { nom: "Plats chauds", articles: [{ nom: "Wok de poulet", desc: "Légumes sautés, nouilles.", prix: 12.5 }, { nom: "Bo bun", desc: "Vermicelles, bœuf, nems.", prix: 11.9 }] },
      { nom: "Desserts", articles: [{ nom: "Mochis", desc: "2 pièces, parfums au choix.", prix: 4.5 }] }] },
    engagements: [{ titre: "Préparé minute", texte: "Chaque plat est fait à la commande.", icone: "horloge" }, { titre: "Produits frais", texte: "Poisson et légumes choisis.", icone: "feuille" }],
    bonASavoir: ["Sur place et à emporter", "Commande par téléphone", "Paiement par carte"],
    faq: [{ q: "Peut-on commander à emporter ?", r: "Oui : appelez-nous, votre commande est prête à l'heure convenue." }],
    final: { titre: "Une envie d'Asie ? Appelez-nous.", texte: "Commande à emporter par téléphone." },
    suggestions: ["Ajoute un menu du midi", "Mets en avant la vente à emporter", "Ajoute des plats végétariens", "Rends le ton plus zen", "Écris une FAQ plus complète"],
    ongletCarte: "La carte",
  },
  cafe: {
    atouts: ["Café de qualité", "Fait maison", "Sur place", "À emporter"],
    defilant: ["Café de qualité", "Gourmandises maison", "Sur place ou à emporter", "Près de chez vous"],
    offre: { nav: "La carte", surtitre: "Au comptoir", titre: "La carte", texte: CARTE, pied: "Prix TTC.", onglets: [
      { nom: "Boissons", articles: [{ nom: "Espresso", desc: "Café torréfié par un artisan.", prix: 1.8 }, { nom: "Cappuccino", desc: "Lait mousseux, cacao.", prix: 3.5 }, { nom: "Thé ou infusion", desc: "Sélection de la maison.", prix: 3 }] },
      { nom: "Gourmandises", articles: [{ nom: "Formule brunch", desc: "Boisson chaude, jus, salé et sucré.", prix: 18.5 }, { nom: "Pâtisserie du jour", desc: "Faite maison.", prix: 4 }] }] },
    engagements: [{ titre: "Café de qualité", texte: "Des grains choisis avec soin.", icone: "etoile" }, { titre: "Fait maison", texte: "Gâteaux et brunch préparés sur place.", icone: "coeur" }],
    bonASavoir: ["Sur place et à emporter", "Paiement par carte"],
    faq: [{ q: "Proposez-vous un brunch ?", r: "Oui : renseignez-vous sur les jours et horaires par téléphone." }],
    final: { titre: "Passez nous voir.", texte: "Un café vous attend." },
    suggestions: ["Ajoute une formule brunch du week-end", "Rends le ton plus cosy", "Ajoute des boissons fraîches à la carte", "Mets en avant le travail du café", "Écris une FAQ plus complète"],
    ongletCarte: "La carte",
  },
  patisserie: {
    atouts: ["Fait maison", "Pain cuit sur place", "Gâteaux sur commande", "Ouvert le dimanche matin"],
    defilant: ["Pain cuit sur place", "Viennoiseries pur beurre", "Gâteaux sur commande", "Près de chez vous"],
    offre: { nav: "Nos créations", surtitre: "Fait maison", titre: "Nos créations", texte: "Produits et prix d'exemple : à remplacer par les vôtres.", pied: "Gâteaux sur commande : pensez à réserver 48 h à l'avance.", onglets: [
      { nom: "Boulangerie", articles: [{ nom: "Baguette tradition", desc: "Farine de qualité, cuite sur place.", prix: 1.3 }, { nom: "Pain de campagne", desc: "Au levain.", prix: 3.2 }, { nom: "Croissant pur beurre", desc: "Feuilleté chaque matin.", prix: 1.3 }] },
      { nom: "Pâtisserie", articles: [{ nom: "Éclair au chocolat", desc: "Crème pâtissière maison.", prix: 3.2 }, { nom: "Tarte aux fruits", desc: "Selon la saison.", prix: 3.9 }] },
      { nom: "Sur commande", articles: [{ nom: "Gâteau d'anniversaire", desc: "Pour vos fêtes, à personnaliser.", prix: "Dès 25 €" }] }] },
    engagements: [{ titre: "Fait maison", texte: "Pains et gâteaux préparés sur place.", icone: "etoile" }, { titre: "Fraîcheur", texte: "Des fournées tout au long de la journée.", icone: "feuille" }],
    bonASavoir: ["Gâteaux sur commande", "Paiement par carte"],
    faq: [{ q: "Peut-on commander un gâteau ?", r: "Oui, de préférence 48 h à l'avance, par téléphone ou en boutique." }],
    final: { titre: "Une commande ? Appelez-nous.", texte: "Gâteaux et grandes quantités sur commande." },
    suggestions: ["Ajoute la galette des rois", "Mets en avant les gâteaux sur commande", "Ajoute une catégorie Snacking", "Rends le ton plus gourmand", "Écris une FAQ plus complète"],
    ongletCarte: "Nos créations",
  },
  traiteur: {
    atouts: ["Fait maison", "Produits frais", "Pour vos événements", "Devis gratuit"],
    defilant: ["Fait maison", "Buffets et cocktails", "Pour vos événements", "Devis gratuit"],
    offre: { nav: "Nos formules", surtitre: "Pour vos événements", titre: "Nos formules", texte: "Formules et prix d'exemple : à remplacer par les vôtres.", pied: "Devis gratuit et sans engagement pour vos événements.", onglets: [
      { nom: "Buffets & cocktails", articles: [{ nom: "Buffet froid", desc: "À partir de 10 convives.", prix: "Dès 18 € / pers." }, { nom: "Cocktail dînatoire", desc: "Pièces salées et sucrées.", prix: "Dès 22 € / pers." }, { nom: "Plateau repas", desc: "Entrée, plat, dessert.", prix: 15.9 }] },
      { nom: "Réceptions", articles: [{ nom: "Mariage et réception", desc: "Menu composé avec vous.", prix: "Sur devis" }] }] },
    engagements: [{ titre: "Fait maison", texte: "Des recettes préparées dans notre laboratoire.", icone: "etoile" }, { titre: "Sur mesure", texte: "Chaque menu s'adapte à votre événement.", icone: "coeur" }],
    bonASavoir: ["Devis gratuit", "Paiement par carte ou virement"],
    faq: [{ q: "Combien de temps à l'avance commander ?", r: "Idéalement une semaine avant, davantage pour un mariage." }],
    final: { titre: "Un événement ? Demandez votre devis.", texte: "Nous vous répondons rapidement." },
    suggestions: ["Ajoute une formule entreprise", "Mets en avant les mariages", "Ajoute des options végétariennes", "Rends le ton plus élégant", "Écris une FAQ plus complète"],
    ongletCarte: "Nos formules",
  },
  beaute: {
    atouts: ["Sur rendez-vous", "Conseils personnalisés", "Produits professionnels", "Accueil chaleureux"],
    defilant: ["Sur rendez-vous", "Conseils personnalisés", "Produits professionnels", "Près de chez vous"],
    offre: { nav: "Les tarifs", surtitre: "Prestations", titre: "Les tarifs", texte: "Tarifs d'exemple : à remplacer par les vôtres.", pied: "Tarifs indicatifs, selon la longueur des cheveux.", onglets: [
      { nom: "Coiffure", articles: [{ nom: "Coupe femme", desc: "Shampoing, coupe, coiffage.", prix: 32 }, { nom: "Coupe homme", desc: "Shampoing et coupe.", prix: 20 }, { nom: "Couleur", desc: "Coloration complète.", prix: "Dès 45 €" }] },
      { nom: "Soins", articles: [{ nom: "Soin du visage", desc: "Nettoyage et hydratation.", prix: 45 }, { nom: "Manucure", desc: "Mise en beauté des ongles.", prix: 25 }] }] },
    engagements: [{ titre: "À l'écoute", texte: "Des conseils adaptés à chacun.", icone: "coeur" }, { titre: "Qualité", texte: "Des produits professionnels.", icone: "etoile" }],
    bonASavoir: ["Sur rendez-vous", "Paiement par carte"],
    faq: [{ q: "Faut-il prendre rendez-vous ?", r: "Oui, de préférence : appelez-nous." }],
    final: { titre: "Prenez rendez-vous.", texte: "Par téléphone, aux heures d'ouverture." },
    suggestions: ["Ajoute des forfaits mariage", "Mets en avant la prise de rendez-vous", "Ajoute une catégorie Barbier", "Rends le ton plus élégant", "Écris une FAQ plus complète"],
    ongletCarte: "Les tarifs",
  },
  artisan: {
    atouts: ["Devis gratuit", "Travail soigné", "Réponse rapide", "Prix annoncé"],
    defilant: ["Devis gratuit", "Travail soigné", "Appelez-nous", "Près de chez vous"],
    offre: { nav: "Nos services", surtitre: "Nos prestations", titre: "Nos services", texte: "Prestations et tarifs d'exemple : à remplacer par les vôtres.", pied: "Devis gratuit et sans engagement.", onglets: [
      { nom: "Prestations", articles: [{ nom: "Prestation principale", desc: "Ce que vous faites le mieux.", prix: "Sur devis" }, { nom: "Intervention rapide", desc: "Pour les besoins urgents.", prix: "Dès 60 €" }, { nom: "Conseil et devis", desc: "On étudie votre besoin ensemble.", prix: "Gratuit" }] }] },
    engagements: [{ titre: "Travail soigné", texte: "Un chantier propre et bien fait.", icone: "etoile" }, { titre: "Proximité", texte: "Un artisan de votre secteur, à votre écoute.", icone: "coeur" }],
    bonASavoir: ["Devis gratuit", "Paiement par carte ou virement"],
    faq: [{ q: "Le devis est-il gratuit ?", r: "Oui, gratuit et sans engagement." }, { q: "Quelle zone couvrez-vous ?", r: "Notre ville et les communes alentour : appelez-nous." }],
    final: { titre: "Un projet ? Demandez votre devis.", texte: "Nous vous répondons rapidement." },
    suggestions: ["Ajoute une zone d'intervention", "Mets en avant le dépannage urgent", "Ajoute nos certifications", "Rends le ton plus rassurant", "Écris une FAQ plus complète"],
    ongletCarte: "Nos services",
  },
};

export const contenuMetier = (famille: string | null | undefined): ContenuMetier => CONTENUS[famille ?? ""] ?? CONTENUS.artisan;
