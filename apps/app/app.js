/* Standalone version: no imports, no fetch, no server dependency */

const SCENARIOS = {
  "basic-step-self-regulating.json": {
    id: "basic-step-self-regulating", runtime: { dt: 1, maxSteps: 2000, setpoint: 50 },
    process: { type: "self_regulating", K: 1.5, T: 5, L: 1, normalValue: 0, measurementRange: { min: 0, max: 100 } },
    controller: { mode: "pid", kp: 2, ti: 10, td: 1, antiWindup: true, outputLimits: { min: 0, max: 100 }, onoff: { hysteresisType: "both", high: 2, low: 2 } },
    disturbance: { noiseStd: 0, pulse: { magnitude: 0, durationSteps: 0 } }
  },
  "p-step-self-regulating.json": {
    id: "p-step-self-regulating", runtime: { dt: 1, maxSteps: 600, setpoint: 60 },
    process: { type: "self_regulating", K: 1.3, T: 15, L: 0, normalValue: 0, measurementRange: { min: 0, max: 100 } },
    controller: { mode: "p", kp: 1, ti: 0, td: 0, antiWindup: true, outputLimits: { min: 0, max: 100 } },
    disturbance: { noiseStd: 0, pulse: { magnitude: 0, durationSteps: 0 } }
  },
  "pi-step-self-regulating.json": {
    id: "pi-step-self-regulating", runtime: { dt: 1, maxSteps: 600, setpoint: 60 },
    process: { type: "self_regulating", K: 1.3, T: 15, L: 0, normalValue: 0, measurementRange: { min: 0, max: 100 } },
    controller: { mode: "pi", kp: 1.2, ti: 20, td: 0, antiWindup: true, outputLimits: { min: 0, max: 100 } },
    disturbance: { noiseStd: 0, pulse: { magnitude: 0, durationSteps: 0 } }
  }
};

const THEORY = {
  "pid-intro.v1.json": {
    title: "Introduktion till reglering",
    summary: "Grundidé: regulatorn justerar utsignalen så att processvärdet når börvärdet.",
    bullets: ["PV är processvärdet som mäts.", "SP är börvärdet.", "MO är utsignalen.", "P reagerar på fel.", "I tar bort stationärt fel.", "D dämpar snabba förändringar."]
  }
};

const LEARNING_PATHS = {
  "basic-learning-path.v1.json": {
    title: "Grundstig: teori till simulering",
    steps: [
      { type: "theory", ref: "pid-intro.v1.json", title: "Teori", objective: "Förstå PV, SP och MO." },
      { type: "scenario", ref: "basic-step-self-regulating.json", title: "PID-bas", objective: "Se stegsvar i praktiken." },
      { type: "scenario", ref: "p-step-self-regulating.json", title: "P-reglering", objective: "Observera stationärt fel." },
      { type: "scenario", ref: "pi-step-self-regulating.json", title: "PI-reglering", objective: "Jämför mot P." }
    ]
  }
};

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

class OnOffController {
  constructor(cfg = {}) { this.hysteresisType = cfg.hysteresisType || "both"; this.high = cfg.high || 2; this.low = cfg.low || 2; this.output = 0; }
  reset() { this.output = 0; }
  step(sp, pv, limits) {
    const umin = limits.min, umax = limits.max;
    if (this.hysteresisType === "upper") { if (pv < sp) this.output = umax; else if (pv > sp + this.high) this.output = umin; }
    else if (this.hysteresisType === "lower") { if (pv > sp) this.output = umin; else if (pv < sp - this.low) this.output = umax; }
    else { if (pv < sp - this.low) this.output = umax; else if (pv > sp + this.high) this.output = umin; }
    if (this.output < umin) this.output = umin; if (this.output > umax) this.output = umax;
    return this.output;
  }
}

