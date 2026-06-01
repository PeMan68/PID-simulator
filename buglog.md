# Bugglogg

Nya buggar registreras här i `develop`-branchen.
ID-format: `ÅÅÅÅ-NNN` (löpnummer per år, t.ex. `2026-001`).
Varje bugfix-branch uppdaterar **endast sin egen post** (status, fix-noteringar).

---

## Öppna

### Webbapp (`apps/app/`)

### 2026-001 — Integrerande processer simuleras felaktigt
**Prio:** Hög
**Datum:** 2026-06-01
**Branch:** `bugfix/2026-001`
**Beskrivning:**
Simulering av integrerande processer fungerar inte korrekt. Processvärdet beter sig inte som förväntat — troligen fel i hur integrering hanteras i processmodellen.
**Förväntat beteende:** Integrerande process ackumulerar processvärdet korrekt baserat på flödessignalen.
**Faktiskt beteende:** Simuleringen ger felaktigt resultat för integrerande processtyp.
**Status:** Öppen — behöver verifieras (oklart om felet finns i webbappen eller enbart i Python-appen)

---

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
Troligen synk-miss eller magnitude=0 i scenario-JSON defaults. Felsök hur `triggerPulse()` kopplar till `ProcessModel.step()`.
**Status:** Öppen

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

<!-- Flytta hit när branchen är mergad till develop -->
