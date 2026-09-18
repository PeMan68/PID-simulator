# STRAT-001 — Teknisk förstudie: fyra framtida reglerstrategier

**Datum:** 2026-09-18
**Uppdragsgivare:** PO/PM
**Typ:** Ren analys — inget kodarbete, ingen implementation
**Underlag:** `apps/app/sim-core.js`, `apps/app/app.js`, `apps/app/index.html`,
`apps/app/content/scenarios/*.json`, `tests/validate-content.mjs`, öppen backlog i
`docs/tracking/todo.md` (2026-09-18)

---

## 1. Sammanfattning

PO/PM har efterfrågat en förstudie för fyra möjliga framtida reglerstrategier, i
prioriteringsordning: **Parameterstyrning → Framkoppling → Kvotreglering →
Kaskadreglering**. Förstudien bekräftar att denna ordning även är rätt **byggordning**
— komplexiteten stiger monotont med samma ordning som det pedagogiska värdet, med ett
undantag (kvotreglering har lägre pedagogiskt värde än de tre andra, se avsnitt 3.3).

**Kärnfynd:** dagens simuleringskärna (`sim-core.js`) är en **strikt enkelslinge-
arkitektur** — en process, en regulator, ett skalärt störningsvärde som adderas direkt
på processens utsignal. Ingen av de fyra strategierna kan byggas utan att någon del av
den arkitekturen utökas, men de skiljer sig kraftigt i **hur mycket**:

| Strategi | Kräver ny "andra signal"? | Kräver andra regulatorn? | Kräver andra processen? |
|---|---|---|---|
| Parameterstyrning | Nej | Nej | Nej |
| Framkoppling | **Ja** | Nej | Nej (utökad, inte duplicerad) |
| Kvotreglering | Ja (återanvänder Framkopplings) | Nej | Ja (enkel, "vild" signal) |
| Kaskadreglering | Ja (återanvänder samma mönster) | **Ja** | Ja (full, kopplad) |

**Rekommendation i korthet:**
1. Bygg **Parameterstyrning** först — passar dagens arkitektur nästan perfekt, inget
   framtidssäkringsbehov.
2. Bygg **Framkoppling** som nummer två, och lägg då in en liten, medveten
   generalisering (ett namngivet "hjälpsignal"-begrepp, se avsnitt 5) — det är den enda
   punkten i hela kedjan där en billig investering nu sparar påtagligt omarbete senare.
3. **Kvotreglering** blir därefter billig — den återanvänder Framkopplings hjälpsignal
   och drar nytta av att dagens `runtime.setpoint` redan läses om varje steg (ingen
   ombyggnad krävs för ett "härlett börvärde").
4. **Kaskadreglering** är ett väsentligt större uppdrag än de tre andra tillsammans
   (dubblerad regulator, dubblerad process, dubblerad UI, dubblerad graf) och bör
   planeras som ett eget, större uppdrag när den tid kommer — inget bör byggas för dess
   skull idag.

---

## 2. Nuvarande arkitektur (baseline)

Verifierat direkt i koden (inte från äldre dokumentation):

- **`Simulation`** (`sim-core.js`) äger exakt **en** `ProcessModel`-instans och **en**
  regulator (`PIDController` eller `OnOffController`, valda via `controller.mode`).
  Det finns ingen lista/array av slingor — allt är hårdkodade enskilda fält
  (`this.process`, `this.pid`, `this.onoff`).
- **Störning** (`disturbance.noiseStd`/`disturbance.pulse`) är ett **rent skalärt
  värde** som adderas direkt till `process.y` i `ProcessModel.step()` — det har ingen
  egen dynamik (ingen K/T/L), är inte mätbart för regulatorn, och existerar inte som
  egen serie i historiken. Det representerar **omätbar** störning per konstruktion —
  motsatsen till vad framkoppling behöver.
- **`scenario.runtime.setpoint`** läses fräscht från scenario-objektet **varje steg**
  (`const sp = this.scenario.runtime.setpoint;` i `Simulation.step()`) — det cachas
  aldrig. Det är en viktig, redan existerande styrka (se avsnitt 5.2).
- **`history`**-objektet är en platt dict med fasta nycklar (`t, y, sp, u, e, p, i, d`)
  — inget namnrum för en andra slinga.
