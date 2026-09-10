# PED-005 — Granskning av jämförelser i lärstigarna

**Uppdrag:** PED-005 — Granska jämförelser i lärstigarna och lämna ändringsförslag
**Typ:** Analys/granskning — inga ändringar i lärstigsdata, comparisonGroup, instruktionstexter, scenarier, appkod, aktivitetsmodellen eller XP-modellen.
**Bas:** `develop` @ `6007351` (GAM-003A.2 sammanslagen), gren `feature/PED-005-learning-path-comparison-review`.
**Syfte:** Ge PO/PM ett fullständigt beslutsunderlag för alla pedagogiska jämförelser innan synlig XP (GAM-003B) byggs.

---

## 1. Sammanfattning

Granskningen har gått igenom samtliga 10 aktiva DEV-lärstigar rad för rad och identifierat **14 distinkta jämförelser**, varav **8 är taggade med `comparisonGroup`** och 6 saknar (korrekt) en grupptaggning.

**Huvudresultat:**

- **Den tekniska comparisonGroup-mekaniken fungerar korrekt** för samtliga 8 grupper — inga trasiga referenser, inga föräldralösa grupper, inga dubbelräknade par.
- **Diskrepansen mellan GAM-003A.2-rapportens sammanfattning ("7 grupper") och dess egen tabell (8 grupp-ID:n) är bekräftad och beror på ett skrivfel i sammanfattningstexten** — den faktiska koden och innehållet har alltid haft 8 grupper. Se avsnitt 4 för detaljer.
- **Störningar och robusthet** är fortsatt korrekt implementerad (Metod A, kontinuerlig mätserie) — inget fel hittades, inget ändringsförslag lämnas, i enlighet med att PO redan godkänt lärstigen.
- **Sex av åtta grupper (pb-kp-escalation, pb-p-vs-pi, procbeg-k-comparison, procbeg-deadtime-comparison, windup-antiwindup-comparison, storningar-noise-comparison) är redan pedagogiskt sunda** — de flesta är korrekt utformade som Metod D (separata försök med explicit noterade mätvärden), där grafens/tillståndets omladdning mellan steg är en AVSIKTLIG och nödvändig del av en rättvis jämförelse (identiskt startläge), inte ett fel.
- **Ett konkret sakfel hittades i en publicerad lärstig:** `pi-pid.v1` steg 3 hänvisar till att "bläddra tillbaka i grafloggen" — en funktion som inte finns i appen.
- **Ett mindre instruktionsfel hittades** i `windup-antiwindup.v1` steg 2 — användaren ombeds aldrig notera ett konkret överskjutningsvärde, trots att steg 3 senare frågar efter en jämförelse mot just det talet.
- **Ett pedagogiskt öppet beslut identifierades** för `lambda-comparison` (DEV-only): nuvarande sekventiella kedjemodell (moderat→aggressivt→konservativt) matchar inte fullt ut instruktionernas avsikt (båda ska jämföras mot moderat som referens). Kräver PO/PM-beslut eftersom en lösning rör aktivitetsmodellens logik, inte bara innehåll.
- **Ett allvarligt, tidigare oupptäckt funktionsfel hittades i en DEV-only-lärstig** (`stegsvar-identifiering.v1`, ej relaterat till comparisonGroup): stegsvarskurvan som byggs upp i steg 2-3 raderas automatiskt innan steg 4-7 hinner mäta den, eftersom `continueFromPreviousStep` saknas. Detta bryter lärstigens huvudsakliga syfte och bör prioriteras högt i en framtida uppdrag.
- **Ingen grupp kräver en förändring av antalet jämförelsepar eller XP-summan.** Den totala jämförelse-XP:n i appen är oförändrad (0 kr i differens) mellan nuvarande modell och den rekommenderade pedagogiska modellen — se avsnitt 11.
- **Datamodellen bedöms INTE behöva utökas** inom ramen för detta uppdrag (avsnitt 10).

---

## 2. Metod

