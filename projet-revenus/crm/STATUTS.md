# Statuts du suivi des prospects (colonne `statut` de prospects.csv)

| Statut | Signification | Compté comme… |
|---|---|---|
| `nouveau` | Trouvé, pas encore contacté | À contacter |
| `contacte` | Contacté, en attente de réponse | Contacté |
| `sans_reponse` | Aucune réponse après la dernière relance : **on arrête** | Contacté (clos) |
| `refus` | A répondu non | Contacté + réponse (clos) |
| `repondu` | A répondu, intéressé ou à suivre | Contacté + réponse |
| `rdv` | Rendez-vous fixé ou réalisé | … + rendez-vous |
| `devis` | Devis envoyé | … + rendez-vous + devis |
| `gagne` | Devis signé | … + vente |
| `perdu` | Échec après une réponse, un rendez-vous ou un devis | Contacté + réponse (clos) |
| `ne_pas_contacter` | Opposition exprimée : **ne plus jamais contacter** | Exclu de tous les calculs |

**Autres colonnes :**
- `canal` : `visite`, `appel`, `email`, `instagram`, `reseau`, `formulaire`, `recommandation`, ou un autre libellé constant que vous choisissez.
- `segment` : par exemple `A-artisans` et `B-food-beaute`. Gardez toujours le même libellé, sinon le rapport crée un nouveau segment.
- `date_prochaine_action` : au format AAAA-MM-JJ. C'est ce champ qui alimente la liste « Actions du jour ».

**Astuce :** les fichiers s'ouvrent dans Excel ou LibreOffice. Enregistrez toujours au format **CSV UTF-8**.
