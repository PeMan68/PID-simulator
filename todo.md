 # Feature Backlog

Nya features registreras här i `develop`-branchen innan en feature-branch skapas.
Varje feature-branch uppdaterar **endast sin egen post** (status, anteckningar).

---

## Öppna

### Webbapp (`apps/app/`)

### FEAT-023 — Flytta hjälptexter till redigerbar JSON-fil
**Branch:** `feature/help-json`
**Prioritet:** Medel
**Beskrivning:**
HELP_CONTENT är hårdkodat i app.js (89 rader, 23 poster). Flytta till `content/help.json` och ladda via `fetch()` i `loadCatalog()` — samma mönster som scenarier och lärstigar. Hjälptexterna blir då redigerbara utan att röra app.js.
**Status:** Klar

---

### FEAT-025 — Onboarding: välkomstpanel + intro-lärstig för nya användare
**Branch:** `feature/onboarding`
**Prioritet:** Hög
**Beskrivning:**
Vid första besök visas en välkomstpanel i vänster sidebar med appbeskrivning och knappar "Börja här →" (laddar intro-lärstigen) och "Utforska fritt". Tillståndet sparas i localStorage. Intro-lärstigen "Kom igång med PID Simulator" guidar igenom appens funktioner i 5 steg utan checkpoints: översikt → scenarier → simulering → parametrar/hjälp → lärstigar.
**Status:** Klar

---

### FEAT-024 — Lärstig: Lambda-metoden för självreglerande system
**Branch:** `feature/larstig-lambda`
**Prioritet:** Hög
**Beskrivning:**
5-stegs lärstig för Lambda-metoden (modellbaserad PI-inställning). Kp = T/(K×(λ+L)), Ti = T. Inkluderar ny teorifil, 4 scenarion (open-loop, måttlig/aggressiv/konservativ λ) och lärstigs-JSON.
**Status:** Fixad i branch — inväntar testning

---

### FEAT-022 — Direktverkande / Omvänt verkande (verkningsriktning)
**Branch:** `feature/verkningsriktning`
**Prioritet:** Medel
**Beskrivning:**
Industriella regulatorer har en inställning för verkningsriktning: omvänt verkande (Kp > 0, t.ex. värme — utsignal ökar när PV sjunker) och direktverkande (Kp < 0, t.ex. kyla — utsignal ökar när PV stiger). Ska implementeras som en toggle i Regulator-gruppen och påverkar PB-bandets placering (ovanför SP vid direktverkande). Lämplig att inkludera i en lärstig om reglering av kylprocesser.
**Status:** Öppen

---

### FEAT-021 — Visa/dölj proportionalband som streckad linje i grafen
**Branch:** `feature/proportionalband`
**Prioritet:** Hög
**Beskrivning:**
Proportionalbandet (PB = 100/Kp %) definierar det PV-intervall som ger full utslagsvariation i regulatorn. Skuggat lila område SP-PB → SP, streckad linje vid SP-PB (u=100%).
**Status:** Klar

---

### FEAT-019 — Flytta Trigga puls-knappen till Störningar-gruppen
**Branch:** `feature/knapp-layout`
**Prioritet:** Medel
**Beskrivning:**
"Trigga puls"-knappen hör logiskt ihop med brus- och pulsinställningarna i Störningar-gruppen. Flytta knappen dit.
**Status:** Fixad i branch — inväntar testning

---

### FEAT-020 — Flytta steg-knappar nedanför parametergrupperna
**Branch:** `feature/knapp-layout`
**Prioritet:** Medel
**Beskrivning:**
Knapparna "Stega 1" och "Kör 10 steg" ska ligga nedanför parametergrupperna, inte ovanför dem. Bättre flöde: konfigurera parametrar → kör simulering.
**Status:** Fixad i branch — inväntar testning


---

