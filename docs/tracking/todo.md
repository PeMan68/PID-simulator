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

### GAM-003A — Kalibrera XP-modellen mot samtliga DEV-lärstigar
**Branch:** `feature/GAM-003A-xp-calibration`
**Prioritet:** Låg — analys/kalibrering, ingen synlig funktion
**Beskrivning:**
PM-beslutat analys-, test- och kalibreringsuppdrag. Provräknar PM:s preliminära
XP-modell (10 kategorier, 8 nivåer) mot samtliga tio aktiva DEV-lärstigar innan
GAM-003B:s synliga nivåfunktion byggs. Ingen synlig XP, badge eller nivåmätare
implementerad; ingen appkod ändrad; GAM-002:s registreringsmodell orörd.
**Genomförande:**
- Nytt återanvändbart XP-beräkningsverktyg `tests/gamification/` (`xp-model.mjs`,
  `lp-inventory.mjs`, `profiles.mjs`, `calibrate.mjs`, `manipulation.mjs`,
  `sensitivity.mjs`) — kör händelsesekvenser genom `activity-prototype-core.js`
  OFÖRÄNDRAD och beräknar XP via differens på dess sessionstillstånd (försök,
  distinkta konfigurationer, jämförelsepar, hjälp, lärstigsprogression) före/efter
  varje händelse. Analytisk enstegning och checkpoints (finns inte som GAM-002-
  händelse) hanteras i ett tunt eget lager ovanpå.
- Innehållsinventering av alla tio aktiva lärstigar, extraherad ur de faktiska
  instruktionstexterna (`lp-inventory.mjs`), med tre användarprofiler (minimal,
  normal, aktiv fördjupare) provräknade mot varje lärstig.
- Referensen "Test 1" (Proportionalband, normal-profil) gav 84 XP mot PM:s
  uppskattade 75–79 XP (+5, 7 % — rimlig marginal).
- 16 manipulationstester: 13 av 16 beter sig som avsett. Tre fynd: hjälp-XP utan
  tak kan ensamt ge 48 XP (mer än nivå 2:s tröskel på 35), identisk konfiguration
  upprepad efter Reset ger full "genomfört försök"-XP varje gång, och
  parameterändringar strax över 5 %-tröskeln kan farma jämförelsepar.
- Med PM:s oförändrade regler/nivåkurva når en aktiv fördjupare maxnivån
  (Reglerlegend) redan efter 7 av 10 lärstigar — mot kalibreringsmålet.
  Rekommenderad justering (hjälptak 5 unika/session, enstegningstak 3/försök,
  långsammare nivåkurva) gör att varken normal- eller fördjupare-profilen når
  taket genom en enda genomgång. Se rapporten för fullständig motivering.
- Strukturellt fynd: GAM-002 upptäcker bara jämförelsepar inom samma kontext —
  `storningar-robusthet.v1`s `continueFromPreviousStep`-jämförelser (FEAT-030)
  och flera andra lärstigars mellan-steg-jämförelser är osynliga för GAM-002.
  Öppet produktbeslut, ingen ändring av lärstigsformatet gjord i GAM-003A.
- Checkpoint-XP rekommenderas som ett separat prestationssystem, inte del av
  nivå-XP:t — inte implementerat, som instruerat.
- `tests/gamification/xp-model.test.mjs` — 33 automatiska tester, alla gröna.
- Full rapport: `docs/reports/GAM-003A_XP-KALIBRERING.md` +
  maskinläsbar `GAM-003A_XP-KALIBRERING.json`.
- DEV-/PROD-regression körd oförändrad efter uppdraget: `validate-content.mjs`
  (DEV+PROD), `validate-prod.mjs`, `build-preview.test.mjs`,
  `simulation/analyze.test.mjs`, `activity-prototype.test.mjs` — samtliga gröna.
  Ingen ändring i `apps/app/app.js`/`index.html`, bekräftat.
