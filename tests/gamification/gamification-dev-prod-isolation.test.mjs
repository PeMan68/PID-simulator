// GAM-003B/v1.5.0 — Aktiveringsstyrning för den synliga XP-/nivåfunktionen.
//
// Fram till v1.5.0 var gamification (och GAM-002:s aktivitetsspårning den
// bygger på) uteslutande DEV-only, gated på ENV_CONFIG.environment. PO
// beslutade 2026-09-10 (PM otillgänglig) att aktivera funktionen i PROD i
// sitt nuvarande skick, inklusive DEV-konsolstödet (window.ActivityPrototype/
// window.GamificationDev) — se docs/development/GAMIFICATION-XP-PROTOTYPE.md.
//
// Denna fil testar därför INTE längre att gamification är uteslutet ur PROD
// — tvärtom, att det numera KORREKT ingår, styrt uteslutande av den egna
// flaggan ENV_CONFIG.showGamification (oberoende av environment). Det som
// FORTFARANDE ska vara uteslutet/avstängt i PROD (Test-läge, poäng,
// mätfacit, experimentellt innehåll) testas separat av tests/validate-prod.mjs
// — den här filen kontrollerar bara att DE flaggorna inte råkat påverkas av
// omskrivningen.
//
// Statisk källkontroll + en riktig PROD-byggning, i linje med
// tests/activity-prototype.test.mjs:s motsvarande tester (1-3). Ingen
// webbläsare krävs.
//
// Körs: node tests/gamification/gamification-dev-prod-isolation.test.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildProd } from "../lib/build-prod.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, "..", "..", "apps", "app");
const BUILD_PROD_PATH = path.resolve(__dirname, "..", "lib", "build-prod.mjs");
const OUT_DIR = path.resolve(__dirname, "..", "..", ".tmp-gam003b-prod-check");

const GAM_FILES = ["gamification-xp-engine.js", "gamification-store.js", "gamification-ui.js", "gamification.js"];
const ACTIVITY_FILES = ["activity-prototype-core.js", "activity-prototype.js"];

let passed = 0, failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

// ── 27. Aktivering styrs ENDAST av showGamification, i båda profilerna ──
{
  const appJs = fs.readFileSync(path.join(APP_DIR, "app.js"), "utf8");
  const envJs = fs.readFileSync(path.join(APP_DIR, "env.js"), "utf8");
  const gatePattern = /ENV_CONFIG\.showGamification\)\s*\{[\s\S]{0,400}gamification-xp-engine/;
  check("27a. app.js injicerar gamification-skripten styrt av ENV_CONFIG.showGamification, oberoende av environment", gatePattern.test(appJs));
  check("27b. Gaten testar inte längre environment (bara showGamification)", !/ENV_CONFIG\.environment === "development" && ENV_CONFIG\.showGamification/.test(appJs));
  check("27c. env.js (DEV) sätter showGamification: true", /showGamification:\s*true/.test(envJs));
}

// ── 28. v1.5.0: gamification är AKTIVERAT i PROD, resten av PROD-profilen oförändrad ──
{
  const envProdJs = fs.readFileSync(path.join(APP_DIR, "env.prod.js"), "utf8");
  check("28a. env.prod.js sätter showGamification: true (v1.5.0-beslutet)", /showGamification:\s*true/.test(envProdJs));
  check("28b. env.prod.js:s environment är fortfarande \"production\" (oförändrat)", /environment:\s*"production"/.test(envProdJs));
  check("28c. env.prod.js: Test-läge/poäng/facit/experimentellt fortfarande false (oförändrat)",
    /showTestMode:\s*false/.test(envProdJs) && /showScore:\s*false/.test(envProdJs) &&
    /showMeasurementFacit:\s*false/.test(envProdJs) && /showExperimentalContent:\s*false/.test(envProdJs));

  const buildProdSrc = fs.readFileSync(BUILD_PROD_PATH, "utf8");
  const coreFilesMatch = buildProdSrc.match(/for \(const f of \[([^\]]+)\]\)/);
  const coreFilesList = coreFilesMatch ? coreFilesMatch[1] : "";
  check("28d. PROD-byggningens fasta fillista INKLUDERAR samtliga gamification-filer",
    GAM_FILES.every(f => coreFilesList.includes(f)), coreFilesList);
  check("28e. ...och GAM-002:s aktivitetsspårningsfiler", ACTIVITY_FILES.every(f => coreFilesList.includes(f)), coreFilesList);
}

