# Övningsuppgifter: Reglerstrategier — Fördjupning
v0.1 — under uppbyggnad

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

Det här är den fördjupande fortsättningen på [ovningar-reglerstrategier.md](ovningar-reglerstrategier.md) ("grunddokumentet"). Gör grunduppgifterna först — den här samlingen bygger vidare på samma processer, resultat och termer utan att upprepa dem.

**Skillnaden mot grunddokumentet:** här är mindre givet. Du får processen och driftkravet, ibland en metod att tillämpa — men inte ett steg-för-steg-recept för exakt vilka värden du ska testa eller i vilken ordning. Du förväntas själv planera en rimlig testsekvens, avgöra vilka mått som är relevanta, och motivera dina val. Det är alltså inte "fler grunduppgifter" — det är uppgifter som kräver att du själv kopplar ihop metod och mätning.

**Förkunskaper:** Samtliga uppgifter i grunddokumentet genomförda.

**Mål:** Kunna tillämpa en systematisk inställningsmetod självständigt, kritiskt jämföra resultatet mot en annan metod, och avgöra när en avancerad teknik faktiskt behövs.

## Innehållsförteckning

- Fördjupning 1: Ziegler-Nichols — en klassisk metod som konkurrent till Lambda
- Fördjupning 2: *(under uppbyggnad)* — fullständig regulatorjämförelse på en integrerande process
- Fördjupning 3: *(under uppbyggnad)* — hur mycket måste du detune:a när utsignalgränsen skärps stegvis?
- Fördjupning 4: *(under uppbyggnad)* — kombinerad störning (brus + puls samtidigt)

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

## Fördjupning 2 *(under uppbyggnad)*

Planerat innehåll: en fullständig regulatorjämförelse (P/PI/PID, varsin aggressiv och "säker" variant) på grunddokumentets integrerande process (Uppgift 4) i en enda tabell — mer systematiskt än grunduppgiftens P-vs-PI-jämförelse.

## Fördjupning 3 *(under uppbyggnad)*

Planerat innehåll: samma process som grunddokumentets Uppgift 5 (windup), men med stegvis allt hårdare utsignalgräns (t.ex. 50→40→30→20 %). Hur mycket måste regulatorn detune:as vid varje steg för att undvika windup-problem, och var går gränsen för vad som är praktiskt reglerbart?

## Fördjupning 4 *(under uppbyggnad)*

Planerat innehåll: samma process som grunddokumentets Uppgift 6, men med brus och pulsstörning aktiverade SAMTIDIGT — en mer realistisk, sammansatt störningsbild än att testa dem var för sig.

---

## Avslutande reflektion

*(fylls i när samtliga fördjupningar är klara)*

---
**Svårighetsgrad:** Avancerad — kräver att grunddokumentet är genomfört.
