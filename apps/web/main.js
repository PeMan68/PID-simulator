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
const applyParamsBtn = document.getElementById("applyParams");
const learningPathSelect = document.getElementById("learningPath");
const loadPathBtn = document.getElementById("loadPath");
const nextStepBtn = document.getElementById("nextStep");
const learnBody = document.getElementById("learnBody");

const fieldK = document.getElementById("k");
const fieldT = document.getElementById("t");
const fieldL = document.getElementById("l");
const fieldKp = document.getElementById("kp");
const fieldTi = document.getElementById("ti");
const fieldTd = document.getElementById("td");
const fieldSp = document.getElementById("sp");
const fieldUmin = document.getElementById("umin");
const fieldUmax = document.getElementById("umax");
const fieldMode = document.getElementById("mode");
const fieldNoise = document.getElementById("noise");
const fieldPulseMag = document.getElementById("pulseMag");
const fieldHysteresLower = document.getElementById("hysteresLower");
const fieldHysteresUpper = document.getElementById("hysteresUpper");
const clearChartBtn = document.getElementById("clearChart");
const systemResetBtn = document.getElementById("systemReset");
const stepBackBtn = document.getElementById("stepBack");

let sim = null;
let currentScenario = null;
let currentLearningPath = null;
let currentLearningStep = -1;

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

const learningPathFiles = ["basic-learning-path.v1.json"];

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
  const yMin = Math.min(processRange.min, 0);
  const yMax = Math.max(processRange.max, 100);
  const uMin = sim.scenario.controller.outputLimits.min;
  const uMax = sim.scenario.controller.outputLimits.max;

  const xScale = val => pad.left + ((val - tMin) / (tMax - tMin)) * (w - pad.left - pad.right);
  const yScaleTop = val => pad.top + (1 - (val - yMin) / (yMax - yMin || 1)) * (h * 0.62 - pad.top);
  const yScaleBottom = val => h * 0.68 + (1 - (val - uMin) / (uMax - uMin || 1)) * (h - pad.bottom - h * 0.68);

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Rektanglar för grafer
  ctx.strokeStyle = "#d8d8d8";
  ctx.lineWidth = 1;
  ctx.strokeRect(pad.left, pad.top, w - pad.left - pad.right, h * 0.62 - pad.top);
  ctx.strokeRect(pad.left, h * 0.68, w - pad.left - pad.right, h - pad.bottom - h * 0.68);

  // Y-axel etiketter för PV/SP
  ctx.fillStyle = "#666";
  ctx.font = "11px Segoe UI";
  ctx.textAlign = "right";
  ctx.fillText("100", pad.left - 8, yScaleTop(100) + 4);
  ctx.fillText("0", pad.left - 8, yScaleTop(0) + 4);

  // Y-axel etiketter för u (nedre grafen)
  const uScaleTop = h * 0.68;
  const uScaleBottom = h - pad.bottom;
  const uRangeHeight = uScaleBottom - uScaleTop;
  ctx.fillText("100", pad.left - 8, uScaleTop + (1 - 100 / (uMax - uMin || 1)) * uRangeHeight + 4);
  ctx.fillText("0", pad.left - 8, uScaleTop + (1 - 0 / (uMax - uMin || 1)) * uRangeHeight + 4);

  // Visar hystersgränser om on/off reglering
  if (sim.scenario.controller.mode === "onoff") {
    const sp_current = sp[sp.length - 1] ?? sim.scenario.runtime.setpoint;
    const hysteresis = sim.scenario.controller.hysteresis || { lower: 2, upper: 2 };
    const lowerBound = yScaleTop(sp_current - hysteresis.lower);
    const upperBound = yScaleTop(sp_current + hysteresis.upper);

    ctx.strokeStyle = "#ff9900";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    
    ctx.beginPath();
    ctx.moveTo(pad.left, lowerBound);
    ctx.lineTo(w - pad.right, lowerBound);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pad.left, upperBound);
    ctx.lineTo(w - pad.right, upperBound);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  ctx.fillStyle = "#444";
  ctx.font = "12px Segoe UI";
  ctx.textAlign = "left";
  ctx.fillText("PV/SP", 12, 24);
  ctx.fillText("u", 20, h * 0.68 + 28);
  ctx.textAlign = "right";
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
  const pidInfo = (s.pTerm !== 0 || s.iTerm !== 0 || s.dTerm !== 0) 
    ? ` | P=${s.pTerm.toFixed(2)}, I=${s.iTerm.toFixed(2)}, D=${s.dTerm.toFixed(2)}`
    : "";
  statusEl.textContent = `Status: steg=${s.step}, t=${s.t.toFixed(2)}, y=${s.y.toFixed(3)}, u=${s.u.toFixed(3)}, e=${s.e.toFixed(3)}${pidInfo}`;
}

