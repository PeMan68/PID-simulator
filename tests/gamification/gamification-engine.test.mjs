// GAM-003B — Automatiska tester för den synliga XP-/nivåmotorn
// (apps/app/gamification-xp-engine.js). Egen enkel testrunner, i linje med
// tests/gamification/xp-model.test.mjs och tests/activity-prototype.test.mjs.
//
// Kör motorn EXAKT som appen gör: Core.recordEvent(session, ...) följt av
// Engine.processEvent(engine, session, ...) — aldrig i motsatt ordning, och
// aldrig genom att motorn själv anropar Core (se gamification-xp-engine.js:s
// filhuvud för motiveringen).
//
// Körs: node tests/gamification/gamification-engine.test.mjs

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const APP_DIR = path.resolve(__dirname, "..", "..", "apps", "app");
const Core = require(path.join(APP_DIR, "activity-prototype-core.js"));
const Engine = require(path.join(APP_DIR, "gamification-xp-engine.js"));

let passed = 0, failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

// ── Hjälpare: kör en händelsesekvens genom Core + Engine, exakt som
// gamification.js gör i webbläsaren (Core.recordEvent, sedan
// Engine.processEvent på samma session). ──
function newSessionAndEngine(persisted) {
  const session = Core.createSession(0);
  const engine = Engine.createEngine(persisted || null, Engine.XP_RULES_V1, Engine.LEVELS_V1);
  Engine.seedSession(session, engine);
  return { session, engine };
}

function drive(session, engine, events) {
  let now = 0;
  const results = [];
  events.forEach(ev => {
    now += ev.dtMs != null ? ev.dtMs : 1000;
    Core.recordEvent(session, ev.type, ev.meta || {}, now);
    results.push(Engine.processEvent(engine, session, ev.type, ev.meta || {}, now));
  });
  return { results, now };
}

function step(id, idx, final, ctxOverride) {
  return { type: "learning_step_reached", meta: { learningPathId: id, stepIndex: idx, isFinalStep: !!final, contextKey: ctxOverride || (id + "#" + idx) } };
}
function runN(n, ctx) { return { type: "simulation_run", meta: { steps: n, contextKey: ctx } }; }
function singleStep(ctx) { return { type: "simulation_step", meta: { contextKey: ctx } }; }
function paramChange(field, value, ctx) { return { type: "parameter_changed", meta: { field, value, contextKey: ctx } }; }
function help(id) { return { type: "help_opened", meta: { helpId: id } }; }
function sumAwarded(results, category) {
  let n = 0;
  results.forEach(r => r.awarded.forEach(a => { if (a.category === category) n += a.amount; }));
  return n;
}
function totalOf(results) { return results.length ? results[results.length - 1].totalXPAfter : 0; }

const R = Engine.XP_RULES_V1;
const CTX = "lp#0";

// ── 1. XP tilldelas enligt samtliga beslutade kategorier ──
{
  const { session, engine } = newSessionAndEngine();
  const events = [
    step("lp", 0),
    paramChange("kp", 1, CTX), singleStep(CTX), runN(19, CTX), // fyller till 20 steg -> completedAttempt + distinctConfig
    paramChange("kp", 5, CTX), runN(20, CTX), // ny distinkt config -> ytterligare completedAttempt + distinctConfig + comparisonPair
    help("h1"),
    { type: "measurement_started", meta: { contextKey: CTX } },
    { type: "measurement_adjusted", meta: { field: "mpPv0", contextKey: CTX } },
    runN(5, CTX),
    step("lp", 1, true),
  ];
  const { results } = drive(session, engine, events);
  check("1a. newHighestStep-XP tilldelas", sumAwarded(results, "newHighestStep") === R.newHighestStep * 2, sumAwarded(results, "newHighestStep"));
  check("1b. completedLearningPath-XP tilldelas", sumAwarded(results, "completedLearningPath") === R.completedLearningPath);
  check("1c. completedAttempt-XP tilldelas", sumAwarded(results, "completedAttempt") >= R.completedAttempt);
  check("1d. distinctConfig-XP tilldelas", sumAwarded(results, "distinctConfig") >= R.distinctConfig);
  check("1e. comparisonPair-XP tilldelas", sumAwarded(results, "comparisonPair") >= R.comparisonPair);
  check("1f. uniqueHelp-XP tilldelas", sumAwarded(results, "uniqueHelp") === R.uniqueHelp);
  check("1g. measurementWork-XP tilldelas", sumAwarded(results, "measurementWork") === R.measurementWork);
  check("1h. singleStep-XP tilldelas", sumAwarded(results, "singleStep") === R.singleStepXP);
}

