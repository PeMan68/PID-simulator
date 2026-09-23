# Övningsuppgifter: Parameterstyrning och olinjär ventilkarakteristik
*Dokumentversion 1.1. Kräver PID Simulator 1.6.0 eller högre (parametergrupperna heter Processinställning/Regulatorkonfiguration/Processpåverkan sedan UX-004, med Parameterstyrning och Olinjär ventilkarakteristik bakom en "Avancerat"-disklosyr).*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

Simulatorns lärstig "Parameterstyrning och olinjär ventilkarakteristik" visar konceptet steg för steg med ett fast, färdigbyggt exempel. Det här dokumentet är fristående lösblad — samma mönster som `ovningar-reglerstrategier.md` — där du själv ställer in processen och regulatorn enligt instruktionerna och antecknar vad du observerar. Facit är alltså delvis egna mätningar, inte ett facit-tal simulatorn visar.

**Förkunskaper:** Grundläggande PID-förståelse (P/I/D var för sig, vad Kp/PB betyder), gärna genomförd lärstigen "Parameterstyrning och olinjär ventilkarakteristik".

**Mål:** Kunna förklara varför en processs egen förstärkning kan variera med driftpunkten, känna igen symptomen (samma regulator presterar olika bra på olika håll), och kunna använda Parameterstyrning för att lösa problemet utan att manuellt kompromissa.

## Termer och definitioner

- **Olinjär ventilkarakteristik** — processens förstärkning K väljs i tre fasta zoner beroende på var utsignalen u befinner sig, istället för att vara ett konstant tal. Fältet finns i **Processinställning → Avancerat**, bara för processtyp Självreglerande.
- **Parameterstyrning (Gain Scheduling)** — regulatorns Kp/Ti/Td väljs i tre fasta zoner beroende på var PV befinner sig, istället för att vara konstanta. Fältet finns i **Regulatorkonfiguration → Avancerat**.
- **Avancerat** — en hopfällbar sektion längst ner i respektive parametergrupp (klicka på "▸ Avancerat" för att fälla ut den). Fälten ovan öppnas AUTOMATISKT om det laddade scenariot redan har funktionen aktiverad — annars måste du klicka upp sektionen själv innan du kan se/ändra fälten. Uppgifterna nedan säger uttryckligen till när ett manuellt klick behövs.
- **Zon** — ett av de tre fasta driftpunktsintervallen (Zon 1 lägst, Zon 3 högst). Vilken zon som gäller just nu visas i statusraden när respektive funktion är aktiverad.
- **Brytpunkt** — gränsvärdet mellan två zoner. Två brytpunkter delar in 0–100 i tre zoner. Ritas som en streckad hjälplinje i grafen (orange för Parameterstyrning, grön för ventilkarakteristik) när respektive funktion är aktiverad.
- **K, T, L, Kp, Ti, Td** — se `ovningar-reglerstrategier.md` för grundläggande definitioner om de är nya begrepp för dig.

## Innehållsförteckning

- Uppgift 1: Olinjär ventilkarakteristik — se att samma Kp beter sig olika (grundläggande)
- Uppgift 2: Olinjär ventilkarakteristik — bygg din egen karakteristik (utforskande)
- Uppgift 3: Parameterstyrning — lös kompromissen (grundläggande)
- Uppgift 4: Parameterstyrning — designa ditt eget schema (utforskande)

**Arbetssätt:** Klicka **"Återställ system"** före varje nytt test när resultat ska jämföras. Anteckna dina motiveringar OCH de uppmätta värdena i ett separat dokument — det är själva leveransen. Läs av "ungefär hur många steg det tar innan PV stabiliserat sig" genom att titta i grafen eller stega fram tills kurvan planar ut.

---

## Uppgift 1: Olinjär ventilkarakteristik — se att samma Kp beter sig olika

**Syfte:** Se med egna ögon att en processs egen förstärkning kan skilja sig åt beroende på driftpunkt, och vad det gör med regleringen.

**Process:** Ladda scenariot **"Olinjär ventilkarakteristik — demo"**. Kontrollera i Processinställning att processtyp är Självreglerande, K=1.3 (grundvärdet, används bara om funktionen stängs av). Scenariot har redan Olinjär ventilkarakteristik aktiverad, så Processinställningens **Avancerat**-sektion är redan uppfälld automatiskt — kontrollera där att kryssrutan **"Olinjär ventilkarakteristik"** är ikryssad med Brytpunkt 1=25, Brytpunkt 2=65, K vid låg u=0.5, K vid mellan-u=2.0, K vid hög u=2.5 (scenariots startvärden).