function hydrateFieldsFromScenario(scenario) {
  fieldK.value = scenario.process.K;
  fieldT.value = scenario.process.T;
  fieldL.value = scenario.process.L;
  fieldKp.value = scenario.controller.kp ?? 0;
  fieldTi.value = scenario.controller.ti ?? 0;
  fieldTd.value = scenario.controller.td ?? 0;
  fieldSp.value = scenario.runtime.setpoint;
  fieldUmin.value = scenario.controller.outputLimits.min;
  fieldUmax.value = scenario.controller.outputLimits.max;
  fieldMode.value = scenario.controller.mode;
  fieldNoise.value = scenario.disturbance?.noiseStd ?? 0;
  fieldPulseMag.value = scenario.disturbance?.pulse?.magnitude ?? 0;
  fieldHysteresLower.value = scenario.controller.hysteresis?.lower ?? 2;
  fieldHysteresUpper.value = scenario.controller.hysteresis?.upper ?? 2;
}

async function loadScenario(fileName) {
  const res = await fetch(`../../content/scenarios/${fileName}`);
  if (!res.ok) {
    throw new Error(`Kunde inte ladda scenario: ${fileName}`);
  }
  const scenario = await res.json();
  currentScenario = scenario;
  sim = createSimulation(scenario, { seed: 42 });
  logEl.textContent = "";
  appendLog(`Laddat scenario: ${scenario.id}`);
  hydrateFieldsFromScenario(scenario);
  updateControllerUIState();
  updateStatus();
  drawChart();
}

function applyParameterChanges() {
  if (!currentScenario) return;

  // Spara historiken före
  const oldHistory = sim ? sim.getHistory() : null;

  currentScenario.process.K = Number(fieldK.value);
  currentScenario.process.T = Number(fieldT.value);
  currentScenario.process.L = Number(fieldL.value);
  currentScenario.controller.kp = Number(fieldKp.value);
  currentScenario.controller.ti = Number(fieldTi.value);
  currentScenario.controller.td = Number(fieldTd.value);
  currentScenario.runtime.setpoint = Number(fieldSp.value);
  currentScenario.controller.outputLimits.min = Number(fieldUmin.value);
  currentScenario.controller.outputLimits.max = Number(fieldUmax.value);
  currentScenario.controller.mode = fieldMode.value;
  
  if (!currentScenario.controller.hysteresis) {
    currentScenario.controller.hysteresis = {};
  }
  currentScenario.controller.hysteresis.lower = Number(fieldHysteresLower.value);
  currentScenario.controller.hysteresis.upper = Number(fieldHysteresUpper.value);

  if (!currentScenario.disturbance) currentScenario.disturbance = {};
  currentScenario.disturbance.noiseStd = Number(fieldNoise.value);
  if (!currentScenario.disturbance.pulse) {
    currentScenario.disturbance.pulse = { magnitude: 0, durationSteps: 0 };
  }
  currentScenario.disturbance.pulse.magnitude = Number(fieldPulseMag.value);

  sim = createSimulation(currentScenario, { seed: 42 });
  
  // Återställ historiken
  if (oldHistory && oldHistory.t.length > 0) {
    sim.history = oldHistory;
    sim.currentStep = oldHistory.t.length / sim.dt;
    appendLog("Parametrar applicerade. Grafen behålls.");
  } else {
    appendLog("Parametrar applicerade och simulering omstartad.");
  }
  
  updateControllerUIState();
  updateStatus();
  drawChart();
}

