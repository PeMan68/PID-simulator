# FEAT-042 — Implementation: Parameterstyrning + olinjär ventilkarakteristik

**Datum:** 2026-09-18
**Uppdragsgivare:** PO
**Branch:** `feature/FEAT-042-parameterstyrning-ventilkarakteristik` (INTE mergad — väntar på
PO-beslut efter granskning, enligt uppdraget)
**Underlag:** `docs/reports/STRAT-003_DESIGN-PARAMETERSTYRNING-VENTILKARAKTERISTIK.md`
(primär specifikation)

---

## 1. Sammanfattning

Implementerat enligt STRAT-003: en delad, fast 3-zons brytpunktsmekanism i
`sim-core.js`, använd av både regulatorns Kp/Ti/Td-schema (Parameterstyrning) och
processens K-schema (olinjär ventilkarakteristik). 12 nya UI-fält (dolda tills
respektive kryssruta aktiveras), grafhjälplinjer för brytpunkterna, statusradsavläsning
av aktiv zon, ny lärstig (7 steg) och nytt övningsdokument (4 uppgifter). Helt
bakåtkompatibelt — samtliga 24 tidigare scenarier verifierat oförändrade.

**15 testsviter gröna, 0 regressioner** (fullständig lista i avsnitt 4).
**Simuleringsverifierat** demo-scenario och samtliga siffror i lärstigen och
övningsdokumentet (avsnitt 5).
**Fyra dokumenterade avsteg från STRAT-003** (avsnitt 6), samtliga simuleringsdrivna
och till fördel för robusthet/tydlighet — inga oavsiktliga avvikelser.
**Rekommendation:** redo för PO:s granskning; se avsnitt 7 för kvarstående
verifieringsbehov (webbläsartest) innan ett mergebeslut.

---

## 2. Vad är byggt

### 2.1 Simuleringskärnan (`apps/app/sim-core.js`)
- `scheduleZone(x, bp1, bp2)` / `scheduledValue(zones, bp1, bp2, x)` — delad,
  exporterad hjälpmekanism (STRAT-003 avsnitt 1.1).
- `PIDController`: nytt `gainZone`-fält (spårar aktiv zon, nollställs i `reset()`).
- `Simulation.step()`: regulatorns kp/ti/td hämtas från `controller.gainSchedule`
  när aktiverat, annars oförändrat från de platta fälten. Bumplös övergång vid
  zonbyte återanvänder `bias`/`biasFadeSteps`/`biasFadePerStep` — samma fält som
  manuell/auto-bytet redan använder.
- `ProcessModel.effectiveK(ud)`: processens K hämtas från `process.nonlinearGain`
  när aktiverat OCH `type === "self_regulating"`, annars `cfg.K` oförändrat.

### 2.2 UI (`apps/app/index.html`, `apps/app/app.js`)
- Regulator-gruppen: kryssruta "Parameterstyrning" + 11 fält (2 brytpunkter, 3×
  Kp/Ti/Td), dolda som grupp tills aktiverad. Döljs helt i manuellt/OnOff/P-läge
  (samma mönster som `antiWindup`).
- Process-gruppen: kryssruta "Olinjär ventilkarakteristik" + 5 fält (2 brytpunkter,
  3× K), synlig bara för processtyp Självreglerande.
- `hydrateFields()`: förifyller båda scheman med scenariots ordinarie värden vid
  varje scenariobyte, så aktivering aldrig ger ett oväntat hopp.
- `syncParamsFromUI()`: läser fälten, tvingar brytpunktsordning (samma
  min/max-mönster som `u_min`/`u_max`).
- Statusrad: kompakt zonavläsning ("Zon 2 (Kp=1.8)" / "K-zon 3 (K=2.5)"), beräknad
  direkt från scenario + aktuellt PV/u — inte från `sim.pid.kp`, för att alltid
  stämma även innan nästa steg körts.
- Graf: brytpunkter ritas som hjälplinjer — regulatorns i övre panelen (PV-axeln),
  processens i nedre panelen (u-axeln) — samma stil som FEAT-038.
- Markeringslinjen (FEAT-030) triggar när ett schema slås på/av eller ändras.
- 8 nya hjälptexter i `help.json`.

