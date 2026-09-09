// GAM-002 — Automatiska tester för aktivitetsprototypens kärnlogik
// (apps/app/activity-prototype-core.js). Egen enkel testrunner, i linje med
// tests/simulation/analyze.test.mjs. All tid är injicerad (millisekunder,
// motsvarar performance.now()-enheten) — inga verkliga sekunder väntas.
//
// Körs: node tests/activity-prototype.test.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const APP_DIR = path.resolve(__dirname, "..", "apps", "app");
const CORE_PATH = path.join(APP_DIR, "activity-prototype-core.js");
const GLUE_PATH = path.join(APP_DIR, "activity-prototype.js");
const APP_JS_PATH = path.join(APP_DIR, "app.js");
const BUILD_PROD_PATH = path.resolve(__dirname, "lib", "build-prod.mjs");

const Core = require(CORE_PATH);

let failed = 0, passed = 0;
function check(name, condition, detail) {
  if (condition) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

const T = 60000; // inaktivitetsgränsens standardvärde i ms, för läsbara testtider

// ── 1–3. DEV-only-isolering (statisk källkontroll, ingen browser krävs) ──
{
  const appJs = fs.readFileSync(APP_JS_PATH, "utf8");
  const gatePattern = /ENV_CONFIG\.environment === "development"\)\s*\{[\s\S]{0,300}activity-prototype/;
  check("1-2. app.js injicerar aktivitetsskripten bara när ENV_CONFIG.environment === \"development\"", gatePattern.test(appJs));

  const buildProd = fs.readFileSync(BUILD_PROD_PATH, "utf8");
  const coreFilesMatch = buildProd.match(/for \(const f of \[([^\]]+)\]\)/);
  const coreFilesList = coreFilesMatch ? coreFilesMatch[1] : "";
  check("3. PROD-byggningens fasta fillista innehåller INTE activity-prototype-filerna",
    !coreFilesList.includes("activity-prototype"), coreFilesList);
}

// ── 4. Synlig + fokuserad sida kan samla aktiv tid ──
{
  let s = Core.createSession(0);
  Core.markActive(s, 0);
  const sum = Core.summary(s, 5000);
  check("4. Aktiv tid ackumuleras när synlig och fokuserad", sum.activeMs === 5000, sum.activeMs);
}

// ── 5. Dold flik pausar aktiv tid ──
{
  let s = Core.createSession(0);
  Core.markActive(s, 0);
  Core.setVisible(s, false, 1000); // 1s aktiv hittills
  const midSum = Core.summary(s, 20000); // 19s dold — ska INTE räknas
  check("5. Dold flik pausar aktiv tid (ingen tid ackumuleras dold)", midSum.activeMs === 1000 && midSum.inactiveMs === 0, JSON.stringify(midSum));
  Core.setVisible(s, true, 20000);
  Core.markActive(s, 20000);
  const afterSum = Core.summary(s, 21000);
  check("5b. Aktiv tid återupptas efter att fliken visas igen", afterSum.activeMs === 2000, afterSum.activeMs);
}

// ── 6. Blur pausar aktiv tid ──
{
  let s = Core.createSession(0);
  Core.markActive(s, 0);
  Core.setFocused(s, false, 1000);
  const sum = Core.summary(s, 30000);
  check("6. Fönster utan fokus pausar aktiv tid", sum.activeMs === 1000 && sum.inactiveMs === 0, JSON.stringify(sum));
}

// ── 7. Inaktivitet efter 60s pausar aktiv tid ──
{
  let s = Core.createSession(0);
  Core.markActive(s, 0);
  const sum = Core.summary(s, T + 30000); // 60s aktivt fönster, sedan 30s inaktivt
  check("7. Aktiv tid begränsas till inaktivitetsgränsen (60s)", sum.activeMs === T, sum.activeMs);
  check("7b. Tid efter gränsen räknas som inaktiv", sum.inactiveMs === 30000, sum.inactiveMs);
  check("7c. En inaktivitetsperiod registrerad", sum.inactivityPeriodCount === 1, sum.inactivityPeriodCount);
}

