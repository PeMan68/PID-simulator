// GAM-003A — Genererar realistiska GAM-002-händelsesekvenser för tre
// användarprofiler (DEL 4/5) mot en lärstig i LP_INVENTORY.
//
// Principer (för att undvika att simulera aktiviteter lärstigen inte ger
// stöd för):
//  - "configsInStep" och "simSteps" i inventeringen är OBLIGATORISK aktivitet
//    (det instruktionen ber om) — alla tre profiler utför den, oavsett
//    profil. Det som skiljer profilerna är EXTRA, valfri aktivitet ovanpå
//    det obligatoriska: enstegning, hjälpanvändning, och (bara för aktiv
//    fördjupare) en extra egen konfiguration utöver det instruerade.
//  - Mät K/T/L körs av alla profiler när steget uttryckligen kräver det
//    (usesMeasurement), eftersom det då är obligatoriskt, inte utforskande.
//  - Checkpoints besvaras rätt på första försöket i huvudprofilerna (fel
//    svar/upprepade fel provräknas separat i manipulation.mjs, DEL 8/12).

let helpCounter = 0;
function nextHelpId() { return "help-" + (helpCounter++ % 24); }

const PROFILE_TUNING = {
  minimal: { extraSingleSteps: 0, helpPerStep: 0, extraConfigPerStep: 0 },
  normal: { extraSingleSteps: 2, helpPerStep: 0.5, extraConfigPerStep: 0 },
  fordjupare: { extraSingleSteps: 5, helpPerStep: 1, extraConfigPerStep: 1 },
};

function emitConfigAndRun(events, fieldBase, configIndex, stepsForThisConfig, contextKey, tuning) {
  // Seed/ändra ett fält till ett nytt, distinkt värde (5%-regeln uppfylls
  // gott och väl av >=50% steg mellan varje konfiguration i denna modell).
  const value = 1 + configIndex * 5;
  events.push({ type: "parameter_changed", meta: { field: fieldBase, value, contextKey } });

  let remaining = stepsForThisConfig;
  let singleSteps = Math.min(tuning.extraSingleSteps, 5);
  for (let i = 0; i < singleSteps && remaining > 0; i++) {
    events.push({ type: "simulation_step", meta: { contextKey } });
    remaining -= 1;
  }
  while (remaining > 0) {
    const batch = Math.min(10, remaining);
    events.push({ type: "simulation_run", meta: { steps: batch, contextKey } });
    remaining -= batch;
  }
}

/**
 * Bygger en fullständig händelsesekvens för EN lärstig och EN profil.
 * `profileName`: "minimal" | "normal" | "fordjupare"
 */
export function buildSequenceForLearningPath(lp, profileName) {
  const tuning = PROFILE_TUNING[profileName];
  if (!tuning) throw new Error("Okänd profil: " + profileName);
  helpCounter = 0; // ny session per lärstig — helpId-utrymmet återanvänds korrekt

  const events = [];
  events.push({ type: "learning_path_loaded", meta: { learningPathId: lp.id } });

  lp.steps.forEach((step, stepIndex) => {
    const contextKey = lp.id + "#" + stepIndex;
    const isFinalStep = stepIndex === lp.steps.length - 1;
    events.push({
      type: "learning_step_reached",
      // comparisonGroup (GAM-003A.2): samma fält som appen skickar från det
      // verkliga lärstigsinnehållet — se apps/app/content/exercises/*.json
      // och apps/app/app.js:s learning_step_reached-dispatch.
      meta: { learningPathId: lp.id, stepIndex, isFinalStep, contextKey, comparisonGroup: step.comparisonGroup || null },
    });

    if (step.type === "theory") {
      if (step.checkpoint) {
        events.push({ type: "checkpoint_answered", meta: { checkpointId: contextKey, correct: true } });
      }
      // Extra hjälpanvändning kan förekomma även i teoristeg.
      const helpCount = Math.round(tuning.helpPerStep);
      for (let i = 0; i < helpCount; i++) events.push({ type: "help_opened", meta: { helpId: nextHelpId() } });
      return;
    }

    // Scenario-steg
    events.push({ type: "scenario_loaded", meta: { scenarioId: contextKey, contextKey } });

    const configs = Math.max(1, (step.configsInStep || 0)) + (tuning.extraConfigPerStep > 0 && step.configsInStep >= 1 ? tuning.extraConfigPerStep : 0);
    const totalSteps = step.simSteps || 0;
    const perConfig = configs > 0 ? Math.max(20, Math.floor(totalSteps / Math.max(1, step.configsInStep || 1))) : 0;

    if (step.usesMeasurement) {
      events.push({ type: "measurement_started", meta: { contextKey } });
      events.push({ type: "measurement_adjusted", meta: { field: "mpPv0", contextKey } });
      if (tuning.extraSingleSteps > 0) {
        events.push({ type: "measurement_adjusted", meta: { field: "mpPvInf", contextKey } });
      }
    }

    if (step.usesPulse) {
      events.push({ type: "disturbance_triggered", meta: { contextKey } });
    }

    if (totalSteps > 0) {
      for (let c = 0; c < configs; c++) {
        emitConfigAndRun(events, "kp", c, perConfig, contextKey, tuning);
      }
    } else if (step.usesMeasurement) {
      // Rena mätsteg utan ny körning (t.ex. stegsvar-identifiering steg 4-7):
      // några enstegningar för att "läsa av" kurvan, ingen ny konfiguration.
      const reads = Math.max(1, Math.round(tuning.extraSingleSteps / 2) || 1);
      for (let i = 0; i < reads; i++) events.push({ type: "simulation_step", meta: { contextKey } });
    }

    // Mätarbetet ska räknas som avslutat (om aktiverat) — en körning eller
    // stegväxling utlöser det redan via händelserna ovan/nedan.

    const helpCount = Math.round(tuning.helpPerStep);
    for (let i = 0; i < helpCount; i++) events.push({ type: "help_opened", meta: { helpId: nextHelpId() } });

    if (step.checkpoint) {
      events.push({ type: "checkpoint_answered", meta: { checkpointId: contextKey, correct: true } });
    }
  });

  return events;
}

export const PROFILE_NAMES = Object.keys(PROFILE_TUNING);
