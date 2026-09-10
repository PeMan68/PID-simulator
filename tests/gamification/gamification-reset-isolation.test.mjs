// Bugg 2026-013 — "Återställ progression" gav massiv felaktig XP-
// återhämtning: ett enda klick direkt efter återställning hoppade till
// nivå 2 med ett stort, felaktigt XP-tal.
//
// Grundorsak: gamification.js:s onReset() skapade ett NYTT, tomt
// `engine`-objekt men återanvände samma, redan belastade GAM-002-
// aktivitetssession (window.ActivityPrototype.session()). Motorns
// diff-baserade bokföring (processEvent) jämför sessionens RÅA räknare
// (session.attempts.completed, sumDistinctConfigs, comparisonPairs.length
// m.fl.) mot motorns egen, nollställda ögonblicksbild — nästa händelse
// (oavsett typ) tolkade då HELA den tidigare sessionens redan-existerande
// aktivitet som "ny" och krediterade den i klump.
//
// Fixen: onReset() startar nu OCKSÅ om själva aktivitetssessionen
// (window.ActivityPrototype.reset(), samma mekanism som en vanlig
// sidladdning) — se filens strukturella kontroll (DEL 2) och den
// beteendemässiga verifieringen av mekanismen (DEL 1), eftersom
// gamification.js själv är DOM-bunden och inte kan importeras direkt i
// Node (den avbryter omedelbart utan `window`).
//
// Körs: node tests/gamification/gamification-reset-isolation.test.mjs

import fs from "node:fs";
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

function buildBusySession() {
  const session = Core.createSession(0);
  const engine = Engine.createEngine(null, Engine.XP_RULES_V1, Engine.LEVELS_V1);
  Engine.seedSession(session, engine);
  let now = 0;
  function ev(type, meta, dt) {
    now += dt || 1000;
    Core.recordEvent(session, type, meta || {}, now);
    return Engine.processEvent(engine, session, type, meta || {}, now);
  }
  // Realistisk "tidigare aktivitet" innan användaren klickar Återställ:
  // ett genomfört försök, en distinkt konfiguration, ett jämförelsepar,
  // två hjälptexter.
  ev("learning_step_reached", { learningPathId: "lp", stepIndex: 0, contextKey: "lp#0", stepType: "scenario", wordCount: 0 });
  ev("parameter_changed", { field: "kp", value: 1, contextKey: "lp#0" });
  ev("simulation_run", { steps: 20, contextKey: "lp#0" });
  ev("parameter_changed", { field: "kp", value: 5, contextKey: "lp#0" });
  ev("simulation_run", { steps: 20, contextKey: "lp#0" });
  ev("system_reset", { contextKey: "lp#0" });
  ev("help_opened", { helpId: "h1" }, 3100);
  ev("help_opened", { helpId: "h2" }, 3100);
  return { session, engine, now };
}

// ── 1a. Grundorsaken bekräftad: återanvänds SAMMA session efter att motorn
// nollställts, ger nästa händelse en felaktig klumpsumma av all tidigare
// aktivitet — detta är EXAKT det gamla, buggiga beteendet. ──
{
  const { session, engine: oldEngine } = buildBusySession();
  check("1a. Sessionen har ackumulerad aktivitet före 'återställning'", session.attempts.completed >= 1 && session.comparisonPairs.length >= 1 && session.help.opened.size === 2);

  // Bara motorn nollställs (den GAMLA, buggiga varianten) — sessionen återanvänds.
  const buggyEngine = Engine.createEngine(null, Engine.XP_RULES_V1, Engine.LEVELS_V1);
  Engine.seedSession(session, buggyEngine);
  check("1b. Motorn själv visar korrekt 0 XP direkt efter återställning (det som syns i UI:t)", buggyEngine.totalXP === 0);

  const result = Engine.processEvent(buggyEngine, session, "simulation_step", { contextKey: "lp#0" }, 100000);
  const totalAwarded = result.awarded.reduce((s, a) => s + a.amount, 0);
  check("1c. [GRUNDORSAK] Med SAMMA session ger nästa händelse en stor, felaktig klumpsumma", totalAwarded > 10, { totalAwarded, awarded: result.awarded });
  void oldEngine;
}

// ── 2. Fixen: nollställ ÄVEN sessionen (window.ActivityPrototype.reset()
// motsvarar Core.createSession() + Engine.resetSessionScope + seedSession,
// exakt som en vanlig sidladdning gör). Nästa händelse ger nu bara sin
// egen, verkliga XP. ──
{
  const { engine: oldEngine } = buildBusySession();
  void oldEngine;

  let engine = Engine.createEngine(null, Engine.XP_RULES_V1, Engine.LEVELS_V1); // Store.resetProgression() + bootstrapEngine()
  let session = Core.createSession(0); // window.ActivityPrototype.reset() -> init() -> Core.createSession(now())
  Engine.resetSessionScope(engine); // handleEvent("session_started", ...)
  Engine.seedSession(session, engine);
  check("2a. Efter fixad återställning: 0 XP", engine.totalXP === 0);

  const result = Engine.processEvent(engine, session, "simulation_step", { contextKey: "lp#0" }, 1000);
  const totalAwarded = result.awarded.reduce((s, a) => s + a.amount, 0);
  check("2b. Ett enda Stega-klick efter fixad återställning ger bara enstegnings-XP (1)", totalAwarded === Engine.XP_RULES_V1.singleStepXP, { totalAwarded, awarded: result.awarded });
  const level = Engine.levelInfo(engine.totalXP, Engine.LEVELS_V1);
  check("2c. Nivån förblir Reglernovis (index 0) efter ett enda klick", level.levelIndex === 0, level);
}

// ── 3. Strukturell kontroll: gamification.js:s onReset() startar faktiskt
// om aktivitetssessionen (kan inte testas direkt i Node — filen avbryter
// omedelbart utan `window` — så käll-scan är den rätta metoden här, i
// linje med gamification-dev-prod-isolation.test.mjs:s stil). ──
{
  const gamJs = fs.readFileSync(path.join(APP_DIR, "gamification.js"), "utf8");
  const onResetMatch = gamJs.match(/function onReset\(\)\s*\{[\s\S]*?\n    \}/);
  const onResetBody = onResetMatch ? onResetMatch[0] : "";
  check("3a. onReset() hittades i gamification.js", !!onResetMatch);
  check("3b. onReset() anropar Store.resetProgression()", /Store\.resetProgression\(\)/.test(onResetBody));
  check("3c. onReset() bygger om engine (bootstrapEngine)", /bootstrapEngine\(\)/.test(onResetBody));
  check("3d. [FIX 2026-013] onReset() startar även om aktivitetssessionen (window.ActivityPrototype.reset())",
    /window\.ActivityPrototype\.reset\(\)/.test(onResetBody), onResetBody);
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
