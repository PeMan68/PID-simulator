# PED-001 — Nulägesanalys

**Uppdrag:** PED-001
**Utförd av:** Claude Code (CC), analysroll — inga produkt- eller pedagogiska beslut fattade
**Datum:** 2026-08-21
**Syfte:** Underlag för PO/projektledning att bygga en prioriterad backlog kopplad mot kursen
Industriell Mät- och Reglerteknik, vecka 35–40.

Denna rapport är ren analys och inventering. Ingen kod är skriven, inga befintliga filer
är ändrade.

---

## 1. Systemöversikt

### Applikationens huvuddelar

| Del | Roll |
|---|---|
| `apps/app/` | **Huvudapplikationen.** Produktionsversionen, hostas på GitHub Pages. Ren HTML/CSS/JS, inget byggsteg. |
| `apps/web/` | Experimentell serverapp (ES-moduler), byggd mot `packages/sim-core`. Var ursprungligen tänkt bli huvudappen (se `docs/architecture/web-rebuild-plan-v1.md`) men `apps/app/` blev i praktiken produktionsversionen istället. Underhålls inte aktivt. |
| `apps/web-standalone/` | Äldre standalone-prototyp, referens. |
| `packages/sim-core/` | Delad JS-simuleringskärna (process/regulator/simulation/metrics). Används av `apps/web/` — **inte** av `apps/app/`, som har sin egen inline-implementation. Två separata implementationer av samma simuleringslogik existerar alltså parallellt i repot idag. |

### Teknisk arkitektur

`apps/app/` är en statisk webbapp utan backend och utan byggverktyg (ingen bundler).

- **`index.html`** (646 rader) — DOM-struktur i tre paneler: vänster sidebar (scenario- och lärstigsväljare), mittsektion (parametergrupper, graf, simuleringskontroller), höger sidebar (hjälp/info-panel, öppnas via `?`-knappar per fält).
- **`app.js`** (975 rader) — all applikationslogik i en fil: klasserna `OnOffController`, `PIDController`, `ProcessModel`, `Simulation`, samt UI-bindningar, lärstigsmotor, mätläge (tangentmetoden/63 %-metoden) och checkpoint/quiz-hantering.
- **`content/`** — allt pedagogiskt innehåll som fristående JSON-filer, hämtas via `fetch()` vid uppstart. Innehåll kan redigeras utan att röra kod.

Kräver en enkel HTTP-server lokalt (`python -m http.server`) eftersom `fetch()` av JSON-filer inte fungerar via `file://`. Deploy sker via GitHub Actions (`.github/workflows/deploy-pid-simulator.yml`) till GitHub Pages — för närvarande konfigurerad att trigga på push till `develop` under pågående testperiod (byts till `main` inför release).

### Innehållsarkitektur

`content/catalog.json` är manifestet för allt innehåll — listar `scenarios`, `theory` och `learning_paths` med id och filsökväg. Vid uppstart (`loadCatalog()`, app.js) hämtas catalog.json och därefter samtliga scenario-, teori- och lärstigsfiler parallellt, plus `help.json`. Resultatet läggs i globala uppslagsobjekt `SCENARIOS`, `THEORY`, `LEARNING_PATHS`, `HELP_CONTENT`.

### Hur scenarier laddas

Ett scenario är en komplett JSON-konfiguration (process + regulator + störningar + runtime-inställningar). Väljs i vänster sidebar → "Ladda scenario" fyller i parameterfälten och återställer simuleringen.

### Hur lärstigar laddas

En lärstig är en sekvens av steg av typen `theory` eller `scenario`. Väljs i vänster sidebar i endera läget **Guidat** (fri navigering, ingen poängsättning) eller **Test** (nollställer och kräver rätt svar på checkpoints för att avancera). Ett scenario-steg kan ha en `checkpoint` (flervalsfråga) som i Test-läge låser "Nästa steg" tills rätt svar ges.

### Hur teoriinnehåll kopplas till lärstigar

Teori kopplas **enbart** via lärstigssteg av typen `theory` — `THEORY[step.ref]` slås upp direkt i lärstigsmotorn. Det finns **ingen** koppling mellan hjälppanelen (`?`-knapparna, `help.json`) och teorimodulerna — de är två helt separata innehållssystem. En teorimodul som inte refereras av något lärstigssteg blir därför aldrig synlig i appen (se avsnitt 4).

