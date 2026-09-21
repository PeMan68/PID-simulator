git # Övningsuppgifter: Reglerstrategier
*Dokumentversion 1.0, Övningsuppgifter för PID-simulator 1.5.3 eller högre*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

Där simulatorns lärstigar tränar **hur** man mekaniskt trimmar Kp/Ti/Td, tränar det här dokumentet **vilken reglerstrategi man väljer och varför**. Varje uppgift ger en process och ett driftkrav — du ska välja/motivera regulatortyp, aggressivitet och särskilda hänsyn (dötid, integrerande process, windup, prioritering), inte hitta det matematiskt optimala parametersetet. Facit i denna samling är alltså ett **resonemang**, inte ett tal.

**Förkunskaper:** Grundläggande PID-förståelse (P/I/D var för sig), gärna genomfört alla lärstigar i PID-simulatorn.

**Mål:** Kunna koppla processens egenskaper och verksamhetens krav till ett medvetet val av reglerstrategi, och kunna motivera det valet skriftligt.

## Termer och definitioner

Kort referens för begreppen som används:

- **SP (börvärde)** — det värde processen ska styras mot.
- **PV (processvärde)** — det uppmätta/simulerade värdet just nu.
- **u (utsignal)** — regulatorns styrsignal till processen, i %.
- **e (fel)** — SP−PV vid ett givet ögonblick.
- **Slutvärde** — det värde PV till slut lägger sig vid.
- **Kvarstående fel / stationärt fel** — SP−slutvärde. Ett fel som INTE försvinner även om man väntar hur länge som helst.
- **Översläng** — hur mycket PV passerar sitt slutvärde innan den lägger sig, angivet i enheter och i % av stegets storlek (SP−startvärde).
- **Toleransband** — den marginal runt slutvärdet som avgör om kurvan räknas som "insvängd". Dokumentet använder genomgående ett **2 %-band** (2 % av stegets storlek).
- **Insvängningstid** — tiden tills PV går in i toleransbandet OCH stannar där (minst 10 sammanhängande steg). En kurva som bara snuddar vid bandet under en översläng och sedan fortsätter röra sig räknas INTE som insvängd förrän den stannar kvar.
- **Stigtid (10–90 %)** — tiden det tar för PV att gå från 10 % till 90 % av vägen mellan start- och slutvärde. Mäter hur snabbt kurvan FÖRST närmar sig målet — inte samma sak som insvängningstid.
- **Mättning ("mättar")** — utsignalen ligger i sitt gränsvärde (t.ex. u=100 % eller u=0 %) och kan inte styra mer i den riktningen även om regulatorn "vill".
- **Windup** — när I-delen fortsätter ackumulera fel medan utsignalen är mättad, vilket gör att regulatorn reagerar för sent när felet väl vänder. **Anti-windup** är en teknik som pausar I-delens uppräkning under mättning.
- **Dötid (L)** — tiden mellan att u ändras och att PV börjar reagera alls.
- **Självreglerande process** — en process som själv hittar ett nytt jämviktsläge efter en förändring i u (beskrivs av K och T).
- **Integrerande process** — en process utan egen jämvikt; PV fortsätter röra sig så länge u inte exakt matchar den last som håller processen still.
- **K, T, L** — processens förstärkning (K), tidskonstant (T) och dötid (L) i en självreglerande förstaordningsmodell.
- **Kp, Ti, Td** — regulatorns förstärkning, integraltid och derivatatid.
- **Lambda-metoden** — en systematisk metod för att beräkna Kp/Ti utifrån en vald önskad tidskonstant λ för det slutna systemet: Kp=T/(K·(λ+L)), Ti=T.
- **u_std** — standardavvikelsen hos utsignalen över en period vid stabil drift; facitets mått på hur "orolig"/bruskänslig en inställning är.

## Innehållsförteckning