### 2.3 Innehåll
- `content/scenarios/valve-nonlinear-gain-demo.json` — nytt demoscenario.
- `content/theory/parameterstyrning-ventilkarakteristik.v1.json` — ny teorimodul.
- `content/exercises/parameterstyrning-ventilkarakteristik.v1.json` — ny lärstig,
  7 steg, insatt mellan `pi-pid.v1` och `processbegransningar.v1`.
- `docs/exercises/ovningar-parameterstyrning.md` — nytt fristående övningsdokument,
  4 uppgifter (2 grundläggande, 2 utforskande), samma mönster som
  `ovningar-reglerstrategier.md`.
- `catalog.json` uppdaterad (v1.5.3→v1.5.4), `catalog.prod.json` **oförändrad** —
  featuren är DEV-only tills PO beslutar om produktionsaktivering.

---

## 3. Simuleringsverifiering — vald process, K-värden och varför

Demoscenariot (`valve-nonlinear-gain-demo.json`) är den process
lärstigen och samtliga fyra övningsuppgifter bygger på:

- **Process:** Självreglerande, K=1.3 (grundvärde, oanvänt när schemat är aktivt),
  T=15, L=0. Olinjär ventilkarakteristik: brytpunkt 25/65, K=[0.5, 2.5, 2.5] — en
  medveten **tvåstegsprofil** (zon 2 och 3 delar värde) snarare än tre inbördes
  olika K-värden.
- **Varför tvåstegsprofil, inte tre olika K-värden:** verifierat via
  `tests/simulation/cli.mjs` att jämviktsekvationen `SP = K(u_ss) × u_ss` för en
  process med STIGANDE K gör vissa zoner matematiskt oåtkomliga som stabil
  slutpunkt för rimliga SP-värden (0–100) om alla tre zoner har inbördes olika K —
  se avsnitt 6.3. En tvåstegsprofil (två urskiljbara beteenden, tre zoner i
  datastrukturen) undviker detta helt och ger en robust, förutsägbar demo.
- **Regulator:** PI (Td=0 genomgående i demot — Td visade sig orsaka svårförklarad,
  hoppig respons vid stora SP-steg i kombination med den olinjära processen; PI
  räcker för att visa poängen och matchar hur klassiska gain-scheduling-exempel
  vanligen presenteras).

**Verifierade nyckeltal** (samtliga från faktiska simuleringskörningar, inte
uppskattade):

| Inställning | SP=10 (svag zon, K=0.5) | SP=90 (stark zon, K=2.5) |
|---|---|---|
| Kp=1.2 (ingen styrning) | Insvängd efter 146 steg | Insvängd efter 50 steg |
| Kp=3 (manuell kompromiss) | Insvängd efter 84 steg | Insvängd efter 39 steg |
| Kp=8 (för aggressivt, se 6.4) | 40 % översläng | — |
| Parameterstyrning (Zon1 Kp=5, Zon2/3 Kp=1.2) | Insvängd efter 68 steg | Insvängd efter 60 steg |

Parameterstyrningen ger den svaga zonen en **53 % kortare** insvängningstid (146→68
steg) jämfört med den ostyrda baslinjen, samtidigt som den starka zonen förblir ren
(0 % översläng, jämförbar tid). Ingen enskild manuellt vald Kp (testat 1.2–8) ger
båda zonerna lika bra prestanda samtidigt utan att någon av dem antingen är
onödigt trög eller börjar överslänga.

Uppgift 2:s och Uppgift 4:s övriga K-/Kp-kombinationer (0.9/1.7, 0.2/4.0,
Zon1-svep 2/3/5/8, Zon3-svep 1.0/0.7/0.5) är samtliga körda och verifierade —
inklusive att K-paret 0.2/4.0 medvetet **inte** är stabilt (används i Uppgift 2 för
att låta studenten själv upptäcka gränsen för hur olinjär en process kan vara innan
schemaläggningens egna zonbyten börjar orsaka oönskat beteende).

---

## 4. Tester

