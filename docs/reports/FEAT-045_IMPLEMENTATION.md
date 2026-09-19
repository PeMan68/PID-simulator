# FEAT-045 — Implementation: Framkoppling (Feedforward)

**Datum:** 2026-09-19
**Branch:** `feature/FEAT-045-framkoppling`
**Uppdragsgivare:** PO
**Underlag:** `docs/reports/STRAT-004_FORSTUDIE-FRAMKOPPLING.md`, `docs/reports/STRAT-005_DESIGN-FRAMKOPPLING.md`
**Releasehantering:** Ingen merge till `develop` utan PO-granskning. Ingen release.

---

## 1. Sammanfattning

STRAT-005 implementerat i sin helhet: `auxSignal`/`auxGain`/`Kff`-mekaniken i
`sim-core.js`, tre nya UI-fält + "Trigga last"-knapp, en tredje graflinje för
lastsignalen, en ny teorimodul, en ny 4-stegs lärstig, ett nytt fristående
övningsdokument (4 uppgifter) och en dedikerad testfil (21 kontroller).
Samtliga numeriska exempel är simuleringsverifierade mot den faktiska
produktionskoden (`tests/simulation/`), inte mot STRAT-005s arbetshypoteser
rakt av — se avsnitt 3 för var/varför siffrorna justerades.

Full regression grön (9 testfiler, 175 kontroller), DEV-/PROD-innehållsvalidering
grön, DEV-/PROD-byggnation grön, PROD-allowlistet oförändrat (inget av detta
uppdrag rör PROD — helt isolerat till DEV-katalogen och feature-branchen).

---

## 2. Vad är byggt

### 2.1 Simuleringskärnan (`apps/app/sim-core.js`)

- `Simulation.auxValue` — den mätbara lastens aktuella, BESTÅENDE nivå (0 tills
  triggad). Ingen nedräkning (till skillnad från `pulseStepsLeft`).
- `Simulation.triggerAuxSignal()` — sätter `auxValue` till scenariots
  `auxSignal.magnitude` i ETT anrop (ersätter, adderar inte). Scenario utan
  `auxSignal`-fält ger `auxValue=0` (no-op, bakåtkompatibelt med alla
  befintliga scenarier — verifierat, test 3a).
- `Simulation.reset()` nollställer `auxValue` (PO: "återställer systemet").
  `sim.history.aux` läggs till som en ny historikserie (samma mönster som
  `p`/`i`/`d`).
- `PIDController.step()` — ny valfri `feedforward`-parameter, adderad till
  `raw` INNAN klippning mot `outputLimits`, så anti-windup-logiken (som redan
  jämför mot den klippta, KOMBINERADE utsignalen `u`) korrekt ser om
  PID+framkoppling tillsammans mättar utsignalen (verifierat, test 8a).
  Returnerar även `ffTerm` separat (för tester/eventuell framtida UI-bruk).
- `ProcessModel.step()` — ny `auxValue`-parameter. Lastens bidrag
  (`auxGain × auxValue`) går genom SAMMA drivande term/tidskonstant (T) som
  huvudprocessen, i ALLA processtyper (self_regulating/self_regulating_2/
  integrating/unstable) — INTE bara self_regulating (till skillnad från
  FEAT-042s ventilkarakteristik, se avsnitt 5, punkt 1). Detta skiljer sig
  medvetet från `disturbance` (brus/puls), som fortsatt adderas direkt och
  odämpat till `y` — verifierat, test 4a/4b visar att auxGain-termen ger en
  GRADVIS förändring första steget medan disturbance ger ett omedelbart hopp.
  Ingen bumplös övergång för framkopplingstermen (avsiktligt, STRAT-005
  avsnitt 2 — ett omedelbart hopp i u är själva poängen).

### 2.2 UI (`apps/app/index.html`, `apps/app/app.js`)

- **Process-gruppen:** nytt fält "Lastförstärkning" (`auxGain`), direkt under
  L, ovanför Normalvärde.
- **Regulator-gruppen:** nytt fält "Kff", direkt under Td. Inget `min`-attribut
  (till skillnad från Kp) — tillåter negativa värden, se hjälptexten.
- **Störningar-gruppen:** nytt fält "Last mag" + knapp "Trigga last", direkt
  efter Puls-fälten. Samma interaktionsmönster som "Trigga puls"
  (`sim.history.markers`-linje, etikett `"Last → <värde>"` — visar det
  triggade värdet, till skillnad från pulsens enkla `"Puls"`-etikett).
