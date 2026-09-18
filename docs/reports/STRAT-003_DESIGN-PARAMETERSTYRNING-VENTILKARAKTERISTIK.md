# STRAT-003 — Designspecifikation: Parameterstyrning + olinjär ventilkarakteristik

**Datum:** 2026-09-18
**Uppdragsgivare:** PO (uppföljning på STRAT-001/STRAT-002)
**Typ:** Designspecifikation — inget kodarbete, ingen branch
**Underlag:** `docs/reports/STRAT-001_FORSTUDIE-REGLERSTRATEGIER.md`,
`docs/reports/STRAT-002_ICKE-LINJAR-PROCESSMODELL.md`, `apps/app/sim-core.js`,
`apps/app/app.js` (`syncParamsFromUI`, `updateControllerUIState`, `drawChart`,
markeringslinje-mekaniken från FEAT-030, hjälplinje-mekaniken från FEAT-038,
bumplös övergång från manuell/auto-läge)

---

## 1. Rekommenderad slutdesign

### 1.1 Gemensam mekanism: en fast 3-zons brytpunktstabell

Både Parameterstyrning (regulatorns Kp/Ti/Td) och ventilkarakteristik (processens K)
löses av **samma lilla, fasta mekanism**, inte två separata system — det var STRAT-002s
kärnrekommendation. Designen låser explicit ett antal parametrar som annars skulle
kunna göras generiska, i linje med uppdragets "prioritera enkelhet":

- **Exakt 3 zoner, alltid.** Inte 2, inte N. Tre zoner ger en meningsfull
  låg/mellan/hög-berättelse och tvingar fram minst en verklig "byt schema
  mitt i förloppet"-situation, men är fortfarande triviala att rita, testa och
  validera. Inget UI för att lägga till/ta bort zoner — de tre fälten finns alltid,
  aktiva eller inte.
- **2 brytpunkter**, `breakpoint1 < breakpoint2`, i samma 0–100-skala som allt annat i
  appen.
- **Skarp (inte interpolerad) zonövergång.** Zonens värde gäller rakt av så fort
  driftpunkten passerat brytpunkten — ingen linjär övertoning mellan zoner. Interpolering
  hade varit en rimlig "mjukare" lösning, men lades medvetet bort: den kräver egen
  logik, egna testfall och egen pedagogisk förklaring, för ett resultat som är svårare
  att läsa av i en lärstig ("varför är Kp 1.63 just nu?") än ett diskret zonbyte
  ("nu är vi i Zon 2, Kp=1.8"). Se avsnitt 3 för hur den skarpa övergången ändå hålls
  stötfri på regulatorsidan.
- **Driftpunktsvariabeln är fast per användning, inte valbar i UI:**
  - Regulatorns schema (Parameterstyrning) är **alltid** keyed på PV. Det är den
    vedertagna, vanligaste formen av gain scheduling och kräver ingen ny signal —
    PV finns redan i varje simuleringssteg.
  - Processens schema (ventilkarakteristik) är **alltid** keyed på `u` (regulatorns
    utsignal efter ev. dötidsfördröjning — fysikaliskt "ventilställning") när
    `process.type === "self_regulating"`. `u`/`ud` finns redan i varje steg och i
    historiken.

  Ingen dropdown för "vilken variabel ska styra schemat" — valet är hårdkodat per
  användningsfall. Det är precis den sortens flexibilitet uppdraget bad att undvika.

### 1.2 Scenarioformat

Båda är **valfria, bakåtkompatibla tillägg**. Scenarier som saknar fälten (samtliga 24
nuvarande) beter sig exakt som idag.

```
"controller": {
  "kp": 1.2, "ti": 20.0, "td": 3.0,     // oförändrade — används som Zon 2 (mellan) om
                                         // gainSchedule saknas ELLER är avstängt
  "gainSchedule": {
    "enabled": false,
    "breakpoint1": 33,
    "breakpoint2": 66,
    "zones": [
      { "kp": 0.8, "ti": 25.0, "td": 2.0 },   // PV < breakpoint1
      { "kp": 1.2, "ti": 20.0, "td": 3.0 },   // breakpoint1 ≤ PV < breakpoint2
      { "kp": 2.0, "ti": 15.0, "td": 4.0 }    // PV ≥ breakpoint2
    ]
  }
}
```

