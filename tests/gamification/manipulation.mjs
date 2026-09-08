// GAM-003A — DEL 8: manipulationstester. Provräknar 16 sätt att försöka
// pressa fram XP genom klickspam/upprepning istället för genuin
// pedagogisk aktivitet, och redovisar erhållen XP, blockerad XP och
// rekommenderad spärr per fall.
//
// Körs: node tests/gamification/manipulation.mjs [--json]

import { computeXP, XP_RULES_V1 } from "./xp-model.mjs";

const CTX = "manip#0";

function run(name, events, note) {
  const r = computeXP(events, XP_RULES_V1);
  return {
    name,
    note,
    eventCount: events.length,
    xpGained: r.totalXPNoCheckpoints,
    xpWithCheckpoints: r.totalXPWithCheckpoints,
    blockedCount: r.blocked.length,
    byCategory: r.byCategory,
  };
}

export function runManipulationTests() {
  const results = [];

  // 1. Upprepad Reset
  results.push(run("1. Upprepad Reset",
    Array.from({ length: 20 }, () => ({ type: "system_reset", meta: { contextKey: CTX } })),
    "Reset ger 0 XP per modell — förväntat: 0 XP oavsett upprepning."));

  // 2. Rensa graf upprepade gånger
  results.push(run("2. Rensa graf upprepat",
    Array.from({ length: 20 }, () => ({ type: "chart_cleared", meta: {} })),
    "chart_cleared hanteras inte alls av GAM-002:s recordEvent-switch (fall igenom till default) — 0 XP korrekt, men OBS: reflekterar också att Rensa graf inte finaliserar ett försök (till skillnad från Reset/kontextbyte)."));

  // 3. Samma hjälptext öppnas upprepade gånger
  results.push(run("3. Samma hjälptext upprepat",
    Array.from({ length: 15 }, () => ({ type: "help_opened", meta: { helpId: "kp" } })),
    "Endast första öppningen ger XP."));

  // 4. Alla 24 hjälptexter öppnas utan andra aktiviteter
  results.push(run("4. Alla 24 hjälptexter, inget annat",
    Array.from({ length: 24 }, (_, i) => ({ type: "help_opened", meta: { helpId: "h" + i } })),
    "Maximal hjälp-XP utan någon pedagogisk aktivitet i övrigt — se DEL 9."));

  // 5. Enstegning långt över taket
  results.push(run("5. Enstegning långt över taket (50 st)",
    [{ type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: CTX } },
     ...Array.from({ length: 50 }, () => ({ type: "simulation_step", meta: { contextKey: CTX } }))],
    "Taket (5/försök) håller — resten blockeras."));

  // 6. Samma konfiguration körs upprepade gånger (reset + samma kp)
  {
    const events = [{ type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: CTX } }];
    for (let i = 0; i < 5; i++) {
      events.push({ type: "parameter_changed", meta: { field: "kp", value: 1.5, contextKey: CTX } });
      for (let s = 0; s < 25; s++) events.push({ type: "simulation_run", meta: { steps: 1, contextKey: CTX } });
      events.push({ type: "system_reset", meta: { contextKey: CTX } });
    }
    results.push(run("6. Identisk konfiguration upprepad 5x (med Reset mellan)", events,
      "Samma signatur => bara FÖRSTA blir en 'distinkt' konfiguration; completedAttempt-XP ges dock varje gång (varje körning är ett genuint genomfört försök, bara inte NYTT). Se DEL 6."));
  }

  // 7. Parameter ändras fram och tillbaka utan simulering
  results.push(run("7. Parameter ändras fram/tillbaka, ingen simulering",
    [{ type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: CTX } },
     ...Array.from({ length: 30 }, (_, i) => ({ type: "parameter_changed", meta: { field: "kp", value: i % 2 === 0 ? 1.0 : 5.0, contextKey: CTX } }))],
    "Ingen simulation_step/run => attempt.stepCount förblir 0 => finalizeAttempt returnerar tidigt (stepCount<=0) => ingen distinctConfig, ingen completedAttempt. 0 XP."));

  // 8. Parameter ändras precis över 5%-gränsen upprepade gånger
  {
    const events = [{ type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: CTX } }];
    let val = 1.0;
    for (let i = 0; i < 10; i++) {
      val *= 1.06; // precis över 5%-tröskeln varje gång
      events.push({ type: "parameter_changed", meta: { field: "kp", value: val, contextKey: CTX } });
      for (let s = 0; s < 25; s++) events.push({ type: "simulation_run", meta: { steps: 1, contextKey: CTX } });
    }
    results.push(run("8. Parameter +6% upprepat (gränsfall)", events,
      "Varje steg är >5% relativ ändring => varje blir en NY distinkt konfiguration + jämförelsepar, trots att skillnaden pedagogiskt är marginell efter några iterationer. Potentiell exploatering — se DEL 6."));
  }

  // 9. Kortare försök än 20 steg
  results.push(run("9. Kort försök (10 steg)",
    [{ type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: CTX } },
     { type: "simulation_run", meta: { steps: 10, contextKey: CTX } },
     { type: "system_reset", meta: { contextKey: CTX } }],
    "Under 20-stegsgränsen => aborted, inte completed. 0 XP (utom ev. enstegnings-XP om Stega använts, ej fallet här)."));

  // 10. Många Kör 10 utan variation (200 steg, samma config)
  {
    const events = [{ type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: CTX } }];
    for (let i = 0; i < 20; i++) events.push({ type: "simulation_run", meta: { steps: 10, contextKey: CTX } });
    events.push({ type: "system_reset", meta: { contextKey: CTX } });
    results.push(run("10. 20x Kör 10 utan variation (200 steg, 1 config)", events,
      "Kör 10 ger 0 direkt XP. Endast EN completedAttempt + EN distinctConfig ges — långt körande utan variation belönas INTE proportionellt mot antal klick."));
  }

  // 11. Mätverktyget aktiveras utan justering
  results.push(run("11. Mät K/T/L aktiverat, ingen justering",
    [{ type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: CTX } },
     { type: "measurement_started", meta: { contextKey: CTX } },
     { type: "simulation_run", meta: { steps: 10, contextKey: CTX } }],
    "Ingen measurement_adjusted => measurementWork ges aldrig. 0 XP för mätarbete (korrekt per modell)."));

  // 12. Oavsiktlig mätjustering följd av ingen relevant aktivitet
  results.push(run("12. Mätjustering, sedan inget mer",
    [{ type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: CTX } },
     { type: "measurement_started", meta: { contextKey: CTX } },
     { type: "measurement_adjusted", meta: { field: "mpPv0", contextKey: CTX } }],
    "Justering gjord men INGEN efterföljande simulering/stegväxling i sekvensen => measurementWork-villkoret (aktivering+justering+EFTERFÖLJANDE aktivitet) är inte uppfyllt. 0 XP tills en sådan efterföljande händelse inträffar."));

  // 13. Facit öppnas utan mätning
  results.push(run("13. Facit öppnas utan mätning",
    [{ type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: CTX } },
     { type: "measurement_started", meta: { contextKey: CTX } },
     { type: "measurement_facit_opened", meta: { contextKey: CTX } },
     { type: "simulation_run", meta: { steps: 10, contextKey: CTX } }],
    "Facit ger uttryckligen 0 XP och triggar inte measurementWork (kräver measurement_adjusted, inte facit)."));

  // 14. Fram- och bakåtnavigering i lärstigen
  results.push(run("14. Fram/bakåt-navigering (samma steg upprepat)",
    [
      { type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: "lp#0" } },
      { type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 1, isFinalStep: false, contextKey: "lp#1" } },
      { type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: "lp#0" } }, // bakåt
      { type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 1, isFinalStep: false, contextKey: "lp#1" } }, // framåt igen
      { type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 1, isFinalStep: false, contextKey: "lp#1" } }, // "återbesök" samma steg
    ],
    "Bara index 0 och 1 (första gången vardera) ger newHighestStep-XP — återbesök (inkl. efter bakåtnavigering) ger 0."));

  // 15. Sidan hålls aktiv endast genom pointermove
  results.push(run("15. Endast pointermove (ingen pedagogisk händelse)",
    [], // pointermove skickas ALDRIG som en råhändelse till recordEvent (recordPointermove anropar bara markActive) — modelleras som en TOM händelselista.
    "pointermove går genom Core.recordPointermove(), inte recordEvent — når aldrig XP-lagret överhuvudtaget. Bekräftat: 0 XP, oavsett hur länge sidan hålls 'aktiv' på detta sätt ensamt."));

  // 16. Alla tillåtna aktiviteter maximeras i en enda kort session
  {
    const events = [
      { type: "learning_path_loaded", meta: { learningPathId: "lp" } },
      { type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 0, isFinalStep: false, contextKey: "lp#0" } },
      { type: "scenario_loaded", meta: { scenarioId: "s", contextKey: "lp#0" } },
      { type: "measurement_started", meta: { contextKey: "lp#0" } },
      { type: "measurement_adjusted", meta: { field: "mpPv0", contextKey: "lp#0" } },
    ];
    for (let i = 0; i < 24; i++) events.push({ type: "help_opened", meta: { helpId: "h" + i } });
    for (let i = 0; i < 5; i++) events.push({ type: "simulation_step", meta: { contextKey: "lp#0" } });
    for (let c = 0; c < 4; c++) {
      events.push({ type: "parameter_changed", meta: { field: "kp", value: 1 + c * 5, contextKey: "lp#0" } });
      for (let s = 0; s < 20; s++) events.push({ type: "simulation_run", meta: { steps: 1, contextKey: "lp#0" } });
    }
    events.push({ type: "learning_step_reached", meta: { learningPathId: "lp", stepIndex: 1, isFinalStep: true, contextKey: "lp#1" } });
    results.push(run("16. Maximerad enda kort session (teoretiskt tak)", events,
      "Övre gräns för hur mycket XP en enda, mycket kort men maximalt 'utnyttjad' session kan ge — jämförs mot en normal hel lärstig i rapporten (DEL 6: 'högsta möjliga XP för ett fördjupat försök')."));
  }

  return results;
}

if (process.argv[1] && process.argv[1].endsWith("manipulation.mjs")) {
  const asJson = process.argv.includes("--json");
  const results = runManipulationTests();
  if (asJson) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    results.forEach(r => {
      console.log(`${r.name}: XP=${r.xpGained} (blocked=${r.blockedCount})`);
      console.log(`  ${r.note}`);
    });
  }
}
