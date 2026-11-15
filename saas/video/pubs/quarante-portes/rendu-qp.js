// Rendu complet : chaque image du film + animations, son d'origine. Usage : node rendu-qp.js <sortie.mp4> [sansSous]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
(async () => {
  const [sortie, mode] = process.argv.slice(2), FPS = 24, N = 1276;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1504, height: 1120 } });
  await p.goto('file://' + __dirname + '/montage.html' + (mode ? '?sansSous' : ''), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', '/root/.claude/uploads/3d41ac1c-bddb-5a71-a9a5-007d32d2a490/e9aa921d-pub1-quarante-portes-v1.mp4', '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart',
    '-c:a', 'copy', '-shortest', sortie], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 1; i <= N; i++) {
    const t = (i - 1) / FPS;
    await p.evaluate(async ([t, n]) => { await window.poserFond('images/' + n + '.jpg'); window.rendre(t); }, [t, String(i).padStart(5, '0')]);
    const img = await p.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await b.close();
  await new Promise((r) => ff.on('close', r));
  console.log(sortie.split('/').pop(), 'rendu en', Math.round((Date.now() - t0) / 1000), 's');
})();
