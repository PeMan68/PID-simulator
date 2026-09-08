// GAM-003A — Genererar docs/reports/GAM-003A_XP-KALIBRERING.json direkt
// från verktygets faktiska beräkningar (inga handskrivna siffror i JSON-
// filen). Körs som ett engångsskript, inte en del av testsviten.
//
// Körs: node tests/gamification/generate-report-json.mjs

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { XP_RULES_V1, LEVELS_V1, LEVELS_FAST, LEVELS_SLOW } from "./xp-model.mjs";
import { LP_INVENTORY } from "./lp-inventory.mjs";
import { runCalibration, referenceTest1 } from "./calibrate.mjs";
import { runManipulationTests } from "./manipulation.mjs";
import { helpAlternatives, singleStepAlternatives, measurementAlternatives, levelCurveComparison } from "./sensitivity.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "..", "docs", "reports", "GAM-003A_XP-KALIBRERING.json");

const RECOMMENDED_RULES = Object.assign({}, XP_RULES_V1, { helpCapPerSession: 5, singleStepCapPerAttempt: 3 });

const mainCalibration = runCalibration(XP_RULES_V1, LEVELS_V1);
const recommendedCalibration = runCalibration(RECOMMENDED_RULES, LEVELS_SLOW);
const ref = referenceTest1();
const manipulation = runManipulationTests();

const report = {
  meta: {
    mission: "GAM-003A",
    generatedBy: "tests/gamification/generate-report-json.mjs",
    date: "2026-09-08",
    note: "Maskinläsbart underlag till docs/reports/GAM-003A_XP-KALIBRERING.md. Laddas aldrig av appen.",
  },
  xpRules: {
    original: XP_RULES_V1,
    recommended: RECOMMENDED_RULES,
  },
  levelThresholds: {
    huvudkandidat: LEVELS_V1,
    snabbare: LEVELS_FAST,
    langsammare: LEVELS_SLOW,
  },
  lpInventory: LP_INVENTORY,
  referenceTest1: {
    learningPath: "proportionalband-forstarkning.v1",
    profile: "normal",
    expectedRangeXP: [75, 79],
    actualTotalXPNoCheckpoints: ref.totalXPNoCheckpoints,
    byCategory: ref.byCategory,
  },
  calibration: {
    original: mainCalibration,
    recommended: recommendedCalibration,
  },
  manipulationTests: manipulation,
  sensitivity: {
    help: helpAlternatives(),
    singleStep: singleStepAlternatives(),
    measurement: measurementAlternatives(),
    levelCurves: levelCurveComparison(),
  },
  recommendation: {
    helpCapPerSession: 5,
    singleStepCapPerAttempt: 3,
    levelCurve: "langsammare",
    checkpointHandling: "separat_prestationssystem_ej_del_av_niva_xp",
    openDecisions: [
      "jämförelser mellan lärsteg/scenario-ID kräver antingen grafmarkeringarna (FEAT-030) eller ett deklarativt fält i lärstigsformatet",
      "nivåkurva och hjälp-/enstegningstak kräver PO/PM-godkännande",
      "checkpoint-XP kräver ett produktbeslut om separat system, väntan, eller borttagning ur scope",
      "5%-farmning (manipulationstest 8) kräver ev. ändring av GAM-002:s distinctConfigRelativeThreshold — utanför GAM-003A:s mandat",
    ],
  },
};

writeFileSync(OUT, JSON.stringify(report, (key, value) => {
  if (value instanceof Map) return Object.fromEntries(value);
  return value;
}, 2));
console.log("Skrev", OUT);
