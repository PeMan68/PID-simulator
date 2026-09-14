# Övningsuppgifter: Reglerstrategier
*PID-simulator — uppgifter i lösbladsform, ej inbyggd lärstig*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

> **UTKAST** — under granskning, ej fastställt kursmaterial.

## Inledning

Där [ovningar-systemoptimering.md](ovningar-systemoptimering.md) tränar **hur** man
mekaniskt trimmar Kp/Ti/Td, tränar det här dokumentet **vilken reglerstrategi man väljer
och varför**. Varje uppgift ger en process och ett driftkrav — du ska välja/motivera
regulatortyp, aggressivitet och särskilda hänsyn (dötid, integrerande process, windup,
prioritering), inte hitta det matematiskt optimala parametersetet. Facit i denna samling
är alltså ett **resonemang**, inte ett tal.

**Förkunskaper:** Grundläggande PID-förståelse (P/I/D var för sig), gärna genomförda
uppgifter i systemoptimeringssamlingen.

**Mål:** Kunna koppla processens egenskaper och verksamhetens krav till ett medvetet val
av reglerstrategi, och kunna motivera det valet skriftligt.

**Avgränsning:** Denna samling förutsätter enkel-loop-reglering (en process, en regulator).
Kaskadreglering, kvotreglering, framkoppling och parameterstyrning kräver flera kopplade
processer/regulatorer och täcks i ett separat, senare uppdrag när simulatorn stödjer det.

## Innehållsförteckning

- Uppgift 1: Regulatortyp som strategival (P / PI / PID)
- Uppgift 2: Aggressivitet — matcha strategi till driftkrav
- Uppgift 3: Dötid — hur mycket måste strategin dämpas?
- Uppgift 4: Integrerande process — en annan strategi krävs
- Uppgift 5: Windup — ett strategibeslut, inte en eftertanke
- Uppgift 6: Prioritering — börvärdesföljning vs störningsavvisning
- Mästaruppgift 7: Skriv en reglerstrategi-PM

**Arbetssätt:** Klicka **"Återställ"** före varje nytt test — annars blandas den nya
körningen ihop med den förra. Anteckna dina motiveringar OCH de uppmätta värdena
(slutvärde, fel, översläng, insvängningstid) i ett separat dokument — det är själva
leveransen i dessa uppgifter, inte kurvorna. Appen har ingen inbyggd funktion för att
spara eller lägga flera kurvor ovanpå varandra — vill du jämföra 2–3 körningar visuellt
i efterhand, ta en skärmdump av grafen innan du återställer.

---

## Uppgift 1: Regulatortyp som strategival (P / PI / PID)

**Syfte:** Öva att välja regulatortyp utifrån processens krav, inte som standardval.

### Fall A — Temperaturprocess där litet kvarstående fel accepteras
**Process:** Självreglerande, K=1.3, T=15s, Dötid=0s. **Börvärde:** 60.
**Krav:** Snabb respons viktigare än exakt slutvärde. Ett kvarstående fel accepteras
**om det är högst 15 % av börvärdet** (dvs. slutvärdet måste ligga på minst 51).

1. Testa med enbart P (Ti=OFF, Td=OFF), Kp=2.0.
2. Notera **slutvärdet**, det kvarstående felet (i enheter och i %), och
   **insvängningstiden** (tiden tills kurvan planar ut och inte längre ändras nämnvärt) —
   du behöver alla tre för att jämföra med Fall B.
3. **Fråga:** Uppfyller P-reglering 15 %-kravet här? Varför/varför inte?
4. **Extra (frivilligt):** Höj Kp kraftigt, t.ex. till 6. Hamnar felet under 15 % nu?
   Försvinner det helt, oavsett hur högt du sätter Kp?

### Fall B — Doseringsprocess där statiskt fel INTE accepteras
**Process:** Samma som Fall A (K=1.3, T=15s, Dötid=0s). **Börvärde:** 60.
**Krav:** Slutvärdet måste träffa börvärdet exakt (t.ex. dosering av kemikalie) — 0 %
kvarstående fel accepteras.

1. Testa samma Kp (2.0) som i Fall A, enbart P.
2. **Fråga:** Varför duger inte P-reglering här trots att processen är identisk?
3. Lägg till Ti=15 (PI). Notera slutvärde, fel och insvängningstid — verifiera att
   felet försvinner helt och jämför insvängningstiden med Fall A.

