// GAM-003A — DEL 9/10/11/13: känslighetsanalys av alternativa regler för
// hjälp-XP, enstegnings-XP, mätarbets-XP och nivåkurvor.
//
// Körs: node tests/gamification/sensitivity.mjs [--json]

import { computeXP, XP_RULES_V1, LEVELS_V1, LEVELS_FAST, LEVELS_SLOW } from "./xp-model.mjs";
import { runManipulationTests } from "./manipulation.mjs";
import { runCalibration, referenceTest1 } from "./calibrate.mjs";

function allHelpEvents(n) {
  return Array.from({ length: n }, (_, i) => ({ type: "help_opened", meta: { helpId: "h" + i } }));
}

// ── DEL 9: hjälp-XP-alternativ ──
// Variant A/B/C uttrycks som helpCapPerSession (i ANTAL unika hjälptexter
// som ger XP, inte XP-summa) plus uniqueHelp-värdet.
export function helpAlternatives() {
  const scenarios = {
    normal: allHelpEvents(3),
    hög: allHelpEvents(8),
    alla24: allHelpEvents(24),
  };
  const variants = {
    A_2xp_inget_tak: { uniqueHelp: 2, helpCapPerSession: Infinity },
    B_2xp_tak5unika: { uniqueHelp: 2, helpCapPerSession: 5 }, // ⇒ högst 10 XP/session
    C_1xp_tak12unika: { uniqueHelp: 1, helpCapPerSession: 12 }, // ⇒ högst 12 XP/session
  };
  const out = {};
  for (const [vName, vRule] of Object.entries(variants)) {
    out[vName] = {};
    const rules = Object.assign({}, XP_RULES_V1, vRule);
    for (const [sName, events] of Object.entries(scenarios)) {
      out[vName][sName] = computeXP(events, rules).totalXPNoCheckpoints;
    }
  }
  return out;
  // D (kräver genomfört försök i samma session) diskuteras kvalitativt i
  // rapporten — kräver en sessionsomfattande efterhandskontroll som inte är
  // en ren XP-per-händelse-regel, och provräknas därför inte som en isolerad
  // variant här.
}

// ── DEL 10: enstegnings-XP-alternativ ──
function singleStepSequence(n) {
  return [
    { type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: "c" } },
    ...Array.from({ length: n }, () => ({ type: "simulation_step", meta: { contextKey: "c" } })),
    { type: "system_reset", meta: { contextKey: "c" } },
  ];
}
export function singleStepAlternatives() {
  const counts = [3, 5, 8, 20];
  const out = {};
  // A: 1xp, tak 5 (nuvarande)
  out.A_tak5 = {};
  counts.forEach(n => { out.A_tak5[n] = computeXP(singleStepSequence(n), Object.assign({}, XP_RULES_V1, { singleStepCapPerAttempt: 5 })).byCategory.singleStep; });
  // B: 1xp, tak 3
  out.B_tak3 = {};
  counts.forEach(n => { out.B_tak3[n] = computeXP(singleStepSequence(n), Object.assign({}, XP_RULES_V1, { singleStepCapPerAttempt: 3 })).byCategory.singleStep; });
  // C och D beskrivs kvalitativt (kräver en annan regelform än "XP per
  // händelse med tak" — en engångsbonus resp. ingen egen kategori alls,
  // se rapporten DEL 10).
  return out;
}

// ── DEL 11: mätarbets-XP-alternativ ──
function measurementSequence(adjustCount) {
  const events = [
    { type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: "c" } },
    { type: "measurement_started", meta: { contextKey: "c" } },
  ];
  for (let i = 0; i < adjustCount; i++) events.push({ type: "measurement_adjusted", meta: { field: "mpPv0", contextKey: "c" } });
  events.push({ type: "simulation_run", meta: { steps: 10, contextKey: "c" } });
  return events;
}
export function measurementAlternatives() {
  return {
    "0 justeringar": computeXP(measurementSequence(0), XP_RULES_V1).byCategory.measurementWork,
    "1 justering": computeXP(measurementSequence(1), XP_RULES_V1).byCategory.measurementWork,
    "2+ justeringar": computeXP(measurementSequence(3), XP_RULES_V1).byCategory.measurementWork,
  };
  // Alternativ C (kräver >=2 justeringar) och D (bara i uttryckligen
  // mät-instruerade lärsteg) kräver regeländringar i själva
  // computeXP-villkoret snarare än i XP_RULES-värdena; provräknas
  // kvalitativt i rapporten mot LP_INVENTORY:s usesMeasurement-flaggor.
}

// ── DEL 13: nivåkurvor ──
export function levelCurveComparison() {
  return {
    huvudkandidat: runCalibration(XP_RULES_V1, LEVELS_V1).finalLevels,
    snabbare: runCalibration(XP_RULES_V1, LEVELS_FAST).finalLevels,
    langsammare: runCalibration(XP_RULES_V1, LEVELS_SLOW).finalLevels,
  };
}

if (process.argv[1] && process.argv[1].endsWith("sensitivity.mjs")) {
  const asJson = process.argv.includes("--json");
  const result = {
    help: helpAlternatives(),
    singleStep: singleStepAlternatives(),
    measurement: measurementAlternatives(),
    levelCurves: levelCurveComparison(),
  };
  if (asJson) console.log(JSON.stringify(result, null, 2));
  else {
    console.log("=== DEL 9: Hjälp-XP-alternativ (XP-summa vid 3 / 8 / 24 unika hjälpöppningar) ===");
    console.log(JSON.stringify(result.help, null, 2));
    console.log("\n=== DEL 10: Enstegnings-XP (singleStep-XP vid 3/5/8/20 klick) ===");
    console.log(JSON.stringify(result.singleStep, null, 2));
    console.log("\n=== DEL 11: Mätarbete (XP vid 0/1/2+ justeringar) ===");
    console.log(JSON.stringify(result.measurement, null, 2));
    console.log("\n=== DEL 13: Nivåkurvor — slutnivå per profil ===");
    for (const [curve, levels] of Object.entries(result.levelCurves)) {
      console.log(`  ${curve}:`, Object.entries(levels).map(([p, l]) => `${p}=${l.levelName}${l.isMaxLevel ? "(MAX)" : ""}`).join(", "));
    }
  }
}
