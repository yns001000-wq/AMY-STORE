// Rendu image par image de video-voix.html (1080 × 1920, 30 i/s) + mixage voix, en MP4.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
(async () => {
  const FPS = 30, dossier = __dirname;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(`file://${dossier}/video-voix.html`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const DUREE = await p.evaluate(() => window.DUREE);
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', `${dossier}/mix-voix.wav`, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', `${dossier}/MySite-voix-off-vertical.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.ceil(FPS * DUREE), t0 = Date.now();
  for (let f = 0; f < total; f++) {
    await p.evaluate((t) => window.rendre(t), f / FPS);
    const img = await p.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(`${f}/${total} · ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  ff.stdin.end(); await b.close();
  await new Promise((r) => ff.on('close', r));
  console.log('terminé en', Math.round((Date.now() - t0) / 1000), 's');
})();