class PIDController {
  constructor(cfg = {}, dt = 1) { this.kp = cfg.kp || 0; this.ti = cfg.ti || 0; this.td = cfg.td || 0; this.dt = dt; this.integral = 0; this.prevPv = 0; this.mode = "pid"; }
  reset() { this.integral = 0; this.prevPv = 0; }
  step(sp, pv, limits, antiWindup) {
    const error = sp - pv;
    const integralCandidate = this.integral + error * this.dt;
    const derivative = (pv - this.prevPv) / this.dt;
    const iTerm = this.ti > 1e-9 ? integralCandidate / this.ti : 0;
    const raw = this.kp * (error + iTerm - this.td * derivative);
    const u = Math.max(limits.min, Math.min(limits.max, raw));
    // Only update integral if not in P-only mode
    if (this.mode !== "p") {
      if (!antiWindup) this.integral = integralCandidate;
      else {
        const ok = (u === limits.min && error > 0) || (u === limits.max && error < 0) || (u > limits.min && u < limits.max);
        if (ok) this.integral = integralCandidate;
      }
    }
    this.prevPv = pv;
    const pTerm = this.kp * error;
    const dTerm = -this.kp * this.td * derivative;
    return { u: u, error: error, integral: this.integral, derivative: derivative, pTerm: pTerm, iTerm: (this.mode === "p" || this.mode === "onoff" || this.mode === "manual") ? 0 : this.kp * iTerm, dTerm: (this.mode === "p" || this.mode === "pi" || this.mode === "onoff" || this.mode === "manual") ? 0 : dTerm };
  }
}

class ProcessModel {
  constructor(cfg, dt) {
    this.cfg = cfg;
    this.y = cfg.normalValue;
    this.delay = new Array(Math.max(1, Math.ceil(cfg.L / dt))).fill(0);
  }
  reset() { this.y = this.cfg.normalValue; this.delay.fill(0); }
  step(u, dt, disturbance) {
    this.delay.push(u);
    const ud = this.delay.shift();
    const T = this.cfg.T > 1e-9 ? this.cfg.T : 1e-9;
    if (this.cfg.type === "integrating") this.y += ((this.cfg.K * ud) * dt) / T;
    else if (this.cfg.type === "unstable") this.y += ((this.y - this.cfg.normalValue + this.cfg.K * ud) * dt) / T;
    else this.y += ((-(this.y - this.cfg.normalValue) + this.cfg.K * ud) * dt) / T;
    this.y += disturbance;
    return this.y;
  }
}

function seededRandom(seed) { let s = seed >>> 0; return function() { s = (1664525 * s + 1013904223) >>> 0; return s / 0xffffffff; }; }
function gaussian(rng) { const u1 = Math.max(rng(), 1e-12), u2 = Math.max(rng(), 1e-12); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }

class Simulation {
  constructor(scenario, seed) {
    this.scenario = scenario;
    this.dt = scenario.runtime.dt;
    this.maxSteps = scenario.runtime.maxSteps;
    this.stepNo = 0;
    this.rng = seededRandom(seed || 42);
    this.process = new ProcessModel(scenario.process, this.dt);
    this.pid = new PIDController(scenario.controller, this.dt);
    const onoffCfg = scenario.controller.onoff || {};
    const hysteresisCfg = scenario.controller.hysteresis || {};
    this.onoff = new OnOffController({ ...onoffCfg, low: hysteresisCfg.lower ?? onoffCfg.low ?? 2, high: hysteresisCfg.upper ?? onoffCfg.high ?? 2 });
    this.pulseStepsLeft = 0;
    this.history = { t: [0], y: [this.process.y], sp: [scenario.runtime.setpoint], u: [0], e: [scenario.runtime.setpoint - this.process.y], p: [0], i: [0], d: [0] };
  }
  reset() { this.stepNo = 0; this.process.reset(); this.pid.reset(); this.onoff.reset(); this.pulseStepsLeft = 0; this.history = { t: [0], y: [this.process.y], sp: [this.scenario.runtime.setpoint], u: [0], e: [this.scenario.runtime.setpoint - this.process.y], p: [0], i: [0], d: [0] }; }
  triggerPulse() { const p = this.scenario.disturbance.pulse; if (p && p.durationSteps > 0) this.pulseStepsLeft = p.durationSteps; }
  step() {
    if (this.stepNo >= this.maxSteps) return null;
    const sp = this.scenario.runtime.setpoint;
    const pv = this.process.y;
    const mode = this.scenario.controller.mode;
    const limits = this.scenario.controller.outputLimits;
    let ctrl;
    if (mode === "manual") ctrl = { u: this.scenario.controller.manualOutput || 0, error: sp - pv, pTerm: 0, iTerm: 0, dTerm: 0 };
    else if (mode === "onoff") ctrl = { u: this.onoff.step(sp, pv, limits), error: sp - pv, pTerm: 0, iTerm: 0, dTerm: 0 };
    else {
      this.pid.mode = mode;
      if (mode === "p") { this.pid.ti = 0; this.pid.td = 0; this.pid.integral = 0; this.pid.prevPv = pv; }
      if (mode === "pi") { this.pid.td = 0; this.pid.prevPv = pv; }
      this.pid.kp = this.scenario.controller.kp || 0;
      this.pid.ti = this.scenario.controller.ti || 0;
      this.pid.td = this.scenario.controller.td || 0;
      ctrl = this.pid.step(sp, pv, limits, this.scenario.controller.antiWindup !== false);
    }
    let disturbance = 0;
    if ((this.scenario.disturbance.noiseStd || 0) > 0) disturbance += gaussian(this.rng) * this.scenario.disturbance.noiseStd;
    if (this.pulseStepsLeft > 0) { disturbance += this.scenario.disturbance.pulse.magnitude || 0; this.pulseStepsLeft -= 1; }
    const y = this.process.step(ctrl.u, this.dt, disturbance);
    this.stepNo += 1;
    const t = this.stepNo * this.dt;
    this.history.t.push(t); this.history.y.push(y); this.history.sp.push(sp); this.history.u.push(ctrl.u); this.history.e.push(ctrl.error); this.history.p.push(ctrl.pTerm || 0); this.history.i.push(ctrl.iTerm || 0); this.history.d.push(ctrl.dTerm || 0);
    return { t: t, y: y, u: ctrl.u, e: ctrl.error };
  }
  run(n) { const frames = []; for (let i = 0; i < n; i += 1) { const f = this.step(); if (!f) break; frames.push(f); } return frames; }
  getState() { const i = this.history.t.length - 1; return { step: this.stepNo, t: this.history.t[i], y: this.history.y[i], u: this.history.u[i], e: this.history.e[i], pTerm: this.history.p[i] || 0, iTerm: this.history.i[i] || 0, dTerm: this.history.d[i] || 0 }; }
}

const scenarioSelect = document.getElementById("scenario");
const learningPathSelect = document.getElementById("learningPath");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const chartCanvas = document.getElementById("chart");
const learnBody = document.getElementById("learnBody");

const fields = {
  k: document.getElementById("k"), t: document.getElementById("t"), l: document.getElementById("l"),
  kp: document.getElementById("kp"), ti: document.getElementById("ti"), td: document.getElementById("td"),
  sp: document.getElementById("sp"), umin: document.getElementById("umin"), umax: document.getElementById("umax"),
  manualOutput: document.getElementById("manualOutput"),
  mode: document.getElementById("mode"), noise: document.getElementById("noise"), pulseMag: document.getElementById("pulseMag"),
  hysteresLower: document.getElementById("hysteresLower"), hysteresUpper: document.getElementById("hysteresUpper")
};

let currentScenario = null;
let sim = null;
let currentPath = null;
let currentPathStep = -1;