// ── 29. Nivå-UI:t finns nu i PROD (riktig byggning) ──
{
  const { set } = buildProd(OUT_DIR, APP_DIR);
  const distFiles = fs.readdirSync(OUT_DIR);
  check("29a. dist/prod innehåller samtliga gamification-*.js-filer", GAM_FILES.every(f => distFiles.includes(f)), distFiles.join(", "));
  check("29a2. dist/prod innehåller GAM-002:s aktivitetsspårningsfiler", ACTIVITY_FILES.every(f => distFiles.includes(f)), distFiles.join(", "));

  const distIndexHtml = fs.readFileSync(path.join(OUT_DIR, "index.html"), "utf8");
  check("29b. Byggd index.html:s nivåpanel har hidden som statisk standard (visas bara efter att JS renderat den)",
    /id="gamLevelPanel"[^>]*\bhidden\b/.test(distIndexHtml));

  const distEnvJs = fs.readFileSync(path.join(OUT_DIR, "env.js"), "utf8");
  check("29c. Byggd PROD-env.js har showGamification: true", /showGamification:\s*true/.test(distEnvJs));
  check("29d. Byggd PROD-env.js har fortfarande showTestMode/showScore/showMeasurementFacit: false",
    /showTestMode:\s*false/.test(distEnvJs) && /showScore:\s*false/.test(distEnvJs) && /showMeasurementFacit:\s*false/.test(distEnvJs));

  // Städa upp den tillfälliga byggkatalogen.
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  void set;
}

// ── 30. gamification.js:s körtidsgard matchar app.js:s injektionsgate ──
{
  const gamJs = fs.readFileSync(path.join(APP_DIR, "gamification.js"), "utf8");
  check("30a. gamification.js kräver ENV_CONFIG.showGamification (oberoende av environment)",
    /if \(!window\.ENV_CONFIG \|\| !window\.ENV_CONFIG\.showGamification\) return;/.test(gamJs));
  check("30b. Gaten testar inte längre environment", !/window\.ENV_CONFIG\.environment !== "development"/.test(gamJs));

  const activityJs = fs.readFileSync(path.join(APP_DIR, "activity-prototype.js"), "utf8");
  check("30c. activity-prototype.js kräver ENV_CONFIG.showGamification (oberoende av environment)",
    /if \(!window\.ENV_CONFIG \|\| !window\.ENV_CONFIG\.showGamification\) return;/.test(activityJs));
}

// ── 31. URL eller hash kan inte aktivera/inaktivera funktionen i någon profil ──
{
  const allSrc = [...GAM_FILES, ...ACTIVITY_FILES].map(f => fs.readFileSync(path.join(APP_DIR, f), "utf8")).join("\n");
  const appJs = fs.readFileSync(path.join(APP_DIR, "app.js"), "utf8");
  const urlPattern = /location\.(search|hash)|URLSearchParams/;
  check("31a. Ingen gamification-/aktivitetsfil läser URL/hash för att styra funktionen", !urlPattern.test(allSrc));
  // app.js:s ENV_CONFIG-fallback och gamification-gate ska bara referera
  // window.ENV_CONFIG — aldrig location.
  const gateSection = appJs.split("showGamification")[1] || "";
  check("31b. app.js:s gamification-gate läser bara window.ENV_CONFIG, aldrig location", !urlPattern.test(gateSection));
}

// ── 32. prefers-reduced-motion stänger av nivåanimationen (oförändrat, gäller nu båda profilerna) ──
{
  const indexHtml = fs.readFileSync(path.join(APP_DIR, "index.html"), "utf8");
  check("32a. index.html har en @media (prefers-reduced-motion: reduce)-regel som stänger av gam-animationerna",
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]{0,400}gam-levelup-pulse[\s\S]{0,400}\}/.test(indexHtml));

  const uiJs = fs.readFileSync(path.join(APP_DIR, "gamification-ui.js"), "utf8");
  check("32b. gamification-ui.js kontrollerar prefers-reduced-motion innan animationsklasser sätts",
    /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/.test(uiJs) && /prefersReducedMotion\(\)/.test(uiJs));
}

// ── 26. Ingen nätverkstrafik i någon gamification-/aktivitetsfil ──
{
  const allSrc = [...GAM_FILES, ...ACTIVITY_FILES].map(f => fs.readFileSync(path.join(APP_DIR, f), "utf8")).join("\n");
  const networkPattern = /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/;
  check("26. Ingen nätverkstrafik (fetch/XHR/WebSocket/Beacon) i någon gamification-/aktivitetsfil", !networkPattern.test(allSrc));
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