**Status:** Mergad till `develop`. Ingen release, `main` oförändrat. XP-modellen är
provräknad och tekniskt kalibrerad; synlig XP är fortfarande inte implementerad.
PO/PM granskade rapporten och beslutade en korrigerad grundprincip (repetition
ska ge full XP) — se **GAM-003A.1** nedan, som delvis ersätter
rekommendationerna här (hjälptak och sänkt enstegningstak tillbakadragna).

---

### GAM-003A.1 — Reviderad XP-kalibrering: repetition ska ge XP
**Branch:** `feature/GAM-003A.1-repetition-calibration`
**Prioritet:** Låg — analys/kalibrering, ingen synlig funktion
**Beskrivning:**
PO/PM-uppföljning på GAM-003A. Korrigerad grundprincip: XP ska premiera
lärandeaktivitet ÄVEN vid repetition (upprepade försök, lärstigar, egna
parameterexperiment) — det är avsedd användning, inte manipulation.
GAM-003A:s rekommenderade tak (hjälptak, sänkt enstegningstak) dras tillbaka;
PM:s ursprungliga, okapade XP-regler gäller. En ny, betydligt längre
nivåkurva (0/50/140/300/550/900/1400/2100) infördes istället.
**Genomförande:**
- **Två verkliga fel hittade och rättade i `tests/gamification/xp-model.mjs`**
  (inte i XP-reglerna): (1) ett pågående försök vid en händelsesekvens slut
  finaliserades aldrig — dess XP gick förlorad, motorn finaliserar nu
  automatiskt vid sessionens slut; (2) "slutförd lärstig"-XP var felaktigt
  hopkopplad med GAM-002:s bestående `completed`-flagga, vilket gjorde den
  ickerepeterbar — nu en egen, per-session repeterbar räkning. Referensen
  "Test 1" blev därför 90 XP (tidigare rapporterat 84).
- Nytt `priorState`/`endState`-lager i `computeXP()`: för-fyller GAM-002:s
  egna `session.learningPaths`/`session.contexts`-strukturer med tidigare
  sessioners bestående tillstånd (utan att röra GAM-002:s kod) — modellerar
  exakt vad en framtida `localStorage`-baserad persistens skulle behöva
  spara. Ny `mergeState()`-hjälpfunktion.
- Ny `tests/gamification/career.mjs`: kör N genomgångar av en lärstig eller
  hela katalogen, kedjat, och räknar ut vid vilken genomgång en profil når
  en given nivå.
- Resultat: en genomgång av alla tio lärstigar tar ingen profil till
  maxnivån (minimal→Loopvävare, normal→Loopvävare 60%, fördjupare→precis
  över Processmästare-tröskeln). Vid FLERA fulla genomgångar nås nivå 8
  efter 2 (fördjupare), 4 (normal) respektive 6 (minimal) genomgångar —
  öppen fråga till PO/PM om tempot är rätt avvägt.
- GAM-003A:s manipulationstester 4/6/8/16 omtolkade som avsedd, belönad
  repetition/experimenterande — inte längre beskrivna som fel.
- Tekniskt krav dokumenterat för GAM-003B: bestående progression (total XP,
  högsta nått lärsteg per lärstig, sedda konfigurationssignaturer) måste
  sparas mellan sessioner, plus en "Återställ progression"-funktion. Inte
  implementerat i GAM-003A.1.
- `comparisonGroup`-fält i lärstigsformatet (PO/PM:s förslag för jämförelser
  mellan lärsteg, ersätter GAM-003A:s `comparesWithStep`-idé) dokumenterat
  som öppet beslut — ingen ändring av lärstigsformatet gjord.
- `tests/gamification/xp-model.test.mjs` utökad till 43 tester (13 nya,
  bl.a. för bestående-vs-repeterbar-principen), alla gröna.
- Full rapport: `docs/reports/GAM-003A.1_XP-KALIBRERING-REPETITION.md` +
  maskinläsbar `.json`. Kort "OBS, delvis ersatt"-notis tillagd överst i
  `GAM-003A_XP-KALIBRERING.md` (historiken där är i övrigt oförändrad).
