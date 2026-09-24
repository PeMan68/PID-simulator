# FEAT-047 — Förstudie: Förbättrad lärstig för integrerande process och nivåreglering

**Datum:** 2026-09-23
**Uppdragsgivare:** PO — analysuppdrag efter manuell granskning, explicit "ingen
implementation ännu"
**Typ:** Analys/rekommendation — INGEN kod, ingen branch
**Underlag:** `apps/app/content/exercises/integrerande-process-niva.v1.json`,
`apps/app/content/scenarios/integrating-pi.json`,
`apps/app/content/theory/integrating-process.v1.json`, `apps/app/sim-core.js`
(`ProcessModel.step()`s integrerande-gren, verifierad rad för rad). **Samtliga
numeriska påståenden i denna rapport är körda genom den riktiga `Simulation`-klassen
via `tests/simulation/lib/sim-core-bridge.mjs`** (engångsskript i scratchpad, inte
committade) — inget är uppskattat eller antaget, per uppdragets uttryckliga krav.

---

## 1. Analys av nuvarande brister

### 1.1 Nuvarande scenario, exakt

`integrating-pi.json`: integrerande process K=0.01, normalValue=20, outflow=0.5,
PI-regulator Kp=1.5/Ti=80, SP=60, puls magnitude=5/durationSteps=20,
`runtime.maxSteps=600`. Lärstigens EGEN instruktionstext säger "Kör 200 steg" —
alltså en textrekommendation, inte den tekniska taket (600).

### 1.2 Brist 1 — "200 steg räcker inte", verifierat och kvantifierat

Körde scenariot rakt av (ingen puls) i 400 steg och mätte när PV permanent ligger
inom 2%-toleransbandet kring SP=60 (samma konvention appens eget Mätläge använder):

| Steg | PV | Steg | PV |
|---|---|---|---|
| 50 | 30,6 | 180 | 61,0 |
| 100 | 44,9 | 200 | **63,0** (redan förbi SP, utanför 2%-bandet igen) |
| 140 | 54,5 | 250 | 65,1 (toppen av en lång, dämpad översläng) |
| 160 | 58,2 | 300 | 64,5 |

**Systemet svänger permanent förbi 2%-bandet först efter steg 395.** Vid steg 200
(instruktionens egen rekommendation) är PV=63,0 — redan på väg FÖRBI SP i en lång,
svagt dämpad översläng som inte kulminerar förrän runt steg 250 (PV≈65) och sedan
kräver ytterligare ~150 steg för att sjunka tillbaka. **PO:s iakttagelse är alltså
inte bara korrekt, den är en underskattning** — 200 steg visar inte ens att systemet
NÅTT SP än, det visar en INKORREKT bild (PV verkar fortfarande stiga rakt igenom SP).

**Rotorsak, inte bara symptom:** Kp=1,5/Ti=80 är en svagt dämpad, långsam
tuning för just DENNA integrerande process (K=0,01). Att bara förlänga
körtiden (t.ex. till 600 steg) LÖSER tekniskt problemet men gör lärstigen
tråkig — en stor del av 200–400 är en utdragen, informationsfattig svängning.
Se avsnitt 2/3 för en omtuning som löser detta genom att göra regulatorn
SNABBARE och BÄTTRE DÄMPAD, inte genom att bara vänta längre.

### 1.3 Brist 2 — pulsstörningen, verifierat och grundorsaksbestämt

**Detta är inte bara "för stort tal" — det är en strukturell missmatchning mellan
puls-mekanismen och integrerande processer.** I `sim-core.js` adderas
`disturbance.pulse.magnitude` till processens utsignal `y` VARJE STEG pulsen är
aktiv (`durationSteps` styr hur många steg, inte en engångshändelse) — se
`ProcessModel.step()`, `this.y += disturbance;`. Vid `durationSteps=20` och
`magnitude=5` adderas alltså **5 varje steg i 20 steg i rad = 100 sammanlagt**,
direkt till nivån.

