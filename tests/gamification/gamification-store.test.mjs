// GAM-003B — Automatiska tester för persistenslagret
// (apps/app/gamification-store.js). Egen enkel testrunner, i linje med
// övriga tester i tests/gamification/.
//
// Körs: node tests/gamification/gamification-store.test.mjs

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const APP_DIR = path.resolve(__dirname, "..", "..", "apps", "app");
const Store = require(path.join(APP_DIR, "gamification-store.js"));

let passed = 0, failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

// Minimal in-memory localStorage-mock (Node har ingen global localStorage).
function makeMockStorage(initial) {
  const map = new Map(Object.entries(initial || {}));
  return {
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(k, String(v)); },
    removeItem(k) { map.delete(k); },
    _dump() { return Object.fromEntries(map); },
  };
}

// ── 20. localStorage-formatet kan läsas och skrivas ──
{
  const storage = makeMockStorage();
  const state = Object.assign(Store.createEmptyState(), { totalXP: 42, highestLevelIndex: 1 });
  const ok = Store.save(state, storage);
  const loaded = Store.load(storage);
  check("20a. save() lyckas", ok === true);
  check("20b. load() läser tillbaka samma totalXP", loaded.totalXP === 42, loaded.totalXP);
  check("20c. load() läser tillbaka samma highestLevelIndex", loaded.highestLevelIndex === 1);
  check("20d. Sparad payload har schemaVersion/xpRulesVersion", JSON.parse(storage.getItem(Store.STORAGE_KEY)).schemaVersion === Store.CURRENT_SCHEMA_VERSION);
}

// ── 21. Korrupt data hanteras utan appkrasch ──
{
  const storage = makeMockStorage({ [Store.STORAGE_KEY]: "{ inte giltig json ]]]" });
  let threw = false;
  let loaded;
  try { loaded = Store.load(storage); } catch (e) { threw = true; }
  check("21a. load() kastar inte vid trasig JSON", !threw);
  check("21b. load() ger ett giltigt tomt tillstånd vid trasig JSON", loaded && loaded.totalXP === 0 && loaded.schemaVersion === Store.CURRENT_SCHEMA_VERSION);

  const storage2 = makeMockStorage({ [Store.STORAGE_KEY]: JSON.stringify({ totalXP: "inte ett tal", learningPaths: "fel typ" }) });
  const loaded2 = Store.load(storage2);
  check("21c. load() saneras vid fel typer istället för att krascha", loaded2.totalXP === 0 && typeof loaded2.learningPaths === "object");

  const storage3 = makeMockStorage({ [Store.STORAGE_KEY]: JSON.stringify(null) });
  const loaded3 = Store.load(storage3);
  check("21d. load() hanterar JSON-null säkert", loaded3.totalXP === 0);
}

// ── 22. Migration bevarar total XP (och högsta nivå) ──
{
  // Simulerar en FRAMTIDA/okänd lagringsversion — fälten som redan finns
  // (totalXP, highestLevelIndex) ska bevaras så långt det går, resten
  // saneras säkert istället för att kastas bort helt.
  const future = { schemaVersion: 99, xpRulesVersion: "v99", totalXP: 777, highestLevelIndex: 5, learningPaths: { "lp": { highestStepIndex: 3, completed: true, completedCount: 2 } }, contextSignatures: { "lp#0": ["kp=1"] }, okantFramtidaFalt: { a: 1 } };
  const migrated = Store.migrate(future);
  check("22a. Migration bevarar totalXP", migrated.totalXP === 777);
  check("22b. Migration bevarar highestLevelIndex", migrated.highestLevelIndex === 5);
  check("22c. Migration bevarar learningPaths-data", migrated.learningPaths.lp.highestStepIndex === 3 && migrated.learningPaths.lp.completedCount === 2);
  check("22d. Migration bevarar contextSignatures", Array.isArray(migrated.contextSignatures["lp#0"]) && migrated.contextSignatures["lp#0"][0] === "kp=1");
  check("22e. Migration skriver aktuell schemaVersion/xpRulesVersion", migrated.schemaVersion === Store.CURRENT_SCHEMA_VERSION && migrated.xpRulesVersion === Store.XP_RULES_VERSION);

  // Saknat/tomt tillstånd (första körningen) ska ge ett tomt giltigt tillstånd.
  const empty = Store.migrate(undefined);
  check("22f. Migration av saknad data ger ett tomt giltigt tillstånd", empty.totalXP === 0 && empty.highestLevelIndex === 0);
}

// ── 24. Återställ progression raderar ENDAST gamification-data ──
{
  const storage = makeMockStorage({
    [Store.STORAGE_KEY]: JSON.stringify(Object.assign(Store.createEmptyState(), { totalXP: 500 })),
    "pidSimWelcomed": "1",
    "pg-someGroup": "1",
  });
  const ok = Store.resetProgression(storage);
  check("24a. resetProgression() lyckas", ok === true);
  check("24b. Gamification-nyckeln är borttagen", storage.getItem(Store.STORAGE_KEY) === null);
  check("24c. Andra appinställningar rörs inte (pidSimWelcomed)", storage.getItem("pidSimWelcomed") === "1");
  check("24d. Andra appinställningar rörs inte (pg-someGroup)", storage.getItem("pg-someGroup") === "1");
  const reloaded = Store.load(storage);
  check("24e. Efter återställning ger load() nivå 0 / tom progression", reloaded.totalXP === 0 && reloaded.highestLevelIndex === 0);
}

// ── 25. Ingen råhändelselogg eller känsliga fält kan sparas ──
{
  // Store.createEmptyState()/sanitize() definierar HELA det tillåtna
  // schemat — testar att inga andra nycklar kan smyga med genom save/load,
  // även om anroparen (av misstag) skickar in extra fält.
  const storage = makeMockStorage();
  const polluted = {
    totalXP: 10,
    highestLevelIndex: 0,
    rawEvents: [{ type: "pointermove", x: 100, y: 200 }],
    mouseTrail: [1, 2, 3],
    keystrokes: ["a", "b"],
  };
  Store.save(polluted, storage);
  const raw = JSON.parse(storage.getItem(Store.STORAGE_KEY));
  const allowedKeys = new Set(["schemaVersion", "xpRulesVersion", "totalXP", "highestLevelIndex", "learningPaths", "contextSignatures"]);
  const onlyAllowed = Object.keys(raw).every(k => allowedKeys.has(k));
  check("25. Endast tillåtna, aggregerade fält kan sparas (ingen råhändelselogg)", onlyAllowed, JSON.stringify(Object.keys(raw)));
}

console.log(`\n${passed} OK, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