1. **Förkontroll**: `git fetch`, statuskontroll av develop/origin/main, tag-kontroll, stash-kontroll, bekräftelse av GAM-003A.2:s närvaro och testresultat.
2. **Grenbyte**: `feature/PED-005-learning-path-comparison-review` skapad från synkad `develop`.
3. **Fullständig textläsning** av samtliga 10 aktiva lärstigsfiler i `apps/app/content/exercises/*.json` (rad för rad: titel, mål, instruktioner, checkpoints, comparisonGroup, continueFromPreviousStep).
4. **Strukturell kodgranskning** av `apps/app/app.js` — `nextPathStep()`, `loadScenarioByName()`, "Återställ system"-knappen — för att fastställa EXAKT när grafen/simuleringstillståndet nollställs. Detta är deterministisk kod utan dolda tillstånd, så en fullständig läsning av samtliga kodvägar som skriver till `sim`/`sim.history` gav lika stark evidens som upprepade manuella klickgenomgångar (ingen asynkron eller slumpmässig logik är inblandad).
5. **Grep-baserad verifiering** av `continueFromPreviousStep`-förekomst i samtliga lärstigsfiler — bekräftar exakt var grafkontinuitet är tekniskt möjlig.
6. **Korsreferens** mot `docs/reports/GAM-003A.2_COMPARISON-GROUPS.md/.json`, `tests/gamification/lp-inventory.mjs`, `tests/gamification/comparison-groups-content.test.mjs` för att verifiera att den redan testade pardata stämmer med den nu genomförda manuella genomläsningen.
7. **Automatiserad regressionskontroll**: samtliga befintliga testsviter kördes om (se avsnitt 6) för att bekräfta att ingen kodändring smugit sig in och att grundmodellen fortfarande är konsekvent.
8. Pedagogiska slutsatser grundas på den faktiska instruktionstexten (vad användaren uttryckligen ombeds göra/notera) — inte på antaganden om vad som "borde" stå där.

---

## 3. Aktuell DEV- och PROD-status

| Lärstig | DEV | PROD | Status |
|---|---|---|---|
| kom-igång.v1 | ✅ | ✅ | Publicerad |
| oppen-slinga-onoff-p.v1 | ✅ | ✅ | Publicerad |
| proportionalband-forstarkning.v1 | ✅ | ✅ | Publicerad |
| pi-pid.v1 | ✅ | ✅ | Publicerad |
| processbegransningar.v1 | ✅ | ✅ | Publicerad |
| windup-antiwindup.v1 | ✅ | ✅ | Publicerad |
| storningar-robusthet.v1 | ✅ | ❌ | Godkänd för nästa PROD — **bekräftat ej publicerad ännu** (saknas i `catalog.prod.json`) |
| integrerande-process-niva.v1 | ✅ | ❌ | DEV-only |
| stegsvar-identifiering.v1 | ✅ | ❌ | DEV-only |
| lambda-metoden.v1 | ✅ | ❌ | DEV-only |

DEV-katalog: 10 lärstigar. PROD-katalog: 6 lärstigar. Ingen avvikelse mot förväntad status.

---

## 4. Inventerade jämförelser — antal och den identifierade diskrepansen

**Faktiskt antal unika comparisonGroup-ID:n i kodbasen: 8** (bekräftat via `grep` över samtliga lärstigsfiler, 19 steg totalt taggade):

```
lambda-comparison, pb-kp-escalation, pb-p-vs-pi, pi-vs-pid,
procbeg-deadtime-comparison, procbeg-k-comparison,
storningar-noise-comparison, windup-antiwindup-comparison
```

