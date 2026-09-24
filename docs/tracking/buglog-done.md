# Bugglogg — Stängda

Buggar som är fixade, testade och mergade till `develop`.
Öppna buggar finns i [buglog.md](buglog.md).

---

## Python-app (`main.py`) — nedlagd

Python-appen läggs ner, se BESLUT-002 i [todo.md](todo.md). Följande buggar stängs
**utan fix** — de kommer aldrig åtgärdas.

### 2026-003 — PID-bidragsgraf visar fel y-axel-enhet
**Status:** Stängd — nedlagd, se BESLUT-002

### 2026-005 — Hjälp/teori-flikar fungerar inte i exe
**Status:** Stängd — nedlagd, se BESLUT-002

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

**Status:** Stängd — PO-testad och godkänd 2026-09-24, mergad till develop och släppt i v1.7.1.


---

### 2026-018 — Spurios "X ändrad"-markering i grafen på nästan alla scenarier vid första steget
**Prio:** Medel
**Datum:** 2026-09-23
**Branch:** `bugfix/2026-018`
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

**Fix-notering:** Följer den föreslagna fixriktningen, men täcker fler ställen. Ny helper `normalizeAndCaptureMarkerBaseline()` i `app.js` nollar baslinjen, kör `syncParamsFromUI()` (som därmed aldrig själv kan lägga till en markering) och tar sedan baslinjen på den NORMALISERADE formen. Anropas (1) SIST i `loadScenarioByName()`, efter Tillämpning/lägesstyrd döljning/lärstigens `visibilityOverride`, (2) i `initUI()` efter startprofilbytet (gav annars en markering redan vid sidladdning), och (3) i "Återställ system"/"Rensa graf". Punkt 3 hittades under verifieringen: kvotscenarierna fick en falsk "SP 31.65→25" efter Återställ/Rensa, eftersom kvotregleringens beräknade SP låg kvar i scenariot medan SP-fältet hade basvärdet. Simuleringen påverkas inte, eftersom samma synk ändå körs före nästa steg.

**Verifiering:** Headless Edge (CDP, riktiga knapptryckningar), före/efter-svep över samtliga 39 DEV-scenarier och 14 lärstigar. FÖRE: 39/39 scenarier fick en falsk markering (ladda, Återställ eller Rensa), 56 lärstigssteg likaså, plus en markering redan vid sidladdning. EFTER: 0/39 scenarier, 0 lärstigssteg, 0 vid sidladdning, 0 sidfel. Äkta ändringar markeras fortfarande (Kp → "Kp/Ti/Td ändrat", SP → "SP 50→55"). De enda kvarvarande markeringarna är "Zonbyte (K)" i de två ventilkarakteristik-scenarierna, en avsedd FEAT-042-markering för en verklig zonövergång. PV-kurvor (20 steg efter laddning + 10 efter Återställ + 10 efter Rensa) är bit-identiska före/efter i 117/117 fall. Regressionstest: `tests/bugfix-2026-018-marker-baseline.test.mjs`.
**Status:** Stängd — fixad, verifierad och mergad till develop. PO:s eget snabbtest återstår.

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
**Fix-notering:** Grundorsak: `fields.k.step` sattes dynamiskt (`updateProcessUIState()` i
`app.js`) men `min="0.001"` (satt i `index.html`) uppdaterades aldrig i takt. Webbläsaren
räknar giltiga stegvärden som `min + n × step`, så med `min=0.001, step=0.1` blev giltiga
värden 0.001, 0.101, ..., 1.401, 1.501, 1.601 — exakt offsetten i buggrapporten. Fix: `min`
sätts nu till samma värde som `step` (0.1 för självreglerande, 0.001 för integrerande) i
samma funktion. Verifierat i headless Chrome: stepUp() från 1.5 ger 1.6 → 1.7, `checkValidity()` = true.
**Status:** Stängd — PO har snabbtestat manuellt och godkänt, mergad direkt till develop utan formell test-branch

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
**Fix-notering:** Det var inte ett steg i `currentPath.steps` utan introduktionsskärmen som
visas innan man klickar "Nästa" första gången (`loadPath()` i `app.js`). Beskrivningstexten
wrappades i `<small>`, vilket via webbläsarens default-stilmall ger ~83% av `#learnBody`s
egen `font-size: 12px` — mindre än `.step-body` (också 12px) som används i alla efterföljande
steg. Fix: tog bort `<small>`-taggen. Verifierat i headless Chrome på "Öppen slinga, On/Off
och P-reglering": introtext och steg 1:s brödtext har nu båda `font-size: 12px`.
**Status:** Stängd — PO har snabbtestat manuellt och godkänt, mergad direkt till develop utan formell test-branch

---

