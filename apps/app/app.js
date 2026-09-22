/* Data laddas via fetch() från content/catalog.json (DEV) eller
   content/catalog.prod.json (PROD) vid uppstart — se ENV_CONFIG.catalogFile. */
/* OnOffController, PIDController, ProcessModel, seededRandom, gaussian och
   Simulation kommer från sim-core.js (laddas som separat <script> före
   denna fil) — se apps/app/sim-core.js. Delad med tests/simulation/. */

const APP_VERSION = "1.6.0";

/* ENV_CONFIG sätts av env.js (laddas som separat <script> FÖRE denna fil,
   se index.html och docs/development/ENVIRONMENTS.md). Fallback här är en
   säkerhetsnät om env.js av någon anledning inte laddats — motsvarar DEV,
   det historiska beteendet innan PROD-001B. Miljön kan INTE bytas via
   URL-parameter, tangentbord eller dold knapp — enda källan är env.js. */
const ENV_CONFIG = window.ENV_CONFIG || (function () {
  console.warn("env.js saknas — faller tillbaka till development-profil.");
  return { environment: "development", showTestMode: true, showScore: true, showExperimentalContent: true, showMeasurementFacit: true, showGamification: true, catalogFile: "catalog.json" };
})();

/* GAM-002/GAM-003 — Aktivitetsspårning och nivåprogression (badge, nivånamn,
   grafisk mätare — inga XP-tal). Fram till v1.5.0 var detta enbart en
   DEV-only teknisk prototyp, gated på ENV_CONFIG.environment. PO beslutade
   (2026-09-10, PM otillgänglig) att aktivera funktionen i PROD i sitt
   nuvarande skick, inklusive DEV-konsolstödet (window.ActivityPrototype/
   window.GamificationDev) för felsökning på plats. Styrs därför numera
   ENDAST av den egna flaggan showGamification — HELT OBEROENDE av
   ENV_CONFIG.environment, som fortsatt styr Test-läge/poäng/mätfacit/
   experimentellt innehåll (dessa förblir avstängda i PROD, oförändrat).
   showGamification kan aldrig sättas via URL/hash/dold knapp — enda källan
   är env.js/env.prod.js, se docs/development/ENVIRONMENTS.md. Skripten
   injiceras bara alls om flaggan är satt — annars begärs de aldrig över
   nätverket. Se docs/development/GAMIFICATION-XP-PROTOTYPE.md. */
if (ENV_CONFIG.showGamification) {
  [
    "./activity-prototype-core.js", "./activity-prototype.js",
    "./gamification-xp-engine.js", "./gamification-store.js", "./gamification-ui.js", "./gamification.js",
  ].forEach(src => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false; // körordning MÅSTE bevaras — varje fil beror på de föregående
    document.head.appendChild(s);
  });
}
/* Guardat, valfritt anrop — aktivitetsmodulen kan saknas (PROD, eller om den
   av något skäl inte laddat än) utan att någon av appens kärnfunktioner
   påverkas. Se DEL 3: "Om aktivitetsmodulen misslyckas ska simulatorn
   fortfarande fungera." */
function activityDispatch(type, meta) {
  if (typeof window.__activityDispatch === "function") {
    try { window.__activityDispatch(type, meta); } catch (err) { /* tyst — se ovan */ }
  }
}

let SCENARIOS = {}, THEORY = {}, LEARNING_PATHS = {}, HELP_CONTENT = {};

function getBasePath() {
  return window.location.href.replace(/\/[^/]*$/, '');
}

async function loadCatalog() {
  const base = getBasePath();
  const catalogFile = ENV_CONFIG.catalogFile || 'catalog.json';
  const catalog = await fetch(base + '/content/' + catalogFile + '?t=' + Date.now()).then(r => { if (!r.ok) throw new Error(catalogFile + ': ' + r.status); return r.json(); });
  const v = '?v=' + (catalog.version || '1');
  const [scenarioDatas, theoryDatas, pathDatas, helpData] = await Promise.all([
    Promise.all(catalog.scenarios.map(s => fetch(base + '/content/' + s.file + v).then(r => r.json()))),
    Promise.all(catalog.theory.map(t => fetch(base + '/content/' + t.file + v).then(r => r.json()))),
    Promise.all(catalog.learning_paths.map(p => fetch(base + '/content/' + p.file + v).then(r => r.json()))),
    fetch(base + '/content/' + catalog.help + v).then(r => r.json())
  ]);
  catalog.scenarios.forEach((entry, i) => {
    const s = scenarioDatas[i];
    s._standalone = entry.standalone !== false; // saknas fältet (DEV) = synlig, som tidigare
    SCENARIOS[entry.file.split('/').pop()] = s;
  });
  catalog.theory.forEach((entry, i) => { THEORY[entry.file.split('/').pop()] = theoryDatas[i]; });
  catalog.learning_paths.forEach((entry, i) => { LEARNING_PATHS[entry.id] = pathDatas[i]; });
  HELP_CONTENT = helpData;
}


function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

const scenarioSelect = document.getElementById("scenario");
const learningPathSelect = document.getElementById("learningPath");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const chartCanvas = document.getElementById("chart");
const learnBody = document.getElementById("learnBody");
const btnExtendSteps = document.getElementById("btnExtendSteps");

const fields = {
  // UX-002 — Tillämpning (styr vilka processmodeller/strategitillägg som visas, se applyApplicationProfile())
  applicationProfile: document.getElementById("applicationProfile"),
  processType: document.getElementById("processType"),
  k: document.getElementById("k"), t: document.getElementById("t"), l: document.getElementById("l"),
  normalValue: document.getElementById("normalValue"),
  outflow: document.getElementById("outflow"),
  // FEAT-045 — Framkoppling: processens egen lastförstärkning
  auxGain: document.getElementById("auxGain"),
  kp: document.getElementById("kp"), ti: document.getElementById("ti"), td: document.getElementById("td"),
  // FEAT-045 — Framkoppling: regulatorns framkopplingsförstärkning (kan vara negativ)
  kff: document.getElementById("kff"),
  sp: document.getElementById("sp"), umin: document.getElementById("umin"), umax: document.getElementById("umax"),
  manualOutput: document.getElementById("manualOutput"),
  mode: document.getElementById("mode"),
  // UX-004 Justering 4 — synliga Läge-kontroller (mode ovan förblir den dolda
  // interna sanningskällan, se updateControllerUIState()/mode-lyssnaren)
  regulatorType: document.getElementById("regulatorType"), autoManualToggle: document.getElementById("autoManualToggle"),
  noise: document.getElementById("noise"), pulseMag: document.getElementById("pulseMag"), pulseDuration: document.getElementById("pulseDuration"), showPB: document.getElementById("showPB"),
  // FEAT-045 — Framkoppling: den mätbara lastens triggade nivå
  auxMag: document.getElementById("auxMag"),
  hysteresLower: document.getElementById("hysteresLower"), hysteresUpper: document.getElementById("hysteresUpper"),
  antiWindup: document.getElementById("antiWindup"),
  // FEAT-042 — Parameterstyrning (regulatorns kp/ti/td-schema, keyed på PV)
  gainScheduleEnabled: document.getElementById("gainScheduleEnabled"),
  gsBreak1: document.getElementById("gsBreak1"), gsBreak2: document.getElementById("gsBreak2"),
  gsZ1Kp: document.getElementById("gsZ1Kp"), gsZ1Ti: document.getElementById("gsZ1Ti"), gsZ1Td: document.getElementById("gsZ1Td"),
  gsZ2Kp: document.getElementById("gsZ2Kp"), gsZ2Ti: document.getElementById("gsZ2Ti"), gsZ2Td: document.getElementById("gsZ2Td"),
  gsZ3Kp: document.getElementById("gsZ3Kp"), gsZ3Ti: document.getElementById("gsZ3Ti"), gsZ3Td: document.getElementById("gsZ3Td"),
  // FEAT-042 — Olinjär ventilkarakteristik (processens K-schema, keyed på u)
  nonlinearGainEnabled: document.getElementById("nonlinearGainEnabled"),
  ngBreak1: document.getElementById("ngBreak1"), ngBreak2: document.getElementById("ngBreak2"),
  ngZ1K: document.getElementById("ngZ1K"), ngZ2K: document.getElementById("ngZ2K"), ngZ3K: document.getElementById("ngZ3K")
};

