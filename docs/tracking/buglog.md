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

**Fix-notering:**
1. `deriveApplicationProfile()`: reserven härleds från processmodellen, alltså den Tillämpning (`temperatur`/`niva`) vars `processModels` innehåller scenariots typ. "avancerat" blir bara kvar som reserv för processmodeller som ingen annan Tillämpning täcker. Idag gäller det bara det experimentella `unstable`, som inte finns i PROD.
2. `loadPath()`: fäller ihop båda Avancerat-sektionerna vid lärstigsbyte. Tidigare ärvde introt och teoristegen uppfällda sektioner från den förra lärstigens sista scenario. Om användaren själv har valt "Avancerat" lämnas det orört.
3. `applyPathVisibilityOverride()` (PO-förtydligande efter test: fälten ska inte synas ens när användaren själv fäller upp Avancerat): i en aktiv lärstig syns BARA de strategitillägg som lärstigen deklarerar i `visibilityOverride.show`. Alla andra `[data-addon]` döljs. Det gäller även teoristeg och lärstigens intro. Tidigare tillät Tillämpningen alla tillägg, så grundlärstigar visade Kff, Kvot, Flöde A och Parameterstyrning vid uppfällning. De fyra strategilärstigarna deklarerade redan sina tillägg i `show`, så inget innehåll behövde ändras. `hide` finns kvar för bakåtkompatibilitet.

**Verifiering:** Synlighetssvep i headless Edge med riktiga knapptryck: Ladda lärstig, Nästa genom alla steg, både från ren start och efter ett manuellt laddat scenario. I varje steg fälls båda Avancerat-sektionerna upp, precis som en användare gör, och svepet registrerar vilka tillägg som faktiskt syns.
- FÖRE (v1.7.0): alla 12 lärstigar visade Kff, Kvotreglering, Parameterstyrning och Ventilkarakteristik. 9 lärstigar hamnade dessutom i Tillämpning "Avancerat" med sektionerna automatiskt uppfällda.
- EFTER (DEV och PROD-bygge): 0 stegtillstånd i "Avancerat". Grundlärstigarna visar inga tillägg. Parameterstyrning visar bara parameterstyrning och ventilkarakteristik, Framkoppling bara Kff, Kvot bara kvottillägget och Kaskad bara Slavslingan. Automatiskt uppfällt är bara Parameterstyrning, Framkoppling och Windup (Anti-windup/Bumpless, via `forceAdvancedOpen`). 0 sidfel.
- Markeringssvepet från 2026-018 är fortsatt rent i PROD-bygget. Hela testsviten och innehålls-/PROD-valideringen är gröna. Test 6k i `ux-002-application-profile.test.mjs` är uppdaterat till den nya regeln.

**Status:** Fixad på `bugfix/2026-019`, inte mergad. Väntar på PO:s beslut om merge och release (v1.7.1).

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
