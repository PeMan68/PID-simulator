# Feature Backlog — Klara

Features som är implementerade, testade och mergade till `develop`.
Öppna features finns i [todo.md](todo.md).

---

## Python-app (`main.py`) — nedlagd

Python-appen läggs ner, se BESLUT-002 i [todo.md](todo.md). Följande features stängs
**utan implementation** — de kommer aldrig byggas.

### FEAT-006 — Utökad historik — jämförelse och export
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-008 — Utökad tooltip-funktionalitet
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-012 — Optimerad graf-rendering
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-013 — Förbättrad export-funktionalitet
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-014 — Unicode/emoji-kompatibilitet
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-015 — Förbättrad dialog-positionering
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-016 — Förbättrad hysteresis-visualisering (OnOff)
**Status:** Stängd — nedlagd, se BESLUT-002

---

## Webbapp (`apps/app/`)

### FEAT-050 — Kaskadreglering
**Prioritet:** Aktiv — PO har godkänt STRAT-007 (förstudie) och DES-001
(designförslag) och beslutat att påbörja implementation (2026-09-24).
**Bakgrund:** Se `docs/reports/STRAT-007_FORSTUDIE-KASKADREGLERING.md`
(arkitekturanalys — den enda av de fyra reglerstrategierna som kräver en
verklig flerslingearkitektur, dubbla `ProcessModel`/`PIDController`-instanser)
och `docs/reports/DES-001_DESIGN-KASKADREGLERING-UI.md` (UI/graf/
informationsflödesdesign — huvudslinga oförändrad, ny skrivskyddad
"Slavslinga"-panel, tre grafpaneler, signalkedje-rad).
**Produktbeslut (PO):** Processexempel = värmeväxlare, yttre slinga =
temperatur (PV1), inre slinga = flöde (PV2). Pedagogiskt mål: SP1 → Huvudslinga
→ SP2 → Slavslinga → U → PV2 → PV1. Målet är en pedagogiskt tydlig första
version, inte maximal industriell realism.
**UI-beslut:** Huvudslingans gränssnitt oförändrat (SP1, Kp/Ti/Td m.fl.). Ny
skrivskyddad "Slavslinga"-panel (SP2/PV2/U, ev. status-/mättad-indikator) —
INGA Kp/Ti/Td/anti-windup/bumpless för slavslingan, de styrs av scenariot.
Benämning: "Huvudslinga"/"Slavslinga", inte "Huvudregulator"/"Slavregulator".
**Graf:** tre paneler (PV1/SP1, PV2/SP2, U), båda slingorna synliga samtidigt,
ingen vyväxlare, ingen överlagring av alla signaler i samma panel.
**Informationsflöde:** alltid synlig textbaserad signalkedja (SP1 → Huvud-PID
→ SP2 → Slav-PID → U → PV2 → PV1) — ingen SVG-rendering, ingen HMI-/SCADA-vy
(det är FEAT-049, en separat, oprioriterad feature).
**Omfattning:** flerslingearkitektur i `sim-core.js` (dubbla ProcessModel/
PIDController-instanser), historikmodell för två slingor, scenarioformat för
kaskad, UI/graf enligt DES-001, grundläggande lärstig (Problem/Lösning/
Vanligt fel/Slutsats, se STRAT-007 avsnitt 8).
**Kaskad-windup:** ingen avancerad lösning i första versionen om inte
simulatorn kräver det för att fungera korrekt — PO vill ha en bedömning
redovisad, inte ett antagande gjort i förväg.
**Status:** Implementation klar på `feature/FEAT-050-kaskadreglering`, verifierad
(27 nya enhetstester + fullständig regressionskörning av alla befintliga
testsviter + webbläsarverifiering via headless Chrome), redovisad för PO.
**Ingen merge, ingen release ännu** — väntar på PO-granskning.
**Kaskad-windup:** ingen dedikerad cross-loop-mekanism implementerad — verifierat
att den inte behövs för att de tre levererade demoscenarierna ska fungera
korrekt (inre regulatorns utsignal mättar aldrig i något av dem). Kvarstår som
känd, dokumenterad begränsning för framtida scenarier med större störningar.
**Bugg hittad och fixad under verifiering:** `syncParamsFromUI()` klippte den
yttre regulatorns U min/max till [0,100] varje steg, vilket skulle förstöra
kaskadens avvikelsebaserade SP2-spann (t.ex. ±50) — fixat till ett bredare
spann när `cascade.enabled`. Se `apps/app/app.js` (sökord FEAT-050) för detaljer.

**Uppföljning efter PO-test (2026-09-24), genomförd:**
1. Slavslinga-panelen visades tidigare ALLTID, oavsett scenario — rotorsak:
   `.param-group{display:flex}` vann över webbläsarens inbyggda
   `[hidden]{display:none}` (samma specificitet, författarregel vinner).
   Fixat med en explicit `#groupSlavslinga[hidden]{display:none!important}`.
   Synlighet är nu två oberoende villkor: FAKTA (`cascade.enabled`, styr
   `hidden`-attributet) och TILLÅTELSE (nytt addon-namn "kaskadreglering",
   samma APPLICATION_PROFILES/visibilityOverride-mekanism som Framkoppling/
   Kvotreglering/Parameterstyrning). Vald tolkning (flaggad för PO): under
   Avancerat visas panelen ändå INTE för scenarier utan `cascade.enabled` —
   bedömdes mer sensibelt än att visa en tom panel med nollor.
2. Slavslinga-panelen är nu kollapsbar (samma `.param-group`/
   `toggleParamGroup()`-mönster som övriga grupper, inkl. persisterat
   collapse-läge).
3. Slavslingans trend (PV2/SP2) flyttad FRÅN huvudgrafen till en egen liten
   trendgraf (`#cascadeMiniChart`) inuti Slavslinga-panelen. Huvudgrafen är
   därför tillbaka till sin ursprungliga tvåpanels-geometri (PV1/SP1, u) —
   all `getCascadePanelSplit()`-logik borttagen igen.
4. Laststörningen i lärstigens tre scenarier höjd från −8 till −35 (PO:s
   riktlinje 30–40), omverifierad mot faktiska `Simulation`-körningar:
   enkelslinga 13,9 enh./470 steg, kaskad (bra) 1,1 enh./55 steg, kaskad
   (feltrimmad) 15,9 enh./~1050 steg — instruktionstexter/checkpoints
   uppdaterade med de nya, verifierade talen.
5–6. `visibilityOverride` (show/hide) infört/kompletterat i samtliga fyra
   strategi-lärstigar (Framkoppling, Kvotreglering, Parameterstyrning,
   Kaskadreglering) så var och en bara visar sin egen strategis fält.
   Undantag, avsiktligt: Parameterstyrnings lärstig visar även
   "ventilkarakteristik" (samma lärstig, samma ämne — dess första scenario
   ÄR en ventilkarakteristik-demo).
7. Avancerat-läget oförändrat: visar alltjämt alla fyra strategiers
   konfigurationsfält, inga lärstigsfilter tillämpas där (befintlig,
   oförändrad `applyPathVisibilityOverride()`-spärr).

**Uppföljning, andra rundan (samma dag) — PO pekade ut att huvudgrafens
u-panel i kaskadläge visade slavregulatorns utsignal, inte huvudregulatorns:**
- Signalkedjeraden flyttad FRÅN en fristående rad ovanför huvudgrafen till
  Slavslinga-panelen (all slavinformation samlad på ett ställe).
- Huvudgrafens nedre "u"-panel togs bort för kaskadscenarier (huvudslingan
  fyllde hela grafhöjden), och U lades till som en tredje linje i
  Slavslinga-panelens mini-graf.

**Uppföljning, tredje rundan (samma dag) — PO valde ändå att BEHÅLLA
u-panelen, för konsekvent grafutseende mellan alla scenariotyper:**
- Huvudgrafens u-panel återinförd för ALLA scenarier (kaskad eller ej).
- Nytt lärstigssteg tillagt: "Grundmekanismen — en SP-förändring"
  (`kaskad-demo-sp-steg.json`), placerat direkt efter teoriintrot och före
  "Enkelslinga — problemet". Visar SP1→SP2→U→PV2→PV1-kedjan via en
  AVSIKTLIG börvärdesändring (inte en störning).
- 5 nya enhetstester.

**Uppföljning, fjärde rundan (samma dag) — fyra punktinsatser:**
- Tog bort irrelevant implementationsresonemang ur "Grundmekanismen"-stegets
  instruktion.
- Huvudgrafens nedre panel märktes "u (slav)" för att förtydliga att värdet
  var slavregulatorns (se femte rundan för den riktiga lösningen).
- "Grundmekanismen"-scenariot byggdes om till normalValue=50 (SP1 50→90)
  istället för normalValue=0 (SP1 0→50) — konsekvent med de tre andra
  scenarierna, och undviker en teknisk risk (normalValue=0 hade gjort
  störningsscenarierna sårbara för att PV1 dyker under 0, utanför grafens
  synliga yta, vid en negativ störning).
- Tog bort felaktig "sidopanelen"-terminologi — Slavslinga-panelen ligger i
  huvudkolumnen, inte i en separat sidopanel.

**Uppföljning, femte rundan (samma dag) — PO pekade ut en genuin bugg:**
Huvudgrafens u-panel visade fortfarande slavregulatorns utsignal (bara
omdöpt till "u (slav)" i förra rundan, inte åtgärdad), OCH statusraden hade
samma fel. Rotorsaken var djupare än en etikett: `history.p/i/d` var sedan
tidigare ALLTID den YTTRE regulatorns egna termer (aldrig omlästa från
`innerCtrl`), men `history.u` lästes om till den INRE regulatorns — en
inkonsekvens som gjorde att SAMMA statusrad kunde visa två olika
regulatorers värden blandat.
- `sim-core.js`: `history.u` är nu ALLTID den yttre/huvud-regulatorns EGNA
  utsignal (`ctrl.u`, konsekvent med p/i/d) — en ren no-op för alla
  icke-kaskad-scenarier (där den redan var samma värde). Ny fält
  `history.uInner` för den inre regulatorns egna, verkliga ventilsignal
  (0 = no-op utan kaskad, samma mönster som sp2/pv2). `getState()` returnerar
  båda.
- Huvudgrafen/statusraden/legend/crosshair visar nu `u1` (huvudslingans egna
  utsignal, en avvikelse i kaskadläge — axeln skalas efter regulatorns egna
  outputLimits istället för hårdkodat 0–100). SP2/PV2 borttagna ur
  crosshairen (hör till slavslingan, redan alltid synliga i Slavslinga-
  panelen). Slavslinga-panelens fält/mini-graf/statusbadge/signalkedja
  använder nu `uInner` istället för `u`.
- 3 nya/omskrivna enhetstester (totalt 35 i
  tests/feat-050-kaskadreglering.test.mjs).

**Slutstatus:** Mergad till `develop` (2026-09-24, merge-commit 7ba9571) på PO:s
uttryckliga beslut, efter sex PO-testrundor. Full regression grön (11 testfiler,
347 kontroller). **Inte tillagd i `catalog.prod.json`, inte släppt till
main/PROD** — PROD-release (tillsammans med FEAT-048 Kvotreglering) kräver ett
separat PO-beslut.

### FEAT-047 — Förbättrad lärstig för integrerande process och nivåreglering
**Prioritet:** Medel — PO:s fynd vid manuell granskning (2026-09-23), lärstigen
bedömdes inte redo för PROD i nuvarande form.
**Beskrivning:**
PO:s granskning av `integrerande-process-niva.v1` identifierade tre problem: (1)
200 steg räckte inte för att visa stationärt tillstånd, (2) pulsstörningen var för
kraftig och dominerade innehållet, (3) för få lärstigssteg jämfört med senare
lärstigar.
**Förstudie:** `docs/reports/FEAT-047_FORSTUDIE-NIVAREGLERING.md`. Nuvarande tuning
(Kp=1,5/Ti=80) svängde permanent inom 2%-bandet först vid steg 395 (inte 200);
pulsen (mag=5, dur=20) drev PV till 154,9, långt över mätområdet, eftersom en
integrerande process saknar återställande kraft mot ackumulerande stötar; 2 steg
var kortast i hela katalogen (median ~5–7).
**Genomförande (PO-godkänd 2026-09-23):**
1. Ny scenariofil `integrating-p-only.json` (P-ensam, Kp=1,5) för ett nytt
   baslinjesteg som visar det kvarstående felet (PV≈26 mot SP=60) — verifierat.
2. `integrating-pi.json` omtunad Kp 1,5→4, Ti 80→60 (insvängning vid steg ~112
   istället för ~395); pulsens `durationSteps` 20→2 (samma magnitude=5, topp ~70
   istället för ~155).
3. `integrerande-process-niva.v1.json` utökad 2→5 steg: teori → P-ensam (ny) → PI
   (omtunad) → störningsavvisning (ny, `continueFromPreviousStep` från
   PI-steget) → jämförelse mot självreglerande process (ny, återanvänder
   `basic-step-self-regulating.json` — enda avvikelsen från förstudiens mer
   öppna skiss, PO:s egen invit "om det kan motiveras pedagogiskt").
4. Samtliga instruktionstal verifierade genom en fullständig, stegvis
   end-to-end-simulering som replikerar appens egen `loadScenarioByName()`/
   `continueFromPreviousStep`-logik exakt — matchar rapportens siffror.
5. `node tests/validate-content.mjs` grön (32/32 scenarier, 12/12 lärstigar).
   `catalog.prod.json` orört (lärstigen är DEV-only). Ingen ändring i
   `sim-core.js`/`app.js`.
**Status:** Mergad till `develop` (2026-09-23). Branch
`feature/FEAT-047-nivareglering-larstig` raderad. **Släppt till main/PROD i
v1.6.2 (2026-09-24)** — lärstigen "Integrerande process och nivåreglering"
och dess scenarier/teorimodul tillagda i `catalog.prod.json` (PO-godkänt
efter uttrycklig fråga), `tests/validate-prod.mjs`s allowlist uppdaterad i
samma commit. Se `CHANGELOG.md` v1.6.2.

### FEAT-048 — Kvotreglering (Ratio Control)
**Prioritet:** Hög — PO:s produktbeslut efter godkänd förstudie (STRAT-006, 2026-09-24).
**Beskrivning:**
Kvotreglering implementerad som ett ADDON (inte en egen Tillämpning), enligt
STRAT-006: SP_B = Kvot × Flöde A, där Flöde A ("vilt" vattenflöde) varierar
kontinuerligt och Flöde B (doseringsflöde) regleras av en helt vanlig
PID-regulator. Processexempel: kemikaliedosering proportionell mot
vattenflöde (inte bränsle/luft). Följer UX-002/UX-004s redan etablerade
UI-arkitektur rakt av.
**Genomförande:**
1. `sim-core.js`: `Simulation.wildFlow` (kontinuerlig slumpvandring via
   samma RNG som brusmodellen, klippt till ±50% av bas-nivån) + en ny gren
   i `step()` som skriver SP = Kvot × Flöde A till `scenario.runtime.setpoint`
   INNAN sp läses, oberoende av regulatorläge. Två separata villkor,
   avsiktligt: flöde A vandrar när `wildFlow.base > 0` (oavsett om
   kvotreglering är AKTIVERAD — krävs för lärstigens "utan kvotreglering"-
   steg), men SP skrivs bara över när `.enabled` också är sant.
   `base > 0`-väktaren (inte bara `ratioControl` truthy) är avsiktlig:
   `syncParamsFromUI()` skriver `ratioControl` till VARJE scenario (samma
   mönster som gainSchedule/nonlinearGain redan gör) — utan väktaren skulle
   `gaussian(this.rng)` konsumera slumptal på varje steg i ALLA scenarier
   så fort UI:t synkats en gång, vilket hade rubbat brusmodellens
   (noiseStd) reproducerbarhet i helt orelaterade scenarier. Verifierat
   (test 5a): bit-identisk brusbana med/utan en närvarande men okonfigurerad
   (base=0) ratioControl-post.
2. `app.js`: nya fält (`ratioControlEnabled`/`ratio`/`wildFlowBase`/
   `wildFlowVolatility`), `deriveApplicationProfile()` härleder
   Temperaturprocess när flöde A är konfigurerat, `APPLICATION_PROFILES`
   utökad med addonet "kvotreglering" (temperatur/avancerat, samma profiler
   som framkoppling — INGEN ny Tillämpning, INGEN ny fjärde profil).
   SP-fältet inaktiveras (inte döljs) när kvotreglering är aktiv, eftersom
   det annars ändå skrivs över varje steg. `markerSnapshot()`/
   `describeMarkerChange()` utökad med "Kvotreglering ändrad", fångar bara
   KONFIGURATIONEN, inte den löpande SP-rörelsen (annars en falsk markering
   varje steg).
3. `index.html`: fyra nya fält, `data-addon="kvotreglering"` på samtliga,
   Regulatorkonfiguration→Avancerat (Kvotreglering aktiv, Kvot),
   Processinställning→Avancerat (Flöde A basnivå, Flöde A volatilitet) —
   exakt PO:s specificerade placering. Statusraden visar Flöde A/Flöde B/
   faktisk kvot (`fmt2`, ny 2-decimalers hjälpfunktion).
4. Ny lärstig `kvotreglering.v1` (4 steg: Teori → Utan kvotreglering → Med
   korrekt kvotreglering → Felaktigt satt kvot), 3 nya scenariofiler, 1 ny
   teorifil. DEV-only (catalog.prod.json orört). Tuning (Kp=3/Ti=5, flöde A
   bas=50/volatilitet=2) vald efter ett verifierat sökning över flera
   Kp/Ti-kombinationer för tightast kvot-spårning.
5. Samtliga instruktionstal i lärstigen verifierade genom en fullständig
   end-to-end-körning mot de FAKTISKA, sparade scenariofilerna.

**Uppföljning 1 — trendgrafsvisualisering (PO:s användartest, 2026-09-24):**
Flöde A syntes ursprungligen bara i statusraden, vilket gjorde det svårt att
visuellt se sambandet Flöde A → SP_B → PV_B över tid. Löst genom: nytt
`history.wildFlow`-fält i `sim-core.js`; Flöde A ritas i `drawChart()` som en
egen, TUNN (width=1, ny valfri parameter på `drawSeries()`) rosa (`#c2185b`)
streckad linje i SAMMA panel/skala som PV/SP (till skillnad från Framkopplings
Last/auxValue, som medvetet INTE ritas eftersom ett negativt lastvärde skulle
hamna utanför panelens klippta yta — wildFlow kan aldrig bli negativt).
Dynamisk legend (`#chartLegend`) nämner Flöde A bara när linjen faktiskt
ritas.

**Uppföljning 2 — Mätläge/crosshair (PO:s komplettering, 2026-09-24):**
Crosshair-avläsningen visade bara PV/u/t, inte Flöde A eller SP_B. Löst genom
att lyfta `wildFlow`/`hasWildFlow` till funktionsnivå i `drawChart()` (delas
mellan graflinjen och crosshairen) och lägga till `spH`/`wildH` i
tooltip-raderna, läst från samma `iNear`-index som PV/u — synligt endast när
`hasWildFlow`, oförändrat för övriga reglerstrategier.

**Tester:** `tests/feat-048-kvotreglering.test.mjs`, 41 kontroller (vuxit i
tre omgångar: 27 → 37 → 41). Full regression grön (11 testfiler, 307
kontroller totalt), DEV-/PROD-innehålls- och byggvalidering grön,
`catalog.prod.json` verifierat oförändrat genom alla tre rundor.
**Status:** Mergad till `develop` (2026-09-24), commit 8fddbfa (senaste av tre
FEAT-048-commits). **Inte tillagd i `catalog.prod.json`, inte släppt till
main/PROD, ingen exponering mot studerande** — funktionen stabiliseras på
develop medan arbetet fortsätter med kaskadreglering och tillhörande
pedagogiskt material, per uttrycklig PO-instruktion.

### UX-002 — Tillämpnings-/processmodellsväljare (Fas 0 av UX-001)
**Prioritet:** Hög — PO:s beslutade nästa steg (2026-09-20), efter UX-001.
**Beskrivning:**
Fas 0 från `docs/reports/UX-001_FORSTUDIE-PROCESSBASERAD-UX.md` avsnitt 5:
ny "Tillämpning"-väljare (Fri utforskning/Tvålägesreglering/Temperaturprocess/
Nivåprocess) som filtrerar vilka processmodeller (`processType`) som erbjuds
och vilka strategitillägg (Framkoppling/Parameterstyrning/Ventilkarakteristik)
som visas. Processmodellen ("Processtyp" döpt om till "Processmodell") förblir
alltid synlig och väljbar — bara ALTERNATIVEN filtreras, inte begreppet.
Ingen ändring i `sim-core.js`, inget nytt scenariofält, Fri utforskning är
default (= dagens fulla UI, oförändrat för alla 12 befintliga lärstigar).
Blandnings-/kvotprocess och Kaskadreglerad process byggs INTE nu (Fas 2,
kräver egen strategikod som inte finns än).
**Genomförande:**
Ny "Tillämpning"-grupp överst i parametersidopanelen (`#groupTillampning`,
samma `.param-group`-mönster som övriga grupper) med väljaren
`#applicationProfile` (Fri utforskning/Tvålägesreglering/Temperaturprocess/
Nivåprocess). Ny `APPLICATION_PROFILES`-tabell i `app.js` (fyra profiler,
matchar UX-001 avsnitt 1.1 exakt) och `applyApplicationProfile()`: filtrerar
`#processType`s `<option>`-alternativ via `.hidden` (väljaren SJÄLV döljs
aldrig, bara alternativen — PO:s pedagogiska krav), faller tillbaka till ett
giltigt värde om det aktuella blir otillåtet, och visar/döljer
strategitilläggen via en ny `[data-addon]`-attributmarkering (auxGain/Kff/
Last mag/Trigga last → `framkoppling`; `#gainScheduleField(s)` →
`parameterstyrning`; `#nonlinearGainField(s)` → `ventilkarakteristik`) och en
`.addon-hidden`-CSS-klass med `!important` (vinner medvetet över befintlig
lägesbaserad `style.display` på samma element, t.ex.
`updateProcessUIState()`s hantering av `nonlinearGainField` — annars hade de
två skrivit över varandra). "Processtyp" omdöpt till "Processmodell"
(fält-etikett + `help.json`). Inget sparat tillämpningsläge mellan
sidladdningar — Fri utforskning är alltid startläget, per PO:s ord. Ingen
ändring i `sim-core.js`, inget nytt scenariofält.
**Tester:** `tests/ux-002-application-profile.test.mjs` (43 kontroller, ren
statisk källkodsgranskning — samma mönster som
`hotfix-v1.4.1-facit-env.test.mjs` — inklusive att `APPLICATION_PROFILES`
extraheras och körs isolerat för att verifiera den faktiska datastrukturen,
inte bara regexmatchas). Full regression grön (9 testfiler, 218
kontroller), DEV-/PROD-innehålls- och byggvalidering grön.

