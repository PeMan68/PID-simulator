// GAM-003A — DEL 4/5/13/14: provräkning av samtliga DEV-lärstigar mot tre
// profiler, ackumulerad nivåprogression, och XP-fördelning per kategori.
//
// Körs: node tests/gamification/calibrate.mjs [--json]

import { computeXP, XP_RULES_V1, LEVELS_V1, LEVELS_FAST, LEVELS_SLOW, levelFor } from "./xp-model.mjs";
import { LP_INVENTORY } from "./lp-inventory.mjs";
import { buildSequenceForLearningPath, PROFILE_NAMES } from "./profiles.mjs";

export function runCalibration(rules = XP_RULES_V1, levels = LEVELS_V1) {
  const perLearningPath = {}; // lpId -> profileName -> result
  const cumulative = {}; // profileName -> running total after each lärstig (catalog order)

  PROFILE_NAMES.forEach(p => { cumulative[p] = []; });

  let running = {};
  PROFILE_NAMES.forEach(p => { running[p] = 0; });

  LP_INVENTORY.forEach(lp => {
    perLearningPath[lp.id] = {};
    PROFILE_NAMES.forEach(profileName => {
      const events = buildSequenceForLearningPath(lp, profileName);
      const result = computeXP(events, rules);
      const levelBefore = levelFor(running[profileName], levels);
      running[profileName] += result.totalXPNoCheckpoints;
      const levelAfter = levelFor(running[profileName], levels);
      perLearningPath[lp.id][profileName] = {
        eventCount: events.length,
        byCategory: result.byCategory,
        totalXPNoCheckpoints: result.totalXPNoCheckpoints,
        totalXPWithCheckpoints: result.totalXPWithCheckpoints,
        cumulativeAfter: running[profileName],
        levelBefore: levelBefore.levelName,
        levelAfter: levelAfter.levelName,
        leveledUp: levelBefore.levelName !== levelAfter.levelName,
      };
      cumulative[profileName].push({
        learningPathId: lp.id,
        xpGained: result.totalXPNoCheckpoints,
        cumulative: running[profileName],
        level: levelAfter.levelName,
      });
    });
  });

  return { perLearningPath, cumulative, finalLevels: PROFILE_NAMES.reduce((acc, p) => {
    acc[p] = levelFor(running[p], levels);
    return acc;
  }, {}) };
}

// ── Referens: Test 1 (proportionalband-forstarkning.v1), normal-liknande profil ──
export function referenceTest1() {
  const lp = LP_INVENTORY.find(l => l.id === "proportionalband-forstarkning.v1");
  const events = buildSequenceForLearningPath(lp, "normal");
  const result = computeXP(events, XP_RULES_V1);
  return result;
}

if (process.argv[1] && process.argv[1].endsWith("calibrate.mjs")) {
  const asJson = process.argv.includes("--json");
  const calib = runCalibration();
  const ref = referenceTest1();

  if (asJson) {
    console.log(JSON.stringify({ calibration: calib, reference: { totalXPNoCheckpoints: ref.totalXPNoCheckpoints, byCategory: ref.byCategory } }, null, 2));
  } else {
    console.log("=== Referens: Test 1 (Proportionalband, profil 'normal') ===");
    console.log("Total XP (utan checkpoints):", ref.totalXPNoCheckpoints, "— förväntat ca 75-79");
    console.log("Per kategori:", ref.byCategory);
    console.log("");
    console.log("=== Provräkning: samtliga lärstigar × tre profiler ===");
    for (const lpId of Object.keys(calib.perLearningPath)) {
      console.log(`\n${lpId}:`);
      for (const profileName of PROFILE_NAMES) {
        const r = calib.perLearningPath[lpId][profileName];
        console.log(`  ${profileName.padEnd(10)} XP=${String(r.totalXPNoCheckpoints).padStart(4)}  kumulativ=${String(r.cumulativeAfter).padStart(5)}  nivå: ${r.levelBefore} -> ${r.levelAfter}${r.leveledUp ? "  ⬆" : ""}`);
      }
    }
    console.log("\n=== Slutnivå efter samtliga lärstigar ===");
    for (const p of PROFILE_NAMES) {
      const lvl = calib.finalLevels[p];
      console.log(`  ${p.padEnd(10)} ${lvl.levelName} (${lvl.isMaxLevel ? "MAX" : Math.round(lvl.ratio * 100) + "% mot " + lvl.nextLevelName})`);
    }
  }
}
