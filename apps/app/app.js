/* Data laddas via fetch() från content/catalog.json (DEV) eller
   content/catalog.prod.json (PROD) vid uppstart — se ENV_CONFIG.catalogFile. */
/* OnOffController, PIDController, ProcessModel, seededRandom, gaussian och
   Simulation kommer från sim-core.js (laddas som separat <script> före
   denna fil) — se apps/app/sim-core.js. Delad med tests/simulation/. */

const APP_VERSION = "1.4.0";

/* ENV_CONFIG sätts av env.js (laddas som separat <script> FÖRE denna fil,
   se index.html och docs/development/ENVIRONMENTS.md). Fallback här är en
   säkerhetsnät om env.js av någon anledning inte laddats — motsvarar DEV,
   det historiska beteendet innan PROD-001B. Miljön kan INTE bytas via
   URL-parameter, tangentbord eller dold knapp — enda källan är env.js. */
const ENV_CONFIG = window.ENV_CONFIG || (function () {
  console.warn("env.js saknas — faller tillbaka till development-profil.");
  return { environment: "development", showTestMode: true, showScore: true, showExperimentalContent: true, catalogFile: "catalog.json" };
})();

/* GAM-002 — Aktivitetsprototyp (DEV-only, teknisk analys, ingen synlig XP).
   Skripten injiceras dynamiskt ENDAST i DEV, så att PROD aldrig ens begär
   filerna över nätverket (statiska <script>-taggar i index.html hade laddats
   i båda profilerna). tests/lib/build-prod.mjs kopierar heller aldrig dessa
   två filer till dist/prod — dubbelt skydd. Se docs/development/GAMIFICATION-PROTOTYPE.md. */
