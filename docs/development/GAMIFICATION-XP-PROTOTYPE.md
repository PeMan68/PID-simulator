# Synlig XP- och nivåprototyp (GAM-003B/GAM-003C) — DEV-only

**Status:** DEV-prototyp. Inte produktionsgodkänd — ingen produktionsaktivering
är beslutad. Nivån mäter **aktivitet och progression** i PID Simulator. Den är
**inte ett betyg** och **inte ett mått på yrkeskompetens**. Se
`docs/planning/GAMIFICATION-XP-ANALYS.md`, `docs/reports/GAM-003A_XP-KALIBRERING.md`,
`docs/reports/GAM-003A.1_XP-KALIBRERING-REPETITION.md`,
`docs/reports/GAM-003A.2_COMPARISON-GROUPS.md` och
`docs/reports/PED-005_JAMFORELSEGRANSKNING.md` för det pedagogiska och
tekniska underlag denna prototyp bygger på.

Efter leverans ska PO användartesta visuell UX, nivåtempo, repetition,
persistens, återställning och nivåanimation innan något beslut om
produktionsaktivering tas — se GAM-003B:s uppdragstext (RELEASEINSTRUKTION).

## GAM-003C (2026-09-10) — Kvalificerad och fördröjd XP-visning

PO:s användartest av GAM-003B visade att barens omedelbara respons gjorde
det lätt att kartlägga exakt vilket klick som gav XP. GAM-003C ändrar
**inga XP-värden och inga nivågränser** — bara NÄR och UNDER VILKA VILLKOR
XP bokförs/visas:

- **Bokföring och visning är frikopplade.** `engine.totalXP` (bestående,
  bokförd) uppdateras fortfarande direkt när ett villkor uppfylls. Baren
  visar istället `engine.displayedXP`, som bara synkas vid en "naturlig
  avstämningspunkt" (`Engine.shouldFlush`/`flush()`): stegbyte,
  scenariobyte, avslutat försök, slutförd lärstig, eller om bokförd XP
  redan skulle ge en högre nivå än den senast visade.
- **"Nytt högsta lärsteg" (2 XP) kräver nu kvalificering** innan det
  bokförs — se `classifyStep()`/`evaluatePending()` i
  `gamification-xp-engine.js`: teoristeg kräver aktiv lästid
  (`4s + antal ord/4`, klämt 8–60s), scenariosteg kräver relevant aktivitet
  (väntetid räcker inte), blandade steg (heuristik: ett längre
  scenario-steg, ≥40 ord) kräver 50 % av lästiden OCH aktivitet. Ett
  `progressRequirement`-fält (valfritt, inget innehåll sätter det ännu) kan
  i framtiden styra klassificeringen per steg utan att motorn ändras.
  Navigationen låses ALDRIG — ett steg som lämnas okvalificerat ger bara
  ingen XP.
- **"Unik hjälptext" (2 XP) kräver nu minst 3 sekunders aktiv tid** med
  samma hjälptext öppen. Byte av hjälptext eller stängd hjälppanel
  (`help_closed`, ny händelse dispatchad när högersidopanelen kollapsas)
  avbryter kvalificeringen utan XP.
- **En enda, punktvis timer** (`gamification.js`s `scheduleNextPendingCheck`,
  INTE en polling-loop) fångar fallet där en tidsbaserad kvalificering
  (teoristeg/hjälp) skulle uppfyllas medan användaren är overksam — annars
  hade den bara upptäckts retroaktivt vid nästa riktiga händelse.
- **Panelen är komprimerad**: bara badge, nivånummer, nivånamn och baren
  syns permanent. Förklaringstexten, "HÖGSTA NIVÅ"-texten och "Återställ
  progression"-knappen togs bort som permanenta element — de två förstnämnda
  helt, den sista flyttad in i den klickbara informationsytan
  (`#gamLevelInfo`). Detta löste samtidigt en verklig CSS-bugg: elementens
  egna `display`-deklarationer slog igenom `[hidden]`-attributet (samma
  buggmönster som redan fanns för `.gam-level-panel`), vilket gjorde att de
  syntes permanent redan i GAM-003B trots att koden satte `hidden`.