let currentScenario = null;
let sim = null;
let currentPath = null;
let currentPathId = null; // GAM-002: katalog-id (skiljer sig från processbegransningar.v1:s interna id)
let currentPathStep = -1;
let testMode = false;
let checkpointAnswered = false;
let pathScore = { correct: 0, total: 0 };
let measureMode = false;
let measureCollapsedLeft = false;
let measureCollapsedGroups = [];
let hoverPos = null;
let zoomView   = null; // null = visa allt, { start, end } = zoomed t-range
let pvZoomView = null; // null = visa allt, { min, max } = zoomed PV-range
let lastMarkerSnapshot = null; // baseline för att upptäcka parameterändringar under en pågående körning (se markera-i-grafen-funktionen)
let currentScenarioRef = null; // senast laddade scenariots FIL-referens (t.ex. "pid-disturbance-noise.json") — currentScenario.id saknar .json, så den räcker inte för att jämföra mot lärstigsstegs step.ref

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
  const tFull = Math.max(1, t[t.length - 1] || 1);
  const tStart = zoomView ? zoomView.start : 0;
  const tMax   = zoomView ? zoomView.end   : tFull;
  const yMin = pvZoomView ? pvZoomView.min : Math.min(sim.scenario.process.measurementRange.min, 0);
  const yMax = pvZoomView ? pvZoomView.max : Math.max(sim.scenario.process.measurementRange.max, 100);
  const uViewMin = 0, uViewMax = 100;
  const xScale = v => pad.left + ((v - tStart) / (tMax - tStart || 1)) * (w - pad.left - pad.right);
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
    const sp_current = sim.scenario.runtime.setpoint;
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
    const sp_current = sim.scenario.runtime.setpoint;
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

  // FEAT-042 — Brytpunkter för Parameterstyrning (PV, övre panelen) och
  // olinjär ventilkarakteristik (u, nedre panelen). Samma tunna,
  // halvtransparenta hjälplinje-stil som FEAT-038 (10 %/90 %/2 %-linjerna) —
  // horisontella referenslinjer vid ett fast värde, inte tidsmarkeringar.
  const gs042 = sim.scenario.controller.gainSchedule;
  if (gs042 && gs042.enabled) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#e67e22"; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
    [gs042.breakpoint1, gs042.breakpoint2].forEach(bp => {
      const py = yScaleTop(bp);
      ctx.beginPath(); ctx.moveTo(pad.left, py); ctx.lineTo(w - pad.right, py); ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.fillStyle = "#e67e22"; ctx.font = "10px Segoe UI"; ctx.textAlign = "right";
    ctx.fillText("Zongräns (PV)", w - pad.right - 4, yScaleTop(gs042.breakpoint2) - 3);
    ctx.restore();
  }
  const ng042 = sim.scenario.process.nonlinearGain;
  if (ng042 && ng042.enabled) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#16a085"; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
    [ng042.breakpoint1, ng042.breakpoint2].forEach(bp => {
      const py = yScaleBot(bp);
      ctx.beginPath(); ctx.moveTo(pad.left, py); ctx.lineTo(w - pad.right, py); ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.fillStyle = "#16a085"; ctx.font = "10px Segoe UI"; ctx.textAlign = "right";
    ctx.fillText("Zongräns (u)", w - pad.right - 4, yScaleBot(ng042.breakpoint2) - 3);
    ctx.restore();
  }

  ctx.fillStyle = "#444"; ctx.font = "12px Segoe UI"; ctx.textAlign = "left";
  ctx.fillText("PV/SP", pad.left + 6, pad.top + 14);
  ctx.fillText("u", pad.left + 6, h * 0.68 + 16);
  ctx.save();
  ctx.beginPath();
  ctx.rect(pad.left, pad.top, w - pad.left - pad.right, h * 0.62 - pad.top);
  ctx.clip();
  drawSeries(ctx, t.map((tv, i) => ({ x: xScale(tv), y: yScaleTop(y[i]) })), "#1266f1", false);
  drawSeries(ctx, t.map((tv, i) => ({ x: xScale(tv), y: yScaleTop(sp[i]) })), "#d64545", true);
  // FEAT-045 (användartest, punkt 5) — lastsignalen ritas INTE längre som en
  // egen graflinje: den delar PV/SP-panelens 0–100-skala, och ett negativt
  // lastvärde (t.ex. värmeväxlar-exemplets −20) hamnade då UTANFÖR panelens
  // klippta yta och blev helt osynlig. Lastens nivå visas istället i
  // statusraden (se updateStatus()) — en siffra är otvetydig oavsett tecken,
  // till skillnad från en linjeposition på en skala den inte passar i.
  // Markeringslinjen vid triggning (sim.history.markers, "Last → -20")
  // fungerar oförändrat och är den huvudsakliga tidsreferensen i grafen.
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(pad.left, h * 0.68, w - pad.left - pad.right, h - pad.bottom - h * 0.68);
  ctx.clip();
  drawSeries(ctx, t.map((tv, i) => ({ x: xScale(tv), y: yScaleBot(Math.max(0, Math.min(100, u[i]))) })), "#2f9e44", false);
  ctx.restore();

  // ── Markeringar vid parameterändring (fortsatt körning på samma graf) ──
  const changeMarkers = sim.history.markers || [];
  if (changeMarkers.length) {
    ctx.save();
    ctx.font = "10px Segoe UI";
    ctx.textAlign = "left";
    changeMarkers.forEach(m => {
      if (m.t < tStart || m.t > tMax) return;
      const mx = xScale(m.t);
      ctx.strokeStyle = "rgba(90,90,90,0.55)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(mx, pad.top); ctx.lineTo(mx, h - pad.bottom); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#555";
      ctx.fillText(m.label, mx + 3, pad.top + 10);
    });
    ctx.restore();
  }

  // ── Mätläge: hjälplinjer och crosshair ──
  if (measureMode) {
    const pv0 = parseFloat(document.getElementById("mpPv0").value);
    const pvInf = parseFloat(document.getElementById("mpPvInf").value);
    const hasRange = !isNaN(pv0) && !isNaN(pvInf) && Math.abs(pvInf - pv0) > 0.01;

    // 63%-hjälplinje
    if (document.getElementById("mp63Line").checked && hasRange) {
      const y63 = pv0 + 0.632 * (pvInf - pv0);
      const y63px = yScaleTop(y63);
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = "#c8870a"; ctx.lineWidth = 1; ctx.setLineDash([8, 5]);
      ctx.beginPath(); ctx.moveTo(pad.left, y63px); ctx.lineTo(w - pad.right, y63px); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#c8870a"; ctx.font = "10px Segoe UI"; ctx.textAlign = "right";
      ctx.fillText("63% = " + y63.toFixed(2), w - pad.right - 3, y63px - 3);
      ctx.restore();
    }

    // 10%/90%-hjälplinjer (stigtid)
    if (document.getElementById("mpRiseTimeLines").checked && hasRange) {
      const y10 = pv0 + 0.10 * (pvInf - pv0);
      const y90 = pv0 + 0.90 * (pvInf - pv0);
      const y10px = yScaleTop(y10);
      const y90px = yScaleTop(y90);
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = "#2980b9"; ctx.lineWidth = 1; ctx.setLineDash([8, 5]);
      ctx.beginPath(); ctx.moveTo(pad.left, y10px); ctx.lineTo(w - pad.right, y10px); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.left, y90px); ctx.lineTo(w - pad.right, y90px); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#2980b9"; ctx.font = "10px Segoe UI"; ctx.textAlign = "right";
      ctx.fillText("10% = " + y10.toFixed(2), w - pad.right - 3, y10px - 3);
      ctx.fillText("90% = " + y90.toFixed(2), w - pad.right - 3, y90px - 3);
      ctx.restore();
    }

    // 2%-toleransband (insvängning) — band kring PV∞, inte en enkel linje
    if (document.getElementById("mpToleranceBand").checked && hasRange) {
      const tol = Math.abs(pvInf - pv0) * 0.02;
      const yUpper = yScaleTop(pvInf + tol);
      const yLower = yScaleTop(pvInf - tol);
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = "#27ae60"; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(pad.left, yUpper); ctx.lineTo(w - pad.right, yUpper); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.left, yLower); ctx.lineTo(w - pad.right, yLower); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#27ae60"; ctx.font = "10px Segoe UI"; ctx.textAlign = "right";
      ctx.fillText("±2% (" + pvInf.toFixed(2) + ")", w - pad.right - 3, yUpper - 3);
      ctx.restore();
    }

    // Tangentlinje (Ziegler-Nichols) — HOTFIX-v1.4.1: facit, avstängt i PROD oavsett
    // kryssrutans tillstånd (den kan i sin tur vara dold, se applyEnvironmentUI()).
    if (ENV_CONFIG.showMeasurementFacit && document.getElementById("mpTangent").checked && y.length > 5) {
      // Hitta senaste signifikanta u-steg och sök bara i data därifrån
      let stepIdx = 0;
      for (let i = 1; i < u.length; i++) {
        if (Math.abs(u[i] - u[i - 1]) > 1.0) stepIdx = i;
      }
      const yA = y.slice(stepIdx);
      const tA = t.slice(stepIdx);

      let iInfl = 0;
      let maxSl = -Infinity;
      for (let i = 0; i < yA.length - 1; i++) {
        const dt_loc = tA[i + 1] - tA[i];
        if (dt_loc <= 0) continue;
        const sl = (yA[i + 1] - yA[i]) / dt_loc;
        if (sl > maxSl) { maxSl = sl; iInfl = i; }
      }
      if (maxSl > 0.001) {
        // Enkapacitiv process: yA[iInfl] ≈ PV₀ (flat dödtid), nästa punkt är första responspunkten.
        // Använd den som ankare för att undvika -1 steg diskretiseringsfel.
        const atDeadEnd = hasRange
          && iInfl + 1 < yA.length
          && Math.abs(yA[iInfl] - pv0) < Math.max(0.5, Math.abs(pvInf - pv0) * 0.02);
        const tInfl = atDeadEnd ? tA[iInfl + 1] : tA[iInfl];
        const pvInfl = atDeadEnd ? pv0 : yA[iInfl];
        const pvLineAt = tv => pvInfl + maxSl * (tv - tInfl);

        ctx.save();
        ctx.globalAlpha = 0.6;
        if (hasRange) {
          const tL = tInfl - (pvInfl - pv0) / maxSl;
          const tLT = tInfl + (pvInf - pvInfl) / maxSl;
          const tLineStart = Math.max(0, tL);
          const tLineEnd = Math.min(tMax, tLT);

          ctx.strokeStyle = "#8e44ad"; ctx.lineWidth = 1; ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(xScale(tLineStart), yScaleTop(pvLineAt(tLineStart)));
          ctx.lineTo(xScale(tLineEnd), yScaleTop(pvLineAt(tLineEnd)));
          ctx.stroke(); ctx.setLineDash([]);

          const tStep = t[stepIdx] ?? 0;
          if (tL >= 0 && tL <= tMax) {
            const xL = xScale(tL), yL = yScaleTop(pv0);
            ctx.strokeStyle = "#8e44ad"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(xL, yL - 8); ctx.lineTo(xL, yL + 8); ctx.stroke();
            ctx.fillStyle = "#8e44ad"; ctx.font = "bold 10px Segoe UI"; ctx.textAlign = "center";
            ctx.fillText("L≈" + Math.round(tL - tStep), xL, yL + 20);
          }
          if (tLT >= 0 && tLT <= tMax) {
            const xLT = xScale(tLT), yLT = yScaleTop(pvInf);
            ctx.strokeStyle = "#8e44ad"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(xLT, yLT - 8); ctx.lineTo(xLT, yLT + 8); ctx.stroke();
            ctx.fillStyle = "#8e44ad"; ctx.font = "bold 10px Segoe UI"; ctx.textAlign = "center";
            ctx.fillText("T≈" + Math.round(tLT - tL), xLT, yLT - 12);
          }
        } else {
          const ext = tMax * 0.25;
          const tLineStart = Math.max(0, tInfl - ext);
          const tLineEnd = Math.min(tMax, tInfl + ext * 1.5);
          ctx.strokeStyle = "#8e44ad"; ctx.lineWidth = 1; ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(xScale(tLineStart), yScaleTop(pvLineAt(tLineStart)));
          ctx.lineTo(xScale(tLineEnd), yScaleTop(pvLineAt(tLineEnd)));
          ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.restore();
      }
    }

    // Crosshair
    if (hoverPos && t.length > 0) {
      const mx = hoverPos.x;
      if (mx >= pad.left && mx <= w - pad.right) {
        const tHover = tStart + (mx - pad.left) / (w - pad.left - pad.right) * (tMax - tStart);
        let iNear = 0;
        for (let i = 1; i < t.length; i++) {
          if (Math.abs(t[i] - tHover) < Math.abs(t[iNear] - tHover)) iNear = i;
        }
        const pvH = y[iNear] != null ? y[iNear] : 0;
        const uH = u[iNear] != null ? u[iNear] : 0;

        ctx.save();
        ctx.strokeStyle = "rgba(30,30,30,0.38)"; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(mx, pad.top); ctx.lineTo(mx, h * 0.62); ctx.stroke();
        if (hoverPos.y >= pad.top && hoverPos.y <= h * 0.62) {
          ctx.beginPath(); ctx.moveTo(pad.left, hoverPos.y); ctx.lineTo(w - pad.right, hoverPos.y); ctx.stroke();
        }
        ctx.setLineDash([]);

        const lines = ["t  = " + Math.round(tHover), "PV = " + pvH.toFixed(1), "u  = " + uH.toFixed(1)];
        ctx.font = "11px Consolas, monospace";
        const lH = 15, pX = 7, pY = 5;
        const ttW = Math.max(...lines.map(s => ctx.measureText(s).width)) + pX * 2;
        const ttH = lines.length * lH + pY * 2;
        const ttX = mx + 10 + ttW <= w - pad.right ? mx + 10 : mx - ttW - 8;
        const ttY = Math.max(pad.top + 4, Math.min(h * 0.62 - ttH - 4, hoverPos.y - ttH / 2));
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.strokeStyle = "#bbb"; ctx.lineWidth = 1;
        ctx.fillRect(ttX, ttY, ttW, ttH); ctx.strokeRect(ttX, ttY, ttW, ttH);
        ctx.fillStyle = "#2c3a44"; ctx.textAlign = "left";
        lines.forEach((s, i) => ctx.fillText(s, ttX + pX, ttY + pY + (i + 1) * lH - 2));
        ctx.restore();
      }
    }
  }
}
// Statusraden visar en decimal. Ren visningsformatering — rör aldrig det
// underliggande talet (historik, analysverktyg och scenariofiler är
// opåverkade). fmt1 undviker "-0.0" för värden som avrundar till noll.
function fmt1(v) {
  const s = v.toFixed(1);
  return s === "-0.0" ? "0.0" : s;
}
// FEAT-043 — visar knappen "Fler steg" bara när scenariots aktiva tak faktiskt
// är nått. Anropas efter varje händelse som kan ändra stepNo/maxSteps (steg,
// kör, rensa, återställ, scenario-/lärstigsbyte) — se respektive lyssnare.
function updateStepLimitUI() {
  btnExtendSteps.hidden = !sim || sim.stepNo < sim.maxSteps;
}
// FEAT-042 (PO-granskning, punkt 3/5) — enda källan för "vilken zon är
// aktiv just nu", delad av statusraden, zonmärket/fälthighlighten och
// zonbytesmarkeringarna i grafen. null = schemat är avstängt/saknas.
function activeZones() {
  if (!sim || !currentScenario) return { gainZone: null, processZone: null };
  const s = sim.getState();
  const gs = currentScenario.controller.gainSchedule;
  const gainZone = (gs && gs.enabled) ? scheduleZone(s.y, gs.breakpoint1, gs.breakpoint2) : null;
  const ng = currentScenario.process.nonlinearGain;
  const processZone = (ng && ng.enabled) ? scheduleZone(s.u, ng.breakpoint1, ng.breakpoint2) : null;
  return { gainZone, processZone };
}
const GS_ZONE_FIELD_GROUPS = [
  [fields.gsZ1Kp, fields.gsZ1Ti, fields.gsZ1Td],
  [fields.gsZ2Kp, fields.gsZ2Ti, fields.gsZ2Td],
  [fields.gsZ3Kp, fields.gsZ3Ti, fields.gsZ3Td],
];
const NG_ZONE_FIELD_GROUPS = [[fields.ngZ1K], [fields.ngZ2K], [fields.ngZ3K]];
// FEAT-042 (PO-granskning, punkt 3) — highlight på aktiv zons egna fält, så
// studenten ser VILKEN Kp/Ti/Td (eller K) som gäller just nu. En textbadge
// ("Aktiv: Zon N") fanns här tidigare men togs bort efter PO:s sista
// granskningsrunda — bedömdes inte tillföra pedagogiskt värde utöver
// fälthighlighten, statusradens zonavläsning och grafens markeringslinjer.
function updateZoneIndicators() {
  const { gainZone, processZone } = activeZones();
  GS_ZONE_FIELD_GROUPS.forEach((group, i) => {
    group.forEach(f => f.parentElement.classList.toggle("zone-active-regulator", gainZone === i));
  });
  NG_ZONE_FIELD_GROUPS.forEach((group, i) => {
    group.forEach(f => f.parentElement.classList.toggle("zone-active-process", processZone === i));
  });
}
// FEAT-042 (PO-granskning, punkt 5) — markeringslinje vid zonbyte, samma
// mekanism (sim.history.markers) som redan används för parameterändringar
// och pulser. lastGainZone/lastProcessZone håller den SENAST kända zonen så
// ett byte kan upptäckas mellan två på varandra följande steg — nollställs
// vid scenariobyte/rensning/återställning (se resetZoneChangeTracking()).
let lastGainZone = null;
let lastProcessZone = null;
function resetZoneChangeTracking() {
  const z = activeZones();
  lastGainZone = z.gainZone;
  lastProcessZone = z.processZone;
}
function markZoneChangeIfAny() {
  if (!sim) return;
  const { gainZone, processZone } = activeZones();
  const t = sim.history.t[sim.history.t.length - 1] ?? 0;
  if (!sim.history.markers) sim.history.markers = [];
  if (gainZone !== null && lastGainZone !== null && gainZone !== lastGainZone) {
    sim.history.markers.push({ t, label: "Zonbyte (Kp) → Zon " + (gainZone + 1) });
  }
  if (processZone !== null && lastProcessZone !== null && processZone !== lastProcessZone) {
    sim.history.markers.push({ t, label: "Zonbyte (K) → Zon " + (processZone + 1) });
  }
  lastGainZone = gainZone;
  lastProcessZone = processZone;
}
function updateStatus() {
  if (!sim) { statusEl.textContent = "Status: ej laddad"; updateZoneIndicators(); return; }
  const s = sim.getState();
  const pidInfo = (s.pTerm !== 0 || s.iTerm !== 0 || s.dTerm !== 0)
    ? " | P=" + fmt1(s.pTerm) + ", I=" + fmt1(s.iTerm) + ", D=" + fmt1(s.dTerm)
    : "";
  let warning = "";
  if (currentScenario) {
    const proc = currentScenario.process;
    const isSR = proc.type === "self_regulating" || proc.type === "self_regulating_2" || !proc.type;
    if (isSR) {
      const yPhysMax = proc.normalValue + proc.K * currentScenario.controller.outputLimits.max;
      if (currentScenario.runtime.setpoint > yPhysMax + 0.01)
        warning = "  ⚠ SP ouppnåeligt (max≈" + fmt1(yPhysMax) + ")";
    }
  }
  // SP hämtas från samma historikpost som PV/e (index sist i sim.history.sp)
  // istället för sim.scenario.runtime.setpoint direkt, så att SP-PV=e alltid
  // stämmer exakt även om SP-fältet ändrats sedan senaste körda steg.
  //
  // KÄNT FÖRHÅLLANDE (PED-003D, oförändrat i PED-003E): e beräknas i
  // PIDController.step() mot PV FÖRE processens uppdatering det steget,
  // men skrivs till historiken tillsammans med PV EFTER uppdateringen.
  // Under aktiva transienter kan alltså e ≠ SP-PV skilja sig något (störst
  // tidigt i förloppet, exakt noll vid sann steady-state) — se
  // docs/tracking/todo.md för fullständig analys. Avrundningen till en
  // decimal nedan är ren visningsformatering och varken döljer eller
  // korrigerar denna tidsskillnad; simuleringskärnans beräkning av e är
  // oförändrad.
  const spAtStep = sim.history.sp[sim.history.sp.length - 1] ?? sim.scenario.runtime.setpoint;
  // FEAT-042 — kompakt zonavläsning, bara synlig när respektive schema är
  // aktiverat. activeZones() är enda källan (se ovan) — statusraden,
  // badgen/fälthighlighten och grafens zonbytesmarkeringar visar alltid
  // samma zon.
  let scheduleInfo = "";
  const { gainZone, processZone } = activeZones();
  if (gainZone !== null) {
    scheduleInfo += "  | Zon " + (gainZone + 1) + " (Kp=" + fmt1(currentScenario.controller.gainSchedule.zones[gainZone].kp) + ")";
  }
  if (processZone !== null) {
    scheduleInfo += "  | K-zon " + (processZone + 1) + " (K=" + fmt1(currentScenario.process.nonlinearGain.zones[processZone]) + ")";
  }
  // FEAT-045 (användartest, punkt 5) — lastens aktuella nivå, som en
  // otvetydig siffra i statusraden istället för en graflinje (se drawChart()).
  // Bara synlig när lasten faktiskt är triggad (auxValue skiljer sig från 0).
  const auxInfo = sim.auxValue ? "  | Last: " + fmt1(sim.auxValue) + " (aktiv)" : "";
  statusEl.textContent = "Status: steg=" + s.step + ", t=" + fmt1(s.t) + ", SP=" + fmt1(spAtStep) + ", PV=" + fmt1(s.y) + ", e=" + fmt1(s.e) + ", u=" + fmt1(s.u) + pidInfo + warning + scheduleInfo + auxInfo;
  updateZoneIndicators();
}
function hydrateFields(s) {
  fields.k.value = s.process.K; fields.t.value = s.process.T; fields.l.value = s.process.L;
  fields.auxGain.value = s.process.auxGain ?? 0;
  fields.normalValue.value = s.process.normalValue ?? 0;
  fields.kp.value = s.controller.kp || 0; fields.ti.value = s.controller.ti || 0; fields.td.value = s.controller.td || 0;
  fields.kff.value = s.controller.kff ?? 0;
  fields.manualOutput.value = s.controller.manualOutput ?? 0;
  fields.sp.value = s.runtime.setpoint; fields.umin.value = s.controller.outputLimits.min; fields.umax.value = s.controller.outputLimits.max;
  fields.mode.value = s.controller.mode; fields.noise.value = s.disturbance.noiseStd || 0; fields.pulseMag.value = s.disturbance.pulse.magnitude || 0; fields.pulseDuration.value = s.disturbance.pulse.durationSteps || 3;
  fields.auxMag.value = s.auxSignal?.magnitude ?? 0;
  fields.hysteresLower.value = s.controller.hysteresis?.lower ?? 2;
  fields.hysteresUpper.value = s.controller.hysteresis?.upper ?? 2;
  fields.antiWindup.checked = s.controller.antiWindup !== false;
  fields.processType.value = s.process.type || "self_regulating";
  fields.outflow.value = s.process.outflow ?? 0;
  // FEAT-042 — Parameterstyrning: förifyll schemat med scenariots ordinarie
  // kp/ti/td (även om schemat inte finns/är avstängt) så att aktivering av
  // kryssrutan aldrig ger en oväntad, tom eller orimlig startpunkt.
  const gs = s.controller.gainSchedule;
  fields.gainScheduleEnabled.checked = !!(gs && gs.enabled);
  fields.gsBreak1.value = gs?.breakpoint1 ?? 33;
  fields.gsBreak2.value = gs?.breakpoint2 ?? 66;
  const gsZones = gs?.zones || [];
  const gsFallback = { kp: s.controller.kp || 0, ti: s.controller.ti || 0, td: s.controller.td || 0 };
  [fields.gsZ1Kp, fields.gsZ2Kp, fields.gsZ3Kp].forEach((f, i) => { f.value = gsZones[i]?.kp ?? gsFallback.kp; });
  [fields.gsZ1Ti, fields.gsZ2Ti, fields.gsZ3Ti].forEach((f, i) => { f.value = gsZones[i]?.ti ?? gsFallback.ti; });
  [fields.gsZ1Td, fields.gsZ2Td, fields.gsZ3Td].forEach((f, i) => { f.value = gsZones[i]?.td ?? gsFallback.td; });
  // FEAT-042 — Olinjär ventilkarakteristik: samma förifyllningsprincip, med
  // scenariots ordinarie K som gemensam startpunkt för alla tre zonerna.
  const ng = s.process.nonlinearGain;
  fields.nonlinearGainEnabled.checked = !!(ng && ng.enabled);
  fields.ngBreak1.value = ng?.breakpoint1 ?? 33;
  fields.ngBreak2.value = ng?.breakpoint2 ?? 66;
  const ngZones = ng?.zones || [];
  [fields.ngZ1K, fields.ngZ2K, fields.ngZ3K].forEach((f, i) => { f.value = ngZones[i] ?? s.process.K; });
}
// GAM-002: kontext för aktivitetsprototypens försöks-/konfigurationsspårning —
// lärstigssteg om en lärstig är aktiv, annars scenariot självt.
function activityContextKey() {
  if (currentPath && currentPathStep >= 0) return currentPathId + "#" + currentPathStep;
  return currentScenario ? currentScenario.id : null;
}
// UX-002 (PO:s granskningsobservation 2) — härleder vilken Tillämpning som
// matchar ett scenario, rent utifrån data som redan finns i scenariot (inget
// nytt scenariofält). Körs vid VARJE scenarioladdning (lärstig OCH manuellt
// val i scenario-listan, se loadScenarioByName()) — garanterar att
// Tillämpning + Processmodell + strategitillägg alltid är en sammanhängande
// kombination, aldrig kvarlämnad från ett tidigare, orelaterat scenario.
function deriveApplicationProfile(scenario) {
  // UX-004 Justering 3 (PO-beslut 2026-09-21) — Last (auxSignal) är numera en
  // generell processpåverkan, inte längre exklusiv för Framkoppling (se
  // updateKffVisibility()): ett auxSignal ENSAMT bevisar inte längre att ett
  // scenario "handlar om" Framkoppling (Last-fälten är synliga oavsett
  // Tillämpning nu). Ändå behålls auxSignal HÄR som signal, tillsammans med
  // Kff — inte för att Last kräver Temperaturprocess, utan för att
  // framkoppling.v1s FÖRSTA steg (framkoppling-demo-pid.json) medvetet har
  // kff=0 ("PID ensam", innan Kff introduceras i steg 2/3) men ÄNDÅ ska
  // härledas till SAMMA Tillämpning som lärstigens övriga två steg — annars
  // hoppar Tillämpning-väljaren mitt i en sammanhållen 3-stegs progression.
  // Verifierat: idag är auxSignal ENDAST satt av framkoppling.v1s fyra
  // scenarier, så detta bredare villkor är riskfritt mot allt annat innehåll.
  if (scenario.auxSignal || scenario.controller.kff) return "temperatur"; // Framkoppling (FEAT-045) — bara byggt för Temperaturprocess hittills
  if (scenario.controller.gainSchedule?.enabled || scenario.process.nonlinearGain?.enabled) return "temperatur"; // Parameterstyrning/Ventilkarakteristik (FEAT-042) — samma
  if (scenario.process.type === "integrating") return "niva";
  // UX-002_SYNLIGHETSGRANSKNING.md avsnitt 1 — on/off har ingen egen
  // tillämpning längre (fel axel, se APPLICATION_PROFILES-kommentaren);
  // ett generiskt on/off-scenario (t.ex. onoff-basic.json, ingen substans-
  // berättelse) härleds därför till Avancerat precis som appens andra
  // generiska scenarier.
  return "avancerat";
}
function loadScenarioByName(name) {
  if (measureMode) exitMeasureMode();
  zoomView = null; pvZoomView = null;
  currentScenario = deepClone(SCENARIOS[name]);
  currentScenarioRef = name;
  sim = new Simulation(currentScenario, 42);
  sim.history.markers = [];
  hydrateFields(currentScenario);
  fields.applicationProfile.value = deriveApplicationProfile(currentScenario);
  // PO-beslut 2026-09-22 — kom-igång.v1 ska konsekvent starta i
  // Temperaturprocess, inte i det härledda "Avancerat" (dess generiska
  // scenarier saknar särskiljande signaler, se deriveApplicationProfile()),
  // eftersom Avancerat annars tvingar alla Avancerat-sektioner öppna för en
  // helt ny användares FÖRSTA lärstig — direkt emot UX-004:s mål om
  // progressiv exponering. Samma infrastruktur och samma stalenessvakt
  // (currentPath && currentPathStep >= 0) som visibilityOverride — se dess
  // kommentar för varför vakten behövs (annars läcker en lärstigs override
  // till ett senare, manuellt valt scenario).
  if (currentPath && currentPathStep >= 0 && currentPath.forceApplicationProfile) {
    fields.applicationProfile.value = currentPath.forceApplicationProfile;
  }
  applyApplicationProfile(); // filtrerar Processmodell-alternativen/tilläggen åt den härledda (eller lärstigs-tvingade) Tillämpningen, och synkar om processType-beroende fält
  captureMarkerBaseline();
  appendLog("Laddat scenario: " + currentScenario.id);
  updateControllerUIState();
  // UX-004 — updateControllerUIState() ovan anropar internt
  // updateKffVisibility(), som härleder Kff-synlighet ENBART från Tillämpning
  // + Läge och därför skriver över (upptäckt vid webbläsarverifiering, se
  // UX-004 Implementering) en aktiv lärstigs visibilityOverride satt av det
  // TIDIGARE anropet till applyApplicationProfile() ovan. Måste därför
  // upprepas HÄR, som allra sista steget, precis som i
  // applyApplicationProfile() självt.
  applyPathVisibilityOverride();
  updateStatus(); updateStepLimitUI(); drawChart();
  activityDispatch("scenario_loaded", { scenarioId: currentScenario.id, contextKey: activityContextKey() });
}