- DEV-/PROD-regression körd oförändrad: samma svit som GAM-003A, samtliga
  gröna. Ingen ändring i `apps/app/`, bekräftat.
**Status:** Mergad till `develop`. PO/PM godkände nivåtempot (2/4/6 genomgångar
till nivå 8), nivåkurvan, XP-modellen, repetitionsprincipen, localStorage-
persistens och beslutade att `comparisonGroup` ska införas fullt ut (inte bara
i kalibreringsverktyget) innan GAM-003B — se **GAM-003A.2** nedan.

---

### GAM-003A.2 — Deklarativa jämförelsegrupper (comparisonGroup)
**Branch:** `feature/GAM-003A.2-comparison-groups`
**Prioritet:** Låg — teknisk grund för GAM-003B, ingen synlig funktion
**Beskrivning:**
PO/PM-beslutad full implementation (inte bara kalibreringsverktyget) av ett
deklarativt fält för jämförelser som korsar lärstigssteg/scenario-ID-gränser,
vilket GAM-002 tidigare aldrig kunde se. Appen ska inte gissa jämförelser
från grafmarkeringar — de ska deklareras i lärstigsdata.
**Genomförande:**
- Nytt valfritt fält `comparisonGroup` i lärstigsformatet, validerat av
  `tests/validate-content.mjs` (typkontroll + varning för grupper med <2
  medlemmar eller satta på teoristeg).
- Satt på **19 steg i 6 lärstigar, 7 grupper**, efter att ha läst den
  fullständiga instruktionstexten i samtliga sju namngivna lärstigar —
  bara där en jämförelse uttryckligen instrueras. `oppen-slinga-onoff-p.v1`
  fick medvetet ingen grupp (ingen uttrycklig cross-step-jämförelseinstruktion).
  Korrigerar samtidigt ett fel i GAM-003A:s ursprungliga inventering av
  `windup-antiwindup.v1` (av/på-jämförelsen är två separata lärstigssteg,
  inte ett steg med två interna konfigurationer).
- `apps/app/app.js`: `comparisonGroup` skickas med i `learning_step_reached`
  (`nextPathStep`/`prevPathStep`), samma befintliga dispatch-anrop.
- `apps/app/activity-prototype-core.js` (GAM-002) utökad med
  `session.comparisonGroups`/`groupComparisonPairs` och en ny
  `recordGroupComparison()`, anropad EFTER den befintliga, oförändrade
  inom-kontext-jämförelselogiken. En grupp med fler än två försök
  (`storningar-noise-comparison`, fyra försök) jämförs bara mot det SENAST
  registrerade försöket — samma princip som redan gäller inom en kontext —
  vilket ger tre kedjade par, inte sex (C(4,2)). Ingen ny komplettering
  (roller/ordning) behövdes utöver `comparisonGroup` självt.
- Dubblettskydd verifierat: inom-kontext-par dubbelräknas aldrig som
  gruppar; bara riktningen "senaste→ny" prövas (inget A-B/B-A-dubbelpar);
  `comparisonGroups` ingår medvetet INTE i GAM-003A.1:s
  `priorState`/`endState`-persistensmodell, så en ny session kan generera
  samma gruppjämförelse igen (repetitionsprincipen).
- `tests/gamification/` uppdaterat (lp-inventory.mjs, profiles.mjs,
  xp-model.mjs) att använda samma comparisonGroup-information som appen.
  Ny `tests/gamification/comparison-groups-content.test.mjs` (23 tester)
  pinnar de faktiska grupperna mot riktigt innehåll.
- Referensen "Test 1" jämförelse-XP: 6 → 18 XP (två tidigare missade
  gruppjämförelser). Godkänt nivåtempo (2/4/6 genomgångar till nivå 8)
  förblev i praktiken oförändrat — de nya jämförelserna är bestående
  "första gången"-händelser, inte repeterbara vid identisk repetition.
