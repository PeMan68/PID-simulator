// HOTFIX-2026-014 — Regressionstest för att "Återställ system" inte rensade
// en pågående bumpless-bias (mjuk lägesövergång).
//
// Grundorsak: Simulation.step() håller en bias-term i TVÅ speglade platser —
// this.pid.bias (motorns egen kopia) och this.scenario.controller.bias (en
// kopia på scenario-objektet, som app.js läser/skriver vid lägesbyten).
// Simulation.reset() nollställde bara den förstnämnda (via this.pid.reset()).
// Om en bumpless-övergång var påbörjad (biasFadeSteps > 0, dvs. inom sina
// första 5 steg efter ett lägesbyte) och användaren klickade "Återställ
// system" INNAN dessa 5 steg hunnit köras, överlevde den gamla biasen i
// this.scenario.controller.bias. Nästa steg läste då in den via grenen
// `else { this.pid.bias = this.scenario.controller.bias || 0; }` i step() —
// UTAN att sätta biasFadeSteps igen, så biasen blev permanent och osynlig
// (syns inte i statusradens P/I/D-uppdelning; u ≠ P+I+D).
//
// PO:s repro (2026-09-15): Integrerande process, P-reglering, Kp=1,2 — PV
// skulle stanna på ~18 enligt facit, men stannade nära börvärdet (~59) efter
// en Återställ mitt i en pågående bumpless-övergång.
//
// Egen enkel testrunner, i linje med tests/hotfix-v1.4.1-facit-env.test.mjs.
//
// Körs: node tests/hotfix-2026-014-bumpless-reset.test.mjs

import { Simulation } from "./simulation/lib/sim-core-bridge.mjs";

let failed = 0;
let passed = 0;
function check(name, condition, detail) {
  if (condition) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

function makeScenario() {
  return {
    id: "hotfix-2026-014-check",
    process: { type: "integrating", K: 0.01, T: 1.0, L: 0.0, outflow: 0.5, normalValue: 20.0, measurementRange: { min: 0, max: 100 } },
    controller: { mode: "p", kp: 1.2, ti: 0, td: 0, antiWindup: true, outputLimits: { min: 0, max: 100 } },
    disturbance: { noiseStd: 0, pulse: { magnitude: 0, durationSteps: 0 } },
    runtime: { dt: 1.0, maxSteps: 1000, setpoint: 60.0, autopause: false },
  };
}

// ── 1. Reset under en PÅGÅENDE bumpless-övergång ska nollställa biasen helt ──
{
  const sim = new Simulation(makeScenario(), 42);
  sim.run(5); // några steg, godtyckligt utgångsläge

  // Simulera exakt det tillstånd app.js sätter direkt efter ett lägesbyte
  // med Bumpless aktiverat (syncParamsFromUI(), motsvarande rader) — en
  // bias-övergång påbörjad men INTE ännu konsumerad av något steg.
  sim.pid.bias = 40;
  sim.pid.biasFadeSteps = 5;
  sim.pid.biasFadePerStep = 8;
  sim.scenario.controller.bias = 40;

  sim.reset();

  check(
    "1a. sim.pid.bias === 0 efter reset (mitt i pågående bumpless-övergång)",
    sim.pid.bias === 0, `fick ${sim.pid.bias}`
  );
  check(
    "1b. sim.pid.biasFadeSteps === 0 efter reset",
    sim.pid.biasFadeSteps === 0, `fick ${sim.pid.biasFadeSteps}`
  );
  check(
    "1c. sim.scenario.controller.bias === 0 efter reset (detta var själva buggen)",
    sim.scenario.controller.bias === 0, `fick ${sim.scenario.controller.bias}`
  );
}

// ── 2. Efter en sådan reset ska nästa steg INTE återuppliva den gamla biasen ──
{
  const sim = new Simulation(makeScenario(), 42);
  sim.run(5);
  sim.pid.bias = 40;
  sim.pid.biasFadeSteps = 5;
  sim.pid.biasFadePerStep = 8;
  sim.scenario.controller.bias = 40;
  sim.reset();

  const frame = sim.step();
  const expectedError = sim.scenario.runtime.setpoint - sim.scenario.process.normalValue; // 60 - 20 = 40
  const expectedU = sim.scenario.controller.kp * expectedError; // ren P-term, ingen bias
  check(
    "2a. Första steget efter reset har u = Kp*fel (ingen kvarvarande bias adderad)",
    Math.abs(frame.u - expectedU) < 1e-9,
    `förväntade u=${expectedU}, fick u=${frame.u} (bias skulle ge u≈${expectedU + 40})`
  );
}

// ── 3. Normal (icke-bias) reset fortsätter fungera som förut ──
{
  const sim = new Simulation(makeScenario(), 42);
  sim.run(50);
  sim.reset();
  check("3a. sim.stepNo === 0 efter vanlig reset", sim.stepNo === 0);
  check("3b. PV === normalValue efter vanlig reset", sim.process.y === sim.scenario.process.normalValue, `fick ${sim.process.y}`);
  check("3c. history har exakt en startpunkt efter reset", sim.history.t.length === 1 && sim.history.y.length === 1);
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
