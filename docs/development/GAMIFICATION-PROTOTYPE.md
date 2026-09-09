# Aktivitetsprototyp (GAM-002) — DEV-only sessionsmätning

**Status:** Teknisk prototyp för utvärdering. Ingen XP visas. Ingen persistens.
Inte produktionsgodkänd. Se `docs/planning/GAMIFICATION-XP-ANALYS.md` för det
pedagogiska underlaget denna prototyp bygger på och ska ge svar på.

**GAM-003A (2026-09-08):** Denna moduls händelsemodell har provräknats fullständigt
mot en konkret XP-modell utan att själva registreringsmodellen nedan ändrats —
se `docs/reports/GAM-003A_XP-KALIBRERING.md` och det återanvändbara verktyget i
`tests/gamification/` (importerar `activity-prototype-core.js` oförändrat).

**GAM-003A.1 (2026-09-09):** PO/PM beslutade att repetition (upprepade försök,
lärstigar, egna parameterexperiment) ska ge full XP — inga tak infördes. En
framtida synlig prototyp behöver därför spara bestående progression mellan
sessioner (total XP, högsta nått lärsteg per lärstig, redan sedda
konfigurationssignaturer). Se
`docs/reports/GAM-003A.1_XP-KALIBRERING-REPETITION.md`. Denna moduls egen
registreringsmodell (nedan) är fortfarande oförändrad — persistensbehovet
gäller ett framtida XP-/nivålager ovanpå, inte GAM-002 självt.

**GAM-003A.2 (2026-09-09):** Denna moduls registreringsmodell ÄR nu ändrad
(första gången sedan GAM-002 skapades) — ett nytt, valfritt `comparisonGroup`-
fält på lärstigssteg (satt av `app.js` i `learning_step_reached`-dispatchen)
låter genomförda försök i olika kontexter (olika lärstigssteg/scenario-ID)
bilda jämförelsepar, utan att den befintliga inom-kontext-jämförelsen nedan
ändrats. Se "Jämförelsepar"-avsnittet nedan (uppdaterat) och
`docs/reports/GAM-003A.2_COMPARISON-GROUPS.md` för den fullständiga
motiveringen och testtäckningen.

## Syfte

Innan viktning, levels eller lagring för spelifiering bestäms behöver appen kunna mäta
och sammanställa faktisk användaraktivitet — för att kontrollera om modellen faktiskt
kan skilja meningsfullt arbete från råa klick. Den här prototypen gör **bara** det:
samlar och sammanställer, visar ingenting för användaren, sparar ingenting mellan
sessioner.

## Var den finns — och var den inte finns

| Fil | Innehåll |
|---|---|
| `apps/app/activity-prototype-core.js` | Ren, DOM-fri tillståndsmaskin. Samma UMD-mönster som `sim-core.js` — testas i Node (`tests/activity-prototype.test.mjs`) och körs oförändrad i webbläsaren. |
| `apps/app/activity-prototype.js` | Tunn DOM-koppling: Page Visibility, focus/blur, pointerdown/keydown/pointermove-lyssnare, `window.__activityDispatch`, `window.ActivityPrototype`. |

**Endast i DEV.** `apps/app/app.js` injicerar de två skripten dynamiskt via
`document.createElement("script")`, och **bara** om `ENV_CONFIG.environment ===
"development"`. I PROD skapas aldrig skripttaggen — webbläsaren begär aldrig filerna,
så det uppstår ingen extra nätverkstrafik alls (inte ens ett 404-svar). Som extra skydd
kopierar `tests/lib/build-prod.mjs` aldrig de här två filerna till `dist/prod/` —
`tests/build-preview.mjs prod` kopierar bara en fast lista kärnfiler
(`index.html`, `app.js`, `sim-core.js`, `README.md`) plus det som härleds från
`catalog.prod.json`. Verifierat både med automatiska tester (statisk källkontroll) och
en riktig PROD-förhandsvisning i webbläsaren: `window.ActivityPrototype` och
`window.__activityDispatch` existerar inte där, och nätverksfliken visar noll anrop mot
`activity-prototype*.js`.

