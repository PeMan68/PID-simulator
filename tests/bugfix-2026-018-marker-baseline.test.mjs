// Bugg 2026-018 — Spurios "X ändrad"-markering vid första steget.
//
// Markeringsbaslinjen togs på scenariofilens RÅA form, men varje Stega/Kör-
// klick jämför mot den NORMALISERADE form som syncParamsFromUI() skriver
// (kff/auxGain/gainSchedule/nonlinearGain alltid explicita, Ti/Td nollade i
// OnOff/P/Manuell). Resultat: en falsk markering vid första steget på alla 39
// scenarier, och en falsk "SP x→y" efter Återställ/Rensa på kvotscenarierna.
//
// Fix: normalizeAndCaptureMarkerBaseline() i app.js synkar (utan föregående
// baslinje) och tar sedan baslinjen. Beteendet verifierades i headless Edge
// över samtliga scenarier och lärstigar (0 falska markeringar, identiska
// PV-kurvor före/efter). Detta test låser källkodsstrukturen, i linje med
// övriga app.js-tester (se tests/feat-048-kvotreglering.test.mjs avsnitt 9).
//
// Körs: node tests/bugfix-2026-018-marker-baseline.test.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appJs = readFileSync(path.join(__dirname, "..", "apps", "app", "app.js"), "utf8");

let failed = 0;
let passed = 0;
function check(name, condition, detail) {
  if (condition) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

function functionBody(name) {
  const start = appJs.indexOf(`function ${name}(`);
  if (start < 0) return "";
  let depth = 0, i = appJs.indexOf("{", start);
  for (let j = i; j < appJs.length; j++) {
    if (appJs[j] === "{") depth++;
    else if (appJs[j] === "}" && --depth === 0) return appJs.slice(i, j + 1);
  }
  return "";
}
function handlerBody(id) {
  const line = appJs.split("\n").find(l => l.includes(`getElementById("${id}").addEventListener("click"`));
  return line || "";
}

// ── 1. Helpern nollar baslinjen FÖRE synken och tar den EFTER ──
{
  const body = functionBody("normalizeAndCaptureMarkerBaseline");
  check("1a. normalizeAndCaptureMarkerBaseline() finns", body.length > 0);
  const iNull = body.indexOf("lastMarkerSnapshot = null");
  const iSync = body.indexOf("syncParamsFromUI()");
  const iCap = body.indexOf("captureMarkerBaseline()");
  check("1b. ordning: null → syncParamsFromUI() → captureMarkerBaseline()",
    iNull >= 0 && iSync > iNull && iCap > iSync, `null@${iNull} sync@${iSync} capture@${iCap}`);
}

// ── 2. loadScenarioByName() tar baslinjen SIST, efter alla fältjusteringar ──
{
  const body = functionBody("loadScenarioByName");
  const iNorm = body.indexOf("normalizeAndCaptureMarkerBaseline()");
  check("2a. loadScenarioByName() anropar normalizeAndCaptureMarkerBaseline()", iNorm >= 0);
  check("2b. ingen rå captureMarkerBaseline() kvar i loadScenarioByName()",
    !/[^A-Za-z]captureMarkerBaseline\(\)/.test(body.replace(/normalizeAndCaptureMarkerBaseline\(\)/g, "")));
  for (const dep of ["applyApplicationProfile()", "updateControllerUIState()", "applyPathVisibilityOverride()"]) {
    const iDep = body.lastIndexOf(dep);
    check(`2c. baslinjen tas efter ${dep}`, iDep >= 0 && iNorm > iDep, `${dep}@${iDep} norm@${iNorm}`);
  }
}

// ── 3. Återställ system / Rensa graf tar normaliserad baslinje ──
for (const id of ["systemReset", "clearChart"]) {
  const line = handlerBody(id);
  check(`3. #${id} använder normalizeAndCaptureMarkerBaseline()`,
    line.includes("normalizeAndCaptureMarkerBaseline()") && !/[^A-Za-z]captureMarkerBaseline\(\)/.test(line.replace(/normalizeAndCaptureMarkerBaseline\(\)/g, "")));
}

// ── 4. Startladdningens tillämpningsbyte (initUI) markeras inte ──
{
  const body = functionBody("initUI");
  check("4. initUI() tar om baslinjen efter startprofilbytet", body.includes("normalizeAndCaptureMarkerBaseline()"));
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed) process.exit(1);