// ── 8. Ny aktivitet återupptar aktiv tid ──
{
  let s = Core.createSession(0);
  Core.markActive(s, 0);
  Core.recordEvent(s, "simulation_step", { contextKey: "x" }, T + 30000); // efter inaktivitetsgränsen
  const events = Core.summary(s, T + 30000);
  const hasResume = s.rawEvents.some(e => e.type === "activity_resumed");
  check("8. Ny aktivitet efter inaktivitet loggar activity_resumed", hasResume);
  Core.markActive(s, T + 31000);
  const sum = Core.summary(s, T + 32000);
  check("8b. Aktiv tid fortsätter ackumuleras efter återupptagande", sum.activeMs > T, sum.activeMs);
}

// ── 9. Pointermove stryps till högst en signal var 5:e sekund ──
{
  let s = Core.createSession(0);
  const a = Core.recordPointermove(s, 0);
  const b = Core.recordPointermove(s, 2000); // för tidigt
  const c = Core.recordPointermove(s, 5000); // exakt på gränsen
  check("9. Pointermove strypt: accepterad, avvisad, accepterad", a === true && b === false && c === true);
  check("9b. Endast accepterade pointermove räknas", s.pointermoveAcceptedCount === 2, s.pointermoveAcceptedCount);
}

// ── 10. Pointermove lagrar inga koordinater / egen loggrad ──
{
  let s = Core.createSession(0);
  Core.recordPointermove(s, 0);
  Core.recordPointermove(s, 5000);
  const hasPointermoveRow = s.rawEvents.some(e => e.type === "pointermove");
  check("10. Pointermove skapar aldrig en egen råhändelserad", !hasPointermoveRow);
  const anyCoords = s.rawEvents.some(e => "x" in (e.meta || {}) || "y" in (e.meta || {}) || "clientX" in (e.meta || {}));
  check("10b. Inga koordinater finns någonstans i sessionens data", !anyCoords);
}

// ── 11. Keydown-motsvarigheten (markActive) tar/lagrar inget tangentvärde ──
{
  check("11. markActive() saknar parameter för tangentvärde (endast session, now)", Core.markActive.length === 2);
}

// ── 12–14. Hjälptexter ──
{
  let s = Core.createSession(0);
  Core.recordEvent(s, "help_opened", { helpId: "kp" }, 1000);
  const first = s.rawEvents[s.rawEvents.length - 1];
  check("12. Första öppningen av ett helpId markeras unik", first.meta.isFirstInSession === true);
  Core.recordEvent(s, "help_opened", { helpId: "kp" }, 2000);
  const second = s.rawEvents[s.rawEvents.length - 1];
  check("13. Återöppning markeras inte som ny", second.meta.isFirstInSession === false);
  Core.recordEvent(s, "help_opened", { helpId: "kv" }, 3000);
  const sum = Core.summary(s, 4000);
  check("14. k och kv räknas som separata helpId", sum.help.uniqueHelpIds === 2, sum.help.uniqueHelpIds);
  check("14b. Sammanställningen visar 1 återöppning", sum.help.reopenCount === 1, sum.help.reopenCount);
}

// ── Hjälpfunktion: bygg upp en komplett kontext (ladda scenario + kör N steg) ──
function loadAndRun(s, contextKey, now, initialConfig) {
  Core.recordEvent(s, "scenario_loaded", { scenarioId: contextKey, contextKey }, now);
  const ctx = s.contexts.get(contextKey);
  Object.assign(ctx.currentConfig, initialConfig);
  return ctx;
}