**Diskrepansen i GAM-003A.2-rapporten:** Avsnitt 1 (Sammanfattning) i `docs/reports/GAM-003A.2_COMPARISON-GROUPS.md` skriver "19 steg i 6 lärstigar, fördelat på **7 grupper**". Rapportens egen avsnitt 5-tabell listar dock samtliga **8** grupp-ID:n korrekt (inklusive `.json`-underlaget). Den faktiska koden (`activity-prototype-core.js`, `app.js`, samtliga innehållsfiler) och samtliga tester (`comparison-groups-content.test.mjs`, 23/23 gröna) är konsekventa med **8 grupper** — det är alltså **enbart sammanfattningsmeningen i rapportens avsnitt 1 som har fel siffra**, sannolikt en manuell räknemiss vid skrivandet. Ingen kod, inget test och ingen innehållsfil behöver ändras — detta är en dokumentationskorrigering (en rad text i en tidigare rapport), inte en funktionell avvikelse. Rekommendation: PM uppdaterar meningen i GAM-003A.2-rapporten från "7 grupper" till "8 grupper" vid tillfälle; ingår inte i PED-005:s leverans eftersom PED-005 inte får ändra andra uppdrags rapporter.

**19 taggade steg fördelat på grupperna:**

| Grupp | Lärstig | Steg | Antal steg |
|---|---|---|---|
| pb-kp-escalation | proportionalband-forstarkning.v1 | 2–3 | 2 |
| pb-p-vs-pi | proportionalband-forstarkning.v1 | 5–6 | 2 |
| pi-vs-pid | pi-pid.v1 | 1–3 | 3 |
| procbeg-k-comparison | processbegransningar.v1 | 2–3 | 2 |
| procbeg-deadtime-comparison | processbegransningar.v1 | 4–5 | 2 |
| windup-antiwindup-comparison | windup-antiwindup.v1 | 2–3 | 2 |
| storningar-noise-comparison | storningar-robusthet.v1 | 2–4 | 3 |
| lambda-comparison | lambda-metoden.v1 | 3–5 | 3 |
| **Totalt** | | | **19** |

Utöver de 8 grupperna identifierades **6 ytterligare jämförelser utan comparisonGroup** — samtliga korrekt icke-taggade (kvalitativa/konceptuella jämförelser eller redan inombyggt fångade inom ett enda lärstigssteg). Se avsnitt 5 och den bifogade JSON-filen för fullständig lista (14 poster totalt).

---

## 5. Jämförelsemetoder — klassificering

Samtliga 14 identifierade jämförelser klassificerade enligt de sex metoderna i uppdraget:

| Metod | Antal | Grupper/steg |
|---|---|---|
| **A** — Sammanhängande mätserie | 1 | storningar-noise-comparison |
| **B** — Överlappande kurvor från samma startpunkt | 0 (inte tekniskt tillgänglig ännu) | — |
| **C** — Samma lärsteg, flera konfigurationer | 2 | storningar-robusthet steg 6, 7 |
| **D** — Separata försök med explicita mätvärden | 6 | pb-kp-escalation, pb-p-vs-pi, pi-vs-pid, procbeg-k-comparison, procbeg-deadtime-comparison, windup-antiwindup-comparison |
| **D/B-hybrid** | 1 | lambda-comparison (olika scenariofiler, ingen bevarad graf) |
| **E** — Jämförelse mellan lärsteg med bevarad graf | 0 | — |
| **F** — Ingen pedagogisk jämförelse (mätbar) | 4 | proportionalband steg 4, integrerande-process, stegsvar-identifiering steg 8, oppen-slinga steg 5 |
| **Trasig (avsett A, saknar teknisk grund)** | 1 | stegsvar-identifiering steg 2–7 |

**Nyckelinsikt:** Metod A (kontinuerlig graf) är bara pedagogiskt korrekt när jämförelsens poäng är att SE samma pågående process hantera en förändring live (t.ex. ett lägesbyte medan en störning redan pågår). I samtliga andra grupper krävs istället att försöken startar från **identiskt** tillstånd för en rättvis jämförelse (samma starttillstånd, nollställd integrator) — vilket gör en obligatorisk omladdning/återställning till en **avsiktlig, korrekt** del av Metod D, inte ett fel. Detta förklarar varför 6 av 8 grupper redan fungerar väl trots att grafen rensas mellan stegen.

---

## 6. Teknisk kontroll av grafrensning och Reset

Kodgranskning av `apps/app/app.js` bekräftar exakt två mekanismer som nollställer `sim`/`sim.history`/markörer:

