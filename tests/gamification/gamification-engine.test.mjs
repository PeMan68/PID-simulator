// GAM-003B/GAM-003C — Automatiska tester för den synliga XP-/nivåmotorn
// (apps/app/gamification-xp-engine.js). Egen enkel testrunner, i linje med
// tests/gamification/xp-model.test.mjs och tests/activity-prototype.test.mjs.
//
// Kör motorn EXAKT som appen gör: Core.recordEvent(session, ...) följt av
// Engine.processEvent(engine, session, ...) — aldrig i motsatt ordning, och
// aldrig genom att motorn själv anropar Core (se gamification-xp-engine.js:s
// filhuvud för motiveringen).
//
// GAM-003C: "nytt högsta lärsteg" och "unik hjälptext" bokförs inte längre
// omedelbart — de kräver att ett kvalificeringsvillkor (lästid/aktivitet/
// tid) uppfylls FÖRST, utvärderat vid varje efterföljande händelse
// (`evaluatePending`, körs internt av `processEvent`). Tester som bara vill
// testa ANDRA kategorier (försök, jämförelsepar, mätarbete, enstegning)
// lämnas medvetet oförändrade även om ett steg råkar klassas som
// "scenario" (kräver bara att NÅGON aktivitetshändelse redan skickats,
// vilket dessa sekvenser redan gör) — se filens ursprungliga GAM-003B-delar.
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

// `startNow` (valfri): fortsätter klockan från ett tidigare drive()-anrops
// sluttid — nödvändigt för tvåfas-tester som kontrollerar "inte kvalificerad
// än" och sedan "kvalificerad efter ytterligare X ms", där båda faserna
// måste dela SAMMA session.activeMs-tidslinje.
function drive(session, engine, events, startNow) {
  let now = startNow || 0;
  const results = [];
  events.forEach(ev => {
    now += ev.dtMs != null ? ev.dtMs : 1000;
    Core.recordEvent(session, ev.type, ev.meta || {}, now);
    results.push(Engine.processEvent(engine, session, ev.type, ev.meta || {}, now));
  });
  return { results, now };
}

// Standardsteg: klassas som "scenario" (kräver bara aktivitet, ingen
// lästid) om inget annat anges — bekvämt för tester som handlar om andra
// XP-kategorier än stegkvalificeringen själv.
function step(id, idx, final, ctxOverride, extra) {
  return { type: "learning_step_reached", meta: Object.assign({ learningPathId: id, stepIndex: idx, isFinalStep: !!final, contextKey: ctxOverride || (id + "#" + idx), stepType: "scenario", wordCount: 0 }, extra || {}) };
}
function theoryStep(id, idx, wordCount, ctxOverride) {
  return step(id, idx, false, ctxOverride, { stepType: "theory", wordCount });
}
function mixedStep(id, idx, wordCount, ctxOverride) {
  return step(id, idx, false, ctxOverride, { stepType: "scenario", wordCount });
}
function runN(n, ctx) { return { type: "simulation_run", meta: { steps: n, contextKey: ctx } }; }
function singleStep(ctx) { return { type: "simulation_step", meta: { contextKey: ctx } }; }
function paramChange(field, value, ctx) { return { type: "parameter_changed", meta: { field, value, contextKey: ctx } }; }
function help(id, dtMs) { const e = { type: "help_opened", meta: { helpId: id } }; if (dtMs != null) e.dtMs = dtMs; return e; }
function helpClosed(dtMs) { const e = { type: "help_closed", meta: {} }; if (dtMs != null) e.dtMs = dtMs; return e; }
function tick(dtMs, ctx) { return { type: "measurement_facit_opened", meta: { contextKey: ctx }, dtMs }; } // neutral "tid går"-händelse: 0 XP, ingen aktivitetstyp
function sumAwarded(results, category) {
  let n = 0;
  results.forEach(r => r.awarded.forEach(a => { if (a.category === category) n += a.amount; }));
  return n;
}

const R = Engine.XP_RULES_V1;
const CTX = "lp#0";

