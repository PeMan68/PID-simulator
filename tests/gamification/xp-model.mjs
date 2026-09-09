// GAM-003A — Återanvändbart XP-beräkningsverktyg.
//
// Beräknar XP och nivå från en sekvens av GAM-002-händelser UTAN att ändra
// eller omimplementera GAM-002:s aktivitetsmodell. Bygger uteslutande på
// apps/app/activity-prototype-core.js (oförändrad, importerad via require)
// och observerar dess sessionstillstånd (session.attempts, session.contexts,
// session.comparisonPairs, session.help, session.learningPaths) FÖRE och
// EFTER varje Core.recordEvent()-anrop — XP-lagret lägger aldrig till egen
// tolkning av VAD som räknas som ett genomfört försök, en distinkt
// konfiguration eller ett jämförelsepar. Det beslutet ligger helt i GAM-002.
//
// Två saker som GAM-002 inte modellerar alls hanteras i ett tunt eget lager:
//   - Analytisk enstegning (per-attempt-tak) — GAM-002 skiljer inte på
//     simulation_step (Stega) och simulation_run (Kör 10) i XP-hänseende,
//     bara i totalSimulatedSteps/stepCount. Se DEL 8.
//   - Checkpoints — finns inte som GAM-002-händelse alls (Test-läge har
//     ingen egen aktivitetsdispatch). Modelleras här som en SYNTETISK
//     händelsetyp "checkpoint_answered" som denna fil ensam tolkar (skickas
//     ändå vidare till Core.recordEvent för aktivitetssignalens skull —
//     Core ignorerar okända typer säkert, se dess `default: break`).
//
// Verktyget körs helt utan webbläsare (ren Node, samma UMD-import som
// tests/activity-prototype.test.mjs använder) och kopplas ALDRIG till
// appens UI eller till GAM-002:s registreringsmodell.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const CORE_PATH = path.resolve(__dirname, "..", "..", "apps", "app", "activity-prototype-core.js");
export const Core = require(CORE_PATH);

// ── DEL 3: XP-regler och nivågränser, samlade på ett ställe ──
// Detta är PM:s preliminära huvudkandidat (GAM-003A-uppdraget). Alternativ
// som provräknas i DEL 9–13 definieras som separata XP_RULES-varianter i
// calibrate.mjs / sensitivity.mjs, inte här.
export const XP_RULES_V1 = Object.freeze({
  newHighestStep: 2,
  completedLearningPath: 12,
  completedAttempt: 4,
  distinctConfig: 2,
  comparisonPair: 6,
  uniqueHelp: 2,
  helpCapPerSession: Infinity, // provräknas separat, se DEL 9
  measurementWork: 4,
  singleStepXP: 1,
  singleStepCapPerAttempt: 5,
  checkpointFirstTryCorrect: 4,
  checkpointCorrectAfterWrong: 2,
});

export const LEVELS_V1 = Object.freeze([
  { name: "Reglernovis", threshold: 0 },
  { name: "Looplärling", threshold: 35 },
  { name: "Signalspanare", threshold: 90 },
  { name: "Processutforskare", threshold: 170 },
  { name: "Loopvävare", threshold: 280 },
  { name: "Regleradept", threshold: 425 },
  { name: "Processmästare", threshold: 610 },
  { name: "Reglerlegend", threshold: 840 },
]);

// Alternativa nivåkurvor för DEL 13.
export const LEVELS_FAST = Object.freeze([
  { name: "Reglernovis", threshold: 0 },
  { name: "Looplärling", threshold: 22 },
  { name: "Signalspanare", threshold: 55 },
  { name: "Processutforskare", threshold: 100 },
  { name: "Loopvävare", threshold: 165 },
  { name: "Regleradept", threshold: 250 },
  { name: "Processmästare", threshold: 360 },
  { name: "Reglerlegend", threshold: 500 },
]);