---

## 2. Pedagogiskt innehåll

### Lärstigar (6 st, samtliga registrerade i catalog.json och laddningsbara)

| ID | Titel | Nivå | Syfte |
|---|---|---|---|
| `kom-igång.v1` | Kom igång med PID Simulator | intro | Onboarding — visar appens tre paneler, hur scenarier/lärstigar laddas, simuleringsknappar och hjälpsystem. Inget reglertekniskt innehåll. |
| `grundlaggande.v1` | Grundläggande reglering | intro | Kärnprogression från on/off → P → PI → PID på samma/liknande process, med quiz-checkpoints. |
| `processbegransningar.v1` | Processens begränsningar | intro | Vad K, T, L betyder fysikaliskt; varför en regulator inte alltid kan nå SP (processens fysikaliska tak). |
| `windup.v1` | Integratoruppvridning & integrerande process | intermediate | Windup-fenomenet, anti-windup, samt integrerande processer (tanknivå) som separat men relaterat ämne. |
| `lambda-metoden.v1` | Lambda-metoden | intermediate | Modellbaserad PI-tuning: Kp = T/(K×(λ+L)), Ti = T. Jämför aggressivt/måttligt/konservativt λ. |
| `stegsvar-identifiering.v1` | Stegsvar och processidentifiering | intermediate | Experimentell identifiering av K, T, L via 63 %-metoden och tangentmetoden (Ziegler-Nichols). |

### Teorimoduler (7 st)

| ID | Titel | Syfte | Kopplad till lärstig? |
|---|---|---|---|
| `pid-intro` | Introduktion till reglering | PV/SP/u/e, P/I/D-delarnas roll | `grundlaggande.v1` |
| `process-basics` | Processparametrar: K, T och L | Fysikalisk betydelse av processparametrarna | `processbegransningar.v1` |
| `onoff-theory` | On/Off-reglering | Hysteres, oscillation, termostat-exempel | **Ingen** (se avsnitt 4) |
| `integrator-windup` | Integratoruppvridning (Windup) | Varför windup uppstår, anti-windup | `windup.v1` |
| `integrating-process` | Integrerande process | Skillnad mot självreglerande process | `windup.v1` |
| `lambda-metoden` | Lambda-metoden | Modellbaserad PI-tuning-formel | `lambda-metoden.v1` |
| `tangentmetoden` | Tangentmetoden — Ziegler-Nichols reaktionskurva | Grafisk identifiering av L och T | `stegsvar-identifiering.v1` |

### Scenarier (19 st)

| ID | Syfte |
|---|---|
| `basic-step-self-regulating` | Generellt basscenario för fri utforskning och onboarding |
| `p-step-self-regulating` | Visar stationärt fel med enbart P-reglering |
| `pi-step-self-regulating` | Visar eliminering av stationärt fel med I-delen |
| `pid-step-self-regulating` | Samma process som PI, med D-dämpning för direkt jämförelse |
| `onoff-basic` | Grundläggande on/off-oscillation kring SP |
| `onoff-hysteresis-basic` | On/Off med hysteres — nästan identiskt med ovanstående (se avsnitt 4) |
| `manual-open-loop` | Öppen slinga, fast utsignal, ingen reglering |
| `pid-disturbance-noise` | PID under kontinuerlig brusstörning (robusthet) |
| `pid-pulse-rejection` | PID som avvisar en pulsstörning |
| `pi-windup-demo` | Demonstrerar windup utan/med anti-windup |
| `integrating-pi` | Tanknivåsimulering, PI-reglering av integrerande process |
| `integrating-experimental` | Fri utforskning av integrerande process |
| `unstable-experimental` | Instabil process, för framtida bruk |
| `lambda-open-loop` | Processidentifiering inför Lambda-beräkning |
| `lambda-pi-moderate` | Lambda-tuning, λ = T |
| `lambda-pi-aggressive` | Lambda-tuning, λ = L (snabbast) |
| `lambda-pi-conservative` | Lambda-tuning, λ = 3T (mest robust) |
| `manual-identification` | Manuellt stegsvarsexperiment för K/T/L-identifiering (1:a ordningen) |
| `second-order-identification` | Stegsvarsexperiment för S-kurve-process (2:a ordningen) — se avsnitt 4 |