- Uppgift 1: Regulatortyp som strategival (P / PI)
- Uppgift 2: Aggressivitet — matcha strategi till driftkrav
- Uppgift 3: Dötid — hur mycket måste strategin dämpas?
- Uppgift 4: Integrerande process — en annan strategi krävs
- Uppgift 5: Windup — ett strategibeslut, inte en eftertanke
- Uppgift 6: Prioritering — börvärdesföljning vs störningsavvisning
- Mästaruppgift 7: Skriv en reglerstrategi-PM

**Arbetssätt:** Klicka **"Återställ"** före varje nytt test när resultat ska jämföras. Anteckna dina motiveringar OCH de uppmätta värdena (slutvärde, fel, översläng, insvängningstid etc) i ett separat dokument — det är själva leveransen i dessa uppgifter, inte kurvorna. Vill du jämföra 2–3 körningar visuellt i efterhand, ta en skärmdump av grafen innan du återställer.

---

## Uppgift 1: Regulatortyp som strategival (P / PI)

**Syfte:** Öva att välja regulatortyp utifrån processens krav, inte som standardval.

### Fall A — Temperaturprocess där litet kvarstående fel accepteras
**Process:** Självreglerande, K=1.3, T=15s, Dötid=0s. **Börvärde:** 60.
**Krav:** Snabb respons viktigare än exakt slutvärde. Ett kvarstående fel accepteras **om det är högst 15 % av börvärdet** (dvs. slutvärdet måste ligga på minst 51).

1. Testa med enbart P (Ti=OFF, Td=OFF), Kp=2.0.
2. Notera **slutvärdet**, det kvarstående felet (i enheter och i %), och **insvängningstiden** (tiden tills kurvan planar ut och inte längre ändras nämnvärt) — du behöver alla tre för att jämföra med Fall B.
3. **Fråga:** Uppfyller P-reglering 15 %-kravet här? Varför/varför inte?
4. Fortsätt höja Kp tills felet hamnar under 15 %. Försvinner det helt, oavsett hur högt du sätter Kp?

### Fall B — Doseringsprocess där statiskt fel INTE accepteras
**Process:** Samma som Fall A (K=1.3, T=15s, Dötid=0s). **Börvärde:** 60.
**Krav:** Slutvärdet måste träffa börvärdet exakt (t.ex. dosering av kemikalie) — 0 % kvarstående fel accepteras.

1. Använd samma Kp (2.0) som i Fall A, lägg till Ti=15 (PI). Notera slutvärde, fel och insvängningstid — verifiera att felet försvinner helt och jämför insvängningstiden med Fall A.
2. **Fråga:** Varför duger inte P-reglering här trots att processen är identisk?

**Mätprotokoll Uppgift 1** (samma process, K=1.3/T=15/Dötid=0, SP=60, Kp=2.0 i båda):

| Fall | Ti | Slutvärde | Kvarstående fel | Fel i % | Insvängningstid |
|---|---|---|---|---|---|
| A (P) | OFF | | | | |
| B (PI) | 15 | | | | |

**Reflektion 1:**

- Skriv en tumregel för P och för PI: "Välj P när …", "Välj PI när …". 
- Kravet, inte processen, avgjorde valet i Fall A vs B (samma process!). Håller det resonemanget även i verkligheten?

---

## Uppgift 2: Aggressivitet — matcha strategi till driftkrav

**Syfte:** Samma process, två helt olika verksamhetskrav — visa att "bästa" inställning inte är ett absolut påstående.

**Process (samtliga fall):** Självreglerande, K=1.5, T=20.0, Dötid=5.0. Börvärde 60.

Vi använder Lambda-metoden för att beräkna Kp vid tre olika λ (Ti = T i samtliga): Kp = T / (K·(λ+Dötid)).

- **Konservativ:** λ=3T=60 → Kp≈0.21, Ti=20
- **Balanserad:** λ=T=20 → Kp≈0.53, Ti=20
- **Aggressiv:** λ=Dötid=5 → Kp≈1.33, Ti=20