### Fall C — Brusig mätsignal
**Process:** Samma som ovan, men aktivera brus (noiseStd ≈ 1.0). **Regulator:** samma
Kp=2.0, Ti=15 som Fall B.
**Krav:** Snabbast möjliga respons på störningar.

1. Testa PID med Td > 0 (t.ex. Td=2.0–3.0 — behövs för att effekten ska synas tydligt
   mot bruset) mot brus. Titta på hur mycket **utsignalen (u)** hoppar/skakar, inte bara
   PV-kurvan — det är där bruskänsligheten syns tydligast.
2. Testa PI (samma Kp=2.0, Ti=15, men Td=0) mot samma brus.
3. **Fråga:** När är D-delens vinst (snabbhet) värd priset (bruskänslighet)? Ge ett exempel
   ur Fall A–C var för sig.

**Reflektion 1:**
- Skriv en tumregel per regulatortyp: "Välj P när …", "Välj PI när …", "Välj PID när …".
- Kravet, inte processen, avgjorde valet i Fall A vs B (samma process!). Håller det
  resonemanget även i verkligheten?

---

## Uppgift 2: Aggressivitet — matcha strategi till driftkrav

**Syfte:** Samma process, två helt olika verksamhetskrav — visa att "bästa" inställning
inte finns i ett vakuum.

**Process (båda fallen):** Självreglerande, K=1.5, T=20.0, Dötid=5.0. Börvärde 60.

Använd Lambda-metoden för att beräkna Kp vid tre olika λ (Ti = T i samtliga):
Kp = T / (K·(λ+Dötid)).
- **Konservativ:** λ=3T=60 → Kp≈0.21, Ti=20
- **Balanserad:** λ=T=20 → Kp≈0.53, Ti=20
- **Aggressiv:** λ=Dötid=5 → Kp≈1.33, Ti=20

### Fall A — Säkerhetskritisk process (t.ex. reaktortemperatur)
**Krav:** Överskjutning är oacceptabelt, oavsett tidsåtgång.
1. Kör den konservativa inställningen (Kp=0.21, Ti=20).
2. Notera slutvärde, ev. översläng (%), insvängningstid och maximal utsignal — du
   behöver dessa för att jämföra med Fall B.
3. **Fråga:** Räcker konservativ, eller behöver du gå ännu försiktigare? Testa om osäker.

### Fall B — Genomströmningskritisk process (t.ex. produktionslinje)
**Krav:** Snabbast möjliga inställning accepteras, viss översläng är OK så länge systemet
inte blir instabilt.
1. Kör den aggressiva inställningen (Kp=1.33, Ti=20).
2. Notera slutvärde, översläng (%), insvängningstid och maximal utsignal.
3. **Fråga:** Var går gränsen innan det blir oacceptabelt — vad använder du som mått
   (översläng %, oscillation, marginal till instabilitet)? Vad hände med den maximala
   utsignalen vid den aggressiva inställningen — ligger den fortfarande under 100 %?

**Reflektion 2:**
- Samma process gav två olika "rätta" svar. Vad var det egentligen som styrde valet —
  processen eller kravet?
- Vilket av dina svar (A eller B) skulle du vilja ha extra säkerhetsmarginal på i
  verkligheten, och varför?

---

## Uppgift 3: Dötid — hur mycket måste strategin dämpas?

**Syfte:** Förstå dötid som en strategisk begränsning, inte bara ännu en parameter.

**Process:** Självreglerande, K=1.5, T=15s. Regulator: PI, Kp=1.5, Ti=20 (oförändrad i
båda testerna).

1. **Test A:** Dötid L=0s. Kör börvärdessteg till 60. Notera slutvärde, ev. översläng
   (%) och insvängningstid.
2. **Test B:** Samma regulatorinställning, men L=5s. Kör samma steg. Notera samma tre
   mått som i Test A.
3. **Fråga:** Vad hände med *samma* regulatorinställning när enbart dötiden ändrades?
4. Justera regulatorn (t.ex. sänk Kp eller öka Ti) tills Test B inte längre har någon
   översläng (dvs. samma välartade kurvform som Test A, om än långsammare). Jämför den
   nya insvängningstiden med Test A:s — hur mycket längre tid tog det? Hur mycket
   "kostade" dötiden dig i aggressivitet?