```
"process": {
  "K": 1.3, "T": 15.0, "L": 0.0,        // oförändrade — används om nonlinearGain
                                         // saknas eller är avstängt
  "nonlinearGain": {
    "enabled": false,
    "breakpoint1": 33,
    "breakpoint2": 66,
    "zones": [0.6, 1.3, 2.4]             // K-värden, en per zon — bara K varierar,
  }                                       // T och L förblir konstanta
}
```

`nonlinearGain` stöds bara för `process.type === "self_regulating"` i det här
uppdraget (se avsnitt 6 för `integrating`/konisk tank). `tests/validate-content.mjs`
utökas med: `breakpoint1 < breakpoint2`, exakt 3 element i `zones`, samt ett fel om
`nonlinearGain.enabled` sätts på en processtyp som inte stöds.

### 1.3 Simuleringskärnan (`sim-core.js`) — beskrivning, ingen kod

- En liten, ren hjälpfunktion, t.ex. `scheduleZone(x, breakpoint1, breakpoint2)` →
  returnerar zonindex 0/1/2. Återanvänds identiskt av regulator- och
  processschemat — den enda nya logiken som delas, exakt STRAT-002s poäng.
- **Regulatorsidan** (`Simulation.step()`, innan `this.pid.step()` anropas): om
  `controller.gainSchedule.enabled`, slå upp aktiv zon från PV, sätt
  `this.pid.kp/ti/td` till zonens värden. Om aktiv zon **ändrats** sedan förra steget:
  trigga **samma bumplösa övergångslogik som redan finns** för
  manuell↔auto-bytet (`pid.bias`/`biasFadeSteps`/`biasFadePerStep` i `app.js`) —
  räkna ut vilken bias som gör att `u` inte hoppar vid bytet, och fasa ut den över
  några steg. Ingen ny mekanism, bara ett nytt anropsställe till en befintlig,
  redan testad idiom.
- **Processidan** (`ProcessModel.step()`): om `process.nonlinearGain.enabled`, slå
  upp aktiv zon från `ud` (utsignalen efter ev. dötid) och använd zonens K istället
  för `this.cfg.K` för just det stegets dynamik. **Ingen bumplös hantering behövs
  här** — K påverkar bara `dy/dt`, inte `y` direkt, så ett zonbyte ger aldrig ett
  hopp i själva PV-kurvan, bara en förändrad lutning. Det är en genuin förenkling
  jämfört med regulatorsidan, inte en genväg.

### 1.4 UI-fält

**Regulator-panelen**, nytt fält direkt under befintliga Kp/Ti/Td:
- Kryssruta **"Parameterstyrning"** (`gainScheduleEnabled`).
- När ikryssad: tre kompakta rader **Zon 1 / Zon 2 / Zon 3**, vardera med Kp/Ti/Td
  (samma inputbredd/stil som befintliga fält), plus två brytpunktsfält
  (**"Brytpunkt 1 (PV)"**, **"Brytpunkt 2 (PV)"**). Dolda som grupp när kryssrutan
  är av — samma `display:none`-idiom som redan används för läges-beroende fält i
  `updateControllerUIState()`. Default vid aktivering: Zon 2 förifylld med
  scenariots ordinarie Kp/Ti/Td (så att aktivering aldrig ger ett oväntat hopp),
  Zon 1/3 förifyllda med samma värden tills studenten själv ändrar dem.

**Process-panelen**, nytt fält direkt under K/T/L (bara synligt när
`processType === "self_regulating"`):
- Kryssruta **"Olinjär ventilkarakteristik"** (`nonlinearGainEnabled`).
- När ikryssad: tre K-fält (**K vid låg utsignal / K vid mellan / K vid hög
  utsignal**) plus två brytpunktsfält (**"Brytpunkt 1 (u)"**, **"Brytpunkt 2
  (u)"**) — egna, oberoende av regulatorns brytpunkter (se avsnitt 4, "Risker",
  för varför de medvetet INTE delas).

Totalt 12 nya numeriska fält + 2 kryssrutor. Inga nya paneler, inga nya
sidopanel-grupper — allt läggs i de två befintliga grupperna (Regulator, Process).

