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

**Arbetssätt:** Klicka **"Återställ"** före varje nytt test. Anteckna dina motiveringar i
ett separat dokument — det är själva leveransen i dessa uppgifter, inte kurvorna. Använd
gärna "Spara" för att jämföra 2–3 kurvor visuellt när du ska styrka ett resonemang.

---

## Uppgift 1: Regulatortyp som strategival (P / PI / PID)

**Syfte:** Öva att välja regulatortyp utifrån processens krav, inte som standardval.

### Fall A — Nivåprocess där litet kvarstående fel accepteras
**Process:** Självreglerande, K=1.3, T=15s, Dötid=0s. **Börvärde:** 60.
**Krav:** Snabb respons viktigare än exakt slutvärde; litet statiskt fel är OK.

1. Testa med enbart P (Ti=OFF, Td=OFF), rimligt Kp.
2. Notera slutvärde och statiskt fel.
3. **Fråga:** Uppfyller P-reglering kraven här? Varför/varför inte?

### Fall B — Doseringsprocess där statiskt fel INTE accepteras
**Process:** Samma som Fall A (K=1.3, T=15s, Dötid=0s). **Börvärde:** 60.
**Krav:** Slutvärdet måste träffa börvärdet exakt (t.ex. dosering av kemikalie).

1. Testa samma Kp som i Fall A, enbart P.
2. **Fråga:** Varför duger inte P-reglering här trots att processen är identisk?
3. Lägg till Ti (rimligt värde) och verifiera att felet försvinner.

### Fall C — Brusig mätsignal
**Process:** Samma som ovan, men aktivera brus (noiseStd ≈ 1.0).
**Krav:** Snabbast möjliga respons på störningar.

1. Testa PID med Td > 0 (t.ex. Td=1.0) mot brus.
2. Testa PI (Td=0) mot samma brus.
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

**Process (båda fallen):** Självreglerande, K=1.0, T=20.0, Dötid=5.0. Börvärde 60.

Utgå från Lambda-metodens tre färdiga scenarier (samma process, olika λ):
- Konservativ: Kp=1.33, Ti=20 (λ=L=5, se `lambda-pi-conservative`)
- Balanserad/aggressiv: testa själv med lägre λ, eller använd `lambda-pi-aggressive`

### Fall A — Säkerhetskritisk process (t.ex. reaktortemperatur)
**Krav:** Överskjutning är oacceptabelt, oavsett tidsåtgång.
1. Kör den konservativa Lambda-inställningen.
2. **Fråga:** Räcker konservativ, eller behöver du gå ännu försiktigare? Testa om osäker.

### Fall B — Genomströmningskritisk process (t.ex. produktionslinje)
**Krav:** Snabbast möjliga inställning accepteras, viss översläng är OK så länge systemet
inte blir instabilt.
1. Kör en mer aggressiv Lambda-inställning (lägre λ).
2. **Fråga:** Var går gränsen innan det blir oacceptabelt — vad använder du som mått
   (översläng %, oscillation, marginal till instabilitet)?

**Reflektion 2:**
- Samma process gav två olika "rätta" svar. Vad var det egentligen som styrde valet —
  processen eller kravet?
- Vilket av dina svar (A eller B) skulle du vilja ha extra säkerhetsmarginal på i
  verkligheten, och varför?

---

## Uppgift 3: Dötid — hur mycket måste strategin dämpas?

**Syfte:** Förstå dötid som en strategisk begränsning, inte bara ännu en parameter.

**Process:** Självreglerande, K=1.5, T=15s. Regulator: PI, Kp=1.5, Ti=20 (oförändrad i
båda testerna — se `pi-deadtime-comparison`).

1. **Test A:** Dötid L=0s. Kör börvärdessteg till 60. Notera översläng/beteende.
2. **Test B:** Samma regulatorinställning, men L=5s. Kör samma steg.
3. **Fråga:** Vad hände med *samma* regulatorinställning när enbart dötiden ändrades?
4. Justera regulatorn (t.ex. sänk Kp eller öka Ti) tills Test B blir lika välartat som
   Test A. Hur mycket "kostade" dötiden dig i aggressivitet?

**Reflektion 3:**
- Varför gör dötid processen svårare att reglera aggressivt trots att K och T är oförändrade?
- Om du inte visste dötiden i förväg — vilken strategi skulle du välja som standard
  (aggressiv eller försiktig) tills du mätt den? Motivera.

---

## Uppgift 4: Integrerande process — en annan strategi krävs

**Syfte:** Visa att strategivalet inte bara handlar om aggressivitet, utan om regulatortyp
och grundläggande angreppssätt.

**Process:** Integrerande (tanknivå), K=0.01, T=1.0, normalvärde 20, utflöde 0.5,
mätområde 0–100. Börvärde 60 (se `integrating-pi`).

1. Testa enbart P-reglering (rimligt Kp, t.ex. 1.2). Kör länge nog att se hela förloppet.
2. **Fråga:** Vad händer som *inte* händer vid självreglerande processer (jämför med
   Uppgift 1, Fall A)?
3. Byt till PI (t.ex. Kp=1.5, Ti=80). Testa samma börvärdessteg.
4. Aktivera pulsstörning (magnitud 5, ~20 steg) och observera återhämtningen.

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
**Utsignal begränsad:** Max 50 (se `pi-windup-demo`). Börvärde 80.

1. **Test A:** Anti-windup AV. Kör börvärdessteg 0→80, notera hur länge utsignalen ligger
   i taket och vad som händer när du sedan sänker börvärdet till 40.
2. **Test B:** Samma allt, men Anti-windup PÅ. Upprepa.
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

**Process:** Självreglerande, K=1.0, T=20s, Dötid=0s. Regulator: PID, Kp=1.0, Ti=10, Td=2
(se `pid-pulse-rejection`).

### Fall A — Batchprocess med täta börvärdesändringar
**Drift:** Börvärdet ändras ofta (t.ex. varje batch), störningar är sällsynta.
1. Testa börvärdessteg 30→70→30 med nuvarande inställning. Bedöm respons.

### Fall B — Kontinuerlig process med ständiga störningar, fast börvärde
**Drift:** Börvärdet ligger still på 50, men pulsstörningar (magnitud 10, 5 steg) kommer
regelbundet.
1. Testa samma inställning mot upprepade pulsstörningar vid fast börvärde.
2. Justera Kp/Ti/Td för att prioritera snabb störningsåterhämtning, även om det skulle
   ge sämre börvärdessvar.

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