1. **`loadScenarioByName()`** (rad 402–410): skapar en ny `Simulation`-instans och tömmer markörer. Anropas automatiskt av `nextPathStep()` vid varje stegväxling **om inte** `step.continueFromPreviousStep === true` OCH `currentScenarioRef === step.ref`.
2. **"Återställ system"-knappen** (rad 899): nollställer `sim.reset()` samt hela `sim.history`.

**`continueFromPreviousStep` förekommer i exakt 2 av 19 taggade steg** (steg 3 och 4 i `storningar-robusthet.v1.json`) — bekräftat via `grep -rn "continueFromPreviousStep" apps/app/content/exercises/*.json`. Ingen annan mekanism (ingen "smart" jämförelse av om samma ref redan är laddad) finns i koden — en omladdning sker ovillkorligt vid varje stegväxling om inte flaggan är satt.

**Slutsats:** Grafen/tillståndet bevaras **endast** i `storningar-noise-comparison`. I samtliga övriga 7 grupper rensas grafen vid stegväxling. För 5 av dessa 7 (pb-kp-escalation, procbeg-k-comparison, procbeg-deadtime-comparison, windup-antiwindup-comparison, samt delvis pb-p-vs-pi) är detta **avsiktligt och pedagogiskt korrekt** eftersom instruktionerna kräver identiskt starttillstånd. För `pi-vs-pid` och `pb-p-vs-pi` är omladdningen oundviklig eftersom stegen refererar till OLIKA scenariofiler. Ingen av dessa är alltså tekniska fel — men se avsnitt 7-9 för de konkreta instruktionsbrister som ändå hittades.

---

## 7. Granskning per publicerad lärstig

### proportionalband-forstarkning.v1 (publicerad)
Två grupper, båda korrekt utformade som Metod D med explicit notering och avsiktliga återställningar mellan delförsök. **Inga fel hittade.** Steg 4 (Kp=20 mot On/Off) korrekt otaggad (kvalitativ, cross-lärstig referens).

### pi-pid.v1 (publicerad)
**Ett konkret sakfel:** steg 3 hänvisar till en icke-existerande "bläddra tillbaka i grafloggen"-funktion. Steg 1-2 i övrigt korrekt Metod D. Se avsnitt 8 och JSON-underlaget för föreslagen textkorrigering.

### processbegransningar.v1 (publicerad)
Två grupper, båda korrekt Metod D med pedagogiskt nödvändiga omladdningar till identiskt starttillstånd. **Inga fel hittade.**

### windup-antiwindup.v1 (publicerad)
**Ett mindre instruktionsfel:** steg 2 saknar en uttrycklig uppmaning att notera överskjutningens ungefärliga värde, trots att steg 3 ber om en jämförelse mot just det. Återställningen mellan stegen är dock funktionellt nödvändig (nollställer I-termen) — `continueFromPreviousStep` REKOMMENDERAS INTE här eftersom det skulle bevara ett upphopat integratortillstånd och ogiltigförklara jämförelsen.

### storningar-robusthet.v1 (godkänd för nästa PROD)
**Inga fel hittade.** Redan pedagogiskt godkänd av PO. Bekräftat tekniskt korrekt: continueFromPreviousStep på rätt steg, tre kedjade jämförelsepar bildas som avsett.

### kom-igång.v1 och oppen-slinga-onoff-p.v1
Bekräftat: **saknar (korrekt) pedagogiska jämförelsegrupper.** kom-igång.v1 innehåller inga jämförelser alls (onboarding). oppen-slinga-onoff-p.v1:s enda "jämför"-formulering (steg 5, PV mot SP) är en jämförelse inom samma körning, inte mellan två försök — korrekt att ingen comparisonGroup finns.

---

## 8. Översikt av DEV-only-lärstigar