- **Utökat DEV-konsolstöd**: `window.GamificationDev.pending()` (stegtyp,
  beräknad lästid, aktiv tid, uppfyllda villkor), `.log()` (varför XP gavs
  eller inte), `.setXP()`/`.jumpToLevel()`/`.placeNearLevel()` (exakt
  placering runt en nivågräns), `.simulateLevelUpSequence()` (flera
  nivåbyten i rad) och `.forceFlush()` (tvinga bar-synk). Se
  `apps/app/gamification.js`s kommentarer för exakt vad som speglar verklig
  aktivitet kontra rena testhjälpmedel.

Nya/ändrade filer: `apps/app/app.js` (skickar `stepType`/`wordCount`/
`progressRequirement` med `learning_step_reached`, dispatchar `help_closed`),
`apps/app/gamification-xp-engine.js`, `apps/app/gamification.js`,
`apps/app/gamification-ui.js`, `apps/app/index.html`. `apps/app/gamification-store.js`
och persistensformatet är OFÖRÄNDRADE (inget nytt sparas — pendingStep/
pendingHelp/displayedXP är sessionsbundna, återställs alltid vid sidladdning).

## Var den finns

| Fil | Innehåll |
|---|---|
| `apps/app/gamification-xp-engine.js` | DOM-fri XP-/nivåmotor. Samma UMD-mönster som `sim-core.js`/`activity-prototype-core.js` — testas i Node (`tests/gamification/gamification-engine.test.mjs`) och körs oförändrad i webbläsaren. |
| `apps/app/gamification-store.js` | DOM-fri `localStorage`-adapter + migrering. Testad i Node med en in-memory-mock (`tests/gamification/gamification-store.test.mjs`). |
| `apps/app/gamification-ui.js` | DOM-rendering mot den statiska skal-markupen i `index.html` (`#gamLevelPanel` m.fl.). Ingen XP-/persistenslogik. |
| `apps/app/gamification.js` | Bootstrap/glue: kopplar ihop de tre filerna ovan med `window.ActivityPrototype` (GAM-002). Enda filen som känner till BÅDA motorn/lagret OCH UI:t. |

Ingen av dessa filer lägger XP- eller persistenslogik i `app.js` — `app.js`
injicerar bara skripten (samma mönster som GAM-002) och känner i övrigt
ingenting till gamification.

## Endast i DEV

Styrs av **två** villkor tillsammans: `ENV_CONFIG.environment === "development"`
OCH den egna flaggan `ENV_CONFIG.showGamification === true`. Båda sätts
ENDAST i `apps/app/env.js` (DEV: `true`) respektive `apps/app/env.prod.js`
(PROD: `false`) — aldrig via URL, hash eller dold knapp. `app.js` injicerar de
fyra skripten dynamiskt (`document.createElement("script")`, `s.async = false`
för att garantera körordning) bara när båda villkoren är sanna. I PROD skapas
skripttaggen aldrig — noll extra nätverkstrafik.

`tests/lib/build-prod.mjs`s fasta fillista (`index.html`, `app.js`,
`sim-core.js`, `README.md`) kopierar heller aldrig de fyra gamification-
filerna eller `activity-prototype*.js` till `dist/prod/` — dubbelt skydd,
precis som för GAM-002.

**index.html:s statiska skal** (`#gamLevelPanel` m.fl.) finns i BÅDA
profilerna (samma `index.html`-fil), men har `hidden` som standard och en
`.gam-level-panel[hidden] { display: none; }`-regel som garanterar att ingen
egen `display`-deklaration kan slå igenom den — utan `gamification.js` (som
aldrig laddas i PROD) tar ingenting bort `hidden`-attributet. Verifierat med
en riktig PROD-förhandsvisning i webbläsaren (Playwright): `#gamLevelPanel`
förblir osynlig, `window.ActivityPrototype`/`window.GamificationDev`/
`window.GamificationXPEngine`/`window.GamificationStore`/`window.GamificationUI`
existerar inte, ingen `gamification*.js`- eller `activity-prototype*.js`-fil
hämtas över nätverket, och ingen `pidSimGamificationV1`-nyckel skapas i
`localStorage`.

## XP-regler (PO/PM-beslutade, GAM-003B)

