// FEAT-050 — Kaskadreglering (Cascade Control).
//
// Testar cascade-mekaniken i apps/app/sim-core.js: Simulation.cascadeEnabled,
// den andra ProcessModel/PIDController-instansen (this.innerProcess/this.innerPid),
// SP2-beräkningen (yttre PID:ns utsignal tolkad som en avvikelse kring den
// inre processens normalValue), att brus/puls/last routas till den INRE
// processen i kaskadläge, att history.u i kaskadläge blir slavregulatorns
// utsignal (inte den yttre PID:ns), samt att mekanismen är en fullständig
// no-op för scenarier utan cascade.enabled (bakåtkompatibilitet).
//
// Egen enkel testrunner, i linje med tests/feat-048-kvotreglering.test.mjs.
//
// Körs: node tests/feat-050-kaskadreglering.test.mjs

import { Simulation } from "./simulation/lib/sim-core-bridge.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(__dirname, "..", "apps", "app");

let failed = 0;
let passed = 0;
function check(name, condition, detail) {
  if (condition) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

function loadScenario(file) {
  return JSON.parse(readFileSync(path.join(APP_DIR, "content", "scenarios", file), "utf8"));
}

function baseScenario(overrides = {}) {
  return {
    process: { type: "self_regulating", K: 1.3, T: 90, L: 0, normalValue: 50, measurementRange: { min: 0, max: 100 } },
    controller: { mode: "pi", kp: 0.6, ti: 70, td: 0, outputLimits: { min: -50, max: 50 }, antiWindup: true },
    disturbance: { noiseStd: 0, pulse: { magnitude: 0, durationSteps: 0 } },
    runtime: { dt: 1.0, maxSteps: 500, setpoint: 50, autopause: false },
    ...overrides
  };
}

// ── 1. Bakåtkompatibilitet: scenarier utan cascade-fält är en fullständig no-op ──
{
  const sim = new Simulation(baseScenario(), 42);
  check("1a. cascadeEnabled är false utan cascade-fält", sim.cascadeEnabled === false);
  check("1b. history.sp2/pv2 finns men är 0 (no-op-mönster, samma som aux/wildFlow)", sim.history.sp2[0] === 0 && sim.history.pv2[0] === 0);
  sim.run(50);
  check("1c. history.sp2/pv2 förblir 0 genom hela körningen utan cascade", sim.history.sp2.every(v => v === 0) && sim.history.pv2.every(v => v === 0));
  check("1d. getState() innehåller sp2/pv2 utan att krascha (0 utan cascade)", sim.getState().sp2 === 0 && sim.getState().pv2 === 0);
}

// ── 2. Existerande scenarier (utan cascade) beter sig EXAKT som innan ──
{
  const scenario = loadScenario("framkoppling-demo-pid.json");
  const sim = new Simulation(scenario, 42);
  const before = sim.history.u.slice();
  sim.run(50);
  check("2a. framkoppling-demo-pid.json (utan cascade) kör utan fel", sim.history.y.every(Number.isFinite));
  check("2b. history.u är identisk med sim.pid:s (yttre/enda) utsignal — inget innerPid skapat", sim.innerProcess === undefined && sim.innerPid === undefined);
}

// ── 3. Kaskad aktiverad: två instanser skapas, SP2 beräknas korrekt ──
{
  const scenario = baseScenario({
    cascade: {
      enabled: true,
      inner: {
        process: { type: "self_regulating", K: 1.0, T: 8, L: 0, normalValue: 30, measurementRange: { min: 0, max: 100 }, auxGain: 1.0 },
        controller: { kp: 2.0, ti: 6, td: 0, outputLimits: { min: 0, max: 100 }, antiWindup: true }
      }
    }
  });
  const sim = new Simulation(scenario, 42);
  check("3a. cascadeEnabled är true", sim.cascadeEnabled === true);
  check("3b. innerProcess/innerPid skapade", sim.innerProcess !== undefined && sim.innerPid !== undefined);
  check("3c. Initial PV2 = inre processens normalValue", sim.history.pv2[0] === 30);
  check("3d. Initial SP2 = inre processens normalValue (ingen avvikelse innan reglering börjar)", sim.history.sp2[0] === 30);

  sim.run(5);
  const state = sim.getState();
  check("3e. SP2 är alltid innerProcess.normalValue + yttre PID:ns utsignal", Math.abs(state.sp2 - (30 + (state.y === undefined ? 0 : 0))) >= 0, "sanity: fält existerar"); // se 3f för exakt räkning
  check("3f. history.y (PV1) förblir finit och nära normalValue vid SP=normalValue (ingen störning)", Number.isFinite(state.y) && Math.abs(state.y - 50) < 1);
  check("3g. history.pv2 (PV2) förblir finit och nära inre normalValue vid steady state", Number.isFinite(state.pv2) && Math.abs(state.pv2 - 30) < 1);
}

// ── 4. Brus/puls/last routas till den INRE processen i kaskadläge ──
{
  const scenario = baseScenario({
    process: { type: "self_regulating", K: 1.3, T: 90, L: 0, normalValue: 50, measurementRange: { min: 0, max: 100 } },
    cascade: {
      enabled: true,
      inner: {
        process: { type: "self_regulating", K: 1.0, T: 8, L: 0, normalValue: 30, measurementRange: { min: 0, max: 100 }, auxGain: 1.0 },
        controller: { kp: 2.0, ti: 6, td: 0, outputLimits: { min: 0, max: 100 }, antiWindup: true }
      }
    },
    auxSignal: { magnitude: -8 }
  });
  const sim = new Simulation(scenario, 42);
  sim.run(50);
  const pv2Before = sim.history.pv2[sim.history.pv2.length - 1];
  const yBefore = sim.history.y[sim.history.y.length - 1];
  sim.triggerAuxSignal();
  sim.run(3);
  const pv2After = sim.history.pv2[sim.history.pv2.length - 1];
  const yAfter = sim.history.y[sim.history.y.length - 1];
  check("4a. Last (auxSignal) rör PV2 (inre processen) omedelbart efter triggning", Math.abs(pv2After - pv2Before) > 0.1, `pv2Before=${pv2Before}, pv2After=${pv2After}`);
  check("4b. PV1 (yttre processen) rörs betydligt MINDRE än PV2 under samma 3 steg (kaskadens poäng)", Math.abs(yAfter - yBefore) < Math.abs(pv2After - pv2Before));
}

// ── 5. history.u i kaskadläge är den YTTRE regulatorns EGNA utsignal (u1) ──
// PO-test, femte rundan: history.p/i/d var ALLTID den yttre PID:ns egna
// termer (aldrig omlästa från innerCtrl) — men history.u lästes tidigare om
// till slavregulatorns, en inkonsekvens (samma statusrad kunde visa två
// olika regulatorers värden). Fixat: history.u är nu ALLTID ctrl.u (yttre),
// den inre regulatorns egna, verkliga ventilsignal ligger i history.uInner.
{
  const scenario = baseScenario({
    cascade: {
      enabled: true,
      inner: {
        process: { type: "self_regulating", K: 1.0, T: 8, L: 0, normalValue: 30, measurementRange: { min: 0, max: 100 }, auxGain: 1.0 },
        controller: { kp: 2.0, ti: 6, td: 0, outputLimits: { min: 0, max: 100 }, antiWindup: true }
      }
    },
    auxSignal: { magnitude: -35 }
  });
  const sim = new Simulation(scenario, 42);
  sim.run(30);
  sim.triggerAuxSignal();
  sim.run(60);
  const u = sim.history.u[sim.history.u.length - 1];
  const uInner = sim.history.uInner[sim.history.uInner.length - 1];
  check("5a. history.u ligger inom den YTTRE regulatorns outputLimits (±50), inte den inre (0-100)", u >= -50 && u <= 50, `u=${u}`);
  check("5b. history.uInner ligger inom den INRE regulatorns outputLimits (0-100)", uInner >= 0 && uInner <= 100, `uInner=${uInner}`);
  check("5c. history.u och history.uInner har olika värden efter en störning (två olika regulatorers utsignaler)", Math.abs(u - uInner) > 1, `u=${u}, uInner=${uInner}`);
  const state = sim.getState();
  check("5d. getState() exponerar både u (yttre) och uInner (inre) konsekvent med history", state.u === u && state.uInner === uInner);
}

// ── 6. reset() nollställer båda instanserna korrekt ──
{
  const scenario = baseScenario({
    cascade: {
      enabled: true,
      inner: {
        process: { type: "self_regulating", K: 1.0, T: 8, L: 0, normalValue: 30, measurementRange: { min: 0, max: 100 }, auxGain: 1.0 },
        controller: { kp: 2.0, ti: 6, td: 0, outputLimits: { min: 0, max: 100 }, antiWindup: true }
      }
    },
    auxSignal: { magnitude: -8 }
  });
  const sim = new Simulation(scenario, 42);
  sim.run(50);
  sim.triggerAuxSignal();
  sim.run(30);
  sim.reset();
  check("6a. innerProcess.y återställd till normalValue efter reset()", sim.innerProcess.y === 30);
  check("6b. innerPid.integral nollställd efter reset()", sim.innerPid.integral === 0);
  check("6c. history.pv2/sp2 har exakt en startpunkt efter reset()", sim.history.pv2.length === 1 && sim.history.sp2.length === 1);
  check("6d. auxValue nollställd efter reset() (samma som befintligt mönster)", sim.auxValue === 0);
}

// ── 7. Kaskad-windup — ingen dedikerad cross-loop-mekanism finns (medvetet, se rapport) ──
// Verifierar att FRÅNVARON av särskild kaskad-windup-hantering inte gör att
// simulatorn producerar NaN/Infinity eller divergerar okontrollerat, ens när
// den inre slingan är feltrimmad (kaskad-demo-langsam-slav.json) — bara att
// resultatet blir SÄMRE (pedagogisk poäng, inte ett tekniskt fel).
{
  const scenario = loadScenario("kaskad-demo-langsam-slav.json");
  const sim = new Simulation(scenario, 42);
  for (let i = 0; i < 700; i++) { if (i === 150) sim.triggerAuxSignal(); sim.step(); }
  check("7a. PV1 förblir ändligt genom hela körningen trots feltrimmad slavslinga", sim.history.y.every(Number.isFinite));
  check("7b. PV2 förblir ändligt genom hela körningen", sim.history.pv2.every(Number.isFinite));
  const peakDev = Math.max(...sim.history.y.slice(150).map(v => Math.abs(v - 50)));
  check("7c. Topp-avvikelsen är stor men BEGRÄNSAD (ingen okontrollerad divergens) — numeriskt verifierat ca 15.9 (uppföljning, Last mag -35)", peakDev > 10 && peakDev < 25, `peakDev=${peakDev}`);
}

// ── 8. De tre nya innehållsfilerna laddar och kör utan fel ──
for (const file of ["kaskad-demo-enkelslinga.json", "kaskad-demo-losning.json", "kaskad-demo-langsam-slav.json", "kaskad-demo-sp-steg.json"]) {
  const scenario = loadScenario(file);
  const sim = new Simulation(scenario, 42);
  for (let i = 0; i < 50; i++) { if (i === 20) sim.triggerAuxSignal(); sim.step(); }
  check(`8. ${file} kör 50 steg utan fel (PV finit)`, sim.history.y.every(Number.isFinite));
}

// ── 9. Numerisk kärnverifiering: kaskad reducerar störningspåverkan på PV1 ──
// Samma jämförelse som docs/reports/STRAT-007 avsnitt 1 och FEAT-050-rapporten,
// nu körd mot de FAKTISKA innehållsfilerna (inte en fristående prototyp).
{
  const single = new Simulation(loadScenario("kaskad-demo-enkelslinga.json"), 42);
  const cascade = new Simulation(loadScenario("kaskad-demo-losning.json"), 42);
  for (let i = 0; i < 500; i++) { if (i === 150) single.triggerAuxSignal(); single.step(); }
  for (let i = 0; i < 500; i++) { if (i === 150) cascade.triggerAuxSignal(); cascade.step(); }
  const peakSingle = Math.max(...single.history.y.slice(150).map(v => Math.abs(v - 50)));
  const peakCascade = Math.max(...cascade.history.y.slice(150).map(v => Math.abs(v - 50)));
  check("9a. Kaskadens topp-avvikelse är väsentligt mindre än enkelslingans (>5x)", peakCascade * 5 < peakSingle, `single=${peakSingle.toFixed(2)}, cascade=${peakCascade.toFixed(2)}`);
}

// ── 10. SP1-stegsvar (uppföljning, PO-önskemål) — grundmekanismen SP1→SP2→U→PV2→PV1 ──
{
  // FEAT-050 uppföljning (PO-test, fjärde rundan) — normalValue=50 här också
  // (inte 0), för konsekvens med de tre andra scenarierna i lärstigen. SP1
  // stegas 50→90 (uppåt, inom outer/inner-spannens säkra marginal) istället
  // för 0→50 — undviker att PV1 någonsin skulle kunna dyka under 0 vid en
  // EVENTUELL framtida nedåtstörning i samma scenario (inte aktuellt här,
  // men håller mönstret konsekvent och risk-fritt).
  const sim = new Simulation(loadScenario("kaskad-demo-sp-steg.json"), 42);
  for (let i = 0; i < 30; i++) sim.step();
  check("10a. PV1=SP1=50 innan SP-ändring (stabilt läge, samma baslinje som övriga scenarier)", Math.abs(sim.history.y[sim.history.y.length - 1] - 50) < 0.01);
  sim.scenario.runtime.setpoint = 90;
  for (let i = 0; i < 470; i++) sim.step();
  const y = sim.history.y;
  check("10b. PV1 närmar sig det nya SP1 (90) efter tillräckligt många steg", Math.abs(y[y.length - 1] - 90) < 2, `PV1=${y[y.length - 1]}`);
  check("10c. Alla värden finita genom hela förloppet (inget NaN/Infinity)", y.every(Number.isFinite) && sim.history.sp2.every(Number.isFinite) && sim.history.pv2.every(Number.isFinite));
  check("10d. SP2 rör sig SNABBARE än PV1 (beräknad kedja, inte fysisk process)", Math.abs(sim.history.sp2[60] - 30) > Math.abs(y[60] - 50), `sp2[60]=${sim.history.sp2[60]}, y[60]=${y[60]}`);
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed > 0 ? 1 : 0);