### 1.5 Statusrad och grafvisualisering

- **Statusraden** (samma `fmt1()`-rad som redan visar P/I/D): lägg till en kompakt
  post när ett schema är aktivt, t.ex. `Zon: 2 (Kp=1.8)` för regulatorschemat och/
  eller `Zon: 3 (K=2.4)` för processchemat. Syns bara när respektive kryssruta är
  ikryssad — ingen förändring av statusraden i normalläge.
- **Grafen:** brytpunkterna ritas som tunna, halvtransparenta vertikala hjälplinjer
  — exakt samma mönster (`lineWidth 1`, `globalAlpha 0.6`, togglingsbar) som
  FEAT-038s 10 %/90 %/2 %-linjer. Regulatorschemats brytpunkter (PV-baserade) ritas
  i **övre panelen** (PV/SP), processchemats brytpunkter (u-baserade) ritas i
  **nedre panelen** (u) — de hamnar naturligt i den panel vars axel de faktiskt
  avser, ingen ny panel eller skala behövs. Ingen zonfärgning/bakgrundstoning i
  detta uppdrag — bedöms som "nice to have", inte nödvändigt (se avsnitt 4).
- **Markeringslinjen** (FEAT-030s mekanism) ska trigga när en kryssruta togglas
  eller ett zon-/brytpunktsvärde ändras — lägg bara till dessa fält i
  `markerSnapshot()`/`describeMarkerChange()`, ingen ny mekanism.

---

## 2. Hur en studerande aktiverar och använder funktionen

1. Ladda ett scenario (fritt läge) eller ett lärstigssteg som redan har
   `gainSchedule`/`nonlinearGain` ifyllt men avstängt.
2. Kryssa i "Olinjär ventilkarakteristik" i Process-panelen → tre K-fält och två
   brytpunkter dyker upp, förifyllda. Kör och se att samma Kp ger olika
   svarskaraktär beroende på var i utsignalens intervall processen jobbar.
3. Kryssa i "Parameterstyrning" i Regulator-panelen → tre Kp/Ti/Td-rader och två
   brytpunkter (PV-baserade den här gången) dyker upp. Justera zonernas värden och
   kör om — se att svaret nu är jämnt bra genom hela SP-området.
4. Allt sker i realtid via samma `syncParamsFromUI()`-flöde som alla andra fält —
   ingen "Verkställ"-knapp, inget separat läge.

---

## 3. Fritt läge

Identiskt med hur varje annan parameter redan fungerar: fälten kan ändras när som
helst, även mitt i en pågående körning, och nästa simuleringssteg använder de nya
värdena direkt. Att slå av/på schemaläggning mitt i en körning är en fullt giltig,
avsiktlig användning — det är precis den bumplösa övergången i avsnitt 1.3 finns för.
Inget särskilt "schemaläggningsläge" separat från det vanliga fria läget.

---

## 4. Lärstig — pedagogisk analys

### Ska Gain Scheduling och ventilkarakteristik introduceras i samma lärstig?

**Ja.** Den pedagogiska poängen är kausal, inte parallell: ventilens olinjäritet är
**anledningen** till att en fast Kp inte räcker, och schemaläggning är **lösningen**
på just det problemet. Att dela upp dem i två separata lärstigar bryter den kedjan
och återskapar exakt det problem STRAT-002 varnade för — en Parameterstyrnings-lärstig
utan en synlig anledning att existera. Samma lärstig, tre steg i tydlig
orsak–verkan-ordning:

1. **Visa problemet, utan lösning.** Ladda processen med `nonlinearGain` aktiverat,
   fast Kp. Kör en SP-stege som tvingar utsignalen genom både låg- och
   högzonen i EN sammanhängande körning (`continueFromPreviousStep`, samma mönster
   som FEAT-030). Studenten ser: samma regulator ger tydligt olika svarskaraktär
   (t.ex. lugnt i låg zon, kraftig översläng i hög zon) trots att inget i
   regulatorn ändrats.
