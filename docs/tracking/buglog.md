# Bugglogg — Öppna

Nya buggar registreras här i `develop`-branchen.
ID-format: `ÅÅÅÅ-NNN` (löpnummer per år, t.ex. `2026-001`).
Varje bugfix-branch uppdaterar **endast sin egen post** (status, fix-noteringar).
Stängda buggar finns i [buglog-done.md](buglog-done.md).

---

## Webbapp (`apps/app/`)

### 2026-019 — Lärstigar hamnar i Tillämpning "Avancerat" med alla Avancerat-fält uppfällda
**Prio:** Hög (syns i PROD, alla lärstigar utom Kom igång och Kaskad)
**Datum:** 2026-09-24
**Branch:** `bugfix/2026-019`
**Upptäckt av:** PO, vid genomklickning av lärstigarna i v1.7.0. I "Öppen slinga, On/Off och P-reglering" steg 2 (`manual-open-loop.json`) byts Tillämpning till Avancerat, och alla Avancerat-sektioner fälls upp med Kff, Kvotreglering, Parameterstyrning m.m.

**Beskrivning:**
`deriveApplicationProfile()` härleder ett generiskt scenario (självreglerande, utan tillägg) till "avancerat" som reserv. Enligt UX-004 tvingar "Avancerat" alla Avancerat-sektioner öppna. Resultatet är att nästan varje vanligt lärstigssteg visar alla avancerade fält. Teoristeg laddar inget scenario och ärver läget från föregående steg. Bara `kom-igång.v1` och `kaskadreglering.v1` klarar sig, tack vare `forceApplicationProfile: "temperatur"`.

Buggen kom inte med v1.7.0. Ett v1.6.2-bygge beter sig likadant, och v1.7.0 lade bara till kryssrutan Kvotreglering i de uppfällda sektionerna.

**Förväntat beteende (PO, 2026-09-24):** Ingen lärstig ska hamna i Tillämpning "Avancerat". Avancerat är ett läge som användaren själv väljer.

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
