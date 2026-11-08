/**
 * Devis, factures et avoirs : calculs et mentions obligatoires (France, ventes entre professionnels).
 * Références : article L441-9 du code de commerce et article 242 nonies A de l'annexe II du CGI (mentions des factures),
 * article 293 B du CGI (franchise en base de TVA), article D441-5 du code de commerce (indemnité de recouvrement de 40 €).
 */
export type TypeDoc = "devis" | "facture" | "avoir";
export interface Ligne { designation: string; quantite: number; prix_unitaire: number }
export interface Emetteur { nom: string; siret: string; adresse: string; email?: string; telephone?: string; tva: string; taux_tva: number; iban?: string; conditions?: string }
export interface Client { nom: string; adresse?: string; siret?: string; email?: string; hors_etablissement?: boolean }

export const LIBELLES: Record<TypeDoc, string> = { devis: "Devis", facture: "Facture", avoir: "Avoir" };
export const STATUTS: Record<string, { nom: string; couleur: string }> = {
  brouillon: { nom: "Brouillon", couleur: "#64748b" }, envoye: { nom: "Envoyé", couleur: "#3b5bfd" }, accepte: { nom: "Accepté", couleur: "#10b981" },
  refuse: { nom: "Refusé", couleur: "#ef4444" }, emise: { nom: "Émise", couleur: "#3b5bfd" }, payee: { nom: "Payée", couleur: "#10b981" }, annulee: { nom: "Annulée", couleur: "#94a3b8" },
};

const arrondi = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Nettoie les lignes saisies (jamais de montant négatif ; l'avoir est négatif par nature, à l'affichage). */
export function nettoyerLignes(v: unknown): Ligne[] {
  return (Array.isArray(v) ? v : []).slice(0, 50).map((l) => {
    const x = (l ?? {}) as Record<string, unknown>;
    const q = Number(String(x.quantite ?? 1).replace(",", ".")), pu = Number(String(x.prix_unitaire ?? 0).replace(",", ".").replace(/\s/g, ""));
    return { designation: String(x.designation ?? "").replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").trim().slice(0, 300), quantite: Number.isFinite(q) && q > 0 ? arrondi(q) : 1, prix_unitaire: Number.isFinite(pu) && pu >= 0 ? arrondi(pu) : 0 };
  }).filter((l) => l.designation);
}

export function totaux(lignes: Ligne[], tauxTva: number): { ht: number; tva: number; ttc: number } {
  const ht = arrondi(lignes.reduce((s, l) => s + arrondi(l.quantite * l.prix_unitaire), 0));
  const tva = arrondi((ht * (tauxTva || 0)) / 100);
  return { ht, tva, ttc: arrondi(ht + tva) };
}

export const euros = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

/** Mentions légales à imprimer en pied de document, selon le type et le régime de TVA. */
export function mentionsLegales(type: TypeDoc, e: Emetteur, opts: { echeance?: string | null; origine?: string | null } = {}): string[] {
  const m: string[] = [];
  if (e.tva === "franchise") m.push("TVA non applicable, art. 293 B du CGI.");
  if (type === "devis") {
    m.push(`Devis gratuit${opts.echeance ? `, valable jusqu'au ${dateFr(opts.echeance)}` : ""}. Les prix sont fermes pendant la durée de validité.`);
    m.push("Pour accepter ce devis : date, signature et mention « Bon pour accord ».");
  } else if (type === "facture") {
    m.push(`Paiement ${opts.echeance ? `au plus tard le ${dateFr(opts.echeance)}` : "à réception"}. Pas d'escompte pour paiement anticipé.`);
    m.push("En cas de retard de paiement : pénalités au taux d'intérêt appliqué par la Banque centrale européenne à son opération de refinancement la plus récente majoré de 10 points, et indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 et D441-5 du code de commerce).");
    m.push("Nature de l'opération : prestation de services.");
  } else if (opts.origine) m.push(`Avoir annulant la facture ${opts.origine}.`);
  if (e.conditions) m.push(e.conditions);
  return m;
}

/**
 * Vente conclue chez le commerçant (hors établissement) à un professionnel de 5 salariés au plus, pour un service hors de son activité principale :
 * les règles protectrices des consommateurs s'appliquent (art. L221-3 du code de la consommation).
 */
export const MENTION_HORS_ETABLISSEMENT = "Contrat conclu hors établissement avec un professionnel employant 5 salariés au plus (art. L221-3 du code de la consommation) : vous disposez d'un délai de rétractation de 14 jours à compter de la conclusion du contrat (art. L221-18), au moyen du formulaire ci-dessous ou de toute déclaration dénuée d'ambiguïté. Aucun paiement ne peut être reçu avant l'expiration d'un délai de 7 jours à compter de la conclusion du contrat (art. L221-10). Si vous demandez que la prestation commence avant la fin du délai de rétractation, vous restez redevable du montant correspondant au service fourni jusqu'à votre rétractation.";

export const FORMULAIRE_RETRACTATION = (e: { nom?: string; adresse?: string; email?: string }) => [
  "Formulaire de rétractation : veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.",
  `À l'attention de ${[e.nom, e.adresse, e.email].filter(Boolean).join(", ")} :`,
  "Je/nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat portant sur la prestation de services ci-dessous :",
  "Commandé le : ………………  Nom du (des) client(s) : ………………………………",
  "Adresse du (des) client(s) : ……………………………………………………………………",
  "Signature (uniquement en cas de notification sur papier) : ………………   Date : ………………",
  "(*) Rayez la mention inutile.",
];

export const dateFr = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

/** Échéance par défaut : 30 jours pour une facture, 30 jours de validité pour un devis. */
export function echeanceParDefaut(depuis = new Date(), jours = 30): string {
  const d = new Date(depuis); d.setDate(d.getDate() + jours); return d.toISOString().slice(0, 10);
}

/** Lignes proposées pour la vente d'un site vitrine : à adapter, MySite ne fixe pas vos prix. */
export const LIGNES_TYPES: Ligne[] = [
  { designation: "Création du site vitrine : maquette, rédaction, photos, version mobile, référencement local de base et mise en ligne", quantite: 1, prix_unitaire: 490 },
  { designation: "Hébergement, mises à jour et petites modifications (prix mensuel)", quantite: 12, prix_unitaire: 29 },
];

/** Contrôle avant émission (le serveur et la base vérifient aussi). */
export function controleEmission(e: Partial<Emetteur> | null, c: Partial<Client>, lignes: Ligne[]): string[] {
  const p: string[] = [];
  if (!e?.nom || !e.siret || !e.adresse) p.push("Complétez votre identité de vendeur (nom, SIRET, adresse) dans « Mon entreprise ».");
  if (!c.nom) p.push("Indiquez le nom du client.");
  if (!c.adresse) p.push("Indiquez l'adresse du client (obligatoire sur une facture).");
  if (!lignes.length) p.push("Ajoutez au moins une ligne.");
  return p;
}
