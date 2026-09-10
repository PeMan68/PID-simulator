#!/usr/bin/env node
// PROD-001B/HOTFIX-v1.3.1 — allowlist-validering av content/catalog.prod.json,
// apps/app/env.prod.js, OCH (HOTFIX-v1.3.1) den faktiskt byggda dist/prod-
// artifakten. Kompletterar validate-content.mjs (som bara kontrollerar att
// referenser inte är trasiga) med de produktionsspecifika kraven: rätt
// antal, rätt ordning, inget dolt eller experimentellt läcker in, Test-
// läge/poäng är avstängt — och att den byggda artifakten fysiskt bara
// innehåller det som allowlistet tillåter.
//
// Körs manuellt EFTER en PROD-byggning:
//   node tests/build-preview.mjs prod
//   node tests/validate-prod.mjs

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import { deriveProdContentSet } from "./lib/prod-content-set.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const APP_DIR = path.join(ROOT, "apps", "app");
const CONTENT_DIR = path.join(APP_DIR, "content");
const DIST_PROD_DIR = path.join(ROOT, "dist", "prod");

const errors = [];
const warnings = [];

function readJson(dir, relPath) {
  const full = path.join(dir, relPath);
  if (!existsSync(full)) { errors.push(`Saknad fil: ${relPath}`); return null; }
  return JSON.parse(readFileSync(full, "utf8"));
}

// PO/PM:s beslutade produktionsurval (PROD-001B, DEL 1; utökat i
// feature/PROD-enable-windup-antiwindup och v1.5.0) — facit denna
// validering kontrollerar mot. Ändras ENDAST efter ett nytt PO/PM-beslut.
const EXPECTED_LEARNING_PATHS = [
  "kom-igång.v1",
  "oppen-slinga-onoff-p.v1",
  "proportionalband-forstarkning.v1",
  "pi-pid.v1",
  "processbegransningar.v1",
  "windup-antiwindup.v1",
  "storningar-robusthet.v1" // v1.5.0 — FEAT-030, PO-testad och godkänd för PROD
];
const HIDDEN_LEARNING_PATHS = [
  "integrerande-process-niva.v1",
  "stegsvar-identifiering.v1",
  "lambda-metoden.v1"
];
const KNOWN_EXPERIMENTAL_SCENARIOS = [
  "integrating-experimental",
  "unstable-experimental"
];

const catalog = readJson(CONTENT_DIR, "catalog.prod.json");
if (!catalog) { console.error("catalog.prod.json kunde inte läsas — avbryter."); process.exit(1); }

// ── 1. Exakt de godkända lärstigarna, i rätt ordning ──
const actualIds = catalog.learning_paths.map(p => p.id);
if (JSON.stringify(actualIds) !== JSON.stringify(EXPECTED_LEARNING_PATHS)) {
  errors.push(
    `catalog.prod.json:learning_paths matchar inte det beslutade urvalet.\n` +
    `    Förväntat: ${EXPECTED_LEARNING_PATHS.join(", ")}\n` +
    `    Faktiskt:  ${actualIds.join(", ")}`
  );
}
if (actualIds.length !== EXPECTED_LEARNING_PATHS.length) errors.push(`catalog.prod.json innehåller ${actualIds.length} lärstigar, förväntat exakt ${EXPECTED_LEARNING_PATHS.length}.`);

// ── 2. Inga dolda lärstigar läcker in ──
for (const hiddenId of HIDDEN_LEARNING_PATHS) {
  if (actualIds.includes(hiddenId)) errors.push(`Dold lärstig "${hiddenId}" finns i catalog.prod.json — ska inte visas i PROD.`);
}

// ── 3. Alla scenario-/teoriberoenden för de godkända lärstigarna finns med ──
const scenarioIds = new Set(catalog.scenarios.map(s => s.id));
const scenarioFileNames = new Set(catalog.scenarios.map(s => s.file.split("/").pop()));
const theoryFileNames = new Set(catalog.theory.map(t => t.file.split("/").pop()));

for (const entry of catalog.learning_paths) {
  const data = readJson(CONTENT_DIR, entry.file);
  if (!data) continue;
  for (const step of data.steps || []) {
    if (step.type === "scenario" && !scenarioFileNames.has(step.ref)) {
      errors.push(`Lärstig ${entry.id}: scenarioberoende "${step.ref}" saknas i catalog.prod.json.`);
    }
    if (step.type === "theory" && !theoryFileNames.has(step.ref)) {
      errors.push(`Lärstig ${entry.id}: teoriberoende "${step.ref}" saknas i catalog.prod.json.`);
    }
  }
}

// ── 4. Inga experimentella scenarier visas fristående (eller alls) ──
for (const id of KNOWN_EXPERIMENTAL_SCENARIOS) {
  if (scenarioIds.has(id)) errors.push(`Experimentellt scenario "${id}" finns i catalog.prod.json — ska inte finnas i PROD.`);
}

