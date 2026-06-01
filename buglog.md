# Bugglogg

Nya buggar registreras här i `develop`-branchen.
ID-format: `ÅÅÅÅ-NNN` (löpnummer per år, t.ex. `2026-001`).
Varje bugfix-branch uppdaterar **endast sin egen post** (status, fix-noteringar).

---

## Öppna

### Webbapp (`apps/app/`)


### 2026-004 — Trigga puls påverkar inte PV
**Prio:** Medel
**Datum:** 2026-06-01
**Branch:** `bugfix/2026-004`
**Beskrivning:**
Pulsstörningen når inte processmodellen. Studenten kan inte testa hur regulatorn hanterar störningsimpulser, vilket är en central del av PID-pedagogiken.
**Steg att reproducera:**
1. Starta en simulering med PID-reglering
2. Klicka "Trigga puls" under störningsinställningar
3. Observera att PV inte påverkas
**Förväntat beteende:** PV påverkas av pulsstörningen.
**Faktiskt beteende:** Ingen effekt på PV.
**Fix-noteringar:**
Rotorsak: `triggerPulse()` krävde `durationSteps > 0` men de flesta scenarier hade `durationSteps: 0`. Dessutom saknades UI-fält och sync för `durationSteps`.
Fix: `triggerPulse()` använder nu `Math.max(1, durationSteps || 3)` som fallback. Nytt UI-fält "Puls steg" (`pulseDuration`) tillagt i index.html, synkroniseras i `hydrateFields()` och `syncParamsFromUI()`.
**Status:** Fixad i branch

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

### 2026-001 — Integrerande processer simuleras felaktigt
**Prio:** Hög
**Datum:** 2026-06-01
**Status:** Stängd — verifierad i webbapp 2026-06-01, inga fel kunde reproduceras. Felet verkar vara specifikt för Python-appen.
