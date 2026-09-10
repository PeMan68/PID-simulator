// GAM-003D — Verifierar finalisering av pågående försök vid sessionsavslut.
//
// Bakgrund: ett genomfört försök (>= 20 simulerade steg) finaliseras bara
// när en avslutande händelse inträffar (stegbyte, scenariobyte, betydande
// parameterändring, "Återställ system"). Om INGEN sådan händelse hinner ske
// innan sidan laddas om, navigeras bort från, eller fliken/webbläsaren
// stängs, startar nästa session helt tom (Core:s session.contexts seedas
// aldrig) — försöks-/distinktkonfigurations-/jämförelsepar-XP för det
// ofinaliserade försöket gick tidigare permanent förlorad.
//
// GAM-003D löser detta med en ny, smalt avgränsad Core-händelsetyp
// "session_ending" (dispatchad av activity-prototype.js:s pagehide-
// lyssnare) som ENDAST finaliserar ett försök som REDAN uppfyller villkoret
// för ett genomfört försök — ett kortare, ofärdigt försök lämnas orört
// (varken "completed" eller "aborted").
//
// Körs: node tests/gamification/gamification-session-finalization.test.mjs

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

function newSessionAndEngine(persisted) {
  const session = Core.createSession(0);
  const engine = Engine.createEngine(persisted || null, Engine.XP_RULES_V1, Engine.LEVELS_V1);
  Engine.seedSession(session, engine);
  return { session, engine };
}
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
function step(id, idx, ctx) {
  return { type: "learning_step_reached", meta: { learningPathId: id, stepIndex: idx, isFinalStep: false, contextKey: ctx, stepType: "scenario", wordCount: 0 } };
}
function paramChange(field, value, ctx) { return { type: "parameter_changed", meta: { field, value, contextKey: ctx } }; }
function runN(n, ctx) { return { type: "simulation_run", meta: { steps: n, contextKey: ctx } }; }
function sessionEnding() { return { type: "session_ending", meta: {} }; }
function sumAwarded(results, category) {
  let n = 0;
  results.forEach(r => r.awarded.forEach(a => { if (a.category === category) n += a.amount; }));
  return n;
}

const R = Engine.XP_RULES_V1;
const CTX = "lp#0";

// ── 1. Kärnfallet: ett kvalificerande försök (>=20 steg) utan avslutande
// händelse ger INGEN completedAttempt-XP förrän session_ending inträffar ──
{
  const { session, engine } = newSessionAndEngine();
  const { now } = drive(session, engine, [step("lp", 0, CTX), paramChange("kp", 1, CTX), runN(20, CTX)]);
  check("1a. Innan session_ending: inget completedAttempt bokfört trots 20 steg", sumAwarded([{ awarded: [] }], "completedAttempt") === 0 && session.attempts.completed === 0, session.attempts);
  const totalBefore = engine.totalXP;
  const { results } = drive(session, engine, [sessionEnding()], now);
  check("1b. session_ending finaliserar det kvalificerande försöket", session.attempts.completed === 1, session.attempts);
  check("1c. completedAttempt-XP bokförs vid session_ending", sumAwarded(results, "completedAttempt") === R.completedAttempt, sumAwarded(results, "completedAttempt"));
  check("1d. totalXP ökade i takt med den nya XP:n", engine.totalXP === totalBefore + sumAwarded(results, "completedAttempt") + sumAwarded(results, "distinctConfig"), engine.totalXP);
}

// ── 2. Simulerad omladdning: XP:n som session_ending bokförde överlever ──
{
  const { session, engine } = newSessionAndEngine();
  const { now } = drive(session, engine, [step("lp", 0, CTX), paramChange("kp", 1, CTX), runN(20, CTX)]);
  drive(session, engine, [sessionEnding()], now);
  const xpBeforeReload = engine.totalXP;
  const persisted = Engine.toPersistable(engine);
  const reloaded = newSessionAndEngine(persisted);
  check("2. Bokförd XP finns kvar oförändrad efter en simulerad omladdning", reloaded.engine.totalXP === xpBeforeReload, { xpBeforeReload, afterReload: reloaded.engine.totalXP });
}

