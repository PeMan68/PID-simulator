# STRAT-004 — Förstudie: Framkoppling (Feedforward)

**Datum:** 2026-09-19
**Uppdragsgivare:** PO
**Typ:** Ren analys — inget kodarbete, ingen branch, ingen implementation
**Underlag:** `docs/reports/STRAT-001_FORSTUDIE-REGLERSTRATEGIER.md`,
`docs/reports/STRAT-002_ICKE-LINJAR-PROCESSMODELL.md`, FEAT-042s tre
granskningsrapporter (`FEAT-042_IMPLEMENTATION.md`,
`FEAT-042_ANVANDARTEST-ATGARDER.md`, `FEAT-042_SISTA-GRANSKNINGSRUNDA.md`),
`apps/app/sim-core.js`, `apps/app/app.js` (`drawChart()`, `triggerPulse()`,
marker-mekaniken)

---

## 1. Sammanfattning och rekommenderad designriktning

Framkoppling är, precis som STRAT-001 konstaterade, den arkitektoniska
vändpunkten bland de fyra strategierna — den kräver en genuint ny, MÄTBAR
signal, till skillnad från Parameterstyrning (som redan är levererad och
ryms helt inom en-slinge-arkitekturen). FEAT-042 gav tre konkreta, färska
lärdomar som direkt formar rekommendationen nedan: (1) bygg lärstigssteg med
egna, dedikerade scenariofiler från början — lita aldrig på att en
kryssruta/ett fält överlever en scenario-omladdning mellan steg, (2) etablera
den objektiva mätmetoden (Mätläge + 2 %-toleransband) i lärstigstexten från
FÖRSTA utkastet, inte som en eftertanke, och (3) gruppera nya fält kompakt
(tabellmönster) redan i förstadesignen, inte som en separat städinsats
efteråt.

**Rekommenderad designriktning i korthet:**
- Ny, generellt namngiven signal `scenario.auxSignal` (STRAT-001s
  "hjälpsignal"-koncept, konkretiserat) — INTE hårdkodad som
  "feedforwardLoad". Manuellt triggad via en ny knapp ("Trigga last"),
  exakt samma interaktionsmönster som `triggerPulse()`/"Trigga puls"
  redan etablerat och som studenter redan känner igen från
  `storningar-robusthet.v1`.
- Statisk framkoppling (`u_ff = Kff × auxSignal`) — inte ett
  ledande/eftersläpande filter. Processens egen dynamik (samma K/T som
  redan finns) räcker för att undvika att framkopplingen blir trivialt
  "perfekt".
- Lastsignalen ritas som en TREDJE linje i den ÖVRE grafpanelen (delar
  PV/SP:s 0–100-skala) — ingen ny panel, ingen ändring av `drawChart()`s
  fasta layout.
- "Ren framkoppling utan återkoppling" (den pedagogiskt viktiga
  mellanpunkten) kräver INGEN ny regulator-mekanism — uppnås genom att
  sätta Kp nära sitt minimivärde och Ti/Td=0 i ett dedikerat
  demoscenario, precis som FEAT-042s "kompromiss-Kp"-mönster.

---

## 2. Pedagogiskt mål

**Vad ska studerande förstå?**
- Skillnaden mellan REAKTIV reglering (återkoppling — väntar tills felet
  syns i PV) och PROAKTIV reglering (framkoppling — agerar samtidigt som
  störningen mäts, innan den hunnit påverka PV).
- Att framkoppling INTE ersätter återkoppling. En ren framkopplingsregulator
  (utan PID) korrigerar aldrig modellfel eller omätbara störningar — den kan
  bara kompensera för EXAKT det den mäter, med EXAKT rätt förstärkning. I
  praktiken drifter den iväg över tid om Kff är fel eller om något annat
  stör processen samtidigt.
- Att framkopplingens egen kvalitet är ett NYTT trimningsproblem (Kff), inte
  bara ännu en Kp/Ti/Td-avvägning.

**Vilket problem löser framkoppling som PID ensam inte löser?**
Fördröjningen i PID:s reaktion. PID måste vänta tills felet redan UPPSTÅTT
(PV har redan avvikit) innan den börjar korrigera — ju längre processens T/L,
desto dyrare blir den fördröjningen (större, mer långvarig avvikelse).
Framkoppling agerar i SAMMA ögonblick störningen mäts, oberoende av
processens egen tröghet. Detta är visuellt dramatiskt att visa: samma
laststörning ger PID-ensam en tydlig dipp/topp i PV, medan PID+framkoppling
ger en märkbart mindre avvikelse för EXAKT samma störning — direkt jämförbart
med redan levererat innehåll (`storningar-robusthet.v1` etablerade att brus/
puls är OMÄTBARA störningar; framkoppling är den naturliga, uttryckliga
motsatsen: en MÄTBAR störning som kan motverkas proaktivt).

