#!/usr/bin/env node
// Bygger en lokal förhandsvisning av DEV eller PROD-profilen.
//
// PROD-001B: samma kod, samma katalogval, samma funktionsflaggor som ska
// användas vid en framtida deployment från main — detta skript gör ENDAST
// den mekaniska kopiering/fil-swap som ett releasesteg mot main senare ska
// göra (kopiera apps/app/ rakt av, ersätt env.js med env.prod.js:s
// innehåll). Ingen bundler, inget nytt byggsystem.
//
// Körs manuellt:
//   node tests/build-preview.mjs dev    → dist/dev/   (identisk kopia av apps/app/)
//   node tests/build-preview.mjs prod   → dist/prod/  (env.js ersatt med env.prod.js)
//
// Servera sedan med valfri statisk server, t.ex.:
//   python -m http.server 8000 --directory dist/dev
//   python -m http.server 8001 --directory dist/prod
//
// dist/ är inte versionshanterad (se .gitignore) — byggs på begäran.

import { existsSync, rmSync, cpSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const APP_SRC = path.join(ROOT, "apps", "app");

const env = process.argv[2];
if (env !== "dev" && env !== "prod") {
  console.error("Användning: node tests/build-preview.mjs <dev|prod> [utkatalog]");
  process.exit(1);
}

const outDir = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(ROOT, "dist", env);

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
cpSync(APP_SRC, outDir, { recursive: true });

if (env === "prod") {
  const prodEnvSrc = path.join(APP_SRC, "env.prod.js");
  const activeEnvDest = path.join(outDir, "env.js");
  if (!existsSync(prodEnvSrc)) {
    console.error("apps/app/env.prod.js saknas — kan inte bygga PROD-förhandsvisning.");
    process.exit(1);
  }
  copyFileSync(prodEnvSrc, activeEnvDest);
  console.log(`PROD-förhandsvisning byggd i ${path.relative(ROOT, outDir)}/ (env.js = env.prod.js:s innehåll, `
    + `catalogFile pekar på content/catalog.prod.json).`);
} else {
  console.log(`DEV-förhandsvisning byggd i ${path.relative(ROOT, outDir)}/ (identisk kopia av apps/app/, `
    + `env.js oförändrad — samma katalog som apps/app/ redan använder).`);
}

console.log(`\nServera t.ex. med:\n  python -m http.server ${env === "prod" ? "8001" : "8000"} --directory ${path.relative(ROOT, outDir)}`);