function appendLog(line) { logEl.textContent += line + "\n"; logEl.scrollTop = logEl.scrollHeight; }
function fitCanvas() { const w = Math.max(680, chartCanvas.clientWidth); if (chartCanvas.width !== w) chartCanvas.width = w; }
function drawSeries(ctx, points, color, dashed) {
  if (!points.length) return;
  ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash(dashed ? [6, 4] : []);
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke(); ctx.setLineDash([]);
}
function drawChart() {
  if (!sim) return;
  fitCanvas();
  const ctx = chartCanvas.getContext("2d");
  const w = chartCanvas.width, h = chartCanvas.height;
  const pad = { left: 52, right: 16, top: 14, bottom: 28 };
  const t = sim.history.t, y = sim.history.y, sp = sim.history.sp, u = sim.history.u;
  const tMax = Math.max(1, t[t.length - 1] || 1);
  const yMin = Math.min(sim.scenario.process.measurementRange.min, 0);
  const yMax = Math.max(sim.scenario.process.measurementRange.max, 100);
  const uMin = sim.scenario.controller.outputLimits.min, uMax = sim.scenario.controller.outputLimits.max;
  const xScale = v => pad.left + (v / tMax) * (w - pad.left - pad.right);
  const yScaleTop = v => pad.top + (1 - (v - yMin) / (yMax - yMin || 1)) * (h * 0.62 - pad.top);
  const yScaleBot = v => h * 0.68 + (1 - (v - uMin) / (uMax - uMin || 1)) * (h - pad.bottom - h * 0.68);
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#d8d8d8"; ctx.strokeRect(pad.left, pad.top, w - pad.left - pad.right, h * 0.62 - pad.top); ctx.strokeRect(pad.left, h * 0.68, w - pad.left - pad.right, h - pad.bottom - h * 0.68);
  
  // Y-axel etiketter för PV/SP
  ctx.fillStyle = "#666"; ctx.font = "11px Segoe UI"; ctx.textAlign = "right";
  ctx.fillText("100", pad.left - 8, yScaleTop(100) + 4);
  ctx.fillText("0", pad.left - 8, yScaleTop(0) + 4);
  
  // Y-axel etiketter för u (nedre grafen)
  const uScaleTop = h * 0.68;
  const uScaleBot = h - pad.bottom;
  const uRangeHeight = uScaleBot - uScaleTop;
  ctx.fillText("100", pad.left - 8, uScaleTop + (1 - 100 / (uMax - uMin || 1)) * uRangeHeight + 4);
  ctx.fillText("0", pad.left - 8, uScaleTop + (1 - 0 / (uMax - uMin || 1)) * uRangeHeight + 4);
  
  // Hystersgränser för on/off
  if (sim.scenario.controller.mode === "onoff") {
    const sp_current = sp[sp.length - 1] ?? sim.scenario.runtime.setpoint;
    const hysteresis = sim.scenario.controller.hysteresis || { lower: 2, upper: 2 };
    const lowerBound = yScaleTop(sp_current - hysteresis.lower);
    const upperBound = yScaleTop(sp_current + hysteresis.upper);
    ctx.strokeStyle = "#ff9900"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.left, lowerBound); ctx.lineTo(w - pad.right, lowerBound); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad.left, upperBound); ctx.lineTo(w - pad.right, upperBound); ctx.stroke();
    ctx.setLineDash([]);
  }
  
  ctx.fillStyle = "#444"; ctx.font = "12px Segoe UI"; ctx.textAlign = "left";
  ctx.fillText("PV/SP", pad.left + 6, pad.top + 14);
  ctx.fillText("u", pad.left + 6, h * 0.68 + 16);
  drawSeries(ctx, t.map((tv, i) => ({ x: xScale(tv), y: yScaleTop(y[i]) })), "#1266f1", false);
  drawSeries(ctx, t.map((tv, i) => ({ x: xScale(tv), y: yScaleTop(sp[i]) })), "#d64545", true);
  drawSeries(ctx, t.map((tv, i) => ({ x: xScale(tv), y: yScaleBot(u[i]) })), "#2f9e44", false);
}
function updateStatus() {
  if (!sim) { statusEl.textContent = "Status: ej laddad"; return; }
  const s = sim.getState();
  const pidInfo = (s.pTerm !== 0 || s.iTerm !== 0 || s.dTerm !== 0) 
    ? " | P=" + s.pTerm.toFixed(2) + ", I=" + s.iTerm.toFixed(2) + ", D=" + s.dTerm.toFixed(2)
    : "";
  statusEl.textContent = "Status: steg=" + s.step + ", t=" + s.t.toFixed(2) + ", y=" + s.y.toFixed(3) + ", u=" + s.u.toFixed(3) + ", e=" + s.e.toFixed(3) + pidInfo;
}
function hydrateFields(s) {
  fields.k.value = s.process.K; fields.t.value = s.process.T; fields.l.value = s.process.L;
  fields.kp.value = s.controller.kp || 0; fields.ti.value = s.controller.ti || 0; fields.td.value = s.controller.td || 0;
  fields.manualOutput.value = s.controller.manualOutput ?? 0;
  fields.sp.value = s.runtime.setpoint; fields.umin.value = s.controller.outputLimits.min; fields.umax.value = s.controller.outputLimits.max;
  fields.mode.value = s.controller.mode; fields.noise.value = s.disturbance.noiseStd || 0; fields.pulseMag.value = s.disturbance.pulse.magnitude || 0;
  fields.hysteresLower.value = s.controller.hysteresis?.lower ?? 2;
  fields.hysteresUpper.value = s.controller.hysteresis?.upper ?? 2;
}
function loadScenarioByName(name) {
  currentScenario = deepClone(SCENARIOS[name]);
  sim = new Simulation(currentScenario, 42);
  hydrateFields(currentScenario);
  appendLog("Laddat scenario: " + currentScenario.id);
  updateControllerUIState();
  updateStatus(); drawChart();
}
function applyParams() {
  if (!currentScenario) return;
  const oldHistory = sim ? sim.history : null;
  currentScenario.process.K = Number(fields.k.value); currentScenario.process.T = Number(fields.t.value); currentScenario.process.L = Number(fields.l.value);
  currentScenario.controller.kp = Number(fields.kp.value); currentScenario.controller.ti = Number(fields.ti.value); currentScenario.controller.td = Number(fields.td.value);
  currentScenario.controller.manualOutput = Number(fields.manualOutput.value);
  currentScenario.runtime.setpoint = Number(fields.sp.value); currentScenario.controller.outputLimits.min = Number(fields.umin.value); currentScenario.controller.outputLimits.max = Number(fields.umax.value);
  currentScenario.controller.mode = fields.mode.value; currentScenario.disturbance.noiseStd = Number(fields.noise.value); currentScenario.disturbance.pulse.magnitude = Number(fields.pulseMag.value);
  if (!currentScenario.controller.hysteresis) currentScenario.controller.hysteresis = {};
  currentScenario.controller.hysteresis.lower = Number(fields.hysteresLower.value);
  currentScenario.controller.hysteresis.upper = Number(fields.hysteresUpper.value);
  sim = new Simulation(currentScenario, 42);
  if (oldHistory && oldHistory.t.length > 0) { sim.history = oldHistory; sim.stepNo = oldHistory.t.length / sim.dt; appendLog("Parametrar applicerade. Grafen behålls."); } 
  else { appendLog("Parametrar applicerade."); }
  updateControllerUIState();
  updateStatus(); drawChart();
}

