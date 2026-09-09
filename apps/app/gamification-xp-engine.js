/* GAM-003B — XP- och nivåmotor (DOM-fri kärna).
 *
 * Samma UMD-mönster som sim-core.js och activity-prototype-core.js: laddas
 * som <script> i webbläsaren (DEV-only, se gamification.js) och via
 * require() i Node för tests/gamification/*.test.mjs.
 *
 * Rör ALDRIG apps/app/activity-prototype-core.js. Den här motorn OBSERVERAR
 * bara en redan befintlig GAM-002-session (samma objekt som
 * activity-prototype.js redan skapar och matar via Core.recordEvent) genom
 * att jämföra sessionens tillstånd FÖRE och EFTER varje händelse — precis
 * som tests/gamification/xp-model.mjs:s computeXP() gör i sin batch-variant,
 * men här inkrementellt (ett `processEvent`-anrop per verklig händelse i en
 * körande app, istället för en hel array på en gång). Se den filens
 * kommentarer för den fullständiga motiveringen bakom varje kategori.
 *
 * Checkpoints ingår MEDVETET inte här ("Checkpointsvar: ingår inte i
 * nivå-XP", GAM-003B-uppdraget) — och app.js skickar aldrig något
 * checkpoint-relaterat till aktivitetsmodellen ändå, så ingen särskild
 * spärr behövs.
 *
 * BESTÅENDE vs REPETERBAR XP (se docs/development/GAMIFICATION-XP-PROTOTYPE.md):
 *  - Bestående, en gång NÅGONSIN (kräver att laddas från persisterat
 *    tillstånd vid sessionsstart): nytt högsta lärsteg, distinkt
 *    konfigurationsbonus (spåras här via `contextSignatures`, INTE genom
 *    att seeda Core:s egna `session.contexts` — se `createEngine`).
 *  - Repeterbar per session (session = en sidladdning, nollställs alltid):
 *    genomfört försök, jämförelsepar (inom kontext OCH comparisonGroup),
 *    unik hjälptext, mätarbete, enstegning, slutförd lärstig.
 */
