# UX-002 — Systematisk synlighetsgranskning

**Datum:** 2026-09-20
**Uppdragsgivare:** PO (efter tredje testomgången av UX-002)
**Typ:** Analys/rekommendation — INGEN kod, ingen branch (per uppdragets explicita instruktion)
**Underlag:** `apps/app/app.js` (`APPLICATION_PROFILES`, `applyApplicationProfile()`,
`deriveApplicationProfile()`, `updateControllerUIState()`, `updateProcessUIState()`),
`apps/app/sim-core.js` (var i simuleringen Kff/gainSchedule/nonlinearGain faktiskt
används, per läge/processtyp), samtliga 12 DEV-lärstigars scenarioreferenser
(körda genom `deriveApplicationProfile()` programmatiskt, inte gissat)

---

## 1. Bedömning: ska Tvålägesreglering finnas kvar?

**Rekommendation: C — integrera i de övriga tillämpningarna, ta bort som egen tillämpning.**

### Vilket problem löser den, jämfört med övriga tillämpningar?

Temperaturprocess/Nivåprocess/Blandnings-/kvotprocess/Kaskadreglerad process
beskriver alla **vilken fysisk process/kontext** studenten arbetar med — det
är den gemensamma axeln (se UX-001 avsnitt 1). "Tvålägesreglering (On/Off)"
beskriver istället **vilken regulatorstrategi** som används — samma
konceptuella nivå som att välja Läge=P eller Läge=PID. Den ligger alltså på
FEL AXEL. Läge har redan en egen, dedikerad väljare för exakt detta val.

PO:s iakttagelse är sakligt korrekt: **on/off är inte kopplat till en viss
processdynamik.** Jag verifierade det i `sim-core.js` — `Simulation.step()`
grenar på `mode === "onoff"` helt oberoende av `process.type`; ingenting i
`OnOffController` eller `ProcessModel` förhindrar eller kräver en viss
processmodell. Att `onoff`-profilen idag utesluter Integrerande
(`processModels: ["self_regulating", "self_regulating_2"]`) saknar alltså
reglerteknisk grund — en pump som slås på/av baserat på tanknivå är ett
fullt normalt on/off-exempel på en INTEGRERANDE process.

### Vilka lärstigar skulle faktiskt använda den?

Kördes programmatiskt genom samtliga 12 lärstigars scenarioreferenser (se
tabellen i avsnitt 4). Resultat: **exakt ETT steg** i hela innehållet
härleds till `onoff` — `oppen-slinga-onoff-p.v1` steg 4
(`onoff-basic.json`). Steg 2 i samma lärstig (`manual-open-loop.json`,
Manuellt läge) och steg 5 (`p-step-self-regulating.json`, P-läge) härleds
båda till `fri` — dvs. lärstigen är REDAN en blandad, generisk
grundlärstig (bekräftat i UX-001 avsnitt 4.1) där on/off bara är ETT av tre
introducerade begrepp, inte lärstigens egen tillämpning. Ingen annan
lärstig berörs alls.

### Ger den verkligt UX-värde, eller bara komplexitet?

Bara komplexitet: en fjärde tillämpning, en extra `modes`-restriktion, och
(se avsnitt 2/4) en felaktig utesluten Processmodell — för att täcka ETT
enda, redan generiskt lärstigssteg. Att i stället LÅTA OnOff vara ett giltigt
Läge-val INOM Temperaturprocess och Nivåprocess (utöver Fri utforskning, där
det redan är tillåtet) ger samma pedagogiska täckning utan en tillämpning
som inte betyder något på samma axel som de andra.

### Konkret ändring om C antas

- Ta bort `onoff`-nyckeln ur `APPLICATION_PROFILES` och alternativet
  `<option value="onoff">` i `#applicationProfile`.
- Lägg till `"onoff"` i `temperatur.modes` och `niva.modes` (båda blir då
  `["onoff", "p", "pi", "pid", "manual"]`).
