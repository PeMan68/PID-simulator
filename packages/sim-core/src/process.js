export class ProcessModel {
  constructor(config) {
    this.K = config.K;
    this.T = config.T;
    this.L = config.L;
    this.type = config.type;
    this.normalValue = config.normalValue;
    this.outflow = config.outflow || 0;
    this.dimensionlessK = !!config.dimensionlessK;
    this.measurementRange = config.measurementRange;

    this.y = this.normalValue;
    this.t = 0;

    const delaySteps = Math.max(1, Math.ceil(this.L / (config.dt || 1)));
    this.delayBuffer = new Array(delaySteps).fill(0);
  }

  reset() {
    this.y = this.normalValue;
    this.t = 0;
    this.delayBuffer.fill(0);
  }

  toPercent(value) {
    const min = this.measurementRange.min;
    const max = this.measurementRange.max;
    if (max === min) return 0;
    return (100 * (value - min)) / (max - min);
  }

  fromPercent(value) {
    const min = this.measurementRange.min;
    const max = this.measurementRange.max;
    return min + ((max - min) * value) / 100;
  }

  _popDelayedInput(u) {
    this.delayBuffer.push(u);
    return this.delayBuffer.shift();
  }

  step(u, dt, disturbance = 0) {
    const delayedU = this._popDelayedInput(u);
    const T = this.T > 1e-9 ? this.T : 1e-9;

    if (this.dimensionlessK) {
      const yPct = this.toPercent(this.y);
      const nvPct = this.toPercent(this.normalValue);
      let dyPct;

      if (this.type === "integrating") {
        dyPct = ((this.K * delayedU - this.outflow) * dt) / T;
      } else if (this.type === "unstable") {
        dyPct = ((yPct - nvPct + this.K * delayedU) * dt) / T;
      } else {
        dyPct = ((-(yPct - nvPct) + this.K * delayedU) * dt) / T;
      }

      this.y = this.fromPercent(yPct + dyPct) + disturbance;
    } else {
      if (this.type === "integrating") {
        this.y += ((this.K * delayedU - this.outflow) * dt) / T;
      } else if (this.type === "unstable") {
        this.y += ((this.y - this.normalValue + this.K * delayedU) * dt) / T;
      } else {
        this.y += ((-(this.y - this.normalValue) + this.K * delayedU) * dt) / T;
      }
      this.y += disturbance;
    }

    this.t += dt;
    return this.y;
  }
}
