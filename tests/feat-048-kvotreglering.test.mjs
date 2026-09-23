// FEAT-048 — Kvotreglering (Ratio Control).
//
// Testar ratioControl-mekaniken i apps/app/sim-core.js: Simulation.wildFlow
// (kontinuerlig slumpvandring, klippt till ±50% av bas-nivån),
// Simulation.step()s SP = Kvot × Flöde A-beräkning (skriven till
// scenario.runtime.setpoint INNAN sp läses, oberoende av regulatorläge),
// samt att mekanismen är en fullständig no-op (INKLUSIVE ingen RNG-
// konsumtion) för scenarier utan en konfigurerad ratioControl.wildFlow.base
// — bakåtkompatibilitet med alla befintliga scenarier och reproducerbarhet
// för deras brusmodeller.
//
// Egen enkel testrunner, i linje med tests/feat-045-framkoppling.test.mjs.
//
// Körs: node tests/feat-048-kvotreglering.test.mjs

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

function makeScenario({ ratioControl, kp = 3.0, ti = 5.0, sp = 25, noiseStd = 0 } = {}) {
  return {
    id: "feat048-check",
    process: { type: "self_regulating", K: 1.0, T: 8.0, L: 0.0, normalValue: 0.0, measurementRange: { min: 0, max: 100 } },
    controller: { mode: "pi", kp, ti, td: 0, antiWindup: true, outputLimits: { min: 0, max: 100 } },
    disturbance: { noiseStd, pulse: { magnitude: 0, durationSteps: 0 } },
    runtime: { dt: 1.0, maxSteps: 400, setpoint: sp, autopause: false },
    ...(ratioControl ? { ratioControl } : {}),
  };
}

// ── 1. Simulation.wildFlow — startvärde, kontinuerlig variation, klippning ──
{
  const sim = new Simulation(makeScenario({ ratioControl: { enabled: true, ratio: 0.5, wildFlow: { base: 50, volatility: 2 } } }), 42);
  check("1a. wildFlow startar på konfigurerad bas-nivå", sim.wildFlow === 50);
  const values = [sim.wildFlow];
  for (let i = 0; i < 300; i++) { sim.step(); values.push(sim.wildFlow); }
  const distinctValues = new Set(values.map(v => v.toFixed(4))).size;
  check("1b. wildFlow varierar KONTINUERLIGT (inte en engångshändelse) — minst 250 distinkta värden över 300 steg", distinctValues > 250, `fick ${distinctValues} distinkta värden`);
  const min = Math.min(...values), max = Math.max(...values);
  check("1c. wildFlow hålls klippt till [0.5×bas, 1.5×bas] = [25, 75]", min >= 25 - 1e-9 && max <= 75 + 1e-9, `min=${min}, max=${max}`);
  check("1d. wildFlow lämnar sin startnivå (rör sig verkligen, inte bara klippning som råkar träffa 50)", min < 49 || max > 51);
}

// ── 2. SP = Kvot × Flöde A, varje steg, när enabled=true ─────────────────────
{
  const sim = new Simulation(makeScenario({ ratioControl: { enabled: true, ratio: 0.5, wildFlow: { base: 50, volatility: 2 } } }), 42);
  let allMatch = true;
  for (let i = 0; i < 100; i++) {
    sim.step();
    const expectedSp = 0.5 * sim.wildFlow;
    if (Math.abs(sim.scenario.runtime.setpoint - expectedSp) > 1e-9) allMatch = false;
  }
  check("2a. SP == Kvot × Flöde A exakt, varje steg", allMatch);
}

// ── 3. Utan kvotreglering (enabled=false): Flöde A vandrar ändå, men SP är FAST ──
{
  const sim = new Simulation(makeScenario({ ratioControl: { enabled: false, ratio: 0.5, wildFlow: { base: 50, volatility: 2 } }, sp: 25 }), 42);
  const spValues = new Set();
  const wildValues = new Set();
  for (let i = 0; i < 200; i++) { sim.step(); spValues.add(sim.scenario.runtime.setpoint); wildValues.add(sim.wildFlow.toFixed(4)); }
  check("3a. SP förblir HELT FAST (enabled=false) trots att Flöde A vandrar", spValues.size === 1 && spValues.has(25));
  check("3b. Flöde A vandrar ÄNDÅ (base>0, oberoende av enabled) — lärstigens \"utan kvotreglering\"-poäng", wildValues.size > 150, `fick ${wildValues.size} distinkta värden`);
}

