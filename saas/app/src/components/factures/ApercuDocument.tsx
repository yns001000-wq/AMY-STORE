import { dateFr, euros, FORMULAIRE_RETRACTATION, LIBELLES, MENTION_HORS_ETABLISSEMENT, mentionsLegales, nettoyerLignes, totaux, type Client, type Emetteur, type TypeDoc } from "@/lib/factures";

export interface DocAffiche { type: TypeDoc; numero: string | null; client: Client; lignes: unknown; taux_tva: number; date_emission: string | null; date_echeance: string | null; conditions?: string; statut: string }

/** Rendu A4 d'un devis, d'une facture ou d'un avoir (écran et impression). */
export function ApercuDocument({ doc, emetteur, origine }: { doc: DocAffiche; emetteur: Partial<Emetteur> | null; origine?: string | null }) {
  const lignes = nettoyerLignes(doc.lignes), t = totaux(lignes, Number(doc.taux_tva) || 0), signe = doc.type === "avoir" ? -1 : 1;
  const e = { nom: "", siret: "", adresse: "", tva: "franchise", taux_tva: 0, ...(emetteur ?? {}) } as Emetteur;
  return (
    <article className="feuille">
      {!doc.numero && <p className="filigrane-brouillon">Brouillon : non émis</p>}
      <header className="feuille-tete">
        <div><b className="feuille-vendeur">{e.nom || "Votre nom ou raison sociale"}</b><p>{e.adresse || "Votre adresse"}<br />SIRET {e.siret || "à compléter"}{e.tva !== "franchise" && e.tva ? <><br />TVA {e.tva}</> : null}{e.email ? <><br />{e.email}</> : null}{e.telephone ? <><br />{e.telephone}</> : null}</p></div>
        <div className="feuille-titre"><h2>{LIBELLES[doc.type]}</h2><p>{doc.numero ? `N° ${doc.numero}` : "Numéro attribué à l'émission"}<br />{doc.date_emission ? `Émis le ${dateFr(doc.date_emission)}` : ""}</p></div>
      </header>
      <section className="feuille-client"><small>{doc.type === "devis" ? "Destinataire" : "Client"}</small><b>{doc.client?.nom || "Nom du client"}</b><p>{doc.client?.adresse}{doc.client?.siret ? <><br />SIRET {doc.client.siret}</> : null}</p></section>
      <table className="feuille-lignes">
        <thead><tr><th>Désignation</th><th>Qté</th><th>Prix unitaire HT</th><th>Total HT</th></tr></thead>
        <tbody>{lignes.map((l, i) => <tr key={i}><td>{l.designation}</td><td>{String(l.quantite).replace(".", ",")}</td><td>{euros(signe * l.prix_unitaire)}</td><td>{euros(signe * l.quantite * l.prix_unitaire)}</td></tr>)}</tbody>
      </table>
      <dl className="feuille-totaux">
        <div><dt>Total HT</dt><dd>{euros(signe * t.ht)}</dd></div>
        <div><dt>TVA {e.tva === "franchise" ? "" : `(${String(doc.taux_tva).replace(".", ",")} %)`}</dt><dd>{e.tva === "franchise" ? "Non applicable" : euros(signe * t.tva)}</dd></div>
        <div className="ttc"><dt>{doc.type === "avoir" ? "Montant de l'avoir" : doc.type === "devis" ? "Total" : "Net à payer"}</dt><dd>{euros(signe * t.ttc)}</dd></div>
      </dl>
      {doc.conditions && <p className="feuille-conditions">{doc.conditions}</p>}
      {doc.type === "facture" && e.iban && <p className="feuille-conditions">Règlement par virement : IBAN {e.iban}</p>}
      {doc.type === "devis" && <div className="feuille-signature"><span>Date et signature du client, précédées de « Bon pour accord »</span></div>}
      <footer className="feuille-pied">
        {mentionsLegales(doc.type, e, { echeance: doc.date_echeance, origine }).map((m, i) => <p key={i}>{m}</p>)}
        {doc.type === "devis" && doc.client?.hors_etablissement && <p>{MENTION_HORS_ETABLISSEMENT}</p>}
      </footer>
      {doc.type === "devis" && doc.client?.hors_etablissement && <section className="feuille-retractation">{FORMULAIRE_RETRACTATION(e).map((l, i) => <p key={i}>{l}</p>)}</section>}
    </article>
  );
}