**Åtgärder efter PO:s första visuella granskning (2026-09-20):**
1. **Observation 1 (egen grupp tog för mycket plats):** "Tillämpning"-fältet
   flyttat ur sin egen `#groupTillampning`-grupp (borttagen) och in i
   Process-gruppen, direkt FÖRE Processmodell — synliggör sambandet
   Tillämpning → Processmodell → processparametrar utan extra vertikalt
   utrymme.
2. **Observation 2 (lärstig satte bara Processmodell, inte Tillämpning —
   kunde visa "Nivåprocess" + ett självreglerande scenario samtidigt):** ny
   `deriveApplicationProfile(scenario)` i `app.js`, körd vid VARJE
   scenarioladdning (`loadScenarioByName()`, både via lärstig och manuellt
   scenarioval) — härleder Tillämpning från data som redan finns i
   scenariot (inget nytt scenariofält): `auxSignal`/aktiv
   `gainSchedule`/`nonlinearGain` → Temperaturprocess, `process.type ===
   "integrating"` → Nivåprocess, `mode === "onoff"` → Tvålägesreglering,
   annars → Fri utforskning. Sätts INNAN `applyApplicationProfile()`
   filtrerar Processmodell-alternativen, så de två alltid är en
   sammanhängande kombination — aldrig kvarlämnad från ett tidigare,
   orelaterat scenario. Verifierat mot verkliga scenariofiler
   (`integrating-pi.json`→niva, `onoff-basic.json`→onoff,
   `valve-nonlinear-gain-demo.json`/`framkoppling-demo-pid.json`→temperatur,
   generiska PID-scenarier→fri).

**Åtgärd efter PO:s andra visuella granskning (skärmdump, 2026-09-20):** fält
i parametergrupperna satt i ett FAST 6-kolumners CSS-rutnät
(`grid-template-columns: repeat(6, minmax(110px, 1fr))`) — alla fält tvingades
till samma kolumnbredd oavsett innehåll. Konkret symptom i skärmdumpen:
Processmodell-väljaren klippte av lång text ("Självreglerande" utan att visa
"(enkapacitiv)"/"(flerkapacitiv)"), medan korta fält som K/T/L slösade
utrymme. Löst genom att byta `.param-group` från `display: grid` till
`display: flex; flex-wrap: wrap` — varje `.field` får nu bredden dess EGET
innehåll (etikett eller select/input) faktiskt behöver (`flex: 0 0 auto` +
`min-width: 90px` som golv, inte tvingat mått), istället för en delad
rutnätskolumn. De tre breakpoint-specifika `grid-template-columns`-
övermappningarna (1200px/860px/640px) är onödiga med flexbox (radbrytning
sker naturligt) och borttagna; 640px-brytpunkten har istället `.field {
width: 100%; }` tillagd för att bevara ett-fält-per-rad på smala skärmar,
samma avsikt som tidigare. Ren CSS-ändring, ingen JS/HTML-struktur berörd
utöver `.param-group-label`s `grid-column: 1 / -1` → `width: 100%`. Full
regression fortsatt grön (218 kontroller).

**Uppföljning efter PO:s tredje skärmdump (2026-09-20):** flex-fixet ovan
gjorde `.field` innehållsstyrd, men `<input type="number">` (K/T/L m.fl.)
saknar SJÄLV en innehållsstyrd bredd — till skillnad från `<select>` (som
webbläsaren automatiskt sizear efter det valda alternativets text) använder
en `<input>` webbläsarens breda standardbredd (~170–220px) oavsett hur kort
värdet är. Löst med en ny regel `input[type="number"] { width: 90px; }`.
Full regression fortsatt grön (218 kontroller).

**Funktionell bugg + två uppföljningsfrågor, åtgärdade tillsammans
(2026-09-20):** PO:s skärmdumpar visade att Parameterstyrning förblev AKTIV
i simuleringen efter byte till Tvålägesreglering, trots att kryssrutan blivit
osynlig och oåtkomlig — att bara DÖLJA ett tillägg räckte inte, dess EFFEKT
måste stängas av. Löst i `applyApplicationProfile()`: Parameterstyrning/
Ventilkarakteristik avmarkeras, Framkoppling nollställs (Kff, Last mag, OCH
ett redan triggat `sim.auxValue`). PO:s uppföljningsfråga 1 (ska Läge
blockeras vid Tvålägesreglering?): ja — `APPLICATION_PROFILES` utökad med
`modes` per profil. PO:s uppföljningsfråga 2 (Bumpless giltigt vid on/off?):
nej — verifierat att Bumpless bara har effekt vid byte till p/pi/pid/
manuellt läge; fältet döljs nu vid Läge=OnOff.

12 nya testkontroller (55 totalt). Full regression grön (9 testfiler, 230
kontroller), DEV-/PROD-validering grön.

**Systematisk synlighetsgranskning (2026-09-20), PO:s uppdrag:** full
genomgång i `docs/reports/UX-002_SYNLIGHETSGRANSKNING.md`. Rekommendation:
(1) ta bort Tvålägesreglering som egen tillämpning (fel axel — on/off är en
regulatorstrategi, samma axel som Läge, inte en processkontext; dess
uteslutning av Integrerande saknar reglerteknisk grund); (2) lägg till
Läges-villkor på Framkopplingens fält (bekräftad bugg — de saknade
Läges-villkor helt, till skillnad från Parameterstyrning som redan hade
motsvarande skydd sedan FEAT-042). Samtliga 12 lärstigars scenarioreferenser
körda programmatiskt genom `deriveApplicationProfile()` — härledningslogiken
själv korrekt för alla redan idag.

**PO gav klartecken (2026-09-20)** att implementera exakt de två
rekommenderade ändringarna:
1. **Tvålägesreglering borttagen som egen tillämpning.**
   `APPLICATION_PROFILES` går från fyra till TRE profiler (`fri`/
   `temperatur`/`niva`); `"onoff"` tillagt i `temperatur.modes`/
   `niva.modes`; `deriveApplicationProfile()`s `onoff`-specialfall borttaget.
2. **Läges-villkor tillagt för Framkoppling.** Ny funktion
   `updateFramkopplingVisibility()`: Lastförstärkning/Kff/Last mag/Trigga
   last kräver nu BÅDE att Tillämpningen tillåter tillägget OCH att Läge ∈
   {P, PI, PID}. Anropas från både `applyApplicationProfile()` och
   `updateControllerUIState()`.

Synlighetsmatrisen re-verifierad programmatiskt mot samtliga 12 lärstigar
efter ändringen: inga avvikelser. 20 nya/ändrade testkontroller (56 totalt).
Full regression grön (9 testfiler, 231 kontroller), DEV-/PROD-validering
grön.

**Uppföljningsanalys innan merge (UX-003, 2026-09-21):** PO observerade att
Fri utforskning och Temperaturprocess i praktiken nästan är identiska och
bad om en analys av att ta bort Fri utforskning till förmån för en
"Avancerat"-sektion per tillämpning. Se `docs/reports/UX-003_BEHOVS-FRI-UTFORSKNING.md`
— rekommendation: behåll Fri utforskning (Alternativ A), ingen konsekvens
för UX-002. Se egen UX-003-post i `todo.md` för fortsatt beslutsstatus
(Fri utforskning kvar; ingen ytterligare analys planerad just nu).

**Status:** Mergad till `develop` (2026-09-21), PO:s klartecken. Branch
`feature/UX-002-tillampningsval` borttagen.

### UX-003 — Behövs Fri utforskning?
**Prioritet:** Hög — utreds innan UX-002:s mergebeslut, på PO:s begäran
(2026-09-21).
**Beskrivning:**
Efter UX-002:s tredje kodrunda observerade PO att Fri utforskning och
Temperaturprocess i praktiken skiljer sig väldigt lite. Uppdrag: analysera
Alternativ A (behåll Fri utforskning) mot Alternativ B (ta bort den, inför en
hopfällbar "Avancerat"-sektion per tillämpning som visar allt kompatibelt med
vald Processmodell). Ren analys, ingen kod, ingen branch.
**Leverans:** `docs/reports/UX-003_BEHOVS-FRI-UTFORSKNING.md`. Sammanfattning:

1. **Nulägesbekräftelse:** med dagens `APPLICATION_PROFILES` är `modes` och
   `addons` identiska mellan `fri` och `temperatur` — enda skillnaden är att
   `fri` även tillåter Integrerande som Processmodell. Ingen av de 12
   lärstigarna använder faktiskt den kombinationen (Integrerande + tillägg)
   idag.
2. **Fri utforskning fyller TVÅ separata roller**, inte en: (1) en
   processmodell-fråga (obegränsad kombination, oanvänd av dagens innehåll)
   och (2) semantiskt hem för åtta MEDVETET kontextlösa lärstigar
   (`kom-igång` m.fl., se UX-001 avsnitt 1.3) — Roll 2 försvinner inte bara
   för att Roll 1 byggs om.
3. **Alternativ B:s definition ("Avancerat" = allt kompatibelt med aktuell
   Processmodell) förutsätter en redan vald Tillämpning** — löser alltså
   inte var de åtta kontextlösa lärstigarna ska höra hemma utan att antingen
   (a) tvinga in dem under en tillämpning de inte handlar om, i strid med
   UX-001 avsnitt 1.3, eller (b) återinföra ett neutralt "allt olåst"-läge
   ändå, fast under annat namn/annan form — dvs. Fri utforskning omdöpt, inte
   borttaget.
4. Alternativ B skulle dessutom göra `framkoppling.v1`s och
   `parameterstyrning-ventilkarakteristik.v1`s EGNA ämnesfält gömda bakom
   ett extra klick i sina egna dedikerade lärstigar — motsatt effekt av
   UX-001s syfte.
5. Alternativ B:s enda tydliga vinst (slipper manuell synk mot `fri.addons`
   när Kvotreglering/Kaskadreglering tillkommer) koncentreras till
   Kvotreglering — Kaskadreglering behöver enligt STRAT-001 ändå en egen
   layout.
6. **Rekommendation: Alternativ A** (behåll Fri utforskning).

**Status:** **PO antog rekommendationen (2026-09-21)** — Alternativ A,
Fri utforskning behålls oförändrad. Ingen implementation krävs (dagens kod
matchade redan rekommendationen). Ingen ytterligare analys av frågan
planerad. Stängt.

### UX-004 — Omstrukturering av huvudyta och progressiv exponering
**Branch:** `feature/UX-004-huvudyta-omstrukturering` (raderad efter merge)
**Prioritet:** Hög — PO+PM:s designbeslut (2026-09-21), direkt efter UX-002:s
merge.
**Beskrivning:**
PO+PM har fattat ett redan beslutat designbeslut (ej del av denna analys):
huvudytan ska omorganiseras kring tre grupper — Processinställning,
Regulatorkonfiguration, Processpåverkan (Styrning+Störningar slås ihop) —
med avancerade fält separerade från grundparametrarna för att minska visuell
komplexitet. Uppdrag: analysera slutlig informationsarkitektur, vad som
alltid ska synas, vad som ska bakom "Avancerat", hur lärstigar ska styra
synligheten, samspelet Tillämpning/Processmodell/lärsteg, risker, och ett
konkret layoutförslag. Ren analys, ingen kod, ingen branch.
**Leverans:** `docs/reports/UX-004_OMSTRUKTURERING-HUVUDYTA.md`. Sammanfattning:

1. **Viktig avgränsning:** detta "Avancerat" är INTE UX-003:s avfärdade
   förslag (som skulle ERSÄTTA Tillämpning/Fri utforskning) — det är ett
   disklosyr-lager som verkar INOM det redan mergade UX-002-systemet.
   Tillämpning avgör fortfarande vilka fält som är MÖJLIGA; Avancerat avgör
   bara om ett redan tillåtet fält visas direkt eller bakom en klickning.
2. **Informationsarkitektur:** U min/U max flyttas till
   Regulatorkonfigurations grundnivå (konfiguration, ändras sällan under
   körning); SP och Manuell u till Processpåverkan (ändras under körning,
   per PO:s egen definition av gruppen). 23 av dagens 45 kontroller blir
   grundnivå, 22 blir Avancerat (exakt lista i rapporten avsnitt 3).
   Processpåverkan föreslås förbli FLACK (ingen egen Avancerat-nivå) — redan
   smal och redan addon-filtrerad.
3. **Lärstigsstyrning (kärnlösning):** Avancerat-sektionens öppen/stängd-
   status härleds AUTOMATISKT från scenariots egna aktiva värden
   (`kff !== 0`, `gainSchedule.enabled`, etc.) — återanvänder samma
   signalkälla som UX-002:s `deriveApplicationProfile()`, ingen ny
   lärstigstaggning krävs i normalfallet. Undantag: Bumpless/Anti-windup är
   `true` i nästan alla scenarier (default, inte ett ämnessignal) — löses
   med ett nytt, valfritt `forceAdvancedOpen`-fält per lärstigssteg, bara
   för de fåtal lärstigar (idag: `windup-antiwindup.v1`) där ämnet är en
   fält-EXISTENS snarare än ett avvikande värde.
4. **Störst risk:** discoverability-regression för Anti-windup/Bumpless
   (flyttas till Avancerat trots att de inte är addon-gated idag) —
   `windup-antiwindup.v1` måste verifieras manuellt efter implementation,
   inte bara programmatiskt. Näst störst: två disklosyr-mekanismer
   (addon-hidden från UX-002 + ny Avancerat-kollaps) verkar på samma fält
   (t.ex. Kff) — måste kombineras med AND, inte skriva över varandra.
5. **Layoutförslag:** nästlad kollapsbar "Avancerat"-rad per grupp,
   återanvänder FEAT-044s redan etablerade `.zone-table`-hopfällningsmönster
   — ingen ny komponenttyp att lära ut.

**PO:s fyra justeringsbeslut (2026-09-21) och genomförande:**

1. **Justering 1 — "Fri utforskning" → "Avancerat".** Kortare, mer
   etablerat begrepp, samma expertlägesroll ("visar allt"). Genomfört:
   `APPLICATION_PROFILES`-nyckeln `fri` → `avancerat`, UI-alternativet döpt
   om. Att välja Avancerat tvingar nu ÄVEN alla Avancerat-disklosyrsektioner
   öppna (kopplar ihop UX-002:s Tillämpningsbegrepp med UX-004:s nya
   disklosyrmekanism till EN sammanhängande "expertläge"-betydelse, istället
   för två delvis överlappande begrepp).
2. **Justering 3 — Last är generell processpåverkan, inte exklusiv för
   Framkoppling.** Motivering: laststeg är användbart för ren
   regulatorprovning även utan Kff, och hittills har bara SP-steg funnits
   som generellt utvärderingsverktyg. Genomfört: `data-addon="framkoppling"`
   borttaget från Lastförstärkning/Last mag/Trigga last (kvar bara på Kff);
   `updateFramkopplingVisibility()` → `updateKffVisibility()`; inget
   nollställs längre vid tillämpningsbyte för Last. **Upptäckt och åtgärdad
   regression under implementationen:** `deriveApplicationProfile()` hade
   ändrats att bara härleda Temperaturprocess från Kff — men
   `framkoppling.v1`s FÖRSTA steg har `kff=0` ("PID ensam", innan Kff
   introduceras), vilket hade härlett det steget till en ANNAN Tillämpning
   än lärstigens övriga två steg. Löst genom att behålla `auxSignal` som
   signal TILLSAMMANS MED `kff` — verifierat programmatiskt att `auxSignal`
   idag ENDAST förekommer i `framkoppling.v1`s fyra scenarier, så det bredare
   villkoret är riskfritt. Samtliga 12 lärstigar re-verifierade
   programmatiskt efter fixen: inga avvikelser.
3. **Justering 4 — Auto/Manuell som togglefunktion.** Läge-väljaren ersatt
   av Regulatortyp (OnOff/P/PI/PID) + en separat Auto/Manuell-toggle, som
   verklig driftväxling. `#mode` (5 alternativ) kvar som DOLD intern
   sanningskälla — all befintlig logik (`syncParamsFromUI`,
   `updateControllerUIState`, Tillämpnings-filtrering) rör den ALDRIG, bara
   HUR värdet sätts är nytt. Byte till Manuellt seedar nu `manualOutput`
   OVILLKORLIGT med aktuellt u (tidigare gated på Bumpless-kryssrutan, som
   styr en annan, separat sak — regulatorns egen bias-fasning vid övergång
   TILL p/pi/pid). Ingen ändring i `sim-core.js`.
4. **Justering 5 — Visa PB flyttat till grafen.** PB är en härledd
   graf-visning (av aktuell Kp), inte något användaren konfigurerar — hör
   hemma vid grafen den analyseras i. Genomfört: ny rad `#chartControls`
   direkt ovanför `#chartWrap`, samma `#showPB`-id (bara ny DOM-plats).

**Genomförande i övrigt (full IA från analysen, se rapporten):** tre grupper
(`groupProcessinstallning`/`groupRegulatorkonfiguration`/
`groupProcesspaverkan`) ersätter de fyra gamla. Nästlad, kollapsbar
"Avancerat"-sektion per grupp (Processinställning: Lastförstärkning +
Ventilkarakteristik; Regulatorkonfiguration: Kff + Parameterstyrning +
Bumpless + Anti-windup) — öppen/stängd härleds automatiskt
(`deriveAdvancedOpen()`) från: Tillämpning="avancerat" (allt uppackat) ELLER
scenariots aktiva värden (samma signal som `deriveApplicationProfile()`)
ELLER ett nytt, valfritt scenariofält `forceAdvancedOpen` (satt på
`pi-windup-demo.json`, eftersom Anti-windup/Bumpless är `true` i nästan alla
scenarier och alltså inte fångas av "aktivt värde"-heuristiken).
Processpåverkan hålls flack (ingen egen Avancerat-nivå, per analysens
rekommendation 2.2).

**UX-004 Implementering (uppföljande PO-uppdrag, 2026-09-22):**

