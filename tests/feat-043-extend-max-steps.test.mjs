// FEAT-043 — Knapp för att släppa fram fler steg vid maxSteps-taket.
//
// Testar Simulation.baseMaxSteps/maxSteps/extendSteps() i apps/app/sim-core.js:
// scenariots eget tak bevaras oförändrat, det AKTIVA taket kan höjas utan att
// historik/tillstånd går förlorade, och reset() återställer taket till
// scenariots ursprungsvärde.
//
// Egen enkel testrunner, i linje med tests/hotfix-2026-014-bumpless-reset.test.mjs.
//
// Körs: node tests/feat-043-extend-max-steps.test.mjs

import { Simulation } from "./simulation/lib/sim-core-bridge.mjs";

let failed = 0;
let passed = 0;
function check(name, condition, detail) {
  if (condition) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

function makeScenario(maxSteps) {
  return {
    id: "feat-043-check",
    process: { type: "self_regulating", K: 1.3, T: 15.0, L: 0.0, normalValue: 0.0, measurementRange: { min: 0, max: 100 } },
    controller: { mode: "pi", kp: 1.2, ti: 20, td: 0, antiWindup: true, outputLimits: { min: 0, max: 100 } },
    disturbance: { noiseStd: 0, pulse: { magnitude: 0, durationSteps: 0 } },
    runtime: { dt: 1.0, maxSteps, setpoint: 60.0, autopause: false },
  };
}

// ── 1. baseMaxSteps/maxSteps sätts korrekt från scenariot ────────────────────
{
  const sim = new Simulation(makeScenario(5), 42);
  check("1a. baseMaxSteps matchar scenariots runtime.maxSteps", sim.baseMaxSteps === 5);
  check("1b. maxSteps startar lika med baseMaxSteps", sim.maxSteps === 5);
}

// ── 2. Taket nås tyst (oförändrat beteende) precis som innan FEAT-043 ───────
{
  const sim = new Simulation(makeScenario(5), 42);
  const frames = sim.run(10); // kör fler steg än taket tillåter
  check("2a. Exakt baseMaxSteps antal steg körs, resten stoppas", frames.length === 5, `fick ${frames.length}`);
  check("2b. stepNo === maxSteps efter att taket nåtts", sim.stepNo === sim.maxSteps);
  check("2c. Ytterligare step() returnerar null vid taket", sim.step() === null);
}

// ── 3. extendSteps() höjer taket utan att röra historik/tillstånd ───────────
{
  const sim = new Simulation(makeScenario(5), 42);
  sim.run(5); // nå taket
  const yBefore = sim.process.y;
  const historyLenBefore = sim.history.t.length;
  sim.extendSteps();
  check("3a. maxSteps höjt med exakt baseMaxSteps", sim.maxSteps === 10, `fick ${sim.maxSteps}`);
  check("3b. Processens tillstånd (y) opåverkat av extendSteps()", sim.process.y === yBefore);
  check("3c. Historiken opåverkad av extendSteps() (ingen rensning)", sim.history.t.length === historyLenBefore);
  const frame = sim.step();
  check("3d. Simuleringen kan fortsätta direkt efter extendSteps()", frame !== null);
  check("3e. Steg-numreringen fortsätter obrutet (ingen omstart)", sim.stepNo === 6, `fick ${sim.stepNo}`);
}

// ── 4. extendSteps() kan användas upprepade gånger ───────────────────────────
{
  const sim = new Simulation(makeScenario(3), 42);
  sim.run(3);
  sim.extendSteps();
  sim.run(3);
  sim.extendSteps();
  const frames = sim.run(3);
  check("4a. Tre på varandra följande extendSteps()-block ger 3×3=9 körda steg totalt", sim.stepNo === 9, `fick ${sim.stepNo}`);
  check("4b. Sista blockets tre steg kördes utan att stoppas i förtid", frames.length === 3);
}

// ── 5. reset() återställer taket till scenariots ursprungsvärde ─────────────
{
  const sim = new Simulation(makeScenario(5), 42);
  sim.run(5);
  sim.extendSteps();
  sim.extendSteps();
  check("5a. maxSteps höjt före reset (sanity check)", sim.maxSteps === 15);
  sim.reset();
  check("5b. maxSteps återställt till baseMaxSteps efter reset()", sim.maxSteps === sim.baseMaxSteps, `fick ${sim.maxSteps}`);
  check("5c. baseMaxSteps självt är oförändrat av reset()", sim.baseMaxSteps === 5);
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