if (ENV_CONFIG.environment === "development") {
  ["./activity-prototype-core.js", "./activity-prototype.js"].forEach(src => {
    const s = document.createElement("script");
    s.src = src;
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
  
  ctx.fillStyle = "#444"; ctx.font = "12px Segoe UI"; ctx.textAlign = "left";
  ctx.fillText("PV/SP", pad.left + 6, pad.top + 14);
  ctx.fillText("u", pad.left + 6, h * 0.68 + 16);
  ctx.save();
  ctx.beginPath();
  ctx.rect(pad.left, pad.top, w - pad.left - pad.right, h * 0.62 - pad.top);
  ctx.clip();
  drawSeries(ctx, t.map((tv, i) => ({ x: xScale(tv), y: yScaleTop(y[i]) })), "#1266f1", false);
  drawSeries(ctx, t.map((tv, i) => ({ x: xScale(tv), y: yScaleTop(sp[i]) })), "#d64545", true);
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
      ctx.strokeStyle = "#c8870a"; ctx.lineWidth = 1.5; ctx.setLineDash([8, 5]);
      ctx.beginPath(); ctx.moveTo(pad.left, y63px); ctx.lineTo(w - pad.right, y63px); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#c8870a"; ctx.font = "10px Segoe UI"; ctx.textAlign = "right";
      ctx.fillText("63% = " + y63.toFixed(2), w - pad.right - 3, y63px - 3);
      ctx.restore();
    }

    // Tangentlinje (Ziegler-Nichols)
    if (document.getElementById("mpTangent").checked && y.length > 5) {
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
        if (hasRange) {
          const tL = tInfl - (pvInfl - pv0) / maxSl;
          const tLT = tInfl + (pvInf - pvInfl) / maxSl;
          const tLineStart = Math.max(0, tL);
          const tLineEnd = Math.min(tMax, tLT);

          ctx.strokeStyle = "#8e44ad"; ctx.lineWidth = 2; ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(xScale(tLineStart), yScaleTop(pvLineAt(tLineStart)));
          ctx.lineTo(xScale(tLineEnd), yScaleTop(pvLineAt(tLineEnd)));
          ctx.stroke(); ctx.setLineDash([]);

          const tStep = t[stepIdx] ?? 0;
          if (tL >= 0 && tL <= tMax) {
            const xL = xScale(tL), yL = yScaleTop(pv0);
            ctx.strokeStyle = "#8e44ad"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(xL, yL - 8); ctx.lineTo(xL, yL + 8); ctx.stroke();
            ctx.fillStyle = "#8e44ad"; ctx.font = "bold 10px Segoe UI"; ctx.textAlign = "center";
            ctx.fillText("L≈" + Math.round(tL - tStep), xL, yL + 20);
          }
          if (tLT >= 0 && tLT <= tMax) {
            const xLT = xScale(tLT), yLT = yScaleTop(pvInf);
            ctx.strokeStyle = "#8e44ad"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(xLT, yLT - 8); ctx.lineTo(xLT, yLT + 8); ctx.stroke();
            ctx.fillStyle = "#8e44ad"; ctx.font = "bold 10px Segoe UI"; ctx.textAlign = "center";
            ctx.fillText("T≈" + Math.round(tLT - tL), xLT, yLT - 12);
          }
        } else {
          const ext = tMax * 0.25;
          const tLineStart = Math.max(0, tInfl - ext);
          const tLineEnd = Math.min(tMax, tInfl + ext * 1.5);
          ctx.strokeStyle = "#8e44ad"; ctx.lineWidth = 2; ctx.setLineDash([8, 4]);
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

        const lines = ["t  = " + Math.round(tHover), "PV = " + pvH.toFixed(2), "u  = " + uH.toFixed(2)];
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
function updateStatus() {
  if (!sim) { statusEl.textContent = "Status: ej laddad"; return; }
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
  statusEl.textContent = "Status: steg=" + s.step + ", t=" + fmt1(s.t) + ", SP=" + fmt1(spAtStep) + ", PV=" + fmt1(s.y) + ", e=" + fmt1(s.e) + ", u=" + fmt1(s.u) + pidInfo + warning;
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
// GAM-002: kontext för aktivitetsprototypens försöks-/konfigurationsspårning —
// lärstigssteg om en lärstig är aktiv, annars scenariot självt.
function activityContextKey() {
  if (currentPath && currentPathStep >= 0) return currentPathId + "#" + currentPathStep;
  return currentScenario ? currentScenario.id : null;
}
function loadScenarioByName(name) {
  if (measureMode) exitMeasureMode();
  zoomView = null; pvZoomView = null;
  currentScenario = deepClone(SCENARIOS[name]);
  currentScenarioRef = name;
  sim = new Simulation(currentScenario, 42);
  sim.history.markers = [];
  hydrateFields(currentScenario);
  captureMarkerBaseline();
  appendLog("Laddat scenario: " + currentScenario.id);
  updateControllerUIState();
  updateProcessUIState();
  updateStatus(); drawChart();
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
    k: scenario.process.K, t: scenario.process.T, l: scenario.process.L, processType: scenario.process.type
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
  return null;
}
function captureMarkerBaseline() {
  lastMarkerSnapshot = currentScenario ? markerSnapshot(currentScenario) : null;
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
  learnBody.innerHTML = "<em>" + currentPath.title + "</em><br><small>" + (currentPath.description || "") + "</small><br><br>Klicka <strong>Nästa »</strong> för att börja.";
  activityDispatch("learning_path_loaded", { learningPathId: currentPathId });
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
  activityDispatch("learning_step_reached", { learningPathId: currentPathId, stepIndex: currentPathStep, isFinalStep: currentPathStep === currentPath.steps.length - 1, contextKey: activityContextKey() });
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
  activityDispatch("learning_step_reached", { learningPathId: currentPathId, stepIndex: currentPathStep, isFinalStep: currentPathStep === currentPath.steps.length - 1, contextKey: activityContextKey() });
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
  Object.entries(SCENARIOS).forEach(([name, s]) => { if (!s._standalone) return; const o = document.createElement("option"); o.value = name; o.textContent = s.title || name; scenarioSelect.appendChild(o); });
  Object.entries(LEARNING_PATHS).forEach(([id, p]) => { const o = document.createElement("option"); o.value = id; o.textContent = p.title || id; learningPathSelect.appendChild(o); });
  loadScenarioByName("basic-step-self-regulating.json");
  if (!localStorage.getItem("pidSimWelcomed")) showWelcome();
  applyEnvironmentUI();
}

// ── Miljöstyrd UI (PROD-001B) ──
function applyEnvironmentUI() {
  const modeToggle = document.querySelector(".mode-toggle");
  if (modeToggle) modeToggle.style.display = ENV_CONFIG.showTestMode ? "" : "none";
  const badge = document.getElementById("envBadge");
  if (badge) badge.style.display = ENV_CONFIG.environment === "development" ? "" : "none";
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
document.getElementById("toggleRight").addEventListener("click", () => toggleSidebar("sidebarRight", "toggleRight", "resizeRight", "«", "»"));

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
["groupProcess","groupRegulator","groupStyrning","groupStorningar"].forEach(id => {
  if (localStorage.getItem("pg-" + id) === "1") document.getElementById(id).classList.add("collapsed");
});
document.getElementById("load").addEventListener("click", () => loadScenarioByName(scenarioSelect.value));
fields.pulseDuration.addEventListener("input", () => { if (Number(fields.pulseDuration.value) < 0) fields.pulseDuration.value = 0; });
fields.showPB.addEventListener("change", drawChart);
// Kp, SP och hysteresgränserna ritas i grafen (PB-band, SP-linje,
// hysteresband) redan innan ett steg körts — synka och rita om direkt
// vid ändring istället för att vänta på nästa Stega/Kör-klick.
[fields.kp, fields.sp, fields.hysteresLower, fields.hysteresUpper].forEach(f => {
  f.addEventListener("change", () => { syncParamsFromUI(); drawChart(); });
});
// GAM-002: tunt, tillagt lyssnarpar enbart för aktivitetsloggning — rör inte
// appens egen parameterhantering ovan/i syncParamsFromUI().
[["k", fields.k], ["t", fields.t], ["l", fields.l], ["kp", fields.kp], ["ti", fields.ti], ["td", fields.td],
 ["sp", fields.sp], ["umin", fields.umin], ["umax", fields.umax], ["manualOutput", fields.manualOutput],
 ["noise", fields.noise], ["pulseMag", fields.pulseMag], ["pulseDuration", fields.pulseDuration]]
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
  const bumplessOn = document.getElementById("bumpless").checked;
  if (sim && currentScenario) {
    const prevMode = currentScenario.controller.mode;
    if (newMode === "manual" && prevMode !== "manual") {
      if (bumplessOn) {
        const lastU = sim.getState().u;
        fields.manualOutput.value = lastU.toFixed(2);
        currentScenario.controller.manualOutput = lastU;
      }
      currentScenario.controller.mode = "manual";
    }
  }
  updateControllerUIState();
  activityDispatch("regulator_mode_changed", { field: "mode", value: newMode });
});
document.getElementById("processType").addEventListener("change", () => {
  updateProcessUIState();
  activityDispatch("process_type_changed", { field: "processType", value: fields.processType.value });
});
document.getElementById("step").addEventListener("click", () => { if (!sim) return; syncParamsFromUI(); const f = sim.step(); if (!f) appendLog("Simulering stoppad."); else appendLog("Step: t=" + f.t.toFixed(2) + " y=" + f.y.toFixed(3) + " u=" + f.u.toFixed(3)); updateStatus(); drawChart(); activityDispatch("simulation_step", { contextKey: activityContextKey() }); });
document.getElementById("run10").addEventListener("click", () => { if (!sim) return; syncParamsFromUI(); const fs = sim.run(10); appendLog("Körde " + fs.length + " steg."); updateStatus(); drawChart(); activityDispatch("simulation_run", { steps: fs.length, contextKey: activityContextKey() }); });
document.getElementById("pulse").addEventListener("click", () => { if (!sim) return; syncParamsFromUI(); sim.triggerPulse(); if (!sim.history.markers) sim.history.markers = []; sim.history.markers.push({ t: sim.history.t[sim.history.t.length - 1] ?? 0, label: "Puls" }); appendLog("Puls triggad."); activityDispatch("disturbance_triggered", { contextKey: activityContextKey() }); });
document.getElementById("clearChart").addEventListener("click", () => { if (!sim) return; zoomView = null; pvZoomView = null; sim.history = { t: [], y: [], u: [], e: [], sp: [], p: [], i: [], d: [], markers: [] }; sim.stepNo = 0; captureMarkerBaseline(); appendLog("Graf nollställd."); updateStatus(); drawChart(); activityDispatch("chart_cleared", {}); });
document.getElementById("systemReset").addEventListener("click", () => { if (!sim) return; zoomView = null; pvZoomView = null; sim.reset(); sim.history = { t: [], y: [], u: [], e: [], sp: [], p: [], i: [], d: [], markers: [] }; sim.stepNo = 0; captureMarkerBaseline(); appendLog("System återställt."); updateStatus(); drawChart(); activityDispatch("system_reset", { contextKey: activityContextKey() }); });
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
  ["groupProcess","groupRegulator","groupStyrning","groupStorningar"].forEach(id => {
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
