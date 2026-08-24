# PED-002 — Progressionskartläggning

**Uppdrag:** PED-002
**Utförd av:** Claude Code (CC), analysroll — inga produkt- eller pedagogiska beslut fattade
**Datum:** 2026-08-21
**Källor:** `docs/planning/Planering Industriell Mät och Reglerteknik.md`, `apps/app/content/catalog.json`
och samtliga scenario-/teori-/lärstigsfiler, samt `docs/reports/PED-001_NULAGE.md` och
`docs/reports/SCENARIER-LARSTIGAR-OVERSIKT.md` (tidigare analyser).

Detta är en analys- och inventeringsrapport. Ingen kod är skriven, inga befintliga filer
är ändrade. Rapporten föreslår struktur — den fattar inga pedagogiska eller
produktbeslut.

**Viktig avgränsning:** Kursen innehåller stora moment om mätteknik och instrumentering
(temperatur-, nivå-, tryck- och flödesmätning, givartyper, P&ID-scheman, styrdon).
PID Simulator är ett reglertekniskt verktyg — det simulerar inte givare, scheman eller
fysiska instrument. Den här kartläggningen täcker **bara den reglertekniska delen** av
varje vecka, i linje med uppdraget. Veckor med tungt instrumenteringsfokus (särskilt
vecka 37–38) har därför tunnare koppling till appen — det är en avgränsning, inte en
lucka i appen.

---

## 1. Progressionsförslag

| Vecka | Tema (kursplan) | Reglerteknik-relevant innehåll i kursplanen | Rekommenderade lärstigar/steg | Scenarier | Teori |
|---|---|---|---|---|---|
| **35** | Introduktion och grundläggande reglerteknik | Grundläggande begrepp, introduktion till reglering, P-reglering, ON/OFF och PWM P-reglering | `kom-igång.v1` (app-orientering) → `grundlaggande.v1` steg 1–3 (on/off, P) | `onoff-basic`, `p-step-self-regulating` | `pid-intro` |
| **36** | Processanalys och signalhantering | Processanalys, optimering av reglerkretsar, grundläggande PID-reglering | `grundlaggande.v1` steg 4–5 (PI, PID) → `processbegransningar.v1` → `windup.v1` del 1 (windup/anti-windup, se avsnitt 2) | `pi-step-self-regulating`, `pid-step-self-regulating`, `pi-windup-demo` | `process-basics`, `integrator-windup` |
| **37** | Nivå, tryck och scheman | Fortsättning praktiska experiment med reglering (nivåreglering är den reglertekniskt relevanta biten) | `windup.v1` del 2 (integrerande process/nivåreglering, se avsnitt 2) — flyttad hit tematiskt | `integrating-pi` | `integrating-process` |
| **38** | Flöde, styrdon och industriell tillämpning | Styrdon och reglerventiler, olika reglerstrategier | `processbegransningar.v1` (alternativ placering — se not) som "ventilkapacitetstak". **Kritisk lucka:** verkningsriktning (FEAT-022) hör tematiskt hemma här men är obyggd. | — | — |
| **39** | Avancerade reglerstrategier | Manuell optimering av PID, analys av kurvformer och felkällor, kaskad/kvot/framkoppling/parameterstyrning | `stegsvar-identifiering.v1` (om ej redan gjord v37) → `lambda-metoden.v1` (i den ordningen, se avsnitt 2). **Kritisk lucka:** kaskad, kvot, framkoppling, parameterstyrning saknas helt. | `manual-identification`, `lambda-open-loop`, `lambda-pi-*` | `tangentmetoden`, `lambda-metoden` |
| **40** | Repetition och avslutning | Repetition, prov | Fri repetition i **Test-läge** på valfria tidigare lärstigar (poängsatt kunskapskontroll finns redan inbyggt) | valfria | valfria |

**Not om vecka 38:** `processbegransningar.v1` (om y_max = normalValue + K×u_max, dvs. processens fysikaliska tak) kan motiveras både i vecka 36 ("processanalys", K/T/L-fokus) och vecka 38 (u_max som ventilens maxkapacitet, "styrdon"-tema). Innehållet kräver ingen förkunskap från stegsvar-identifiering.v1, så placeringen är flexibel — vilken vecka den passar bäst i är en pedagogisk avvägning för PO/projektledning, inte något CC avgör.