- 8 nya tester i `tests/activity-prototype.test.mjs` (nu 48 totalt),
  23 nya i `comparison-groups-content.test.mjs`, `xp-model.test.mjs`
  oförändrat 43. Samtliga gröna.
- Full rapport: `docs/reports/GAM-003A.2_COMPARISON-GROUPS.md` + `.json`.
- DEV-/PROD-regression grön. PROD-artifakten fysiskt oförändrad i struktur
  (fältet är inert JSON-data i PROD — GAM-002 laddas aldrig där).
**Status:** Mergad till `develop`. Ingen release, `main` oförändrat. Ingen
synlig XP, ingen persistens. GAM-003B kan nu påbörjas.

---

### PED-005 — Granskning av jämförelser i lärstigarna
**Branch:** `feature/PED-005-learning-path-comparison-review`
**Prioritet:** Låg — analysuppdrag, blockerar GAM-003B tills PO/PM beslutat
**Beskrivning:**
Ren granskning (inga ändringar i lärstigsdata, comparisonGroup, appkod,
aktivitetsmodell eller XP-modell) av samtliga 14 identifierade jämförelser i
de 10 aktiva DEV-lärstigarna, inför GAM-003B:s synliga XP.
**Resultat i korthet:**
- Bekräftat 8 (inte 7) unika comparisonGroup-ID:n i kodbasen — skrivfel i
  GAM-003A.2-rapportens sammanfattningsmening, inte i koden eller testerna.
- 6 av 8 grupper redan pedagogiskt sunda (Metod D — separata försök med
  explicit noterade mätvärden); Störningar och robusthet oförändrad
  (redan PO-godkänd).
- Ett konkret sakfel hittat i publicerad lärstig: `pi-pid.v1` steg 3
  hänvisar till en icke-existerande "bläddra tillbaka i grafloggen"-funktion.
- Ett mindre instruktionsfel i `windup-antiwindup.v1` steg 2 (saknar
  notering av överskjutningsvärde som steg 3 sedan frågar efter).
- Öppet PO/PM-beslut: `lambda-comparison` — sekventiell kedja kontra
  gemensam referens (samma XP-summa oavsett val).
- Allvarligt, tidigare oupptäckt funktionsfel i DEV-only-lärstigen
  `stegsvar-identifiering.v1` (ej en comparisonGroup-fråga): steg 2-7
  saknar `continueFromPreviousStep`, så stegsvarskurvan raderas innan
  steg 4-7 hinner mäta den. Bör åtgärdas innan lärstigen övervägs för PROD.
- Ingen förändring av totalt antal jämförelsepar eller jämförelse-XP
  (72 XP oförändrat) — inga föreslagna ändringar rör XP-regeln.
- Ny återanvändbar kontroll: `tests/gamification/ped-005-audit.mjs`.
- Full rapport: `docs/reports/PED-005_JAMFORELSEGRANSKNING.md` + `.json`.
**Status:** Mergad till `develop`. Ingen release, `main` oförändrat. Inga
lärstigsfiler eller appkod ändrade. **GAM-003B pausad tills PO/PM har tagit
ställning till beslutsunderlaget** (se rapportens avsnitt 14).

---

### GAM-003B — Synlig DEV-prototyp för XP och nivåprogression
**Branch:** `feature/GAM-003B-visible-level-prototype`
**Prioritet:** Låg — DEV-prototyp, ingen produktionsaktivering
**Beskrivning:**
Bygger den synliga nivåfunktionen som GAM-003A/A.1/A.2 och PED-005 förberett
underlaget för: en kompakt nivåyta i vänstra sidopanelen (badge, nivånummer,
nivånamn, grafisk nivåmätare — inga XP-tal) som delar ut XP för verkliga
GAM-002-aktiviteter och sparar bestående progression mellan sessioner via en
egen `localStorage`-nyckel. **Status:** DEV-prototyp — ingen produktions-
aktivering beslutad. Nivån mäter aktivitet/progression, inte kompetens.
**Genomförande:**
- Fyra nya, avgränsade DOM-fria/tunt-DOM-moduler (samma UMD-mönster som
  `sim-core.js`): `gamification-xp-engine.js` (XP-/nivåregler, testbar i
  Node), `gamification-store.js` (`localStorage`-adapter + migrering, testbar
  med en mock), `gamification-ui.js` (ren rendering), `gamification.js`
  (bootstrap/glue). Ingen XP- eller persistenslogik i `app.js`.