// ── 15–17. Distinkt konfiguration ──
{
  let s = Core.createSession(0);
  const ctxKey = "scenario-a";
  loadAndRun(s, ctxKey, 0, { kp: 1.0 });
  Core.recordEvent(s, "simulation_run", { steps: 25, contextKey: ctxKey }, 1000); // genomfört försök, kp=1.0
  Core.recordEvent(s, "parameter_changed", { field: "kp", value: 1.02, min: null, max: null }, 2000); // +2%, under 5%-tröskeln
  Core.recordEvent(s, "simulation_run", { steps: 25, contextKey: ctxKey }, 3000);
  Core.recordEvent(s, "system_reset", { contextKey: ctxKey }, 4000);
  let sum = Core.summary(s, 5000);
  check("15. Ändring under 5% skapar inte en ny distinkt konfiguration", sum.distinctConfigCount === 1, sum.distinctConfigCount);

  let s2 = Core.createSession(0);
  loadAndRun(s2, ctxKey, 0, { kp: 1.0 });
  Core.recordEvent(s2, "simulation_run", { steps: 25, contextKey: ctxKey }, 1000);
  Core.recordEvent(s2, "parameter_changed", { field: "kp", value: 1.10, min: null, max: null }, 2000); // +10%, över tröskeln
  Core.recordEvent(s2, "simulation_run", { steps: 25, contextKey: ctxKey }, 3000);
  Core.recordEvent(s2, "system_reset", { contextKey: ctxKey }, 4000);
  let sum2 = Core.summary(s2, 5000);
  check("16. Ändring på minst 5% kan ge en ny distinkt konfiguration efter ett genomfört försök", sum2.distinctConfigCount === 2, sum2.distinctConfigCount);

  let s3 = Core.createSession(0);
  loadAndRun(s3, ctxKey, 0, { kp: 1.0 });
  Core.recordEvent(s3, "simulation_run", { steps: 5, contextKey: ctxKey }, 1000); // EJ genomfört (<20 steg)
  Core.recordEvent(s3, "parameter_changed", { field: "kp", value: 1.10, min: null, max: null }, 2000);
  let sum3 = Core.summary(s3, 3000);
  check("17. Distinkt konfiguration räknas inte innan försöket är genomfört", sum3.distinctConfigCount === 0, sum3.distinctConfigCount);
}

// ── 18–19. Genomfört vs avbrutet försök ──
{
  let s = Core.createSession(0);
  loadAndRun(s, "ctx", 0, { kp: 1 });
  Core.recordEvent(s, "simulation_run", { steps: 20, contextKey: "ctx" }, 1000);
  Core.recordEvent(s, "system_reset", { contextKey: "ctx" }, 2000);
  let sum = Core.summary(s, 3000);
  check("18. Ett försök med minst 20 steg räknas som genomfört", sum.attempts.completed === 1, JSON.stringify(sum.attempts));

  let s2 = Core.createSession(0);
  loadAndRun(s2, "ctx", 0, { kp: 1 });
  Core.recordEvent(s2, "simulation_step", { contextKey: "ctx" }, 1000);
  Core.recordEvent(s2, "simulation_step", { contextKey: "ctx" }, 1100);
  Core.recordEvent(s2, "system_reset", { contextKey: "ctx" }, 2000);
  let sum2 = Core.summary(s2, 3000);
  check("19. Ett kortare försök redovisas som avbrutet", sum2.attempts.aborted === 1, JSON.stringify(sum2.attempts));
}

// ── 20. Jämförelsepar ──
{
  let s = Core.createSession(0);
  loadAndRun(s, "ctx", 0, { kp: 1.0, ti: 10 });
  Core.recordEvent(s, "simulation_run", { steps: 25, contextKey: "ctx" }, 1000);
  Core.recordEvent(s, "parameter_changed", { field: "kp", value: 2.0, min: null, max: null }, 2000);
  Core.recordEvent(s, "simulation_run", { steps: 25, contextKey: "ctx" }, 3000);
  Core.recordEvent(s, "system_reset", { contextKey: "ctx" }, 4000);
  const sum = Core.summary(s, 5000);
  check("20. Två genomförda distinkta försök bildar ett jämförelsepar", sum.comparisonPairCount === 1, sum.comparisonPairCount);
  check("20b. Jämförelseparet anger vilket fält som skilde", sum.comparisonPairs[0].changedFields.includes("kp"), JSON.stringify(sum.comparisonPairs));
}

// ── 21–22. Lärstigsprogression ──
{
  let s = Core.createSession(0);
  Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp1", stepIndex: 0, isFinalStep: false, contextKey: "lp1#0" }, 0);
  Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp1", stepIndex: 1, isFinalStep: false, contextKey: "lp1#1" }, 1000);
  Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp1", stepIndex: 0, isFinalStep: false, contextKey: "lp1#0" }, 2000); // bakåt
  const backEvent = s.rawEvents[s.rawEvents.length - 1];
  const sum = Core.summary(s, 3000);
  check("21. Bakåtnavigering till redan uppnått steg ger inte nytt framsteg", sum.learningPaths[0].highestStepIndex === 1, JSON.stringify(sum.learningPaths));
  check("22. Högsta uppnådda stegindex registreras korrekt", sum.learningPaths.find(lp => lp.learningPathId === "lp1").highestStepIndex === 1);
}

