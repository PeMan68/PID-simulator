# Feature Backlog — Öppna

Nya features registreras här i `develop`-branchen innan en feature-branch skapas.
Varje feature-branch uppdaterar **endast sin egen post** (status, anteckningar).
Klara features flyttas till [todo-done.md](todo-done.md).

---

## Webbapp (`apps/app/`)

### BESLUT-001 — Ta ställning till appens namn inför slutlig prod-version
**Prioritet:** Låg (innan release)
**Beskrivning:**
"PID Simulator" är tekniskt korrekt men kan vara exkluderande för nybörjare och speglar inte bredden (On/Off, Lambda-metoden, lärstigar). Kandidater: Reglerlab, PIDlab, Processlabb. Namnbyte kräver: byta repo-namn på GitHub, uppdatera GitHub Pages-URL, uppdatera `<title>`, sidebar-rubrik och `APP_VERSION`-text i appen. Överväg custom domain för stabilt URL.
**Status:** Öppen — beslut krävs

---

### BESLUT-002 — Ingen vidare utveckling av Python-appen, allt fokus på webbappen
**Prioritet:** Hög
**Beskrivning:**
Produktbeslut 2026-08-21: `main.py` (tkinter-appen) läggs ner till förmån för webbappen (`apps/app/`). Webbkärnan (`packages/sim-core`) har redan uppnått funktionsparitet enligt `docs/architecture/python-parity-matrix.md`, och Python-appen har inte utvecklats sedan 2025-09-25. Ingen CI/deploy-koppling finns till Python-filerna.
**Genomförande:**
Nuvarande tillstånd taggat `archive/python-app-v1.7.0` för framtida referens. `main.py`, `requirements.txt`, `docs/python-app/` samt Python-specifika release notes (`docs/releases/CHANGELOG.md`, `release-notes-v1.5.0–v1.7.0.md`) borttagna från arbetsträdet i `feature/arkivera-python-app`. Öppna Python-features (FEAT-006, 008, 012–016) och -buggar (2026-003, 2026-005) stängda utan implementation.
**Status:** Beslutad och genomförd — se `todo-done.md` och `buglog-done.md`

---

### PED-003 — Omstrukturera lärstigar enligt kursens progression
**Branch:** `feature/PED-003-learning-path-progression`
**Prioritet:** Hög
**Beskrivning:**
Uppdrag från PO/PM (Per Manholm / Microsoft Copilot) att omstrukturera lärstigarna enligt
kursprogressionen i "Industriell Mät- och Reglerteknik", vecka 35–40, baserat på
`docs/reports/PED-001_NULAGE.md` och `docs/planning/PED-002_PROGRESSIONSKARTLAGGNING.md`.
**Genomförande:**
`grundlaggande.v1` delad i `oppen-slinga-onoff-p.v1` (v35) och `pi-pid.v1` (v36).
`windup.v1` delad i `windup-antiwindup.v1` (v36) och `integrerande-process-niva.v1` (v37).
`stegsvar-identifiering.v1` utökad med steg 8 (`second-order-identification`). `catalog.json`
omsorterad enligt kursprogressionen, version bumpad till v1.4.0. Nytt valideringsskript
`tests/validate-content.mjs`. Se PED-003-sammanfattningen i PR/commit-historik för fullständig
detaljlista över skapade/ändrade filer, föräldralösa filer och risker.
**Status:** Mergad till `develop` och testpublicerad (PED-003-TESTDEPLOY, 2026-08-21). PO:s
pedagogiska granskning pausad i väntan på PED-003A. Väntar på gemensam release.

---

### PED-003A — Pedagogiska korrigeringar och presentationsläge för lärstigar
**Branch:** `feature/PED-003A-presentation-and-text-fixes`
**Prioritet:** Hög
**Beskrivning:**
Uppföljningsuppdrag från PO/PM efter första pedagogiska granskningen av PED-003. Två delar:
(1) ett enkelt presentationsläge ("Presentera steg") som visar aktuellt lärstigssteg i stor
overlay för projektorbruk, (2) tre pedagogiska textkorrigeringar (öppen slinga-steget, P-steget,
PI-stegets jämförelsefråga) enligt PO:s exakta kärnformuleringar.
**Genomförande:**
Ny overlay + knapp i `index.html`/`app.js` (`buildPresentHtml`, `openPresentMode`,
`closePresentMode`) — rör aldrig simulatorns state, visar aldrig checkpointens
svarsalternativ. Textkorrigeringar i `oppen-slinga-onoff-p.v1.json` (steg 2 och 5) och
`pi-pid.v1.json` (steg 1 och 2). Ingen ändring av progression, scenario- eller
teorireferenser.
**Status:** Implementerad och testad i feature-branchen. Väntar på merge till `develop` och
testpublicering (PED-003-TESTDEPLOY-mönstret), därefter på PO:s nästa pedagogiska granskning.

---

### FEAT-022 — Direktverkande / Omvänt verkande (verkningsriktning)
**Branch:** `feature/verkningsriktning`
**Prioritet:** Medel
**Beskrivning:**
Industriella regulatorer har en inställning för verkningsriktning: omvänt verkande (Kp > 0, t.ex. värme — utsignal ökar när PV sjunker) och direktverkande (Kp < 0, t.ex. kyla — utsignal ökar när PV stiger). Ska implementeras som en toggle i Regulator-gruppen och påverkar PB-bandets placering (ovanför SP vid direktverkande). Lämplig att inkludera i en lärstig om reglering av kylprocesser.
**Status:** Öppen

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

## Python-app (`main.py`)

Python-appen är nedlagd — se BESLUT-002. Alla öppna Python-features är stängda utan
implementation och flyttade till [todo-done.md](todo-done.md).
