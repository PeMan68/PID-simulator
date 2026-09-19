# STRAT-005 — Designspecifikation: Framkoppling (Feedforward)

**Datum:** 2026-09-19
**Uppdragsgivare:** PO (uppföljning på STRAT-004)
**Typ:** Designspecifikation — inget kodarbete, ingen branch
**Beslut från PO:** `auxSignal` representerar en BESTÅENDE lastförändring —
ligger kvar tills studenten återställer systemet eller ändrar lasten igen.
Detta löser STRAT-004s öppna fråga (avsnitt 3.1/7) och förenklar designen
väsentligt (se avsnitt 1).
**Underlag:** `docs/reports/STRAT-004_FORSTUDIE-FRAMKOPPLING.md`,
`apps/app/sim-core.js`, `apps/app/app.js` (`triggerPulse()`,
markeringsmekaniken, `drawChart()`)

---

## 1. Konsekvens av PO:s beslut: en enklare design än STRAT-004 skisserade

STRAT-004 lämnade `auxSignal.profile` öppet mellan `"step"`/`"ramp"`/`"sine"`.
Med PO:s beslut — en BESTÅENDE förändring — faller ramp/sine bort naturligt:
en sinusvåg är per definition inte beständig, och en ramp som sedan ska
"ligga kvar" är egentligen två beteenden i ett. **`auxSignal` är alltid ett
steg** — det förenklar schemat, UI:t och simuleringslogiken jämfört med
STRAT-004s mer öppna skiss, helt i linje med projektets etablerade princip
(FEAT-042: "exakt 3 zoner, inte N zoner" — här: "ett stegformat, inte tre
profiler").

Interaktionsmönstret blir därmed nästan identiskt med `triggerPulse()`/
"Trigga puls" — med EN skillnad: pulsen återgår automatiskt till 0 efter
`durationSteps` steg, medan lasten INTE gör det. Den ligger kvar tills:
(a) "Återställ system" klickas, eller (b) studenten ändrar lastfältets värde
och klickar "Trigga last" igen (ersätter det aktiva värdet, inklusive att
sätta det till 0 för att ta bort lasten).

---

## 2. Scenarioformat

Nytt toppnivåfält, strukturellt parallellt med men medvetet SKILT från
`disturbance` (som redan betyder "omätbar" i appens etablerade vokabulär):

```json
"auxSignal": {
  "magnitude": 20.0
},
"process": {
  "type": "self_regulating",
  "K": 1.3, "T": 15.0, "L": 0.0, "normalValue": 0.0,
  "measurementRange": { "min": 0.0, "max": 100.0 },
  "auxGain": 0.8
},
"controller": {
  "mode": "pid", "kp": 1.2, "ti": 20.0, "td": 0.0,
  "outputLimits": { "min": 0.0, "max": 100.0 },
  "kff": 0.0
}
```

- **`auxSignal.magnitude`** — det värde lasten antar NÄR den triggas (i samma
  0–100-normaliserade skala som allt annat i appen, PED-003C). Inget
  `enabled`-fält — till skillnad från Parameterstyrningens
  på/av-kryssruta finns här ingen "läge", bara ETT triggat värde som antingen
  är 0 (aldrig triggad/återställd) eller det senast triggade talet.
- **`process.auxGain`** — hur starkt lasten fysiskt påverkar processen
  (processens EGEN egenskap, som K). Separat namn (inte "K2" eller liknande)
  för att aldrig kunna förväxlas med huvudförstärkningen K i hjälptext eller
  lärstig.
- **`controller.kff`** — regulatorns framkopplingsförstärkning. Kan vara
  NEGATIV (se avsnitt 6, simuleringsexempel, för varför — icke-uppenbart och
  värt att förklaras explicit i hjälptexten).

**Simuleringskärnans förändring** (beskrivning, ingen kod skrivs i denna
specifikation):
- `Simulation` får ett nytt tillståndsfält `auxValue` (startar på 0),
  motsvarande hur `pulseStepsLeft` redan hanterar pulsens aktiva tillstånd —
  men utan nedräkning, eftersom lasten inte har någon varaktighet.
- Ny metod `triggerAuxSignal()` sätter `this.auxValue = this.scenario.auxSignal.magnitude`
  — ETT anrop, ingen räknare. Att klicka igen med ett nytt fältvärde ersätter
  helt enkelt `auxValue`.
- `reset()` nollställer `auxValue` till 0 — matchar PO:s "återställer
  systemet".
- **"Rensa graf" nollställer INTE `auxValue`** — samma princip som redan
  gäller för `sim.stepNo`/processens tillstånd där (FEAT-043s motsvarande
  beslut för `maxSteps`): Rensa graf är inte en full återställning.
- `ProcessModel.step()`: lastens bidrag adderas till processens drivande
  term, genom SAMMA T som huvudprocessen (ingen egen lasttidskonstant, se
  STRAT-004 avsnitt 6 — medveten förenkling): `... + auxGain × auxValue`.
  **Ingen diskontinuitet i y** vid en ny triggning — precis som FEAT-042s
  K-zonbyten påverkar bara `dy/dt`, aldrig ett hopp i själva PV-kurvan.
- `PIDController.step()` får en ny, valfri parameter (feedforward-termen),
  adderad till `raw` INNAN klippning mot `outputLimits` — så att
  anti-windup-logiken (som redan kollar mot den KLIPPTA, kombinerade
  utsignalen) korrekt ser om PID+framkoppling TILLSAMMANS mättar
  utsignalen, inte bara PID-delen för sig.
- **Ingen bumplös övergång behövs för framkopplingstermen.** En ny
  triggning ger ett OMEDELBART hopp i `u` — det är AVSIKTLIGT och
  pedagogiskt önskvärt (hela poängen med framkoppling är att reagera
  omedelbart på en mätbar störning, inte mjukt fasa in det). Detta skiljer
  sig medvetet från FEAT-042s zonbyten (som BEHÖVDE bumplös övergång
  eftersom zonbyten är en teknisk UI-detalj, inte själva
  reglerstrategins poäng).

---

## 3. UI

Väsentligt mindre omfattande än FEAT-042 — ingen zontabell behövs eftersom
framkoppling inte har zoner. Tre nya, ENSKILDA fält, ett per befintlig
parametergrupp — matchar exakt var deras motsvarande begrepp redan bor:

- **Process-gruppen:** nytt fält "Lastförstärkning" (`auxGain`), direkt
  under K/T/L — processens egen egenskap, hör hemma där.
- **Regulator-gruppen:** nytt fält "Kff" (framkopplingsförstärkning), direkt
  under Kp/Ti/Td — regulatorns egen inställning, hör hemma där. Tillåter
  negativa värden (till skillnad från Kp, som är UI-tvingat positivt) — se
  avsnitt 6.
- **Störningar-gruppen:** nytt fält "Last mag" + ny knapp "Trigga last",
  direkt bredvid befintliga Puls mag/Puls steg/Trigga puls — samma
  visuella familj, samma interaktionsmönster studenten redan känner igen
  från `storningar-robusthet.v1`.

Tre enskilda fält, ingen gruppering/tabell krävs (FEAT-044s lärdom var
specifikt om ATT GRUPPERA NÄR ANTALET FÄLT BLIR STORT — 3 fysiskt åtskilda,
konceptuellt distinkta fält i tre OLIKA grupper är inte samma situation som
FEAT-042s 11+5 sammanhängande zonfält i SAMMA grupp).

"Trigga last"-klicket lägger, precis som "Trigga puls" redan gör, en
markeringslinje i grafen (`sim.history.markers.push(...)`) — samma
etablerade mekanism, ny etikett: t.ex. `"Last → 20"` (visar det nya värdet,
till skillnad från pulsens enkla `"Puls"`-etikett, eftersom lastens exakta
NIVÅ är pedagogiskt relevant på ett sätt pulsens magnitud inte är).

---

## 4. Grafpresentation

Lastsignalen ritas som en TREDJE linje i den redan existerande ÖVRE panelen
(PV/SP), som STRAT-004 rekommenderade — delar 0–100-skalan, ingen ny panel,
ingen ändring av `drawChart()`s fasta tvåpanels-layout. Egen färg (förslag:
en fjärde, ännu oanvänd accentfärg — grafen har redan blå=PV, röd
streckad=SP, grön=u i nedre panelen; lastlinjen bör vara visuellt distinkt
från alla tre, t.ex. lila streckad-punkt, `#8e44ad`, redan använd för
tangentlinjen i Mätläge men aldrig i huvudgrafen utanför Mätläge — säkert
att återanvända).

Linjen ritas OVILLKORLIGT när scenariot har ett `auxSignal`-fält (ingen
`enabled`-kryssruta att villkora mot, se avsnitt 2) — en flat linje vid 0
innan första triggningen är harmlöst, samma princip som SP-linjen alltid
visas även innan den ändrats.

**Ny historik-serie:** `sim.history.aux`, fylld med `auxValue` varje steg —
samma mönster som `p`/`i`/`d` redan lagras som egna arrayer.

---

## 5. Lärstig

Samma tredelade struktur som STRAT-004 skissade och FEAT-042 bevisade
fungera väl, nu med PO:s beslutade permanenta semantik och FEAT-042s tre
lärdomar inbyggda FRÅN BÖRJAN (inte tillagda efter ett användartest):

1. **Visa problemet — PID ensam.** Process i stabilt läge vid SP. Trigga
   lasten (Kff=0). Mät (Mätläge + 2 %-toleransband, FRÅN FÖRSTA
   INSTRUKTIONSUTKASTET) hur långt PV avviker och hur många steg det tar
   innan PID hämtat in avvikelsen. Notera avvikelsens storlek OCH
   insvängningstiden, namngivna (A, B) för senare jämförelse.
2. **Visa gränsen — ren framkoppling, fel Kff.** Kp≈UI-minimum (0.1),
   Ti=Td=0, Kff satt till ett MEDVETET FEL värde (t.ex. halva det teoretiskt
   korrekta, se avsnitt 6) — trigga samma last, visa att avvikelsen
   minskar jämfört med steg 1 men inte försvinner, och att systemet inte
   återgår exakt till SP (kvarstående fel, eftersom ingen återkoppling
   finns kvar för att städa upp Kff-felet). Namngivet mätvärde C.
3. **Lösningen — PID + framkoppling, korrekt Kff.** Full PID återställd,
   Kff satt till (nära) det teoretiskt korrekta värdet. Trigga samma last
   — avvikelsen ska vara MÄRKBART mindre än A, och insvängningstiden
   märkbart kortare än B. Namngivna D, E.

Varje steg använder EN EGEN, DEDIKERAD scenariofil (matchar FEAT-042s
huvudlärdom exakt) — inte manuellt ändrade fält som förväntas överleva en
scenario-omladdning mellan lärstigssteg.

**Checkpoint-förslag** (samma mönster som FEAT-042 — reflekterande fråga på
det andra/tredje steget i varje jämförelsepar, inte på det första):
- Efter steg 1: ingen (rent referensvärde).
- Efter steg 2: "Varför försvinner inte avvikelsen helt, trots att
  framkoppling är aktiv?" — svar: fel Kff ger fel kompensationsnivå, och
  utan återkoppling finns inget som korrigerar det kvarstående felet.
- Efter steg 3: "Varför är kombinationen bättre än endera strategin för
  sig?" — svar: framkoppling ger snabb, nästan omedelbar delkompensation;
  återkoppling städar upp resten och garanterar rätt slutvärde även om
  Kff inte är perfekt.

---

## 6. Övningsuppgifter

Samma mönster som `ovningar-parameterstyrning.md` — 2 grundläggande + 2
utforskande, ingen fördjupnings-/mästarnivå:

1. **Grundläggande 1 — se skillnaden.** Samma process/last som lärstigen,
   student kör PID-ensam kontra PID+korrekt-Kff, mäter (Mätläge + 2 %-band)
   och jämför avvikelse/insvängningstid.
2. **Grundläggande 2 — över- och underkompensation.** Student provar tre
   Kff-värden (för lågt, korrekt, för högt) mot samma last, ser att för
   HÖGT Kff ger en ÖVERSLÄNG ÅT ANDRA HÅLLET (inte bara "mindre bra" —
   en konkret, mätbar, och för nybörjare icke-uppenbar poäng: framkoppling
   kan överkompensera lika lätt som underkompensera).
3. **Utforskande 1 — hitta rätt Kff själv.** Student får processens
   K/T/auxGain (som siffror i uppgiftstexten, INTE facit-Kff) och ska
   räkna/prova sig fram till ett Kff som eliminerar avvikelsen vid
   triggning — kopplar direkt till formeln i avsnitt 6 nedan, applicerad
   i praktiken.
4. **Utforskande 2 — framkoppling mot en omätbar störning.** Student
   aktiverar SAMTIDIGT brus/puls (omätbar, `disturbance`) OCH lasten
   (mätbar, `auxSignal`), ser att framkopplingen bara kompenserar den
   MÄTBARA delen — PID:s återkoppling är fortfarande ensam ansvarig för
   den omätbara delen. Direkt kopplad till `storningar-robusthet.v1`s
   redan etablerade poäng, nu sedd från framkopplingens perspektiv.

---

## 7. Simuleringsexempel (riktvärden — kräver verifiering vid byggtillfället)

**Process (förslag, samma etablerade K/T/L-mönster som nästan alla
scenarier redan använder):** self_regulating, K=1.3, T=15, L=0,
normalValue=0, SP=50 (processen redan i stabilt läge vid SP innan lasten
triggas — matchar `storningar-robusthet.v1`s etablerade demo-upplägg).

**auxGain (lastens egen påverkan på processen):** förslag 0.8 — samma
storleksordning som K, så att lasten är en SIGNIFIKANT, tydligt synlig
störning (inte försumbar, inte process-dominerande).

**Teoretiskt korrekt Kff — icke-uppenbar poäng, viktig att förklara
explicit:** för att en framkopplingsterm ska EXAKT kompensera lastens
effekt på processen (`K × kff × auxValue = -auxGain × auxValue`) krävs:

```
kff_korrekt = -auxGain / K
```

Med förslagsvärdena ovan: `kff_korrekt = -0.8 / 1.3 ≈ -0.62`. **Notera det
NEGATIVA tecknet** — en positiv laststörning (auxValue>0, pressar PV UPPÅT)
kräver att regulatorn MINSKAR sin utsignal för att hålla PV vid SP, inte
öka den. Detta är precis den typen av "icke-uppenbar poäng" projektets
lärstigar redan aktivt söker efter (jfr STRAT-003s Kp=5/1.2-kontrast) —
värt en egen mening i hjälptexten för `kff`-fältet, annars är risken stor
att studenter (och en framtida utvecklare som väljer testvärden) förväntar
sig ett positivt tal.

**Steg 2:s "medvetet fel Kff":** förslag halva det korrekta värdet
(≈ −0.31) — tillräckligt fel för att ge en tydligt mätbar kvarstående
avvikelse, inte så fel att det blir förvirrande.

Samtliga siffror ovan är ARBETSHYPOTESER — de MÅSTE köras genom
`tests/simulation/` och justeras precis som FEAT-042s K/Kp-par gjorde
(0.5/2.5/5/1.2 var inte de ursprungligen gissade talen heller) innan de
låses fast i en lärstig eller ett övningsdokument.

---

## 8. Sammanfattande avsteg från STRAT-004

1. **`auxSignal.profile` bortfaller helt** — bara steg-formatet finns,
   direkt konsekvens av PO:s "permanent"-beslut (se avsnitt 1).
2. **Inget `enabled`-fält på `auxSignal`** — till skillnad från
   Parameterstyrningens/ventilkarakteristikens på/av-kryssrutor finns här
   bara ett triggat värde, eftersom det inte finns någon meningsfull
   "avstängd men konfigurerad"-mellanposition för en engångstriggad,
   beständig last.
3. **Ingen bumplös övergång för framkopplingstermen** — motiverat i
   avsnitt 2 som en AVSIKTLIG skillnad mot FEAT-042s zonbyten, inte ett
   förbiseende.
4. **Ingen zontabell/gruppering i UI** — tre enskilda fält i tre olika,
   redan existerande grupper är inte samma situation som FEAT-042s
   sammanhängande zonfält; FEAT-044s lärdom (gruppera när det blir
   MÅNGA fält i SAMMA grupp) gäller inte här.

Ingen kod är skriven, ingen branch skapad — detta är en designspecifikation.