- **Scenario-JSON-schemat** är platt: `process`, `controller`, `disturbance`,
  `runtime` är singularobjekt, inte listor. `tests/validate-content.mjs` gör bara
  referentiell integritetskontroll (att filer/steg-referenser existerar) — inget
  formellt JSON-schema att bryta mot, vilket sänker kostnaden för schemaändringar.
- **UI:** `fields{}` i `app.js` är en platt 1:1-mappning DOM-fält → skalärt
  scenario-fält (`fields.kp` → `currentScenario.controller.kp` osv.), i fyra fasta
  paneler (Process, Regulator, Styrning, Störningar). Inget etablerat mönster för
  "upprepad" eller "andra instansen av"-UI finns någonstans i appen idag.
- **Graf:** `drawChart()` är handrullad canvas-rendering (ingen biblioteksberoende),
  med två fasta paneler (PV/SP 0–100 %, u 0–100 %). Nya linjer (63 %-linje, PB-band,
  hjälplinjer) har hittills alltid lagts till som ytterligare rader i samma
  handrullade funktion — ett etablerat, litet-till-medelstort arbetsmönster (jämförbart
  med redan levererad `FEAT-038`).
- **Öppen backlogg-relevans:** `FEAT-032` (kurvöverlagring, sparade körningar) och
  `FEAT-005` (historik-stegning) är båda öppna och obyggda — appen har idag **ingen**
  etablerad mekanism för att visa mer än en körnings data samtidigt i grafen. Det
  förstärker slutsatsen att simultan visning av två slingor (kaskad) är obeprövad mark,
  inte bara en utökning av något som redan finns. `FEAT-022`
  (verkningsriktning/Kp-tecken) är också öppen och berör samma regulator-panel som
  parameterstyrning skulle utöka — värt att känna till men blockerar inget.

---

## 3. Analys per strategi

### 3.1 Parameterstyrning (Gain Scheduling)

**Pedagogiskt värde:** Högt. Bygger direkt vidare på redan levererat djupt
Kp/PB-innehåll (`proportionalband-forstarkning.v1`, PED-003B/C) — en naturlig
fortsättning: "Kp är inte konstant i verkliga processer" (ventilkarakteristik,
tanktvärsnittets form vid nivåreglering). Konkret, verifierbart med simulatorns egna
verktyg (svep över driftpunkt, jämför fast vs. schemalagd förstärkning).

**Teknisk komplexitet:** Låg. Regulatorn är fortfarande **en** instans — bara dess
`kp`/`ti`/`td` varierar över tid som funktion av en variabel som redan finns i
simuleringen (PV eller SP).

**Påverkan på simuleringskärnan:** Litet, lokalt tillägg i `Simulation.step()`: slå
upp aktiva `kp/ti/td` från ett schema **innan** `this.pid.step()` anropas. Ingen ändring
av `PIDController`, `ProcessModel` eller `history`-formatet. Enda nya subtiliteten är
**bumplös övergång** vid zonbyte (undvik hopp i `u` när gainerna byter) — samma mönster
som redan finns för manuell↔auto-övergång (`bias`/`biasFadeSteps` i `app.js`), direkt
återanvändbart.

**Påverkan på UI:** Litet–medelstort. Rekommendera **fasta, få zoner** (2–3, t.ex.
Låg/Mellan/Hög driftpunkt) med egna Kp/Ti/Td-fält per zon — samma "platta fält"-idiom
som redan används överallt (jfr hysteresis övre/undre). En fullt dynamisk
tabellredigerare (lägg till/ta bort valfritt antal zoner) är **inte** motiverad — se
avsnitt 5.3.

**Påverkan på scenarioformat/lärstigar:** Nytt valfritt fält, t.ex.
`controller.schedule: [{ upTo: <PV>, kp, ti, td }, ...]`, bakåtkompatibelt (scenarier
utan fältet beter sig oförändrat). Ny lärstig naturlig (svep driftpunkt, jämför fast
vs. schemalagd), inget behov av att ändra befintligt innehåll.

**Testpåverkan:** Litet. Enhetstester för schema-uppslag (gränsfall vid zongränser,
undvik "chattring" om driftpunkten ligger precis på en gräns — hysteresfri växling bör
verifieras eller medvetet accepteras och dokumenteras).

