// GAM-003B — DEV/PROD-isolering för den synliga XP-/nivåprototypen.
// Statisk källkontroll + en riktig PROD-byggning, i linje med
// tests/activity-prototype.test.mjs:s motsvarande tester (1-3, 28-30) för
// GAM-002. Ingen webbläsare krävs.
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

let passed = 0, failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

// ── 27. Gamification laddas i DEV ──
{
  const appJs = fs.readFileSync(path.join(APP_DIR, "app.js"), "utf8");
  const envJs = fs.readFileSync(path.join(APP_DIR, "env.js"), "utf8");
  const gatePattern = /ENV_CONFIG\.environment === "development" && ENV_CONFIG\.showGamification\)\s*\{[\s\S]{0,400}gamification-xp-engine/;
  check("27a. app.js injicerar gamification-skripten bara när environment===development OCH showGamification", gatePattern.test(appJs));
  check("27b. env.js (DEV) sätter showGamification: true", /showGamification:\s*true/.test(envJs));
}

// ── 28. Gamification laddas inte i PROD ──
{
  const envProdJs = fs.readFileSync(path.join(APP_DIR, "env.prod.js"), "utf8");
  check("28a. env.prod.js sätter showGamification: false", /showGamification:\s*false/.test(envProdJs));

  const buildProdSrc = fs.readFileSync(BUILD_PROD_PATH, "utf8");
  const coreFilesMatch = buildProdSrc.match(/for \(const f of \[([^\]]+)\]\)/);
  const coreFilesList = coreFilesMatch ? coreFilesMatch[1] : "";
  check("28b. PROD-byggningens fasta fillista innehåller INGEN gamification-fil",
    GAM_FILES.every(f => !coreFilesList.includes(f)), coreFilesList);
}

// ── 29. Ingen nivå-UI finns i PROD (riktig byggning) ──
{
  const { set } = buildProd(OUT_DIR, APP_DIR);
  const distFiles = fs.readdirSync(OUT_DIR);
  check("29a. dist/prod innehåller ingen gamification-*.js-fil", GAM_FILES.every(f => !distFiles.includes(f)), distFiles.join(", "));

  const distIndexHtml = fs.readFileSync(path.join(OUT_DIR, "index.html"), "utf8");
  check("29b. Byggd index.html:s nivåpanel har hidden som standard (ingen JS kan slå på den i PROD)",
    /id="gamLevelPanel"[^>]*\bhidden\b/.test(distIndexHtml));

  const distEnvJs = fs.readFileSync(path.join(OUT_DIR, "env.js"), "utf8");
  check("29c. Byggd PROD-env.js har showGamification: false", /showGamification:\s*false/.test(distEnvJs));

  // Städa upp den tillfälliga byggkatalogen.
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  void set;
}

// ── 30. Ingen localStorage-åtkomst för gamification sker i PROD ──
// (Följer strukturellt av 28b/29a — filerna som rör localStorage begärs
// aldrig över nätverket i PROD. Kompletteras här med en körtidsgard: även
// OM gamification.js av misstag skulle laddas någon annanstans ska den
// vägra köra utan explicit showGamification===true.)
{
  const gamJs = fs.readFileSync(path.join(APP_DIR, "gamification.js"), "utf8");
  check("30. gamification.js vägrar köra utan ENV_CONFIG.environment===development && showGamification",
    /if \(!window\.ENV_CONFIG \|\| window\.ENV_CONFIG\.environment !== "development" \|\| !window\.ENV_CONFIG\.showGamification\) return;/.test(gamJs));
}

// ── 31. URL eller hash kan inte aktivera funktionen i PROD ──
{
  const allSrc = GAM_FILES.map(f => fs.readFileSync(path.join(APP_DIR, f), "utf8")).join("\n");
  const appJs = fs.readFileSync(path.join(APP_DIR, "app.js"), "utf8");
  const urlPattern = /location\.(search|hash)|URLSearchParams/;
  check("31a. Ingen gamification-fil läser URL/hash för att styra funktionen", !urlPattern.test(allSrc));
  // app.js:s ENV_CONFIG-fallback och gamification-gate ska bara referera
  // window.ENV_CONFIG — aldrig location.
  const gateSection = appJs.split("GAM-003B")[1] || "";
  check("31b. app.js:s GAM-003B-gate läser bara window.ENV_CONFIG, aldrig location", !urlPattern.test(gateSection));
}

// ── 32. prefers-reduced-motion stänger av nivåanimationen ──
{
  const indexHtml = fs.readFileSync(path.join(APP_DIR, "index.html"), "utf8");
  check("32a. index.html har en @media (prefers-reduced-motion: reduce)-regel som stänger av gam-animationerna",
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]{0,400}gam-levelup-pulse[\s\S]{0,400}\}/.test(indexHtml));

  const uiJs = fs.readFileSync(path.join(APP_DIR, "gamification-ui.js"), "utf8");
  check("32b. gamification-ui.js kontrollerar prefers-reduced-motion innan animationsklasser sätts",
    /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/.test(uiJs) && /prefersReducedMotion\(\)/.test(uiJs));
}

// ── 26. Ingen nätverkstrafik i någon gamification-fil ──
{
  const allSrc = GAM_FILES.map(f => fs.readFileSync(path.join(APP_DIR, f), "utf8")).join("\n");
  const networkPattern = /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/;
  check("26. Ingen nätverkstrafik (fetch/XHR/WebSocket/Beacon) i någon gamification-fil", !networkPattern.test(allSrc));
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
