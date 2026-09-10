/* GAM-003B/GAM-003C — XP- och nivåmotor (DOM-fri kärna).
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
 *
 * GAM-003C — KVALIFICERAD OCH FÖRDRÖJD VISNING (tillägg, ändrar INGA
 * XP-värden eller nivågränser):
 *  - "Nytt högsta lärsteg" (2 XP) BOKFÖRS inte längre omedelbart vid
 *    `learning_step_reached`. Steget klassificeras (`classifyStep`) och ett
 *    `engine.pendingStep` skapas; XP ges först när stegets villkor
 *    (aktiv lästid och/eller relevant aktivitet, se nedan) är uppfyllt.
 *    Uppfylls villkoret aldrig innan användaren navigerar vidare uteblir
 *    bara XP:n — navigationen är ALDRIG blockerad.
 *  - "Unik hjälptext" (2 XP) bokförs inte längre omedelbart vid
 *    `help_opened`. Ett `engine.pendingHelp` kräver minst 3 sekunders aktiv
 *    tid med SAMMA hjälptext öppen — byte av hjälptext eller `help_closed`
 *    avbryter kvalificeringen utan att ge XP.
 *  - `engine.totalXP` (bokförd, bestående) uppdateras fortfarande OMEDELBART
 *    när ett villkor väl uppfylls — "fördröjd" gäller bara den VISUELLA
 *    nivåmätaren (`engine.displayedXP`, synkas separat via `flush()`), inte
 *    bokföringen. Se gamification.js för när `flush()` anropas
 *    ("naturliga avstämningspunkter": stegbyte, scenariobyte, avslutat
 *    försök, slutförd lärstig, nivåbyte).
 */
