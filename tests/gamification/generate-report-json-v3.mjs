// GAM-003A.2 — Genererar docs/reports/GAM-003A.2_COMPARISON-GROUPS.json direkt
// från verktygets faktiska beräkningar. Engångsskript, inte del av testsviten.
//
// Körs: node tests/gamification/generate-report-json-v3.mjs

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { XP_RULES_V1, LEVELS_V2 } from "./xp-model.mjs";
import { LP_INVENTORY } from "./lp-inventory.mjs";
import { runCalibration, referenceTest1 } from "./calibrate.mjs";
import { passesUntilMaxLevel } from "./career.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "..", "docs", "reports", "GAM-003A.2_COMPARISON-GROUPS.json");

const ref = referenceTest1();
const singlePass = runCalibration(XP_RULES_V1, LEVELS_V2);
const multiPass = {
  minimal: passesUntilMaxLevel("minimal", LEVELS_V2, 8),
  normal: passesUntilMaxLevel("normal", LEVELS_V2, 8),
  fordjupare: passesUntilMaxLevel("fordjupare", LEVELS_V2, 8),
};

const declaredGroups = {};
for (const lp of LP_INVENTORY) {
  lp.steps.forEach((s, i) => {
    if (s.comparisonGroup) (declaredGroups[s.comparisonGroup] = declaredGroups[s.comparisonGroup] || []).push({ learningPathId: lp.id, stepIndex: i });
  });
}

const report = {
  meta: {
    mission: "GAM-003A.2",
    generatedBy: "tests/gamification/generate-report-json-v3.mjs",
    date: "2026-09-09",
    summary: "Deklarativa jämförelsegrupper (comparisonGroup) implementerade fullt ut i lärstigsdata, app.js-dispatch, GAM-002:s aktivitetsmodell och kalibreringsverktyget.",
  },
  declaredComparisonGroups: declaredGroups,
  xpRules: XP_RULES_V1,
  levelThresholds: LEVELS_V2,
  referenceTest1: {
    learningPath: "proportionalband-forstarkning.v1",
    profile: "normal",
    actualTotalXPNoCheckpoints: ref.totalXPNoCheckpoints,
    byCategory: ref.byCategory,
    comparisonPairXPBefore: 6,
    comparisonPairXPAfter: ref.byCategory.comparisonPair,
  },
  singlePassCalibration: singlePass,
  multiplePassesUntilMaxLevel: multiPass,
  openDecisions: [
    "Ska comparisonGroup kunna spänna över olika lärstigar (inte bara steg inom en lärstig)? Mekanismen stödjer det redan, oprövat.",
    "Bekräfta att comparisonGroups/groupComparisonPairs medvetet INTE ingår i priorState/endState-persistensen (GAM-003A.1) inför GAM-003B:s localStorage-implementation.",
  ],
};

writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log("Skrev", OUT);