1. **Tillämpning sparas nu i `localStorage`** (`APPLICATION_PROFILE_STORAGE_KEY`,
   `pidSimApplicationProfile`) — motsatsen till förra sessionens beslut ("aldrig
   sparat"), ett uttryckligt nytt PO-krav ("lärare/studerande återkommer ofta
   till samma scenario"). Sparas bara vid ett MANUELLT val i
   `#applicationProfile`, inte vid varje scenario-/lärstigsstyrd omhärledning.
2. **Infrastruktur för lärstigsstyrd synlighet** — ett nytt, valfritt fält
   `visibilityOverride: { show: [...], hide: [...] }` (addon-namn) på en
   lärstigs JSON, applicerat sist av tre lager (Tillämpning → Avancerat →
   lärstig) via ny `applyPathVisibilityOverride()`. Wired in i
   `parameterstyrning-ventilkarakteristik.v1` (visar Parameterstyrning,
   döljer Kff) och `framkoppling.v1` (visar Kff, döljer Parameterstyrning).
3. Bugg hittad och fixad under webbläsarverifiering: en helt ny sidladdning
   (tom `localStorage`) lämnade Tillämpning på det härledda "Avancerat",
   vilket tvingade ALLA Avancerat-sektioner öppna — emot "Initialt öppet
   läge"-kravet. Fixat: `initUI()` använder `"temperatur"` som förvalt
   startläge när inget är sparat.
4. Bugg hittad och fixad: `loadScenarioByName()` anropar
   `updateControllerUIState()` en andra gång EFTER `applyApplicationProfile()`
   returnerat — dess interna `updateKffVisibility()` skrev tyst över en aktiv
   `hide`-override av Kff. `applyPathVisibilityOverride()` anropas därför en
   gång till, sist i `loadScenarioByName()` också.
5. `windup-antiwindup.v1` (högsta discoverability-risken) visuellt
   verifierad — Bumpless/Anti-windup faktiskt synliga, Avancerat-sektionen
   faktiskt öppen.

**UX-004 kompletteringar efter PO-test (samma dag, 2026-09-22) — sex punkter:**

1. **"Avancerat (N dolda)"-räknaren borttagen helt** — PO ville bara ha
   "Avancerat", ingen räknare.
2. Bugg fixad: Tillämpning="Avancerat" var inte en komplett sandlåda — en
   aktiv lärstigs `visibilityOverride` fortsatte gälla efter manuellt byte
   till Avancerat. `applyPathVisibilityOverride()` returnerar nu tidigt om
   `fields.applicationProfile.value === "avancerat"`.
3. Bugg fixad: en aktiv lärstigs filter kunde läcka till ett senare,
   manuellt valt scenario (`currentPath`/`currentPathStep` nollställdes
   bara av `loadPath()`/testMode, inte av "Ladda scenario"-knappen). Fixat.
4. **Lastförstärkning flyttad** från Processinställningens Avancerat-sektion
   till Processpåverkans grundnivå, bredvid Last mag/Trigga last.
   `deriveAdvancedOpen()`s "process"-villkor justerat i samma veva (bara
   `nonlinearGain?.enabled`, inte längre `auxGain`).
5. Samtliga 12 aktiva lärstigar granskade rad för rad för kvarvarande
   referenser till de fyra gamla gruppnamnen (Process/Regulator/Styrning/
   Störningar) — sex filer hade stale text, samtliga fixade (inkl.
   introduktionslärstigen `kom-igång.v1`, granskad extra noggrant).
6. Zonparametrarnas visuella sammanflytning i Parameterstyrning registrerad
   i `docs/planning/WEB-IAKTTAGELSER.md` som framtida finputsning, INTE
   åtgärdad (PO:s uttryckliga instruktion).

**kom-igång.v1 — separat PO-beslut (samma dag, 2026-09-22):**
introduktionslärstigen härledde till Tillämpning="Avancerat" (dess
generiska scenarier saknar särskiljande signaler) — tvingade alla
Avancerat-sektioner öppna för en helt ny användares FÖRSTA lärstig. PO
beslutade: kom-igång.v1 ska konsekvent starta i Temperaturprocess. Ny,
generell infrastruktur: ett valfritt lärstigsfält `forceApplicationProfile`
(samma mönster/stalenessvakt som `visibilityOverride`), applicerat i
`loadScenarioByName()` efter `deriveApplicationProfile()`.
`kom-igång.v1.json` fick `forceApplicationProfile: "temperatur"`.

**Verifiering:** 372 automatiska kontroller gröna (16 testfiler),
DEV-/PROD-innehålls- och byggvalidering grön. Fullständigt visuellt
verifierat i isolerad headless Chrome (Chrome DevTools Protocol, Node 24:s
inbyggda `WebSocket`-klient) — fräsch sidladdning, Tillämpnings-persistens,
lärstigsstyrd synlighet i båda riktningarna, sandlådebeteende för
Tillämpning="Avancerat", stalenessvakt vid manuellt scenariobyte,
`kom-igång.v1` hela vägen genom samtliga 5 steg, samt en explicit kontroll
att FEAT-044 (`.zone-table`) INTE följt med. Se
`docs/tests/test-ux-004-huvudyta.md` för fullständig testmatris.

**Status:** PO godkände UX-004 (2026-09-22) och gav uppdrag att genomföra
merge enligt projektets normala Gitflow. Mergad
`feature/UX-004-huvudyta-omstrukturering` → `test/ux-004-huvudyta` → `develop`
(2026-09-22). Branchen raderad efter merge.

### STRAT-004 — Förstudie: Framkoppling (Feedforward)
**Prioritet:** Medel — analysuppdrag, ingen implementation
**Beskrivning:**
Uppdrag från PO: förstudie för Framkoppling (Feedforward), näst i STRAT-001s
prioritetsordning efter Parameterstyrning (FEAT-042, nu levererad). Analys av
pedagogiskt mål, teknisk lösning, visualisering, scenarier/lärstigar och
arkitektur — samt lärdomar från FEAT-042s tre granskningsrundor. Ingen kod,
ingen branch, ren analys.
**Genomförande:**
Full rapport: `docs/reports/STRAT-004_FORSTUDIE-FRAMKOPPLING.md`. Rekommenderad
designriktning: ett generellt namngivet `scenario.auxSignal`-koncept (STRAT-001s
hjälpsignal, konkretiserat), manuellt triggad via en ny knapp ("Trigga last")
i exakt samma mönster som `triggerPulse()`/"Trigga puls" redan etablerat.
Statisk framkoppling (`u_ff = Kff × auxSignal`), ingen dynamisk
fördröjningsmodell. Lastsignalen ritas som en tredje linje i den redan
existerande övre grafpanelen — ingen ny panel. "Ren framkoppling utan
återkoppling" uppnås genom Kp≈UI-minimum, inget nytt regulatorläge behövs.
Samma hjälpsignal återanvändbar rakt av för Kvotreglering senare (kostar i
praktiken noll extra att hålla generell). Fyra risker identifierade, viktigast:
beslutet "övergående kontra permanent laststörning" är olöst och bör avgöras
innan en designspecifikation skrivs. Tre konkreta FEAT-042-lärdomar inbakade i
rekommendationen: dedikerade scenariofiler per lärstigssteg (inte
reload-beroende), Mätläge+2%-toleransband som mätmetod redan från start, och
kompakt fältgruppering (FEAT-044-mönstret) redan i förstadesignen.
**Status:** Mergad till `develop`. Ren analys, ingen appkod ändrad.
Rekommenderat nästa steg: PO-beslut om öppen fråga (avsnitt 3.1), därefter en
designspecifikation (STRAT-003s roll) innan ett bygguppdrag.

---

### FEAT-042 — Parameterstyrning + olinjär ventilkarakteristik
**Branch:** `feature/FEAT-042-parameterstyrning-ventilkarakteristik` (mergad till
`develop`, raderad)
**Beskrivning:**
Designspecifikation: `docs/reports/STRAT-003_DESIGN-PARAMETERSTYRNING-VENTILKARAKTERISTIK.md`
(se `todo-done.md` för STRAT-001/002/003-kedjans fulla historik). Uppdrag från PO:
implementera enligt STRAT-003 — Parameterstyrning (Gain Scheduling), olinjär
ventilkarakteristik K(u), gemensam 3-zons brytpunktstabell, ny lärstig, nya
övningsuppgifter i `docs/exercises/`. Explicit avgränsat: ingen konisk tank, ingen
kvot-/framkopplings-/kaskadreglering, ingen generisk N-zonslösning, ingen dynamisk
tabellredigerare, exakt 3 zoner, full bakåtkompatibilitet.
**Genomförande:**
Full leveransrapport: `docs/reports/FEAT-042_IMPLEMENTATION.md`. Sammanfattning:
delad `scheduleZone()`/`scheduledValue()`-mekanism i `sim-core.js` (regulatorns
kp/ti/td-schema + processens K-schema), 12 nya UI-fält (dolda tills aktiverade),
grafhjälplinjer, statusradsavläsning, ny lärstig (7 steg, insatt efter `pi-pid.v1`)
och nytt övningsdokument `docs/exercises/ovningar-parameterstyrning.md` (4
uppgifter). Demoscenario och samtliga siffror i lärstig/övningar
simuleringsverifierade via `tests/simulation/`. Ny testsvit
`tests/feat-042-gain-schedule.test.mjs` (24 kontroller) + fullständig regression
(15 testsviter, 0 FAIL). Fyra dokumenterade, simuleringsdrivna avsteg från
STRAT-003 (bumplös övergångstajming, horisontella ej vertikala brytpunktslinjer,
två separata jämförbara körningar istället för en sammanhängande, tvåstegs- istället
för trestegs-K-profil i demoscenariot) — se rapportens avsnitt 5–6 för fullständig
motivering. `catalog.prod.json` oförändrad — featuren är DEV-only tills PO beslutar
om produktionsaktivering.
**Uppföljning (PO:s användartest):** Full rapport:
`docs/reports/FEAT-042_ANVANDARTEST-ATGARDER.md`. Fem punkter åtgärdade: tydligare,
namngivna mätinstruktioner (A–F); rotorsak till "Parameterstyrning avstängd i steg 7"
identifierad (varje lärstigssteg laddar om scenariofilen, vilket återställer
kryssrutor till filens standardvärde — samma problem fanns latent i steg 4–5) och
åtgärdad med två nya dedikerade scenariofiler (`valve-nonlinear-gain-demo-kp3.json`,
`-scheduled.json`) så lärstigen själv aktiverar rätt inställning, ingen manuell
ihågkommen åtgärd krävs; ny zonbadge + färgad fälthighlight (`activeZones()`,
`updateZoneIndicators()`); guidning i steg 7 att stega för att observera zonbyten
(simuleringsverifierat: båda bytena sker inom 6 steg — instruktionstexten skriven
därefter); zonbytesmarkeringar i grafen (samma mekanism som övriga
parameterändringar, `markZoneChangeIfAny()`, "Kör 10" omskriven till en explicit
steg-loop för att fånga byten mitt i en batch). 10-stegsknappens låsning analyserad
men INTE implementerad — rekommenderas avstyrkt, se rapportens avsnitt 4.
Fullständig regression (15 testsviter) grön efter ändringarna.
**Sista granskningsrundan (PO:s slutliga feedback):** Full rapport:
`docs/reports/FEAT-042_SISTA-GRANSKNINGSRUNDA.md`. Sex punkter åtgärdade: (1)
zonbadgen togs bort helt — behöll fälthighlight, statusrad och grafmarkeringar,
som instruerat; (2) ny förklaring (teori + steg 7 + hjälptext) av att processens
K-zon (styrs av u) och regulatorns Kp-zon (styrs av PV) är oberoende och kan visa
olika zonnummer samtidigt; (3+5) PO:s notering att dessa två hänger ihop bekräftad
— rotorsaksanalys visade att PO:s ögonmåttsbedömda tider skilde sig kraftigt vid
SP=90 (B/D) men inte vid SP=10 (A/C), exakt matchande att PV tekniskt går in i det
exakta 2%-bandet långt innan kurvan SER helt platt ut för ögat; åtgärdat genom att
instruera exakt samma Mätläge+2%-toleransband-metod som redan är etablerad i
övrigt kursmaterial för samtliga sex mätningar (A–F) — själva jämförelsepåståendena
i texten verifierades korrekta mot scenariernas oförändrade, redan
simuleringsverifierade beteende, inget sakfel hittades där; (4) varje steg
instruerar nu att anteckna SP, Kp/aktiv zon-uppsättning OCH insvängningstid, inte
bara tiden; (6) en mening tillagd i steg 2 om varför Zon 2/3 delar K-värde.
Fullständig regression (15 testsviter) grön. `docs/exercises/ovningar-
parameterstyrning.md` flaggat (inte åtgärdat, låg utanför uppdraget) som
sannolikt drabbat av samma mätmetodsproblem.
**Produktionsaktivering:** PO godkände efter granskning. Lärstigen tillagd sist i
`catalog.prod.json` (`v1.5.5-prod`), efter `storningar-robusthet.v1` — samma
mönster som `PROD-enable-windup-antiwindup`. Dess tre scenarioberoenden
(`valve-nonlinear-gain-demo`, `-kp3`, `-scheduled`) och teorimodulen tillagda i
PROD-katalogen; de två hjälpscenarierna (`-kp3`/`-scheduled`) satta
`standalone: false` (rena lärstigsstöd, inte meningsfulla fristående — samma
princip som `pi-deadtime-comparison`). `tests/validate-prod.mjs`s
`EXPECTED_LEARNING_PATHS`-facit uppdaterat. `node tests/build-preview.mjs prod`
+ `validate-prod.mjs` gröna: 8 lärstigar i rätt ordning, 17 scenarier (14
fristående), inga läckor.
**Status:** Mergad till `develop`. `main` oförändrat tills vidare — väntar på
nästa ordinarie release för att nå produktion.

---

### FEAT-044 — Gruppera Parameterstyrningens/ventilkarakteristikens zonfält
**Branch:** `feature/FEAT-044-zone-fields-table` (raderad efter merge)
**Prioritet:** Låg — kosmetisk UI-förbättring, upptäckt av PO under FEAT-042-testning
**Beskrivning:**
PO:s observation (skärmdump): FEAT-042s 11 regulatorschema-fält (2 brytpunkter + 3×3
Kp/Ti/Td) och 5 processchema-fält låg utspridda som enskilda `.field`-rutor i
parametergridet — upplevdes rörigt, svårt att se vilket fält som hör till vilken zon.
Uppdrag: gruppera visuellt utan att öka vertikalt skärmutrymme nämnvärt.
**Genomförande:**
Zonfälten (Kp/Ti/Td × 3 zoner för Parameterstyrning, K × 3 zoner för
ventilkarakteristik) omstrukturerade från utspridda `.field`-rutor till en kompakt
tabell (`.zone-table`, en rad per zon, kolumner för respektive parameter). Brytpunkts-
fälten ligger kvar oförändrade utanför tabellen. Aktiv-zon-highlighten (FEAT-042,
punkt 3) flyttad från per-fält-ram till helmarkerad tabellrad (`GS_ZONE_ROWS`/
`NG_ZONE_ROWS` i `app.js`, ersätter de gamla `GS_ZONE_FIELD_GROUPS`/
`NG_ZONE_FIELD_GROUPS`) — samma färgkodning (orange/grön) som tidigare. Ingen ändring
i `sim-core.js`, inga nya fält-ID:n.

**Integration mot UX-004 (2026-09-23):** branchen grenade 2026-09-19, före UX-002/
UX-004s omstrukturering av huvudytan, och behövde uppdateras mot dagens `develop`
innan merge. `git merge develop` in i feature-branchen: `app.js` mergade helt
automatiskt (ingen konflikt — FEAT-044s radbaserade highlight och UX-004s ändringar
rör olika delar av filen). `index.html` hade 3 konflikter, samtliga lösta genom att
placera FEAT-044s `.zone-table`-markup INUTI UX-004s redan existerande Avancerat-
sektioner (`nonlinearGainFields`/`gainScheduleFields`), istället för att låta
FEAT-044 återskapa den gamla fyrgruppsstrukturen (Process/Regulator/Styrning/
Störningar) den ursprungligen grenade från. Fullständig teknisk redogörelse:
`docs/reports/FEAT-044_INTEGRATIONSRAPPORT.md`.

**Verifiering:** 386 automatiska kontroller gröna (inkl. FEAT-042 24/24, UX-004
64/64 — ingen återgång till gamla grupper). Visuellt verifierat i headless Chrome:
Parameterstyrning, Olinjär ventilkarakteristik, aktiv zonmarkering (grön/orange rad-
highlight matchar statusraden) och zonbyte mellan flera zoner under en körning
(fyra "Zonbyte"-markeringar loggade, radhighlight vandrade Zon 1→2→3), samt den
guidade lärstigen "Parameterstyrning och olinjär ventilkarakteristik" end-to-end.
**PO:s egen visuella granskning (2026-09-23): godkänd** — "FEAT-044 uppfyller sitt
syfte... Några nya UX-problem har inte identifierats." Fullständig testmatris:
`docs/tests/test-feat-044-zone-fields-table.md`.

**Status:** Mergad till `develop` (2026-09-23) via `test/feat-044-zone-fields-table`,
sedan släppt till `main`/PROD som v1.6.1 (2026-09-23).

**Uppföljning — pedagogisk layoutjustering (2026-09-23):** PO:s vidare granskning
efter v1.6.1 (skärmdump): sambandet mellan en brytpunkt och de två zoner den
avgränsar framgick inte visuellt (brytpunkterna låg som två separata fält FÖRE
tabellen). Löst på `feature/FEAT-044-brytpunkt-layout`: varje brytpunkt flyttad
till en egen, visuellt distinkt rad (streckad kant, mindre text) MELLAN de två
zoner den avgränsar — Brytpunkt 1 mellan Zon 1/Zon 2, Brytpunkt 2 mellan Zon 2/
Zon 3. Samma fält-/zonrad-ID:n som all befintlig logik redan adresserar via
`getElementById` (verifierat genom genomläsning av samtliga `app.js`-referenser)
— ren presentationsändring, ingen ändring i `app.js`/`sim-core.js`. Full
regression grön (9 testfiler, 266 kontroller). PO:s visuella granskning
(skärmdump) godkänd: "det ser bättre ut nu" — kvarvarande horisontellt tomrum i
korten bedömt som en rimlig avvägning (zon-tabellerna är innehållsstyrt smala;
att sträcka ut dem skulle försämra läsbarheten av siffrorna, inte förbättra
den), ingen ytterligare ändring begärd. **Mergad till `develop` (2026-09-23),
branch raderad. Inte släppt till main/PROD** — väntar på nästa planerade
PROD-kandidat, som FEAT-047.

---

### FEAT-043 — Knapp för att släppa fram fler steg vid maxSteps-taket
**Branch:** `feature/FEAT-043-extend-max-steps` (mergad till `develop`)
**Beskrivning:**
Uppdrag från PO: varje scenario har ett tyst, per-scenario `runtime.maxSteps`-tak
(300/600/900/2000 osv, beroende på fil) — `Simulation.step()` returnerade `null` utan
tydlig varning när taket nåddes, och det fanns ingen UI-kontroll för att höja det. PO
upptäckte detta som en inkonsekvent upplevelse mellan olika lärstigar/scenarier under
manuell test av FEAT-042. Uppdrag: när taket nås, visa en knapp som släpper fram fler
steg så att man kan fortsätta utforska SAMMA körning (inte en ny, återställd körning).
**Genomförande:**
`Simulation` i `sim-core.js` fick `baseMaxSteps` (scenariots eget, oförändrade tak)
skilt från `maxSteps` (det AKTIVA taket) samt `extendSteps()` (höjer `maxSteps` med
ytterligare ett `baseMaxSteps`-block, rör aldrig historik/processtillstånd — körningen
fortsätter exakt där den stannade). `reset()` återställer `maxSteps` till
`baseMaxSteps`, så "Återställ system" ger tillbaka scenariots ursprungliga tak;
"Rensa graf" gör det medvetet INTE (rör redan idag inte process-/regulatortillstånd).
Ny knapp `#btnExtendSteps` i steg-/kör-knapprad, dold tills taket nås
(`updateStepLimitUI()`, anropad efter Stega/Kör 10/Rensa graf/Återställ/
scenariobyte). Klick lägger även en markeringslinje ("Fler steg") i grafen, samma
mönster som pulsknappen. Loggtexterna vid Stega/Kör 10 uppdaterade att uttryckligen
nämna knappen när taket nås.
Ny testsvit `tests/feat-043-extend-max-steps.test.mjs` (15 kontroller). Fullständig
regression (15 testsviter) grön, DEV-/PROD-byggnation och `validate-prod.mjs`
kontrollerade — ingen DEV/PROD-skillnad, gäller alla scenarier och lärstigar lika.
**Status:** Mergad till `develop`. PO testade manuellt (`onoff-basic`, 300-stegs
maxSteps-scenario) och bekräftade att knappen fungerar som avsett. Kölagd för nästa
release — ingen egen release ännu, `main` oförändrat tills vidare.

---

### FEAT-037 — Övningsdokument "Reglerstrategier"
**Branch:** `feature/reglerstrategier` (mergad till `develop`)
**Beskrivning:**
Nytt fristående övningsdokument (`docs/exercises/ovningar-reglerstrategier.md`), samma
mönster som `ovningar-systemoptimering.md`: uppgifter i lösbladsform, inte en guidad
lärstig. Tränar *vilken reglerstrategi man väljer och varför* — regulatortyp (P/PI, med
PID:s avvägningar i Uppgift 2 Fall C), aggressivitet (Lambda-metoden), dötid,
integrerande process, windup och prioritering börvärdesföljning/störningsavvisning.
Sju uppgifter (varav en mästaruppgift, ett sammanfattande PM). Bygger enbart på
funktioner som redan fanns i webbappen.

Ett facit (`docs/exercises/facit-reglerstrategier.md`) togs fram parallellt, verifierat
mot faktisk simulering (`apps/app/sim-core.js` kört i Node via
`tests/simulation/lib/analyze.mjs`, seed=42). Verifieringen hittade och rättade flera
sakfel innan publicering: fel processförstärkning i Uppgift 2, orealistiskt kraftiga
standardpulsstorlekar (appens pulsmagnitud läggs till PER STEG, inte engångs — lätt att
missbedöma), samt att HELA facit inledningsvis använde ett löst/odokumenterat
toleransband för "insvängningstid" som gav missvisande jämförelser mellan strategier.
Facit standardiserades till ett enhetligt, dokumenterat 2 %-toleransband
(`analyze.mjs`s standardvärde) innan publicering.

PO gjorde flera manuella redigeringsomgångar (skärpte acceptanskriterier och vilka
mätvärden studenten ska notera, bytte Uppgift 1 Fall A:s exempel från "Nivåprocess" till
"Temperaturprocess" för att inte krocka med Uppgift 4:s nivå=integrerande-lektion, tog
bort kvarvarande referenser till andra övningsdokument för att göra dokumentet
självständigt). CC byggde ut Uppgift 2 med en ny Fall C (Td-svep, simulatorverifierad:
lagom Td≈1 eliminerar överslängen och mer än halverar insvängningstiden med försumbar
bruskostnad, medan överdrivet Td gör allt sämre samtidigt) och flyttade dit
brus/D-dels-undersökningen från Uppgift 1.

Facit renskrevs slutligen helt (all historik/motivering om vad som rättades och varför
togs bort) för att matcha det färdigredigerade övningsdokumentet exakt.
**Status:** Klar, mergad till `develop`. Publicerad till `main` 2026-09-15 (se
`CHANGELOG.md`) — ren dokumentation, ingår inte i PROD-appens byggda innehåll
(`catalog.prod.json`) eftersom det är ett fristående lösblad, inte en lärstig.

---

### FEAT-041 — Reglerstrategier: uppdela i grund- och fördjupningsdokument
**Beskrivning:**
PO:s beslut efter genomläsning av de gamla Python-app-övningarna
(`ovningar-grundlaggande.md` v1.7.0, `ovningar-systemoptimering.md` v1.7.0,
`ovningar-signalstorningar.md` v1.6.1 — alla tre bekräftat Python-app-era: gamla
funktionsnamn som "Spara"/"Autopaus"/"Spärrning"/preset-knappar som inte finns i
webbappen, "amplitude"-terminologi utan medvetenhet om att pulsmagnitud läggs till
PER STEG): `ovningar-reglerstrategier.md` blir **grunddokumentet** (en bas som ger
alla studerande en känsla för samtliga sex strategiområden), och ett nytt
`ovningar-reglerstrategier-fordjupning.md` blir en **separat, svårare** fortsättning
för snabba/nyfikna studerande — inte "fler grunduppgifter", utan uppgifter med
mindre facit-styrning (process + driftkrav givet, testplan och val av mätvärden upp
till studenten själv).

**Innehållsanalys av de gamla dokumenten** visade att det mesta redan är absorberat
(grundläggande Del 1-5 → lärstigarna; systemoptimerings Lambda-avsnitt och
Masterövning → redan i reglerstrategiers Uppgift 2/Mästaruppgift 7;
signalstorningars störnings/D-avvägning → redan i Uppgift 2 Fall C). Fyra genuint
nya/djupare moment byggdes för fördjupningsdokumentet, alla simulatorverifierade:
1. **Ziegler-Nichols-metoden** (helt saknad tidigare) — Ku≈4,2, Tu≈20s på samma
   process som grund-Uppgift 2; jämförelse mot Lambda-metoden visar att ZN PI
   faktiskt slår Lambda Aggressiv på båda måtten samtidigt — en äkta,
   icke-uppenbar poäng.
2. Fullständig P/PI/PID-tabell (aggressiv + säker variant) på grunddokumentets
   integrerande process — icke-uppenbar poäng: Td hjälper INTE på den här
   processen, till skillnad från Uppgift 2 Fall C, eftersom dötiden här är liten
   relativt tidskonstanten.
3. Stegvis allt hårdare utsignalgräns, hur mycket måste man detune:a — icke-uppenbar
   poäng: detuning hjälper INTE alls mot windup — endast anti-windup gör det,
   oavsett hur hård utsignalgränsen är.
4. Kombinerad brus+puls-stresstest — icke-uppenbar poäng: den "vinnande" omtrimmade
   inställningen från Uppgift 6 har mer än dubbelt så hög bruskänslighet som
   originalinställningen — en dold kostnad som bara syns när brus och puls testas
   tillsammans.

**Övrigt PO-önskemål (genomfört):** grunddokumentets uppgifter fick ifyllningsbara
mätprotokoll-tabeller (samma stil som de gamla dokumentens tomma tabeller, avsedda
att skrivas ut och fyllas i för hand) — en tabell per uppgift/fall som redan bad om
flera uppmätta värden.

De tre gamla dokumenten flyttades till `docs/exercises/arkiv/`, var och en med en
kort not överst om varför den är arkiverad och vart innehållet absorberats.
**Status:** Klar, mergad till `develop`. PO har granskat och godkänt både
grunddokumentet och fördjupningsdokumentet (inkl. facit) i sin helhet (2026-09-16).

---

### FEAT-039 — Kort introduktionsdokument för studerande + discoverability-knapp
**Branch:** `feature/app-introduktion` (mergad till `develop`)
**Beskrivning:**
PO efterfrågade en kort, fristående text studerande kan läsa innan de öppnar appen — så
PO slipper förklara appen muntligt varje gång. Ny fil `docs/exercises/introduktion.md`:
kort syftesbeskrivning, en punktlista över vad appen kan idag, och en pekare till den
redan befintliga inbyggda lärstigen "Kom igång med PID Simulator" plus en numrerad
översikt över samtliga sju publicerade lärstigar i ordning. Omfattar **endast** appens
inbyggda innehåll — PO beslutade att fristående övningsblad (`ovningar-*.md`) inte ska
nämnas i detta dokument.

**Arkivering av Python-app-material:** `docs/exercises/README.pdf` (användarmanual för
den nedlagda Python-appen) flyttad till `docs/python-app-archive/README.pdf` (var aldrig
git-spårad).

**Discoverability löst med en permanent knapp:** "Kom igång"-lärstigen visades tidigare
bara automatiskt en gång per webbläsare. PO valde (via tre föreslagna alternativ)
"permanent knapp i appen" framför att bara förlita sig på dokumentet. Implementerat: ny
knapp `❓ Kom igång` i vänster sidebar (alltid synlig, oavsett tidigare besök), öppnar
samma välkomstruta.

**PO:s granskningsrunda hittade och lät åtgärda två saker innan merge:**
1. Välkomstrutans "Utforska fritt"-knapp gav inget synligt resultat vid klick (laddade
   ett scenario i bakgrunden men lämnade rutan kvar orörd på skärmen) — borttagen helt
   istället för att bygga en egen stängningslogik för ett flöde ingen efterfrågat.
2. **Nytt PO-beslut vid granskningen:** "Kom igång"-knappen döljs automatiskt från nivå 3
   (Signalspanare, gamification-nivåmotorns `levelIndex >= 2`) och uppåt — vid den nivån
   har man kört appen tillräckligt mycket för att introduktionen inte längre behöver vara
   framträdande. Kopplad till `gamification-ui.js`s enda centrala `render()`-funktion
   (körs vid bootstrap, varje nivåflush och progressionsåterställning), så knappen alltid
   speglar aktuell/hållen nivå utan egen polling-logik. Krävde även en `.komigang-btn[hidden]
   { display: none; }`-CSS-regel — samma mönster som redan fanns för
   `.gam-level-info[hidden]`/`.gam-level-toast[hidden]`, annars hade knappens egna
   `display: inline-flex` vunnit över `hidden`-attributet.

Båda granskningsfynden verifierade med Playwright mot en lokal server (nivå 1–2: synlig,
nivå 3–8: dold, återkommer efter "Återställ progression"; välkomstrutan visar bara
"Kom igång »" nu). Inga konsol-/sidfel.

**Status:** Klar, mergad till `develop`, släppt (se `CHANGELOG.md` för versionsnummer).

---

### FEAT-038 — Hjälplinjer 10 %/90 %/2 %-band i Mätläge
**Branch:** `feature/matlage-hjalplinjer` (mergad till `develop`)
**Beskrivning:**
Två nya togglingsbara hjälplinjer i Mätläge, samma mönster som befintlig 63 %-linje:
"Visa 10 %/90 %-linjer (stigtid)" (en gemensam kryssruta, båda linjerna hör ihop som
stigtidsdefinitionen) och "Visa 2 %-toleransband (insvängning)" (ritas som ETT BAND —
övre/undre gräns kring PV∞ — eftersom 2 % definitionsmässigt är ett toleransband, inte
en enkel tröskel som 63/10/90 %). Samtidigt gjordes samtliga hjälplinjer (63 %,
tangentlinjen, de två nya) tunnare och lätt transparenta (`lineWidth 1`,
`globalAlpha 0.6`) så de tydligt skiljer sig visuellt från PV/SP/u-kurvorna — tidigare
var tangentlinjen lika tjock som huvudkurvorna.

Verifierat med Playwright mot en lokal server (skärmdumpar, inga konsolfel) och
`tests/build-preview.test.mjs`.
**Status:** Klar, mergad till `develop`. **Produktionsaktiverad i v1.5.2**
(2026-09-14/15, PO:s beslut, se `CHANGELOG.md`).

---

### FEAT-030 — Lärstig "Störningar och robusthet"
**Branch:** `feature/storningar-robusthet` (mergad till `develop`)
**Beskrivning:**
Ny 7-stegs lärstig (`storningar-robusthet.v1`, 1 teori + 6 scenario) om mätbrus,
pulsstörning och P/PI/PID-robusthet, baserad på källmaterialet i
`docs/exercises/ovningar-signalstorningar.md`. Återanvänder befintliga
`pid-disturbance-noise.json`/`pid-pulse-rejection.json` — inga nya scenariofiler. Ny
teorimodul `disturbance-robustness.v1.json`.

Två nya, generella appfunktioner tillkom under PO:s testomgång:
- **Markeringslinje i grafen** vid varje betydelsefull parameterändring (regulatorläge,
  Kp/Ti/Td, brus, SP, process) eller pulstriggning — gör flera faser urskiljbara i en
  kontinuerlig graf istället för att kräva Rensa graf/Återställ mitt i en jämförelse.
- **`continueFromPreviousStep`** (explicit steg-fält, samma mönster som `standalone`/
  `ENV_CONFIG.*`): låter en lärstig fortsätta samma körning/graf över flera steg istället
  för att automatiskt ladda om scenariot vid varje stegbyte. Använt i steg 3–4 för att ge
  en sammanhängande P→P+brus→PI→PID-jämförelse med tre fristående checkpoints bevarade.

Verifierat med Playwright genom hela lärstigsnavigeringen och den fullständiga
Node-testsviten (`validate-content.mjs`, `validate-prod.mjs`, `build-preview.test.mjs`,
`simulation/analyze.test.mjs`) — samtliga gröna. PO har testat och godkänt branchen.
**Status:** Klar, mergad till `develop`. **Produktionsaktiverad i v1.5.0**
(2026-09-10, PO:s beslut) — sjunde lärstigen i `catalog.prod.json`, se
RELEASE-v1.5.0-posten.

---

### FEAT-029 — Crosshair horisontell linje
**Branch:** `feature/crosshair-hline`
**Status:** Klar

---

### FEAT-028 — Flerkapacitiv (högre ordningens) självreglerande process
**Branch:** `feature/multi-capacity`
**Beskrivning:**
Nuvarande `self_regulating`-modell är enkapacitiv (FOPDT). En flerkapacitiv process (N kaskadkopplade element) ger ett S-format stegsvar med tydlig inflexionspunkt — mer likt industriella processer och bättre testfall för tangentmetoden.
Modell: N element med tidskonstant T/N vardera. Nytt fält `"order": N` i process-config. Nytt `processType`-alternativ i dropdown. Nytt identifieringsscenario (order=2).
**Status:** Klar

---

### FEAT-027 — Zoom i grafen för exaktare mätavläsning
**Branch:** `feature/graph-zoom`
**Beskrivning:**
Möjlighet att zooma in i PV-grafen för att avläsa exakta värden med crosshairen i mätläge. Scrollhjul + modifieringstangent (Ctrl eller Shift) zoomar horisontellt (t-axeln). Touchpad: tvåfingerspinch-scroll. Zoom-nivå visas och kan nollställas med dubbelklick eller en "Återställ zoom"-knapp.
**Status:** Klar

---

### FEAT-025 — Onboarding: välkomstpanel + intro-lärstig för nya användare
**Branch:** `feature/onboarding`
**Beskrivning:**
Vid första besök visas en välkomstpanel i vänster sidebar med appbeskrivning och knappar "Börja här →" (laddar intro-lärstigen) och "Utforska fritt". Tillståndet sparas i localStorage. Intro-lärstigen "Kom igång med PID Simulator" guidar igenom appens funktioner i 5 steg utan checkpoints: översikt → scenarier → simulering → parametrar/hjälp → lärstigar.
**Status:** Klar

---

### FEAT-024 — Lärstig: Lambda-metoden för självreglerande system
**Branch:** `feature/larstig-lambda`
**Beskrivning:**
5-stegs lärstig för Lambda-metoden (modellbaserad PI-inställning). Kp = T/(K×(λ+L)), Ti = T. Inkluderar ny teorifil, 4 scenarion (open-loop, måttlig/aggressiv/konservativ λ) och lärstigs-JSON.
**Status:** Klar

---

### FEAT-023 — Flytta hjälptexter till redigerbar JSON-fil
**Branch:** `feature/help-json`
**Beskrivning:**
HELP_CONTENT är hårdkodat i app.js (89 rader, 23 poster). Flytta till `content/help.json` och ladda via `fetch()` i `loadCatalog()` — samma mönster som scenarier och lärstigar. Hjälptexterna blir då redigerbara utan att röra app.js.
**Status:** Klar

---

### FEAT-021 — Visa/dölj proportionalband som streckad linje i grafen
**Branch:** `feature/proportionalband`
**Beskrivning:**
Proportionalbandet (PB = 100/Kp %) definierar det PV-intervall som ger full utslagsvariation i regulatorn. Skuggat lila område SP-PB → SP, streckad linje vid SP-PB (u=100%).
**Status:** Klar

---

### FEAT-002 — Varning när SP är ouppnåeligt (SP > y_max)
**Branch:** `feature/sp-uppnabarhet-varning`
**Beskrivning:**
En självreglerande process har ett fysikaliskt tak: y_max = normalValue + K × u_max. Om SP sätts över y_max integrerar PID:en upp u till 100 % men y fastnar — studenter tror att PID:en är felinställd. Behöver en varning i statusraden, t.ex. "⚠ SP ouppnåeligt (y_max=50.0)".
**Status:** Klar

---

### FEAT-020 — Flytta steg-knappar nedanför parametergrupperna
**Status:** Klar

---

### FEAT-019 — Flytta Trigga puls-knappen till Störningar-gruppen
**Status:** Klar

---

### FEAT-018 — Logiska parametergrupper med collapse
**Status:** Klar

---

### FEAT-017 — Versionsinformation i GUI
**Status:** Klar

---

### FEAT-001 — Sidebar för scenario/lärstig-väljare
**Status:** Klar

---

### FEAT-003 — Lärstig: "Processens begränsningar"
**Status:** Klar

---

### FEAT-004 — Steg "Svag process" — byt till PI-scenario
**Status:** Klar

## Webbapp (`apps/app/`) — större uppdrag, releaser och beslut

Sammanhängande uppdragskedjor (PED-003-serien, PROD/DOCS/HOTFIX/RELEASE-poster,
GAM-serien) flyttade hit i sin helhet 2026-09-18 efter granskning mot faktisk
git-historik — samtliga bekräftat mergade/publicerade. Ordnade kronologiskt.

---

### BESLUT-002 — Ingen vidare utveckling av Python-appen, allt fokus på webbappen
**Prioritet:** Hög
**Beskrivning:**
Produktbeslut 2026-08-21: `main.py` (tkinter-appen) läggs ner till förmån för webbappen (`apps/app/`). Webbkärnan (`packages/sim-core`) har redan uppnått funktionsparitet enligt `docs/architecture/python-parity-matrix.md`, och Python-appen har inte utvecklats sedan 2025-09-25. Ingen CI/deploy-koppling finns till Python-filerna.
**Genomförande:**
Nuvarande tillstånd taggat `archive/python-app-v1.7.0` för framtida referens. `main.py`, `requirements.txt`, `docs/python-app/` samt Python-specifika release notes (`docs/releases/CHANGELOG.md`, `release-notes-v1.5.0–v1.7.0.md`) borttagna från arbetsträdet i `feature/arkivera-python-app`. Öppna Python-features (FEAT-006, 008, 012–016) och -buggar (2026-003, 2026-005) stängda utan implementation.
**Status:** Beslutad och genomförd — se `todo-done.md` och `buglog-done.md`

---

### PED-003 — Omstrukturera lärstigar enligt kursens progression
**Branch:** `feature/PED-003-learning-path-progression`
**Prioritet:** Hög
**Beskrivning:**
Uppdrag från PO/PM (Per Manholm / Microsoft Copilot) att omstrukturera lärstigarna enligt
kursprogressionen i "Industriell Mät- och Reglerteknik", vecka 35–40, baserat på
`docs/reports/PED-001_NULAGE.md` och `docs/planning/PED-002_PROGRESSIONSKARTLAGGNING.md`.
**Genomförande:**
`grundlaggande.v1` delad i `oppen-slinga-onoff-p.v1` (v35) och `pi-pid.v1` (v36).
`windup.v1` delad i `windup-antiwindup.v1` (v36) och `integrerande-process-niva.v1` (v37).
`stegsvar-identifiering.v1` utökad med steg 8 (`second-order-identification`). `catalog.json`
omsorterad enligt kursprogressionen, version bumpad till v1.4.0. Nytt valideringsskript
`tests/validate-content.mjs`. Se PED-003-sammanfattningen i PR/commit-historik för fullständig
detaljlista över skapade/ändrade filer, föräldralösa filer och risker.
**Status:** Mergad till `develop` och testpublicerad (PED-003-TESTDEPLOY, 2026-08-21).
Uppföljt av PED-003A–E; de utbrutna lärstigarna `oppen-slinga-onoff-p.v1` och
`pi-pid.v1` publicerades slutligen i `RELEASE-v1.3.0`.

---

### PED-003A — Pedagogiska korrigeringar och presentationsläge för lärstigar
**Branch:** `feature/PED-003A-presentation-and-text-fixes`
**Prioritet:** Hög
**Beskrivning:**
Uppföljningsuppdrag från PO/PM efter första pedagogiska granskningen av PED-003. Två delar:
(1) ett enkelt presentationsläge ("Presentera steg") som visar aktuellt lärstigssteg i stor
overlay för projektorbruk, (2) tre pedagogiska textkorrigeringar (öppen slinga-steget, P-steget,
PI-stegets jämförelsefråga) enligt PO:s exakta kärnformuleringar.
**Genomförande:**
Ny overlay + knapp i `index.html`/`app.js` (`buildPresentHtml`, `openPresentMode`,
`closePresentMode`) — rör aldrig simulatorns state, visar aldrig checkpointens
svarsalternativ. Textkorrigeringar i `oppen-slinga-onoff-p.v1.json` (steg 2 och 5) och
`pi-pid.v1.json` (steg 1 och 2). Ingen ändring av progression, scenario- eller
teorireferenser.
**Status:** Mergad till `develop` och testpublicerad 2026-08-22. Uppföljt av PED-003B
(identifierade hinder: PB/Kp-samband, öppen slinga-steget för litet PB, P/PI-
jämförelsens tydlighet), och slutligen publicerad i `RELEASE-v1.3.0`.

---

### PED-003B — Proportionalband, P/PI-jämförelse, pedagogiska PI/PID-scenarier och återanvändbar simuleringsanalys
**Branch:** `feature/PED-003B-pb-and-pid-comparison`
**Prioritet:** Hög
**Beskrivning:**
Uppföljningsuppdrag efter PO:s andra granskning. Bygger ett återanvändbart simulerings- och
kalibreringsverktyg, använder det för en parameterstudie (inte visuell gissning), och
omstrukturerar innehållet: ny lärstig om proportionalband/Kp, P/PI-jämförelsen flyttad dit,
`pi-pid.v1` renodlad till en kontrollerad PI/PID-jämförelse.
**Genomförande:**
- `apps/app/sim-core.js` — simuleringskärnan extraherad ur `app.js` (oförändrad, ingen
  duplicering) så både appen och analysverktyget delar exakt samma kod.
- `tests/simulation/` — återanvändbart CLI + bibliotek (`runAnalysis`), 11 egna tester.
  Se `tests/simulation/README.md`.
- Fyra nya, parameterstudieverifierade scenarier: `p-pi-comparison-p/-pi`,
  `pi-pid-comparison-pi/-pid`. Ny teorimodul `proportionalband.v1.json` (PB = 100/Kp, samma
  notation som appens befintliga "Visa PB"-funktion).
- Ny lärstig `proportionalband-forstarkning.v1` (6 steg), insatt mellan
  `oppen-slinga-onoff-p.v1` och `pi-pid.v1` i `catalog.json`.
- `pi-pid.v1` innehåller inte längre P-delen — renodlad PI/PID-jämförelse.
- PB=0 kontrollerat och dokumenterat: PB är en ren visningsberäkning (`100/Kp`) i `app.js`,
  inte en del av simuleringskärnan. Kp är UI-klampat till min 0.1, så PB=0 är aldrig
  tekniskt nåbart — lärstigen beskriver gränsfallet (PB→0 vid högt Kp) istället för ett
  påstått specialfall, i linje med uppdragets instruktion.
- Fullständig parameterstudie, förkastade kandidater och framtida kalibreringskandidater i
  `docs/reports/PED-003B_PARAMETERSTUDIE.md`.
**Status:** Mergad till `develop` och testpublicerad 2026-08-22. PO:s tredje granskning gav
godkänt för presentationsläge och PI/PID-lärstig, med två avgränsade uppföljningskrav (PB:s
referensområde, PID-hjälpens D-term) — se PED-003C.

---

### PED-003C — Förtydliga PB:s referensområde och PID-regulatorns D-del
**Branch:** `feature/PED-003C-pb-and-pid-help`
**Prioritet:** Hög
**Beskrivning:**
Uppföljningsuppdrag efter PO:s tredje granskning. Rent förtydligande — ingen ny funktion,
inga parameter- eller kodändringar. Två avgränsade textkorrigeringar, båda föregångna av
verifiering mot `apps/app/sim-core.js` och samtliga scenariofiler.
**Genomförande:**
- Verifierat: alla 23 scenarier använder `measurementRange` och `outputLimits` {0,100} — PV,
  SP och u är genomgående normaliserade 0–100 % i praktiken (om än inte schema-tvingat).
  `PB = 100/Kp` är dimensionsmässigt korrekt givet detta. `proportionalband.v1.json`
  kompletterad med referensområdet och ett konkret exempel; PB=100/Kp-formeln var redan
  korrekt och är oförändrad.
- Verifierat i `sim-core.js`: D-termen beräknas som `-Kp×Td×(dPV/dt)` — derivata på PV, INTE
  på reglerfelet (derivative-on-measurement, undviker derivatakick vid SP-ändringar).
  `help.json`s `mode`-post kompletterad med denna exakta formel och en upplysning om att D
  beräknas på PV. Den redan korrekta `td`-hjälptexten var oförändrad.
- "Bäst prestanda men känslig för brus" ersatt med en neutral formulering i linje med
  `pi-pid.v1`s pedagogiska poäng (PID inte alltid bättre än PI).
- `APP_VERSION` 1.2→1.3 och content-version 1.5.0→1.5.1 (användarönskemål utöver PM:s
  uppdrag, för att synas i UI:t).
- Presentationsläge, scenarioparametrar, jämförelsescenarier och progression rörda inte.
  Verifierat att scenarioresultat är byte-identiska med PED-003B.
**Status:** Mergad till `develop` och testpublicerad 2026-08-23. Inga stoppvillkor
triggades — ingen avvikelse hittades mellan specifikation, teori och kod. Följdes av
bugg 2026-012 (PB/SP/hysteresband uppdaterades inte utan steg, upptäckt av PO under
granskning av just denna lärstig) — se `buglog-done.md`.

---

### PED-003D — Enhetlig PV-notation, mätbara jämförelser och rensning av intern analysinformation
**Branch:** `feature/PED-003D-pv-measurement-and-instructions`
**Prioritet:** Hög
**Beskrivning:**
Uppföljningsuppdrag efter PO:s Test 1–3. Tre huvuddelar: (1) ta bort hänvisningar till
parameterstudien från appens instruktioner, (2) enhetlig PV-notation i allt
användarsynligt innehåll (tidigare "y"), (3) förtydliga jämförelseförsöken i
"Processens begränsningar" till tydliga försök 1/försök 2-par, med stöd av knappen
"Mät K/T/L". Test 4 (checkpoints) var pausat i väntan på denna kollation.
**Genomförande:**
- Statusraden visar nu `SP=...`, `PV=...` (ej `y=`) i ordningen steg/t/SP/PV/e/u/P/I/D.
  SP läses från samma historikindex som PV/e för konsistens.
- **Viktigt verifierat fynd:** `e` stämmer inte exakt med `SP−PV` under aktiva
  transienter (uppmätt diff 2.008 vid start → 0.014 vid steg 100 → 0.000 vid sann
  steady-state, för samma scenario). Orsak: `ctrl.error` i `sim-core.js` beräknas mot
  PV *före* processens uppdatering det steget, sparas i historiken tillsammans med PV
  *efter* uppdateringen — ett inbyggt ett-stegs mät→beräkna→agera-mönster, likt ett
  verkligt diskret reglersystem. Förväntat och korrekt, inte en bugg. Rörde inte
  beräkningen av `e` (i linje med uppdraget). Avvikelsen är exakt noll vid den
  steady-state lärstigarna faktiskt ber studenten läsa av.
- `y` → `PV` (och `dy/dt` → `dPV/dt`) i `help.json`, tre teorimoduler, samt de aktiva
  lärstigarna `integrerande-process-niva.v1` och `windup-antiwindup.v1`. De föräldralösa
  `grundlaggande.v1.json`/`windup.v1.json` innehåller fortfarande `y` men laddas aldrig
  (inte i `catalog.json`) — lämnade orörda, rapporterade.
- Parameterstudiehänvisning borttagen ur `pi-pid.v1`s instruktion.
- `processbegransningar.v1` omstrukturerad: 3→5 steg (1 teori + 2+2 scenario), båda
  jämförelserna (K=1.3 vs K=0.5, L=0 vs L=5) nu uttryckliga försök 1/försök 2-par,
  verifierade med `tests/simulation/`. Dötidsresultatet blev måttligt (mätbar men
  begränsad översläng, ingen oscillation) — texten skriven därefter, undviker
  "destabiliserar".
- "Mät K/T/L" tillagd i `processbegransningar.v1` (båda jämförelsernas första försök)
  och `pi-pid.v1` (båda försöken). Övriga kandidater inventerade, ej ändrade — se
  leveransrapport.
- Kollationsrapport för samtliga 12 checkpoints i de tre lärstigarna:
  `docs/reports/PED-003D_TESTFRAGOR.md`.
**Status:** Mergad till `develop` och testpublicerad 2026-08-23. Inga formella
stoppvillkor utlöstes, men ett verifieringsfynd (e vs SP−PV under transienter)
redovisades tydligt för PO/PM.

---

### PED-003E — Tydligare dötidsjämförelse och förenklad statusrad
**Branch:** `feature/PED-003E-deadtime-and-status-format`
**Prioritet:** Hög
**Beskrivning:**
Uppföljningsuppdrag efter PO:s granskning av dötidsförsöket och statusraden. Två
avgränsade fixar: starkare dötidskontrast (PO:s hypotes K=1,5/Kp=1,5 verifierad) och
statusraden begränsad till en decimal.
**Genomförande:**
- PO:s hypotes verifierad med `tests/simulation/` över Ti=10–30: K=1.5, Kp=1.5 ger
  genomgående L=0 → obetydlig översläng, L=5 → tydlig översläng. Vald konfiguration
  (Ti=20, 80 steg): L=0 ger 0.3 % översläng (i praktiken monotont), L=5 ger 9.4 % —
  en klar förbättring mot PED-003D:s ursprungliga ~0 % / ~1 %.
- `pi-step-self-regulating.json` (K=1.3) används fortsatt av lärstigens egna "Svag
  process"-steg — kunde inte ändras utan att påverka den redan godkända
  jämförelsen. Nytt dedikerat scenario `pi-deadtime-comparison.json` skapat istället
  (K=1.5, Kp=1.5, Ti=20, L=0 startvärde, SP=60), registrerat i `catalog.json`
  (content-version v1.5.2→v1.5.3).
- `processbegransningar.v1`s två dötidssteg omskrivna för det nya scenariot och den
  tydligare skillnaden. Checkpointen i steg 5 omskriven i linje med det starkare
  resultatet — se tillägg i `docs/reports/PED-003D_TESTFRAGOR.md`.
- Statusraden: ny `fmt1()`-hjälpfunktion, en decimal för t/SP/PV/e/u/P/I/D (steg
  fortsatt heltal), `-0.0` särhanterat till `0.0`. Ren visningsformatering —
  verifierat att underliggande värden, historik och analysverktygets precision är
  oförändrade (regressionstest: pi-pid-comparison-pid ger samma tal som innan, nu
  bara med färre decimaler).
- Det kända e/SP−PV-tidsförhållandet från PED-003D är oförändrat och odolt — kod-
  kommentaren utökad för att förtydliga att decimalavrundningen inte döljer det.
**Status:** Mergad till `develop` och publicerad (ingick i `RELEASE-v1.3.0`). Inga
stoppvillkor triggades — K=1.5/Kp=1.5 gav precis den skillnad PO förutspådde.
(Statusfältet angav tidigare felaktigt "implementerad i feature-branchen" —
rättat vid arkivering till denna fil; branchen mergades och publicerades som
del av `develop` innan `RELEASE-v1.3.0`.)

---

### PROD-001A — Publiceringsunderlag för första undervisningsreleasen
**Branch:** `feature/PROD-001A-publication-inventory`
**Prioritet:** Hög
**Beskrivning:**
Uppdrag från PO/PM att ta fram ett fullständigt, rent analytiskt beslutsunderlag inför
publiceringsbeslut för lärstigar, scenarier, teorimoduler och funktioner — ingen
implementation.
**Genomförande:**
`docs/reports/PROD-001A_PUBLICERINGSUNDERLAG.md` (11 avsnitt) och tvillingfilen
`PROD-001A_PUBLICERINGSUNDERLAG.json` (55 poster). Samtliga `poPmDecision` står som
"Ej beslutat" — CC:s klassificeringar är rekommendationer, inte beslut.
**Status:** Mergad till `develop`. PO/PM:s genomgång resulterade i PROD-001B, som
formulerade och genomförde det beslutade produktionsurvalet.

---

### HANDOFF-001 — Överlämning till nästa CC-session (datorbyte)
**Branch:** `feature/HANDOFF-001-cross-pc-handover`
**Prioritet:** Hög
**Beskrivning:**
Rent dokumentationsuppdrag inför att PO fortsätter projektet på en annan dator. CC:s
lokala sessionskontext följer inte med — en versionshanterad överlämningsfil skapas som
primär ingång för nästa CC-session.
**Genomförande:**
`docs/handoffs/HANDOFF_2026-08-23.md` — roller, Gitflow, git-status, sammanfattning av
PED-001–PED-003E och PROD-001A, redan fattade principbeslut, ej fattade beslut, kända
tekniska förhållanden, obligatorisk läsordning och startkontroll för nästa session.
**Status:** Mergad till `develop`. Nästa CC-session ska vänta på ett konkret uppdrag
från PO/PM — inget arbete påbörjas automatiskt.

---

### PROD-001B — DEV/PROD-miljöprofiler och beslutat produktionsurval
**Branch:** `feature/PROD-001B-environment-profiles`
**Prioritet:** Hög
**Beskrivning:**
Implementationsuppdrag från PO/PM efter PROD-001A. Inför en DEV- och en PROD-profil i
samma kodbas, styrda av konfiguration och katalogurval — inga permanenta manuella
kodskillnader mellan branches. PO/PM:s beslutade första produktionsurval: 5 lärstigar
(kom-igång, oppen-slinga-onoff-p, proportionalband-forstarkning, pi-pid,
processbegransningar); windup-antiwindup, integrerande-process-niva,
stegsvar-identifiering och lambda-metoden döljs tills vidare (kvar i DEV).
**Genomförande:**
- `apps/app/env.js` (aktiv, DEV) / `env.prod.js` (mall) — `ENV_CONFIG`: environment,
  showTestMode, showScore, showExperimentalContent, catalogFile. Laddas som separat
  `<script>` före `app.js`. Ingen URL-parameter, inget tangentbord och ingen dold knapp
  kan byta profil — verifierat i webbläsarkonsol och via manipulerad URL.
- `content/catalog.prod.json` — allowlist med de 5 godkända lärstigarna, deras 11
  beroendescenarier och 4 teorimoduler. Scenario-fältet `standalone` styr om ett
  beroendescenario syns i den fristående väljaren (10 av 11 gör det —
  `pi-deadtime-comparison` är CC:s enda avsteg, dolt pga. dess egen
  återanvändningsvarning; se leveransrapporten).
- `app.js`: `loadCatalog()` läser `ENV_CONFIG.catalogFile`; `setTestMode(true)` är ett
  no-op om `showTestMode` är false; `updateScoreDisplay()` döljer poängraden ovillkorat
  om `showScore` är false; ny `applyEnvironmentUI()` döljer Guidat/Test-togglen och
  styr DEV-badgen (`#envBadge`).
- `tests/build-preview.mjs` — bygger `dist/dev/` och `dist/prod/` (ren filkopiering,
  inget byggsystem) för lokal förhandsvisning med valfri statisk server.
- `tests/validate-content.mjs` tar nu valfri katalogfil som argument.
  `tests/validate-prod.mjs` (ny): exakt de 5 beslutade lärstigarna i rätt ordning, inga
  dolda/experimentella läcker in, alla beroenden finns, Test-läge/poäng avstängda.
- `docs/development/ENVIRONMENTS.md` — fullständig dokumentation av profilerna.
- Verifierat med Playwright mot lokala DEV- och PROD-förhandsvisningar: samtliga 9
  DEV-lärstigar och alla 5 PROD-lärstigar går att stega igenom utan konsolfel eller
  nätverksfel; Test-läge kan inte tvingas fram i PROD ens via direkt konsolanrop.
**Status:** Mergad till `develop`. PO/PM kontrollerade och godkände DEV- och
PROD-förhandsvisningen — se RELEASE-v1.3.0, som publicerade detta produktionsurval.

---

### RELEASE-v1.3.0 — Första stabila undervisningsversionen publicerad
**Branch:** `release/v1.3.0` (raderad efter lyckad release, se genomförande)
**Prioritet:** Hög
**Beskrivning:**
Uppdrag från PO/PM att publicera v1.3.0 enligt Gitflow: hela `develop` (inklusive
PROD-001A/B) till `release/v1.3.0`, mergad till `main`, taggad, GitHub Pages omställd att
publicera uteslutande PROD-profilen från `main`, mergad tillbaka till `develop`. Ingen
selektiv merge eller cherry-pick — main och develop delar samma källkod, skillnaden är
enbart miljöprofil och produktionsurval.
**Genomförande:**
- Förkontroll: `develop`/`origin/develop` matchade (`26eeb7e`), `main` var strikt bakom
  utan unikt innehåll, arbetskatalogen ren, inga stashar/opushade brancher.
- `apps/app/app.js`: `APP_VERSION` → `1.3.0` (visas "v1.3.0" i UI). Content-version
  (`catalog.json`/`catalog.prod.json`, `v1.5.3`/`v1.5.3-prod`) oförändrad — inget innehåll
  ändrat i releasen.
- Ny `CHANGELOG.md` (repo-rot) med användarinriktade releaseanteckningar för v1.3.0.
- Nytt `.github/workflows/ci.yml`: DEV-/PROD-/allowlist-validering, simuleringsanalys,
  DEV- och PROD-byggning på push till `develop`/`feature/**`/`release/**` och PR mot
  `develop`/`main`. Publicerar aldrig Pages.
- `.github/workflows/deploy-pid-simulator.yml`: triggar nu **endast** på push till `main`
  (tidigare `develop`, tillfälligt). Kör PROD-validering och simuleringsanalys, bygger med
  `node tests/build-preview.mjs prod`, publicerar `dist/prod/` (aldrig `apps/app/` direkt
  eller `dist/dev/`). Concurrency-grupp `pages` tillagd.
- `release/v1.3.0` innehöll hela `develop` som linjär förfader (`git merge-base
  --is-ancestor` bekräftat) — enda tillägget var version/changelog/workflows, verifierat
  via `git diff origin/develop release/v1.3.0 --stat`.
- Mergad till `main` med synlig merge-commit `17564e1` ("release: PID Simulator v1.3.0"),
  pushad. `main` verifierat filträds-identiskt med `release/v1.3.0`.
- Taggad `v1.3.0` (annoterad, pekar på `17564e1`), pushad.
- GitHub Actions kördes automatiskt på push till `main`: samtliga steg i den nya
  deploy-workflowen lyckades (PROD-validering, allowlist-validering, simuleringsanalys,
  PROD-byggning, Pages-publicering).
- Live smoke-test mot `https://peman68.github.io/PID-simulator/`: appversion v1.3.0, exakt
  fem lärstigar i rätt ordning, ingen DEV-märkning, Test-läge/poäng dolda och kan inte
  tvingas fram (varken via konsolanrop eller URL-parametrar), presentationsläge och Mät
  K/T/L fungerar, `pi-deadtime-comparison.json` bekräftat hämtad via nätverket endast när
  lärstigen laddar den (inte i scenarioväljaren), 0 konsolfel, 0 nätverksfel.
- Mergad tillbaka till `develop` (`0ee7b55`), pushad. Efter återmerge: DEV visar
  fortfarande 9 lärstigar/Test-läge/poäng/DEV-märkning, PROD-byggning från `develop` visar
  5/inget Test-läge/ingen poäng/ingen DEV-märkning — identiskt med `main`.
- `release/v1.3.0` raderad lokalt och på origin efter att samtliga steg verifierats.
- Verifierat i Actions-loggen: push till `develop` (`0ee7b55`) triggade endast CI, ingen
  Pages-deploy — den nya deploy-workflowen på `develop` kan strukturellt inte längre
  publicera Pages.
- GitHub Release kunde inte skapas automatiskt (ingen `gh`-CLI eller annan autentiserad
  GitHub-åtkomst på arbetsmaskinen) — PO gav manuell instruktion i leveransrapporten.
  Branschskydd på `main` kunde inte läsas utan autentisering (rulesets-listan var tom,
  klassisk branch protection-status okänd) — rekommenderade regler rapporterade, inget
  aktiverat.
**Status:** Publicerad. `main` = stabil undervisningsversion v1.3.0, `develop` = fortsatt
utveckling med samma kodbas. Se `docs/development/ENVIRONMENTS.md` för
STEG 1–5-livscykeln (feature → tekniskt klar → produktionsgodkänd → release → publicerad).

---

### DOCS-001 — Revidera publik dokumentation efter release v1.3.0
**Branch:** `feature/DOCS-001-public-documentation`
**Prioritet:** Medel
**Beskrivning:**
Uppdrag från PO/PM att revidera repositoryts publika dokumentation efter RELEASE-v1.3.0 —
README.md var kraftigt föråldrat och beskrev varken DEV/PROD-profilerna eller det
publicerade produktionsurvalet. Ren dokumentationsrevision, ingen appkod eller
produktionskonfiguration ändrad.
**Genomförande:**
- `README.md` omskrivet i sin helhet: officiell version/URL, PROD-funktionslista och de
  fem publicerade lärstigarna i rätt ordning, DEV/PROD-tabell, verifierade lokala
  bygg-/testkommandon, Gitflow med produktionsgodkännande-regeln, projektstatus,
  licensstatus.
- `apps/app/README.md` omskrivet — beskrev tidigare en helt annan, övergiven arkitektur
  ("helt offline", "ingen fetch") som direkt motsade hur appen faktiskt fungerar och som
  skeppades rakt in i den publicerade PROD-artifakten.
- `docs/development/ENVIRONMENTS.md` kompletterad med avsnitt om repositoryts synlighet.
- Ny **BESLUT-003** (licensfråga, öppen punkt för PO — projektet saknar licensfil).
- Fullständig säkerhets-/integritetsgenomgång av hela det versionshanterade filträdet:
  0 hemligheter/tokens/nycklar, inga tredjepartspersonuppgifter. Två låggradiga fynd
  rapporterade (ett lokalt Windows-användarnamn i `.claude/settings.json`, PO:s eget
  namn/jobbmejl i en commits författaruppgift) — ingen åtgärd krävd.
- **Viktigt, ej åtgärdat fynd:** PROD-artifakten (`dist/prod/`, byggd med
  `tests/build-preview.mjs`) innehåller fysiskt samtliga DEV-innehållsfiler — inklusive de
  fyra dolda lärstigarnas checkpoint-facit — eftersom byggskriptet kopierar hela
  `apps/app/` utan att filtrera mot `catalog.prod.json`s allowlist. Filerna visas aldrig i
  UI och hämtas aldrig av den körande appen, men är direkt nåbara för den som känner till
  URL:en. Detta är ett bygg-/produktfel upptäckt genom dokumentationsgranskningen, inte
  ett dokumentationsfel — rättades därför inte inom DOCS-001, i linje med uppdragets
  uttryckliga avgränsning. Se `docs/reports/DOCS-001_DOKUMENTATIONSREVISION.md` för
  fullständig beskrivning och rekommenderad åtgärd (ett litet, avgränsat tekniskt
  uppdrag som filtrerar byggstegets filkopiering).
- Fullständig rapport: `docs/reports/DOCS-001_DOKUMENTATIONSREVISION.md`.
**Status:** Publicerad till `main` i **RELEASE-v1.4.0**. Det tidigare "viktiga, ej
åtgärdade fyndet" (PROD-artifakten innehöll fysiskt hela DEV-innehållet) åtgärdades i
**HOTFIX-v1.3.1**. PO/PM beslutade att låta README-revisionen följa med i samma release
som produktionsaktiveringen av Windup och anti-windup, istället för en separat
dokumentationsrelease.

---

### HOTFIX-v1.3.1 — Filtrera PROD-artifakten enligt produktionskatalogens allowlist
**Branch:** `hotfix/v1.3.1-prod-artifact-filtering` (raderad efter lyckad release)
**Prioritet:** Hög — pedagogisk exponeringsrisk inför undervisningen
**Beskrivning:**
PM-beslutad hotfix på det fynd DOCS-001 rapporterade men uttryckligen inte fick rätta:
`tests/build-preview.mjs` kopierade hela `apps/app/` till PROD-artifakten istället för att
filtrera mot `catalog.prod.json`. UI:t visade alltid rätt (bara fem lärstigar), men fyra
dolda lärstigars checkpoint-facit, oanvända/experimentella scenarier och hela DEV-katalogen
låg fysiskt hämtningsbara på den publicerade webbplatsen för den som kände till URL:en.
Ingen säkerhets- eller personuppgiftsincident — klassad som pedagogisk exponeringsrisk.
**Genomförande:**
- Ny `tests/lib/prod-content-set.mjs`: härleder PROD:s tillåtna innehållsfiler genom att
  faktiskt läsa varje publicerad lärstigs `steps[]` och slå upp teori-/scenarioreferenserna
  mot `catalog.prod.json` — inte en hårdkodad lista, inte katalogens `theory[]`/
  `scenarios[]` rakt av. Fristående scenarier (`standalone !== false`) tas alltid med. Ett
  lärsteg som refererar något som saknas ger ett tydligt byggfel istället för att tyst
  hoppas över.
- Ny `tests/lib/build-prod.mjs` (testbar kärna) och omskrivet `tests/build-preview.mjs`
  (tunn CLI). DEV-byggningen oförändrad — fortsatt en ren kopia av `apps/app/`.
- `tests/validate-prod.mjs` utökad: kontrollerar nu även den faktiskt byggda
  `dist/prod/`-artifakten (kräver att `build-preview.mjs prod` körts först) — inga
  otillåtna toppnivåkataloger, ingen DEV-katalog, exakt de härledda filerna i
  exercises/theory/scenarios, `pi-deadtime-comparison` finns men är inte fristående,
  samtliga filer giltig JSON.
- Ny `tests/build-preview.test.mjs`: 10 tester mot syntetiska content-fixturer i
  `os.tmpdir()` (rör aldrig `apps/app/content/`) — täcker bl.a. att en dold lärstigs
  checkpoint-facit inte finns någonstans i den byggda artifakten, och att en gammal fil
  från en tidigare byggning rensas bort.
- `.github/workflows/ci.yml` och `deploy-pid-simulator.yml`: byggordningen ändrad till
  bygg → validera (tidigare validera → bygg), eftersom valideringen nu kontrollerar den
  byggda artifakten.
- `APP_VERSION` → `1.3.1`. Content-version oförändrad (inget lärstigs-/scenario-/
  teoriinnehåll ändrat, bara vilka filer som byggs in).
- Verifierat live på https://peman68.github.io/PID-simulator/ efter deployment: samtliga
  tidigare hämtningsbara dolda/föräldralösa/experimentella filer och DEV-katalogen svarar
  nu 404; alla fem publicerade lärstigars beroenden (inkl. `pi-deadtime-comparison`, som
  fortsatt laddas via lärstigen men inte visas fristående) svarar 200; 0 konsolfel,
  0 nätverksfel; DEV oförändrat (9 lärstigar, Test-läge, poäng, DEV-märkning).
- Mergad till `main` (`3cc26cc`), taggad `v1.3.1`, mergad tillbaka till `develop`
  (`70e2f36`, en konflikt i `docs/development/ENVIRONMENTS.md` löst manuellt utan att
  tappa DOCS-001:s tillägg).
**Status:** Publicerad. `main` = v1.3.1. Se `docs/development/ENVIRONMENTS.md` för
uppdaterad byggdokumentation.

---

### PROD-enable-windup-antiwindup — Produktionsaktivera Windup och anti-windup
**Branch:** `feature/PROD-enable-windup-antiwindup` (raderad efter merge)
**Prioritet:** Medel
**Beskrivning:**
PO/PM-beslut efter HOTFIX-v1.3.1: lärstigen Windup och anti-windup är pedagogiskt
granskad och godkänd för undervisningsversionen. Placeras sist, efter Processens
begränsningar.
**Genomförande:**
`catalog.prod.json` utökad med `windup-antiwindup.v1` (sjätte lärstigen) samt dess
beroenden — teori `integrator-windup`, scenario `pi-windup-demo` (`standalone: true`,
inget känt återanvändningsproblem, passar den fristående väljaren). `EXPECTED_LEARNING_
PATHS` i `tests/validate-prod.mjs` utökad till sex lärstigar; en kvarglömd hårdkodad
`!== 5`-kontroll rättad till att jämföra mot facitlistans längd. Lärstigens eget
innehåll (steg, checkpoints) oförändrat — verifierat med `git diff`. Beroenden härledda
automatiskt av `tests/lib/prod-content-set.mjs`, inga andra filer påverkade.
**Status:** Mergad till `develop`, publicerad till `main` i RELEASE-v1.4.0.

---

### RELEASE-v1.4.0 — Windup och anti-windup samt reviderad dokumentation publicerade
**Branch:** `release/v1.4.0` (raderad efter lyckad release)
**Prioritet:** Hög
**Beskrivning:**
PM-beslutad ordinarie release enligt Gitflow: hela `develop` (DOCS-001 +
HOTFIX-v1.3.1:s artifaktfiltrering + produktionsaktiverad Windup/anti-windup) till
`release/v1.4.0`, mergad till `main`, taggad, mergad tillbaka till `develop`. Version
v1.4.0 (inte en patch) eftersom en ny lärstig blir synlig för användarna — en ny
produktfunktion, inte bara en felrättning.
**Genomförande:**
- Förkontroll: `develop`/`origin/develop` matchade (`fcaca0c`), `main` innehöll `v1.3.1`
  utan oidentifierade tillägg, arbetskatalogen ren.
- `APP_VERSION` → `1.4.0`. Content-version oförändrad (inget innehåll ändrat i sig, bara
  produktionsurvalet).
- `CHANGELOG.md` uppdaterad: sex publicerade lärstigar, README-revisionen nämnd.
- `release/v1.4.0` verifierad som en linjär fortsättning av `develop` (`git merge-base
  --is-ancestor`) — enda tillägget var version/changelog, verifierat via `git diff`.
- Fullständig testsvit grön (DEV-/PROD-validering, allowlist-validering på byggd
  artifakt, simuleringsanalys, artifaktfiltreringstester) samt lokal Playwright-
  regression: 6 lärstigar i PROD, Windup-lärstigen genomförbar felfritt, DEV oförändrat.
- Mergad till `main` (`2e13295`, "release: PID Simulator v1.4.0"), pushad. `main`
  verifierat filträds-identiskt med `release/v1.4.0`.
- Taggad `v1.4.0` → `2e13295`, pushad.
- GitHub Actions kördes automatiskt på push till `main` och lyckades (PROD-validering →
  simuleringsanalys → PROD-byggning → allowlist-validering på byggd artifakt → Pages).
- Live smoke-test mot `https://peman68.github.io/PID-simulator/`: appversion v1.4.0, sex
  lärstigar i rätt ordning, Windup-lärstigens filer (`windup-antiwindup.v1.json`,
  `integrator-windup.v1.json`, `pi-windup-demo.json`) svarar 200, övriga tre fortsatt
  dolda lärstigar och DEV-katalogen svarar fortsatt 404, presentationsläge och Mät K/T/L
  fungerar, 0 konsolfel, 0 nätverksfel.
- Mergad tillbaka till `develop` (`a4c147a`) utan konflikter (release-branchen innehöll
  bara version/changelog ovanpå det som redan låg i `develop`). `main` och `develop`
  filträds-identiska efter återmergen — DOCS-001 ligger nu på båda.
- `release/v1.4.0` raderad lokalt och på origin efter att samtliga steg verifierats.
**Status:** Publicerad. `main` = stabil undervisningsversion v1.4.0, `develop` =
fortsatt utveckling med samma kodbas och samma filträd som `main`.

---

### HOTFIX-v1.4.1 — Dölj mätverktygets facit-funktioner (tangentlinje och Visa facit) i PROD
**Branch:** `hotfix/v1.4.1-hide-tangent-facit-in-prod`
**Prioritet:** Hög
**Beskrivning:**
PM-beslutat, avgränsat hotfix-uppdrag. PO har testat mätverktyget och beslutat:
marköravläsningen vid grafmarkören fungerar bra och behålls, Mät K/T/L behålls, men
tangentlinjens facit (den geometriska Ziegler-Nichols-konstruktion som beräknar och visar
L/T direkt i grafen) fungerar inte tillräckligt bra pedagogiskt och ska döljas i PROD.
Under uppdragets förkontroll identifierades en andra, separat facit-mekanism i samma
mätpanel — "Visa facit"-knappen, som visar en tabell med scenariots faktiska K/T/L-värden
rakt av. Uppdragstexten nämnde bara "tangentlinjens facit" uttryckligen; PO/PM tillfrågades
och beslutade att **båda** ska döljas i PROD.
**Genomförande:**
- Ny miljöflagga `ENV_CONFIG.showMeasurementFacit` (`true` i `apps/app/env.js`/DEV,
  `false` i `apps/app/env.prod.js`/PROD-mall).
- `applyEnvironmentUI()` i `apps/app/app.js` döljer båda kontrollerna i PROD: kryssrutans
  wrapper (`#mpTangentField`), knappens grupp (`#measureGroupFacit`) och separatorn mellan
  dem (`#measureSepFacit`) — ingen tom lucka eller trasig kontrollgrupp lämnas kvar.
- Defense-in-depth (samma idiom som `setTestMode()` redan använder för Test-läge):
  `drawChart()`s tangentlinje-block gated på `ENV_CONFIG.showMeasurementFacit` (inte bara
  kryssrutans `.checked`), och `btnFacit`-klickhanteraren har ett tidigt `return` om
  flaggan är false. Verifierat med Playwright att facitet varken ritas eller aktiveras i
  PROD ens när kryssrutan/knappen tvingas fram programmatiskt via konsolen, och att ingen
  URL-parameter eller hash har någon effekt.
- `tests/validate-prod.mjs` utökad: kontrollerar `showMeasurementFacit === false` i både
  källfilen `env.prod.js` och den byggda `dist/prod/env.js`, samt att
  `activity-prototype-core.js`/`activity-prototype.js` (GAM-002) aldrig kan hamna i
  `dist/prod` (regressionsskydd inför en framtida återmerge till `develop`).
- Ny `tests/hotfix-v1.4.1-facit-env.test.mjs`: 12 statiska regressionstester (källfiler,
  defense-in-depth-koden i `app.js`, döljbara krokar i `index.html`, byggda
  dist/dev-/dist/prod-artifakter).
- `APP_VERSION` → `1.4.1`. Ingen content-versionsändring.
- Inget annat i mätverktyget, simuleringskärnan eller GAM-002 rört. GAM-002 finns inte i
  denna branch (grenad från `main`, som aldrig haft GAM-002) — dess isolering (aldrig
  kopierad till `dist/prod`, injiceras bara i DEV) verifierades oförändrad.
**Status:** Publicerad. Mergad till `main` (taggad `v1.4.1`), live-verifierad på
https://peman68.github.io/PID-simulator/ (Playwright: appversion, lärstigsantal,
Mät K/T/L, marköravläsning, zoom, facit dolt och kan inte aktiveras vare sig via tvingad
DOM-manipulation eller URL/hash — 0 konsolfel, 0 nätverksfel), mergad tillbaka till
`develop`.

