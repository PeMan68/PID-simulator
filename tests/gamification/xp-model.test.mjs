// GAM-003A/GAM-003A.1 — Automatiska tester för XP-beräkningsverktyget.
// Egen enkel testrunner, i linje med tests/simulation/analyze.test.mjs och
// tests/activity-prototype.test.mjs.
//
// Körs: node tests/gamification/xp-model.test.mjs

import { computeXP, levelFor, XP_RULES_V1, LEVELS_V1 } from "./xp-model.mjs";

let passed = 0, failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}
function run(events, rules, priorState) { return computeXP(events, rules || XP_RULES_V1, priorState); }
const CTX = "t#0";
function step(idx, final) { return { type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: idx, isFinalStep: !!final, contextKey: "lp#" + idx } }; }
function runN(n, ctx = CTX) { return { type: "simulation_run", meta: { steps: n, contextKey: ctx } }; }
function singleStep(ctx = CTX) { return { type: "simulation_step", meta: { contextKey: ctx } }; }
function paramChange(field, value, ctx = CTX) { return { type: "parameter_changed", meta: { field, value, contextKey: ctx } }; }

// 1. Nytt högsta lärsteg ger XP en gång
{
  const r = run([step(0)]);
  check("1. Nytt högsta lärsteg ger XP", r.byCategory.newHighestStep === XP_RULES_V1.newHighestStep);
}

// 2. Återbesök ger ingen XP
{
  const r = run([step(0), step(1), step(0), step(1)]);
  check("2. Återbesök ger ingen ytterligare newHighestStep-XP", r.byCategory.newHighestStep === XP_RULES_V1.newHighestStep * 2, "fick " + r.byCategory.newHighestStep);
}

// 3. Slutförd lärstig ger XP en gång
{
  const events = [step(0), step(1, true), step(1, true)];
  const r = run(events);
  check("3. Slutförd lärstig ger XP en gång", r.byCategory.completedLearningPath === XP_RULES_V1.completedLearningPath);
}

// 4. Genomfört försök ger XP
{
  const events = [step(0), runN(20), { type: "system_reset", meta: { contextKey: CTX } }];
  const r = run(events);
  check("4. Genomfört försök (>=20 steg) ger XP", r.byCategory.completedAttempt === XP_RULES_V1.completedAttempt);
}

// 5. Kort försök ger ingen XP
{
  const events = [step(0), runN(10), { type: "system_reset", meta: { contextKey: CTX } }];
  const r = run(events);
  check("5. Kort försök (<20 steg) ger ingen completedAttempt-XP", r.byCategory.completedAttempt === 0);
}

// 6. Distinkt konfiguration ger XP när försöket finaliseras — antingen via
// ett explicit Reset/kontextbyte, ELLER automatiskt vid sessionens slut
// (GAM-003A.1: ett sista, uppfyllt försök ska inte förloras bara för att
// sekvensen råkar sluta där — se computeXP()s "Sessionsslut"-block).
{
  const events = [step(0), paramChange("kp", 5), runN(20)]; // ingen explicit avslutande händelse
  const r = run(events);
  check("6a. distinctConfig-XP ges via automatisk finalisering vid sessionens slut", r.byCategory.distinctConfig === XP_RULES_V1.distinctConfig, "fick " + r.byCategory.distinctConfig);
  const events2 = [...events, { type: "system_reset", meta: { contextKey: CTX } }];
  const r2 = run(events2);
  check("6b. distinctConfig-XP ges när försöket finaliseras explicit (Reset)", r2.byCategory.distinctConfig === XP_RULES_V1.distinctConfig);
}

// 7. Identisk konfiguration ger inte ny XP
{
  const events = [
    step(0),
    paramChange("kp", 5), runN(20), { type: "system_reset", meta: { contextKey: CTX } },
    paramChange("kp", 5), runN(20), { type: "system_reset", meta: { contextKey: CTX } },
  ];
  const r = run(events);
  check("7. Identisk konfiguration (samma signatur) ger bara EN distinctConfig-XP", r.byCategory.distinctConfig === XP_RULES_V1.distinctConfig, "fick " + r.byCategory.distinctConfig);
  check("7b. Men completedAttempt ges för BÅDA (varje är ett genuint genomfört försök)", r.byCategory.completedAttempt === XP_RULES_V1.completedAttempt * 2);
}

