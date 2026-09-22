# Changelog — PID Simulator

Alla nämnvärda ändringar i PID Simulator-webbappen dokumenteras här.

## [v1.6.0] — 2026-09-22

### Nytt i denna release

Samlad release av allt utvecklingsarbete sedan v1.5.5 — UX-huvudspåret
(progressiv exponering) plus två nya reglerstrategier:

- **Tillämpning och Processmodell** (UX-002). En ny väljare, "Tillämpning"
  (Temperaturprocess/Nivåprocess/Avancerat), styr vilka processmodeller,
  regulatorlägen och strategitillägg som visas — utan att någonsin dölja
  själva Processmodell-begreppet. "Avancerat" fungerar som ett fullt,
  ofiltrerat expertläge.
- **Parameterstyrning och olinjär ventilkarakteristik** (FEAT-042). Ny
  lärstig: Kp/Ti/Td kan väljas automatiskt utifrån PV i tre zoner
  (Parameterstyrning), och processens egen förstärkning K kan variera med
  utsignalen i tre zoner (olinjär ventilkarakteristik) — med tydlig
  visuell zon-highlight i både fält och graf.
- **Framkoppling (Feedforward)** (FEAT-045). Ny lärstig: en mätbar last
  kompenseras direkt via Kff, innan felet ens uppstår — jämfört med ren
  återkoppling.
- **Knapp för fler steg vid maxSteps-taket** (FEAT-043).
- **Omstrukturerad huvudyta och progressiv exponering** (UX-004). De
  tidigare fyra parametergrupperna (Process/Regulator/Styrning/Störningar)
  är ersatta av tre: Processinställning, Regulatorkonfiguration,
  Processpåverkan. Avancerade fält (Parameterstyrning, Kff, olinjär
  ventilkarakteristik, Bumpless, Anti-windup m.fl.) ligger nu bakom en
  "Avancerat"-disklosyr per grupp, som öppnas automatiskt när en lärstig
  eller ett scenario faktiskt handlar om dem. Senast valda Tillämpning
  sparas mellan sidladdningar.

### Produktionsurval i v1.6.0

Nio lärstigar publicerade, i denna ordning:

1. Kom igång med PID Simulator
2. Öppen slinga, On/Off och P-reglering
3. Proportionalband och regulatorförstärkning
4. PI- och PID-reglering
5. Processens begränsningar
6. Windup och anti-windup
7. Störningar och robusthet
8. Parameterstyrning och olinjär ventilkarakteristik
9. Framkoppling (Feedforward)

### Kända förhållanden

- Test-läge (kontrollfrågor med poängräkning) ingår fortfarande inte i den
  publicerade undervisningsversionen.
- Tre lärstigar (Integrerande process och nivåreglering, Stegsvar och
  processidentifiering, Lambda-metoden) ligger kvar i utvecklingsversionen
  för fortsatt pedagogisk granskning innan de publiceras.
- Zonparametrarnas fält i Parameterstyrning flyter visuellt ihop när flera
  parametergrupper visas samtidigt — registrerad UX-finputsning, se
  `docs/planning/WEB-IAKTTAGELSER.md`.

### Version

`APP_VERSION` = 1.6.0.

## [v1.5.5] — 2026-09-16

### Nytt

- **Introduktionsdokument för studerande** (FEAT-039). Kort, fristående text
  (`docs/exercises/introduktion.md`) som beskriver vad appen kan och pekar till den
  inbyggda "Kom igång"-lärstigen samt en översikt över samtliga publicerade lärstigar.
- **Permanent "❓ Kom igång"-knapp** i vänster sidebar öppnar välkomstrutan när som
  helst, inte bara vid första besöket som tidigare. Knappen döljs automatiskt från
  nivå 3 (Signalspanare) och uppåt i nivåprogressionen, eftersom introduktionen då
  inte längre behöver vara framträdande.

### Rättat

- Välkomstrutans "Utforska fritt"-knapp togs bort — den gav inget synligt resultat vid
  klick.

## [v1.5.4] — 2026-09-15

### Rättat (HOTFIX-2026-014)