### 2026-014 — "Återställ system" rensade inte en pågående bumpless-bias
**Prio:** Medel (visade sig vara allvarligare än ursprungligen bedömt — se nedan)
**Datum:** 2026-09-14 (registrerad), 2026-09-15 (rotorsak funnen och åtgärdad, HOTFIX)
**Branch:** `bugfix/2026-014` (grenad från `main`, hotfix)
**Ursprunglig beskrivning:** PO:s observation: kör en integrerande process till jämvikt,
tryck **"Återställ system"** — PV verkade inte alltid börja om rent.

**Bekräftad grundorsak (efter felsökning i appen, inte bara kodläsning):** inget med
`sim.history` (den ursprungliga misstanken var fel). Den verkliga orsaken är
"Bumpless"-funktionen (mjuk övergång vid lägesbyte): `Simulation.step()` i
`sim-core.js` håller en bias-term i två speglade platser — `this.pid.bias` (motorns
egen kopia) och `this.scenario.controller.bias` (en kopia `app.js` läser/skriver vid
lägesbyten). `Simulation.reset()` nollställde bara den förstnämnda. Om en
bumpless-övergång var påbörjad (inom sina första 5 steg efter ett lägesbyte med
Bumpless aktiverat) och "Återställ system" klickades innan de hunnit köra klart,
överlevde den gamla biasen i `scenario.controller.bias`. Nästa steg återupplivade den
via `step()`s else-gren — UTAN att sätta `biasFadeSteps` igen — så biasen blev
**permanent och helt osynlig** (syns inte i statusradens P/I/D-uppdelning; u ≠ P+I+D).

**Faktisk effekt, bekräftad av PO:** en P-regulator på en integrerande process fick
I-liknande nollfels-beteende — PV drev mot börvärdet istället för att stanna vid det
korrekta, facit-verifierade kvarstående felet. Detta hade kunnat ge felaktiga
undervisningsresultat i produktion utan någon synlig varningssignal.

**Fix:** `Simulation.reset()` nollställer nu även `this.scenario.controller.bias`,
samma par som redan nollställs tillsammans när en övergång fadear klart naturligt.
En rads ändring i `sim-core.js`.

**Status:** Stängd — HOTFIX till `main` som **v1.5.4** (branchad från `main`, inte
`develop`, eftersom buggen var live i produktion). Verifierad med ny regressionstest
(`tests/hotfix-2026-014-bumpless-reset.test.mjs` — röd utan fixen, grön med), hela den
befintliga testsviten grön, och manuellt återskapad + bekräftad löst i en riktig
webbläsare (Playwright) mot PO:s exakta repro-scenario. Mergad tillbaka till `develop`.

---

### 2026-015 — `APP_VERSION` glömdes bort vid release v1.5.2
**Prio:** Låg
**Datum:** 2026-09-15
**Branch:** `bugfix/2026-015`
**Beskrivning:**
PO:s observation: v1.5.2 (FEAT-038, hjälplinjer i Mätläge) publicerades i PROD, men
appens versionsvisning i sidofoten visade fortfarande "v1.5.1". Orsak: `APP_VERSION` i
`apps/app/app.js` (rad 7) är en hårdkodad sträng som glömdes bort i release-processen
för v1.5.2 — `CHANGELOG.md` och `README.md` uppdaterades, men inte denna konstant.
**Fix:** `APP_VERSION` rättad till `"1.5.2"`.
**Status:** Stängd — mergad till `develop` 2026-09-15. Fixen får effekt i PROD först
vid nästa release till `main` (PO:s uttryckliga instruktion — ingen hotfix för detta).
PROD visar alltså fortsatt "v1.5.1" i UI:t tills dess, trots att v1.5.2:s faktiska
funktion (mätlinjerna) redan är live. Lägg gärna till en kontroll av `APP_VERSION` mot
`CHANGELOG.md`s senaste rubrik i release-checklistan så detta inte glöms igen.

---

### 2026-013 — Återställ progression: nästa händelse ger massiv felaktig XP-återhämtning
**Prio:** Hög
**Datum:** 2026-09-10
**Branch:** `bugfix/2026-013`
**Beskrivning:**
PO testade "Återställ progression" (GAM-003B/DEV-prototyp för XP/nivå).
Nollställningen visade korrekt 0 XP/Reglernovis direkt efter klick. Men ETT
enda efterföljande klick på "Stega" gav omedelbart nivå 2 med ett stort
felaktigt XP-tal bokfört — reproducerbart, samma resultat varje gång.
**Grundorsak:** `gamification.js`s `onReset()` skapade ett NYTT, tomt
`engine`-objekt men återanvände samma, redan belastade GAM-002-
aktivitetssession (`window.ActivityPrototype.session()`). Motorns
diff-baserade bokföring (`processEvent`) jämför sessionens RÅA räknare
(`session.attempts.completed`, `sumDistinctConfigs`, `comparisonPairs.length`
m.fl.) mot motorns egen, nollställda ögonblicksbild — så nästa händelse
(oavsett typ) tolkade HELA den tidigare sessionens redan-existerande
aktivitet som "ny" och krediterade den i klump.
**Fix:** `onReset()` startar nu även om själva aktivitetssessionen
(`window.ActivityPrototype.reset()`, samma mekanism som en vanlig
sidladdning), efter att motorn/lagringen redan återställts.
**Status:** Stängd — verifierad 2026-09-10 (`tests/gamification/gamification-reset-isolation.test.mjs`,
10 nya tester som reproducerar grundorsaken och verifierar fixen; samtliga
261 automatiska tester i repot gröna; Playwright-verifiering mot exakt
PO:s repro-steg i riktig webbläsare; PROD-regression opåverkad)

