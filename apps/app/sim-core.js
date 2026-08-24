/* Delad simuleringskärna.
 *
 * Detta är EXAKT samma kod som tidigare låg inline i app.js (rad 1-159,
 * före PED-003B). Flyttad hit oförändrad för att kunna återanvändas av
 * tests/simulation/ utan att duplicera regulator-/processlogiken.
 *
 * Laddas på två sätt:
 *  - I webbläsaren via <script src="./sim-core.js"></script> FÖRE app.js
 *    i index.html — klasserna hamnar på window och används av app.js
 *    precis som innan (ingen ES-modul, ingen byggprocess).
 *  - I Node via require()/createRequire() från tests/simulation/.
 *
 * Får INTE innehålla DOM-referenser (document/window) i själva
 * simuleringslogiken — bara i UMD-inpackningen nedan.
 */
(function (global, factory) {
  const mod = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = mod;
  } else {
    Object.assign(global, mod);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {

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
      this.stages = cfg.type === "self_regulating_2" ? [cfg.normalValue, cfg.normalValue] : [];
    }
    reset() {
      this.y = this.cfg.normalValue;
      if (this.delay.length > 0) this.delay.fill(0);
      if (this.stages.length > 0) this.stages.fill(this.cfg.normalValue);
    }
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
      else if (this.cfg.type === "self_regulating_2") {
        const Ti = T / 3;
        this.stages[0] += ((-(this.stages[0] - this.cfg.normalValue) + this.cfg.K * ud) * dt) / Ti;
        this.stages[1] += (-(this.stages[1] - this.stages[0]) * dt) / Ti;
        this.y += (-(this.y - this.stages[1]) * dt) / Ti;
      }
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

  return { seededRandom, gaussian, OnOffController, PIDController, ProcessModel, Simulation };
});
