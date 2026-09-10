/* GAM-003B/GAM-003C — Synlig DEV-prototyp för XP och nivåprogression: bootstrap/glue.
 *
 * Kopplar ihop (alla DEV-only, laddade av app.js — se dess
 * ENV_CONFIG.showGamification-styrda injektion):
 *  - gamification-xp-engine.js (DOM-fri XP-/nivåmotor, testad i Node)
 *  - gamification-store.js     (DOM-fri localStorage-adapter, testad i Node)
 *  - gamification-ui.js        (DOM-rendering mot index.html:s statiska skal)
 *  - window.ActivityPrototype  (GAM-002:s DOM-koppling, activity-prototype.js)
 *
 * ENDA integrationspunkten mot GAM-002 är window.ActivityPrototype.onEvent(fn) —
 * en post-record-lyssnare som anropas EFTER att GAM-002 redan bokfört
 * händelsen i sin session. Denna fil anropar ALDRIG
 * ActivityPrototypeCore.recordEvent själv, så samma aktivitet kan aldrig
 * bokföras dubbelt (en gång av GAM-002, en gång av gamification-motorn) —
 * se STOPPVILLKOR i GAM-003B-uppdraget.
 *
 * GAM-003C — KVALIFICERAD OCH FÖRDRÖJD VISNING: XP bokförs fortfarande
 * direkt (`Engine.processEvent` + `save()` sker för varje beviljad
 * kategori), men nivåytan (`UI.render`) uppdateras bara vid "naturliga
 * avstämningspunkter" — se `Engine.shouldFlush`. Det är den ENDA platsen i
 * hela gamification-modulen som avgör NÄR något visas; bokföringen i
 * gamification-xp-engine.js vet ingenting om rendering.
 *
 * Appens simulatorfunktioner rör sig ALDRIG genom denna fil (ingen import
 * härifrån till app.js) — om något här kastar ett ovärderat fel eller om en
 * beroendemodul saknas, stannar bara gamification-funktionen. Se `safeCall`.
 */
