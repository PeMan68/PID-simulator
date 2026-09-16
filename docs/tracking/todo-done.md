# Feature Backlog — Klara

Features som är implementerade, testade och mergade till `develop`.
Öppna features finns i [todo.md](todo.md).

---

## Python-app (`main.py`) — nedlagd

Python-appen läggs ner, se BESLUT-002 i [todo.md](todo.md). Följande features stängs
**utan implementation** — de kommer aldrig byggas.

### FEAT-006 — Utökad historik — jämförelse och export
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-008 — Utökad tooltip-funktionalitet
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-012 — Optimerad graf-rendering
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-013 — Förbättrad export-funktionalitet
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-014 — Unicode/emoji-kompatibilitet
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-015 — Förbättrad dialog-positionering
**Status:** Stängd — nedlagd, se BESLUT-002

### FEAT-016 — Förbättrad hysteresis-visualisering (OnOff)
**Status:** Stängd — nedlagd, se BESLUT-002

---

## Webbapp (`apps/app/`)

### FEAT-037 — Övningsdokument "Reglerstrategier"
**Branch:** `feature/reglerstrategier` (mergad till `develop`)
**Beskrivning:**
Nytt fristående övningsdokument (`docs/exercises/ovningar-reglerstrategier.md`), samma
mönster som `ovningar-systemoptimering.md`: uppgifter i lösbladsform, inte en guidad
lärstig. Tränar *vilken reglerstrategi man väljer och varför* — regulatortyp (P/PI, med
PID:s avvägningar i Uppgift 2 Fall C), aggressivitet (Lambda-metoden), dötid,
integrerande process, windup och prioritering börvärdesföljning/störningsavvisning.
Sju uppgifter (varav en mästaruppgift, ett sammanfattande PM). Bygger enbart på
funktioner som redan fanns i webbappen.

Ett facit (`docs/exercises/facit-reglerstrategier.md`) togs fram parallellt, verifierat
mot faktisk simulering (`apps/app/sim-core.js` kört i Node via
`tests/simulation/lib/analyze.mjs`, seed=42). Verifieringen hittade och rättade flera
sakfel innan publicering: fel processförstärkning i Uppgift 2, orealistiskt kraftiga
standardpulsstorlekar (appens pulsmagnitud läggs till PER STEG, inte engångs — lätt att
missbedöma), samt att HELA facit inledningsvis använde ett löst/odokumenterat
toleransband för "insvängningstid" som gav missvisande jämförelser mellan strategier.
Facit standardiserades till ett enhetligt, dokumenterat 2 %-toleransband
(`analyze.mjs`s standardvärde) innan publicering.

PO gjorde flera manuella redigeringsomgångar (skärpte acceptanskriterier och vilka
mätvärden studenten ska notera, bytte Uppgift 1 Fall A:s exempel från "Nivåprocess" till
"Temperaturprocess" för att inte krocka med Uppgift 4:s nivå=integrerande-lektion, tog
bort kvarvarande referenser till andra övningsdokument för att göra dokumentet
självständigt). CC byggde ut Uppgift 2 med en ny Fall C (Td-svep, simulatorverifierad:
lagom Td≈1 eliminerar överslängen och mer än halverar insvängningstiden med försumbar
bruskostnad, medan överdrivet Td gör allt sämre samtidigt) och flyttade dit
brus/D-dels-undersökningen från Uppgift 1.

Facit renskrevs slutligen helt (all historik/motivering om vad som rättades och varför
togs bort) för att matcha det färdigredigerade övningsdokumentet exakt.
**Status:** Klar, mergad till `develop`. Publicerad till `main` 2026-09-15 (se
`CHANGELOG.md`) — ren dokumentation, ingår inte i PROD-appens byggda innehåll
(`catalog.prod.json`) eftersom det är ett fristående lösblad, inte en lärstig.

---

### FEAT-041 — Reglerstrategier: uppdela i grund- och fördjupningsdokument
**Beskrivning:**
PO:s beslut efter genomläsning av de gamla Python-app-övningarna
(`ovningar-grundlaggande.md` v1.7.0, `ovningar-systemoptimering.md` v1.7.0,
`ovningar-signalstorningar.md` v1.6.1 — alla tre bekräftat Python-app-era: gamla
funktionsnamn som "Spara"/"Autopaus"/"Spärrning"/preset-knappar som inte finns i
webbappen, "amplitude"-terminologi utan medvetenhet om att pulsmagnitud läggs till
PER STEG): `ovningar-reglerstrategier.md` blir **grunddokumentet** (en bas som ger
alla studerande en känsla för samtliga sex strategiområden), och ett nytt
`ovningar-reglerstrategier-fordjupning.md` blir en **separat, svårare** fortsättning
för snabba/nyfikna studerande — inte "fler grunduppgifter", utan uppgifter med
mindre facit-styrning (process + driftkrav givet, testplan och val av mätvärden upp
till studenten själv).

