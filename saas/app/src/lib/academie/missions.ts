/** Missions du parcours « Première vente » : cochées automatiquement à partir de l'activité réelle dans MySite. */
export interface Compteurs { secteur: boolean; prospects: number; contactes: number; sites: number; rdv: number; devis: number; publies: number; payees: number }
export interface Mission { id: string; titre: string; fait: boolean; href: string; lecon: string }

export function missions(c: Compteurs): Mission[] {
  return [
    { id: "zone", titre: "Choisir son secteur et sa zone", fait: c.secteur, href: "/espace/bienvenue", lecon: "prospecter-cibler" },
    { id: "prospects", titre: "Ajouter 10 prospects", fait: c.prospects >= 10, href: "/espace", lecon: "prospecter-cibler" },
    { id: "maquette", titre: "Créer une première maquette", fait: c.sites >= 1, href: "/espace/studio", lecon: "convaincre-maquette" },
    { id: "contact", titre: "Contacter 5 commerces", fait: c.contactes >= 5, href: "/espace/pipeline", lecon: "prospecter-messages" },
    { id: "rdv", titre: "Décrocher un rendez-vous", fait: c.rdv >= 1, href: "/espace/pipeline", lecon: "prospecter-visite" },
    { id: "devis", titre: "Émettre un premier devis", fait: c.devis >= 1, href: "/espace/factures", lecon: "conclure-devis" },
    { id: "en-ligne", titre: "Mettre un site en ligne", fait: c.publies >= 1, href: "/espace/studio", lecon: "livrer-mise-en-ligne" },
    { id: "paye", titre: "Encaisser une première facture", fait: c.payees >= 1, href: "/espace/factures", lecon: "fideliser-facture" },
  ];
}
