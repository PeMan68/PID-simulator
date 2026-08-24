# DEV och PROD — miljöprofiler (PROD-001B)

Detta dokument beskriver hur PID Simulator skiljer mellan en utvecklingsprofil (DEV) och en
undervisningsprofil (PROD), infört i uppdrag PROD-001B. Samma kodbas (`apps/app/`) används i
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

Inget nytt byggsystem — `tests/build-preview.mjs` gör en ren filkopiering.

```bash
# DEV — identisk med att köra apps/app/ direkt
node tests/build-preview.mjs dev
python -m http.server 8000 --directory dist/dev

# PROD — env.js ersatt med env.prod.js:s innehåll, allt annat identiskt
node tests/build-preview.mjs prod
python -m http.server 8001 --directory dist/prod
```

`dist/` är inte versionshanterad (se `.gitignore`) — byggs på begäran, kastas fritt.

**Produktionsförhandsvisningen är avsedd att vara exakt vad en framtida release till `main`
kommer att innehålla:** samma `apps/app/`-kod, samma `env.prod.js` (döpt om till `env.js`),
samma `catalog.prod.json`. Ett framtida releaseuppdrag kan återanvända precis detta skript
(eller motsvarande fil-swap) när `main` förbereds — det finns ingen separat, avvikande
previewmekanism.

## Validering

```bash
node tests/validate-content.mjs                    # DEV: samtliga 9 lärstigar, 24 scenarier, 8 teorimoduler
node tests/validate-content.mjs catalog.prod.json   # PROD: referenskontroll av catalog.prod.json
node tests/validate-prod.mjs                        # PROD: allowlist — exakt 5 lärstigar, rätt ordning, inga dolda/experimentella läckor, Test-läge/poäng avstängda
node tests/simulation/analyze.test.mjs              # Simuleringskärnans egna tester (opåverkad av PROD-001B)
```

Samtliga fyra ska köras rent innan `develop` mergas eller en release förbereds.
