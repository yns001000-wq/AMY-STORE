// Vérification navigateur des sites de démonstration : erreurs JS, débordement horizontal sur mobile, liens internes, parcours panier WhatsApp.
// Usage (depuis projet-revenus/) : node tests/verifier_pages.js [dossier_captures]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const racine = path.resolve(__dirname, '..');
const captures = process.argv[2];
// Les pages du site de l'agence sont testées par tests/qa_site_agence.js (servies en HTTP).
const pages = [
  'site/exemples/exemple-plomberie-martin/index.html',
  'site/exemples/exemple-patisserie-lea/index.html',
  'site/exemples/exemple-salon-atelier-nova/index.html',
];
const tdb = process.env.TABLEAU_DE_BORD; if (tdb) pages.push(tdb);

(async () => {
  const browser = await chromium.launch();
  let echecs = 0;
  const echec = (m) => { echecs++; console.log('  ÉCHEC : ' + m); };
  for (const largeur of [375, 1280]) {
    const ctx = await browser.newContext({ viewport: { width: largeur, height: 900 } });
    for (const rel of pages) {
      const page = await ctx.newPage();
      const erreurs = [];
      page.on('pageerror', e => erreurs.push(e.message));
      page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
      const fichier = path.isAbsolute(rel) ? rel : path.join(racine, rel);
      await page.goto('file://' + fichier);
      console.log(`[${largeur}px] ${rel}`);
      if (erreurs.length) echec('erreurs JS : ' + erreurs.join(' | '));
      const deborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (deborde > 1) echec(`débordement horizontal de ${deborde}px`);
      const liens = await page.$$eval('a[href]', as => as.map(a => a.getAttribute('href')));
      for (const h of liens) {
        if (/^(https?:|tel:|mailto:|#)/.test(h)) continue;
        const cible = path.join(path.dirname(fichier), h.split('#')[0]);
        if (!fs.existsSync(cible)) echec('lien interne cassé : ' + h);
      }
      if (rel.includes('patisserie')) {
        const bouton = largeur < 760 ? '#ouvrirPanier' : '#ouvrirPanier2';
        if (!(await page.locator(bouton).isDisabled())) echec('panier vide mais bouton actif');
        await page.locator('[data-produit] .btn-add').first().click();
        await page.locator('[data-produit] .btn-add').first().click();
        await page.locator(bouton).click();
        if (!(await page.locator('#panier').isVisible())) echec("le panier ne s'ouvre pas");
        await page.fill('#c-nom', 'Test');
        await page.fill('#c-date', 'samedi 14h');
        const href = await page.locator('#envoyer').getAttribute('href');
        const texte = decodeURIComponent(href.split('text=')[1] || '');
        if (!href.startsWith('https://wa.me/33600000001?text=')) echec('lien WhatsApp incorrect : ' + href);
        for (const attendu of ['2 × Fraisier (6 parts) — 64 €', 'Total : 64 €', 'samedi 14h', 'Prénom : Test'])
          if (!texte.includes(attendu)) echec('message de commande incomplet (' + attendu + ') : ' + texte);
        await page.locator('#lignes button').first().click(); // −1
        if (!(await page.locator('#total').textContent()).includes('32')) echec('le bouton − ne met pas à jour le total');
        await page.locator('.tiroir [data-fermer]').click();
      }
      const imgsCassees = await page.$$eval('img', is => is.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src));
      if (imgsCassees.length) echec('images cassées : ' + imgsCassees.join(', '));
      if (captures) {
        fs.mkdirSync(captures, { recursive: true });
        const nom = rel.replace(/[\/]/g, '_').replace('.html', '') + `_${largeur}.png`;
        await page.screenshot({ path: path.join(captures, path.basename(nom)), fullPage: true });
      }
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  console.log(echecs ? `\n${echecs} échec(s).` : '\nToutes les vérifications navigateur sont passées.');
  process.exit(echecs ? 1 : 0);
})();