| Lärstig | Jämförelser | comparisonGroup | Grafproblem | Behöver fullständig omarbetning? |
|---|---|---|---|---|
| integrerande-process-niva.v1 | 1 (konceptuell) | Nej (korrekt) | Inga | Nej |
| stegsvar-identifiering.v1 | 1 (steg 8, fungerande) + kärnexperiment steg 2-7 | Nej | **JA — allvarligt** (se nedan) | Delvis — den tekniska buggen måste åtgärdas innan lärstigen kan godkännas för PROD |
| lambda-metoden.v1 | 1 (lambda-comparison) | Ja | Inga tekniska — pedagogiskt öppen fråga | Nej, men gruppens pardragningslogik bör beslutas |

**Allvarligt funktionsfel i stegsvar-identifiering.v1** (upptäckt via DEL 5:s tekniska genomgång, inte en comparisonGroup-fråga): Steg 2-7 refererar alla samma scenariofil (`manual-identification.json`) utan `continueFromPreviousStep`. Stegsvarskurvan (u: 30→60) som byggs upp i steg 2-3 raderas automatiskt vid varje efterföljande stegväxling, INNAN steg 4-7 hinner mäta den med "Mät K/T/L", 63%-linjen och tangentlinjen. Detta bryter lärstigens huvudsyfte. Ingen tidigare rapport (PED-001, PED-002, PED-003B, content-log.md) har flaggat detta. Föreslagen lösning (för en framtida implementationsuppdrag): sätt `continueFromPreviousStep: true` på steg 3–7 — exakt samma tekniska mönster som redan är bevisat i `storningar-robusthet.v1` (FEAT-030).

**Rekommenderad framtida granskningsordning för DEV-only:** (1) stegsvar-identifiering.v1 — kritiskt funktionsfel blockerar lärstigens kärnsyfte, (2) lambda-metoden.v1 — pardragningsbeslut, (3) integrerande-process-niva.v1 — fungerar redan, lägst prioritet.

---

## 9. Granskning av comparisonGroup (samtliga 8 grupper)

| Grupp | Lärstig | Rekommendation |
|---|---|---|
| pb-kp-escalation | proportionalband-forstarkning.v1 | **Behåll oförändrad** |
| pb-p-vs-pi | proportionalband-forstarkning.v1 | **Behåll efter pedagogisk kontroll** |
| pi-vs-pid | pi-pid.v1 | **Behåll efter pedagogisk kontroll** (kräver textfix i steg 3, se avsnitt 7) |
| procbeg-k-comparison | processbegransningar.v1 | **Behåll oförändrad** |
| procbeg-deadtime-comparison | processbegransningar.v1 | **Behåll oförändrad** |
| windup-antiwindup-comparison | windup-antiwindup.v1 | **Behåll efter pedagogisk kontroll** (kräver textfix i steg 2, se avsnitt 7) |
| storningar-noise-comparison | storningar-robusthet.v1 | **Behåll oförändrad** (redan PO-godkänd) |
| lambda-comparison | lambda-metoden.v1 | **Kräver PO/PM-beslut** (sekventiell kedja vs. gemensam referens) |

Fullständiga fält (medlemssteg, scenario-ID:n, avsedd ordning, antal par modellen skapar, avsedda par, om de matchar, produktionsstatus, kommentar) finns i den bifogade JSON-filen `PED-005_JAMFORELSEGRANSKNING.json`.

Ingen grupp föreslås delas, tas bort, eller vänta — samtliga är antingen redan korrekta eller föremål för en ren textförbättring/PO-PM-beslut som inte kräver strukturell ändring av grupperna själva.

---

## 10. Behov av utökad datamodell

**Bedömning: nej, datamodellen behöver inte utökas inom PED-005.**

Den nuvarande sekventiella modellen (varje nytt försök i en grupp jämförs mot det senast registrerade försöket i samma grupp) täcker 7 av 8 grupper korrekt utan behov av ändring.

Det enda identifierade avvikande behovet är **lambda-comparison**, där en "gemensam referens"-modell (alla jämförs mot ett angivet ankarförsök, inte mot det senaste) skulle matcha instruktionernas avsikt bättre. Detta är dock:
- Ett **enda** identifierat fall i hela granskningen (inget systemiskt mönster).
- Utan XP-konsekvens (samma antal par, 2, oavsett modell — se avsnitt 11).
- En ändring som skulle kräva att `recordGroupComparison()`-logiken i `activity-prototype-core.js` utökas (t.ex. med ett sätt att markera ett steg som "referens" för gruppen) — det vill säga en ändring av **motorn**, inte bara innehållet.