**Not om PWM:** Kursmaterialet nämner "PWM P-reglering" i vecka 35. Appen simulerar en kontinuerlig utsignal (0–100 %), inte en pulsbreddsmodulerad styrsignal. Konceptuellt liknar on/off-scenariot en PWM-regulator med hög växlingsfrekvens, men det är inte samma sak — värt att vara medveten om vid undervisning.

---

## 2. Lärstigsanalys

### `kom-igång.v1` — Kom igång med PID Simulator
- **Syfte:** Ren app-orientering (paneler, knappar, hjälpsystem). Inget reglertekniskt innehåll.
- **Förkunskaper:** Inga.
- **Placering:** Vecka 35, eller som självstudie innan kursstart.
- **Omfattning för ett pass:** Mycket kort (5 steg, ingen quiz) — snarare 10–15 minuters introduktion än ett fullt pass.
- **Delas upp?** Nej.
- **Slås samman?** Överväg att göra den till obligatorisk självstudie före första passet istället för att ta lektionstid i anspråk.

### `grundlaggande.v1` — Grundläggande reglering
- **Syfte:** Progression on/off → P → PI → PID med quiz-checkpoints.
- **Förkunskaper:** `kom-igång.v1` (app-hantering), i övrigt inga.
- **Placering:** Spänner naturligt över två veckor: on/off+P i vecka 35, PI+PID i vecka 36.
- **Omfattning för ett pass:** 5 steg (1 teori + 4 scenario) — rimligt för ett pass som helhet, men eftersom kursplanen delar P-reglering (v35) från PID-fördjupning (v36) matchar en uppdelning kursstrukturen bättre.
- **Delas upp?** **Rekommenderas:** dela vid steg 3/4-gränsen i "Del 1: On/off och P" och "Del 2: PI och PID".
- **Slås samman?** Nej.

### `processbegransningar.v1` — Processens begränsningar
- **Syfte:** K, T, L fysikaliskt, samt processens tak (y_max).
- **Förkunskaper:** PI-reglering (scenariot bygger på `pi-step-self-regulating`).
- **Placering:** Vecka 36 eller vecka 38 (se not i avsnitt 1) — flexibel.
- **Omfattning för ett pass:** 3 steg (1 teori + 2 scenario) — kort, ryms i del av ett pass.
- **Delas upp?** Nej, redan kompakt.
- **Slås samman?** Skulle kunna köras direkt efter PI-delen av `grundlaggande.v1` i samma pass, eftersom den bygger vidare på samma scenario.

### `windup.v1` — Integratoruppvridning & integrerande process
- **Syfte:** Egentligen **två** delämnen i en lärstig: (1) windup/anti-windup, (2) integrerande processer (tanknivå).
- **Förkunskaper:** PI-reglering.
- **Placering:** Delad — se nedan.
- **Omfattning för ett pass:** 5 steg (2 teori + 3 scenario) för två separata ämnen är tight för ett pass.
- **Delas upp?** **Rekommenderas starkt.** Strukturen har redan en naturlig brytpunkt vid steg 3/4:
  - **Del 1 (steg 1–3):** teori `integrator-windup` + `pi-windup-demo` (utan/med anti-windup) → passar vecka 36 ("optimering av reglerkretsar").
  - **Del 2 (steg 4–5):** teori `integrating-process` + `integrating-pi` (tanknivå) → passar vecka 37 ("nivå"-temat) betydligt bättre tematiskt än nuvarande placering i samma lärstig som windup.
- **Slås samman?** Nej — tvärtom bör den delas.

### `lambda-metoden.v1` — Lambda-metoden
- **Syfte:** Modellbaserad PI-tuning (Kp = T/(K×(λ+L)), Ti = T).
- **Förkunskaper:** Kända processparametrar K, T, L.
- **Placering:** Vecka 39, **efter** `stegsvar-identifiering.v1`.
- **Viktigt sekvensfynd:** Lambda-metodens första steg (`lambda-open-loop`) ber studenten *läsa av* K, T, L direkt i Process-gruppen — en genväg. `stegsvar-identifiering.v1`s sista steg refererar redan explicit till att ladda `lambda-pi-moderate` efteråt. Om `stegsvar-identifiering.v1` körs först identifierar studenten K, T, L själv experimentellt och tillämpar sedan Lambda-formeln på sina egna uppmätta värden — mer autentisk progression än att köra dem i omvänd ordning eller isolerat.
- **Omfattning för ett pass:** 5 steg (1 teori + 4 scenario) — rimligt för ett pass.
- **Delas upp?** Nej.
- **Slås samman?** Nej.