**Reflektion 3:**
- Varför gör dötid processen svårare att reglera aggressivt trots att K och T är oförändrade?
- Om du inte visste dötiden i förväg — vilken strategi skulle du välja som standard
  (aggressiv eller försiktig) tills du mätt den? Motivera.

---

## Uppgift 4: Integrerande process — en annan strategi krävs

**Syfte:** Visa att strategivalet inte bara handlar om aggressivitet, utan om regulatortyp
och grundläggande angreppssätt.

**Process:** Integrerande (tanknivå), K=0.01, T=1.0, normalvärde 20, utflöde 0.5,
mätområde 0–100. Börvärde 60.

1. Testa enbart P-reglering (Kp=1.2). Kör länge nog (minst ~200 s) att se kurvan plana ut.
2. Notera var processvärdet landar (slutvärdet) och ungefär hur lång tid det tar innan
   kurvan slutar röra sig.
3. **Fråga:** Vad händer som *inte* händer vid självreglerande processer (jämför med
   Uppgift 1, Fall A)? Var landar processvärdet — och varför just där?
4. Byt till PI (t.ex. Kp=1.5, Ti=40–50). Testa samma börvärdessteg. Notera slutvärde/fel,
   ev. översläng och insvängningstid — jämför med Uppgift 1 Fall B (samma typ av krav,
   annan processtyp).
5. Aktivera pulsstörning (magnitud 1, ~10 steg — observera att "magnitud" läggs till
   processvärdet varje steg under hela pulsens längd, så en för stor magnitud/längd ger
   en orimligt kraftig störning) och observera återhämtningen.

**Reflektion 4:**
- Varför räcker inte P-reglering på en integrerande process, medan den fungerade
  "hyfsat" i Uppgift 1?
- Vilka verkliga processer i din bransch är integrerande snarare än självreglerande?
- Skulle du våga köra en aggressiv Lambda-strategi (Uppgift 2) rakt av på en integrerande
  process? Varför/varför inte?

---

## Uppgift 5: Windup — ett strategibeslut, inte en eftertanke

**Syfte:** Inse att anti-windup är en del av *strategin* när manöverdonet kan begränsas —
inte något man lägger till efteråt när det redan gått fel.

**Process:** Självreglerande, K=1.0, T=20s. Regulator: PI, Kp=3.0, Ti=20.
**Utsignal begränsad:** Max 50. Börvärde 80.

1. **Test A:** Anti-windup AV. Kör börvärdessteg 0→80, låt processen ligga stilla ~150s
   (utsignalen kommer mätta i taket), sänk sedan börvärdet till 40 och fortsätt köra.
   Notera hur länge utsignalen ligger kvar i taket efter att börvärdet sänkts — var
   beredd på att det kan ta väldigt lång tid (betydligt längre än du först tror).
2. **Test B:** Samma allt, men Anti-windup PÅ. Upprepa. Notera ungefär hur snabbt (i
   sekunder) utsignalen börjar röra sig nedåt efter att börvärdet sänktes, och efter hur
   lång tid processvärdet har stabiliserats nära det nya börvärdet (40) — jämför direkt
   med väntetiden du noterade i Test A.
3. **Fråga:** Om du designade denna regulator *innan* idrifttagning och visste att
   ventilen/manöverdonet kunde begränsas till 50% — hade du valt samma Kp/Ti som utan den
   begränsningen? Hade du aktiverat anti-windup direkt eller väntat tills problemet syns?

**Reflektion 5:**
- Vilka driftsituationer (utöver hårda utsignalgränser) kan orsaka windup?
- Formulera en strategiregel: "Om manöverdonet kan mättas, ska regulatorn alltid …".

---

## Uppgift 6: Prioritering — börvärdesföljning vs störningsavvisning

**Syfte:** Samma regulatortyp kan behöva trimmas olika beroende på vad som faktiskt
händer mest i drift: börvärdesändringar eller störningar.

**Process:** Självreglerande, K=1.0, T=20s, Dötid=0s. Regulator: PID, Kp=1.0, Ti=10, Td=2.

### Fall A — Batchprocess med täta börvärdesändringar
**Drift:** Börvärdet ändras ofta (t.ex. varje batch), störningar är sällsynta.
1. Testa börvärdessteg 30→70→30 med nuvarande inställning.
2. Notera översläng (%) och insvängningstid för steget 30→70 — du behöver dessa för
   jämförelsen i Fall B, steg 3.

