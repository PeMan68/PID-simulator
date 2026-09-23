// FEAT-045 — Framkoppling (Feedforward).
//
// Testar auxSignal/auxGain/Kff-mekaniken i apps/app/sim-core.js:
// Simulation.auxValue/triggerAuxSignal(), ProcessModel.step()s nya
// auxGain×auxValue-term (genom SAMMA T som huvudprocessen, till skillnad
// från disturbance som adderas direkt), PIDController.step()s nya
// feedforward-parameter (adderad FÖRE klippning mot outputLimits), samt att
// scenarier utan auxSignal-fält beter sig som no-op (bakåtkompatibilitet
// med alla befintliga scenarier).
//
// Egen enkel testrunner, i linje med tests/feat-043-extend-max-steps.test.mjs.
//
// Körs: node tests/feat-045-framkoppling.test.mjs

import { Simulation, PIDController, ProcessModel } from "./simulation/lib/sim-core-bridge.mjs";

let failed = 0;
let passed = 0;
function check(name, condition, detail) {
  if (condition) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}
function close(a, b, tol = 0.01) { return Math.abs(a - b) <= tol; }

function makeScenario({ kp = 1.2, ti = 20, td = 0, kff = 0, auxGain = 0.8, auxMag = -20, sp = 50, normalValue = 50 } = {}) {
  return {
    id: "feat045-check",
    process: { type: "self_regulating", K: 1.3, T: 15.0, L: 0.0, normalValue, measurementRange: { min: 0, max: 100 }, auxGain },
    controller: { mode: "pid", kp, ti, td, kff, antiWindup: true, outputLimits: { min: 0, max: 100 } },
    disturbance: { noiseStd: 0, pulse: { magnitude: 0, durationSteps: 0 } },
    auxSignal: { magnitude: auxMag },
    runtime: { dt: 1.0, maxSteps: 400, setpoint: sp, autopause: false },
  };
}

// ── 1. Simulation.auxValue/triggerAuxSignal()/reset() ───────────────────────
{
  const sim = new Simulation(makeScenario(), 42);
  check("1a. auxValue startar på 0", sim.auxValue === 0);
  sim.triggerAuxSignal();
  check("1b. triggerAuxSignal() sätter auxValue till auxSignal.magnitude", sim.auxValue === -20, `fick ${sim.auxValue}`);
  sim.step();
  check("1c. history.aux fylls varje steg", sim.history.aux.length === sim.history.t.length);
  check("1d. history.aux[senaste] matchar auxValue", sim.history.aux[sim.history.aux.length - 1] === -20);
  sim.reset();
  check("1e. reset() nollställer auxValue (PO: 'återställer systemet')", sim.auxValue === 0);
  check("1f. reset() nollställer även history.aux", sim.history.aux.length === 1 && sim.history.aux[0] === 0);
}

// ── 2. triggerAuxSignal() ersätter (inte adderar), inkl. till 0 ────────────
{
  const sim = new Simulation(makeScenario({ auxMag: 10 }), 42);
  sim.triggerAuxSignal();
  check("2a. Första triggningen sätter auxValue", sim.auxValue === 10);
  sim.scenario.auxSignal.magnitude = 0;
  sim.triggerAuxSignal();
  check("2b. En ny triggning med 0 tar bort lasten (ersätter, adderar inte)", sim.auxValue === 0);
}

// ── 3. Scenario UTAN auxSignal-fält: triggerAuxSignal() är en no-op ────────
{
  const scenario = makeScenario();
  delete scenario.auxSignal;
  const sim = new Simulation(scenario, 42);
  sim.triggerAuxSignal();
  check("3a. Scenario utan auxSignal ger auxValue=0 (bakåtkompatibelt no-op)", sim.auxValue === 0);
}

// ── 4. ProcessModel: auxGain×auxValue går genom SAMMA T som huvudprocessen ──
// (till skillnad från disturbance, som adderas direkt till y utan fördröjning)
{
  const cfg = { type: "self_regulating", K: 1.3, T: 15.0, L: 0.0, normalValue: 50, auxGain: 0.8 };
  const proc = new ProcessModel(cfg, 1.0);
  const yBefore = proc.y;
  proc.step(0, 1.0, 0, -20); // u=0, disturbance=0, auxValue=-20
  const dyFromAux = proc.y - yBefore;
  check("4a. auxGain×auxValue ger en GRADVIS förändring första steget (inte ett hopp till slutvärdet)",
    Math.abs(dyFromAux) > 0 && Math.abs(dyFromAux) < Math.abs(0.8 * -20), `dy=${dyFromAux}`);
  // Jämförelse: disturbance (samma numeriska storlek) ger ETT omedelbart, odämpat hopp
  const proc2 = new ProcessModel(cfg, 1.0);
  const y2Before = proc2.y;
  proc2.step(0, 1.0, -16, 0); // disturbance=-16 (=0.8×-20, samma total "kraft"), auxValue=0
  const dyFromDisturbance = proc2.y - y2Before;
  check("4b. disturbance ger ett direkt, odämpat hopp (till skillnad från auxGain-termen ovan)",
    close(dyFromDisturbance, -16), `dy=${dyFromDisturbance}`);
}