// ── Markeringar i grafen vid parameterändring ──
// Låter en mätserie fortsätta på SAMMA graf över flera regulator-/processinställningar
// (t.ex. P → PI → PID) utan att jämförelsen kräver Rensa graf/Återställ mellan varje
// steg — bara start av en NY mätserie (se resetMarkers()) nollställer markeringarna.
function markerSnapshot(scenario) {
  return {
    mode: scenario.controller.mode,
    kp: scenario.controller.kp, ti: scenario.controller.ti, td: scenario.controller.td,
    sp: scenario.runtime.setpoint, noise: scenario.disturbance.noiseStd,
    k: scenario.process.K, t: scenario.process.T, l: scenario.process.L, processType: scenario.process.type,
    // FEAT-045 — samma jämförbarhetsprincip som gainSchedule/nonlinearGain nedan.
    kff: scenario.controller.kff, auxGain: scenario.process.auxGain,
    // FEAT-042 — hela schemat som en jämförbar sträng räcker (bara ändring/
    // ingen ändring behöver detekteras, inte VAD som ändrades i detalj).
    gainSchedule: JSON.stringify(scenario.controller.gainSchedule || null),
    nonlinearGain: JSON.stringify(scenario.process.nonlinearGain || null),
  };
}
function modeLabel(modeValue) {
  const opt = Array.from(fields.mode.options).find(o => o.value === modeValue);
  return opt ? opt.textContent : modeValue;
}
function describeMarkerChange(a, b) {
  if (a.mode !== b.mode) return "→ " + modeLabel(b.mode);
  if (a.noise !== b.noise) return "Brus " + a.noise + "→" + b.noise;
  if (a.sp !== b.sp) return "SP " + a.sp + "→" + b.sp;
  if (a.kp !== b.kp || a.ti !== b.ti || a.td !== b.td) return "Kp/Ti/Td ändrat";
  if (a.k !== b.k || a.t !== b.t || a.l !== b.l || a.processType !== b.processType) return "Process ändrad";
  if (a.gainSchedule !== b.gainSchedule) return "Parameterstyrning ändrad";
  if (a.nonlinearGain !== b.nonlinearGain) return "Ventilkarakteristik ändrad";
  if (a.kff !== b.kff || a.auxGain !== b.auxGain) return "Framkoppling ändrad";
  return null;
}
function captureMarkerBaseline() {
  lastMarkerSnapshot = currentScenario ? markerSnapshot(currentScenario) : null;
  // FEAT-042 (PO-granskning, punkt 5) — samma tre anropsställen (scenario-
  // byte, Rensa graf, Återställ system) ska nollställa zonbytesspårningen
  // som redan nollställer den vanliga markeringsbaslinjen ovan.
  resetZoneChangeTracking();
}
function resetMarkers() {
  if (sim) sim.history.markers = [];
  captureMarkerBaseline();
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
  // FEAT-045 — processens egen lastförstärkning. Alltid synkad (som outflow
  // ovan), oberoende av om scenariot triggar en last eller ej — utan ett
  // triggat auxSignal-värde (0) har den ingen effekt (se ProcessModel.step()).
  currentScenario.process.auxGain = Number(fields.auxGain.value);
  const noTi = nextMode === "p" || nextMode === "manual" || nextMode === "onoff";
  const noTd = nextMode === "p" || nextMode === "pi" || nextMode === "manual" || nextMode === "onoff";
  currentScenario.controller.kp = readClamped(fields.kp, 0.1);
  currentScenario.controller.ti = noTi ? 0 : readClamped(fields.ti, 0);
  currentScenario.controller.td = noTd ? 0 : readClamped(fields.td, 0);
  // FEAT-045 — framkopplingsförstärkning. Medvetet OKLIPPT (till skillnad
  // från kp ovan) — Kff kan vara negativt, se STRAT-005 avsnitt 6/help.json.
  currentScenario.controller.kff = Number(fields.kff.value);
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
  // FEAT-045 — auxSignal (mätbar last) skapas bara i scenariot om fältet
  // faktiskt används (redan satt av scenariofilen, eller ett nollskilt värde
  // manuellt inskrivet) — INTE defensivt för alla scenarier, till skillnad
  // från auxGain/kff ovan. Annars skulle grafens lastlinje (drawChart, se
  // STRAT-005 avsnitt 4) börja ritas som en flat 0-linje på alla ~40
  // befintliga scenarier så fort ETT UI-fält synkas, inte bara de scenarier
  // som faktiskt demonstrerar framkoppling.
  const auxMagVal = Number(fields.auxMag.value);
  if (currentScenario.auxSignal || auxMagVal !== 0) {
    if (!currentScenario.auxSignal) currentScenario.auxSignal = {};
    currentScenario.auxSignal.magnitude = auxMagVal;
  }
  if (!currentScenario.controller.hysteresis) currentScenario.controller.hysteresis = {};
  currentScenario.controller.hysteresis.lower = readClamped(fields.hysteresLower, 0);
  currentScenario.controller.hysteresis.upper = readClamped(fields.hysteresUpper, 0);
  currentScenario.controller.antiWindup = fields.antiWindup.checked;

  // FEAT-042 — Parameterstyrning: regulatorns kp/ti/td-schema, keyed på PV.
  // Brytpunkter tvingas i stigande ordning (samma mönster som umin/umax ovan).
  {
    const b1 = clamp(Number(fields.gsBreak1.value), 0, 100);
    const b2 = clamp(Number(fields.gsBreak2.value), 0, 100);
    const gsBreak1 = Math.min(b1, b2), gsBreak2 = Math.max(b1, b2);
    fields.gsBreak1.value = gsBreak1; fields.gsBreak2.value = gsBreak2;
    currentScenario.controller.gainSchedule = {
      enabled: fields.gainScheduleEnabled.checked,
      breakpoint1: gsBreak1, breakpoint2: gsBreak2,
      zones: [
        { kp: readClamped(fields.gsZ1Kp, 0.1), ti: readClamped(fields.gsZ1Ti, 0), td: readClamped(fields.gsZ1Td, 0) },
        { kp: readClamped(fields.gsZ2Kp, 0.1), ti: readClamped(fields.gsZ2Ti, 0), td: readClamped(fields.gsZ2Td, 0) },
        { kp: readClamped(fields.gsZ3Kp, 0.1), ti: readClamped(fields.gsZ3Ti, 0), td: readClamped(fields.gsZ3Td, 0) },
      ],
    };
  }
  // FEAT-042 — Olinjär ventilkarakteristik: processens K-schema, keyed på u.
  // Bara meningsfullt för self_regulating — se sim-core.js: ProcessModel.effectiveK().
  {
    const b1 = clamp(Number(fields.ngBreak1.value), 0, 100);
    const b2 = clamp(Number(fields.ngBreak2.value), 0, 100);
    const ngBreak1 = Math.min(b1, b2), ngBreak2 = Math.max(b1, b2);
    fields.ngBreak1.value = ngBreak1; fields.ngBreak2.value = ngBreak2;
    currentScenario.process.nonlinearGain = {
      enabled: fields.nonlinearGainEnabled.checked,
      breakpoint1: ngBreak1, breakpoint2: ngBreak2,
      zones: [readClamped(fields.ngZ1K, 0.001), readClamped(fields.ngZ2K, 0.001), readClamped(fields.ngZ3K, 0.001)],
    };
  }

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
  }

  sim.scenario = currentScenario;
  sim.process.cfg = currentScenario.process;
  const delayLen = currentScenario.process.L > 0 ? Math.max(1, Math.ceil(currentScenario.process.L / sim.dt)) : 0;
  if (sim.process.delay.length !== delayLen) {
    const fillValue = sim.process.delay.length ? sim.process.delay[sim.process.delay.length - 1] : (prevState ? prevState.u : 0);
    sim.process.delay = delayLen > 0 ? new Array(delayLen).fill(fillValue) : [];
  }
  const needsStages = currentScenario.process.type === "self_regulating_2";
  if (needsStages && sim.process.stages.length < 2) {
    sim.process.stages = [sim.process.y, sim.process.y];
  } else if (!needsStages && sim.process.stages.length > 0) {
    sim.process.stages = [];
  }
  sim.pid.kp = currentScenario.controller.kp || 0;
  sim.pid.ti = currentScenario.controller.ti || 0;
  sim.pid.td = currentScenario.controller.td || 0;
  if (sim.pid.biasFadeSteps === 0) sim.pid.bias = currentScenario.controller.bias || 0;
  sim.pid.mode = nextMode;
  sim.onoff.low = currentScenario.controller.hysteresis?.lower ?? sim.onoff.low;
  sim.onoff.high = currentScenario.controller.hysteresis?.upper ?? sim.onoff.high;

  const nextSnap = markerSnapshot(currentScenario);
  if (lastMarkerSnapshot) {
    const label = describeMarkerChange(lastMarkerSnapshot, nextSnap);
    if (label) {
      if (!sim.history.markers) sim.history.markers = [];
      sim.history.markers.push({ t: sim.history.t[sim.history.t.length - 1] ?? 0, label });
    }
  }
  lastMarkerSnapshot = nextSnap;
}

