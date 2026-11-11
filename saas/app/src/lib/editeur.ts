/**
 * Identité de l'éditeur affichée dans les pages légales (mentions légales, CGV, CGU, confidentialité, page Abonnement).
 *
 * Les valeurs viennent des variables d'environnement (Vercel > Settings > Environment Variables), jamais du code :
 * le dépôt est public, l'identité et l'adresse n'y sont donc pas écrites. Une valeur vide s'affiche
 * comme « [à compléter] » surligné, pour ne pas l'oublier avant l'ouverture au public.
 *
 * Rappel légal : pour un entrepreneur individuel, le nom et le prénom (art. 6 III de la LCEN), l'adresse,
 * le téléphone et l'e-mail (art. L221-5 du Code de la consommation) sont obligatoires dans les mentions légales.
 */
const v = (cle: string) => (process.env[cle] ?? "").trim();

export const EDITEUR = {
  /** Prénom et NOM de l'entrepreneur individuel (obligatoire). */
  nom: v("EDITEUR_NOM"),
  /** Adresse postale (domicile ou adresse de domiciliation). */
  adresse: v("EDITEUR_ADRESSE"),
  telephone: v("EDITEUR_TELEPHONE"),
  email: v("CONTACT_EMAIL"),
  /** SIREN ou SIRET ; tant qu'il n'est pas attribué par l'INSEE : « en cours d'attribution ». */
  siren: v("EDITEUR_SIREN") || "en cours d'attribution",
  /** Médiateur de la consommation (obligatoire pour vendre à des particuliers). */
  mediateur: v("MEDIATEUR_CONSOMMATION"),
  /** Région de la base Supabase, affichée chez l'hébergeur. */
  regionSupabase: v("SUPABASE_REGION"),
};
