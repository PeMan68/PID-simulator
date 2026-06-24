# Bugglogg — Stängda

Buggar som är fixade, testade och mergade till `develop`.
Öppna buggar finns i [buglog.md](buglog.md).

---

## Webbapp (`apps/app/`)

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