function updateControllerUIState() {
  const mode = fields.mode.value;
  const isP = mode === "p";
  const isPI = mode === "pi";
  const isManual = mode === "manual";
  const isOnOff = mode === "onoff";

  // UX-004 Justering 4 — synka de SYNLIGA Läge-kontrollerna (Regulatortyp +
  // Auto/Manuell-togglen) med #mode (dold, den interna sanningskällan),
  // oavsett VILKEN väg mode.value ändrades (scenarioladdning, lärstig,
  // Tillämpningsbyte, eller de nya kontrollerna själva). Vid mode==="manual"
  // lämnas regulatorType.value orört — det ÄR minnet av "senaste automatiska
  // typ", ingen egen variabel behövs (samma typ återställs vid nästa
  // Auto-växling).
  if (!isManual) fields.regulatorType.value = mode;
  fields.autoManualToggle.checked = isManual;

  // Enable/disable fields based on mode
  fields.kp.disabled = isManual || isOnOff;
  fields.kp.parentElement.style.display = (isManual || isOnOff) ? "none" : "";
  fields.ti.disabled = isP || isManual || isOnOff;
  fields.td.disabled = isP || isPI || isManual || isOnOff;
  fields.manualOutput.disabled = !isManual;
  
  // Hide/show field groups
  const noIntegral = isP || isManual || isOnOff;
  fields.ti.parentElement.style.display = (isP || isManual || isOnOff) ? "none" : "";
  fields.td.parentElement.style.display = (isP || isPI || isManual || isOnOff) ? "none" : "";
  fields.manualOutput.parentElement.style.display = isManual ? "" : "none";
  fields.antiWindup.parentElement.style.display = noIntegral ? "none" : "";
  // PO:s granskning (2026-09-20) — Bumpless styr bara mjuk övergång VID
  // BYTE till p/pi/pid/manuell (se syncParamsFromUI()/mode-lyssnaren) — den
  // har INGEN effekt för OnOff (ingen bias/Kp att fasa in), så kryssrutan är
  // missvisande att visa (och lämna ikryssad) i det läget.
  document.getElementById("bumpless").parentElement.style.display = isOnOff ? "none" : "";
  fields.hysteresLower.parentElement.style.display = isOnOff ? "" : "none";
  fields.hysteresUpper.parentElement.style.display = isOnOff ? "" : "none";
  fields.showPB.parentElement.style.display = (isOnOff || isManual) ? "none" : "";
  // FEAT-042 — Parameterstyrning gäller bara p/pi/pid (samma villkor som kp
  // självt), av samma anledning som antiWindup ovan.
  document.getElementById("gainScheduleField").style.display = noIntegral ? "none" : "";
  if (noIntegral) fields.gainScheduleEnabled.checked = false;
  updateGainScheduleUIState();
  // UX-002_SYNLIGHETSGRANSKNING.md avsnitt 2.1 — Kff kräver P/PI/PID (se
  // updateKffVisibility()); räknas om här så ett rent lägesbyte (utan
  // tillämpningsbyte) också döljer/visar rätt.
  updateKffVisibility();

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
// FEAT-042 — Parameterstyrning: visa/dölj de 11 schemafälten som grupp.
function updateGainScheduleUIState() {
  document.getElementById("gainScheduleFields").hidden = !fields.gainScheduleEnabled.checked;
  // FEAT-042 (PO-granskning, punkt 3) — håller badge/fälthighlight i synk
  // även när kryssrutan ändras indirekt (t.ex. tvingas av vid lägesbyte),
  // inte bara via det egna change-lyssnaren.
  updateZoneIndicators();
}
function updateProcessUIState() {
  const isIntegrating = fields.processType.value === "integrating";
  document.getElementById("kLabel").textContent = isIntegrating ? "Kv" : "K";
  document.getElementById("kHelpBtn").dataset.help = isIntegrating ? "kv" : "k";
  fields.k.step = isIntegrating ? "0.001" : "0.1";
  // min måste vara ett jämnt multipel av step, annars räknar webbläsaren giltiga
  // stegvärden med min som bas (t.ex. 1.401 istället för 1.4) — se bugg 2026-016.
  fields.k.min = isIntegrating ? "0.001" : "0.1";
  fields.t.parentElement.style.display = isIntegrating ? "none" : "";
  fields.normalValue.parentElement.style.display = isIntegrating ? "none" : "";
  fields.outflow.parentElement.style.display = isIntegrating ? "" : "none";
  // FEAT-042 — Olinjär ventilkarakteristik gäller bara self_regulating (se
  // STRAT-003 avsnitt 6 — integrating/konisk tank är en öppen uppföljning,
  // inte del av detta uppdrag). Döljs och stängs av för övriga processtyper.
  const isSelfRegulating = fields.processType.value === "self_regulating";
  document.getElementById("nonlinearGainField").style.display = isSelfRegulating ? "" : "none";
  if (!isSelfRegulating) fields.nonlinearGainEnabled.checked = false;
  updateNonlinearGainUIState();
}
// FEAT-042 — Olinjär ventilkarakteristik: visa/dölj de 5 schemafälten som grupp.
function updateNonlinearGainUIState() {
  document.getElementById("nonlinearGainFields").hidden = !fields.nonlinearGainEnabled.checked;
  // FEAT-042 (PO-granskning, punkt 3) — se motsvarande kommentar i
  // updateGainScheduleUIState().
  updateZoneIndicators();
}

// UX-002 (UX-001 Fas 0) — Tillämpning: filtrerar vilka processmodeller som
// erbjuds i Processmodell-väljaren (fields.processType) och vilka
// strategitillägg (Framkoppling/Parameterstyrning/Ventilkarakteristik, se
// data-addon-attribut i index.html) som visas. Döljer ALDRIG själva
// Processmodell-väljaren eller dess begrepp — bara vilka ALTERNATIV som
// erbjuds (PO:s uttryckliga pedagogiska krav, UX-001 avsnitt 1). UX-004
// Justering 1 (PO-beslut 2026-09-21) — "Fri utforskning" heter numera
// "Avancerat": kortare, mer etablerat begrepp, samma roll som tidigare
// (expertläge, dagens fulla UI, helt ofiltrerad) men namnet gör även
// kopplingen till UX-004s Avancerat-disklosyr tydlig — att välja denna
// Tillämpning öppnar automatiskt ALLA Avancerat-sektioner också (se
// deriveAdvancedOpen()). Senast MANUELLT valda Tillämpning sparas i
// localStorage (APPLICATION_PROFILE_STORAGE_KEY, PO-uppdrag "UX-004
// Implementering" 2026-09-22 — lärare/studerande återkommer ofta till samma
// scenario över flera sessioner) och återställs vid nästa sidladdning INNAN
// startscenariot annars skulle härlett "Avancerat" (se initUI()). Sparas
// bara vid ett manuellt val (#applicationProfile-lyssnaren), INTE vid varje
// scenario-/lärstigsstyrd omhärledning (deriveApplicationProfile() körs vid
// varje scenarioladdning) — annars skulle nästa uppstart återspegla vilken
// lärstig som råkade laddas sist, inte användarens egna, avsiktliga val.
// UX-002_SYNLIGHETSGRANSKNING.md avsnitt 1 (PO-godkänd 2026-09-20) —
// "Tvålägesreglering (On/Off)" fanns tidigare som en egen tillämpning, men
// on/off är en REGULATORSTRATEGI (samma axel som Läge), inte en
// processkontext (samma axel som Temperaturprocess/Nivåprocess) — fel axel,
// och dess uteslutning av Integrerande saknade reglerteknisk grund (on/off
// fungerar lika bra på en integrerande process). OnOff är nu istället ett
// giltigt Läge-val INOM varje tillämpning.
const APPLICATION_PROFILES = {
  avancerat:  { processModels: ["self_regulating", "self_regulating_2", "integrating"], modes: ["onoff", "p", "pi", "pid", "manual"], addons: ["framkoppling", "parameterstyrning", "ventilkarakteristik"] },
  temperatur: { processModels: ["self_regulating", "self_regulating_2"], modes: ["onoff", "p", "pi", "pid", "manual"], addons: ["framkoppling", "parameterstyrning", "ventilkarakteristik"] },
  niva:       { processModels: ["integrating"], modes: ["onoff", "p", "pi", "pid", "manual"], addons: [] },
};
const APPLICATION_PROFILE_STORAGE_KEY = "pidSimApplicationProfile"; // UX-004 — se kommentaren ovanför APPLICATION_PROFILES
// Filtrerar ett <select>s <option>-ALTERNATIV till de tillåtna värdena —
// väljaren själv döljs aldrig (samma princip för Processmodell som för
// Läge). Returnerar true om nuvarande värde behövde bytas (inte längre
// tillåtet), så anroparen kan trigga rätt uppföljande UI-uppdatering.
function filterSelectOptions(selectEl, allowedValues) {
  let currentValueAllowed = false;
  Array.from(selectEl.options).forEach(opt => {
    const allowed = allowedValues.includes(opt.value);
    opt.hidden = !allowed;
    if (opt.value === selectEl.value && allowed) currentValueAllowed = true;
  });
  if (!currentValueAllowed) selectEl.value = allowedValues[0];
  return !currentValueAllowed;
}
// UX-004 Justering 3 (PO-beslut 2026-09-21) — Lastförstärkning/Last mag/
// Trigga last är INTE längre exklusiva för Framkoppling: Last är en generell
// processpåverkan (laststeg är lika användbart för ren regulatorprovning som
// ett SP-steg, oavsett om Kff används) och har dessutom aldrig varit
// lägesberoende i sim-core.js — auxGain×auxValue påverkar processen i
// ProcessModel.step() OAVSETT regulatorläge, till skillnad från Kff (som
// bara läses i PIDControllers p/pi/pid-gren). De tre fälten är alltså inte
// längre `[data-addon="framkoppling"]` i index.html — bara alltid synliga,
// som Puls/Brus.
//
// Kff är däremot kvar addon+läges-gated (UX-002_SYNLIGHETSGRANSKNING.md
// avsnitt 2.1, fortsatt giltig ENDAST för Kff): den kräver BÅDE att
// Tillämpningen tillåter Framkoppling OCH att Läget faktiskt använder Kff
// (P/PI/PID — sim-core.js applicerar feedforward bara i den grenen). Egen
// funktion (inte bara den generiska [data-addon]-loopen) eftersom det är
// den enda kvarvarande kontrollen som behöver två villkor samtidigt.
// Anropas både härifrån OCH från updateControllerUIState(), så ett rent
// lägesbyte (utan tillämpningsbyte) också räknas om.
function updateKffVisibility() {
  const profile = APPLICATION_PROFILES[fields.applicationProfile.value] || APPLICATION_PROFILES.avancerat;
  const mode = fields.mode.value;
  const isPidFamily = mode === "p" || mode === "pi" || mode === "pid";
  const visible = profile.addons.includes("framkoppling") && isPidFamily;
  document.querySelectorAll('[data-addon="framkoppling"]').forEach(el => {
    el.classList.toggle("addon-hidden", !visible);
  });
}
function applyApplicationProfile() {
  const profile = APPLICATION_PROFILES[fields.applicationProfile.value] || APPLICATION_PROFILES.avancerat;
  filterSelectOptions(fields.processType, profile.processModels);
  filterSelectOptions(fields.mode, profile.modes);
  // UX-004 Justering 4 — regulatorType (synlig) filtreras med samma
  // regellista MINUS "manual" (som inte är ett eget alternativ där längre,
  // se Auto/Manuell-togglen). Filtrerar bara vilka ALTERNATIV som visas i
  // rullgardinen — dess VÄRDE synkas alltid auktoritativt från #mode av
  // updateControllerUIState() längre ner i denna funktion, oavsett vad en
  // eventuell fallback här sätter (samma "en sanningskälla"-princip som
  // resten av Tillämpnings-mekaniken).
  filterSelectOptions(fields.regulatorType, profile.modes.filter(m => m !== "manual"));
  // Visa/dölj Parameterstyrning/Ventilkarakteristik. CSS-klassen (inte
  // style.display direkt) så att den alltid vinner över lägesbaserad
  // style.display på samma element (t.ex. updateProcessUIState()s
  // nonlinearGainField-hantering) — se [data-addon].addon-hidden i
  // index.html. Kff (enda kvarvarande Framkopplings-addon-fältet) hanteras
  // separat, se updateKffVisibility() ovan (kräver även rätt Läge).
  document.querySelectorAll("[data-addon]").forEach(el => {
    if (el.dataset.addon === "framkoppling") return;
    el.classList.toggle("addon-hidden", !profile.addons.includes(el.dataset.addon));
  });
  updateKffVisibility();
  // PO:s granskning (2026-09-20) — att bara DÖLJA ett tillägg räcker inte:
  // dess effekt fortsatte gälla i simuleringen trots att kryssrutan/fältet
  // blivit osynligt och oåtkomligt. Samma princip som redan fanns för
  // lägesstyrd döljning (se updateControllerUIState()s
  // "if (noIntegral) fields.gainScheduleEnabled.checked = false;") —
  // tillämpad här också. Ingen omedelbar syncParamsFromUI()/omritning här
  // (skulle kunna skapa en missvisande ändringsmarkering om detta körs
  // precis efter en scenarioladdning, INNAN captureMarkerBaseline() hunnit
  // sätta en ny baslinje) — nästa Stega/Kör-klick synkar bort det ändå,
  // precis som lägesbyten redan gör. Vid ett MANUELLT tillämpningsbyte
  // (den enda situationen där kvarvarande tillstånd annars märks) synkas
  // och ritas om direkt i #applicationProfile-lyssnaren istället.
  //
  // UX-004 Justering 3 — Last (auxMag/sim.auxValue) och Lastförstärkning
  // (auxGain) nollställs INTE längre här: de är inte längre en del av
  // Framkopplings-tillägget (se updateKffVisibility()-kommentaren ovan),
  // utan en generell processpåverkan som ska bestå oavsett vald Tillämpning
  // — precis som Puls/Brus aldrig nollställs av ett tillämpningsbyte.
  // Bara Kff (regulatorns eget, addon-specifika bidrag) nollställs.
  if (!profile.addons.includes("parameterstyrning")) fields.gainScheduleEnabled.checked = false;
  if (!profile.addons.includes("ventilkarakteristik")) fields.nonlinearGainEnabled.checked = false;
  if (!profile.addons.includes("framkoppling")) fields.kff.value = 0;
  updateGainScheduleUIState();
  updateControllerUIState(); // synkar Läge-beroende fält (inkl. Bumpless och Kff) om Läge tvingades om
  updateProcessUIState();
  applyAdvancedState(); // UX-004 — härled Avancerat-status åt båda grupperna från (nya) currentScenario + Tillämpning
  applyPathVisibilityOverride(); // UX-004 — lärstigsstyrd synlighet, sista och mest specifika lagret (se funktionens kommentar)
}

// UX-004 (PO-beslut 2026-09-21, docs/reports/UX-004_OMSTRUKTURERING-HUVUDYTA.md
// avsnitt 4) — "Avancerat"-sektionens öppen/stängd-status härleds
// AUTOMATISKT, samma princip som Tillämpning själv: ingen ny lärstigstaggning
// krävs i normalfallet, bara i undantag (se forceAdvancedOpen nedan).
//
// Regel: en grupp öppnas om (a) vald Tillämpning är "avancerat" (Justering 1
// — expertläge, allt synligt och redan uppackat), ELLER (b) scenariot har ett
// AKTIVT värde i något av gruppens Avancerat-fält (samma signal som redan
// avgör Tillämpning, se deriveApplicationProfile()), ELLER (c) scenariot
// explicit ber om det via `forceAdvancedOpen` — ett litet, valfritt
// undantagsfält FÖR DE FÅTAL lärstigar (idag: windup-antiwindup.v1) vars
// ämne är en fält-EXISTENS (Anti-windup/Bumpless) snarare än ett avvikande
// värde, och som därför aldrig skulle triggas av (b) — Anti-windup/Bumpless
// är `true` i nästan alla scenarier (default, inte ett ämnessignal).
function deriveAdvancedOpen(scenario, group) {
  if (fields.applicationProfile.value === "avancerat") return true;
  if (scenario?.forceAdvancedOpen?.includes(group)) return true;
  if (!scenario) return false;
  if (group === "process") {
    // UX-004 Implementering, punkt 4 (PO-test 2026-09-22) — Lastförstärkning
    // (auxGain) flyttades ut till Processpåverkans grundnivå (alltid synlig
    // där nu, precis som Last mag/Trigga last) och ligger inte längre i
    // advancedFieldsProcess. Den enda kvarvarande, faktiskt dolda funktionen
    // i Processinställningens Avancerat-sektion är Olinjär ventilkarakteristik
    // — auxGain ska alltså inte längre tvinga sektionen öppen (ett scenario
    // med bara ett Lastförstärknings-värde men UTAN ventilkarakteristik har
    // inget skäl att visa den tomma sektionen uppackad).
    return !!(scenario.process.nonlinearGain?.enabled);
  }
  if (group === "regulator") {
    return !!(scenario.controller.gainSchedule?.enabled) || !!(scenario.controller.kff);
  }
  return false;
}
function setAdvancedOpen(group, open) {
  const cap = group === "process" ? "Process" : "Regulator";
  document.getElementById("advancedFields" + cap).hidden = !open;
  document.getElementById("advancedToggle" + cap).classList.toggle("open", open);
}
function applyAdvancedState() {
  ["process", "regulator"].forEach(group => setAdvancedOpen(group, deriveAdvancedOpen(currentScenario, group)));
}
// UX-004 (PO-uppdrag "UX-004 Implementering", 2026-09-22) — infrastruktur för
// lärstigsstyrd synlighet: en lärstig kan deklarera ett eget, valfritt
// toppnivåfält `visibilityOverride: { show: [...], hide: [...] }` (samma
// addon-vokabulär som data-addon/APPLICATION_PROFILES.addons — idag
// "framkoppling"/"parameterstyrning"/"ventilkarakteristik") för att fokusera
// UI:t på exakt de funktioner lärstigen handlar om, t.ex. döljer en
// parameterstyrningslärstig Kff/Framkoppling även om vald Tillämpning
// (härledd av deriveApplicationProfile()) annars skulle tillåtit det, eller
// tvärtom för en framkopplingslärstig. Körs sist i applyApplicationProfile()
// — mest specifika lagret av de tre (Tillämpning → Avancerat → lärstig),
// så en lärstigs egen deklaration alltid vinner. Gated på
// `currentPathStep >= 0` (samma villkor som activityContextKey()) så att en
// override inte "läcker kvar" efter att lärstigen avslutats och användaren
// manuellt laddar ett orelaterat scenario (currentPath nollställs annars
// aldrig, bara currentPathStep). Inget krav att sätta detta fält — helt
// bakåtkompatibelt, tomt/odefinierat = ingen effekt (dagens 12 lärstigar
// fortsätter fungera oförändrat om de inte sätter det).
const ADDON_TO_ADVANCED_GROUP = { framkoppling: "regulator", parameterstyrning: "regulator", ventilkarakteristik: "process" };
function applyPathVisibilityOverride() {
  if (!currentPath || currentPathStep < 0) return;
  // UX-004 Implementering, punkt 2 (PO-test 2026-09-22) — Tillämpning
  // "Avancerat" ska vara en KOMPLETT sandlåda (allt synligt, inget filter),
  // även mitt i en aktiv lärstig med en egen visibilityOverride. Utan denna
  // spärr skulle t.ex. framkoppling.v1s "dölj Parameterstyrning" fortsätta
  // gälla efter att användaren manuellt bytt till Avancerat — precis
  // motsatsen till vad Justering 1 (2026-09-21) redan etablerat för
  // Avancerat-disklosyren (deriveAdvancedOpen() tvingar den öppen), nu
  // konsekvent genomfört även för lärstigens EGEN, mer specifika override.
  if (fields.applicationProfile.value === "avancerat") return;
  const override = currentPath.visibilityOverride;
  if (!override) return;
  (override.hide || []).forEach(addon => {
    document.querySelectorAll('[data-addon="' + addon + '"]').forEach(el => el.classList.add("addon-hidden"));
  });
  (override.show || []).forEach(addon => {
    document.querySelectorAll('[data-addon="' + addon + '"]').forEach(el => el.classList.remove("addon-hidden"));
    const group = ADDON_TO_ADVANCED_GROUP[addon];
    if (group) setAdvancedOpen(group, true);
  });
}
// Manuellt klick — fristående sessionstillstånd, precis som ett manuellt
// Tillämpningsbyte: gäller tills nästa scenarioladdning/Tillämpningsbyte
// härleder om det (ingen localStorage-persistens, till skillnad från
// toggleParamGroup()s hela grupper).
function toggleAdvanced(group) {
  const cap = group === "process" ? "Process" : "Regulator";
  const fieldsEl = document.getElementById("advancedFields" + cap);
  setAdvancedOpen(group, fieldsEl.hidden);
}

function updateScoreDisplay() {
  const el = document.getElementById("scoreDisplay");
  const txt = document.getElementById("scoreText");
  if (!el || !txt) return;
  if (!ENV_CONFIG.showScore) { el.style.display = "none"; return; }
  if (testMode && currentPath) { el.style.display = ""; txt.textContent = pathScore.correct + "/" + pathScore.total; }
  else { el.style.display = "none"; }
}
function updateNavButtons() {
  const prev = document.getElementById("prevStep");
  const next = document.getElementById("nextStep");
  prev.style.display = testMode ? "none" : "";
  prev.disabled = !currentPath || currentPathStep <= 0;
  if (!testMode) next.disabled = false;
  document.getElementById("btnPresent").disabled = !currentPath || currentPathStep < 0;
}
function loadPath(name) {
  currentPath = LEARNING_PATHS[name];
  currentPathId = name;
  currentPathStep = -1;
  pathScore = { correct: 0, total: 0 };
  checkpointAnswered = false;
  updateNavButtons();
  updateScoreDisplay();
  learnBody.innerHTML = "<em>" + currentPath.title + "</em><br>" + (currentPath.description || "") + "<br><br>Klicka <strong>Nästa »</strong> för att börja.";
  activityDispatch("learning_path_loaded", { learningPathId: currentPathId });
}
/* GAM-003C — Antal ord i ett stegs lästext, skickas med learning_step_reached
   så att gamification-motorn (DOM-fri, laddar aldrig innehålls-JSON själv)
   kan beräkna lästidskrav utan att app.js behöver känna till XP-regler.
   Samma textkälla som renderStep() använder för bodyText — ren
   dubblering av VILKEN text som räknas, inte av XP-logiken. */
function countWords(text) {
  if (!text) return 0;
  const plain = String(text).replace(/<[^>]*>/g, " ");
  const matches = plain.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}
function stepReadingWordCount(step) {
  if (step.type === "theory") {
    const th = THEORY[step.ref];
    if (!th) return 0;
    return countWords((th.summary || "") + " " + (th.bullets || []).join(" "));
  }
  return countWords(step.instruction || "");
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
  activityDispatch("learning_step_reached", { learningPathId: currentPathId, stepIndex: currentPathStep, isFinalStep: currentPathStep === currentPath.steps.length - 1, contextKey: activityContextKey(), comparisonGroup: step.comparisonGroup || null, stepType: step.type, wordCount: stepReadingWordCount(step), progressRequirement: step.progressRequirement || null });
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
    // continueFromPreviousStep: explicit opt-in (default: ladda om, som tidigare) för
    // steg som medvetet fortsätter samma körning på samma graf över flera lärstigssteg
    // (t.ex. en P→PI→PID-jämförelse) istället för att börja om. Kräver samma
    // scenarioreferens som redan är laddad — annars körs alltid en vanlig omladdning,
    // så en felskriven flagga aldrig kan köra fel scenario. Gäller bara framåtnavigering
    // (prevPathStep laddar alltid om — "fortsätta bakåt" har ingen rimlig innebörd).
    const continueSameRun = step.continueFromPreviousStep && currentScenarioRef === step.ref;
    if (!continueSameRun && SCENARIOS[step.ref]) { scenarioSelect.value = step.ref; loadScenarioByName(step.ref); }
  }
  activityDispatch("learning_step_reached", { learningPathId: currentPathId, stepIndex: currentPathStep, isFinalStep: currentPathStep === currentPath.steps.length - 1, contextKey: activityContextKey(), comparisonGroup: step.comparisonGroup || null, stepType: step.type, wordCount: stepReadingWordCount(step), progressRequirement: step.progressRequirement || null });
  renderStep(step);
}

