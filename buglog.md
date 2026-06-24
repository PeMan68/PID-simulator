# Bugglogg — Öppna

Nya buggar registreras här i `develop`-branchen.
ID-format: `ÅÅÅÅ-NNN` (löpnummer per år, t.ex. `2026-001`).
Varje bugfix-branch uppdaterar **endast sin egen post** (status, fix-noteringar).
Stängda buggar finns i [buglog-done.md](buglog-done.md).

---

## Webbapp (`apps/app/`)

*(inga öppna)*

---

## Python-app (`main.py`)

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
