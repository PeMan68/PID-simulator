import fs from "node:fs";
import path from "node:path";
import { createSimulation } from "../../packages/sim-core/src/index.js";

const root = path.resolve(".");
const scenariosDir = path.join(root, "content", "scenarios");
const files = fs.readdirSync(scenariosDir).filter(f => f.endsWith(".json"));

let failed = 0;

for (const file of files) {
  const full = path.join(scenariosDir, file);
  const scenario = JSON.parse(fs.readFileSync(full, "utf8"));
  try {
    const sim = createSimulation(scenario, { seed: 42 });
    sim.run(20);
    const state = sim.getState();
    if (!Number.isFinite(state.y) || !Number.isFinite(state.u)) {
      throw new Error("Non-finite state value");
    }
    console.log(`OK ${scenario.id} step=${state.step} y=${state.y.toFixed(3)} u=${state.u.toFixed(3)}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${scenario.id}: ${err.message}`);
  }
}

if (failed > 0) {
  process.exitCode = 1;
}
