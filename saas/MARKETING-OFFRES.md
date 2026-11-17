# Offres et passage à l'abonnement : analyse et choix (17/11/2026)

## Prix de lancement (décidé le 17/11/2026)

- Jusqu'au **30 novembre 2026** inclus : Pro 29 €, Premium 59 €, Ultra 119 € par mois (290 / 590 / 1 190 € par an).
- À partir du **1er décembre 2026** (minuit, Paris), pour les **nouveaux** abonnés : Pro 35 €, Premium 69 €, Ultra 139 € par mois (350 / 690 / 1 390 € par an).
- **Prix garanti** : toute personne abonnée avant le 1er décembre garde le prix de lancement tant qu'elle reste abonnée (écrit dans les CGV, article 2).
- Compte à rebours **réel** sur la page des offres et la page de limite : il se termine le 1er décembre et disparaît, sans jamais recommencer. La hausse s'applique automatiquement (prix Stripe `_APRES`, espace client dédié). Une fausse limite de temps serait une pratique commerciale trompeuse (art. L121-4 du Code de la consommation).

## La grille actuelle

| | Gratuit | Pro | Premium | Ultra |
|---|---|---|---|---|
| Prix | 0 € | 29 €/mois (290 €/an) | 59 €/mois (590 €/an) | 119 €/mois (1 190 €/an) |
| Commerces trouvés / mois | 15 | 300 | 1 000 | 3 000 |
| Messages IA / mois | 5 | 100 | 200 | 400 |
| Maquettes conservées | 3 | 100 | 500 | 2 000 |
| Sites sur mesure IA / mois | — | 5 | 12 | 25 |
| Départements | 1 | 3 | 10 | France |

**Verdict : on garde les prix.** Ils viennent d'être mis en place dans Stripe en mode réel, ils sont cohérents avec la marge (coût de l'IA ≤ 27 % de la recette, vérifié par un test automatique) et bien construits :
- **prix psychologiques** (29, 59, 119) et **ancrage** : Ultra rend Premium raisonnable, Premium rend Pro accessible ;
- **annuel = 2 mois offerts**, affiché aussi ramené au mois (24,17 €) ;
- **prix au jour** désormais affiché (« moins de 1 € par jour » pour Pro), toujours exact (prix / 30, arrondi à l'euro supérieur).

## Ce que dit la psychologie, et comment on l'applique (sans manipulation)

| Principe | Application dans MySite |
|---|---|
| **La valeur avant la limite** (« moment aha ») | L'offre Gratuite permet le parcours complet : trouver 15 commerces, en contacter 5, créer 3 maquettes. La limite arrive *après* les premiers vrais gestes, jamais avant. |
| **L'élan** (effet de gradient d'objectif) | La limite des messages (5) arrive alors que 10 commerces trouvés attendent encore : la page le dit honnêtement (« 10 commerces trouvés attendent encore votre premier message »). |
| **La progression acquise** | La page de limite commence par le bilan du mois (« vous avez trouvé 15 commerces, rédigé 5 messages et créé 2 maquettes »), pas par ce qui manque. |
| **Pas de surprise** | Le compteur est visible sur le tableau de bord ; un avertissement apparaît avant la fin (« Plus qu'1 message gratuit ce mois-ci »). |
| **Une seule action principale** | La page propose d'abord l'offre juste au-dessus, avec ce qu'elle change en chiffres exacts (« 100 messages par mois au lieu de 5 »). |
| **Une alternative** | Le parrainage : 1 mois de Pro offert (offre Gratuite) ou 29 € de crédit (offre payante). |
| **Le respect** | La date de remise à zéro est toujours indiquée (« le 1er décembre ») ; on peut attendre, revenir au tableau de bord, fermer. |

**Ce qu'on s'interdit** (règles du projet et droit de la consommation) : faux compte à rebours, fausse rareté, « offre qui expire ce soir », culpabilisation (« Non merci, je préfère perdre des clients »), chiffres inventés (« 92 % de nos clients… »), promesse de revenus.

## Le blocage

- Chaque compteur bloque son action dès qu'il est épuisé (recherche, messages, sites sur mesure, retouches), **côté serveur**.
- **Mois gratuit épuisé** (commerces *et* messages du mois utilisés) : recherche, messages **et nouvelles maquettes** sont en pause jusqu'au 1er du mois suivant.
- Restent toujours accessibles : ses prospects, ses notes et son suivi, ses maquettes, l'Académie (modules gratuits), l'export de ses données, l'abonnement et le parrainage. Bloquer l'accès à ses propres données serait abusif (et l'export est un droit, RGPD art. 20).

## Le parcours

1. Une action dépasse la limite → l'appli ouvre **/espace/limite** (au lieu d'un simple message d'erreur).
2. Page : bilan du mois → offre suivante (prix, prix par jour, 3 à 5 arguments chiffrés, bouton) → parrainage → « ou attendez le 1er ».
3. « Passer à Pro » mène à « Mon abonnement » avec l'offre mise en avant et un message adapté.
4. Bandeau discret sur le tableau de bord, la fiche prospect et le Studio tant qu'une limite est atteinte.

## Pistes pour plus tard (à mesurer avant de changer)

- Regarder dans « Suivi des ventes » combien d'inscrits atteignent la limite des messages, et combien passent à Pro ensuite.
- Si trop peu atteignent la limite : passer de 5 à 3 messages gratuits. Si trop la quittent sans revenir : passer à 7.
- Tester l'annuel mis en avant par défaut sur la page des offres (aujourd'hui : mensuel par défaut).