// 8. Jämförelsepar ger XP en gång
{
  const events = [
    step(0),
    paramChange("kp", 1), runN(20), // config 1 (kp=1)
    paramChange("kp", 5), runN(20), // finaliserar config1, startar config2 (kp=5)
    { type: "system_reset", meta: { contextKey: CTX } }, // finaliserar config2 -> 2:a distinkta -> 1 par
  ];
  const r = run(events);
  check("8. Jämförelsepar ger XP", r.byCategory.comparisonPair === XP_RULES_V1.comparisonPair, "fick " + r.byCategory.comparisonPair);
}

// 9/10/11. Unik hjälptext, återöppning, hjälptak
{
  const events = [
    { type: "help_opened", meta: { helpId: "a" } },
    { type: "help_opened", meta: { helpId: "a" } },
    { type: "help_opened", meta: { helpId: "b" } },
  ];
  const r = run(events);
  check("9. Unik hjälptext ger XP", r.byCategory.uniqueHelp === XP_RULES_V1.uniqueHelp * 2, "fick " + r.byCategory.uniqueHelp);
  check("10. Återöppning ger ingen XP", r.blocked.some(b => b.type === "help_opened" && /redan öppnad/.test(b.reason)));
  const capped = run(events, Object.assign({}, XP_RULES_V1, { helpCapPerSession: 1 }));
  check("11. Hjälptak fungerar", capped.byCategory.uniqueHelp === XP_RULES_V1.uniqueHelp, "fick " + capped.byCategory.uniqueHelp);
}

// 12. Enstegningstak fungerar
{
  const events = [step(0), singleStep(), singleStep(), singleStep(), singleStep(), singleStep(), singleStep(), singleStep()];
  const r = run(events);
  check("12. Enstegningstak (5/försök) fungerar", r.byCategory.singleStep === XP_RULES_V1.singleStepXP * 5, "fick " + r.byCategory.singleStep);
}

// 13. Kör 10 ger ingen direkt XP
{
  const r = run([step(0), runN(10)]);
  check("13. Kör 10 ger ingen direkt XP", !r.log.some(l => l.category === "singleStep") && r.blocked.some(b => b.type === "simulation_run"));
}

// 14. Mätarbete kräver beslutade villkor
{
  const onlyActivated = run([step(0), { type: "measurement_started", meta: { contextKey: CTX } }, runN(10)]);
  check("14a. Enbart aktivering ger ingen mätarbets-XP", onlyActivated.byCategory.measurementWork === 0);
  const full = run([step(0), { type: "measurement_started", meta: { contextKey: CTX } }, { type: "measurement_adjusted", meta: { field: "mpPv0", contextKey: CTX } }, runN(10)]);
  check("14b. Aktivering + justering + efterföljande aktivitet ger mätarbets-XP", full.byCategory.measurementWork === XP_RULES_V1.measurementWork);
}

// 15. Facit ger ingen XP
{
  const r = run([step(0), { type: "measurement_started", meta: { contextKey: CTX } }, { type: "measurement_facit_opened", meta: { contextKey: CTX } }, runN(10)]);
  check("15. Facit ger ingen XP (och triggar inte mätarbete)", r.byCategory.measurementWork === 0);
}

// 16. Reset ger ingen XP
{
  const r = run([{ type: "system_reset", meta: { contextKey: CTX } }]);
  check("16. Reset ger ingen egen XP", r.totalXPNoCheckpoints === 0);
}

// 17. Rensa graf ger ingen XP
{
  const r = run([{ type: "chart_cleared", meta: {} }]);
  check("17. Rensa graf ger ingen XP", r.totalXPNoCheckpoints === 0);
}

// 18. Pointermove ger ingen XP (går inte via recordEvent alls)
{
  const r = run([]);
  check("18. Tom sekvens (pointermove-ekvivalent) ger 0 XP", r.totalXPNoCheckpoints === 0);
}

