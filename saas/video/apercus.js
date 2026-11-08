const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/video.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  for (const t of (process.argv[2] || '1.5,5.6,10.8,15.5,22.5,28,32.8,37,41.2,43.5,46.5').split(',').map(Number)) {
    await p.evaluate(t => window.rendre(t), t); await p.waitForTimeout(60);
    await p.screenshot({ path: `apercu-${t}.jpg`, type: 'jpeg', quality: 70 });
  }
  console.log(errs.length ? errs.join('\n') : 'ok'); await b.close();
})();