export const LEVELS_SLOW = Object.freeze([
  { name: "Reglernovis", threshold: 0 },
  { name: "Looplärling", threshold: 50 },
  { name: "Signalspanare", threshold: 130 },
  { name: "Processutforskare", threshold: 250 },
  { name: "Loopvävare", threshold: 410 },
  { name: "Regleradept", threshold: 620 },
  { name: "Processmästare", threshold: 890 },
  { name: "Reglerlegend", threshold: 1220 },
]);

// PO/PM:s reviderade huvudkandidat (GAM-003A.1, 2026-09-09) — ersätter
// LEVELS_V1 som förstahandsval efter beslutet att INTE begränsa repetition/
// hjälp/enstegning. Se docs/reports/GAM-003A.1_XP-KALIBRERING-REPETITION.md.
export const LEVELS_V2 = Object.freeze([
  { name: "Reglernovis", threshold: 0 },
  { name: "Looplärling", threshold: 50 },
  { name: "Signalspanare", threshold: 140 },
  { name: "Processutforskare", threshold: 300 },
  { name: "Loopvävare", threshold: 550 },
  { name: "Regleradept", threshold: 900 },
  { name: "Processmästare", threshold: 1400 },
  { name: "Reglerlegend", threshold: 2100 },
]);

/**
 * Beräknar nivå + relativ progression för en given ackumulerad XP-summa.
 * Nivåmätaren exponerar aldrig XP-talen själva utanför detta verktyg — se
 * `ratio` (0..1) för den grafiska mätaren.
 */