// ── 5. Inga scenarier markerade standalone visas om de inte ska ──
const standaloneScenarios = catalog.scenarios.filter(s => s.standalone !== false).map(s => s.id);
const hiddenStandaloneScenarios = catalog.scenarios.filter(s => s.standalone === false).map(s => s.id);
console.log(`Fristående scenarier i PROD (${standaloneScenarios.length}): ${standaloneScenarios.join(", ")}`);
if (hiddenStandaloneScenarios.length) {
  console.log(`Beroendescenarier dolda från väljaren (${hiddenStandaloneScenarios.length}): ${hiddenStandaloneScenarios.join(", ")}`);
}

// ── 6. env.prod.js: Test-läge och poäng avstängda, rätt katalog ──
const envProdRaw = readFileSync(path.join(APP_DIR, "env.prod.js"), "utf8");
const sandbox = {};
sandbox.window = sandbox; // UMD-inpackningen i env.prod.js letar efter window, annars globalThis
vm.createContext(sandbox);
vm.runInContext(envProdRaw, sandbox);
const envProd = sandbox.ENV_CONFIG;
if (!envProd) {
  errors.push("env.prod.js exponerade inget ENV_CONFIG.");
} else {
  if (envProd.environment !== "production") errors.push(`env.prod.js: environment är "${envProd.environment}", förväntat "production".`);
  if (envProd.showTestMode !== false) errors.push("env.prod.js: showTestMode är inte false — Test-läge är inte avstängt.");
  if (envProd.showScore !== false) errors.push("env.prod.js: showScore är inte false — poängvisning är inte avstängd.");
  if (envProd.showExperimentalContent !== false) errors.push("env.prod.js: showExperimentalContent är inte false.");
  if (envProd.showMeasurementFacit !== false) errors.push("env.prod.js: showMeasurementFacit är inte false — tangentlinjens facit/K-T-L-facit är inte avstängt (HOTFIX-v1.4.1).");
  if (envProd.showGamification !== true) errors.push("env.prod.js: showGamification är inte true — nivåprogressionen (v1.5.0-beslutet) är inte aktiverad i PROD.");
  if (envProd.catalogFile !== "catalog.prod.json") errors.push(`env.prod.js: catalogFile är "${envProd.catalogFile}", förväntat "catalog.prod.json".`);
}

// ── 7. Inga okända ID:n (dubbletter eller referenser utanför facit) ──
const seenLP = new Set();
for (const entry of catalog.learning_paths) {
  if (seenLP.has(entry.id)) errors.push(`Dubblett-lärstig i catalog.prod.json: ${entry.id}`);
  seenLP.add(entry.id);
  if (!EXPECTED_LEARNING_PATHS.includes(entry.id)) errors.push(`Okänd lärstig i catalog.prod.json (utanför det beslutade urvalet): ${entry.id}`);
}

console.log(`\nLärstigar i PROD (${actualIds.length}): ${actualIds.join(" → ")}`);
console.log(`Scenarier i PROD-katalogen totalt: ${catalog.scenarios.length}`);
console.log(`Teorimoduler i PROD-katalogen totalt: ${catalog.theory.length}`);

