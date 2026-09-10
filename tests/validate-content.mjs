#!/usr/bin/env node
// Fristående valideringsskript för apps/app/content/ — inga beroenden.
// Kontrollerar att catalog.json, scenarier, teorimoduler och lärstigar är
// giltig JSON, att alla filreferenser existerar, och att varje lärstigssteg
// refererar till en scenario/teori-fil som faktiskt laddas av katalogen.
//
// Körs manuellt:
//   node tests/validate-content.mjs                    → validerar catalog.json (DEV)
//   node tests/validate-content.mjs catalog.prod.json   → validerar valfri katalogfil (t.ex. PROD)
//
// PROD-specifika allowlist-krav (exakt fem lärstigar, rätt ordning, inga
// dolda/experimentella scenarier synliga fristående osv.) kontrolleras INTE
// här — se tests/validate-prod.mjs.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "apps", "app", "content");
const CATALOG_FILE = process.argv[2] || "catalog.json";

let errors = [];
let warnings = [];

function readJson(relPath) {
  const full = path.join(CONTENT_DIR, relPath);
  if (!existsSync(full)) {
    errors.push(`Saknad fil: ${relPath}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(full, "utf8"));
  } catch (e) {
    errors.push(`Ogiltig JSON i ${relPath}: ${e.message}`);
    return null;
  }
}

const catalog = readJson(CATALOG_FILE);
if (!catalog) {
  console.error(`${CATALOG_FILE} kunde inte läsas — avbryter.`);
  process.exit(1);
}

// Bygg samma uppslagstabeller som app.js loadCatalog() gör:
// nyckel = filnamnets sista segment (entry.file.split('/').pop())
const SCENARIOS = {};
const THEORY = {};
const LEARNING_PATHS = {};

for (const entry of catalog.scenarios) {
  const data = readJson(entry.file);
  if (data) SCENARIOS[entry.file.split("/").pop()] = data;
}
for (const entry of catalog.theory) {
  const data = readJson(entry.file);
  if (data) THEORY[entry.file.split("/").pop()] = data;
}
for (const entry of catalog.learning_paths) {
  const data = readJson(entry.file);
  if (data) LEARNING_PATHS[entry.id] = data;
}

// help.json
readJson(catalog.help);

// Kontrollera dubbletter av id i catalog.json
function checkDupeIds(list, label) {
  const seen = new Set();
  for (const entry of list) {
    if (seen.has(entry.id)) errors.push(`Dubblett-id i ${CATALOG_FILE} (${label}): ${entry.id}`);
    seen.add(entry.id);
  }
}
checkDupeIds(catalog.scenarios, "scenarios");
checkDupeIds(catalog.theory, "theory");
checkDupeIds(catalog.learning_paths, "learning_paths");

// GAM-003A.2: comparisonGroup → antal steg som deklarerar varje grupp-ID
// (globalt över alla lärstigar, eftersom PM:s spec tillåter att samma
// grupp-ID delas mellan lärstigar). En grupp med bara ETT steg kan aldrig
// bilda ett jämförelsepar — sannolikt en felstavning eller ett bortglömt
// andra steg.
const comparisonGroupStepCounts = new Map();

// Kontrollera varje lärstigs steg
for (const [pathId, pathData] of Object.entries(LEARNING_PATHS)) {
  if (!pathData.steps || !Array.isArray(pathData.steps) || pathData.steps.length === 0) {
    errors.push(`Lärstig ${pathId}: inga steg definierade`);
    continue;
  }
  if (pathData.id !== pathId) {
    warnings.push(`Lärstig ${pathId}: internt "id"-fält (${pathData.id}) matchar inte catalog-id`);
  }
  pathData.steps.forEach((step, i) => {
    const stepLabel = `${pathId} steg ${i + 1} ("${step.title || "utan titel"}")`;
    if (step.type === "theory") {
      if (!THEORY[step.ref]) errors.push(`${stepLabel}: teorireferens saknas: ${step.ref}`);
    } else if (step.type === "scenario") {
      if (!SCENARIOS[step.ref]) errors.push(`${stepLabel}: scenarioreferens saknas: ${step.ref}`);
    } else {
      warnings.push(`${stepLabel}: okänd steg-typ "${step.type}"`);
    }
    if (step.checkpoint) {
      const cp = step.checkpoint;
      if (!Array.isArray(cp.options) || cp.options.length < 2) {
        errors.push(`${stepLabel}: checkpoint har för få alternativ`);
      }
      if (typeof cp.correct !== "number" || cp.correct < 0 || cp.correct >= (cp.options || []).length) {
        errors.push(`${stepLabel}: checkpoint.correct pekar utanför options`);
      }
    }
    // GAM-003A.2 — comparisonGroup: valfritt fält, men om det finns ska det
    // vara en icke-tom sträng. Bara "scenario"-steg deltar i jämförelser
    // (attempts/distinkta konfigurationer existerar inte för teoristeg).
    if (step.comparisonGroup !== undefined) {
      if (typeof step.comparisonGroup !== "string" || step.comparisonGroup.trim() === "") {
        errors.push(`${stepLabel}: comparisonGroup måste vara en icke-tom sträng`);
      } else {
        if (step.type !== "scenario") {
          warnings.push(`${stepLabel}: comparisonGroup satt på ett "${step.type}"-steg — bara scenario-steg kan bilda jämförelsepar`);
        }
        comparisonGroupStepCounts.set(step.comparisonGroup, (comparisonGroupStepCounts.get(step.comparisonGroup) || 0) + 1);
      }
    }
  });
}

// GAM-003A.2 — en comparisonGroup med bara ETT steg kan aldrig bilda ett
// jämförelsepar (kräver minst två genomförda försök i gruppen).
for (const [groupId, count] of comparisonGroupStepCounts.entries()) {
  if (count < 2) {
    warnings.push(`comparisonGroup "${groupId}" används av bara ${count} steg — kan aldrig bilda ett jämförelsepar. Felstavning eller bortglömt andra steg?`);
  }
}

console.log(`Katalog: ${CATALOG_FILE}`);
console.log(`Scenarier: ${Object.keys(SCENARIOS).length}/${catalog.scenarios.length} laddade`);
console.log(`Teorimoduler: ${Object.keys(THEORY).length}/${catalog.theory.length} laddade`);
console.log(`Lärstigar: ${Object.keys(LEARNING_PATHS).length}/${catalog.learning_paths.length} laddade`);
console.log(`Lärstigsordning: ${catalog.learning_paths.map(p => p.id).join(" → ")}`);

if (warnings.length) {
  console.log("\nVarningar:");
  warnings.forEach(w => console.log("  ⚠ " + w));
}

if (errors.length) {
  console.log("\nFel:");
  errors.forEach(e => console.log("  ✗ " + e));
  console.log(`\n${errors.length} fel hittades.`);
  process.exit(1);
} else {
  console.log("\n✓ Inga referensfel hittades.");
}