**Risker/okända faktorer:** Lågt. Största okända är pedagogisk, inte teknisk: hur
tydligt kan simulatorn visa **varför** schemaläggning behövs (dvs. visa att processens
verkliga K varierar med driftpunkten) utan att först bygga en icke-linjär process­modell?
Idag är `ProcessModel` linjär (K är konstant) — schemaläggning av regulatorn utan en
icke-linjär process att demonstrera **mot** riskerar att bli en abstrakt övning. Värt
att PO/PM tar ställning till om en enkel icke-linjär processvariant (K varierar med PV)
ska följa med som eget, litet delmoment — annars blir den pedagogiska poängen svagare
än den tekniska enkelheten antyder.

---

### 3.2 Framkoppling (Feedforward)

**Pedagogiskt värde:** Mycket högt. Ett kärnbegrepp i kursens läroplan, och en naturlig
fortsättning på redan levererad `storningar-robusthet.v1` (FEAT-030): "återkoppling
reagerar EFTER att störningen syns i PV — framkoppling agerar INNAN." Stark,
icke-uppenbar poäng möjlig: visa att framkoppling + återkoppling tillsammans slår ren
återkoppling på insvängningstid utan att offra robusthet.

**Teknisk komplexitet:** Medelhög — den arkitektoniskt viktigaste av de fyra, se
avsnitt 5.

**Påverkan på simuleringskärnan:** Detta är den strategi som **kräver en genuint ny
signal**. Dagens `disturbance`-värde är per konstruktion omätbart (adderas direkt på
`process.y`, aldrig synligt för regulatorn). Framkoppling förutsätter motsatsen: en
**mätbar** last-/störningsvariabel som regulatorn läser direkt. Krävs:
1. En ny, namngiven signalkälla (steg/ramp/sinus — samma profiltyper som redan finns
   för brus/puls, ingen ny generatortyp) vars värde beräknas varje steg.
2. En feedforward-term i utsignalen: `u = u_återkoppling + Kff × last` (statisk
   framkoppling är litet tillägg; dynamisk fram-/efter-koppling med ledande/eftersläpande
   filter är ett medelstort tillägg, samma mönster som det tidigare föreslagna
   lågpassfiltret i `FEAT-040`).
3. **För att inte bli pedagogiskt trivial** (ren framkoppling som "perfekt" kompenserar
   en okänd störning ser ut som magi) bör lastvariabelns påverkan på processen gå genom
   **egen enkel dynamik** (gain/tidskonstant), inte bara adderas rakt av — annars finns
   inget att lära av samspelet mellan framkopplingens noggrannhet och processens
   verkliga dynamik. Det är en verklig, om än måttlig, utökning av `ProcessModel.step()`.

**Påverkan på UI:** Medelstort. Ny parametergrupp ("Störningsvariabel"/"Last") med
signalprofil + Kff-fält, samt en på/av-toggle för att jämföra med/utan framkoppling
(samma UI-idiom som `antiWindup`-kryssrutan).

**Påverkan på scenarioformat/lärstigar:** Nytt fält, t.ex. ett `feedforward`-block i
scenario-JSON (last-signalens profil + Kff), samt en ny historik-serie för
lastvariabeln. Ny lärstig naturlig, byggd ovanpå `disturbance-robustness.v1`s
begreppsapparat.

**Testpåverkan:** Medelstort. Nya tester för feedforward-matematiken, processens andra
indatakanal, samspel med anti-windup/bumplös övergång (feedforward-termen påverkar var
utsignalen mättar, vilket i sin tur påverkar anti-windup-logiken — bör verifieras
explicit).

**Risker/okända faktorer:** Den största okända faktorn är **UX för en tredje
tidsserie** i grafen (PV/SP/u finns idag; last-signalen blir en fjärde) — kräver
antingen en tredje graf-panel eller att den ritas i samma övre panel med egen skala/
legend. Inget stoppvillkor, men bör klargöras med PO innan UI-arbetet påbörjas.

---

### 3.3 Kvotreglering (Ratio Control)

**Pedagogiskt värde:** Medel — smalare industriellt tillämpningsområde (blandning/
förbränning) än de övriga tre, mindre centralt för kursens generella PID-läroplan.
Fortfarande ett namngivet, relevant kursmoment.

**Teknisk komplexitet:** Medel — **inte** en full flerslinge-lösning (bara **en**
regulator), men kräver för första gången en **andra process/signal som lever
parallellt** med huvudslingan.

