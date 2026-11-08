export const metadata = { title: "Retirer mon entreprise" };

export default async function Opposition({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  return (
    <section className="carte legal" style={{ margin: "1.5rem auto" }}>
      <h1 style={{ fontSize: "1.8rem" }}>Retirer mon entreprise de MySite</h1>
      <p>MySite aide des professionnels à trouver des entreprises à contacter, à partir de registres publics (base Sirene de l&apos;INSEE, OpenStreetMap).
        Vous pouvez vous y opposer à tout moment, sans justification (RGPD, article 21).</p>
      <p><strong>Effet immédiat :</strong> votre entreprise est retirée des espaces de tous les utilisateurs et ne sera plus jamais proposée.</p>
      {q.ok && <p className="alerte" role="status">C&apos;est fait : votre entreprise ne sera plus proposée par MySite.</p>}
      {q.erreur && <p className="alerte" role="alert">Numéro invalide : indiquez un SIREN (9 chiffres) ou un SIRET (14 chiffres).</p>}
      <form className="pile" action="/api/opposition" method="post">
        <label>SIREN ou SIRET de votre entreprise<input name="siren_siret" inputMode="numeric" pattern="[0-9 ]{9,17}" required /></label>
        <label>Téléphone professionnel (facultatif, pour l&apos;exclure aussi)<input name="telephone" type="tel" /></label>
        <button className="btn p" type="submit">Retirer mon entreprise</button>
      </form>
      <p className="note">Nous conservons uniquement ce numéro et la date de la demande, pour garantir que votre entreprise reste exclue. Pour toute question : la page Confidentialité.</p>
      <p className="note">Vous pouvez aussi, plus largement, vous opposer à l&apos;utilisation commerciale de vos données auprès de l&apos;INSEE (statut de diffusion de votre entreprise), et vous inscrire sur Bloctel pour votre numéro personnel.</p>
    </section>
  );
}
