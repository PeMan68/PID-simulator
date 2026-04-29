import { createSimulation } from "../../packages/sim-core/src/index.js";

const scenarioSelect = document.getElementById("scenario");
const loadBtn = document.getElementById("load");
const stepBtn = document.getElementById("step");
const run10Btn = document.getElementById("run10");
const pulseBtn = document.getElementById("pulse");
const resetBtn = document.getElementById("reset");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");

let sim = null;

const scenarioFiles = [
  "basic-step-self-regulating.json",
  "p-step-self-regulating.json",
  "pi-step-self-regulating.json",
  "onoff-hysteresis-basic.json",
  "manual-open-loop.json",
  "pid-disturbance-noise.json",
  "pid-pulse-rejection.json",
  "integrating-experimental.json",
  "unstable-experimental.json"
];

function appendLog(line) {
  logEl.textContent += `${line}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

function updateStatus() {
  if (!sim) {
    statusEl.textContent = "Status: ej laddad";
    return;
  }
  const s = sim.getState();
  statusEl.textContent = `Status: steg=${s.step}, t=${s.t.toFixed(2)}, y=${s.y.toFixed(3)}, u=${s.u.toFixed(3)}, e=${s.e.toFixed(3)}`;
}

async function loadScenario(fileName) {
  const res = await fetch(`../../content/scenarios/${fileName}`);
  if (!res.ok) {
    throw new Error(`Kunde inte ladda scenario: ${fileName}`);
  }
  const scenario = await res.json();
  sim = createSimulation(scenario, { seed: 42 });
  logEl.textContent = "";
  appendLog(`Laddat scenario: ${scenario.id}`);
  updateStatus();
}

function ensureSim() {
  if (!sim) {
    appendLog("Ingen simulering laddad.");
    return false;
  }
  return true;
}

for (const name of scenarioFiles) {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  scenarioSelect.appendChild(opt);
}

loadBtn.addEventListener("click", async () => {
  try {
    await loadScenario(scenarioSelect.value);
  } catch (err) {
    appendLog(`Fel: ${err.message}`);
  }
});

stepBtn.addEventListener("click", () => {
  if (!ensureSim()) return;
  const frame = sim.step();
  if (!frame) {
    appendLog("Simulering stoppad (maxSteps). ");
  } else {
    appendLog(`Step: t=${frame.t.toFixed(2)} y=${frame.y.toFixed(3)} u=${frame.u.toFixed(3)}`);
  }
  updateStatus();
});

run10Btn.addEventListener("click", () => {
  if (!ensureSim()) return;
  const frames = sim.run(10);
  appendLog(`Korde ${frames.length} steg.`);
  const perf = sim.getPerformance();
  appendLog(`Perf: overshoot=${perf.overshoot?.toFixed?.(3) ?? "null"}, iae=${perf.iae.toFixed(3)}, ise=${perf.ise.toFixed(3)}`);
  updateStatus();
});

pulseBtn.addEventListener("click", () => {
  if (!ensureSim()) return;
  sim.triggerPulse();
  appendLog("Puls triggas (om scenario har pulse.durationSteps > 0).");
});

resetBtn.addEventListener("click", () => {
  if (!ensureSim()) return;
  sim.reset();
  appendLog("Simulering aterstalld.");
  updateStatus();
});

loadScenario(scenarioFiles[0]).catch(err => appendLog(`Fel vid autoload: ${err.message}`));