### Fall A — Säkerhetskritisk process (t.ex. reaktortemperatur)
**Krav:** Överskjutning är oacceptabelt, oavsett tidsåtgång.

1. Kör PI-reglering med den konservativa inställningen (Kp=0.21, Ti=20).
2. Notera slutvärde, ev. översläng (%), insvängningstid och maximal utsignal — du behöver dessa för att jämföra med Fall B.
3. **Fråga:** Räcker konservativ, eller behöver du gå ännu försiktigare? Testa om osäker.

### Fall B — Genomströmningskritisk process (t.ex. produktionslinje)
**Krav:** Snabbast möjliga inställning accepteras, viss översläng är OK så länge systemet inte blir instabilt.

1. Kör PI-reglering med den aggressiva inställningen (Kp=1.33, Ti=20).
2. Notera slutvärde, översläng (%), insvängningstid och maximal utsignal.
3. **Fråga:** Var går gränsen innan det blir oacceptabelt — vad använder du som mått (översläng %, oscillation, marginal till instabilitet)? Vad hände med den maximala utsignalen vid den aggressiva inställningen — ligger den fortfarande under 100 %?

**Mätprotokoll Fall A/B** (K=1.5/T=20/Dötid=5, SP=60):

| Fall | Kp | Ti | Slutvärde | Översläng % | Insvängningstid | Max u |
|---|---|---|---|---|---|---|
| A (Konservativ) | 0.21 | 20 | | | | |
| B (Aggressiv) | 1.33 | 20 | | | | |

### Fall C — Lägg till derivata: går det att bli både snabbare och mjukare?
**Krav:** Undersök om Fall B:s aggressiva inställning kan förbättras ytterligare utan att ge upp säkerhetsmarginalen helt.

1. Utgå från Fall B:s aggressiva inställning (Kp=1.33, Ti=20). Byt läge till PID och lägg till Td=1. Kör samma börvärdessteg till 60.
2. Notera slutvärde, översläng (%) och insvängningstid. Jämför båda måtten med Fall B:s rena PI (Td=0).
3. **Fråga:** Vad hände med överslängen jämfört med Fall B? Och med den verkliga insvängningstiden — inte bara hur snabbt kurvan först närmar sig börvärdet, utan hur snabbt den helt slutar röra sig?
4. Aktivera brus (noiseStd ≈ 1.0) på PID-inställningen (Kp=1.33, Ti=20, Td=1). Jämför utsignalens (u) oro med samma brus men Td=0 (ren PI) — syns någon tydlig skillnad?
5. Höj Td ytterligare, t.ex. till Td=3 (fortfarande med brus aktiverat). Notera hur mycket mer utsignalen nu hoppar — och kontrollera också (utan brus) vad som hände med överslängen och insvängningstiden vid detta höga Td.
6. Gå tillbaka till PI (Td=0) med brus aktiverat. Jämför u och PV en sista gång mot båda PID-varianterna (Td=1 och Td=3).
7. **Fråga:** Fanns det ett Td-intervall där du fick en förbättring nästan utan bruskostnad (snabbare, mindre översläng, knappt märkbart oroligare utsignal)? Och ett intervall där mer Td gjorde saken sämre på alla mått samtidigt — inte bara brusigare, utan även långsammare och med mer översläng?

**Mätprotokoll Fall C** (Kp=1.33, Ti=20, samma process):

| Td | Översläng % | Insvängningstid | Utsignalens oro vid brus (låg/måttlig/hög) |
|---|---|---|---|
| 0 (Fall B) | | | |
| 1 | | | |
| 3 | | | |

**Reflektion 2:**