function updateControllerUIState() {
  const mode = fields.mode.value;
  const isP = mode === "p";
  const isPI = mode === "pi";
  const isManual = mode === "manual";
  const isOnOff = mode === "onoff";
  
  // Enable/disable fields based on mode
  fields.kp.disabled = isManual || isOnOff;
  fields.ti.disabled = isP || isManual || isOnOff;
  fields.td.disabled = isP || isPI || isManual || isOnOff;
  fields.manualOutput.disabled = !isManual;
  
  // Hide/show field groups
  const tiField = fields.ti.parentElement;
  const tdField = fields.td.parentElement;
  const manualField = fields.manualOutput.parentElement;
  tiField.style.opacity = (isP || isManual || isOnOff) ? "0.5" : "1";
  tiField.style.pointerEvents = (isP || isManual || isOnOff) ? "none" : "auto";
  tdField.style.opacity = (isP || isPI || isManual || isOnOff) ? "0.5" : "1";
  tdField.style.pointerEvents = (isP || isPI || isManual || isOnOff) ? "none" : "auto";
  manualField.style.opacity = isManual ? "1" : "0.5";
  manualField.style.pointerEvents = isManual ? "auto" : "none";
  
  // Update controller parameters based on mode
  if (currentScenario && currentScenario.controller) {
    if (isManual) {
      currentScenario.controller.manualOutput = Number(fields.manualOutput.value);
    }
    if (isP || isManual || isOnOff) {
      currentScenario.controller.ti = 0;
    }
    if (isP || isPI || isManual || isOnOff) {
      currentScenario.controller.td = 0;
    }
  }
}
function loadPath(name) { currentPath = LEARNING_PATHS[name]; currentPathStep = -1; learnBody.textContent = "Laddad lärstig: " + currentPath.title + "\nKlicka Nästa steg."; }
function nextPathStep() {
  if (!currentPath) { learnBody.textContent = "Ingen lärstig laddad."; return; }
  currentPathStep += 1;
  if (currentPathStep >= currentPath.steps.length) { currentPathStep = currentPath.steps.length - 1; learnBody.textContent = "Lärstigen är klar."; return; }
  const step = currentPath.steps[currentPathStep];
  if (step.type === "theory") {
    const th = THEORY[step.ref];
    learnBody.textContent = step.title + "\nMål: " + step.objective + "\n\n" + th.summary + "\n\n- " + th.bullets.join("\n- ");
  } else {
    scenarioSelect.value = step.ref;
    loadScenarioByName(step.ref);
    learnBody.textContent = step.title + "\nMål: " + step.objective + "\n\nScenario laddades.";
  }
}