### FEAT-002 — Varning när SP är ouppnåeligt (SP > y_max)
**Branch:** `feature/sp-uppnabarhet-varning`
**Prioritet:** Medel
**Beskrivning:**
En självreglerande process har ett fysikaliskt tak: y_max = normalValue + K × u_max. Om SP sätts över y_max integrerar PID:en upp u till 100 % men y fastnar — studenter tror att PID:en är felinställd. Behöver en varning i statusraden, t.ex. "⚠ SP ouppnåeligt (y_max=50.0)".
**Status:** Kanske klar — behöver verifieras

---

### FEAT-005 — Stegning framåt/bakåt i historik med markör
**Branch:** `feature/historik-stegning`
**Prioritet:** Medel
**Beskrivning:**
Möjlighet att stega framåt och bakåt i en redan plottad kurva. En markör i grafen visar vilket steg som presenteras, inklusive tidpunkt och aktuella P/I/D-värden i statusraden.
**Lösningsidé:**
Kräver sparande av alla simulator-stater — kan implementeras med state snapshots eller replay-logik.
**Status:** Öppen

---

### FEAT-007 — Avancerade störningsmodeller
**Branch:** `feature/storningsmodeller`
**Prioritet:** Medel
**Beskrivning:**
Fler typer av realistiska processförändringar utöver befintliga störningstyper.
**Status:** Öppen

---

### FEAT-009 — Frekvensanalys av störningar
**Branch:** `feature/frekvensanalys`
**Prioritet:** Låg
**Beskrivning:**
Olika brusfrekvenser och deras påverkan på reglering.
**Status:** Öppen

---

### FEAT-010 — Adaptiv reglering
**Branch:** `feature/adaptiv-reglering`
**Prioritet:** Låg
**Beskrivning:**
Automatisk anpassning av PID-parametrar för olika driftförhållanden.
**Status:** Öppen

---

### FEAT-011 — Säkerhetsmarginaler
**Branch:** `feature/sakerhetsmarginaler`
**Prioritet:** Låg
**Beskrivning:**
Verktyg för design med störningsreserver (gain margin, phase margin).
**Status:** Öppen

---

### Python-app (`main.py`)

### FEAT-006 — Utökad historik — jämförelse och export
**Branch:** `feature/python-historik-utokad`
**Prioritet:** Medel
**Beskrivning:**
Fler jämförelsemöjligheter mellan körningar och utökade exportalternativ utöver befintlig CSV-export.
**Status:** Öppen

---

### FEAT-008 — Utökad tooltip-funktionalitet
**Branch:** `feature/python-tooltips-utokad`
**Prioritet:** Medel
**Beskrivning:**
Mer kontextuell hjälp för avancerade funktioner via tooltips.
**Status:** Öppen

---

### FEAT-012 — Optimerad graf-rendering
**Branch:** `feature/python-graf-rendering`
**Prioritet:** Låg
**Beskrivning:**
Bättre prestanda vid många historiska kurvor simultant.
**Status:** Öppen

---

### FEAT-013 — Förbättrad export-funktionalitet
**Branch:** `feature/python-export-utokad`
**Prioritet:** Låg
**Beskrivning:**
Fler exportformat och dataanpassningar.
**Status:** Öppen

---

### FEAT-014 — Unicode/emoji-kompatibilitet
**Branch:** `feature/python-unicode`
**Prioritet:** Hög
**Beskrivning:**
Fullständig emoji-support för äldre Python/Tcl-versioner. Identifierat i v1.6.1 release notes.
**Status:** Öppen

---

### FEAT-015 — Förbättrad dialog-positionering
**Branch:** `feature/python-dialog-pos`
**Prioritet:** Medel
**Beskrivning:**
Mer robust centrering av dialogrutor på alla skärmkonfigurationer. Identifierat i v1.6.1 release notes.
**Status:** Öppen

---

### FEAT-016 — Förbättrad hysteresis-visualisering (OnOff)
**Branch:** `feature/python-hysteresis-ui`
**Prioritet:** Medel
**Beskrivning:**
Tydligare visuell feedback för OnOff-regulatorns hysteresis-gränser.
**Status:** Öppen

---

## Klara

### Webbapp (`apps/app/`)

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