---

### GAM-001 — Komplettera gamification-analysen med aktiv interaktionstid och hjälpaktivitet
**Branch:** `feature/GAM-001-gamification-analysis` (raderad efter merge)
**Prioritet:** Låg — analys/dokumentation, ingen implementation
**Beskrivning:**
Uppföljningsuppdrag till den ännu overkommittade XP-viktningsanalysen
(`docs/planning/GAMIFICATION-XP-ANALYS.md`). Kompletterar med PO/PM:s fyra nya
principer: aktiv interaktionstid (inte bara öppettid), musrörelse som svag
aktivitetssignal (aldrig XP), hjälptextsanvändning (XP första gången per unik
hjälptext/session) och en tre-nivåmodell råhändelser → pedagogiska aktiviteter → XP.
Rent analysuppdrag — ingen appkod, ingen händelseloggning, ingen XP-visning.
**Genomförande:**
- Inventerade samtliga 23 fysiska `.help-btn`-knappar / 24 distinkta hjälptexts-ID:n i
  `apps/app/index.html`/`help.json` (inkl. att `#kHelpBtn` dynamiskt växlar mellan
  `k`/`kv`) — grundat i faktisk kod, inte äldre rapporter.
- Ny modell för aktiv tid: Page Visibility API + window focus/blur + egna
  interaktionshändelser, med 60 s som rekommenderat (ej beslutat) startvärde för
  inaktivitetsgränsen. Idle Detection API avfärdat (HTTPS-krav, permission-prompt,
  begränsat stöd) till förmån för den enklare lokala modellen.