// ── 3. Ett försök UNDER 20 steg finaliseras INTE av session_ending
// (varken completed eller aborted) — navigationen/avslutet ska inte straffa
// eller belöna ett ofärdigt försök. ──
{
  const { session, engine } = newSessionAndEngine();
  drive(session, engine, [step("lp", 0, CTX), paramChange("kp", 1, CTX), runN(10, CTX)]);
  const { results } = drive(session, engine, [sessionEnding()]);
  check("3a. Kortare försök (<20 steg) ger ingen XP vid session_ending", results[0].awarded.length === 0, results[0].awarded);
  check("3b. Kortare försök markeras varken completed eller aborted", session.attempts.completed === 0 && session.attempts.aborted === 0, session.attempts);
}

// ── 4. Skydd mot dubbelregistrering: en andra session_ending ger INGEN
// ytterligare XP (samma försök kan inte finaliseras/krediteras två gånger) ──
{
  const { session, engine } = newSessionAndEngine();
  const { now } = drive(session, engine, [step("lp", 0, CTX), paramChange("kp", 1, CTX), runN(20, CTX)]);
  const { results: r1, now: now2 } = drive(session, engine, [sessionEnding()], now);
  check("4a. Första session_ending ger XP", sumAwarded(r1, "completedAttempt") === R.completedAttempt);
  const { results: r2 } = drive(session, engine, [sessionEnding()], now2);
  check("4b. En andra session_ending (dubblett) ger INGEN ytterligare XP", r2[0].awarded.length === 0, r2[0].awarded);
  const { results: r3 } = drive(session, engine, [sessionEnding()], now2);
  check("4c. En tredje session_ending ger heller ingen XP", r3[0].awarded.length === 0);
}

// ── 5. Ingen aktiv kontext / inget pågående försök: session_ending är en
// säker no-op, kraschar inte ──
{
  const { session, engine } = newSessionAndEngine();
  let threw = false;
  let results;
  try { ({ results } = drive(session, engine, [sessionEnding()])); } catch (e) { threw = true; }
  check("5. session_ending utan aktiv kontext kraschar inte och ger ingen XP", !threw && results[0].awarded.length === 0);
}

// ── 6. Normal avslutande händelse (referens, oförändrat beteende): ett
// stegbyte finaliserar precis som innan GAM-003D, session_ending behövs inte ──
{
  const { session, engine } = newSessionAndEngine();
  drive(session, engine, [step("lp", 0, CTX), paramChange("kp", 1, CTX), runN(20, CTX), step("lp", 1, "lp#1")]);
  check("6. Ett vanligt stegbyte finaliserar försöket precis som tidigare (referens)", session.attempts.completed === 1, session.attempts);
}

// ── 7. session_ending finaliserar ENDAST det just nu AKTIVA försöket i
// AKTUELL kontext — rör inte tidigare, redan finaliserade kontexter ──
{
  const { session, engine } = newSessionAndEngine();
  const ctxA = "lpX#0", ctxB = "lpX#1";
  drive(session, engine, [
    step("lpX", 0, ctxA), paramChange("kp", 1, ctxA), runN(20, ctxA),
    step("lpX", 1, ctxB), // finaliserar ctxA (stegbyte) — completed=1
    paramChange("kp", 5, ctxB), runN(20, ctxB), // nytt kvalificerande försök i ctxB, ofinaliserat
  ]);
  check("7a. Föregående kontext redan finaliserad via stegbyte (referens)", session.attempts.completed === 1, session.attempts);
  const { results } = drive(session, engine, [sessionEnding()]);
  check("7b. session_ending finaliserar det NYA försöket i den aktuella kontexten (ctxB)", session.attempts.completed === 2, session.attempts);
  check("7c. completedAttempt-XP bokförd för ctxB:s försök", sumAwarded(results, "completedAttempt") === R.completedAttempt);
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
