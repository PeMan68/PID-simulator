# STRAT-007 — Förstudie: Kaskadreglering (Cascade Control)

**Datum:** 2026-09-24
**Uppdragsgivare:** PO — analysuppdrag, explicit "ingen implementation, ingen branch,
ingen kodändring"
**Typ:** Analys/rekommendation — INGEN kod, ingen branch
**Underlag:** `apps/app/sim-core.js` (verifierad rad för rad — `Simulation`-konstruktorn,
`Simulation.step()`, `ProcessModel.step()`, `PIDController.step()`, `this.history`),
`apps/app/index.html` (UX-004:s tre grupper och `.advanced-toggle`-mönster),
`apps/app/app.js` (`drawChart()`, rad 161 och framåt), `docs/reports/STRAT-001_FORSTUDIE-REGLERSTRATEGIER.md`
avsnitt 3.4 (tidigare, mer teoretisk Kaskad-förstudie) och avsnitt 5.1–5.4 (arkitekturanalys
— bekräftad här mot den FAKTISKA koden), `docs/reports/STRAT-006_FORSTUDIE-KVOTREGLERING.md`
(mall för struktur/rigör), FEAT-046s redan ritade blockschema (`05-kaskadreglering.svg`,
på obetjänt granskad branch `feature/FEAT-046-blockschema-svg` — se avsnitt 5), samt en
egen, körd (ej sparad i repot) numerisk verifiering med OFÖRÄNDRADE `ProcessModel`/
`PIDController`-klasser (se avsnitt 1 och 3).

**Viktig avgränsning:** `docs/planning/PED-002-KOMPLEMENT_FLERSLINGEREGLERING.md`
diskuterar också Kaskadreglering, men är skriven mot **systerrepots** `packages/sim-core/`
(process.js/controllers.js/simulation.js, ett annat scenario-schema) — INTE mot den
faktiska produktionskoden i `apps/app/`. Dess konceptuella slutsats (Kaskadreglering
kräver en "riktig flerslingearkitektur", till skillnad från Parameterstyrning/
Framkoppling) stämmer och bekräftas oberoende här, men dess filreferenser gäller inte.
Allt i den här rapporten är verifierat direkt mot `apps/app/sim-core.js` och `app.js`.

---

## 0. Sammanfattning för snabb läsning

Kaskadreglering är den enda av de fyra reglerstrategierna i STRAT-001 som kräver en
**genuint ny regulator- och processinstans**, inte bara en ny signal eller ett nytt
beräkningssteg ovanpå dagens enkelslinge-`Simulation`. Den reglertekniska kärnan är
redan bevisat fungerande — en egen, körd prototyp med **oförändrade** `ProcessModel`/
`PIDController`-klasser visade att en yttre PID:s utsignal rakt av kan användas som en
inre PID:s börvärde, utan att röra någon av klassernas publika gränssnitt. Det som
saknas är **orkestrering, historik-schema, UI och graf** — och där är kaskad
strukturellt större än alla tre tidigare byggda strategier tillsammans (STRAT-001s
egen bedömning, oförändrad efter kodgranskning). Numerisk verifiering: samma
störning gav en topp-avvikelse på **0,26 enheter** (kaskad) mot **3,18 enheter**
(enkelslinga), och kaskaden var i praktiken avklarad direkt medan enkelslingan tog
**349 simuleringssteg** att återhämta sig inom samma tolerans — se avsnitt 1.

---

## 1. Pedagogiskt mål

Kaskadreglering lär ut ett hierarkiskt regleringsmönster: **en snabb, inre slinga
skyddar en långsam, yttre processvariabel** genom att korrigera störningar innan de
hinner sprida sig till den variabel operatören egentligen bryr sig om. Det är ett
klassiskt "kapitelavslutande" avancerat PID-moment i svensk reglerteknikutbildning
(temperaturslinga runt en flödesslinga är läroboksexemplet).

**Vad det löser som varken vanlig PID eller Framkoppling gör:**

- **Vanlig återkoppling (PID)** reagerar först när störningen redan syns i PV — för
  en långsam process (stor termisk massa, stor tank) kan det ta lång tid innan
  regulatorn ens märker något är fel, och ännu längre att korrigera det.
