# Changelog — PID Simulator

Alla nämnvärda ändringar i PID Simulator-webbappen dokumenteras här.

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