function showWelcome() {
  learnBody.innerHTML = `<div class="welcome-panel">
    <h3>Välkommen till PID Simulator!</h3>
    <p>Simulera och utforska reglerteknik — från enkel on/off till avancerade metoder som Lambda-tuning.</p>
    <p>Appen passar både nybörjare och den som vill repetera eller fördjupa sig.</p>
    <button id="welcomeStart">Kom igång »</button>
  </div>`;
  document.getElementById("welcomeStart").onclick = () => {
    localStorage.setItem("pidSimWelcomed", "1");
    loadPath("kom-igång.v1");
    nextPathStep();
  };
}

function initUI() {
  Object.entries(SCENARIOS).forEach(([name, s]) => { if (!s._standalone) return; const o = document.createElement("option"); o.value = name; o.textContent = s.title || name; scenarioSelect.appendChild(o); });
  Object.entries(LEARNING_PATHS).forEach(([id, p]) => { const o = document.createElement("option"); o.value = id; o.textContent = p.title || id; learningPathSelect.appendChild(o); });
  // UX-002 — loadScenarioByName() sätter redan rätt Tillämpning (se
  // deriveApplicationProfile()); för startscenariot ger det "Avancerat"
  // (basic-step-self-regulating.json har inga aktiva tillägg, faller igenom
  // till den generiska fallbacken).
  loadScenarioByName("basic-step-self-regulating.json");
  // UX-004 Implementering (PO-uppdrag 2026-09-22) — INTE lämna "Avancerat"
  // stå kvar som förvalt startläge: "Avancerat" tvingar per definition ALLA
  // Avancerat-disklosyrsektioner öppna (Justering 1, se deriveAdvancedOpen()),
  // vilket direkt bryter mot detta uppdragets uttryckliga krav ("Initialt
  // öppet läge" — endast grundnivå ska synas vid en helt ny sidladdning).
  // Ett återkommande besök återställer i stället senast MANUELLT valda
  // Tillämpning (se kommentaren vid APPLICATION_PROFILES); saknas ett sparat
  // val (första besöket, eller en tömd localStorage) används "temperatur"
  // som neutral grundnivå-standard — den enda av de tre tillämpningarna som
  // faktiskt matchar startscenariots egen processtyp (self_regulating) och
  // vars Avancerat-sektioner INTE tvingas öppna. Efter, inte in i,
  // loadScenarioByName() ovan — samma mönster som ett manuellt
  // tillämpningsbyte (syncParamsFromUI + omritning), eftersom sim redan
  // finns vid det här laget.
  const savedProfile = localStorage.getItem(APPLICATION_PROFILE_STORAGE_KEY);
  const initialProfile = (savedProfile && APPLICATION_PROFILES[savedProfile]) ? savedProfile : "temperatur";
  if (initialProfile !== fields.applicationProfile.value) {
    fields.applicationProfile.value = initialProfile;
    applyApplicationProfile();
    if (sim) { syncParamsFromUI(); drawChart(); updateStatus(); }
  }
  if (!localStorage.getItem("pidSimWelcomed")) showWelcome();
  applyEnvironmentUI();
}

