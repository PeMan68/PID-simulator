# STRAT-002 — Behöver Parameterstyrning en icke-linjär processmodell först?

**Datum:** 2026-09-18
**Uppdragsgivare:** PO (uppföljning på STRAT-001)
**Typ:** Ren analys — inget kodarbete, ingen implementation
**Underlag:** `apps/app/sim-core.js` (`ProcessModel`), `apps/app/content/scenarios/*.json`,
`apps/app/content/exercises/processbegransningar.v1.json` (etablerad pedagogisk stil
för K/T/L), `docs/reports/STRAT-001_FORSTUDIE-REGLERSTRATEGIER.md`

---

## 1. Sammanfattning och rekommendation

**Svaret på PO:s fråga är varken "direkt" eller "först" — det är "tillsammans."**

Parameterstyrning (regulatorns Kp/Ti/Td som funktion av en driftpunkt) och en enkel
icke-linjär processmodell (processens egen K som funktion av samma sorts driftpunkt)
löses av **samma lilla tekniska primitiv**: en liten brytpunktstabell (2–3 zoner) som
slår upp ett värde givet en indatavariabel. Att bygga den ena utan den andra sparar
i praktiken inget arbete — men att bygga den andra kostar bara marginellt mer när
primitiven ändå finns. Att skjuta upp processmodellen till "senare" riskerar istället
att Parameterstyrning levereras utan en verklig anledning att existera i simulatorn
(STRAT-001:s öppna fynd, se avsnitt 2).

**Konkret förslag:** bygg Parameterstyrning och **fall 4.1 (ventilkarakteristik)**
tillsammans, som ett uppdrag. Fall 4.2 (konisk tank) är en naturlig, billig uppföljning
som återanvänder samma mekanism mot den redan existerande integrerande-processfamiljen.
Fall 4.3 (belastningsberoende K) bör **vänta** tills Framkopplings hjälpsignal-koncept
(STRAT-001, avsnitt 5.3) finns byggt — annars byggs samma sak två gånger. Fall 4.4
(pH-neutralisering) avfärdas — se avsnitt 4.4 för varför.

---

## 2. Varför frågan är befogad

STRAT-001 (avsnitt 3.1) konstaterade att dagens `ProcessModel` (`sim-core.js`) är
**linjär** — `K` är ett konstant tal i scenario-JSON, oavsett driftpunkt. Det redan
levererade innehållet är dessutom byggt kring att K har en konkret, fysikalisk,
verifierbar mening: `processbegransningar.v1` lär ut `PV_max = normalValue + K × u_max`
som en **fast** fysikalisk gräns, verifierad med riktiga försök (K=1.3 vs. K=0.5,
samma process, olika tak). Om Parameterstyrning läggs ovanpå en process där K aldrig
förändras blir schemat ett rent tekniskt exempel — studenten kan inte se **varför**
Kp behöver vara olika vid olika driftpunkter, eftersom processen alltid svarar likadant
oavsett var den befinner sig. Frågan är alltså inte kosmetisk; den avgör om featuren
har ett verkligt pedagogiskt existensberättigande i just den här simulatorn.

---

## 3. Teknisk baslinje

I `ProcessModel.step()` används `this.cfg.K` som en ren konstant i samtliga fyra
processtyper (`self_regulating`, `integrating`, `unstable`, `self_regulating_2`). Att
göra K driftpunktsberoende kräver **ingen ny processtyp** — bara att konstanten `K`
byts mot en uppslagning: `K_effektiv = schedule(x)`, där `x` är antingen `this.y` (PV),
`ud` (regulatorns utsignal efter dötidsfördröjning, dvs. "ventilställning") eller en
extern variabel. Det är **samma sorts brytpunktstabell** som Parameterstyrning redan
behöver för regulatorns egna Kp/Ti/Td (STRAT-001, avsnitt 3.1) — bara applicerad på
processobjektet istället för regulatorobjektet. Ingen ny signal, ingen ny
regulatorinstans, ingen ny process — väl inom den enkelslinge-arkitektur STRAT-001
rekommenderade att hålla fast vid.

---

## 4. Fyra kandidatfall

### 4.1 Ventilkarakteristik — K som funktion av utsignalen (K(u))