---

## 3. Teknisk lösning

### 3.1 Den mätbara störsignalen — `scenario.auxSignal`

Ett nytt toppnivåfält, medvetet SKILT från `disturbance` (som redan
etablerat betyder "omätbar" i appens terminologi — att blanda ihop dem vore
en pedagogisk motsägelse):

```json
"auxSignal": {
  "enabled": false,
  "profile": "step",      // "step" | "ramp" | "sine" — samma familjer
                            // som redan finns för brus/puls, inga nya
  "amplitude": 20,
  "durationSteps": 0        // se öppen fråga nedan
}
```

**Öppen designfråga, inte löst i denna förstudie:** ska laststörningen vara
ÖVERGÅENDE (som dagens puls — återgår till 0 efter N steg) eller PERMANENT
(ett bestående lastbyte som stannar tills studenten återställer)? Klassiska
läroboksexempel på framkoppling (t.ex. "kallmatningsflödet ökar och stannar
högre — kompensera med mer ånga") är oftast PERMANENTA. Pulsens befintliga
semantik (`durationSteps`) är byggd för ÖVERGÅENDE störningar. En permanent
variant kräver antingen en ny flagga (`persistent: true`) eller att
`durationSteps` tolkas annorlunda för `auxSignal` än för `disturbance.pulse`
— ett konkret designbeslut för ett eventuellt bygguppdrag, inte för denna
förstudie.

**Triggning:** en ny knapp ("Trigga last"), exakt samma mönster som
`triggerPulse()`/"Trigga puls" redan etablerat — `sim.triggerAuxSignal()`
sätter en intern räknare, `Simulation.step()` lägger till signalens värde
under aktiv period. Manuell triggning (inte ett scenario-inbyggt starttid)
ger studenten kontroll över NÄR jämförelsen börjar — viktigt för
`comparisonGroup`-stilen jämförelser (samma mönster som redan används
genomgående i lärstigar).

### 3.2 Påverkan på processmodellen

STRAT-001s varning kvarstår: om laststörningen bara adderas rakt på `y`
(som dagens `disturbance`-brus/puls) blir framkopplingen trivialt "perfekt"
— inget att lära av samspelet mellan framkopplingens noggrannhet och
processens verkliga dynamik. Lastens effekt bör därför gå genom processens
EGEN K/T-dynamik, inte adderas direkt:

```
y += ((-(y - normalValue) + K*ud + Kload*auxValue) * dt) / T
```

`Kload` (lastens egen förstärkning på processen) är ett nytt, litet fält i
`process`-objektet. Att dela SAMMA T som huvudprocessen (inte en egen
lasttidskonstant) är en medveten förenkling för den första leveransen — se
avsnitt 6, "Överdesign att undvika".

### 3.3 Påverkan på regulatorn

Statisk framkoppling, ett litet tillägg i `Simulation.step()`:
`u = u_feedback + Kff × auxValue`, där `Kff` är ett nytt fält i
`controller`-objektet. Ingen ny regulator-mekanism, inget nytt läge — bara
en additiv term innan utsignalen klipps mot `outputLimits`.

**Den viktiga mellanpunkten — "ren framkoppling, ingen återkoppling":**
kräver INGEN ny funktionalitet. Sätt Kp till sitt UI-tvingade minimivärde
(0.1 — se `fields.kp`s `min`-attribut) och Ti/Td=0 i ett dedikerat
demoscenario — regulatorns bidrag blir då försumbart litet jämfört med
framkopplingstermen, vilket i praktiken demonstrerar "ren framkoppling" utan
att bygga en teknisk avstängningsmekanism för PID-delen. Enklare och säkrare
än att införa ett nytt regulatorläge.

---

## 4. Visualisering

**Hur ska störningen visas i grafen?** Som en TREDJE linje i den ÖVRE
panelen (PV/SP), som redan delar 0–100-skalan — INTE en ny tredje panel.
`drawChart()`s fasta tvåpanels-layout (`h*0.62` övre, `h*0.68–100%` nedre)
är en etablerad, aldrig ändrad struktur sedan appens start; att bryta den
för en enskild feature är en väsentligt större risk än att lägga till en
extra linje i en panel som redan visar flera samtidiga serier (PV, SP,
PB-band, hjälplinjer, zonbrytpunkter — se FEAT-042). Given appens
genomgående normaliserade 0–100-konvention (PED-003C) är detta både billigast
och mest konsekvent.

**Hur ska studerande se skillnaden mellan de tre lägena?**
| Läge | Hur det uppnås |
|---|---|
| Ingen framkoppling (PID ensam) | `Kff=0` (eller `auxSignal.enabled=false`) |
| Ren framkoppling (ingen återkoppling) | `Kp≈0.1` (UI-minimum), `Ti=Td=0`, `Kff>0` |
| PID + framkoppling | Normal PID-drift, `Kff>0` |

Samma `comparisonGroup`-mönster som redan etablerat (försök 1/2/3, en
lärstigsstegs-jämförelse i taget) — inget nytt UI-koncept.

---

## 5. Scenarier och lärstigar

**Förslag på första demoscenario:** en självreglerande process (samma
K/T/L-mönster som redan används överallt) med en laststörning som
manuellt triggas mitt i en körning — matchar strukturellt
`pid-pulse-rejection.json`/`storningar-robusthet.v1`, men med den nya
`auxSignal` istället för `disturbance.pulse`.

**Förslag på lärstig** — samma tredelade, beprövade struktur som FEAT-042:
1. **Visa problemet:** PID ensam, trigga lasten, se den tydliga
   PV-avvikelsen och hur länge det tar innan PID hämtat in den.
2. **Visa gränsen:** ren framkoppling (Kp≈0.1), samma laststörning —
   avvikelsen försvinner nästan helt VID STÖRNINGEN, men en medveten,
   liten modellfelsvariant (t.ex. Kff satt 20 % fel) visar att systemet
   sakta drifter iväg utan återkopplingens korrigering.
3. **Lösningen:** PID + framkoppling tillsammans — snabb kompensation
   (framkoppling) OCH korrekt slutvärde (återkoppling), bästa av båda.

Genomgående: dedikerade scenariofiler per steg (INTE beroende av att en
kryssruta/ett fält överlever en omladdning — FEAT-042s huvudlärdom),
namngivna mätvärden, och Mätläge + 2 %-toleransband som mätmetod redan i
FÖRSTA utkastet av instruktionstexten — inte tillagt efter ett användartest
som i FEAT-042.

**Förslag på övningsuppgifter:** samma mönster som
`ovningar-parameterstyrning.md` — 2 grundläggande (visa att framkoppling
snabbar upp kompensationen; visa att fel Kff ger över- eller
underkompensation) + 2 utforskande (låt studenten själv trimma Kff mot ett
mätbart mål; kombinera framkoppling med en omätbar störning samtidigt och
diskutera vad framkopplingen INTE kan hjälpa mot). Totalt 4, ingen
fördjupnings-/mästarnivå — samma avgränsning som tidigare övningsdokument.

---

## 6. Arkitektur

**Hjälpsignal-konceptet:** `scenario.auxSignal` (profil, amplitud, manuell
triggning) — generellt namngivet och format, exakt STRAT-001s
rekommendation, nu konkretiserad till ett faktiskt schemaförslag.

**Återanvändning för Kvotreglering:** direkt återanvändbar rakt av — samma
profilgenerator, samma `history.aux`-tidsserie, samma graflinje-kod.
Kvotregleringen skiljer sig bara i TOLKNING (`SP = kvot × auxSignal-värde`
istället för framkopplingens `u_ff = Kff × auxSignal-värde`) — ingen ny
mekanism, bara en ny användning av samma data. Det är precis den
kostnadsbesparingen STRAT-001 förutspådde.

**Motiverad framtidssäkring:**
- Signalens namn/form hålls generellt (`auxSignal`, inte
  `feedforwardLoad`) — kostar i praktiken noll extra, sparar hela
  Kvotregleringens motsvarande arbete.
- Bevara att `runtime.setpoint` läses om varje steg (ingen ny kod, bara en
  disciplin att inte cacha det när framkopplingen byggs) — förbereder
  Kvotregleringens "härledda SP" utan extra arbete nu.

**Överdesign att undvika:**
- Dynamiskt/ledande-eftersläpande framkopplingsfilter — statisk
  framkoppling räcker för den pedagogiska poängen; en fördröjningsmodell
  kan läggas till senare om ett konkret behov uppstår, inte i förväg.
- En tredje grafpanel — återanvänd den övre panelen.
- En egen, separat tidskonstant för lastens väg in i processen (skild
  från processens T) — onödig komplexitet för den första leveransen.
- Stöd för FLERA samtidiga hjälpsignaler (en array/lista) — exakt en
  `auxSignal` räcker, samma "fast antal, inte generiskt N"-princip som
  Parameterstyrningens tre zoner (inte N zoner).
- En ny regulator-mekanism för "ren framkoppling"-läget — Kp≈minimum
  räcker, ingen ny kod behövs.

**Konkret UI-lärdom från FEAT-044:** om framkopplingen introducerar flera
nya fält (profil, amplitud, Kff, ev. Kload), gruppera dem kompakt
(tabell-/blockmönster) REDAN i förstadesignen — bygg inte först utspridda
enskilda fält och städa upp det som en separat uppföljning, vilket var
precis vad som hände med FEAT-042/FEAT-044.

---

## 7. Risker

1. **Schemabeslutet "övergående kontra permanent laststörning" är olöst**
   (avsnitt 3.1) — påverkar både `sim-core.js`-logiken och hur lärstigens
   pedagogiska poäng "drift utan återkoppling" ska demonstreras. Bör lösas
   som en tidig delfråga i ett eventuellt bygguppdrag, inte antas.
2. **"Ren framkoppling"-tricket (Kp≈UI-minimum) är en approximation, inte
   en genuint avstängd PID-del.** Ett mycket litet Kp-bidrag finns kvar —
   sannolikt pedagogiskt försumbart, men bör simuleringsverifieras (samma
   disciplin som PED-003E/FEAT-042) innan det låses fast i en lärstig, inte
   antas fungera.
3. **En tredje linje i den redan täta övre panelen** riskerar visuell
   trängsel om lärstiget SAMTIDIGT använder Mätläges hjälplinjer (63 %,
   10/90 %, 2 %-band) och FEAT-042s zonbrytpunktslinjer — bör
   verifieras visuellt (kräver webbläsare) innan design låses.
4. **Kload (lastens egen processförstärkning) är en ny parameter studenter
   kan förväxla med den vanliga processförstärkningen K** — kräver tydlig
   namngivning/hjälptext från start, samma typ av förväxlingsrisk som
   FEAT-042s process-/regulator-zonförväxling (löst där med en uttrycklig
   förklaring — samma mönster bör appliceras här proaktivt, inte reaktivt).

---

## 8. Förslag på roadmap

1. **Litet, avgränsat tekniskt delbeslut FÖRST:** lös frågan i avsnitt 3.1
   (övergående vs. permanent) — påverkar allt nedanför.
2. **`sim-core.js`:** `auxSignal`-fält, `Kload`, `Kff`, `triggerAuxSignal()`
   — samma litet-isolerat-tillägg-mönster som Parameterstyrningens
   `scheduleZone()` var.
3. **UI:** nya fält grupperade från start (FEAT-044-mönstret, inte en
   eftertanke), ny knapp "Trigga last".
4. **Graf:** ny linje i övre panelen, verifierad visuellt mot befintliga
   hjälplinjer/markeringar för trängsel.
5. **Innehåll:** demoscenario (simuleringsverifierat FÖRE lärstigstext
   skrivs), 3-stegs lärstig, 4 övningsuppgifter — Mätläge+2%-band-metoden
   inbyggd i instruktionerna från start.
6. **Granskning:** samma mönster som FEAT-042 — PO:s användartest,
   åtgärder, eventuell produktionsaktivering som eget, senare steg.

---

## 9. Rekommendation om nästa steg

**Inte implementation ännu.** Den återstående öppna frågan i avsnitt 3.1
(övergående kontra permanent laststörning) är den enda punkten som
faktiskt behöver ett PO-beslut innan en designspecifikation (i STRAT-003s
stil, med konkreta scenariovärden) kan skrivas. Rekommenderat nästa steg:
ett kort beslutsunderlag eller en direkt fråga till PO om den punkten,
följt av en STRAT-005-liknande designspecifikation (motsvarande
STRAT-003s roll för FEAT-042) INNAN ett bygguppdrag ges — samma
tvåstegsprocess (förstudie → designspecifikation → bygguppdrag) som redan
fungerat väl för Parameterstyrning.
