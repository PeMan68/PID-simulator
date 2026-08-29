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

### BESLUT-003 — Välj licens för det publika repositoryt
**Prioritet:** Låg
**Beskrivning:**
Upptäckt under DOCS-001 (dokumentationsrevision efter RELEASE-v1.3.0): projektet saknar
en licensfil. Repositoryt är publikt sedan tidigare, men ingen `LICENSE`/`LICENCE.md`
finns, och ingen licens är dokumenterad i README. Utan en explicit licens gäller
upphovsrättens standardläge (allt är rättighetsskyddat, ingen återanvändning tillåten
utan tillstånd) — vilket kan vara oavsiktligt givet att repot är publikt och avsett för
undervisning. DOCS-001 varken valde eller skapade en licens, i linje med uppdragets
avgränsning; README dokumenterar bara sakligt att frågan är öppen.
**Status:** Öppen — beslut krävs av PO

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

### PROD-001B — DEV/PROD-miljöprofiler och beslutat produktionsurval
**Branch:** `feature/PROD-001B-environment-profiles`
**Prioritet:** Hög
**Beskrivning:**
Implementationsuppdrag från PO/PM efter PROD-001A. Inför en DEV- och en PROD-profil i
samma kodbas, styrda av konfiguration och katalogurval — inga permanenta manuella
kodskillnader mellan branches. PO/PM:s beslutade första produktionsurval: 5 lärstigar
(kom-igång, oppen-slinga-onoff-p, proportionalband-forstarkning, pi-pid,
processbegransningar); windup-antiwindup, integrerande-process-niva,
stegsvar-identifiering och lambda-metoden döljs tills vidare (kvar i DEV).
**Genomförande:**
- `apps/app/env.js` (aktiv, DEV) / `env.prod.js` (mall) — `ENV_CONFIG`: environment,
  showTestMode, showScore, showExperimentalContent, catalogFile. Laddas som separat
  `<script>` före `app.js`. Ingen URL-parameter, inget tangentbord och ingen dold knapp
  kan byta profil — verifierat i webbläsarkonsol och via manipulerad URL.
- `content/catalog.prod.json` — allowlist med de 5 godkända lärstigarna, deras 11
  beroendescenarier och 4 teorimoduler. Scenario-fältet `standalone` styr om ett
  beroendescenario syns i den fristående väljaren (10 av 11 gör det —
  `pi-deadtime-comparison` är CC:s enda avsteg, dolt pga. dess egen
  återanvändningsvarning; se leveransrapporten).
- `app.js`: `loadCatalog()` läser `ENV_CONFIG.catalogFile`; `setTestMode(true)` är ett
  no-op om `showTestMode` är false; `updateScoreDisplay()` döljer poängraden ovillkorat
  om `showScore` är false; ny `applyEnvironmentUI()` döljer Guidat/Test-togglen och
  styr DEV-badgen (`#envBadge`).
- `tests/build-preview.mjs` — bygger `dist/dev/` och `dist/prod/` (ren filkopiering,
  inget byggsystem) för lokal förhandsvisning med valfri statisk server.
- `tests/validate-content.mjs` tar nu valfri katalogfil som argument.
  `tests/validate-prod.mjs` (ny): exakt de 5 beslutade lärstigarna i rätt ordning, inga
  dolda/experimentella läcker in, alla beroenden finns, Test-läge/poäng avstängda.
- `docs/development/ENVIRONMENTS.md` — fullständig dokumentation av profilerna.
- Verifierat med Playwright mot lokala DEV- och PROD-förhandsvisningar: samtliga 9
  DEV-lärstigar och alla 5 PROD-lärstigar går att stega igenom utan konsolfel eller
  nätverksfel; Test-läge kan inte tvingas fram i PROD ens via direkt konsolanrop.
**Status:** Mergad till `develop`. PO/PM kontrollerade och godkände DEV- och
PROD-förhandsvisningen — se RELEASE-v1.3.0, som publicerade detta produktionsurval.

---