- Samma process gav två olika "rätta" svar i Fall A/B. Vad var det egentligen som styrde valet — processen eller kravet?
- Vilket av dina svar (A eller B) skulle du vilja ha extra säkerhetsmarginal på i verkligheten, och varför?
- Fall C visade att D-delen inte alltid är en ren avvägning (snabbhet mot brus) — inom rätt intervall kan den ge vinst på flera mått samtidigt, medan för mycket Td kan göra allt sämre på en gång. Vad säger det om att bara "lägga på mer D" som tumregel?
- Med brus aktiverat (steg 4–6) "lägger sig" PV aldrig lika stilla som i Fall A/B, oavsett hur du trimmar Kp/Ti/Td — mätbruset finns kvar i den avlästa signalen oavsett regulatorinställning. En regulator kan inte reglera bort ett brus som redan sitter i mätningen. Vad skulle du göra åt en brusig mätsignal i verkligheten, om trimning av regulatorn inte hjälper (t.ex. signalfiltrering, bättre/skyddad sensor, annan mätplacering)?

---

## Uppgift 3: Dötid — hur mycket måste strategin dämpas?

**Syfte:** Förstå dötid som en strategisk begränsning, inte bara ännu en parameter.

**Process:** Självreglerande, K=1.5, T=15s. Regulator: PI, Kp=1.5, Ti=20 (oförändrad i båda testerna).

1. **Test A:** Dötid L=0s. Kör börvärdessteg till 60. Notera slutvärde, ev. översläng (%) och insvängningstid.
2. **Test B:** Samma regulatorinställning, men L=5s. Kör samma steg. Notera samma tre mått som i Test A.
3. **Fråga:** Vad hände med *samma* regulatorinställning när enbart dötiden ändrades?
4. Justera regulatorn (t.ex. sänk Kp eller öka Ti) tills Test B inte längre har någon översläng (dvs. samma välartade kurvform som Test A, om än långsammare). Jämför den nya insvängningstiden med Test A:s — hur mycket längre tid tog det? Hur mycket "kostade" dötiden dig i aggressivitet?

**Mätprotokoll Uppgift 3:**

| Test | Dötid | Kp | Ti | Översläng % | Insvängningstid |
|---|---|---|---|---|---|
| A | 0s | 1.5 | 20 | | |
| B (ojusterad) | 5s | 1.5 | 20 | | |
| B (justerad) | 5s | | | ingen | |

**Reflektion 3:**

- Varför gör dötid processen svårare att reglera aggressivt trots att K och T är oförändrade?
- Om du inte visste dötiden i förväg — vilken strategi skulle du välja som standard (aggressiv eller försiktig) tills du mätt den? Motivera.

---

## Uppgift 4: Integrerande process — en annan strategi krävs

**Syfte:** Visa att strategivalet inte bara handlar om aggressivitet, utan om regulatortyp och grundläggande angreppssätt.

**Process:** Integrerande (tanknivå), K=0.01, L=1.0, utflöde 0.5, mätområde 0–100. Börvärde 60.

1. Testa enbart P-reglering (Kp=1.2). Kör länge nog (minst ~200 s) att se kurvan plana ut.
2. Notera var processvärdet landar (slutvärdet) och ungefär hur lång tid det tar innan kurvan slutar röra sig.
3. **Fråga:** Vad händer som *inte* händer vid självreglerande processer (jämför med Uppgift 1, Fall A)? Var landar processvärdet — och varför just där?
4. Byt till PI (t.ex. Kp=1.5, Ti=40–50). Testa samma börvärdessteg. Notera slutvärde/fel, ev. översläng och insvängningstid — jämför med Uppgift 1 Fall B (samma typ av krav, annan processtyp).
5. Aktivera pulsstörning (magnitud 1, ~10 steg — observera att "magnitud" läggs till processvärdet varje steg under hela pulsens längd, så en för stor magnitud/längd ger en orimligt kraftig störning) och observera återhämtningen.

**Mätprotokoll Uppgift 4:**

| Regulator | Kp | Ti | Slutvärde | Kvarstående fel | Översläng % | Insvängningstid |
|---|---|---|---|---|---|---|
| P | 1.2 | OFF | | | ingen | |
| PI | | | | | | |

**Reflektion 4:**