**Innehållsanalys av de gamla dokumenten** visade att det mesta redan är absorberat
(grundläggande Del 1-5 → lärstigarna; systemoptimerings Lambda-avsnitt och
Masterövning → redan i reglerstrategiers Uppgift 2/Mästaruppgift 7;
signalstorningars störnings/D-avvägning → redan i Uppgift 2 Fall C). Fyra genuint
nya/djupare moment byggdes för fördjupningsdokumentet, alla simulatorverifierade:
1. **Ziegler-Nichols-metoden** (helt saknad tidigare) — Ku≈4,2, Tu≈20s på samma
   process som grund-Uppgift 2; jämförelse mot Lambda-metoden visar att ZN PI
   faktiskt slår Lambda Aggressiv på båda måtten samtidigt — en äkta,
   icke-uppenbar poäng.
2. Fullständig P/PI/PID-tabell (aggressiv + säker variant) på grunddokumentets
   integrerande process — icke-uppenbar poäng: Td hjälper INTE på den här
   processen, till skillnad från Uppgift 2 Fall C, eftersom dötiden här är liten
   relativt tidskonstanten.
3. Stegvis allt hårdare utsignalgräns, hur mycket måste man detune:a — icke-uppenbar
   poäng: detuning hjälper INTE alls mot windup — endast anti-windup gör det,
   oavsett hur hård utsignalgränsen är.
4. Kombinerad brus+puls-stresstest — icke-uppenbar poäng: den "vinnande" omtrimmade
   inställningen från Uppgift 6 har mer än dubbelt så hög bruskänslighet som
   originalinställningen — en dold kostnad som bara syns när brus och puls testas
   tillsammans.

**Övrigt PO-önskemål (genomfört):** grunddokumentets uppgifter fick ifyllningsbara
mätprotokoll-tabeller (samma stil som de gamla dokumentens tomma tabeller, avsedda
att skrivas ut och fyllas i för hand) — en tabell per uppgift/fall som redan bad om
flera uppmätta värden.

De tre gamla dokumenten flyttades till `docs/exercises/arkiv/`, var och en med en
kort not överst om varför den är arkiverad och vart innehållet absorberats.
**Status:** Klar, mergad till `develop`. PO har granskat och godkänt både
grunddokumentet och fördjupningsdokumentet (inkl. facit) i sin helhet (2026-09-16).

---

### FEAT-039 — Kort introduktionsdokument för studerande + discoverability-knapp
**Branch:** `feature/app-introduktion` (mergad till `develop`)
**Beskrivning:**
PO efterfrågade en kort, fristående text studerande kan läsa innan de öppnar appen — så
PO slipper förklara appen muntligt varje gång. Ny fil `docs/exercises/introduktion.md`:
kort syftesbeskrivning, en punktlista över vad appen kan idag, och en pekare till den
redan befintliga inbyggda lärstigen "Kom igång med PID Simulator" plus en numrerad
översikt över samtliga sju publicerade lärstigar i ordning. Omfattar **endast** appens
inbyggda innehåll — PO beslutade att fristående övningsblad (`ovningar-*.md`) inte ska
nämnas i detta dokument.

**Arkivering av Python-app-material:** `docs/exercises/README.pdf` (användarmanual för
den nedlagda Python-appen) flyttad till `docs/python-app-archive/README.pdf` (var aldrig
git-spårad).

**Discoverability löst med en permanent knapp:** "Kom igång"-lärstigen visades tidigare
bara automatiskt en gång per webbläsare. PO valde (via tre föreslagna alternativ)
"permanent knapp i appen" framför att bara förlita sig på dokumentet. Implementerat: ny
knapp `❓ Kom igång` i vänster sidebar (alltid synlig, oavsett tidigare besök), öppnar
samma välkomstruta.

**PO:s granskningsrunda hittade och lät åtgärda två saker innan merge:**
1. Välkomstrutans "Utforska fritt"-knapp gav inget synligt resultat vid klick (laddade
   ett scenario i bakgrunden men lämnade rutan kvar orörd på skärmen) — borttagen helt
   istället för att bygga en egen stängningslogik för ett flöde ingen efterfrågat.
