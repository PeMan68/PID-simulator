# PROD-001A — Publiceringsunderlag för första undervisningsreleasen

**Utförd av:** Claude Code (CC)
**Datum:** 2026-08-23
**Uppdrag:** Ren analys och inventering — inget kodblock, ingen katalog, ingen miljökonfiguration,
inget innehåll har ändrats, dolts eller tagits bort. Detta dokument är beslutsunderlag för
PO (Per Manholm) och PM (Microsoft Copilot); klassificeringarna nedan är CC:s preliminära
rekommendationer, inte beslut.

Bakgrund/princip som styr det kommande PROD-001B (inte del av detta uppdrag): funktioner tas
inte bort ur kodbasen när de godkänns för produktion. `develop` visar allt och är fullt
testbart; `main`/produktion visar bara det som är uttryckligen godkänt, styrt av en
produktionskonfiguration (t.ex. en katalog eller flaggor) — inga tillfälliga kodblock som
manuellt tas bort. Detta dokument avgör vad den konfigurationen ska säga.

Maskinläsbar tvilling: [`PROD-001A_PUBLICERINGSUNDERLAG.json`](PROD-001A_PUBLICERINGSUNDERLAG.json)
(55 poster, samma sakuppgifter). Laddas INTE av appen, är INTE produktionskonfiguration.

---

## 1. Sammanfattning av nuvarande struktur

### Var innehåll registreras
Hela innehållet är fil-baserat under `apps/app/content/`. En enda manifestfil,
[`content/catalog.json`](../../apps/app/content/catalog.json) (nuvarande `version: "v1.5.3"`),
listar tre arrayer: `scenarios[]`, `theory[]`, `learning_paths[]`, var och en med `{id, file}`
(lärstigar har dessutom bara `id`+`file`, ingen separat titel i katalogen — titeln kommer från
innehållsfilen).

