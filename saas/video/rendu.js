// Rendu image par image (30 i/s) de video.html vers ffmpeg, puis assemblage avec la bande-son.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
(async () => {
  const FPS = 30, DUREE = 48, dossier = __dirname, vertical = process.argv[2] === 'vertical';
  const sortie = vertical ? 'MySite-presentation-vertical.mp4' : 'MySite-presentation.mp4';
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', `${dossier}/bande_son.wav`, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=7',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', `${dossier}/${sortie}`], { stdio: ['pipe', 'inherit', 'inherit'] });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: vertical ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
  await p.goto(`file://${dossier}/video.html${vertical ? '?vertical' : ''}`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const total = FPS * DUREE, t0 = Date.now();
  for (let f = 0; f < total; f++) {
    await p.evaluate((t) => window.rendre(t), f / FPS);
    const img = await p.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 240 === 0) console.log(`${f}/${total} images · ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  ff.stdin.end(); await b.close();
  await new Promise((r) => ff.on('close', r));
  console.log('terminé en', Math.round((Date.now() - t0) / 1000), 's');
})();