- Ta bort raden `if (scenario.controller.mode === "onoff") return "onoff";`
  ur `deriveApplicationProfile()` — `onoff-basic.json` faller då tillbaka på
  `fri`, korrekt eftersom scenariot ändå är generiskt (självregl.,
  ingen substansberättelse).

---

## 2. Felaktiga eller tveksamma synlighetskombinationer

### 2.1 BEKRÄFTAD BUGG — Framkopplingsfälten saknar Läges-villkor

**Detta är orsaken till BÅDA PO:s exempel** ("Fri utforskning + OnOff visar
Lastförstärkning och Kff", "OnOff visar framkopplingsrelaterade
parametrar").

Grundorsak, verifierad i `sim-core.js`: Kff/framkoppling appliceras BARA i
den gren av `Simulation.step()` som hanterar P/PI/PID
(`const feedforward = (this.scenario.controller.kff || 0) * this.auxValue;`
ligger inne i samma `else`-gren som `PIDController.step()`-anropet — aldrig
nått för `manual`/`onoff`). Kff/Lastförstärkning/Last mag har alltså
**exakt noll effekt** i Manuellt eller OnOff-läge.

Trots det styrs Framkopplingens `data-addon="framkoppling"`-fält (avsnitt
2.2 i `apps/app/app.js`) ENDAST av Tillämpning, aldrig av Läge. Så fort en
Tillämpning tillåter tillägget "framkoppling" (Fri utforskning eller
Temperaturprocess) förblir fälten synliga oavsett Läge — inklusive
Manuellt och OnOff, där de är meningslösa.

**Jämförelse — Parameterstyrning har REDAN detta skydd** (pre-existing,
FEAT-042, oberoende av mitt UX-002-arbete):
`updateControllerUIState()` sätter redan
`document.getElementById("gainScheduleField").style.display = noIntegral ? "none" : "";`
där `noIntegral = isP || isManual || isOnOff` — Parameterstyrning döljs
alltså redan korrekt för Manuellt/OnOff (och P, se 2.3). Framkoppling fick
aldrig motsvarande skydd när FEAT-045 byggdes, och UX-002s nya
tillämpningsstyrda döljning ärvde samma lucka istället för att täppa till
den.

**PO:s exempel "Lärstig steg 2 visade OnOff + Kff + Bumpless samtidigt":**
Bumpless-delen bör redan vara åtgärdad (föregående commit döljer Bumpless
vid Läge=OnOff) — värt att du bekräftar att den håller. Kff-delen är den
HÄR buggen. Reproduktionsvägen är sannolikt: ladda `onoff-basic.json` (ger
korrekt `onoff`-tillämpning idag, se avsnitt 4), byt sedan MANUELLT
Tillämpning till Fri utforskning/Temperaturprocess utan att ladda om
scenariot — Läge förblir OnOff (inget i den bytet tvingar om Läge, eftersom
`fri`/`temperatur` båda tillåter `onoff` som läge), men nu tillåter den nya
Tillämpningen framkopplings-tillägget → Kff blir synligt.

### 2.2 Designfråga — Tvålägesregleringens uteslutning av Integrerande

Redan behandlad i avsnitt 1 — löses av rekommendationen där, inte en separat
punkt att åtgärda.

### 2.3 Observation, INTE en ny bugg — Parameterstyrning döljs även för P-läge

`noIntegral`-villkoret (`isP || isManual || isOnOff`) döljer Parameterstyrning
även när Läge=P. Jag kontrollerade `sim-core.js`: zonuppslaget för Kp sker
FÖRE P-lägets Ti/Td nollas (`if (mode === "p") { gti = 0; gtd = 0; ... }`
körs EFTER `gkp = z.kp` redan satts) — ett zonschemalagt Kp SKULLE alltså
kunna vara meningsfullt även i P-läge. Detta är dock **oförändrat sedan
FEAT-042** (inte en regression från UX-002) och FEAT-042s egen lärstig
använder aldrig P-läge med Parameterstyrning. Flaggar det eftersom
uppdraget bad om en fullständig granskning, men rekommenderar INGEN ändring
här utan ett separat PO-beslut — det är utanför UX-002s egentliga scope.

### 2.4 Kontrollerad, bedömd korrekt — Parameterstyrning saknar Processmodell-villkor

Till skillnad från Ventilkarakteristik (kräver uttryckligen
Självreglerande, se `updateProcessUIState()`s `isSelfRegulating`-villkor)
har Parameterstyrning INGET Processmodell-villkor — kan visas/aktiveras
även för Integrerande processer. Verifierat i `sim-core.js`: zonuppslaget
är rent PV-baserat, oberoende av `process.type`. Bedömer detta som korrekt/
avsiktligt (inte en bugg) — nämns här enbart för fullständighet, eftersom
det är en asymmetri värd att känna till.

### 2.5 Kontrollerad, bedömd korrekt — Ventilkarakteristik oberoende av Läge

Ventilkarakteristik är en PROCESSEGENSKAP (ventilens karakteristik existerar
fysiskt oavsett om regulatorn är i P/PI/PID/Manuellt/OnOff) — verifierat att
`effectiveK()` i `sim-core.js` inte är lägesberoende. Korrekt som den är,
ingen ändring föreslås.

---

## 3. Rekommenderad synlighetsmatris

Utgår från REKOMMENDERAT sluttillstånd (Tvålägesreglering borttagen enligt
avsnitt 1, Framkopplingsbuggen i avsnitt 2.1 åtgärdad). "—" betyder
"villkoret gäller inte/är inte tillämpligt".

| Fält/kontroll | Styrs av | Synlighetsregel |
|---|---|---|
| Tillämpning (väljaren) | — | Alltid synlig |
| Processmodell (väljaren) | — | Alltid synlig; ALTERNATIVEN filtreras av Tillämpning |
| K, T, L, Normalvärde | Processmodell | T/Normalvärde dolda för Integrerande (oförändrat) |
| Kv, Utflöde | Processmodell | Synliga ENDAST för Integrerande (oförändrat) |
| Läge (väljaren) | — | Alltid synlig; ALTERNATIVEN filtreras av Tillämpning (efter fix: OnOff ingår i Fri/Temperaturprocess/Nivåprocess) |
| Kp | Läge | Dold för Manuell, OnOff (oförändrat) |
| Ti | Läge | Dold för P, Manuell, OnOff (oförändrat) |
| Td | Läge | Dold för P, PI, Manuell, OnOff (oförändrat) |
| Manuell u | Läge | Synlig ENDAST för Manuell (oförändrat) |
| Anti-windup | Läge | Dold för P, Manuell, OnOff (oförändrat) |
| Bumpless | Läge | Dold för OnOff (åtgärdat föregående runda) |
| Visa PB | Läge | Dold för Manuell, OnOff (oförändrat) |
| Hyst. låg/hög | Läge | Synliga ENDAST för OnOff (oförändrat) |
| SP, Umin, Umax | — | Alltid synliga (oförändrat) |
| Brus std, Puls mag, Puls steg, Trigga puls | — | Alltid synliga, alla lägen/processmodeller (oförändrat — omätbar störning är universell) |
| Lastförstärkning (auxGain) | Tillämpning + **Läge (NY)** | Synlig när Tillämpning tillåter "framkoppling" OCH Läge ∈ {P, PI, PID} |
| Kff | Tillämpning + **Läge (NY)** | Samma regel som Lastförstärkning |
| Last mag + Trigga last | Tillämpning + **Läge (NY)** | Samma regel |
| Parameterstyrning (kryssruta + zonfält) | Tillämpning + Läge | Synlig när Tillämpning tillåter "parameterstyrning" OCH Läge ∈ {PI, PID} (oförändrat, se 2.3 om P-undantaget) |
| Olinjär ventilkarakteristik (kryssruta + zonfält) | Tillämpning + Processmodell | Synlig när Tillämpning tillåter "ventilkarakteristik" OCH Processmodell = Självreglerande (enkapacitiv) — oberoende av Läge (oförändrat) |

**Ingen konflikt/tvetydighet hittad** mellan dessa regler — varje fält har
exakt en tillämplig regel, ingen överlappning där två regler skulle kunna ge
motstridiga resultat.

---

## 4. Identifierade lärstigsproblem

Samtliga 12 lärstigars scenarioreferenser kördes programmatiskt genom
`deriveApplicationProfile()` (inte manuellt genomläst/gissat) — se full
utskrift i leveransen. Sammanfattning:

| Lärstig | Härledd(a) tillämpning(ar) | Bedömning |
|---|---|---|
| `kom-igång.v1` | Fri (alla 5 steg) | OK |
| `oppen-slinga-onoff-p.v1` | Fri, Fri, **OnOff**, Fri | Steg 4 blir `fri` efter avsnitt 1:s ändring — konsekvent med lärstigens övriga, redan generiska steg |
| `proportionalband-forstarkning.v1` | Fri (alla steg) | OK |
| `pi-pid.v1` | Fri (alla steg) | OK |
| `parameterstyrning-ventilkarakteristik.v1` | Temperaturprocess (alla 6 scenariosteg) | OK, konsekvent genomgående |
| `processbegransningar.v1` | Fri (alla steg) | OK |
| `windup-antiwindup.v1` | Fri (alla steg) | OK |
| `storningar-robusthet.v1` | Fri (alla steg, inkl. `continueFromPreviousStep`) | OK |
| `integrerande-process-niva.v1` | Nivåprocess | OK |
| `stegsvar-identifiering.v1` | Fri (alla steg) | OK |
| `lambda-metoden.v1` | Fri (alla steg) | OK |
| `framkoppling.v1` | Temperaturprocess (alla 3 scenariosteg) | OK, konsekvent genomgående |

**Slutsats: härledningslogiken (`deriveApplicationProfile()`) fungerar
korrekt för samtliga lärstigar redan idag** — inget lärstigssteg härleder
till en felaktig eller inkonsekvent tillämpning/processmodell-kombination
när det LADDAS. Det enda faktiska problemet i denna del är
Tvålägesreglering-taggningen av `oppen-slinga-onoff-p.v1` steg 4, som löses
av avsnitt 1:s rekommendation, inte av någon ytterligare lärstigsändring.

**Viktigt förtydligande om PO:s Kff/Bumpless-exempel:** det uppstår INTE av
att en lärstig laddar fel tillstånd — det uppstår när en student, EFTER att
ett steg laddats korrekt, manuellt byter Läge eller Tillämpning (fri
utforskning inom eller efter en lärstig). Det är alltså inte ett
lärstigsinnehålls-problem utan UI-logikens (avsnitt 2.1), och påverkar i
princip vilket lärstigssteg som helst där studenten experimenterar fritt
efteråt — inte bara `oppen-slinga-onoff-p.v1`.

---

## 5. Rekommendation om nästa åtgärd innan UX-002 mergas

**Inte redo för merge.** Två konkreta ändringar krävs, båda små och väl
avgränsade:

1. **Ta bort Tvålägesreglering som egen tillämpning** (avsnitt 1) — ta bort
   `onoff`-profilen och dess `<option>`, lägg till `"onoff"` i
   `temperatur.modes`/`niva.modes`, ta bort motsvarande rad i
   `deriveApplicationProfile()`.
2. **Lägg till Läges-villkor på Framkopplingens `data-addon`-fält**
   (avsnitt 2.1/3) — synliga bara när Läge ∈ {P, PI, PID}, oavsett
   Tillämpning. Samma mönster som redan finns för Parameterstyrning
   (`noIntegral`), bör återanvändas snarare än uppfinnas på nytt.

Ingen av ändringarna rör `sim-core.js`, scenarioformat eller några
befintliga lärstigsfiler. Efter implementation: kör om
`tests/ux-002-application-profile.test.mjs` (uppdaterad med nya kontroller
för båda punkterna) + full regression, och be om en FJÄRDE
granskningsrunda innan mergebeslut — särskilt att kombinationen
"Temperaturprocess/Fri utforskning + Läge=OnOff/Manuellt" nu korrekt döljer
Kff/Lastförstärkning/Last mag.

Väntar på klartecken innan jag implementerar, per uppdragets instruktion.