### Hur katalogen laddas
`loadCatalog()` i [`apps/app/app.js:14`](../../apps/app/app.js#L14) körs vid appstart:
hämtar `catalog.json`, hämtar därefter **alla** filer i alla tre arrayerna parallellt via
`Promise.all(...)`, och fyller tre globala uppslagsobjekt: `SCENARIOS`, `THEORY`,
`LEARNING_PATHS` (nyckel = filnamn för scenarier/teori, `id` för lärstigar). Katalogens
`version`-fält läggs på som `?v=`-cache-busting på varje enskild innehållshämtning.

**Kritiskt för produktionskonfiguration:** appen laddar och håller i minnet **allt** som står
i `catalog.json` — det finns idag ingen mekanism som väljer ett delmängd vid inläsning. Att
dölja innehåll i produktion kräver antingen en separat produktionskatalog eller ett
filtreringssteg i `loadCatalog()`/dropdown-uppbyggnaden.

### Hur menyerna byggs
- **Scenarioväljaren** (`#scenario`, tom `<select>` i `index.html`) fylls i
  [`app.js:602`](../../apps/app/app.js#L602): `Object.entries(SCENARIOS).forEach(...)` —
  **samtliga** registrerade scenarier listas, oavsett om de används av någon lärstig eller ej.
- **Lärstigsmenyn** (`#learningPath`) fylls på motsvarande sätt i
  [`app.js:603`](../../apps/app/app.js#L603) från `LEARNING_PATHS`, i catalog.json:s ordning.

### Hur Guidat läge / Test-läge / presentationsläge aktiveras
- `let testMode = false;` ([`app.js:57`](../../apps/app/app.js#L57)) — modul-global boolean.
  Enda skrivvägen är två klicklyssnare: `#modeGuided` → `setTestMode(false)`,
  `#modeTest` → `setTestMode(true)` ([`app.js:689–690`](../../apps/app/app.js#L689)).
  **Ingen** URL-parameter, tangentbordsgenväg eller `localStorage`-flagga kan aktivera
  Test-läge — bekräftat genom uttömmande sökning (se avsnitt 7).
- Presentationsläge aktiveras via `#btnPresent` → `openPresentMode()`
  ([`app.js:761`](../../apps/app/app.js#L761)), byggd i PED-003A. Renderar aktuellt
  lärstigssteg i en overlay (`#presentOverlay`); visar arkitekturellt aldrig
  `checkpoint.options`.

### Funktioner som alltid visas
Scenarioväljare, lärstigsmeny, parameterreglage, statusrad, hjälptexter, Mät K/T/L — samtliga
utan villkor i koden. Guidat/Test-toggeln visas alltid (två knappar), oavsett om något är laddat.

### Befintlig miljö-/flaggstyrning
**Ingen finns.** Uttömmande sökning (case-okänslig) efter `FLAG|flag|environment|isDev|isProd|
CONFIG\b` i hela `apps/app/` gav noll träffar. Sökning efter `URLSearchParams|location\.search|
location\.hash|localStorage\.getItem\("debug|export|download` i `app.js` gav noll träffar.
Det finns idag **inget** tekniskt fundament för dev/prod-åtskillnad — PROD-001B måste bygga
detta från grunden.

---

## 2. Samtliga lärstigar

Fältförklaring: Steg = totalt antal steg. Teori/Scenario = antal steg av respektive typ.
CP = antal checkpoints. "PO-Test" anger om lärstigen genomgått ett numrerat, formellt
PO-granskningsvarv (Test 1–4, se `docs/tracking/todo.md` PED-003B–E) — skiljt från CC:s
egen tekniska regressionstestning, som samtliga aktiva lärstigar genomgår vid varje
PED-003-omgång.

### A. Aktiva lärstigar (registrerade i catalog.json, väljbara i appen)

Ordning = catalog.json:s `learning_paths[]`-ordning = kursprogressionen v35–v40.

| # | ID | Titel | Fil | Steg | Teori | Scenario | CP | Guidat | Test | PO-Test | CC:s klassificering |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `kom-igång.v1` | Kom igång med PID Simulator | kom-igång.v1.json | 5 | 0 | 5 | 0 | ✓ | ✓ | Nej | **Publiceringskandidat** |
| 2 | `oppen-slinga-onoff-p.v1` | Öppen slinga, On/Off och P-reglering | oppen-slinga-onoff-p.v1.json | 5 | 2 | 3 | 5 | ✓ | ✓ | Delvis (PED-003A) | **Publiceringskandidat** |
| 3 | `proportionalband-forstarkning.v1` | Proportionalband och regulatorförstärkning | proportionalband-forstarkning.v1.json | 6 | 1 | 5 | 6 | ✓ | ✓ | Ja (Test 1) | **Publiceringskandidat** |
| 4 | `pi-pid.v1` | PI- och PID-reglering | pi-pid.v1.json | 3 | 0 | 3 | 3 | ✓ | ✓ | Ja (Test 2) | **Publiceringskandidat** |
| 5 | `processbegransningar.v1` | Processens begränsningar | processbegransningar.v1.json | 5 | 1 | 4 | 3 | ✓ | ✓ | Delvis (Test 3, korrigerad ej ombekräftad) | **Kräver beslut** |
| 6 | `windup-antiwindup.v1` | Windup och anti-windup | windup-antiwindup.v1.json | 3 | 1 | 2 | 3 | ✓ | ✓ | Nej (klyvd i PED-003) | **Kräver beslut** |
| 7 | `integrerande-process-niva.v1` | Integrerande process och nivåreglering | integrerande-process-niva.v1.json | 2 | 1 | 1 | 2 | ✓ | ✓ | Nej (klyvd i PED-003) | **Kräver beslut** |
| 8 | `stegsvar-identifiering.v1` | Stegsvar och processidentifiering | stegsvar-identifiering.v1.json | 8 | 1 | 7 | 2 | ✓ | ✓ | Nej (nytt steg 8 i PED-003) | **Kräver beslut** |
| 9 | `lambda-metoden.v1` | Lambda-metoden | lambda-metoden.v1.json | 5 | 1 | 4 | 5 | ✓ | ✓ | Nej | **Publiceringskandidat** |

**Summa aktiva lärstigar:** 42 steg totalt, 29 checkpoints totalt (verifierat via summering).

**Per-lärstig detaljer:**

**1. `kom-igång.v1`** — Teorimoduler: inga. Scenarier: `basic-step-self-regulating.json`,
`pid-step-self-regulating.json`. Pedagogisk status: aldrig anmärkt av PO. Teknisk status: stabil,
oförändrad genom hela PED-003-serien. Kända problem: inga.

**2. `oppen-slinga-onoff-p.v1`** — Teorimoduler: `pid-intro.v1.json`, `onoff-theory.v1.json`.
Scenarier: `manual-open-loop.json`, `onoff-basic.json`, `p-step-self-regulating.json`.
Pedagogisk status: två textkorrigeringar gjorda i PED-003A (öppen slinga-steget, P-steget)
efter PO:s andra granskning; inga öppna anmärkningar sedan dess. Teknisk status: stabil.
Kända problem: inga öppna.

**3. `proportionalband-forstarkning.v1`** — Teorimoduler: `proportionalband.v1.json`.
Scenarier: `p-pi-comparison-p.json`, `p-pi-comparison-pi.json`. Pedagogisk status: PO:s
Test 1 godkänd (PED-003B/C-granskning). Teknisk status: samtliga 6 checkpoints
parameterstudieverifierade (`docs/reports/PED-003B_PARAMETERSTUDIE.md`,
`docs/reports/PED-003D_TESTFRAGOR.md`). Kända problem: inga. Använder "Mät K/T/L"? Nej.

**4. `pi-pid.v1`** — Teorimoduler: inga (renodlad jämförelse). Scenarier:
`pi-pid-comparison-pi.json`, `pi-pid-comparison-pid.json`. Pedagogisk status: PO:s Test 2
godkänd efter att parameterstudiehänvisningen togs bort ur instruktionen (PED-003D). Teknisk
status: samtliga 3 checkpoints kollationerade, 1 mindre textkorrigering. Kända problem: inga.
Använder "Mät K/T/L"? Ja, 2 gånger.

**5. `processbegransningar.v1`** — Teorimoduler: `process-basics.v1.json`. Scenarier:
`pi-step-self-regulating.json`, `pi-deadtime-comparison.json`. Pedagogisk status: PO:s Test 3
krävde korrigering av dötidskontrasten och statusradens decimalformat — båda åtgärdade i
PED-003D/PED-003E och mergade till `develop`, men PO:s bekräftelse av den nya kontrollen samt
det gemensamma Test 4 (checkpoints i Test-läge, avser även lärstig 3 och 4 ovan) är **inte**
registrerade som genomförda i `docs/tracking/todo.md`. Teknisk status: verifierad med
`tests/simulation/` (L=0 → 0.3 % översläng, L=5 → 9.4 %). Kända problem: internt JSON-`id`-fält
(`processbegransningar-v1`) matchar inte catalog-id — kosmetisk varning från
`tests/validate-content.mjs`, ingen funktionell påverkan. Använder "Mät K/T/L"? Ja, 3 gånger.

**6. `windup-antiwindup.v1`** — Teorimoduler: `integrator-windup.v1.json`. Scenarier:
`pi-windup-demo.json`. Pedagogisk status: skapad genom klyvning av den föräldralösa
`windup.v1` i PED-003 (kursprogression v36); aldrig ett eget numrerat PO-granskningsvarv.
Teknisk status: stabil, y→PV-notation uppdaterad i PED-003D. Kända problem: inga funktionella,
men pedagogiskt ogranskad som fristående enhet.

**7. `integrerande-process-niva.v1`** — Teorimoduler: `integrating-process.v1.json`.
Scenarier: `integrating-pi.json`. Pedagogisk status: samma som ovan — klyvd ur `windup.v1`
(kursprogression v37), aldrig egen PO-granskning. Kortast av alla lärstigar (2 steg). Kända
problem: inga funktionella.

**8. `stegsvar-identifiering.v1`** — Teorimoduler: `tangentmetoden.v1.json`. Scenarier:
`manual-identification.json`, `second-order-identification.json`. Pedagogisk status: längst
av alla lärstigar (8 steg); steg 8 ("Jämför med en flerkapacitiv process (S-kurva)") tillagt
i PED-003 och aldrig pedagogiskt granskat av PO. Teknisk status: verifierad i eget
smoke-test (Playwright), fungerar. Kända problem: endast 1 av 7 scenariosteg innehåller en
explicit textträff på "Mät K/T/L" trots att hela lärstigen bygger på identifieringsarbete i
mätläge — bör dubbelkollas manuellt om det är avsiktligt eller ett förbiseende.

**9. `lambda-metoden.v1`** — Teorimoduler: `lambda-metoden.v1.json`. Scenarier:
`lambda-open-loop.json`, `lambda-pi-moderate.json`, `lambda-pi-aggressive.json`,
`lambda-pi-conservative.json`. Pedagogisk status: opåverkad av hela PED-003-serien,
regressionstestad som referenspunkt i varje omgång. Kända problem: inga.

### B. Föräldralösa lärstigar (filer på disk, ej registrerade i catalog.json)

| ID (internt) | Fil | Steg | Teori | Scenario | CP | Ersatt av | CC:s klassificering |
|---|---|---|---|---|---|---|---|
| `grundlaggande-v1` | grundlaggande.v1.json | 5 | 1 | 4 | 5 | `oppen-slinga-onoff-p.v1` + `pi-pid.v1` | **Kandidat för rensning** |
| `windup-v1` | windup.v1.json | 5 | 2 | 3 | 5 | `windup-antiwindup.v1` + `integrerande-process-niva.v1` | **Kandidat för rensning** |
| `basic-learning-path-v1` | basic-learning-path.v1.json | 4 | 1 | 3 | 0 | `kom-igång.v1` (funktionellt överlapp) | **Kandidat för rensning** |

Samtliga tre kan **inte** laddas av den körande appen (saknas i `catalog.json`) och kan därför
inte testas i webbläsare. `grundlaggande.v1.json` och `windup.v1.json` innehåller fortfarande
den gamla `y`-notationen (ej uppdaterad till `PV` i PED-003D, eftersom filerna aldrig laddas
och därmed låg utanför det uppdragets scope). Ingen av de tre har någon känd, aktiv
utvecklingsplan.

### C. Övriga lärstigsutkast

Ingen ytterligare kategori identifierad — samtliga 12 lärstigsfiler på disk faller antingen
under A (9 st, aktiva) eller B (3 st, föräldralösa). Ingen fil är uppenbart experimentell
till skillnad från de andra (jfr scenarier, avsnitt 4F, där filnamn/taggar explicit
signalerar "experimental").

---

## 3. Beroendekarta för lärstigar

```
kom-igång.v1
├─ teori: (ingen)
└─ scenario: basic-step-self-regulating.json, pid-step-self-regulating.json

oppen-slinga-onoff-p.v1
├─ teori: pid-intro.v1.json, onoff-theory.v1.json
└─ scenario: manual-open-loop.json, onoff-basic.json, p-step-self-regulating.json

proportionalband-forstarkning.v1
├─ teori: proportionalband.v1.json
└─ scenario: p-pi-comparison-p.json, p-pi-comparison-pi.json

pi-pid.v1
├─ teori: (ingen)
└─ scenario: pi-pid-comparison-pi.json, pi-pid-comparison-pid.json  [Mät K/T/L: 2 steg]

processbegransningar.v1
├─ teori: process-basics.v1.json
└─ scenario: pi-step-self-regulating.json, pi-deadtime-comparison.json  [Mät K/T/L: 3 steg]

windup-antiwindup.v1
├─ teori: integrator-windup.v1.json
└─ scenario: pi-windup-demo.json

integrerande-process-niva.v1
├─ teori: integrating-process.v1.json
└─ scenario: integrating-pi.json

stegsvar-identifiering.v1
├─ teori: tangentmetoden.v1.json
└─ scenario: manual-identification.json, second-order-identification.json  [Mät K/T/L: 1 steg (textträff)]

lambda-metoden.v1
├─ teori: lambda-metoden.v1.json
└─ scenario: lambda-open-loop.json, lambda-pi-moderate.json, lambda-pi-aggressive.json, lambda-pi-conservative.json
```

**Scenarier som används av flera lärstigar:** Inga bland de aktiva lärstigarna — varje
scenario som en aktiv lärstig refererar till används av exakt en aktiv lärstig. (Bland de
föräldralösa lärstigarna återanvänds flera scenarier från de aktiva — t.ex. `onoff-basic.json`
och `p-step-self-regulating.json` finns även i `grundlaggande.v1`; detta påverkar inte
produktion eftersom föräldralösa lärstigar aldrig laddas.)

**Teorimoduler som används av flera lärstigar:** Inga bland de aktiva lärstigarna — samtliga
8 teorimoduler används av exakt en aktiv lärstig var (1:1-mappning).

**Lärstigar som kräver presentationsläge:** Inga tekniskt — presentationsläget är ett
generellt, valfritt verktyg som fungerar identiskt för alla lärstigar. Ingen lärstig är
beroende av det för att fungera i Guidat/Test-läge.

**Lärstigar med checkpoints:** 8 av 9 (samtliga utom `kom-igång.v1`). Totalt 29 checkpoints.

**Lärstigar vars instruktioner nämner "Mät K/T/L":** `pi-pid.v1` (2 steg),
`processbegransningar.v1` (3 steg), `stegsvar-identifiering.v1` (1 textträff av 7
scenariosteg — se anmärkning under avsnitt 2, punkt 8).

**Lärstigar med delar som inte är pedagogiskt slutgranskade:** `processbegransningar.v1`
(väntar på PO:s slutliga kontroll efter PED-003E + gemensamt Test 4),
`windup-antiwindup.v1` och `integrerande-process-niva.v1` (aldrig egen PO-granskning efter
klyvningen), `stegsvar-identifiering.v1` (nytt steg 8 ogranskat). Se avsnitt 2 för detaljer.

---

## 4. Samtliga scenarier

24 filer på disk i `content/scenarios/`, samtliga 24 registrerade i `catalog.json` —
**noll föräldralösa scenariofiler.**

### A. Scenarier som används av aktiva lärstigar (19)

| Fil | Används av (× antal steg) |
|---|---|
| basic-step-self-regulating.json | kom-igång.v1 (×4) |
| pid-step-self-regulating.json | kom-igång.v1 (×1) |
| manual-open-loop.json | oppen-slinga-onoff-p.v1 (×1) |
| onoff-basic.json | oppen-slinga-onoff-p.v1 (×1) |
| p-step-self-regulating.json | oppen-slinga-onoff-p.v1 (×1) |
| p-pi-comparison-p.json | proportionalband-forstarkning.v1 (×4) |
| p-pi-comparison-pi.json | proportionalband-forstarkning.v1 (×1) |
| pi-pid-comparison-pi.json | pi-pid.v1 (×1) |
| pi-pid-comparison-pid.json | pi-pid.v1 (×2) |
| pi-step-self-regulating.json | processbegransningar.v1 (×2) |
| pi-deadtime-comparison.json | processbegransningar.v1 (×2) |
| pi-windup-demo.json | windup-antiwindup.v1 (×2) |
| integrating-pi.json | integrerande-process-niva.v1 (×1) |
| manual-identification.json | stegsvar-identifiering.v1 (×6) |
| second-order-identification.json | stegsvar-identifiering.v1 (×1) |
| lambda-open-loop.json | lambda-metoden.v1 (×1) |
| lambda-pi-moderate.json | lambda-metoden.v1 (×1) |
| lambda-pi-aggressive.json | lambda-metoden.v1 (×1) |
| lambda-pi-conservative.json | lambda-metoden.v1 (×1) |

### B. Scenarier som visas i den fristående scenarioväljaren

**Samtliga 24 registrerade scenarier** — dropdownen (`#scenario`) byggs direkt från
`SCENARIOS` (`app.js:602`), som innehåller allt `catalog.json` registrerar, utan filtrering.
Det finns idag ingen separat "publicera fristående"-mekanism — allt registrerat är per
automatik fristående synligt.

### C. Scenarier som är både använda i lärstig OCH visas fristående

Samma 19 som grupp A (eftersom grupp B = alla 24, är skärningen A ∩ B = A).

### D. Registrerade men inte använda i någon lärstig (5)

| Fil | Titel | Processtyp | Regulatorläge | Tydligt pedagogiskt syfte? |
|---|---|---|---|---|
| onoff-hysteresis-basic.json | OnOff med hysteresis | self_regulating (K=1, T=20) | onoff (hysteres) | Ja, men ingen lärstig behandlar hysteresis idag |
| pid-disturbance-noise.json | PID med brus | self_regulating (K=1, T=20, L=5) | pid (noiseStd=3) | Ja, men ingen lärstig behandlar mätbrus idag |
| pid-pulse-rejection.json | PID pulsstörningsavstötning | self_regulating (K=1, T=20) | pid (pulse=10) | Ja, men ingen lärstig behandlar pulsstörningar idag |
| integrating-experimental.json | Integrerande process – fri utforskning | integrating | pi | Nej — explicit "fri utforskning", nästan identiska parametrar som integrating-pi.json |
| unstable-experimental.json | Instabil process experimentell | unstable (K=1.5, T=5, L=0.5) | pid | Nej — ingen teori/lärstig om instabila processer finns |

### E. Filer på disk men inte registrerade

Inga. 24/24 filer på disk är registrerade i `catalog.json` (perfekt matchning, verifierat
via filjämförelse och `tests/validate-content.mjs`).

### F. Experimentella scenarier

`integrating-experimental.json` och `unstable-experimental.json` — namn och `tags` innehåller
explicit "experimental", vilket signalerar sandlådeinnehåll snarare än pedagogiskt
färdigställt material. De övriga tre i grupp D (`onoff-hysteresis-basic`,
`pid-disturbance-noise`, `pid-pulse-rejection`) är **inte** märkta experimentella — de är
fungerande, färdiga scenarier som helt enkelt saknar en lärstig som använder dem ännu.

### G. Kandidater för rensning

**Inga scenariofiler bedöms som rena rensningskandidater.** Samtliga 5 oanvända scenarier
(grupp D) är tekniskt fungerande och laddningsbara — ingen är trasig, duplicerad eller
föråldrad på ett sätt som motiverar borttagning. De är istället utvecklingskandidater (se
avsnitt 8, grupp B). Enda anmärkningen: `onoff-hysteresis-basic.json` är konceptuellt nära
`onoff-basic.json` (samma processparametrar, hysteresgränser tillagda) — inte en duplicering,
men värt att PO/PM känner till om framtida hysteresis-innehåll utvecklas.

**Fullständiga parametrar för samtliga 24 scenarier** (processtyp, K/T/L, regulatorläge,
Kp/Ti/Td, brus/puls, SP) finns i den maskinläsbara JSON-tvillingen och kan tas fram i sin
helhet på begäran — utelämnat här för läsbarhetens skull utöver grupperingarna ovan.

---

## 5. Teorimoduler

8 filer på disk i `content/theory/`, samtliga 8 registrerade i `catalog.json` — **noll
föräldralösa teorifiler.** Perfekt 1:1-mappning: varje teorimodul används av exakt en aktiv
lärstig.

| Fil | Titel | Används av | Aktiv lärstig? | Checkpoints? | Granskad PED-003–E? | Kända problem |
|---|---|---|---|---|---|---|
| pid-intro.v1.json | Introduktion till reglering | oppen-slinga-onoff-p.v1 (+ föräldralösa grundlaggande.v1, basic-learning-path.v1) | Ja | Nej (checkpoint ligger på scenariosteg, ej teoristeget i denna lärstig) | y→PV (PED-003D) | Inga |
| onoff-theory.v1.json | On/Off-reglering | oppen-slinga-onoff-p.v1 | Ja | Nej | Inkopplad i PED-003A (var oanvänd innan) | Inga |
| process-basics.v1.json | Processparametrar: K, T och L | processbegransningar.v1 | Ja | Ja (1 CP, PED-003D verifierad) | Ja | Inga |
| proportionalband.v1.json | Proportionalband (PB) och regulatorförstärkning | proportionalband-forstarkning.v1 | Ja | Ja (1 CP) | Skapad i PED-003B | Inga |
| integrator-windup.v1.json | Integratoruppvridning (Windup) | windup-antiwindup.v1 (+ föräldralös windup.v1) | Ja | Ja (implicit, se lärstigens steg) | y→PV (PED-003D) | Inga |
| integrating-process.v1.json | Integrerande process | integrerande-process-niva.v1 (+ föräldralös windup.v1) | Ja | Ja | y→PV (PED-003D) | Inga |
| tangentmetoden.v1.json | Tangentmetoden — Ziegler-Nichols reaktionskurva | stegsvar-identifiering.v1 | Ja | Ja | Nej | Inga |
| lambda-metoden.v1.json | Lambda-metoden | lambda-metoden.v1 | Ja | Ja | Nej | Inga |

**Teori som krävs av publiceringskandidater:** `pid-intro.v1.json`, `onoff-theory.v1.json`,
`proportionalband.v1.json`, `lambda-metoden.v1.json` (kopplade till de 5 lärstigar CC
klassificerar som Publiceringskandidat i avsnitt 2).

**Oanvänd teori:** Ingen — samtliga 8 används.

**Teori som bör döljas:** Ingen isolerat — teori döljs alltid tillsammans med sin enda
konsument-lärstig, det finns ingen fristående teorivy i appen idag.

**Rensningskandidater:** Ingen bland de 8 registrerade filerna. (De föräldralösa lärstigarnas
teorireferenser pekar alla på redan aktiva, registrerade teorifiler — det finns inga
föräldralösa teorifiler att rensa.)

---

## 6. Funktionsinventering

Samtliga nedan är kodmässigt ovillkorade idag (visas alltid) — "Kräver teknisk ändring"-kolumnen
avser ändringar utöver ren flagg-styrning; ren på/av-flaggning via en framtida
produktionskonfiguration räknas inte som en teknisk ändring i sig (det är precis vad
PROD-001B ska införa för alla poster nedan).

| Funktion | Var implementeras | Visas idag? | Kan döljas utan borttagning? | Beroenden | Behövs Guidat? | Behövs Test? | Känd status | Preliminär rekommendation |
|---|---|---|---|---|---|---|---|---|
| Guidat läge | app.js `setTestMode(false)`, `renderStep()` | Ja | Nej, det är grundläget | Checkpoints, lärstigsmeny | Ja (är Guidat) | — | Stabilt | **Publicera** |
| Test-läge | app.js `setTestMode(true)`, `#modeTest` | Ja | Ja, rent UI-villkor (se avsnitt 7) | Checkpoints, poängvisning | Nej | Ja (är Test) | Uttryckligen inte klart för release | **Dölj i production** |
| Checkpoints | app.js `renderStep()`, `handleQuizAnswer()` | Ja | Delvis — datan följer lärstigen, presentationen (reflektion vs. quiz) styrs av testMode | Lärstigsinnehåll | Ja (reflektionsform) | Ja (quizform) | 29 st, samtliga kollationerade PED-003D/E | **Publicera** |
| Poängvisning (+ implicit återställning) | app.js `updateScoreDisplay()`, `pathScore` | Nej (döljs redan via `display:none` utanför Test-läge) | Ja | Test-läge | Nej | Ja | In-memory, sparas aldrig, nollställs automatiskt | **Dölj i production** |
| Presentationsläge | app.js `openPresentMode()`, `#btnPresent` | Ja | Ja | Aktiv lärstig | Ja (projektorbruk) | Ja (svar exponeras aldrig) | Stabil sedan PED-003A | **Publicera** |
| Mät K/T/L | app.js `measureMode` m.fl. | Ja | Ja | Inget | Nej (men används i 3 lärstigar) | Nej | Stabilt | **Publicera** |
| Scenarioväljare (fristående) | index.html `#scenario`, app.js:602 | Ja | Delvis — listar idag ALLA registrerade scenarier utan filter | Katalogens `scenarios[]` | Nej | Nej | Fungerande, men ingen granularitet mellan "lärstigsscenario" och "fristående scenario" | **Publicera** (kräver kompletterande filtreringslogik i PROD-001B om de 5 oanvända scenarierna ska döljas separat) |
| Lärstigsmeny | index.html `#learningPath`, app.js:603 | Ja | Innehållet styrs helt av `catalog.json`s ordning | Katalogens `learning_paths[]` | Ja | Ja | Fungerande | **Publicera** (mekanismen; INNEHÅLLET avgörs av produktionsurvalet, avsnitt 9) |
| Hjälptexter (?-knappar) | app.js, `content/help.json` | Ja | Ja | Parameterreglage | Ja | Ja | y→PV uppdaterad PED-003D | **Publicera** |
| Statusrad | app.js `updateStatus()`, `fmt1()` | Ja | Nej, central visning | Inget | Ja | Ja | Omarbetad PED-003D/E, känd avsiktlig e≠SP−PV-avvikelse (se avsnitt 1) | **Publicera** |
| Parameterreglage | index.html `.param-group`, app.js `fields` | Ja | Nej, kärnfunktion | Inget | Ja | Ja | Stabilt | **Publicera** |

**Uttryckligen kontrollerade och bekräftat frånvarande funktioner** (per uppdragets krav att
minst kontrollera dessa):
- **Exportfunktioner:** Finns inte. Ingen träff på `export|download` i `app.js`.
- **URL-parametrar för att aktivera dolda funktioner:** Finns inte. Ingen träff på
  `URLSearchParams|location\.search|location\.hash`.
- **Utvecklings-/debugfunktioner:** Finns inte. Ingen träff på `debug`-relaterad
  `localStorage`-nyckel eller liknande.
- **Experimentella UI-funktioner:** Finns inte utöver de experimentella *scenariernas*
  innehåll (se avsnitt 4F) — det finns ingen experimentell UI-kod, bara experimentellt
  *innehåll*.

**Fullständig `localStorage`-inventering** (9 anropsställen, samtliga granskade): endast
`pidSimWelcomed` (onboarding-flagga), sidopanelens breddpersistens (`storageKey`), och
`pg-`-prefixade parametergrupp-kollapstillstånd. Test-lägets poäng (`pathScore`) sparas
**aldrig**.

---

## 7. Särskild analys av Test-läget

Test-läget är enligt uppdraget inte klart för första releasen. Denna analys är ren
kartläggning — ingen lösning föreslås eller implementeras här.

**Hur aktiveras Test-läge?** Uteslutande via klick på `#modeTest`-knappen, som anropar
`setTestMode(true)` ([`app.js:673`](../../apps/app/app.js#L673)). Ingen annan ingång existerar
(se avsnitt 1/6 för den uttömmande sökningen som bekräftar detta).

**Vilka UI-element hör till det?**
- `#modeTest`/`#modeGuided`-togglen i sig (delas — det är samma två knappar som växlar båda
  riktningarna).
- `#scoreDisplay`/`#scoreText` — dold (`display:none`) i Guidat läge, visas bara när
  `testMode && currentPath` ([`app.js:475–481`](../../apps/app/app.js#L475)).
- Quiz-varianten av checkpoint-rendering i `#learnBody` (flervalsknappar med
  `data-idx`) — i Guidat läge visas istället en ren reflektionstext utan alternativ
  ([`app.js:511–520`](../../apps/app/app.js#L511)).
- `#prevStep`-knappen döljs helt i Test-läge (`prev.style.display = testMode ? "none" : ""`,
  [`app.js:485`](../../apps/app/app.js#L485)) — Test-läge tillåter bara framåtnavigering.

**Hur delar Guidat/Test kod?** Nästan allt är gemensamt: samma `currentPath`,
`currentPathStep`, samma `renderStep()`-funktion (grenar internt på `if (testMode)` för
checkpointens presentation), samma `loadPath()`, samma steg-data. Det finns **ingen**
duplicerad lärstigslogik mellan lägena — bara presentationsgrenar inuti delade funktioner.
Detta gör Test-läge svårt att ta bort helt utan att riskera Guidat, men relativt enkelt att
**dölja i UI** eftersom det är samma underliggande datamodell.

**Vilka checkpoints används?** Samma 29 checkpoints som i Guidat läge — ingen separat
frågebank för Test-läge.

**Hur hanteras poäng?** `pathScore = { correct: 0, total: 0 }`, rent in-memory
([`app.js:59`](../../apps/app/app.js#L59)). Nollställs i tre lägen: vid `loadPath()`
([`app.js:493`](../../apps/app/app.js#L493)), vid växling till Test-läge
([`app.js:679`](../../apps/app/app.js#L679)), och implicit vid sidladdning (ingen
återläsning från `localStorage`).

**Sparas poäng mellan sessioner?** **Nej.** Verifierat genom fullständig
`localStorage`-genomgång (avsnitt 6) — `pathScore` skrivs aldrig till `localStorage`.
En sidomladdning eller ny session startar alltid på 0/0.

**Kan Test-läge döljas utan att påverka Guidat läge?** Ja, tekniskt sett ser detta
okomplicerat ut: eftersom all lärstigslogik är gemensam och grenar bara på den enda
`testMode`-flaggan, räcker det i princip att dölja/ta bort `#modeTest`-knappen (eller
låsa `testMode` till `false`) för att göra Test-läge otillgängligt utan att röra
Guidat-koden. Detta är dock en bedömning inför PROD-001B:s design — **ingen ändring görs
här.**

**Kan Test-läge aktiveras via URL/tangentbord/annan alternativ ingång?** **Nej** — bekräftat
genom uttömmande kodsökning (avsnitt 1). Det finns exakt en aktiveringsväg: `#modeTest`-knappen.

**Vilka delar måste döljas i produktion?** `#modeTest`-knappen (och rimligen `#modeGuided`
som par, eller görs Guidat till det enda alternativet), `#scoreDisplay`.

**Vilka delar måste ligga kvar för att Guidat ska fungera?** All delad kod: `renderStep()`,
`loadPath()`, `currentPath`/`currentPathStep`-state, checkpoint-datan i lärstigsfilerna
(används för reflektionstexten i Guidat läge, även om quiz-varianten döljs).

**Risker med att dölja Test-läge:**
1. Om enbart knappen döljs men `setTestMode(true)` fortfarande är nåbar via t.ex. en
   framtida kodväg, kan Test-läge oavsiktligt bli åtkomligt igen — flaggstyrningen i
   PROD-001B bör gate:a själva funktionen, inte bara knappens synlighet.
   *(Idag är detta inte ett problem — det finns bara en enda anropsplats.)*
2. `checkpointAnswered`/`pathScore`-state delas med Guidat-koden; om Test-läge döljs
   ofullständigt (t.ex. bara CSS `display:none` på knappen men koden kvar nåbar) finns
   ingen funktionell risk eftersom `testMode` ändå styrs av en enda boolean utan
   sidoeffekter på Guidat-state.
3. Det formella Test 4 (PO:s granskning av checkpoints i just Test-läge, avsnitt 2) är
   ännu inte bekräftat genomfört för de tre PED-003D-lärstigarna — om Test-läge döljs helt
   i produktion blir denna granskning irrelevant för första releasen, men relevant igen
   den dag Test-läge återinförs.

---

## 8. Aktivt, oanvänt och föräldralöst innehåll

### A. Aktivt och beroendeanvänt
Samtliga 9 aktiva lärstigar, alla 8 teorimoduler (100 % användning), 19 av 24 scenarier.

### B. Oanvänt men möjligt att utveckla vidare
`onoff-hysteresis-basic.json`, `pid-disturbance-noise.json`, `pid-pulse-rejection.json` —
fungerande, färdiga scenarier utan experimentell märkning, utan konsument-lärstig idag.

### C. Föräldralöst eller gammalt
`grundlaggande.v1.json`, `windup.v1.json`, `basic-learning-path.v1.json` (lärstigar) samt
`integrating-experimental.json`, `unstable-experimental.json` (uttryckligen märkta
experimentella scenarier).

### Explicit återverifiering av de åtta namngivna posterna (per uppdraget)

| Post | Nuvarande status (återverifierad 2026-08-23) |
|---|---|
| `grundlaggande.v1.json` | **Föräldralös.** Ej i catalog.json. Ersatt av `oppen-slinga-onoff-p.v1` + `pi-pid.v1`. Innehåller fortfarande `y`-notation (ej uppdaterad, laddas aldrig). |
| `windup.v1.json` | **Föräldralös.** Ej i catalog.json. Ersatt av `windup-antiwindup.v1` + `integrerande-process-niva.v1`. Innehåller fortfarande `y`-notation. |
| `basic-learning-path.v1.json` | **Föräldralös.** Ej i catalog.json. 0 checkpoints, funktionellt överlapp med `kom-igång.v1`. |
| `onoff-hysteresis-basic` | **Registrerad, oanvänd.** Laddningsbar via fristående scenarioväljaren. Ingen lärstig refererar den. Ej experimentellt märkt. |
| `pid-disturbance-noise` | **Registrerad, oanvänd.** Laddningsbar. Ingen lärstig refererar den. Ej experimentellt märkt. |
| `pid-pulse-rejection` | **Registrerad, oanvänd.** Laddningsbar. Ingen lärstig refererar den. Ej experimentellt märkt. |
| `integrating-experimental` | **Registrerad, oanvänd, experimentellt märkt** (namn + `tags` innehåller "experimental"). Nästan identiska parametrar som `integrating-pi.json` (som ÄR aktiv, används av `integrerande-process-niva.v1`). |
| `unstable-experimental` | **Registrerad, oanvänd, experimentellt märkt.** Enda scenariot med `processType: "unstable"`. Ingen teori/lärstig om instabila processer finns. |

Detta korrigerar/uppdaterar tidigare PED-001/PED-002-siffror (som rapporterade 7 oanvända
scenarier och 1 oanvänd teorimodul) — under PED-003/PED-003A/PED-003D kopplades
`second-order-identification.json`, `manual-open-loop.json` och `onoff-theory.v1.json` in i
aktivt innehåll, vilket sänkte de oanvända siffrorna till 5 scenarier och 0 teorimoduler.

---

## 9. Förslag på produktionsurval (CC:s rekommendation — inte ett produktbeslut)

### PUBLICERADE LÄRSTIGAR
- `kom-igång.v1` — Kom igång med PID Simulator
- `oppen-slinga-onoff-p.v1` — Öppen slinga, On/Off och P-reglering
- `proportionalband-forstarkning.v1` — Proportionalband och regulatorförstärkning
- `pi-pid.v1` — PI- och PID-reglering
- `lambda-metoden.v1` — Lambda-metoden

### DOLDA LÄRSTIGAR (kräver PO/PM-beslut innan publicering)
- `processbegransningar.v1` — motivering: PO:s slutliga kontroll av det omarbetade
  dötidsförsöket (PED-003E) och det gemensamma Test 4 inte bekräftat genomförda.
- `windup-antiwindup.v1` — motivering: aldrig eget PO-granskningsvarv efter klyvningen.
- `integrerande-process-niva.v1` — motivering: samma som ovan.
- `stegsvar-identifiering.v1` — motivering: nytt steg 8 (PED-003) aldrig pedagogiskt granskat.

*(Detta är en försiktig, konservativ rekommendation byggd på formell PO-granskningsstatus,
inte ett omdöme om innehållets faktiska kvalitet — de fyra är tekniskt stabila och
regressionstestade. PO/PM kan mycket väl besluta att publicera samtliga nio.)*

### PUBLICERADE SCENARIER SOM KRÄVS AV LÄRSTIGAR (de fem publiceringskandidaterna)
`basic-step-self-regulating.json`, `pid-step-self-regulating.json`, `manual-open-loop.json`,
`onoff-basic.json`, `p-step-self-regulating.json`, `p-pi-comparison-p.json`,
`p-pi-comparison-pi.json`, `pi-pid-comparison-pi.json`, `pi-pid-comparison-pid.json`,
`lambda-open-loop.json`, `lambda-pi-moderate.json`, `lambda-pi-aggressive.json`,
`lambda-pi-conservative.json` (13 st)

### PUBLICERADE FRISTÅENDE SCENARIER
Ingen ytterligare rekommendation utöver ovanstående — appens nuvarande arkitektur listar
alla registrerade scenarier fristående utan urval (se avsnitt 6). Om PO/PM vill begränsa
den fristående scenarioväljaren till bara publiceringskandidaternas scenarier krävs ett
tekniskt tillägg i PROD-001B (idag finns ingen sådan filtreringsmekanism).

### DOLDA SCENARIER
- `pi-step-self-regulating.json`, `pi-deadtime-comparison.json` — motivering: följer
  `processbegransningar.v1`.
- `pi-windup-demo.json` — motivering: följer `windup-antiwindup.v1`.
- `integrating-pi.json` — motivering: följer `integrerande-process-niva.v1`.
- `manual-identification.json`, `second-order-identification.json` — motivering: följer
  `stegsvar-identifiering.v1`.
- `onoff-hysteresis-basic.json`, `pid-disturbance-noise.json`, `pid-pulse-rejection.json`,
  `integrating-experimental.json`, `unstable-experimental.json` — motivering: oanvända,
  utvecklings-/sandlådeinnehåll utan konsument-lärstig.

### PUBLICERADE TEORIMODULER
`pid-intro.v1.json`, `onoff-theory.v1.json`, `proportionalband.v1.json`,
`lambda-metoden.v1.json` — beroende: krävs 1:1 av respektive publiceringskandidat-lärstig.

### DOLDA TEORIMODULER
`process-basics.v1.json`, `integrator-windup.v1.json`, `integrating-process.v1.json`,
`tangentmetoden.v1.json` — motivering: följer respektive dolda lärstig.

### PUBLICERADE FUNKTIONER
Guidat läge, Checkpoints (reflektionsform), Presentationsläge, Mät K/T/L, Scenarioväljare,
Lärstigsmeny, Hjälptexter, Statusrad, Parameterreglage.

### DOLDA FUNKTIONER
- **Test-läge** — motivering: uttryckligen inte klart för första releasen (uppdragets
  premiss), ingen alternativ aktiveringsväg finns att stänga av separat.
- **Poängvisning** — motivering: helt beroende av Test-läge, redan osynlig i Guidat läge.

### KANDIDATER FÖR SENARE RENSNING
`grundlaggande.v1.json`, `windup.v1.json`, `basic-learning-path.v1.json` (föräldralösa
lärstigsfiler, helt ersatta av aktivt innehåll). Inga scenario- eller teorifiler
rekommenderas för rensning (se avsnitt 4G och 5).

---

## 10. PO/PM-beslutslista

### 1. Lärstigar

**Lärstig:** Kom igång med PID Simulator
**ID:** `kom-igång.v1`
**CC:s rekommendation:** Publiceringskandidat
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Lärstig:** Öppen slinga, On/Off och P-reglering
**ID:** `oppen-slinga-onoff-p.v1`
**CC:s rekommendation:** Publiceringskandidat
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Lärstig:** Proportionalband och regulatorförstärkning
**ID:** `proportionalband-forstarkning.v1`
**CC:s rekommendation:** Publiceringskandidat
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Lärstig:** PI- och PID-reglering
**ID:** `pi-pid.v1`
**CC:s rekommendation:** Publiceringskandidat
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Lärstig:** Processens begränsningar
**ID:** `processbegransningar.v1`
**CC:s rekommendation:** Kräver beslut (PO:s slutliga kontroll + Test 4 obekräftade)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Lärstig:** Windup och anti-windup
**ID:** `windup-antiwindup.v1`
**CC:s rekommendation:** Kräver beslut (inget eget PO-granskningsvarv)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Lärstig:** Integrerande process och nivåreglering
**ID:** `integrerande-process-niva.v1`
**CC:s rekommendation:** Kräver beslut (inget eget PO-granskningsvarv)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Lärstig:** Stegsvar och processidentifiering
**ID:** `stegsvar-identifiering.v1`
**CC:s rekommendation:** Kräver beslut (nytt steg 8 ogranskat)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Lärstig:** Lambda-metoden
**ID:** `lambda-metoden.v1`
**CC:s rekommendation:** Publiceringskandidat
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

### 2. Funktioner

**Funktion:** Guidat läge
**CC:s rekommendation:** Publicera
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Funktion:** Test-läge
**CC:s rekommendation:** Dölj i production
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Funktion:** Checkpoints
**CC:s rekommendation:** Publicera
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Funktion:** Poängvisning (och implicit återställning)
**CC:s rekommendation:** Dölj i production
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Funktion:** Presentationsläge
**CC:s rekommendation:** Publicera
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Funktion:** Mät K/T/L
**CC:s rekommendation:** Publicera
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Funktion:** Scenarioväljare (fristående)
**CC:s rekommendation:** Publicera (kräver ev. teknisk filtrering, se avsnitt 6/9)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Funktion:** Lärstigsmeny
**CC:s rekommendation:** Publicera (innehållet styrs av produktionsurvalet)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Funktion:** Hjälptexter
**CC:s rekommendation:** Publicera
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Funktion:** Statusrad
**CC:s rekommendation:** Publicera
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Funktion:** Parameterreglage
**CC:s rekommendation:** Publicera
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

### 3. Fristående scenarier

**Scenario:** OnOff med hysteresis
**ID:** `onoff-hysteresis-basic`
**Används av:** Ingen lärstig (endast fristående)
**CC:s rekommendation:** Endast development
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Scenario:** PID med brus
**ID:** `pid-disturbance-noise`
**Används av:** Ingen lärstig
**CC:s rekommendation:** Endast development
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Scenario:** PID pulsstörningsavstötning
**ID:** `pid-pulse-rejection`
**Används av:** Ingen lärstig
**CC:s rekommendation:** Endast development
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Scenario:** Integrerande process – fri utforskning
**ID:** `integrating-experimental`
**Används av:** Ingen lärstig
**CC:s rekommendation:** Endast development
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Scenario:** Instabil process experimentell
**ID:** `unstable-experimental`
**Används av:** Ingen lärstig
**CC:s rekommendation:** Endast development
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

### 4. Beroendescenarier

**Scenario:** Dötidsjämförelse — PI-reglering
**ID:** `pi-deadtime-comparison`
**Används av:** `processbegransningar.v1` (×2)
**CC:s rekommendation:** Kräver beslut (följer processbegransningar.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Scenario:** PI-reglering stegsvar
**ID:** `pi-step-self-regulating`
**Används av:** `processbegransningar.v1` (×2)
**CC:s rekommendation:** Kräver beslut (följer processbegransningar.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Scenario:** PI – integratoruppvridning (windup)
**ID:** `pi-windup-demo`
**Används av:** `windup-antiwindup.v1` (×2)
**CC:s rekommendation:** Kräver beslut (följer windup-antiwindup.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Scenario:** Integrerande process – PI-reglering
**ID:** `integrating-pi`
**Används av:** `integrerande-process-niva.v1` (×1)
**CC:s rekommendation:** Kräver beslut (följer integrerande-process-niva.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Scenario:** Processidentifiering (manuell)
**ID:** `manual-identification`
**Används av:** `stegsvar-identifiering.v1` (×6)
**CC:s rekommendation:** Kräver beslut (följer stegsvar-identifiering.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Scenario:** Processidentifiering 2:a ordningen
**ID:** `second-order-identification`
**Används av:** `stegsvar-identifiering.v1` (×1)
**CC:s rekommendation:** Kräver beslut (följer stegsvar-identifiering.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

*(De 13 scenarierna knutna till de fem redan publiceringsklassade lärstigarna listas i
avsnitt 9 "PUBLICERADE SCENARIER SOM KRÄVS AV LÄRSTIGAR" och upprepas inte här — deras
CC-rekommendation är implicit "Krävs av publiceringskandidat", identisk med respektive
lärstigs status.)*

### 5. Teorimoduler

**Teori:** Introduktion till reglering (`pid-intro.v1.json`)
**CC:s rekommendation:** Krävs av publiceringskandidat (oppen-slinga-onoff-p.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Teori:** On/Off-reglering (`onoff-theory.v1.json`)
**CC:s rekommendation:** Krävs av publiceringskandidat (oppen-slinga-onoff-p.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Teori:** Proportionalband (PB) och regulatorförstärkning (`proportionalband.v1.json`)
**CC:s rekommendation:** Krävs av publiceringskandidat (proportionalband-forstarkning.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Teori:** Lambda-metoden (`lambda-metoden.v1.json`)
**CC:s rekommendation:** Krävs av publiceringskandidat (lambda-metoden.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Teori:** Processparametrar: K, T och L (`process-basics.v1.json`)
**CC:s rekommendation:** Kräver beslut (följer processbegransningar.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Teori:** Integratoruppvridning (Windup) (`integrator-windup.v1.json`)
**CC:s rekommendation:** Kräver beslut (följer windup-antiwindup.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Teori:** Integrerande process (`integrating-process.v1.json`)
**CC:s rekommendation:** Kräver beslut (följer integrerande-process-niva.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Teori:** Tangentmetoden — Ziegler-Nichols reaktionskurva (`tangentmetoden.v1.json`)
**CC:s rekommendation:** Kräver beslut (följer stegsvar-identifiering.v1)
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

### 6. Rensningskandidater

**Fil:** `grundlaggande.v1.json`
**CC:s rekommendation:** Kandidat för rensning
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Fil:** `windup.v1.json`
**CC:s rekommendation:** Kandidat för rensning
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

**Fil:** `basic-learning-path.v1.json`
**CC:s rekommendation:** Kandidat för rensning
**PO/PM-beslut:** Ej beslutat
**Kommentar:**

---

## 11. Maskinläsbart underlag

Se [`PROD-001A_PUBLICERINGSUNDERLAG.json`](PROD-001A_PUBLICERINGSUNDERLAG.json) — 55 poster
(12 lärstigar, 24 scenarier, 8 teorimoduler, 11 funktioner), varje post med `type`, `id`,
`title`, `file`, `active`, `referencedBy`, `dependencies`, `tested`, `knownIssues`,
`ccRecommendation`, `poPmDecision` (samtliga `"Ej beslutat"`), `comment`. Sakligt konsistent
med detta dokument. **Laddas inte av appen. Används inte som produktionskonfiguration.**

---

## Teknisk verifiering

`tests/validate-content.mjs` kört 2026-08-23 mot orörd `develop`-branch (commit `50a98fb`):

```
Scenarier: 24/24 laddade
Teorimoduler: 8/8 laddade
Lärstigar: 9/9 laddade
Lärstigsordning: kom-igång.v1 → oppen-slinga-onoff-p.v1 → proportionalband-forstarkning.v1 →
  pi-pid.v1 → processbegransningar.v1 → windup-antiwindup.v1 → integrerande-process-niva.v1 →
  stegsvar-identifiering.v1 → lambda-metoden.v1
Varningar:
  ⚠ Lärstig processbegransningar.v1: internt "id"-fält (processbegransningar-v1) matchar
    inte catalog-id
✓ Inga referensfel hittades.
```

`tests/simulation/analyze.test.mjs` kört samma dag: **11/11 OK, 0 FAIL.**

Ingen fil ändrades för att uppnå dessa resultat — nuvarande tillstånd rapporterat exakt som
det är, inklusive den kvarstående kosmetiska id-varningen.

**Inga stoppvillkor utlöstes.** catalog.json motsvarar exakt vad appen laddar; inga
lärstigar/scenarier kan laddas utan att vara registrerade; inga dynamiskt skapade beroenden
hittades; Test-läge är entydigt urskiljbart från Guidat läge via en enda boolean; alla aktiva
filer har stabila ID:n (den enda avvikelsen — `processbegransningar.v1`s interna
`id`-fältmismatch — är kosmetisk och bryter inte laddning); inga trasiga referenser hittades;
MD- och JSON-versionerna är sakligt konsistenta (55/55 poster, korsverifierat).

---

*Genererad av Claude Code för PROD-001A. Samtliga klassificeringar är preliminära
rekommendationer — PO och PM fattar de faktiska publiceringsbesluten i avsnitt 10.*
