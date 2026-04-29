import fs from "node:fs";
import path from "node:path";
import { createSimulation } from "../../packages/sim-core/src/index.js";

const root = path.resolve(".");
const scenariosDir = path.join(root, "content", "scenarios");
const baselineFile = path.join(root, "tests", "reference", "baselines.v1.json");

const baselines = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
const seed = baselines.meta.seed;
const steps = baselines.meta.steps;

const tolerances = {
  state: {
    y: 1e-6,
    u: 1e-6,
    e: 1e-6
  },
  performance: {
    overshoot: 1e-6,
    iae: 1e-6,
    ise: 1e-6
  }
};

function assertClose(name, actual, expected, tol) {
  const delta = Math.abs(actual - expected);
  if (delta > tol) {
    throw new Error(`${name}: expected ${expected}, got ${actual}, delta=${delta}, tol=${tol}`);
  }
}

let failed = 0;
for (const [scenarioId, expected] of Object.entries(baselines.cases)) {
  const filePath = path.join(scenariosDir, `${scenarioId}.json`);
  if (!fs.existsSync(filePath)) {
    failed += 1;
    console.error(`FAIL ${scenarioId}: scenario file not found`);
    continue;
  }

  try {
    const scenario = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const sim = createSimulation(scenario, { seed });
    sim.run(steps);

    const state = sim.getState();
    const perf = sim.getPerformance();

    assertClose(`${scenarioId}.state.y`, state.y, expected.state.y, tolerances.state.y);
    assertClose(`${scenarioId}.state.u`, state.u, expected.state.u, tolerances.state.u);
    assertClose(`${scenarioId}.state.e`, state.e, expected.state.e, tolerances.state.e);

    assertClose(`${scenarioId}.perf.overshoot`, perf.overshoot, expected.performance.overshoot, tolerances.performance.overshoot);
    assertClose(`${scenarioId}.perf.iae`, perf.iae, expected.performance.iae, tolerances.performance.iae);
    assertClose(`${scenarioId}.perf.ise`, perf.ise, expected.performance.ise, tolerances.performance.ise);

    console.log(`OK ${scenarioId}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${scenarioId}: ${err.message}`);
  }
}

if (failed > 0) {
  process.exitCode = 1;
}
