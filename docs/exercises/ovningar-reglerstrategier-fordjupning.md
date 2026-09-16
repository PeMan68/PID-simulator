# Övningsuppgifter: Reglerstrategier — Fördjupning
*Dokumentversion 1.0, Övningsuppgifter för PID-simulator 1.5.3 eller högre*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

Det här är den fördjupande fortsättningen på [ovningar-reglerstrategier.md](ovningar-reglerstrategier.md) ("grunddokumentet"). Gör grunduppgifterna först — den här samlingen bygger vidare på samma processer, resultat och termer utan att upprepa dem.

**Skillnaden mot grunddokumentet:** här är mindre givet. Du får processen och driftkravet, ibland en metod att tillämpa — men inte ett steg-för-steg-recept för exakt vilka värden du ska testa eller i vilken ordning. Du förväntas själv planera en rimlig testsekvens, avgöra vilka mått som är relevanta, och motivera dina val. Det är alltså inte "fler grunduppgifter" — det är uppgifter som kräver att du själv kopplar ihop metod och mätning.

**Förkunskaper:** Samtliga uppgifter i grunddokumentet genomförda.

**Mål:** Kunna tillämpa en systematisk inställningsmetod självständigt, kritiskt jämföra resultatet mot en annan metod, och avgöra när en avancerad teknik faktiskt behövs.

## Innehållsförteckning

- Fördjupning 1: Ziegler-Nichols — en klassisk metod som konkurrent till Lambda
- Fördjupning 2: Fullständig regulatorjämförelse på en integrerande process
- Fördjupning 3: Stegvis skärpta utsignalgränser — detuning eller anti-windup?
- Fördjupning 4: Kombinerad störning — brus och puls samtidigt

---

## Fördjupning 1: Ziegler-Nichols — en klassisk metod som konkurrent till Lambda

**Syfte:** Tillämpa en andra systematisk inställningsmetod på samma process som grunddokumentets Uppgift 2, och göra en kritisk jämförelse — vinner "facit-metoden" (Lambda) alltid?

**Process:** Samma som grunddokumentets Uppgift 2: Självreglerande, K=1.5, T=20.0, Dötid=5.0. Börvärde 60. (Du har redan Lambda-metodens tre resultat på denna process från grunduppgiften — du kommer behöva dem för jämförelsen i steg 5.)

### Metoden (Ziegler-Nichols, slutna slingans metod)

1. Kör ren P-reglering (Ti=OFF, Td=OFF). Öka Kp stegvis tills systemet svänger med **konstant amplitud** — varken avtagande (för lågt Kp) eller växande (för högt Kp). Det Kp-värdet är den **kritiska förstärkningen**, Ku.
   - *Vägledning, inte facit:* leta i intervallet Kp = 1–10. Svängningen kan se lite "fyrkantig" ut vid själva den kritiska punkten om utsignalen tillfälligt mättar i topparna — det är förväntat, inte ett tecken på att något är fel.
2. Mät svängningens **period** Tu (tiden mellan två på varandra följande toppar) när du kört tillräckligt länge (minst 300–400 s) för att vara säker på att amplituden verkligen är konstant, inte bara långsamt avtagande.
3. Beräkna med Ziegler-Nichols formler:

| Regulator | Kp | Ti | Td |
|---|---|---|---|
| P | 0,5·Ku | — | — |
| PI | 0,45·Ku | Tu/1,2 | — |
| PID | 0,6·Ku | Tu/2 | Tu/8 |

4. Testa alla tre och mät samma mått du är van vid från grunddokumentet (slutvärde, översläng, insvängningstid, max u).
5. Jämför med Lambda-metodens tre resultat på **samma process** (grunddokumentets Uppgift 2, Fall A/B och tabellen du fyllde i där). Ziegler-Nichols ger bara EN inställning per regulatortyp — inte tre nivåer av aggressivitet som Lambda. Vilken av dina tre ZN-inställningar (P/PI/PID) ligger närmast Lambda-metodens Konservativ/Balanserad/Aggressiv, om du jämför insvängningstid och översläng?

### Mätprotokoll — sök efter kritisk förstärkning

| Kp | Avtagande / konstant / växande svängning? |
|---|---|
| | |
| | |
| | |
| | |

