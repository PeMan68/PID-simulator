# Bugglogg — Öppna

Nya buggar registreras här i `develop`-branchen.
ID-format: `ÅÅÅÅ-NNN` (löpnummer per år, t.ex. `2026-001`).
Varje bugfix-branch uppdaterar **endast sin egen post** (status, fix-noteringar).
Stängda buggar finns i [buglog-done.md](buglog-done.md).

---

## Webbapp (`apps/app/`)

### 2026-014 — "Återställ system" startar om från föregående PV, inte normalvärdet
**Prio:** Medel
**Datum:** 2026-09-14
**Branch:** (ej påbörjad)
**Beskrivning:**
PO:s observation: kör en integrerande process till jämvikt (PV har stabiliserat sig långt
från normalvärdet), tryck sedan **"Återställ system"**. Den nya simuleringen fortsätter
från det föregående PV-värdet istället för att börja om på processens normalvärde (0/
`normalValue`).

Misstänkt grundorsak (ej verifierad genom felsökning, bara kodläsning): i `app.js`
anropas `sim.reset()` (som i `sim-core.js` korrekt sätter `process.y = normalValue` och
bygger en ny `history` med en enda startpunkt), men button-handlern skriver DIREKT
därefter över `sim.history` igen med helt tomma arrayer
(`sim.history = { t: [], y: [], ... }`). Om något UI-element läser av aktuellt PV via
`history.y[history.y.length-1]` (tomt efter denna overskrivning) kan det falla tillbaka
på ett annat, ej uppdaterat värde — vilket skulle förklara symptomet. Kräver verifiering
i appen, inte bara kodläsning, innan fix påbörjas.

**Förväntat beteende:** "Återställ system" ska börja om från processens normalvärde
(samma beteende som att ladda om scenariot från scratch).
**Faktiskt beteende:** Ny simulering fortsätter från föregående PV.

**Viktig avgränsning (PO påpekade uttryckligen):** "Rensa graf" ska BEHÅLLA nuvarande
PV och bara nollställa grafen/historiken — det är korrekt och avsiktligt beteende för
den knappen och ska INTE ändras. Buggen gäller enbart "Återställ system".
**Status:** Öppen

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