(function (global, factory) {
  const mod = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = mod;
  } else {
    global.GamificationXPEngine = mod;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {

  // ── DEL: XP-regler (GAM-003B, PO/PM-beslutade värden — se uppdragstexten) ──
  const XP_RULES_V1 = Object.freeze({
    newHighestStep: 2,
    completedLearningPath: 12,
    completedAttempt: 4,
    distinctConfig: 2,
    comparisonPair: 6,
    uniqueHelp: 2,
    helpCapPerSession: Infinity,
    measurementWork: 4,
    singleStepXP: 1,
    singleStepCapPerAttempt: 5,
  });
  const XP_RULES_VERSION = "v1";

  // ── DEL: Nivåkurva (GAM-003B, PO/PM-beslutad — LEVELS_V2 i xp-model.mjs) ──
  const LEVELS_V1 = Object.freeze([
    { name: "Reglernovis", threshold: 0 },
    { name: "Looplärling", threshold: 50 },
    { name: "Signalspanare", threshold: 140 },
    { name: "Processutforskare", threshold: 300 },
    { name: "Loopvävare", threshold: 550 },
    { name: "Regleradept", threshold: 900 },
    { name: "Processmästare", threshold: 1400 },
    { name: "Reglerlegend", threshold: 2100 },
  ]);
  const LEVELS_VERSION = "v1";

  function levelInfo(totalXP, levels) {
    levels = levels || LEVELS_V1;
    let idx = 0;
    for (let i = 0; i < levels.length; i++) {
      if (totalXP >= levels[i].threshold) idx = i;
    }
    const current = levels[idx];
    const next = levels[idx + 1] || null;
    const span = next ? next.threshold - current.threshold : 0;
    const into = next ? totalXP - current.threshold : 0;
    return {
      levelIndex: idx,
      levelName: current.name,
      nextLevelName: next ? next.name : null,
      xpIntoLevel: into,
      xpSpanForLevel: span,
      ratio: next ? Math.max(0, Math.min(1, into / span)) : 1,
      isMaxLevel: !next,
    };
  }

  // STABILITET ÖVER RELEASER: visad nivå = högsta av (nivå från aktuell XP,
  // högsta nivå som någonsin nåtts). Om nivågränser höjs i en framtida
  // uppdatering ska en användare som redan nått en nivå aldrig flyttas ned.
  // Baren visas då full för den innehavda nivån (se motivering i
  // dokumentationen) — det finns inget meningsfullt "andel kvar"-tal när
  // aktuell XP inte längre räcker för den innehavda nivåns egna trösklar.
  function levelForDisplay(totalXP, highestLevelIndexEverReached, levels) {
    levels = levels || LEVELS_V1;
    const fromXP = levelInfo(totalXP, levels);
    const heldIndex = Math.max(fromXP.levelIndex, highestLevelIndexEverReached || 0);
    if (heldIndex <= fromXP.levelIndex) return Object.assign({ held: false }, fromXP);
    const held = levels[heldIndex];
    const nextHeld = levels[heldIndex + 1] || null;
    return {
      held: true,
      levelIndex: heldIndex,
      levelName: held.name,
      nextLevelName: nextHeld ? nextHeld.name : null,
      xpIntoLevel: 0,
      xpSpanForLevel: 0,
      ratio: 1,
      isMaxLevel: !nextHeld,
    };
  }

  function sumDistinctConfigs(session) {
    let n = 0;
    session.contexts.forEach(ctx => { n += ctx.distinctConfigs.length; });
    return n;
  }

  // ── Motorns tillstånd: bestående delar (kommer från persisterat tillstånd)
  // + sessionsbundna delar (alltid nollställda, en gång per sidladdning) ──
  function createEngine(persisted, rules, levels) {
    rules = rules || XP_RULES_V1;
    levels = levels || LEVELS_V1;
    persisted = persisted || {};

    const contextSignatures = new Map(); // contextKey -> Set<signature>, BESTÅENDE
    Object.entries(persisted.contextSignatures || {}).forEach(([ctxKey, sigs]) => {
      contextSignatures.set(ctxKey, new Set(sigs || []));
    });

    const learningPathMeta = new Map(); // learningPathId -> { highestStepIndex, completed, completedCount }, BESTÅENDE
    Object.entries(persisted.learningPaths || {}).forEach(([id, lp]) => {
      learningPathMeta.set(id, {
        highestStepIndex: typeof lp.highestStepIndex === "number" ? lp.highestStepIndex : -1,
        completed: !!lp.completed,
        completedCount: typeof lp.completedCount === "number" ? lp.completedCount : 0,
      });
    });

    const engine = {
      rules,
      levels,
      totalXP: typeof persisted.totalXP === "number" && persisted.totalXP >= 0 ? persisted.totalXP : 0,
      highestLevelIndex: typeof persisted.highestLevelIndex === "number" ? persisted.highestLevelIndex : 0,
      contextSignatures,
      learningPathMeta,
    };
    resetSessionScope(engine);
    return engine;
  }

  // Nollställer ENDAST de sessionsbundna delarna av motorn (attemptsCompleted,
  // jämförelsepar, unik hjälp, enstegning, mätarbetstillstånd, "slutförd
  // lärstig denna session") — rör ALDRIG de bestående delarna (totalXP,
  // highestLevelIndex, contextSignatures, learningPathMeta). Anropas dels av
  // `createEngine` (ny sidladdning), dels av gamification.js när GAM-002:s
  // egen DEV-konsol startar om aktivitetssessionen (window.ActivityPrototype
  // .reset()) — annars skulle motorns ihågkomna "before"-värden bli
  // inkonsekventa mot en helt ny, tom Core-session (se gamification.js).
  function resetSessionScope(engine) {
    engine.snapshot = {
      attemptsCompleted: 0,
      comparisonPairCount: 0,
      groupComparisonPairCount: 0,
      helpUniqueCount: 0,
      distinctCountByContext: new Map(),
      learningPathHighest: new Map(Array.from(engine.learningPathMeta.entries()).map(([id, lp]) => [id, lp.highestStepIndex])),
    };
    engine.singleStepsThisAttempt = 0;
    engine.measurement = { active: false, adjusted: false, awarded: false };
    engine.completedLearningPathThisSession = new Set();
    return engine;
  }

  // Seedar EN session (nyss skapad av ActivityPrototypeCore.createSession)
  // med bestående "högsta nått lärsteg"-data, så Core:s egen
  // redan-nått-spärr (oförändrad) automatiskt gäller över sidladdningar.
  // Seedar MEDVETET INTE session.contexts/distinctConfigs — se filhuvudet:
  // jämförelsepar och genomförda försök ska kunna ge XP på nytt varje
  // session, och det kräver att Core:s egen sessionslokala
  // distinctConfigs-lista börjar tom. Den bestående distinctConfig-BONUSEN
  // (skild från själva jämförelseparet) spåras separat i `contextSignatures`.
  function seedSession(session, engine) {
    engine.learningPathMeta.forEach((lp, id) => {
      session.learningPaths.set(id, { highestStepIndex: lp.highestStepIndex, completed: lp.completed });
    });
  }

  function award(result, engine, category, amount, reason) {
    if (amount <= 0) return;
    engine.totalXP += amount;
    result.awarded.push({ category, amount, reason });
  }

  /**
   * Bearbetar EN händelse som redan har passerat
   * ActivityPrototypeCore.recordEvent(session, type, meta, now) — dvs.
   * `session` är redan uppdaterat av Core när detta anrops. Motorn jämför
   * mot sin egen ihågkomna ögonblicksbild (`engine.snapshot`) av samma
   * session, precis som computeXP() jämför "before"/"after" i sin
   * batch-variant — bara utspritt över flera anrop istället för en loop.
   *
   * Returnerar `{ awarded, totalXPBefore, totalXPAfter, levelBefore,
   * levelAfter, leveledUp }`. Anropar ALDRIG Core.recordEvent själv — det
   * har redan skett innan detta anrop.
   */
  function processEvent(engine, session, type, meta, now) {
    meta = meta || {};
    const rules = engine.rules;
    const result = { awarded: [] };
    const totalXPBefore = engine.totalXP;
    const levelBefore = levelForDisplay(engine.totalXP, engine.highestLevelIndex, engine.levels);

    // ── Genomfört försök (repeterbart varje session, ingen bestående spärr) ──
    if (session.attempts.completed > engine.snapshot.attemptsCompleted) {
      const n = session.attempts.completed - engine.snapshot.attemptsCompleted;
      award(result, engine, "completedAttempt", rules.completedAttempt * n, "Genomfört försök (minst 20 steg).");
      engine.snapshot.attemptsCompleted = session.attempts.completed;
      engine.singleStepsThisAttempt = 0;
    }

    // ── Distinkt konfiguration: BESTÅENDE bonus per exakt signatur+kontext,
    // oavsett hur många sessioner som passerat. Jämförelseparet självt
    // (session.comparisonPairs/groupComparisonPairs) hanteras separat nedan
    // och är INTE gated av detta — se filhuvudet. ──
    session.contexts.forEach((ctx, contextKey) => {
      const prevCount = engine.snapshot.distinctCountByContext.get(contextKey) || 0;
      if (ctx.distinctConfigs.length > prevCount) {
        let seen = engine.contextSignatures.get(contextKey);
        if (!seen) { seen = new Set(); engine.contextSignatures.set(contextKey, seen); }
        for (let i = prevCount; i < ctx.distinctConfigs.length; i++) {
          const sig = ctx.distinctConfigs[i].signature;
          if (!seen.has(sig)) {
            seen.add(sig);
            award(result, engine, "distinctConfig", rules.distinctConfig, "Ny distinkt parameterkonfiguration (första gången i denna kontext).");
          }
        }
        engine.snapshot.distinctCountByContext.set(contextKey, ctx.distinctConfigs.length);
      }
    });

    // ── Jämförelsepar: repeterbart varje session (inom kontext + comparisonGroup) ──
    if (session.comparisonPairs.length > engine.snapshot.comparisonPairCount) {
      const n = session.comparisonPairs.length - engine.snapshot.comparisonPairCount;
      award(result, engine, "comparisonPair", rules.comparisonPair * n, "Nytt jämförelsepar inom samma kontext.");
      engine.snapshot.comparisonPairCount = session.comparisonPairs.length;
    }
    if (session.groupComparisonPairs.length > engine.snapshot.groupComparisonPairCount) {
      const n = session.groupComparisonPairs.length - engine.snapshot.groupComparisonPairCount;
      award(result, engine, "comparisonPair", rules.comparisonPair * n, "Nytt jämförelsepar i ett deklarerat comparisonGroup.");
      engine.snapshot.groupComparisonPairCount = session.groupComparisonPairs.length;
    }

    // ── Unik hjälptext: en gång per helpId och session (repeterbar i en ny session) ──
    if (type === "help_opened") {
      if (session.help.opened.size > engine.snapshot.helpUniqueCount) {
        engine.snapshot.helpUniqueCount = session.help.opened.size;
        award(result, engine, "uniqueHelp", rules.uniqueHelp, `Ny unik hjälptext ("${meta.helpId}") denna session.`);
      }
    }

    // ── Nytt högsta lärsteg: BESTÅENDE, kräver att session.learningPaths
    // seedats via seedSession() vid sessionsstart. ──
    if (type === "learning_step_reached" && meta.learningPathId != null) {
      const id = meta.learningPathId;
      const lp = session.learningPaths.get(id);
      const prevHighest = engine.snapshot.learningPathHighest.has(id)
        ? engine.snapshot.learningPathHighest.get(id)
        : -1;
      if (lp && lp.highestStepIndex > prevHighest) {
        engine.snapshot.learningPathHighest.set(id, lp.highestStepIndex);
        const meta2 = engine.learningPathMeta.get(id) || { highestStepIndex: -1, completed: false, completedCount: 0 };
        meta2.highestStepIndex = lp.highestStepIndex;
        engine.learningPathMeta.set(id, meta2);
        award(result, engine, "newHighestStep", rules.newHighestStep, `Nytt högsta lärsteg (index ${lp.highestStepIndex}) i "${id}".`);
      }
      // ── Slutförd lärstig: repeterbar per session, men antal genomgångar BESTÅENDE ──
      if (meta.isFinalStep && !engine.completedLearningPathThisSession.has(id)) {
        engine.completedLearningPathThisSession.add(id);
        const meta3 = engine.learningPathMeta.get(id) || { highestStepIndex: lp ? lp.highestStepIndex : -1, completed: false, completedCount: 0 };
        meta3.completed = true;
        meta3.completedCount = (meta3.completedCount || 0) + 1;
        engine.learningPathMeta.set(id, meta3);
        award(result, engine, "completedLearningPath", rules.completedLearningPath, `Lärstigen "${id}" slutförd (genomgång ${meta3.completedCount}).`);
      }
    }

    // ── Analytisk enstegning: eget sessionslager, tak per PÅGÅENDE försök ──
    if (type === "simulation_step") {
      engine.singleStepsThisAttempt += 1;
      if (engine.singleStepsThisAttempt <= rules.singleStepCapPerAttempt) {
        award(result, engine, "singleStep", rules.singleStepXP, `Enstegning ${engine.singleStepsThisAttempt}/${rules.singleStepCapPerAttempt} i pågående försök.`);
      }
    }
    if (type === "system_reset" || type === "scenario_loaded") {
      engine.singleStepsThisAttempt = 0;
    }

    // ── Mätarbete: eget litet sessionstillstånd (aktiverat + justerat + följt av aktivitet) ──
    if (type === "measurement_started") {
      engine.measurement = { active: true, adjusted: false, awarded: false };
    } else if (type === "measurement_adjusted") {
      if (engine.measurement.active) engine.measurement.adjusted = true;
    } else if (type === "measurement_facit_opened") {
      // 0 XP per modell — facit triggar aldrig mätarbete.
    } else if (engine.measurement.active && engine.measurement.adjusted && !engine.measurement.awarded &&
               (type === "simulation_step" || type === "simulation_run" || type === "learning_step_reached" || type === "scenario_loaded")) {
      award(result, engine, "measurementWork", rules.measurementWork, "Genomfört mätarbete (aktiverat + justerat + följt av aktivitet).");
      engine.measurement.awarded = true;
    }
    if (type === "system_reset" || type === "scenario_loaded" || type === "learning_step_reached") {
      engine.measurement = { active: false, adjusted: false, awarded: engine.measurement.awarded };
    }
    // simulation_run ("Kör 10"): medvetet ingen direkt XP — bidrar bara till
    // stepCount mot 20-stegsgränsen för completedAttempt (redan hanterat av
    // Core, se diffen för session.attempts.completed ovan).

    const levelAfter = levelForDisplay(engine.totalXP, engine.highestLevelIndex, engine.levels);
    if (levelAfter.levelIndex > engine.highestLevelIndex) engine.highestLevelIndex = levelAfter.levelIndex;

    return {
      awarded: result.awarded,
      totalXPBefore,
      totalXPAfter: engine.totalXP,
      levelBefore,
      levelAfter: levelForDisplay(engine.totalXP, engine.highestLevelIndex, engine.levels),
      leveledUp: levelAfter.levelIndex > levelBefore.levelIndex,
    };
  }

  function toPersistable(engine) {
    const learningPaths = {};
    engine.learningPathMeta.forEach((lp, id) => {
      learningPaths[id] = { highestStepIndex: lp.highestStepIndex, completed: lp.completed, completedCount: lp.completedCount };
    });
    const contextSignatures = {};
    engine.contextSignatures.forEach((sigs, ctxKey) => {
      contextSignatures[ctxKey] = Array.from(sigs);
    });
    return {
      totalXP: engine.totalXP,
      highestLevelIndex: engine.highestLevelIndex,
      learningPaths,
      contextSignatures,
    };
  }

  return {
    XP_RULES_V1,
    XP_RULES_VERSION,
    LEVELS_V1,
    LEVELS_VERSION,
    levelInfo,
    levelForDisplay,
    sumDistinctConfigs,
    createEngine,
    resetSessionScope,
    seedSession,
    processEvent,
    toPersistable,
  };
});
