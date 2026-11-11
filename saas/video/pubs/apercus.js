// Images de contrôle : node apercus.js <nom> <dossier de sortie> 1.2,4.5,…
const { chromium } = require('playwright');
(async () => {
  const [nom, sortie, temps] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 0.4 });
  await p.goto(`file://${__dirname}/${nom}.html`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  for (const t of temps.split(',').map(Number)) { await p.evaluate((x) => window.rendre(x), t); await p.screenshot({ path: `${sortie}/ap-${nom}-${t.toFixed(1)}.png` }); }
  await b.close();
})();