### RELEASE-v1.3.0 — Första stabila undervisningsversionen publicerad
**Branch:** `release/v1.3.0` (raderad efter lyckad release, se genomförande)
**Prioritet:** Hög
**Beskrivning:**
Uppdrag från PO/PM att publicera v1.3.0 enligt Gitflow: hela `develop` (inklusive
PROD-001A/B) till `release/v1.3.0`, mergad till `main`, taggad, GitHub Pages omställd att
publicera uteslutande PROD-profilen från `main`, mergad tillbaka till `develop`. Ingen
selektiv merge eller cherry-pick — main och develop delar samma källkod, skillnaden är
enbart miljöprofil och produktionsurval.
**Genomförande:**
- Förkontroll: `develop`/`origin/develop` matchade (`26eeb7e`), `main` var strikt bakom
  utan unikt innehåll, arbetskatalogen ren, inga stashar/opushade brancher.
- `apps/app/app.js`: `APP_VERSION` → `1.3.0` (visas "v1.3.0" i UI). Content-version
  (`catalog.json`/`catalog.prod.json`, `v1.5.3`/`v1.5.3-prod`) oförändrad — inget innehåll
  ändrat i releasen.
- Ny `CHANGELOG.md` (repo-rot) med användarinriktade releaseanteckningar för v1.3.0.
- Nytt `.github/workflows/ci.yml`: DEV-/PROD-/allowlist-validering, simuleringsanalys,
  DEV- och PROD-byggning på push till `develop`/`feature/**`/`release/**` och PR mot
  `develop`/`main`. Publicerar aldrig Pages.
- `.github/workflows/deploy-pid-simulator.yml`: triggar nu **endast** på push till `main`
  (tidigare `develop`, tillfälligt). Kör PROD-validering och simuleringsanalys, bygger med
  `node tests/build-preview.mjs prod`, publicerar `dist/prod/` (aldrig `apps/app/` direkt
  eller `dist/dev/`). Concurrency-grupp `pages` tillagd.
- `release/v1.3.0` innehöll hela `develop` som linjär förfader (`git merge-base
  --is-ancestor` bekräftat) — enda tillägget var version/changelog/workflows, verifierat
  via `git diff origin/develop release/v1.3.0 --stat`.
- Mergad till `main` med synlig merge-commit `17564e1` ("release: PID Simulator v1.3.0"),
  pushad. `main` verifierat filträds-identiskt med `release/v1.3.0`.
- Taggad `v1.3.0` (annoterad, pekar på `17564e1`), pushad.
- GitHub Actions kördes automatiskt på push till `main`: samtliga steg i den nya
  deploy-workflowen lyckades (PROD-validering, allowlist-validering, simuleringsanalys,
  PROD-byggning, Pages-publicering).
- Live smoke-test mot `https://peman68.github.io/PID-simulator/`: appversion v1.3.0, exakt
  fem lärstigar i rätt ordning, ingen DEV-märkning, Test-läge/poäng dolda och kan inte
  tvingas fram (varken via konsolanrop eller URL-parametrar), presentationsläge och Mät
  K/T/L fungerar, `pi-deadtime-comparison.json` bekräftat hämtad via nätverket endast när
  lärstigen laddar den (inte i scenarioväljaren), 0 konsolfel, 0 nätverksfel.
- Mergad tillbaka till `develop` (`0ee7b55`), pushad. Efter återmerge: DEV visar
  fortfarande 9 lärstigar/Test-läge/poäng/DEV-märkning, PROD-byggning från `develop` visar
  5/inget Test-läge/ingen poäng/ingen DEV-märkning — identiskt med `main`.
- `release/v1.3.0` raderad lokalt och på origin efter att samtliga steg verifierats.
- Verifierat i Actions-loggen: push till `develop` (`0ee7b55`) triggade endast CI, ingen
  Pages-deploy — den nya deploy-workflowen på `develop` kan strukturellt inte längre
  publicera Pages.
