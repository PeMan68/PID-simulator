# Bugglogg — Öppna

Nya buggar registreras här i `develop`-branchen.
ID-format: `ÅÅÅÅ-NNN` (löpnummer per år, t.ex. `2026-001`).
Varje bugfix-branch uppdaterar **endast sin egen post** (status, fix-noteringar).
Stängda buggar finns i [buglog-done.md](buglog-done.md).

---

## Webbapp (`apps/app/`)

### 2026-011 — Sidopaneler kollapsas inte, tömmer bara innehållet
**Prio:** Medel
**Datum:** 2026-06-26
**Branch:** `bugfix/2026-011`
**Beskrivning:**
Klick på kollaps-knappen (`«`/`»`) på vänster sidebar och höger kontrollpanel döljer panelens innehåll men bredden förblir oförändrad. Panelen minimeras alltså inte — mittenytan (grafen) får ingen extra plats.
Relaterat till 2026-008 som stängdes 2026-06-03, men problemet kvarstår på båda panelerna.
**Förväntat beteende:** Panel krymper till minimal bredd (ikonstorlek), grafen expanderar och fyller utrymmet.
**Faktiskt beteende:** Panelens innehåll döljs men bredden är oförändrad.
**Status:** Öppen

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