### Fall B — Kontinuerlig process med ständiga störningar, fast börvärde
**Drift:** Börvärdet ligger still på 50, men pulsstörningar (magnitud 2, 5 steg — kom
ihåg att magnituden läggs till varje steg, så detta blir totalt +10) kommer regelbundet.
1. Testa samma inställning mot upprepade pulsstörningar vid fast börvärde. Notera
   maximal avvikelse från börvärdet (SP−PV) under och efter pulsen.
2. Justera Kp/Ti/Td för att prioritera snabb störningsåterhämtning, även om det skulle
   ge sämre börvärdessvar. Notera den nya maximala avvikelsen — hur mycket bättre blev
   den?
3. **Viktigt:** Testa dina nya, omtrimmade parametrar tillbaka på Fall A:s
   börvärdessteg (30→70→30). Notera översläng, insvängningstid, och om utsignalen
   mättar (når 100 %). Försämrades börvärdessvaret?

**Reflektion 6:**
- Blev samma parametrar optimala i Fall A och B, eller var det en avvägning?
- I vilken av dina verksamheter (om du kan komma på en) är störningsavvisning viktigare
  än börvärdesföljning — och tvärtom?

---

## Mästaruppgift 7: Skriv en reglerstrategi-PM

**Syfte:** Sätta samman uppgift 1–6 till ett sammanhängande strategival för ett realistiskt
fall, presenterat som ett kort PM (inte bara en parametertabell).

### Scenario
Du är nyanställd processingenjör och ska föreslå en reglerstrategi för en process du
själv får undersöka i simulatorn:

- **Process:** Självreglerande, K=0.7, T=40s, Dötid=6s. Normal drift 65 (t.ex. °C).
- **Säkerhetsgräns:** Utsignal får aldrig överstiga 85% (överhettningsskydd) —
  ställ in Utsignal Max=85.
- **Drift:** Börvärdet ändras sällan, men processen utsätts för återkommande
  störningar (flödesvariationer).
- **Notera innan du testar störningar:** utsignalen kan bara vara 0–85% — processen kan
  alltså bara *tillföras* mer (t.ex. värme), aldrig kylas aktivt. Om du kör
  störningstestet med börvärde = normalvärde (65) ligger regulatorns viloläge redan på
  u=0%. En störning som höjer processvärdet kan då inte motverkas aktivt av regulatorn —
  den kan bara gå till u=0% och vänta ut processens egen avklingning. Det är förväntat
  beteende, inte ett fel i simulatorn. Håll pulsstörningen liten (t.ex. magnitud 1,
  5 steg — kom ihåg att magnituden läggs till varje steg).

### Uppgift
Skriv ett kort PM (en halv till en sida) som besvarar:

1. **Regulatortyp:** P, PI eller PID — och varför (koppla till Uppgift 1)?
2. **Aggressivitet:** Konservativ, balanserad eller aggressiv — och varför, givet
   säkerhetsgränsen (koppla till Uppgift 2)?
3. **Dötidshänsyn:** Hur påverkar dötiden (6s) ditt val jämfört med om L=0 (koppla till
   Uppgift 3)?
4. **Windup:** Behöver du aktivera anti-windup givet utsignalgränsen 85%? Motivera
   (koppla till Uppgift 5).
5. **Prioritering:** Ska regulatorn primärt trimmas för börvärdessvar eller
   störningsavvisning, givet driftbeskrivningen (koppla till Uppgift 6)?
6. **Testresultat:** Ange den regulatorinställning du till slut testade i simulatorn och
   ett kort observerat resultat (stabiliseringstid, ev. översläng, beteende vid
   störningspuls) som styrker ditt PM.

**Reflektion 7:**
- Vilket av de fem besluten (1–5) styrde de andra mest?
- Om säkerhetsgränsen hade varit 100% istället för 85% — vilket/vilka av dina fem svar
  hade ändrats?

---

## Avslutande reflektion

- Vilken skillnad ser du mellan att "trimma parametrar" (systemoptimeringssamlingen) och
  att "välja en reglerstrategi" (denna samling)? Är det två separata steg i praktiken,
  eller går de in i varandra?
- Vilken av dagens sex strategifrågor (regulatortyp, aggressivitet, dötid, integrerande
  process, windup, prioritering) tror du är lättast att missa i ett verkligt projekt om man
  bara "kör på" med standardinställningar?

---
**Svårighetsgrad:** Medel-Avancerad