// 19. Aktiv tid ger ingen XP (finns ingen XP-kategori kopplad till aktiv tid)
{
  const categories = Object.keys(XP_RULES_V1);
  check("19. Ingen XP-regel är kopplad till 'aktiv tid'", !categories.some(c => /active|tid/i.test(c)));
}

// 20. Fel checkpointsvar ger ingen XP
{
  const r = run([{ type: "checkpoint_answered", meta: { checkpointId: "cp1", correct: false } }]);
  check("20. Fel checkpointsvar ger ingen XP", r.totalXPWithCheckpoints === 0);
}

// 21. XP över nivågräns förs vidare
{
  const l1 = levelFor(34, LEVELS_V1);
  const l2 = levelFor(36, LEVELS_V1);
  check("21. XP över nivågräns förs vidare (inget XP försvinner)", l2.levelName === "Looplärling" && l2.xpIntoLevel === 1, JSON.stringify(l2));
}

// 22. Flera nivåer kan passeras av en större XP-händelse
{
  const l = levelFor(500, LEVELS_V1);
  check("22. Flera nivåer kan passeras (500 XP -> Regleradept)", l.levelName === "Regleradept", l.levelName);
}

// 23. Nivåmätaren kan beräknas som andel utan att XP-tal exponeras
{
  const l = levelFor(60, LEVELS_V1);
  check("23. Nivåmätaren exponerar en ratio (0..1)", typeof l.ratio === "number" && l.ratio >= 0 && l.ratio <= 1);
}

// 24. Nivå 8 hanteras korrekt
{
  const l = levelFor(10000, LEVELS_V1);
  check("24. Nivå 8 (MAX) hanteras korrekt utan att krascha", l.isMaxLevel === true && l.levelName === "Reglerlegend");
}

// 25. Negativ XP kan inte uppstå
{
  const r = run([step(0), { type: "checkpoint_answered", meta: { checkpointId: "a", correct: false } }, { type: "checkpoint_answered", meta: { checkpointId: "a", correct: false } }]);
  check("25. Negativ XP kan inte uppstå", r.totalXPNoCheckpoints >= 0 && r.totalXPWithCheckpoints >= 0);
}

// 26. Okänd händelse ger ingen XP
{
  const r = run([{ type: "some_unknown_future_event", meta: {} }]);
  check("26. Okänd händelsetyp ger 0 XP (och kraschar inte)", r.totalXPNoCheckpoints === 0);
}

// 27. Samma händelse kan inte dubbelregistreras
{
  const ev = { type: "help_opened", meta: { helpId: "x" } };
  const r = run([ev, ev]); // samma objektreferens två gånger i sekvensen — ändå två separata inspelningar i tidsordning, andra ska blockeras som återöppning
  check("27. Samma händelseobjekt itererat två gånger ger inte dubbel XP", r.byCategory.uniqueHelp === XP_RULES_V1.uniqueHelp);
}

// 28. Sessionsreset nollställer XP-beräkningen
{
  const r1 = run([step(0)]);
  const r2 = run([]); // ny, oberoende computeXP-körning = ny session
  check("28. Varje computeXP()-anrop startar en helt ny, nollställd session", r2.totalXPNoCheckpoints === 0 && r1.totalXPNoCheckpoints > 0);
}

// 29. Ingen persistens används
{
  const src = await (await import("node:fs/promises")).readFile(new URL("./xp-model.mjs", import.meta.url), "utf8");
  check("29. xp-model.mjs använder ingen persistens (localStorage/fs-skrivning)", !/localStorage|sessionStorage|writeFileSync|writeFile\(/.test(src));
}

// 30. Ingen appkod påverkas
{
  const src = await (await import("node:fs/promises")).readFile(new URL("./xp-model.mjs", import.meta.url), "utf8");
  check("30. xp-model.mjs importerar bara activity-prototype-core.js (rör aldrig app.js/index.html)", !/app\.js|index\.html/.test(src));
}

// ── GAM-003A.1: PO/PM:s reviderade princip — repetition ska ge XP ──

// 31. Slutförd lärstig ger XP VARJE genomgång (repeterbar, inte bara första gången)
{
  const finalStep = { type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: true, contextKey: "c" } };
  const s1 = run([finalStep]);
  check("31a. Slutförd lärstig ger XP i session 1", s1.byCategory.completedLearningPath === XP_RULES_V1.completedLearningPath);
  const s2 = run([finalStep], undefined); // ny, oberoende session (ingen priorState) = en NY genomgång
  check("31b. Slutförd lärstig ger XP igen i en helt ny session (repetition)", s2.byCategory.completedLearningPath === XP_RULES_V1.completedLearningPath);
}

