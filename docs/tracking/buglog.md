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

### 2026-016 — Felaktiga giltiga stegvärden vid bläddring av processförstärkning K
**Prio:** Medel
**Datum:** 2026-09-17
**Branch:** `bugfix/2026-016`
**Beskrivning:**
Bläddringsknapparna för K arbetar med upplösning 0,1 (steg), vilket är korrekt, men de
giltiga värdena hamnar på 1,401 / 1,501 / 1,601 istället för 1,4 / 1,5 / 1,6.
Webbläsarens inbyggda validering visar därför felaktiga närliggande giltiga värden.
**Förväntat beteende:** Vid upplösning 0,1 ska giltiga värden ligga på jämna tiondelar
relativt startvärdet (1,4 / 1,5 / 1,6 / 1,7 ...), inte med ett konstant offset på 0,001.
**Att undersöka:**
- Kontrollera `min`, `step` och initialvärden för K-fältet.
- Kontrollera om flyttalsavrundning introducerar offset.
- Säkerställ att step-basen ligger på ett värde jämnt delbart med vald upplösning.
- Verifiera i flera webbläsare efter fix.
**Fix-notering:** Grundorsak: `fields.k.step` sattes dynamiskt (`updateProcessUIState()` i
`app.js`) men `min="0.001"` (satt i `index.html`) uppdaterades aldrig i takt. Webbläsaren
räknar giltiga stegvärden som `min + n × step`, så med `min=0.001, step=0.1` blev giltiga
värden 0.001, 0.101, ..., 1.401, 1.501, 1.601 — exakt offsetten i buggrapporten. Fix: `min`
sätts nu till samma värde som `step` (0.1 för självreglerande, 0.001 för integrerande) i
samma funktion. Verifierat i headless Chrome: stepUp() från 1.5 ger 1.6 → 1.7, `checkValidity()` = true.
**Status:** Klar, väntar på merge till develop via test-branch

---

### 2026-017 — För liten textstorlek i första informationssteget i lärstigar
**Prio:** Låg
**Datum:** 2026-09-17
**Branch:** `bugfix/2026-016`
**Beskrivning:**
Det första introduktionssteget i lärstigar visas med mindre textstorlek än övriga steg.
Exempel: första informationsrutan i "Öppen slinga, On/Off och P-reglering" använder
mindre brödtext än efterföljande steg.
**Förväntat beteende:** All brödtext i lärsteg ska använda samma typografi om inte ett
uttryckligt designbeslut säger något annat — introduktionssteget ska matcha övriga steg
i fontstorlek, radavstånd och läsbarhet.
**Att undersöka:**
- Jämför renderingen för introduktionssteget med vanliga informationssteg.
- Kontrollera om introduktionssteget använder annan CSS-klass eller annan komponent.
- Kontrollera om arv från container-CSS skiljer sig mellan första steget och övriga steg.
- Verifiera i minst en ytterligare lärstig efter fix.
**Fix-notering:** Det var inte ett steg i `currentPath.steps` utan introduktionsskärmen som
visas innan man klickar "Nästa" första gången (`loadPath()` i `app.js`). Beskrivningstexten
wrappades i `<small>`, vilket via webbläsarens default-stilmall ger ~83% av `#learnBody`s
egen `font-size: 12px` — mindre än `.step-body` (också 12px) som används i alla efterföljande
steg. Fix: tog bort `<small>`-taggen. Verifierat i headless Chrome på "Öppen slinga, On/Off
och P-reglering": introtext och steg 1:s brödtext har nu båda `font-size: 12px`.
**Status:** Klar, väntar på merge till develop via test-branch

---

## Python-app (`main.py`)

Python-appen är nedlagd — se BESLUT-002 i [todo.md](todo.md). Alla öppna Python-buggar
är stängda utan fix och flyttade till [buglog-done.md](buglog-done.md).