- `pointermove`: rekommenderad strypning till högst var 5:e sekund, ingen
  koordinatlagring, ger aldrig XP — bara en aktivitetssignal som håller
  inaktivitetstimern igång.
- Föreslog en tre-nivåmodell (råhändelser → pedagogiska aktiviteter → XP) och
  analyserade vilka råhändelser som ändå kan ge direkt XP utan spamrisk
  (`help_opened` och "nytt högsta lärstegsindex" — båda har ett naturligt tak).
- Analyserade tre alternativ för aktiv tid som XP-källa (ren statistik / låg XP med tak
  / XP kräver samtidig pedagogisk aktivitet) — rekommenderar att börja med ren statistik.
- Integritetsavsnitt: inga koordinater, inget tangentinnehåll, ingen persistens, ingen
  backend, samma princip som redan gäller `pathScore` i det avstängda Test-läget.
- Föreslog avgränsad nästa-steg-prototyp (DEV-only, konsolutskrift, ingen XP-visning)
  och de konkreta frågor den ska besvara innan synlig XP byggs.
**Status:** Mergad till `develop`. Analysdokumentet är nu versionshanterat. Uppföljt av
**GAM-002** (teknisk prototyp). Pedagogisk granskning av kvarvarande DEV-lärstigar är
fortsatt högre prioriterat än att gå vidare mot synlig XP.

