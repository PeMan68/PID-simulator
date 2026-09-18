# Feature Backlog — Öppna

Nya features registreras här i `develop`-branchen innan en feature-branch skapas.
Varje feature-branch uppdaterar **endast sin egen post** (status, anteckningar).
Klara features flyttas till [todo-done.md](todo-done.md).

---

## Webbapp (`apps/app/`)

### STRAT-001 — Teknisk förstudie: fyra framtida reglerstrategier
**Branch:** `feature/STRAT-001-forstudie-reglerstrategier`
**Prioritet:** Medel — analysuppdrag, ingen implementation
**Beskrivning:**
Uppdrag från PO/PM: teknisk förstudie för fyra möjliga framtida reglerstrategier, i
prioriteringsordning (1) Parameterstyrning (Gain Scheduling), (2) Framkoppling
(Feedforward), (3) Kvotreglering (Ratio Control), (4) Kaskadreglering (Cascade
Control). Analyserar pedagogiskt värde, teknisk komplexitet, påverkan på
simuleringskärnan/UI/scenarioformat/tester, samt gemensam arkitektur som bör införas
tidigt för att minska framtida omarbete — de fyra som en sammanhängande
utvecklingsplan, inte fyra isolerade features. Explicit inget kodarbete.
**Status:** Öppen — uppdrag pågår.

---

### FEAT-040 — Filtrering av mätsignal (dämpning av brus) — long term förbättring
**Prioritet:** Låg — PO:s explicita beslut: långsiktig backlog, inte närmast i kö.
**Bakgrund:**
Uppstod ur PO:s eget test av Uppgift 2 Fall C i `ovningar-reglerstrategier.md`: en
brusig mätsignal (noiseStd≈1.0) håller aldrig PV inom övningarnas 2 %-toleransband,
oavsett Kp/Ti/Td (verifierat: PV utanför bandet ~74 % av tiden vid noiseStd=1.0, eftersom
brusets egen spridning redan är bredare än bandet). Reflektion 2 i övningsdokumentet
förklarar nu att en regulator inte kan "reglera bort" brus i mätningen — men simulatorn
saknar helt verktyg för att visa den RIKTIGA lösningen: filtrering av mätsignalen.
PO:s idé: lägg till ett filter (dämpning av brus) som en ny simulatorfunktion, och bygg
en övning kring vad filtrering gör för regleringen (mindre bruskänslighet, men ny fördröjning/
fasvridning — ett eget avvägningsproblem, parallellt med D-delens brusavvägning i Uppgift 2
Fall C).

**Utredning genomförd (se konversationen 2026-09-15) — två alternativ:**

**Alternativ A — filtrera det regulatorn "ser", rör inte processen (rekommenderas):**
Ett nytt, tillståndsbärande lågpassfilter i `Simulation.step()` i `apps/app/sim-core.js`,
mellan den råa `process.y` och det värde som skickas in i `PIDController.step()`:
```js
const rawPv = this.process.y;
const alpha = Math.min(1, this.dt / filterTau);
this.filteredPv += (rawPv - this.filteredPv) * alpha;
// regulatorn får this.filteredPv istället för rawPv
```
- **Simuleringskärna:** litet, isolerat tillägg (~15 rader), ett nytt valfritt
  scenariofält som default är 0/av — **helt bakåtkompatibelt**, påverkar INGEN
  befintlig scenariofil, lärstig eller redan verifierat facit.
- **UI:** litet — samma etablerade mönster som alla andra parametrar
  (`fields{}`/`syncParamsFromUI()`), ett nytt inputfält + hjälptext.
- **Graf:** medelstort — poängen syns bara om både den råa (brusiga) och den filtrerade
  PV-kurvan kan visas samtidigt (ny historik-serie, ny togglingsbar linje/legend).
  Jämförbart i omfattning med FEAT-038:s hjälplinjer.
- **Övningsinnehåll:** medelstort — kräver simulatorverifierat facit av samma typ som
  Uppgift 2 Fall C:s Td-svep (svep över filterTau, mät u_std vs. insvängningstid/
  översläng, hitta var fördröjningen börjar kosta mer än den ger).
- **Sammanfattning:** litet/lågrisk i simuleringskärnan, medelstort totalt pga graf +
  övningsinnehåll. Ungefär samma storleksordning som FEAT-038 + Uppgift 2 Fall C
  tillsammans.

