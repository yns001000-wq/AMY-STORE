// Contrôle qualité du site de l'agence (site/ servi en local).
// Usage : node tests/qa_site_agence.js http://127.0.0.1:8080 [chemin/axe.min.js] [dossier_captures]
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:8080';
const AXE = process.argv[3];
const CAPT = process.argv[4];
const PAGES = ['/index.html', '/mentions-legales.html', '/confidentialite.html', '/merci.html', '/404.html'];
const LARGEURS = [320, 375, 390, 430, 768, 1366, 1920];
let echecs = 0;
const ko = (m) => { echecs++; console.log('  ÉCHEC : ' + m); };

(async () => {
  const b = await chromium.launch();
  // 1. Toutes les pages, toutes les largeurs : erreurs, ressources, débordement, images
  for (const w of LARGEURS) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    for (const chemin of PAGES) {
      const p = await ctx.newPage(); const erreurs = [], manquants = [];
      p.on('pageerror', e => erreurs.push(e.message));
      p.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
      p.on('response', r => { if (r.status() >= 400 && !r.url().endsWith(chemin)) manquants.push(r.status() + ' ' + r.url()); });
      await p.goto(BASE + chemin, { waitUntil: 'networkidle' });
      await p.evaluate(async () => { window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 300)); window.scrollTo(0, 0); });
      if (erreurs.length) ko(`${chemin} @${w} erreurs console : ${erreurs.join(' | ')}`);
      if (manquants.length) ko(`${chemin} @${w} ressources introuvables : ${manquants.join(', ')}`);
      const deb = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (deb > 0) ko(`${chemin} @${w} débordement horizontal ${deb}px`);
      const cassees = await p.$$eval('img', is => is.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')));
      if (cassees.length) ko(`${chemin} @${w} images non chargées : ${cassees.join(', ')}`);
      const petitsBoutons = await p.$$eval('a.bouton, button, .nav a', els => els.filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 24; }).map(e => e.textContent.trim()));
      if (w <= 430 && petitsBoutons.length) ko(`${chemin} @${w} cibles tactiles < 24px : ${petitsBoutons.join(', ')}`);
      if (CAPT && (w === 390 || w === 1366) && ['/index.html', '/mentions-legales.html'].includes(chemin)) {
        fs.mkdirSync(CAPT, { recursive: true });
        await p.screenshot({ path: `${CAPT}/${chemin.slice(1, -5)}-${w}.png`, fullPage: true });
      }
      await p.close();
    }
    await ctx.close();
  }
  console.log('1. Pages × largeurs : terminé');

  // 2. Liens internes (et ancres)
  const p = await b.newPage();
  await p.goto(BASE + '/index.html');
  const liens = await p.$$eval('a[href]', as => [...new Set(as.map(a => a.getAttribute('href')))]);
  for (const h of liens) {
    if (/^(mailto:|tel:|https?:)/.test(h)) continue;
    const [chemin, ancre] = h.split('#');
    if (chemin) { const r = await p.request.get(new URL(chemin, BASE + '/index.html').href); if (r.status() !== 200) ko(`lien cassé ${h} (${r.status()})`); }
    if (ancre && (!chemin || chemin === 'index.html')) { const ok = await p.$('#' + ancre); if (!ok) ko(`ancre introuvable #${ancre}`); }
  }
  console.log(`2. Liens internes vérifiés : ${liens.length}`);

  // 3. Clavier : lien d'évitement en premier, focus visible
  await p.setViewportSize({ width: 1366, height: 900 });
  await p.goto(BASE + '/index.html'); await p.keyboard.press('Tab');
  const premier = await p.evaluate(() => document.activeElement.textContent.trim());
  if (premier !== 'Aller au contenu') ko('le premier élément au clavier n\'est pas le lien d\'évitement : ' + premier);
  const contour = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  if (contour === 'none') ko('focus non visible sur le lien d\'évitement');
  let passages = 0; for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); const s = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle); if (s !== 'none') passages++; }
  console.log(`3. Clavier : premier élément « ${premier} », focus visible sur ${passages}/40 éléments suivants`);

  // 4. Menu mobile
  await p.setViewportSize({ width: 375, height: 800 }); await p.goto(BASE + '/index.html');
  if (await p.isVisible('#navigation')) ko('menu mobile visible avant ouverture');
  await p.click('.menu-bouton');
  if (!(await p.isVisible('#navigation')) || (await p.getAttribute('.menu-bouton', 'aria-expanded')) !== 'true') ko('le menu mobile ne s\'ouvre pas');
  await p.keyboard.press('Escape');
  if (await p.isVisible('#navigation')) ko('Échap ne ferme pas le menu');
  await p.click('.menu-bouton'); await p.click('#navigation a[href$="#offres"]'); await p.waitForTimeout(300);
  if (await p.isVisible('#navigation')) ko('le menu ne se ferme pas après un clic sur un lien');
  console.log('4. Menu mobile : ouverture, Échap, fermeture après clic');

  // 5. Formulaire : erreurs, échec réseau, succès
  await p.goto(BASE + '/index.html#contact');
  await p.click('#formulaire-apercu button[type=submit]');
  const invalides = await p.$$eval('[aria-invalid="true"]', e => e.map(x => x.id));
  const focusErr = await p.evaluate(() => document.activeElement.id);
  if (invalides.join() !== 'nom,telephone,entreprise,activite' || focusErr !== 'nom') ko(`validation : invalides=${invalides} focus=${focusErr}`);
  await p.fill('#nom', 'Test'); await p.fill('#telephone', '12'); await p.fill('#entreprise', 'Test SARL'); await p.fill('#activite', 'Plombier à Lyon'); await p.fill('#email', 'pas-un-email');
  await p.click('#formulaire-apercu button[type=submit]');
  const msgTel = await p.textContent('#erreur-telephone'), msgMail = await p.textContent('#erreur-email');
  if (!msgTel || !msgMail) ko('erreurs de format non signalées');
  await p.fill('#telephone', '06 12 34 56 78'); await p.fill('#email', 'test@exemple.fr');
  // échec : le serveur statique local refuse le POST (501)
  await p.click('#formulaire-apercu button[type=submit]'); await p.waitForTimeout(500);
  const echec = await p.textContent('#retour-formulaire');
  if (!/n'a pas pu être envoyée/.test(echec)) ko('message d\'échec absent : ' + echec);
  if (await p.isDisabled('#formulaire-apercu button[type=submit]')) ko('bouton resté désactivé après échec');
  // succès simulé (comportement de Netlify : 200), vérification du contenu envoyé
  let corps = '';
  await p.route('**/', (r) => { if (r.request().method() === 'POST') { corps = r.request().postData(); return r.fulfill({ status: 200, body: 'ok' }); } return r.continue(); });
  await Promise.all([p.waitForURL('**/merci.html'), p.click('#formulaire-apercu button[type=submit]')]);
  if (!/form-name=demande-apercu/.test(corps) || !/telephone=06/.test(corps)) ko('contenu envoyé incorrect : ' + corps);
  console.log('5. Formulaire : validation, échec réseau et succès simulé → merci.html');

  // 6. Accessibilité automatique (axe-core)
  if (AXE) {
    const src = fs.readFileSync(AXE, 'utf8');
    for (const [w, chemin] of [[1366, '/index.html'], [375, '/index.html'], [1366, '/mentions-legales.html'], [1366, '/confidentialite.html'], [1366, '/merci.html'], [1366, '/404.html']]) {
      const q = await b.newPage({ viewport: { width: w, height: 900 } });
      await q.goto(BASE + chemin); await q.addScriptTag({ content: src });
      const r = await q.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] })).violations.map(v => `${v.id} (${v.impact}) ×${v.nodes.length} : ${v.nodes[0].target}`));
      if (r.length) ko(`axe ${chemin} @${w} : ${r.join(' ; ')}`); else console.log(`6. axe ${chemin} @${w} : aucune violation`);
      await q.close();
    }
  }
  await b.close();
  console.log(echecs ? `\n${echecs} échec(s).` : '\nToutes les vérifications sont passées.');
  process.exit(echecs ? 1 : 0);
})();