// ── 4. Bakåtkompatibilitet — scenario UTAN ratioControl-fält alls ────────────
{
  const sim = new Simulation(makeScenario({ sp: 42 }), 42);
  check("4a. wildFlow är 0 (no-op) när ratioControl saknas helt", sim.wildFlow === 0);
  const f = sim.step();
  check("4b. SP läses oförändrat direkt från scenario.runtime.setpoint", f.y !== undefined && sim.scenario.runtime.setpoint === 42);
  for (let i = 0; i < 50; i++) sim.step();
  check("4c. wildFlow förblir 0 genom hela körningen (aldrig aktiverad)", sim.wildFlow === 0);
}

// ── 5. Inget RNG-läckage — base=0 (default/inert) ger IDENTISK brusbana ──────
{
  const scA = makeScenario({ noiseStd: 1.0, sp: 30 });
  const simA = new Simulation(scA, 7);
  const trajA = [];
  for (let i = 0; i < 60; i++) trajA.push(simA.step().y);

  // Samma scenario, men med en ratioControl-post NÄRVARANDE fast base=0 —
  // simulerar att app.js:s syncParamsFromUI() skrivit default-värden efter
  // att UI synkats, utan att kvotreglering någonsin konfigurerats meningsfullt
  // (se app.js: fields.wildFlowBase defaultar till 0 för just detta syfte).
  const scB = makeScenario({ noiseStd: 1.0, sp: 30, ratioControl: { enabled: false, ratio: 0.5, wildFlow: { base: 0, volatility: 2 } } });
  const simB = new Simulation(scB, 7);
  const trajB = [];
  for (let i = 0; i < 60; i++) trajB.push(simB.step().y);

  const identical = trajA.every((v, i) => Math.abs(v - trajB[i]) < 1e-12);
  check("5a. base=0 ger BIT-IDENTISK brusbana som scenario utan ratioControl alls (ingen RNG-konsumtion)", identical);
}

// ── 6. reset() återställer wildFlow till bas-nivån ───────────────────────────
{
  const sim = new Simulation(makeScenario({ ratioControl: { enabled: true, ratio: 0.5, wildFlow: { base: 50, volatility: 5 } } }), 3);
  for (let i = 0; i < 50; i++) sim.step();
  check("6a. wildFlow har rört sig bort från bas-nivån efter 50 steg", sim.wildFlow !== 50);
  sim.reset();
  check("6b. reset() återställer wildFlow till bas-nivån", sim.wildFlow === 50);
}

// ── 7. Fungerar tillsammans med befintlig PID — kvoten hålls nära målvärdet ──
{
  const sim = new Simulation(makeScenario({ ratioControl: { enabled: true, ratio: 0.5, wildFlow: { base: 50, volatility: 2 } } }), 42);
  for (let i = 0; i < 300; i++) sim.step();
  const finalRatio = sim.process.y / sim.wildFlow;
  check("7a. Faktisk kvot (PV/Flöde A) nära avsett Kvot=0.5 efter insvängning", Math.abs(finalRatio - 0.5) < 0.05, `fick ${finalRatio.toFixed(4)}`);
  check("7b. Inga NaN/Infinity i PV genom hela körningen (PID + kvotreglering samverkar utan att gå sönder)", Number.isFinite(sim.process.y));
}

// ── 8. Felaktig kvot — regleringen håller EN kvot stabilt, men fel kvot ──────
{
  const sim = new Simulation(makeScenario({ ratioControl: { enabled: true, ratio: 0.3, wildFlow: { base: 50, volatility: 2 } } }), 42);
  for (let i = 0; i < 300; i++) sim.step();
  const finalRatio = sim.process.y / sim.wildFlow;
  check("8a. Faktisk kvot hålls nära det FELAKTIGA värdet 0.3 (inte 0.5)", Math.abs(finalRatio - 0.3) < 0.05, `fick ${finalRatio.toFixed(4)}`);
  check("8b. ...och INTE nära 0.5 (bekräftar att felet verkligen syns, inte råkar självkorrigera)", Math.abs(finalRatio - 0.5) > 0.1);
}

