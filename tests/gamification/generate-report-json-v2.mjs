// GAM-003A.1 — Genererar docs/reports/GAM-003A.1_XP-KALIBRERING-REPETITION.json
// direkt från verktygets faktiska beräkningar. Engångsskript, inte del av
// testsviten.
//
// Körs: node tests/gamification/generate-report-json-v2.mjs

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { XP_RULES_V1, LEVELS_V1, LEVELS_V2 } from "./xp-model.mjs";
import { LP_INVENTORY } from "./lp-inventory.mjs";
import { runCalibration, referenceTest1 } from "./calibrate.mjs";
import { runManipulationTests } from "./manipulation.mjs";
import { runRepeatedLearningPath, runMultiplePasses, passesUntilMaxLevel } from "./career.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "..", "docs", "reports", "GAM-003A.1_XP-KALIBRERING-REPETITION.json");

const ref = referenceTest1();
const singlePass = runCalibration(XP_RULES_V1, LEVELS_V2);

const repeatedSelected = {};
for (const id of ["proportionalband-forstarkning.v1", "storningar-robusthet.v1"]) {
  const lp = LP_INVENTORY.find(l => l.id === id);
  repeatedSelected[id] = runRepeatedLearningPath(lp, "normal", 3).perRun;
}

const multiPass = {
  minimal: passesUntilMaxLevel("minimal", LEVELS_V2, 8),
  normal: passesUntilMaxLevel("normal", LEVELS_V2, 8),
  fordjupare: passesUntilMaxLevel("fordjupare", LEVELS_V2, 8),
};

const manipulation = runManipulationTests();

const report = {
  meta: {
    mission: "GAM-003A.1",
    supersedes: "GAM-003A (samma XP-regler, motorbuggar rättade, ny nivåkurva, ny tolkning av repetition)",
    generatedBy: "tests/gamification/generate-report-json-v2.mjs",
    date: "2026-09-09",
    engineFixes: [
      "Ett pågående försök vid sekvensens slut finaliseras nu automatiskt (annars gick sista försökets XP förlorad).",
      "completedLearningPath är nu repeterbar per session, frikopplad från den bestående newHighestStep/completed-flaggan i GAM-002.",
    ],
  },
  xpRules: XP_RULES_V1,
  levelThresholds: { original: LEVELS_V1, revised: LEVELS_V2 },
  referenceTest1: {
    learningPath: "proportionalband-forstarkning.v1",
    profile: "normal",
    actualTotalXPNoCheckpoints: ref.totalXPNoCheckpoints,
    byCategory: ref.byCategory,
  },
  singlePassCalibration: singlePass,
  repeatedSelectedLearningPaths: repeatedSelected,
  multiplePassesUntilMaxLevel: multiPass,
  manipulationTestsReinterpreted: manipulation,
  openDecisions: [
    "Är takten till nivå 8 (2/4/6 fulla genomgångar) rimlig, eller ska toppnivåerna justeras ytterligare?",
    "comparisonGroup-fält i lärstigsformatet — när och hur införs det?",
    "Persistensformat (localStorage antaget, inte uttryckligen beslutat) för GAM-003B.",
  ],
};

writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log("Skrev", OUT);
