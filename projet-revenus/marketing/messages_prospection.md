# Messages de prospection (PRÉPARÉS — à envoyer uniquement par vous, ou par Claude avec votre accord explicite)

**Comment utiliser ces modèles :**
- Remplacez les éléments entre `{accolades}`.
- Personnalisez toujours au moins une phrase sur l'entreprise : son métier, son quartier, un détail de sa fiche publique.
- Un message générique envoyé en masse, c'est du spam : on ne le fait pas.

**Selon le pays** (détails dans MARCHES.md) :
- 🇫🇷 France : email et téléphone autorisés selon les règles ci-dessous ;
- 🇧🇪 Belgique : email **uniquement** vers l'adresse générique d'une société (info@, contact@), sinon téléphone ;
- 🇨🇭 Suisse : **pas d'email à froid**. Téléphone uniquement si le numéro ne porte pas d'astérisque (\*) dans l'annuaire.

Adaptez aussi la ville et les tournures : « GSM » en Belgique, « Natel » en Suisse, « septante » et « nonante » dans les deux pays.

**Règles légales intégrées** (détails dans LEGAL.md) :
- email : uniquement vers une adresse professionnelle publiée par l'entreprise, avec un objet lié à son métier, votre identité claire et un moyen simple de refuser ;
- téléphone : uniquement vers un numéro professionnel publié, pour parler de son activité. Si le numéro semble personnel, préférez la visite ou l'email ;
- si la personne dit non ou « stop », passez immédiatement son statut à `ne_pas_contacter` dans le suivi.

---

## 1. Visite en personne (segment A ou B) — environ 2 minutes
> Bonjour, je m'appelle {prénom}, je crée des sites internet pour les entreprises du coin. Je ne vais pas vous retenir. J'ai vu que {nom entreprise} n'avait pas encore de site, alors je me suis permis de préparer un aperçu de ce que ça pourrait donner, regardez *(montrer le téléphone)*.
> C'est un prix fixe, 390 €, payé une fois, sans abonnement, et le site est à votre nom. Ça pourrait vous intéresser, ou ce n'est pas le moment ?

- **Si c'est oui ou peut-être** : « Je vous laisse ma carte. On se cale 15 minutes cette semaine pour l'adapter à vos vrais services ? » → noter le rendez-vous.
- **Si c'est non** : « Pas de souci, merci de m'avoir écouté, bonne journée. » → statut `refus`.

## 2. Appel téléphonique — moins de 60 secondes avant la question
> Bonjour, {prénom} de Enseigne Web. Je vous appelle parce que je crée des sites simples pour les {métier}s du secteur, et j'ai remarqué que {nom entreprise} n'en avait pas encore. Vous avez 30 secondes ?
> *(oui)* J'ai préparé gratuitement un aperçu de ce que pourrait être votre site. Je peux vous l'envoyer par SMS ou par email, sans engagement, et vous me dites ce que vous en pensez ?

- **Si c'est « envoyez »** : envoyer la capture de l'aperçu, avec en prochaine action « Rappeler J+2 ».
- **Si c'est « pas intéressé »** : « Très bien, je ne vous rappellerai pas. Bonne journée. » → statut `ne_pas_contacter`.

## 3. Email initial (avec la capture de l'aperçu en pièce jointe)
**Objet :** Un aperçu de site pour {nom entreprise}

> Bonjour {Madame/Monsieur Nom, ou Bonjour},
>
> Je suis {prénom nom}, je crée des sites internet pour les artisans et commerçants, partout en France, en Belgique et en Suisse romande.
>
> En cherchant des {métier}s du secteur, j'ai vu que {nom entreprise} n'avait pas encore de site. Je me suis permis de préparer un aperçu de ce qu'il pourrait être (capture jointe). Il n'est publié nulle part.
>
> Le principe : un prix fixe de 390 €, payé une fois, sans abonnement, livré en 5 jours, et le site vous appartient. Vous ne payez rien si l'aperçu ne vous convient pas.
>
> Si cela vous intéresse, une réponse ou un appel au {téléphone} suffit pour en parler 15 minutes.
>
> Bonne journée,
> {prénom nom} — Enseigne Web, {SIRET}
> {lien vers la page de l'offre}
>
> _Vous recevez ce message car votre adresse professionnelle est publiée pour votre activité de {métier}. Pour ne plus recevoir de message de ma part, répondez simplement « STOP »._

## 4. Relance 1 (J+4) — même fil de discussion
> Bonjour,
> Je me permets de revenir vers vous au sujet de l'aperçu de site pour {nom entreprise}. Si vous avez 2 minutes pour me dire si cela vous parle ou non, ça m'aiderait beaucoup, même si c'est non.
> {prénom}
> _Répondez « STOP » pour ne plus être contacté._

## 5. Relance 2 et dernière (J+10)
> Bonjour,
> Dernier message de ma part, promis : je garde l'aperçu de {nom entreprise} de côté pendant un mois si un jour le sujet revient. Bonne continuation !
> {prénom}

→ Si toujours pas de réponse : statut `sans_reponse`. **On ne relance plus.**

## 6. Message Instagram (segment B, compte professionnel uniquement)
> Bonjour {prénom} ! J'adore {un détail réel : la dernière création, le nom de la boutique…}. Je crée des petits sites pour les {métier}s : votre carte en ligne, et les commandes qui arrivent directement sur votre WhatsApp, déjà rédigées, sans commission. J'ai fait une démo de ce que ça donnerait pour vous, je peux vous l'envoyer ici ?

## 7. Message à votre réseau personnel (une seule fois)
> Petite nouvelle : je lance mon activité de création de sites internet pour les artisans et commerçants (prix fixe, sans abonnement). Si vous connaissez quelqu'un qui n'a pas de site ou qui en a un qui ne lui plaît plus, je serais ravi·e que vous me mettiez en relation. Merci d'avance ! {lien de la page}

## 8. Après un rendez-vous
> Bonjour {prénom},
> Merci pour notre échange. Comme convenu, voici le récapitulatif :
> - Offre : {Vitrine / Vitrine + commande WhatsApp} — {prix} €, payé une fois
> - Contenu : {liste des sections et services}
> - Délai : 5 jours ouvrés après réception de vos textes et photos, et de l'acompte
> - Paiement : 50 % à la commande, 50 % à la mise en ligne, par virement
>
> Le devis est joint. Il vous suffit de le renvoyer signé avec la mention « Bon pour accord ».
> {prénom}

## 9. Demande d'avis (uniquement à un client satisfait, sans contrepartie, sans texte imposé)
> Bonjour {prénom}, j'espère que le site vous rend service ! Si vous en êtes content, un avis sur ma fiche Google m'aiderait beaucoup : {lien}. Et si quelque chose ne va pas, dites-le-moi plutôt à moi, je corrige.

---

### Script de rendez-vous (15 min)
1. **Comprendre (5 min)** : « Comment vos clients vous trouvent-ils aujourd'hui ? Qu'est-ce qu'ils vous demandent le plus souvent ? Quelle zone couvrez-vous ? Quels sont vos horaires ? »
2. **Montrer (3 min)** : l'aperçu, adapté avec ce qu'on vient d'apprendre.
3. **Proposer (3 min)** : l'offre, le prix, le délai et le mode de paiement.
4. **Traiter les objections (3 min)** : voir le tableau dans MARKETING.md.
5. **Conclure (1 min)** : « On lance ? Je vous envoie le devis ce soir. » Si la personne hésite : « Je vous rappelle jeudi ? » et on note la date de la prochaine action.