**Alternativ B — separera "sant" processvärde från "avläst" mätvärde (inte rekommenderat
utan uttryckligt PO/PM-beslut):**
I dagens kod adderas brus direkt till `process.y` (processens EGNA tillstånd, som
sedan bär vidare in i nästa stegs dynamik) — mer likt en verklig processtörning
(turbulens, flödesvariation) än sensor-/mätbrus, trots att uppgiftstexten kallar det
"brusig mätsignal". Ett tekniskt mer korrekt alternativ vore att brus bara ska påverka
det AVLÄSTA värdet (inte processens sanna tillstånd), medan pulsstörningen även
fortsättningsvis påverkar det sanna tillståndet (den ÄR en verklig störning).
- **Detta ÄNDRAR simuleringsresultatet för alla befintliga brusanvändande scenarier**
  (t.ex. `pid-disturbance-noise.json`) och den publicerade lärstigen
  `storningar-robusthet.v1` (i PROD sedan v1.5.0) — kräver omverifiering av tester,
  facit och ev. lärstigsinnehåll som redan är produktionsgodkänt.
- Stort/riskabelt jämfört med Alternativ A. Görs bara om PO/PM uttryckligen bedömer att
  den tekniska korrektheten är värd den risken.

**Rekommendation:** Alternativ A om/när detta plockas upp. Alternativ B sparas som
antecknad möjlighet, inte som plan.
**Status:** Öppen — long term backlog, ej påbörjad, inget uppdrag givet.

---
### BESLUT-001 — Ta ställning till appens namn inför slutlig prod-version
**Prioritet:** Låg (innan release)
**Beskrivning:**
"PID Simulator" är tekniskt korrekt men kan vara exkluderande för nybörjare och speglar inte bredden (On/Off, Lambda-metoden, lärstigar). Kandidater: Reglerlab, PIDlab, Processlabb. Namnbyte kräver: byta repo-namn på GitHub, uppdatera GitHub Pages-URL, uppdatera `<title>`, sidebar-rubrik och `APP_VERSION`-text i appen. Överväg custom domain för stabilt URL.
**Status:** Öppen — beslut krävs

---

### BESLUT-003 — Välj licens för det publika repositoryt
**Prioritet:** Låg
**Beskrivning:**
Upptäckt under DOCS-001 (dokumentationsrevision efter RELEASE-v1.3.0): projektet saknar
en licensfil. Repositoryt är publikt sedan tidigare, men ingen `LICENSE`/`LICENCE.md`
finns, och ingen licens är dokumenterad i README. Utan en explicit licens gäller
upphovsrättens standardläge (allt är rättighetsskyddat, ingen återanvändning tillåten
utan tillstånd) — vilket kan vara oavsiktligt givet att repot är publikt och avsett för
undervisning. DOCS-001 varken valde eller skapade en licens, i linje med uppdragets
avgränsning; README dokumenterar bara sakligt att frågan är öppen.
**Status:** Öppen — beslut krävs av PO

---

### FEAT-031 — Övningsdokument "Regulatortrimning i praktiken"
**Branch:** `feature/regulatortrimning`
**Prioritet:** Medel
**Beskrivning:**
Nytt fristående övningsdokument (`docs/exercises/ovningar-regulatortrimning.md`), adresserar
samma PO-önskemål som föranledde FEAT-030: relevanta övningsuppgifter för studenter att
experimentera på, byggda på källmaterialet i `docs/exercises/ovningar-systemoptimering.md`
(ursprungligen Python-appen) — men uttryckligen **inte** som en ny guidad lärstig med
checkpoints. Sex realistiska processer i stigande svårighetsgrad (P → PI → PID med dötid →
integrerande process → utsignalsbegränsning → mästarövning som kombinerar allt), var och en
med en medvetet feltrimmad startinställning som studenten själv ska förbättra mot ett
angivet mål. Bygger inte på scenariofiler ännu — processen ställs in manuellt enligt
dokumentets tabeller (se dokumentets egen notering om varför). Dokumentet är inte länkat
någonstans i appen eller README, i linje med hur de tre ursprungliga `docs/exercises/`-
dokumenten redan fungerar (fristående lärarmaterial, inte appinnehåll).
**Bakgrund/vägval:** Undersökning visade att en standalone-scenarios `description` aldrig
visas i appens gränssnitt (bara `title` i scenariolistan) — ett scenario ensamt kan alltså
inte förmedla mål/kontext till studenten. Ett övningsdokument (samma mönster som appens tre
ursprungliga `docs/exercises/*.md`) är därför rätt leveransform, inte en lärstig.
**Status:** Öppen — dokumentet skrivet, scenariofiler för progressionen är ett möjligt
uppföljningssteg (se dokumentets "Om scenarier"-notering) men inte del av detta uppdrag.