**Fysikalisk bakgrund:** Verkliga styrventiler har en "installerad karakteristik" —
förhållandet mellan ventilställning (regulatorns utsignal, %) och verkligt flöde är
sällan linjärt. Vanligast i kurslitteratur: linjär, snabböppnande och
likaprocentuell (equal-percentage) karakteristik — den sistnämnda ger LÅG
processförstärkning nära stängd ventil och HÖG förstärkning nära fullt öppen.

**Teknisk omfattning:** Litet–medelstort. K blir funktion av `ud` (utsignalen efter
ev. dötid) istället för PV — en 2–3-zons brytpunktstabell på processobjektet, exakt
samma mekanism som Parameterstyrningens regulatorschema. Ingen ny signal krävs:
`u`/`ud` finns redan i varje simuleringssteg och redan i historiken.

**Pedagogiskt värde:** Mycket högt. Ger Parameterstyrning en direkt, konkret
motivering: "regulatorn behöver kompensera för att VENTILEN i sig är olinjär" — en av
de vanligaste verkliga anledningarna till gain scheduling i industrin, och en naturlig
fortsättning på redan levererat Kp/PB-innehåll (`proportionalband-forstarkning.v1`).

**Realism:** Hög — välkänt, väldokumenterat fenomen, sannolikt redan del av kursens
litteratur.

**Lämplighet för PID Simulator:** Hög. Berör `self_regulating`, processtypen som
används av 20 av 24 nuvarande scenarier — bredast möjliga återanvändning av befintligt
innehåll och etablerad terminologi.

---

### 4.2 Konisk/oregelbunden tank — K som funktion av nivån (K(y))

**Fysikalisk bakgrund:** En konisk eller oregelbunden tank har ett tvärsnitt som
ändras med nivån — samma nettoinflöde ger olika stigningshastighet beroende på var i
tanken nivån befinner sig (smalt tvärsnitt = snabb stigning, brett tvärsnitt = långsam
stigning, eller tvärtom för en inverterad kon).

**Teknisk omfattning:** Litet–medelstort, samma mekanism som 4.1 men applicerad på
`integrating`-processtypen (K blir funktion av `this.y` istället för konstant).

**Pedagogiskt värde:** Mycket högt, och med en särskild fördel: kopplar direkt till
den redan existerande `integrerande-process-niva.v1`-lärstigen (nivåreglering) —
ingen ny grundberättelse behövs, bara en fördjupning av en redan etablerad. Konisk
tank är dessutom en internationellt vedertagen standardförklaring för olinjär
processförstärkning i reglerteknikkurser.

**Realism:** Hög — klassiskt läroboksexempel.

**Lämplighet för PID Simulator:** Hög, men smalare bas än 4.1 — bara 2 av 24
nuvarande scenarier använder `integrating`. Rekommenderas som naturlig **uppföljning**
till 4.1, inte som förstahandsval, eftersom den arbetar mot en mindre del av
befintligt innehåll.

---

### 4.3 Belastningsberoende förstärkning — K som funktion av en extern last

**Fysikalisk bakgrund:** I många processer (värmeväxlare, flödesberoende
transportfördröjning) ändras processförstärkningen med **produktionstakten/lasten** —
en variabel som varken är PV eller regulatorns utsignal, utan sätts av en annan del av
anläggningen.

**Teknisk omfattning:** Medel — kräver en variabel som representerar "extern last."
**Viktigt fynd:** detta är exakt den typ av mätbar, extern signal som STRAT-001
rekommenderade att generalisera som ett "hjälpsignal"-koncept (`AuxSignal`) för
Framkopplings skull. Om det konceptet byggs enligt STRAT-001:s rekommendation kan
detta fall återanvända det direkt (K = schema(hjälpsignal)) till marginell kostnad. Om
det **inte** finns än krävs en egen, duplicerad lösning — samma antimönster STRAT-001
varnade för i avsnitt 5.3.

**Pedagogiskt värde:** Högt, också ett vedertaget verkligt gain-scheduling-fall.

**Realism:** Hög.

**Lämplighet för PID Simulator:** Medel **just nu** — hög **efter** att Framkoppling
byggts. Rekommenderas medvetet **bortprioriterat** tills dess, inte avfärdat.

---

### 4.4 pH-neutralisering — extrem olinjäritet (S-kurva)