- **"Återställ system" kunde lämna en osynlig, permanent styrsignal-offset kvar**
  efter ett lägesbyte med "Bumpless" aktiverat, om återställningen klickades innan den
  5 steg långa mjuka övergången hunnit köra klart. Effekten: en P-regulator kunde få
  I-liknande nollfels-beteende (t.ex. på en integrerande process, styra hela vägen till
  börvärdet istället för att stanna vid sitt korrekta kvarstående fel) utan att något i
  statusraden visade varför — utsignalen (u) matchade inte längre P+I+D-summan.
  `Simulation.reset()` nollställer nu båda speglade kopiorna av bias-tillståndet, inte
  bara den ena. Regressionstest tillagt (`tests/hotfix-2026-014-bumpless-reset.test.mjs`).

## [v1.5.3] — 2026-09-15

### Rättat

- **Versionsvisningen i appens sidfot visade "v1.5.1" trots att v1.5.2 var publicerad**
  (bugg 2026-015). `APP_VERSION`-konstanten glömdes bort i föregående releaseprocess.

### Nytt (dokumentation)

- **Nytt övningsdokument: Reglerstrategier** (FEAT-037). Ett fristående lösblad
  (`docs/exercises/ovningar-reglerstrategier.md`, samma mönster som befintliga
  `ovningar-systemoptimering.md`) med sju uppgifter om att *välja och motivera en
  reglerstrategi* — regulatortyp, aggressivitet, dötid, integrerande process, windup och
  prioritering mellan börvärdesföljning/störningsavvisning — istället för att bara
  mekaniskt trimma parametrar. Facit (`docs/exercises/facit-reglerstrategier.md`) är
  verifierat mot appens egen simuleringskod. Ingår inte i den byggda webbappen (det är
  ett lösblad, inte en lärstig) utan distribueras separat till studerande.

## [v1.5.2] — 2026-09-14

### Nytt

- **Fler hjälplinjer i Mätläge** (FEAT-038). Utöver den befintliga 63%-linjen kan du
  nu även visa 10%/90%-linjer (för att mäta stigtid) och ett 2%-toleransband (för att
  avgöra insvängningstid) — samma togglingsbara kryssrutor som 63%-linjen.

### Ändrat

- **Hjälplinjerna i Mätläge är nu tunnare och lätt transparenta** (63%-linjen,
  tangentlinjen och de nya 10%/90%/2%-linjerna), så de tydligare skiljer sig från
  PV-, SP- och u-kurvorna istället för att konkurrera visuellt med dem.

## [v1.5.1] — 2026-09-10

### Ändrat

- **Nivåmärkets utseende** (FEAT-035). Badgen i nivåpanelen är omdesignad som en
  medaljong: nivåsiffran är nu en riktig del av grafiken, centrerad i sexkanten
  (tidigare låg den i ett separat element som inte alltid hamnade rätt), sexkanten
  fylls med en gradient i nivåns egen färg med en tunn innerfälg, och högsta nivån
  (Reglerlegend) får en mjuk glöd. Ingen förändring av XP-regler, nivågränser eller
  hur progression sparas — se `docs/development/GAMIFICATION-XP-PROTOTYPE.md`.

## [v1.5.0] — 2026-09-10

### Nytt i denna release

- **Nivåprogression aktiverad i produktion.** En kompakt nivåyta i vänstra
  sidopanelen (badge, nivånummer, nivånamn och en grafisk mätare — inga
  synliga XP-tal) visar aktivitet och progression medan du använder
  simulatorn. Nivån är **inte ett betyg och inte ett mått på
  yrkeskompetens** — bara ett sätt att synliggöra eget arbete och
  repetition. Klicka på nivåytan för en kort förklaring och möjligheten
  att återställa progressionen. Progression sparas lokalt i webbläsaren,
  per enhet.
- Ny publicerad lärstig: **Störningar och robusthet** — sjunde lärstigen,
  om mätbrus, pulsstörningar och hur P-, I- och D-delen påverkas olika av
  dem.

### Om nivåprogressionen

Funktionen bygger på samma tekniska grund som redan fanns i
utvecklingsversionen och är produktionsaktiverad i sitt testade skick.
Den mäter aktivitet (genomförda försök, egna parameterförsök,
jämförelser, hjälpanvändning, lästid) — inte rätt/fel-svar eller
kunskapsnivå. Progressionen är knuten till webbläsaren/enheten du
använder, inte ett konto. Se
`docs/development/GAMIFICATION-XP-PROTOTYPE.md` för den tekniska
beskrivningen.