I linje med uppdragets princip "Föreslå endast utökning om ett verkligt pedagogiskt behov finns. Prioritera enkel datastruktur" bedöms ett enda, lågkonsekvent fall INTE motivera en modellutökning nu. Rekommendationen är att vänta med lambda-comparisons pardragning tills PO/PM beslutar om det är värt att implementera en minimal, riktad lösning (t.ex. en enda ny valfri egenskap) i en framtida, avgränsad uppdrag — inte en generell schemautökning.

Inget behov identifierades av: namngivna jämförelsefall, flera delgrupper inom en lärstig, reflektionssteg som kräver särskild hantering (pi-vs-pid steg 3 hanteras redan korrekt genom att inte bilda något nytt försök), eller grupper som spänner över flera lärstigar.

---

## 11. XP-konsekvens

Beräknat med den beslutade regeln **6 XP per tillförlitligt jämförelsepar** (oförändrad):

| Grupp | Nuvarande par | Rekommenderade par | Nuvarande XP | Rekommenderad XP | Differens |
|---|---|---|---|---|---|
| pb-kp-escalation | 2 | 2 | 12 | 12 | 0 |
| pb-p-vs-pi | 1 | 1 | 6 | 6 | 0 |
| pi-vs-pid | 1 | 1 | 6 | 6 | 0 |
| procbeg-k-comparison | 1 | 1 | 6 | 6 | 0 |
| procbeg-deadtime-comparison | 1 | 1 | 6 | 6 | 0 |
| windup-antiwindup-comparison | 1 | 1 | 6 | 6 | 0 |
| storningar-noise-comparison | 3 | 3 | 18 | 18 | 0 |
| lambda-comparison | 2 | 2 | 12 | 12 | 0 |
| **Totalt (grupp-XP)** | **12** | **12** | **72** | **72** | **0** |

**Ingen av de föreslagna pedagogiska korrigeringarna ändrar antalet jämförelsepar eller den totala jämförelse-XP:n.** Samtliga föreslagna ändringar (instruktionstext i pi-pid.v1/windup-antiwindup.v1, eventuell gemensam-referens-omdragning i lambda-comparison, continueFromPreviousStep i stegsvar-identifiering.v1) påverkar VILKA specifika försök som krediteras eller HUR tydlig jämförelsen är för användaren — inte HUR MÅNGA poäng som delas ut. **Ingen effekt på nivåtakten.** XP-regeln ändras inte, i enlighet med uppdragets avgränsning.

(stegsvar-identifiering.v1 saknar comparisonGroup helt, så dess funktionsfel har ingen XP-konsekvens i dagens modell — men skulle blockera EVENTUELL framtida XP-satsning på mätaktiviteter i den lärstigen.)

---

## 12. Prioriterad ändringsordning

Rekommenderad genomförandeordning för framtida uppdrag, baserat på uppdragets prioriteringsmall:

1. **pi-pid.v1 steg 3** — konkret sakfel i publicerad lärstig (ta bort hänvisningen till "grafloggen"). Minimal risk, hög synlighet eftersom lärstigen är publicerad.
2. **windup-antiwindup.v1 steg 2** — lägg till notering av överskjutningsvärde. Publicerad lärstig, litet ingrepp.
3. **stegsvar-identifiering.v1 steg 3-7** — lägg till `continueFromPreviousStep`. DEV-only (ingen produktionsrisk), men blockerar lärstigens kärnsyfte och bör lösas innan lärstigen övervägs för PROD.
4. **lambda-comparison** — PO/PM-beslut om gemensam referens är värt en riktad motorutökning. DEV-only, ingen brådska, men bör beslutas innan eventuell PROD-publicering av lambda-metoden.v1.
5. **pb-p-vs-pi / pi-vs-pid:s kvalitativa begränsning** — kandidat för en framtida "överlappande grafer"-funktion, men ingen brist idag som kräver åtgärd.
6. Kosmetiska förbättringar — inga identifierade utöver ovanstående.