### `stegsvar-identifiering.v1` — Stegsvar och processidentifiering
- **Syfte:** Experimentell identifiering av K, T, L via 63 %-metoden och tangentmetoden.
- **Förkunskaper:** Grundläggande förståelse av K, T, L (har egen teori-inledning, kan köras fristående).
- **Placering:** Vecka 37 (kurvläsning/signalflöden) eller tidigt i vecka 39 (analys av kurvformer och felkällor) — **före** `lambda-metoden.v1`.
- **Omfattning för ett pass:** 7 steg (1 teori + 6 scenario), men de 6 scenario-stegen är samma sammanhängande mätövning i delmoment — fungerar som EN sammanhängande laboration. Omfattande men rimligt för ett helt pass.
- **Delas upp?** Nej — stegen hänger ihop som en kontinuerlig mätprocess.
- **Slås samman?** Nej.

---

## 3. Luckanalys

### A — Kritiska luckor (explicit kursmoment, inget stöd alls i appen)

| Lucka | Kursvecka | Kommentar |
|---|---|---|
| Kaskadreglering | 39 | Inget stöd. Kräver flerslingearkitektur i simulatorn — betydligt större arbete än ett enskilt content-tillägg. |
| Kvotreglering | 39 | Inget stöd. Samma typ av arkitekturfråga som kaskad. |
| Framkoppling (feedforward) | 39 | Inget stöd. |
| Parameterstyrning | 39 | Inget stöd. Oklart om kursen menar gain scheduling eller ett annat begrepp — löst relaterat till FEAT-010 (adaptiv reglering, ej byggd) i `docs/tracking/todo.md`, men det är CC:s tolkning, inte en bekräftad koppling. |

### B — Viktiga luckor (relevanta, delvis förberedda men obyggda)

| Lucka | Kursvecka | Kommentar |
|---|---|---|
| Verkningsriktning (direkt/omvänt, t.ex. kyl- vs värmeventil) | 38 | FEAT-022 finns registrerad i `docs/tracking/todo.md` men är obyggd. Matchar "styrdon och reglerventiler" direkt. |
| Systematisk PID-tuning / parameterjämförelse ("manuell optimering") | 39 | Källmaterial finns (`docs/exercises/ovningar-systemoptimering.md`), ingen lärstig byggd. |
| Störningar och robusthet | Flera veckor (praktiska experiment, "felkällor" v39) | Scenarier finns (`pid-disturbance-noise`, `pid-pulse-rejection`), källmaterial finns (`ovningar-signalstorningar.md`), ingen lärstig byggd. |

### C — Framtida utveckling (lägre prioritet, inte explicit i kursplanen)

| Lucka | Kommentar |
|---|---|
| Instabila processer | Scenario finns (`unstable-experimental`), ingen teori eller lärstig. Inte explicit kursmoment. |
| Frekvensanalys av störningar | FEAT-009 i `docs/tracking/todo.md`, låg prioritet, inte i kursplanen. |
| Adaptiv reglering | FEAT-010, låg prioritet, inte i kursplanen. |
| Säkerhetsmarginaler (gain/phase margin) | FEAT-011, låg prioritet, inte i kursplanen. |

---

## 4. Oanvänt innehåll

### Scenarier

| Scenario | Bedömning | Motivering |
|---|---|---|
| `onoff-hysteresis-basic` | Arkivera/radera | Nästan identiskt med `onoff-basic`, tillför inget nytt idag. |
| `manual-open-loop` | Koppla in | Naturlig öppning för vecka 35 ("vad händer utan reglering?") — kursen börjar just med "introduktion till reglering". |
| `pid-disturbance-noise` | Koppla in | Behövs för B-luckan "Störningar och robusthet". |
| `pid-pulse-rejection` | Koppla in | Samma som ovan. |
| `integrating-experimental` | Behåll oanvänd | Ser avsiktligt ut som ett fritt utforskningsscenario, inte tänkt för guidad lärstig. |
| `unstable-experimental` | Arkivera tills vidare | C-lucka, inte i kursplanen just nu. |
| `second-order-identification` | Koppla in | Snabb vinst — utökar `stegsvar-identifiering.v1` med redan skapat innehåll (se `docs/reports/PED-001_NULAGE.md`). |

### Teori

| Teorimodul | Bedömning | Motivering |
|---|---|---|
| `onoff-theory.v1.json` | Koppla in | Byggd men aldrig visad — snabb vinst i `grundlaggande.v1`s on/off-steg. |

