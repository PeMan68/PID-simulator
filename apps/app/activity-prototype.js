/* GAM-002 — Aktivitetsprototyp: DOM-koppling (DEV-only).
 *
 * Tunn glue-kod ovanpå activity-prototype-core.js (som är helt DOM-fri och
 * testas separat, se tests/activity-prototype.test.mjs). Den här filen:
 *  - lyssnar på Page Visibility, window focus/blur, pointerdown/pointermove/
 *    keydown (bara som aktivitetssignaler — inget innehåll lagras),
 *  - exponerar window.__activityDispatch(type, meta) som app.js:s befintliga
 *    knapp-/fälthändelser anropar (ett guardat, valfritt anrop — se app.js),
 *  - exponerar window.ActivityPrototype för felsökning i DEV-konsolen.
 *
 * Laddas ENDAST i DEV: app.js injicerar <script src="./activity-prototype.js">
 * dynamiskt, och bara om ENV_CONFIG.environment === "development" — se
 * kommentaren i app.js där ENV_CONFIG sätts upp. Filen ingår därför aldrig i
 * den byggda PROD-artifakten (tests/lib/build-prod.mjs kopierar bara en fast
 * lista kärnfiler, den här står inte på den listan) och begärs aldrig av
 * webbläsaren i PROD — noll extra nätverkstrafik, inga globala funktioner,
 * ingen körd kod.
 *
 * Lagrar ALDRIG muskoordinater, tangentvärden eller textinnehåll. Ingen
 * persistens (localStorage/sessionStorage/cookies/IndexedDB), ingen
 * nätverkstrafik. Se docs/development/GAMIFICATION-PROTOTYPE.md.
 */
(function () {
  if (typeof window === "undefined") return;
  if (!window.ENV_CONFIG || window.ENV_CONFIG.environment !== "development") return;
  if (typeof window.ActivityPrototypeCore === "undefined") {
    console.warn("activity-prototype.js: ActivityPrototypeCore saknas — prototypen startar inte.");
    return;
  }

  const Core = window.ActivityPrototypeCore;
  let session = null;

  function now() { return performance.now(); }

  function safeCall(fn) {
    try { fn(); } catch (err) {
      // Prototypen får aldrig störa simulatorn — se GAM-002 DEL 3.
      console.warn("activity-prototype: internt fel (ignoreras):", err);
    }
  }

  // GAM-003B — valfria "post-record"-lyssnare (t.ex. gamification.js).
  // Anropas EFTER att Core.recordEvent redan har uppdaterat sessionen, med
  // SAMMA session-objekt — det finns bara EN väg in (dispatch nedan) och EN
  // Core.recordEvent-anrop per händelse, så ingen lyssnare kan dubbelregistrera
  // samma aktivitet. En lyssnare som kastar fel stör aldrig GAM-002 självt
  // eller övriga lyssnare (samma safeCall-princip som resten av filen).
  const postRecordListeners = [];
  function onEvent(fn) {
    if (typeof fn === "function") postRecordListeners.push(fn);
  }

  function dispatch(type, meta) {
    if (!session) return;
    safeCall(() => Core.recordEvent(session, type, meta, now()));
    if (postRecordListeners.length) {
      const t = now();
      postRecordListeners.forEach(fn => safeCall(() => fn(type, meta, session, t)));
    }
  }

  // ── Publikt, guardat integrationsanrop för app.js ──
  window.__activityDispatch = dispatch;

  // ── Visibility / focus ──
  document.addEventListener("visibilitychange", () => {
    safeCall(() => Core.setVisible(session, document.visibilityState === "visible", now()));
  });
  window.addEventListener("focus", () => safeCall(() => Core.setFocused(session, true, now())));
  window.addEventListener("blur", () => safeCall(() => Core.setFocused(session, false, now())));

  // ── Rena aktivitetssignaler (inget innehåll, ingen loggrad) ──
  window.addEventListener("pointerdown", () => safeCall(() => Core.markActive(session, now())), { passive: true });
  window.addEventListener("keydown", () => safeCall(() => Core.markActive(session, now())), { passive: true });
  window.addEventListener("pointermove", () => safeCall(() => Core.recordPointermove(session, now())), { passive: true });

  function init() {
    session = Core.createSession(now());
    safeCall(() => Core.setVisible(session, document.visibilityState === "visible", now()));
    safeCall(() => Core.setFocused(session, document.hasFocus(), now()));
    dispatch("session_started", {});
    console.info("[activity-prototype] Session startad (DEV-only). Kör window.ActivityPrototype.summary() för en sammanställning.");
  }

  function requireSession() {
    if (!session) throw new Error("Ingen aktiv session — kör window.ActivityPrototype.reset() eller ladda om sidan.");
    return session;
  }

  window.ActivityPrototype = {
    summary() { return Core.summary(requireSession(), now()); },
    events(limit) {
      const s = requireSession();
      const events = s.rawEvents;
      return typeof limit === "number" ? events.slice(-limit) : events.slice();
    },
    reset() { init(); return "Session återställd."; },
    config(overrides) {
      const s = requireSession();
      if (overrides && typeof overrides === "object") Object.assign(s.config, overrides);
      return Object.assign({}, s.config);
    },
    session() { return requireSession(); }, // GAM-003B — läsaccess för gamification-motorn, se onEvent()
    onEvent, // GAM-003B — registrera en post-record-lyssnare (t.ex. gamification.js)
  };

  init();
})();