**Ny testsvit:** `tests/feat-042-gain-schedule.test.mjs`, 24 kontroller — ren
JS-nivå (`scheduleZone`/`scheduledValue`), regulatorschema (bakåtkompatibilitet,
korrekt zon/kp, bumplös övergång, `reset()`), processchema (bakåtkompatibilitet,
korrekt K, ignoreras korrekt för `integrating`), kontinuitet (inget PV-hopp vid
K-zonbyte).

**Fullständig regression, samtliga gröna (0 FAIL):**

| Svit | Resultat |
|---|---|
| `validate-content.mjs` (DEV) | ✓ Inga referensfel |
| `validate-content.mjs` (PROD) | ✓ Inga referensfel (nytt innehåll korrekt uteslutet) |
| `validate-prod.mjs` | ✓ PROD-urval oförändrat |
| `hotfix-2026-014-bumpless-reset.test.mjs` | 7/7 |
| `hotfix-v1.4.1-facit-env.test.mjs` | 14/14 |
| `feat-042-gain-schedule.test.mjs` (ny) | 24/24 |
| `simulation/analyze.test.mjs` | 11/11 |
| `activity-prototype.test.mjs` | 52/52 |
| `build-preview.test.mjs` | 10/10 |
| `gamification/xp-model.test.mjs` | 43/43 |
| `gamification/gamification-engine.test.mjs` | 64/64 |
| `gamification/gamification-store.test.mjs` | 20/20 |
| `gamification/gamification-session-finalization.test.mjs` | 15/15 |
| `gamification/gamification-dev-prod-isolation.test.mjs` | 21/21 |
| `gamification/gamification-reset-isolation.test.mjs` | 10/10 |
| `gamification/comparison-groups-content.test.mjs` | 23/23 |

`tests/build-preview.mjs dev`/`prod` byggda och kontrollerade manuellt: nytt
innehåll finns i `dist/dev/`, är **frånvarande** i `dist/prod/` — featuren läcker
inte till produktionsartefakten.

---

## 5. Avsteg från STRAT-003

Fyra avsteg, samtliga upptäckta och motiverade under simuleringsverifiering — inte
godtyckliga ändringar:

1. **Bumplös övergång vid zonbyte fasas INTE ut redan på det utlösande steget.**
   STRAT-003 sa "återanvänd exakt samma mekanism" som lägesbytets bumplösa
   övergång. Den mekanismen konsumerar av konstruktion en fasningsandel redan
   första gången den används (satt av `app.js` INNAN nästa `step()`-anrop). Eftersom
   zonbytet upptäcks och startas INOM samma `step()`-anrop skulle samma ordning ha
   gett en omedelbar, delvis "för tidig" urholkning av kompensationen — verifierat
   ge upp till ~90 % avvikelse i `u` vid stora Kp-hopp
   (`tests/feat-042-gain-schedule.test.mjs`, testfall 4). Löst genom att hoppa över
   just den första nedräkningen för ett NYSTARTAT zonbyte. Samma fält
   (`bias`/`biasFadeSteps`/`biasFadePerStep`) återanvänds fortfarande — bara
   tidpunkten för första nedräkningen skiljer sig, och bara för zonbyten (inte för
   lägesbytets befintliga flöde, som är orört).
2. **Grafens brytpunktslinjer är horisontella, inte vertikala.** STRAT-003 skrev
   "vertikala hjälplinjer" men hänvisade samtidigt till "exakt samma mönster" som
   FEAT-038 — vars linjer är horisontella (ett fast PV-/u-tröskelvärde genom hela
   tidsaxeln). Implementerat horisontellt, i linje med den uttryckliga
   referensen — en terminologikorrigering, ingen designändring.
3. **Demoscenariot använder TVÅ separata, jämförbara körningar (samma
   `comparisonGroup`-mönster som redan finns i appen) istället för EN
   sammanhängande körning som passerar båda brytpunkterna.** Simulering visade att
   ett naivt K(u)-schema (K stigande i alla tre zoner, en enda stor SP-stege) ger
   jämviktsekvationer som inte går att lösa inom 0–100 för flera zoner samtidigt
   (se 6.1) — resultatet blev antingen ouppnåeliga zoner eller "zonhack" (u
   studsar mellan zoner i en ihållande gränscykel). Två separata, väl valda SP-mål
   (10 och 90) ger samma pedagogiska poäng utan den risken, och matchar dessutom
   ett redan etablerat, beprövat mönster i övrig lärstigsdesign
   (`processbegransningar.v1`).
