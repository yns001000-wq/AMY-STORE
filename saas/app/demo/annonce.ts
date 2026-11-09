/** Petits messages de la démo (en bas de l'écran). */
type Ecouteur = (m: string) => void;
const ecouteurs = new Set<Ecouteur>();
export const annoncer = (m: string) => ecouteurs.forEach((f) => f(m));
export const ecouterAnnonces = (f: Ecouteur) => { ecouteurs.add(f); return () => { ecouteurs.delete(f); }; };
