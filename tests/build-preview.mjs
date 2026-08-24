#!/usr/bin/env node
// Bygger en lokal förhandsvisning av DEV eller PROD-profilen.
//
// DEV: ren kopia av apps/app/ — allt utvecklingsinnehåll, oförändrat sedan
// PROD-001B.
//
// PROD (HOTFIX-v1.3.1): kopierar ENDAST de innehållsfiler som härleds från
// catalog.prod.json — se tests/lib/prod-content-set.mjs och
// tests/lib/build-prod.mjs (den återanvändbara kärnan, testad av
// tests/build-preview.test.mjs). Fram till och med v1.3.0 kopierades hela
// apps/app/ rakt av även för PROD, vilket gjorde att dolda lärstigars
// checkpoint-facit, oanvända scenarier och hela DEV-katalogen låg fysiskt
// hämtningsbara i den publicerade artifakten trots att appens UI aldrig
// visade dem. Detta skript bygger nu PROD som en riktig allowlist: bara det
// som faktiskt behövs kopieras, resten finns aldrig i dist/prod.
//
// Körs manuellt:
//   node tests/build-preview.mjs dev    → dist/dev/   (identisk kopia av apps/app/)
//   node tests/build-preview.mjs prod   → dist/prod/  (filtrerad allowlist)
//
// Servera sedan med valfri statisk server, t.ex.:
//   python -m http.server 8000 --directory dist/dev
//   python -m http.server 8001 --directory dist/prod
//
// dist/ är inte versionshanterad (se .gitignore) — byggs på begäran.

import { existsSync, rmSync, cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildProd } from "./lib/build-prod.mjs";

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

if (env === "dev") {
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  cpSync(APP_SRC, outDir, { recursive: true });
  console.log(`DEV-förhandsvisning byggd i ${path.relative(ROOT, outDir)}/ (identisk kopia av apps/app/, `
    + `env.js oförändrad — samma katalog som apps/app/ redan använder).`);
} else {
  try {
    const { set } = buildProd(outDir, APP_SRC);
    console.log(`PROD-förhandsvisning byggd i ${path.relative(ROOT, outDir)}/ — filtrerad allowlist: `
      + `${set.learningPathFiles.length} lärstigar, ${set.theoryFiles.length} teorimoduler, `
      + `${set.scenarioFiles.length} scenarier (${set.standaloneScenarioFiles.length} fristående). `
      + `Inget annat DEV-innehåll kopierat.`);
  } catch (err) {
    console.error("PROD-byggning misslyckades: " + err.message);
    process.exit(1);
  }
}

console.log(`\nServera t.ex. med:\n  python -m http.server ${env === "prod" ? "8001" : "8000"} --directory ${path.relative(ROOT, outDir)}`);