---

## 3. Täckningsanalys

Bedömning av vilka klassiska reglertekniska kursmoment som stöds idag.

| Kursområde | Status | Kommentar |
|---|---|---|
| On/Off-reglering | ✅ Stöds | Scenario + lärstigssteg finns, men egen teorimodul (`onoff-theory`) är inte kopplad in |
| P-reglering | ✅ Stöds | Egen lärstig + scenario, stationärt fel demonstreras tydligt |
| PI-reglering | ✅ Stöds | Flera scenarier och lärstigar |
| PID-reglering | ✅ Stöds | D-delens roll demonstreras med direkt jämförelse mot PI |
| Processidentifiering (63 %- och tangentmetoden) | ✅ Stöds | Fullständig lärstig, men bara för 1:a ordningens process |
| Processidentifiering, högre ordning (S-kurva) | ⚠️ Delvis | Scenario finns (`second-order-identification`) men är inte kopplat till någon lärstig |
| Lambda-metoden (modellbaserad tuning) | ✅ Stöds | Egen, komplett lärstig med tre λ-varianter |
| Integratoruppvridning (windup/anti-windup) | ✅ Stöds | Egen lärstig med tydlig jämförelse |
| Integrerande processer | ✅ Stöds (grundläggande) | Del av windup.v1; ingen fördjupad egen lärstig |
| Processens fysikaliska begränsningar (K×u_max-tak) | ✅ Stöds | Egen lärstig |
| Störningar — brus och puls (robusthet) | ⚠️ Delvis | Scenarier finns, ingen lärstig — källmaterial finns i `ovningar-signalstorningar.md`, ej migrerat |
| Systematisk PID-tuning / parameterjämförelse | ❌ Saknas | Inget scenario eller lärstig — källmaterial finns i `ovningar-systemoptimering.md`, ej migrerat |
| Instabila processer | ⚠️ Delvis | Scenario finns (`unstable-experimental`), men ingen teori eller lärstig |
| Verkningsriktning (direkt/omvänt, t.ex. kylprocess) | ❌ Saknas | Varken scenario eller regulatorfunktion finns — kräver ny kod (FEAT-022) |
| Frekvensanalys av störningar | ❌ Saknas | FEAT-009, låg prioritet i docs/tracking/todo.md |
| Adaptiv reglering | ❌ Saknas | FEAT-010, låg prioritet |
| Säkerhetsmarginaler (gain/phase margin) | ❌ Saknas | FEAT-011, låg prioritet — sannolikt utanför grundkursens scope |

---

## 4. Oanvänt innehåll

### Scenarier (7 av 19 används aldrig i någon lärstig)

| Scenario | Trolig anledning |
|---|---|
| `onoff-hysteresis-basic` | Nästan identiskt med `onoff-basic` — troligen ett duplikat |
| `manual-open-loop` | Fanns bara i den föräldralösa filen (se nedan) |
| `pid-disturbance-noise` | Ingen lärstig om störningar/robusthet byggd ännu |
| `pid-pulse-rejection` | Samma som ovan |
| `integrating-experimental` | Ser avsiktligt ut som ett fritt utforskningsscenario, inte ett guidat steg |
| `unstable-experimental` | Ingen lärstig om instabila processer finns — och ingen teorimodul om instabilitet finns heller |
| `second-order-identification` | Skapades i samband med FEAT-028 (flerkapacitiv process) men kopplades aldrig in i `stegsvar-identifiering.v1` |

### Teorimoduler (1 av 7 används aldrig)

- **`onoff-theory.v1.json`** — laddas i minnet vid uppstart men visas aldrig, eftersom inget lärstigssteg refererar den.

### Lärstigar

Samtliga 6 katalogiserade lärstigar används. Däremot finns en **föräldralös fil**:

- **`apps/app/content/exercises/basic-learning-path.v1.json`** — refereras inte i `catalog.json`, går alltså inte att ladda i appen. Innehållet (teori → öppen slinga → P → PI) motsvarar i praktiken en enklare, tidigare version av `grundlaggande.v1` (som även täcker on/off och PID, samt har checkpoints).

### Övrigt utkast/rester

