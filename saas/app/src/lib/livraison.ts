/** Assistant de livraison : les étapes pour finaliser une vente, de l'accord du client au premier avis. */
export interface EtapeLivraison { cle: string; titre: string; texte: string; auto?: boolean; lecon?: string; facultatif?: boolean }

export const ETAPES_LIVRAISON: EtapeLivraison[] = [
  { cle: "accord", titre: "Devis accepté", texte: "Le gérant a signé le devis (« Bon pour accord »). Signé chez lui ? Respectez le délai de rétractation de 14 jours et n'encaissez rien avant 7 jours.", auto: true, lecon: "conclure-acompte" },
  { cle: "acompte", titre: "Acompte encaissé", texte: "Une facture d'acompte (souvent 30 à 50 %), une fois les délais légaux passés. Notez la date de paiement.", lecon: "conclure-acompte", facultatif: true },
  { cle: "contenus", titre: "Contenus validés", texte: "Vraies photos (devanture, salle, plats), carte et prix, horaires exacts : tout ce qui est « à vérifier » dans le Studio est confirmé par le gérant.", lecon: "convaincre-maquette" },
  { cle: "domaine", titre: "Nom de domaine acheté au nom du client", texte: "Choisissez un nom court, vérifiez qu'il est libre, et faites-le acheter par le client chez un registraire, à son nom.", lecon: "livrer-domaine" },
  { cle: "en_ligne", titre: "Site mis en ligne", texte: "Studio, onglet Publier : mentions légales complètes, validation du gérant, puis « Mettre en ligne ».", auto: true, lecon: "livrer-mise-en-ligne" },
  { cle: "dns", titre: "Domaine branché", texte: "Copiez les réglages DNS affichés dans le Studio chez le registraire du client. MySite vérifie qu'ils sont actifs.", auto: true, lecon: "livrer-mise-en-ligne" },
  { cle: "google", titre: "Fiche Google à jour", texte: "Le gérant crée ou revendique sa fiche sur business.google.com ; ajoutez le lien du site et les mêmes horaires.", lecon: "livrer-google" },
  { cle: "remise", titre: "Remise au client", texte: "Montrez-lui son site sur son téléphone, expliquez comment demander une modification, laissez-lui les accès de son nom de domaine et de sa fiche Google.", lecon: "fideliser-recurrent" },
  { cle: "facture", titre: "Facture finale payée", texte: "Émettez la facture depuis le devis accepté et marquez-la payée à réception.", auto: true, lecon: "fideliser-facture" },
  { cle: "avis", titre: "Avis et recommandation demandés", texte: "Client satisfait ? Demandez simplement un avis sur votre fiche Google (sans contrepartie) et s'il connaît un commerçant intéressé.", lecon: "fideliser-avis" },
];

export function avancement(faites: Record<string, boolean>): { pct: number; prochaine: EtapeLivraison | null } {
  const comptees = ETAPES_LIVRAISON.filter((e) => !e.facultatif || faites[e.cle]);
  const n = comptees.filter((e) => faites[e.cle]).length;
  return { pct: Math.round((n / comptees.length) * 100), prochaine: ETAPES_LIVRAISON.find((e) => !faites[e.cle] && !e.facultatif) ?? null };
}

export const REGISTRAIRES = [
  { nom: "OVHcloud", url: "https://www.ovhcloud.com/fr/domains/" },
  { nom: "Gandi", url: "https://www.gandi.net/fr/domain" },
  { nom: "Infomaniak", url: "https://www.infomaniak.com/fr/domaines" },
  { nom: "IONOS", url: "https://www.ionos.fr/domaines/" },
];