| Kategori | XP | Regel |
|---|---|---|
| Nytt högsta lärsteg | 2 | Bestående, en gång per lärsteg (oavsett antal sessioner). |
| Slutförd lärstig | 12 | Varje fullständig genomgång (repeterbar per session). |
| Genomfört försök | 4 | Varje gång (minst 20 simulerade steg), även vid identisk konfiguration. |
| Ny distinkt parameterkonfiguration | 2 | Bestående, första gången per exakt kontext+konfigurationssignatur. |
| Jämförelsepar (inom kontext + `comparisonGroup`) | 6 | Per identifierat par, repeterbart per session. |
| Unik hjälptext | 2 | Per `helpId` och session, inget tak. |
| Genomfört mätarbete | 4 | Mätpanel aktiverad + justerad + följd av aktivitet. |
| Analytisk enstegning | 1 | Högst 5 per pågående försök. |
| Aktiv tid, Pointermove, Reset, Rensa graf, Mätfacit | 0 | — |
| "Kör 10" | 0 direkt | Bidrar till 20-stegsgränsen för genomfört försök. |
| Checkpointsvar | — | Ingår INTE i nivå-XP (och `app.js` skickar aldrig något checkpoint-relaterat till aktivitetsmodellen). |

Reglerna är samlade i `XP_RULES_V1` (`gamification-xp-engine.js`,
`XP_RULES_VERSION = "v1"`) — identiska värden som `tests/gamification/xp-model.mjs`s
`XP_RULES_V1`, minus checkpoint-kategorierna (irrelevanta här).

### Bestående kontra repeterbar XP

- **Bestående** (kräver att laddas från sparat tillstånd vid varje ny
  session): nytt högsta lärsteg, den 2-XP:s distinkta-konfigurationsbonusen.
  Spåras via `engine.learningPathMeta` (seedas in i `session.learningPaths`,
  se `seedSession()`) respektive `engine.contextSignatures` (spåras HELT
  UTANFÖR GAM-002:s egen session — se nästa stycke).
- **Repeterbar per session** (nollställs alltid vid en ny sidladdning):
  genomfört försök, jämförelsepar (inom kontext OCH `comparisonGroup`), unik
  hjälptext, mätarbete, enstegning, slutförd lärstig.

**Varför jämförelsepar är repeterbara trots att distinktheten är bestående:**
GAM-002:s session (`activity-prototype-core.js`, oförändrad) startar alltid
med tomma `session.contexts`/`distinctConfigs` — motorn seedar INTE detta vid
sessionsstart (till skillnad från `session.learningPaths`, som seedas). Det
betyder att Core:s egen jämförelseparslogik alltid får en fräsch start varje
session och därför naturligt kan bilda SAMMA par igen om användaren upprepar
samma sekvens av konfigurationer. Den bestående 2-XP-bonusen för att
konfigurationen är "ny" hanteras separat, som ett eget lager ovanpå
(`engine.contextSignatures`, en `Map<contextKey, Set<signatur>>` som ALDRIG
rörs av GAM-002 själv) — så att ett jämförelsepar kan ges XP om och om igen
över sessioner, samtidigt som den lilla "första gången"-bonusen bara ges en
gång per signatur, någonsin. Se testerna 3, 11 och 12 i
`gamification-engine.test.mjs` för den exakta, verifierade gränsdragningen.

**Känd begränsning (ärvd, oförändrad GAM-002-semantik):** ett pågående försök
finaliseras (och räknas) först vid nästa betydande händelse — ett
kontextbyte, en betydande parameterändring, eller "Återställ system". Det
allra sista pågående försöket i en session belönas alltså inte om
sidan/fliken stängs utan någon avslutande händelse. Detta är inte nytt för
GAM-003B — det är samma beteende `tests/gamification/xp-model.mjs`s
`computeXP()` explicit hanterar med en avslutande `finalizeAllAttempts()`.
En framtida `beforeunload`-baserad "flush" bedömdes inte vara värd
komplexiteten/otillförlitligheten (webbläsare prioriterar ofta ner arbete i
den händelsen) och ingår inte i GAM-003B.

## Nivåkurva (PO/PM-beslutad, GAM-003B)

| # | Namn | Ackumulerad XP |
|---|---|---|
| 1 | Reglernovis | 0 |
| 2 | Looplärling | 50 |
| 3 | Signalspanare | 140 |
| 4 | Processutforskare | 300 |
| 5 | Loopvävare | 550 |
| 6 | Regleradept | 900 |
| 7 | Processmästare | 1 400 |
| 8 | Reglerlegend | 2 100 |

