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
**Status:** Mergad till `develop` och testpublicerad 2026-08-22. Granskning pausad av PO i
väntan på PED-003B (identifierade hinder: PB/Kp-samband, öppen slinga-steget för litet PB,
P/PI-jämförelsens tydlighet).

---

### PED-003B — Proportionalband, P/PI-jämförelse, pedagogiska PI/PID-scenarier och återanvändbar simuleringsanalys
**Branch:** `feature/PED-003B-pb-and-pid-comparison`
**Prioritet:** Hög
**Beskrivning:**
Uppföljningsuppdrag efter PO:s andra granskning. Bygger ett återanvändbart simulerings- och
kalibreringsverktyg, använder det för en parameterstudie (inte visuell gissning), och
omstrukturerar innehållet: ny lärstig om proportionalband/Kp, P/PI-jämförelsen flyttad dit,
`pi-pid.v1` renodlad till en kontrollerad PI/PID-jämförelse.
**Genomförande:**
- `apps/app/sim-core.js` — simuleringskärnan extraherad ur `app.js` (oförändrad, ingen
  duplicering) så både appen och analysverktyget delar exakt samma kod.
- `tests/simulation/` — återanvändbart CLI + bibliotek (`runAnalysis`), 11 egna tester.
  Se `tests/simulation/README.md`.
- Fyra nya, parameterstudieverifierade scenarier: `p-pi-comparison-p/-pi`,
  `pi-pid-comparison-pi/-pid`. Ny teorimodul `proportionalband.v1.json` (PB = 100/Kp, samma
  notation som appens befintliga "Visa PB"-funktion).
- Ny lärstig `proportionalband-forstarkning.v1` (6 steg), insatt mellan
  `oppen-slinga-onoff-p.v1` och `pi-pid.v1` i `catalog.json`.
- `pi-pid.v1` innehåller inte längre P-delen — renodlad PI/PID-jämförelse.
- PB=0 kontrollerat och dokumenterat: PB är en ren visningsberäkning (`100/Kp`) i `app.js`,
  inte en del av simuleringskärnan. Kp är UI-klampat till min 0.1, så PB=0 är aldrig
  tekniskt nåbart — lärstigen beskriver gränsfallet (PB→0 vid högt Kp) istället för ett
  påstått specialfall, i linje med uppdragets instruktion.
- Fullständig parameterstudie, förkastade kandidater och framtida kalibreringskandidater i
  `docs/reports/PED-003B_PARAMETERSTUDIE.md`.
**Status:** Mergad till `develop` och testpublicerad 2026-08-22. PO:s tredje granskning gav
godkänt för presentationsläge och PI/PID-lärstig, med två avgränsade uppföljningskrav (PB:s
referensområde, PID-hjälpens D-term) — se PED-003C.

---

### PED-003C — Förtydliga PB:s referensområde och PID-regulatorns D-del
**Branch:** `feature/PED-003C-pb-and-pid-help`
**Prioritet:** Hög
**Beskrivning:**
Uppföljningsuppdrag efter PO:s tredje granskning. Rent förtydligande — ingen ny funktion,
inga parameter- eller kodändringar. Två avgränsade textkorrigeringar, båda föregångna av
verifiering mot `apps/app/sim-core.js` och samtliga scenariofiler.
**Genomförande:**
- Verifierat: alla 23 scenarier använder `measurementRange` och `outputLimits` {0,100} — PV,
  SP och u är genomgående normaliserade 0–100 % i praktiken (om än inte schema-tvingat).
  `PB = 100/Kp` är dimensionsmässigt korrekt givet detta. `proportionalband.v1.json`
  kompletterad med referensområdet och ett konkret exempel; PB=100/Kp-formeln var redan
  korrekt och är oförändrad.
- Verifierat i `sim-core.js`: D-termen beräknas som `-Kp×Td×(dPV/dt)` — derivata på PV, INTE
  på reglerfelet (derivative-on-measurement, undviker derivatakick vid SP-ändringar).
  `help.json`s `mode`-post kompletterad med denna exakta formel och en upplysning om att D
  beräknas på PV. Den redan korrekta `td`-hjälptexten var oförändrad.