// ── Miljöstyrd UI (PROD-001B) ──
function applyEnvironmentUI() {
  const modeToggle = document.querySelector(".mode-toggle");
  if (modeToggle) modeToggle.style.display = ENV_CONFIG.showTestMode ? "" : "none";
  const badge = document.getElementById("envBadge");
  if (badge) badge.style.display = ENV_CONFIG.environment === "development" ? "" : "none";
  // HOTFIX-v1.4.1: tangentlinjens facit ("Visa tangentlinje" + "Visa facit") döljs i
  // PROD — fungerar inte tillräckligt bra pedagogiskt än, kvar i DEV för fortsatt
  // utredning. Ingen tom lucka lämnas: hela kontrollen och dess separator döljs, inte
  // bara knappen. Se docs/development/ENVIRONMENTS.md.
  const facitVisible = ENV_CONFIG.showMeasurementFacit ? "" : "none";
  const tangentField = document.getElementById("mpTangentField");
  if (tangentField) tangentField.style.display = facitVisible;
  const facitSep = document.getElementById("measureSepFacit");
  if (facitSep) facitSep.style.display = facitVisible;
  const facitGroup = document.getElementById("measureGroupFacit");
  if (facitGroup) facitGroup.style.display = facitVisible;
  updateScoreDisplay();
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
function toggleSidebar(sbId, btnId, handleId, collapsedText, expandedText) {
  const sb = document.getElementById(sbId);
  const btn = document.getElementById(btnId);
  const handle = document.getElementById(handleId);
  sb.classList.toggle("collapsed");
  const collapsed = sb.classList.contains("collapsed");
  btn.textContent = collapsed ? collapsedText : expandedText;
  handle.style.display = collapsed ? "none" : "";
  if (collapsed) {
    sb.dataset.savedWidth = sb.style.width;
    sb.style.width = "";
  } else {
    if (sb.dataset.savedWidth) sb.style.width = sb.dataset.savedWidth;
  }
}
document.getElementById("toggleLeft").addEventListener("click", () => toggleSidebar("sidebarLeft", "toggleLeft", "resizeLeft", "»", "«"));
document.getElementById("toggleRight").addEventListener("click", () => {
  toggleSidebar("sidebarRight", "toggleRight", "resizeRight", "«", "»");
  // GAM-003C — högersidopanelen visar bara hjälpinnehåll; att kollapsa den
  // är "stängd panel" och avbryter en pågående hjälp-XP-kvalificering.
  if (document.getElementById("sidebarRight").classList.contains("collapsed")) {
    activityDispatch("help_closed", {});
  }
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
    activityDispatch("help_opened", { helpId: btn.dataset.help, scenarioId: currentScenario ? currentScenario.id : null, learningPathId: currentPathId, stepIndex: currentPathStep >= 0 ? currentPathStep : null });
  });
});