### Produktionsurval i v1.5.0

Sju lärstigar är publicerade i undervisningsversionen, i denna ordning:

1. Kom igång med PID Simulator
2. Öppen slinga, On/Off och P-reglering
3. Proportionalband och regulatorförstärkning
4. PI- och PID-reglering
5. Processens begränsningar
6. Windup och anti-windup
7. Störningar och robusthet

### Kända förhållanden

- Test-läge (kontrollfrågor med poängräkning) ingår fortfarande inte i den
  publicerade undervisningsversionen.
- Tre lärstigar (Integrerande process och nivåreglering, Stegsvar och
  processidentifiering, Lambda-metoden) ligger kvar i utvecklingsversionen
  för fortsatt pedagogisk granskning innan de publiceras.
- Nivåprogressionen sparas per webbläsare/enhet — på en delad dator ser
  nästa användare föregående persons nivå.

### Version

`APP_VERSION` = 1.5.0. Ändrade filer: `apps/app/app.js`,
`apps/app/activity-prototype.js`, `apps/app/gamification.js`,
`apps/app/env.prod.js`, `apps/app/content/catalog.prod.json`.

## [v1.4.1] — 2026-09-08

### Rättat (HOTFIX-v1.4.1)

- Tangentlinjens facit har tillfälligt tagits bort från PROD eftersom funktionen behöver
  fortsatt utredning. Gäller både "Visa tangentlinje"-kryssrutan (den geometriska
  konstruktionen som beräknar och visar L/T) och "Visa facit"-knappen (tabellen med
  scenariots faktiska K/T/L-värden) i mätpanelen.
- Grafens marköravläsning, Mät K/T/L, 63%-linjen och zoomning finns kvar och fungerar
  oförändrat i PROD.
- DEV behåller tangentfacitet oförändrat för fortsatt teknisk och pedagogisk utredning.
- Ny miljöflagga `ENV_CONFIG.showMeasurementFacit` styr detta (`true` i DEV, `false` i
  PROD) — se `docs/development/ENVIRONMENTS.md`. Ingen URL-parameter, hash eller
  tangentkommando kan aktivera facitet i PROD.

### Version

`APP_VERSION` = 1.4.1. Ingen content-versionsändring (endast `apps/app/app.js`,
`apps/app/env.js`, `apps/app/env.prod.js` och `apps/app/index.html` ändrade).

## [v1.4.0] — 2026-08-24

### Nytt i denna release

- Ny publicerad lärstig: **Windup och anti-windup** — sjätte lärstigen i undervisnings-
  versionen, placerad efter Processens begränsningar. Visar hur en PI/PID-regulators
  integratordel kan "ladda upp" (windup) vid långvarig utsignalsmättning, och hur
  anti-windup förhindrar det.
- Reviderad publik dokumentation: nytt `README.md` med korrekt beskrivning av DEV/PROD-
  profilerna, aktuellt produktionsurval, verifierade lokala kommandon och Gitflow.
  `apps/app/README.md` rättat (beskrev tidigare en övergiven, offline-baserad arkitektur).

### Produktionsurval i v1.4.0

Sex lärstigar är publicerade i undervisningsversionen, i denna ordning:

1. Kom igång med PID Simulator
2. Öppen slinga, On/Off och P-reglering
3. Proportionalband och regulatorförstärkning
4. PI- och PID-reglering
5. Processens begränsningar
6. Windup och anti-windup

### Kända förhållanden

- Test-läge (kontrollfrågor med poängräkning) ingår fortfarande inte i den publicerade
  undervisningsversionen.
- Tre lärstigar (Integrerande process och nivåreglering, Stegsvar och
  processidentifiering, Lambda-metoden) ligger kvar i utvecklingsversionen för fortsatt
  pedagogisk granskning innan de publiceras.
- Under aktiva transienter kan det visade felet (e) och det visade processvärdet (PV) avse
  närliggande men olika beräkningsögonblick, till följd av appens mät → beräkna → agera-
  ordning. Detta påverkar inte avläsningar vid steady state.