**Påverkan på simuleringskärnan:** Om Framkopplings hjälpsignal byggdes generellt
(avsnitt 5) blir detta litet: återanvänd samma "andra signal"-mekanism som den "vilda"
(okontrollerade) flödet, och beräkna `SP_trim = kvot × PV_vild` varje steg **innan**
regulatorns `step()` anropas. Eftersom `scenario.runtime.setpoint` redan läses om varje
steg (se avsnitt 2) krävs **ingen** ändring av `PIDController`/`Simulation`s publika
gränssnitt för detta — bara en beräkning som sätter `scenario.runtime.setpoint` innan
steget körs. Om Framkoppling byggdes smalt/hårdkodat blir detta istället ett eget,
duplicerat arbete av samma storlek som Framkoppling — se avsnitt 5 för varför det bör
undvikas.

**Påverkan på UI:** Litet–medelstort (återanvänder Framkopplings signalpanel-mönster),
plus ett kvot-fält istället för/utöver ett fast SP-fält.

**Påverkan på scenarioformat/lärstigar:** Återanvänder samma hjälpsignal-fält som
Framkoppling, plus ett `ratio`-fält. Ny lärstig, mindre omfattande än de andra tre.

**Testpåverkan:** Litet–medelstort. Kvotberäkning, gränsfall vid vilt flöde ≈ 0.

**Risker/okända faktorer:** Störst risk är **organisatorisk, inte teknisk**: värdet av
att bygga Kvotreglering beror direkt på hur generellt Framkoppling byggdes. Byggs den
fel (för hårdkodad) blir Kvotreglering lika dyr som Framkoppling själv, vilket
undergräver hela poängen med att bygga den som nummer tre.

---

### 3.4 Kaskadreglering (Cascade Control)

**Pedagogiskt värde:** Mycket högt — ofta kursens "kapitelavslutande" avancerade
PID-moment (klassiskt exempel: temperaturslinga runt en flödesslinga).

**Teknisk komplexitet:** Hög — den enda av de fyra som kräver en **genuint ny
regulatorinstans**, inte bara en ny signal.

**Påverkan på simuleringskärnan:** Störst av de fyra. Kräver att `Simulation`
orkestrerar **två** fullständiga par av regulator+process i strikt beroendeordning
varje steg (yttre regulators utsignal → inre regulators börvärde → inre regulators
utsignal → inre processens utsignal blir indata till yttre processen). Sannolikt en ny,
separat klass (inte en generalisering av dagens `Simulation` "för säkerhets skull" — se
avsnitt 5.3) som komponerar två existerande `PIDController`/`ProcessModel`-par. En känd,
verkligt subtil svårighet: **kaskad-windup** — anti-windup måste fungera korrekt på
**båda** regulatorerna oberoende (t.ex. när inre slingan inte hinner följa yttre
slingans börvärde), ett läge som inte finns i dagens enkelslinge-anti-windup-logik och
som kräver egen verifiering/pedagogik.

**Påverkan på UI:** Störst av de fyra. Dagens sidopanel förutsätter **exakt en**
Process-grupp och **en** Regulator-grupp — kaskad kräver dubblerade paneler (Inre/Yttre)
eller en vy-växlare. Ingen befintlig kod att luta sig mot; detta är ett nytt UI-mönster
för appen.

**Påverkan på scenarioformat/lärstigar:** Störst av de fyra. Ett nytt, nästlat
scenarioformat (`innerLoop`/`outerLoop` eller motsvarande) — en verklig
schemaändring, inte ett tillägg. `history`-formatet behöver namnrymdas per slinga.
`tests/validate-content.mjs`s referentiella kontroller behöver egen logik för
kaskadscenarier.

**Påverkan på graf:** Störst av de fyra. Måste visa **båda** slingornas PV/SP/u
samtidigt eller via växling — obeprövad mark (se avsnitt 2: `FEAT-032`/`FEAT-005`, som
skulle ge liknande men enklare "flera serier"-förmåga, är båda ännu obyggda).

**Testpåverkan:** Störst av de fyra. Fullständiga sammansättningstester, ordnings-/
tidsberoende, kaskad-windup, bumplös övergång vid regulatorbyte på **två** nivåer.

**Risker/okända faktorer:** Betydande UI-designrisk (ingen etablerad lösning för
"två slingor i en graf" i appen idag) och verklig risk att kaskad-windups pedagogiska
poäng kräver noggrann, egen designrunda med PO — inte ett rakt tekniskt påslag ovanpå
de tre andra strategierna.

---

## 4. Kostnads-/värdeöversikt

