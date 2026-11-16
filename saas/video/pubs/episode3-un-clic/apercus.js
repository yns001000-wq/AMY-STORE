// Images de contrôle à des instants donnés. Usage : node apercus.js t1,t2,...
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1504, height: 1120 } });
  await p.goto('file://' + __dirname + '/montage.html', { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
  for (const t of process.argv[2].split(',').map(Number)) {
    const n = String(Math.min(1252, Math.floor(t * 24) + 1)).padStart(5, '0');
    await p.evaluate(async ([t, n]) => { await window.poserFond('images/' + n + '.jpg'); window.rendre(t); }, [t, n]);
    await p.waitForTimeout(50); await p.screenshot({ path: __dirname + '/ap-' + t + '.jpg', type: 'jpeg', quality: 80 });
  }
  await b.close(); })();