// ── Test/Guidat mode toggle ──
function setTestMode(on) {
  if (on && !ENV_CONFIG.showTestMode) return; // PROD: Test-läge kan aldrig aktiveras, oavsett anropsväg
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
["groupProcessinstallning","groupRegulatorkonfiguration","groupProcesspaverkan"].forEach(id => {
  if (localStorage.getItem("pg-" + id) === "1") document.getElementById(id).classList.add("collapsed");
});
document.getElementById("load").addEventListener("click", () => {
  // UX-004 Implementering, punkt 3 (PO-test 2026-09-22) — currentPath
  // nollställs ALDRIG av sig själv (bara currentPathStep, se loadPath()/
  // testMode-togglen), så ett manuellt scenarioval mitt i en aktiv lärstig
  // lämnade tidigare kvar lärstigens visibilityOverride (och aktiverade
  // Föregående-knappen tillbaka in i lärstigen) på det nya, orelaterade
  // scenariot. currentPathStep = -1 är samma "har lämnat den aktiva
  // guidade stegvyn"-signal som redan används överallt annanstans
  // (updateNavButtons(), activityContextKey(), applyPathVisibilityOverride()).
  currentPathStep = -1;
  updateNavButtons();
  loadScenarioByName(scenarioSelect.value);
});
fields.pulseDuration.addEventListener("input", () => { if (Number(fields.pulseDuration.value) < 0) fields.pulseDuration.value = 0; });
fields.showPB.addEventListener("change", drawChart);
// Kp, SP och hysteresgränserna ritas i grafen (PB-band, SP-linje,
// hysteresband) redan innan ett steg körts — synka och rita om direkt
// vid ändring istället för att vänta på nästa Stega/Kör-klick.
[fields.kp, fields.sp, fields.hysteresLower, fields.hysteresUpper].forEach(f => {
  f.addEventListener("change", () => { syncParamsFromUI(); drawChart(); });
});
// FEAT-042 — brytpunkter och zonvärden ritas i grafen (hjälplinjer) redan
// innan ett steg körts, samma motivering som kp/sp/hysteres ovan.
[fields.gsBreak1, fields.gsBreak2, fields.gsZ1Kp, fields.gsZ1Ti, fields.gsZ1Td,
 fields.gsZ2Kp, fields.gsZ2Ti, fields.gsZ2Td, fields.gsZ3Kp, fields.gsZ3Ti, fields.gsZ3Td,
 fields.ngBreak1, fields.ngBreak2, fields.ngZ1K, fields.ngZ2K, fields.ngZ3K].forEach(f => {
  f.addEventListener("change", () => { syncParamsFromUI(); drawChart(); });
});
fields.gainScheduleEnabled.addEventListener("change", () => { updateGainScheduleUIState(); syncParamsFromUI(); drawChart(); });
fields.nonlinearGainEnabled.addEventListener("change", () => { updateNonlinearGainUIState(); syncParamsFromUI(); drawChart(); });
// GAM-002: tunt, tillagt lyssnarpar enbart för aktivitetsloggning — rör inte
// appens egen parameterhantering ovan/i syncParamsFromUI().
[["k", fields.k], ["t", fields.t], ["l", fields.l], ["auxGain", fields.auxGain], ["kp", fields.kp], ["ti", fields.ti], ["td", fields.td], ["kff", fields.kff],
 ["sp", fields.sp], ["umin", fields.umin], ["umax", fields.umax], ["manualOutput", fields.manualOutput],
 ["noise", fields.noise], ["pulseMag", fields.pulseMag], ["pulseDuration", fields.pulseDuration], ["auxMag", fields.auxMag]]
  .forEach(pair => {
    const name = pair[0], el = pair[1];
    el.addEventListener("change", () => {
      activityDispatch("parameter_changed", {
        field: name,
        value: Number(el.value),
        min: el.min !== "" ? Number(el.min) : null,
        max: el.max !== "" ? Number(el.max) : null,
      });
    });
  });
document.getElementById("mode").addEventListener("change", () => {
  const newMode = fields.mode.value;
  if (sim && currentScenario) {
    const prevMode = currentScenario.controller.mode;
    // UX-004 Justering 4 (PO-beslut 2026-09-21) — övergången till Manuellt
    // ska ALLTID vara stötfri (seedas med aktuellt u), oavsett
    // Bumpless-kryssrutan — den styr en ANNAN sak (regulatorns egen
    // bias-fasning vid övergång TILL p/pi/pid, se syncParamsFromUI()).
    // Verklig driftväxling Auto→Manuell är aldrig valfritt stötfri.
    if (newMode === "manual" && prevMode !== "manual") {
      const lastU = sim.getState().u;
      fields.manualOutput.value = lastU.toFixed(2);
      currentScenario.controller.manualOutput = lastU;
      currentScenario.controller.mode = "manual";
    }
  }
  updateControllerUIState();
  activityDispatch("regulator_mode_changed", { field: "mode", value: newMode });
});
// UX-004 Justering 4 — de två SYNLIGA Läge-kontrollerna skriver bara till
// #mode (dold) och triggar dess befintliga "change"-hantering ovan, precis
// som om användaren ändrat den direkt — all nedströms-logik (syncParamsFromUI,
// updateControllerUIState, Tillämpnings-filtrering) är oförändrad.
document.getElementById("regulatorType").addEventListener("change", () => {
  if (fields.autoManualToggle.checked) return; // typvalet gäller bara nästa Auto-växling, sparas tyst så länge Manuellt är valt
  fields.mode.value = fields.regulatorType.value;
  fields.mode.dispatchEvent(new Event("change"));
  activityDispatch("regulator_type_changed", { field: "regulatorType", value: fields.regulatorType.value });
});
document.getElementById("autoManualToggle").addEventListener("change", () => {
  fields.mode.value = fields.autoManualToggle.checked ? "manual" : fields.regulatorType.value;
  fields.mode.dispatchEvent(new Event("change"));
  activityDispatch("auto_manual_toggled", { field: "autoManualToggle", value: fields.autoManualToggle.checked });
});
document.getElementById("processType").addEventListener("change", () => {
  updateProcessUIState();
  activityDispatch("process_type_changed", { field: "processType", value: fields.processType.value });
});
// UX-002 — Tillämpning: byte filtrerar processmodellerna + strategitilläggen, se applyApplicationProfile().
document.getElementById("applicationProfile").addEventListener("change", () => {
  applyApplicationProfile();
  // UX-004 — spara bara MANUELLA val (se kommentaren vid APPLICATION_PROFILES);
  // deriveApplicationProfile() sätter samma fält vid varje scenario-/
  // lärstigsladdning, men det ska inte skriva över användarens sparade val.
  localStorage.setItem(APPLICATION_PROFILE_STORAGE_KEY, fields.applicationProfile.value);
  // PO:s granskning (2026-09-20) — till skillnad från anropet inifrån
  // loadScenarioByName() (där en omedelbar synk skulle kunna skapa en
  // missvisande ändringsmarkering innan captureMarkerBaseline() hunnit sätta
  // en ny baslinje) är ett MANUELLT tillämpningsbyte den enda situationen
  // där kvarvarande, nu dolt tillstånd (Parameterstyrning/Ventilkarakteristik/
  // Framkoppling/Läge) annars skulle fortsätta påverka en redan igångsatt
  // körning osynligt. Synka och rita om direkt här.
  if (sim) { syncParamsFromUI(); drawChart(); updateStatus(); }
  activityDispatch("application_profile_changed", { field: "applicationProfile", value: fields.applicationProfile.value });
});
document.getElementById("step").addEventListener("click", () => { if (!sim) return; syncParamsFromUI(); const f = sim.step(); if (!f) appendLog("Simulering stoppad — scenariots maxantal steg är nått. Klicka “Fler steg →” för att fortsätta."); else { appendLog("Step: t=" + f.t.toFixed(2) + " y=" + f.y.toFixed(3) + " u=" + f.u.toFixed(3)); markZoneChangeIfAny(); } updateStatus(); updateStepLimitUI(); drawChart(); activityDispatch("simulation_step", { contextKey: activityContextKey() }); });
document.getElementById("run10").addEventListener("click", () => {
  if (!sim) return;
  syncParamsFromUI();
  // FEAT-042 (PO-granskning, punkt 5) — stegar ETT i taget (istället för
  // sim.run(10)) enbart för att kunna upptäcka ett zonbyte som sker MITT i
  // batchen, inte bara jämföra före/efter hela klicket. Beteendet (antal
  // körda steg, stopp vid maxSteps) är oförändrat.
  let count = 0;
  for (let i = 0; i < 10; i++) {
    const f = sim.step();
    if (!f) break;
    count++;
    markZoneChangeIfAny();
  }
  appendLog("Körde " + count + " steg." + (count < 10 ? " Scenariots maxantal steg är nått — klicka “Fler steg →” för att fortsätta." : ""));
  updateStatus(); updateStepLimitUI(); drawChart();
  activityDispatch("simulation_run", { steps: count, contextKey: activityContextKey() });
});
document.getElementById("btnExtendSteps").addEventListener("click", () => {
  if (!sim) return;
  sim.extendSteps();
  if (!sim.history.markers) sim.history.markers = [];
  sim.history.markers.push({ t: sim.history.t[sim.history.t.length - 1] ?? 0, label: "Fler steg" });
  appendLog("Fler steg tillgängliga (nytt tak: " + sim.maxSteps + " steg).");
  updateStepLimitUI();
  drawChart();
  activityDispatch("steps_extended", { contextKey: activityContextKey(), newMax: sim.maxSteps });
});
document.getElementById("pulse").addEventListener("click", () => { if (!sim) return; syncParamsFromUI(); sim.triggerPulse(); if (!sim.history.markers) sim.history.markers = []; sim.history.markers.push({ t: sim.history.t[sim.history.t.length - 1] ?? 0, label: "Puls" }); appendLog("Puls triggad."); activityDispatch("disturbance_triggered", { contextKey: activityContextKey() }); });
// FEAT-045 — "Trigga last", samma interaktionsmönster som "Trigga puls" ovan
// (STRAT-005 avsnitt 3), men markeringsetiketten visar det NYA lastvärdet
// (t.ex. "Last → 20") istället för en enkel "Last"-etikett, eftersom
// lastens exakta nivå är pedagogiskt relevant på ett sätt pulsens
// magnitud inte är.
document.getElementById("triggerAux").addEventListener("click", () => {
  if (!sim) return;
  syncParamsFromUI();
  sim.triggerAuxSignal();
  if (!sim.history.markers) sim.history.markers = [];
  sim.history.markers.push({ t: sim.history.t[sim.history.t.length - 1] ?? 0, label: "Last → " + sim.auxValue });
  appendLog("Last triggad (" + sim.auxValue + ").");
  drawChart();
  activityDispatch("disturbance_triggered", { contextKey: activityContextKey(), field: "auxSignal" });
});
document.getElementById("clearChart").addEventListener("click", () => { if (!sim) return; zoomView = null; pvZoomView = null; sim.history = { t: [], y: [], u: [], e: [], sp: [], p: [], i: [], d: [], aux: [], markers: [] }; sim.stepNo = 0; captureMarkerBaseline(); appendLog("Graf nollställd."); updateStatus(); updateStepLimitUI(); drawChart(); activityDispatch("chart_cleared", {}); });
document.getElementById("systemReset").addEventListener("click", () => { if (!sim) return; zoomView = null; pvZoomView = null; sim.reset(); sim.history = { t: [], y: [], u: [], e: [], sp: [], p: [], i: [], d: [], aux: [], markers: [] }; sim.stepNo = 0; captureMarkerBaseline(); appendLog("System återställt."); updateStatus(); updateStepLimitUI(); drawChart(); activityDispatch("system_reset", { contextKey: activityContextKey() }); });
document.getElementById("loadPath").addEventListener("click", () => loadPath(learningPathSelect.value));
document.getElementById("prevStep").addEventListener("click", prevPathStep);
document.getElementById("nextStep").addEventListener("click", nextPathStep);
window.addEventListener("resize", drawChart);

// ── Presentationsläge ──
// Visar samma innehåll som currentPath.steps[currentPathStep] i stor stil.
// Rör aldrig simulatorns state (sim, currentScenario) — bara läsning av
// redan laddat lärstigsinnehåll. Svarsalternativ renderas medvetet inte
// här, oavsett Guidat/Test-läge, så att rätt svar aldrig kan avslöjas.
function buildPresentHtml(step, stepIndex, totalSteps) {
  let html = '<span class="present-step-num">Steg ' + (stepIndex + 1) + '/' + totalSteps + '</span>';
  html += '<div class="present-title">' + step.title + '</div>';
  if (step.objective) html += '<div class="present-objective">Mål: ' + step.objective + '</div>';
  if (step.type === "theory") {
    const th = THEORY[step.ref];
    if (th) {
      html += '<div class="present-text"><strong>' + th.summary + '</strong></div>';
      html += '<div class="present-text">' + th.bullets.map(b => "• " + b).join("<br>") + '</div>';
    }
  } else if (step.instruction) {
    html += '<div class="present-text">' + step.instruction.replace(/\n/g, "<br>") + '</div>';
  }
  if (step.checkpoint) {
    html += '<div class="present-question">💭 Fundera: ' + step.checkpoint.question + '</div>';
  }
  return html;
}
function openPresentMode() {
  if (!currentPath || currentPathStep < 0) return;
  const step = currentPath.steps[currentPathStep];
  document.getElementById("presentBody").innerHTML = buildPresentHtml(step, currentPathStep, currentPath.steps.length);
  document.getElementById("presentOverlay").hidden = false;
}
function closePresentMode() {
  document.getElementById("presentOverlay").hidden = true;
}
document.getElementById("btnKomIgang").addEventListener("click", showWelcome);
document.getElementById("btnPresent").addEventListener("click", openPresentMode);
document.getElementById("presentClose").addEventListener("click", closePresentMode);
document.getElementById("presentOverlay").addEventListener("click", (e) => {
  if (e.target.id === "presentOverlay") closePresentMode();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !document.getElementById("presentOverlay").hidden) closePresentMode();
});