2. **Nytt PO-beslut vid granskningen:** "Kom igång"-knappen döljs automatiskt från nivå 3
   (Signalspanare, gamification-nivåmotorns `levelIndex >= 2`) och uppåt — vid den nivån
   har man kört appen tillräckligt mycket för att introduktionen inte längre behöver vara
   framträdande. Kopplad till `gamification-ui.js`s enda centrala `render()`-funktion
   (körs vid bootstrap, varje nivåflush och progressionsåterställning), så knappen alltid
   speglar aktuell/hållen nivå utan egen polling-logik. Krävde även en `.komigang-btn[hidden]
   { display: none; }`-CSS-regel — samma mönster som redan fanns för
   `.gam-level-info[hidden]`/`.gam-level-toast[hidden]`, annars hade knappens egna
   `display: inline-flex` vunnit över `hidden`-attributet.

Båda granskningsfynden verifierade med Playwright mot en lokal server (nivå 1–2: synlig,
nivå 3–8: dold, återkommer efter "Återställ progression"; välkomstrutan visar bara
"Kom igång »" nu). Inga konsol-/sidfel.

**Status:** Klar, mergad till `develop`, släppt (se `CHANGELOG.md` för versionsnummer).

---

### FEAT-038 — Hjälplinjer 10 %/90 %/2 %-band i Mätläge
**Branch:** `feature/matlage-hjalplinjer` (mergad till `develop`)
**Beskrivning:**
Två nya togglingsbara hjälplinjer i Mätläge, samma mönster som befintlig 63 %-linje:
"Visa 10 %/90 %-linjer (stigtid)" (en gemensam kryssruta, båda linjerna hör ihop som
stigtidsdefinitionen) och "Visa 2 %-toleransband (insvängning)" (ritas som ETT BAND —
övre/undre gräns kring PV∞ — eftersom 2 % definitionsmässigt är ett toleransband, inte
en enkel tröskel som 63/10/90 %). Samtidigt gjordes samtliga hjälplinjer (63 %,
tangentlinjen, de två nya) tunnare och lätt transparenta (`lineWidth 1`,
`globalAlpha 0.6`) så de tydligt skiljer sig visuellt från PV/SP/u-kurvorna — tidigare
var tangentlinjen lika tjock som huvudkurvorna.

Verifierat med Playwright mot en lokal server (skärmdumpar, inga konsolfel) och
`tests/build-preview.test.mjs`.
**Status:** Klar, mergad till `develop`. **Produktionsaktiverad i v1.5.2**
(2026-09-14/15, PO:s beslut, se `CHANGELOG.md`).

---

### FEAT-030 — Lärstig "Störningar och robusthet"
**Branch:** `feature/storningar-robusthet` (mergad till `develop`)
**Beskrivning:**
Ny 7-stegs lärstig (`storningar-robusthet.v1`, 1 teori + 6 scenario) om mätbrus,
pulsstörning och P/PI/PID-robusthet, baserad på källmaterialet i
`docs/exercises/ovningar-signalstorningar.md`. Återanvänder befintliga
`pid-disturbance-noise.json`/`pid-pulse-rejection.json` — inga nya scenariofiler. Ny
teorimodul `disturbance-robustness.v1.json`.

Två nya, generella appfunktioner tillkom under PO:s testomgång:
- **Markeringslinje i grafen** vid varje betydelsefull parameterändring (regulatorläge,
  Kp/Ti/Td, brus, SP, process) eller pulstriggning — gör flera faser urskiljbara i en
  kontinuerlig graf istället för att kräva Rensa graf/Återställ mitt i en jämförelse.
- **`continueFromPreviousStep`** (explicit steg-fält, samma mönster som `standalone`/
  `ENV_CONFIG.*`): låter en lärstig fortsätta samma körning/graf över flera steg istället
  för att automatiskt ladda om scenariot vid varje stegbyte. Använt i steg 3–4 för att ge
  en sammanhängande P→P+brus→PI→PID-jämförelse med tre fristående checkpoints bevarade.

Verifierat med Playwright genom hela lärstigsnavigeringen och den fullständiga
Node-testsviten (`validate-content.mjs`, `validate-prod.mjs`, `build-preview.test.mjs`,
`simulation/analyze.test.mjs`) — samtliga gröna. PO har testat och godkänt branchen.
**Status:** Klar, mergad till `develop`. **Produktionsaktiverad i v1.5.0**
(2026-09-10, PO:s beslut) — sjunde lärstigen i `catalog.prod.json`, se
RELEASE-v1.5.0-posten.