Samlad i `LEVELS_V1` (`gamification-xp-engine.js`, `LEVELS_VERSION = "v1"`) —
identisk med `tests/gamification/xp-model.mjs`s `LEVELS_V2`. Nivå 8 är
högsta nivån i prototypen; XP fortsätter sparas och ackumuleras därefter
(`engine.totalXP` har inget tak), bara nivåmätaren visas full.

### Stabilitet över releaser

`levelForDisplay(totalXP, highestLevelIndexEverReached, levels)` returnerar
**högsta av**: nivån aktuell XP ger under de NUVARANDE gränserna, och den
högsta nivå användaren NÅGONSIN har nått (sparad i `highestLevelIndex`). Om
nivågränser sänks i en framtida uppdatering kan användaren flyttas upp; om de
höjs flyttas användaren aldrig ned. När den visade nivån är "innehavd" (högre
än vad aktuell XP själv ger) visas mätaren full — det finns inget meningsfullt
"andel kvar"-tal för en nivå vars egna, nya trösklar redan passerats i teorin
men inte i praktiken. `highestLevelIndex` uppdateras varje gång en NY nivå
faktiskt nås (aldrig sänks).

Redan bokförd XP räknas aldrig om retroaktivt och minskar aldrig när XP-regler
eller nivågränser ändras — `engine.totalXP` är en enkel, monotont växande
summa; ändrade regler i en framtida `XP_RULES_V2`/`LEVELS_V2`-uppdatering
skulle bara påverka FRAMTIDA händelser.

## Nivå-UI och placering

En kompakt panel (`#gamLevelPanel`) i vänstra sidopanelen, direkt under
apptiteln och ovanför "Scenario"-sektionen. Innehåller:

- en sexkantig (hexagon) badge med en enkel reglertekniks-glyf
  (återkopplingsloop) och nivånumret som text,
- nivånamnet,
- en grafisk nivåmätare (andel 0..1 mot nästa nivå; full vid nivå 8, med en
  diskret "Högsta nivå"-etikett),
- **inget XP-tal, ingen "X av Y XP"-text** — nivånummer och nivånamn är de
  primära signalerna, färg är bara ett diskret tillägg (kontrollerad
  kontrast mot panelbakgrunden).

Panelen är klickbar/tangentbordsaktiverbar (`<button>`) och visar/döljer en
kort informationstext: *"Nivån visar din aktivitet och progression i PID
Simulator. Den är inte ett betyg eller ett mått på yrkeskompetens."* —
tillsammans med knappen **Återställ progression** (kräver bekräftelse).

### Accentfärger per nivå

Åtta nyanser (`TIER_ACCENTS` i `gamification-ui.js`), satta som CSS-variabeln
`--gam-accent` LOKALT på `#gamLevelPanel` — påverkar ENDAST badgens kontur,
nivåmätarens fyllnad, panelens kant och nivåbytesanimationen. Rör ALDRIG
grafens signalfärger, simulatorns huvudfärger (`--accent`/`--accent-2`),
varningsfärger eller knapp-/regulatorfärgkodningen.

| Nivå | Färgfamilj |
|---|---|
| 1–2 | Blågrå / blå |
| 3–4 | Blå / turkos |
| 5–6 | Turkos / violett |
| 7 | Koppar |
| 8 | Guld |

### Nivåbyte

Vid ett nivåbyte: baren fylls, badgen får en kort (900 ms) puls-animation, en
diskret text ("Ny nivå — \<namn\>") visas ~2,5 s, nivåsiffra/namn och
accentfärg uppdateras direkt, och nästa nivås bar börjar på rätt position med
eventuell överskjutande XP. Ingen konfetti, ingen blockerande dialog.

### `prefers-reduced-motion`

`gamification-ui.js`s `prefersReducedMotion()` (backad av en
`@media (prefers-reduced-motion: reduce)`-regel i `index.html`) stänger av
badgens puls-animation och toastens animerade nedtoning helt — texten visas
ändå (utan rörelse) och tas bort efter samma tidsfönster via en enkel
`setTimeout`, inte en CSS-animation.

## Persistensformat

Egen `localStorage`-nyckel: **`pidSimGamificationV1`** — blandas ALDRIG med
appens övriga inställningar (`pidSimWelcomed`, `pg-<id>`, sidopanelbredd).

```json
{
  "schemaVersion": 1,
  "xpRulesVersion": "v1",
  "totalXP": 0,
  "highestLevelIndex": 0,
  "learningPaths": {
    "<learningPathId>": { "highestStepIndex": -1, "completed": false, "completedCount": 0 }
  },
  "contextSignatures": {
    "<contextKey>": ["kp=1|ti=10", "..."]
  }
}
```