- Enda integrationspunkten mot GAM-002: en ny `window.ActivityPrototype
  .onEvent(fn)`-registrering i `activity-prototype.js`, anropad EFTER
  `Core.recordEvent` med samma sessionsobjekt — omöjliggör dubbelregistrering
  per konstruktion. `activity-prototype-core.js` (GAM-002:s kärna) helt
  orörd.
- XP-reglerna och nivåkurvan (`LEVELS_V1`/`XP_RULES_V1` i
  `gamification-xp-engine.js`) matchar exakt PO/PM:s beslutade värden — se
  `docs/development/GAMIFICATION-XP-PROTOTYPE.md`.
- Bestående XP (nytt högsta lärsteg, distinkt-konfigurationsbonus) skild
  från repeterbar XP (försök, jämförelsepar, hjälp, mätarbete, enstegning,
  slutförd lärstig) — jämförelsepar kan alltså ge XP igen i en ny session
  trots att den underliggande "första gången"-bonusen är bestående.
- `ENV_CONFIG.showGamification` (DEV: `true`, PROD: `false`) styr, tillsammans
  med `environment`, om de fyra skripten injiceras alls — PROD begär dem
  aldrig över nätverket, och `tests/lib/build-prod.mjs`s fasta fillista
  kopierar dem heller aldrig. En verklig CSS-bugg hittades och fixades under
  utvecklingen: `.gam-level-panel`s egen `display: flex` slog igenom
  `[hidden]`-attributet i vissa fall — löst med en explicit
  `.gam-level-panel[hidden] { display: none; }`-regel, verifierad med en
  riktig PROD-förhandsvisning i webbläsaren.
- Nivåbytesanimation (badge-puls + kort "Ny nivå"-text, inte konfetti) med
  fullt stöd för `prefers-reduced-motion`.
- "Återställ progression" (DEV-only, kräver bekräftelse) raderar endast
  `pidSimGamificationV1`-nyckeln — appens övriga inställningar opåverkade.
- DEV-konsolstöd `window.GamificationDev` (state/grantTestXP/
  simulateLevelUp/reset), tydligt dokumenterat vad som speglar verklig
  aktivitet kontra rena testhjälpmedel.
- Nya tester: `gamification-engine.test.mjs` (34), `gamification-store.test.mjs`
  (20), `gamification-dev-prod-isolation.test.mjs` (13) — samtliga gröna,
  tillsammans med samtliga befintliga GAM-/innehålls-/simulerings-/PROD-
  tester. Manuell DEV- och PROD-regression genomförd i riktig webbläsare
  (Playwright, engångsskript).
**Status:** Mergad till `develop`. Ingen release, `main` oförändrat. Väntar
på PO:s användartest (visuell UX, nivåtempo, repetition, persistens,
återställning, nivåanimation) innan ett separat beslut om
produktionsaktivering kan övervägas.

---

### GAM-003C — Kvalificerad och fördröjd XP-visning
**Branch:** `feature/GAM-003C-qualified-delayed-progress`
**Prioritet:** Låg — DEV-prototyp, ingen produktionsaktivering
**Beskrivning:**
PO:s test av GAM-003B visade att barens direkta respons gjorde det lätt att
kartlägga vilket klick som gav XP. Ändrar INGA XP-värden eller nivågränser —
bara när/under vilka villkor XP bokförs och visas. Se
`docs/development/GAMIFICATION-XP-PROTOTYPE.md` (avsnitt "GAM-003C") för
fullständig beskrivning.
**Genomförande:**
- Bokföring (`engine.totalXP`) och visning (`engine.displayedXP`) frikopplade
  — baren synkas bara vid en naturlig avstämningspunkt (`Engine.shouldFlush`/
  `flush()`): stegbyte, scenariobyte, avslutat försök, slutförd lärstig,
  eller ett nivåbyte som redan bokförts.