**Fysikalisk bakgrund:** pH-reglering nära neutralpunkten är notoriskt kraftigt
olinjär (en droppe reagens ger enorm pH-förändring nära pH 7, försumbar förändring
långt därifrån) — sannolikt DET mest kända läroboksexemplet på gain scheduling i
internationell kurslitteratur.

**Teknisk omfattning:** Stor. Kräver en genuint brantare, S-formad K(PV)-relation
(inte en enkel 2–3-zons brytpunktstabell) för att vara meningsfull, och pH är inte
naturligt uttryckt i simulatorns genomgående 0–100 %-konvention (verifierad i
PED-003C som gäller samtliga 24 nuvarande scenarier).

**Pedagogiskt värde:** Mycket högt i teorin — men bryter mot appens etablerade,
konsekventa "allt är 0–100 %"-modell, vilket riskerar att förvirra mer än det
förtydligar i just denna simulator.

**Realism:** Mycket hög (det mest "läroboksäkta" fallet av de fyra).

**Lämplighet för PID Simulator:** **Låg.** Rekommenderas avfärdat — inte för att
fenomenet är mindre relevant, utan för att det kräver att bryta en redan etablerad,
genomgående konvention i appen för en enskild feature. Tas med i denna förstudie för
att visa att realism och lämplighet är två olika axlar, inte samma sak.

---

## 5. Jämförelsetabell

| Fall | Processtyp | Driftpunktsvariabel | Teknisk omfattning | Ped. värde | Realism | Lämplighet |
|---|---|---|---|---|---|---|
| 4.1 Ventilkarakteristik | `self_regulating` | u (utsignal) | Litet–medel | Mycket högt | Hög | **Hög — rekommenderas först** |
| 4.2 Konisk tank | `integrating` | y (PV) | Litet–medel | Mycket högt | Hög | Hög — naturlig uppföljning |
| 4.3 Belastningsberoende | (nytt, delad signal) | extern last | Medel (villkorat) | Högt | Hög | Medel nu / hög efter Framkoppling |
| 4.4 pH-neutralisering | (nytt) | y (PV), S-kurva | Stort | Mycket högt (teoretiskt) | Mycket hög | **Låg — avfärdas** |

---

## 6. Teknisk synergi med Parameterstyrning

Den brytpunktstabell STRAT-001 föreslog för regulatorns Kp/Ti/Td (avsnitt 3.1) och den
tabell fall 4.1/4.2 här föreslår för processens egen K är **samma mekanism**, bara
applicerad på olika objekt (regulator kontra process) och i vissa fall olika
driftpunktsvariabel (PV kontra u). Att bygga och testa denna uppslagsmekanism en gång
och återanvända den på båda ställena är billigare än att bygga Parameterstyrning
"rent" och sedan lägga till processens olinjäritet som ett separat uppdrag senare —
och det tar bort STRAT-001:s öppna fråga i samma veva.

---

## 7. Rekommendation (svar på PO:s uppdrag)

1. **Bygg inte Parameterstyrning fristående.** Bygg den tillsammans med fall 4.1
   (ventilkarakteristik på `self_regulating`) som ETT uppdrag — de delar mekanism, och
   utan 4.1 riskerar Parameterstyrning att sakna verklig pedagogisk grund.
2. **Fall 4.2 (konisk tank)** är en billig, naturlig uppföljning mot
   `integrerande-process-niva.v1` — kan komma direkt efter, eller i samma uppdrag om
   omfattningen tillåter.
3. **Fall 4.3 (belastningsberoende K)** bör medvetet vänta till efter Framkoppling är
   byggd, för att återanvända dess hjälpsignal-koncept istället för att duplicera det.
4. **Fall 4.4 (pH) avfärdas** för den här simulatorn — realistiskt men olämpligt givet
   appens etablerade 0–100 %-konvention.

## 8. Öppna frågor till PO/PM innan ett bygguppdrag formuleras

- Vilken/vilka brytpunktsvariabler ska UI:t exponera som redigerbara i scenario-JSON
  kontra vara fasta per scenario (styr hur mycket av "experimentera fritt" kontra
  "färdigbyggt exempel" featuren ska stödja)?
- Ska en enda ny lärstig introducera både regulatorns schema och processens
  olinjäritet tillsammans (rekommenderas, matchar hur `processbegransningar.v1`
  redan bygger förståelse i två kopplade steg), eller hållas isär?

Ingen kod är skriven i denna förstudie.