---

### GAM-002 — Prototyp för sessionsbaserad aktivitetsmätning
**Branch:** `feature/GAM-002-activity-prototype` (raderad efter merge)
**Prioritet:** Låg — teknisk prototyp, ingen synlig funktion
**Beskrivning:**
PO-beslutad DEV-only prototyp som mäter och sammanställer sessionsaktivitet i
webbläsarkonsolen — ingen XP visas, ingen data sparas mellan sessioner, PROD helt
opåverkat. Syfte: kontrollera att appen kan skilja meningsfullt arbete från råa klick
innan viktning, levels eller lagring beslutas. Underlag: `docs/planning/GAMIFICATION-XP-ANALYS.md`.
**Genomförande:**
- `apps/app/activity-prototype-core.js` — DOM-fri tillståndsmaskin, samma UMD-mönster
  som `sim-core.js`, testbar i Node med injicerad tid (ingen väntan på verklig tid).
  Händelsekällad tidsavräkning (`settle()`), inget `setInterval`.
- `apps/app/activity-prototype.js` — tunn DOM-koppling (Page Visibility, focus/blur,
  strypt pointermove utan koordinater, `window.__activityDispatch`,
  `window.ActivityPrototype` för DEV-konsolen).
- `app.js`: skripten injiceras dynamiskt ENDAST om `ENV_CONFIG.environment ===
  "development"` — PROD begär dem aldrig (noll extra nätverkstrafik, verifierat: 0
  träffar på `activity-prototype*` i nätverksfliken). Dubbelt skydd:
  `tests/lib/build-prod.mjs` kopierar aldrig filerna till `dist/prod/`. Tunna, guardade
  `activityDispatch()`-anrop tillagda vid befintliga knapp-/fälthändelser — ingen
  befintlig logik ändrad, simulatorn opåverkad om modulen saknas eller felar.
- 60 s inaktivitetsgräns (startvärde), pointermove strypt till 1/5s, `help_opened` med
  k/kv som separata `helpId`, 5 %-regel för distinkt konfiguration (dokumenterad
  relativ-ändring-fallback för de fält som saknar `max`-attribut: k, t, l, kp, ti, td,
  noise, pulseMag, pulseDuration), 20-stegsregel för genomfört försök, jämförelsepar,
  lärstigsprogression (bakåtnavigering ger inte falska framsteg).
- `tests/activity-prototype.test.mjs` — 39 kontroller mot kärnmodulen (motsvarar
  uppdragets 30 testpunkter), inkl. strukturella kontroller av att ingen persistens,
  nätverkstrafik eller koppling till simuleringskärnan finns. 39/39 OK.
- Verifierat i riktig webbläsarsession (Playwright, DEV): fullständig testsession
  (lärstig, navigering, hjälptexter, en- och tiostegning, två parameterändringar under
  respektive över 5 %-tröskeln, Mät K/T/L, facit, flik dold/återställd) gav en
  sammanställning som exakt matchade den utförda sessionen, 0 konsolfel, 0 nätverksfel.
- PROD-regression (Playwright): `window.ActivityPrototype`/`window.__activityDispatch`
  existerar inte, 0 nätverksanrop mot aktivitetsfilerna, appen i övrigt oförändrad (6
  lärstigar, Test/poäng/DEV-märkning dolda). DEV oförändrat i övrigt (9 lärstigar,
  Test-läge fullt fungerande).
- Ny `docs/development/GAMIFICATION-PROTOTYPE.md` — fullständig teknisk dokumentation,
  kända begränsningar och de frågor som ska utvärderas manuellt innan synlig XP byggs.
**Status:** Mergad till `develop`. Prototypen användes och kalibrerades vidare i
GAM-003A–D, och aktiverades slutligen i produktion i `RELEASE-v1.5.0`.

---

### GAM-003A — Kalibrera XP-modellen mot samtliga DEV-lärstigar
**Branch:** `feature/GAM-003A-xp-calibration`
**Prioritet:** Låg — analys/kalibrering, ingen synlig funktion
**Beskrivning:**
PM-beslutat analys-, test- och kalibreringsuppdrag. Provräknar PM:s preliminära
XP-modell (10 kategorier, 8 nivåer) mot samtliga tio aktiva DEV-lärstigar innan
GAM-003B:s synliga nivåfunktion byggs. Ingen synlig XP, badge eller nivåmätare
implementerad; ingen appkod ändrad; GAM-002:s registreringsmodell orörd.
**Genomförande:**
- Nytt återanvändbart XP-beräkningsverktyg `tests/gamification/` (`xp-model.mjs`,
  `lp-inventory.mjs`, `profiles.mjs`, `calibrate.mjs`, `manipulation.mjs`,
  `sensitivity.mjs`) — kör händelsesekvenser genom `activity-prototype-core.js`
  OFÖRÄNDRAD och beräknar XP via differens på dess sessionstillstånd (försök,
  distinkta konfigurationer, jämförelsepar, hjälp, lärstigsprogression) före/efter
  varje händelse. Analytisk enstegning och checkpoints (finns inte som GAM-002-
  händelse) hanteras i ett tunt eget lager ovanpå.
- Innehållsinventering av alla tio aktiva lärstigar, extraherad ur de faktiska
  instruktionstexterna (`lp-inventory.mjs`), med tre användarprofiler (minimal,
  normal, aktiv fördjupare) provräknade mot varje lärstig.
- Referensen "Test 1" (Proportionalband, normal-profil) gav 84 XP mot PM:s
  uppskattade 75–79 XP (+5, 7 % — rimlig marginal).
- 16 manipulationstester: 13 av 16 beter sig som avsett. Tre fynd: hjälp-XP utan
  tak kan ensamt ge 48 XP (mer än nivå 2:s tröskel på 35), identisk konfiguration
  upprepad efter Reset ger full "genomfört försök"-XP varje gång, och
  parameterändringar strax över 5 %-tröskeln kan farma jämförelsepar.
- Med PM:s oförändrade regler/nivåkurva når en aktiv fördjupare maxnivån
  (Reglerlegend) redan efter 7 av 10 lärstigar — mot kalibreringsmålet.
  Rekommenderad justering (hjälptak 5 unika/session, enstegningstak 3/försök,
  långsammare nivåkurva) gör att varken normal- eller fördjupare-profilen når
  taket genom en enda genomgång. Se rapporten för fullständig motivering.
- Strukturellt fynd: GAM-002 upptäcker bara jämförelsepar inom samma kontext —
  `storningar-robusthet.v1`s `continueFromPreviousStep`-jämförelser (FEAT-030)
  och flera andra lärstigars mellan-steg-jämförelser är osynliga för GAM-002.
  Öppet produktbeslut, ingen ändring av lärstigsformatet gjord i GAM-003A.
- Checkpoint-XP rekommenderas som ett separat prestationssystem, inte del av
  nivå-XP:t — inte implementerat, som instruerat.
- `tests/gamification/xp-model.test.mjs` — 33 automatiska tester, alla gröna.
- Full rapport: `docs/reports/GAM-003A_XP-KALIBRERING.md` +
  maskinläsbar `GAM-003A_XP-KALIBRERING.json`.
- DEV-/PROD-regression körd oförändrad efter uppdraget: `validate-content.mjs`
  (DEV+PROD), `validate-prod.mjs`, `build-preview.test.mjs`,
  `simulation/analyze.test.mjs`, `activity-prototype.test.mjs` — samtliga gröna.
  Ingen ändring i `apps/app/app.js`/`index.html`, bekräftat.
**Status:** Mergad till `develop`. Ingen release, `main` oförändrat. XP-modellen är
provräknad och tekniskt kalibrerad; synlig XP är fortfarande inte implementerad.
PO/PM granskade rapporten och beslutade en korrigerad grundprincip (repetition
ska ge full XP) — se **GAM-003A.1** nedan, som delvis ersätter
rekommendationerna här (hjälptak och sänkt enstegningstak tillbakadragna).

---

### GAM-003A.1 — Reviderad XP-kalibrering: repetition ska ge XP
**Branch:** `feature/GAM-003A.1-repetition-calibration`
**Prioritet:** Låg — analys/kalibrering, ingen synlig funktion
**Beskrivning:**
PO/PM-uppföljning på GAM-003A. Korrigerad grundprincip: XP ska premiera
lärandeaktivitet ÄVEN vid repetition (upprepade försök, lärstigar, egna
parameterexperiment) — det är avsedd användning, inte manipulation.
GAM-003A:s rekommenderade tak (hjälptak, sänkt enstegningstak) dras tillbaka;
PM:s ursprungliga, okapade XP-regler gäller. En ny, betydligt längre
nivåkurva (0/50/140/300/550/900/1400/2100) infördes istället.
**Genomförande:**
- **Två verkliga fel hittade och rättade i `tests/gamification/xp-model.mjs`**
  (inte i XP-reglerna): (1) ett pågående försök vid en händelsesekvens slut
  finaliserades aldrig — dess XP gick förlorad, motorn finaliserar nu
  automatiskt vid sessionens slut; (2) "slutförd lärstig"-XP var felaktigt
  hopkopplad med GAM-002:s bestående `completed`-flagga, vilket gjorde den
  ickerepeterbar — nu en egen, per-session repeterbar räkning. Referensen
  "Test 1" blev därför 90 XP (tidigare rapporterat 84).
- Nytt `priorState`/`endState`-lager i `computeXP()`: för-fyller GAM-002:s
  egna `session.learningPaths`/`session.contexts`-strukturer med tidigare
  sessioners bestående tillstånd (utan att röra GAM-002:s kod) — modellerar
  exakt vad en framtida `localStorage`-baserad persistens skulle behöva
  spara. Ny `mergeState()`-hjälpfunktion.
- Ny `tests/gamification/career.mjs`: kör N genomgångar av en lärstig eller
  hela katalogen, kedjat, och räknar ut vid vilken genomgång en profil når
  en given nivå.