// ── 8. Den faktiskt byggda dist/prod-artifakten (HOTFIX-v1.3.1) ──
// Fram till v1.3.0 kontrollerade detta skript bara catalog.prod.json — inte
// vad byggsteget faktiskt kopierade. tests/build-preview.mjs kopierade då
// hela apps/app/, så en korrekt katalog gav ingen garanti om artifaktens
// verkliga innehåll. Detta avsnitt granskar dist/prod självt.
if (!existsSync(DIST_PROD_DIR)) {
  errors.push(
    `dist/prod/ hittades inte. Kör "node tests/build-preview.mjs prod" innan ` +
    `validate-prod.mjs — artifakt-kontrollen (avsnitt 8) kräver en byggd artifakt.`
  );
} else {
  const distContentDir = path.join(DIST_PROD_DIR, "content");
  let distSet = null;
  try {
    distSet = deriveProdContentSet(distContentDir);
  } catch (err) {
    errors.push(`dist/prod/content: ${err.message}`);
  }

  // Inga otillåtna toppnivåkataloger (docs/, tests/, handoff-/rapportfiler m.m.)
  for (const forbidden of ["docs", "tests", "reports"]) {
    if (existsSync(path.join(DIST_PROD_DIR, forbidden))) {
      errors.push(`dist/prod/${forbidden}/ finns — utvecklingsfiler ska inte publiceras.`);
    }
  }
  // DEV-katalogen får aldrig finnas i PROD-artifakten.
  if (existsSync(path.join(distContentDir, "catalog.json"))) {
    errors.push("dist/prod/content/catalog.json finns — DEV-katalogen läcker in i PROD-artifakten.");
  }
  // v1.5.0: GAM-002/GAM-003 (aktivitetsspårning + nivåprogression) SKA nu
  // finnas i PROD-artifakten — PO:s beslut 2026-09-10 (se
  // docs/development/GAMIFICATION-XP-PROTOTYPE.md). Denna kontroll skyddar
  // mot regression åt ANDRA hållet: att filerna av misstag saknas.
  for (const gamFile of [
    "activity-prototype-core.js", "activity-prototype.js",
    "gamification-xp-engine.js", "gamification-store.js", "gamification-ui.js", "gamification.js",
  ]) {
    if (!existsSync(path.join(DIST_PROD_DIR, gamFile))) {
      errors.push(`dist/prod/${gamFile} saknas — nivåprogressionen (v1.5.0-beslutet) ska finnas i PROD-artifakten.`);
    }
  }
  if (existsSync(path.join(DIST_PROD_DIR, "env.prod.js"))) {
    errors.push("dist/prod/env.prod.js finns — mallfilen ska inte finnas i den byggda artifakten.");
  }

  // Jämför faktiska filer på disk mot den härledda allowlistet — inga extra,
  // inga saknade.
  function listJsonFiles(subdir) {
    const dir = path.join(distContentDir, subdir);
    if (!existsSync(dir)) return [];
    return readdirSync(dir).filter(f => statSync(path.join(dir, f)).isFile()).map(f => `${subdir}/${f}`);
  }

  if (distSet) {
    const checks = [
      ["exercises", distSet.learningPathFiles],
      ["theory", distSet.theoryFiles],
      ["scenarios", distSet.scenarioFiles],
    ];
    for (const [subdir, expected] of checks) {
      const expectedSet = new Set(expected);
      const actualFiles = listJsonFiles(subdir);
      for (const f of actualFiles) {
        if (!expectedSet.has(f)) {
          errors.push(`dist/prod/content/${f}: okänd innehållsfil — inte del av den härledda PROD-allowlistet.`);
        }
      }
      for (const f of expected) {
        if (!existsSync(path.join(distContentDir, f))) {
          errors.push(`dist/prod/content/${f}: saknas i den byggda artifakten trots att den ska ingå.`);
        }
      }
    }

    // pi-deadtime-comparison: fil finns, men inte i den fristående listan.
    const deadtimeRel = "scenarios/pi-deadtime-comparison.json";
    if (!distSet.scenarioFiles.includes(deadtimeRel)) {
      errors.push("dist/prod: pi-deadtime-comparison.json ingår inte i artifakten — processbegransningar.v1 skulle få en trasig scenarioreferens.");
    }
    if (distSet.standaloneScenarioFiles.includes(deadtimeRel)) {
      errors.push("dist/prod: pi-deadtime-comparison.json är markerad fristående — ska bara vara laddningsbar via lärstigen.");
    }

    // Samtliga kopierade filer ska vara giltig, läsbar JSON.
    for (const [subdir, files] of checks) {
      for (const f of files) {
        const full = path.join(distContentDir, f);
        if (!existsSync(full)) continue; // redan felrapporterad ovan
        try {
          JSON.parse(readFileSync(full, "utf8"));
        } catch (e) {
          errors.push(`dist/prod/content/${f}: ogiltig JSON (${e.message}).`);
        }
      }
    }
  }

  // env.js i artifakten ska vara PROD-profilen.
  const envJsPath = path.join(DIST_PROD_DIR, "env.js");
  if (!existsSync(envJsPath)) {
    errors.push("dist/prod/env.js saknas.");
  } else {
    const sandbox2 = {};
    sandbox2.window = sandbox2;
    vm.createContext(sandbox2);
    vm.runInContext(readFileSync(envJsPath, "utf8"), sandbox2);
    const envBuilt = sandbox2.ENV_CONFIG;
    if (!envBuilt) {
      errors.push("dist/prod/env.js exponerade inget ENV_CONFIG.");
    } else {
      if (envBuilt.environment !== "production") errors.push(`dist/prod/env.js: environment är "${envBuilt.environment}", förväntat "production".`);
      if (envBuilt.showTestMode !== false) errors.push("dist/prod/env.js: Test-läge är inte avstängt i den byggda artifakten.");
      if (envBuilt.showScore !== false) errors.push("dist/prod/env.js: poäng är inte avstängt i den byggda artifakten.");
      if (envBuilt.showMeasurementFacit !== false) errors.push("dist/prod/env.js: showMeasurementFacit är inte false i den byggda artifakten — tangentfacit inte avstängt (HOTFIX-v1.4.1).");
      if (envBuilt.showGamification !== true) errors.push("dist/prod/env.js: showGamification är inte true i den byggda artifakten — nivåprogressionen (v1.5.0-beslutet) är inte aktiverad.");
    }
  }

  if (!errors.some(e => e.includes("dist/prod"))) {
    console.log(`\n✓ dist/prod-artifakten innehåller exakt den härledda allowlistet — inga dolda filer, ingen DEV-katalog.`);
  }
}

if (warnings.length) {
  console.log("\nVarningar:");
  warnings.forEach(w => console.log("  ⚠ " + w));
}

if (errors.length) {
  console.log("\nFel:");
  errors.forEach(e => console.log("  ✗ " + e));
  console.log(`\n${errors.length} fel hittades — PROD-urvalet är INTE valitt.`);
  process.exit(1);
} else {
  console.log("\n✓ PROD-urvalet matchar det beslutade allowlist-urvalet. Test-läge och poäng avstängda.");
}