- "Nytt högsta lärsteg" kräver nu kvalificering: teoristeg (aktiv lästid
  `4s+ord/4`, klämt 8–60s), scenariosteg (relevant aktivitet, inte bara
  väntetid), blandade steg (50 % av lästiden OCH aktivitet). Navigationen
  låses aldrig — ett okvalificerat steg ger bara ingen XP.
- "Unik hjälptext" kräver minst 3s aktiv tid med samma hjälptext öppen; byte
  av hjälptext eller stängd panel (ny `help_closed`-händelse) avbryter.
- En enda punktvis timer (inte polling) fångar tidsbaserad kvalificering när
  användaren blir overksam.
- Nivåpanelen komprimerad: bara badge/nivånummer/nivånamn/bar syns permanent.
  Hittade och fixade samtidigt en verklig CSS-bugg från GAM-003B — egna
  `display`-deklarationer slog igenom `[hidden]`, så förklaringstexten och
  Återställ-knappen syntes permanent istället för bara vid klick.
- Utökat DEV-konsolstöd: `pending()`, `log()`, `setXP()`, `jumpToLevel()`,
  `placeNearLevel()`, `simulateLevelUpSequence()`, `forceFlush()`.
- `gamification-engine.test.mjs` utökad till 64 tester (nya
  kvalificeringsregler); `gamification-store.test.mjs` (20) och
  `gamification-dev-prod-isolation.test.mjs` (13) oförändrat gröna.
  Samtliga befintliga GAM-/innehålls-/simulerings-/PROD-tester gröna.
  Manuell DEV/PROD-regression i riktig webbläsare (Playwright).
- Persistensformatet är OFÖRÄNDRAT — pendingStep/pendingHelp/displayedXP är
  sessionsbundna, ingen migrering behövdes.
**Status:** Mergad till `develop`. Ingen release, `main` oförändrat. Väntar
på PO:s nya användartest.

---

### FEAT-031 — Övningsdokument "Regulatortrimning i praktiken"
**Branch:** `feature/regulatortrimning`
**Prioritet:** Medel
**Beskrivning:**
Nytt fristående övningsdokument (`docs/exercises/ovningar-regulatortrimning.md`), adresserar
samma PO-önskemål som föranledde FEAT-030: relevanta övningsuppgifter för studenter att
experimentera på, byggda på källmaterialet i `docs/exercises/ovningar-systemoptimering.md`
(ursprungligen Python-appen) — men uttryckligen **inte** som en ny guidad lärstig med
checkpoints. Sex realistiska processer i stigande svårighetsgrad (P → PI → PID med dötid →
integrerande process → utsignalsbegränsning → mästarövning som kombinerar allt), var och en
med en medvetet feltrimmad startinställning som studenten själv ska förbättra mot ett
angivet mål. Bygger inte på scenariofiler ännu — processen ställs in manuellt enligt
dokumentets tabeller (se dokumentets egen notering om varför). Dokumentet är inte länkat
någonstans i appen eller README, i linje med hur de tre ursprungliga `docs/exercises/`-
dokumenten redan fungerar (fristående lärarmaterial, inte appinnehåll).
**Bakgrund/vägval:** Undersökning visade att en standalone-scenarios `description` aldrig
visas i appens gränssnitt (bara `title` i scenariolistan) — ett scenario ensamt kan alltså
inte förmedla mål/kontext till studenten. Ett övningsdokument (samma mönster som appens tre
ursprungliga `docs/exercises/*.md`) är därför rätt leveransform, inte en lärstig.
**Status:** Öppen — dokumentet skrivet, scenariofiler för progressionen är ett möjligt
uppföljningssteg (se dokumentets "Om scenarier"-notering) men inte del av detta uppdrag.

