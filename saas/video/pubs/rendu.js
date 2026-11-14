// Rendu image par image de <nom>.html (1080 × 1920, 30 i/s) avec son mixage, en MP4.
// Usage : node rendu.js <nom> <dossier de travail> <fichier de sortie.mp4>
const { chromium } = require('playwright');
const { spawn } = require('child_process');
(async () => {
  const [nom, travail, sortie] = process.argv.slice(2), FPS = 30;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + __dirname + '/' + nom + '.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  // SANS_SOUS=1 : pas de sous-titres incrustés (pour en ajouter avec un autre outil).
  if (process.env.SANS_SOUS) await p.addStyleTag({ content: '#zone-sous{display:none!important}' });
  const DUREE = await p.evaluate(() => window.DUREE);
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', travail + '/mix.wav', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', sortie], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.ceil(FPS * DUREE), t0 = Date.now();
  for (let f = 0; f < total; f++) {
    await p.evaluate((t) => window.rendre(t), f / FPS);
    const img = await p.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await b.close();
  await new Promise((r) => ff.on('close', r));
  console.log(nom, 'rendu en', Math.round((Date.now() - t0) / 1000), 's');
})();