2. **Försök fixa det med en enda, kompromissad Kp.** Låt studenten sänka Kp för att
   tämja högzonens översläng — och se att låg zon nu blir onödigt trög. Samma
   avvägningspoäng som redan finns i `pi-pid.v1` (aggressiv kontra säker
   inställning), men nu visad som ett resultat av processens olinjäritet, inte ett
   fritt val.
3. **Introducera schemaläggning som lösningen.** Aktivera `gainSchedule`, fyll i
   zonspecifika Kp/Ti/Td, kör samma SP-stege igen i en ny, jämförbar körning. Både
   låg- och högzon presterar nu bra **samtidigt**, i en enda körning — den
   konkreta, mätbara poängen.

Detta följer samma `comparisonGroup`-mönster som redan är etablerat (`processbegransningar.v1`s försök 1/försök 2), bara utökat till tre jämförbara försök.

### Vilken ordning bör begreppen introduceras?

**Effekt före orsak före lösning:** (1) visa att svaret skiljer sig, innan
(2) förklaras varför (ventilens olinjära K(u)), innan (3) lösningen presenteras.
Att förklara ventilkarakteristiken teoretiskt först, utan att studenten redan sett
att den ger ett verkligt, synligt problem, riskerar att bli abstrakt — samma
lärdom som redan syns i hur `processbegransningar.v1` bygger förståelse genom
försök, inte genom teori-först.

### Vilket konkret scenario blir bäst första demonstrationsfall?