- Varför räcker inte P-reglering på en integrerande process, medan den fungerade "hyfsat" i Uppgift 1?
- Skulle du våga köra en aggressiv Lambda-strategi (Uppgift 2) rakt av på en integrerande process? Varför/varför inte?

---

## Uppgift 5: Windup — ett strategibeslut, inte en eftertanke

**Syfte:** Inse att anti-windup är en del av *strategin* när manöverdonet kan begränsas — inte något man lägger till efteråt när det redan gått fel.

**Process:** Självreglerande, K=1.0, T=20s. Regulator: PI, Kp=3.0, Ti=20.
**Utsignal begränsad:** Max 50. Börvärde 80.

1. **Test A:** Anti-windup AV. Kör börvärdessteg 0→80, låt processen ligga stilla ~150s (utsignalen kommer mätta i taket), sänk sedan börvärdet till 40 och fortsätt köra. Notera hur länge utsignalen ligger kvar i taket efter att börvärdet sänkts — var beredd på att det kan ta väldigt lång tid (betydligt längre än du först tror).
2. **Test B:** Samma allt, men Anti-windup PÅ. Upprepa. Notera ungefär hur snabbt (i sekunder) utsignalen börjar röra sig nedåt efter att börvärdet sänktes, och efter hur lång tid processvärdet har stabiliserats nära det nya börvärdet (40) — jämför direkt med väntetiden du noterade i Test A.
3. **Fråga:** Om du designade denna regulator *innan* idrifttagning och visste att ventilen/manöverdonet kunde begränsas till 50% — hade du valt samma Kp/Ti som utan den begränsningen? Hade du aktiverat anti-windup direkt eller väntat tills problemet syns?

**Mätprotokoll Uppgift 5** (tid räknad från att börvärdet sänktes 80→40):

| Test | Anti-windup | Tid tills u börjar röra sig | Tid tills PV stabiliserat nära 40 |
|---|---|---|---|
| A | AV | | |
| B | PÅ | | |

**Reflektion 5:**

- Vilka driftsituationer (utöver hårda utsignalgränser) kan orsaka windup?
- Formulera en strategiregel: "Om manöverdonet kan mättas, ska regulatorn alltid …".

---

## Uppgift 6: Prioritering — börvärdesföljning vs störningsavvisning

**Syfte:** Samma regulatortyp kan behöva trimmas olika beroende på vad som faktiskt händer mest i drift: börvärdesändringar eller störningar.

**Process:** Självreglerande, K=1.0, T=20s, Dötid=0s. Regulator: PID, Kp=1.0, Ti=10, Td=2.

### Fall A — Batchprocess med täta börvärdesändringar
**Drift:** Börvärdet ändras ofta (t.ex. varje batch), störningar är sällsynta.

1. Testa börvärdessteg 30→70→30 med nuvarande inställning.
2. Notera översläng (%) och insvängningstid för steget 30→70 — du behöver dessa för jämförelsen i Fall B, steg 3.

### Fall B — Kontinuerlig process med ständiga störningar, fast börvärde
**Drift:** Börvärdet ligger still på 50, men pulsstörningar (magnitud 2, 5 steg — kom ihåg att magnituden läggs till varje steg, så detta blir totalt +10) kommer regelbundet.

1. Testa samma inställning mot upprepade pulsstörningar vid fast börvärde. Notera maximal avvikelse från börvärdet (SP−PV) under och efter pulsen.
2. Justera Kp/Ti/Td för att prioritera snabb störningsåterhämtning, även om det skulle ge sämre börvärdessvar. Notera den nya maximala avvikelsen — hur mycket bättre blev den?
3. **Viktigt:** Testa dina nya, omtrimmade parametrar tillbaka på Fall A:s börvärdessteg (30→70→30). Notera översläng, insvängningstid, och om utsignalen mättar (når 100 %). Försämrades börvärdessvaret?

**Mätprotokoll Uppgift 6:**

