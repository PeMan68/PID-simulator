import { createSimulation } from "../../packages/sim-core/src/index.js";

const scenarioSelect = document.getElementById("scenario");
const loadBtn = document.getElementById("load");
const stepBtn = document.getElementById("step");
const run10Btn = document.getElementById("run10");
const pulseBtn = document.getElementById("pulse");
const resetBtn = document.getElementById("reset");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const chartCanvas = document.getElementById("chart");

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

function fitCanvasToDisplay() {
  const width = Math.max(680, chartCanvas.clientWidth);
  if (chartCanvas.width !== width) {
    chartCanvas.width = width;
  }
}

function drawSeries(ctx, points, color, dashed = false) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dashed ? [6, 4] : []);
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawChart() {
  if (!sim) return;

  fitCanvasToDisplay();
  const ctx = chartCanvas.getContext("2d");
  const w = chartCanvas.width;
  const h = chartCanvas.height;
  const pad = { left: 52, right: 16, top: 14, bottom: 28 };

  const history = sim.getHistory();
  const t = history.t;
  const y = history.y;
  const sp = history.sp;
  const u = history.u;

  const tMin = 0;
  const tMax = Math.max(1, t[t.length - 1] || 1);

  const processRange = sim.scenario.process.measurementRange;
  const yMin = processRange.min;
  const yMax = processRange.max;
  const uMin = sim.scenario.controller.outputLimits.min;
  const uMax = sim.scenario.controller.outputLimits.max;

  const xScale = val => pad.left + ((val - tMin) / (tMax - tMin)) * (w - pad.left - pad.right);
  const yScaleTop = val => pad.top + (1 - (val - yMin) / (yMax - yMin || 1)) * (h * 0.62 - pad.top);
  const yScaleBottom = val => h * 0.68 + (1 - (val - uMin) / (uMax - uMin || 1)) * (h - pad.bottom - h * 0.68);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#d8d8d8";
  ctx.lineWidth = 1;
  ctx.strokeRect(pad.left, pad.top, w - pad.left - pad.right, h * 0.62 - pad.top);
  ctx.strokeRect(pad.left, h * 0.68, w - pad.left - pad.right, h - pad.bottom - h * 0.68);

  ctx.fillStyle = "#444";
  ctx.font = "12px Segoe UI";
  ctx.fillText("PV/SP", 12, 24);
  ctx.fillText("MO", 20, h * 0.68 + 16);
  ctx.fillText("Tid", w - 34, h - 8);

  const pvPoints = t.map((tv, i) => ({ x: xScale(tv), y: yScaleTop(y[i]) }));
  const spPoints = t.map((tv, i) => ({ x: xScale(tv), y: yScaleTop(sp[i]) }));
  const uPoints = t.map((tv, i) => ({ x: xScale(tv), y: yScaleBottom(u[i]) }));

  drawSeries(ctx, pvPoints, "#1266f1");
  drawSeries(ctx, spPoints, "#d64545", true);
  drawSeries(ctx, uPoints, "#2f9e44");
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
  drawChart();
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
  drawChart();
});

run10Btn.addEventListener("click", () => {
  if (!ensureSim()) return;
  const frames = sim.run(10);
  appendLog(`Korde ${frames.length} steg.`);
  const perf = sim.getPerformance();
  appendLog(`Perf: overshoot=${perf.overshoot?.toFixed?.(3) ?? "null"}, iae=${perf.iae.toFixed(3)}, ise=${perf.ise.toFixed(3)}`);
  updateStatus();
  drawChart();
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
  drawChart();
});

loadScenario(scenarioFiles[0]).catch(err => appendLog(`Fel vid autoload: ${err.message}`));

window.addEventListener("resize", () => {
  drawChart();
});
