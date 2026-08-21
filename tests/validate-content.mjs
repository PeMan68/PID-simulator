#!/usr/bin/env node
// Fristående valideringsskript för apps/app/content/ — inga beroenden.
// Kontrollerar att catalog.json, scenarier, teorimoduler och lärstigar är
// giltig JSON, att alla filreferenser existerar, och att varje lärstigssteg
// refererar till en scenario/teori-fil som faktiskt laddas av catalog.json.
//
// Körs manuellt: node tests/validate-content.mjs

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "apps", "app", "content");

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

const catalog = readJson("catalog.json");
if (!catalog) {
  console.error("catalog.json kunde inte läsas — avbryter.");
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
    if (seen.has(entry.id)) errors.push(`Dubblett-id i catalog.json (${label}): ${entry.id}`);
    seen.add(entry.id);
  }
}
checkDupeIds(catalog.scenarios, "scenarios");
checkDupeIds(catalog.theory, "theory");
checkDupeIds(catalog.learning_paths, "learning_paths");

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
  });
}

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
