# Feature Backlog — Klara

Features som är implementerade, testade och mergade till `develop`.
Öppna features finns i [todo.md](todo.md).

---

## Python-app (`main.py`) — nedlagd

Python-appen läggs ner, se BESLUT-002 i [todo.md](todo.md). Följande features stängs
**utan implementation** — de kommer aldrig byggas.

### FEAT-006 — Utökad historik — jämförelse och export
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-008 — Utökad tooltip-funktionalitet
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-012 — Optimerad graf-rendering
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-013 — Förbättrad export-funktionalitet
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-014 — Unicode/emoji-kompatibilitet
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-015 — Förbättrad dialog-positionering
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-016 — Förbättrad hysteresis-visualisering (OnOff)
**Status:** Stängd — nedlagd, se BESLUT-002

---

## Webbapp (`apps/app/`)

### FEAT-037 — Övningsdokument "Reglerstrategier"
**Branch:** `feature/reglerstrategier` (mergad till `develop`)
**Beskrivning:**
Nytt fristående övningsdokument (`docs/exercises/ovningar-reglerstrategier.md`), samma
mönster som `ovningar-systemoptimering.md`: uppgifter i lösbladsform, inte en guidad
lärstig. Tränar *vilken reglerstrategi man väljer och varför* — regulatortyp (P/PI, med
PID:s avvägningar i Uppgift 2 Fall C), aggressivitet (Lambda-metoden), dötid,
integrerande process, windup och prioritering börvärdesföljning/störningsavvisning.
Sju uppgifter (varav en mästaruppgift, ett sammanfattande PM). Bygger enbart på
funktioner som redan fanns i webbappen.

Ett facit (`docs/exercises/facit-reglerstrategier.md`) togs fram parallellt, verifierat
mot faktisk simulering (`apps/app/sim-core.js` kört i Node via
`tests/simulation/lib/analyze.mjs`, seed=42). Verifieringen hittade och rättade flera
sakfel innan publicering: fel processförstärkning i Uppgift 2, orealistiskt kraftiga
standardpulsstorlekar (appens pulsmagnitud läggs till PER STEG, inte engångs — lätt att
missbedöma), samt att HELA facit inledningsvis använde ett löst/odokumenterat
toleransband för "insvängningstid" som gav missvisande jämförelser mellan strategier.
Facit standardiserades till ett enhetligt, dokumenterat 2 %-toleransband
(`analyze.mjs`s standardvärde) innan publicering.

PO gjorde flera manuella redigeringsomgångar (skärpte acceptanskriterier och vilka
mätvärden studenten ska notera, bytte Uppgift 1 Fall A:s exempel från "Nivåprocess" till
"Temperaturprocess" för att inte krocka med Uppgift 4:s nivå=integrerande-lektion, tog
bort kvarvarande referenser till andra övningsdokument för att göra dokumentet
självständigt). CC byggde ut Uppgift 2 med en ny Fall C (Td-svep, simulatorverifierad:
lagom Td≈1 eliminerar överslängen och mer än halverar insvängningstiden med försumbar
bruskostnad, medan överdrivet Td gör allt sämre samtidigt) och flyttade dit
brus/D-dels-undersökningen från Uppgift 1.

Facit renskrevs slutligen helt (all historik/motivering om vad som rättades och varför
togs bort) för att matcha det färdigredigerade övningsdokumentet exakt.
**Status:** Klar, mergad till `develop`. Publicerad till `main` 2026-09-15 (se
`CHANGELOG.md`) — ren dokumentation, ingår inte i PROD-appens byggda innehåll
(`catalog.prod.json`) eftersom det är ett fristående lösblad, inte en lärstig.

---

### FEAT-038 — Hjälplinjer 10 %/90 %/2 %-band i Mätläge
**Branch:** `feature/matlage-hjalplinjer` (mergad till `develop`)
**Beskrivning:**
Två nya togglingsbara hjälplinjer i Mätläge, samma mönster som befintlig 63 %-linje:
"Visa 10 %/90 %-linjer (stigtid)" (en gemensam kryssruta, båda linjerna hör ihop som
stigtidsdefinitionen) och "Visa 2 %-toleransband (insvängning)" (ritas som ETT BAND —
övre/undre gräns kring PV∞ — eftersom 2 % definitionsmässigt är ett toleransband, inte
en enkel tröskel som 63/10/90 %). Samtidigt gjordes samtliga hjälplinjer (63 %,
tangentlinjen, de två nya) tunnare och lätt transparenta (`lineWidth 1`,
`globalAlpha 0.6`) så de tydligt skiljer sig visuellt från PV/SP/u-kurvorna — tidigare
var tangentlinjen lika tjock som huvudkurvorna.

Verifierat med Playwright mot en lokal server (skärmdumpar, inga konsolfel) och
`tests/build-preview.test.mjs`.
**Status:** Klar, mergad till `develop`. **Produktionsaktiverad i v1.5.2**
(2026-09-14/15, PO:s beslut, se `CHANGELOG.md`).

---

### FEAT-030 — Lärstig "Störningar och robusthet"
**Branch:** `feature/storningar-robusthet` (mergad till `develop`)
**Beskrivning:**
Ny 7-stegs lärstig (`storningar-robusthet.v1`, 1 teori + 6 scenario) om mätbrus,
pulsstörning och P/PI/PID-robusthet, baserad på källmaterialet i
`docs/exercises/ovningar-signalstorningar.md`. Återanvänder befintliga
`pid-disturbance-noise.json`/`pid-pulse-rejection.json` — inga nya scenariofiler. Ny
teorimodul `disturbance-robustness.v1.json`.