Ett **nytt** scenario, `self_regulating`, med `nonlinearGain` inställt så att K
skiljer tydligt mellan låg och hög zon (t.ex. en faktor 3–4×, verifierat med
`tests/simulation/` innan det låses fast — exakt samma
simuleringsverifierade-tuning-process som redan användes för PED-003E:s
dötidskontrast). Körningen ska vara en **SP-stege som passerar båda brytpunkterna
i en enda, sammanhängande graf** — den visuella poängen ("se hur kurvans karaktär
byter mitt i förloppet") kräver att båda zonerna syns i samma bild, inte två
separata körningar som studenten måste minnas och jämföra mentalt.

**Placering i katalogen:** efter `proportionalband-forstarkning.v1` och
`pi-pid.v1` (kräver Kp/PB-grunderna som redan är byggda där) — en naturlig
fortsättning, inte en ny gren.

---

## 5. Testning

- **Enhetstester** för `scheduleZone()`: gränsfall exakt på en brytpunkt, värden
  under/över hela intervallet.
- **Regulatorschema-integration:** rätt kp/ti/td tillämpas per PV-zon; bumplös
  övergång verifierad (inget hopp i `u` vid zonbyte); **bakåtkompatibilitet** —
  samtliga 24 befintliga scenarier ger byte-identiskt resultat som innan (schema
  saknas/avstängt) via samma regressionsmönster som redan finns i
  `tests/simulation/`.
- **Processchema-integration:** rätt K tillämpas per u-zon; verifiera att `y`
  förblir kontinuerlig vid zonbyte (ingen artificiell "kink").
- **Samtidigt lägesbyte + zonbyte:** ett explicit testfall för när en student byter
  regulatorläge (t.ex. manuell→PID) och korsar en zongräns i samma steg — den enda
  identifierade tekniska risken (avsnitt 6) som kräver egen verifiering.
- **Innehållsvalidering** (`tests/validate-content.mjs`): brytpunktsordning, exakt
  3 zoner, `nonlinearGain` bara tillåtet på stödda processtyper.
- **Nytt demoscenario** simuleringsverifierat innan det låses (tydlig skillnad
  låg/hög zon, verifierad övergång vid schemaläggning).
- **Manuell UI-verifiering:** fält visas/döljs korrekt, statusrad, brytpunktslinjer
  i rätt panel, markeringslinje vid ändring.

---

## 6. Bedömning: ska konisk tank (K(y) på `integrating`) ingå?

**Nej, inte i det här uppdraget — men den tekniska vägen dit lämnas öppen till
nästan ingen extra kostnad.**

Mekanismen (`scheduleZone()`, JSON-formen, `enabled`-flaggan) är identisk oavsett
om driftpunktsvariabeln är `u` (ventil) eller `y` (tank) — att låta
`process.nonlinearGain` också gälla för `process.type === "integrating"`, keyed på
`y` istället för `u`, är i praktiken samma villkor som redan måste finnas
(processtypen avgör redan idag mycket annan logik i `ProcessModel.step()`, se
`self_regulating_2`/`unstable`/`integrating`-grenarna). Att lämna den grenen
tillgänglig i koden är alltså **inte** generalisering utöver vad uppdraget redan
kräver — det är att inte i onödan stänga en dörr som kostar noll extra att hålla
öppen.

Det som **inte** ingår, och som är den faktiska kostnaden: ett andra
demoscenario, en andra simuleringsverifierad K-profil, ett andra lärstigssteg
(eller en andra lärstig), och dubblerad testbörda för att verifiera att just den
profilen visar en tydlig, trovärdig skillnad. Det är innehållsarbete, inte
arkitekturarbete — och just därför kan det göras som en **ren
uppföljningsleverans** senare (ny scenario-JSON + lärstigsinnehåll), utan att
`sim-core.js` behöver röras igen.

**Rekommendation:** bygg och leverera ventilkarakteristik + Parameterstyrning
fullt ut nu. Om koden ändå skrivs så att processtypsvillkoret (self_regulating vs.
integrating) inte är hårdkodat till bara det förstnämnda, blir konisk tank en
ren innehållsuppgift att ta upp när PO prioriterar det — inte ett nytt
arkitekturuppdrag.

---

## 7. Motiveringar (sammanfattning)

- **En delad mekanism, inte två** — direkt konsekvens av STRAT-002s fynd, halverar
  den faktiska kodmängden jämfört med att bygga featurerna var för sig.
- **Fast 3-zonsschema, ingen editor** — uppfyller uppdragets uttryckliga krav att
  undvika generiska N-zonsystem och dynamiska tabellredigerare, utan att offra den
  pedagogiska poängen (tre zoner räcker för att visa att ett globalt val inte
  räcker).
- **Skarp zonövergång + återanvänd bumplös logik** — enklare än interpolering,
  och löser stötproblemet med kod som redan finns och är testad, istället för att
  uppfinna en ny mekanism.
- **Fasta driftpunktsvariabler (ingen dropdown)** — tar bort ett helt
  konfigurationslager uppdraget inte bad om.
- **Bakåtkompatibelt by design** — `enabled: false`/fält saknas ⇒ identiskt
  beteende som idag för alla 24 befintliga scenarier.

## 8. Identifierade risker

1. **Pedagogisk risk:** en 3-zons K(u)-profil kanske inte ger en tillräckligt
   dramatisk skillnad i svarskaraktär för att vara övertygande — kräver
   simuleringsverifierad tuning (som PED-003E) innan den låses, inte en gissad
   profil.
2. **Samtidigt lägesbyte + zonbyte:** två bumplösa mekanismer (läges-bias och
   zon-bias) skulle i teorin kunna triggas samma steg — behöver explicit
   testfall och en tydlig regel för vilken som "vinner" (rekommendation: samma
   bias-fade-state återanvänds för båda, de är inte två parallella mekanismer
   utan en och samma, oavsett vad som utlöste den).
3. **UI-trängsel:** 12 nya fält i två redan befintliga paneler — mildras genom att
   de är dolda som grupp tills respektive kryssruta aktiveras (`display:none`),
   men bör ändå visuellt granskas innan release (jämförbart med hur FEAT-038s
   hjälplinjer granskades).
4. **Breakpoint-delning medvetet bortvald:** regulatorns (PV-baserade) och
   processens (u-baserade) brytpunkter delas INTE, trots att de för den framtida
   konisk tank-varianten (båda PV-baserade) skulle kunna vara samma tal. Detta är
   ett avsiktligt val för enhetlighet (samma regel oavsett processtyp), inte ett
   förbiseende — men värt att PO känner till ifall konisk tank senare gör det
   naturligt att fråga "varför två separata brytpunktspar när de råkar vara lika?"
5. **Scope creep-risk:** endast det nya demoscenariot ska ha schemaläggning
   aktiverad. Ingen av de 24 befintliga scenarierna ska retroaktivt få
   `enabled: true` som en del av detta uppdrag.

Ingen kod är skriven, ingen branch skapad — detta är en designspecifikation.