// ── 23–24. Mätning vs facit ──
{
  let s = Core.createSession(0);
  Core.recordEvent(s, "measurement_started", {}, 0);
  Core.recordEvent(s, "measurement_facit_opened", {}, 1000);
  const sum = Core.summary(s, 2000);
  check("23. measurement_started ensam skapar ingen justeringsräkning", (sum.eventCounts.measurement_adjusted || 0) === 0);
  check("24. Facit räknas separat, inte som measurement_adjusted", sum.eventCounts.measurement_facit_opened === 1 && !sum.eventCounts.measurement_adjusted);
  Core.recordEvent(s, "measurement_adjusted", { field: "mpPv0" }, 1500);
  const sum2 = Core.summary(s, 2000);
  check("24b. En faktisk justering räknas separat och korrekt", sum2.eventCounts.measurement_adjusted === 1);
}

// ── 25–26. Reset / ny session ──
{
  const s1 = Core.createSession(0);
  Core.recordEvent(s1, "simulation_step", {}, 100);
  const s2 = Core.createSession(0); // motsvarar reset()/sidomladdning — helt ny session
  const sum2 = Core.summary(s2, 100);
  check("25/26. En ny session är helt nollställd oavsett tidigare sessioner", sum2.totalSimulatedSteps === 0 && sum2.acceptedActivitySignals === 0 && sum2.rawEventCount === 0);
}

// ── 27. Råhändelseloggens minnesgräns ──
{
  let s = Core.createSession(0, { maxRawEvents: 5 });
  for (let i = 0; i < 8; i++) Core.recordEvent(s, "simulation_step", {}, i * 10);
  const sum = Core.summary(s, 100);
  check("27. Råhändelseloggen begränsas till konfigurerat max", sum.rawEventCount === 5, sum.rawEventCount);
  check("27b. Borttagna händelser räknas", sum.droppedRawEventCount === 3, sum.droppedRawEventCount);
  check("27c. Aggregerade räknare (counts) påverkas inte av loggens tak", sum.eventCounts.simulation_step === 8, sum.eventCounts.simulation_step);
}

// ── 28. Ingen persistens ──
{
  const coreSrc = fs.readFileSync(CORE_PATH, "utf8");
  const glueSrc = fs.readFileSync(GLUE_PATH, "utf8");
  // Kräver en efterföljande "." (faktisk API-användning) för att undvika
  // falska träffar i förklarande kommentarer som nämner dessa API:er.
  const persistencePattern = /localStorage\.|sessionStorage\.|indexedDB\.|document\.cookie/;
  check("28. Ingen persistens (localStorage/sessionStorage/IndexedDB/cookies) i kärnan eller DOM-kopplingen",
    !persistencePattern.test(coreSrc) && !persistencePattern.test(glueSrc));
}

// ── 29. Ingen nätverkstrafik ──
{
  const coreSrc = fs.readFileSync(CORE_PATH, "utf8");
  const glueSrc = fs.readFileSync(GLUE_PATH, "utf8");
  const networkPattern = /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/;
  check("29. Ingen nätverkstrafik (fetch/XHR/WebSocket/Beacon) i kärnan eller DOM-kopplingen",
    !networkPattern.test(coreSrc) && !networkPattern.test(glueSrc));
}

// ── 30. Simulatorns kärnkod är oberörd ──
{
  const simCorePath = path.join(APP_DIR, "sim-core.js");
  const simCoreSrc = fs.readFileSync(simCorePath, "utf8");
  check("30. sim-core.js refererar inte aktivitetsprototypen (helt oberoende av GAM-002)",
    !simCoreSrc.includes("activity") && !simCoreSrc.includes("Activity"));
}

// ══ GAM-003A.2 — comparisonGroup: jämförelser över kontextgränser ══

