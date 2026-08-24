// Återanvändbar analysbibliotek för PID Simulator-scenarier.
// Kör ett scenario genom appens egen simuleringskärna (sim-core.js) och
// mäter dynamiska egenskaper: stationärt fel, översläng, stigtid,
// insvängningstid, oscillation, utsignalsmättning.
//
// Se tests/simulation/README.md för fullständig dokumentation av
// definitioner (insvängningstid, toleransband, oscillationsmått).

import fs from "node:fs";
import path from "node:path";
import { Simulation, CONTENT_DIR } from "./sim-core-bridge.mjs";

/**
 * Läser ett scenario från id (relativt content/scenarios/) eller en
 * fullständig/relativ sökväg till en scenario-JSON.
 */
export function loadScenario(scenarioIdOrPath, contentDir = CONTENT_DIR) {
  const candidates = [];
  if (fs.existsSync(scenarioIdOrPath)) {
    candidates.push(scenarioIdOrPath);
  } else {
    const withExt = scenarioIdOrPath.endsWith(".json") ? scenarioIdOrPath : scenarioIdOrPath + ".json";
    candidates.push(path.join(contentDir, "scenarios", withExt));
    candidates.push(path.resolve(process.cwd(), withExt));
  }
  const filePath = candidates.find(fs.existsSync);
  if (!filePath) {
    throw new Error(
      `Scenario hittades inte: "${scenarioIdOrPath}". Försökte: ${candidates.join(", ")}`
    );
  }
  const scenario = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return { scenario, filePath };
}

