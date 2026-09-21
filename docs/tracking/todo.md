# Feature Backlog — Öppna

Nya features registreras här i `develop`-branchen innan en feature-branch skapas.
Varje feature-branch uppdaterar **endast sin egen post** (status, anteckningar).
Klara features flyttas till [todo-done.md](todo-done.md).

---

## Webbapp (`apps/app/`)

### UX-004 — Omstrukturering av huvudyta och progressiv exponering
**Branch:** `feature/UX-004-huvudyta-omstrukturering`
**Prioritet:** Hög — PO+PM:s designbeslut (2026-09-21), direkt efter UX-002:s
merge.
**Beskrivning:**
PO+PM har fattat ett redan beslutat designbeslut (ej del av denna analys):
huvudytan ska omorganiseras kring tre grupper — Processinställning,
Regulatorkonfiguration, Processpåverkan (Styrning+Störningar slås ihop) —
med avancerade fält separerade från grundparametrarna för att minska visuell
komplexitet. Uppdrag: analysera slutlig informationsarkitektur, vad som
alltid ska synas, vad som ska bakom "Avancerat", hur lärstigar ska styra
synligheten, samspelet Tillämpning/Processmodell/lärsteg, risker, och ett
konkret layoutförslag. Ren analys, ingen kod, ingen branch.
**Leverans:** `docs/reports/UX-004_OMSTRUKTURERING-HUVUDYTA.md`. Sammanfattning:

1. **Viktig avgränsning:** detta "Avancerat" är INTE UX-003:s avfärdade
   förslag (som skulle ERSÄTTA Tillämpning/Fri utforskning) — det är ett
   disklosyr-lager som verkar INOM det redan mergade UX-002-systemet.
   Tillämpning avgör fortfarande vilka fält som är MÖJLIGA; Avancerat avgör
   bara om ett redan tillåtet fält visas direkt eller bakom en klickning.
2. **Informationsarkitektur:** U min/U max flyttas till
   Regulatorkonfigurations grundnivå (konfiguration, ändras sällan under
   körning); SP och Manuell u till Processpåverkan (ändras under körning,
   per PO:s egen definition av gruppen). 23 av dagens 45 kontroller blir
   grundnivå, 22 blir Avancerat (exakt lista i rapporten avsnitt 3).
   Processpåverkan föreslås förbli FLACK (ingen egen Avancerat-nivå) — redan
   smal och redan addon-filtrerad.
3. **Lärstigsstyrning (kärnlösning):** Avancerat-sektionens öppen/stängd-
   status härleds AUTOMATISKT från scenariots egna aktiva värden
   (`kff !== 0`, `gainSchedule.enabled`, etc.) — återanvänder samma
   signalkälla som UX-002:s `deriveApplicationProfile()`, ingen ny
   lärstigstaggning krävs i normalfallet. Undantag: Bumpless/Anti-windup är
   `true` i nästan alla scenarier (default, inte ett ämnessignal) — löses
   med ett nytt, valfritt `forceAdvancedOpen`-fält per lärstigssteg, bara
   för de fåtal lärstigar (idag: `windup-antiwindup.v1`) där ämnet är en
   fält-EXISTENS snarare än ett avvikande värde.
4. **Störst risk:** discoverability-regression för Anti-windup/Bumpless
   (flyttas till Avancerat trots att de inte är addon-gated idag) —
   `windup-antiwindup.v1` måste verifieras manuellt efter implementation,
   inte bara programmatiskt. Näst störst: två disklosyr-mekanismer
   (addon-hidden från UX-002 + ny Avancerat-kollaps) verkar på samma fält
   (t.ex. Kff) — måste kombineras med AND, inte skriva över varandra.
5. **Layoutförslag:** nästlad kollapsbar "Avancerat"-rad per grupp,
   återanvänder FEAT-044s redan etablerade `.zone-table`-hopfällningsmönster
   — ingen ny komponenttyp att lära ut.

**PO:s fyra justeringsbeslut (2026-09-21) och genomförande:**

