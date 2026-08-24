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
| Mät K/T/L | Fungerar | Fungerar |
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
  catalogFile: "catalog.json" | "catalog.prod.json"
}
```

- `apps/app/env.js` — **aktiv fil**, innehåller idag DEV-profilen. Det är denna fil
  `index.html` faktiskt läser.
- `apps/app/env.prod.js` — **mall**, laddas aldrig direkt av appen. Den är källan som
  kopieras över `env.js` när en PROD-förhandsvisning byggs (se nedan).

**Det finns ingen URL-parameter, tangentbordsgenväg eller dold knapp som kan byta profil.**
`app.js` läser `window.ENV_CONFIG` en gång vid start; allt som därefter kontrollerar
Test-läge (`setTestMode()`) vägrar aktivera Test-läge om `showTestMode` är `false` — även om
någon skulle anropa funktionen direkt (verifierat i webbläsarkonsolen under PROD-001B:s
tester, se leveransrapporten).

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
härledda innehållsfiler. Detta verifierades i RELEASE-v1.3.0 (byggmekanismen är identisk
oavsett om den körs lokalt eller i GitHub Actions från `main`) och gäller fortsatt efter
HOTFIX-v1.3.1:s filtrering.

## Validering

```bash
node tests/validate-content.mjs                    # DEV: samtliga 9 lärstigar, 24 scenarier, 8 teorimoduler
node tests/validate-content.mjs catalog.prod.json   # PROD: referenskontroll av catalog.prod.json
node tests/build-preview.mjs prod                   # Bygg PROD-artifakten FÖRST — validate-prod.mjs kontrollerar den byggda dist/prod
node tests/validate-prod.mjs                        # PROD: allowlist på källnivå OCH på den byggda artifakten (inga dolda filer, ingen DEV-katalog)
node tests/simulation/analyze.test.mjs              # Simuleringskärnans egna tester
node tests/build-preview.test.mjs                   # Automatiska tester för artifaktfiltreringen (syntetiska fixturer, rör aldrig apps/app/content/)
```

`validate-prod.mjs` kräver att `dist/prod/` redan är byggd (ordningen ovan) — annars
avbryter det med ett tydligt fel istället för att bara kontrollera källfilerna. Samtliga
ska köras rent innan `develop` mergas eller en release förbereds.