- **`docs/exercises/ovningar-grundlaggande.md`, `ovningar-signalstorningar.md`, `ovningar-systemoptimering.md`, `teori-och-bakgrund.md`** — omfattande källmaterial (250–300+ rader vardera), ursprungligen skrivet för Python-appen. `ovningar-grundlaggande.md` är delvis omvandlat till `grundlaggande.v1`; störnings- och optimeringsdelarna är helt oanvända i webbappen.
- **`docs/architecture/web-rebuild-plan-v1.md`** och **`docs/agents/agent-backlog-v1.md`** — historiska planeringsdokument för den ursprungliga `apps/web/`-satsningen som aldrig blev huvudspåret. Rent historiskt värde idag.
- **Två poster i `docs/planning/WEB-IAKTTAGELSER.md` (2026-05-28) verkar redan vara åtgärdade i koden men har inte uppdaterad status:**
  - "Trigga puls påverkar inte PV" — matchar den stängda buggen 2026-004 (stängd 2026-06-01).
  - "processbegransningar.v1, steg 'Svag process' använder p-step-self-regulating.json" — filen använder redan `pi-step-self-regulating.json`, dvs. den föreslagna åtgärden verkar redan genomförd.
- **En post från 2026-05-27 om sidebar-layout** i `docs/planning/WEB-IAKTTAGELSER.md` beskriver en flytt av scenario/lärstig-väljare till en vänster sidebar — detta motsvarar den redan stängda FEAT-001. Posten är kvar med status "Noterad" trots att den är genomförd.

---

## 5. Öppna utvecklingsspår

Sammanställt från `docs/tracking/todo.md`, `docs/tracking/buglog.md` och `docs/planning/WEB-IAKTTAGELSER.md`.

### Öppna FEAT och BESLUT (docs/tracking/todo.md)

| ID | Titel | Prioritet |
|---|---|---|
| BESLUT-001 | Ta ställning till appens namn inför release | Låg |
| FEAT-022 | Verkningsriktning (direkt/omvänt verkande) | Medel |
| FEAT-005 | Stegning framåt/bakåt i historik med markör | Medel |
| FEAT-007 | Avancerade störningsmodeller | Medel |
| FEAT-009 | Frekvensanalys av störningar | Låg |
| FEAT-010 | Adaptiv reglering | Låg |
| FEAT-011 | Säkerhetsmarginaler (gain/phase margin) | Låg |

### Öppna buggar (docs/tracking/buglog.md)

| ID | Titel | Prioritet |
|---|---|---|
| 2026-011 | Sidopaneler kollapsas inte, tömmer bara innehållet | Medel |

### Noterade men ej promoverade idéer (docs/planning/WEB-IAKTTAGELSER.md)

- **Stegning framåt/bakåt med markör i statusraden** (2026-04-29) — samma idé som FEAT-005, redan i docs/tracking/todo.md.
- **Ny lärstig "Störningar och robusthet"** och **"Optimering"** (2026-05-27) — källmaterial identifierat (`ovningar-signalstorningar.md`, `ovningar-systemoptimering.md`), men inte byggda.
- **Quiz/task-stegarkitektur** (2026-05-27) — quiz-delen (`type: quiz`, flervalsfrågor som blockerar progression) är byggd. `type: task` (automatisk kontroll mot simulator-state, t.ex. "kör tills y > 80 inom 30 steg") är fortfarande bara en idé.
- **Gamifieringselement** (låsta lärstigar, stjärnbetyg) — nämnda som möjlighet, inte byggda.

### Nya fynd från denna analys (ej tidigare dokumenterade)

- `onoff-basic` / `onoff-hysteresis-basic` — sannolikt duplikat, ingen skiljer dem åt pedagogiskt idag.
- `second-order-identification` — färdigt scenario, saknar koppling till lärstig.
- `onoff-theory.v1.json` — färdig teorimodul, saknar koppling till lärstig.
- Föräldralös fil `basic-learning-path.v1.json`.
- Två inaktuella statusar i `docs/planning/WEB-IAKTTAGELSER.md` (se avsnitt 4).
- Två parallella simuleringskärnor (`app.js` inline vs `packages/sim-core`) — relevant om `apps/web/` ska fortsätta underhållas eller inte (arkitekturfråga öppen sedan 2026-05-13).

---

