/* Data laddas via fetch() från content/catalog.json vid uppstart */

const APP_VERSION = "1.1";

let SCENARIOS = {}, THEORY = {}, LEARNING_PATHS = {}, HELP_CONTENT = {};

function getBasePath() {
  return window.location.href.replace(/\/[^/]*$/, '');
}

async function loadCatalog() {
  const base = getBasePath();
  const catalog = await fetch(base + '/content/catalog.json?t=' + Date.now()).then(r => { if (!r.ok) throw new Error('catalog.json: ' + r.status); return r.json(); });
  const v = '?v=' + (catalog.version || '1');
  const [scenarioDatas, theoryDatas, pathDatas, helpData] = await Promise.all([
    Promise.all(catalog.scenarios.map(s => fetch(base + '/content/' + s.file + v).then(r => r.json()))),
    Promise.all(catalog.theory.map(t => fetch(base + '/content/' + t.file + v).then(r => r.json()))),
    Promise.all(catalog.learning_paths.map(p => fetch(base + '/content/' + p.file + v).then(r => r.json()))),
    fetch(base + '/content/' + catalog.help + v).then(r => r.json())
  ]);
  catalog.scenarios.forEach((entry, i) => { SCENARIOS[entry.file.split('/').pop()] = scenarioDatas[i]; });
  catalog.theory.forEach((entry, i) => { THEORY[entry.file.split('/').pop()] = theoryDatas[i]; });
  catalog.learning_paths.forEach((entry, i) => { LEARNING_PATHS[entry.id] = pathDatas[i]; });
  HELP_CONTENT = helpData;
}


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
  constructor(cfg = {}, dt = 1) { this.kp = cfg.kp || 0; this.ti = cfg.ti || 0; this.td = cfg.td || 0; this.dt = dt; this.integral = 0; this.prevPv = 0; this.mode = "pid"; this.bias = cfg.bias || 0; this.biasFadeSteps = 0; this.biasFadePerStep = 0; }
  reset() { this.integral = 0; this.prevPv = 0; this.bias = 0; this.biasFadeSteps = 0; this.biasFadePerStep = 0; }
  step(sp, pv, limits, antiWindup) {
    const error = sp - pv;
    const integralCandidate = this.integral + error * this.dt;
    const derivative = (pv - this.prevPv) / this.dt;
    const iTerm = this.ti > 1e-9 ? integralCandidate / this.ti : 0;
    const raw = this.bias + this.kp * (error + iTerm - this.td * derivative);
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
    this.dt = dt;
    this.y = cfg.normalValue;
    this.delay = cfg.L > 0 ? new Array(Math.max(1, Math.ceil(cfg.L / dt))).fill(0) : [];
  }
  reset() { this.y = this.cfg.normalValue; if (this.delay.length > 0) this.delay.fill(0); }
  step(u, dt, disturbance) {
    let ud;
    if (this.delay.length > 0) { this.delay.push(u); ud = this.delay.shift(); }
    else { ud = u; }
    const T = Math.max(1, this.cfg.T);
    if (this.cfg.type === "integrating") {
      const outflow = this.cfg.outflow ?? 0;
      this.y += (this.cfg.K * ud - outflow) * dt;
    }
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
      if (this.pid.biasFadeSteps > 0) {
        this.pid.bias -= this.pid.biasFadePerStep;
        this.pid.biasFadeSteps--;
        if (this.pid.biasFadeSteps === 0) { this.pid.bias = 0; this.scenario.controller.bias = 0; }
      } else {
        this.pid.bias = this.scenario.controller.bias || 0;
      }
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
  getState() { const i = this.history.t.length - 1; if (i < 0) return { step: 0, t: 0, y: 0, u: 0, e: 0, pTerm: 0, iTerm: 0, dTerm: 0 }; return { step: this.stepNo, t: this.history.t[i], y: this.history.y[i], u: this.history.u[i], e: this.history.e[i], pTerm: this.history.p[i] || 0, iTerm: this.history.i[i] || 0, dTerm: this.history.d[i] || 0 }; }
}

const scenarioSelect = document.getElementById("scenario");
const learningPathSelect = document.getElementById("learningPath");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const chartCanvas = document.getElementById("chart");
const learnBody = document.getElementById("learnBody");

