# Changelog — PID Simulator

Alla nämnvärda ändringar i PID Simulator-webbappen dokumenteras här.

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
