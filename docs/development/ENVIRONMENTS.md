# DEV och PROD — miljöprofiler (PROD-001B)

Detta dokument beskriver hur PID Simulator skiljer mellan en utvecklingsprofil (DEV) och en
undervisningsprofil (PROD), infört i uppdrag PROD-001B och skärpt i HOTFIX-v1.3.1 (PROD-
artifakten filtreras nu fysiskt, inte bara i UI:t). Samma kodbas (`apps/app/`) används i
båda — skillnaderna styrs uteslutande av konfiguration och katalogurval, aldrig av permanenta
manuella kodskillnader mellan branches.

## Skillnaden mellan DEV och PROD

| | DEV | PROD |
|---|---|---|
| Lärstigar | Samtliga 9 aktiva | Endast de 5 PO/PM har godkänt |
| Scenarier i fristående väljare | Samtliga 24 registrerade | Endast de som är markerade `standalone:true` i PROD-katalogen |
| Test-läge | Synligt och fungerande | Dolt, kan inte aktiveras på något sätt |
| Poängvisning | Synlig i Test-läge | Alltid dold |
| Guidat läge | Fungerar | Fungerar (enda läget) |
| Presentationsläge | Fungerar | Fungerar |
| Mät K/T/L (marköravläsning, 63%-linje, zoom) | Fungerar | Fungerar |
| Tangentlinjens facit ("Visa tangentlinje" + "Visa facit"-knappen) | Fungerar (ej produktionsgodkänt, se HOTFIX-v1.4.1) | Dolt, kan inte aktiveras |
| DEV-etikett | Visas (röd badge bredvid appversionen) | Visas inte |
| Katalogfil | `content/catalog.json` | `content/catalog.prod.json` |

## Hur en profil väljs

Varje profil definieras av EN fil: `apps/app/env.js`. Den laddas som ett vanligt
`<script src="./env.js">` i `index.html`, **före** `sim-core.js` och `app.js` — samma mönster
som `sim-core.js` redan använde innan PROD-001B. Filen sätter ett globalt objekt,
`window.ENV_CONFIG`:

```js
{
  environment: "development" | "production",
  showTestMode: boolean,
  showScore: boolean,
  showExperimentalContent: boolean,
  showMeasurementFacit: boolean,
  showGamification: boolean,
  catalogFile: "catalog.json" | "catalog.prod.json"
}
```

`showMeasurementFacit` (HOTFIX-v1.4.1, `true` i DEV / `false` i PROD) styr tangentlinjens
facit i mätpanelen — se avsnittet nedan.

`showGamification` (`true` i BÅDA profilerna sedan v1.5.0) styr nivåprogressionen
(GAM-002/GAM-003) — se eget avsnitt nedan. Det är den enda flaggan som INTE följer
`environment` — alla övriga flaggor ovan är fortsatt `false` i PROD, oförändrat.

- `apps/app/env.js` — **aktiv fil**, innehåller idag DEV-profilen. Det är denna fil
  `index.html` faktiskt läser.
- `apps/app/env.prod.js` — **mall**, laddas aldrig direkt av appen. Den är källan som
  kopieras över `env.js` när en PROD-förhandsvisning byggs (se nedan).

**Det finns ingen URL-parameter, tangentbordsgenväg eller dold knapp som kan byta profil.**
`app.js` läser `window.ENV_CONFIG` en gång vid start; allt som därefter kontrollerar
Test-läge (`setTestMode()`) vägrar aktivera Test-läge om `showTestMode` är `false` — även om
någon skulle anropa funktionen direkt (verifierat i webbläsarkonsolen under PROD-001B:s
tester, se leveransrapporten).

## Tangentlinjens facit — endast DEV (HOTFIX-v1.4.1)

Mätpanelens "Visa tangentlinje"-kryssruta (den geometriska Ziegler-Nichols-konstruktionen
som beräknar och ritar L/T direkt i grafen) och "Visa facit"-knappen (tabellen som visar
scenariots faktiska K/T/L-värden rakt av) döljs i PROD sedan HOTFIX-v1.4.1. PO har testat
mätfunktionen och beslutat att marköravläsningen och Mät K/T/L i övrigt fungerar bra och
ska finnas kvar, men att tangentfacitet inte fungerar tillräckligt bra pedagogiskt än.

Status:
- **Endast DEV.** Inte produktionsgodkänt.
- Behöver fortsatt teknisk och pedagogisk utredning innan ett eventuellt beslut om
  produktionsgodkännande (se STEG 3 i livscykeln nedan).