---

### FEAT-032 — Kurvöverlagring för regulatorjämförelse
**Branch:** `feature/kurvoverlagring`
**Prioritet:** Ej bedömd — utvärdering av om/när den ska göras tas separat
**Beskrivning:**
Möjlighet att spara en körd kurva och sedan köra en ny med andra regulatorinställningar
ovanpå, för att visuellt jämföra t.ex. olika Kp/Ti/Td på samma process — motsvarande
"Spara"-funktionen (max 5 sparade kurvor, stigande transparens äldst→nyast, permanent
färg-ID per kurva) som fanns i den nedlagda Python-appen (`git tag
archive/python-app-v1.7.0`, se `export_plots`/`save_simulation_to_history` i `main.py`).
Ingen kod från Python-appen kan återanvändas (annan renderingsmotor), men beteendet är
en bra utgångspunkt: historiken rensades automatiskt vid ändrad *process* (K/T/L/typ/
mätområde) men inte vid ändrad regulator, för att undvika missvisande jämförelser mellan
olika processer.
**Nuläge i webbappen:** `sim.history` ([apps/app/app.js](../../apps/app/app.js)) håller
bara en körning åt gången; "Rensa graf" nollställer helt. `drawChart()` ritar redan
godtyckliga färger per serie, så kärnändringen är ett `savedRuns`-state plus en
loop med nedtonad opacitet — men zoom, mätläge (tangentlinje/63 %) och PB-bandet är alla
skrivna mot den enda aktiva historiken och behöver ett uttryckligt beslut om de ska
gälla alla kurvor eller bara den aktiva.
**Bakgrund:** Motsvarar `FEAT-006` ("Utökad historik — jämförelse och export") från
Python-appen, stängd utan implementation via `BESLUT-002` när Python-appen lades ner —
inte en tidigare avvisad idé, bara aldrig byggd för webben. Även
[docs/exercises/ovningar-systemoptimering.md](../exercises/ovningar-systemoptimering.md)
förutsätter redan denna funktion ("Spara"-knapp, max 5 kurvor) i sina instruktioner,
trots att den inte finns i webbappen — relevant om det källmaterialet någonsin blir en
guidad lärstig (se `FEAT-031`, som uttryckligen undvek det beroendet).
**Status:** Öppen

---

### FEAT-033 — Exportera diagram i hög upplösning och simuleringsdata
**Branch:** `feature/export-diagram-data`
**Prioritet:** Ej bedömd — utvärdering av om/när den ska göras tas separat
**Beskrivning:**
Två separata exportbehov: (1) diagrammet som bild i högre upplösning än skärmvisningen,
för användning i rapporter/experimentdokumentation, och (2) simuleringsdata (tidsserier
och/eller regulator-/processparametrar) exporterbart för vidare analys. Motsvarande
Python-appens `export_plots` (matplotlib `fig.savefig(dpi=300, bbox_inches='tight')`,
PNG/PDF/SVG) och `export_data` (CSV med tidsserie, svenskt `;`-format och decimalkomma).
**Nuläge i webbappen:** Ingen exportfunktion finns alls. `chartCanvas` skalas idag bara
mot `clientWidth` utan hänsyn till `devicePixelRatio` ([apps/app/app.js:107](../../apps/app/app.js)),
så ett direkt `canvas.toDataURL()` skulle ge lika låg upplösning som skärmen — en
högupplöst export kräver att diagrammet ritas om mot en större offscreen-canvas vid
exporttillfället, inte en ren skärmdump. `sim.history` innehåller redan all data som
behövs för en CSV-export. Webbappen har inga externa beroenden (inget byggsteg, inga
CDN-script i `index.html`) — export bör lösas handrullat (canvas + Blob/`<a download>`)
om den arkitekturen ska bevaras, inte via ett nytt bibliotek.
**Beroende:** Om `FEAT-032` (kurvöverlagring) byggs, bör bildexporten rimligen inkludera
alla synliga kurvor, inte bara den aktiva — men denna feature kan byggas fristående och
oberoende av `FEAT-032` (exporterar då bara det som visas för tillfället).
**Bakgrund:** Motsvarar `FEAT-013` ("Förbättrad export-funktionalitet") från
Python-appen, stängd utan implementation via `BESLUT-002` av samma skäl som `FEAT-032`
ovan.
**Status:** Öppen