// ── Mätläge ──
function enterMeasureMode() {
  measureMode = true;
  const sbLeft = document.getElementById("sidebarLeft");
  if (!sbLeft.classList.contains("collapsed")) {
    measureCollapsedLeft = true;
    toggleSidebar("sidebarLeft", "toggleLeft", "resizeLeft", "»", "«");
  } else {
    measureCollapsedLeft = false;
  }
  measureCollapsedGroups = [];
  ["groupProcessinstallning","groupRegulatorkonfiguration","groupProcesspaverkan"].forEach(id => {
    const g = document.getElementById(id);
    if (!g.classList.contains("collapsed")) {
      g.classList.add("collapsed");
      localStorage.setItem("pg-" + id, "1");
      measureCollapsedGroups.push(id);
    }
  });
  document.querySelector(".params-container").classList.add("measure-locked");
  document.getElementById("measurePanel").classList.add("active");
  document.getElementById("btnMeasure").classList.add("active");
  document.getElementById("btnMeasure").textContent = "✕ Stäng mätläge";
  chartCanvas.style.cursor = "crosshair";
  drawChart();
  activityDispatch("measurement_started", { contextKey: activityContextKey() });
}

function exitMeasureMode() {
  measureMode = false;
  hoverPos = null;
  if (measureCollapsedLeft) {
    toggleSidebar("sidebarLeft", "toggleLeft", "resizeLeft", "»", "«");
    measureCollapsedLeft = false;
  }
  measureCollapsedGroups.forEach(id => {
    document.getElementById(id).classList.remove("collapsed");
    localStorage.setItem("pg-" + id, "0");
  });
  measureCollapsedGroups = [];
  document.querySelector(".params-container").classList.remove("measure-locked");
  document.getElementById("measurePanel").classList.remove("active");
  document.getElementById("facitBody").style.display = "none";
  document.getElementById("btnFacit").textContent = "Visa facit";
  document.getElementById("btnMeasure").classList.remove("active");
  document.getElementById("btnMeasure").textContent = "Mät K/T/L";
  chartCanvas.style.cursor = "";
  drawChart();
}

document.getElementById("btnMeasure").addEventListener("click", () => {
  if (measureMode) exitMeasureMode(); else enterMeasureMode();
});

document.getElementById("btnFacit").addEventListener("click", () => {
  if (!ENV_CONFIG.showMeasurementFacit) return; // PROD: facitet kan aldrig aktiveras, oavsett anropsväg
  const fb = document.getElementById("facitBody");
  const showing = fb.style.display !== "none" && fb.style.display !== "";
  if (!showing) {
    if (currentScenario) {
      document.getElementById("facitK").textContent = currentScenario.process.K;
      document.getElementById("facitT").textContent = currentScenario.process.T;
      document.getElementById("facitL").textContent = currentScenario.process.L;
    }
    fb.style.display = "";
    document.getElementById("btnFacit").textContent = "Dölj facit";
    activityDispatch("measurement_facit_opened", { contextKey: activityContextKey() });
  } else {
    fb.style.display = "none";
    document.getElementById("btnFacit").textContent = "Visa facit";
  }
});

document.getElementById("mpPv0").addEventListener("input", () => { if (measureMode) { drawChart(); activityDispatch("measurement_adjusted", { field: "mpPv0", contextKey: activityContextKey() }); } });
document.getElementById("mpPvInf").addEventListener("input", () => { if (measureMode) { drawChart(); activityDispatch("measurement_adjusted", { field: "mpPvInf", contextKey: activityContextKey() }); } });
document.getElementById("mp63Line").addEventListener("change", () => { if (measureMode) { drawChart(); activityDispatch("measurement_adjusted", { field: "mp63Line", contextKey: activityContextKey() }); } });
document.getElementById("mpRiseTimeLines").addEventListener("change", () => { if (measureMode) { drawChart(); activityDispatch("measurement_adjusted", { field: "mpRiseTimeLines", contextKey: activityContextKey() }); } });
document.getElementById("mpToleranceBand").addEventListener("change", () => { if (measureMode) { drawChart(); activityDispatch("measurement_adjusted", { field: "mpToleranceBand", contextKey: activityContextKey() }); } });
document.getElementById("mpTangent").addEventListener("change", () => { if (measureMode) { drawChart(); activityDispatch("measurement_adjusted", { field: "mpTangent", contextKey: activityContextKey() }); } });

chartCanvas.addEventListener("mousemove", e => {
  if (!measureMode) return;
  const rect = chartCanvas.getBoundingClientRect();
  hoverPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  drawChart();
});

chartCanvas.addEventListener("mouseleave", () => {
  if (!measureMode || !hoverPos) return;
  hoverPos = null;
  drawChart();
});

chartCanvas.addEventListener("wheel", e => {
  if (!sim || !measureMode) return;
  e.preventDefault();
  const factor = e.deltaY < 0 ? 0.8 : 1.25;
  const rect = chartCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const cw = chartCanvas.width, ch = chartCanvas.height;
  const padL = 52, padR = 16, padTop = 14;
  const chartW = cw - padL - padR;

  // X-zoom (båda graferna)
  const tFull = sim.history.t.at(-1) || 1;
  const cur = zoomView ?? { start: 0, end: tFull };
  const span = cur.end - cur.start;
  const newSpan = Math.max(10, Math.min(tFull, span * factor));
  const xRatio = Math.max(0, Math.min(1, (mx - padL) / chartW));
  const tAtMouse = cur.start + xRatio * span;
  const newStart = Math.max(0, tAtMouse - xRatio * newSpan);
  const newEnd = Math.min(tFull, newStart + newSpan);
  zoomView = (newEnd - newStart >= tFull - 0.5) ? null : { start: newStart, end: newEnd };

  // Y-zoom (endast PV-ytan)
  if (my >= padTop && my <= ch * 0.62) {
    const pvFullMin = Math.min(sim.scenario.process.measurementRange.min, 0);
    const pvFullMax = Math.max(sim.scenario.process.measurementRange.max, 100);
    const pvFullSpan = pvFullMax - pvFullMin;
    const curPv = pvZoomView ?? { min: pvFullMin, max: pvFullMax };
    const pvSpan = curPv.max - curPv.min;
    const newPvSpan = Math.max(5, Math.min(pvFullSpan, pvSpan * factor));
    // PV-värde vid musen (y-axeln är inverterad: top=max, bottom=min)
    const yRatio = (my - padTop) / (ch * 0.62 - padTop);
    const pvAtMouse = curPv.max - yRatio * pvSpan;
    const newPvMax = Math.min(pvFullMax, pvAtMouse + yRatio * newPvSpan);
    const newPvMin = Math.max(pvFullMin, newPvMax - newPvSpan);
    pvZoomView = (newPvMax - newPvMin >= pvFullSpan - 0.5) ? null : { min: newPvMin, max: newPvMax };
  }

  drawChart();
}, { passive: false });

chartCanvas.addEventListener("dblclick", () => {
  if (!measureMode) return;
  zoomView = null; pvZoomView = null;
  drawChart();
});

loadCatalog().then(initUI).catch(err => {
  document.body.innerHTML = '<div style="padding:40px;font-family:sans-serif;background:#1a1a2e;color:#e0e0e0;min-height:100vh"><h2 style="color:#f0a500">Kunde inte ladda data</h2><p>' + err.message + '</p><p>Appen kräver HTTP-server (GitHub Pages eller lokal server). Dubbel-klick på index.html stöds inte.</p></div>';
});
