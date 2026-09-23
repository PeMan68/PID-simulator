# Bugglogg — Öppna

Nya buggar registreras här i `develop`-branchen.
ID-format: `ÅÅÅÅ-NNN` (löpnummer per år, t.ex. `2026-001`).
Varje bugfix-branch uppdaterar **endast sin egen post** (status, fix-noteringar).
Stängda buggar finns i [buglog-done.md](buglog-done.md).

---

## Webbapp (`apps/app/`)

### 2026-018 — Spurios "X ändrad"-markering i grafen på nästan alla scenarier vid första steget
**Prio:** Medel
**Datum:** 2026-09-23
**Branch:** (ej skapad — registrerad, inte påbörjad)
**Upptäckt av:** PO, under körning av lärstigen "Parameterstyrning och olinjär ventilkarakteristik", steg 4 ("En kompromiss — försök 1: högre Kp i svag zon"). Skärmdump bifogad i uppdraget visar `Status: steg=2, t=2.0, SP=10.0, PV=5.4, ...` och en "Framkoppling ändrad"-markeringslinje i grafen, trots att Kff aldrig rörts av användaren.

**Beskrivning:**
PV/simuleringsdatan är KORREKT — bekräftat genom källkodsläsning och reproduktion i en isolerad headless webbläsare (Chrome DevTools Protocol): PV startar exakt på 0 när scenariot laddas, och värdet PV≈5,4 efter bara 2 steg är en äkta, om än snabb, konsekvens av att Kp=3 (högre än föregående lärstigssteg) gör att u:s första utslag hamnar över brytpunkt 1 (25) och därmed tillfälligt in i processens starka K-zon (K=2.5) innan det faller tillbaka — inte ett tecken på korrupt starttillstånd.

Den FAKTISKA buggen är en **spurios markeringslinje** ("X ändrad") som läggs till i grafen vid det AlLRA FÖRSTA steget efter varje scenarioladdning, även när användaren inte ändrat något alls. Grundorsak:

- `captureMarkerBaseline()` (i `loadScenarioByName()`) sparar en ögonblicksbild av `currentScenario` DIREKT efter `deepClone(SCENARIOS[name])` — dvs. exakt som scenariots JSON-fil ser ut, inklusive fält som helt saknas (`undefined`) om scenariot inte definierar dem.
- `syncParamsFromUI()` (körs vid varje "Stega 1"/"Kör 10 steg"-klick, FÖRE själva simuleringssteget) skriver OVILLKORLIGEN in normaliserade UI-värden för `kff`, `auxGain`, `gainSchedule` och `nonlinearGain` i `currentScenario` — även om scenariot aldrig definierat dem, blir de nu explicita (t.ex. `kff: 0`, eller ett fullständigt `nonlinearGain`-objekt).
- Vid NÄSTA jämförelse (`describeMarkerChange()`) ser detta ut som en verklig ändring (`undefined !== 0`, eller `undefined !== "{...}"` som JSON-sträng) — trots att användaren inte rört något — och en missvisande markeringslinje läggs till i grafen vid t=0/t=1.
- Samma mekanism (introducerad i FEAT-030, långt innan FEAT-042/045 lade till kff/auxGain/gainSchedule/nonlinearGain) förklarar även `onoff-basic.json`s reproducerade "Kp/Ti/Td ändrat"-variant: `syncParamsFromUI()` nollställer Ti/Td ovillkorligt i OnOff-läge, vilket kan skilja sig från scenariots egna (irrelevanta, men explicit satta) Ti/Td-värden.

**Omfattning — påverkar SO GOTT SOM ALLA lärstigar och scenarier, inte bara Parameterstyrning:**
Verifierat genom att köra ett enda steg direkt efter scenarioladdning på fyra oberoende, orelaterade scenarier:
- `basic-step-self-regulating.json` (kom-igång.v1, appens EGEN startscenario) → "Parameterstyrning ändrad"
- `pid-step-self-regulating.json` (kom-igång.v1) → "Parameterstyrning ändrad"
- `onoff-basic.json` → "Kp/Ti/Td ändrat"
- `framkoppling-demo-pid-ff.json` (har kff explicit, men saknar gainSchedule/nonlinearGain) → "Parameterstyrning ändrad"

27 av 31 scenariofiler saknar en explicit `kff`-nyckel, 27 saknar `auxGain`, 28 saknar `gainSchedule`, 28 saknar `nonlinearGain` — dvs. praktiskt taget varje scenario i appen (även de allra mest grundläggande, körda i den allra första lärstigen en ny användare möter) triggar en spurios markering vid sitt första steg. Effekten är osynlig/ofarlig så länge man inte tittar noga på grafens första markeringslinje — det är sannolikt därför den inte upptäckts tidigare, trots att den funnits sedan FEAT-030.

**Förväntat beteende:** Ingen "X ändrad"-markering ska läggas till om användaren faktiskt inte ändrat något — markeringen ska bara triggas av en VERKLIG skillnad mellan två på varandra följande, båda NORMALISERADE tillstånd.

**Faktiskt beteende:** En missvisande markeringslinje läggs alltid till vid det första steget efter en scenarioladdning, om scenariot saknar en explicit `kff`/`auxGain`/`gainSchedule`/`nonlinearGain`-nyckel (nästan alltid) eller kör i ett läge (OnOff/P/Manuell) som nollställer Ti/Td.

**Föreslagen fixriktning (ej implementerad):** Låt `captureMarkerBaseline()` snapshotta samma NORMALISERADE värden som `syncParamsFromUI()` skulle producera — enklast genom att köra `syncParamsFromUI()` en gång direkt efter `hydrateFields()` i `loadScenarioByName()`, INNAN `captureMarkerBaseline()` läser av baslinjen, så att baslinjen och det första riktiga steget alltid jämför äpplen mot äpplen. Kräver regressionstest mot samtliga scenarier (inte bara ett urval) eftersom felet visat sig vara nästan universellt.

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