**Rekommendation om uppdragsindelning:** Genomför punkterna 1-2 tillsammans i EN liten, snabb uppdrag ("textkorrigeringar i publicerade lärstigar") eftersom de delar samma låga risk och omfattning (ren instruktionstext, inga strukturella ändringar). Punkt 3 (stegsvar-identifiering) bör vara sin egen uppdrag eftersom den rör en funktionell bugg, inte en ren jämförelseförbättring. Punkt 4 kräver ett PO/PM-beslut FÖRE någon implementation påbörjas. Punkt 5 bör vänta tills en eventuell "överlappande grafer"-funktion prioriteras separat.

---

## 13. Risker

- **Risk att GAM-003B (synlig XP) byggs på en förväxling**: om synlig XP visas för `pi-vs-pid` eller `windup-antiwindup-comparison` innan textfixarna i punkt 1-2 ovan är gjorda, kan användare möta en instruktion som hänvisar till en obefintlig funktion samtidigt som de ser XP för en "lyckad jämförelse" — sämre förtroende för appen. Rekommendation: åtgärda punkt 1-2 innan/i samband med GAM-003B, inte efter.
- **Risk att lambda-comparison publiceras till PROD utan att pardragningsfrågan avgjorts**: om lambda-metoden.v1 flyttas till PROD innan PO/PM tagit ställning, låses den nuvarande (suboptimala) kedjemodellen in med synlig XP, vilket gör en senare ändring mer synlig/känslig för slutanvändare.
- **Risk att stegsvar-identifiering.v1 flyttas till PROD utan att buggen åtgärdats**: skulle exponera ett tydligt trasigt kärnmoment (mätvärden går inte att läsa av) för riktiga användare.
- **Ingen risk identifierad för de redan godkända/publicerade grupperna** (pb-kp-escalation, procbeg-k-comparison, procbeg-deadtime-comparison, storningar-noise-comparison) — dessa fungerar redan som avsett.

---

## 14. Öppna PO/PM-beslut

1. **lambda-comparison**: sekventiell kedja (nuvarande) kontra gemensam referens (moderat som ankare)? Kräver beslut om en riktad utökning av `recordGroupComparison()`-logiken är värd att implementera, givet att XP-summan är identisk oavsett val (se avsnitt 10-11).
2. **Uppdaterad sammanfattningstext i GAM-003A.2-rapporten** ("7 grupper" → "8 grupper") — ren dokumentationskorrigering, PM avgör om/när den görs.
3. **Prioritering av stegsvar-identifiering.v1:s funktionsfel** i förhållande till övrig backlogg — se avsnitt 12, punkt 3.
4. **Om/när en "överlappande grafer"-funktion (Metod B) ska prioriteras** för pb-p-vs-pi och pi-vs-pid:s kvalitativa jämförelser — inget akut behov, men värt ett medvetet ställningstagande.

---

## 15. Underlag för kommande implementationsuppdrag

Den bifogade JSON-filen `PED-005_JAMFORELSEGRANSKNING.json` innehåller en maskinläsbar post per identifierad jämförelse (14 poster) med exakt de fält som specificerats i uppdraget (`learningPathId`, `comparisonGroup`, `stepIndexes`, `currentMethod`, `proposedMethod`, `proposedChanges`, `estimatedScope`, `poPmDecision: "Ej beslutat"` m.fl.). Filen är avsedd som beslutsunderlag för PO/PM och laddas INTE av appen.

När PO/PM har tagit ställning till avsnitt 14:s öppna frågor kan en eller flera avgränsade implementationsuppdrag skapas direkt utifrån `proposedChanges`-fälten i JSON-underlaget, i den ordning som föreslås i avsnitt 12.

---

*Rapport genererad av Claude Code (CC) under uppdrag PED-005. Inga lärstigsfiler, ingen appkod, ingen aktivitetsmodell och ingen XP-modell har ändrats i samband med denna granskning.*
