# Bugglogg

Nya buggar registreras här i `develop`-branchen.
ID-format: `ÅÅÅÅ-NNN` (löpnummer per år, t.ex. `2026-001`).
Varje bugfix-branch uppdaterar **endast sin egen post** (status, fix-noteringar).

---

## Öppna

### Webbapp (`apps/app/`)

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
Tangentlinjens etiketter visar nu varaktigheter (L = tL−t_steg, T = tLT−tL) istället för absoluta tidpunkter.
Tangentalgoritmen använder nu enkla grannpunktsdifferenser (söker från i=0) — hittar korrekt startpunkt för enkapacitiva processer och inflexionspunkt för flerkapacitiva.
L-ankare korrigeras för diskretisering: om yA[iInfl] ≈ PV₀ används nästa punkt → L=5 korrekt för FOPDT.
**Status:** Stängd — TC-01–07 godkända 2026-06-04

### 2026-006 — Hysteresfält visas oavsett läge
**Prio:** Medel
**Datum:** 2026-06-01
**Branch:** `bugfix/2026-006`
**Beskrivning:**
Inställningsfälten "Hyst. låg" och "Hyst. hög" visas alltid i kontrollpanelen, även när ett annat läge än On/Off är valt. Fälten är bara tillämpliga för On/Off-reglering och skapar visuellt brus för alla andra lägen (P, PI, PID, Manuell).
**Steg att reproducera:**
1. Ladda valfritt scenario med PID-läge
2. Observera att "Hyst. låg" och "Hyst. hög" fortfarande visas i panelen
**Förväntat beteende:** Hysteresfälten är dolda när läget inte är On/Off.
**Faktiskt beteende:** Hysteresfälten visas alltid.
**Fix-noteringar:**
Mönstret finns redan i `updateControllerUIState()` (app.js:422) — Ti, Td och Manuell u döljs redan baserat på läge. Samma logik ska läggas till för `hysteresLower` och `hysteresUpper`.
**Testdokument:** `tests/manual/2026-006-hysteres-dolj-ej-onoff.md`
**Status:** Stängd — TC-001–007 godkända 2026-06-01

---

### 2026-007 — Puls steg tillåter 0 och negativa tal via tangentbord
**Prio:** Låg
**Datum:** 2026-06-01
**Branch:** `bugfix/2026-007`
**Beskrivning:**
Fältet "Puls steg" har `min="1"` i HTML vilket stoppar musklick från att gå under 1, men tangentbord kan skriva in 0 och negativa tal. Minvärdet ska vara 0 oavsett inmatningsmetod — konsekvent beteende krävs.
**Steg att reproducera:**
1. Öppna appen
2. Ladda ett scenario
3. Klicka i fältet "Puls steg" och skriv `-5` via tangentbord
4. Observera att värdet accepteras
**Förväntat beteende:** Minvärde är 0 oavsett om tangentbord eller musklick används. Negativa tal accepteras inte.
**Faktiskt beteende:** Musklick kan inte gå under 1, men tangentbord tillåter 0 och negativa tal.
**Fix-noteringar:**
`min="0"` i index.html. `Math.max(0, ...)` i `syncParamsFromUI()`. `triggerPulse()` återgår till `> 0`-check. `input`-event på `pulseDuration` klampar negativt värde till 0 i realtid (TC-01 kräver omedelbar feedback vid tangentbordsinmatning).
**Testdokument:** `tests/manual/2026-007-puls-steg-min-värde.md`
**Status:** Stängd — TC-01–05 godkända 2026-06-01

---

### 2026-008 — Vänster sidebar minimeras inte, tömmer bara innehållet
**Prio:** Medel
**Datum:** 2026-06-03
**Branch:** `bugfix/sidebar-collapse`
**Beskrivning:**
Klick på `«`-knappen döljer sidebars innehåll (opacity:0) men bredden förändras inte — sidebaren minimeras alltså inte visuellt.
**Rotorsak:** `makeResizable()` sätter en inline `style.width` på sidebaren vid uppstart (sparad bredd från localStorage). CSS-regeln `.sidebar-left.collapsed { width: 28px }` vinner inte mot inline-stilen. Innehållet döljs via `.sidebar.collapsed .sidebar-inner { opacity: 0 }` (den regeln fungerar), men sidebaren förblir bred.
**Fix:** Vid kollaps — spara och rensa inline-stilen. Vid expansion — återställ den.
**Status:** Stängd — verifierad 2026-06-03

---

### Python-app (`main.py`)

### 2026-003 — PID-bidragsgraf visar fel y-axel-enhet
**Prio:** Medel
**Datum:** 2026-06-01
**Branch:** `bugfix/2026-003`
**Beskrivning:**
Y-axeln för PID-bidragsgrafen visar enheten celsius (°C) men ska visa procent (%).
**Förväntat beteende:** Y-axeln visar %.
**Faktiskt beteende:** Y-axeln visar °C.
**Status:** Öppen

---

### 2026-005 — Hjälp/teori-flikar fungerar inte i exe
**Prio:** Hög
**Datum:** 2026-06-01
**Branch:** `bugfix/2026-005`
**Beskrivning:**
Flikarnas innehåll för Hjälp och Teori skapas inte korrekt i den paketerade exe-filen (PyInstaller packaging-problem). Flikarna visas men innehållet är tomt eller felaktigt.
**Förväntat beteende:** Hjälp- och teori-innehåll visas korrekt i exe.
**Faktiskt beteende:** Innehållet saknas eller är felaktigt i exe-versionen.
**Status:** Öppen

---

## Stängda

### 2026-004 — Trigga puls påverkar inte PV
**Status:** Stängd — TC1-4 godkända 2026-06-01

---

### 2026-001 — Integrerande processer simuleras felaktigt
**Prio:** Hög
**Datum:** 2026-06-01
**Status:** Stängd — verifierad i webbapp 2026-06-01, inga fel kunde reproduceras. Felet verkar vara specifikt för Python-appen.
