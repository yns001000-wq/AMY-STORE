/* Mysite — comportements du site : menu mobile et formulaire de demande. Aucune dépendance. */
(function () {
  "use strict";

  /* ---------- Menu mobile ---------- */
  var bouton = document.querySelector(".menu-bouton");
  var nav = document.getElementById("navigation");
  if (bouton && nav) {
    var fermerMenu = function () { nav.classList.remove("ouvert"); bouton.setAttribute("aria-expanded", "false"); };
    bouton.addEventListener("click", function () {
      var ouvert = nav.classList.toggle("ouvert");
      bouton.setAttribute("aria-expanded", ouvert ? "true" : "false");
      if (ouvert) { var premier = nav.querySelector("a"); if (premier) premier.focus(); }
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) fermerMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("ouvert")) { fermerMenu(); bouton.focus(); } });
  }

  /* ---------- Formulaire de demande d'aperçu ---------- */
  var form = document.getElementById("formulaire-apercu");
  if (!form) return;
  form.setAttribute("novalidate", ""); // la validation est faite par ce script, avec des messages en français ; sans script, le navigateur valide lui-même
  var retour = document.getElementById("retour-formulaire");
  var envoyer = form.querySelector('button[type="submit"]');
  var REGLES = {
    nom: { requis: "Indiquez votre nom." },
    entreprise: { requis: "Indiquez le nom de votre entreprise." },
    activite: { requis: "Indiquez votre métier et votre ville." },
    telephone: { requis: "Indiquez un numéro pour vous rappeler.", motif: /^[+0-9 ().-]{8,20}$/, erreur: "Ce numéro ne semble pas valide (8 chiffres au minimum)." },
    email: { motif: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, erreur: "Cette adresse email ne semble pas valide." }
  };

  function verifier(champ) {
    var regle = REGLES[champ.name];
    if (!regle) return true;
    var valeur = champ.value.trim(), message = "";
    if (!valeur && regle.requis) message = regle.requis;
    else if (valeur && regle.motif && !regle.motif.test(valeur)) message = regle.erreur;
    var zone = document.getElementById("erreur-" + champ.name);
    if (zone) zone.textContent = message;
    champ.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }

  Object.keys(REGLES).forEach(function (nom) {
    var champ = form.elements[nom];
    if (!champ) return;
    champ.addEventListener("blur", function () { if (champ.value.trim() || champ.getAttribute("aria-invalid") === "true") verifier(champ); });
    champ.addEventListener("input", function () { if (champ.getAttribute("aria-invalid") === "true") verifier(champ); });
  });

  function afficher(type, texte) {
    retour.className = "retour retour--" + type;
    retour.textContent = texte;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    retour.textContent = "";
    var premierInvalide = null;
    Object.keys(REGLES).forEach(function (nom) { var c = form.elements[nom]; if (c && !verifier(c) && !premierInvalide) premierInvalide = c; });
    if (premierInvalide) {
      afficher("erreur", "Le formulaire contient des erreurs : corrigez les champs indiqués.");
      premierInvalide.focus();
      return;
    }
    envoyer.setAttribute("aria-busy", "true");
    envoyer.disabled = true;
    var texteBouton = envoyer.textContent;
    envoyer.textContent = "Envoi en cours…";
    var donnees = new URLSearchParams(new FormData(form)).toString();
    fetch(form.getAttribute("action") || "/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: donnees
    }).then(function (reponse) {
      if (!reponse.ok) throw new Error("HTTP " + reponse.status);
      window.location.assign(form.dataset.merci || "merci.html");
    }).catch(function () {
      var secours = form.dataset.secours;
      afficher("erreur", "Votre demande n'a pas pu être envoyée. Vérifiez votre connexion et réessayez" + (secours ? ", ou écrivez-nous directement à " + secours + "." : "."));
      envoyer.removeAttribute("aria-busy");
      envoyer.disabled = false;
      envoyer.textContent = texteBouton;
    });
  });
})();