Två nya, generella appfunktioner tillkom under PO:s testomgång:
- **Markeringslinje i grafen** vid varje betydelsefull parameterändring (regulatorläge,
  Kp/Ti/Td, brus, SP, process) eller pulstriggning — gör flera faser urskiljbara i en
  kontinuerlig graf istället för att kräva Rensa graf/Återställ mitt i en jämförelse.
- **`continueFromPreviousStep`** (explicit steg-fält, samma mönster som `standalone`/
  `ENV_CONFIG.*`): låter en lärstig fortsätta samma körning/graf över flera steg istället
  för att automatiskt ladda om scenariot vid varje stegbyte. Använt i steg 3–4 för att ge
  en sammanhängande P→P+brus→PI→PID-jämförelse med tre fristående checkpoints bevarade.

Verifierat med Playwright genom hela lärstigsnavigeringen och den fullständiga
Node-testsviten (`validate-content.mjs`, `validate-prod.mjs`, `build-preview.test.mjs`,
`simulation/analyze.test.mjs`) — samtliga gröna. PO har testat och godkänt branchen.
**Status:** Klar, mergad till `develop`. **Produktionsaktiverad i v1.5.0**
(2026-09-10, PO:s beslut) — sjunde lärstigen i `catalog.prod.json`, se
RELEASE-v1.5.0-posten.

---

### FEAT-029 — Crosshair horisontell linje
**Branch:** `feature/crosshair-hline`
**Status:** Klar

---

### FEAT-028 — Flerkapacitiv (högre ordningens) självreglerande process
**Branch:** `feature/multi-capacity`
**Beskrivning:**
Nuvarande `self_regulating`-modell är enkapacitiv (FOPDT). En flerkapacitiv process (N kaskadkopplade element) ger ett S-format stegsvar med tydlig inflexionspunkt — mer likt industriella processer och bättre testfall för tangentmetoden.
Modell: N element med tidskonstant T/N vardera. Nytt fält `"order": N` i process-config. Nytt `processType`-alternativ i dropdown. Nytt identifieringsscenario (order=2).
**Status:** Klar

---

### FEAT-027 — Zoom i grafen för exaktare mätavläsning
**Branch:** `feature/graph-zoom`
**Beskrivning:**
Möjlighet att zooma in i PV-grafen för att avläsa exakta värden med crosshairen i mätläge. Scrollhjul + modifieringstangent (Ctrl eller Shift) zoomar horisontellt (t-axeln). Touchpad: tvåfingerspinch-scroll. Zoom-nivå visas och kan nollställas med dubbelklick eller en "Återställ zoom"-knapp.
**Status:** Klar

---

### FEAT-025 — Onboarding: välkomstpanel + intro-lärstig för nya användare
**Branch:** `feature/onboarding`
**Beskrivning:**
Vid första besök visas en välkomstpanel i vänster sidebar med appbeskrivning och knappar "Börja här →" (laddar intro-lärstigen) och "Utforska fritt". Tillståndet sparas i localStorage. Intro-lärstigen "Kom igång med PID Simulator" guidar igenom appens funktioner i 5 steg utan checkpoints: översikt → scenarier → simulering → parametrar/hjälp → lärstigar.
**Status:** Klar

---

### FEAT-024 — Lärstig: Lambda-metoden för självreglerande system
**Branch:** `feature/larstig-lambda`
**Beskrivning:**
5-stegs lärstig för Lambda-metoden (modellbaserad PI-inställning). Kp = T/(K×(λ+L)), Ti = T. Inkluderar ny teorifil, 4 scenarion (open-loop, måttlig/aggressiv/konservativ λ) och lärstigs-JSON.
**Status:** Klar

---

### FEAT-023 — Flytta hjälptexter till redigerbar JSON-fil
**Branch:** `feature/help-json`
**Beskrivning:**
HELP_CONTENT är hårdkodat i app.js (89 rader, 23 poster). Flytta till `content/help.json` och ladda via `fetch()` i `loadCatalog()` — samma mönster som scenarier och lärstigar. Hjälptexterna blir då redigerbara utan att röra app.js.
**Status:** Klar

---

### FEAT-021 — Visa/dölj proportionalband som streckad linje i grafen
**Branch:** `feature/proportionalband`
**Beskrivning:**
Proportionalbandet (PB = 100/Kp %) definierar det PV-intervall som ger full utslagsvariation i regulatorn. Skuggat lila område SP-PB → SP, streckad linje vid SP-PB (u=100%).
**Status:** Klar

---

### FEAT-002 — Varning när SP är ouppnåeligt (SP > y_max)
**Branch:** `feature/sp-uppnabarhet-varning`
**Beskrivning:**
En självreglerande process har ett fysikaliskt tak: y_max = normalValue + K × u_max. Om SP sätts över y_max integrerar PID:en upp u till 100 % men y fastnar — studenter tror att PID:en är felinställd. Behöver en varning i statusraden, t.ex. "⚠ SP ouppnåeligt (y_max=50.0)".
**Status:** Klar

---

### FEAT-020 — Flytta steg-knappar nedanför parametergrupperna
**Status:** Klar

---

### FEAT-019 — Flytta Trigga puls-knappen till Störningar-gruppen
**Status:** Klar

---

### FEAT-018 — Logiska parametergrupper med collapse
**Status:** Klar

---

### FEAT-017 — Versionsinformation i GUI
**Status:** Klar

---

### FEAT-001 — Sidebar för scenario/lärstig-väljare
**Status:** Klar

---

### FEAT-003 — Lärstig: "Processens begränsningar"
**Status:** Klar

---

### FEAT-004 — Steg "Svag process" — byt till PI-scenario
**Status:** Klar