Sparas ALDRIG: råhändelseloggen, musrörelser, tangentaktivitet/tangentvärden,
muskoordinater, fullständig parameterhistorik, detaljerad aktiv tid,
checkpointresultat, personuppgifter. `gamification-store.js`s `sanitize()`
kör BÅDE vid läsning och vid skrivning — bara det exakta, tillåtna schemat
kan någonsin hamna i `localStorage`, oavsett vad anroparen skickar in.

### Migrering

`GamificationStore.migrate(raw)` är version-dispatchad. Version 1 (den första
versionen) betyder "sanera/fyll i saknat". En framtida `schemaVersion: 2`
skulle lägga till egna steg i samma funktion — ALDRIG genom att skriva om
historiken retroaktivt. Korrupt eller okänd data ger alltid ett tomt, giltigt
tillstånd istället för att krascha (`Store.load()` fångar `JSON.parse`-fel
och typfel); `totalXP`/`highestLevelIndex` bevaras så långt det går även från
en okänd framtida version.

### Återställ progression

`GamificationStore.resetProgression()` tar bort ENDAST
`pidSimGamificationV1`-nyckeln. UI-knappen kräver ett `window.confirm()`
innan anropet görs. Efter återställning: nivån visas direkt som Reglernovis,
0 XP, och panelen uppdateras utan sidomladdning. Andra `localStorage`-nycklar
rörs aldrig — verifierat både i Node (`gamification-store.test.mjs`, test 24)
och i en riktig webbläsare (Playwright: `pidSimWelcomed`/`pg-<id>` oförändrade
efter återställning).

## Sessionsdefinition

**En gamification-session = en sidladdning/omladdning** — exakt samma
livslängd som GAM-002:s egen aktivitetssession (`activity-prototype.js`
skapar en ny `Core`-session vid varje sidladdning). Det är den enda
sessionsgränsen som finns; det finns inget separat, eget
gamification-sessionsbegrepp. Konsekvenser:

- Hjälp-ID och jämförelsepar kan ge XP igen efter en sidomladdning.
- Bestående progression (total XP, högsta nått lärsteg, distinkta
  konfigurationssignaturer) laddas från `localStorage` vid varje
  sidladdning och seedas in i den nya, i övrigt tomma Core-sessionen
  (`Engine.seedSession`).
- Om GAM-002:s DEV-konsol startar om AKTIVITETSSESSIONEN manuellt
  (`window.ActivityPrototype.reset()`) UTAN en sidomladdning, lyssnar
  `gamification.js` på den syntetiska `session_started`-händelsen och
  nollställer motorns sessionsbundna räknare i takt
  (`Engine.resetSessionScope`) — annars skulle motorns "senast sedda"-värden
  bli inkonsekventa mot en ny, tom session. De bestående delarna rörs inte.
- En snabb omladdning utan att användaren gör något nytt skapar ingen XP —
  motorns sessionsräknare startar om från exakt samma bestående baslinje som
  lästes in, och ingen ny aktivitet har inträffat.

## Integration med GAM-002 (ingen dubbelregistrering)

Den ENDA integrationspunkten är `window.ActivityPrototype.onEvent(fn)` — en
ny, litet tillagd registreringsfunktion i `activity-prototype.js`. `fn`
anropas EFTER att `ActivityPrototypeCore.recordEvent(session, type, meta,
now)` redan har uppdaterat sessionen, med SAMMA `session`-objekt.
`gamification.js` anropar ALDRIG `recordEvent` själv — det finns bara EN väg
in (`activity-prototype.js`s egen `dispatch()`, som `app.js`s befintliga
`activityDispatch()`-anrop redan går genom), så samma aktivitet kan
per konstruktion aldrig bokföras dubbelt. `gamification-xp-engine.js`s
`processEvent()` jämför sessionens tillstånd FÖRE/EFTER (en egen ihågkommen
ögonblicksbild, `engine.snapshot`) — samma princip som
`tests/gamification/xp-model.mjs`s batch-`computeXP()`, fast inkrementellt.

Pointermove, pointerdown, keydown, visibility- och focus-händelser går
ALDRIG via `dispatch()` (de anropar `Core.markActive`/`setVisible`/
`setFocused`/`recordPointermove` direkt) — de når alltså aldrig
gamification-motorn och kan per konstruktion aldrig ge XP eller trigga en
`localStorage`-skrivning. Skrivning sker bara efter en händelse som faktiskt
gav minst 1 XP.