(function () {
  if (typeof window === "undefined") return;
  if (!window.ENV_CONFIG || window.ENV_CONFIG.environment !== "development" || !window.ENV_CONFIG.showGamification) return;

  function safeCall(fn, label) {
    try { return fn(); } catch (err) {
      console.warn("gamification: internt fel (ignoreras) i " + (label || "okänt steg") + ":", err);
      return undefined;
    }
  }

  let attempts = 0;
  const MAX_ATTEMPTS = 100; // ~5s vid 50ms mellanrum — täcker normal asynkron scriptladdning gott och väl
  function waitForDependencies() {
    if (window.ActivityPrototype && window.GamificationXPEngine && window.GamificationStore && window.GamificationUI) {
      start();
      return;
    }
    attempts += 1;
    if (attempts >= MAX_ATTEMPTS) {
      console.warn("gamification: beroenden (ActivityPrototype/XP-motor/lager/UI) laddades aldrig — nivåytan startar inte. Simulatorn fungerar normalt.");
      return;
    }
    window.setTimeout(waitForDependencies, 50);
  }

  function start() {
    const Engine = window.GamificationXPEngine;
    const Store = window.GamificationStore;
    const UI = window.GamificationUI;

    let engine = null;
    let persisting = false;

    // GAM-003C — DEV-only ringbuffert: "varför gavs (eller gavs inte) XP".
    // Rent minne, sparas ALDRIG till localStorage, existerar bara i DEV.
    const LOG_MAX = 200;
    let devLog = [];
    function pushLog(entry) {
      devLog.push(entry);
      if (devLog.length > LOG_MAX) devLog.shift();
    }

    function persistedFromEngine() {
      return Object.assign(Store.createEmptyState(), Engine.toPersistable(engine));
    }

    function save() {
      if (persisting) return; // enkelt skydd mot rekursiva/överlappande skrivningar
      persisting = true;
      safeCall(() => Store.save(persistedFromEngine()), "spara progression");
      persisting = false;
    }

    // Renderar den SENAST FLUSHADE nivån (engine.displayedXP) — ALDRIG
    // engine.totalXP direkt. Se filhuvudet.
    function renderDisplayed() {
      const info = Engine.levelForDisplay(engine.displayedXP, engine.highestLevelIndex, engine.levels);
      safeCall(() => UI.render(info), "rendera nivå");
      return info;
    }

    function bootstrapEngine() {
      const persisted = safeCall(() => Store.load(), "läsa sparad progression") || Store.createEmptyState();
      engine = Engine.createEngine(persisted, Engine.XP_RULES_V1, Engine.LEVELS_V1);
      const session = window.ActivityPrototype.session();
      safeCall(() => Engine.seedSession(session, engine), "seeda session");
    }

    // GAM-003C — den ENDA punktvisa timern i hela modulen: schemalagd exakt
    // till den tidpunkt då ett tidsbaserat, pågående kvalificeringsvillkor
    // (teoristegets lästid, ett blandat stegs 50%-tid, eller hjälpens 3s)
    // SKULLE bli uppfyllt — INTE en återkommande polling-loop. Fångar fallet
    // där användaren blir overksam (läser klart, gör inget mer) innan nästa
    // RIKTIGA händelse råkar inträffa; utan detta skulle kvalificeringen
    // bara upptäckas retroaktivt vid nästa faktiska klick, om något sådant
    // någonsin kommer. Ombokas (clearTimeout + nytt setTimeout) varje gång
    // ett pågående villkors återstående tid kan ha ändrats. Rör aldrig XP
    // eller Core självt — anropar bara Engine.checkPending, som är en ren
    // omvärdering utan någon ActivityPrototypeCore.recordEvent-händelse.
    let pendingCheckTimer = null;
    function clearPendingCheckTimer() {
      if (pendingCheckTimer) { window.clearTimeout(pendingCheckTimer); pendingCheckTimer = null; }
    }
    function scheduleNextPendingCheck(session) {
      clearPendingCheckTimer();
      const snap = safeCall(() => Engine.debugSnapshot(engine, session), "läsa väntande kvalificeringar");
      if (!snap) return;
      const remainders = [];
      if (snap.pendingStep && snap.pendingStep.minActiveMs > 0) {
        remainders.push(snap.pendingStep.minActiveMs - snap.pendingStep.elapsedActiveMs);
      }
      if (snap.pendingHelp) {
        remainders.push(snap.pendingHelp.minActiveMs - snap.pendingHelp.elapsedActiveMs);
      }
      const positive = remainders.filter(r => r > 0);
      if (positive.length === 0) return;
      const waitMs = Math.min.apply(null, positive) + 50; // liten marginal mot avrundning
      pendingCheckTimer = window.setTimeout(() => {
        pendingCheckTimer = null;
        safeCall(() => window.ActivityPrototype.summary(), "uppdatera aktiv tid"); // tvingar Core att räkna av tiden fram till nu (settle()), utan att logga någon händelse
        const now = performance.now();
        const result = safeCall(() => Engine.checkPending(engine, session, now), "kontrollera väntande kvalificering");
        if (result) applyResult(null, result, session);
        scheduleNextPendingCheck(session); // ev. kvarvarande väntande villkor
      }, waitMs);
    }

    // Delad av handleEvent() OCH den schemalagda kontrollen ovan: bokför
    // (logga+spara) beviljad XP direkt, och synka/rendera baren bara vid en
    // naturlig avstämningspunkt (`Engine.shouldFlush`).
    function applyResult(type, result, session) {
      if (result.awarded.length > 0) {
        pushLog({ t: performance.now(), type: type || "pending_check", awarded: result.awarded.slice(), totalXPAfter: result.totalXPAfter });
        save(); // bokförs direkt, oavsett om baren uppdateras nu eller senare
      }
      const flushNow = safeCall(() => Engine.shouldFlush(engine, type, result.awarded), "avgör avstämningspunkt");
      if (flushNow) {
        const flushed = safeCall(() => Engine.flush(engine), "synka visad nivå");
        if (flushed) {
          safeCall(() => UI.render(flushed.level), "rendera nivå");
          if (flushed.leveledUp) safeCall(() => UI.showLevelUp(flushed.level), "visa nivåbyte");
        }
      }
    }

    function handleEvent(type, meta, session, now) {
      if (type === "session_started") {
        // GAM-002:s DEV-konsol kan starta om aktivitetssessionen
        // (ActivityPrototype.reset()) — en helt ny, tom Core-session kräver
        // att motorns sessionsbundna räknare (och GAM-003C:s väntande
        // steg-/hjälpkvalificeringar) nollställs i takt, annars skulle
        // framtida diffar bli felaktiga. De BESTÅENDE delarna (totalXP,
        // contextSignatures m.m.) rörs inte.
        clearPendingCheckTimer();
        safeCall(() => Engine.resetSessionScope(engine), "nollställ sessionsräknare");
        safeCall(() => Engine.seedSession(session, engine), "seeda ny session");
        renderDisplayed();
        return;
      }
      const result = safeCall(() => Engine.processEvent(engine, session, type, meta, now), "bearbeta händelse");
      if (!result) return;
      applyResult(type, result, session);
      scheduleNextPendingCheck(session);
    }

    function onReset() {
      clearPendingCheckTimer();
      safeCall(() => Store.resetProgression(), "återställ progression");
      bootstrapEngine();
      // Bugg 2026-013: ett nytt, tomt `engine`-objekt räcker INTE ensamt —
      // GAM-002:s aktivitetssession (session.attempts/comparisonPairs/
      // help.opened/distinctConfigs per kontext) är sessionsbunden och
      // fortsätter annars leva kvar oförändrad med all aktivitet från FÖRE
      // återställningen. Motorns diff-baserade bokföring jämför sessionens
      // RÅA räknare mot sin egen (nu nollställda) ögonblicksbild — nästa
      // händelse, oavsett typ, skulle då tolka HELA den gamla sessionens
      // redan-existerande aktivitet som "ny" och kreditera den i klump
      // (reproducerat: ett enda "Stega"-klick gav nivå 2 direkt). Att även
      // starta om själva aktivitetssessionen (samma mekanism som en vanlig
      // sidladdning) eliminerar detta helt — dispatchar "session_started",
      // som redan hanteras av handleEvent() nedan (nollställer motorns
      // sessionsräknare OCH seedar om den NYA sessionen mot det nu tomma,
      // återställda tillståndet). Måste ske EFTER bootstrapEngine() ovan,
      // så seedningen sker mot rätt (tomma) learningPathMeta.
      safeCall(() => window.ActivityPrototype.reset(), "återställ aktivitetssession");
      devLog = []; // GAM-003C — "återställa progression OCH debugdata"
      renderDisplayed();
    }

    bootstrapEngine();
    const uiReady = safeCall(() => UI.init({ onReset }), "initiera nivå-UI");
    if (!uiReady) return;
    renderDisplayed();
    window.ActivityPrototype.onEvent(handleEvent);

    // ── DEV-konsolstöd (GAM-003B/GAM-003C) ──
    // Kommandon som SPEGLAR verklig, redan bokförd progression (säkra att
    // köra när som helst, ändrar ingenting): state(), pending(), log().
    // Kommandon som är RENA TESTHJÄLPMEDEL (motsvarar INGEN verklig
    // aktivitet i appen, men skriver till samma localStorage-nyckel som
    // riktig XP för att kunna testa persistens/nivåbyten end-to-end —
    // använd reset() efteråt för att städa bort testdata): setXP,
    // grantTestXP, jumpToLevel, placeNearLevel, simulateLevelUp,
    // simulateLevelUpSequence. forceFlush() är ett tekniskt testhjälpmedel
    // som tvingar fram en bar-uppdatering utan att vänta på en naturlig
    // avstämningspunkt (rör inte XP alls). reset() är en verklig, riktig
    // radering (samma som "Återställ progression"-knappen), utan
    // bekräftelsedialog eftersom ett konsolanrop redan är en medveten
    // handling.
    window.GamificationDev = {
      state() {
        return {
          totalXP: engine.totalXP,
          displayedXP: engine.displayedXP,
          pendingVisualXP: engine.totalXP - engine.displayedXP,
          highestLevelIndex: engine.highestLevelIndex,
          bookedLevel: Engine.levelForDisplay(engine.totalXP, engine.highestLevelIndex, engine.levels),
          displayedLevel: Engine.levelForDisplay(engine.displayedXP, engine.highestLevelIndex, engine.levels),
          persisted: persistedFromEngine(),
        };
      },
      pending() {
        return Engine.debugSnapshot(engine, window.ActivityPrototype.session());
      },
      log(limit) {
        return typeof limit === "number" ? devLog.slice(-limit) : devLog.slice();
      },
      setXP(amount) {
        amount = Number(amount);
        if (!isFinite(amount) || amount < 0) return "Ange ett XP-belopp >= 0 (testhjälpmedel — sätter totalXP absolut, motsvarar ingen verklig aktivitet).";
        engine.totalXP = amount;
        save();
        return "Testhjälpmedel: totalXP satt till " + amount + ". Kör forceFlush() för att visa det direkt, eller vänta på nästa avstämningspunkt.";
      },
      grantTestXP(amount) {
        amount = Number(amount) || 0;
        if (amount <= 0) return "Ange ett positivt XP-belopp (testhjälpmedel — motsvarar ingen verklig aktivitet).";
        engine.totalXP += amount;
        save();
        return "Testhjälpmedel: +" + amount + " XP tillagt (bokfört, sparat). Kör forceFlush() för att visa det direkt.";
      },
      jumpToLevel(levelIndex) {
        const levels = engine.levels;
        const idx = Math.max(0, Math.min(levels.length - 1, Number(levelIndex) || 0));
        engine.totalXP = levels[idx].threshold;
        save();
        const flushed = Engine.flush(engine);
        UI.render(flushed.level);
        if (flushed.leveledUp) UI.showLevelUp(flushed.level);
        return "Testhjälpmedel: hoppade till nivå " + (idx + 1) + " (" + levels[idx].name + "), visad direkt.";
      },
      placeNearLevel(levelIndex, offset) {
        const levels = engine.levels;
        const idx = Math.max(0, Math.min(levels.length - 1, Number(levelIndex) || 0));
        const off = Number(offset) || 0;
        engine.totalXP = Math.max(0, levels[idx].threshold + off);
        save();
        const flushed = Engine.flush(engine);
        UI.render(flushed.level);
        return "Testhjälpmedel: XP satt till " + engine.totalXP + " (" + (off < 0 ? off : "+" + off) + " XP mot nivå " + (idx + 1) + "s gräns), visad direkt.";
      },
      simulateLevelUp(toLevelIndex) {
        const levels = engine.levels;
        const idx = typeof toLevelIndex === "number" ? Math.max(0, Math.min(levels.length - 1, toLevelIndex)) : Math.min(levels.length - 1, engine.highestLevelIndex + 1);
        const fake = Engine.levelForDisplay(levels[idx].threshold, idx, levels);
        UI.showLevelUp(fake);
        return "Testhjälpmedel: visar nivåbytesanimationen för \"" + fake.levelName + "\" — ingen XP eller lagring påverkad.";
      },
      simulateLevelUpSequence(fromLevelIndex, toLevelIndex, delayMs) {
        const levels = engine.levels;
        const from = Math.max(0, Math.min(levels.length - 1, Number(fromLevelIndex) || 0));
        const to = Math.max(0, Math.min(levels.length - 1, Number(toLevelIndex) || 0));
        const step = to >= from ? 1 : -1;
        const wait = typeof delayMs === "number" ? delayMs : 1200;
        let i = from;
        function playNext() {
          const fake = Engine.levelForDisplay(levels[i].threshold, i, levels);
          UI.showLevelUp(fake);
          if (i !== to) { i += step; window.setTimeout(playNext, wait); }
        }
        playNext();
        return "Testhjälpmedel: spelar upp " + (Math.abs(to - from) + 1) + " nivåbytesanimationer i sekvens — ingen XP eller lagring påverkad.";
      },
      forceFlush() {
        const flushed = Engine.flush(engine);
        UI.render(flushed.level);
        if (flushed.leveledUp) UI.showLevelUp(flushed.level);
        return "Baren tvingad att synka mot bokförd XP (" + engine.totalXP + ").";
      },
      reset() {
        onReset();
        return "Gamification-progression och debugdata återställda (Reglernovis, 0 XP).";
      },
    };

    console.info("[gamification] Nivåprototyp startad (DEV-only). window.GamificationDev för testkommandon.");
  }

  waitForDependencies();
})();