---

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
**Status:** Stängd — verifierad 2026-08-23 (Playwright: PB-band, SP-position och hysteresband uppdateras direkt vid fältändring; full regression av samtliga 9 lärstigar, `tests/validate-content.mjs` och `tests/simulation/analyze.test.mjs` gröna; scenarioresultat oförändrade; 0 konsolfel)

---

### 2026-010 — Manuell u: första värdet sparas inte, skrivs över med 0.00
**Prio:** Hög
**Datum:** 2026-06-04
**Branch:** `bugfix/2026-010`
**Beskrivning:**
När användaren byter läge till "Manuell" via dropdown, matar in ett värde i "Manuell u" och klickar "Stega 1", återställs fältet till 0.00 och värdet används inte. Fungerar korrekt från och med andra försöket.
**Rotorsak:**
`currentScenario.controller.mode` uppdateras inte direkt när dropdown ändras — bara via `syncParamsFromUI` (vid steg-klick). Första gången "Stega" klickas detekteras en mode-ändring (`prevMode ≠ nextMode`) och bumpless-blocket i `syncParamsFromUI` skriver över `manualOutput` med `prevState.u` (=0 om inga steg körts).
**Fix:**
Flytta bumpless-till-manuell-logiken till mode-dropdown-ändringslyssnaren. Ta bort `if (nextMode === "manual" && prevState)` från `syncParamsFromUI`.
**Status:** Stängd — TC-01–07 godkända 2026-06-04

---

### 2026-008 — Vänster sidebar minimeras inte, tömmer bara innehållet
**Prio:** Medel
**Datum:** 2026-06-03
**Branch:** `bugfix/sidebar-collapse`
**Beskrivning:**
Klick på `«`-knappen döljer sidebars innehåll (opacity:0) men bredden förändras inte — sidebaren minimeras alltså inte visuellt.
**Rotorsak:** `makeResizable()` sätter en inline `style.width` på sidebaren vid uppstart (sparad bredd från localStorage). CSS-regeln `.sidebar-left.collapsed { width: 28px }` vinner inte mot inline-stilen.
**Fix:** Vid kollaps — spara och rensa inline-stilen. Vid expansion — återställ den.
**Status:** Stängd — verifierad 2026-06-03

---

### 2026-007 — Puls steg tillåter 0 och negativa tal via tangentbord
**Prio:** Låg
**Datum:** 2026-06-01
**Branch:** `bugfix/2026-007`
**Beskrivning:**
Fältet "Puls steg" har `min="1"` i HTML vilket stoppar musklick från att gå under 1, men tangentbord kan skriva in 0 och negativa tal.
**Fix:**
`min="0"` i index.html. `Math.max(0, ...)` i `syncParamsFromUI()`. `triggerPulse()` återgår till `> 0`-check. `input`-event på `pulseDuration` klampar negativt värde till 0 i realtid.
**Testdokument:** `tests/manual/2026-007-puls-steg-min-värde.md`
**Status:** Stängd — TC-01–05 godkända 2026-06-01

---

### 2026-006 — Hysteresfält visas oavsett läge
**Prio:** Medel
**Datum:** 2026-06-01
**Branch:** `bugfix/2026-006`
**Beskrivning:**
Inställningsfälten "Hyst. låg" och "Hyst. hög" visas alltid i kontrollpanelen, även när ett annat läge än On/Off är valt.
**Fix:**
Samma logik som befintlig döljning av Ti/Td i `updateControllerUIState()` (app.js:422) — lade till dölj/visa för `hysteresLower` och `hysteresUpper`.
**Testdokument:** `tests/manual/2026-006-hysteres-dolj-ej-onoff.md`
**Status:** Stängd — TC-001–007 godkända 2026-06-01

---

### 2026-004 — Trigga puls påverkar inte PV
**Status:** Stängd — TC1-4 godkända 2026-06-01

---

## Python-app (`main.py`)

### 2026-001 — Integrerande processer simuleras felaktigt
**Prio:** Hög
**Datum:** 2026-06-01
**Status:** Stängd — verifierad i webbapp 2026-06-01, inga fel kunde reproduceras. Felet verkar vara specifikt för Python-appen.

