# FACTURE N° {AAAA}-{NNN}
_(Numérotation chronologique continue, sans trou. Ne jamais supprimer une facture : en cas d'erreur, faire un avoir.)_

**Émetteur :** {Prénom NOM} — Enseigne Web, entrepreneur individuel (EI)
SIRET : {SIRET} · {Adresse} · {Email}

**Client :** {Raison sociale / Nom} — {Adresse} — SIREN : {SIREN client}

**Date d'émission :** {JJ/MM/AAAA} · **Date de la prestation :** {JJ/MM/AAAA}
**Référence devis :** {N° devis}

| Désignation | Qté | Prix unitaire | Total |
|---|---|---|---|
| {Acompte 50 % / Solde} — Offre {Vitrine} selon devis {N°} | 1 | {195,00 €} | {195,00 €} |
| **Total à payer** | | | **{195,00 €}** |

**Mention de TVA selon le client :**
- 🇫🇷 client en France : « TVA non applicable, article 293 B du CGI » ;
- 🇧🇪 client belge **assujetti à la TVA** : « Autoliquidation » + votre n° de TVA intracommunautaire (FR…) + celui du client (BE…). Penser à la DES ;
- 🇨🇭 client suisse professionnel : « TVA non applicable – article 259 du CGI (prestation de services à un preneur établi hors de l'Union européenne) ».

À faire valider par un comptable ou le service des impôts des entreprises avant la première facture BE ou CH (voir MARCHES.md).

**Échéance :** {date} — paiement par virement : IBAN {IBAN}.
En cas de retard : pénalités au taux de 3 fois le taux d'intérêt légal et indemnité forfaitaire de 40 € pour frais de recouvrement.

---
**À savoir :**
- Facturation électronique : depuis le 1er septembre 2026, vous devez pouvoir **recevoir** des factures électroniques. L'**émission** au format électronique sera obligatoire pour les micro-entreprises à partir du 1er septembre 2027. Choisissez d'ici là une plateforme agréée (il en existe de gratuites) : voir LEGAL.md.
- Après chaque encaissement, ajoutez la ligne correspondante dans `crm/donnees/ventes.csv` et dans votre livre des recettes.
