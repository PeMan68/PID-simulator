# Bugglogg — Stängda

Buggar som är fixade, testade och mergade till `develop`.
Öppna buggar finns i [buglog.md](buglog.md).

---

## Python-app (`main.py`) — nedlagd

Python-appen läggs ner, se BESLUT-002 i [todo.md](todo.md). Följande buggar stängs
**utan fix** — de kommer aldrig åtgärdas.

### 2026-003 — PID-bidragsgraf visar fel y-axel-enhet
**Status:** Stängd — nedlagd, se BESLUT-002

### 2026-005 — Hjälp/teori-flikar fungerar inte i exe
**Status:** Stängd — nedlagd, se BESLUT-002

---

## Webbapp (`apps/app/`)

### 2026-012 — PB-band, SP-linje och hysteresband uppdateras inte förrän ett steg körs
**Prio:** Medel
**Datum:** 2026-08-23
**Branch:** `bugfix/2026-012`
**Beskrivning:**
Upptäckt av PO under pedagogisk granskning av lärstigen "Proportionalband och regulatorförstärkning": att ändra Kp och lämna fältet, eller att toggla kryssrutan "Visa PB", ritar inte om PB-bandet i grafen förrän minst ett simuleringssteg körts. Samma sak gäller ändring av SP och av On/Off-hysteresgränserna (Hyst. låg/hög).
**Rotorsak:**
`fields.kp`/`fields.sp`/`fields.hysteresLower`/`fields.hysteresUpper` saknade helt change-lyssnare — värdena lästes bara in via `syncParamsFromUI()`, som bara anropades från Stega/Kör-knapparna. Dessutom använde `drawChart()`s PB- och hysteresband-kod `sp[sp.length-1] ?? sim.scenario.runtime.setpoint` för att avgöra aktuellt SP — eftersom `sim.history.sp` alltid har minst ett element (initieras i konstruktorn) är `??`-fallbacken död kod, så banden positionerades alltid mot det senast *körda* SP-värdet, inte det aktuella fältvärdet.
**Fix:**
Change-lyssnare tillagda på de fyra fälten (synkar + ritar om direkt). `sp_current` i `drawChart()` läser nu `sim.scenario.runtime.setpoint` direkt istället för det historiebaserade uttrycket, på båda ställena (hysteresband och PB-band).
**Status:** Stängd — verifierad 2026-08-23 (Playwright: PB-band, SP-position och hysteresband uppdateras direkt vid fältändring; full regression av samtliga 9 lärstigar, `tests/validate-content.mjs` och `tests/simulation/analyze.test.mjs` gröna; scenarioresultat oförändrade; 0 konsolfel)

---

### 2026-010 — Manuell u: första värdet sparas inte, skrivs över med 0.00
**Prio:** Hög
**Datum:** 2026-06-04
**Branch:** `bugfix/2026-010`
**Beskrivning:**
När användaren byter läge till "Manuell" via dropdown, matar in ett värde i "Manuell u" och klickar "Stega 1", återställs fältet till 0.00 och värdet används inte. Fungerar korrekt från och med andra försöket.
**Rotorsak:**
`currentScenario.controller.mode` uppdateras inte direkt när dropdown ändras — bara via `syncParamsFromUI` (vid steg-klick). Första gången "Stega" klickas detekteras en mode-ändring (`prevMode ≠ nextMode`) och bumpless-blocket i `syncParamsFromUI` skriver över `manualOutput` med `prevState.u` (=0 om inga steg körts).
**Fix:**
Flytta bumpless-till-manuell-logiken till mode-dropdown-ändringslyssnaren. Ta bort `if (nextMode === "manual" && prevState)` från `syncParamsFromUI`.
**Status:** Stängd — TC-01–07 godkända 2026-06-04

---

### 2026-008 — Vänster sidebar minimeras inte, tömmer bara innehållet
**Prio:** Medel
**Datum:** 2026-06-03
**Branch:** `bugfix/sidebar-collapse`
**Beskrivning:**
Klick på `«`-knappen döljer sidebars innehåll (opacity:0) men bredden förändras inte — sidebaren minimeras alltså inte visuellt.
**Rotorsak:** `makeResizable()` sätter en inline `style.width` på sidebaren vid uppstart (sparad bredd från localStorage). CSS-regeln `.sidebar-left.collapsed { width: 28px }` vinner inte mot inline-stilen.
**Fix:** Vid kollaps — spara och rensa inline-stilen. Vid expansion — återställ den.
**Status:** Stängd — verifierad 2026-06-03

---

### 2026-007 — Puls steg tillåter 0 och negativa tal via tangentbord
**Prio:** Låg
**Datum:** 2026-06-01
**Branch:** `bugfix/2026-007`
**Beskrivning:**
Fältet "Puls steg" har `min="1"` i HTML vilket stoppar musklick från att gå under 1, men tangentbord kan skriva in 0 och negativa tal.
**Fix:**
`min="0"` i index.html. `Math.max(0, ...)` i `syncParamsFromUI()`. `triggerPulse()` återgår till `> 0`-check. `input`-event på `pulseDuration` klampar negativt värde till 0 i realtid.
**Testdokument:** `tests/manual/2026-007-puls-steg-min-värde.md`
**Status:** Stängd — TC-01–05 godkända 2026-06-01

---

### 2026-006 — Hysteresfält visas oavsett läge
**Prio:** Medel
**Datum:** 2026-06-01
**Branch:** `bugfix/2026-006`
**Beskrivning:**
Inställningsfälten "Hyst. låg" och "Hyst. hög" visas alltid i kontrollpanelen, även när ett annat läge än On/Off är valt.
**Fix:**
Samma logik som befintlig döljning av Ti/Td i `updateControllerUIState()` (app.js:422) — lade till dölj/visa för `hysteresLower` och `hysteresUpper`.
**Testdokument:** `tests/manual/2026-006-hysteres-dolj-ej-onoff.md`
**Status:** Stängd — TC-001–007 godkända 2026-06-01

---

### 2026-004 — Trigga puls påverkar inte PV
**Status:** Stängd — TC1-4 godkända 2026-06-01

---

## Python-app (`main.py`)

### 2026-001 — Integrerande processer simuleras felaktigt
**Prio:** Hög
**Datum:** 2026-06-01
**Status:** Stängd — verifierad i webbapp 2026-06-01, inga fel kunde reproduceras. Felet verkar vara specifikt för Python-appen.