---

### FEAT-032 — Kurvöverlagring för regulatorjämförelse
**Branch:** `feature/kurvoverlagring`
**Prioritet:** Ej bedömd — utvärdering av om/när den ska göras tas separat
**Beskrivning:**
Möjlighet att spara en körd kurva och sedan köra en ny med andra regulatorinställningar
ovanpå, för att visuellt jämföra t.ex. olika Kp/Ti/Td på samma process — motsvarande
"Spara"-funktionen (max 5 sparade kurvor, stigande transparens äldst→nyast, permanent
färg-ID per kurva) som fanns i den nedlagda Python-appen (`git tag
archive/python-app-v1.7.0`, se `export_plots`/`save_simulation_to_history` i `main.py`).
Ingen kod från Python-appen kan återanvändas (annan renderingsmotor), men beteendet är
en bra utgångspunkt: historiken rensades automatiskt vid ändrad *process* (K/T/L/typ/
mätområde) men inte vid ändrad regulator, för att undvika missvisande jämförelser mellan
olika processer.
**Nuläge i webbappen:** `sim.history` ([apps/app/app.js](../../apps/app/app.js)) håller
bara en körning åt gången; "Rensa graf" nollställer helt. `drawChart()` ritar redan
godtyckliga färger per serie, så kärnändringen är ett `savedRuns`-state plus en
loop med nedtonad opacitet — men zoom, mätläge (tangentlinje/63 %) och PB-bandet är alla
skrivna mot den enda aktiva historiken och behöver ett uttryckligt beslut om de ska
gälla alla kurvor eller bara den aktiva.
**Bakgrund:** Motsvarar `FEAT-006` ("Utökad historik — jämförelse och export") från
Python-appen, stängd utan implementation via `BESLUT-002` när Python-appen lades ner —
inte en tidigare avvisad idé, bara aldrig byggd för webben. Även
[docs/exercises/ovningar-systemoptimering.md](../exercises/ovningar-systemoptimering.md)
förutsätter redan denna funktion ("Spara"-knapp, max 5 kurvor) i sina instruktioner,
trots att den inte finns i webbappen — relevant om det källmaterialet någonsin blir en
guidad lärstig (se `FEAT-031`, som uttryckligen undvek det beroendet).
**Status:** Öppen

---

### FEAT-033 — Exportera diagram i hög upplösning och simuleringsdata
**Branch:** `feature/export-diagram-data`
**Prioritet:** Ej bedömd — utvärdering av om/när den ska göras tas separat
**Beskrivning:**
Två separata exportbehov: (1) diagrammet som bild i högre upplösning än skärmvisningen,
för användning i rapporter/experimentdokumentation, och (2) simuleringsdata (tidsserier
och/eller regulator-/processparametrar) exporterbart för vidare analys. Motsvarande
Python-appens `export_plots` (matplotlib `fig.savefig(dpi=300, bbox_inches='tight')`,
PNG/PDF/SVG) och `export_data` (CSV med tidsserie, svenskt `;`-format och decimalkomma).
**Nuläge i webbappen:** Ingen exportfunktion finns alls. `chartCanvas` skalas idag bara
mot `clientWidth` utan hänsyn till `devicePixelRatio` ([apps/app/app.js:107](../../apps/app/app.js)),
så ett direkt `canvas.toDataURL()` skulle ge lika låg upplösning som skärmen — en
högupplöst export kräver att diagrammet ritas om mot en större offscreen-canvas vid
exporttillfället, inte en ren skärmdump. `sim.history` innehåller redan all data som
behövs för en CSV-export. Webbappen har inga externa beroenden (inget byggsteg, inga
CDN-script i `index.html`) — export bör lösas handrullat (canvas + Blob/`<a download>`)
om den arkitekturen ska bevaras, inte via ett nytt bibliotek.
**Beroende:** Om `FEAT-032` (kurvöverlagring) byggs, bör bildexporten rimligen inkludera
alla synliga kurvor, inte bara den aktiva — men denna feature kan byggas fristående och
oberoende av `FEAT-032` (exporterar då bara det som visas för tillfället).
**Bakgrund:** Motsvarar `FEAT-013` ("Förbättrad export-funktionalitet") från
Python-appen, stängd utan implementation via `BESLUT-002` av samma skäl som `FEAT-032`
ovan.
**Status:** Öppen