**Ku (kritisk förstärkning) = _____   Tu (period) = _____ s**

### Mätprotokoll — Ziegler-Nichols-resultat vs. Lambda

| Regulator | Kp | Ti | Td | Slutvärde | Översläng % | Insvängningstid | Max u |
|---|---|---|---|---|---|---|---|
| ZN P | | — | — | | | | |
| ZN PI | | | — | | | | |
| ZN PID | | | | | | | |
| *(från grunddokumentet)* Lambda Konservativ | 0,21 | 20 | — | | | | |
| *(från grunddokumentet)* Lambda Balanserad | 0,53 | 20 | — | | | | |
| *(från grunddokumentet)* Lambda Aggressiv | 1,33 | 20 | — | | | | |

**Reflektion:**
- Ziegler-Nichols kräver att du faktiskt driver processen till gränsen av instabilitet för att hitta Ku. Vilka verkliga processer skulle du INTE våga göra det på? Vad gör man då istället?
- Lambda-metoden lät dig välja aggressivitet fritt (λ). Ziegler-Nichols ger bara en fast, ganska aggressiv inställning per regulatortyp. Är det en styrka eller en svaghet?
- Om din ZN PID-inställning gav mer översläng än Lambda Aggressiv — betyder det att Ziegler-Nichols är en sämre metod, eller mäter du bara "aggressivitet" på olika sätt? Motivera.
- Ziegler-Nichols är över 80 år gammal och fortfarande i bruk i industrin. Vad tror du är skälet, givet vad du just sett?

---

## Fördjupning 2: Fullständig regulatorjämförelse på en integrerande process

**Syfte:** Bygga en systematisk, egen jämförelsetabell istället för att bara följa två föreskrivna tester (som i grunddokumentets Uppgift 4).

**Process:** Samma som grunddokumentets Uppgift 4: Integrerande (tanknivå), K=0.01, L=1.0, utflöde 0.5. Börvärde 60.

### Uppgift
Designa och testa **två varianter vardera** av P, PI och PID — en **aggressiv** och en **säker** variant (6 tester totalt). Du väljer själva Kp/Ti/Td-värdena; det finns inget facit-recept här. Utgå från vad du redan vet:
- P kan aldrig ge nollfel på denna process (grunddokumentets Uppgift 4) — men hur nära börvärdet kan du ändå komma med en tillräckligt hög Kp, och vad kostar det (utsignal, marginal)?
- PI ger nollfel, men hur mycket översläng är du beredd att acceptera för snabbhet?
- Testa om PID (lägg till Td) faktiskt hjälper här, på samma sätt som du undersökte i grunddokumentets Uppgift 2 Fall C. Räkna inte med att svaret blir detsamma som där.

**Mätprotokoll:**

| Regulator | Variant | Kp | Ti | Td | Slutvärde | Kvarstående fel | Översläng % | Insvängningstid | Max u |
|---|---|---|---|---|---|---|---|---|---|
| P | Säker | | — | — | | | | | |
| P | Aggressiv | | — | — | | | | | |
| PI | Säker | | | — | | | | | |
| PI | Aggressiv | | | — | | | | | |
| PID | Säker | | | | | | | | |
| PID | Aggressiv | | | | | | | | |

**Reflektion:**
- Vilken av dina sex inställningar skulle du faktiskt rekommendera för en verklig tanknivåreglering, och varför?
- Hjälpte Td dig här på samma sätt som i Uppgift 2 Fall C? Om inte — vad tror du skiljer de två situationerna åt (dötidens storlek relativt processens övriga dynamik är en ledtråd)?
- Din "säkra P" hamnar sannolikt fortfarande långt ifrån börvärdet. Finns det ett Kp-värde som gör att P-only "fungerar bra nog" här, eller är regulatortypen i sig fel val oavsett hur du trimmar den (jämför med grunddokumentets Reflektion 4)?

---

## Fördjupning 3: Stegvis skärpta utsignalgränser — detuning eller anti-windup?

**Syfte:** Undersöka om man kan "trimma bort" ett windup-problem genom försiktigare Kp/Ti, eller om anti-windup är den enda verkliga lösningen.

**Process:** Samma som grunddokumentets Uppgift 5: Självreglerande, K=1.0, T=20s. Regulator: PI, Kp=3.0, Ti=20. Börvärde 80.

