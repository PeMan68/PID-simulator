// GAM-003A.2 — Fast regressionstest för comparisonGroup-deklarationerna i
// de verkliga lärstigsfilerna. Schema-/typvalidering görs redan av
// tests/validate-content.mjs (körs som en del av standardregressionen och
// verifierar alla 19 deklarationer nedan mot riktigt innehåll); det här
// testet pinnar DE FAKTISKA grupperna så att en oavsiktlig borttagning
// eller ändring av en grupp upptäcks som ett testfel, inte bara tyst.
//
// Körs: node tests/gamification/comparison-groups-content.test.mjs

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXERCISES_DIR = path.resolve(__dirname, "..", "..", "apps", "app", "content", "exercises");

let passed = 0, failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

function loadSteps(file) {
  return JSON.parse(readFileSync(path.join(EXERCISES_DIR, file), "utf8")).steps;
}

function groupsIn(steps) {
  const groups = {};
  steps.forEach((s, i) => {
    if (s.comparisonGroup) (groups[s.comparisonGroup] = groups[s.comparisonGroup] || []).push(i);
  });
  return groups;
}

// Förväntad, pinnad karta: fil -> { groupId -> [stegindex (0-baserat)] }
const EXPECTED = {
  "proportionalband-forstarkning.v1.json": {
    "pb-kp-escalation": [1, 2],
    "pb-p-vs-pi": [4, 5],
  },
  "pi-pid.v1.json": {
    "pi-vs-pid": [0, 1, 2],
  },
  "processbegransningar.v1.json": {
    "procbeg-k-comparison": [1, 2],
    "procbeg-deadtime-comparison": [3, 4],
  },
  "windup-antiwindup.v1.json": {
    "windup-antiwindup-comparison": [1, 2],
  },
  "storningar-robusthet.v1.json": {
    "storningar-noise-comparison": [1, 2, 3],
  },
  "lambda-metoden.v1.json": {
    "lambda-comparison": [2, 3, 4],
  },
};

for (const [file, expectedGroups] of Object.entries(EXPECTED)) {
  const steps = loadSteps(file);
  const actualGroups = groupsIn(steps);
  for (const [groupId, expectedIndices] of Object.entries(expectedGroups)) {
    const actual = actualGroups[groupId] || [];
    check(
      `${file}: gruppen "${groupId}" finns på exakt steg ${expectedIndices.join(",")}`,
      JSON.stringify(actual) === JSON.stringify(expectedIndices),
      `fick steg ${JSON.stringify(actual)}`
    );
  }
  // Inga OVÄNTADE grupper i filen (fångar bortglömda borttagningar/tillägg).
  const expectedGroupIds = new Set(Object.keys(expectedGroups));
  const actualGroupIds = new Set(Object.keys(actualGroups));
  check(`${file}: inga oväntade comparisonGroup-ID:n`, [...actualGroupIds].every(g => expectedGroupIds.has(g)), JSON.stringify([...actualGroupIds]));
}

// oppen-slinga-onoff-p.v1 ska INTE ha någon comparisonGroup (ingen uttrycklig
// jämförelseinstruktion mellan dess steg — se GAM-003A.2-rapporten avsnitt om inventering).
{
  const steps = loadSteps("oppen-slinga-onoff-p.v1.json");
  const groups = groupsIn(steps);
  check("oppen-slinga-onoff-p.v1.json: inga comparisonGroup-deklarationer (ingen uttrycklig jämförelse i instruktionerna)", Object.keys(groups).length === 0, JSON.stringify(groups));
}

// Varje deklarerad grupp har minst två medlemmar (samma regel som validate-content.mjs).
for (const [file, expectedGroups] of Object.entries(EXPECTED)) {
  for (const [groupId, indices] of Object.entries(expectedGroups)) {
    check(`${file}: gruppen "${groupId}" har minst två medlemmar`, indices.length >= 2);
  }
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
