/* GAM-002 — Aktivitetsprototypens kärnlogik.
 *
 * Rent, DOM-fritt tillståndsmaskin för sessionsbaserad aktivitetsmätning.
 * Samma UMD-mönster som sim-core.js: laddas som <script> i webbläsaren
 * (DEV-only, se activity-prototype.js) och via require() i Node för
 * tests/activity-prototype.test.mjs.
 *
 * Tidsstyrd via en INJICERAD `now`-parameter i varje anrop — ingen intern
 * klocka, inget setInterval. Det gör modulen testbar utan att vänta på
 * verklig tid, och undviker högfrekventa timers i webbläsaren (se
 * GAM-002 DEL 5 och DEL 19).
 *
 * Lagrar ALDRIG: muskoordinater, rörelsesträckor, tangentvärden,
 * textinnehåll, eller något som identifierar användaren. Se
 * docs/development/GAMIFICATION-PROTOTYPE.md.
 */
(function (global, factory) {
  const mod = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = mod;
  } else {
    global.ActivityPrototypeCore = mod;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {

  const DEFAULT_CONFIG = {
    inactivityThresholdMs: 60000,
    pointermoveThrottleMs: 5000,
    distinctConfigRelativeThreshold: 0.05, // 5% — tuningparameter, se DEL 12
    completedAttemptMinSteps: 20,
    maxRawEvents: 1000,
  };

  // Parametrar som räknas vid jämförelse av konfigurationer (GAM-002 DEL 11).
  // "Kv" har ingen egen fältidentitet i appen — samma fält (#k) återanvänds
  // och bara etiketten byts beroende på processtyp, så "k" täcker båda.
  const CONFIG_FIELDS = [
    "sp", "k", "t", "l", "kp", "ti", "td",
    "umin", "umax", "manualOutput", "noise", "pulseMag", "pulseDuration",
  ];
  const CATEGORICAL_FIELDS = ["mode", "processType"];

  function createSession(now, configOverrides) {
    const config = Object.assign({}, DEFAULT_CONFIG, configOverrides || {});
    return {
      config,
      startedAt: now,
      lastSettledAt: now,
      visible: true,
      focused: true,
      lastActivityAt: now,
      activeMs: 0,
      inactiveMs: 0,
      inInactivePeriod: false,
      inactivityPeriodCount: 0,
      inactivityPeriodsTotalMs: 0,
      rawEvents: [],
      droppedRawEventCount: 0,
      counts: {}, // type -> antal
      acceptedActivitySignals: 0,
      pointermoveAcceptedCount: 0,
      lastPointermoveAcceptedAt: -Infinity,
      help: { opened: new Map(), reopenCount: 0 }, // helpId -> {firstAt, openCount}
      learningPaths: new Map(), // learningPathId -> { highestStepIndex, completed }
      contexts: new Map(), // contextKey -> { currentConfig, currentAttempt, distinctConfigs: [{sig,fields}], observedConfigCount }
      totalSimulatedSteps: 0,
      attempts: { started: 0, completed: 0, aborted: 0 },
      comparisonPairs: [], // { contextKey, changedFields } — jämförelser INOM samma kontext (oförändrat)
      comparisonGroups: new Map(), // groupId -> { lastEntry: { contextKey, signature, fields } | null } — GAM-003A.2
      groupComparisonPairs: [], // { group, fromContext, toContext, changedFields } — jämförelser ÖVER kontextgränser, GAM-003A.2
      currentContextKey: null,
    };
  }

  // ── Tidsavräkning (event-sourced, ingen polling) ──
  function settle(session, now) {
    if (now <= session.lastSettledAt) { session.lastSettledAt = now; return; }
    if (!session.visible || !session.focused) {
      // Ingen tid räknas alls medan dold/ofokuserad — varken aktiv eller inaktiv.
      session.lastSettledAt = now;
      return;
    }
    const cutoff = session.lastActivityAt + session.config.inactivityThresholdMs;
    if (session.lastSettledAt >= cutoff) {
      addInactive(session, now - session.lastSettledAt, now);
    } else if (now <= cutoff) {
      session.activeMs += now - session.lastSettledAt;
      session.inInactivePeriod = false;
    } else {
      session.activeMs += Math.max(0, cutoff - session.lastSettledAt);
      addInactive(session, now - cutoff, now);
    }
    session.lastSettledAt = now;
  }

  function addInactive(session, ms, now) {
    if (ms <= 0) return;
    if (!session.inInactivePeriod) {
      session.inInactivePeriod = true;
      session.inactivityPeriodCount += 1;
      pushRawEvent(session, "activity_paused", {}, now);
    }
    session.inactiveMs += ms;
    session.inactivityPeriodsTotalMs += ms;
  }

  function markActive(session, now) {
    settle(session, now);
    const wasInactive = session.inInactivePeriod;
    session.lastActivityAt = now;
    session.acceptedActivitySignals += 1;
    session.inInactivePeriod = false;
    if (wasInactive) pushRawEvent(session, "activity_resumed", {}, now);
  }

  function setVisible(session, visible, now) {
    settle(session, now);
    if (session.visible !== visible) pushRawEvent(session, "visibility_changed", { visible: visible }, now);
    session.visible = visible;
    session.lastSettledAt = now;
  }

  function setFocused(session, focused, now) {
    settle(session, now);
    if (session.focused !== focused) pushRawEvent(session, "focus_changed", { focused: focused }, now);
    session.focused = focused;
    session.lastSettledAt = now;
  }

  // ── Pointermove: enda specialfallet som aldrig loggas som råhändelse ──
  function recordPointermove(session, now) {
    if (now - session.lastPointermoveAcceptedAt < session.config.pointermoveThrottleMs) {
      return false;
    }
    session.lastPointermoveAcceptedAt = now;
    session.pointermoveAcceptedCount += 1;
    markActive(session, now);
    return true;
  }

  function pushRawEvent(session, type, meta, now) {
    session.counts[type] = (session.counts[type] || 0) + 1;
    if (session.rawEvents.length >= session.config.maxRawEvents) {
      session.rawEvents.shift();
      session.droppedRawEventCount += 1;
    }
    session.rawEvents.push({ type: type, t: now - session.startedAt, meta: meta || {} });
  }

  // ── Konfigurationssignatur (ingen kryptografisk hash — enkel, stabil, läsbar) ──
  function buildConfigSignature(configValues) {
    const keys = Object.keys(configValues).sort();
    return keys.map(k => k + "=" + configValues[k]).join("|");
  }

  function fieldChangedSignificantly(field, oldVal, newVal, min, max, threshold) {
    if (CATEGORICAL_FIELDS.includes(field)) return oldVal !== newVal;
    if (typeof oldVal !== "number" || typeof newVal !== "number") return oldVal !== newVal;
    if (typeof min === "number" && typeof max === "number" && max > min) {
      return Math.abs(newVal - oldVal) / (max - min) >= threshold;
    }
    // Inget max-attribut på fältet (gäller k, t, l, kp, ti, td, noise, pulseMag,
    // pulseDuration i nuvarande UI) — "5 % av tillåtet intervall" går inte att
    // tillämpa bokstavligt. Fallback: 5 % relativ ändring mot föregående värde.
    // Dokumenterad begränsning, se docs/development/GAMIFICATION-PROTOTYPE.md.
    if (oldVal === 0) return newVal !== 0;
    return Math.abs(newVal - oldVal) / Math.abs(oldVal) >= threshold;
  }

  function getOrCreateContext(session, contextKey) {
    if (!session.contexts.has(contextKey)) {
      session.contexts.set(contextKey, {
        currentConfig: {},
        currentAttempt: null,
        distinctConfigs: [],
        observedConfigCount: 0,
        comparisonGroup: null, // GAM-003A.2 — satt via learning_step_reached, se recordEvent
      });
    }
    return session.contexts.get(contextKey);
  }

  // GAM-003A.2 — jämförelser DEKLARERADE i lärstigsdata (comparisonGroup),
  // för avsedda jämförelser som korsar kontextgränser (olika lärstigssteg
  // och/eller scenario-ID). Anropas EFTER den befintliga inom-kontext-
  // jämförelselogiken ovan, och ENDAST när kontexten har ett deklarerat
  // comparisonGroup. Bygger på GAM-002:s befintliga signatur-baserade
  // distinkthetskontroll (isDistinct) — en redan sedd konfiguration i DENNA
  // kontext utlöser aldrig en ny gruppjämförelse, precis som den aldrig
  // utlöser en ny inom-kontext-jämförelse.
  //
  // "Fler än två försök i en grupp": jämförs ENDAST mot det SENAST
  // registrerade försöket i gruppen (samma "jämför mot föregående"-princip
  // som redan gäller inom en kontext) — INTE alla möjliga kombinationer.
  // Fyra försök i en grupp ger alltså tre par (kedjat), inte sex. Se
  // docs/reports/GAM-003A.2_COMPARISON-GROUPS.md för motiveringen.
  //
  // Dubblettskydd: om den senast registrerade posten i gruppen är från
  // SAMMA kontext som den nya (dvs. paret redan räknats av den befintliga
  // inom-kontext-logiken ovan), bildas INGET nytt gruppar — bara
  // "senaste post"-pekaren uppdateras. A→B och B→A kan aldrig båda
  // registreras, eftersom bara riktningen "senaste → ny" någonsin prövas.
  function recordGroupComparison(session, groupId, contextKey, signature, fields) {
    let group = session.comparisonGroups.get(groupId);
    if (!group) {
      group = { lastEntry: null };
      session.comparisonGroups.set(groupId, group);
    }
    if (group.lastEntry && group.lastEntry.contextKey !== contextKey) {
      const changed = diffConfigs(group.lastEntry.fields, fields);
      session.groupComparisonPairs.push({
        group: groupId,
        fromContext: group.lastEntry.contextKey,
        toContext: contextKey,
        changedFields: changed,
      });
    }
    group.lastEntry = { contextKey: contextKey, signature: signature, fields: fields };
  }

  function finalizeAttempt(session, contextKey, ctx, now) {
    const attempt = ctx.currentAttempt;
    if (!attempt) return;
    if (attempt.stepCount <= 0) { ctx.currentAttempt = null; return; }
    ctx.observedConfigCount += 1;
    if (attempt.stepCount >= session.config.completedAttemptMinSteps) {
      session.attempts.completed += 1;
      const sig = buildConfigSignature(attempt.configSnapshot);
      const isDistinct = !ctx.distinctConfigs.some(c => c.signature === sig);
      if (isDistinct) {
        const prev = ctx.distinctConfigs[ctx.distinctConfigs.length - 1];
        ctx.distinctConfigs.push({ signature: sig, fields: attempt.configSnapshot });
        if (prev) {
          const changed = diffConfigs(prev.fields, attempt.configSnapshot);
          session.comparisonPairs.push({ contextKey: contextKey, changedFields: changed });
        }
        if (ctx.comparisonGroup) {
          recordGroupComparison(session, ctx.comparisonGroup, contextKey, sig, attempt.configSnapshot);
        }
      }
    } else {
      session.attempts.aborted += 1;
    }
    ctx.currentAttempt = null;
  }

  function diffConfigs(a, b) {
    const changed = [];
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach(k => { if (a[k] !== b[k]) changed.push(k); });
    return changed;
  }

  function ensureAttempt(session, contextKey, ctx, now) {
    if (!ctx.currentAttempt) {
      ctx.currentAttempt = {
        startedAt: now,
        stepCount: 0,
        configSnapshot: Object.assign({}, ctx.currentConfig),
      };
      session.attempts.started += 1;
    }
    return ctx.currentAttempt;
  }

  // ── Huvudingång: en normaliserad råhändelse ──
  function recordEvent(session, type, meta, now) {
    meta = meta || {};
    markActive(session, now);
    pushRawEvent(session, type, meta, now);

    switch (type) {
      case "scenario_loaded":
      case "learning_step_reached": {
        const contextKey = meta.contextKey;
        if (contextKey && contextKey !== session.currentContextKey) {
          if (session.currentContextKey) {
            const prevCtx = session.contexts.get(session.currentContextKey);
            if (prevCtx) finalizeAttempt(session, session.currentContextKey, prevCtx, now);
          }
          session.currentContextKey = contextKey;
          getOrCreateContext(session, contextKey); // säkerställ att kontexten finns redan nu
        }
        if (type === "learning_step_reached" && meta.learningPathId != null && meta.stepIndex != null) {
          const lp = session.learningPaths.get(meta.learningPathId) || { highestStepIndex: -1, completed: false, isNewProgress: false };
          lp.isNewProgress = meta.stepIndex > lp.highestStepIndex;
          if (lp.isNewProgress) lp.highestStepIndex = meta.stepIndex;
          if (meta.isFinalStep && lp.isNewProgress) lp.completed = true;
          session.learningPaths.set(meta.learningPathId, lp);
        }
        // GAM-003A.2 — deklarerat jämförelse-ID från lärstigsdata (valfritt).
        // Satt oavsett om kontexten just skapades eller redan fanns (t.ex.
        // scenario_loaded och learning_step_reached för samma steg, i
        // valfri ordning) — alltid samma, idempotenta tilldelning.
        if (contextKey && meta.comparisonGroup) {
          getOrCreateContext(session, contextKey).comparisonGroup = meta.comparisonGroup;
        }
        break;
      }
      case "simulation_step": {
        session.totalSimulatedSteps += 1;
        const ctx = session.currentContextKey && getOrCreateContext(session, session.currentContextKey);
        if (ctx) ensureAttempt(session, session.currentContextKey, ctx, now).stepCount += 1;
        break;
      }
      case "simulation_run": {
        session.totalSimulatedSteps += (meta.steps || 0);
        const ctx = session.currentContextKey && getOrCreateContext(session, session.currentContextKey);
        if (ctx) ensureAttempt(session, session.currentContextKey, ctx, now).stepCount += (meta.steps || 0);
        break;
      }
      case "system_reset": {
        if (session.currentContextKey) {
          const ctx = getOrCreateContext(session, session.currentContextKey);
          finalizeAttempt(session, session.currentContextKey, ctx, now);
        }
        break;
      }
      case "parameter_changed":
      case "regulator_mode_changed":
      case "process_type_changed": {
        if (!session.currentContextKey) break;
        const ctx = getOrCreateContext(session, session.currentContextKey);
        const field = meta.field;
        const oldVal = ctx.currentConfig[field];
        const newVal = meta.value;
        const relevant = CONFIG_FIELDS.includes(field) || CATEGORICAL_FIELDS.includes(field);
        const changedSignificantly = relevant && oldVal !== undefined &&
          fieldChangedSignificantly(field, oldVal, newVal, meta.min, meta.max, session.config.distinctConfigRelativeThreshold);
        ctx.currentConfig[field] = newVal;
        if (changedSignificantly) {
          finalizeAttempt(session, session.currentContextKey, ctx, now);
          ensureAttempt(session, session.currentContextKey, ctx, now);
        }
        break;
      }
      case "help_opened": {
        const helpId = meta.helpId;
        if (!helpId) break;
        const existing = session.help.opened.get(helpId);
        if (existing) {
          existing.openCount += 1;
          session.help.reopenCount += 1;
          meta.isFirstInSession = false;
        } else {
          session.help.opened.set(helpId, { firstAt: now - session.startedAt, openCount: 1 });
          meta.isFirstInSession = true;
        }
        break;
      }
      default:
        break;
    }
    return session;
  }

  function finalizeAllAttempts(session, now) {
    session.contexts.forEach((ctx, key) => finalizeAttempt(session, key, ctx, now));
  }

  function summary(session, now) {
    settle(session, now);
    // Sammanställning finaliserar INTE pågående försök i den levande sessionen
    // (en session kan fortsätta efter en summary()) — men rapporterar dem som
    // "pågående" separat så att pågående arbete inte osynligt går förlorat.
    let ongoingAttempts = 0;
    session.contexts.forEach(ctx => { if (ctx.currentAttempt && ctx.currentAttempt.stepCount > 0) ongoingAttempts += 1; });

    const distinctConfigCount = Array.from(session.contexts.values())
      .reduce((sum, ctx) => sum + ctx.distinctConfigs.length, 0);
    const observedConfigCount = Array.from(session.contexts.values())
      .reduce((sum, ctx) => sum + ctx.observedConfigCount, 0);

    const helpEntries = Array.from(session.help.opened.entries()).map(([id, v]) => ({ helpId: id, firstOpenedAtMs: v.firstAt, openCount: v.openCount }));

    let completedLearningPaths = 0;
    const learningPathSummary = [];
    session.learningPaths.forEach((v, id) => {
      if (v.completed) completedLearningPaths += 1;
      learningPathSummary.push({ learningPathId: id, highestStepIndex: v.highestStepIndex, completed: v.completed });
    });

    return {
      openSessionMs: now - session.startedAt,
      totalSimulatedSteps: session.totalSimulatedSteps,
      visibleFocusedMs: session.activeMs + session.inactiveMs,
      activeMs: session.activeMs,
      inactiveMs: session.inactiveMs,
      inactivityPeriodCount: session.inactivityPeriodCount,
      averageInactivityPeriodMs: session.inactivityPeriodCount > 0 ? session.inactivityPeriodsTotalMs / session.inactivityPeriodCount : 0,
      acceptedActivitySignals: session.acceptedActivitySignals,
      pointermoveAcceptedCount: session.pointermoveAcceptedCount,
      eventCounts: Object.assign({}, session.counts),
      droppedRawEventCount: session.droppedRawEventCount,
      rawEventCount: session.rawEvents.length,
      attempts: Object.assign({ ongoing: ongoingAttempts }, session.attempts),
      observedConfigCount: observedConfigCount,
      distinctConfigCount: distinctConfigCount,
      comparisonPairCount: session.comparisonPairs.length,
      comparisonPairs: session.comparisonPairs.slice(),
      groupComparisonPairCount: session.groupComparisonPairs.length, // GAM-003A.2
      groupComparisonPairs: session.groupComparisonPairs.slice(), // GAM-003A.2
      help: {
        totalOpened: Array.from(session.help.opened.values()).reduce((s, v) => s + v.openCount, 0),
        uniqueHelpIds: session.help.opened.size,
        reopenCount: session.help.reopenCount,
        entries: helpEntries,
      },
      learningPaths: learningPathSummary,
      completedLearningPaths: completedLearningPaths,
    };
  }

  return {
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    CONFIG_FIELDS: CONFIG_FIELDS,
    CATEGORICAL_FIELDS: CATEGORICAL_FIELDS,
    createSession: createSession,
    recordEvent: recordEvent,
    recordPointermove: recordPointermove,
    setVisible: setVisible,
    setFocused: setFocused,
    markActive: markActive,
    finalizeAllAttempts: finalizeAllAttempts,
    summary: summary,
    buildConfigSignature: buildConfigSignature,
  };
});