### Del 1 — utan anti-windup, tre allt hårdare gränser
Kör samma sekvens som grunddokumentets Uppgift 5 Test A (börvärdessteg 0→80, låt ligga stilla ~150s, sänk sedan börvärdet till 15) vid **tre olika Utsignal Max**: 50 %, 40 % och 30 %. Anti-windup AV i alla tre.

**Mätprotokoll, Del 1:**

| Utsignal Max | Tid tills u börjar röra sig efter SP-sänkning | Tid tills PV stabiliserat nära 15 |
|---|---|---|
| 50 % | | |
| 40 % | | |
| 30 % | | |

### Del 2 — försök lösa det genom att sänka Kp/Ti (fortfarande utan anti-windup)
Vid den hårdaste gränsen (30 %) från Del 1: försök förbättra återhämtningstiden genom att sänka Kp och/eller Ti — fortfarande med anti-windup AV. Testa minst två kombinationer.

**Mätprotokoll, Del 2:**

| Kp | Ti | Tid tills u börjar röra sig | Tid tills PV stabiliserat nära 15 |
|---|---|---|---|
| 3.0 (ojusterad, från Del 1) | 20 | | |
| | | | |
| | | | |

### Del 3 — samma tre gränser, men med anti-windup PÅ
Upprepa exakt Del 1:s tre tester (Kp=3.0, Ti=20 oförändrat), men med anti-windup PÅ.

**Mätprotokoll, Del 3:**

| Utsignal Max | Tid tills u börjar röra sig | Tid tills PV stabiliserat nära 15 |
|---|---|---|
| 50 % | | |
| 40 % | | |
| 30 % | | |

**Reflektion:**
- Hjälpte det att sänka Kp/Ti i Del 2, jämfört med att bara aktivera anti-windup i Del 3?
- Formulera om din strategiregel från grunddokumentets Reflektion 5 ("Om manöverdonet kan mättas ska regulatorn alltid…") baserat på vad du just sett — behöver den skärpas?
- I Del 1 blev återhämtningstiden dramatiskt längre för varje steg mot en hårdare gräns. I Del 3 var skillnaden knappt märkbar. Vad säger det om HUR mycket du behöver oroa dig för exakt var utsignalgränsen sätts, förutsatt att anti-windup är aktiverat?

---

## Fördjupning 4: Kombinerad störning — brus och puls samtidigt

**Syfte:** Undersöka om en inställning som redan var en kompromiss (Uppgift 6:s omtrimmade PID) håller när verkligheten lägger till ännu en komplikation.

**Process:** Samma som grunddokumentets Uppgift 6, Fall B: Självreglerande, K=1.0, T=20s, Dötid=0s. Börvärde 50 (fast). Pulsstörning (magnitud 2, 5 steg).

### Uppgift
Du har redan två inställningar från grunddokumentets Uppgift 6: den **ursprungliga** (Kp=1.0, Ti=10, Td=2) och din **omtrimmade** (Kp=2, Ti=6, Td=3, optimerad för störningsåterhämtning). Testa nu båda igen — men aktivera **brus (noiseStd ≈ 1.0) SAMTIDIGT** med pulsstörningen, inte var för sig.

**Mätprotokoll:**

| Inställning | Max avvikelse från SP (endast puls, från Uppgift 6) | Max avvikelse från SP (puls + brus) | Utsignalens oro (puls + brus) |
|---|---|---|---|
| Ursprunglig | | | |
| Omtrimmad | | | |

**Reflektion:**
- I grunddokumentets Uppgift 6 vann den omtrimmade inställningen på störningsåterhämtning. Vinner den fortfarande när brus också är med i bilden — eller finns det en dold kostnad som bara syns när båda störningarna är aktiva samtidigt?
- Om du var tvungen att välja EN inställning att driftsätta, och du visste att verkligheten alltid innehåller BÅDE kontinuerligt brus och enstaka pulser — skulle du välja annorlunda än om du bara testat dem var för sig (som i Uppgift 6)?
- Koppla till Uppgift 2 Fall C: gäller samma lärdom om D-delens avvägning (snabbhet mot brus) här, i en annan process och ett annat sammanhang?

---

**Svårighetsgrad:** Avancerad — kräver att grunddokumentet är genomfört.