## 6. Rekommendationer

*Rekommendationer, inga beslut — prioritering och urval görs av PO/projektledning.*

### Snabba vinster (< 1 dag styck)

- Koppla in `second-order-identification` som nya steg i `stegsvar-identifiering.v1` (jämför 1:a och 2:a ordningens tangentpunkt) — innehållet finns redan, bara nya steg krävs.
- Lägg till ett teori-steg i `grundlaggande.v1` som refererar `onoff-theory.v1.json` innan on/off-scenariosteget.
- Städa `docs/planning/WEB-IAKTTAGELSER.md`: markera de redan åtgärdade posterna (puls, "Svag process", sidebar-layout) som klara.
- Ta ställning till den föräldralösa `basic-learning-path.v1.json` — radera eller koppla in.
- Ta ställning till dubbleringen `onoff-basic` / `onoff-hysteresis-basic`.

### Medelstora förbättringar (dagar)

- Bygg lärstigen "Störningar och robusthet" — scenarier (`pid-disturbance-noise`, `pid-pulse-rejection`) och källmaterial (`ovningar-signalstorningar.md`) finns redan; arbetet är strukturering + checkpoints.
- Åtgärda bugg 2026-011 (sidopaneler kollapsar inte) — påverkar tillgänglig grafyta, särskilt relevant vid klassrumsbruk på mindre skärmar.
- Bygg `type: task`-stegtypen (auto-kontroll av simulator-state) — arkitekturen är redan skissad, `quiz`-typen kan användas som mall.

### Större utvecklingsområden (veckor)

- Lärstigen "Optimering/PID-tuning" (`ovningar-systemoptimering.md`) — kräver sannolikt nya scenarier för systematisk parameterjämförelse, inte bara nya lärstigssteg.
- FEAT-022 Verkningsriktning — ny regulatorfunktion plus nytt scenario (t.ex. kylprocess) — relevant om kursen berör kylprocesser eller omvänt verkande system.
- Lärstig om instabila processer — kräver en helt ny teorimodul (finns inte alls idag), `unstable-experimental`-scenariot räcker inte ensamt.
- Arkitekturbeslut: konsolidera eller avveckla en av de två parallella simuleringskärnorna (`app.js` vs `packages/sim-core`), i linje med samma typ av städning som redan gjorts för Python-appen (BESLUT-002).

---

## Statushantering

**Uppskattat pedagogiskt mognadsläge: 3 av 5**
Kärnan i klassisk PID-pedagogik (P/PI/PID, on/off, windup, Lambda-tuning, processidentifiering, fysikaliska begränsningar) är väl täckt med fungerande, testade lärstigar och quiz-checkpoints. Det som drar ner bedömningen: störningar/robusthet och systematisk tuning/optimering finns bara som källmaterial, inte som interaktiva lärstigar; ingen uttalad koppling till kursens veckostruktur ännu; task-baserat examinationslager är skissat men inte byggt.

**Uppskattat tekniskt mognadsläge: 4 av 5**
Stabil, fungerande enfilsapp utan byggberoenden, tydlig separation mellan kod och redigerbart innehåll, fungerande CI-deploy, disciplinerad bugg-/featurespårning. Det som drar ner bedömningen: två parallella och osynkade simuleringskärnor om `apps/web/` ska leva vidare, en olöst UI-bugg (2026-011), samt ett antal innehållsfiler som är byggda men aldrig kopplades in (se avsnitt 4).

**De tre viktigaste utvecklingsspåren kommande termin, enligt denna analys:**

1. **Mappa befintligt lärstigsutbud mot kursens veckor 35–40.** Sannolikt mest ett struktureringsarbete — kom-igång → grundläggande → processbegränsningar → identifiering → lambda-metoden → windup täcker redan ett brett spann, kompletterat med de identifierade snabba vinsterna.
2. **Bygg lärstigen "Störningar och robusthet."** Högst avkastning per arbetsinsats — både scenarier och källmaterial finns redan, det som saknas är strukturering.
3. **Lös arkitekturfrågan `apps/web` / `packages/sim-core`.** Öppen sedan 2026-05-13. Påverkar var framtida utveckling (t.ex. PID-tuning-lärstigen, verkningsriktning) bör byggas — i `app.js` eller i den delade kärnan.
