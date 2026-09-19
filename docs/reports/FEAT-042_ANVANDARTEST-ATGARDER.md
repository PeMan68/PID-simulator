# FEAT-042 — Åtgärder efter PO:s användartest

**Datum:** 2026-09-19
**Uppdragsgivare:** PO
**Branch:** `feature/FEAT-042-parameterstyrning-ventilkarakteristik` (fortsatt EJ mergad)
**Underlag:** PO:s manuella användartest av lärstigen "Parameterstyrning och olinjär
ventilkarakteristik", `docs/reports/FEAT-042_IMPLEMENTATION.md`

---

## 1. Identifierade orsaker

### Punkt 2 — Parameterstyrning "avstängd" i steg 7 (huvudfyndet)

**Rotorsak, bekräftad i koden:** `nextPathStep()`/`prevPathStep()` i `app.js` anropar
`loadScenarioByName(step.ref)` vid varje lärstigssteg av typen `scenario`, **om inte**
steget har `continueFromPreviousStep: true`. Ett fullständigt scenario-omladdning
kör `hydrateFields(currentScenario)`, som sätter UI-fälten (inklusive kryssrutorna
`gainScheduleEnabled`/`nonlinearGainEnabled`) från **scenariofilens egna, hårdkodade
värden** — inte från vad studenten senast ställde in manuellt i föregående steg.

Ursprungsversionen av lärstigen bad studenten manuellt kryssa i "Parameterstyrning" i
steg 6 (`"Kryssa i 'Parameterstyrning' i Regulator-gruppen"`), men steg 7 refererade
**samma scenariofil**, vars `gainSchedule.enabled` är `false` (måste vara det, eftersom
samma fil används oförändrad av steg 2–3). Vid navigering 6→7 laddas filen om, kryssrutan
återgår till `false`, och Parameterstyrning "verkar avstängd" trots att studenten precis
aktiverat den.