`app.js`s koppling till modulen är genomgående **tunn och guardad**:
```js
function activityDispatch(type, meta) {
  if (typeof window.__activityDispatch === "function") {
    try { window.__activityDispatch(type, meta); } catch (err) { /* tyst */ }
  }
}
```
Om modulen saknas, inte hunnit ladda än, eller kastar ett internt fel — simulatorn
fungerar exakt likadant ändå. Ingen av appens befintliga funktioner är beroende av
prototypen.

## Aktivitetsmodell

En session räknas som **aktiv** endast när samtliga tre gäller samtidigt:
```
document.visibilityState === "visible"
&& fönstret har fokus (inget blur sedan senaste focus)
&& (nu − senaste aktivitet) < inaktivitetsgränsen
```
Så snart fliken döljs eller fönstret tappar fokus pausas tidräkningen **omedelbart** —
ingen tid läggs till varken aktiv eller inaktiv hink under den perioden. Se avsnitt 5 i
`GAMIFICATION-XP-ANALYS.md` för det fullständiga resonemanget kring varför Idle
Detection API inte används.

**Inaktivitetsgräns:** 60 sekunder (startvärde — en tuningparameter, ändras via
`window.ActivityPrototype.config({ inactivityThresholdMs: ... })` under utveckling).

**Tidsmodell:** helt händelsekällad (`settle()`), ingen `setInterval`. Varje anrop till
modulen (en aktivitetssignal, en visibility/focus-ändring, eller `summary()`) räknar
först ut hur mycket tid som förflutit sedan senaste avräkningen och fördelar den mellan
aktiv/inaktiv/opåräknad utifrån tillståndet *vid den tidpunkten* — inklusive att korrekt
dela ett intervall som passerar 60-sekundersgränsen mitt i. Se
`apps/app/activity-prototype-core.js` (`settle`) för implementationen.

## Pointermove

Strypt till högst en accepterad aktivitetssignal var 5:e sekund (konfigurerbart).
Skapar **aldrig** en egen råhändelserad, lagrar **aldrig** koordinater eller
rörelsesträcka, ger **aldrig** XP och räknas **aldrig** som en pedagogisk aktivitet —
bara en förnyelse av "användaren är fortfarande här"-timern. Strypningen sker som en
tidsjämförelse allra först i handlern, inte via `{ passive: true }` (den flaggan
påverkar bara om webbläsaren behöver vänta på handlern innan den skrollar/ritar om).

## Hjälptexter

Fullständig inventering (23 fysiska knappar, 24 distinkta `helpId`, `k`/`kv` delar
knapp men räknas separat vid klicktillfället) finns redan i
`docs/planning/GAMIFICATION-XP-ANALYS.md` avsnitt 7. Prototypen registrerar
`help_opened` med `helpId`, tidsstämpel relativt sessionsstart, aktuellt scenario/
lärstig/steg, och om det är första öppningen av just det `helpId`:t i sessionen. Ingen
dwell-time krävs (avsiktligt, se samma analysavsnitt för motiveringen).

## Distinkt konfiguration — 5-procentsregeln och dess begränsning

En parameterändring räknas som betydelsefull om den är minst 5 % (tuningparameter, ett
enda ställe i koden: `distinctConfigRelativeThreshold`) av parameterns tillåtna
intervall (`max − min`, lästa direkt från fältets DOM-attribut).

**Verifierad begränsning:** endast `sp`, `umin`, `umax` och `manualOutput` har både
`min`- och `max`-attribut i `apps/app/index.html` (samtliga 0–100). Fälten `k`, `t`,
`l`, `kp`, `ti`, `td`, `noise`, `pulseMag` och `pulseDuration` har bara `min`, inget
`max` — de är öppna uppåt. "5 % av tillåtet intervall" går inte att räkna ut för dessa.
**Fallback:** 5 % relativ ändring mot föregående värde för just det fältet
(`|nytt − gammalt| / |gammalt|`, med specialfall för `gammalt === 0`). Detta är en
dokumenterad avvikelse från en bokstavlig tolkning av "intervall" — se
`fieldChangedSignificantly()` i `activity-prototype-core.js`. Kategoriska parametrar
(`mode`, `processType`) räknas som ändrade vid vilken skillnad som helst.