// ── 5. auxGain=0 (default) → last utan fysisk effekt, oavsett auxValue ─────
{
  const cfg = { type: "self_regulating", K: 1.3, T: 15.0, L: 0.0, normalValue: 50 }; // ingen auxGain alls
  const proc = new ProcessModel(cfg, 1.0);
  const yBefore = proc.y;
  proc.step(0, 1.0, 0, -20);
  check("5a. auxGain saknas (undefined) → last ger ingen effekt (0 använt som default)", proc.y === yBefore);
}

// ── 6. PIDController: feedforward adderas FÖRE klippning mot outputLimits ──
{
  const pid = new PIDController({ kp: 1, ti: 0, td: 0 }, 1.0);
  pid.mode = "p";
  const limits = { min: 0, max: 100 };
  const r1 = pid.step(50, 50, limits, true, 0); // e=0, ff=0 → u=0
  check("6a. Utan feedforward: e=0 ger u=0", r1.u === 0, `u=${r1.u}`);
  pid.prevPv = 50;
  const r2 = pid.step(50, 50, limits, true, 30); // e=0, ff=30 → u=30 (klippt inom gränser)
  check("6b. Feedforward adderas till utsignalen även vid e=0", r2.u === 30, `u=${r2.u}`);
  check("6c. ffTerm returneras separat i ctrl-objektet", r2.ffTerm === 30);
  pid.prevPv = 50;
  const r3 = pid.step(50, 50, limits, true, 150); // ff större än max → ska klippas
  check("6d. Kombinerad utsignal klipps mot outputLimits.max", r3.u === 100, `u=${r3.u}`);
}

// ── 7. Full Simulation: korrekt Kff (−auxGain/K) eliminerar avvikelsen ─────
// Process i vila VID SP (normalValue=SP=50) — u=0 krävs för jämvikt, så en
// NEGATIV last (drar ner PV) testar att regulatorn kan öka u för att
// motverka den (fysiskt rimligt kontrollutrymme, se FEAT-045-leveransrapporten
// för varför normalValue=SP+negativ last valdes framför normalValue=0).
{
  const K = 1.3, auxGain = 0.8;
  const kffCorrect = -auxGain / K;

  function residualAfterTrigger(kff, kp, ti) {
    const sim = new Simulation(makeScenario({ kp, ti, td: 0, kff, auxGain, auxMag: -20, sp: 50, normalValue: 50 }), 42);
    sim.run(3);
    sim.triggerAuxSignal();
    sim.run(250);
    return Math.abs(sim.process.y - 50);
  }

  check("7a. kff=0 (ingen framkoppling) lämnar en STOR kvarstående avvikelse (P-only, Ti=0)",
    residualAfterTrigger(0, 0.1, 0) > 10);
  check("7b. Teoretiskt korrekt kff (−auxGain/K) eliminerar avvikelsen (ren framkoppling, Ti=0)",
    residualAfterTrigger(kffCorrect, 0.1, 0) < 0.1);
  check("7c. Halva korrekt kff lämnar en MINDRE men fortfarande tydlig avvikelse",
    (() => { const r = residualAfterTrigger(kffCorrect / 2, 0.1, 0); return r > 5 && r < 10; })());
  check("7d. PID (med Ti) och kff=0 återgår TILL SLUT till SP ändå (integralverkan, till skillnad från 7a)",
    residualAfterTrigger(0, 1.2, 20) < 0.1);
}

// ── 8. Anti-windup ser den KOMBINERADE (PID+framkoppling) utsignalen ───────
{
  // Ett kff-bidrag stort nog att ensamt mätta utsignalen ska förhindra
  // integratorn från att fortsätta växa (samma logik som vanlig mättning).
  const scenario = makeScenario({ kp: 1.2, ti: 5, td: 0, kff: 50, auxGain: 0, auxMag: 100, sp: 90, normalValue: 0 });
  const sim = new Simulation(scenario, 42);
  sim.triggerAuxSignal(); // auxValue=100, ff=kff×auxValue=5000 — garanterat mättat
  sim.run(30);
  check("8a. Integralen växer inte obegränsat när kff ensamt mättar utsignalen (anti-windup ser kombinerat u)",
    Math.abs(sim.pid.integral) < 1000, `integral=${sim.pid.integral}`);
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
