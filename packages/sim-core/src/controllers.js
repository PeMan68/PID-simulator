export class OnOffController {
  constructor({ hysteresisType = "both", high = 2, low = 2 } = {}) {
    this.hysteresisType = hysteresisType;
    this.high = high;
    this.low = low;
    this.output = 0;
  }

  reset() {
    this.output = 0;
  }

  step(setpoint, pv, { umin = 0, umax = 100 } = {}) {
    if (this.hysteresisType === "upper") {
      if (pv < setpoint) {
        this.output = umax;
      } else if (pv > setpoint + this.high) {
        this.output = umin;
      }
    } else if (this.hysteresisType === "lower") {
      if (pv > setpoint) {
        this.output = umin;
      } else if (pv < setpoint - this.low) {
        this.output = umax;
      }
    } else {
      if (pv < setpoint - this.low) {
        this.output = umax;
      } else if (pv > setpoint + this.high) {
        this.output = umin;
      }
    }

    if (this.output < umin) this.output = umin;
    if (this.output > umax) this.output = umax;
    return this.output;
  }
}

export class PIDController {
  constructor({ kp = 0, ti = 0, td = 0, dt = 1 } = {}) {
    this.kp = kp;
    this.ti = ti;
    this.td = td;
    this.dt = dt;
    this.integral = 0;
    this.prevPv = 0;
    this.mode = "pid"; // Track current control mode
  }

  reset() {
    this.integral = 0;
    this.prevPv = 0;
  }

  step(setpoint, pv, { umin = 0, umax = 100, antiWindup = true } = {}) {
    const error = setpoint - pv;
    const integralCandidate = this.integral + error * this.dt;
    const derivative = (pv - this.prevPv) / this.dt;

    const iTerm = this.ti > 1e-9 ? integralCandidate / this.ti : 0;
    const raw = this.kp * (error + iTerm - this.td * derivative);
    const u = Math.max(umin, Math.min(umax, raw));

    // Only update integral if not in P-only mode
    if (this.mode !== "p") {
      if (!antiWindup) {
        this.integral = integralCandidate;
      } else {
        const canIntegrate =
          (u === umin && error > 0) ||
          (u === umax && error < 0) ||
          (u > umin && u < umax);
        if (canIntegrate) {
          this.integral = integralCandidate;
        }
      }
    }

    this.prevPv = pv;

    return {
      u,
      error,
      integral: this.integral,
      derivative,
      pTerm: this.kp * error,
      iTerm: (this.mode === "p" || this.mode === "onoff" || this.mode === "manual") ? 0 : (this.ti > 1e-9 ? (this.kp / this.ti) * this.integral : 0),
      dTerm: (this.mode === "p" || this.mode === "pi" || this.mode === "onoff" || this.mode === "manual") ? 0 : (-this.kp * this.td * derivative)
    };
  }
}