- Resultat: en genomgång av alla tio lärstigar tar ingen profil till
  maxnivån (minimal→Loopvävare, normal→Loopvävare 60%, fördjupare→precis
  över Processmästare-tröskeln). Vid FLERA fulla genomgångar nås nivå 8
  efter 2 (fördjupare), 4 (normal) respektive 6 (minimal) genomgångar —
  öppen fråga till PO/PM om tempot är rätt avvägt.
- GAM-003A:s manipulationstester 4/6/8/16 omtolkade som avsedd, belönad
  repetition/experimenterande — inte längre beskrivna som fel.
- Tekniskt krav dokumenterat för GAM-003B: bestående progression (total XP,
  högsta nått lärsteg per lärstig, sedda konfigurationssignaturer) måste
  sparas mellan sessioner, plus en "Återställ progression"-funktion. Inte
  implementerat i GAM-003A.1.
- `comparisonGroup`-fält i lärstigsformatet (PO/PM:s förslag för jämförelser
  mellan lärsteg, ersätter GAM-003A:s `comparesWithStep`-idé) dokumenterat
  som öppet beslut — ingen ändring av lärstigsformatet gjord.
- `tests/gamification/xp-model.test.mjs` utökad till 43 tester (13 nya,
  bl.a. för bestående-vs-repeterbar-principen), alla gröna.
- Full rapport: `docs/reports/GAM-003A.1_XP-KALIBRERING-REPETITION.md` +
  maskinläsbar `.json`. Kort "OBS, delvis ersatt"-notis tillagd överst i
  `GAM-003A_XP-KALIBRERING.md` (historiken där är i övrigt oförändrad).
- DEV-/PROD-regression körd oförändrad: samma svit som GAM-003A, samtliga
  gröna. Ingen ändring i `apps/app/`, bekräftat.
**Status:** Mergad till `develop`. PO/PM godkände nivåtempot (2/4/6 genomgångar
till nivå 8), nivåkurvan, XP-modellen, repetitionsprincipen, localStorage-
persistens och beslutade att `comparisonGroup` ska införas fullt ut (inte bara
i kalibreringsverktyget) innan GAM-003B — se **GAM-003A.2** nedan.

---

### GAM-003A.2 — Deklarativa jämförelsegrupper (comparisonGroup)
**Branch:** `feature/GAM-003A.2-comparison-groups`
**Prioritet:** Låg — teknisk grund för GAM-003B, ingen synlig funktion
**Beskrivning:**
PO/PM-beslutad full implementation (inte bara kalibreringsverktyget) av ett
deklarativt fält för jämförelser som korsar lärstigssteg/scenario-ID-gränser,
vilket GAM-002 tidigare aldrig kunde se. Appen ska inte gissa jämförelser
från grafmarkeringar — de ska deklareras i lärstigsdata.
**Genomförande:**
- Nytt valfritt fält `comparisonGroup` i lärstigsformatet, validerat av
  `tests/validate-content.mjs` (typkontroll + varning för grupper med <2
  medlemmar eller satta på teoristeg).
- Satt på **19 steg i 6 lärstigar, 7 grupper**, efter att ha läst den
  fullständiga instruktionstexten i samtliga sju namngivna lärstigar —
  bara där en jämförelse uttryckligen instrueras. `oppen-slinga-onoff-p.v1`
  fick medvetet ingen grupp (ingen uttrycklig cross-step-jämförelseinstruktion).
  Korrigerar samtidigt ett fel i GAM-003A:s ursprungliga inventering av
  `windup-antiwindup.v1` (av/på-jämförelsen är två separata lärstigssteg,
  inte ett steg med två interna konfigurationer).
- `apps/app/app.js`: `comparisonGroup` skickas med i `learning_step_reached`
  (`nextPathStep`/`prevPathStep`), samma befintliga dispatch-anrop.
- `apps/app/activity-prototype-core.js` (GAM-002) utökad med
  `session.comparisonGroups`/`groupComparisonPairs` och en ny
  `recordGroupComparison()`, anropad EFTER den befintliga, oförändrade
  inom-kontext-jämförelselogiken. En grupp med fler än två försök
  (`storningar-noise-comparison`, fyra försök) jämförs bara mot det SENAST
  registrerade försöket — samma princip som redan gäller inom en kontext —
  vilket ger tre kedjade par, inte sex (C(4,2)). Ingen ny komplettering
  (roller/ordning) behövdes utöver `comparisonGroup` självt.
- Dubblettskydd verifierat: inom-kontext-par dubbelräknas aldrig som
  gruppar; bara riktningen "senaste→ny" prövas (inget A-B/B-A-dubbelpar);
  `comparisonGroups` ingår medvetet INTE i GAM-003A.1:s
  `priorState`/`endState`-persistensmodell, så en ny session kan generera
  samma gruppjämförelse igen (repetitionsprincipen).
- `tests/gamification/` uppdaterat (lp-inventory.mjs, profiles.mjs,
  xp-model.mjs) att använda samma comparisonGroup-information som appen.
  Ny `tests/gamification/comparison-groups-content.test.mjs` (23 tester)
  pinnar de faktiska grupperna mot riktigt innehåll.
- Referensen "Test 1" jämförelse-XP: 6 → 18 XP (två tidigare missade
  gruppjämförelser). Godkänt nivåtempo (2/4/6 genomgångar till nivå 8)
  förblev i praktiken oförändrat — de nya jämförelserna är bestående
  "första gången"-händelser, inte repeterbara vid identisk repetition.
- 8 nya tester i `tests/activity-prototype.test.mjs` (nu 48 totalt),
  23 nya i `comparison-groups-content.test.mjs`, `xp-model.test.mjs`
  oförändrat 43. Samtliga gröna.
- Full rapport: `docs/reports/GAM-003A.2_COMPARISON-GROUPS.md` + `.json`.
- DEV-/PROD-regression grön. PROD-artifakten fysiskt oförändrad i struktur
  (fältet är inert JSON-data i PROD — GAM-002 laddas aldrig där).
**Status:** Mergad till `develop`. Ingen release, `main` oförändrat. Ingen
synlig XP, ingen persistens. GAM-003B kan nu påbörjas.

---

### PED-005 — Granskning av jämförelser i lärstigarna
**Branch:** `feature/PED-005-learning-path-comparison-review`
**Prioritet:** Låg — analysuppdrag, blockerar GAM-003B tills PO/PM beslutat
**Beskrivning:**
Ren granskning (inga ändringar i lärstigsdata, comparisonGroup, appkod,
aktivitetsmodell eller XP-modell) av samtliga 14 identifierade jämförelser i
de 10 aktiva DEV-lärstigarna, inför GAM-003B:s synliga XP.
**Resultat i korthet:**
- Bekräftat 8 (inte 7) unika comparisonGroup-ID:n i kodbasen — skrivfel i
  GAM-003A.2-rapportens sammanfattningsmening, inte i koden eller testerna.
- 6 av 8 grupper redan pedagogiskt sunda (Metod D — separata försök med
  explicit noterade mätvärden); Störningar och robusthet oförändrad
  (redan PO-godkänd).
- Ett konkret sakfel hittat i publicerad lärstig: `pi-pid.v1` steg 3
  hänvisar till en icke-existerande "bläddra tillbaka i grafloggen"-funktion.
- Ett mindre instruktionsfel i `windup-antiwindup.v1` steg 2 (saknar
  notering av överskjutningsvärde som steg 3 sedan frågar efter).
- Öppet PO/PM-beslut: `lambda-comparison` — sekventiell kedja kontra
  gemensam referens (samma XP-summa oavsett val).
- Allvarligt, tidigare oupptäckt funktionsfel i DEV-only-lärstigen
  `stegsvar-identifiering.v1` (ej en comparisonGroup-fråga): steg 2-7
  saknar `continueFromPreviousStep`, så stegsvarskurvan raderas innan
  steg 4-7 hinner mäta den. Bör åtgärdas innan lärstigen övervägs för PROD.
- Ingen förändring av totalt antal jämförelsepar eller jämförelse-XP
  (72 XP oförändrat) — inga föreslagna ändringar rör XP-regeln.
- Ny återanvändbar kontroll: `tests/gamification/ped-005-audit.mjs`.
- Full rapport: `docs/reports/PED-005_JAMFORELSEGRANSKNING.md` + `.json`.
**Status:** Mergad till `develop`. Inga lärstigsfiler eller appkod ändrade.
PO/PM tog ställning till beslutsunderlaget och GAM-003B påbörjades och
genomfördes.

---

### GAM-003B — Synlig DEV-prototyp för XP och nivåprogression
**Branch:** `feature/GAM-003B-visible-level-prototype`
**Prioritet:** Låg — DEV-prototyp, ingen produktionsaktivering
**Beskrivning:**
Bygger den synliga nivåfunktionen som GAM-003A/A.1/A.2 och PED-005 förberett
underlaget för: en kompakt nivåyta i vänstra sidopanelen (badge, nivånummer,
nivånamn, grafisk nivåmätare — inga XP-tal) som delar ut XP för verkliga
GAM-002-aktiviteter och sparar bestående progression mellan sessioner via en
egen `localStorage`-nyckel. **Status:** DEV-prototyp — ingen produktions-
aktivering beslutad. Nivån mäter aktivitet/progression, inte kompetens.
**Genomförande:**
- Fyra nya, avgränsade DOM-fria/tunt-DOM-moduler (samma UMD-mönster som
  `sim-core.js`): `gamification-xp-engine.js` (XP-/nivåregler, testbar i
  Node), `gamification-store.js` (`localStorage`-adapter + migrering, testbar
  med en mock), `gamification-ui.js` (ren rendering), `gamification.js`
  (bootstrap/glue). Ingen XP- eller persistenslogik i `app.js`.
- Enda integrationspunkten mot GAM-002: en ny `window.ActivityPrototype
  .onEvent(fn)`-registrering i `activity-prototype.js`, anropad EFTER
  `Core.recordEvent` med samma sessionsobjekt — omöjliggör dubbelregistrering
  per konstruktion. `activity-prototype-core.js` (GAM-002:s kärna) helt
  orörd.
- XP-reglerna och nivåkurvan (`LEVELS_V1`/`XP_RULES_V1` i
  `gamification-xp-engine.js`) matchar exakt PO/PM:s beslutade värden — se
  `docs/development/GAMIFICATION-XP-PROTOTYPE.md`.
- Bestående XP (nytt högsta lärsteg, distinkt-konfigurationsbonus) skild
  från repeterbar XP (försök, jämförelsepar, hjälp, mätarbete, enstegning,
  slutförd lärstig) — jämförelsepar kan alltså ge XP igen i en ny session
  trots att den underliggande "första gången"-bonusen är bestående.
- `ENV_CONFIG.showGamification` (DEV: `true`, PROD: `false`) styr, tillsammans
  med `environment`, om de fyra skripten injiceras alls — PROD begär dem
  aldrig över nätverket, och `tests/lib/build-prod.mjs`s fasta fillista
  kopierar dem heller aldrig. En verklig CSS-bugg hittades och fixades under
  utvecklingen: `.gam-level-panel`s egen `display: flex` slog igenom
  `[hidden]`-attributet i vissa fall — löst med en explicit
  `.gam-level-panel[hidden] { display: none; }`-regel, verifierad med en
  riktig PROD-förhandsvisning i webbläsaren.
- Nivåbytesanimation (badge-puls + kort "Ny nivå"-text, inte konfetti) med
  fullt stöd för `prefers-reduced-motion`.
- "Återställ progression" (DEV-only, kräver bekräftelse) raderar endast
  `pidSimGamificationV1`-nyckeln — appens övriga inställningar opåverkade.
- DEV-konsolstöd `window.GamificationDev` (state/grantTestXP/
  simulateLevelUp/reset), tydligt dokumenterat vad som speglar verklig
  aktivitet kontra rena testhjälpmedel.
- Nya tester: `gamification-engine.test.mjs` (34), `gamification-store.test.mjs`
  (20), `gamification-dev-prod-isolation.test.mjs` (13) — samtliga gröna,
  tillsammans med samtliga befintliga GAM-/innehålls-/simulerings-/PROD-
  tester. Manuell DEV- och PROD-regression genomförd i riktig webbläsare
  (Playwright, engångsskript).
**Status:** Mergad till `develop`. PO:s användartest genomfördes och ledde
direkt till GAM-003C (fördröjd/kvalificerad XP-visning).

---

### GAM-003C — Kvalificerad och fördröjd XP-visning
**Branch:** `feature/GAM-003C-qualified-delayed-progress`
**Prioritet:** Låg — DEV-prototyp, ingen produktionsaktivering
**Beskrivning:**
PO:s test av GAM-003B visade att barens direkta respons gjorde det lätt att
kartlägga vilket klick som gav XP. Ändrar INGA XP-värden eller nivågränser —
bara när/under vilka villkor XP bokförs och visas. Se
`docs/development/GAMIFICATION-XP-PROTOTYPE.md` (avsnitt "GAM-003C") för
fullständig beskrivning.
**Genomförande:**
- Bokföring (`engine.totalXP`) och visning (`engine.displayedXP`) frikopplade
  — baren synkas bara vid en naturlig avstämningspunkt (`Engine.shouldFlush`/
  `flush()`): stegbyte, scenariobyte, avslutat försök, slutförd lärstig,
  eller ett nivåbyte som redan bokförts.
- "Nytt högsta lärsteg" kräver nu kvalificering: teoristeg (aktiv lästid
  `4s+ord/4`, klämt 8–60s), scenariosteg (relevant aktivitet, inte bara
  väntetid), blandade steg (50 % av lästiden OCH aktivitet). Navigationen
  låses aldrig — ett okvalificerat steg ger bara ingen XP.
- "Unik hjälptext" kräver minst 3s aktiv tid med samma hjälptext öppen; byte
  av hjälptext eller stängd panel (ny `help_closed`-händelse) avbryter.
- En enda punktvis timer (inte polling) fångar tidsbaserad kvalificering när
  användaren blir overksam.
- Nivåpanelen komprimerad: bara badge/nivånummer/nivånamn/bar syns permanent.
  Hittade och fixade samtidigt en verklig CSS-bugg från GAM-003B — egna
  `display`-deklarationer slog igenom `[hidden]`, så förklaringstexten och
  Återställ-knappen syntes permanent istället för bara vid klick.
- Utökat DEV-konsolstöd: `pending()`, `log()`, `setXP()`, `jumpToLevel()`,
  `placeNearLevel()`, `simulateLevelUpSequence()`, `forceFlush()`.
- `gamification-engine.test.mjs` utökad till 64 tester (nya
  kvalificeringsregler); `gamification-store.test.mjs` (20) och
  `gamification-dev-prod-isolation.test.mjs` (13) oförändrat gröna.
  Samtliga befintliga GAM-/innehålls-/simulerings-/PROD-tester gröna.
  Manuell DEV/PROD-regression i riktig webbläsare (Playwright).
- Persistensformatet är OFÖRÄNDRAT — pendingStep/pendingHelp/displayedXP är
  sessionsbundna, ingen migrering behövdes.
**Status:** Mergad till `develop`. PO:s nya användartest godkändes och ledde
till GAM-003D.

---

### GAM-003D — Verifiera finalisering av pågående försök vid sessionsavslut
**Branch:** `feature/GAM-003D-session-finalization`
**Prioritet:** Låg — DEV-prototyp, buggfix utan produktionsaktivering
**Beskrivning:**
Efter godkänt användartest av GAM-003C kvarstod en osäkerhet: ett genomfört
försök (>=20 simulerade steg) finaliseras bara vid en avslutande händelse
(stegbyte, scenariobyte, betydande parameterändring, Återställ system). Om
INGEN sådan händelse hinner ske innan sidan laddas om, navigeras bort från,
eller fliken/webbläsaren stängs, startar nästa session helt tom och
försöks-/distinktkonfigurations-/jämförelsepar-XP:n för det ofinaliserade
försöket gick permanent förlorad. **Buggen reproducerades** (både i ett
Node-skript och i en riktig webbläsare) och är nu åtgärdad.
**Genomförande:**
- Ny, smalt avgränsad händelsetyp `"session_ending"` i
  `activity-prototype-core.js` — finaliserar ENDAST ett försök som redan
  uppfyller villkoret för ett genomfört försök (>= 20 steg); ett kortare,
  ofärdigt försök lämnas helt orört (varken completed eller aborted).
  Idempotent: `finalizeAttempt` nollställer `ctx.currentAttempt`, så en
  upprepad `session_ending` kan aldrig finalisera/kreditera samma försök
  två gånger.
- `activity-prototype.js` dispatchar `session_ending` på `pagehide` (INTE
  `beforeunload` — synkront, inget asynkront arbete, fångar
  omladdning/navigering/stängning tillförlitligt utan `beforeunload`s
  kända nackdelar).
- Ingen ändring i `gamification-xp-engine.js`/`gamification.js` behövdes —
  den befintliga diff-baserade XP-bokföringen (samma `completedAttempt`/
  `distinctConfig`/`comparisonPair`-kategorier som alla andra avslutande
  händelser) hanterar `session_ending` helt utan särskilt fall.
- Nya tester: `tests/gamification/gamification-session-finalization.test.mjs`
  (15, hela XP-kedjan) samt 3 nya tester (39–41) i
  `tests/activity-prototype.test.mjs` (Core-nivå, isolerat). Verifierat i
  riktig webbläsare: omladdning, navigering bort, stängd flik — alla tre
  bevarar XP:n korrekt; kort försök ger fortsatt ingen XP; PROD helt
  opåverkat (skriptet laddas aldrig där).
- Inga XP-värden, nivågränser, stegkvalificering, hjälpkvalificering, bar-
  avstämningspunkter, nivå-UI, lärstigar eller scenarier ändrade.
**Status:** Mergad till `develop`. Ingen release, `main` oförändrat.

---

### RELEASE-v1.5.0 — Nivåprogression i produktion + Störningar och robusthet
**Branch:** `release/v1.5.0` (från `develop`) → `main` (taggad `v1.5.0`) → tillbaka till `develop`
**Prioritet:** Hög — produktionsrelease
**Beslutsfattare:** PO (PM otillgänglig vid tillfället — PO tog besluten direkt, 2026-09-10)
**Beskrivning:**
Efter PO:s godkända användartest av GAM-003B/C/D beslutade PO att:
1. Aktivera nivåprogressionen (GAM-002/GAM-003) i PROD i sitt nuvarande,
   testade DEV-skick, **inklusive** DEV-konsolstödet
   (`window.ActivityPrototype`/`window.GamificationDev`) för felsökning på
   plats i produktion.
2. Publicera FEAT-030 (lärstigen "Störningar och robusthet") som sjunde
   PROD-lärstig.
3. Bekräftade explicit: progression sparas per webbläsare/enhet (inte per
   konto) — ett känt, accepterat förhållande, inte ett krav på ändring.
4. Bekräftade explicit: allt annat i PROD-profilen (Test-läge, poäng,
   mätfacit, experimentellt innehåll) förblir avstängt, oförändrat.

**Genomförande:** se `feature/PROD-v1.5.0-activate-gamification`-posten
ovan för den tekniska arkitekturändringen (frikoppling av
`showGamification` från `ENV_CONFIG.environment`). Releasen i sig tog med
hela `develop` (ingen cherry-pick, enligt projektets vanliga
releaseprincip) — `CHANGELOG.md` och `README.md` uppdaterade på
release-branchen.
**Testresultat:** 269 automatiska tester gröna (samtliga GAM-/innehålls-/
simulerings-/PROD-tester). Manuell verifiering i riktig webbläsare mot en
byggd PROD-artifakt: nivåprogression fungerar och bokförs korrekt,
DEV-konsolstödet tillgängligt, Störningar och robusthet laddas som sjunde
lärstig, Test-läge/poäng/facit/experimentellt förblir avstängda, ingen
DEV-badge, appversion v1.5.0, inga konsolfel.
**Status:** Publicerad. `main` taggad `v1.5.0`, GitHub Pages byggd och
publicerad därifrån. `develop` innehåller samma underlag.

---