- GitHub Release kunde inte skapas automatiskt (ingen `gh`-CLI eller annan autentiserad
  GitHub-åtkomst på arbetsmaskinen) — PO gav manuell instruktion i leveransrapporten.
  Branschskydd på `main` kunde inte läsas utan autentisering (rulesets-listan var tom,
  klassisk branch protection-status okänd) — rekommenderade regler rapporterade, inget
  aktiverat.
**Status:** Publicerad. `main` = stabil undervisningsversion v1.3.0, `develop` = fortsatt
utveckling med samma kodbas. Se `docs/development/ENVIRONMENTS.md` för
STEG 1–5-livscykeln (feature → tekniskt klar → produktionsgodkänd → release → publicerad).

---

### DOCS-001 — Revidera publik dokumentation efter release v1.3.0
**Branch:** `feature/DOCS-001-public-documentation`
**Prioritet:** Medel
**Beskrivning:**
Uppdrag från PO/PM att revidera repositoryts publika dokumentation efter RELEASE-v1.3.0 —
README.md var kraftigt föråldrat och beskrev varken DEV/PROD-profilerna eller det
publicerade produktionsurvalet. Ren dokumentationsrevision, ingen appkod eller
produktionskonfiguration ändrad.
**Genomförande:**
- `README.md` omskrivet i sin helhet: officiell version/URL, PROD-funktionslista och de
  fem publicerade lärstigarna i rätt ordning, DEV/PROD-tabell, verifierade lokala
  bygg-/testkommandon, Gitflow med produktionsgodkännande-regeln, projektstatus,
  licensstatus.
- `apps/app/README.md` omskrivet — beskrev tidigare en helt annan, övergiven arkitektur
  ("helt offline", "ingen fetch") som direkt motsade hur appen faktiskt fungerar och som
  skeppades rakt in i den publicerade PROD-artifakten.
- `docs/development/ENVIRONMENTS.md` kompletterad med avsnitt om repositoryts synlighet.
- Ny **BESLUT-003** (licensfråga, öppen punkt för PO — projektet saknar licensfil).
- Fullständig säkerhets-/integritetsgenomgång av hela det versionshanterade filträdet:
  0 hemligheter/tokens/nycklar, inga tredjepartspersonuppgifter. Två låggradiga fynd
  rapporterade (ett lokalt Windows-användarnamn i `.claude/settings.json`, PO:s eget
  namn/jobbmejl i en commits författaruppgift) — ingen åtgärd krävd.
- **Viktigt, ej åtgärdat fynd:** PROD-artifakten (`dist/prod/`, byggd med
  `tests/build-preview.mjs`) innehåller fysiskt samtliga DEV-innehållsfiler — inklusive de
  fyra dolda lärstigarnas checkpoint-facit — eftersom byggskriptet kopierar hela
  `apps/app/` utan att filtrera mot `catalog.prod.json`s allowlist. Filerna visas aldrig i
  UI och hämtas aldrig av den körande appen, men är direkt nåbara för den som känner till
  URL:en. Detta är ett bygg-/produktfel upptäckt genom dokumentationsgranskningen, inte
  ett dokumentationsfel — rättades därför inte inom DOCS-001, i linje med uppdragets
  uttryckliga avgränsning. Se `docs/reports/DOCS-001_DOKUMENTATIONSREVISION.md` för
  fullständig beskrivning och rekommenderad åtgärd (ett litet, avgränsat tekniskt
  uppdrag som filtrerar byggstegets filkopiering).
- Fullständig rapport: `docs/reports/DOCS-001_DOKUMENTATIONSREVISION.md`.
**Status:** Publicerad till `main` i **RELEASE-v1.4.0**. Det tidigare "viktiga, ej
åtgärdade fyndet" (PROD-artifakten innehöll fysiskt hela DEV-innehållet) åtgärdades i
**HOTFIX-v1.3.1**. PO/PM beslutade att låta README-revisionen följa med i samma release
som produktionsaktiveringen av Windup och anti-windup, istället för en separat
dokumentationsrelease.

---

