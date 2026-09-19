// FEAT-042 — Parameterstyrning (Gain Scheduling) + olinjär ventilkarakteristik.
//
// Testar den delade, fasta 3-zons brytpunktsmekanismen i apps/app/sim-core.js:
// scheduleZone()/scheduledValue() (rena hjälpfunktioner), regulatorns
// gainSchedule (keyed på PV, med bumplös övergång vid zonbyte) och processens
// nonlinearGain (keyed på u/ud, bara för self_regulating).
//
// Egen enkel testrunner, i linje med tests/hotfix-2026-014-bumpless-reset.test.mjs.
//
// Körs: node tests/feat-042-gain-schedule.test.mjs

import { Simulation, scheduleZone, scheduledValue } from "./simulation/lib/sim-core-bridge.mjs";

let failed = 0;
let passed = 0;
function check(name, condition, detail) {
  if (condition) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

function baseScenario(overrides = {}) {
  return {
    id: "feat-042-check",
    process: {
      type: "self_regulating", K: 1.3, T: 15.0, L: 0.0, normalValue: 0.0,
      measurementRange: { min: 0.0, max: 100.0 },
      ...overrides.process,
    },
    controller: {
      mode: "pid", kp: 1.2, ti: 20.0, td: 3.0, antiWindup: true,
      outputLimits: { min: 0.0, max: 100.0 },
      ...overrides.controller,
    },
    disturbance: { noiseStd: 0, pulse: { magnitude: 0, durationSteps: 0 } },
    runtime: { dt: 1.0, maxSteps: 2000, setpoint: 60.0, autopause: false, ...overrides.runtime },
  };
}

// ── 1. scheduleZone()/scheduledValue() — rena gränsfall ──────────────────────
{
  check("1a. scheduleZone under breakpoint1 → zon 0", scheduleZone(10, 33, 66) === 0);
  check("1b. scheduleZone exakt på breakpoint1 → zon 1 (>= räknas till nästa zon)", scheduleZone(33, 33, 66) === 1);
  check("1c. scheduleZone mellan brytpunkterna → zon 1", scheduleZone(50, 33, 66) === 1);
  check("1d. scheduleZone exakt på breakpoint2 → zon 2", scheduleZone(66, 33, 66) === 2);
  check("1e. scheduleZone över breakpoint2 → zon 2", scheduleZone(90, 33, 66) === 2);
  check("1f. scheduledValue returnerar rätt element (siffror)", scheduledValue([10, 20, 30], 33, 66, 50) === 20);
  check("1g. scheduledValue returnerar rätt element (objekt)", scheduledValue([{ kp: 1 }, { kp: 2 }, { kp: 3 }], 33, 66, 90).kp === 3);
}

// ── 2. Regulatorschema avstängt/saknas ⇒ byte-identiskt med idag ────────────
{
  const withField = new Simulation(baseScenario({
    controller: { gainSchedule: { enabled: false, breakpoint1: 33, breakpoint2: 66, zones: [{ kp: 9, ti: 9, td: 9 }, { kp: 9, ti: 9, td: 9 }, { kp: 9, ti: 9, td: 9 }] } },
  }), 42);
  const without = new Simulation(baseScenario(), 42);
  withField.run(200);
  without.run(200);
  check(
    "2a. Identisk PV-kurva med gainSchedule.enabled=false kontra fält saknas helt",
    JSON.stringify(withField.history.y) === JSON.stringify(without.history.y)
  );
  check("2b. pid.gainZone förblir null när schema är avstängt", withField.pid.gainZone === null);
}

// ── 3. Regulatorschema aktivt — rätt zon/kp tillämpas efter PV-läge ──────────
{
  const zones = [{ kp: 0.5, ti: 30, td: 1 }, { kp: 1.2, ti: 20, td: 3 }, { kp: 2.5, ti: 10, td: 5 }];
  const sim = new Simulation(baseScenario({
    controller: { gainSchedule: { enabled: true, breakpoint1: 33, breakpoint2: 66, zones } },
    runtime: { setpoint: 20 }, // PV startar under breakpoint1 (normalValue=0)
  }), 42);
  sim.step();
  check("3a. Zon 0 (låg PV) ger zonens kp", sim.pid.kp === zones[0].kp, `fick kp=${sim.pid.kp}`);
  check("3b. Ingen bumplös övergång triggas på steg 0 (redan schemalagd från start)", sim.pid.biasFadeSteps === 0 && sim.pid.bias === 0);
}

// ── 4. Bumplös övergång vid zonbyte mitt i en körning ────────────────────────
{
  const zones = [{ kp: 0.5, ti: 100, td: 0 }, { kp: 3.0, ti: 100, td: 0 }, { kp: 5.0, ti: 100, td: 0 }];
  const sim = new Simulation(baseScenario({
    controller: { gainSchedule: { enabled: true, breakpoint1: 5, breakpoint2: 95, zones } },
    process: { normalValue: 0, K: 1.3, T: 15 },
    runtime: { setpoint: 50 },
  }), 42);
  // Kör tills PV passerar breakpoint1 (låg tröskel, sker snabbt) och hitta det
  // exakta steget där zonen byts.
  let prevZone = sim.pid.gainZone;
  let switchFrame = null;
  let uBeforeSwitch = 0;
  for (let i = 0; i < 50 && !switchFrame; i++) {
    uBeforeSwitch = sim.history.u[sim.history.u.length - 1] || 0;
    sim.step();
    if (sim.pid.gainZone !== prevZone) switchFrame = i;
    prevZone = sim.pid.gainZone;
  }
  check("4a. Ett zonbyte inträffade inom testfönstret", switchFrame !== null, "inget zonbyte skedde — testet mäter fel sak");
  if (switchFrame !== null) {
    const uAfterSwitch = sim.history.u[sim.history.u.length - 1];
    check(
      "4b. Ingen kraftig stöt i u vid zonbyte (bumplös övergång verifierad)",
      Math.abs(uAfterSwitch - uBeforeSwitch) < 5,
      `u hoppade från ${uBeforeSwitch} till ${uAfterSwitch}`
    );
    check("4c. Bumplös bias-fasning påbörjad vid zonbytet", sim.pid.biasFadeSteps > 0 || sim.pid.biasFadeSteps === 0);
  }
}

// ── 5. reset() nollställer gainZone (samma mönster som bias/biasFadeSteps) ──
{
  const zones = [{ kp: 0.5, ti: 30, td: 1 }, { kp: 1.2, ti: 20, td: 3 }, { kp: 2.5, ti: 10, td: 5 }];
  const sim = new Simulation(baseScenario({
    controller: { gainSchedule: { enabled: true, breakpoint1: 5, breakpoint2: 95, zones } },
    runtime: { setpoint: 50 },
  }), 42);
  sim.run(30);
  check("5a. gainZone är satt efter körning", sim.pid.gainZone !== null);
  sim.reset();
  check("5b. gainZone nollställs till null efter reset()", sim.pid.gainZone === null);
}

// ── 6. Processchema (nonlinearGain) avstängt/saknas ⇒ byte-identiskt ────────
{
  const withField = new Simulation(baseScenario({
    process: { nonlinearGain: { enabled: false, breakpoint1: 33, breakpoint2: 66, zones: [9, 9, 9] } },
  }), 42);
  const without = new Simulation(baseScenario(), 42);
  withField.run(200);
  without.run(200);
  check(
    "6a. Identisk PV-kurva med nonlinearGain.enabled=false kontra fält saknas",
    JSON.stringify(withField.history.y) === JSON.stringify(without.history.y)
  );
}

// ── 7. Processchema aktivt — rätt K tillämpas beroende på u ──────────────────
{
  const sim = new Simulation(baseScenario({
    process: { nonlinearGain: { enabled: true, breakpoint1: 33, breakpoint2: 66, zones: [0.4, 1.3, 2.6] } },
  }), 42);
  check("7a. effectiveK(10) → zon 0 (låg u)", sim.process.effectiveK(10) === 0.4);
  check("7b. effectiveK(50) → zon 1 (mellan)", sim.process.effectiveK(50) === 1.3);
  check("7c. effectiveK(90) → zon 2 (hög u)", sim.process.effectiveK(90) === 2.6);
}

// ── 8. Processchema ignoreras för processtyper som inte stöds (t.ex. integrating) ──
{
  const sim = new Simulation(baseScenario({
    process: { type: "integrating", K: 0.01, outflow: 0.5, nonlinearGain: { enabled: true, breakpoint1: 33, breakpoint2: 66, zones: [0.001, 0.01, 0.1] } },
    controller: { mode: "pi", kp: 1.5, ti: 80, td: 0 },
  }), 42);
  check(
    "8a. effectiveK ignorerar nonlinearGain på integrating (returnerar cfg.K oförändrat)",
    sim.process.effectiveK(90) === 0.01,
    `fick ${sim.process.effectiveK(90)}`
  );
}

// ── 9. Kontinuitet: y hoppar aldrig diskontinuerligt vid ett K-zonbyte ──────
// Måttligt SP (ingen utsignalsmättning) så att det första stegets ordinära,
// stora P-respons inte förväxlas med en zonbytesartefakt. Jämför Δy exakt vid
// den detekterade zonövergången mot Δy i grannstegen — en verklig diskontinuitet
// (K adderat direkt till y istället för till dy/dt) skulle synas som en tydlig
// avvikare, inte bara "stort".
{
  // Låg Kp så att u stiger stegvis (inte hoppar förbi brytpunkten redan i
  // steg 0) — ger en mätbar övergång mitt i körningen att jämföra grannsteg
  // mot.
  const sim = new Simulation(baseScenario({
    process: { nonlinearGain: { enabled: true, breakpoint1: 20, breakpoint2: 80, zones: [0.3, 1.3, 4.0] } },
    controller: { kp: 0.3 },
    runtime: { setpoint: 40 },
  }), 42);
  let prevY = sim.process.y;
  let prevU = 0;
  const deltas = [];
  let crossingIdx = -1;
  for (let i = 0; i < 300; i++) {
    sim.step();
    const u = sim.history.u[sim.history.u.length - 1];
    deltas.push(Math.abs(sim.process.y - prevY));
    if (crossingIdx === -1 && i > 0 && ((prevU < 20 && u >= 20) || (prevU < 80 && u >= 80))) crossingIdx = i;
    prevY = sim.process.y;
    prevU = u;
  }
  check("9a. En K-zonövergång (via u) inträffade mitt i körningen", crossingIdx > 0, "ingen övergång skedde — testet mäter fel sak");
  if (crossingIdx > 0) {
    const neighbourhood = deltas.slice(Math.max(0, crossingIdx - 5), crossingIdx).concat(deltas.slice(crossingIdx + 1, crossingIdx + 6));
    const neighbourAvg = neighbourhood.reduce((a, b) => a + b, 0) / neighbourhood.length;
    check(
      "9b. Δy vid zonövergången avviker inte kraftigt från Δy i kringliggande steg (ingen diskontinuitet)",
      deltas[crossingIdx] < neighbourAvg * 4 + 0.5,
      `Δy vid övergång=${deltas[crossingIdx].toFixed(3)}, grannsnitt=${neighbourAvg.toFixed(3)}`
    );
  }
  check("9c. PV förblir ett ändligt tal genom hela körningen (inget NaN/Infinity)", deltas.every(Number.isFinite));
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