En konfiguration räknas bara som **distinkt** efter att den använts i ett **genomfört**
försök (se nedan) — att bara ändra ett fält utan att köra det räcker inte.

## Genomfört försök

Prototypregeln (inte en avancerad reglerteknisk bedömning): ett försök inom en kontext
(scenario, eller lärstig+steg om en lärstig är aktiv) räknas som **genomfört** när
minst 20 simulerade steg körts under samma konfiguration, **avbrutet** om färre steg
körts innan kontexten eller konfigurationen byts, och **pågående** om det fortfarande
samlar steg när en sammanställning görs. Försöket avslutas (finaliseras) av: reset, en
betydelsefull konfigurationsändring, byte av scenario, byte av lärstegskontext, eller
att en ny kontext blir aktuell. `tests/simulation/`s befintliga
`settledStep`/`reachedSpStep`-begrepp återanvändes **inte** direkt — det hade krävt att
webbläsarappen kopplas mot testkodens analysbibliotek, en olämplig koppling för en
DEV-only aktivitetsprototyp. Den enkla 20-stegsregeln användes istället, i linje med
uppdragets instruktion om att dokumentera den avvägningen.

## Jämförelsepar

När en kontext får sin **andra** (eller senare) distinkta, genomförda konfiguration
jämförs den mot den senast bekräftade distinkta konfigurationen i samma kontext, och
vilka fält som skiljde loggas. Inga fullständiga rådataserier sparas — bara vilka
fältnamn som ändrades.

**Grupp-jämförelser över kontextgränser (GAM-003A.2):** ett lärstigssteg kan
deklarera `comparisonGroup: "<id>"` (satt i lärstigens JSON, skickat av `app.js`
i `learning_step_reached`). När ett steg med ett sådant fält får en NY distinkt
konfiguration jämförs den mot den senast registrerade distinkta konfigurationen
i HELA gruppen (`session.comparisonGroups`) — oavsett vilken kontext den kom
från. Är den senaste från en ANNAN kontext registreras ett gruppjämförelsepar
(`session.groupComparisonPairs`); är den från SAMMA kontext görs ingenting (paret
är redan räknat ovan) — bara "senaste"-pekaren uppdateras. En grupp med fler än
två försök jämförs alltid bara mot det senaste, aldrig alla kombinationer (fyra
försök ger tre kedjade par, inte sex). `comparisonGroups`/`groupComparisonPairs`
återställs varje ny session (ingår inte i någon persistens) — en ny session kan
alltså generera samma gruppjämförelse igen, i linje med GAM-003A.1:s
repetitionsprincip. Se `docs/reports/GAM-003A.2_COMPARISON-GROUPS.md`.

## Mät K/T/L

`measurement_started` loggas när verktyget aktiveras, `measurement_adjusted` bara vid en
faktisk justering av en mätlinje/mätpunkt, `measurement_facit_opened` separat och räknas
aldrig som mätarbete.

## Lärstigsprogression

Högsta uppnådda stegindex spåras per lärstig under sessionen. Bakåtnavigering till ett
redan uppnått steg räknar inte som nytt framsteg (verifierat i både enhetstest och en
riktig webbläsarsession, se nedan).

## Integritet

Lagrar **aldrig**: muskoordinater, rörelsesträckor, tangentvärden, textinnehåll,
användarnamn, e-post, IP-adress eller annat som identifierar användaren. All data ligger
i minnet och försvinner vid sidladdning — samma princip som redan gäller `pathScore` i
det avstängda Test-läget, som heller aldrig sparats till `localStorage`. Ingen
nätverkstrafik. Verifierat både med automatiska strukturella källkodstester
(`tests/activity-prototype.test.mjs`, punkt 28–29) och manuellt (nätverksflik tom i
PROD-förhandsvisningen).

## Konsolkommandon (DEV, webbläsarkonsolen)

