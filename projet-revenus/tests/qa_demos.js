// QA des sites générés (démos ou sites clients) servis en HTTP.
// Usage : node tests/qa_demos.js http://127.0.0.1:8080/exemples [chemin/axe.min.js]
// Autres sites : SITES=dossier1,dossier2 node tests/qa_demos.js http://127.0.0.1:8081 [axe]
// Vérifie : 7 largeurs sans débordement ni erreur, images chargées, cibles tactiles,
// menu mobile au clavier, formulaire (erreurs en français, démo désactivée), axe-core.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:8080/exemples';
const AXE = process.argv[3];
const SITES = process.env.SITES ? process.env.SITES.split(',') : ['exemple-plomberie-martin', 'exemple-patisserie-lea', 'exemple-salon-atelier-nova'];
const LARGEURS = [320, 375, 414, 768, 1024, 1280, 1920];
let echecs = 0;
const ko = (m) => { echecs++; console.log('ÉCHEC ' + m); };

async function defiler(p) {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    scrollTo(0, 0);
  });
  await p.waitForLoadState('networkidle');
}

(async () => {
  const b = await chromium.launch();
  for (const s of SITES) {
    const url = `${BASE}/${s}/`;
    // 1. Largeurs, erreurs, images, cibles tactiles
    for (const w of LARGEURS) {
      const p = await b.newPage({ viewport: { width: w, height: 900 } });
      const err = []; p.on('pageerror', (e) => err.push(e.message)); p.on('console', (m) => m.type() === 'error' && err.push(m.text()));
      p.on('response', (r) => r.status() >= 400 && err.push(`${r.status()} ${r.url()}`));
      await p.goto(url, { waitUntil: 'networkidle' }); await defiler(p);
      const r = await p.evaluate(() => ({
        deb: document.documentElement.scrollWidth - innerWidth,
        imgs: [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src),
        petites: [...document.querySelectorAll('a,button,select,input,textarea,summary')].filter((el) => {
          const z = el.getBoundingClientRect(); const st = getComputedStyle(el);
          if (!z.width || st.visibility === 'hidden' || el.closest('.piege,[hidden],.panier:not(.ouvert)')) return false;
          if (el.tagName === 'A' && el.closest('p,li,dd,footer') && !el.classList.contains('btn')) return false; // liens dans le texte : exemptés (WCAG 2.5.8)
          return z.height < 24 || z.width < 24;
        }).map((el) => el.outerHTML.slice(0, 60)),
      }));
      if (r.deb > 0) ko(`${s} @${w} : débordement horizontal ${r.deb}px`);
      if (r.imgs.length) ko(`${s} @${w} : images non chargées ${r.imgs.join(', ')}`);
      if (r.petites.length) ko(`${s} @${w} : cibles < 24px ${r.petites.join(' | ')}`);
      if (err.length) ko(`${s} @${w} : ${err.join(' | ')}`);
      await p.close();
    }
    console.log(`1. ${s} : 7 largeurs contrôlées`);

    // 2. Menu mobile au clavier
    const p = await b.newPage({ viewport: { width: 375, height: 800 } });
    await p.goto(url);
    await p.focus('.btn-menu'); await p.keyboard.press('Enter');
    if ((await p.getAttribute('.btn-menu', 'aria-expanded')) !== 'true' || !(await p.isVisible('#nav a'))) ko(`${s} : le menu ne s'ouvre pas`);
    await p.keyboard.press('Escape');
    if ((await p.getAttribute('.btn-menu', 'aria-expanded')) !== 'false' || (await p.isVisible('#nav a'))) ko(`${s} : Échap ne ferme pas le menu`);
    const focus = await p.evaluate(() => document.activeElement.className);
    if (!focus.includes('btn-menu')) ko(`${s} : le focus ne revient pas sur le bouton menu`);
    // lien d'évitement
    await p.keyboard.press('Shift+Tab'); await p.goto(url); await p.keyboard.press('Tab');
    if (!(await p.evaluate(() => document.activeElement.classList.contains('evitement')))) ko(`${s} : lien d'évitement absent du premier Tab`);
    console.log(`2. ${s} : menu et clavier contrôlés`);

    // 3. Formulaire (si présent)
    if (await p.$('form.form')) {
      await p.click('form.form button[type=submit]');
      const msg = await p.textContent('#e-nom');
      if (!/Indiquez votre nom/.test(msg)) ko(`${s} : pas de message d'erreur en français`);
      if ((await p.evaluate(() => document.activeElement.id)) !== 'f-nom') ko(`${s} : le focus ne va pas au premier champ en erreur`);
      await p.fill('#f-nom', 'Test'); await p.fill('#f-tel', '06 00 00 00 00'); await p.fill('#f-msg', 'Essai');
      await p.click('form.form button[type=submit]');
      const retour = await p.textContent('form.form .retour');
      if (!/désactivé/.test(retour)) ko(`${s} : la page n'indique pas que le formulaire est désactivé`);
      if (!p.url().startsWith(url)) ko(`${s} : la démo a envoyé le formulaire`);
      console.log(`3. ${s} : formulaire contrôlé`);
    }
    await p.close();

    // 4. axe-core
    if (AXE) {
      const src = fs.readFileSync(AXE, 'utf8');
      for (const w of [375, 1280]) {
        const q = await b.newPage({ viewport: { width: w, height: 900 } });
        await q.goto(url, { waitUntil: 'networkidle' }); await q.addScriptTag({ content: src });
        const v = await q.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] })).violations.map((x) => `${x.id} (${x.impact}) ×${x.nodes.length} : ${x.nodes[0].target}`));
        if (v.length) ko(`axe ${s} @${w} : ${v.join(' ; ')}`); else console.log(`4. axe ${s} @${w} : aucune violation`);
        await q.close();
      }
    }
  }
  await b.close();
  console.log(echecs ? `\n${echecs} échec(s)` : '\nQA des démos : tout est conforme');
  process.exit(echecs ? 1 : 0);
})();
