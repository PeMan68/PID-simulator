#!/usr/bin/env node
// PROD-001B — allowlist-validering av content/catalog.prod.json och
// apps/app/env.prod.js. Kompletterar validate-content.mjs (som bara
// kontrollerar att referenser inte är trasiga) med de produktionsspecifika
// kraven: rätt antal, rätt ordning, inget dolt eller experimentellt läcker
// in, Test-läge/poäng är avstängt.
//
// Körs manuellt: node tests/validate-prod.mjs

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(__dirname, "..", "apps", "app");
const CONTENT_DIR = path.join(APP_DIR, "content");

const errors = [];
const warnings = [];

function readJson(dir, relPath) {
  const full = path.join(dir, relPath);
  if (!existsSync(full)) { errors.push(`Saknad fil: ${relPath}`); return null; }
  return JSON.parse(readFileSync(full, "utf8"));
}

// PO/PM:s beslutade produktionsurval (PROD-001B, DEL 1) — facit denna
// validering kontrollerar mot. Ändras ENDAST efter ett nytt PO/PM-beslut.
const EXPECTED_LEARNING_PATHS = [
  "kom-igång.v1",
  "oppen-slinga-onoff-p.v1",
  "proportionalband-forstarkning.v1",
  "pi-pid.v1",
  "processbegransningar.v1"
];
const HIDDEN_LEARNING_PATHS = [
  "windup-antiwindup.v1",
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

// ── 1. Exakt de fem godkända lärstigarna, i rätt ordning ──
const actualIds = catalog.learning_paths.map(p => p.id);
if (JSON.stringify(actualIds) !== JSON.stringify(EXPECTED_LEARNING_PATHS)) {
  errors.push(
    `catalog.prod.json:learning_paths matchar inte det beslutade urvalet.\n` +
    `    Förväntat: ${EXPECTED_LEARNING_PATHS.join(", ")}\n` +
    `    Faktiskt:  ${actualIds.join(", ")}`
  );
}
if (actualIds.length !== 5) errors.push(`catalog.prod.json innehåller ${actualIds.length} lärstigar, förväntat exakt 5.`);

// ── 2. Inga dolda lärstigar läcker in ──
for (const hiddenId of HIDDEN_LEARNING_PATHS) {
  if (actualIds.includes(hiddenId)) errors.push(`Dold lärstig "${hiddenId}" finns i catalog.prod.json — ska inte visas i PROD.`);
}

// ── 3. Alla scenario-/teoriberoenden för de fem lärstigarna finns med ──
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