### HOTFIX-v1.3.1 — Filtrera PROD-artifakten enligt produktionskatalogens allowlist
**Branch:** `hotfix/v1.3.1-prod-artifact-filtering` (raderad efter lyckad release)
**Prioritet:** Hög — pedagogisk exponeringsrisk inför undervisningen
**Beskrivning:**
PM-beslutad hotfix på det fynd DOCS-001 rapporterade men uttryckligen inte fick rätta:
`tests/build-preview.mjs` kopierade hela `apps/app/` till PROD-artifakten istället för att
filtrera mot `catalog.prod.json`. UI:t visade alltid rätt (bara fem lärstigar), men fyra
dolda lärstigars checkpoint-facit, oanvända/experimentella scenarier och hela DEV-katalogen
låg fysiskt hämtningsbara på den publicerade webbplatsen för den som kände till URL:en.
Ingen säkerhets- eller personuppgiftsincident — klassad som pedagogisk exponeringsrisk.
**Genomförande:**
- Ny `tests/lib/prod-content-set.mjs`: härleder PROD:s tillåtna innehållsfiler genom att
  faktiskt läsa varje publicerad lärstigs `steps[]` och slå upp teori-/scenarioreferenserna
  mot `catalog.prod.json` — inte en hårdkodad lista, inte katalogens `theory[]`/
  `scenarios[]` rakt av. Fristående scenarier (`standalone !== false`) tas alltid med. Ett
  lärsteg som refererar något som saknas ger ett tydligt byggfel istället för att tyst
  hoppas över.
- Ny `tests/lib/build-prod.mjs` (testbar kärna) och omskrivet `tests/build-preview.mjs`
  (tunn CLI). DEV-byggningen oförändrad — fortsatt en ren kopia av `apps/app/`.
- `tests/validate-prod.mjs` utökad: kontrollerar nu även den faktiskt byggda
  `dist/prod/`-artifakten (kräver att `build-preview.mjs prod` körts först) — inga
  otillåtna toppnivåkataloger, ingen DEV-katalog, exakt de härledda filerna i
  exercises/theory/scenarios, `pi-deadtime-comparison` finns men är inte fristående,
  samtliga filer giltig JSON.
- Ny `tests/build-preview.test.mjs`: 10 tester mot syntetiska content-fixturer i
  `os.tmpdir()` (rör aldrig `apps/app/content/`) — täcker bl.a. att en dold lärstigs
  checkpoint-facit inte finns någonstans i den byggda artifakten, och att en gammal fil
  från en tidigare byggning rensas bort.
- `.github/workflows/ci.yml` och `deploy-pid-simulator.yml`: byggordningen ändrad till
  bygg → validera (tidigare validera → bygg), eftersom valideringen nu kontrollerar den
  byggda artifakten.
- `APP_VERSION` → `1.3.1`. Content-version oförändrad (inget lärstigs-/scenario-/
  teoriinnehåll ändrat, bara vilka filer som byggs in).
- Verifierat live på https://peman68.github.io/PID-simulator/ efter deployment: samtliga
  tidigare hämtningsbara dolda/föräldralösa/experimentella filer och DEV-katalogen svarar
  nu 404; alla fem publicerade lärstigars beroenden (inkl. `pi-deadtime-comparison`, som
  fortsatt laddas via lärstigen men inte visas fristående) svarar 200; 0 konsolfel,
  0 nätverksfel; DEV oförändrat (9 lärstigar, Test-läge, poäng, DEV-märkning).
- Mergad till `main` (`3cc26cc`), taggad `v1.3.1`, mergad tillbaka till `develop`
  (`70e2f36`, en konflikt i `docs/development/ENVIRONMENTS.md` löst manuellt utan att
  tappa DOCS-001:s tillägg).
**Status:** Publicerad. `main` = v1.3.1. Se `docs/development/ENVIRONMENTS.md` för
uppdaterad byggdokumentation.

---

