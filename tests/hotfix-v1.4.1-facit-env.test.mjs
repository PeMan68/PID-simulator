// HOTFIX-v1.4.1 — Automatiska regressionstester för miljöstyrningen av
// tangentlinjens facit ("Visa tangentlinje" + "Visa facit"-knappen/K-T-L-
// tabellen). Rent statisk kontroll (källfiler + byggda dist/-artifakter,
// ingen webbläsare) — komplement till den manuella/Playwright-verifieringen
// av själva UI-beteendet (dold kontroll, marköravläsning, zoom, inga
// konsolfel), som denna testfil inte kan täcka.
//
// Egen enkel testrunner, i linje med tests/build-preview.test.mjs.
//
// Körs (i denna ordning — kräver byggda dist/dev och dist/prod):
//   node tests/build-preview.mjs dev
//   node tests/build-preview.mjs prod
//   node tests/hotfix-v1.4.1-facit-env.test.mjs

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const APP_DIR = path.join(ROOT, "apps", "app");
const DIST_DEV_DIR = path.join(ROOT, "dist", "dev");
const DIST_PROD_DIR = path.join(ROOT, "dist", "prod");

let failed = 0;
let passed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`OK   ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name}${detail ? " — " + detail : ""}`);
  }
}

function loadEnvConfig(file) {
  if (!existsSync(file)) return null;
  const sandbox = {};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(file, "utf8"), sandbox);
  return sandbox.ENV_CONFIG || null;
}

// ── 1. Källfiler: rätt flagga i respektive profil ──
{
  const dev = loadEnvConfig(path.join(APP_DIR, "env.js"));
  check("1a. apps/app/env.js (DEV): showMeasurementFacit === true", !!dev && dev.showMeasurementFacit === true);

  const prod = loadEnvConfig(path.join(APP_DIR, "env.prod.js"));
  check("1b. apps/app/env.prod.js (PROD-mall): showMeasurementFacit === false", !!prod && prod.showMeasurementFacit === false);
}

// ── 2. Defense-in-depth: app.js spärrar aktivering oavsett DOM-tillstånd ──
{
  const appJs = readFileSync(path.join(APP_DIR, "app.js"), "utf8");
  check(
    "2a. drawChart(): tangentlinjens facit gated på ENV_CONFIG.showMeasurementFacit",
    /ENV_CONFIG\.showMeasurementFacit\s*&&\s*document\.getElementById\("mpTangent"\)\.checked/.test(appJs)
  );
  check(
    "2b. btnFacit-klick: tidigt return om ENV_CONFIG.showMeasurementFacit är false",
    /getElementById\("btnFacit"\)\.addEventListener\("click", \(\) => \{\s*\n\s*if \(!ENV_CONFIG\.showMeasurementFacit\) return;/.test(appJs)
  );
  check(
    "2c. Fallback-ENV_CONFIG (om env.js saknas) inkluderar showMeasurementFacit: true",
    /showMeasurementFacit: true,?\s*catalogFile: "catalog\.json"/.test(appJs) || /showExperimentalContent: true, showMeasurementFacit: true/.test(appJs)
  );
}

// ── 3. index.html: kontrollerna har de krokar applyEnvironmentUI() behöver ──
{
  const html = readFileSync(path.join(APP_DIR, "index.html"), "utf8");
  check("3a. #mpTangentField finns (döljbar wrapper runt tangentlinje-kryssrutan)", html.includes('id="mpTangentField"'));
  check("3b. #measureGroupFacit finns (döljbar wrapper runt \"Visa facit\"-knappen)", html.includes('id="measureGroupFacit"'));
  check("3c. #measureSepFacit finns (döljbar separator — lämnar ingen trasig kontrollgrupp)", html.includes('id="measureSepFacit"'));
}

// ── 4. Byggda artifakter (kräver att build-preview.mjs körts för både dev och prod) ──
if (!existsSync(DIST_DEV_DIR) || !existsSync(DIST_PROD_DIR)) {
  console.log(
    "\n⚠ dist/dev och/eller dist/prod saknas — hoppar över artifaktkontrollerna (4).\n" +
    "  Kör 'node tests/build-preview.mjs dev' och 'node tests/build-preview.mjs prod' först."
  );
} else {
  const devEnv = loadEnvConfig(path.join(DIST_DEV_DIR, "env.js"));
  check("4a. dist/dev/env.js: showMeasurementFacit === true", !!devEnv && devEnv.showMeasurementFacit === true);

  const prodEnv = loadEnvConfig(path.join(DIST_PROD_DIR, "env.js"));
  check("4b. dist/prod/env.js: showMeasurementFacit === false", !!prodEnv && prodEnv.showMeasurementFacit === false);

  // GAM-002 finns bara i develop idag (inte i denna branch), men skyddet ska ändå
  // gälla oavsett källträd — se samma kontroll i tests/validate-prod.mjs.
  for (const gamFile of ["activity-prototype-core.js", "activity-prototype.js"]) {
    check(`4c. dist/prod/${gamFile} finns inte`, !existsSync(path.join(DIST_PROD_DIR, gamFile)));
  }
  // I DEV ska GAM-002-filerna finnas OM de finns i källträdet (apps/app/) — annars
  // är kontrollen inte tillämplig (t.ex. på en branch grenad från main).
  for (const gamFile of ["activity-prototype-core.js", "activity-prototype.js"]) {
    const inSource = existsSync(path.join(APP_DIR, gamFile));
    if (inSource) {
      check(`4d. dist/dev/${gamFile} finns (GAM-002 källfil fanns)`, existsSync(path.join(DIST_DEV_DIR, gamFile)));
    } else {
      console.log(`i    4d. ${gamFile} finns inte i apps/app/ på denna branch — hoppar över (ej tillämpligt).`);
    }
  }
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