- **auxSignal skapas INTE defensivt för alla scenarier** (till skillnad från
  `hysteresis`, som redan görs defensivt) — bara när scenariot redan har
  fältet, eller studenten skriver in ett nollskilt värde manuellt. Motivering:
  annars skulle grafens lastlinje börja ritas som en flat 0-linje på alla ~40
  befintliga scenarier så fort ETT UI-fält synkas (vilket sker på i princip
  varje knapptryck), inte bara de tre nya demo-scenarierna. `auxGain`/`kff`
  synkas däremot defensivt (som `outflow`/`hysteresis`) eftersom de saknar
  motsvarande visuell bieffekt — utan ett triggat `auxValue` har de ingen
  effekt oavsett värde.
- **Graf:** lastsignalen ritas som en tredje linje i den övre PV/SP-panelen
  (lila, prickstreckad `#8e44ad`, samma färg som Mätläges tangentlinje men
  aldrig samtidigt synlig), plus en liten "Last"-etikett bredvid "PV/SP" —
  bara när `scenario.auxSignal` finns. `drawSeries()` utökad att acceptera
  antingen en boolean (befintligt, oförändrat beteende) eller en
  dash-array (nytt, används här).
- **Markering vid ändrat Kff/auxGain** — samma `describeMarkerChange()`-mönster
  som Parameterstyrning/ventilkarakteristik ("Framkoppling ändrad").
- Tre nya `help.json`-poster (`auxGain`, `kff`, `auxMag`) — `kff`s hjälptext
  förklarar EXPLICIT varför tecknet ofta blir negativt (icke-uppenbar poäng,
  se STRAT-005 avsnitt 6).

### 2.3 Innehåll

- **Teorimodul:** `theory/framkoppling.v1.json` — reaktiv (återkoppling) vs.
  direktkompenserande (framkoppling) reglering, varför Kff kan vara negativt,
  framkopplingens styrka (omedelbar) och svaghet (bara så bra som sin modell,
  eliminerar aldrig kvarstående fel på egen hand).
- **Lärstig:** `exercises/framkoppling.v1.json` — teori + 3 scenariosteg
  (Återkoppling ensam → Ren framkoppling med fel Kff → PID + korrekt Kff),
  varje steg en egen dedikerad scenariofil (FEAT-042-lärdomen), Mätläge
  (crosshair och/eller 2%-toleransband beroende på vad som är mätbart i
  respektive steg, se avsnitt 3.3) inbyggt i instruktionerna från start.
- **Tre nya demo-scenarier:** `framkoppling-demo-pid.json`,
  `framkoppling-demo-ren-ff.json`, `framkoppling-demo-pid-ff.json`.
- **Övningsdokument:** `docs/exercises/ovningar-framkoppling.md` — 4 uppgifter
  (2 grundläggande + 2 utforskande), samma stil som
  `ovningar-parameterstyrning.md`.
- Registrerat i `catalog.json` (DEV). **`catalog.prod.json` är INTE ändrad**
  — inget release-uppdrag, PO-beslut om PROD-inkludering kommer separat.

---

## 3. Simuleringsverifiering — process, tal och varför de ändrades mot STRAT-005

### 3.1 Processparametrar (samma för alla tre demo-scenarier)

`self_regulating`, K=1.3, T=15, L=0, **normalValue=50 (=SP)**, auxGain=0.8,
SP=50, **auxSignal.magnitude=−20** (negativ, se 3.2).

### 3.2 Avsteg #1: `normalValue=SP` + NEGATIV last, inte `normalValue=0` + positiv last

STRAT-005 avsnitt 7 föreslog normalValue=0, SP=50 (processen börjar i vila
och regleras UPP till SP) och en positiv last. Det visade sig ge två problem
vid simuleringsverifiering:

1. **Kontrollutrymme:** vid normalValue=0/SP=50 krävs u≈38.5 (mitt i
   intervallet) för att HÅLLA SP — det ger marginal i BÅDA riktningarna att
   motverka en störning, oavsett dess tecken. Testat och fungerande.
2. **UX-problemet det löser:** att låta processen börja EXAKT vid SP
   (`normalValue=SP`) gör att lärstigens steg inte behöver en lång
   "kör N steg för att nå SP innan du kan trigga lasten"-instruktion — scenariot
   är redan stabilt vid SP från FÖRSTA steget (`yPre=50` verifierat, inga
   pre-steg krävs). Det matchar STRAT-005 avsnitt 5 exakt: "Process i stabilt
   läge vid SP" — bokstavligen sant från start, inte efter en väntan.