### PROD-enable-windup-antiwindup — Produktionsaktivera Windup och anti-windup
**Branch:** `feature/PROD-enable-windup-antiwindup` (raderad efter merge)
**Prioritet:** Medel
**Beskrivning:**
PO/PM-beslut efter HOTFIX-v1.3.1: lärstigen Windup och anti-windup är pedagogiskt
granskad och godkänd för undervisningsversionen. Placeras sist, efter Processens
begränsningar.
**Genomförande:**
`catalog.prod.json` utökad med `windup-antiwindup.v1` (sjätte lärstigen) samt dess
beroenden — teori `integrator-windup`, scenario `pi-windup-demo` (`standalone: true`,
inget känt återanvändningsproblem, passar den fristående väljaren). `EXPECTED_LEARNING_
PATHS` i `tests/validate-prod.mjs` utökad till sex lärstigar; en kvarglömd hårdkodad
`!== 5`-kontroll rättad till att jämföra mot facitlistans längd. Lärstigens eget
innehåll (steg, checkpoints) oförändrat — verifierat med `git diff`. Beroenden härledda
automatiskt av `tests/lib/prod-content-set.mjs`, inga andra filer påverkade.
**Status:** Mergad till `develop`, publicerad till `main` i RELEASE-v1.4.0.

---

### RELEASE-v1.4.0 — Windup och anti-windup samt reviderad dokumentation publicerade
**Branch:** `release/v1.4.0` (raderad efter lyckad release)
**Prioritet:** Hög
**Beskrivning:**
PM-beslutad ordinarie release enligt Gitflow: hela `develop` (DOCS-001 +
HOTFIX-v1.3.1:s artifaktfiltrering + produktionsaktiverad Windup/anti-windup) till
`release/v1.4.0`, mergad till `main`, taggad, mergad tillbaka till `develop`. Version
v1.4.0 (inte en patch) eftersom en ny lärstig blir synlig för användarna — en ny
produktfunktion, inte bara en felrättning.
**Genomförande:**
- Förkontroll: `develop`/`origin/develop` matchade (`fcaca0c`), `main` innehöll `v1.3.1`
  utan oidentifierade tillägg, arbetskatalogen ren.
- `APP_VERSION` → `1.4.0`. Content-version oförändrad (inget innehåll ändrat i sig, bara
  produktionsurvalet).
- `CHANGELOG.md` uppdaterad: sex publicerade lärstigar, README-revisionen nämnd.
- `release/v1.4.0` verifierad som en linjär fortsättning av `develop` (`git merge-base
  --is-ancestor`) — enda tillägget var version/changelog, verifierat via `git diff`.
- Fullständig testsvit grön (DEV-/PROD-validering, allowlist-validering på byggd
  artifakt, simuleringsanalys, artifaktfiltreringstester) samt lokal Playwright-
  regression: 6 lärstigar i PROD, Windup-lärstigen genomförbar felfritt, DEV oförändrat.
- Mergad till `main` (`2e13295`, "release: PID Simulator v1.4.0"), pushad. `main`
  verifierat filträds-identiskt med `release/v1.4.0`.
- Taggad `v1.4.0` → `2e13295`, pushad.
- GitHub Actions kördes automatiskt på push till `main` och lyckades (PROD-validering →
  simuleringsanalys → PROD-byggning → allowlist-validering på byggd artifakt → Pages).
- Live smoke-test mot `https://peman68.github.io/PID-simulator/`: appversion v1.4.0, sex
  lärstigar i rätt ordning, Windup-lärstigens filer (`windup-antiwindup.v1.json`,
  `integrator-windup.v1.json`, `pi-windup-demo.json`) svarar 200, övriga tre fortsatt
  dolda lärstigar och DEV-katalogen svarar fortsatt 404, presentationsläge och Mät K/T/L
  fungerar, 0 konsolfel, 0 nätverksfel.
- Mergad tillbaka till `develop` (`a4c147a`) utan konflikter (release-branchen innehöll
  bara version/changelog ovanpå det som redan låg i `develop`). `main` och `develop`
  filträds-identiska efter återmergen — DOCS-001 ligger nu på båda.