// ── 1. XP tilldelas enligt samtliga beslutade kategorier ──
{
  const { session, engine } = newSessionAndEngine();
  const events = [
    step("lp", 0),
    paramChange("kp", 1, CTX), singleStep(CTX), runN(19, CTX), // fyller till 20 steg -> completedAttempt + distinctConfig; paramChange kvalar även steg 0 (scenario: bara aktivitet krävs)
    paramChange("kp", 5, CTX), runN(20, CTX), // ny distinkt config -> ytterligare completedAttempt + distinctConfig + comparisonPair
    help("h1"),
    { type: "measurement_started", meta: { contextKey: CTX } },
    { type: "measurement_adjusted", meta: { field: "mpPv0", contextKey: CTX } },
    runN(5, CTX),
    tick(3100, CTX), // låter h1:s 3s-hjälpkvalificering hinna klart
    step("lp", 1, true),
    paramChange("kp", 1, "lp#1"), // ger steg 1 sin aktivitet -> kvalar in omedelbart (scenario)
  ];
  const { results } = drive(session, engine, events);
  check("1a. newHighestStep-XP tilldelas (efter kvalificering)", sumAwarded(results, "newHighestStep") === R.newHighestStep * 2, sumAwarded(results, "newHighestStep"));
  check("1b. completedLearningPath-XP tilldelas", sumAwarded(results, "completedLearningPath") === R.completedLearningPath);
  check("1c. completedAttempt-XP tilldelas", sumAwarded(results, "completedAttempt") >= R.completedAttempt);
  check("1d. distinctConfig-XP tilldelas", sumAwarded(results, "distinctConfig") >= R.distinctConfig);
  check("1e. comparisonPair-XP tilldelas", sumAwarded(results, "comparisonPair") >= R.comparisonPair);
  check("1f. uniqueHelp-XP tilldelas (efter 3s kvalificering)", sumAwarded(results, "uniqueHelp") === R.uniqueHelp);
  check("1g. measurementWork-XP tilldelas", sumAwarded(results, "measurementWork") === R.measurementWork);
  check("1h. singleStep-XP tilldelas", sumAwarded(results, "singleStep") === R.singleStepXP);
}

// ── 2. Upprepade genomförda försök ger försöks-XP varje gång ──
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

// ── 5. Nytt högsta lärsteg ger XP en gång över sessioner (efter kvalificering) ──
{
  const s1 = newSessionAndEngine();
  drive(s1.session, s1.engine, [step("lp", 0), paramChange("kp", 1, CTX), step("lp", 1, false, "lp#1"), paramChange("kp", 1, "lp#1")]);
  const persisted = Engine.toPersistable(s1.engine);
  const s2 = newSessionAndEngine(persisted);
  const { results } = drive(s2.session, s2.engine, [step("lp", 0), paramChange("kp", 1, CTX), step("lp", 1, false, "lp#1"), paramChange("kp", 1, "lp#1")]);
  check("5. Nytt högsta lärsteg ger INTE XP igen i en ny session (redan bestående nått)", sumAwarded(results, "newHighestStep") === 0, sumAwarded(results, "newHighestStep"));
  const { results: r3 } = drive(s2.session, s2.engine, [step("lp", 2, false, "lp#2"), paramChange("kp", 1, "lp#2")]);
  check("5b. Ett GENUINT nytt högsta lärsteg ger XP i en senare session", sumAwarded(r3, "newHighestStep") === R.newHighestStep, sumAwarded(r3, "newHighestStep"));
}

// ── 6. Snabbt hjälptextbyte (under 3s) ger INGEN XP för någon av dem ──
{
  const { session, engine } = newSessionAndEngine();
  const { results } = drive(session, engine, [help("h1"), help("h1"), help("h2")]);
  check("6. Byte av hjälptext inom 3s avbryter kvalificeringen (0 XP)", sumAwarded(results, "uniqueHelp") === 0, sumAwarded(results, "uniqueHelp"));
}

// ── 6b. Två hjälptexter som VAR OCH EN hinner vara aktiv 3s ger XP för båda ──
{
  const { session, engine } = newSessionAndEngine();
  const events = [help("h1"), tick(3100), help("h2"), tick(3100)];
  const { results } = drive(session, engine, events);
  check("6b. Två hjälptexter, var och en aktiv >=3s, ger XP för båda", sumAwarded(results, "uniqueHelp") === R.uniqueHelp * 2, sumAwarded(results, "uniqueHelp"));
}