- Styrs av `ENV_CONFIG.showMeasurementFacit` (se ovan). Gated på två nivåer, inte bara
  UI-synlighet: `applyEnvironmentUI()` döljer kontrollerna i PROD, och `drawChart()`/
  `btnFacit`-hanteraren i `apps/app/app.js` vägrar rendera/aktivera facitet även om någon
  tvingar fram kryssrutan eller knappen via webbläsarkonsolen — samma idiom som `setTestMode()`
  redan använder för Test-läge. Ingen URL-parameter, hash eller tangentkommando kan aktivera
  det i PROD (verifierat, se `docs/tracking/todo.md`s HOTFIX-v1.4.1-post).

## Nivåprogression (gamification) — aktiverad i båda profilerna sedan v1.5.0

GAM-002 (aktivitetsspårning) och GAM-003 (nivåbadge/-mätare, `window.GamificationDev`-
konsolstöd) var fram till v1.5.0 uteslutande en DEV-only teknisk prototyp, gated på
`ENV_CONFIG.environment`. PO beslutade 2026-09-10 (PM otillgänglig) att aktivera
funktionen i PROD i sitt dåvarande, testade DEV-skick — inklusive konsolstödet för
felsökning på plats. Se `docs/development/GAMIFICATION-XP-PROTOTYPE.md` för den
fullständiga tekniska beskrivningen.

Konsekvenser för hur flaggorna hänger ihop:
- Till skillnad från `showTestMode`/`showScore`/`showExperimentalContent`/
  `showMeasurementFacit` (som alla följer `environment` och förblir `false` i PROD) styrs
  `activity-prototype-core.js`/`activity-prototype.js`/`gamification-*.js` ENDAST av
  `showGamification` — helt oberoende av `environment`. Skulle `environment` någon gång
  behöva vara `"development"` av annat skäl (eller tvärtom) påverkar det INTE
  gamification, och vice versa.
- `tests/lib/build-prod.mjs`s fasta fillista kopierar nu dessa sex filer till
  `dist/prod` som standard (tidigare uteslöts de uttryckligen).
- `tests/validate-prod.mjs` verifierar att `showGamification` är `true` i den byggda
  artifaktens `env.js`, och att filerna faktiskt finns där — motsatt kontroll jämfört med
  innan v1.5.0.
- Progression sparas i `localStorage` **per webbläsare/enhet**, inte per konto — på en
  delad/klassrumsdator ser nästa användare föregående persons nivå. Detta är ett känt,
  medvetet accepterat förhållande (PO:s beslut), inte en bugg.

## Katalogurval — PROD är en allowlist

`app.js`s `loadCatalog()` hämtar `ENV_CONFIG.catalogFile` istället för att hårdkoda
`catalog.json`. `content/catalog.prod.json` listar **uteslutande** det PO/PM uttryckligen
godkänt — inte "allt utom några undantag". Ett innehåll som läggs till i `catalog.json`
(DEV) syns därför aldrig i PROD förrän det explicit läggs till i `catalog.prod.json` också.

**Allowlistet gäller den byggda artifakten, inte bara appens gränssnitt** (sedan
HOTFIX-v1.3.1). Fram till v1.3.0 kopierade PROD-byggningen hela `apps/app/` rakt av — UI:t
visade rätt sak, men dolda lärstigars innehållsfiler (inklusive checkpoint-facit) låg
fysiskt kvar och gick att hämta direkt om man kände till URL:en. `tests/build-preview.mjs`
härleder nu PROD:s tillåtna filer genom att faktiskt läsa varje publicerad lärstigs
`steps[]` och slå upp referenserna (`tests/lib/prod-content-set.mjs`) — bara det som
behövs kopieras till `dist/prod`. Se avsnittet "Lokal förhandsvisning" nedan.

Varje scenario-post i katalogen kan ha ett `standalone`-fält:

```json
{ "id": "pi-deadtime-comparison", "file": "scenarios/pi-deadtime-comparison.json", "standalone": false }
```

- Saknas fältet (som i hela `catalog.json`/DEV idag) → scenariot visas i den fristående
  scenarioväljaren, som tidigare.
- `standalone: false` → scenariot kan fortfarande laddas av en lärstig som refererar det i
  ett steg, men visas inte som ett eget val i scenarioväljaren.

## Hur nytt innehåll godkänns för PROD

1. Innehållet utvecklas och testas i DEV som vanligt (`catalog.json`, oförändrad process).
2. PO/PM beslutar att det ska publiceras.
3. En lärstig-post läggs till i `catalog.prod.json`s `learning_paths[]`, tillsammans med de
   scenario- och teoriposter lärstigen refererar (annars misslyckas
   `tests/validate-prod.mjs` med en tydlig "beroende saknas"-rapport).
