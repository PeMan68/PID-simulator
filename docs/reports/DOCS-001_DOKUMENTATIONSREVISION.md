# DOCS-001 — Dokumentationsrevision efter RELEASE-v1.3.0

**Utförd av:** Claude Code (CC)
**Datum:** 2026-08-24
**Uppdrag:** Revidera repositoryts publika dokumentation så att den beskriver den faktiska
publicerade versionen v1.3.0. Ren dokumentationsrevision — ingen appkod, produktionskatalog,
miljökonfiguration eller releaseversion ändrad.

---

## Sammanfattning

README.md var kraftigt föråldrat (beskrev varken DEV/PROD-profilerna, det publicerade
produktionsurvalet, faktiska testkommandon eller korrekt Gitflow) och har skrivits om i sin
helhet. `apps/app/README.md` beskrev en helt annan, sedan länge övergiven arkitektur
("helt offline", "ingen fetch") som direkt motsäger hur appen faktiskt fungerar — rättad.
`CHANGELOG.md` och `docs/development/ENVIRONMENTS.md` klarade granskningen utan sakfel och
har bara kompletterats (licensstatus, repositoryts synlighet). Inga hemligheter, tokens
eller tredjepartspersonuppgifter hittades. **Ett viktigt, ej åtgärdat fynd:** PROD-artifakten
(`dist/prod/`) innehåller fysiskt samtliga DEV-innehållsfiler (inklusive de fyra dolda
lärstigarnas checkpoint-svar) eftersom byggskriptet kopierar hela `apps/app/` — filerna
visas aldrig i UI eller hämtas av den körande appen, men är direkt nåbara för den som
känner till eller gissar URL:en. Detta är ett bygg-/produktfel, inte ett
dokumentationsfel, och har därför **inte** åtgärdats inom DOCS-001 (se avsnitt "Viktigt
fynd — ej åtgärdat" nedan och stoppvillkorsredovisningen i leveransrapporten).

---

## Granskade dokument

README.md, CHANGELOG.md, docs/development/ENVIRONMENTS.md, tests/simulation/README.md,
apps/app/README.md, apps/app/content/exercises/README.md, apps/app/content/theory/README.md,
CLAUDE.md, .github/copilot-instructions.md, .github/workflows/*.yml,
docs/tracking/todo.md, docs/handoffs/HANDOFF_2026-08-23.md, samtliga filer i docs/reports/,
docs/planning/ och docs/architecture/ (översiktligt, för motsägelser mot aktuell kodbas),
hela det versionshanterade filträdet (säkerhets-/integritetskontroll).

## Ändrade dokument

- `README.md` — omskriven i sin helhet enligt uppdragets 10-punktsstruktur.
- `apps/app/README.md` — omskriven (felaktig "offline/ingen fetch"-beskrivning rättad).
- `docs/development/ENVIRONMENTS.md` — kompletterad med avsnitt om repositoryts synlighet.
- `docs/tracking/todo.md` — ny BESLUT-003 (licensfråga, öppen punkt för PO).

## Ej ändrade (granskade, inga fel funna)

- `CHANGELOG.md` — klarade samtliga DEL 4-kriterier utan ändring.
- `tests/simulation/README.md` — verifierad korrekt mot faktisk kod, ingen ändring behövd.
- `apps/app/content/exercises/README.md`, `apps/app/content/theory/README.md` — innehåller
  kosmetiska teckenkodningsfel (saknade å/ä/ö, t.ex. "ovningar" istället för "övningar")
  men inga sakfel och ingen felaktig instruktion om att köra appen. Låg prioritet, ej
  åtgärdat inom DOCS-001 (ligger utanför uppdragets explicita ändringslista).
- `CLAUDE.md`, `.github/copilot-instructions.md` — inte publik användardokumentation
  (styr AI-assistenters arbetssätt i repot) och stod inte på uppdragets ändringslista.
  `copilot-instructions.md` innehåller dock föråldrat material (refererar ett separat
  externt spelrepo och en "känd bugg" i integrerande processer som inte längre existerar
  — integrerande processer är fullt testade och fungerande sedan PED-003B) — flaggas som
  kvarstående fråga, se sista avsnittet.

## Skapade dokument

- `docs/reports/DOCS-001_DOKUMENTATIONSREVISION.md` (denna fil).

---

## Viktig föråldrad information som rättades

| Fil | Föråldrat/fel | Rättat till |
|---|---|---|
| `README.md` | Beskrev bara `apps/app/` generellt, ingen version, inget DEV/PROD, `python -m http.server 8080` utan kontext, "merga till main → deployas automatiskt" (stämde inte med path-filter som fanns då) | Fullständig omskrivning: v1.3.0, officiell URL, DEV/PROD-tabell, faktiska build-preview-kommandon, testkommandon, Gitflow med produktionsgodkännande-regeln |
| `README.md` | "Branches som inte triggar deployment: develop, feature-branches" (delvis, saknade `release/**`) och path-filter-referens (`paths: apps/app/**`) som togs bort i RELEASE-v1.3.0 | Ny text beskriver att Pages triggas uteslutande av push till `main`, utan referens till en path-filtrering som inte längre finns |
| `apps/app/README.md` | "helt offline-fungerande", "Öppna index.html direkt … dubbelklick", "Ingen fetch", "All data är inbyggd i app.js" — beskriver en arkitektur från före content-katalogen infördes, rakt motsatt hur appen faktiskt fungerar | Korrekt beskrivning: kräver HTTP-server, laddar innehåll via `fetch()` från `content/`, länk till huvud-README och ENVIRONMENTS.md |
| README/ENVIRONMENTS (generellt) | Ingen dokumentation nämnde att produktionsurvalet faktiskt var beslutat (senast dokumenterat läge var "Ej beslutat" i PROD-001A) | README beskriver nu de fem publicerade lärstigarna med korrekta titlar och ordning som fastställt faktum |

---

## Verifierad produktbeskrivning

Projektbeskrivningen i README (pedagogiskt syfte, komplement till fysisk labb, fokus på
reglerloopen, inte en ersättning för mätdon/styrdon-innehållet) är formulerad utifrån
projektets dokumenterade produktvision (`docs/handoffs/HANDOFF_2026-08-23.md`, avsnitt 2)
och kodbasens faktiska omfattning — inga funktioner påstås som inte finns.

## Verifierad PROD-funktionslista

Guidat läge, presentationsläge, Mät K/T/L, scenariobaserad simulering (Manuell/On-Off/P/
PI/PID), parameterreglage, hjälptexter, statusrad (SP/PV/e/u + P/I/D) — samtliga
Playwright-verifierade live på https://peman68.github.io/PID-simulator/ och i lokal
PROD-preview. Test-läge, poäng, spelifiering, nio lärstigar och experimentella scenarier
bekräftat **frånvarande** i PROD.

## Verifierad DEV-funktionslista

Samma kärnfunktioner plus: Test-läge (synligt, aktiverbart, fullt fungerande), poängräkning
(synlig i Test-läge), DEV-märkning (röd badge), samtliga 24 scenarier i väljaren, samtliga
9 lärstigar i menyn.

## Verifierade PROD-lärstigar (5, exakt ordning)

1. Kom igång med PID Simulator
2. Öppen slinga, On/Off och P-reglering
3. Proportionalband och regulatorförstärkning
4. PI- och PID-reglering
5. Processens begränsningar

## Verifierade DEV-lärstigar (9, exakt ordning)

De fem ovan, plus: Windup och anti-windup, Integrerande process och nivåreglering,
Stegsvar och processidentifiering, Lambda-metoden.

## Verifierade DEV-kommandon

```bash
node tests/build-preview.mjs dev
python -m http.server 8000 --directory dist/dev
```

## Verifierade PROD-kommandon

```bash
node tests/build-preview.mjs prod
python -m http.server 8001 --directory dist/prod
```

## Verifierade testkommandon

```bash
node tests/validate-content.mjs
node tests/validate-content.mjs catalog.prod.json
node tests/validate-prod.mjs
node tests/simulation/analyze.test.mjs
```

## Dokumenterad Gitflow

`feature/<uppdrags-id>-<namn> → develop`; `release/<version> → main → tillbaka till
develop`; `hotfix/<version>-<namn> → main → tillbaka till develop`. Ingen cherry-pick,
ingen selektiv borttagning för PROD. Regeln "Merge till develop betyder tekniskt klar.
Aktivering i PROD betyder produktionsgodkänd. Publicering från main betyder releasad."
dokumenterad i både README.md och ENVIRONMENTS.md.

---

## Länkkontroll

Samtliga interna relativa länkar i README.md, apps/app/README.md verifierade peka på
filer som faktiskt finns. Enda externa länkar: `https://nodejs.org/` (korrekt syntax) och
den officiella app-URL:en (verifierad HTTP 200 live). Inga platshållare, inga interna
chatt-ID:n, ingen länk till en GitHub Release-post (som inte finns), inga föråldrade
Pages-URL:er. `docs/development/ENVIRONMENTS.md` innehåller inga externa länkar.

## Säkerhetskontroll

Sökning genom hela det versionshanterade filträdet efter API-nycklar, tokens, lösenord,
privata nycklar, `.env`-filer, GitHub-tokenformat (`ghp_*`, `github_pat_*`), AWS-nycklar
och Slack-tokens: **0 träffar.** Inga `.env`-filer versionshanterade. Inga filer > 500 KB.

## Integritetskontroll

Sökning efter e-postadresser, personnummer, student-/betygsreferenser: inga tredjeparts-
personuppgifter hittade. Två låggradiga, icke-blockerande fynd:

1. `.claude/settings.json` innehåller ett lokalt Windows-användarnamn i en absolut sökväg
   (`c:/Users/prmm00/...`) inom en verktygsbehörighets-post. Inte en hemlighet eller
   tredjepartsuppgift — PO:s eget, tidigare lokala kontonamn. Filen står inte på DOCS-001:s
   ändringslista (verktygskonfiguration, inte dokumentation) och lämnades orörd;
   flaggas här för PO:s kännedom.
2. Git-historikens författaruppgifter innehåller en commit med PO:s eget fullständiga namn
   och arbetsmejl (`Per Manholm, jobbet <per.manholm@karlstad.se>`) — självvald
   commit-identitet, inte en tredje parts uppgift, och normal praxis för
   repository-ägare. Ingen åtgärd vidtagen.

Utöver detta: 11 orphanade, oreferverade skärmbilder i `media/användarhandledning/`
(gamla UI-fragment från den nedlagda Python-appen, t.ex. "Regulator-presets",
"Simulering"-knappar) — granskade, innehåller inga person- eller känsliga uppgifter, bara
beskurna appfönster. Ingen dokumentation länkar till dem. Rensning är ett separat beslut
(DEL 6/14 i uppdraget), inte gjort inom DOCS-001.

## Kontroll av lokala sökvägar och sessionsfiler

`.claude/settings.json` och `.vscode/tasks.json` är versionshanterade (se ovan för det
enda fyndet i den förra). Inga CC-specifika sessionsfiler, terminalhistorik eller
tillfälliga byggfiler hittades i det versionshanterade trädet.

## Granskning av PROD-artifakten

Byggd med `node tests/build-preview.mjs prod` (projektets ordinarie kommando).

**Mappar:** `content/exercises/`, `content/scenarios/`, `content/theory/` (samtliga tre
alltid komplett kopierade, oavsett katalog).
**Filtyper:** `.html` (1), `.js` (4: app.js, sim-core.js, env.js, env.prod.js), `.json`
(katalog- och innehållsfiler), `.md` (3 README-filer).
**Total storlek:** ~352 KB.

Bekräftat **frånvarande** (korrekt): `docs/`, `tests/`, handoff-/rapport-/planerings-/
trackingfiler, lokala sökvägar, hemligheter, personuppgifter, editorfiler,
CC-sessionsfiler — build-skriptet kopierar uteslutande `apps/app/`, aldrig repo-roten.

**Se separat avsnitt nedan** för det fynd som INTE är löst: samtliga DEV-innehållsfiler
(24 scenarier, 9 lärstigar inkl. de 4 dolda, 8 teorimoduler, `catalog.json`, `env.prod.js`)
finns fysiskt i artifakten trots att PROD-appen aldrig laddar eller visar dem.

Funktionellt bekräftat (Playwright, både lokal PROD-preview och live-URL): Test-läge kan
inte aktiveras via UI, URL-parameter eller direkt konsolanrop (`setTestMode(true)` är ett
no-op); ingen DEV-märkning; inga experimentella scenarier i menyer; exakt fem lärstigar i
rätt ordning.

---

## Viktigt fynd — ej åtgärdat (kräver separat uppdrag)

**PROD-artifakten innehåller samtliga DEV-innehållsfiler som statiska, direkt hämtningsbara
filer**, trots att den körande appen aldrig refererar dem. Konkret: en teknisk besökare som
känner till eller gissar URL:en kan hämta t.ex.
`https://peman68.github.io/PID-simulator/content/exercises/windup-antiwindup.v1.json`
direkt och se hela den lärstigens innehåll och checkpoint-facit — trots att PO/PM
uttryckligen beslutat att den lärstigen inte ska vara tillgänglig i undervisningsversionen
ännu. Detsamma gäller övriga tre dolda lärstigar, samtliga 24 DEV-scenarier (inklusive de
experimentella) och `catalog.json` (den fullständiga DEV-katalogen).

**Orsak:** `tests/build-preview.mjs` kopierar hela `apps/app/`-katalogen rakt av och byter
sedan bara ut `env.js` — det finns ingen filtrering av vilka innehållsfiler som faktiskt
tas med i PROD-artifakten baserat på `catalog.prod.json`s allowlist.

**Varför detta inte åtgärdats här:** Detta är ett bygg-/produktfel upptäckt genom
dokumentationsgranskningen (DEL 8), inte ett dokumentationsfel. DOCS-001:s uppdrag är
uttryckligt: *"Om dokumentationsgranskningen visar ett faktiskt produktfel ska CC stoppa
och rapportera felet. CC ska inte rätta appfelet inom DOCS-001."* Att ändra
`tests/build-preview.mjs` för att filtrera innehållsfiler vore en ändring av
byggprocessen/produktionsartefakten, inte av dokumentation.

**Risk:** Låg till måttlig, inte en säkerhetsrisk (inga hemligheter, inga personuppgifter
i dessa filer) men en **pedagogisk exponeringsrisk** — checkpoint-svar för innehåll som
PO/PM medvetet valt att inte ännu släppa till studenter är tekniskt hämtningsbara av den
som letar. Blockerar inte v1.3.0:s nuvarande drift (UI:t visar korrekt bara de fem
godkända lärstigarna, och inget tyder på att detta upptäckts eller missbrukats).

**Rekommenderad åtgärd:** Ett litet, avgränsat tekniskt uppdrag som filtrerar
`tests/build-preview.mjs`s PROD-kopiering till att bara ta med de innehållsfiler som
faktiskt refereras av `catalog.prod.json` (scenarier, teori, lärstigar) plus appens
kärnfiler — analogt med hur `standalone`-fältet redan filtrerar UI:t, men på filnivå i
byggsteget. Bör täckas av en uppdaterad `tests/validate-prod.mjs`-kontroll som
misslyckas om artifakten innehåller fler innehållsfiler än allowlistet kräver.

---

## Licensstatus

Ingen `LICENSE`/`LICENCE`-fil finns i repot, och ingen licens dokumenterades tidigare i
README. DOCS-001 har varken valt eller skapat en licens (utanför uppdragets mandat).
README dokumenterar nu sakligt att licensfrågan är öppen, och en ny öppen punkt,
**BESLUT-003**, är registrerad i `docs/tracking/todo.md` för PO:s beslut.

---

## Kvarstående dokumentationsfrågor

1. **PROD-artifaktens filfiltrering** (se ovan) — rekommenderas som eget litet
   tekniskt uppdrag, inte dokumentation.
2. **Licensbeslut** — BESLUT-003 i todo.md, väntar på PO.
3. `.github/copilot-instructions.md` innehåller föråldrat material (externt spelrepo,
   en "känd bugg" i integrerande processer som inte längre existerar) — låg prioritet,
   inte en del av DOCS-001:s ändringslista, men värt att städa i ett framtida
   dokumentationspass om filen fortsatt används aktivt.
4. De 11 orphanade skärmbilderna i `media/användarhandledning/` — harmlösa men oanvända;
   rensning är ett separat, medvetet beslut, inte gjort här.
5. Kosmetiska teckenkodningsfel (saknade å/ä/ö) i `apps/app/content/exercises/README.md`
   och `apps/app/content/theory/README.md` — mycket låg prioritet.