**Viktigt tilläggsfynd (inte specifikt flaggat av PO, men samma grundorsak):** exakt
samma problem fanns latent mellan steg 4→5 — steg 4 bad studenten manuellt höja Kp till
3, och steg 5:s instruktion ("Behåll Kp=3") stämde inte, eftersom omladdningen mellan
stegen redan hade återställt Kp till filens standardvärde 1.2 (som av ren tillfällighet
råkade vara samma som steg 4:s startvärde, vilket dolde problemet där — men "Behåll
Kp=3" var sakligt fel). Åtgärdat med samma lösning, se nedan.

### Punkt 1 — Otydliga mätinstruktioner

Instruktionerna bad om flera värden (t.ex. "insvängningstid" OCH "utsignalens värde
vid stabilt läge") utan att uttryckligen namnge eller referera dem i senare
jämförelser — studenten fick själv hålla reda på vilket värde från vilket steg som
skulle jämföras med vad.

### Punkt 3 — Ingen tydlig visuell markering av aktiv zon

Bekräftat: enda indikationen var en kompakt textrad i statusraden
("Zon 2 (Kp=1.8)"), tillagd i slutet av en redan lång statusrad — lätt att missa,
och gav ingen koppling till VILKA fält (Zon 2:s Kp/Ti/Td) som faktiskt var aktiva.

### Punkt 4/5 — Ingen guidning eller grafmarkering vid zonbyte

Bekräftat: inget i appen visade NÄR ett zonbyte skedde under en körning — varken i
grafen eller i status. Ett zonbyte var bara synligt genom att jämföra Kp/K-värdet i
statusraden mot vad man mindes från tidigare, inget stöd för att koppla bytet till en
specifik tidpunkt eller till en förändring i beteendet.

**Simuleringsfynd under åtgärdsarbetet:** med scenariots faktiska tuning sker BÅDA
zonbytena i steg 7 (SP=90) redan inom de första 6 simuleringsstegen (verifierat med
`tests/simulation/`: Kp-zonbyte till Zon 2 vid steg 1, K-zonbyte till Zon 2 vid steg 4,
Kp-zonbyte till Zon 3 vid steg 6). Det är för snabbt för att realistiskt "hinna
observera live" oavsett stegningsstrategi — vilket direkt stärker att en
EFTERHANDS-markering (punkt 5) är den pålitliga mekanismen, inte en live-observation
som förutsätter perfekt timing (se avsnitt 4).

---

## 2. Föreslagna lösningar

| Punkt | Lösning |
|---|---|
| 1 | Namnge varje uppmätt värde (A–F) i instruktionstexten; ta bort onödiga mätningar; varje jämförelse refererar explicit vilka bokstäver/steg som jämförs. |
| 2 | **PO:s föredragna lösning genomförd:** två nya, dedikerade scenariofiler (en med Kp=3 som eget standardvärde, en med Parameterstyrning redan aktiverad) — lärstigen aktiverar rätt inställning genom att bara LADDA rätt fil, ingen manuell åtgärd eller ihågkommen inställning krävs. |
| 3 | Ny badge ("Aktiv: Zon N") bredvid respektive kryssruta + färgad ram runt den aktiva zonens egna fält — samma färgkodning som brytpunktslinjerna i grafen (orange=regulator, grön=process). |
| 4 | Instruktionstext i steg 7 uppmanar till "Stega 1" för den som vill se badgen ändras live, men är ärlig om att bytena sker snabbt — och pekar på markeringslinjen (punkt 5) som den pålitliga metoden. |
| 5 | Zonbyten (båda scheman, oberoende av varandra) markeras automatiskt med samma streckade linje som redan används för parameterändringar/puls — fungerar identiskt oavsett om man Stegar eller Kör 10 (se teknisk lösning nedan). |

---

## 3. Implementerade ändringar

### Kod (`apps/app/sim-core.js`, `apps/app/app.js`, `apps/app/index.html`)

- **Ingen ändring i `sim-core.js`** — all ny logik är UI-lagret, simuleringskärnan
  var inte orsaken till något av de fem problemen.
- **Ny delad funktion `activeZones()`** — enda källan för "vilken zon är aktiv just
  nu" (regulator- och processchema oberoende). Används av statusraden, den nya
  zonbadgen/fälthighlighten OCH zonbytesmarkeringarna, så alla tre alltid visar
  samma sak.
- **`updateZoneIndicators()`** — ny funktion, sätter badge-text/synlighet och en
  CSS-klass (`zone-active-regulator`/`zone-active-process`) på den aktiva zonens
  egna fält. Anropas från `updateStatus()` OCH från `updateGainScheduleUIState()`/
  `updateNonlinearGainUIState()` (så badgen försvinner direkt om en kryssruta stängs
  av indirekt, t.ex. vid lägesbyte till Manuell).
- **`markZoneChangeIfAny()`/`resetZoneChangeTracking()`** — ny logik för
  zonbytesmarkeringar. `resetZoneChangeTracking()` piggybackar på
  `captureMarkerBaseline()` (redan anropad vid scenariobyte/Rensa graf/Återställ),
  så ingen ny nollställningslogik behövde uppfinnas.
- **"Kör 10 steg"-knappen skriven om** från `sim.run(10)` till en explicit loop av
  10 `sim.step()`-anrop i `app.js`, enbart för att kunna upptäcka ett zonbyte som
  sker MITT i en batch, inte bara jämföra före/efter hela klicket. Antal körda
  steg och stopp vid maxSteps-taket är oförändrat — ren omskrivning, inget nytt
  beteende för studenten.
- **Ny CSS**: `.zone-badge`/`.zone-badge-regulator`/`.zone-badge-process` (badge)
  och `.field.zone-active-regulator`/`.field.zone-active-process` (fälthighlight),
  samma färgpar som grafens brytpunktslinjer.
- **2 nya `<span>`-badgeelement** i index.html, ett per kryssruta.
- Två hjälptexter (`gainScheduleEnabled`, `nonlinearGainEnabled` i `help.json`)
  kompletterade med en kort förklaring av badgen/markeringslinjen.

### Innehåll

- **Två nya scenariofiler**, båda fysiskt identiska processer/K-zoner som
  originalet, bara med olika STANDARDVÄRDEN för de fält som lärstigen behöver
  förinställda:
  - `valve-nonlinear-gain-demo-kp3.json` — Kp=3 som eget standardvärde (steg 4–5).
  - `valve-nonlinear-gain-demo-scheduled.json` — Parameterstyrning redan aktiverad,
    med exakt samma zonvärden (Zon 1 Kp=5, Zon 2/3 Kp=1.2) som originalet hade som
    förval (steg 6–7).
  - Mönstret (flera scenariofiler inom samma `comparisonGroup`) är redan etablerat
    i appen — se t.ex. `proportionalband-forstarkning.v1.json`s
    `p-pi-comparison-p.json`/`p-pi-comparison-pi.json` — inget nytt UI- eller
    schemakoncept.
  - Simuleringsverifierat: båda nya filerna ger EXAKT samma insvängningstal
    (29/68/22/60 respektive 40/84/7/39 steg) som redan verifierat i original-
    implementationen — bara *var* värdena kommer ifrån (fil kontra manuell
    inmatning) har ändrats, inte fysiken.
- **Lärstigen omskriven i sin helhet** (`parameterstyrning-ventilkarakteristik.v1.json`,
  version v1.1.0): nya scenarioreferenser för steg 4–7, namngivna mätvärden (A–F)
  genomgående, tydligare jämförelsetext, uppdaterad guidning i steg 7 om zonbytenas
  faktiska hastighet.
- Katalogregistrering av de två nya scenarierna i `catalog.json` (DEV-only,
  `catalog.prod.json` orört).

### Verifiering

- Fullständig regressionssvit (15 testsviter) grön, inklusive de två tidigare
  FEAT-042/FEAT-043-sviterna.
- `validate-content.mjs`/`validate-prod.mjs`: inga nya varningar, 27 scenarier/10
  teorimoduler/11 lärstigar laddar korrekt i DEV, PROD-urvalet opåverkat.
- DEV-/PROD-byggnation kontrollerad: de två nya scenariofilerna finns i
  `dist/dev/`, är **frånvarande** i `dist/prod/`.
- Zonbytenas faktiska tidpunkter i steg 7 verifierade direkt med
  `tests/simulation/` (se avsnitt 1) — inte gissade.
- **Ingen webbläsartest genomförd** av de nya UI-elementen (badge, fälthighlight,
  markeringslinjer) — ingen webbläsare tillgänglig i denna miljö, samma
  begränsning som ursprungsleveransen. PO bör visuellt verifiera badge-färger,
  fälthighlight och markeringslinjer innan mergebeslut.

---

## 4. Bedömning: 10-stegsknappen

**Rekommendation: behåll som idag — kombinera pedagogisk styrning (redan
implementerad, punkt 4) med markeringslinjen (redan implementerad, punkt 5). Lås
INTE knappen.**

**Motivering:**
1. **Tekniskt opålitligt att definiera "nära en brytpunkt" generellt.** Det skulle
   kräva ett godtyckligt tröskelvärde per scenario, med risk att antingen låsa för
   tidigt (frustrerande, känns påtvingat) eller för sent (missar poängen helt).
2. **Simuleringsfyndet i avsnitt 1 gör en låsning i det närmaste meningslös här:**
   med den faktiska tuningen sker båda zonbytena inom 6 simuleringssteg — en
   låsning skulle behöva trigga nästan omedelbart, vilket knappast skiljer sig
   från att bara alltid tvinga fram "Stega 1" i hela scenariot.
3. **Markeringslinjen (punkt 5) löser redan det PO:s idé var till för att lösa** —
   att studenten ska kunna se exakt var ett zonbyte skedde — men gör det EFTERHANDS
   och alltid korrekt, oavsett hur studenten klickade. En knapplåsning löser bara
   LIVE-observation, som avsnitt 1 visar är opraktisk för den här specifika
   processen.
4. **Konsekvens med resten av appen:** inget annat lärstigssteg eller scenario
   begränsar de generella simuleringskontrollerna (Stega/Kör 10) villkorat på
   var i förloppet man befinner sig — en låsning här vore ett nytt, isolerat
   undantagsmönster.

Om PO trots detta vill pröva idén i framtiden (t.ex. för en annan, långsammare
tuning där live-observation faktiskt är praktiskt genomförbar) är
"checkpoint-lösning" den TEKNISKT enklaste att lägga till senare (ett nytt,
valfritt lärstigsstegsfält som kräver att ett zonbyte redan registrerats innan
"Nästa steg" aktiveras) — men det bedöms inte motiverat för det här scenariot.

---

## 5. Avsteg

1. **Punkt 2:s fix utökad till att även omfatta steg 4–5**, inte bara 6–7 som PO
   uttryckligen flaggade — samma grundorsak, upptäckt vid undersökningen (se
   avsnitt 1). Bedömt som en nödvändig konsekvens av "undersök", inte en
   självpåtagen utökning av uppdraget.
2. **Steg 7:s instruktionstext om "Stega 1" skrevs om efter simuleringsfyndet**
   att zonbytena sker inom 6 steg — ursprunglig formulering ("vänta tills PV
   närmar sig 25") hade gett en missvisande förväntan. Se avsnitt 1/4.
3. **Ingen ny funktionalitet utöver de fem punkterna** har lagts till, i linje
   med uppdragets uttryckliga avgränsning — bl.a. ingen låsning av
   10-stegsknappen (analyserad, inte implementerad, se avsnitt 4).
4. **Ingen automatiserad test skriven för den nya UI-logiken** (badge,
   fälthighlight, zonbytesmarkeringar) — dessa körs i DOM-lagret (`app.js`), och
   projektets etablerade testkonvention testar aldrig `app.js` direkt i Node
   (bara den DOM-fria `sim-core.js`). Verifierat genom kodgranskning och genom
   att den underliggande `scheduleZone()`-logiken redan är testad i
   `tests/feat-042-gain-schedule.test.mjs`. Kvarstående manuell
   webbläsarverifiering, se avsnitt 3.

---

## 6. Rekommendation om merge

**Redo för PO:s fördjupade granskning på branchen — fortsatt INTE mergad, i
linje med tidigare beslut.**

De fem punkterna är åtgärdade och simuleringsverifierade där det går att
verifiera utan webbläsare. Den enda kvarstående blockeraren för ett
mergebeslut är detsamma som i ursprungsrapporten: **ingen webbläsartest är
genomförd i den här miljön.** Given hur centrala de nya visuella elementen
(badge, fälthighlight, markeringslinjer) är för just det PO efterfrågade,
rekommenderas att PO specifikt verifierar:
- Att badgen och fälthighlighten faktiskt syns och byter färg/text korrekt.
- Att steg 6→7-övergången nu behåller Parameterstyrning aktiverad utan manuell
  åtgärd.
- Att markeringslinjerna för zonbyte dyker upp i grafen och att deras etiketter
  är läsbara/inte överlappar andra markeringar.

Om dessa tre punkter ser korrekta ut vid manuell test bedöms branchen redo för
merge till `develop`.
