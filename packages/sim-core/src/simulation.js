import { OnOffController, PIDController } from "./controllers.js";
import { ProcessModel } from "./process.js";
import { calculatePerformance } from "./metrics.js";

function seededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function gaussian(rng) {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = Math.max(rng(), 1e-12);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export class Simulation {
  constructor(scenario, options = {}) {
    this.scenario = scenario;
    this.dt = scenario.runtime.dt;
    this.maxSteps = scenario.runtime.maxSteps;
    this.currentStep = 0;
    this.running = false;

    const seed = options.seed ?? 12345;
    this.rng = seededRandom(seed);

    this.process = new ProcessModel({ ...scenario.process, dt: this.dt });
    const onoffConfig = scenario.controller.onoff || {};
    const hysteresisConfig = scenario.controller.hysteresis || {};
    this.onoff = new OnOffController({
      hysteresisType: onoffConfig.hysteresisType,
      low: hysteresisConfig.lower ?? onoffConfig.low ?? 2,
      high: hysteresisConfig.upper ?? onoffConfig.high ?? 2
    });
    this.pid = new PIDController({
      kp: scenario.controller.kp || 0,
      ti: scenario.controller.ti || 0,
      td: scenario.controller.td || 0,
      dt: this.dt
    });

    this.history = {
      t: [0],
      y: [this.process.y],
      u: [0],
      e: [scenario.runtime.setpoint - this.process.y],
      sp: [scenario.runtime.setpoint],
      i: [0],
      d: [0],
      p: [0]
    };

    this.pulseStepsLeft = 0;
  }

  reset() {
    this.currentStep = 0;
    this.running = false;
    this.process.reset();
    this.onoff.reset();
    this.pid.reset();
    this.history = {
      t: [0],
      y: [this.process.y],
      u: [0],
      e: [this.scenario.runtime.setpoint - this.process.y],
      sp: [this.scenario.runtime.setpoint],
      i: [0],
      d: [0],
      p: [0]
    };
    this.pulseStepsLeft = 0;
  }

  _controllerStep(setpoint, pv) {
    const limits = this.scenario.controller.outputLimits;
    const antiWindup = this.scenario.controller.antiWindup !== false;
    const mode = this.scenario.controller.mode;

    if (mode === "manual") {
      const u = this.scenario.controller.manualOutput ?? 0;
      return { u, error: setpoint - pv, integral: 0, derivative: 0, pTerm: 0 };
    }

    if (mode === "onoff") {
      const u = this.onoff.step(setpoint, pv, {
        umin: limits.min,
        umax: limits.max
      });
      return { u, error: setpoint - pv, integral: 0, derivative: 0, pTerm: 0 };
    }

    if (mode === "p") {
      this.pid.ti = 0;
      this.pid.td = 0;
    } else if (mode === "pi") {
      this.pid.td = 0;
    }

    return this.pid.step(setpoint, pv, {
      umin: limits.min,
      umax: limits.max,
      antiWindup
    });
  }

  _disturbanceStep() {
    const cfg = this.scenario.disturbance || {};
    const noiseStd = cfg.noiseStd || 0;

    let disturbance = 0;
    if (noiseStd > 0) {
      disturbance += gaussian(this.rng) * noiseStd;
    }

    const pulse = cfg.pulse || { magnitude: 0, durationSteps: 0 };
    if (this.pulseStepsLeft > 0) {
      disturbance += pulse.magnitude || 0;
      this.pulseStepsLeft -= 1;
    }

    return disturbance;
  }

  triggerPulse() {
    const pulse = this.scenario.disturbance?.pulse;
    if (!pulse || !pulse.durationSteps) return;
    this.pulseStepsLeft = pulse.durationSteps;
  }

  step() {
    if (this.currentStep >= this.maxSteps) {
      this.running = false;
      return null;
    }

    const setpoint = this.scenario.runtime.setpoint;
    const pv = this.process.y;
    const ctrl = this._controllerStep(setpoint, pv);
    const disturbance = this._disturbanceStep();
    const y = this.process.step(ctrl.u, this.dt, disturbance);

    this.currentStep += 1;
    const t = this.currentStep * this.dt;

    this.history.t.push(t);
    this.history.y.push(y);
    this.history.u.push(ctrl.u);
    this.history.e.push(ctrl.error);
    this.history.sp.push(setpoint);
    this.history.i.push(ctrl.integral);
    this.history.d.push(ctrl.derivative);
    this.history.p.push(ctrl.pTerm);

    return {
      t,
      y,
      u: ctrl.u,
      error: ctrl.error,
      disturbance
    };
  }

  run(nSteps = 1) {
    const count = Math.max(1, nSteps);
    const frames = [];
    for (let i = 0; i < count; i += 1) {
      const frame = this.step();
      if (!frame) break;
      frames.push(frame);
    }
    return frames;
  }

  getState() {
    const idx = this.history.t.length - 1;
    return {
      step: this.currentStep,
      t: this.history.t[idx],
      y: this.history.y[idx],
      u: this.history.u[idx],
      sp: this.history.sp[idx],
      e: this.history.e[idx],
      pTerm: this.history.p[idx] ?? 0,
      iTerm: this.history.i[idx] ?? 0,
      dTerm: this.history.d[idx] ?? 0
    };
  }

  getHistory() {
    return this.history;
  }

  getPerformance() {
    return calculatePerformance(this.history);
  }
}

export function createSimulation(scenario, options) {
  return new Simulation(scenario, options);
}