---

### FEAT-036 — Cache-busting på appens script-taggar
**Branch:** `feature/cache-busting-scripts`
**Prioritet:** Låg — inget akut, men växande risk vid varje ny release
**Beskrivning:**
Upptäckt under `v1.5.1`-releasen (PO testade badgen lokalt direkt efter merge och såg en
trasig, svart badge — en hård omladdning, Ctrl+Shift+R, löste det). Orsak: `index.html`
laddar samtliga scriptfiler (`app.js`, `sim-core.js`, `gamification-*.js`,
`activity-prototype*.js` m.fl.) utan versionsparameter
(`<script src="./gamification-ui.js">`). GitHub Pages sätter inga cache-busting-headers
på egen hand, så en webbläsare som redan besökt sidan kan efter en release fortsätta
servera en **cachad, gammal JS-fil** samtidigt som den hämtar den nya `index.html`/CSS:en
— en blandning av gammal och ny kod som kan ge trasigt, svårfelsökt beteende (exakt det
som hände här: gammal `gamification-ui.js` mot ny CSS gav en helsvart badge eftersom
SVG:ns default-fyllning är svart när ingen färgregel längre matchar).

PO drabbades av detta som utvecklare, men samma sak kan drabba **studenter** efter en
framtida release, utan att de vet att de ska hård-uppdatera.

**Tänkbar lösning:** en versionsparameter på script-taggarna, t.ex.
`<script src="./gamification-ui.js?v=1.5.1">`, kopplad till `APP_VERSION`
(`apps/app/app.js`) så den automatiskt tvingar en ny hämtning vid varje release. Kräver
att `APP_VERSION` blir tillgänglig innan script-taggarna skrivs (idag sätts den i
`app.js`, som själv är en av filerna som behöver versioneras — kan kräva att versionen
läggs i `env.js` istället, som redan laddas allra först).
**Status:** Öppen

---

### FEAT-022 — Direktverkande / Omvänt verkande (verkningsriktning)
**Branch:** `feature/verkningsriktning`
**Prioritet:** Medel
**Beskrivning:**
Industriella regulatorer har en inställning för verkningsriktning: omvänt verkande (Kp > 0, t.ex. värme — utsignal ökar när PV sjunker) och direktverkande (Kp < 0, t.ex. kyla — utsignal ökar när PV stiger). Ska implementeras som en toggle i Regulator-gruppen och påverkar PB-bandets placering (ovanför SP vid direktverkande). Lämplig att inkludera i en lärstig om reglering av kylprocesser.
**Status:** Öppen

---

### FEAT-005 — Stegning framåt/bakåt i historik med markör
**Branch:** `feature/historik-stegning`
**Prioritet:** Medel
**Beskrivning:**
Möjlighet att stega framåt och bakåt i en redan plottad kurva. En markör i grafen visar vilket steg som presenteras, inklusive tidpunkt och aktuella P/I/D-värden i statusraden.
**Lösningsidé:**
Kräver sparande av alla simulator-stater — kan implementeras med state snapshots eller replay-logik.
**Status:** Öppen

---

### FEAT-007 — Avancerade störningsmodeller
**Branch:** `feature/storningsmodeller`
**Prioritet:** Medel
**Beskrivning:**
Fler typer av realistiska processförändringar utöver befintliga störningstyper.
**Status:** Öppen

---

### FEAT-009 — Frekvensanalys av störningar
**Branch:** `feature/frekvensanalys`
**Prioritet:** Låg
**Beskrivning:**
Olika brusfrekvenser och deras påverkan på reglering.
**Status:** Öppen

---

### FEAT-010 — Adaptiv reglering
**Branch:** `feature/adaptiv-reglering`
**Prioritet:** Låg
**Beskrivning:**
Automatisk anpassning av PID-parametrar för olika driftförhållanden.
**Status:** Öppen

---

### FEAT-011 — Säkerhetsmarginaler
**Branch:** `feature/sakerhetsmarginaler`
**Prioritet:** Låg
**Beskrivning:**
Verktyg för design med störningsreserver (gain margin, phase margin).
**Status:** Öppen

---

## Python-app (`main.py`)

Python-appen är nedlagd — se BESLUT-002. Alla öppna Python-features är stängda utan
implementation och flyttade till [todo-done.md](todo-done.md).