// ── 7. Samma hjälp kan ge XP i en ny session ──
{
  const s1 = newSessionAndEngine();
  drive(s1.session, s1.engine, [help("h1"), tick(3100)]);
  const persisted = Engine.toPersistable(s1.engine);
  const s2 = newSessionAndEngine(persisted);
  const { results } = drive(s2.session, s2.engine, [help("h1"), tick(3100)]);
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
  const { results: r1 } = drive(session, engine, [step("lp", 0), paramChange("kp", 1, CTX), runN(20, CTX), paramChange("kp", 9, CTX), runN(20, CTX), { type: "system_reset", meta: { contextKey: CTX } }]);
  check("10a. Jämförelsepar inom kontext ger rätt XP", sumAwarded(r1, "comparisonPair") === R.comparisonPair, sumAwarded(r1, "comparisonPair"));

  const ctxA = "lp2#0", ctxB = "lp2#1";
  const events = [
    step("lp2", 0, false, ctxA), { type: "learning_step_reached", meta: { learningPathId: "lp2", stepIndex: 0, contextKey: ctxA, comparisonGroup: "g1", stepType: "scenario", wordCount: 0 } },
    paramChange("kp", 1, ctxA), runN(20, ctxA),
    step("lp2", 1, false, ctxB), { type: "learning_step_reached", meta: { learningPathId: "lp2", stepIndex: 1, contextKey: ctxB, comparisonGroup: "g1", stepType: "scenario", wordCount: 0 } },
    paramChange("kp", 9, ctxB), runN(20, ctxB),
    { type: "system_reset", meta: { contextKey: ctxB } },
  ];
  const { results: r2 } = drive(session, engine, events);
  check("10b. groupComparisonPairs ger rätt XP", sumAwarded(r2, "comparisonPair") === R.comparisonPair, sumAwarded(r2, "comparisonPair"));
}