---

### FEAT-029 — Crosshair horisontell linje
**Branch:** `feature/crosshair-hline`
**Status:** Klar

---

### FEAT-028 — Flerkapacitiv (högre ordningens) självreglerande process
**Branch:** `feature/multi-capacity`
**Beskrivning:**
Nuvarande `self_regulating`-modell är enkapacitiv (FOPDT). En flerkapacitiv process (N kaskadkopplade element) ger ett S-format stegsvar med tydlig inflexionspunkt — mer likt industriella processer och bättre testfall för tangentmetoden.
Modell: N element med tidskonstant T/N vardera. Nytt fält `"order": N` i process-config. Nytt `processType`-alternativ i dropdown. Nytt identifieringsscenario (order=2).
**Status:** Klar

---

### FEAT-027 — Zoom i grafen för exaktare mätavläsning
**Branch:** `feature/graph-zoom`
**Beskrivning:**
Möjlighet att zooma in i PV-grafen för att avläsa exakta värden med crosshairen i mätläge. Scrollhjul + modifieringstangent (Ctrl eller Shift) zoomar horisontellt (t-axeln). Touchpad: tvåfingerspinch-scroll. Zoom-nivå visas och kan nollställas med dubbelklick eller en "Återställ zoom"-knapp.
**Status:** Klar

---

### FEAT-025 — Onboarding: välkomstpanel + intro-lärstig för nya användare
**Branch:** `feature/onboarding`
**Beskrivning:**
Vid första besök visas en välkomstpanel i vänster sidebar med appbeskrivning och knappar "Börja här →" (laddar intro-lärstigen) och "Utforska fritt". Tillståndet sparas i localStorage. Intro-lärstigen "Kom igång med PID Simulator" guidar igenom appens funktioner i 5 steg utan checkpoints: översikt → scenarier → simulering → parametrar/hjälp → lärstigar.
**Status:** Klar

---

### FEAT-024 — Lärstig: Lambda-metoden för självreglerande system
**Branch:** `feature/larstig-lambda`
**Beskrivning:**
5-stegs lärstig för Lambda-metoden (modellbaserad PI-inställning). Kp = T/(K×(λ+L)), Ti = T. Inkluderar ny teorifil, 4 scenarion (open-loop, måttlig/aggressiv/konservativ λ) och lärstigs-JSON.
**Status:** Klar

---

### FEAT-023 — Flytta hjälptexter till redigerbar JSON-fil
**Branch:** `feature/help-json`
**Beskrivning:**
HELP_CONTENT är hårdkodat i app.js (89 rader, 23 poster). Flytta till `content/help.json` och ladda via `fetch()` i `loadCatalog()` — samma mönster som scenarier och lärstigar. Hjälptexterna blir då redigerbara utan att röra app.js.
**Status:** Klar

---

### FEAT-021 — Visa/dölj proportionalband som streckad linje i grafen
**Branch:** `feature/proportionalband`
**Beskrivning:**
Proportionalbandet (PB = 100/Kp %) definierar det PV-intervall som ger full utslagsvariation i regulatorn. Skuggat lila område SP-PB → SP, streckad linje vid SP-PB (u=100%).
**Status:** Klar

---

### FEAT-002 — Varning när SP är ouppnåeligt (SP > y_max)
**Branch:** `feature/sp-uppnabarhet-varning`
**Beskrivning:**
En självreglerande process har ett fysikaliskt tak: y_max = normalValue + K × u_max. Om SP sätts över y_max integrerar PID:en upp u till 100 % men y fastnar — studenter tror att PID:en är felinställd. Behöver en varning i statusraden, t.ex. "⚠ SP ouppnåeligt (y_max=50.0)".
**Status:** Klar

---

### FEAT-020 — Flytta steg-knappar nedanför parametergrupperna
**Status:** Klar

---

### FEAT-019 — Flytta Trigga puls-knappen till Störningar-gruppen
**Status:** Klar

---

### FEAT-018 — Logiska parametergrupper med collapse
**Status:** Klar

---

### FEAT-017 — Versionsinformation i GUI
**Status:** Klar

---

### FEAT-001 — Sidebar för scenario/lärstig-väljare
**Status:** Klar

---

### FEAT-003 — Lärstig: "Processens begränsningar"
**Status:** Klar

---

### FEAT-004 — Steg "Svag process" — byt till PI-scenario
**Status:** Klar
