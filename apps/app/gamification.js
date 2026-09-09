/* GAM-003B — Synlig DEV-prototyp för XP och nivåprogression: bootstrap/glue.
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

    function persistedFromEngine() {
      return Object.assign(Store.createEmptyState(), Engine.toPersistable(engine));
    }

    function save() {
      if (persisting) return; // enkelt skydd mot rekursiva/överlappande skrivningar
      persisting = true;
      safeCall(() => Store.save(persistedFromEngine()), "spara progression");
      persisting = false;
    }

    function renderCurrent() {
      const info = Engine.levelForDisplay(engine.totalXP, engine.highestLevelIndex, engine.levels);
      safeCall(() => UI.render(info), "rendera nivå");
      return info;
    }

    function bootstrapEngine() {
      const persisted = safeCall(() => Store.load(), "läsa sparad progression") || Store.createEmptyState();
      engine = Engine.createEngine(persisted, Engine.XP_RULES_V1, Engine.LEVELS_V1);
      const session = window.ActivityPrototype.session();
      safeCall(() => Engine.seedSession(session, engine), "seeda session");
    }

    function handleEvent(type, meta, session, now) {
      if (type === "session_started") {
        // GAM-002:s DEV-konsol kan starta om aktivitetssessionen
        // (ActivityPrototype.reset()) — en helt ny, tom Core-session kräver
        // att motorns sessionsbundna räknare nollställs i takt, annars skulle
        // framtida diffar bli felaktiga (jämfört mot en nu obefintlig gammal
        // session). De BESTÅENDE delarna (totalXP, contextSignatures m.m.)
        // rörs inte.
        safeCall(() => Engine.resetSessionScope(engine), "nollställ sessionsräknare");
        safeCall(() => Engine.seedSession(session, engine), "seeda ny session");
        return;
      }
      const result = safeCall(() => Engine.processEvent(engine, session, type, meta, now), "bearbeta händelse");
      if (!result) return;
      if (result.awarded.length === 0) return; // ingen XP -> ingen re-rendering/skrivning behövs
      renderCurrent();
      save();
      if (result.leveledUp) safeCall(() => UI.showLevelUp(result.levelAfter), "visa nivåbyte");
    }

    function onReset() {
      safeCall(() => Store.resetProgression(), "återställ progression");
      bootstrapEngine();
      renderCurrent();
    }

    bootstrapEngine();
    const uiReady = safeCall(() => UI.init({ onReset }), "initiera nivå-UI");
    if (!uiReady) return;
    renderCurrent();
    window.ActivityPrototype.onEvent(handleEvent);

    // ── DEV-konsolstöd (GAM-003B) ──
    // `state()` och `summary()` SPEGLAR verklig, redan bokförd progression —
    // säkra att köra när som helst, ändrar ingenting.
    // `grantTestXP()` och `simulateLevelUp()` är TESTHJÄLPMEDEL: de simulerar
    // effekten av XP/nivåbyte för att verifiera UI:t, men motsvarar INGEN
    // verklig aktivitet i appen. `grantTestXP` skriver till samma
    // localStorage-nyckel som riktig XP (för att kunna testa persistens och
    // nivåbyten end-to-end) — använd `reset()` efteråt för att städa bort
    // testdata. `simulateLevelUp()` rör inte alls totalXP/lagring, bara UI:t.
    // `reset()` är samma verkliga radering som "Återställ progression"-
    // knappen, utan bekräftelsedialog (ett konsolanrop är redan en
    // medveten handling).
    window.GamificationDev = {
      state() { return { totalXP: engine.totalXP, highestLevelIndex: engine.highestLevelIndex, level: Engine.levelForDisplay(engine.totalXP, engine.highestLevelIndex, engine.levels), persisted: persistedFromEngine() }; },
      grantTestXP(amount) {
        amount = Number(amount) || 0;
        if (amount <= 0) return "Ange ett positivt XP-belopp (testhjälpmedel — motsvarar ingen verklig aktivitet).";
        engine.totalXP += amount;
        const info = renderCurrent();
        if (info.levelIndex > engine.highestLevelIndex) engine.highestLevelIndex = info.levelIndex;
        save();
        return "Testhjälpmedel: +" + amount + " XP tillagt (sparas). Nuvarande nivå: " + info.levelName + ".";
      },
      simulateLevelUp(toLevelIndex) {
        const levels = engine.levels;
        const idx = typeof toLevelIndex === "number" ? Math.max(0, Math.min(levels.length - 1, toLevelIndex)) : Math.min(levels.length - 1, engine.highestLevelIndex + 1);
        const fake = Engine.levelForDisplay(levels[idx].threshold, idx, levels);
        UI.showLevelUp(fake);
        return "Testhjälpmedel: visar nivåbytesanimationen för \"" + fake.levelName + "\" — ingen XP eller lagring påverkad.";
      },
      reset() {
        onReset();
        return "Gamification-progression återställd (Reglernovis, 0 XP).";
      },
    };

    console.info("[gamification] Nivåprototyp startad (DEV-only). window.GamificationDev för testkommandon.");
  }

  waitForDependencies();
})();