### FEAT-034 — Enkel besöks- och nivåstatistik (GoatCounter)
**Branch:** `feature/goatcounter-analytics`
**Prioritet:** Medel — PO vill kunna se hur mycket appen faktiskt används
**Beskrivning:**
PO vill kunna se hur många studenter som använder appen (unika besökare per datum) samt
vilken gamification-nivå de når, som ett grovt mått på användningsomfattning. Vald lösning:
[GoatCounter](https://www.goatcounter.com) — gratis, cookiefri, kräver inget
samtyckesbanner, visar unika besökare per dag i sin dashboard. Sitekod: `pid-simulator`
(`https://pid-simulator.goatcounter.com`).

Två delar:
1. Vanlig sidvisningsräkning: GoatCounters standardskript i `apps/app/index.html`.
2. Anonym nivå-händelse: när `flushed.leveledUp` inträffar i `gamification.js` (samma
   punkt som redan triggar `UI.showLevelUp`) skickas en `window.goatcounter.count()`-
   händelse med nivåindex/-namn som `path`/`title`. Ingen koppling till individ utöver
   GoatCounters egna, dagsroterande anonyma besökshash.

**Avsteg från tidigare princip:** `FEAT-033` (se ovan) noterar att webbappen medvetet
saknar externa beroenden/CDN-script i `index.html`. GoatCounter är ett uttryckligt,
avsiktligt avsteg från den principen — PO har vägt nyttan (användningsstatistik) mot
avsteget och godkänt det. Blockerar inte lokal DEV-testning: GoatCounters skript
exkluderar `localhost`/lokala nätverk från räkningen som standard, så
`python -m http.server` mot `apps/app/` skickar inga händelser.

**Stängd utan implementation (2026-09-10):** Byggd och lokalt testad på
`feature/goatcounter-analytics`, men PO:s test visade att begäran till `gc.zgo.at`
blockeras av webbläsarens säkerhetsinställningar (bekräftat i DevTools Network-fliken —
"Provisional headers are shown", ingen statuskod, alltså stoppad innan nätverksanropet
ens skickades). PO bedömer att skoldatorerna som studenterna faktiskt använder har
samma typ av restriktiva säkerhets-/nätverksinställningar, vilket gör GoatCounter
opålitligt för målgruppen — inte ett adblock-i-en-enskild-webbläsare-problem utan ett
strukturellt problem med klientside-JS-analys i den här miljön. Featuren och branchen
skrotas. Om besöksstatistik önskas igen senare krävs antingen en server-/proxy-baserad
lösning (inte blockerbar av klientens nätverksfilter) eller ett annat spårningssätt än
ett tredjeparts-JS-skript.
**Status:** Stängd — se motivering ovan

---

### FEAT-035 — Nivåmärke, medaljongdesign
**Branch:** `feature/nivamarke-medaljong`
**Prioritet:** Låg — kosmetisk förbättring
**Beskrivning:**
Dagens sexkantsmärke i nivåpanelen (`gamification-ui.js:badgeSvg()`) har ett känt
buggmönster: nivåsiffran renderas som ett separat HTML-`<span>`, absolutpositionerat
`bottom: 3px` i märkrutan — inte som en del av SVG-grafiken tillsammans med sexkanten
och återkopplingsloop-ikonen. Resultatet är att siffran ser felcentrerad/"off" ut,
eftersom den och ikonen konkurrerar om samma lilla yta (42×46px) i stället för att vara
en sammanhållen bild.

PO fick tre visuella förslag presenterade (mockup, se
[docs/reports/ — badge-revision-mockup, ej sparad i repo]) och valde **"Medaljong"**:
- Siffran flyttas in i SVG:n som `<text>`, ankrad i sexkantens geometriska mittpunkt
  (12, 13 i `viewBox="0 0 24 26"`) — löser buggen direkt.
- Sexkanten fylls med en linjär gradient (ljus→mörk nyans av nivåns egen
  `TIER_ACCENTS`-färg, beräknad i JS, inte en ny parallell färglista).
- En tunn innerfälg (halvtransparent vit) ger en "medaljong"-känsla.
- Siffran "graveras" med skugga/highlight (`text-shadow`).
- Nivå 8 (Reglerlegend, index 7) får en mjuk `feGaussianBlur`-glöd — enda nivån med
  den extra effekten, som en tydlig topp-belöning.
- Den befintliga återkopplingsloop-ikonen (`LOOP_ICON_SVG`) tas bort ur badgen som en
  del av denna omdesign (medaljongstilen ersätter den, inte kompletterar den).

**Release:** Ingick i `RELEASE-v1.5.1` (se nedan) på PO:s uttryckliga begäran, direkt
efter att medaljongförslaget godkänts.
**Status:** Publicerad. Mergad till `develop` och `main` (taggad `v1.5.1`).

---

### RELEASE-v1.5.1 — Nivåmärke, medaljongdesign
**Branch:** `develop` → `main` (taggad `v1.5.1`) → tillbaka till `develop`
**Prioritet:** Låg — kosmetisk patch-release
**Beslutsfattare:** PO ("kan färdigställas till release och mergas till main", 2026-09-10)
**Beskrivning:**
Ensam post: `FEAT-035` (nivåmärkets medaljongdesign, se ovan). Ingen cherry-pick — releasen
tar med hela `develop` vid releasetillfället, enligt projektets vanliga releaseprincip.
`CHANGELOG.md`, `README.md` och `APP_VERSION` uppdaterade direkt på `develop` inför
mergen till `main` (samma mönster som `RELEASE-v1.5.0`).
**Testresultat:** Hela startkontrollsviten från `docs/handoffs/HANDOFF_2026-09-10.md`
avsnitt 13 kördes grönt (innehåll, simulering, aktivitet, samtliga gamification-svit,
build-preview, validate-prod). `badgeSvg`/`shade` är ren DOM-fri stränggenerering och
testades isolerat med en fristående kopia av logiken. Manuell visuell granskning gjordes
via en HTML-mockup (Artifact) som PO godkände innan implementation; ingen live-
webbläsartest i denna miljö (ingen webbläsare tillgänglig i sandboxen) — PO bör göra en
snabb visuell kontroll av badgen i produktion efter deploy.

**Sidofynd under testkörningen:** `tests/hotfix-v1.4.1-facit-env.test.mjs` kontroll 4c
var föråldrad — den påstod att `activity-prototype*.js` INTE skulle finnas i
`dist/prod`, vilket var sant före v1.5.0 men fel sedan PO:s beslut att aktivera
gamification i PROD (redan korrekt skyddat åt rätt håll i `tests/validate-prod.mjs:172`).
Testet uppdaterades aldrig när arkitekturen ändrades. Rättat i samma release eftersom det
annars permanent skulle visa falsk röd status vid varje framtida testkörning — inte en
del av `FEAT-035`, men för litet och uppenbart fel för att motivera en egen
bugfix-branch/buglog-post.
**Status:** Publicerad. `main` taggad `v1.5.1`, GitHub Pages byggd och publicerad
därifrån. `develop` innehåller samma underlag.

---

### STRAT-001 — Teknisk förstudie: fyra framtida reglerstrategier
**Branch:** `feature/STRAT-001-forstudie-reglerstrategier`
**Prioritet:** Medel — analysuppdrag, ingen implementation
**Beskrivning:**
Uppdrag från PO/PM: teknisk förstudie för fyra möjliga framtida reglerstrategier, i
prioriteringsordning (1) Parameterstyrning (Gain Scheduling), (2) Framkoppling
(Feedforward), (3) Kvotreglering (Ratio Control), (4) Kaskadreglering (Cascade
Control). Analyserar pedagogiskt värde, teknisk komplexitet, påverkan på
simuleringskärnan/UI/scenarioformat/tester, samt gemensam arkitektur som bör införas
tidigt för att minska framtida omarbete — de fyra som en sammanhängande
utvecklingsplan, inte fyra isolerade features. Explicit inget kodarbete.
**Genomförande:**
Full rapport: `docs/reports/STRAT-001_FORSTUDIE-REGLERSTRATEGIER.md`. Kärnfynd:
dagens simuleringskärna (`sim-core.js`) är en strikt enkelslinge-arkitektur (en
process, en regulator, skalär omätbar störning) — Parameterstyrning passar den
oförändrad, Framkoppling kräver en genuint ny mätbar hjälpsignal, Kvotreglering kan
återanvända den signalen om Framkoppling byggs generellt, och Kaskadreglering är den
enda som kräver en andra regulator-/processinstans plus nytt UI-/grafmönster.
Rekommenderad byggordning matchar PO/PM:s prioritering. Enda motiverade
framtidssäkringen: namnge Framkopplings nya signal generellt ("hjälpsignal") istället
för hårdkodat, så Kvotreglering kan återanvända den. Ingen ytterligare
framtidssäkring rekommenderas — se rapportens avsnitt 5.4 för vad som medvetet
avråds som överdesign.
**Status:** Mergad till `develop`. Ren analys, ingen appkod ändrad. Rekommenderat
att Parameterstyrning (Gain Scheduling) utvecklas först — se rapportens avsnitt 9.

---

### STRAT-002 — Behöver Parameterstyrning en icke-linjär processmodell först?
**Branch:** `feature/STRAT-002-icke-linjar-process-forstudie`
**Prioritet:** Medel — analysuppdrag, ingen implementation
**Beskrivning:**
Uppföljningsuppdrag från PO efter STRAT-001. PO:s bedömning: STRAT-001s viktigaste
fynd var att Parameterstyrning (Gain Scheduling) riskerar att sakna en verklig
pedagogisk anledning att existera så länge processens K är konstant — men STRAT-001
lämnade frågan öppen istället för att ta ställning. Uppdrag: analysera om Gain
Scheduling kräver en ny/utökad icke-linjär processmodell för verkligt pedagogiskt
värde, föreslå 2–5 konkreta processfall (pedagogiskt värde, teknisk omfattning,
realism, lämplighet för PID Simulator) och avgör om Parameterstyrning bör byggas
direkt eller om en enkel icke-linjär processmodell bör införas först. Ingen
implementation, ingen kod.
**Genomförande:**
Full rapport: `docs/reports/STRAT-002_ICKE-LINJAR-PROCESSMODELL.md`. Svar: varken
"direkt" eller "först" — **tillsammans**. Parameterstyrningens regulatorschema och en
enkel icke-linjär processmodell löses av samma lilla brytpunktstabellsmekanism, så
att bygga dem separat sparar inget och riskerar att lämna Parameterstyrning utan
verklig pedagogisk grund. Fyra konkreta processfall analyserade: ventilkarakteristik
(K som funktion av utsignalen, på `self_regulating` — rekommenderas byggas
tillsammans med Parameterstyrning som ETT uppdrag, bredast återanvändning av
befintligt innehåll), konisk tank (K som funktion av PV, på `integrating` —
rekommenderas som billig uppföljning mot redan existerande
`integrerande-process-niva.v1`), belastningsberoende förstärkning (kräver
STRAT-001:s hjälpsignal-koncept — bör medvetet vänta till efter Framkoppling för att
undvika dubbelarbete), samt pH-neutralisering (mycket realistiskt läroboksexempel,
men avfärdas — bryter appens genomgående 0–100 %-konvention).
**Status:** Mergad till `develop`. Ren analys, ingen appkod ändrad.

---



### FEAT-045 — Framkoppling (Feedforward)
**Branch:** `feature/FEAT-045-framkoppling`
**Prioritet:** Medel — bygguppdrag pågår (PO-uppdrag efter STRAT-005)
**Beskrivning:**
Uppdrag från PO efter STRAT-004: designspecifikation för Framkoppling, näst i
STRAT-001s prioritetsordning efter Parameterstyrning (FEAT-042). PO:s beslut:
`auxSignal` representerar en BESTÅENDE lastförändring — ligger kvar tills
systemet återställs eller lasten ändras igen (inte en övergående puls).
PO:s efterföljande bygguppdrag (2026-09-19): full implementation enligt
STRAT-005 — sim-core, UI, teorimodul, lärstig, övningsdokument, tester,
simuleringsverifiering. Avgränsat: ingen kvotreglering/kaskadreglering, ingen
dynamisk profil (ramp/sine), endast EN auxSignal, ingen extra grafpanel,
ingen generell signalmotor. Pedagogiskt krav: tre tydligt separata strategier
i lärstigen (Återkoppling/Framkoppling/Återkoppling+Framkoppling) — att "ren
framkoppling" internt realiseras via Kp≈0.1/Ti=Td=0 är en implementationsdetalj,
inte lärstigens fokus. Öppen fråga (uttryckligen ingen utredning i detta
uppdrag): var FEAT-046s blockschema-SVG:er (Framkoppling/PID+Framkoppling)
bäst kan användas i denna lärstig/övningsdokument som nästa steg.
**Genomförande (implementation, 2026-09-19):**
Full implementation på feature-branchen enligt STRAT-005, se
`docs/reports/FEAT-045_IMPLEMENTATION.md` för alla detaljer. Sammanfattning:
`sim-core.js` (`Simulation.auxValue`/`triggerAuxSignal()`,
`ProcessModel.step()`s auxGain-term genom processens tidskonstant,
`PIDController.step()`s feedforward-parameter före klippning), tre UI-fält
+"Trigga last"-knapp, tredje graflinje (lila prickstreck), ny teorimodul,
4-stegs lärstig, nytt övningsdokument (`docs/exercises/ovningar-framkoppling.md`,
4 uppgifter), 21 nya testkontroller (`tests/feat-045-framkoppling.test.mjs`).
Full regression grön (9 testfiler, 175 kontroller), DEV-/PROD-innehålls- och
byggvalidering grön, PROD-katalogen OFÖRÄNDRAD (inget release-uppdrag).
Två simuleringsverifierade avsteg från STRAT-005s arbetshypoteser (se
rapportens avsnitt 3/5): (1) processen startar vid `normalValue=SP` med en
NEGATIV last istället för `normalValue=0`+positiv last — STRAT-005s förslag
gav ett fysiskt omöjligt korrigeringskrav (u<0); (2) mätmetod per lärstigssteg
(crosshair för steg där PV återgår till samma SP, 2%-band där PV settlar på
ett nytt värde) istället för enhetligt 2%-band överallt — verktyget kräver
PV₀≠PV∞ för att rita bandet. Den resulterande pedagogiska poängen (framkoppling
=snabb men aldrig självkorrigerande vid fel Kff; PID=långsam men garanterat
självkorrigerande; kombinationen=båda) är simuleringsverifierad och enligt min
bedömning rikare än utkastets ursprungliga skiss.
**Genomförande (designspecifikation, STRAT-005):**
Full designspecifikation: `docs/reports/STRAT-005_DESIGN-FRAMKOPPLING.md`.
PO:s "permanent"-beslut förenklar designen väsentligt jämfört med STRAT-004s
öppna skiss: `auxSignal` blir alltid ett steg (ramp/sine bortfaller), inget
`enabled`-fält behövs (bara ett triggat värde), och INGEN bumplös övergång
krävs för framkopplingstermen (avsiktligt — ett omedelbart hopp i u är
själva poängen med framkoppling, till skillnad från FEAT-042s zonbyten).
Nytt scenariofält `auxSignal.magnitude`, `process.auxGain` (lastens egen
processpåverkan), `controller.kff` (framkopplingsförstärkning, tillåtet
negativ). Ny knapp "Trigga last" + fält i tre olika, redan existerande
parametergrupper (Process/Regulator/Störningar) — ingen zontabell/gruppering
behövs, till skillnad från FEAT-042 (tre fristående fält i tre olika grupper
är inte samma situation som FEAT-042s samlade zonfält). Lastsignalen ritas
som en tredje linje i den redan existerande övre grafpanelen. 3-stegs lärstig
(PID ensam → ren framkoppling med fel Kff → PID+korrekt Kff) och 4
övningsuppgifter föreslagna, med Mätläge+2%-toleransband inbyggt i
instruktionerna FRÅN START (FEAT-042-lärdom). Simuleringsexempel med
riktvärden (K=1.3, auxGain=0.8, teoretiskt korrekt kff=-auxGain/K≈-0.62 —
notera det NEGATIVA tecknet, en icke-uppenbar poäng) — flaggat som
arbetshypoteser som måste simuleringsverifieras innan de låses fast, samma
disciplin som PED-003E/FEAT-042.
**Status:** Andra implementationsomgången klar (2026-09-19), efter PO:s
beslut: värmeväxlare som processexempel, graflinjen för lasten borttagen.
Genomfört enligt `docs/reports/FEAT-045_ANVANDARTEST-ATGARDER.md`: (1) de två
kodbuggarna fixade — Mätläge-ordningen rättad i alla lärstigssteg/
övningsuppgifter (trigga FÖRST, Mätläge EFTERÅT), och lastens graflinje
ersatt med en statusradsavläsning (`| Last: −20 (aktiv)`, samma mönster som
Parameterstyrningens zoninfo) eftersom den klipptes bort/blev osynlig för
negativa värden; (2) Δt-baserad mätinstruktion (t_last/t_slut/Δt) istället
för absoluta stegnummer, med 2%-toleransbandet korrekt ankrat (PV₀=avläst
dippvärde, PV∞=SP) för de steg där PV återgår till SP; (3) crosshair
avrundad till 1 decimal (global ändring, påverkar alla lärstigar i Mätläge);
(4) värmeväxlarexemplet vävt in i teorimodul, lärstig, övningsdokument och
`help.json` (auxGain/kff/auxMag) — generiska fältnamn i UI:t oförändrade,
bara den förklarande texten uppdaterad. Full regression fortsatt grön
(175/175), DEV-/PROD-validering grön. Redo för PO:s förnyade granskning.

**Tillägg (2026-09-19), PO:s justering av lärstigens progression:** bytt
ut den gamla 3-stegsstrukturen (PID ensam → REN framkoppling/P-only med fel
Kff, permanent fel → PID+korrekt Kff) mot en renare trimningsberättelse enligt
PO:s uppdrag: PID ensam → PID+FEL Kff (≈−0.3) → PID+KORREKT Kff (≈−0.6), där
alla tre steg kör FULL PID (Kp=1.2, Ti=20) — bara Kff ändras. Ny dedikerad
scenariofil `framkoppling-demo-pid-fel-kff.json`. Simuleringsverifierat med
en delad, återanvänd 2%-toleransram (satt i steg 1, medvetet oförändrad i
steg 2/3 för rättvis jämförelse): avvikelse krymper monotont (≈4.9 → ≈2.5 →
≈0.1), men insvängningstiden gör bara ett MÅTTLIGT hopp i steg 2 (123→105
steg — samma PID-dynamik jagar en mindre avvikelse) och ett STORT hopp först
i steg 3 (105→25 steg — knappt något kvar att jaga). Denna nyans (storlek
och hastighet förbättras INTE proportionerligt) är en starkare, mer
verifierad pedagogisk poäng än den tidigare "monotont bättre"-berättelsen,
och checkpoints i steg 2/3 är skrivna kring den. Den gamla "ren
framkoppling ger permanent fel"-demonstrationen är INTE borttagen — den
lever kvar oförändrad i `docs/exercises/ovningar-framkoppling.md` (Uppgift
2/3, som behöver Ti=0 för att en "stabilt PV-värde per Kff"-jämförelse ska
vara meningsfull) men ingår inte längre i huvudlärstigen. Kff-värden
avrundade till en decimal genomgående (scenariofiler, lärstig, teorimodul,
övningsdokument, hjälptexter) — `-0.31`/`-0.6154`/`-0.92` → `-0.3`/`-0.6`/
`-0.9`. Full regression fortsatt grön (175/175), DEV-/PROD-validering grön.

**Tillägg (2026-09-19), auxGain/lastmagnitud justerade för HELT exakta
Kff-värden (PO:s uppdrag, efter ett resonemangsvarv om alternativ):**
`process.auxGain` 0.8→0.65 och `auxSignal.magnitude` −20→−40 i alla fyra
scenariofiler. Vald KOMBINATION, inte auxGain ensamt: 0.65 valdes specifikt
SKILT från K=1.3 (inte satt lika med K) för att undvika att återskapa
förväxlingsrisken mellan auxGain/K som PO:s tidigare fråga redan retts ut;
−40 valdes för större, tydligare marginal mot crosshairens 1-decimalsprecision
i det (tidigare) näst intill osynliga sista steget. Resultat: `Kff = −auxGain/K
= −0.5` EXAKT — ingen avrundning kvar någonstans i teorimodul, lärstig,
övningsdokument eller hjälptexter. Fel-Kff/för-mycket-Kff blir därmed också
exakta (−0.25/−0.75, halva/1.5× av −0.5). Bieffekt, simuleringsverifierad:
med exakt Kff blir avvikelsen i lärstigens steg 3 nu LITERALT noll (inte
bara mycket liten) — PV rör sig inte alls, `Δt`=0 — vilket gjorde
"hovra och mät den lilla avvikelsen"-instruktionen obsolet; ersatt med
"observera att kurvan inte rör sig alls". Nya A–F-mätvärden: A≈8.0/B=123
(steg 1) → C=4.0/D=104 (steg 2, exakt hälften i avvikelse, måttlig
Δt-förbättring) → E=0/F=0 (steg 3, fullständig). Checkpoints i steg 2/3
uppdaterade i linje med detta. Uppgift 2:s över-/underkompensation blev
samtidigt perfekt symmetrisk (±11.5 kring exakt SP). Full regression grön
(175/175), DEV-/PROD-validering grön.

**Status:** PO-godkänt efter granskning (2026-09-20). Mergad till `develop`
(`--no-ff`). Lärstigen `framkoppling.v1` tillagd SIST i `catalog.prod.json`s
`learning_paths` (9:e lärstigen i PROD), tillsammans med dess teori- och
scenarioberoenden (`framkoppling-demo-pid`/`-pid-fel-kff`/`-pid-ff` samt
`framkoppling-demo-ren-ff` för övningsdokumentet). `tests/validate-prod.mjs`s
`EXPECTED_LEARNING_PATHS` uppdaterad. `catalog.prod.json` → v1.6.0-prod,
`catalog.json` (DEV) → v1.6.0, `APP_VERSION` → 1.6.0. Full regression grön
(175/175), DEV-/PROD-innehålls- och byggvalidering grön, PROD-allowlistet
verifierat att matcha exakt (`node tests/validate-prod.mjs`).

---

### UX-001b — Namnbyte: processmodellernas etiketter
**Branch:** `feature/UX-001b-processmodell-namn`
**Prioritet:** Låg — trivial, men PO-godkänd att göra direkt (2026-09-20),
oberoende av resten av UX-001.
**Beskrivning:** PO:s svar på UX-001s öppna fråga 1: byt `processType`-väljarens
etiketter "Självreglerande"/"Självreglerande 2:a ordn." till "Självreglerande
(enkapacitiv)"/"Självreglerande (flerkapacitiv)" — tydligare, mer
reglertekniskt korrekt terminologi, matchar UX-001-förstudiens föreslagna
namngivning.
**Genomförande:** Ren textändring i `apps/app/index.html`s `<option>`-element
(`processType`-select). Inga andra ställen refererade den gamla texten
("Självreglerande 2:a ordn.") — `help.json`s `processType`-hjälptext talar
generiskt om "Självreglerande" utan ordningsdistinktion och behöver ingen
ändring. Ingen kod i `sim-core.js`/`app.js` berörs (`self_regulating_2` som
internt värde är oförändrat).
**Status:** Mergad till `develop`.

---