- **Framkoppling** (redan byggd, FEAT-045) kompenserar proaktivt för en **specifik,
  i förväg känd och mätbar** störningskälla — men bara den. Om störningen kommer in
  någon annanstans i kedjan (t.ex. ventilslitage, tryckvariation uppströms, en
  olinjäritet i ventilen själv) finns ingen kompensationsväg.
- **Kaskadreglering** löser ett tredje, kompletterande problem: det finns en
  **snabbare mellanvariabel** (t.ex. flöde) mellan manöverdonet (ventilen) och den
  slutliga, långsamma processvariabeln (t.ex. temperatur). Genom att lägga en egen,
  snabb regulator direkt på mellanvariabeln fångas och korrigeras STÖRNINGAR SOM
  UPPSTÅR VAR SOM HELST i den inre slingan — oavsett om de går att mäta i förväg
  eller ej — innan de ens hinner påverka den yttre processvariabeln nämnvärt.

**Egen numerisk verifiering** (oförändrade `ProcessModel`/`PIDController`, se avsnitt 3
för uppkoppling): en ihållande lastförändring i den inre slingans flöde gav

| | Topp-avvikelse i yttre PV | Tid till återhämtning (±0,5 enheter) |
|---|---|---|
| Kaskad (inre + yttre slinga) | 0,26 enheter | ~0 steg (i praktiken omärkbart) |
| Enkelslinga (samma störning, ingen inre slinga) | 3,18 enheter | 349 steg |

Skillnaden är dramatisk och bekräftar läroboksbudskapet konkret, inte bara teoretiskt.

---

## 2. Processexempel

**Rekommendation: värmeväxlare, samma process-familj som Framkoppling (FEAT-045)** —
temperatur (yttre, långsam) kaskadkopplad mot flödet genom värmemediets ventil (inre,
snabb). Detta ger pedagogisk kontinuitet: eleven har redan mött värmeväxlarexemplet i
Framkoppling (`framkoppling-demo-pid.json`, K=1,3/T=15) och känner igen scenariot,
men ser nu en KOMPLETTERANDE lösning på ett liknande problem.

**Motivering (varför just detta par):** en tryckvariation uppströms ventilen (t.ex.
en annan förbrukare i samma system öppnar/stänger en ventil) ändrar levererat flöde
för samma ventilöppning — en störning som INTE är känd i förväg och därför inte kan
framkopplas, men som en inre flödesregulator upptäcker och korrigerar direkt.

**Konkreta tal, verifierade i en fristående prototyp (ej del av produktionskoden):**

| Parameter | Yttre process (temperatur) | Inre process (flöde) |
|---|---|---|
| Typ | `self_regulating` | `self_regulating` |
| K | 1,3 | 1,0 |
| T | 90 s (stor termisk massa — motiverar kaskad) | 8 s (snabb ventil/kort rörsträcka) |
| normalValue | 50 | 30 |
| Regulator Kp / Ti | 0,6 / 70 | 2,0 / 6 |

Förhållandet T_yttre : T_inre ≈ 11:1 följer tumregeln att den inre slingan bör vara
klart snabbare (vanligen minst 5–10×) än den yttre för att kaskadens fördel ska synas
tydligt — vilket också var förutsättningen för resultatet i avsnitt 1. Exakta tal bör
finjusteras av PO/innehållsförfattare vid faktisk scenarioframtagning, men storleks-
ordningen är verifierad, inte gissad.

---

## 3. Reglerteknisk modell

**Signalkedja (bekräftad fungerande med oförändrade klasser):**

```
SP1 (yttre börvärde, som idag scenario.runtime.setpoint)
  → Yttre PID.step(SP1, PV1) → u_yttre
  → SP2 = f(u_yttre)                          [NY orkestreringslogik — finns ej idag]
  → Inre PID.step(SP2, PV2) → u_inre (ventilsignal, 0–100%)
  → Inre ProcessModel.step(u_inre, ...) → PV2 (flöde)
  → PV2 driver Yttre ProcessModel.step(PV2-relaterat värde, ...) → PV1 (temperatur)
```