const fields = {
  processType: document.getElementById("processType"),
  k: document.getElementById("k"), t: document.getElementById("t"), l: document.getElementById("l"),
  normalValue: document.getElementById("normalValue"),
  outflow: document.getElementById("outflow"),
  kp: document.getElementById("kp"), ti: document.getElementById("ti"), td: document.getElementById("td"),
  sp: document.getElementById("sp"), umin: document.getElementById("umin"), umax: document.getElementById("umax"),
  manualOutput: document.getElementById("manualOutput"),
  mode: document.getElementById("mode"), noise: document.getElementById("noise"), pulseMag: document.getElementById("pulseMag"), pulseDuration: document.getElementById("pulseDuration"), showPB: document.getElementById("showPB"),
  hysteresLower: document.getElementById("hysteresLower"), hysteresUpper: document.getElementById("hysteresUpper"),
  antiWindup: document.getElementById("antiWindup")
};

let currentScenario = null;
let sim = null;
let currentPath = null;
let currentPathStep = -1;
let testMode = false;
let checkpointAnswered = false;
let pathScore = { correct: 0, total: 0 };

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
  const uViewMin = 0, uViewMax = 100;
  const xScale = v => pad.left + (v / tMax) * (w - pad.left - pad.right);
  const yScaleTop = v => pad.top + (1 - (v - yMin) / (yMax - yMin || 1)) * (h * 0.62 - pad.top);
  const yScaleBot = v => h * 0.68 + (1 - (v - uViewMin) / (uViewMax - uViewMin || 1)) * (h - pad.bottom - h * 0.68);
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#d8d8d8"; ctx.strokeRect(pad.left, pad.top, w - pad.left - pad.right, h * 0.62 - pad.top); ctx.strokeRect(pad.left, h * 0.68, w - pad.left - pad.right, h - pad.bottom - h * 0.68);
  
  // Y-axel etiketter för PV/SP
  ctx.fillStyle = "#666"; ctx.font = "11px Segoe UI"; ctx.textAlign = "right";
  ctx.fillText("100", pad.left - 8, yScaleTop(100) + 4);
  ctx.fillText("0", pad.left - 8, yScaleTop(0) + 4);
  
  // Y-axel etiketter för u (nedre grafen)
  ctx.fillText("100", pad.left - 8, h * 0.68 + 4);
  ctx.fillText("0", pad.left - 8, h - pad.bottom + 4);
  
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

  // Proportionalband: u=0% vid SP, u=100% vid SP-PB (bias=0)
  if (fields.showPB.checked && ["p","pi","pid"].includes(sim.scenario.controller.mode)) {
    const sp_current = sp[sp.length - 1] ?? sim.scenario.runtime.setpoint;
    const kp = sim.scenario.controller.kp || 1;
    const pb = 100 / kp;
    const pbLowerPV = Math.max(yMin, sp_current - pb); // klippt till grafens nedre gräns
    const yTop = yScaleTop(sp_current);
    const yBot = yScaleTop(pbLowerPV);
    const chartW = w - pad.left - pad.right;
    const chartBottom = yScaleTop(yMin);
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.left, pad.top, chartW, chartBottom - pad.top);
    ctx.clip();
    ctx.fillStyle = "rgba(155,89,182,0.12)";
    ctx.fillRect(pad.left, yTop, chartW, yBot - yTop);
    ctx.restore();
    ctx.strokeStyle = "#9b59b6"; ctx.lineWidth = 1.5; ctx.setLineDash([6, 3]);
    ctx.beginPath(); ctx.moveTo(pad.left, yBot); ctx.lineTo(w - pad.right, yBot); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#9b59b6"; ctx.font = "10px Segoe UI"; ctx.textAlign = "right";
    ctx.fillText("PB=" + pb.toFixed(1) + "% (u=100%)", w - pad.right - 4, yBot + 11);
  }
  
  ctx.fillStyle = "#444"; ctx.font = "12px Segoe UI"; ctx.textAlign = "left";
  ctx.fillText("PV/SP", pad.left + 6, pad.top + 14);
  ctx.fillText("u", pad.left + 6, h * 0.68 + 16);
  drawSeries(ctx, t.map((tv, i) => ({ x: xScale(tv), y: yScaleTop(y[i]) })), "#1266f1", false);
  drawSeries(ctx, t.map((tv, i) => ({ x: xScale(tv), y: yScaleTop(sp[i]) })), "#d64545", true);
  drawSeries(ctx, t.map((tv, i) => ({ x: xScale(tv), y: yScaleBot(Math.max(0, Math.min(100, u[i]))) })), "#2f9e44", false);
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
  fields.normalValue.value = s.process.normalValue ?? 0;
  fields.kp.value = s.controller.kp || 0; fields.ti.value = s.controller.ti || 0; fields.td.value = s.controller.td || 0;
  fields.manualOutput.value = s.controller.manualOutput ?? 0;
  fields.sp.value = s.runtime.setpoint; fields.umin.value = s.controller.outputLimits.min; fields.umax.value = s.controller.outputLimits.max;
  fields.mode.value = s.controller.mode; fields.noise.value = s.disturbance.noiseStd || 0; fields.pulseMag.value = s.disturbance.pulse.magnitude || 0; fields.pulseDuration.value = s.disturbance.pulse.durationSteps || 3;
  fields.hysteresLower.value = s.controller.hysteresis?.lower ?? 2;
  fields.hysteresUpper.value = s.controller.hysteresis?.upper ?? 2;
  fields.antiWindup.checked = s.controller.antiWindup !== false;
  fields.processType.value = s.process.type || "self_regulating";
  fields.outflow.value = s.process.outflow ?? 0;
}
function loadScenarioByName(name) {
  currentScenario = deepClone(SCENARIOS[name]);
  sim = new Simulation(currentScenario, 42);
  hydrateFields(currentScenario);
  appendLog("Laddat scenario: " + currentScenario.id);
  updateControllerUIState();
  updateProcessUIState();
  updateStatus(); drawChart();
}
function syncParamsFromUI() {
  if (!currentScenario || !sim) return;
  const prevMode = currentScenario.controller.mode;
  const prevState = sim.getState();
  const nextMode = fields.mode.value;
  function clamp(val, min, max) { return Math.max(min, max !== undefined ? Math.min(max, val) : val); }
  function readClamped(field, min, max) {
    const v = clamp(Number(field.value), min, max);
    if (Number(field.value) !== v) field.value = v;
    return v;
  }
  const isIntegrating = fields.processType.value === "integrating";
  currentScenario.process.type = fields.processType.value;
  currentScenario.process.K = readClamped(fields.k, isIntegrating ? 0.001 : 0.1);
  currentScenario.process.T = readClamped(fields.t, 1);
  currentScenario.process.L = readClamped(fields.l, 0);
  currentScenario.process.normalValue = Number(fields.normalValue.value);
  currentScenario.process.outflow = readClamped(fields.outflow, 0);
  const noTi = nextMode === "p" || nextMode === "manual" || nextMode === "onoff";
  const noTd = nextMode === "p" || nextMode === "pi" || nextMode === "manual" || nextMode === "onoff";
  currentScenario.controller.kp = readClamped(fields.kp, 0.1);
  currentScenario.controller.ti = noTi ? 0 : readClamped(fields.ti, 0);
  currentScenario.controller.td = noTd ? 0 : readClamped(fields.td, 0);
  currentScenario.controller.manualOutput = readClamped(fields.manualOutput, 0, 100);
  currentScenario.runtime.setpoint = readClamped(fields.sp, 0, 100);
  const safeUmin = clamp(Number(fields.umin.value), 0, 100);
  const safeUmax = clamp(Number(fields.umax.value), 0, 100);
  currentScenario.controller.outputLimits.min = Math.min(safeUmin, safeUmax);
  currentScenario.controller.outputLimits.max = Math.max(safeUmin, safeUmax);
  fields.umin.value = currentScenario.controller.outputLimits.min;
  fields.umax.value = currentScenario.controller.outputLimits.max;
  currentScenario.controller.mode = nextMode;
  currentScenario.disturbance.noiseStd = readClamped(fields.noise, 0);
  currentScenario.disturbance.pulse.magnitude = Number(fields.pulseMag.value);
  currentScenario.disturbance.pulse.durationSteps = Math.max(0, Number(fields.pulseDuration.value));
  if (!currentScenario.controller.hysteresis) currentScenario.controller.hysteresis = {};
  currentScenario.controller.hysteresis.lower = readClamped(fields.hysteresLower, 0);
  currentScenario.controller.hysteresis.upper = readClamped(fields.hysteresUpper, 0);
  currentScenario.controller.antiWindup = fields.antiWindup.checked;

  if (prevMode !== nextMode) {
    const bumplessOn = document.getElementById("bumpless").checked;
    if (["p", "pi", "pid"].includes(nextMode)) {
      if (bumplessOn && prevState) {
        const kp = currentScenario.controller.kp || 0;
        const bias = prevState.u - kp * prevState.e;
        currentScenario.controller.bias = Number.isFinite(bias) ? bias : 0;
        sim.pid.bias = currentScenario.controller.bias;
        sim.pid.biasFadeSteps = 5;
        sim.pid.biasFadePerStep = currentScenario.controller.bias / 5;
      } else {
        currentScenario.controller.bias = 0;
        sim.pid.bias = 0;
        sim.pid.biasFadeSteps = 0;
        sim.pid.biasFadePerStep = 0;
      }
    }
    if (nextMode === "manual" && prevState) {
      currentScenario.controller.manualOutput = prevState.u;
      fields.manualOutput.value = prevState.u.toFixed(2);
    }
  }

  sim.scenario = currentScenario;
  sim.process.cfg = currentScenario.process;
  const delayLen = currentScenario.process.L > 0 ? Math.max(1, Math.ceil(currentScenario.process.L / sim.dt)) : 0;
  if (sim.process.delay.length !== delayLen) {
    const fillValue = sim.process.delay.length ? sim.process.delay[sim.process.delay.length - 1] : (prevState ? prevState.u : 0);
    sim.process.delay = delayLen > 0 ? new Array(delayLen).fill(fillValue) : [];
  }
  sim.pid.kp = currentScenario.controller.kp || 0;
  sim.pid.ti = currentScenario.controller.ti || 0;
  sim.pid.td = currentScenario.controller.td || 0;
  if (sim.pid.biasFadeSteps === 0) sim.pid.bias = currentScenario.controller.bias || 0;
  sim.pid.mode = nextMode;
  sim.onoff.low = currentScenario.controller.hysteresis?.lower ?? sim.onoff.low;
  sim.onoff.high = currentScenario.controller.hysteresis?.upper ?? sim.onoff.high;
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
  const noIntegral = isP || isManual || isOnOff;
  fields.ti.parentElement.style.display = (isP || isManual || isOnOff) ? "none" : "";
  fields.td.parentElement.style.display = (isP || isPI || isManual || isOnOff) ? "none" : "";
  fields.manualOutput.parentElement.style.display = isManual ? "" : "none";
  fields.antiWindup.parentElement.style.display = noIntegral ? "none" : "";
  fields.hysteresLower.parentElement.style.display = isOnOff ? "" : "none";
  fields.hysteresUpper.parentElement.style.display = isOnOff ? "" : "none";
  fields.showPB.parentElement.style.display = (isOnOff || isManual) ? "none" : "";
  
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
function updateProcessUIState() {
  const isIntegrating = fields.processType.value === "integrating";
  document.getElementById("kLabel").textContent = isIntegrating ? "Kv" : "K";
  document.getElementById("kHelpBtn").dataset.help = isIntegrating ? "kv" : "k";
  fields.k.step = isIntegrating ? "0.001" : "0.1";
  fields.t.parentElement.style.display = isIntegrating ? "none" : "";
  fields.normalValue.parentElement.style.display = isIntegrating ? "none" : "";
  fields.outflow.parentElement.style.display = isIntegrating ? "" : "none";
}

function updateScoreDisplay() {
  const el = document.getElementById("scoreDisplay");
  const txt = document.getElementById("scoreText");
  if (!el || !txt) return;
  if (testMode && currentPath) { el.style.display = ""; txt.textContent = pathScore.correct + "/" + pathScore.total; }
  else { el.style.display = "none"; }
}
function updateNavButtons() {
  const prev = document.getElementById("prevStep");
  const next = document.getElementById("nextStep");
  prev.style.display = testMode ? "none" : "";
  prev.disabled = !currentPath || currentPathStep <= 0;
  if (!testMode) next.disabled = false;
}
function loadPath(name) {
  currentPath = LEARNING_PATHS[name];
  currentPathStep = -1;
  pathScore = { correct: 0, total: 0 };
  checkpointAnswered = false;
  updateNavButtons();
  updateScoreDisplay();
  learnBody.innerHTML = "<em>" + currentPath.title + "</em><br><small>" + (currentPath.description || "") + "</small><br><br>Klicka <strong>Nästa »</strong> för att börja.";
}
function renderStep(step) {
  let bodyText = "";
  if (step.type === "theory") {
    const th = THEORY[step.ref];
    if (th) bodyText = "<strong>" + th.summary + "</strong><br><br>" + th.bullets.map(b => "• " + b).join("<br>");
  } else if (step.instruction) {
    bodyText = step.instruction.replace(/\n/g, "<br>");
  }
  const stepNum = (currentPathStep + 1) + "/" + currentPath.steps.length;
  let html = '<div class="step-header"><span class="step-num">Steg ' + stepNum + '</span> ' + step.title + '</div>'
    + '<div class="step-objective">Mål: ' + step.objective + '</div>';
  if (bodyText) html += '<div class="step-body">' + bodyText + '</div>';
  if (step.checkpoint) {
    if (testMode) {
      html += '<div class="quiz-block"><div class="quiz-question">❓ ' + step.checkpoint.question + '</div>'
        + '<div class="quiz-options">'
        + step.checkpoint.options.map((opt, i) => '<button class="quiz-opt" data-idx="' + i + '">' + opt + '</button>').join("")
        + '</div><div class="quiz-feedback" id="quizFeedback"></div></div>';
    } else {
      html += '<div class="reflect-block">💭 <em>Fundera: ' + step.checkpoint.question + '</em></div>';
    }
  }
  learnBody.innerHTML = html;
  if (step.checkpoint && testMode) {
    checkpointAnswered = false;
    document.getElementById("nextStep").disabled = true;
    learnBody.querySelectorAll(".quiz-opt").forEach(btn => {
      btn.addEventListener("click", () => handleQuizAnswer(btn, step.checkpoint));
    });
  } else {
    document.getElementById("nextStep").disabled = false;
  }
  updateNavButtons();
}
function handleQuizAnswer(btn, checkpoint) {
  if (checkpointAnswered) return;
  const correct = parseInt(btn.dataset.idx, 10) === checkpoint.correct;
  const fb = document.getElementById("quizFeedback");
  if (correct) {
    checkpointAnswered = true;
    pathScore.correct++;
    pathScore.total++;
    btn.classList.add("quiz-correct");
    learnBody.querySelectorAll(".quiz-opt").forEach(b => b.disabled = true);
    fb.innerHTML = "✅ Rätt! " + checkpoint.explanation;
    fb.className = "quiz-feedback correct";
    document.getElementById("nextStep").disabled = false;
    updateScoreDisplay();
  } else {
    pathScore.total++;
    btn.classList.add("quiz-wrong");
    btn.disabled = true;
    fb.innerHTML = "❌ Inte rätt — försök igen.";
    fb.className = "quiz-feedback wrong";
    updateScoreDisplay();
  }
}
function prevPathStep() {
  if (!currentPath || currentPathStep <= 0) return;
  currentPathStep -= 1;
  const step = currentPath.steps[currentPathStep];
  if (step.type === "scenario" || step.type === "observe") {
    if (SCENARIOS[step.ref]) { scenarioSelect.value = step.ref; loadScenarioByName(step.ref); }
  }
  renderStep(step);
}
function nextPathStep() {
  if (!currentPath) { learnBody.innerHTML = "Ingen lärstig laddad."; return; }
  currentPathStep += 1;
  if (currentPathStep >= currentPath.steps.length) {
    currentPathStep = currentPath.steps.length - 1;
    const score = testMode ? " Poäng: " + pathScore.correct + "/" + pathScore.total + " rätt." : "";
    learnBody.innerHTML = "<strong>✓ Lärstigen klar!</strong>" + score;
    document.getElementById("nextStep").disabled = true;
    return;
  }
  const step = currentPath.steps[currentPathStep];
  if (step.type === "scenario" || step.type === "observe") {
    if (SCENARIOS[step.ref]) { scenarioSelect.value = step.ref; loadScenarioByName(step.ref); }
  }
  renderStep(step);
}

function showWelcome() {
  learnBody.innerHTML = `<div class="welcome-panel">
    <h3>Välkommen till PID Simulator!</h3>
    <p>Simulera och utforska reglerteknik — från enkel on/off till avancerade metoder som Lambda-tuning.</p>
    <p>Appen passar både nybörjare och den som vill repetera eller fördjupa sig.</p>
    <button id="welcomeStart">Kom igång »</button>
    <button id="welcomeSkip" class="secondary">Utforska fritt</button>
  </div>`;
  document.getElementById("welcomeStart").onclick = () => {
    localStorage.setItem("pidSimWelcomed", "1");
    loadPath("kom-igång.v1");
    nextPathStep();
  };
  document.getElementById("welcomeSkip").onclick = () => {
    localStorage.setItem("pidSimWelcomed", "1");
    loadScenarioByName("basic-step-self-regulating.json");
  };
}

function initUI() {
  Object.entries(SCENARIOS).forEach(([name, s]) => { const o = document.createElement("option"); o.value = name; o.textContent = s.title || name; scenarioSelect.appendChild(o); });
  Object.entries(LEARNING_PATHS).forEach(([id, p]) => { const o = document.createElement("option"); o.value = id; o.textContent = p.title || id; learningPathSelect.appendChild(o); });
  loadScenarioByName("basic-step-self-regulating.json");
  if (!localStorage.getItem("pidSimWelcomed")) showWelcome();
}

// ── Sidebar resize ──
function makeResizable(handleId, sidebarId, side, storageKey) {
  const handle = document.getElementById(handleId);
  const sidebar = document.getElementById(sidebarId);
  const saved = localStorage.getItem(storageKey);
  if (saved && !sidebar.classList.contains("collapsed")) sidebar.style.width = saved + "px";
  handle.addEventListener("mousedown", e => {
    if (sidebar.classList.contains("collapsed")) return;
    const startX = e.clientX;
    const startW = sidebar.getBoundingClientRect().width;
    handle.classList.add("dragging");
    document.body.style.userSelect = "none";
    const onMove = e => {
      const dx = side === "left" ? e.clientX - startX : startX - e.clientX;
      const w = Math.max(180, Math.min(520, startW + dx));
      sidebar.style.width = w + "px";
    };
    const onUp = () => {
      handle.classList.remove("dragging");
      document.body.style.userSelect = "";
      localStorage.setItem(storageKey, parseInt(sidebar.style.width, 10));
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}
makeResizable("resizeLeft", "sidebarLeft", "left", "pid-sb-left-w");
makeResizable("resizeRight", "sidebarRight", "right", "pid-sb-right-w");

// ── Sidebar toggles ──
document.getElementById("toggleLeft").addEventListener("click", () => {
  const sb = document.getElementById("sidebarLeft");
  const btn = document.getElementById("toggleLeft");
  const handle = document.getElementById("resizeLeft");
  sb.classList.toggle("collapsed");
  const collapsed = sb.classList.contains("collapsed");
  btn.textContent = collapsed ? "»" : "«";
  handle.style.display = collapsed ? "none" : "";
});
document.getElementById("toggleRight").addEventListener("click", () => {
  const sb = document.getElementById("sidebarRight");
  const btn = document.getElementById("toggleRight");
  const handle = document.getElementById("resizeRight");
  sb.classList.toggle("collapsed");
  const collapsed = sb.classList.contains("collapsed");
  btn.textContent = collapsed ? "«" : "»";
  handle.style.display = collapsed ? "none" : "";
});

// ── Help buttons ──
document.querySelectorAll(".help-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    const h = HELP_CONTENT[btn.dataset.help];
    if (!h) return;
    document.getElementById("infoTitle").textContent = h.title;
    document.getElementById("infoBody").textContent = h.body;
    const sb = document.getElementById("sidebarRight");
    const toggle = document.getElementById("toggleRight");
    if (sb.classList.contains("collapsed")) { sb.classList.remove("collapsed"); toggle.textContent = "»"; }
  });
});

// ── Test/Guidat mode toggle ──
function setTestMode(on) {
  testMode = on;
  document.getElementById("modeGuided").classList.toggle("active", !on);
  document.getElementById("modeTest").classList.toggle("active", on);
  if (on && currentPath) {
    currentPathStep = -1;
    pathScore = { correct: 0, total: 0 };
    checkpointAnswered = false;
    document.getElementById("nextStep").disabled = false;
    learnBody.innerHTML = "<em>" + currentPath.title + "</em><br><small>" + (currentPath.description || "") + "</small><br><br>Klicka <strong>Nästa »</strong> för att börja testet.";
  } else if (!on && currentPath && currentPathStep >= 0) {
    renderStep(currentPath.steps[currentPathStep]);
  }
  updateScoreDisplay();
  updateNavButtons();
}
document.getElementById("modeGuided").addEventListener("click", () => setTestMode(false));
document.getElementById("modeTest").addEventListener("click", () => setTestMode(true));

document.getElementById("appVersion").textContent = "v" + APP_VERSION;

function toggleParamGroup(id) {
  const group = document.getElementById(id);
  const collapsed = group.classList.toggle("collapsed");
  localStorage.setItem("pg-" + id, collapsed ? "1" : "0");
}
["groupProcess","groupRegulator","groupStyrning","groupStorningar"].forEach(id => {
  if (localStorage.getItem("pg-" + id) === "1") document.getElementById(id).classList.add("collapsed");
});
document.getElementById("load").addEventListener("click", () => loadScenarioByName(scenarioSelect.value));
fields.pulseDuration.addEventListener("input", () => { if (Number(fields.pulseDuration.value) < 0) fields.pulseDuration.value = 0; });
fields.showPB.addEventListener("change", drawChart);
document.getElementById("mode").addEventListener("change", updateControllerUIState);
document.getElementById("processType").addEventListener("change", updateProcessUIState);
document.getElementById("step").addEventListener("click", () => { if (!sim) return; syncParamsFromUI(); const f = sim.step(); if (!f) appendLog("Simulering stoppad."); else appendLog("Step: t=" + f.t.toFixed(2) + " y=" + f.y.toFixed(3) + " u=" + f.u.toFixed(3)); updateStatus(); drawChart(); });
document.getElementById("run10").addEventListener("click", () => { if (!sim) return; syncParamsFromUI(); const fs = sim.run(10); appendLog("Körde " + fs.length + " steg."); updateStatus(); drawChart(); });
document.getElementById("pulse").addEventListener("click", () => { if (!sim) return; syncParamsFromUI(); sim.triggerPulse(); appendLog("Puls triggad."); });
document.getElementById("clearChart").addEventListener("click", () => { if (!sim) return; sim.history = { t: [], y: [], u: [], e: [], sp: [], p: [], i: [], d: [] }; sim.stepNo = 0; appendLog("Graf nollställd."); updateStatus(); drawChart(); });
document.getElementById("systemReset").addEventListener("click", () => { if (!sim) return; sim.reset(); sim.history = { t: [], y: [], u: [], e: [], sp: [], p: [], i: [], d: [] }; sim.stepNo = 0; appendLog("System återställt."); updateStatus(); drawChart(); });
document.getElementById("loadPath").addEventListener("click", () => loadPath(learningPathSelect.value));
document.getElementById("prevStep").addEventListener("click", prevPathStep);
document.getElementById("nextStep").addEventListener("click", nextPathStep);
window.addEventListener("resize", drawChart);

loadCatalog().then(initUI).catch(err => {
  document.body.innerHTML = '<div style="padding:40px;font-family:sans-serif;background:#1a1a2e;color:#e0e0e0;min-height:100vh"><h2 style="color:#f0a500">Kunde inte ladda data</h2><p>' + err.message + '</p><p>Appen kräver HTTP-server (GitHub Pages eller lokal server). Dubbel-klick på index.html stöds inte.</p></div>';
});