Regulator: PI, Kp=1.2, Ti=20 (scenariots startvärden, synliga direkt i Regulatorkonfiguration). Parameterstyrning är AV i den här uppgiften — Regulatorkonfigurationens Avancerat-sektion är därför stängd som standard, och det är den avsedda utgångspunkten (ingen åtgärd behövs).

### Test A — låg driftpunkt
1. SP=10 (scenariots startvärde). Kör minst 150 steg.
2. Notera ungefär hur många steg det tar innan PV stabiliserat sig, och vilket u-värde systemet landar på.

### Test B — hög driftpunkt
1. Ändra SP till 90. Klicka "Återställ system". Kör minst 60 steg.
2. Notera samma sak som i Test A.
3. **Fråga:** Vilken zon (läs av "Zongräns (u)"-linjerna i nedre grafen) hamnar u i den här gången? Skiljer det sig från Test A?

**Mätprotokoll Uppgift 1** (K=1.3 grundvärde, olinjär ventilkarakteristik på, Kp=1.2, Ti=20 i båda):

| Test | SP | Ungefärligt antal steg till stabilt läge | Slutligt u | Zon (låg/mellan/hög) |
|---|---|---|---|---|
| A | 10 | | | |
| B | 90 | | | |

**Reflektion 1:**
- Samma Kp, samma Ti, samma T och L — bara SP skiljer. Vad förklarar skillnaden i hur snabbt systemet stabiliserar sig?
- Om du bara hade sett Test A (utan att veta om Test B), hade du kunnat gissa att processen är olinjär bara genom att titta på den enskilda kurvan?

---

## Uppgift 2: Olinjär ventilkarakteristik — bygg din egen karakteristik

**Syfte:** Undersöka hur K-skillnaden mellan zonerna påverkar hur DRAMATISK skillnaden i svarskaraktär blir.

**Process:** Samma scenario som Uppgift 1. Denna gång ändrar du själv K-zonernas värden i fälten "K vid låg u"/"K vid mellan-u"/"K vid hög u" (Brytpunkterna 25/65 får vara oförändrade).

1. Sätt K vid låg u=0.9 och K vid hög u=1.7 (K vid mellan-u spelar mindre roll här, sätt den t.ex. till samma som "hög"). En mindre skillnad än i Uppgift 1 (0.5 mot 2.5).
2. Upprepa Test A (SP=10) och Test B (SP=90) från Uppgift 1 med de nya K-värdena, samma Kp=1.2, Ti=20.
3. Notera samma mått som i Uppgift 1.
4. Sätt sedan K vid låg u=0.2 och K vid hög u=4.0 — en MYCKET större skillnad. Upprepa Test A och B igen.

**Mätprotokoll Uppgift 2:**

| K-par (låg/hög) | SP | Ungefärligt antal steg till stabilt läge |
|---|---|---|
| 0.9 / 1.7 | 10 | |
| 0.9 / 1.7 | 90 | |
| 0.2 / 4.0 | 10 | |
| 0.2 / 4.0 | 90 | |

**Reflektion 2:**
- Blev skillnaden mellan låg och hög driftpunkt större eller mindre med det smalare K-paret (0.9/1.7) jämfört med Uppgift 1:s (0.5/2.5)?
- Vad händer med det bredare K-paret (0.2/4.0) — ser du någon oönskad effekt (t.ex. att systemet blir orimligt långsamt, eller att det börjar bete sig oregelbundet) om du provar ett SP som ligger nära någon av brytpunkterna (t.ex. SP runt 20–30)? Du behöver inte kunna förklara exakt varför — bara notera om du ser det.
- Är en STÖRRE skillnad mellan zonernas K alltid mer "realistisk", eller finns det ett rimlighetstak för hur olinjär en verklig ventil brukar vara?

---

## Uppgift 3: Parameterstyrning — lös kompromissen

**Syfte:** Öva samma sekvens som lärstigen visar — manuell kompromiss, sedan automatisk lösning — men som ett eget protokoll du dokumenterar själv.

**Process:** Samma scenario ("Olinjär ventilkarakteristik — demo"), med "Olinjär ventilkarakteristik" ikryssad (grundvärdena K=0.5/2.0/2.5, brytpunkter 25/65).