// 32. Inom SAMMA session ger upprepade besök på samma slutsteg (fram/bakåt) inte dubbel lärstigs-XP
{
  const finalStep = { type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: true, contextKey: "c" } };
  const r = run([finalStep, finalStep, finalStep]);
  check("32. Tre besök på samma slutsteg i EN session ger bara en completedLearningPath-XP", r.byCategory.completedLearningPath === XP_RULES_V1.completedLearningPath, "fick " + r.byCategory.completedLearningPath);
}

// 33. Genomfört försök ger full XP varje gång, även med identisk konfiguration, ÄVEN över flera "sessioner" (priorState)
{
  const CTX2 = "lp2#0";
  const attempt = (val) => [
    step(0), paramChange("kp", val, CTX2), runN(20, CTX2), { type: "system_reset", meta: { contextKey: CTX2 } },
  ];
  const r1 = run(attempt(5));
  const r2 = run(attempt(5), undefined, r1.endState); // identisk konfiguration, kedjad över "session"
  check("33a. completedAttempt ges fullt (4 XP) i session 2 trots identisk konfiguration", r2.byCategory.completedAttempt === XP_RULES_V1.completedAttempt);
  check("33b. Men distinctConfig ges INTE igen (bestående, redan sedd i denna kontext)", r2.byCategory.distinctConfig === 0);
}

// 34. Nytt högsta lärsteg är bestående över "sessioner" (kedjat via priorState) — ges inte igen
{
  const step0 = { type: "learning_step_reached", meta: { learningPathId: "lp3", stepIndex: 0, isFinalStep: false, contextKey: "lp3#0" } };
  const r1 = run([step0]);
  check("34a. Nytt högsta steg ger XP första gången", r1.byCategory.newHighestStep === XP_RULES_V1.newHighestStep);
  const r2 = run([step0], undefined, r1.endState);
  check("34b. Samma steg ger INGEN newHighestStep-XP i en senare, kedjad session", r2.byCategory.newHighestStep === 0, "fick " + r2.byCategory.newHighestStep);
}

// 35. Ny, genuint annan konfiguration i en senare kedjad session ger distinctConfig-XP
{
  const CTX3 = "lp4#0";
  const r1 = run([step(0), paramChange("kp", 1, CTX3), runN(20, CTX3), { type: "system_reset", meta: { contextKey: CTX3 } }]);
  const r2 = run([step(0), paramChange("kp", 99, CTX3), runN(20, CTX3), { type: "system_reset", meta: { contextKey: CTX3 } }], undefined, r1.endState);
  check("35. Genuint ny konfiguration i en senare session ger distinctConfig-XP", r2.byCategory.distinctConfig === XP_RULES_V1.distinctConfig);
}

// 36. Ett sista, ofinaliserat försök vid sekvensens slut går inte förlorat
{
  const r = run([step(0), paramChange("kp", 5), runN(20)]); // ingen Reset/kontextbyte sist
  check("36. Sista försöket finaliseras automatiskt vid sessionens slut", r.byCategory.completedAttempt === XP_RULES_V1.completedAttempt && r.byCategory.distinctConfig === XP_RULES_V1.distinctConfig);
}

// 37. mergeState slår ihop två tillstånd korrekt (union, inget tappas)
{
  const { mergeState } = await import("./xp-model.mjs");
  const a = { learningPaths: { lpA: { highestStepIndex: 2, completed: true } }, contexts: { cA: ["sigA"] } };
  const b = { learningPaths: { lpB: { highestStepIndex: 1, completed: false } }, contexts: { cB: ["sigB"] } };
  const merged = mergeState(a, b);
  check("37. mergeState behåller båda lärstigarnas och kontexternas tillstånd", merged.learningPaths.lpA && merged.learningPaths.lpB && merged.contexts.cA && merged.contexts.cB);
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