Problemet: med normalValue=SP=50 krävs u=0 för jämvikt (ingen marginal ALLS
i den ena riktningen — u kan inte gå under 0). En POSITIV last (som STRAT-005
föreslog) hade krävt att regulatorn sänker u UNDER 0 för att kompensera —
fysiskt omöjligt (`outputLimits.min=0`), vilket gjorde ALLA tre demo-scenarier
identiska och okorrigerbara oavsett Kff (verifierat under utveckling — u
fastnade permanent på 0). Lösningen: en NEGATIV last (drar PV nedåt) kräver
istället att u ÖKAR för att kompensera — fullt tillgängligt från baslinjen
u=0. Formeln `Kff = −auxGain/K` är oförändrad och oberoende av lastens eget
tecken (verifierat numeriskt: samma Kff≈−0.6154 ger exakt kompensation
oavsett om `auxSignal.magnitude` är +20 eller −20).

**Konsekvens:** "Last mag" i alla tre demo-scenarier är −20, inte +20. Ren
teknisk/pedagogisk optimering — själva konceptet (Kff, tecknet på Kff,
formeln) är exakt som STRAT-005 beskrev.

### 3.3 Avsteg #2: Mätmetod per steg (inte enhetligt 2%-toleransband överallt)

STRAT-005 föreslog "Mätläge + 2%-toleransband" genomgående (FEAT-042-lärdomen).
Verifierat att detta INTE fungerar rakt av för steg 1 och 3: verktyget
(`hasRange`-kontrollen i `drawChart()`) kräver att PV₀ och PV∞ skiljer sig åt
— men i steg 1 och 3 återgår/stannar PV vid SAMMA värde (SP) före och efter,
så bandet blir noll brett och ritas inte ut. Löst genom att använda rätt
verktyg per steg:
- **Steg 1 (PID ensam) och steg 3 (PID+korrekt Kff):** crosshair-avläsning
  (fungerar oavsett PV₀/PV∞-relation, kräver bara Mätläge aktiverat).
- **Steg 2 (ren framkoppling):** PV settlar på ett NYTT, annat värde än SP —
  2%-toleransbandet fungerar precis som avsett här.

Ingen förlust av mätprecisionsdisciplinen (FEAT-042s huvudlärdom) — bara en
mer exakt tillämpning av VILKET verktyg som passar VILKEN typ av mätning.

### 3.4 Verifierade nyckeltal (via `tests/simulation/lib/sim-core-bridge.mjs`
mot de faktiska scenariofilerna, inte uppskattade)

| Steg | Konfiguration | Störst avvikelse | Kvarstående fel |
|---|---|---|---|
| 1. PID ensam (Kff=0) | Kp=1.2, Ti=20 | 4.91 (steg 12 efter trigg) | 0 (återgår, insvängd ~123 steg efter trigg) |
| 2. Ren framkoppling, fel Kff=−0.31 | Kp=0.1, Ti=0 | 7.03 | 7.03 (PERMANENT — återgår aldrig) |
| 3. PID + korrekt Kff=−0.6154 | Kp=1.2, Ti=20 | ≈0 | 0 (insvängd redan vid triggande steget) |

Detta är en RIKARE och mer verifierbart sann pedagogisk poäng än STRAT-005s
ursprungliga "avvikelsen minskar men försvinner inte": ren framkoppling med
fel Kff reagerar SNABBARE än ren PID (ingen väntan på ett fel), men PID
ensam korrigerar SIG SJÄLV till slut (integralverkan) medan ren framkoppling
ALDRIG gör det (inget som tittar på det faktiska felet). Kombinationen får
båda fördelarna. Lärstigens och övningsdokumentets instruktioner/checkpoints
är skrivna kring detta verifierade beteende, inte kring STRAT-005s
ospecificerade gissning.

Kff-känslighet (Uppgift 2, verifierat symmetriskt kring korrekt värde):
halva korrekt Kff → +7.03 fel (underkompenserat, PV under SP); 1.5× korrekt
Kff → −7.03 fel (överkompenserat, PV över SP) — bekräftar STRAT-005s poäng
att över- och underkompensation är lika lätt att råka ut för.

Uppgift 4 (mätbar+omätbar samtidigt): identisk störst avvikelse med och utan
en korrekt kompenserad last aktiv (framkopplingen "försvinner" ur resultatet)
— bekräftar att framkoppling bara kompenserar den MÄTBARA störningen.

---

## 4. Tester

`tests/feat-045-framkoppling.test.mjs` — 21 kontroller: `auxValue`/
`triggerAuxSignal()`/`reset()`-livscykeln, ersättning (inte addition) vid ny
triggning, no-op för scenarier utan `auxSignal`, att `auxGain`-termen går
genom processens tidskonstant (till skillnad från `disturbance`s omedelbara
hopp), att `auxGain` saknas/0 ger ingen effekt, att feedforward adderas före
klippning och klipps korrekt, att `ffTerm` returneras, att korrekt/fel/inget
Kff ger exakt de förväntade kvarstående felen, att PID med Ti ändå
självkorrigerar (till skillnad från Ti=0), och att anti-windup ser den
KOMBINERADE utsignalen.