| Strategi | Ped. värde | Teknisk komplexitet | Ny signal? | Ny regulator? | Ny process? | UI-omfång | Grafomfång |
|---|---|---|---|---|---|---|---|
| 1. Parameterstyrning | Hög | Låg | Nej | Nej | Nej | Litet–medel | Inget nytt |
| 2. Framkoppling | Mycket hög | Medelhög | **Ja (ny)** | Nej | Utökad | Medel | Ny serie |
| 3. Kvotreglering | Medel | Medel | Ja (återanvänd) | Nej | Ja (enkel) | Litet–medel | Ny serie |
| 4. Kaskadreglering | Mycket hög | Hög | Ja (återanvänd) | **Ja** | **Ja (full)** | Stort (nytt mönster) | Stort (nytt mönster) |

---

## 5. Sammanhängande arkitekturanalys (inte fyra isolerade features)

### 5.1 Vad begränsar dagens arkitektur för framtida flerslinge-lösningar?

Fem konkreta punkter, verifierade i koden:

1. `Simulation` har hårdkodat **exakt en** `process`/`pid`/`onoff` — inga listor.
2. `history` är en platt dict med fasta nycklar — ingen namnrymd plats för en andra
   slingas data.
3. `fields{}` i `app.js` är en platt, en-per-parameter-mappning knuten till specifika
   DOM-id:n — generaliserar inte till "N slingor" utan dubblerad HTML + indexerade
   fältnamn.
4. `drawChart()` antar två fasta paneler (PV/SP, u) — ingen mekanism för en tredje
   simultan datakälla, ännu mindre en hel andra slingas motsvarande par.
5. Scenario-JSON-schemat är platt (singularobjekt, inte listor) och
   `validate-content.mjs`s referentiella kontroller är skrivna mot den formen.

**Ingen av dessa fem är begränsande för Parameterstyrning.** Framkoppling träffar
punkt 2 och 4 lätt (en till serie, inte en till slinga). Kvotreglering träffar samma
punkter något mer. Endast Kaskadreglering träffar samtliga fem på fullt allvar.

### 5.2 Vad redan i arkitekturen förbereder gott — utan att någon bad om det

`scenario.runtime.setpoint` läses fräscht från scenario-objektet **varje
simuleringssteg**, inte cachas vid start. Det betyder att ett **härlett börvärde**
(kvotreglerings `SP = kvot × vild PV`, eller kaskadens `SP_inre = u_yttre`) redan är
tekniskt möjligt utan att röra `PIDController` eller `Simulation`s publika gränssnitt
— det räcker att sätta `scenario.runtime.setpoint` till ett beräknat värde innan
`sim.step()` anropas. Detta är en verklig, ograverad styrka i dagens design och bör
**inte** refaktoreras bort av misstag när Framkoppling byggs.

### 5.3 Kan Parameterstyrning och Framkoppling förberedas för Kvot-/Kaskadreglering?

**Parameterstyrning:** Nej, och det behöver den inte. Dess enda återanvändbara del är
den redan existerande bumplös-övergång-idiomen (bias/fade), vilken redan är generell
nog. Det finns inget i schemaläggningens datastruktur som Kvot- eller Kaskadreglering
skulle vinna på att Parameterstyrning byggdes annorlunda.

**Framkoppling: ja, om den byggs med en avsiktlig generalisering.** Den konkreta
rekommendationen: bygg Framkopplings nya signal som ett **generellt namngivet
"hjälpsignal"-begrepp** (t.ex. `auxSignal` med en `id`/`label`, egen profil, egen
historik-serie, egen graf-linje) — **inte** hårdkodat som "feedforwardLast" i varje
lager (scenario-fält, `Simulation`-kod, UI-fältnamn, graf-rityta). Om det görs rätt:

- **Kvotreglering** återanvänder samma hjälpsignal som den "vilda" flödet, samma
  UI-panelmönster, samma graf-serie-kod — det blir i praktiken bara ett nytt
  beräkningssteg (`SP = kvot × hjälpsignal`) ovanpå redan byggd infrastruktur.
- **Kaskadreglering** vinner mindre men ändå något: samma "härlett börvärde"-mönster
  (avsnitt 5.2) och samma beslut om hur en andra tidsserie namnges/visas i grafen — men
  vinner **inte** undan behovet av en andra regulator-/processinstans, vilket förblir
  kaskadens egna, stora arbete oavsett hur Framkoppling byggs.

### 5.4 Motiverad framtidssäkring vs. överdesign

