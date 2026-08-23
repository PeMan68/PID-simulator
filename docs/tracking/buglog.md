# Bugglogg — Öppna

Nya buggar registreras här i `develop`-branchen.
ID-format: `ÅÅÅÅ-NNN` (löpnummer per år, t.ex. `2026-001`).
Varje bugfix-branch uppdaterar **endast sin egen post** (status, fix-noteringar).
Stängda buggar finns i [buglog-done.md](buglog-done.md).

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
