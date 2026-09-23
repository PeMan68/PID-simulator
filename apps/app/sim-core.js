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

  // Parameterstyrning (FEAT-042) — delad, fast 3-zons brytpunktsmekanism.
  // Används identiskt för regulatorns kp/ti/td-schema (keyed på PV) och
  // processens K-schema (keyed på u/ud) — se STRAT-003. Exakt 3 zoner,
  // skarp (icke interpolerad) övergång vid brytpunkterna.
  function scheduleZone(x, breakpoint1, breakpoint2) {
    if (x < breakpoint1) return 0;
    if (x < breakpoint2) return 1;
    return 2;
  }
  function scheduledValue(zones, breakpoint1, breakpoint2, x) {
    return zones[scheduleZone(x, breakpoint1, breakpoint2)];
  }

  class PIDController {
    constructor(cfg = {}, dt = 1) { this.kp = cfg.kp || 0; this.ti = cfg.ti || 0; this.td = cfg.td || 0; this.dt = dt; this.integral = 0; this.prevPv = 0; this.mode = "pid"; this.bias = cfg.bias || 0; this.biasFadeSteps = 0; this.biasFadePerStep = 0; this.gainZone = null; }
    reset() { this.integral = 0; this.prevPv = 0; this.bias = 0; this.biasFadeSteps = 0; this.biasFadePerStep = 0; this.gainZone = null; }
    // feedforward (FEAT-045) — regulatorns framkopplingsterm (kff × auxValue),
    // beräknad av anroparen (Simulation.step()) och adderad HÄR, INNAN
    // klippning mot outputLimits — så att anti-windup-logiken nedan (som
    // redan jämför mot den KLIPPTA, kombinerade utsignalen u) korrekt ser om
    // PID+framkoppling TILLSAMMANS mättar utsignalen, inte bara PID-delen för
    // sig. Se STRAT-005 avsnitt 2. Ingen bumplös fasning av denna term —
    // avsiktligt, se Simulation.triggerAuxSignal().
    step(sp, pv, limits, antiWindup, feedforward) {
      const error = sp - pv;
      const integralCandidate = this.integral + error * this.dt;
      const derivative = (pv - this.prevPv) / this.dt;
      const iTerm = this.ti > 1e-9 ? integralCandidate / this.ti : 0;
      const ff = feedforward || 0;
      const raw = this.bias + this.kp * (error + iTerm - this.td * derivative) + ff;
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
      return { u: u, error: error, integral: this.integral, derivative: derivative, pTerm: pTerm, iTerm: (this.mode === "p" || this.mode === "onoff" || this.mode === "manual") ? 0 : this.kp * iTerm, dTerm: (this.mode === "p" || this.mode === "pi" || this.mode === "onoff" || this.mode === "manual") ? 0 : dTerm, ffTerm: ff };
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
    // Olinjär ventilkarakteristik (FEAT-042) — processens K som funktion av
    // utsignalen (ud), bara för self_regulating. Se STRAT-003 avsnitt 6 för
    // varför bara self_regulating stöds i detta uppdrag (integrating/konisk
    // tank lämnas som en öppen, billig uppföljning — inte hårdkodat bort).
    effectiveK(ud) {
      const ng = this.cfg.nonlinearGain;
      if (ng && ng.enabled && this.cfg.type === "self_regulating") {
        return scheduledValue(ng.zones, ng.breakpoint1, ng.breakpoint2, ud);
      }
      return this.cfg.K;
    }
    // auxValue (FEAT-045) — den mätbara laststörningens aktuella nivå (0 tills
    // triggad, se Simulation.triggerAuxSignal()). Dess bidrag går genom SAMMA
    // drivande term/tidskonstant som huvudprocessen (auxGain × auxValue) —
    // TILL SKILLNAD från `disturbance` (brus/puls), som adderas direkt till y
    // nedan och alltså är odämpad/omätbar. Se STRAT-005 avsnitt 2: detta är
    // en medveten, pedagogiskt viktig åtskillnad mellan de två störningstyperna.
    step(u, dt, disturbance, auxValue) {
      let ud;
      if (this.delay.length > 0) { this.delay.push(u); ud = this.delay.shift(); }
      else { ud = u; }
      const T = Math.max(1, this.cfg.T);
      const auxTerm = (this.cfg.auxGain || 0) * (auxValue || 0);
      if (this.cfg.type === "integrating") {
        const outflow = this.cfg.outflow ?? 0;
        this.y += (this.cfg.K * ud - outflow + auxTerm) * dt;
      }
      else if (this.cfg.type === "unstable") this.y += ((this.y - this.cfg.normalValue + this.cfg.K * ud + auxTerm) * dt) / T;
      else if (this.cfg.type === "self_regulating_2") {
        const Ti = T / 3;
        this.stages[0] += ((-(this.stages[0] - this.cfg.normalValue) + this.cfg.K * ud + auxTerm) * dt) / Ti;
        this.stages[1] += (-(this.stages[1] - this.stages[0]) * dt) / Ti;
        this.y += (-(this.y - this.stages[1]) * dt) / Ti;
      }
      else this.y += ((-(this.y - this.cfg.normalValue) + this.effectiveK(ud) * ud + auxTerm) * dt) / T;
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
      // FEAT-043 — baseMaxSteps är scenariots eget, oföränderliga tak (från
      // JSON:en). maxSteps är det AKTIVA taket, som extendSteps() kan höja
      // för att låta en student fortsätta utforska samma körning istället
      // för att tvingas till en tyst stopp eller en full återställning.
      this.baseMaxSteps = scenario.runtime.maxSteps;
      this.maxSteps = this.baseMaxSteps;
      this.stepNo = 0;
      this.rng = seededRandom(seed || 42);
      this.process = new ProcessModel(scenario.process, this.dt);
      this.pid = new PIDController(scenario.controller, this.dt);
      const onoffCfg = scenario.controller.onoff || {};
      const hysteresisCfg = scenario.controller.hysteresis || {};
      this.onoff = new OnOffController({ ...onoffCfg, low: hysteresisCfg.lower ?? onoffCfg.low ?? 2, high: hysteresisCfg.upper ?? onoffCfg.high ?? 2 });
      this.pulseStepsLeft = 0;
      // FEAT-045 — den mätbara laststörningens aktuella nivå. Ingen
      // nedräkning (till skillnad från pulseStepsLeft) eftersom lasten är
      // BESTÅENDE (PO-beslut, STRAT-005) — ligger kvar tills reset() eller
      // en ny triggerAuxSignal()-triggning ersätter värdet.
      this.auxValue = 0;
      // FEAT-048 — Kvotreglering: "vilt" flöde A, en KONTINUERLIGT varierande
      // signal (slumpvandring via samma RNG som brusmodellen redan använder,
      // se step()) — medvetet INTE en engångstriggad nivå som auxValue ovan
      // (STRAT-006 avsnitt 4: en statisk nivå hade gjort hela lärstigen
      // pedagogiskt tandlös, kvotens poäng är att SP AUTOMATISKT följer en
      // signal som fortsätter ändras). Startar på konfigurerad bas-nivå;
      // scenarier utan ratioControl-fält ger 0 (no-op, samma
      // bakåtkompatibla mönster som auxValue/auxGain).
      this.wildFlow = scenario.ratioControl?.wildFlow?.base ?? 0;
      // FEAT-048 användartest (PO, 2026-09-24) — till skillnad från
      // auxValue/Last (se STRAT-005/FEAT-045-kommentaren ovan, som
      // MEDVETET INTE ritas som graflinje) behöver flöde A synas i
      // TRENDGRAFEN: poängen är att studenten ska se sambandet Flöde A →
      // SP_B → PV_B över tid, inte bara en ögonblicksbild i statusraden.
      // Till skillnad från Last (som kan bli negativ och då hamna helt
      // utanför panelens klippta yta, se FEAT-045-kommentaren) kan wildFlow
      // ALDRIG bli negativt eller nå 0 medan det vandrar — klippningen i
      // step() (±50% av en bas-nivå > 0) garanterar ett strikt positivt
      // intervall, så den risken gäller inte här.
      this.history = { t: [0], y: [this.process.y], sp: [scenario.runtime.setpoint], u: [0], e: [scenario.runtime.setpoint - this.process.y], p: [0], i: [0], d: [0], aux: [0], wildFlow: [this.wildFlow] };
    }
    reset() { this.stepNo = 0; this.maxSteps = this.baseMaxSteps; this.process.reset(); this.pid.reset(); this.onoff.reset(); this.pulseStepsLeft = 0; this.auxValue = 0; this.wildFlow = this.scenario.ratioControl?.wildFlow?.base ?? 0; this.scenario.controller.bias = 0; this.history = { t: [0], y: [this.process.y], sp: [this.scenario.runtime.setpoint], u: [0], e: [this.scenario.runtime.setpoint - this.process.y], p: [0], i: [0], d: [0], aux: [0], wildFlow: [this.wildFlow] }; }
    triggerPulse() { const p = this.scenario.disturbance.pulse; if (p && p.durationSteps > 0) this.pulseStepsLeft = p.durationSteps; }
    // FEAT-045 — sätter lasten till scenariots auxSignal.magnitude i ETT
    // anrop, ingen räknare (se ovan). Ett nytt klick med ett ändrat fältvärde
    // ERSÄTTER helt enkelt auxValue, inklusive att sätta det till 0 för att
    // ta bort lasten. Scenarier utan auxSignal-fält ger 0 (no-op).
    triggerAuxSignal() { const a = this.scenario.auxSignal; this.auxValue = a ? (a.magnitude || 0) : 0; }
    // FEAT-043 — släpper fram ytterligare ett "baseMaxSteps"-block av steg,
    // så att en pågående körning kan fortsätta utan att tappa historik/tillstånd.
    extendSteps() { this.maxSteps += this.baseMaxSteps; }
    step() {
      if (this.stepNo >= this.maxSteps) return null;
      // FEAT-048 — Kvotreglering: flöde A vandrar (slumpvandring, klippt
      // till ±50% av bas-nivån — "rimligt intervall", STRAT-006 avsnitt 4)
      // NÄR SOM HELST processen är konfigurerad (bas-nivå > 0) — OBEROENDE
      // av om kvotregleringen faktiskt är aktiverad. Detta är medvetet: PO:s
      // lärstig behöver kunna visa flöde A variera FRITT medan SP fortfarande
      // är manuellt fast (lärstigens "Steg 2 — utan kvotreglering", som
      // demonstrerar PROBLEMET en drivande, okontrollerad signal ger innan
      // lösningen visas i Steg 3). Väktaren `base > 0` (inte bara `rc`
      // truthy) är avsiktlig: syncParamsFromUI() skriver ratioControl till
      // VARJE scenario (samma mönster som gainSchedule/nonlinearGain redan
      // gör), så utan den skulle gaussian(this.rng) konsumera slumptal på
      // VARJE steg i ALLA scenarier så fort UI:t synkats en enda gång —
      // ett tyst RNG-läckage som skulle rubba brusmodellens (noiseStd)
      // reproducerbarhet i helt orelaterade scenarier. Ett scenario vars
      // bas-nivå aldrig konfigurerats (default 0, se hydrateFields) förblir
      // därför en fullständig no-op, precis som auxGain/Kff.
      //
      // SP = kvot × flöde A skrivs TILLBAKA till scenario.runtime.setpoint
      // (samma fält alla lägen redan läser, ingen ny parallell SP-källa)
      // — men BARA när kvotregleringen är uttryckligen aktiverad
      // (rc.enabled, "Steg 3"). Görs OBEROENDE av regulatorläge (till
      // skillnad från Kff/gainSchedule, som bara gäller p/pi/pid) eftersom
      // SP självt redan används av samtliga lägen (onoff:s hysteresgränser,
      // manuellts felvisning) — se STRAT-006 avsnitt 3.
      const rc = this.scenario.ratioControl;
      if (rc?.wildFlow?.base > 0) {
        const base = rc.wildFlow.base;
        const volatility = rc.wildFlow.volatility ?? 0;
        const minFlow = base * 0.5, maxFlow = base * 1.5;
        this.wildFlow = Math.min(maxFlow, Math.max(minFlow, this.wildFlow + gaussian(this.rng) * volatility));
        if (rc.enabled) this.scenario.runtime.setpoint = (rc.ratio || 0) * this.wildFlow;
      }
      const sp = this.scenario.runtime.setpoint;
      const pv = this.process.y;
      const mode = this.scenario.controller.mode;
      const limits = this.scenario.controller.outputLimits;
      let ctrl;
      if (mode === "manual") ctrl = { u: this.scenario.controller.manualOutput || 0, error: sp - pv, pTerm: 0, iTerm: 0, dTerm: 0 };
      else if (mode === "onoff") ctrl = { u: this.onoff.step(sp, pv, limits), error: sp - pv, pTerm: 0, iTerm: 0, dTerm: 0 };
      else {
        this.pid.mode = mode;
        const gs = this.scenario.controller.gainSchedule;
        let zoneIdx = null;
        let gkp, gti, gtd;
        if (gs && gs.enabled) {
          zoneIdx = scheduleZone(pv, gs.breakpoint1, gs.breakpoint2);
          const z = gs.zones[zoneIdx];
          gkp = z.kp; gti = z.ti; gtd = z.td;
        } else {
          gkp = this.scenario.controller.kp || 0;
          gti = this.scenario.controller.ti || 0;
          gtd = this.scenario.controller.td || 0;
        }
        if (mode === "p") { gti = 0; gtd = 0; this.pid.integral = 0; this.pid.prevPv = pv; }
        if (mode === "pi") { gtd = 0; this.pid.prevPv = pv; }
        // Bumplös övergång vid zonbyte (inkl. på/av) — återanvänder samma
        // bias/biasFadeSteps/biasFadePerStep-fält som manuell/auto-bytet
        // redan använder (se STRAT-003 avsnitt 1.3). Ingen effekt på steg 0
        // (undviker en konstlad startbias för scenarier som redan startar
        // schemalagda). Till skillnad från lägesbytets bias (satt av app.js
        // INNAN nästa step() anropas, så den befintliga nedräkningen nedan
        // redan hinner konsumera ett steg av fasningen där) sätts och
        // används zonbytets bias inom SAMMA step()-anrop — nedräkningen
        // hoppas därför över just det första, triggande steget, så den
        // beräknade biasen får full effekt innan den börjar fasas ut.
        let freshGainFade = false;
        if (this.stepNo > 0 && this.pid.gainZone !== zoneIdx) {
          const prevU = this.history.u[this.history.u.length - 1] || 0;
          const prevE = this.history.e[this.history.e.length - 1] || 0;
          const bias = prevU - gkp * prevE;
          this.pid.bias = Number.isFinite(bias) ? bias : 0;
          this.pid.biasFadeSteps = 5;
          this.pid.biasFadePerStep = this.pid.bias / 5;
          this.scenario.controller.bias = this.pid.bias;
          freshGainFade = true;
        }
        this.pid.gainZone = zoneIdx;
        this.pid.kp = gkp;
        this.pid.ti = gti;
        this.pid.td = gtd;
        if (!freshGainFade) {
          if (this.pid.biasFadeSteps > 0) {
            this.pid.bias -= this.pid.biasFadePerStep;
            this.pid.biasFadeSteps--;
            if (this.pid.biasFadeSteps === 0) { this.pid.bias = 0; this.scenario.controller.bias = 0; }
          } else {
            this.pid.bias = this.scenario.controller.bias || 0;
          }
        }
        // FEAT-045 — framkopplingsterm (kff × auxValue), se PIDController.step().
        const feedforward = (this.scenario.controller.kff || 0) * this.auxValue;
        ctrl = this.pid.step(sp, pv, limits, this.scenario.controller.antiWindup !== false, feedforward);
      }
      let disturbance = 0;
      if ((this.scenario.disturbance.noiseStd || 0) > 0) disturbance += gaussian(this.rng) * this.scenario.disturbance.noiseStd;
      if (this.pulseStepsLeft > 0) { disturbance += this.scenario.disturbance.pulse.magnitude || 0; this.pulseStepsLeft -= 1; }
      const y = this.process.step(ctrl.u, this.dt, disturbance, this.auxValue);
      this.stepNo += 1;
      const t = this.stepNo * this.dt;
      this.history.t.push(t); this.history.y.push(y); this.history.sp.push(sp); this.history.u.push(ctrl.u); this.history.e.push(ctrl.error); this.history.p.push(ctrl.pTerm || 0); this.history.i.push(ctrl.iTerm || 0); this.history.d.push(ctrl.dTerm || 0); this.history.aux.push(this.auxValue); this.history.wildFlow.push(this.wildFlow);
      return { t: t, y: y, u: ctrl.u, e: ctrl.error };
    }
    run(n) { const frames = []; for (let i = 0; i < n; i += 1) { const f = this.step(); if (!f) break; frames.push(f); } return frames; }
    getState() { const i = this.history.t.length - 1; if (i < 0) return { step: 0, t: 0, y: 0, u: 0, e: 0, pTerm: 0, iTerm: 0, dTerm: 0 }; return { step: this.stepNo, t: this.history.t[i], y: this.history.y[i], u: this.history.u[i], e: this.history.e[i], pTerm: this.history.p[i] || 0, iTerm: this.history.i[i] || 0, dTerm: this.history.d[i] || 0 }; }
  }

  return { seededRandom, gaussian, scheduleZone, scheduledValue, OnOffController, PIDController, ProcessModel, Simulation };
});