- "Bäst prestanda men känslig för brus" ersatt med en neutral formulering i linje med
  `pi-pid.v1`s pedagogiska poäng (PID inte alltid bättre än PI).
- `APP_VERSION` 1.2→1.3 och content-version 1.5.0→1.5.1 (användarönskemål utöver PM:s
  uppdrag, för att synas i UI:t).
- Presentationsläge, scenarioparametrar, jämförelsescenarier och progression rörda inte.
  Verifierat att scenarioresultat är byte-identiska med PED-003B.
**Status:** Mergad till `develop` och testpublicerad 2026-08-23. Inga stoppvillkor
triggades — ingen avvikelse hittades mellan specifikation, teori och kod. Följdes av
bugg 2026-012 (PB/SP/hysteresband uppdaterades inte utan steg, upptäckt av PO under
granskning av just denna lärstig) — se `buglog-done.md`.

---

### PED-003D — Enhetlig PV-notation, mätbara jämförelser och rensning av intern analysinformation
**Branch:** `feature/PED-003D-pv-measurement-and-instructions`
**Prioritet:** Hög
**Beskrivning:**
Uppföljningsuppdrag efter PO:s Test 1–3. Tre huvuddelar: (1) ta bort hänvisningar till
parameterstudien från appens instruktioner, (2) enhetlig PV-notation i allt
användarsynligt innehåll (tidigare "y"), (3) förtydliga jämförelseförsöken i
"Processens begränsningar" till tydliga försök 1/försök 2-par, med stöd av knappen
"Mät K/T/L". Test 4 (checkpoints) var pausat i väntan på denna kollation.
**Genomförande:**
- Statusraden visar nu `SP=...`, `PV=...` (ej `y=`) i ordningen steg/t/SP/PV/e/u/P/I/D.
  SP läses från samma historikindex som PV/e för konsistens.
- **Viktigt verifierat fynd:** `e` stämmer inte exakt med `SP−PV` under aktiva
  transienter (uppmätt diff 2.008 vid start → 0.014 vid steg 100 → 0.000 vid sann
  steady-state, för samma scenario). Orsak: `ctrl.error` i `sim-core.js` beräknas mot
  PV *före* processens uppdatering det steget, sparas i historiken tillsammans med PV
  *efter* uppdateringen — ett inbyggt ett-stegs mät→beräkna→agera-mönster, likt ett
  verkligt diskret reglersystem. Förväntat och korrekt, inte en bugg. Rörde inte
  beräkningen av `e` (i linje med uppdraget). Avvikelsen är exakt noll vid den
  steady-state lärstigarna faktiskt ber studenten läsa av.
- `y` → `PV` (och `dy/dt` → `dPV/dt`) i `help.json`, tre teorimoduler, samt de aktiva
  lärstigarna `integrerande-process-niva.v1` och `windup-antiwindup.v1`. De föräldralösa
  `grundlaggande.v1.json`/`windup.v1.json` innehåller fortfarande `y` men laddas aldrig
  (inte i `catalog.json`) — lämnade orörda, rapporterade.
- Parameterstudiehänvisning borttagen ur `pi-pid.v1`s instruktion.
- `processbegransningar.v1` omstrukturerad: 3→5 steg (1 teori + 2+2 scenario), båda
  jämförelserna (K=1.3 vs K=0.5, L=0 vs L=5) nu uttryckliga försök 1/försök 2-par,
  verifierade med `tests/simulation/`. Dötidsresultatet blev måttligt (mätbar men
  begränsad översläng, ingen oscillation) — texten skriven därefter, undviker
  "destabiliserar".
- "Mät K/T/L" tillagd i `processbegransningar.v1` (båda jämförelsernas första försök)
  och `pi-pid.v1` (båda försöken). Övriga kandidater inventerade, ej ändrade — se
  leveransrapport.
- Kollationsrapport för samtliga 12 checkpoints i de tre lärstigarna:
  `docs/reports/PED-003D_TESTFRAGOR.md`.
**Status:** Mergad till `develop` och testpublicerad 2026-08-23. Inga formella
stoppvillkor utlöstes, men ett verifieringsfynd (e vs SP−PV under transienter)
redovisades tydligt för PO/PM.

---

