// Construit la démo autonome (dossier de sortie en argument) avec esbuild.
import { build } from "/tmp/esb/node_modules/esbuild/lib/main.js";
import { readFileSync, mkdirSync, cpSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const ici = dirname(fileURLToPath(import.meta.url)), app = resolve(ici, ".."), sortie = resolve(process.argv[2] ?? resolve(ici, "dist"));
mkdirSync(sortie, { recursive: true });
// Adaptations pour un site statique : chemins relatifs des photos et polices, photos importées en data:, aperçu non isolé (polices).
const remplacements = {
  "src/lib/studio/photos.ts": [[/"\/photos\//g, '"photos/']],
  "src/lib/studio/moteur.ts": [[/"\/polices\//g, '"polices/'], [/\/\^\\\/photos\\\//g, "/^\\/?photos\\/"], ["/^https:\\/\\/[^\\s\"'<>]+$/.test(k)", "(/^https:\\/\\/[^\\s\"'<>]+$/.test(k) || /^data:image\\//.test(k))"]],
  "src/components/studio/EditeurStudio.tsx": [['sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"', 'sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"']],
};
const plugin = {
  name: "demo", setup(b) {
    b.onResolve({ filter: /^next\/link$/ }, () => ({ path: resolve(ici, "shims/link.tsx") }));
    b.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: resolve(ici, "shims/navigation.ts") }));
    b.onResolve({ filter: /^server-only$/ }, () => ({ path: resolve(ici, "shims/vide.ts") }));
    b.onLoad({ filter: /\.(ts|tsx)$/ }, (args) => {
      const rel = args.path.replace(app + "/", ""); const regles = remplacements[rel]; if (!regles) return;
      let s = readFileSync(args.path, "utf8");
      for (const [a, z] of regles) { const avant = s; s = typeof a === "string" ? s.split(a).join(z) : s.replace(a, z); if (s === avant) throw new Error(`Remplacement sans effet dans ${rel} : ${a}`); }
      return { contents: s, loader: args.path.endsWith("x") ? "tsx" : "ts" };
    });
  },
};
writeFileSync(resolve(ici, "shims/vide.ts"), "export {};\n");
await build({
  entryPoints: [resolve(ici, "main.tsx")], bundle: true, minify: true, format: "iife", target: "es2020", outfile: resolve(sortie, "app.js"),
  jsx: "automatic", loader: { ".json": "json", ".css": "css", ".png": "dataurl" }, alias: { "@": resolve(app, "src") }, plugins: [plugin],
  define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" }, legalComments: "none", logLevel: "warning",
});
// Feuille de style : celle de l'application + compléments de la démo
const css = readFileSync(resolve(app, "src/app/globals.css"), "utf8") + "\n" + readFileSync(resolve(ici, "demo.css"), "utf8");
writeFileSync(resolve(sortie, "style.css"), css);
cpSync(resolve(app, "public/photos"), resolve(sortie, "photos"), { recursive: true });
cpSync(resolve(app, "public/polices"), resolve(sortie, "polices"), { recursive: true });
cpSync(resolve(ici, "index.html"), resolve(sortie, "index.html"));
console.log("démo construite dans", sortie);