- `release/v1.4.0` raderad lokalt och på origin efter att samtliga steg verifierats.
**Status:** Publicerad. `main` = stabil undervisningsversion v1.4.0, `develop` =
fortsatt utveckling med samma kodbas och samma filträd som `main`.

---

### GAM-001 — Komplettera gamification-analysen med aktiv interaktionstid och hjälpaktivitet
**Branch:** `feature/GAM-001-gamification-analysis` (raderad efter merge)
**Prioritet:** Låg — analys/dokumentation, ingen implementation
**Beskrivning:**
Uppföljningsuppdrag till den ännu overkommittade XP-viktningsanalysen
(`docs/planning/GAMIFICATION-XP-ANALYS.md`). Kompletterar med PO/PM:s fyra nya
principer: aktiv interaktionstid (inte bara öppettid), musrörelse som svag
aktivitetssignal (aldrig XP), hjälptextsanvändning (XP första gången per unik
hjälptext/session) och en tre-nivåmodell råhändelser → pedagogiska aktiviteter → XP.
Rent analysuppdrag — ingen appkod, ingen händelseloggning, ingen XP-visning.
**Genomförande:**
- Inventerade samtliga 23 fysiska `.help-btn`-knappar / 24 distinkta hjälptexts-ID:n i
  `apps/app/index.html`/`help.json` (inkl. att `#kHelpBtn` dynamiskt växlar mellan
  `k`/`kv`) — grundat i faktisk kod, inte äldre rapporter.
- Ny modell för aktiv tid: Page Visibility API + window focus/blur + egna
  interaktionshändelser, med 60 s som rekommenderat (ej beslutat) startvärde för
  inaktivitetsgränsen. Idle Detection API avfärdat (HTTPS-krav, permission-prompt,
  begränsat stöd) till förmån för den enklare lokala modellen.
- `pointermove`: rekommenderad strypning till högst var 5:e sekund, ingen
  koordinatlagring, ger aldrig XP — bara en aktivitetssignal som håller
  inaktivitetstimern igång.
- Föreslog en tre-nivåmodell (råhändelser → pedagogiska aktiviteter → XP) och
  analyserade vilka råhändelser som ändå kan ge direkt XP utan spamrisk
  (`help_opened` och "nytt högsta lärstegsindex" — båda har ett naturligt tak).
- Analyserade tre alternativ för aktiv tid som XP-källa (ren statistik / låg XP med tak
  / XP kräver samtidig pedagogisk aktivitet) — rekommenderar att börja med ren statistik.
- Integritetsavsnitt: inga koordinater, inget tangentinnehåll, ingen persistens, ingen
  backend, samma princip som redan gäller `pathScore` i det avstängda Test-läget.
- Föreslog avgränsad nästa-steg-prototyp (DEV-only, konsolutskrift, ingen XP-visning)
  och de konkreta frågor den ska besvara innan synlig XP byggs.
**Status:** Mergad till `develop`. Analysdokumentet är nu versionshanterat. Uppföljt av
**GAM-002** (teknisk prototyp). Pedagogisk granskning av kvarvarande DEV-lärstigar är
fortsatt högre prioriterat än att gå vidare mot synlig XP.

---

### GAM-002 — Prototyp för sessionsbaserad aktivitetsmätning
**Branch:** `feature/GAM-002-activity-prototype` (raderad efter merge)
**Prioritet:** Låg — teknisk prototyp, ingen synlig funktion
**Beskrivning:**
PO-beslutad DEV-only prototyp som mäter och sammanställer sessionsaktivitet i
webbläsarkonsolen — ingen XP visas, ingen data sparas mellan sessioner, PROD helt
opåverkat. Syfte: kontrollera att appen kan skilja meningsfullt arbete från råa klick
innan viktning, levels eller lagring beslutas. Underlag: `docs/planning/GAMIFICATION-XP-ANALYS.md`.
**Genomförande:**
- `apps/app/activity-prototype-core.js` — DOM-fri tillståndsmaskin, samma UMD-mönster
  som `sim-core.js`, testbar i Node med injicerad tid (ingen väntan på verklig tid).
  Händelsekällad tidsavräkning (`settle()`), inget `setInterval`.