1. **Justering 1 — "Fri utforskning" → "Avancerat".** Kortare, mer
   etablerat begrepp, samma expertlägesroll ("visar allt"). Genomfört:
   `APPLICATION_PROFILES`-nyckeln `fri` → `avancerat`, UI-alternativet döpt
   om. Att välja Avancerat tvingar nu ÄVEN alla Avancerat-disklosyrsektioner
   öppna (kopplar ihop UX-002:s Tillämpningsbegrepp med UX-004:s nya
   disklosyrmekanism till EN sammanhängande "expertläge"-betydelse, istället
   för två delvis överlappande begrepp).
2. **Justering 3 — Last är generell processpåverkan, inte exklusiv för
   Framkoppling.** Motivering: laststeg är användbart för ren
   regulatorprovning även utan Kff, och hittills har bara SP-steg funnits
   som generellt utvärderingsverktyg. Genomfört: `data-addon="framkoppling"`
   borttaget från Lastförstärkning/Last mag/Trigga last (kvar bara på Kff);
   `updateFramkopplingVisibility()` → `updateKffVisibility()`; inget
   nollställs längre vid tillämpningsbyte för Last. **Upptäckt och åtgärdad
   regression under implementationen:** `deriveApplicationProfile()` hade
   ändrats att bara härleda Temperaturprocess från Kff — men
   `framkoppling.v1`s FÖRSTA steg har `kff=0` ("PID ensam", innan Kff
   introduceras), vilket hade härlett det steget till en ANNAN Tillämpning
   än lärstigens övriga två steg. Löst genom att behålla `auxSignal` som
   signal TILLSAMMANS MED `kff` — verifierat programmatiskt att `auxSignal`
   idag ENDAST förekommer i `framkoppling.v1`s fyra scenarier, så det bredare
   villkoret är riskfritt. Samtliga 12 lärstigar re-verifierade
   programmatiskt efter fixen: inga avvikelser.
3. **Justering 4 — Auto/Manuell som togglefunktion.** Läge-väljaren ersatt
   av Regulatortyp (OnOff/P/PI/PID) + en separat Auto/Manuell-toggle, som
   verklig driftväxling. `#mode` (5 alternativ) kvar som DOLD intern
   sanningskälla — all befintlig logik (`syncParamsFromUI`,
   `updateControllerUIState`, Tillämpnings-filtrering) rör den ALDRIG, bara
   HUR värdet sätts är nytt. Byte till Manuellt seedar nu `manualOutput`
   OVILLKORLIGT med aktuellt u (tidigare gated på Bumpless-kryssrutan, som
   styr en annan, separat sak — regulatorns egen bias-fasning vid övergång
   TILL p/pi/pid). Ingen ändring i `sim-core.js`.
4. **Justering 5 — Visa PB flyttat till grafen.** PB är en härledd
   graf-visning (av aktuell Kp), inte något användaren konfigurerar — hör
   hemma vid grafen den analyseras i. Genomfört: ny rad `#chartControls`
   direkt ovanför `#chartWrap`, samma `#showPB`-id (bara ny DOM-plats).

**Genomförande i övrigt (full IA från analysen, se rapporten):** tre grupper
(`groupProcessinstallning`/`groupRegulatorkonfiguration`/
`groupProcesspaverkan`) ersätter de fyra gamla. Nästlad, kollapsbar
"Avancerat"-sektion per grupp (Processinställning: Lastförstärkning +
Ventilkarakteristik; Regulatorkonfiguration: Kff + Parameterstyrning +
Bumpless + Anti-windup) — öppen/stängd härleds automatiskt
(`deriveAdvancedOpen()`) från: Tillämpning="avancerat" (allt uppackat) ELLER
scenariots aktiva värden (samma signal som `deriveApplicationProfile()`)
ELLER ett nytt, valfritt scenariofält `forceAdvancedOpen` (satt på
`pi-windup-demo.json`, eftersom Anti-windup/Bumpless är `true` i nästan alla
scenarier och alltså inte fångas av "aktivt värde"-heuristiken).
Processpåverkan hålls flack (ingen egen Avancerat-nivå, per analysens
rekommendation 2.2).