### Del A — manuell kompromiss
1. Kp=1.2, Ti=20 (scenariots startvärden), Parameterstyrning AV. Kör Test A (SP=10, minst 150 steg) och Test B (SP=90, minst 60 steg), precis som Uppgift 1 — eller återanvänd dina resultat därifrån om du redan har dem.
2. Höj Kp till 3. Upprepa Test A och Test B.

### Del B — Parameterstyrning
1. Ladda om scenariot (Kp återgår till 1.2). Klicka upp **"▸ Avancerat"** under Regulatorkonfiguration (stängd som standard eftersom scenariot inte har Parameterstyrning aktiverad från början) och kryssa i **"Parameterstyrning"** där. Kontrollera att Zon 1 Kp=5, Zon 2 Kp=1.2, Zon 3 Kp=1.2 (scenariots startvärden, samma Ti=20 i alla zoner, Td=0).
2. Kör Test A (SP=10) och Test B (SP=90) igen.

**Mätprotokoll Uppgift 3:**

| Inställning | SP | Ungefärligt antal steg till stabilt läge |
|---|---|---|
| Kp=1.2 (ingen styrning) | 10 | |
| Kp=1.2 (ingen styrning) | 90 | |
| Kp=3 (kompromiss) | 10 | |
| Kp=3 (kompromiss) | 90 | |
| Parameterstyrning | 10 | |
| Parameterstyrning | 90 | |

**Reflektion 3:**
- Rangordna de tre inställningarna (Kp=1.2, Kp=3, Parameterstyrning) efter hur bra de presterar vid SP=10 respektive SP=90. Är rangordningen densamma för båda driftpunkterna?
- Parameterstyrningens Zon 1 har Kp=5 — högre än något du testade manuellt i Del A. Varför är det säkert att använda en så hög Kp i just den zonen, men det skulle vara riskabelt att använda Kp=5 som EN gemensam inställning för hela processen (jämför med vad som hände i Uppgift 1/tidigare erfarenhet av höga Kp-värden)?

---

## Uppgift 4: Parameterstyrning — designa ditt eget schema

**Syfte:** Öva att SJÄLV para ihop rätt Kp med rätt zon, inte bara läsa av ett färdigt schema.

**Process:** Samma scenario, "Olinjär ventilkarakteristik" ikryssad med grundvärdena (K=0.5/2.0/2.5, brytpunkter 25/65).

1. Klicka upp "▸ Avancerat" under Regulatorkonfiguration (stängd som standard) och kryssa i "Parameterstyrning". Nollställ alla tre zonernas Kp till samma värde du använde i Uppgift 1 (Kp=1.2 i alla tre zoner) — det ska motsvara att inte ha någon egentlig styrning alls.
2. Testa nu att ÖKA Zon 1:s Kp stegvis (t.ex. 2, 3, 5, 8) medan Zon 2/3 förblir 1.2. Kör Test A (SP=10) vid varje steg. Hitta ett Kp-värde för Zon 1 där insvängningen känns tydligt snabbare än Uppgift 1:s baslinje, men INTE så högt att du ser tecken på översläng eller instabilitet (jämför gärna med vad som hände i Uppgift 3 vid Kp=6 i den ostyrda jämförelsen, om du testade det).
3. Testa på samma sätt att sänka Zon 3:s Kp (t.ex. 1.0, 0.7, 0.5) medan Zon 1 har ditt valda värde och Zon 2 förblir 1.2. Kör Test B (SP=90) vid varje steg. Hitta ett värde som fortfarande är snabbt men känns tryggare (mer marginal) än scenariots ursprungliga Zon 3-värde.

**Mätprotokoll Uppgift 4** (dina egna testade värden):

| Zon 1 Kp | Zon 3 Kp | SP | Resultat (snabbt/lagom/för aggressivt) |
|---|---|---|---|
| | | 10 | |
| | | 90 | |
| | | 10 | |
| | | 90 | |

**Reflektion 4:**
- Vilket Zon 1-/Zon 3-par valde du till slut, och varför bedömde du att det var en bra balans?
- Om du skulle beskriva din designprocess i en mening för en kollega — hur bestämde du var gränsen gick mellan "för försiktigt" och "för aggressivt"?
- Är det någon skillnad mellan att designa ett gain-schedule (den här uppgiften) och att designa en enda kompromiss-Kp (Uppgift 3, Del A)? Vad gör designarbetet enklare eller svårare när du har tre oberoende Kp-värden att sätta istället för ett?