- `apps/app/activity-prototype.js` — tunn DOM-koppling (Page Visibility, focus/blur,
  strypt pointermove utan koordinater, `window.__activityDispatch`,
  `window.ActivityPrototype` för DEV-konsolen).
- `app.js`: skripten injiceras dynamiskt ENDAST om `ENV_CONFIG.environment ===
  "development"` — PROD begär dem aldrig (noll extra nätverkstrafik, verifierat: 0
  träffar på `activity-prototype*` i nätverksfliken). Dubbelt skydd:
  `tests/lib/build-prod.mjs` kopierar aldrig filerna till `dist/prod/`. Tunna, guardade
  `activityDispatch()`-anrop tillagda vid befintliga knapp-/fälthändelser — ingen
  befintlig logik ändrad, simulatorn opåverkad om modulen saknas eller felar.
- 60 s inaktivitetsgräns (startvärde), pointermove strypt till 1/5s, `help_opened` med
  k/kv som separata `helpId`, 5 %-regel för distinkt konfiguration (dokumenterad
  relativ-ändring-fallback för de fält som saknar `max`-attribut: k, t, l, kp, ti, td,
  noise, pulseMag, pulseDuration), 20-stegsregel för genomfört försök, jämförelsepar,
  lärstigsprogression (bakåtnavigering ger inte falska framsteg).
- `tests/activity-prototype.test.mjs` — 39 kontroller mot kärnmodulen (motsvarar
  uppdragets 30 testpunkter), inkl. strukturella kontroller av att ingen persistens,
  nätverkstrafik eller koppling till simuleringskärnan finns. 39/39 OK.
- Verifierat i riktig webbläsarsession (Playwright, DEV): fullständig testsession
  (lärstig, navigering, hjälptexter, en- och tiostegning, två parameterändringar under
  respektive över 5 %-tröskeln, Mät K/T/L, facit, flik dold/återställd) gav en
  sammanställning som exakt matchade den utförda sessionen, 0 konsolfel, 0 nätverksfel.
- PROD-regression (Playwright): `window.ActivityPrototype`/`window.__activityDispatch`
  existerar inte, 0 nätverksanrop mot aktivitetsfilerna, appen i övrigt oförändrad (6
  lärstigar, Test/poäng/DEV-märkning dolda). DEV oförändrat i övrigt (9 lärstigar,
  Test-läge fullt fungerande).
- Ny `docs/development/GAMIFICATION-PROTOTYPE.md` — fullständig teknisk dokumentation,
  kända begränsningar och de frågor som ska utvärderas manuellt innan synlig XP byggs.
**Status:** Mergad till `develop`. Ingen release, `main` oförändrat. Väntar på att
prototypen faktiskt används och att PO/PM beslutar om nästa steg.

---

### FEAT-030 — Lärstig "Störningar och robusthet"
**Branch:** `feature/storningar-robusthet`
**Prioritet:** Medel
**Beskrivning:**
Ny lärstig baserad på källmaterialet i `docs/exercises/ovningar-signalstorningar.md`
(ursprungligen skrivet för Python-appen), omstrukturerad och anpassad till nuvarande
webbapps termer och funktioner. Bygger på de två redan existerande men oanvända
scenarierna `pid-disturbance-noise` och `pid-pulse-rejection` — inga nya scenariofiler
behövs. Identifierad som "quick win" i `docs/reports/PED-001_NULAGE.md` och rankad som
topprioriterad kandidat i `docs/planning/PED-002_PROGRESSIONSKARTLAGGNING.md` (avsnitt 5,
kandidat 1, "Medel" arbetsinsats, inga beroenden). Täcker brus vs. P/PI/PID, D-delens
bruskänslighet, pulsstörning och återhämtningstid, samt avvägningen aggressiv/konservativ
inställning. En ny teorimodul om störningar/robusthet skapas som inledande steg.
**Status:** Öppen

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