export function levelFor(totalXP, levels = LEVELS_V1) {
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

/**
 * Slår ihop två endState/priorState-objekt (GAM-003A.1) — t.ex. resultatet
 * av en lärstig med det som ackumulerats från tidigare lärstigar i samma
 * "karriär". learningPaths/contexts är redan nyckelavgränsade per
 * lärstig/kontext, så en enkel union räcker.
 */
export function mergeState(a, b) {
  if (!a) return b;
  if (!b) return a;
  return {
    learningPaths: Object.assign({}, a.learningPaths, b.learningPaths),
    contexts: Object.assign({}, a.contexts, b.contexts),
  };
}

function sumDistinctConfigs(session) {
  let n = 0;
  session.contexts.forEach(ctx => { n += ctx.distinctConfigs.length; });
  return n;
}

/**
 * Kör en händelsesekvens genom GAM-002:s kärna (oförändrad) och beräknar XP
 * enligt `rules`. Events: [{ type, meta, dtMs }] — dtMs är tid sedan FÖREGÅENDE
 * händelse (ms); utelämnas dtMs antas 1000ms mellan varje händelse (irrelevant
 * för XP så länge inaktivitetsgränsen på 60s inte överskrids av misstag).
 *
 * `priorState` (GAM-003A.1): valfritt, för att kedja BESTÅENDE progression
 * över flera "sessioner" (flera computeXP()-anrop, t.ex. samma lärstig
 * repeterad, eller en hel karriär av lärstigar) — motsvarar den lokala
 * lagring en framtida synlig prototyp (GAM-003B) skulle behöva. Formen:
 *   {
 *     learningPaths: { [learningPathId]: { highestStepIndex, completed } },
 *     contexts: { [contextKey]: string[] }  // tidigare sedda konfigurations-
 *                                            // signaturer i den kontexten
 *   }
 * Detta lager rör ALDRIG GAM-002:s egen kod — det bara FÖR-fyller samma
 * Map-strukturer `session.learningPaths`/`session.contexts` redan använder,
 * så att Core:s egen "redan nått"/"redan distinkt"-logik (oförändrad)
 * naturligt slår till för det som carry:as över. Sessionsbundna kategorier
 * (hjälp, jämförelsepar, mätarbete, enstegning, genomfört försök) nollställs
 * som vanligt varje anrop — precis som PO/PM beslutat att de ska kunna ge
 * XP på nytt vid varje genomgång/session.
 *
 * Returnerar ett fullständigt spårbart resultat: varje beviljad eller
 * blockerad XP-post, kategori-summor, sluttillståndet för rapportering, och
 * `endState` i samma form som `priorState` för att kedjas in i nästa anrop.
 */
export function computeXP(events, rules = XP_RULES_V1, priorState = null) {
  const session = Core.createSession(0);
  let now = 0;

  if (priorState) {
    if (priorState.learningPaths) {
      Object.entries(priorState.learningPaths).forEach(([id, lp]) => {
        session.learningPaths.set(id, { highestStepIndex: lp.highestStepIndex, completed: !!lp.completed });
      });
    }
    if (priorState.contexts) {
      Object.entries(priorState.contexts).forEach(([contextKey, signatures]) => {
        session.contexts.set(contextKey, {
          currentConfig: {},
          currentAttempt: null,
          distinctConfigs: signatures.map(sig => ({ signature: sig, fields: {} })),
          observedConfigCount: signatures.length,
        });
      });
    }
  }

  const log = []; // { index, type, xp, category, reason }
  const blocked = []; // { index, type, reason }
  const byCategory = {
    newHighestStep: 0, completedLearningPath: 0, completedAttempt: 0,
    distinctConfig: 0, comparisonPair: 0, uniqueHelp: 0, measurementWork: 0,
    singleStep: 0, checkpointFirst: 0, checkpointAfterWrong: 0,
  };

  // Eget, tunt lager ovanpå Core — se filhuvudet.
  let singleStepsThisAttempt = 0;
  let helpAwardedCount = 0; // för helpCapPerSession
  let measurement = { active: false, adjusted: false, awarded: false };
  const checkpointState = new Map(); // checkpointId -> { answeredCorrectly, everWrong }
  // GAM-003A.1: "Slutförd lärstig" ska ge XP VARJE genomgång (PO/PM:s
  // reviderade beslut), men Core:s egen `lp.completed`-flagga är bestående
  // (sätts bara vid EN NY högsta-steg-händelse, se activity-prototype-core.js).
  // Den kopplingen används därför INTE här — istället avgörs "en genomgång"
  // per session (per computeXP()-anrop) med en egen spärr, så att
  // fram/bakåt-klick till samma sista steg inom EN session inte farmar XP,
  // men en ny session (repeterad lärstig) korrekt ger XP på nytt.
  const completedLearningPathThisSession = new Set();

  function award(category, amount, index, type, reason) {
    if (amount <= 0) return;
    byCategory[category] += amount;
    log.push({ index, type, xp: amount, category, reason });
  }
  function block(index, type, reason) {
    blocked.push({ index, type, reason });
  }

  events.forEach((ev, index) => {
    const type = ev.type;
    const meta = ev.meta || {};
    now += (ev.dtMs != null ? ev.dtMs : 1000);

    // ── Checkpoints: syntetisk händelse, tolkas helt i detta lager ──
    if (type === "checkpoint_answered") {
      safeCoreRecord(session, type, meta, now);
      const id = meta.checkpointId;
      const st = checkpointState.get(id) || { answeredCorrectly: false, everWrong: false };
      if (meta.correct) {
        if (st.answeredCorrectly) {
          block(index, type, `Checkpoint "${id}" redan besvarad rätt — ingen ytterligare XP.`);
        } else if (!st.everWrong) {
          award("checkpointFirst", rules.checkpointFirstTryCorrect, index, type, `Rätt på första försöket (checkpoint "${id}").`);
          st.answeredCorrectly = true;
        } else {
          award("checkpointAfterWrong", rules.checkpointCorrectAfterWrong, index, type, `Rätt efter tidigare fel (checkpoint "${id}").`);
          st.answeredCorrectly = true;
        }
      } else {
        st.everWrong = true;
        block(index, type, `Fel svar (checkpoint "${id}") — 0 XP.`);
      }
      checkpointState.set(id, st);
      return;
    }

    // ── Snapshot FÖRE (för diff-baserad XP på Core:s eget tillstånd) ──
    const before = {
      attemptsCompleted: session.attempts.completed,
      distinctConfigs: sumDistinctConfigs(session),
      comparisonPairs: session.comparisonPairs.length,
      helpUnique: session.help.opened.size,
      lp: meta.learningPathId != null
        ? Object.assign({}, session.learningPaths.get(meta.learningPathId) || { highestStepIndex: -1, completed: false })
        : null,
    };

    safeCoreRecord(session, type, meta, now);

    // ── Diff EFTER: genomfört försök ──
    if (session.attempts.completed > before.attemptsCompleted) {
      const n = session.attempts.completed - before.attemptsCompleted;
      award("completedAttempt", rules.completedAttempt * n, index, type, "Genomfört försök (minst 20 steg).");
      singleStepsThisAttempt = 0; // nytt försök påbörjas efter finalisering
    }

    // ── Diff EFTER: distinkt konfiguration ──
    const afterDistinct = sumDistinctConfigs(session);
    if (afterDistinct > before.distinctConfigs) {
      award("distinctConfig", rules.distinctConfig * (afterDistinct - before.distinctConfigs), index, type, "Ny distinkt parameterkonfiguration (efter genomfört försök).");
    }

    // ── Diff EFTER: jämförelsepar ──
    if (session.comparisonPairs.length > before.comparisonPairs) {
      award("comparisonPair", rules.comparisonPair * (session.comparisonPairs.length - before.comparisonPairs), index, type, "Nytt jämförelsepar inom samma kontext.");
    }

    // ── Diff EFTER: unik hjälptext ──
    if (type === "help_opened") {
      if (session.help.opened.size > before.helpUnique) {
        if (helpAwardedCount < rules.helpCapPerSession) {
          award("uniqueHelp", rules.uniqueHelp, index, type, `Ny unik hjälptext ("${meta.helpId}").`);
          helpAwardedCount += 1;
        } else {
          block(index, type, `Hjälptak (${rules.helpCapPerSession}) nått — ingen ytterligare hjälp-XP denna session.`);
        }
      } else {
        block(index, type, `Hjälptext ("${meta.helpId}") redan öppnad denna session — 0 XP.`);
      }
    }

    // ── Diff EFTER: nytt högsta lärsteg (bestående, kedjebart via priorState) ──
    if (type === "learning_step_reached" && meta.learningPathId != null) {
      const afterLp = session.learningPaths.get(meta.learningPathId);
      const beforeHighest = before.lp ? before.lp.highestStepIndex : -1;
      if (afterLp && afterLp.highestStepIndex > beforeHighest) {
        award("newHighestStep", rules.newHighestStep, index, type, `Nytt högsta lärsteg (index ${afterLp.highestStepIndex}).`);
      } else {
        block(index, type, "Redan nått lärsteg (återbesök) — 0 XP.");
      }
      // ── Slutförd lärstig: repeterbar per session (se completedLearningPathThisSession ovan) ──
      if (meta.isFinalStep && !completedLearningPathThisSession.has(meta.learningPathId)) {
        completedLearningPathThisSession.add(meta.learningPathId);
        award("completedLearningPath", rules.completedLearningPath, index, type, "Lärstigen slutförd (sista steget nått denna genomgång).");
      }
    }

    // ── Analytisk enstegning: eget lager, per-försök-tak ──
    if (type === "simulation_step") {
      singleStepsThisAttempt += 1;
      if (singleStepsThisAttempt <= rules.singleStepCapPerAttempt) {
        award("singleStep", rules.singleStepXP, index, type, `Enstegning ${singleStepsThisAttempt}/${rules.singleStepCapPerAttempt} i pågående försök.`);
      } else {
        block(index, type, `Enstegningstak (${rules.singleStepCapPerAttempt}/försök) nått — 0 XP.`);
      }
    }
    if (type === "simulation_run") {
      block(index, type, "Kör 10 ger ingen direkt XP (räknas mot 20-stegsgränsen för genomfört försök).");
    }

    // ── Mätarbete: eget litet tillståndslager ──
    if (type === "measurement_started") {
      measurement = { active: true, adjusted: false, awarded: false };
    } else if (type === "measurement_adjusted") {
      if (measurement.active) measurement.adjusted = true;
    } else if (type === "measurement_facit_opened") {
      block(index, type, "Facit ger 0 XP.");
    } else if (measurement.active && measurement.adjusted && !measurement.awarded &&
               (type === "simulation_step" || type === "simulation_run" || type === "learning_step_reached" || type === "scenario_loaded")) {
      award("measurementWork", rules.measurementWork, index, type, "Genomfört mätarbete (aktiverat + justerat + följt av aktivitet).");
      measurement.awarded = true;
    }
    if (type === "system_reset" || type === "scenario_loaded" || type === "learning_step_reached") {
      // Ett nytt sammanhang/en ny mätserie börjar — mätarbetstillståndet gäller
      // bara inom det sammanhang det startades i.
      if (type !== "measurement_started") measurement = { active: false, adjusted: false, awarded: measurement.awarded };
      if (type === "system_reset" || type === "scenario_loaded") singleStepsThisAttempt = 0;
    }
    if (type === "chart_cleared" || type === "system_reset" || type === "measurement_facit_opened" ||
        type === "disturbance_triggered") {
      if (!log.length || log[log.length - 1].index !== index) {
        block(index, type, "0 XP per modell (se lista över 0-XP-aktiviteter).");
      }
    }
  });

  // ── Sessionsslut: finalisera ev. pågående försök ──
  // Utan en avslutande händelse (Reset/scenariobyte/betydande parameter-
  // ändring) sist i sekvensen skulle det SISTA försökets XP annars aldrig
  // räknas, trots att stegkravet uppfyllts — det vore en artefakt av var
  // testsekvensen råkar sluta, inte ett äkta avbrutet försök.
  {
    const beforeFinal = {
      attemptsCompleted: session.attempts.completed,
      distinctConfigs: sumDistinctConfigs(session),
      comparisonPairs: session.comparisonPairs.length,
    };
    Core.finalizeAllAttempts(session, now);
    if (session.attempts.completed > beforeFinal.attemptsCompleted) {
      award("completedAttempt", rules.completedAttempt * (session.attempts.completed - beforeFinal.attemptsCompleted), events.length, "session_end", "Genomfört försök (finaliserat vid sessionens slut).");
    }
    const afterFinalDistinct = sumDistinctConfigs(session);
    if (afterFinalDistinct > beforeFinal.distinctConfigs) {
      award("distinctConfig", rules.distinctConfig * (afterFinalDistinct - beforeFinal.distinctConfigs), events.length, "session_end", "Ny distinkt parameterkonfiguration (finaliserad vid sessionens slut).");
    }
    if (session.comparisonPairs.length > beforeFinal.comparisonPairs) {
      award("comparisonPair", rules.comparisonPair * (session.comparisonPairs.length - beforeFinal.comparisonPairs), events.length, "session_end", "Nytt jämförelsepar (finaliserat vid sessionens slut).");
    }
  }

  const totalNoCheckpoints = Object.keys(byCategory)
    .filter(k => k !== "checkpointFirst" && k !== "checkpointAfterWrong")
    .reduce((s, k) => s + byCategory[k], 0);
  const totalWithCheckpoints = totalNoCheckpoints + byCategory.checkpointFirst + byCategory.checkpointAfterWrong;

  const endState = {
    learningPaths: Object.fromEntries(
      Array.from(session.learningPaths.entries()).map(([id, lp]) => [id, { highestStepIndex: lp.highestStepIndex, completed: lp.completed }])
    ),
    contexts: Object.fromEntries(
      Array.from(session.contexts.entries()).map(([key, ctx]) => [key, ctx.distinctConfigs.map(c => c.signature)])
    ),
  };

  return {
    byCategory,
    totalXPNoCheckpoints: totalNoCheckpoints,
    totalXPWithCheckpoints: totalWithCheckpoints,
    log,
    blocked,
    session, // exponerat för rapportering (attempts, help, comparisonPairs, learningPaths)
    endState, // kedjebart priorState för nästa computeXP()-anrop (GAM-003A.1)
  };
}

function safeCoreRecord(session, type, meta, now) {
  Core.recordEvent(session, type, meta, now);
}