4. `node tests/validate-prod.mjs` körs för att bekräfta att urvalet fortfarande matchar
   facit i skriptet (se nästa avsnitt) — vid ett nytt PO/PM-beslut uppdateras även
   `EXPECTED_LEARNING_PATHS` i `tests/validate-prod.mjs` till det nya urvalet.

Ingen kod i `app.js` behöver ändras för att godkänna eller dölja innehåll — bara
`catalog.prod.json` och (vid ett nytt urval) facit i valideringsskriptet.

## Hur man verifierar vilken miljö som körs

- Öppna webbläsarkonsolen och kör `ENV_CONFIG` — visar hela den aktiva konfigurationen.
- DEV-badgen (röd "DEV"-etikett bredvid appversionen i vänstersidopanelen) är den visuella
  markören: **syns den, är det inte undervisningsversionen.**
- `Guidat`/`Test`-togglen är helt osynlig i PROD (inte bara inaktiv).

## Lokal förhandsvisning

Inget nytt byggsystem. DEV-byggningen är en ren filkopiering; PROD-byggningen är en
härledd, filtrerad kopiering (se ovan).

```bash
# DEV — identisk med att köra apps/app/ direkt: allt DEV-innehåll
node tests/build-preview.mjs dev
python -m http.server 8000 --directory dist/dev

# PROD — env.js ersatt med env.prod.js:s innehåll, content-filer begränsade
# till det som härleds från catalog.prod.json (se tests/lib/prod-content-set.mjs)
node tests/build-preview.mjs prod
python -m http.server 8001 --directory dist/prod
```

`dist/` är inte versionshanterad (se `.gitignore`) — byggs på begäran, kastas fritt.
`node tests/build-preview.mjs prod` avbryter med ett tydligt felmeddelande om ett
publicerat lärsteg refererar en teori- eller scenariofil som saknas i `catalog.prod.json`
eller på disk — det byggs aldrig en ofullständig eller felaktig artifakt tyst.

**Produktionsförhandsvisningen är avsedd att vara exakt vad en release till `main`
innehåller:** samma `apps/app/`-kod, samma `env.prod.js` (döpt om till `env.js`), samma
härledda innehållsfiler. Detta verifierades i RELEASE-v1.3.0 (2026-08-24) — GitHub Actions
kör `node tests/build-preview.mjs prod` direkt från `main` och publicerar `dist/prod/`,
byte-identiskt (bortsett från radslutsformat) med den lokala PROD-previewen — och gäller
fortsatt efter HOTFIX-v1.3.1:s filtrering, verifierat på samma sätt. Det finns ingen
separat, avvikande previewmekanism.

## Validering

```bash
node tests/validate-content.mjs                    # DEV: samtliga 9 lärstigar, 24 scenarier, 8 teorimoduler
node tests/validate-content.mjs catalog.prod.json   # PROD: referenskontroll av catalog.prod.json
node tests/build-preview.mjs prod                   # Bygg PROD-artifakten FÖRST — validate-prod.mjs kontrollerar den byggda dist/prod
node tests/validate-prod.mjs                        # PROD: allowlist på källnivå OCH på den byggda artifakten (inga dolda filer, ingen DEV-katalog)
node tests/simulation/analyze.test.mjs              # Simuleringskärnans egna tester
node tests/build-preview.test.mjs                   # Automatiska tester för artifaktfiltreringen (syntetiska fixturer, rör aldrig apps/app/content/)
node tests/hotfix-v1.4.1-facit-env.test.mjs         # Tangentfacitets miljöstyrning (källfiler + byggda dist/dev och dist/prod)
```

`validate-prod.mjs` kräver att `dist/prod/` redan är byggd (ordningen ovan) — annars
avbryter det med ett tydligt fel istället för att bara kontrollera källfilerna. Samtliga
ska köras rent innan `develop` mergas eller en release förbereds.

## Livscykel — från idé till publicerad funktion

En funktion eller lärstig går igenom fyra tydliga statusnivåer. Vilken nivå den befinner
sig på avgör var i repot den syns och vem som bestämmer nästa steg.

**STEG 1 — Under utveckling.** Arbetet sker i `feature/<uppdrags-id>-<namn>`, avgrenad från
`develop`. Funktionen stannar i feature-branchen tills den är tekniskt klar.