(function (global, factory) {
  const mod = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = mod;
  } else {
    global.GamificationXPEngine = mod;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {

  // ── DEL: XP-regler (GAM-003B, PO/PM-beslutade värden — OFÖRÄNDRADE i GAM-003C) ──
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

  // ── DEL: Nivåkurva (GAM-003B, PO/PM-beslutad — OFÖRÄNDRAD i GAM-003C) ──
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

  // ── DEL: GAM-003C — stegkvalificering ──
  // Rena, dokumenterade tal — inga XP-värden eller nivågränser. Se
  // uppdragstextens formel: "4 sekunder + antal ord / 4", 8–60s, 50% för
  // blandade steg, 3s för hjälp.
  const STEP_QUALIFICATION = Object.freeze({
    theoryBaseSeconds: 4,
    theoryWordsDivisor: 4,
    theoryMinSeconds: 8,
    theoryMaxSeconds: 60,
    mixedFraction: 0.5,
    // Heuristik (INTE en uppdragsspecificerad konstant): ett scenariosteg
    // med minst så många ord i instruktionen klassas som "blandat" (kräver
    // både delvis lästid och aktivitet) istället för rent aktivitetskrav.
    // Kan ersättas per steg av ett framtida `progressRequirement`-fält utan
    // att denna fil ändras — se `classifyStep`.
    mixedWordThreshold: 40,
  });
  const HELP_MIN_ACTIVE_MS = 3000;

  // Händelsetyper som räknas som "relevant aktivitet" för scenario-/blandade
  // steg — INTE väntetid, inte navigation, inte facit (som redan är 0 XP i
  // hela modellen och inte heller bör räknas som engagemang här).
  const STEP_ACTIVITY_TYPES = Object.freeze([
    "simulation_step", "simulation_run", "parameter_changed",
    "regulator_mode_changed", "process_type_changed", "disturbance_triggered",
    "measurement_started", "measurement_adjusted", "help_opened",
    "system_reset", "chart_cleared",
  ]);
  function isStepActivityType(type) { return STEP_ACTIVITY_TYPES.indexOf(type) !== -1; }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  // Lästid i SEKUNDER för ett teoristeg (eller lästidsdelen av ett blandat
  // steg, se `classifyStep`) — "4 sekunder + antal ord / 4", begränsat 8–60s.
  function computeReadSeconds(wordCount) {
    const words = typeof wordCount === "number" && wordCount >= 0 ? wordCount : 0;
    const raw = STEP_QUALIFICATION.theoryBaseSeconds + words / STEP_QUALIFICATION.theoryWordsDivisor;
    return clamp(raw, STEP_QUALIFICATION.theoryMinSeconds, STEP_QUALIFICATION.theoryMaxSeconds);
  }

  /**
   * Klassificerar ETT lärstigssteg (från `learning_step_reached`s meta) till
   * { kind, minActiveMs, requiresActivity } — den enda formen
   * kvalificeringslogiken (`evaluatePendingStep`) behöver bry sig om.
   *
   * `meta.progressRequirement` (valfritt fält i FRAMTIDA lärstigsdata — INGET
   * innehåll sätter det idag) OVERRIDAR alltid heuristiken, så ett nytt,
   * per-steg-uttryckt krav kan införas utan att denna funktion (eller resten
   * av motorn) behöver göras om:
   *   "theory-only"   -> samma regel som ett teoristeg
   *   "activity-only" -> samma regel som ett scenariosteg
   *   "mixed"         -> samma regel som ett blandat steg
   *
   * Utan ett uttryckligt `progressRequirement` klassas `stepType==="theory"`
   * som teoristeg, och övriga (`"scenario"`/`"observe"`) som scenariosteg
   * — om instruktionstexten är tillräckligt lång (se `mixedWordThreshold`)
   * som blandat steg istället.
   */
  function classifyStep(meta) {
    const wordCount = typeof meta.wordCount === "number" ? meta.wordCount : 0;
    const readSeconds = computeReadSeconds(wordCount);
    const req = meta.progressRequirement || null;

    if (req === "theory-only" || (!req && meta.stepType === "theory")) {
      return { kind: "theory", minActiveMs: readSeconds * 1000, requiresActivity: false };
    }
    if (req === "mixed" || (!req && meta.stepType !== "theory" && wordCount >= STEP_QUALIFICATION.mixedWordThreshold)) {
      return { kind: "mixed", minActiveMs: readSeconds * 1000 * STEP_QUALIFICATION.mixedFraction, requiresActivity: true };
    }
    return { kind: "scenario", minActiveMs: 0, requiresActivity: true };
  }

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

  // STABILITET ÖVER RELEASER: visad nivå = högsta av (nivå från VISAD XP,
  // högsta nivå som någonsin VISATS). Om nivågränser höjs i en framtida
  // uppdatering ska en användare som redan sett en nivå aldrig flyttas ned.
  // Baren visas då full för den innehavda nivån — det finns inget
  // meningsfullt "andel kvar"-tal när visad XP inte längre räcker för den
  // innehavda nivåns egna trösklar.
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
  // lärstig denna session", GAM-003C:s väntande steg-/hjälpkvalificeringar
  // och den visade XP:n) — rör ALDRIG de bestående delarna (totalXP,
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
    engine.pendingStep = null; // GAM-003C
    engine.pendingHelp = null; // GAM-003C
    engine.displayedXP = engine.totalXP; // GAM-003C — ingen väntande visuell skuld kvarstår över en (åter)start
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

  // GAM-003C — utvärderar engine.pendingStep/pendingHelp mot DENNA händelse.
  // Anropas FÖRST i processEvent, INNAN händelsetypens egna hantering (som
  // kan skapa NYA pending-poster) — se processEvent nedan för ordningen.
  // Bokför XP direkt när ett villkor uppfylls (samma `award()` som allt
  // annat), men lämnar ALLTID pendingStep/pendingHelp kvar (o-avbrutet) om
  // villkoret ännu inte är uppfyllt — navigationen är aldrig blockerad, och
  // ett steg/en hjälptext som lämnas okvalificerad ger bara ingen XP (se
  // den explicita bortstädningen i learning_step_reached-hanteringen och
  // help_closed/hjälptextbyte nedan).
  function evaluatePending(engine, result, session, type, meta, now) {
    const ps = engine.pendingStep;
    if (ps) {
      const isNavOrSession = type === "learning_step_reached" || type === "scenario_loaded" || type === "session_started";
      if (!isNavOrSession && isStepActivityType(type)) ps.hadActivity = true;
      const elapsed = session.activeMs - ps.activeMsAtStart;
      const timeOk = elapsed >= ps.minActiveMs;
      const activityOk = !ps.requiresActivity || ps.hadActivity;
      if (timeOk && activityOk) {
        award(result, engine, "newHighestStep", engine.rules.newHighestStep,
          `Nytt högsta lärsteg (index ${ps.stepIndex}) i "${ps.learningPathId}" — stegvillkor uppfyllt (${ps.kind}, ${Math.round(elapsed)}ms aktiv tid).`);
        engine.pendingStep = null;
      }
    }

    const ph = engine.pendingHelp;
    if (ph) {
      if (type === "help_closed") {
        engine.pendingHelp = null; // stängd panel avbryter — ingen XP
      } else if (type === "help_opened" && meta.helpId !== ph.helpId) {
        engine.pendingHelp = null; // byte av hjälptext avbryter — ingen XP (den nya hanteras separat nedan)
      } else {
        const elapsed = session.activeMs - ph.activeMsAtStart;
        if (elapsed >= HELP_MIN_ACTIVE_MS) {
          award(result, engine, "uniqueHelp", engine.rules.uniqueHelp,
            `Unik hjälptext ("${ph.helpId}") aktiv i minst 3 sekunder (${Math.round(elapsed)}ms).`);
          engine.pendingHelp = null;
        }
      }
    }
  }

  // GAM-003C — utvärderar pendingStep/pendingHelp UTAN någon verklig
  // händelse (type=null, meta={}) — dvs. bara "har tillräckligt lång aktiv
  // tid nu passerat?". Används av gamification.js:s enda, punktvisa timer
  // (schemalagd exakt till den tidpunkt ett tidsbaserat villkor SKULLE
  // uppfyllas, inte en återkommande polling-loop) för att fånga fallet där
  // användaren blir overksam efter att ha öppnat en teoritext/hjälptext men
  // innan nästa RIKTIGA händelse råkar inträffa. `session.activeMs` måste
  // vara uppdaterat (t.ex. via ett föregående Core.summary()-anrop) INNAN
  // detta anropas — se gamification.js.
  function checkPending(engine, session, now) {
    const result = { awarded: [] };
    evaluatePending(engine, result, session, null, {}, now);
    return { awarded: result.awarded, totalXPAfter: engine.totalXP };
  }

  /**
   * Bearbetar EN händelse som redan har passerat
   * ActivityPrototypeCore.recordEvent(session, type, meta, now) — dvs.
   * `session` är redan uppdaterat av Core när detta anrops. Motorn jämför
   * mot sin egen ihågkomna ögonblicksbild (`engine.snapshot`) av samma
   * session, precis som computeXP() jämför "before"/"after" i sin
   * batch-variant — bara utspritt över flera anrop istället för en loop.
   *
   * Returnerar `{ awarded, totalXPBefore, totalXPAfter }`. Säger INGET om
   * nivå/visning — se `flush()` för det (GAM-003C: bokföring och visning är
   * medvetet frikopplade). Anropar ALDRIG Core.recordEvent själv — det har
   * redan skett innan detta anrop.
   */
  function processEvent(engine, session, type, meta, now) {
    meta = meta || {};
    const rules = engine.rules;
    const result = { awarded: [] };
    const totalXPBefore = engine.totalXP;

    evaluatePending(engine, result, session, type, meta, now); // GAM-003C

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

    // ── Unik hjälptext (GAM-003C: startar en 3s-kvalificering, ger ALDRIG
    // XP direkt här — se evaluatePending ovan) ──
    if (type === "help_opened") {
      if (session.help.opened.size > engine.snapshot.helpUniqueCount) {
        engine.snapshot.helpUniqueCount = session.help.opened.size;
        engine.pendingHelp = { helpId: meta.helpId, activeMsAtStart: session.activeMs };
      }
      // Redan öppnad denna session: ingen XP, ingen ny kvalificering — oförändrat.
    }

    // ── Nytt högsta lärsteg (GAM-003C: startar en kvalificering, ger ALDRIG
    // XP direkt här — se evaluatePending ovan). BESTÅENDE, kräver att
    // session.learningPaths seedats via seedSession() vid sessionsstart. ──
    if (type === "learning_step_reached" && meta.learningPathId != null) {
      const id = meta.learningPathId;
      const contextKey = meta.contextKey;
      const lp = session.learningPaths.get(id);
      const prevHighest = engine.snapshot.learningPathHighest.has(id)
        ? engine.snapshot.learningPathHighest.get(id)
        : -1;
      const isNewHighest = !!(lp && lp.highestStepIndex > prevHighest);

      // Ett steg som lämnas okvalificerat ger bara ingen XP — det låses aldrig
      // fast; ett stegbyte (annan contextKey) städar alltid bort det.
      if (engine.pendingStep && engine.pendingStep.contextKey !== contextKey) {
        engine.pendingStep = null;
      }

      if (isNewHighest) {
        engine.snapshot.learningPathHighest.set(id, lp.highestStepIndex);
        const meta2 = engine.learningPathMeta.get(id) || { highestStepIndex: -1, completed: false, completedCount: 0 };
        meta2.highestStepIndex = lp.highestStepIndex;
        engine.learningPathMeta.set(id, meta2);

        const cls = classifyStep(meta);
        engine.pendingStep = {
          learningPathId: id,
          stepIndex: lp.highestStepIndex,
          contextKey,
          kind: cls.kind,
          minActiveMs: cls.minActiveMs,
          requiresActivity: cls.requiresActivity,
          activeMsAtStart: session.activeMs,
          hadActivity: false,
        };
      }
      // ── Slutförd lärstig: repeterbar per session, men antal genomgångar
      // BESTÅENDE. Oförändrat av GAM-003C — kvalificeringen ovan gäller bara
      // "nytt högsta lärsteg", inte milstolpen för att slutföra lärstigen. ──
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

    return {
      awarded: result.awarded,
      totalXPBefore,
      totalXPAfter: engine.totalXP,
    };
  }

  // GAM-003C — avgör om detta är en "naturlig avstämningspunkt" där baren
  // ska synkas mot bokförd XP: stegbyte, scenariobyte, avslutat försök,
  // slutförd lärstig, eller (om bokförd XP redan skulle ge en högre nivå än
  // den senast VISADE) ett nivåbyte — det senare fångas proaktivt så att
  // nivåbytesanimationen aldrig dröjer godtyckligt länge efter att den
  // faktiskt "hänt" i bokföringen.
  function shouldFlush(engine, type, awarded) {
    if (type === "learning_step_reached" || type === "scenario_loaded") return true;
    if (awarded.some(a => a.category === "completedAttempt" || a.category === "completedLearningPath")) return true;
    if (levelInfo(engine.totalXP, engine.levels).levelIndex > engine.highestLevelIndex) return true;
    return false;
  }

  // GAM-003C — synkar den VISADE XP:n mot den bokförda och uppdaterar den
  // bestående "högsta VISADE nivå"-spärren i takt (aldrig baserat på
  // bokförd XP i bakgrunden — se filhuvudet). Returnerar nivåinformationen
  // att rendera samt om detta var ett nivåbyte (för animationen).
  function flush(engine) {
    const prevHighestLevelIndex = engine.highestLevelIndex;
    engine.displayedXP = engine.totalXP;
    const raw = levelInfo(engine.displayedXP, engine.levels);
    if (raw.levelIndex > engine.highestLevelIndex) engine.highestLevelIndex = raw.levelIndex;
    const display = levelForDisplay(engine.displayedXP, engine.highestLevelIndex, engine.levels);
    return { level: display, leveledUp: engine.highestLevelIndex > prevHighestLevelIndex };
  }

  // GAM-003C — DEV-/felsökningsvy: exakt vad som är bokfört, vad som väntar
  // på att visas, och varför ett pågående steg/hjälptext ännu inte kvalat in.
  // Läser bara, ändrar ingenting.
  function debugSnapshot(engine, session) {
    const activeMs = session ? session.activeMs : null;
    return {
      totalXP: engine.totalXP,
      displayedXP: engine.displayedXP,
      pendingVisualXP: engine.totalXP - engine.displayedXP,
      highestLevelIndex: engine.highestLevelIndex,
      pendingStep: engine.pendingStep ? {
        learningPathId: engine.pendingStep.learningPathId,
        stepIndex: engine.pendingStep.stepIndex,
        kind: engine.pendingStep.kind,
        minActiveMs: Math.round(engine.pendingStep.minActiveMs),
        elapsedActiveMs: activeMs != null ? Math.round(activeMs - engine.pendingStep.activeMsAtStart) : null,
        requiresActivity: engine.pendingStep.requiresActivity,
        hadActivity: engine.pendingStep.hadActivity,
      } : null,
      pendingHelp: engine.pendingHelp ? {
        helpId: engine.pendingHelp.helpId,
        minActiveMs: HELP_MIN_ACTIVE_MS,
        elapsedActiveMs: activeMs != null ? Math.round(activeMs - engine.pendingHelp.activeMsAtStart) : null,
      } : null,
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
    STEP_QUALIFICATION,
    HELP_MIN_ACTIVE_MS,
    computeReadSeconds,
    classifyStep,
    levelInfo,
    levelForDisplay,
    sumDistinctConfigs,
    createEngine,
    resetSessionScope,
    seedSession,
    processEvent,
    checkPending,
    shouldFlush,
    flush,
    debugSnapshot,
    toPersistable,
  };
});