| Inställning | Kp | Ti | Td | Fall A: Översläng % | Fall A: Insvängningstid | Fall B: Max avvikelse från SP |
|---|---|---|---|---|---|---|
| Ursprunglig | 1.0 | 10 | 2 | | | |
| Omtrimmad | | | | | | |

**Reflektion 6:**

- Blev samma parametrar optimala i Fall A och B, eller var det en avvägning?
- I vilken av dina verksamheter (om du kan komma på en) är störningsavvisning viktigare än börvärdesföljning — och tvärtom?

---

## Mästaruppgift 7: Skriv en reglerstrategi-PM

**Syfte:** Sätta samman uppgift 1–6 till ett sammanhängande strategival för ett realistiskt fall, presenterat som ett kort PM (inte bara en parametertabell).

### Scenario
Du är nyanställd processingenjör och ska föreslå en reglerstrategi för en process du själv får undersöka i simulatorn:

- **Process:** Självreglerande, K=0.7, T=40s, Dötid=6s. Normal drift 65 (t.ex. °C).
- **Säkerhetsgräns:** Utsignal får aldrig överstiga 85% (överhettningsskydd) — ställ in Utsignal Max=85.
- **Drift:** Börvärdet ändras sällan, men processen utsätts för återkommande störningar (flödesvariationer).
- **Notera innan du testar störningar:** utsignalen kan bara vara 0–85% — processen kan alltså bara *tillföras* mer (t.ex. värme), aldrig kylas aktivt. Om du kör störningstestet med börvärde = normalvärde (65) ligger regulatorns viloläge redan på u=0%. En störning som höjer processvärdet kan då inte motverkas aktivt av regulatorn — den kan bara gå till u=0% och vänta ut processens egen avklingning. Det är förväntat beteende, inte ett fel i simulatorn. Håll pulsstörningen liten (t.ex. magnitud 1, 5 steg — kom ihåg att magnituden läggs till varje steg).

**Mätprotokoll — testa 2–3 kandidatinställningar innan du skriver PM:et:**

| Kandidat | Kp  | Ti  | Fel | Översläng % | Insvängningstid | Max u |
| -------- | --- | --- | --- | ----------- | --------------- | ----- |
|          |     |     |     |             |                 |       |
|          |     |     |     |             |                 |       |
|          |     |     |     |             |                 |       |

### Uppgift
Skriv ett kort PM (en halv till en sida) som besvarar:

1. **Regulatortyp:** P, PI eller PID — och varför (koppla till Uppgift 1 för P/PI, Uppgift 2 Fall C för PID:s avvägningar)?
2. **Aggressivitet:** Konservativ, balanserad eller aggressiv — och varför, givet säkerhetsgränsen (koppla till Uppgift 2)?
3. **Dötidshänsyn:** Hur påverkar dötiden (6s) ditt val jämfört med om L=0 (koppla till Uppgift 3)?
4. **Windup:** Behöver du aktivera anti-windup givet utsignalgränsen 85%? Motivera (koppla till Uppgift 5).
5. **Prioritering:** Ska regulatorn primärt trimmas för börvärdessvar eller störningsavvisning, givet driftbeskrivningen (koppla till Uppgift 6)?
6. **Testresultat:** Ange den regulatorinställning du till slut testade i simulatorn och ett kort observerat resultat (stabiliseringstid, ev. översläng, beteende vid störningspuls) som styrker ditt PM.

**Reflektion 7:**

- Vilket av de fem besluten (1–5) styrde de andra mest?
- Om säkerhetsgränsen hade varit 100% istället för 85% — vilket/vilka av dina fem svar hade ändrats?

---

## Avslutande reflektion

- Vilken skillnad ser du mellan att "trimma parametrar" (simulatorns lärstigar) och att "välja en reglerstrategi" (denna samling)? Är det två separata steg i praktiken, eller går de in i varandra?
- Vilken av dagens sex strategifrågor (regulatortyp, aggressivitet, dötid, integrerande process, windup, prioritering) tror du är lättast att missa i ett verkligt projekt om man bara "kör på" med standardinställningar?
 