### Version

- Appversion: **v1.4.0**.
- Content-version oförändrad (`v1.5.3` DEV, `v1.5.3-prod` PROD) — de tillkommande
  filerna (lärstig, teori, scenario för windup/anti-windup) fanns redan sedan tidigare
  och har inte ändrats i sig, bara lagts till i produktionskatalogens allowlist.

## [v1.3.1] — 2026-08-24

Hotfix. PROD-artifakten innehåller nu endast produktionsgodkända lärstigar,
teorimoduler och scenarier. DEV-innehåll och checkpoint-facit för lärstigar som
inte ännu är produktionsgodkända publiceras inte längre. Inga användarfunktioner
eller produktionsmenyer har ändrats.

### Version

- Appversion: **v1.3.1**.
- Content-version oförändrad (`v1.5.3` DEV, `v1.5.3-prod` PROD) — inget
  lärstigs-, scenario- eller teoriinnehåll ändrades, bara vilka filer som
  byggs in i den publicerade artifakten.

## [v1.3.0] — 2026-08-24

Första stabila undervisningsversionen.

### Nytt i denna release

- Lärstigar omstrukturerade och ordnade efter kursens pedagogiska progression.
- Lärstigen om öppen slinga, On/Off och P-reglering samt lärstigen om PI-/PID-reglering
  delade upp i tydligare, fokuserade steg — liksom lärstigarna om windup/anti-windup och
  integrerande process/nivåreglering.
- Ny lärstig om proportionalband och regulatorförstärkning.
- Förbättrade, parameterstudieverifierade jämförelser mellan P-, PI- och PID-reglering.
- Förbättrad demonstration av dötid och processens begränsningar, med tydligare
  försök 1/försök 2-jämförelser.
- Presentationsläge ("Presentera steg") för visning på projektor — visar aldrig svaren på
  kontrollfrågor.
- Genomgående, enhetlig användning av PV (processvärde) i teoritexter, instruktioner och
  statusraden — istället för den tidigare interna beteckningen y.
- Statusraden visar SP, PV, e, u samt P-, I- och D-bidragen, med en decimals precision.
- Nytt, återanvändbart simulerings- och analysverktyg (`tests/simulation/`) som delar exakt
  samma simuleringskod som appen — använt för att verifiera samtliga jämförelsescenarier.
- Separata DEV- och PROD-profiler: samma kodbas, men vad som visas styrs av konfiguration
  och ett uttryckligt produktionsurval (allowlist) — inga permanenta kodskillnader mellan
  utvecklings- och undervisningsversionen.

### Produktionsurval i v1.3.0

Fem lärstigar är publicerade i undervisningsversionen, i denna ordning:

1. Kom igång med PID Simulator
2. Öppen slinga, On/Off och P-reglering
3. Proportionalband och regulatorförstärkning
4. PI- och PID-reglering
5. Processens begränsningar

### Kända förhållanden

- Test-läge (kontrollfrågor med poängräkning) ingår inte i den publicerade
  undervisningsversionen v1.3.0. Koden finns kvar och fortsätter utvecklas i bakgrunden.
- Fyra lärstigar (Windup och anti-windup, Integrerande process och nivåreglering, Stegsvar
  och processidentifiering, Lambda-metoden) ligger kvar i utvecklingsversionen för fortsatt
  pedagogisk granskning innan de publiceras.
- Under aktiva transienter kan det visade felet (e) och det visade processvärdet (PV) avse
  närliggande men olika beräkningsögonblick, till följd av appens mät → beräkna → agera-
  ordning. Detta påverkar inte avläsningar vid steady state.

### Version

- Appversion: **v1.3.0** (`APP_VERSION` i `apps/app/app.js`, visas i sidopanelen).
- Content-version (cache-busting av lärstigar/scenarier/teori, oberoende av appversionen):
  `v1.5.3` i DEV-katalogen (`content/catalog.json`), `v1.5.3-prod` i produktionskatalogen
  (`content/catalog.prod.json`). Oförändrad i denna release eftersom inget innehåll
  ändrades — bara version, dokumentation och release-infrastruktur.