**Motiverat (gör nu, låg kostnad, verklig nytta senare):**
- Bevara att `runtime.setpoint` läses om varje steg (ingen ändring behövs — bara en
  disciplin att inte cacha det när Framkoppling/senare strategier byggs).
- Namnge och forma Framkopplings nya signal generellt (`auxSignal`/hjälpsignal),
  inte som ett engångsfält — en namn-/formfråga, i praktiken kostnadsfri jämfört med
  ett hårdkodat alternativ.
- Bestäm (dokumentera, behöver inte byggas) redan nu hur `history`-formatet **skulle**
  namnrymdas för en andra slinga, så att Kaskadreglering senare inte tvingas till en
  brytande formatändring i sista stund. En 30 minuters designbeslut, ingen kod.

**Överdesign att undvika:**
- Bygg **inte** en generisk "N-slinge-motor" eller ett block-diagram-redigeringsverktyg
  nu för Parameterstyrnings eller Framkopplings skull — bara Kaskadreglering behöver
  äkta flerslinge-orkestrering, och den ligger sist i kön.
- Bygg **inte** en fullt dynamisk tabellredigerare för parameterstyrningens zoner
  (lägg till/ta bort valfritt antal) — ett fast litet antal zoner (2–3) räcker
  pedagogiskt och matchar appens etablerade "platta fält"-mönster (jfr hysteres
  övre/undre, som också är ett fast antal fält, inte en lista).
- Bygg **inte** hjälpsignalens profilgenerator som ett generellt skriptbart system —
  ett fast litet antal profiltyper (steg/ramp/sinus, samma stil som brus/puls redan
  har) räcker.
- Generalisera **inte** `fields{}`/UI-panelmönstret till en datadriven formbyggare nu
  — bara Kaskadreglering behöver en andra parameterpanel, och det ligger två steg
  bort och kan ändra form innan det blir aktuellt.

---

## 6. Rekommenderad roadmap

1. **Parameterstyrning** — bygg fristående, utan hänsyn till steg 3/4.
2. **Framkoppling** — bygg med den medvetna generaliseringen i avsnitt 5.3/5.4 (namngiven
   hjälpsignal), annars identisk omfattning som om ingen framtidssäkring gjordes.
3. **Kvotreglering** — bygg som en återanvändning av Framkopplings infrastruktur;
   omvärdera omfattning om Framkoppling av någon anledning byggdes smalt/hårdkodat.
4. **Kaskadreglering** — planera som ett eget, väsentligt större uppdrag (egen
   förstudie för UI/graf-mönster rekommenderas när den tiden kommer) — inte en enkel
   fortsättning på de tre andra.

## 7. Arkitekturrekommendation

Inför **en** liten, generell primitiv när Framkoppling byggs: ett namngivet
"hjälpsignal"-koncept (egen profil, egen historik-serie, eget graf-linjemönster) —
inte fyra separata, hårdkodade lösningar. Rör i övrigt inte `Simulation`-klassens
kärnstruktur (en process, en regulator) förrän Kaskadreglering faktiskt påbörjas — den
strukturen tjänar Parameterstyrning, Framkoppling och Kvotreglering väl som den är.

## 8. Bedömning: framtidssäkring nu?

- **Steg 1 (Parameterstyrning):** Bygg utan hänsyn till steg 3/4. Ingen
  framtidssäkring är motiverad — det finns inget värdefullt att dela framåt.
- **Steg 2 (Framkoppling):** En avgränsad, billig framtidssäkring **är** motiverad:
  generalisera den nya signalens namn/form (avsnitt 5.3/5.4) så Kvotreglering kan
  återanvända den rakt av. Inget utöver det — ingen flerslinge-motor, ingen generisk
  UI-byggare.

## 9. Konkret rekommendation: vilken byggs först

**Parameterstyrning (Gain Scheduling).** Både PO/PM:s egen prioritering och denna
förstudies oberoende analys pekar på samma svar: lägst teknisk risk, nästan inget
strukturellt tillägg krävs, hög pedagogisk anknytning till redan levererat
Kp/PB-innehåll, och ett bra tillfälle att öva "utöka scenarioformat + validera +
lärstig"-arbetsflödet en gång till innan Framkopplings större arkitekturbeslut ska
tas. Enda öppna frågan att lyfta med PO/PM innan byggstart: om en enkel icke-linjär
processvariant (K varierar med PV) bör följa med för att ge schemaläggningen en
verklig anledning att existera i simulatorn (se avsnitt 3.1).
