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
**Status:** Klar, mergad till `develop`. **Inte produktionsgodkänd** — flaggad som
kandidat för nästa PROD-release (se `HIDDEN_LEARNING_PATHS` i
`tests/validate-prod.mjs` och "Livscykel" i `docs/development/ENVIRONMENTS.md`,
STEG 3: kräver ett eget, litet `feature/PROD-enable-storningar-robusthet`-uppdrag när
PO beslutar).

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
