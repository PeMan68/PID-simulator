# Simuleringsanalysverktyg

Återanvändbart verktyg för att köra PID Simulator-scenarier automatiserat och
mäta deras dynamiska egenskaper — kvarstående reglerfel, översläng, stigtid,
insvängningstid, oscillation, utsignalsmättning. Byggt för PED-003B
(proportionalband, P/PI/PID-jämförelser) men skrivet för att återanvändas i
framtida parameterstudier och regressionstester av annat pedagogiskt
innehåll.

## Syfte

- Parameterstudier för P-, PI- och PID-reglering.
- Verifiering av pedagogiska jämförelsescenarier (t.ex. "ger detta PI-scenario
  verkligen en tydlig översläng?").
- Kontroll av lärstegsinstruktioner som anger ett fast antal simuleringssteg
  ("kör 50 steg") mot scenariots verkliga insvängningstid.
- Underlag för framtida regressionstest av pedagogiskt viktiga scenarier.
- Jämförelse mellan två regulatorinställningar under identiska villkor.

## Beroenden

Inga externa npm-paket. Ren Node.js (testat på v24). Verktyget använder
**appens egen simuleringskod**, inte en omimplementation.

## Vilken simuleringskärna används — och varför

`apps/app/sim-core.js` — extraherad oförändrad ur `apps/app/app.js` som en
del av PED-003B (se commit-historik). Detta **är** koden webbappen kör i
produktion. Repot innehåller sedan tidigare även `packages/sim-core/`, en
separat implementation som används av `apps/web/` (en experimentell,
icke-produktionssatt app — se `docs/reports/PED-001_NULAGE.md`). De två
kärnorna är inte garanterat numeriskt identiska. Det här verktyget importerar
uteslutande `apps/app/sim-core.js` via `tests/simulation/lib/sim-core-bridge.mjs`,
så resultaten gäller garanterat för det studerande faktiskt möter i appen.

Verktyget löser inte arkitekturfrågan mellan de två kärnorna — det är
medvetet utanför PED-003B:s scope.

## Struktur

```
tests/simulation/
  lib/
    sim-core-bridge.mjs   Laddar apps/app/sim-core.js i Node (CommonJS-interop)
    analyze.mjs           Kärnbibliotek: loadScenario(), runAnalysis(), formatSummary()
  cli.mjs                 Kommandoradsgränssnitt
  analyze.test.mjs        Automatiska tester för verktyget självt
  README.md               Denna fil
```

## Hur verktyget körs

### Enkel scenariokörning

```bash
node tests/simulation/cli.mjs --scenario p-step-self-regulating --steps 100
```

Skriver en människoläsbar sammanfattning till stdout: regulator- och
processparametrar, stationärt fel, max/min PV, översläng, stigtid,
insvängningstid, oscillationsindikering, utsignalsmättning.

### Med SP-ändring mitt i körningen

```bash
node tests/simulation/cli.mjs --scenario pi-step-self-regulating \
  --spChangeStep 20 --newSp 70 --steps 100
```

Kör 20 steg med scenariots ursprungliga SP, ändrar därefter SP till 70 och
kör 100 steg till. De flesta scenariofiler har redan SP satt från start
(processen börjar vid `normalValue`, SP är konstant) — då behövs varken
`--spChangeStep` eller `--newSp`; verktyget mäter automatiskt stegsvaret
mot processens faktiska startvärde.

### Parameterstudie (override av regulatorparametrar)

```bash
node tests/simulation/cli.mjs --scenario pi-step-self-regulating \
  --kp 2.5 --ti 12 --steps 100 --out /tmp/kandidat-a.json
```

`--kp`, `--ti`, `--td`, `--mode` skriver över scenariots egna
regulatorvärden för den här körningen utan att röra scenariofilen. Kombinera
med ett skript som loopar över flera värden och jämför `--out`-filerna för en
systematisk sökning (så gjordes parameterstudien i
`docs/reports/PED-003B_PARAMETERSTUDIE.md`).

### Maskinläsbart resultat

```bash
node tests/simulation/cli.mjs --scenario p-step-self-regulating --steps 100 \
  --json --quiet > result.json
```

eller spara direkt till fil med `--out <path>`. JSON-resultatet innehåller
alla mätvärden plus fullständig historik (`t`, `y`, `u`, `sp` per steg) för
vidare bearbetning eller grafritning.

### Programmatisk användning (för parameterstudier med många körningar)

```js
import { loadScenario, runAnalysis } from "./tests/simulation/lib/analyze.mjs";

const { scenario } = loadScenario("pi-step-self-regulating");
for (const kp of [1, 1.5, 2, 2.5, 3]) {
  const r = runAnalysis({ scenario, steps: 100, controllerOverrides: { kp } });
  console.log(kp, r.overshootPct, r.settledStep);
}
```

## Hur toleransband används

Ett symmetriskt toleransband runt ett referensvärde avgör om PV räknas som
"framme". Referensvärdet är antingen scenariots uppmätta **faktiska
stationära värde** (medelvärde av de sista `settleTailWindow`, default 20,
stegen) eller **SP** — verktyget rapporterar båda som separata mått (se
nästa avsnitt).

Bandets storlek:

- `--tolerance <v>` — absolut band i PV-enheter, eller
- `--tolerancePercent <v>` (default `0.02` = 2 %) — andel av **stegets
  storlek** (|SP − PV vid start|). Om inget verkligt steg sker (SP oförändrad
  och ingen `--spChangeStep` angiven) används istället samma andel av det
  uppmätta stationära värdet, med ett absolut golv på 0.5 PV-enheter så att
  toleransen aldrig blir orimligt snäv för små processer.

## Definition av insvängningstid och stabilisering

**Insvängningstid** (`settledStep`) definieras som: det första
simuleringssteg efter ett eventuellt SP-steg där PV går in i toleransbandet
runt **det uppmätta stationära värdet** och därefter stannar där i minst
`--settleHold` (default 10) sammanhängande steg.

Verktyget skiljer medvetet mellan tre olika tillstånd, som **inte** är samma
sak:

| Fält | Betyder | Referens |
|---|---|---|
| `settledStep` | PV har **stabiliserats** — slutat röra sig nämnvärt | Uppmätt stationärt värde |
| `reachedSpStep` | PV har **nått SP** minst en gång | SP |
| `withinSpToleranceAtEnd` | PV befinner sig **inom toleransband runt SP vid körningens slut** | SP |

En P-regulator med kvarstående reglerfel kan alltså ha `settledStep` satt
(den har stabiliserats) samtidigt som `reachedSpStep` är `null` (den har
aldrig nått SP) — det är precis den distinktion som krävdes av PED-003B och
som verktygets egna tester (`analyze.test.mjs`, test 9) verifierar explicit.

**Integrerande processer** hanteras inte specialfallsmässigt — samma
tolerans- och hold-logik används, men referensen (uppmätt stationärt värde)
är i det fallet jämviktspunkten regulatorn hittar (`u_jämvikt`), inte ett
fixt PV-tak.

## Oscillationsindikering

Räknar lokala maxima/minima i PV-serien efter ett eventuellt SP-steg vars
avvikelse från grannvärdena överstiger halva toleransbandet (för att inte
räkna brus som svängning). Tre eller fler sådana extrempunkter flaggas som
`oscillating: true`. Detta är **inte** en fullständig reglerteknisk
stabilitetsanalys (ingen Nyquist, inga poler) — det är tillräckligt för att
upptäcka pedagogiskt olämpliga eller svårtolkade förlopp, vilket var
kravet.

## Hur mätvärden ska tolkas

- `steadyStateError` = SP − uppmätt stationärt värde. Nära 0 för PI/PID,
  betydande (icke-noll) för ren P-reglering — det är förväntat, inte ett fel.
- `overshootAbs`/`overshootPct` är riktningsmedvetna: för ett stigande steg
  mäts hur mycket PV går **över** det slutliga värdet, för ett fallande steg
  hur mycket den går **under**. `overshootPct` är `null` om inget verkligt
  steg kunde identifieras (stepSize ≈ 0).
- `riseTimeSteps` är 10–90 %-stigtid mellan PV:s startvärde och dess
  stationära slutvärde. Rapporteras som `null` om start- och slutvärde är för
  nära varandra för att definiera robust (t.ex. inget steg skedde).
- `saturatedSteps`/`saturationOccurred` räknar steg där utsignalen låg vid
  `outputLimits.min` eller `.max` — hög `saturatedSteps` under en jämförelse
  betyder att resultatet påverkas av mättning snarare än ren
  regulatordynamik (relevant för PED-003B:s krav på att mättning inte får
  dominera jämförelser).

## Kända begränsningar

- Oscillationsmåttet är en heuristik (se ovan), inte en formell
  stabilitetsanalys.
- Stigtiden kan bli `null` för mycket korta eller icke-monotona förlopp.
- Verktyget hanterar inte pulsstörningar (`triggerPulse()`) i den
  automatiserade körningen — bara det ordinarie stegsvaret. Kan läggas till
  vid behov utan att ändra kärnlogiken.
- Bygger på `apps/app/sim-core.js`; om appen i framtiden byter
  simuleringskärna (se arkitekturfrågan `apps/app` vs. `packages/sim-core`)
  måste `sim-core-bridge.mjs` pekas om.

## Hur verktyget kan användas för att kontrollera lärstegens instruktioner

En instruktion som "kör 50 steg och observera att PV stabiliserats" kan
verifieras direkt:

```bash
node tests/simulation/cli.mjs --scenario <scenario-i-steget> --steps 50 --json --quiet \
  | node -e "const r=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log('Stabiliserad inom 50 steg:', r.settledStep !== null && r.settledStep <= 50)"
```

eller enklare: kör med `--steps <N>` och läs `settledStep`,
`reachedSpStep` och `overshootPct` i sammanfattningen — om `settledStep` är
`null` eller större än det antal steg instruktionen anger, är instruktionen
sannolikt för optimistisk och bör justeras eller bytas mot ett observerbart
kriterium ("kör tills PV planar ut") istället för ett fast stegantal.

Detta är exakt hur stegantalen i PED-003B:s nya och ändrade lärstegssteg
togs fram — se `docs/reports/PED-003B_PARAMETERSTUDIE.md`.

## Automatiska tester

```bash
node tests/simulation/analyze.test.mjs
```

Verifierar bland annat: läsning av giltigt/ogiltigt scenario, reproducerbart
resultat vid samma seed, korrekt identifiering av kvarstående reglerfel
(P), korrekt identifiering av att SP nås (PI), rimlig
översläng/insvängningstid för kända scenarier, utsignalsmättning, samt att
resultat kan sparas och läsas tillbaka som giltig JSON.