// ── 31. Två genomförda försök i samma comparisonGroup, olika kontext, bildar ett gruppar ──
{
  let s = Core.createSession(0);
  let now = 0;
  now += 1000; Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: "lp#0", comparisonGroup: "g1" }, now);
  now += 1000; Core.recordEvent(s, "parameter_changed", { field: "kp", value: 1, contextKey: "lp#0" }, now);
  for (let i = 0; i < 20; i++) { now += 1000; Core.recordEvent(s, "simulation_run", { steps: 1, contextKey: "lp#0" }, now); }
  now += 1000; Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp", stepIndex: 1, isFinalStep: false, contextKey: "lp#1", comparisonGroup: "g1" }, now);
  now += 1000; Core.recordEvent(s, "parameter_changed", { field: "kp", value: 5, contextKey: "lp#1" }, now);
  for (let i = 0; i < 20; i++) { now += 1000; Core.recordEvent(s, "simulation_run", { steps: 1, contextKey: "lp#1" }, now); }
  Core.finalizeAllAttempts(s, now + 1000);
  check("31. Två genomförda försök i samma comparisonGroup (olika kontext) bildar ett gruppar",
    s.groupComparisonPairs.length === 1 && s.groupComparisonPairs[0].group === "g1", JSON.stringify(s.groupComparisonPairs));
}

// ── 32. Fyra försök i samma grupp ger TRE par (kedjat), inte sex (alla kombinationer) ──
{
  let s = Core.createSession(0);
  let now = 0;
  const steps = [
    { idx: 0, val: 1 }, { idx: 1, val: 2 }, { idx: 2, val: 3 }, { idx: 3, val: 4 },
  ];
  steps.forEach(({ idx, val }) => {
    now += 1000; Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp2", stepIndex: idx, isFinalStep: idx === 3, contextKey: "lp2#" + idx, comparisonGroup: "g2" }, now);
    now += 1000; Core.recordEvent(s, "parameter_changed", { field: "kp", value: val, contextKey: "lp2#" + idx }, now);
    for (let i = 0; i < 20; i++) { now += 1000; Core.recordEvent(s, "simulation_run", { steps: 1, contextKey: "lp2#" + idx }, now); }
  });
  Core.finalizeAllAttempts(s, now + 1000);
  check("32. Fyra försök i en grupp ger tre kedjade par, inte sex (C(4,2))",
    s.groupComparisonPairs.length === 3, "fick " + s.groupComparisonPairs.length);
}

// ── 33. Befintlig inom-kontext-jämförelse dubbelräknas INTE som gruppar ──
{
  let s = Core.createSession(0);
  let now = 0;
  // Två distinkta konfigurationer INOM SAMMA kontext, med comparisonGroup satt.
  now += 1000; Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp3", stepIndex: 0, isFinalStep: false, contextKey: "lp3#0", comparisonGroup: "g3" }, now);
  now += 1000; Core.recordEvent(s, "parameter_changed", { field: "kp", value: 1, contextKey: "lp3#0" }, now);
  for (let i = 0; i < 20; i++) { now += 1000; Core.recordEvent(s, "simulation_run", { steps: 1, contextKey: "lp3#0" }, now); }
  now += 1000; Core.recordEvent(s, "parameter_changed", { field: "kp", value: 9, contextKey: "lp3#0" }, now); // finaliserar första, startar andra, samma kontext
  for (let i = 0; i < 20; i++) { now += 1000; Core.recordEvent(s, "simulation_run", { steps: 1, contextKey: "lp3#0" }, now); }
  Core.finalizeAllAttempts(s, now + 1000);
  check("33a. Inom-kontext-paret registreras en gång i comparisonPairs", s.comparisonPairs.length === 1);
  check("33b. Samma par registreras INTE också som ett gruppar (inget dubbelt)", s.groupComparisonPairs.length === 0, "fick " + s.groupComparisonPairs.length);
}

// ── 34. Ingen comparisonGroup deklarerad => inget gruppar, oförändrat beteende ──
{
  let s = Core.createSession(0);
  let now = 0;
  now += 1000; Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp4", stepIndex: 0, isFinalStep: false, contextKey: "lp4#0" }, now); // ingen comparisonGroup
  now += 1000; Core.recordEvent(s, "parameter_changed", { field: "kp", value: 1, contextKey: "lp4#0" }, now);
  for (let i = 0; i < 20; i++) { now += 1000; Core.recordEvent(s, "simulation_run", { steps: 1, contextKey: "lp4#0" }, now); }
  now += 1000; Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp4", stepIndex: 1, isFinalStep: false, contextKey: "lp4#1" }, now);
  now += 1000; Core.recordEvent(s, "parameter_changed", { field: "kp", value: 5, contextKey: "lp4#1" }, now);
  for (let i = 0; i < 20; i++) { now += 1000; Core.recordEvent(s, "simulation_run", { steps: 1, contextKey: "lp4#1" }, now); }
  Core.finalizeAllAttempts(s, now + 1000);
  check("34. Utan deklarerat comparisonGroup bildas inget gruppar (oförändrat befintligt beteende)",
    s.groupComparisonPairs.length === 0 && s.comparisonPairs.length === 0);
}