4. **Demoscenariots K-schema har en tvåstegsprofil (zon 2=zon 3), inte tre
   inbördes olika värden**, av samma skäl som punkt 3 — se avsnitt 6.3. Mekanismen
   stöder fortfarande tre fullt oberoende zoner; det är bara den här SPECIFIKA
   innehållsfilen som väljer att inte utnyttja det fullt ut, för att hålla
   demonstrationen robust.

Utöver dessa: **Parameterstyrning döljs och stängs av automatiskt i
manuellt/OnOff/P-läge** (P saknar Ti/Td att schemalägga meningsfullt) — inte
explicit specificerat i STRAT-003, men samma mönster som `antiWindup` redan
använder i just de lägena.

---

## 6. Tekniska fynd värda att känna till (inte avsteg, men bakgrund)

### 6.1 Jämviktsekvationens begränsning för stigande K-scheman
För ett schema där K ökar med u finns en matematisk gräns för vilka SP-värden som
kan ge en stabil jämvikt i en given zon: `SP = K_zon × u_zon` måste falla inom just
den zonens u-intervall. Med breda K-spann (t.ex. 0.3/3.0) blir stora delar av
0–100-intervallet ouppnåeliga i NÅGON zon, vilket ger ihållande gränscykler
("zonhack") snarare än en stabil insvängning. Det här är en verklig, förväntad
egenskap hos diskreta olinjära K-scheman — inte en bugg — men avgörande att känna
till vid design av framtida scenarier med den här funktionen.

### 6.2 Td orsakade svårtolkad respons i kombination med olinjär K
Vid tidig verifiering med PID (Td=3) och stora SP-steg gav kombinationen av hög
momentan derivata och ett K-hopp mycket "hackig" utsignal (stora växlingar i u
under de första stegen) utan att det tillförde någon tydlig pedagogisk poäng.
Demoscenariot använder därför PI (Td=0) genomgående. Detta utesluter inte att
Parameterstyrning/PID kan fungera bra tillsammans i andra, mer specifikt
avstämda scenarier — bara att det inte var rätt val för DETTA introduktionsexempel.

### 6.3 Varför demots K-profil är tvåstegs, inte tre distinkta värden
Se avsnitt 5, punkt 4 — direkt konsekvens av 6.1.

### 6.4 Zon1 Kp=8 som en medveten "för långt"-datapunkt
I Uppgift 4 (övningsdokumentet) är Kp=8 för Zon 1 en avsiktligt vald,
simuleringsverifierad datapunkt som ger 40 % översläng (mot 0 % vid Kp=5) — den
demonstrerar att gain-schedulingens frihet (hög Kp i en enskild zon) fortfarande
har en övre gräns, inte att höga Kp-värden alltid är säkra bara för att de är
zonspecifika.

---

## 7. Rekommendation

**Redo för PO:s granskning på branchen.** Inget mergat till `develop` eller `main`,
enligt uppdraget.

**Kvarstående, inte åtgärdat i detta uppdrag:**
- **Ingen webbläsartest genomförd** — ingen webbläsare tillgänglig i den här
  miljön (samma begränsning som noterats i tidigare leveranser, t.ex.
  `RELEASE-v1.5.1`). De 12 nya fältens visning/döljning, statusradens
  zonavläsning och grafens brytpunktslinjer är verifierade genom kodgranskning
  och (för simuleringsdelen) via `tests/simulation/`, men **inte** genom att
  faktiskt öppna appen. PO bör göra en snabb manuell genomgång av lärstigen och
  minst en av övningsuppgifterna i en riktig webbläsare innan ett mergebeslut.
- Ingen production-aktivering föreslagen eller förberedd (`catalog.prod.json`
  oförändrad) — matchar etablerat mönster där produktionsaktivering är ett eget,
  senare PO/PM-beslut efter att en feature testats i DEV.
- `APP_VERSION`/content-changelog inte uppdaterade — matchar att detta INTE är en
  release, bara en granskningsbar branch.