// ── 9. UI-struktur (index.html/app.js) — samma statiska källkodskontroll som
// ux-002/ux-004-testerna, för att bekräfta att UX-002/UX-004-mönstret
// verkligen återanvänts (PO:s uttryckliga krav), inte en ny UI-arkitektur ──
{
  const html = readFileSync(path.join(APP_DIR, "index.html"), "utf8");
  const appJs = readFileSync(path.join(APP_DIR, "app.js"), "utf8");
  const helpJson = JSON.parse(readFileSync(path.join(APP_DIR, "content", "help.json"), "utf8"));

  check("9a. Kvotreglering aktiv + Kvot ligger i advancedFieldsRegulator", /id="advancedFieldsRegulator"[\s\S]{0,900}<label for="ratioControlEnabled"[\s\S]{0,500}<label for="ratio"/.test(html));
  check("9b. Flöde A basnivå + volatilitet ligger i advancedFieldsProcess", /id="advancedFieldsProcess"[\s\S]{0,700}<label for="wildFlowBase"[\s\S]{0,500}<label for="wildFlowVolatility"/.test(html));
  check("9c. Samtliga fyra fält har data-addon=\"kvotreglering\" (samma [data-addon]-mönster som övriga tillägg)", (html.match(/data-addon="kvotreglering"/g) || []).length === 4);
  check("9d. APPLICATION_PROFILES: kvotreglering tillagt som addon, INGEN egen Tillämpning skapad (fortfarande bara tre profiler)", /avancerat:.*addons: \["framkoppling", "parameterstyrning", "ventilkarakteristik", "kvotreglering"\]/.test(appJs) && (appJs.match(/^\s{2}\w+:\s*\{ processModels:/gm) || []).length === 3);
  check("9e. deriveApplicationProfile() härleder Temperaturprocess när flöde A är konfigurerat", /if \(scenario\.ratioControl\?\.wildFlow\?\.base > 0\) return "temperatur";/.test(appJs));
  check("9f. updateRatioControlUIState() inaktiverar SP-fältet (inte döljer) när kvotreglering är aktiv", /function updateRatioControlUIState\(\) \{\s*\n\s*fields\.sp\.disabled = fields\.ratioControlEnabled\.checked;/.test(appJs));
  check("9g. applyApplicationProfile() nollställer wildFlowBase (INTE bara checkboxen) när tillägget otillåtet", /if \(!profile\.addons\.includes\("kvotreglering"\)\) \{ fields\.ratioControlEnabled\.checked = false; fields\.wildFlowBase\.value = 0; \}/.test(appJs));
  // FEAT-048 användartest (2026-09-24) lade senare till en graflinje också
  // (avsnitt 11) — statusraden behölls DÄRUTÖVER, inte ersatt, eftersom den
  // ger en exakt siffra grafen bara antyder visuellt.
  check("9h. Statusraden visar Flöde A/Flöde B/faktisk kvot", /Flöde A=.*Flöde B=.*Kvot \(faktisk\)=/.test(appJs));
  check("9i. help.json har poster för samtliga fyra nya fält", !!helpJson.ratioControlEnabled && !!helpJson.ratio && !!helpJson.wildFlowBase && !!helpJson.wildFlowVolatility);
  check("9j. markerSnapshot()/describeMarkerChange() känner av kvotregleringens KONFIGURATION (inte den löpande SP-rörelsen)", /ratioControl: JSON\.stringify\(scenario\.ratioControl/.test(appJs) && /if \(a\.ratioControl !== b\.ratioControl\) return "Kvotreglering ändrad";/.test(appJs));
}

// ── 10. history.wildFlow — trendgrafens datakälla (PO:s användartest 2026-09-24:
// Flöde A måste synas i grafen, inte bara statusraden) ──
{
  const sim = new Simulation(makeScenario({ ratioControl: { enabled: true, ratio: 0.5, wildFlow: { base: 50, volatility: 2 } } }), 42);
  check("10a. history.wildFlow finns från start, ett värde (bas-nivån) vid t=0", Array.isArray(sim.history.wildFlow) && sim.history.wildFlow.length === 1 && sim.history.wildFlow[0] === 50);
  for (let i = 0; i < 50; i++) sim.step();
  check("10b. history.wildFlow växer i takt med t/y/sp (samma längd, en post per steg)", sim.history.wildFlow.length === sim.history.t.length && sim.history.t.length === sim.history.y.length);
  check("10c. Samtliga wildFlow-poster i historiken förblir strikt positiva (aldrig den \"osynlig utanför panelen\"-risk Last/auxValue har, se sim-core.js-kommentaren)", sim.history.wildFlow.every(v => v > 0));

  const simUnrelated = new Simulation(makeScenario({ sp: 10 }), 42);
  for (let i = 0; i < 20; i++) simUnrelated.step();
  check("10d. Ett scenario utan ratioControl får en flat, harmlös wildFlow-historik (alla 0)", simUnrelated.history.wildFlow.every(v => v === 0));
}

// ── 11. Grafen — Flöde A ritas som egen kurva (statisk källkodskontroll) ──
{
  const appJs = readFileSync(path.join(APP_DIR, "app.js"), "utf8");
  const html = readFileSync(path.join(APP_DIR, "index.html"), "utf8");
  check("11a. drawChart() ritar Flöde A villkorat på samma bas>0-signal som styr om det vandrar i sim-core.js", /const hasWildFlow = sim\.scenario\.ratioControl\?\.wildFlow\?\.base > 0/.test(appJs));
  check("11b. Flöde A ritas i SAMMA panel/skala som PV\/SP (yScaleTop), inte en separat panel — PO:s krav att sambandet ska synas direkt", /drawSeries\(ctx, t\.map\(\(tv, i\) => \(\{ x: xScale\(tv\), y: yScaleTop\(wildFlow\[i\]\) \}\)\), "#c2185b", true, 1\)/.test(appJs));
  check("11c. Flöde A ritas TUNNARE (width=1) än PV/SP/u (width=2) — visuellt underordnad, inte en tredje huvudsignal", /drawSeries\(ctx, points, color, dashed, width = 2\)/.test(appJs));
  check("11d. Legenden byggs om dynamiskt och nämner Flöde A bara när linjen faktiskt ritas", /hasWildFlow \? gap \+ "Rosa streckad \(tunn\): Flöde A" : ""/.test(appJs));
  check("11e. #chartLegend-elementet finns i markupen (id tillagt för att JS ska kunna uppdatera det)", html.includes('id="chartLegend"'));
  check("11f. clearChart/systemReset-knapparna nollställer wildFlow-historiken (annars kraschar nästa steg mot ett tomt/undefined-fält)", (appJs.match(/aux: \[\], wildFlow: \[\], markers: \[\]/g) || []).length === 2);
}

// ── 12. Mätläge — crosshair visar Flöde A/SP_B när kvotreglering är aktiv
// (PO:s komplettering, 2026-09-24), OFÖRÄNDRAT för övriga reglerstrategier ──
{
  const appJs = readFileSync(path.join(APP_DIR, "app.js"), "utf8");
  check("12a. Crosshair-raderna PV/u är BYTE-IDENTISKA med tidigare (oförändrat för övriga strategier)", /const lines = \["t  = " \+ Math\.round\(tHover\), "PV = " \+ pvH\.toFixed\(1\), "u  = " \+ uH\.toFixed\(1\)\];/.test(appJs));
  check("12b. SP_B/Flöde A läggs till EXAKT när hasWildFlow — samma villkor som styr grafens Flöde A-linje (avsnitt 11a)", /if \(hasWildFlow\) \{\s*\n\s*lines\.push\("SP_B    = " \+ spH\.toFixed\(1\)\);\s*\n\s*lines\.push\("Flöde A = " \+ wildH\.toFixed\(1\)\);/.test(appJs));
  check("12c. spH/wildH läses från sim.history.sp/wildFlow vid samma tidpunkt (iNear) som PV/u redan gör — inte en separat, potentiellt osynkad källa", /const spH = hasWildFlow \? \(sp\[iNear\] != null \? sp\[iNear\] : 0\) : null;/.test(appJs) && /const wildH = hasWildFlow \? \(wildFlow\[iNear\] != null \? wildFlow\[iNear\] : 0\) : null;/.test(appJs));
  check("12d. wildFlow/hasWildFlow lyfta till funktionsnivå (återanvänds av både grafens linje och crosshairen, ingen duplicerad logik)", (appJs.match(/const hasWildFlow = sim\.scenario\.ratioControl\?\.wildFlow\?\.base > 0/g) || []).length === 1);
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