`PIDController.step(sp, pv, limits, antiWindup, feedforward)`s signatur är redan
generisk nog för detta rakt av — den bryr sig inte om varifrån `sp` kommer. Min
prototyp bekräftar detta konkret: `outerPid.step(SP_outer, outerProc.y, ...).u`
används direkt som en komponent i `SP_inner`, och `innerPid.step(SP_inner,
innerProc.y, ...).u` matas rakt in i `innerProc.step(...)` — ingen ändring behövdes
i någon av klasserna. Detta bekräftar STRAT-001 avsnitt 5.2s observation
("härlett börvärde... redan tekniskt möjligt... utan att röra `PIDController`s
publika gränssnitt") även för kaskadens fall, inte bara Kvotreglerings.

**Viktig detalj som INTE finns idag:** hur `u_yttre` översätts till `SP2` är en
skalningsfråga (den yttre regulatorns utsignal måste tolkas i den inre processens
egna enheter/arbetspunkt) — i prototypen löst som `SP_inner = innerProcess.normalValue
+ u_yttre` med yttre utgångsgränser satta till en avvikelseskala (±50) snarare än
0–100. Detta är en ren orkestreringsdetalj, men den finns ingenstans i dagens
`Simulation.step()` och måste designas medvetet, inte antas bort.

**Kaskad-windup (bekräftat verkligt, inte bara teoretiskt — STRAT-001 avsnitt 3.4
flaggade detta redan):** dagens `PIDController`s anti-windup klipper bara mot SIN
EGEN regulators utgångsgränser (`limits`-argumentet i `step()`). Om den inre slingan
mättas (t.ex. ventilen är helt öppen och ändå inte kan nå `SP2`) har den YTTRE
regulatorn ingen möjlighet att veta detta — ur dess perspektiv är "processen" bara
långsam, och dess egen integraldel fortsätter vinda upp som om den inre slingan
förr eller senare skulle hinna ikapp. Det finns ingen mekanism i koden idag för att
en `PIDController`-instans ska kunna signalera mättnad till en ANNAN instans. Detta
är genuint ny reglerteknisk logik utan befintlig förlaga i kodbasen (till skillnad
från t.ex. bumplös övergång, som redan är generell nog för flera instanser — se
avsnitt 7).

---

## 4. Nödvändiga signaler

| Signal | Ny/Existerande | Hur den skulle produceras |
|---|---|---|
| SP1 (yttre börvärde) | Existerande | `scenario.runtime.setpoint`, precis som idag |
| PV1 (yttre processvariabel) | Existerande mönster, men en NY instans | `outerProcess.y` — kräver en andra `ProcessModel`-instans i `Simulation` |
| SP2 (inre börvärde) | HELT NY | Beräknas varje steg från yttre PID:s utsignal — ingen motsvarighet finns idag |
| PV2 (inre processvariabel) | Existerande mönster, men en NY instans | `innerProcess.y` — en andra `ProcessModel`-instans |
| u (ventilsignal) | Existerande, men byter ägare | Produceras nu av den INRE regulatorn, inte den yttre som idag |
| Kaskad-windup-status | HELT NY | Den inre regulatorns mättnadsläge måste exponeras och läsas av den yttre regulatorns anti-windup-logik — ingen sådan kanal finns |
| `history` per slinga | Kräver schemaändring | Dagens `history` är en platt dict (`t/y/sp/u/e/p/i/d/aux/wildFlow`) — en andra slinga kan inte läggas till som ännu en platt nyckel utan namnrymd, annars krockar `y`/`sp`/`u` mellan slingorna |

---

## 5. Blockschema

`feature/FEAT-046-blockschema-svg` (obetjänt granskad branch) innehåller redan
`docs/assets/diagrams/05-kaskadreglering.svg` — ett färdigt, tydligt blockschema med
en yttre PID (orange, märkt "Yttre PID") vars utsignal blir "SP_inre", en inre PID
som styr en gemensam Ventil/Process-kedja, och två separata mätgivare ("Givare inre"
→ PV_inre, "Givare yttre" → PV_yttre) som grenar av från samma processutgång. Texten
i diagrammet ("inre slingan hanterar en snabb störning innan den hinner påverka den
yttre processvariabeln") är EXAKT den mekanism som verifierades numeriskt i avsnitt 1.

**En observation värd att notera för PO/innehållsförfattare:** diagrammet ritar EN
gemensam "Process"-ruta med två avgreningspunkter för mätning — en vedertagen,
pedagogiskt korrekt förenkling i läroboks-blockschema. I den faktiska implementationen
motsvaras detta av **två separata, kedjade `ProcessModel`-instanser** (inre, snabb;
yttre, långsam) snarare än en enda processobjekt avläst på två ställen — precis som
i min prototyp i avsnitt 2–3. Detta är ingen brist i diagrammet (det är korrekt på
sin egen abstraktionsnivå och fullt användbart som elevmaterial rakt av), men är
värt en fotnot i implementationsdokumentationen så att skillnaden mellan pedagogisk
bild och kodarkitektur inte blir en överraskning senare — samma typ av avstämning
som STRAT-006 gjorde för `04-kvotreglering.svg` (där diagrammet direkt matchade
koden, utan denna typ av anmärkning).

Diagrammet är alltså **direkt användbart** som elevmaterial och som utgångspunkt för
en implementationsskiss, med ovanstående enda förtydligande.

---

## 6. UI-påverkan

Samtliga tre redan byggda strategier (Parameterstyrning, Framkoppling, Kvotreglering)
fick plats som NYA FÄLT inuti en av UX-004:s tre BEFINTLIGA grupper
(`groupProcessinstallning`/`groupRegulatorkonfiguration`/`groupProcesspaverkan`),
oftast i respektive grupps delade `.advanced-toggle`-sektion (bekräftat i
`apps/app/index.html`: Kvotreglerings fält ligger i både Processinställnings och
Regulatorkonfigurations Avancerat-sektioner via `data-addon="kvotreglering"`;
Framkopplings Kff ligger i Regulatorkonfigurations Avancerat via
`data-addon="framkoppling"`; Parameterstyrnings schema ligger där via
`data-addon="parameterstyrning"`). Kaskadreglering bryter detta mönster strukturellt:
den behöver inte NYA FÄLT i de befintliga grupperna, den behöver en HEL ANDRA UPPSÄTTNING
av både "Processinställning" och "Regulatorkonfiguration" (den inre slingans egna
K/T/L/normalValue respektive Kp/Ti/Td) — dubblerade GRUPPER, inte utökade fält i
befintliga grupper. `index.html`s tre grupper är handskrivna, singulära DOM-block,
inte en repeterbar mall — samma slutsats som STRAT-001 avsnitt 5.1 punkt 3 drog
("`fields{}`... generaliserar inte till 'N slingor' utan dubblerad HTML").

**Två strukturella alternativ, PO bör välja innan kodning påbörjas — inte en
underförstådd teknisk detalj:**

1. **Dubblerad panel:** lägg till "Inre process"/"Inre regulator" som synliga kopior
   av de två grupperna, färgkodade (t.ex. som i SVG:ns orange/lila-uppdelning),
   troligen bakom en egen "Kaskadreglering"-växel — men på GRUPPNIVÅ, inte
   fältnivå som dagens `.advanced-toggle`. Fördel: båda slingorna synliga samtidigt
   (viktigt pedagogiskt, se avsnitt 9). Nackdel: dubbel vertikal höjd i sidopanelen.
2. **Vy-växlare:** en enda uppsättning fält med en flik/växlare "Visa: Yttre / Inre
   slinga". Fördel: ingen extra vertikal höjd. Nackdel: eleven ser aldrig båda
   slingornas parametrar samtidigt — en reell pedagogisk kostnad eftersom hela
   poängen med kaskad är SAMBANDET mellan slingorna.

**Graf:** `drawChart()` (`apps/app/app.js:161`) är hårdkodad för exakt EN PV/SP-panel
och EN u-panel (`sim.history.y/sp/u`, fasta paddings/skalor för två fasta rektanglar).
Varje tidigare byggd strategi lade bara till OVERLAY-linjer/markeringar OVANPÅ dessa
två befintliga paneler (t.ex. Kvotreglerings `wildFlow`-linje, Parameterstyrnings
zongränslinjer, PB-bandet) — ingen av dem behövde en tredje panel. Kaskadreglering
behöver realistiskt visa FYRA serier meningsfullt grupperade (PV1/SP1, PV2/SP2, plus
respektive u) — sannolikt en tredje och fjärde panel, eller en växling mellan
"yttre vy"/"inre vy". Detta är ett steg längre än ens den ännu obyggda
flerserie-förmågan i FEAT-032/FEAT-005 (flaggad i STRAT-001 som obeprövad mark) —
kaskad behöver strikt mer än vad de två skulle leverera på egen hand.

---

## 7. Interaktion med befintliga reglerstrategier och mekanismer

- **Parameterstyrning:** kan i princip appliceras oberoende på ENTINGEN slingans
  regulator (schemalägga inre Kp/Ti som funktion av PV2, eller yttre som funktion av
  PV1). Tekniskt konfliktfritt, men dubblerar frågan "vilken slinga gäller detta
  schema för?" i UI:t.
- **Framkoppling:** den naturliga, läroboksmässigt IDEALA kombinationen är att mata
  en mätbar störning direkt in i den INRE slingan (snabbast möjliga korrigeringspunkt)
  — och det finns goda arkitektoniska nyheter här: `auxGain`/`auxTerm` sitter redan
  per `ProcessModel.cfg` (bekräftat i `sim-core.js`), så VARDERA av de två
  processinstanserna skulle kunna ha sin egen, oberoende `auxSignal` utan omarbetning.
  Kombinationen kaskad+framkoppling är dock ett eget, avancerat scenario — inte
  nödvändig för kaskadens egen MVP.
- **Kvotreglering:** kan konceptuellt komponeras (t.ex. att den yttre slingans
  `SP2`-utsignal går till en kvotstation istället för rakt in i den inre regulatorn),
  men detta är sammansatt/avancerad framtida funktionalitet, inte något kaskadens
  grundleverans behöver ta ställning till nu.
- **Processbegränsningar (measurementRange/outputLimits):** redan per-instans i
  dagens `cfg`-objekt (bekräftat), så detta skalar rent till två slingor — bara
  dubbla fält, ingen ny mekanism.
- **Bumplös övergång (bias/fade):** redan generell nog (STRAT-001 avsnitt 5.3s
  slutsats, oförändrad efter granskning) — gäller oberoende och identiskt per
  `PIDController`-instans, ingen ny mekanism behövs, bara att trigga den per slinga.
- **Anti-windup:** den enda mekanismen som INTE redan är generell nog — se
  "kaskad-windup" i avsnitt 3. Detta är den enda genuint nya reglertekniska
  komponenten bland samspelen ovan.

---

## 8. Förslag till lärstig

Samma problem/lösning/vanliga fel/slutsats-progression som redan används för
Framkoppling, Kvotreglering och Parameterstyrning:

1. **Problem:** en enkelslinge-temperaturregulator utsätts för en flödesstörning
   (motsvarande enkelslinge-fallet i avsnitt 1: topp-avvikelse 3,18 enheter, 349
   steg återhämtning). Eleven upplever att regulatorn "inte vet om" störningen
   förrän den redan syns i PV1.
2. **Lösning:** samma störning, nu med en aktiverad inre flödesslinga (kaskad).
   Eleven ser PV1 knappt röra sig (0,26 enheter, i praktiken omärkbart) medan PV2/den
   inre slingan gör allt arbete snabbt och synligt.
3. **Vanliga fel:** ett scenario med en feltrimmad INRE slinga (t.ex. för lång Ti
   eller för låg Kp, så att den inre slingan inte längre är tydligt snabbare än den
   yttre) — visar att kaskadens fördel bygger på att den inre slingan VERKLIGEN är
   snabb; en för långsamt trimmad inre slinga ger liten eller ingen nytta jämfört
   med enkelslinga (ett klassiskt, verkligt nybörjarfel med kaskadreglering).
4. **Slutsats/reflektion:** en jämförande fråga mot Framkoppling (tidigare lärstig):
   "när väljer du framkoppling, och när kaskad?" — svar: framkoppling när en
   SPECIFIK, i förväg känd störningskälla kan mätas direkt; kaskad när det finns en
   snabbare, mätbar MELLANVARIABEL mellan manöverdon och slutlig PV, oavsett varifrån
   störningen faktiskt kommer.

---

## 9. Risker

- **Störst risk (redan flaggad i STRAT-001, kvarstår oförändrad efter kodgranskning):**
  UI/graf. Det finns ingen etablerad lösning i appen för "två slingor samtidigt" —
  varken i sidopanelen (kräver dubblerade grupper, inte fler fält i befintliga) eller
  i grafen (kräver fler paneler/serier än någon tidigare strategi eller ens de ännu
  obyggda FEAT-032/FEAT-005). Detta är den enda av de fyra strategierna som kräver
  ett helt nytt UI/graf-mönster, inte en utökning av ett befintligt.
- **Näst störst:** kaskad-windup-logiken (avsnitt 3/7) saknar helt befintlig förlaga
  i kodbasen — kräver en egen design- och testomgång, inte en enkel återanvändning
  av dagens anti-windup.
- **Pedagogisk risk:** väljs vy-växlaren (alternativ 2, avsnitt 6) istället för
  dubblerade paneler, riskerar eleven att aldrig se BÅDA slingornas samband samtidigt
  — vilket är hela kaskadens pedagogiska poäng. PO bör väga detta minst lika högt som
  kodkostnaden vid UI-beslutet.
- **Lägre risk:** själva den reglertekniska kärnan är redan bevisat fungerande med
  OFÖRÄNDRADE `ProcessModel`/`PIDController`-klasser (avsnitt 1/3) — det finns ingen
  risk att grundmekaniken inte skulle fungera. Riskerna ligger i orkestrering, UI,
  historik-schema och test — inte i reglertekniken.

---

## 10. Bedömning av implementationsomfattning

**STOR.**

Kaskadreglering är den enda av de fyra strategierna (jämför STRAT-001s kostnads-/
värdetabell, avsnitt 4) som kräver samtliga av följande, samtidigt:

- En ny orkestreringsklass eller en väsentlig ombyggnad av `Simulation` (två
  fullständiga par process+regulator i beroendeordning, istället för dagens ett par).
- Ett nytt `history`-schema, namnrymdat per slinga (dagens platta dict med fasta
  nycklar `y/sp/u/...` räcker inte till en andra slinga utan namnkrock).
- Ett nytt, nästlat scenarioformat — en verklig schemaändring, inte ett tillägg
  (till skillnad från Framkoppling/Kvotreglering, som bara lade till nya, platta fält).
- Ett helt nytt UI-mönster (dubblerade grupper eller vy-växlare) — inget att
  återanvända från UX-004:s `.advanced-toggle`-mönster, som är byggt för fält inuti
  en grupp, inte för en andra uppsättning grupper.
- Ett nytt grafmönster (minst två ytterligare paneler/serier utöver dagens två).
- Genuint ny reglerteknisk logik (kaskad-windup) utan befintlig förlaga.

Till skillnad från Parameterstyrning, Framkoppling och Kvotreglering — som alla
byggdes som TILLÄGG inuti den befintliga `Simulation.step()`/UX-004-strukturen — är
Kaskadreglering ett STRUKTURELLT åtagande i samma storleksordning som UX-004 självt,
eller större. Kvotreglering (STRAT-006) bedömdes som den billigaste återstående
strategin just för att den återanvände Framkopplings hjälpsignal-infrastruktur rakt
av; Kaskadreglering återanvänder däremot nästan ingenting av det som redan finns —
enbart `PIDController`s generiska `step(setpoint, pv)`-signatur och de redan
per-instans-satta `auxGain`/gränsfälten är direkt återanvändbara. Allt annat
(orkestrering, historik, scenarioformat, UI, graf, kaskad-windup) är nytt arbete.

**Rekommendation:** hantera som ett eget, avgränsat uppdrag med en egen UI/graf-
designrunda med PO INNAN kodning påbörjas — UI/graf-mönstret är den största och mest
PO-känsliga öppna frågan (avsnitt 6/9) och bör facitbestämmas separat, inte antas
implicit under implementationen. Kaskadreglering bör inte påbörjas som en direkt
vidareutveckling av mönstret från Parameterstyrning/Framkoppling/Kvotreglering — det
är ett annat sorts uppdrag.

---

## Sammanfattande rekommendation

Kaskadreglering har mycket högt pedagogiskt värde och dess reglertekniska kärna är
bevisat fungerande med redan existerande, oförändrade klasser — det finns ingen
teknisk tvekan om att MEKANIKEN fungerar. Men det är den enda av de fyra
reglerstrategierna som kräver nya mönster på samtliga nivåer samtidigt: orkestrering,
historik/scenarioformat, UI och graf, samt en genuint ny reglerteknisk komponent
(kaskad-windup) utan befintlig förlaga. Där Kvotreglering kunde byggas som en
återanvändning av Framkopplings infrastruktur, är Kaskadreglering ett eget,
avgränsat och väsentligt större projekt — i praktiken jämförbart i omfattning med
UX-004 självt. PO:s viktigaste beslut innan utveckling påbörjas är UI/graf-mönstret
(avsnitt 6): dubblerade paneler eller vy-växlare — ett beslut med både en kod- och
en pedagogisk konsekvens, och som bör fattas medvetet, inte upptäckas under kodning.
