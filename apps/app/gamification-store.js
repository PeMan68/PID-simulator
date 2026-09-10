/* GAM-003B — Persistenslager (localStorage-adapter + migrering).
 *
 * Samma UMD-mönster som övriga gamification-/aktivitetsmoduler: laddas som
 * <script> i webbläsaren (DEV-only) och via require() i Node för
 * tests/gamification/gamification-store.test.mjs.
 *
 * Egen, namngiven localStorage-nyckel — blandas ALDRIG med appens övriga
 * inställningar (t.ex. "pidSimWelcomed", "pg-<id>", sidopanelernas bredd).
 * Se docs/development/GAMIFICATION-XP-PROTOTYPE.md.
 *
 * Lagrar ENDAST bestående, aggregerad progression (se `createEmptyState`).
 * Lagrar ALDRIG råhändelser, musrörelser, tangentaktivitet, fullständig
 * parameterhistorik, detaljerad aktiv tid, checkpointresultat eller
 * personuppgifter — samma princip som GAM-002/GAM-003A.
 *
 * `storage`-parametern (valfri) gör modulen testbar utan webbläsare: i
 * Node injiceras en enkel in-memory-mock istället för `window.localStorage`.
 */
(function (global, factory) {
  const mod = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = mod;
  } else {
    global.GamificationStore = mod;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {

  const STORAGE_KEY = "pidSimGamificationV1";
  const CURRENT_SCHEMA_VERSION = 1;
  const XP_RULES_VERSION = "v1"; // måste matcha gamification-xp-engine.js:s XP_RULES_VERSION

  function createEmptyState() {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      xpRulesVersion: XP_RULES_VERSION,
      totalXP: 0,
      highestLevelIndex: 0,
      learningPaths: {},
      contextSignatures: {},
    };
  }

  function isPlainObject(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }

  // Validerar och fyller i saknade valfria fält utan att kasta — en
  // deluppsättning giltiga fält är alltid bättre än att förlora all
  // progression. Bevarar totalXP/highestLevelIndex så långt det går, även
  // om övriga fält är skadade (STABILITET ÖVER RELEASER, punkt 10).
  function sanitize(raw) {
    const empty = createEmptyState();
    if (!isPlainObject(raw)) return empty;

    const out = createEmptyState();
    if (typeof raw.totalXP === "number" && isFinite(raw.totalXP) && raw.totalXP >= 0) {
      out.totalXP = raw.totalXP;
    }
    if (typeof raw.highestLevelIndex === "number" && isFinite(raw.highestLevelIndex) && raw.highestLevelIndex >= 0) {
      out.highestLevelIndex = raw.highestLevelIndex;
    }
    if (isPlainObject(raw.learningPaths)) {
      Object.entries(raw.learningPaths).forEach(([id, lp]) => {
        if (!isPlainObject(lp)) return;
        out.learningPaths[id] = {
          highestStepIndex: typeof lp.highestStepIndex === "number" ? lp.highestStepIndex : -1,
          completed: !!lp.completed,
          completedCount: typeof lp.completedCount === "number" && lp.completedCount >= 0 ? lp.completedCount : 0,
        };
      });
    }
    if (isPlainObject(raw.contextSignatures)) {
      Object.entries(raw.contextSignatures).forEach(([ctxKey, sigs]) => {
        if (Array.isArray(sigs)) out.contextSignatures[ctxKey] = sigs.filter(s => typeof s === "string");
      });
    }
    return out;
  }

  // Migrering: version-dispatch. Version 1 är den första versionen — "migrera"
  // betyder här bara sanera/fyll-i-saknat. En framtida schemaVersion 2 skulle
  // lägga till fler `if (raw.schemaVersion < 2) { ... }`-steg HÄR, aldrig
  // genom att skriva om historiken retroaktivt (STABILITET ÖVER RELEASER).
  function migrate(raw) {
    if (!isPlainObject(raw)) return createEmptyState();
    // Okänd/nyare version än denna kod känner till: bevara det vi förstår
    // (totalXP, highestLevelIndex) och sanera resten säkert, istället för
    // att kasta bort allt eller krascha.
    return sanitize(raw);
  }

  function getStorage(storage) {
    if (storage) return storage;
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
    if (typeof localStorage !== "undefined") return localStorage;
    return null;
  }

  // Läser och migrerar sparad progression. Kastar ALDRIG — korrupt eller
  // saknad data ger alltid ett tomt, giltigt tillstånd (STABILITET ÖVER
  // RELEASER, punkt 10: "Korrupt lagringsdata får inte stoppa simulatorn").
  function load(storage) {
    const s = getStorage(storage);
    if (!s) return createEmptyState();
    let raw;
    try {
      const text = s.getItem(STORAGE_KEY);
      if (!text) return createEmptyState();
      raw = JSON.parse(text);
    } catch (err) {
      console.warn("gamification-store: korrupt lagring, återställer till tomt tillstånd.", err);
      return createEmptyState();
    }
    try {
      return migrate(raw);
    } catch (err) {
      console.warn("gamification-store: migrering misslyckades, återställer till tomt tillstånd.", err);
      return createEmptyState();
    }
  }

  // Skriver bestående progression. Anropas EFTER XP/bestående tillstånd
  // ändras — aldrig vid högfrekventa råhändelser (pointermove m.m. når
  // aldrig hit, se gamification.js). Tyst vid fel (t.ex. privat läge/full
  // kvot) — får aldrig störa simulatorn.
  function save(state, storage) {
    const s = getStorage(storage);
    if (!s) return false;
    try {
      // Saneras även vid SKRIVNING, inte bara vid läsning — garanterar att
      // bara det tillåtna, aggregerade schemat någonsin kan hamna i
      // localStorage, oavsett vad anroparen råkar skicka in (t.ex. om ett
      // framtida anrop av misstag bifogar extra fält).
      const payload = Object.assign(sanitize(state), {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        xpRulesVersion: XP_RULES_VERSION,
      });
      s.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch (err) {
      console.warn("gamification-store: kunde inte spara progression.", err);
      return false;
    }
  }

  // "Återställ progression" (DEV-only UI-funktion) — tar bort ENDAST
  // gamification-nyckeln. Rör aldrig appens övriga localStorage-nycklar
  // (pidSimWelcomed, pg-<id>, sidopanelbredd m.fl.).
  function resetProgression(storage) {
    const s = getStorage(storage);
    if (!s) return false;
    try {
      s.removeItem(STORAGE_KEY);
      return true;
    } catch (err) {
      console.warn("gamification-store: kunde inte återställa progression.", err);
      return false;
    }
  }

  return {
    STORAGE_KEY,
    CURRENT_SCHEMA_VERSION,
    XP_RULES_VERSION,
    createEmptyState,
    migrate,
    load,
    save,
    resetProgression,
  };
});