function updateControllerUIState() {
  const mode = fieldMode.value;
  const isP = mode === "p";
  const isPI = mode === "pi";
  const isManual = mode === "manual";
  const isOnOff = mode === "onoff";
  
  // Enable/disable fields based on mode
  fieldKp.disabled = isManual || isOnOff;
  fieldTi.disabled = isP || isManual || isOnOff;
  fieldTd.disabled = isP || isPI || isManual || isOnOff;
  
  // Hide/show field groups
  const tiField = fieldTi.parentElement;
  const tdField = fieldTd.parentElement;
  tiField.style.opacity = (isP || isManual || isOnOff) ? "0.5" : "1";
  tiField.style.pointerEvents = (isP || isManual || isOnOff) ? "none" : "auto";
  tdField.style.opacity = (isP || isPI || isManual || isOnOff) ? "0.5" : "1";
  tdField.style.pointerEvents = (isP || isPI || isManual || isOnOff) ? "none" : "auto";
}
}

async function loadLearningPath(fileName) {
  const res = await fetch(`../../content/exercises/${fileName}`);
  if (!res.ok) {
    throw new Error(`Kunde inte ladda lärstig: ${fileName}`);
  }
  currentLearningPath = await res.json();
  currentLearningStep = -1;
  learnBody.textContent = `Laddad lärstig: ${currentLearningPath.title}\nKlicka Nästa steg för att börja.`;
}

async function showNextLearningStep() {
  if (!currentLearningPath) {
    learnBody.textContent = "Ingen lärstig laddad.";
    return;
  }

  currentLearningStep += 1;
  if (currentLearningStep >= currentLearningPath.steps.length) {
    currentLearningStep = currentLearningPath.steps.length - 1;
    learnBody.textContent = "Lärstigen är klar. Välj scenario och fortsätt experimentera.";
    return;
  }

  const step = currentLearningPath.steps[currentLearningStep];

  if (step.type === "theory") {
    const res = await fetch(`../../content/theory/${step.ref}`);
    if (!res.ok) {
      throw new Error(`Kunde inte ladda teoristeg: ${step.ref}`);
    }
    const theory = await res.json();
    learnBody.textContent = `${step.title}\nMål: ${step.objective}\n\n${theory.summary}\n\n- ${theory.bullets.join("\n- ")}`;
    return;
  }

  if (step.type === "scenario") {
    scenarioSelect.value = step.ref;
    await loadScenario(step.ref);
    learnBody.textContent = `${step.title}\nMål: ${step.objective}\n\nScenario ${step.ref} laddades automatiskt.`;
  }
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

for (const fileName of learningPathFiles) {
  const opt = document.createElement("option");
  opt.value = fileName;
  opt.textContent = fileName;
  learningPathSelect.appendChild(opt);
}

loadBtn.addEventListener("click", async () => {
  try {
    await loadScenario(scenarioSelect.value);
  } catch (err) {
    appendLog(`Fel: ${err.message}`);
  }
});

fieldMode.addEventListener("change", updateControllerUIState);

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
  appendLog("Simulering återställd.");
  updateStatus();
  drawChart();
});

applyParamsBtn.addEventListener("click", () => {
  applyParameterChanges();
});

loadPathBtn.addEventListener("click", async () => {
  try {
    await loadLearningPath(learningPathSelect.value);
  } catch (err) {
    appendLog(`Fel: ${err.message}`);
  }
});

nextStepBtn.addEventListener("click", async () => {
  try {
    await showNextLearningStep();
  } catch (err) {
    appendLog(`Fel: ${err.message}`);
  }
});

clearChartBtn.addEventListener("click", () => {
  if (!sim) return;
  sim.history = {
    t: [],
    y: [],
    u: [],
    e: [],
    sp: [],
    i: [],
    d: [],
    p: []
  };
  sim.currentStep = 0;
  appendLog("Graf nollställd. Simulering fortsätter från aktuell punkt.");
  updateStatus();
  drawChart();
});

systemResetBtn.addEventListener("click", () => {
  if (!ensureSim()) return;
  sim.reset();
  sim.history = {
    t: [],
    y: [],
    u: [],
    e: [],
    sp: [],
    i: [],
    d: [],
    p: []
  };
  sim.currentStep = 0;
  appendLog("System återställt till utgångspunkt.");
  updateStatus();
  drawChart();
});

stepBackBtn.addEventListener("click", () => {
  appendLog("Stega tillbaka är inte ännu implementerat. Ladda scenario på nytt för att börja om.");
});

loadScenario(scenarioFiles[0]).catch(err => appendLog(`Fel vid autoload: ${err.message}`));

window.addEventListener("resize", () => {
  drawChart();
});