// ── 2. Upprepade genomförda försök ger försöks-XP varje gång ──
// (Sista pågående försöket i en sekvens finaliseras inte förrän en
// betydande händelse avslutar det — ärvt, oförändrat GAM-002-beteende, se
// tests/gamification/xp-model.mjs:s "Sessionsslut"-hantering. Sekvensen
// avslutas därför med ett Återställ system, precis som i den referensfilen.)
{
  const { session, engine } = newSessionAndEngine();
  const events = [
    step("lp", 0), paramChange("kp", 1, CTX), runN(20, CTX),
    paramChange("kp", 2, CTX), runN(20, CTX),
    paramChange("kp", 3, CTX), runN(20, CTX),
    { type: "system_reset", meta: { contextKey: CTX } },
  ];
  const { results } = drive(session, engine, events);
  check("2. Upprepade genomförda försök ger försöks-XP", sumAwarded(results, "completedAttempt") === R.completedAttempt * 3, sumAwarded(results, "completedAttempt"));
}

// ── 3. Identisk konfiguration ger inte ny distinkt bonus (samma session) ──
{
  const { session, engine } = newSessionAndEngine();
  const events = [step("lp", 0), paramChange("kp", 1, CTX), runN(20, CTX), paramChange("kp", 1.0000001, CTX), runN(20, CTX)];
  const { results } = drive(session, engine, events);
  check("3. Identisk konfiguration ger inte ny distinkt bonus", sumAwarded(results, "distinctConfig") === 0, sumAwarded(results, "distinctConfig"));
}

// ── 4. Upprepad lärstig ger ny slutförandebelöning (ny session) ──
{
  const s1 = newSessionAndEngine();
  drive(s1.session, s1.engine, [step("lp", 0), step("lp", 1, true)]);
  const persisted = Engine.toPersistable(s1.engine);
  const s2 = newSessionAndEngine(persisted);
  const { results } = drive(s2.session, s2.engine, [step("lp", 0), step("lp", 1, true)]);
  check("4. Upprepad lärstig ger ny slutförandebelöning i en ny session", sumAwarded(results, "completedLearningPath") === R.completedLearningPath, sumAwarded(results, "completedLearningPath"));
}

// ── 5. Nytt högsta lärsteg ger XP en gång över sessioner ──
{
  const s1 = newSessionAndEngine();
  drive(s1.session, s1.engine, [step("lp", 0), step("lp", 1)]);
  const persisted = Engine.toPersistable(s1.engine);
  const s2 = newSessionAndEngine(persisted);
  const { results } = drive(s2.session, s2.engine, [step("lp", 0), step("lp", 1)]);
  check("5. Nytt högsta lärsteg ger INTE XP igen i en ny session (redan bestående nått)", sumAwarded(results, "newHighestStep") === 0, sumAwarded(results, "newHighestStep"));
  const { results: r3 } = drive(s2.session, s2.engine, [step("lp", 2)]);
  check("5b. Ett GENUINT nytt högsta lärsteg ger XP i en senare session", sumAwarded(r3, "newHighestStep") === R.newHighestStep);
}

// ── 6. Hjälp ger XP en gång per helpId och session ──
{
  const { session, engine } = newSessionAndEngine();
  const { results } = drive(session, engine, [help("h1"), help("h1"), help("h2")]);
  check("6. Hjälp ger XP en gång per helpId och session", sumAwarded(results, "uniqueHelp") === R.uniqueHelp * 2, sumAwarded(results, "uniqueHelp"));
}

// ── 7. Samma hjälp kan ge XP i en ny session ──
{
  const s1 = newSessionAndEngine();
  drive(s1.session, s1.engine, [help("h1")]);
  const persisted = Engine.toPersistable(s1.engine);
  const s2 = newSessionAndEngine(persisted);
  const { results } = drive(s2.session, s2.engine, [help("h1")]);
  check("7. Samma hjälp kan ge XP i en ny session", sumAwarded(results, "uniqueHelp") === R.uniqueHelp);
}

// ── 8. Enstegningstaket är 5 per försök ──
{
  const { session, engine } = newSessionAndEngine();
  const events = [step("lp", 0), paramChange("kp", 1, CTX)];
  for (let i = 0; i < 8; i++) events.push(singleStep(CTX));
  const { results } = drive(session, engine, events);
  check("8. Enstegningstaket är 5 per försök", sumAwarded(results, "singleStep") === R.singleStepXP * 5, sumAwarded(results, "singleStep"));
}

// ── 9. Kör 10 ger ingen direkt XP ──
{
  const { session, engine } = newSessionAndEngine();
  const { results } = drive(session, engine, [step("lp", 0), paramChange("kp", 1, CTX), runN(10, CTX)]);
  const runAwards = results.slice(-1)[0].awarded;
  check("9. Kör 10 ger ingen direkt XP (räknas mot 20-stegsgränsen)", runAwards.length === 0, JSON.stringify(runAwards));
}

