// GAM-003A.1 — Flera genomgångar (repetition) av lärstigar, kedjade med
// bestående tillstånd (newHighestStep, distinctConfig) via computeXP()s
// priorState/endState. Motsvarar PO/PM:s reviderade princip: repetition ska
// ge full försöks-/lärstigs-XP, men bestående milstolpar ges bara en gång.
//
// Körs: node tests/gamification/career.mjs [--json]

import { computeXP, mergeState, XP_RULES_V1, LEVELS_V2, levelFor } from "./xp-model.mjs";
import { LP_INVENTORY } from "./lp-inventory.mjs";
import { buildSequenceForLearningPath } from "./profiles.mjs";

/**
 * Kör N genomgångar av EN lärstig i följd, kedjat via priorState. Returnerar
 * XP per genomgång och sluttillståndet.
 */
export function runRepeatedLearningPath(lp, profileName, times, priorState = null) {
  const perRun = [];
  let state = priorState;
  for (let i = 0; i < times; i++) {
    const events = buildSequenceForLearningPath(lp, profileName);
    const result = computeXP(events, XP_RULES_V1, state);
    perRun.push({ run: i + 1, xp: result.totalXPNoCheckpoints, byCategory: result.byCategory });
    state = result.endState;
  }
  return { perRun, endState: state };
}

/**
 * Kör EN genomgång av samtliga lärstigar i katalogordning, kedjat via
 * priorState (spänner över lärstigsgränser — utan effekt för newHighestStep/
 * distinctConfig eftersom deras nycklar redan är lärstigsspecifika, men
 * nödvändigt för att kunna kedja vidare till en andra fullständig
 * genomgång av ALLA lärstigar).
 */
export function runFullPass(profileName, priorState = null) {
  let state = priorState;
  let totalXP = 0;
  const perLp = [];
  for (const lp of LP_INVENTORY) {
    const events = buildSequenceForLearningPath(lp, profileName);
    const result = computeXP(events, XP_RULES_V1, state);
    totalXP += result.totalXPNoCheckpoints;
    perLp.push({ learningPathId: lp.id, xp: result.totalXPNoCheckpoints });
    state = result.endState;
  }
  return { totalXP, perLp, endState: state };
}

/** Kör flera fullständiga genomgångar av ALLA lärstigar, kedjat. */
export function runMultiplePasses(profileName, passCount, levels = LEVELS_V2) {
  let state = null;
  let cumulative = 0;
  const passes = [];
  for (let p = 1; p <= passCount; p++) {
    const before = levelFor(cumulative, levels);
    const result = runFullPass(profileName, state);
    cumulative += result.totalXP;
    state = result.endState;
    const after = levelFor(cumulative, levels);
    passes.push({ pass: p, xpThisPass: result.totalXP, cumulative, levelBefore: before.levelName, levelAfter: after.levelName, isMaxLevel: after.isMaxLevel, ratioIntoLevel: after.ratio });
  }
  return passes;
}

/** Hur många FULLA genomgångar av alla lärstigar krävs för nivå 8? */
export function passesUntilMaxLevel(profileName, levels = LEVELS_V2, maxPasses = 10) {
  const passes = runMultiplePasses(profileName, maxPasses, levels);
  const found = passes.find(p => p.isMaxLevel);
  return { reachedAtPass: found ? found.pass : null, passes };
}

if (process.argv[1] && process.argv[1].endsWith("career.mjs")) {
  const asJson = process.argv.includes("--json");
  const out = {};
  for (const profile of ["minimal", "normal", "fordjupare"]) {
    out[profile] = passesUntilMaxLevel(profile, LEVELS_V2, 8);
  }
  if (asJson) console.log(JSON.stringify(out, null, 2));
  else {
    for (const [profile, data] of Object.entries(out)) {
      console.log(`\n=== ${profile} — flera fulla genomgångar av alla 10 lärstigar (LEVELS_V2) ===`);
      data.passes.forEach(p => console.log(`  Genomgång ${p.pass}: +${p.xpThisPass} XP => ${p.cumulative} (${p.levelBefore} -> ${p.levelAfter}${p.isMaxLevel ? " MAX" : ""})`));
      console.log(`  Nivå 8 nådd vid genomgång: ${data.reachedAtPass ?? "ej inom " + data.passes.length + " genomgångar"}`);
    }
  }
}