### PED-003E — Tydligare dötidsjämförelse och förenklad statusrad
**Branch:** `feature/PED-003E-deadtime-and-status-format`
**Prioritet:** Hög
**Beskrivning:**
Uppföljningsuppdrag efter PO:s granskning av dötidsförsöket och statusraden. Två
avgränsade fixar: starkare dötidskontrast (PO:s hypotes K=1,5/Kp=1,5 verifierad) och
statusraden begränsad till en decimal.
**Genomförande:**
- PO:s hypotes verifierad med `tests/simulation/` över Ti=10–30: K=1.5, Kp=1.5 ger
  genomgående L=0 → obetydlig översläng, L=5 → tydlig översläng. Vald konfiguration
  (Ti=20, 80 steg): L=0 ger 0.3 % översläng (i praktiken monotont), L=5 ger 9.4 % —
  en klar förbättring mot PED-003D:s ursprungliga ~0 % / ~1 %.
- `pi-step-self-regulating.json` (K=1.3) används fortsatt av lärstigens egna "Svag
  process"-steg — kunde inte ändras utan att påverka den redan godkända
  jämförelsen. Nytt dedikerat scenario `pi-deadtime-comparison.json` skapat istället
  (K=1.5, Kp=1.5, Ti=20, L=0 startvärde, SP=60), registrerat i `catalog.json`
  (content-version v1.5.2→v1.5.3).
- `processbegransningar.v1`s två dötidssteg omskrivna för det nya scenariot och den
  tydligare skillnaden. Checkpointen i steg 5 omskriven i linje med det starkare
  resultatet — se tillägg i `docs/reports/PED-003D_TESTFRAGOR.md`.
- Statusraden: ny `fmt1()`-hjälpfunktion, en decimal för t/SP/PV/e/u/P/I/D (steg
  fortsatt heltal), `-0.0` särhanterat till `0.0`. Ren visningsformatering —
  verifierat att underliggande värden, historik och analysverktygets precision är
  oförändrade (regressionstest: pi-pid-comparison-pid ger samma tal som innan, nu
  bara med färre decimaler).
- Det kända e/SP−PV-tidsförhållandet från PED-003D är oförändrat och odolt — kod-
  kommentaren utökad för att förtydliga att decimalavrundningen inte döljer det.
**Status:** Implementerad och testad i feature-branchen. Inga stoppvillkor
triggades — K=1.5/Kp=1.5 gav precis den skillnad PO förutspådde.

---

### PROD-001A — Publiceringsunderlag för första undervisningsreleasen
**Branch:** `feature/PROD-001A-publication-inventory`
**Prioritet:** Hög
**Beskrivning:**
Uppdrag från PO/PM att ta fram ett fullständigt, rent analytiskt beslutsunderlag inför
publiceringsbeslut för lärstigar, scenarier, teorimoduler och funktioner — ingen
implementation.
**Genomförande:**
`docs/reports/PROD-001A_PUBLICERINGSUNDERLAG.md` (11 avsnitt) och tvillingfilen
`PROD-001A_PUBLICERINGSUNDERLAG.json` (55 poster). Samtliga `poPmDecision` står som
"Ej beslutat" — CC:s klassificeringar är rekommendationer, inte beslut.
**Status:** Mergad till `develop`. Väntar på PO/PM:s genomgång av beslutslistan
(rapportens avsnitt 10) innan PROD-001B kan formuleras.

---

### HANDOFF-001 — Överlämning till nästa CC-session (datorbyte)
**Branch:** `feature/HANDOFF-001-cross-pc-handover`
**Prioritet:** Hög
**Beskrivning:**
Rent dokumentationsuppdrag inför att PO fortsätter projektet på en annan dator. CC:s
lokala sessionskontext följer inte med — en versionshanterad överlämningsfil skapas som
primär ingång för nästa CC-session.
**Genomförande:**
`docs/handoffs/HANDOFF_2026-08-23.md` — roller, Gitflow, git-status, sammanfattning av
PED-001–PED-003E och PROD-001A, redan fattade principbeslut, ej fattade beslut, kända
tekniska förhållanden, obligatorisk läsordning och startkontroll för nästa session.
**Status:** Mergad till `develop`. Nästa CC-session ska vänta på ett konkret uppdrag
från PO/PM — inget arbete påbörjas automatiskt.

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