// ── 35. Kort (ej genomfört) försök i gruppen bildar aldrig ett gruppar ──
{
  let s = Core.createSession(0);
  let now = 0;
  now += 1000; Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp5", stepIndex: 0, isFinalStep: false, contextKey: "lp5#0", comparisonGroup: "g5" }, now);
  now += 1000; Core.recordEvent(s, "parameter_changed", { field: "kp", value: 1, contextKey: "lp5#0" }, now);
  for (let i = 0; i < 20; i++) { now += 1000; Core.recordEvent(s, "simulation_run", { steps: 1, contextKey: "lp5#0" }, now); } // genomfört
  now += 1000; Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp5", stepIndex: 1, isFinalStep: false, contextKey: "lp5#1", comparisonGroup: "g5" }, now);
  now += 1000; Core.recordEvent(s, "parameter_changed", { field: "kp", value: 5, contextKey: "lp5#1" }, now);
  for (let i = 0; i < 5; i++) { now += 1000; Core.recordEvent(s, "simulation_run", { steps: 1, contextKey: "lp5#1" }, now); } // EJ genomfört (<20 steg)
  Core.finalizeAllAttempts(s, now + 1000);
  check("35. Ett kort, ej genomfört försök i gruppen ger inget gruppar",
    s.groupComparisonPairs.length === 0, "fick " + s.groupComparisonPairs.length);
}

// ── 36. Samma distinkta konfiguration upprepad i en NY kontext inom gruppen bildar ändå ett par (ingen A-B/B-A-dubblett, bara kedjat framåt) ──
{
  let s = Core.createSession(0);
  let now = 0;
  now += 1000; Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp6", stepIndex: 0, isFinalStep: false, contextKey: "lp6#0", comparisonGroup: "g6" }, now);
  now += 1000; Core.recordEvent(s, "parameter_changed", { field: "kp", value: 1, contextKey: "lp6#0" }, now);
  for (let i = 0; i < 20; i++) { now += 1000; Core.recordEvent(s, "simulation_run", { steps: 1, contextKey: "lp6#0" }, now); }
  now += 1000; Core.recordEvent(s, "learning_step_reached", { learningPathId: "lp6", stepIndex: 1, isFinalStep: false, contextKey: "lp6#1", comparisonGroup: "g6" }, now);
  now += 1000; Core.recordEvent(s, "parameter_changed", { field: "kp", value: 1, contextKey: "lp6#1" }, now); // samma VÄRDE, men NY kontext => ny signatur i den kontexten
  for (let i = 0; i < 20; i++) { now += 1000; Core.recordEvent(s, "simulation_run", { steps: 1, contextKey: "lp6#1" }, now); }
  Core.finalizeAllAttempts(s, now + 1000);
  check("36. Endast EN riktning (senaste->ny) prövas — inget A-B/B-A-dubbelpar",
    s.groupComparisonPairs.length === 1, "fick " + s.groupComparisonPairs.length);
}

// ── 37. app.js skickar comparisonGroup vidare till learning_step_reached ──
{
  const appJs = fs.readFileSync(APP_JS_PATH, "utf8");
  check("37. app.js läser steg.comparisonGroup och skickar det med learning_step_reached",
    /comparisonGroup/.test(appJs) && /learning_step_reached["'],?\s*\{[^}]*comparisonGroup/.test(appJs));
}

// ── 38. summary() exponerar gruppjämförelser för felsökning ──
{
  let s = Core.createSession(0);
  const sum = Core.summary(s, 1000);
  check("38. summary() innehåller groupComparisonPairCount/groupComparisonPairs",
    typeof sum.groupComparisonPairCount === "number" && Array.isArray(sum.groupComparisonPairs));
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