function deepMerge(base, override) {
  const out = JSON.parse(JSON.stringify(base));
  for (const [k, v] of Object.entries(override || {})) {
    if (v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object") {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function average(arr) {
  if (arr.length === 0) return NaN;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Räknar lokala max/min i en serie vars avvikelse från grannvärdena
// överstiger `noiseFloor` — ett enkelt, dokumenterat oscillationsmått,
// inte en fullständig stabilitetsanalys (se README).
function countLocalExtrema(series, noiseFloor) {
  let count = 0;
  for (let i = 1; i < series.length - 1; i++) {
    const prev = series[i - 1], cur = series[i], next = series[i + 1];
    const isMax = cur > prev && cur > next && (cur - Math.max(prev, next)) > noiseFloor;
    const isMin = cur < prev && cur < next && (Math.min(prev, next) - cur) > noiseFloor;
    if (isMax || isMin) count++;
  }
  return count;
}

/**
 * Kör ett scenario och returnerar ett mätdataobjekt.
 *
 * opts:
 *  scenario              - inläst scenario-objekt (från loadScenario)
 *  steps                 - antal steg att köra EFTER ev. SP-ändring
 *  spChangeAtStep        - steg (0-baserat, från start) då SP ändras (valfritt)
 *  newSp                 - nytt SP-värde vid spChangeAtStep (valfritt)
 *  controllerOverrides   - partiell override av scenario.controller
 *  processOverrides      - partiell override av scenario.process
 *  seed                  - slumpfrö för brus (default 42, för reproducerbarhet)
 *  toleranceAbsolute     - absolut toleransband (PV-enheter). Om satt,
 *                          används detta istället för tolerancePercent.
 *  tolerancePercent      - toleransband som andel av stegets storlek
 *                          (default 0.02 = 2%)
 *  settleHoldSteps       - antal sammanhängande steg PV måste ligga kvar
 *                          inom toleransbandet för att räknas som
 *                          "stabiliserad" (default 10)
 *  settleTailWindow      - antal sista steg som medelvärdesbildas för att
 *                          uppskatta det faktiska stationära PV-värdet
 *                          (default 20)
 */
export function runAnalysis(opts) {
  const {
    scenario: baseScenario,
    steps,
    spChangeAtStep = null,
    newSp = null,
    controllerOverrides = null,
    processOverrides = null,
    seed = 42,
    toleranceAbsolute = null,
    tolerancePercent = 0.02,
    settleHoldSteps = 10,
    settleTailWindow = 20,
  } = opts;

  if (!steps || steps <= 0) throw new Error("runAnalysis: 'steps' måste vara > 0");

  const scenario = JSON.parse(JSON.stringify(baseScenario));
  if (controllerOverrides) scenario.controller = deepMerge(scenario.controller, controllerOverrides);
  if (processOverrides) scenario.process = deepMerge(scenario.process, processOverrides);

  const preRunSteps = spChangeAtStep != null ? spChangeAtStep : 0;
  scenario.runtime.maxSteps = Math.max(scenario.runtime.maxSteps || 0, preRunSteps + steps + 5);

  const sim = new Simulation(scenario, seed);

  let spBefore = scenario.runtime.setpoint;
  let spAfter = scenario.runtime.setpoint;
  let spChangeStep = null;

  if (spChangeAtStep != null && newSp != null) {
    sim.run(spChangeAtStep);
    spBefore = sim.scenario.runtime.setpoint;
    sim.scenario.runtime.setpoint = newSp;
    spAfter = newSp;
    spChangeStep = spChangeAtStep;
  }
  sim.run(steps);

  const hist = sim.history;
  const postIdx = spChangeStep != null ? spChangeStep : 0;
  const yFull = hist.y;
  const uFull = hist.u;
  const yPost = yFull.slice(postIdx);
  const uPost = uFull.slice(postIdx);
  const preChangeActual = yFull[postIdx];

  const tailStart = Math.max(postIdx, yFull.length - settleTailWindow);
  const finalSteadyStateValue = average(yFull.slice(tailStart));
  const finalPV = yFull[yFull.length - 1];

  // Stegets storlek beräknas mot PV:s FAKTISKA startvärde (preChangeActual),
  // inte mot spBefore. De sammanfaller när processen redan hunnit
  // stabilisera sig vid spBefore innan ändringen — men för scenarier där
  // SP redan är satt från start (processen börjar vid normalValue och SP
  // är konstant, dvs. det vanliga fallet i scenariofilerna) finns ingen
  // explicit spChangeAtStep, och spAfter-spBefore blir då alltid 0 trots
  // att ett fullt stegsvar sker från normalValue mot SP. preChangeActual
  // fångar båda fallen korrekt.
  const stepSize = spAfter - preChangeActual;
  let referenceTolerance;
  if (toleranceAbsolute != null) {
    referenceTolerance = toleranceAbsolute;
  } else if (Math.abs(stepSize) > 1e-9) {
    referenceTolerance = Math.abs(stepSize) * tolerancePercent;
  } else {
    // Inget explicit SP-steg gjordes (t.ex. scenariot körs som det är
    // laddat) — använd andel av det uppmätta stationära värdet istället,
    // med ett absolut golv så toleransen aldrig blir orimligt snäv.
    referenceTolerance = Math.max(Math.abs(finalSteadyStateValue) * tolerancePercent, 0.5);
  }

  const maxPV = Math.max(...yPost);
  const minPV = Math.min(...yPost);

  let overshootAbs;
  if (stepSize > 1e-9) overshootAbs = Math.max(0, maxPV - finalSteadyStateValue);
  else if (stepSize < -1e-9) overshootAbs = Math.max(0, finalSteadyStateValue - minPV);
  else overshootAbs = Math.max(maxPV - finalSteadyStateValue, finalSteadyStateValue - minPV, 0);
  const overshootPct = Math.abs(stepSize) > 1e-9 ? (overshootAbs / Math.abs(stepSize)) * 100 : null;

  // Stigtid 10%-90% mellan startvärde (preChangeActual) och slutvärde.
  let riseTimeSteps = null;
  if (Math.abs(finalSteadyStateValue - preChangeActual) > 1e-9) {
    const lo = preChangeActual + 0.1 * (finalSteadyStateValue - preChangeActual);
    const hi = preChangeActual + 0.9 * (finalSteadyStateValue - preChangeActual);
    const rising = finalSteadyStateValue > preChangeActual;
    let loStep = null, hiStep = null;
    for (let i = postIdx; i < yFull.length; i++) {
      const v = yFull[i];
      if (loStep == null && (rising ? v >= lo : v <= lo)) loStep = i;
      if (hiStep == null && (rising ? v >= hi : v <= hi)) { hiStep = i; break; }
    }
    if (loStep != null && hiStep != null) riseTimeSteps = hiStep - loStep;
  }

  // Insvängningstid: första steg där PV går in i toleransbandet kring
  // finalSteadyStateValue OCH stannar där i minst settleHoldSteps steg.
  let settledStep = null;
  for (let i = postIdx; i < yFull.length; i++) {
    if (Math.abs(yFull[i] - finalSteadyStateValue) <= referenceTolerance) {
      let holds = true;
      const holdEnd = Math.min(yFull.length, i + settleHoldSteps);
      for (let j = i; j < holdEnd; j++) {
        if (Math.abs(yFull[j] - finalSteadyStateValue) > referenceTolerance) { holds = false; break; }
      }
      if (holds && holdEnd - i === settleHoldSteps) { settledStep = i - postIdx; break; }
    }
  }

  // "Nått SP" — skiljs medvetet från "stabiliserad" (se README: en
  // P-regulator kan stabiliseras utan att någonsin nå SP).
  let reachedSpStep = null;
  for (let i = postIdx; i < yFull.length; i++) {
    if (Math.abs(yFull[i] - spAfter) <= referenceTolerance) { reachedSpStep = i - postIdx; break; }
  }
  const withinSpToleranceAtEnd = Math.abs(finalPV - spAfter) <= referenceTolerance;

  const extremaCount = countLocalExtrema(yPost, referenceTolerance * 0.5);
  const oscillating = extremaCount >= 3;

  const limits = scenario.controller.outputLimits || { min: 0, max: 100 };
  let saturatedSteps = 0;
  for (const u of uPost) if (u <= limits.min + 1e-9 || u >= limits.max - 1e-9) saturatedSteps++;

  return {
    scenarioId: scenario.id,
    controllerMode: scenario.controller.mode,
    process: scenario.process,
    controller: scenario.controller,
    spBefore,
    spAfter,
    spChangeStep,
    stepsRun: yFull.length - 1,
    finalPV,
    maxPV,
    minPV,
    finalSteadyStateValue,
    steadyStateError: spAfter - finalSteadyStateValue,
    overshootAbs,
    overshootPct,
    riseTimeSteps,
    settledStep,
    reachedSpStep,
    withinSpToleranceAtEnd,
    oscillating,
    localExtremaCount: extremaCount,
    maxU: Math.max(...uPost),
    minU: Math.min(...uPost),
    saturationOccurred: saturatedSteps > 0,
    saturatedSteps,
    tolerance: referenceTolerance,
    toleranceBasis: toleranceAbsolute != null ? "absolute" : "percent-of-step",
    settleHoldSteps,
    seed,
    history: { t: hist.t, y: hist.y, u: hist.u, sp: hist.sp },
  };
}

/** Kort människoläsbar sammanfattning av ett runAnalysis()-resultat. */
export function formatSummary(result) {
  const lines = [];
  lines.push(`Scenario: ${result.scenarioId}  (läge: ${result.controllerMode})`);
  lines.push(
    `Kp=${result.controller.kp ?? "-"}  Ti=${result.controller.ti ?? "-"}  Td=${result.controller.td ?? "-"}` +
    `   K=${result.process.K}  T=${result.process.T}  L=${result.process.L}`
  );
  lines.push(`SP: ${result.spBefore} -> ${result.spAfter}` + (result.spChangeStep != null ? ` (vid steg ${result.spChangeStep})` : ""));
  lines.push(`Körda steg: ${result.stepsRun}   Slut-PV: ${result.finalPV.toFixed(3)}   Stationärt fel: ${result.steadyStateError.toFixed(3)}`);
  lines.push(`Max PV: ${result.maxPV.toFixed(3)}   Min PV: ${result.minPV.toFixed(3)}   Översläng: ${result.overshootAbs.toFixed(3)} (${result.overshootPct == null ? "–" : result.overshootPct.toFixed(1) + "%"})`);
  lines.push(`Stigtid (10-90%): ${result.riseTimeSteps == null ? "ej definierbar" : result.riseTimeSteps + " steg"}`);
  lines.push(`Insvängd (mot slutvärde): ${result.settledStep == null ? "inte inom körd tid" : "steg " + result.settledStep}`);
  lines.push(`Nådde SP-tolerans: ${result.reachedSpStep == null ? "nej" : "steg " + result.reachedSpStep}   Inom SP-tolerans vid slutet: ${result.withinSpToleranceAtEnd}`);
  lines.push(`Oscillation: ${result.oscillating ? "JA" : "nej"} (${result.localExtremaCount} lokala extrempunkter)`);
  lines.push(`Utsignal: max=${result.maxU.toFixed(1)} min=${result.minU.toFixed(1)}   Mättning: ${result.saturationOccurred ? result.saturatedSteps + " steg" : "nej"}`);
  return lines.join("\n");
}