Object.keys(SCENARIOS).forEach(name => { const o = document.createElement("option"); o.value = name; o.textContent = name; scenarioSelect.appendChild(o); });
Object.keys(LEARNING_PATHS).forEach(name => { const o = document.createElement("option"); o.value = name; o.textContent = name; learningPathSelect.appendChild(o); });

document.getElementById("load").addEventListener("click", () => loadScenarioByName(scenarioSelect.value));
document.getElementById("mode").addEventListener("change", updateControllerUIState);
document.getElementById("step").addEventListener("click", () => { if (!sim) return; const f = sim.step(); if (!f) appendLog("Simulering stoppad."); else appendLog("Step: t=" + f.t.toFixed(2) + " y=" + f.y.toFixed(3) + " u=" + f.u.toFixed(3)); updateStatus(); drawChart(); });
document.getElementById("run10").addEventListener("click", () => { if (!sim) return; const fs = sim.run(10); appendLog("Körde " + fs.length + " steg."); updateStatus(); drawChart(); });
document.getElementById("pulse").addEventListener("click", () => { if (!sim) return; sim.triggerPulse(); appendLog("Puls triggad."); });
document.getElementById("reset").addEventListener("click", () => { if (!sim) return; sim.reset(); appendLog("Återställd."); updateStatus(); drawChart(); });
document.getElementById("applyParams").addEventListener("click", applyParams);
document.getElementById("clearChart").addEventListener("click", () => { if (!sim) return; sim.history = { t: [], y: [], u: [], e: [], sp: [], p: [], i: [], d: [] }; sim.stepNo = 0; appendLog("Graf nollställd."); updateStatus(); drawChart(); });
document.getElementById("systemReset").addEventListener("click", () => { if (!sim) return; sim.reset(); sim.history = { t: [], y: [], u: [], e: [], sp: [], p: [], i: [], d: [] }; sim.stepNo = 0; appendLog("System återställt."); updateStatus(); drawChart(); });
document.getElementById("loadPath").addEventListener("click", () => loadPath(learningPathSelect.value));
document.getElementById("nextStep").addEventListener("click", nextPathStep);
window.addEventListener("resize", drawChart);

loadScenarioByName("basic-step-self-regulating.json");