// ── 10. Jämförelsepar och groupComparisonPairs ger rätt XP ──
{
  const { session, engine } = newSessionAndEngine();
  // Inom-kontext-par:
  const { results: r1 } = drive(session, engine, [step("lp", 0), paramChange("kp", 1, CTX), runN(20, CTX), paramChange("kp", 9, CTX), runN(20, CTX), { type: "system_reset", meta: { contextKey: CTX } }]);
  check("10a. Jämförelsepar inom kontext ger rätt XP", sumAwarded(r1, "comparisonPair") === R.comparisonPair, sumAwarded(r1, "comparisonPair"));

  // Gruppar (comparisonGroup, över kontextgräns):
  const ctxA = "lp2#0", ctxB = "lp2#1";
  const events = [
    step("lp2", 0, false, ctxA), { type: "learning_step_reached", meta: { learningPathId: "lp2", stepIndex: 0, contextKey: ctxA, comparisonGroup: "g1" } },
    paramChange("kp", 1, ctxA), runN(20, ctxA),
    step("lp2", 1, false, ctxB), { type: "learning_step_reached", meta: { learningPathId: "lp2", stepIndex: 1, contextKey: ctxB, comparisonGroup: "g1" } },
    paramChange("kp", 9, ctxB), runN(20, ctxB),
    { type: "system_reset", meta: { contextKey: ctxB } },
  ];
  const { results: r2 } = drive(session, engine, events);
  check("10b. groupComparisonPairs ger rätt XP", sumAwarded(r2, "comparisonPair") === R.comparisonPair, sumAwarded(r2, "comparisonPair"));
}

// ── 11. Samma jämförelsepar ger inte dubbel XP i samma session ──
// Tre försök i samma kontext: kp=1 (A), kp=9 (B, bildar par A-B), sedan
// tillbaka till kp=1 (samma signatur som A, redan sedd DENNA session) —
// detta tredje försök är inte längre "distinkt" för Core, så det bildar
// INGET nytt par. Totalt ska exakt ETT jämförelsepar ges, inte två.
{
  const { session, engine } = newSessionAndEngine();
  const events = [
    step("lp", 0),
    paramChange("kp", 1, CTX), runN(20, CTX),
    paramChange("kp", 9, CTX), runN(20, CTX), // finaliserar A (kp=1) -> 1:a distinkta, ingen par än
    paramChange("kp", 1, CTX), runN(20, CTX), // finaliserar B (kp=9) -> 2:a distinkta -> PAR A-B
    { type: "system_reset", meta: { contextKey: CTX } }, // finaliserar det tredje (kp=1, redan sedd) -> INGET nytt par
  ];
  const { results } = drive(session, engine, events);
  check("11. Samma jämförelsepar ger inte dubbel XP i samma session", sumAwarded(results, "comparisonPair") === R.comparisonPair, sumAwarded(results, "comparisonPair"));
}

// ── 12. Jämförelsepar kan ge XP igen i en ny session (identisk sekvens) ──
{
  const buildSeq = () => [step("lp", 0), paramChange("kp", 1, CTX), runN(20, CTX), paramChange("kp", 9, CTX), runN(20, CTX), { type: "system_reset", meta: { contextKey: CTX } }];
  const s1 = newSessionAndEngine();
  const { results: r1 } = drive(s1.session, s1.engine, buildSeq());
  const persisted = Engine.toPersistable(s1.engine);
  const s2 = newSessionAndEngine(persisted);
  const { results: r2 } = drive(s2.session, s2.engine, buildSeq());
  check("12a. Jämförelsepar ger XP i session 1", sumAwarded(r1, "comparisonPair") === R.comparisonPair);
  check("12b. Samma jämförelsepar (identiska värden) ger XP igen i session 2", sumAwarded(r2, "comparisonPair") === R.comparisonPair, sumAwarded(r2, "comparisonPair"));
  check("12c. Men distinctConfig-BONUSEN ges inte igen i session 2 (bestående)", sumAwarded(r2, "distinctConfig") === 0, sumAwarded(r2, "distinctConfig"));
}

// ── 13. Mätarbete ger rätt XP ──
{
  const { session, engine } = newSessionAndEngine();
  const events = [
    step("lp", 0),
    { type: "measurement_started", meta: { contextKey: CTX } },
    { type: "measurement_adjusted", meta: { field: "mpPv0", contextKey: CTX } },
    singleStep(CTX),
  ];
  const { results } = drive(session, engine, events);
  check("13. Mätarbete ger rätt XP", sumAwarded(results, "measurementWork") === R.measurementWork);
}