## DEV-konsolstöd

`window.GamificationDev` (finns ENDAST i DEV, tillsammans med
`window.ActivityPrototype`/`window.GamificationXPEngine`/
`window.GamificationStore`/`window.GamificationUI`):

| Kommando | Speglar verklig aktivitet? | Beskrivning |
|---|---|---|
| `GamificationDev.state()` | Ja — läser bara | Returnerar `{ totalXP, highestLevelIndex, level, persisted }` för nuvarande, verkliga progression. |
| `GamificationDev.grantTestXP(amount)` | **Nej — testhjälpmedel** | Lägger till `amount` XP direkt (skriver till samma `localStorage`-nyckel som riktig XP) för att testa nivåbyten/persistens end-to-end. Motsvarar ingen verklig aktivitet — kör `reset()` efteråt för att städa bort testdata. |
| `GamificationDev.simulateLevelUp(toLevelIndex?)` | **Nej — testhjälpmedel** | Visar nivåbytesanimationen för en given (eller nästa) nivå. Rör INTE `totalXP` eller lagring — ren UI-test. |
| `GamificationDev.reset()` | Ja — verklig radering | Samma radering som "Återställ progression"-knappen, utan bekräftelsedialog (ett konsolanrop är redan en medveten handling). |

Inget av detta existerar i PROD (`gamification.js` laddas aldrig där).

## Testtäckning

- `tests/gamification/gamification-engine.test.mjs` (34 tester) — samtliga
  XP-kategorier, bestående kontra repeterbar XP, enstegningstak, "Kör 10",
  nivågränser (inkl. flera på en gång, nivå 8, stabilitet vid höjda gränser).
- `tests/gamification/gamification-store.test.mjs` (20 tester) — läsning/
  skrivning, korrupt data, migrering, "Återställ progression", att inget
  annat än det tillåtna schemat kan sparas.
- `tests/gamification/gamification-dev-prod-isolation.test.mjs` (13 tester)
  — statisk källkontroll + en riktig PROD-byggning: inga gamification-filer
  i `dist/prod`, `showGamification`-flaggans DEV/PROD-värden, ingen
  nätverkstrafik, ingen URL/hash-aktivering, `prefers-reduced-motion`.
- Manuell kontroll i webbläsare (Playwright, engångsskript, inte
  versionshanterat): hela DEV-checklistan (nivåpanel, hjälp/försök/
  enstegning/lärstig ger rätt XP-rörelse i baren, nivåbyte+animation,
  persistens över omladdning, återbesök ger inte ny bestående steg-XP,
  bekräftad/avbruten återställning, `pidSimWelcomed`/`pg-<id>` opåverkade,
  `prefers-reduced-motion`, smalt/brett läge) samt hela PROD-regressionen
  (ingen UI, inga moduler hämtade, ingen `localStorage`-nyckel, inga globala
  DEV-objekt, simulatorn fungerar normalt). Detta hittade och verifierade
  fixen av en verklig bugg (se "Kända begränsningar").

## Kända begränsningar

1. **Sista pågående försöket i en session räknas inte förrän en avslutande
   händelse sker** (kontextbyte, betydande parameterändring, "Återställ
   system") — ärvt, oförändrat GAM-002-beteende, inte nytt i GAM-003B.
2. **Ingen `beforeunload`-baserad "flush"** av det allra sista försöket —
   bedömt som en otillförlitlig komplexitetsökning, inte implementerat.
3. **`lambda-comparison`s pardragning** (sekventiell kedja kontra gemensam
   referens, se PED-005 avsnitt 12/14) är oförändrad i GAM-003B — det är ett
   öppet PO/PM-beslut om en riktad motorutökning, inte del av detta uppdrag.
4. **Ingen "överlappande grafer"-funktion** — flera jämförelser (t.ex.
   `pb-p-vs-pi`, `pi-vs-pid`) förlitar sig fortsatt på användarens egna
   anteckningar snarare än en visuell sida-vid-sida-jämförelse, i linje med
   PED-005s slutsatser.
5. **Ingen produktionsaktivering är beslutad.** GAM-003B är och förblir en
   DEV-prototyp tills PO/PM fattar ett separat beslut.