99 nya/ändrade testkontroller (60 i `ux-002-application-profile.test.mjs`,
43 i ny `ux-004-huvudyta.test.mjs`). Full regression grön (10 testfiler, 265
kontroller), DEV-/PROD-innehålls- och byggvalidering grön, Tillämpnings-/
Avancerat-härledning re-verifierad programmatiskt mot samtliga 12 lärstigar.

Ingen webbläsare tillgänglig i denna miljö — källkods-verifierat, inte
visuellt bekräftat.

**Status:** Implementerat på feature-branchen enligt PO:s fyra
justeringsbeslut. Väntar på PO:s granskning innan merge till develop/PROD,
per uppdragets uttryckliga instruktion.

### UX-001 — Processbaserad användarmodell (förstudie klar, PAUS på ny reglerstrategiutveckling)
**Prioritet:** Hög — PO:s explicita beslut (2026-09-20): pausa ny
reglerstrategiutveckling (Kvotreglering, Kaskadreglering) tills detta spår är
klart.
**Beskrivning:**
Efter FEAT-042 och FEAT-045 konstaterade PO ett större, återkommande
UX-problem: parametergridet har vuxit till 45 kontroller, varav 19 hör till
enskilda, avancerade lärstigar (16 FEAT-042, 3+1 FEAT-045) men visas för ALLA
studenter oavsett vad de faktiskt övar på. PO:s riktning: ett
"Processval"/tillämpningsval (t.ex. Temperaturprocess, Nivåprocess,
Blandnings-/kvotprocess, Kaskadreglerad process) som samtidigt styr
processmodell, relevanta parametrar, relevanta strategier och relevanta
givare — inte bara enskild fält-visa/dölj.
**Genomförande (förstudie, rev. 2 efter PO:s tvådimensionella korrigering):**
Full analys: `docs/reports/UX-001_FORSTUDIE-PROCESSBASERAD-UX.md`. Rev. 1
slog ihop processdynamik och tillämpning till EN axel — PO korrigerade:
det är TVÅ separata dimensioner. **Processmodell** (Självreglerande
enkapacitiv/flerkapacitiv, Integrerande — motsvarar dagens `processType`,
bara tydligare namngivet) avgör dynamiken och ska förbli synlig/begriplig
för studenten (centralt reglertekniskt begrepp, får INTE gömmas). **Tillämpning**
(Tvålägesreglering, Temperaturprocess, Nivåprocess, Blandnings-/kvotprocess*,
Kaskadreglerad process*, Fri utforskning — *framtida) avgör vilka
processmodeller som ERBJUDS, vilka parametrar/givare/strategitillägg som
visas, och vilka lärstigar som hör hemma där. Parameterstyrning/
Ventilkarakteristik/Framkoppling blir "Tillägg" inom Temperaturprocess (inte
egna tillämpningar). Migreringsväg i tre faser oförändrad i sak: Fas 0 (två
kopplade väljare — Tillämpning + en filtrerad Processmodell-väljare direkt
under — additiv UI-filtrering, "Fri utforskning" förblir default, ingen
ändring av sim-core/scenarioformat, alla 12 befintliga lärstigar opåverkade),
Fas 1 (koppla lärstigar till tillämpning+processmodell via nya valfria fält),
Fas 2 (Kvotreglering/Kaskadreglering byggs DIREKT mot dedikerad UI, inklusive
kaskadens per-slinga-processmodellval). Fyra öppna frågor till PO i
rapportens slut (namnbyte som egen snabb åtgärd redan nu, genomläsning av
`oppen-slinga-onoff-p.v1` för korrekt tillämpnings-tagg, om kaskadens
inre/yttre slinga kan ha OLIKA processmodeller, komplett tillämpningslista).
**Status:** Förstudie (rev. 2) klar, väntar på PO:s svar på de öppna frågorna
innan ett Fas 0-bygguppdrag formuleras. Ingen kod skriven, ingen branch. Ny
reglerstrategiutveckling (Kvotreglering/Kaskadreglering) PAUSAD tills detta
spår är klart, per PO:s beslut.