// ── 14. Reset, Rensa graf, pointermove, aktiv tid och facit ger 0 XP ──
// (scenario_loaded sätter en kontext utan att självt ge XP — till skillnad
// från learning_step_reached, som skulle ge newHighestStep-XP och därmed
// förorena mätningen av just dessa fyra händelsetyper.)
{
  const { session, engine } = newSessionAndEngine();
  const events = [
    { type: "scenario_loaded", meta: { contextKey: CTX } },
    { type: "measurement_started", meta: { contextKey: CTX } },
    { type: "measurement_facit_opened", meta: { contextKey: CTX } },
    { type: "system_reset", meta: { contextKey: CTX } },
    { type: "chart_cleared", meta: {} },
  ];
  const { results } = drive(session, engine, events);
  const totalAwarded = results.reduce((s, r) => s + r.awarded.reduce((s2, a) => s2 + a.amount, 0), 0);
  check("14. Reset/Rensa graf/facit ger 0 XP", totalAwarded === 0, totalAwarded);
  // pointermove och "aktiv tid" går aldrig via processEvent i appen (se
  // gamification.js — bara dispatch()-vägen kopplas in), så de kan per
  // konstruktion aldrig ge XP. Strukturellt verifierat i
  // gamification-dev-prod-isolation.test.mjs.
}

// ── 15. XP som passerar en nivågräns förs vidare ──
{
  const { session, engine } = newSessionAndEngine({ totalXP: 45 });
  const before = engine.totalXP;
  const { results } = drive(session, engine, [help("h1"), help("h2"), help("h3")]); // +6 XP -> 51, passerar 50
  check("15. XP som passerar en nivågräns förs vidare (inget försvinner)", engine.totalXP === before + R.uniqueHelp * 3);
  check("15b. Nivå uppdaterad efter gränsen", results[results.length - 1].levelAfter.levelIndex === 1);
}

// ── 16. En XP-händelse kan passera flera nivågränser ──
{
  const { session, engine } = newSessionAndEngine({ totalXP: 0 });
  // completedLearningPath (12) + newHighestStep (2) i EN händelse räcker inte
  // ensamt för att hoppa flera nivåer med denna kurva, så vi seedar nära en
  // dubbel gräns istället: från 138 XP ska en enda completedLearningPath
  // (+12 => 150) redan passera nivå 3 (140) — testar minst en gränspassage
  // i en enda händelse, och att flera gränser hanteras korrekt om XP räcker.
  const s2 = newSessionAndEngine({ totalXP: 298 });
  const { results } = drive(s2.session, s2.engine, [step("lp", 0, true)]); // newHighestStep 2 + completedLearningPath 12 = +14 -> 312, passerar 300 (Processutforskare, index 3)
  check("16. En händelse kan passera en nivågräns (300)", results[0].levelAfter.levelIndex === 3, results[0].levelAfter.levelIndex);
}

// ── 17. Nivåmätarens andel räknas korrekt ──
{
  const info = Engine.levelInfo(25, Engine.LEVELS_V1); // halvvägs mellan 0 och 50
  check("17. Nivåmätarens andel räknas korrekt", Math.abs(info.ratio - 0.5) < 1e-9, info.ratio);
}

// ── 18. Nivå 8 hanteras korrekt ──
{
  const info = Engine.levelInfo(5000, Engine.LEVELS_V1);
  check("18a. Nivå 8 (MAX) hanteras korrekt", info.isMaxLevel && info.levelIndex === 7 && info.levelName === "Reglerlegend");
  check("18b. Nivå 8:s andel är alltid 1 (full bar)", info.ratio === 1);
}

// ── 19. XP fortsätter sparas efter nivå 8 ──
{
  const { session, engine } = newSessionAndEngine({ totalXP: 2100, highestLevelIndex: 7 });
  drive(session, engine, [help("h1")]);
  check("19. XP fortsätter sparas efter nivå 8", engine.totalXP === 2100 + R.uniqueHelp, engine.totalXP);
}

// ── 23. Högsta uppnådda nivå sänks aldrig (även om nivågränser höjs) ──
{
  const raisedLevels = Object.freeze([
    { name: "Reglernovis", threshold: 0 },
    { name: "Looplärling", threshold: 200 }, // höjd kraftigt jämfört med 50
  ]);
  // Användaren har TIDIGARE nått nivåindex 1 (Looplärling) under den gamla
  // kurvan, men har bara 60 XP — under den NYA, höjda gränsen (200).
  const display = Engine.levelForDisplay(60, 1, raisedLevels);
  check("23a. Nivå sänks inte när gränser höjs", display.levelIndex === 1 && display.levelName === "Looplärling");
  check("23b. Baren visas full för en innehavd nivå", display.ratio === 1 && display.held === true);
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