**För en SJÄLVREGLERANDE process** är detta ofarligt: processens egen återställande
term (`-(y-normalValue)/T`) motverkar tillskottet kontinuerligt, så nettoeffekten
stannar rimlig. **För en INTEGRERANDE process finns INGEN sådan återställande
term** — hela tillskottet blir kvar, och regulatorn kan bara motverka det långsamt
via sin (redan trögt inställda) integral. Verifierat: att trigga dagens puls (efter
att PV nått ~68 vid steg 200) driver PV till **154,9** vid steg 220 — långt utanför
mätområdet 0–100 och grafens skala.

**Detta förklarar exakt PO:s iakttagelse** ("störningsresponsen dominerar
innehållet") — en bugg-liknande, skalsprängande kurva tar över hela grafen.

### 1.4 Brist 3 — för få lärstigssteg, kvantifierat mot resten av katalogen

```
integrerande-process-niva.v1:  2 steg   ← denna lärstig
windup-antiwindup.v1:          3 steg
pi-pid.v1:                     3 steg
framkoppling.v1:               4 steg
kom-igång.v1:                  5 steg
processbegransningar.v1:       5 steg
proportionalband-forstarkning: 6 steg
storningar-robusthet.v1:       7 steg
parameterstyrning-ventilkarakteristik.v1: 7 steg
stegsvar-identifiering.v1:     8 steg
```

Med 2 steg är detta den kortaste lärstigen i hela katalogen, med god marginal.
Innehållsmässigt hoppar den dessutom RAKT till PI-lösningen utan att först VISA
problemet den löser — checkpointens påstående ("P-reglering räcker inte") backas
aldrig upp av en egen demonstration, till skillnad från hur t.ex. `pi-pid.v1`
bygger P → PI → PID stegvis.

---

## 2. Förslag till ny lärstigsstruktur

Fem steg (matchar medianen i tabellen ovan), byggt som en tydlig progression —
samma "visa problemet innan lösningen" -mönster som redan bevisat sig i
`framkoppling.v1` (PID ensam → fel Kff → korrekt Kff) och `pi-pid.v1` (P → PI):

| # | Typ | Innehåll | Nytt/ändrat |
|---|---|---|---|
| 1 | Teori | Integrerande processer (oförändrad) | Oförändrad |
| 2 | **Scenario, NY** | P-reglering ENSAM på tanknivån — visa att SP ALDRIG nås | Ny, se avsnitt 3 |
| 3 | Scenario (omtunad) | PI-reglering hittar jämviktspunkten — dagens steg, med ny tuning | Ändrad tuning |
| 4 | **Scenario, NY** | Trigga puls (kortad/omskalad) — observera störningsavvisning | Utbruten ur dagens steg 2, egen instruktion/checkpoint |
| 5 | **Reflektion/teori, NY** | Jämför med en självreglerande process — varför tog stegsvaret/pulsen olika lång tid? | Ren reflektion, ingen ny simulering |

**Varför steg 2 (P-ensam) är den viktigaste tilläggen:** checkpointen i steg 1 (nu
steg 1, oförändrad) HÄVDAR att P-reglering inte räcker — men lärstigen visade det
aldrig. Verifierat: P-ensam (Kp=1,5) på denna process stannar på **PV≈26** (SP=60),
ett permanent, stort kvarstående fel (e≈34, u≈51 — regulatorn behöver hålla ett
konstant u för jämvikt, vilket bara går genom ett permanent fel med P-reglering).
Konkreta, körda siffror — se avsnitt 3.

**Varför steg 4 bryts ut som eget steg (istället för att vara en rad i steg 3:s
instruktion, som idag):** "Trigga puls" nämns idag i FÖRBIGÅENDE i steg 2:s
instruktionstext, utan egen checkpoint eller reflektion. Som eget steg får det ett
eget pedagogiskt mål (störningsavvisning specifikt för integrerande processer — INGEN
återställande kraft, regulatorn måste göra hela jobbet) och en egen, verifierad
förväntad kurva.

---

## 3. Konkreta parameterförslag (samtliga körda i simulatorn)

### 3.1 Steg 3 (PI, omtunad) — ny scenariofil, t.ex. `integrating-pi.json` uppdaterad

**Föreslagen tuning: Kp=4, Ti=60** (oförändrat K=0,01/outflow=0,5/SP=60/PV0=20).

Sökte igenom ett rutnät av Kp∈[1,5–5]/Ti∈[20–80] och mätte insvängningstid (permanent
inom 2%-band) och översläng. Kp=4/Ti=60 gav bäst balans (snabb, minimal översläng,
ingen konstig `u`-mättnad utöver den initiala uppstarten):

| Kp | Ti | Insvängning (steg) | Max PV (översläng) |
|---|---|---|---|
| 1,5 (nuvarande) | 80 (nuvarande) | **395** | 65,2 (8,6 %) |
| 3 | 80 | 205 | 61,2 (2,0 %) |
| **4** | **60** | **112** | **60,9 (1,5 %)** |
| 4 | 80 | 143 | 60,1 (0,2 %) |
| 5 | 80 | 155 | 60,0 (≈0 %) |

Verifierad hela vägen (inga negativa PV-dippar, ingen bestående `u`-mättnad, `u`
rör sig mot det pedagogiskt viktiga jämviktsvärdet 50 % precis som checkpointen
förklarar — vid steg 150 är u≈51,8, nära det teoretiska 50). **Kp=4/Ti=60 rekommenderas**
— insvängning på ~112 steg istället för ~395, utan att offra checkpointens
u_jämvikt-poäng.

**maxSteps:** höj från 600 → **oförändrat 600 räcker** (behövs inte högre, men
frigör inte heller plats i sig — det är instruktionstexten som ska ändras, se 3.3).

### 3.2 Steg 2 (P-ensam) — ny scenariofil, t.ex. `integrating-p-only.json`

Samma process (K=0,01/outflow=0,5/normalValue=20), **Läge=P, Kp=1,5** (samma Kp som
lärstigen redan nämner i teorin, för kontinuitet), ingen puls. Verifierat:
PV planar ut runt **26** (stannar ~25,2 vid steg 100, ~26,0 vid steg 150 — i praktiken
klart redan vid ~steg 80). **`maxSteps` ~100–120 räcker gott** — ingen anledning till
en lång körning här, poängen (permanent, stort fel) syns tydligt inom 100 steg.

### 3.3 Steg 4 (puls) — samma scenario som steg 3, med störningen omgjord

**Föreslagen ändring: `durationSteps` 20 → 2** (behåll `magnitude=5`).

| Duration (steg) | Toppvärde PV (efter SP=60) |
|---|---|
| 1 | 64,5 |
| **2** | **69,4** |
| 3 | 74,0 |
| 5 | 83,0 |
| 10 | 105,5 (redan över mätområdet 0–100) |
| 20 (nuvarande) | **150,5** (kraftigt över mätområdet) |

**durationSteps=2 rekommenderas** — en tydlig, synlig topp (~69, dvs +9 över SP,
klart observerbar i grafen) som ändå håller sig gott inom mätområdet och inte
förvandlar grafen till en ren skalvisning av en enda kurva. Verifierad med den nya
tuningen (Kp=4/Ti=60), triggad vid steg ~150 (efter att steg 3:s jämvikt redan
observerats): topp PV=70,6 vid steg 152, tillbaka till synligt nära SP (PV≈60) vid
steg ~200, alltså en tydlig men HANTERBAR störning-och-återhämtning inom loopens
befintliga 600-stegs tak.

**Alternativ övervägd och avfärdad:** att istället bara sänka `magnitude` (behålla
`durationSteps=20`) ger liknande toppvärden (t.ex. magnitude=0,5 → topp 67,1) men är
en mindre naturlig berättelse ("en störning som pågår i 20 sekunder men bara är
0,5 enheter per sekund" är svårare att motivera pedagogiskt än "en kort, tydlig
stöt") — och separat, riskerar att sätta ett prejudikat (mycket liten `magnitude`)
som blir förvirrande om samma mönster återanvänds i framtida integrerande-
processlärstigar. Kortare duration rekommenderas tydligt.

**Om andra störningar är bättre lämpade:** testade även `noiseStd` (kontinuerligt
Gaussiskt brus, appliceras varje steg) som ALTERNATIV till puls. Vid `noiseStd=0,3`
ger det ett realistiskt "levande" band kring SP (PV varierar ±2 runt 60 i
steady-state) utan att någonsin driva iväg — strukturellt SÄKRARE för en integrerande
process än en riktad puls, eftersom brus är nollmedelvärde (ingen ackumulerad drift)
medan en puls är en envägs, ackumulerande stöt. **Rekommendation:** lägg INTE till
brus som ersättning för pulsen (pulsen har ett tydligt pedagogiskt syfte — en
DISKRET, observerbar händelse att peka på i grafen, vilket brus inte ger), men
överväg `noiseStd≈0,2–0,3` som ett litet TILLÄGG i steg 3/4 för att göra kurvan mindre
sterilt perfekt — en billig, valfri finish, inte en nödvändig fix.

---

## 4. Bedömning av arbetsinsats

**Litet till medelstort, RENT INNEHÅLLSARBETE — ingen `sim-core.js`-ändring, ingen
`app.js`-ändring.** Till skillnad från t.ex. FEAT-042/045 (som krävde ny
simuleringslogik) är hela denna förbättring en fråga om nya/ändrade JSON-filer och
lärstigstext:

- 1 ändrad scenariofil (`integrating-pi.json`: Kp/Ti, pulsens `durationSteps`).
- 1 ny scenariofil (P-ensam-demot, avsnitt 3.2) — kopiera befintlig struktur.
- 1 utökad exercise-fil (2 → 5 steg): 3 nya steg med instruktionstext, checkpoint-
  fråga/svarsalternativ/förklaring vardera — det tyngsta arbetet, men samma mönster
  som redan finns i alla andra lärstigar, inget nytt att uppfinna.
- Registrering i `catalog.json` (nya scenariofiler) — ingen ändring av
  `catalog.prod.json` behövs förrän lärstigen produktionsgodkänns (den är redan
  DEV-only idag).
- All numerik i denna rapport är redan verifierad — implementationsarbetet behöver
  bara SKRIVA in redan bekräftade tal, inte ta fram nya.

**Uppskattning: en session**, jämförbar med eller mindre än en typisk enskild
lärstigsrevision (t.ex. FEAT-045s användartest-åtgärder). Inget behov av
regressionstestning utöver `validate-content.mjs` (nya scenario-/catalog-referenser)
— ingen kärnlogik rörs.

---

## Sammanfattning

Samtliga tre av PO:s iakttagelser bekräftas, kvantifieras och grundorsaksbestäms:
(1) 200 steg är otillräckligt eftersom nuvarande tuning svänger i ~395 steg — löst
genom omtuning (Kp=4/Ti=60, insvängning ~112 steg) snarare än att bara förlänga
väntetiden; (2) pulsstörningen är strukturellt för kraftig för en integrerande
process (ackumulerar utan återställande kraft) — löst genom kortare duration
(20→2 steg), inte bara mindre magnitud; (3) för få steg — löst genom att lägga till
ett P-ensam-baslinjesteg (som faktiskt VISAR den redan hävdade poängen) och ett
utbrutet, eget pulsstörningssteg, för totalt 5 steg i linje med resten av katalogen.

Väntar på PO:s designbeslut/klartecken innan något implementeras.