**STEG 2 — Tekniskt klar.** Feature-branchen testas och mergeas till `develop`. Funktionen
får nu visas i DEV (`catalog.json`, `env.js`) — men ska vara avstängd eller osynlig i PROD
om den inte redan är produktionsgodkänd (styrt av `catalog.prod.json`/`env.prod.js` och
verifierat av `tests/validate-prod.mjs`).

**STEG 3 — Produktionsgodkänd.** När PO godkänner en funktion eller lärstig för
undervisningsversionen skapas en separat, liten feature branch för själva
produktionsaktiveringen, t.ex. `feature/PROD-enable-<id>`. Den branchen får omfatta:
PROD-allowlistet (`catalog.prod.json`), PROD-konfiguration (`env.prod.js`),
scenarioberoenden, teoriberoenden, PROD-validering och ett PROD-preview-test. Den mergeas
till `develop` som vilken feature som helst — produktionsgodkännande är ett
katalogbeslut, inte en release i sig.

**STEG 4 — Release.** Hela `develop` går till en `release/<version>`-branch. Ingen
cherry-pick, ingen selektiv borttagning av innehåll. Release-branchen får bara tillföra
version, changelog, releasedokumentation och CI/deploy-konfiguration. Den mergeas till
`main` (synlig merge-commit, taggad) och sedan tillbaka till `develop`.

**STEG 5 — Publicerad.** GitHub Pages bygger och publicerar PROD-profilen (`dist/prod/`)
uteslutande från `main`, triggat endast av push till `main`. `main` och `develop`
innehåller samma kodbas — miljöprofilen (`env.js` vs `env.prod.js`) och allowlistet
(`catalog.json` vs `catalog.prod.json`) avgör vad användaren faktiskt ser, inte vilken
Git-branch koden råkar ligga i.

> **Merge till `develop` betyder tekniskt klar. Aktivering i PROD betyder
> produktionsgodkänd. Publicering från `main` betyder releasad.**

Dessa tre är olika beslut, fattade av olika roller, och ska aldrig sammanblandas: CC gör
steg 1 och (efter uppdrag) steg 2 och 4; PO/PM beslutar steg 3 (vad som ska synas i PROD)
och godkänner steg 4/5 (att en release faktiskt får ske).

## Repositoryts synlighet

Repositoryt är **publikt** vid v1.3.0. GitHub Pages publicerar en offentlig webbapp från
`main` — det är en separat fråga från om själva repositoryt (källkod, historik, `develop`,
alla brancher) är publikt eller privat. Ett publikt repository innebär att **hela**
`develop`-innehållet (samtliga 9 lärstigar, Test-läge, poäng, källan till de fyra ännu
inte produktionsgodkända lärstigarna) är läsbart för vem som helst som klonar repot —
oavsett vad PROD-profilen visar i webbläsaren. Inget känsligt får därför någonsin läggas
in i källkoden eller innehållsfilerna med antagandet att "det syns ju bara i DEV" — DEV är
inte skyddat, bara den publicerade webbappen är filtrerad.

Byte till privat repository är ett separat, administrativt beslut för PO — inget som styrs
av eller ingår i DEV/PROD-profilerna som beskrivs i detta dokument.

### Exempel: RELEASE-v1.3.0 (2026-08-24)

Första gången hela livscykeln kördes i praktiken:

- PROD-001A (analys) → PROD-001B (STEG 2: DEV/PROD-infrastrukturen mergad till `develop`,
  produktionsurvalet för de fem godkända lärstigarna satt direkt i samma uppdrag, motsvarande
  STEG 3) → RELEASE-v1.3.0 (STEG 4–5: `release/v1.3.0` → `main`, taggad `v1.3.0`, mergad
  tillbaka till `develop`, GitHub Pages publicerad från `main`).
- Fyra lärstigar (windup-antiwindup.v1, integrerande-process-niva.v1,
  stegsvar-identifiering.v1, lambda-metoden.v1) stannade på STEG 2 — tekniskt klara, synliga
  i DEV, men inte i `catalog.prod.json` och därmed osynliga i PROD. De väntar på ett eget
  `feature/PROD-enable-<id>`-uppdrag när PO bedömer dem pedagogiskt granskade.
- HOTFIX-v1.3.1 (samma dag) rättade ett fel i STEG 5: PROD-byggningen kopierade tidigare
  hela `apps/app/` istället för att härleda allowlistet, så dolda lärstigars innehåll (inkl.
  checkpoint-facit) låg fysiskt kvar i den publicerade artifakten trots att UI:t var
  korrekt. Gick via samma `hotfix/<version>-<namn>`-mönster som Gitflow beskriver:
  branch från `main`, merge till `main` (taggad `v1.3.1`), merge tillbaka till `develop`.