Full regression: 9 testfiler, **175/175 kontroller gröna**
(`feat-042-gain-schedule`, `feat-043-extend-max-steps`, `feat-045-framkoppling`,
`hotfix-2026-014-bumpless-reset`, `hotfix-v1.4.1-facit-env`,
`activity-prototype`, `build-preview`, `simulation/analyze`). `node --check`
grönt för `app.js`/`sim-core.js`. `validate-content.mjs` grönt för både DEV
och PROD-katalogen (PROD oförändrad — refererar bara befintligt innehåll).
DEV-/PROD-byggförhandsvisning grön. `validate-prod.mjs`: PROD-allowlistet
matchar exakt det beslutade urvalet, oförändrat av detta uppdrag.

Ingen webbläsare tillgänglig i denna miljö — UI:t är INTE visuellt testat
(fältplacering, grafens lastlinje, "Trigga last"-knappens utseende). Dev-servern
(port 8000) serverar branchens filer utan fel (smoke-testat via HTTP-anrop:
`index.html`, `app.js`, ny scenario-/teori-/lärstigs-JSON, `help.json` — alla
200 OK). PO bör visuellt verifiera innan eventuell merge.

---

## 5. Avsteg från STRAT-005

1. **`normalValue=SP` + negativ last, inte `normalValue=0` + positiv last**
   (avsnitt 3.2) — fysiskt/kontrollutrymmesmotiverat, formeln och Kff-tecknet
   oförändrat.
2. **Mätmetod per steg (crosshair för steg 1/3, 2%-band för steg 2), inte
   enhetligt 2%-band** (avsnitt 3.3) — verktygsbegränsning, inte en
   uppmjukning av mätprecisionsdisciplinen.
3. **`auxGain × auxValue` gäller ALLA processtyper i `ProcessModel.step()`**,
   inte bara `self_regulating` (till skillnad från FEAT-042s
   `nonlinearGain`, som STRAT-003 medvetet begränsade). STRAT-005 satte ingen
   sådan begränsning för `auxSignal`, och en last är ett generellt fysikaliskt
   koncept (till skillnad från en ventilkarakteristik, som specifikt hör
   ihop med en styrventil) — bedömdes inte behöva samma inskränkning.
4. **Lärstigens tre A/B/C/D/E-mätvärden döpta/definierade delvis annorlunda
   än STRAT-005 avsnitt 5 skissade** (avsnitt 3.4) — den verifierade
   pedagogiska poängen (snabb-men-opålitlig vs. långsam-men-självkorrigerande
   vs. båda) är RIKARE än utkastets "avvikelsen minskar men försvinner inte",
   och all text i lärstig/övningsdokument är skriven kring vad simuleringen
   faktiskt visar, inte kring arbetshypotesen.
5. **Ingen defensiv skapelse av `auxSignal` på alla scenarier** (avsnitt 2.2)
   — STRAT-005 nämnde inte denna risk explicit; tillägg för att undvika att
   ~40 befintliga scenarier plötsligt får en (harmlös men förvirrande) flat
   lastlinje i grafen så fort ett UI-fält synkas.

Allt annat (scenarioformat, `Kff`s tillåtna negativa värden, ingen bumplös
övergång för framkopplingstermen, tre enskilda UI-fält utan gruppering,
lärstigens tredelade struktur, övningsdokumentets 4-uppgiftersmönster) följer
STRAT-005 exakt som specificerat.

---

## 6. Rekommendation

Redo för PO:s visuella granskning (UI-layout, fältplacering, grafens
lastlinje, "Trigga last"-knappens beteende) och pedagogisk genomläsning av
lärstig/teorimodul/övningsdokument — särskilt avsnitt 3.2 och 3.4 ovan, där
den faktiska simuleringsverifieringen ledde till en delvis annorlunda men
enligt min bedömning starkare pedagogisk poäng än STRAT-005s ursprungsskiss.

Ingen merge till `develop` utan explicit PO-beslut. Ingen release/PROD-ändring
föreslås i detta uppdrag.

**Öppen fråga, uttryckligen INGEN utredning i detta uppdrag** (PO:s instruktion):
var FEAT-046s blockschema-SVG:er (`docs/assets/diagrams/02-framkoppling.svg`,
`03-pid-plus-framkoppling.svg`) bäst kan användas i den här lärstigen/
övningsdokumentet som ett eventuellt nästa steg.