// ── 11. Samma jämförelsepar ger inte dubbel XP i samma session ──
{
  const { session, engine } = newSessionAndEngine();
  const events = [
    step("lp", 0),
    paramChange("kp", 1, CTX), runN(20, CTX),
    paramChange("kp", 9, CTX), runN(20, CTX),
    paramChange("kp", 1, CTX), runN(20, CTX),
    { type: "system_reset", meta: { contextKey: CTX } },
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
}

// ── 15. XP som passerar en nivågräns förs vidare (bokföring, oberoende av flush) ──
{
  const { session, engine } = newSessionAndEngine({ totalXP: 45 });
  const before = engine.totalXP;
  drive(session, engine, [help("h1"), tick(3100), help("h2"), tick(3100), help("h3"), tick(3100)]); // +6 XP -> 51, passerar 50
  check("15. XP som passerar en nivågräns förs vidare (inget försvinner)", engine.totalXP === before + R.uniqueHelp * 3, engine.totalXP);
  check("15b. flush() visar den nya nivån", Engine.flush(engine).level.levelIndex === 1);
}

// ── 16. En bokförd XP-ökning kan passera flera nivågränser (synkas via flush) ──
{
  const { session, engine } = newSessionAndEngine({ totalXP: 298 });
  drive(session, engine, [step("lp", 0, true), paramChange("kp", 1, "lp#0")]); // newHighestStep(2, kvalar in direkt) + completedLearningPath(12) = +14 -> 312, passerar 300
  const flushed = Engine.flush(engine);
  check("16. flush() efter en bokföring som passerat en nivågräns visar rätt nivå", flushed.level.levelIndex === 3, flushed.level.levelIndex);
  check("16b. flush() rapporterar att ett nivåbyte skedde", flushed.leveledUp === true);
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
  drive(session, engine, [help("h1"), tick(3100)]);
  check("19. XP fortsätter sparas efter nivå 8", engine.totalXP === 2100 + R.uniqueHelp, engine.totalXP);
}

// ── 23. Högsta uppnådda nivå sänks aldrig (även om nivågränser höjs) ──
{
  const raisedLevels = Object.freeze([
    { name: "Reglernovis", threshold: 0 },
    { name: "Looplärling", threshold: 200 },
  ]);
  const display = Engine.levelForDisplay(60, 1, raisedLevels);
  check("23a. Nivå sänks inte när gränser höjs", display.levelIndex === 1 && display.levelName === "Looplärling");
  check("23b. Baren visas full för en innehavd nivå", display.ratio === 1 && display.held === true);
}

// ══ GAM-003C — Kvalificerad steg-XP ══

// ── 24. Teoristeg: lästidsformel "4s + ord/4", klämd 8–60s ──
{
  // 0 ord -> 4s, klämt till golvet 8000ms
  {
    const { session, engine } = newSessionAndEngine();
    const { results, now } = drive(session, engine, [theoryStep("t1", 0, 0), tick(7900)]);
    check("24a. Teoristeg (0 ord, golv 8s): kvalar INTE in efter 7.9s", sumAwarded(results, "newHighestStep") === 0, sumAwarded(results, "newHighestStep"));
    const { results: r2 } = drive(session, engine, [tick(300)], now); // totalt 8.2s
    check("24b. ...men kvalar in efter totalt 8.2s aktiv tid", sumAwarded(r2, "newHighestStep") === R.newHighestStep, sumAwarded(r2, "newHighestStep"));
  }
  // 1000 ord -> 254s, klämt till taket 60000ms
  {
    const { session, engine } = newSessionAndEngine();
    const { results, now } = drive(session, engine, [theoryStep("t2", 0, 1000), tick(59900)]);
    check("24c. Teoristeg (1000 ord, tak 60s): kvalar INTE in efter 59.9s", sumAwarded(results, "newHighestStep") === 0, sumAwarded(results, "newHighestStep"));
    const { results: r2 } = drive(session, engine, [tick(200)], now); // totalt 60.1s
    check("24d. ...men kvalar in efter totalt 60.1s", sumAwarded(r2, "newHighestStep") === R.newHighestStep);
  }
  // 16 ord -> exakt 8s enligt formeln (ingen klämning aktiv)
  {
    const { session, engine } = newSessionAndEngine();
    const { results } = drive(session, engine, [theoryStep("t3", 0, 16), tick(8100)]);
    check("24e. Teoristeg (16 ord => 8s enligt formeln) kvalar in efter 8.1s", sumAwarded(results, "newHighestStep") === R.newHighestStep);
  }
  check("24f. computeReadSeconds klämmer korrekt (0 ord -> 8s, 1000 ord -> 60s, 16 ord -> 8s)",
    Engine.computeReadSeconds(0) === 8 && Engine.computeReadSeconds(1000) === 60 && Engine.computeReadSeconds(16) === 8);
}

// ── 25. Scenariosteg: relevant aktivitet krävs — väntetid ensam räcker inte ──
{
  const { session, engine } = newSessionAndEngine();
  const { results } = drive(session, engine, [step("s1", 0, false, "s1#0", { wordCount: 5 }), tick(120000)]); // 2 minuters ren väntan
  check("25a. Scenariosteg: enbart väntetid (ingen aktivitet) ger INGEN steg-XP", sumAwarded(results, "newHighestStep") === 0, sumAwarded(results, "newHighestStep"));
  const { results: r2 } = drive(session, engine, [paramChange("kp", 1, "s1#0")]); // första relevanta aktiviteten
  check("25b. ...men en enda relevant aktivitetshändelse kvalar in omedelbart (ingen tidsgräns)", sumAwarded(r2, "newHighestStep") === R.newHighestStep, sumAwarded(r2, "newHighestStep"));
}

// ── 26. Blandat steg: 50% av lästiden OCH relevant aktivitet krävs (heuristik: långt scenario-steg) ──
{
  const wc = 48; // >= mixedWordThreshold (40) -> klassas "mixed"; läsformel 4+48/4=16s -> krav 8000ms
  check("26 (förutsättning). 48 ord med scenario-typ klassas som 'mixed'", Engine.classifyStep({ stepType: "scenario", wordCount: wc }).kind === "mixed");

  // Bara aktivitet, inte tillräcklig tid -> ingen XP
  {
    const { session, engine } = newSessionAndEngine();
    const { results } = drive(session, engine, [mixedStep("m1", 0, wc, "m1#0"), paramChange("kp", 1, "m1#0")]);
    check("26a. Blandat steg: aktivitet utan tillräcklig tid ger INGEN steg-XP", sumAwarded(results, "newHighestStep") === 0, sumAwarded(results, "newHighestStep"));
  }
  // Bara tid, ingen aktivitet -> ingen XP
  {
    const { session, engine } = newSessionAndEngine();
    const { results } = drive(session, engine, [mixedStep("m2", 0, wc, "m2#0"), tick(8100)]);
    check("26b. Blandat steg: tid utan aktivitet ger INGEN steg-XP", sumAwarded(results, "newHighestStep") === 0, sumAwarded(results, "newHighestStep"));
  }
  // Båda uppfyllda -> XP
  {
    const { session, engine } = newSessionAndEngine();
    const { results } = drive(session, engine, [mixedStep("m3", 0, wc, "m3#0"), paramChange("kp", 1, "m3#0"), tick(8100)]);
    check("26c. Blandat steg: aktivitet OCH tillräcklig tid ger steg-XP", sumAwarded(results, "newHighestStep") === R.newHighestStep, sumAwarded(results, "newHighestStep"));
  }
}

// ── 27. Navigationen låses aldrig — okvalificerat steg ger bara ingen XP ──
{
  const { session, engine } = newSessionAndEngine();
  const events = [
    theoryStep("n1", 0, 200), // kräver gott om lästid
    step("n1", 1, false, "n1#1"), // navigerar vidare EFTER bara 1s — hann aldrig kvala in
    step("n1", 2, true, "n1#2"),
  ];
  let threw = false;
  let results;
  try { ({ results } = drive(session, engine, events)); } catch (e) { threw = true; }
  check("27a. Snabb navigation genom ett okvalificerat steg kastar inget fel", !threw);
  check("27b. Det övergivna steget gav ingen steg-XP", sumAwarded(results, "newHighestStep") === 0, sumAwarded(results, "newHighestStep"));
  check("27c. Navigationen fortsatte ändå till sista steget (isFinalStep-hanteringen opåverkad)", sumAwarded(results, "completedLearningPath") === R.completedLearningPath);
}

// ── 28. Hjälp-XP kräver minst 3s aktiv tid ──
{
  const { session, engine } = newSessionAndEngine();
  const { results, now } = drive(session, engine, [help("h1"), tick(2900)]);
  check("28a. Hjälp aktiv i 2.9s ger INGEN XP än", sumAwarded(results, "uniqueHelp") === 0, sumAwarded(results, "uniqueHelp"));
  const { results: r2 } = drive(session, engine, [tick(200)], now); // totalt 3.1s
  check("28b. ...men ger XP efter totalt 3.1s", sumAwarded(r2, "uniqueHelp") === R.uniqueHelp);
}

// ── 29. Byte av hjälptext avbryter kvalificeringen (redan täckt av test 6, kompletteras här med tajmning) ──
{
  const { session, engine } = newSessionAndEngine();
  const events = [help("h1"), tick(2000), help("h2")]; // byter EFTER 2s, innan h1 hann kvala in
  const { results } = drive(session, engine, events);
  check("29. Byte till en annan hjälptext innan 3s ger ingen XP för den avbrutna", sumAwarded(results, "uniqueHelp") === 0, sumAwarded(results, "uniqueHelp"));
}

// ── 30. Stängd panel (help_closed) avbryter kvalificeringen ──
{
  const { session, engine } = newSessionAndEngine();
  const events = [help("h1"), tick(2000), helpClosed(), tick(2000)]; // panelen stängs innan 3s
  const { results } = drive(session, engine, events);
  check("30. help_closed innan 3s avbryter kvalificeringen (ingen XP)", sumAwarded(results, "uniqueHelp") === 0, sumAwarded(results, "uniqueHelp"));
}

// ── 31. shouldFlush()/flush(): baren uppdateras bara vid naturliga avstämningspunkter ──
{
  const { session, engine } = newSessionAndEngine();
  const r1 = drive(session, engine, [help("h1"), tick(3100)]).results.slice(-1)[0];
  check("31a. help_opened/tick är INTE en avstämningspunkt (ingen milstolpe, inget stegbyte)", Engine.shouldFlush(engine, "measurement_facit_opened", r1.awarded) === false);
  check("31b. Bokförd XP har ändå ökat direkt (oberoende av flush)", engine.totalXP > 0, engine.totalXP);
  check("31c. displayedXP har INTE synkats än", engine.displayedXP === 0, engine.displayedXP);

  const r2 = drive(session, engine, [step("lp3", 0, false, "lp3#0")]).results.slice(-1)[0];
  check("31d. learning_step_reached (stegbyte) ÄR en avstämningspunkt", Engine.shouldFlush(engine, "learning_step_reached", r2.awarded) === true);
  const flushed = Engine.flush(engine);
  check("31e. flush() synkar displayedXP till totalXP", engine.displayedXP === engine.totalXP);
  check("31f. flush() returnerar korrekt nivåinfo", flushed.level.levelIndex === Engine.levelInfo(engine.totalXP, engine.levels).levelIndex);
}

// ── 32. debugSnapshot() visar bokförd/väntande XP och pågående kvalificeringar ──
{
  const { session, engine } = newSessionAndEngine();
  drive(session, engine, [theoryStep("d1", 0, 40)]);
  const snap1 = Engine.debugSnapshot(engine, session);
  check("32a. debugSnapshot visar ett pågående steg", !!snap1.pendingStep && snap1.pendingStep.learningPathId === "d1" && snap1.pendingStep.kind === "theory");
  check("32b. debugSnapshot visar väntande visuell XP (totalXP - displayedXP)", snap1.pendingVisualXP === snap1.totalXP - snap1.displayedXP);

  drive(session, engine, [help("h1")]);
  const snap2 = Engine.debugSnapshot(engine, session);
  check("32c. debugSnapshot visar en pågående hjälpkvalificering", !!snap2.pendingHelp && snap2.pendingHelp.helpId === "h1");
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