### Gammalt material

| Material | Bedömning | Motivering |
|---|---|---|
| `apps/app/content/exercises/basic-learning-path.v1.json` (föräldralös) | Radera | Inte kopplad i `catalog.json`, går inte att ladda, innehållsmässigt ersatt av `grundlaggande.v1`. |
| `docs/exercises/ovningar-signalstorningar.md`, `ovningar-systemoptimering.md` | Koppla in (inte gammalt) | Outnyttjat källmaterial för B-luckorna ovan, inte föråldrat. |
| `docs/architecture/web-rebuild-plan-v1.md`, `docs/agents/agent-backlog-v1.md` | Arkivera | Historiska planeringsdokument för en tidigare, ej fullföljd arkitektursatsning (`apps/web/`). Rent historiskt värde. |
| Två inaktuella statusar i `docs/planning/WEB-IAKTTAGELSER.md` (redan noterat i PED-001) | Uppdatera | Dokumentationsstädning, inte innehåll i sig. |

---

## 5. Kandidater för nästa utvecklingssteg

*Rangordnade efter en kombination av pedagogisk nytta och kursanknytning — urval och prioritering görs av PO/projektledning.*

### 1. Lärstig: "Störningar och robusthet" (B-lucka)
- **Pedagogisk nytta:** Hög — relevant genom hela kursen, matchar "felkällor"-temat i vecka 39 och alla praktiska laborationer.
- **Arbetsinsats:** Medel. Scenarier finns redan (`pid-disturbance-noise`, `pid-pulse-rejection`), källmaterial finns (`ovningar-signalstorningar.md`). Arbetet är strukturering till steg + checkpoints.
- **Beroenden:** Inga.

### 2. FEAT-022 — Verkningsriktning (B-lucka)
- **Pedagogisk nytta:** Hög — enda sättet att täcka vecka 38:s "styrdon och reglerventiler"-tema reglertekniskt, som annars saknar innehåll helt i appen.
- **Arbetsinsats:** Medel–stor. Ny regulatorfunktion (toggle i Regulator-gruppen, påverkar PB-bandets placering) plus nytt scenario (t.ex. kylprocess).
- **Beroenden:** Inga (fristående kodfunktion).

### 3. Koppla in `second-order-identification` i `stegsvar-identifiering.v1`
- **Pedagogisk nytta:** Medel — fördjupar en redan stark lärstig med innehåll som redan finns.
- **Arbetsinsats:** Liten (< 1 dag). Bara nya steg, inget nytt innehåll att skapa.
- **Beroenden:** Inga.

### 4. Dela `grundlaggande.v1` och `windup.v1` enligt avsnitt 2
- **Pedagogisk nytta:** Hög — matchar undervisningspassens längd och kursens veckoindelning direkt (särskilt `windup.v1`s nivåregleringsdel som hör hemma i vecka 37, inte tillsammans med windup-delen).
- **Arbetsinsats:** Liten–medel. Mest omstrukturering av befintligt innehåll, inget nytt att skriva.
- **Beroenden:** PO:s beslut om progression (denna rapport) — detta är sannolikt kärnan i det kommande PED-003-uppdraget.

### 5. Lärstig: "Systematisk PID-tuning / Optimering" (B-lucka)
- **Pedagogisk nytta:** Hög — matchar "Manuell optimering av PID-regulatorer" explicit i vecka 39.
- **Arbetsinsats:** Stor. Källmaterial finns (`ovningar-systemoptimering.md`), men till skillnad från kandidat 1 kräver den sannolikt nya scenarier för systematisk parameterjämförelse, inte bara omstrukturering.
- **Beroenden:** Inga, men mer designarbete krävs än övriga kandidater.

**Utanför listan, men värt att notera:** A-luckorna (kaskad, kvot, framkoppling, parameterstyrning) är inte med bland kandidaterna ovan. De kräver sannolikt en flerslingearkitektur i simulatorn — en betydligt större arkitekturfråga än ett enskilt utvecklingssteg, och bör hanteras som ett eget strategiskt beslut snarare än en post i en prioriterad lista.

---

*Denna rapport är underlag för PO/projektledning att fatta tre beslut: vilka lärstigar som hör hemma i vecka 35–40, vilka som behöver delas upp, och vilka luckor som faktiskt ska utvecklas. Inget i rapporten är ett fattat beslut.*