---

### HOTFIX-v1.4.1 — Dölj tangentlinjens facit i PROD, behåll i DEV
**Branch:** `hotfix/v1.4.1-hide-tangent-facit-in-prod`
**Prioritet:** Hög
**Beskrivning:**
PM-beslutat, avgränsat hotfix-uppdrag. PO har testat mätverktyget och beslutat:
marköravläsningen vid grafmarkören fungerar bra och behålls, Mät K/T/L behålls, men
tangentlinjens facit (den geometriska Ziegler-Nichols-konstruktion som beräknar och visar
L/T direkt i grafen) fungerar inte tillräckligt bra pedagogiskt och ska döljas i PROD.
Under uppdragets förkontroll identifierades en andra, separat facit-mekanism i samma
mätpanel — "Visa facit"-knappen, som visar en tabell med scenariots faktiska K/T/L-värden
rakt av. Uppdragstexten nämnde bara "tangentlinjens facit" uttryckligen; PO/PM tillfrågades
och beslutade att **båda** ska döljas i PROD.
**Genomförande:**
- Ny miljöflagga `ENV_CONFIG.showMeasurementFacit` (`true` i `apps/app/env.js`/DEV,
  `false` i `apps/app/env.prod.js`/PROD-mall).
- `applyEnvironmentUI()` i `apps/app/app.js` döljer båda kontrollerna i PROD: kryssrutans
  wrapper (`#mpTangentField`), knappens grupp (`#measureGroupFacit`) och separatorn mellan
  dem (`#measureSepFacit`) — ingen tom lucka eller trasig kontrollgrupp lämnas kvar.
- Defense-in-depth (samma idiom som `setTestMode()` redan använder för Test-läge):
  `drawChart()`s tangentlinje-block gated på `ENV_CONFIG.showMeasurementFacit` (inte bara
  kryssrutans `.checked`), och `btnFacit`-klickhanteraren har ett tidigt `return` om
  flaggan är false. Verifierat med Playwright att facitet varken ritas eller aktiveras i
  PROD ens när kryssrutan/knappen tvingas fram programmatiskt via konsolen, och att ingen
  URL-parameter eller hash har någon effekt.
- `tests/validate-prod.mjs` utökad: kontrollerar `showMeasurementFacit === false` i både
  källfilen `env.prod.js` och den byggda `dist/prod/env.js`, samt att
  `activity-prototype-core.js`/`activity-prototype.js` (GAM-002) aldrig kan hamna i
  `dist/prod` (regressionsskydd inför en framtida återmerge till `develop`).
- Ny `tests/hotfix-v1.4.1-facit-env.test.mjs`: 12 statiska regressionstester (källfiler,
  defense-in-depth-koden i `app.js`, döljbara krokar i `index.html`, byggda
  dist/dev-/dist/prod-artifakter).
- `APP_VERSION` → `1.4.1`. Ingen content-versionsändring.
- Inget annat i mätverktyget, simuleringskärnan eller GAM-002 rört. GAM-002 finns inte i
  denna branch (grenad från `main`, som aldrig haft GAM-002) — dess isolering (aldrig
  kopierad till `dist/prod`, injiceras bara i DEV) verifierades oförändrad.
**Status:** Publicerad. Mergad till `main` (taggad `v1.4.1`), live-verifierad på
https://peman68.github.io/PID-simulator/ (Playwright: appversion, lärstigsantal,
Mät K/T/L, marköravläsning, zoom, facit dolt och kan inte aktiveras vare sig via tvingad
DOM-manipulation eller URL/hash — 0 konsolfel, 0 nätverksfel), mergad tillbaka till
`develop`.

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
