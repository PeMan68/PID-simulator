# Bugglogg — Öppna

Nya buggar registreras här i `develop`-branchen.
ID-format: `ÅÅÅÅ-NNN` (löpnummer per år, t.ex. `2026-001`).
Varje bugfix-branch uppdaterar **endast sin egen post** (status, fix-noteringar).
Stängda buggar finns i [buglog-done.md](buglog-done.md).

---

## Webbapp (`apps/app/`)

### 2026-013 — Återställ progression: nästa händelse ger massiv felaktig XP-återhämtning
**Prio:** Hög
**Datum:** 2026-09-10
**Branch:** `bugfix/2026-013`
**Beskrivning:**
PO testade "Återställ progression" (GAM-003B/DEV-prototyp för XP/nivå).
Nollställningen visar korrekt 0 XP/Reglernovis direkt efter klick. Men ETT
enda efterföljande klick på "Stega" ger omedelbart nivå 2 med 83 XP bokfört
— reproducerbart, samma resultat varje gång.
**Förväntat beteende:** Efter "Återställ progression" ska XP/nivå öka
normalt, i takt med faktisk ny aktivitet — inte hoppa till ett stort tal på
en enda enstegning.
**Faktiskt beteende:** Ett enda "Stega"-klick efter återställning ger en
stor engångsmängd XP och hoppar direkt till nivå 2.
**Status:** Öppen — undersöks
**Grundorsak (identifierad):** `gamification.js`s `onReset()` skapar ett
NYTT, tomt `engine`-objekt men återanvänder samma, redan belastade GAM-002-
aktivitetssession (`window.ActivityPrototype.session()`). Motorns
diff-baserade bokföring (`processEvent`) jämför sessionens RÅA räknare
(`session.attempts.completed`, `sumDistinctConfigs`, `comparisonPairs.length`
m.fl.) mot motorns egen, nollställda ögonblicksbild — så nästa händelse
(oavsett typ) tolkar HELA den tidigare sessionens redan-existerande
aktivitet som "ny" och krediterar den i klump.

---

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

Python-appen är nedlagd — se BESLUT-002 i [todo.md](todo.md). Alla öppna Python-buggar
är stängda utan fix och flyttade till [buglog-done.md](buglog-done.md).