```js
window.ActivityPrototype.summary()      // sessionssammanställning, se fältlista nedan
window.ActivityPrototype.events(20)     // senaste 20 råhändelserna (felsökning)
window.ActivityPrototype.reset()        // startar en ny, tom session
window.ActivityPrototype.config({ inactivityThresholdMs: 15000 })  // tunable under utveckling
```

`summary()` returnerar bland annat: `openSessionMs`, `activeMs`, `inactiveMs`,
`inactivityPeriodCount`, `averageInactivityPeriodMs`, `acceptedActivitySignals`,
`pointermoveAcceptedCount`, `eventCounts` (per händelsetyp), `attempts` (started/
completed/aborted/ongoing), `distinctConfigCount`, `comparisonPairCount`,
`help.uniqueHelpIds`/`reopenCount`, `learningPaths` (högsta stegindex per lärstig). Inget
XP-värde ingår.

## Hur en testsession genomförs

1. Bygg och starta DEV-förhandsvisning: `node tests/build-preview.mjs dev` följt av
   `python -m http.server 8000 --directory dist/dev`.
2. Öppna `http://localhost:8000/`, öppna webbläsarkonsolen.
3. Använd appen normalt — ladda en lärstig, stega, ändra parametrar, öppna hjälptexter.
4. Kör `window.ActivityPrototype.summary()` för en ögonblicksbild.
5. `window.ActivityPrototype.reset()` för att börja om utan att ladda om sidan.

## Kända begränsningar

- **5 %-regeln för fält utan `max`-attribut är en relativ-ändring-fallback**, inte
  bokstavligen "5 % av tillåtet intervall" (se ovan) — påverkar `k`, `t`, `l`, `kp`,
  `ti`, `td`, `noise`, `pulseMag`, `pulseDuration`.
- **"Genomfört försök" är en enkel 20-stegsregel**, ingen reglerteknisk bedömning av om
  processen faktiskt stabiliserats.
- **`help_opened` har ingen dwell-time-filtrering** — ett snabbt genomklick av alla 24
  hjälptexter registreras identiskt med att läsa dem noggrant (medvetet, se
  `GAMIFICATION-XP-ANALYS.md` avsnitt 7 för varför).
- **Jämförelsepar bildas bara mot närmast föregående distinkta konfiguration**, inte
  alla möjliga par i en kontext.
- **`hysteresLower`/`hysteresUpper` ingår inte** i de spårade parametrarna (följer
  GAM-001:s ursprungliga lista över "minst" dessa fält).
- **Grafmarköravläsning (`pointermove`/crosshair) ger ingen egen händelse ännu** — bara
  aktiv-tid-signal, samma princip som `help_opened`. PO:s feedback (via HOTFIX-v1.4.1)
  är att en framtida dwell-baserad läsaktivitet är önskvärd utan att belöna zoomning
  eller vanlig rörelse — se `GAMIFICATION-XP-ANALYS.md` avsnitt 15.

## Frågor som ska utvärderas manuellt (inte besvarade av koden själv)

Dessa kräver att prototypen faktiskt används under en riktig lärstigsgenomgång, inte
bara en teknisk verifiering:

1. Känns 60 sekunder rätt, eller pausar klockan för ofta/sällan under normal, tankfull
   användning?
2. Hur mycket aktiv tid innehåller en verklig lärstigsgenomgång — är kvoten aktiv/öppen
   tid rimlig?
3. Ger 5 %-regeln (och dess relativa fallback) ett rimligt antal räknade
   konfigurationer, eller räknas för mycket/för lite som "nytt"?
4. Är hjälptextsanvändningen koncentrerad eller utspridd, och klickas de igenom snabbt
   (tyder på spam) eller med rimliga mellanrum?
5. Fångar kategorierna (genomfört försök, distinkt konfiguration, jämförelsepar,
   genomförd mätning, slutfört steg/lärstig) det PO/PM faktiskt vill belöna?

Se `docs/planning/GAMIFICATION-XP-ANALYS.md` avsnitt 11 för sammanhanget.