---

### FEAT-046 — Blockschema-SVG:er för reglerstrategier
**Branch:** `feature/FEAT-046-blockschema-svg`
**Prioritet:** Låg — sidospår/experiment, PO:s explicita "prova"-uppdrag
**Beskrivning:**
PO:s uppdrag: skapa återanvändbara SVG-blockschema för de reglerstrategier som
redan är dokumenterade/planerade (Återkoppling/PID, Framkoppling, PID+Framkoppling,
Kvotreglering, Kaskadreglering) — som fristående filer, inte inbyggda i appens
rendering (det skulle vara en separat, större ändring av teori-/lärstigsschemat).
PO relayerade en extern skiss/rekommendation (ASCII-diagram + två stilalternativ)
och bad mig ta ställning och bygga vidare.
**Genomförande:**
5 fristående SVG-filer i `docs/assets/diagrams/`, konsekvent design (samma
block-/färgkodning genomgående): PID-regulator=orange, Framkoppling/Kvotblock=
grönteal (samma "beräkningsblock"-familj), Process/Ventil=mörkblågrå,
mätbar störning=lila, omätbar störning=grå streckad, Givare=teal cirkel.
Valde "Alternativ 2" (kursdiagram — SP/PV/u, mätbar/omätbar störning, givare,
signalnamn) framför en minimalistisk variant, enligt den relayerade
rekommendationen: samma SVG:er återanvändbara i lärstigar, övningsdokument och
framtida presentationer, vilket sänker kostnaden för Kvotreglering/Kaskadreglering
när de byggs (STRAT-001/004/005-kedjan). Publicerad som Artifact för visuell
granskning (kan inte förhandsgranskas i denna miljö annars).
**Status:** Öppen/experimentell — se leveransrapport, PO:s visuella godkännande
avgör om filerna behålls, justeras eller görs om.

---

### FEAT-044 — Gruppera Parameterstyrningens/ventilkarakteristikens zonfält
**Branch:** `feature/FEAT-044-zone-fields-table`
**Prioritet:** Låg — kosmetisk UI-förbättring, upptäckt av PO under FEAT-042-testning
**Beskrivning:**
PO:s observation (skärmdump): FEAT-042s 11 regulatorschema-fält (2 brytpunkter + 3×3
Kp/Ti/Td) och 5 processchema-fält låg utspridda som enskilda `.field`-rutor i
parametergridet — upplevdes rörigt, svårt att se vilket fält som hör till vilken zon.
Uppdrag: gruppera visuellt utan att öka vertikalt skärmutrymme nämnvärt.
**Genomförande:**
Zonfälten (Kp/Ti/Td × 3 zoner för Parameterstyrning, K × 3 zoner för
ventilkarakteristik) omstrukturerade från utspridda `.field`-rutor till en kompakt
tabell (`.zone-table`, en rad per zon, kolumner för respektive parameter) — samma
antal rader som tidigare grid-rader gav, men nu tydligt grupperat. Brytpunktsfälten
ligger kvar oförändrade utanför tabellen. Aktiv-zon-highlighten (FEAT-042, punkt 3)
flyttad från per-fält-ram till helmarkerad tabellrad (`GS_ZONE_ROWS`/`NG_ZONE_ROWS` i
`app.js`, ersätter de gamla `GS_ZONE_FIELD_GROUPS`/`NG_ZONE_FIELD_GROUPS`) — samma
färgkodning (orange/grön) som tidigare. Ingen ändring i `sim-core.js`, inga nya
fält-ID:n, inga ändrade `fields{}`-referenser i `syncParamsFromUI()`/`hydrateFields()`
— rent HTML-/CSS-/highlight-omstrukturering.
Fullständig regression grön, DEV-/PROD-byggnation kontrollerad.
**Status:** Implementerad på feature-branchen. Ingen webbläsartest genomförd (ingen
webbläsare tillgänglig i denna miljö) — PO bör visuellt verifiera layouten innan
mergebeslut.

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
