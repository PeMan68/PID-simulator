# PID Simulator

Ett pedagogiskt webbverktyg för att demonstrera och öva PID-reglering. Simulatorn är avsedd
som komplement till fysiska laborationer inom reglerteknik — den gör det möjligt att köra
fler och snabbare experiment än vad en fysisk labbmiljö medger, och att visa
reglertekniska fenomen som annars är svåra att demonstrera.

Simulatorn stödjer lärarledda demonstrationer, självstudier genom lärstigar, och
fördjupning i regulatorns beteende och PID-tuning. Fokus ligger på reglerloopen —
process → mätdon → regulator → styrdon → process — och regulatorns dynamik. Simulatorn
täcker inte kursens övriga innehåll om fysiska mätdon och styrdon.

## Officiell version

- **Stabil version:** v1.3.0 (källkoden är taggad `v1.3.0`)
- **Officiell URL:** https://peman68.github.io/PID-simulator/

Använd den officiella URL:en för undervisning och självstudier. `main`-branchen är källan
för den stabila undervisningsversionen, och GitHub Pages bygger och publicerar
produktionsprofilen (PROD) uteslutande därifrån.

## Funktioner i v1.3.0

Publicerat i produktionsversionen:

- Guidat läge genom lärstigarna, med kontrollfrågor som reflektionsstöd
- Presentationsläge ("Presentera steg") för visning på projektor — visar aldrig svaren på
  kontrollfrågor
- "Mät K/T/L" — avläsning av processparametrar direkt i grafen
- Scenariobaserad simulering med regulatorlägena Manuell, On/Off, P, PI och PID
- Fritt justerbara process- och regulatorparametrar
- Hjälptexter för samtliga parametrar och regulatorlägen
- Statusrad med SP, PV, e (reglerfel) och u (utsignal), samt regulatorns P-, I- och
  D-bidrag var för sig

Fem publicerade lärstigar, i denna ordning:

1. Kom igång med PID Simulator
2. Öppen slinga, On/Off och P-reglering
3. Proportionalband och regulatorförstärkning
4. PI- och PID-reglering
5. Processens begränsningar

Produktionsversionen innehåller **inte** Test-läge, poängräkning, spelifiering eller
experimentella scenarier — se nästa avsnitt.

## DEV och PROD

Samma källkod och samma repository används för både utvecklings- och
produktionsversionen. Skillnaden styrs av en miljöprofil, funktionsflaggor och en
uttrycklig produktionsallowlist — inte av separata kodgrenar med olika innehåll.

| | PROD (publicerad, `main`) | DEV (`develop`, feature branches) |
|---|---|---|
| Byggs från | `main` | lokalt, från `apps/app/` |
| Lärstigar | 5 (produktionsgodkända) | 9 (samtliga aktiva) |
| Test-läge | Dolt, kan inte aktiveras | Synligt och fungerande |
| Poängräkning | Dold | Synlig i Test-läge |
| Miljömärkning | Ingen | Röd "DEV"-etikett i sidopanelen |
| Publiceras på | https://peman68.github.io/PID-simulator/ | endast lokalt |

`main` kan innehålla tekniskt stabil kod för funktioner och lärstigar som ännu inte är
produktionsgodkända — den koden är inte borttagen, bara avstängd och osynlig i PROD. Nytt
innehåll i DEV visas aldrig automatiskt i PROD; det kräver ett uttryckligt tillägg till
produktionsallowlistet. Fullständig teknisk beskrivning: [`docs/development/ENVIRONMENTS.md`](docs/development/ENVIRONMENTS.md).

## Lokal körning

Kräver [Node.js](https://nodejs.org/) och en lokal HTTP-server (exemplen nedan använder
Python; appen kräver `fetch()` mot en server, dubbelklick på `index.html` fungerar inte).

**DEV-förhandsvisning** (samtliga 9 lärstigar, Test-läge, poäng):

```bash
node tests/build-preview.mjs dev
python -m http.server 8000 --directory dist/dev
```

Öppna http://localhost:8000/

**PROD-förhandsvisning** (samma innehåll som den officiella URL:en):

```bash
node tests/build-preview.mjs prod
python -m http.server 8001 --directory dist/prod
```

Öppna http://localhost:8001/

## Tester och validering

```bash
node tests/validate-content.mjs                    # DEV-innehåll: referenser, antal lärstigar/scenarier/teori
node tests/validate-content.mjs catalog.prod.json   # PROD-innehåll: samma kontroll mot produktionskatalogen
node tests/validate-prod.mjs                        # PROD-allowlist: rätt lärstigar, rätt ordning, inget läcker in
node tests/simulation/analyze.test.mjs              # Simuleringskärnans egna regressionstester
node tests/build-preview.mjs dev                    # DEV-byggning (rök-test)
node tests/build-preview.mjs prod                   # PROD-byggning (rök-test)
```

Se [`tests/simulation/README.md`](tests/simulation/README.md) för det återanvändbara
simulerings- och analysverktyget som används för att verifiera pedagogiska scenarier.

## Gitflow

```
feature/<uppdrags-id>-<namn>  →  develop
release/<version>              →  main  →  tillbaka till develop
hotfix/<version>-<namn>        →  main  →  tillbaka till develop
```

En release tar med hela `develop` — ingen cherry-pick och ingen selektiv borttagning
används för att skapa PROD. Vad som faktiskt syns i produktionsversionen avgörs av
produktionsallowlistet (`content/catalog.prod.json`), inte av vad som finns i koden. Nytt
innehåll som mergas till `develop` kräver ett uttryckligt, eget tillägg till allowlistet
innan det visas i PROD.

> Merge till `develop` betyder tekniskt klar. Aktivering i PROD betyder
> produktionsgodkänd. Publicering från `main` betyder releasad.

## Projektstatus

v1.3.0 är den första stabila undervisningsversionen. Fortsatt utveckling sker i
`develop`. Fyra ytterligare lärstigar (Windup och anti-windup, Integrerande process och
nivåreglering, Stegsvar och processidentifiering, Lambda-metoden) finns i
utvecklingsversionen och väntar på pedagogisk granskning innan produktionsgodkännande.
Test-läge med poängräkning är tekniskt klart men ingår inte i PROD v1.3.0. Spelifiering
(nivåer, progression, belöningar) är ett möjligt framtida utvecklingsspår, inte en
fastställd leverans. Se [`CHANGELOG.md`](CHANGELOG.md) för fullständig releasehistorik.

## Licens

Projektet har för närvarande ingen licensfil. Licensfrågan är en öppen punkt för
produktägaren — se `docs/tracking/todo.md`.

## Mer dokumentation

- [`CHANGELOG.md`](CHANGELOG.md) — releasehistorik
- [`docs/development/ENVIRONMENTS.md`](docs/development/ENVIRONMENTS.md) — DEV/PROD-profiler,
  produktionsgodkännande, hela livscykeln från idé till publicerad funktion
- [`tests/simulation/README.md`](tests/simulation/README.md) — simulerings- och
  analysverktyget
