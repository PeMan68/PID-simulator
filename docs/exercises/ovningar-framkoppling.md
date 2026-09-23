# Övningsuppgifter: Framkoppling (Feedforward)
*Dokumentversion 1.6. Kräver PID Simulator 1.6.0 eller högre (parametergrupperna heter Processinställning/Regulatorkonfiguration/Processpåverkan sedan UX-004, med Kff bakom en "Avancerat"-disklosyr i Regulatorkonfiguration).*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

Simulatorns lärstig "Framkoppling (Feedforward)" visar konceptet steg för steg med tre färdigbyggda demo-scenarier, alla baserade på samma processexempel: **en värmeväxlare** vars utgående temperatur (PV) hålls vid ett börvärde (SP) genom att styra en ångventil (u). En temperaturgivare uppströms kan upptäcka en förändring i den inkommande temperaturen — INNAN den hunnit påverka utgående temperatur — och den mätningen är det som gör framkoppling möjlig.

Det här dokumentet är fristående lösblad — samma mönster som `ovningar-parameterstyrning.md` — där du själv ställer in Kff och lasten enligt instruktionerna och antecknar vad du observerar.

**Förkunskaper:** Grundläggande PID-förståelse, gärna genomförd lärstigen "Framkoppling (Feedforward)".

**Mål:** Kunna förklara skillnaden mellan reaktiv reglering (återkoppling) och direktkompenserande reglering (framkoppling), räkna ut ett korrekt Kff-värde, och känna igen symptomen på ett fel Kff (över- eller underkompensation).

## Termer och definitioner

- **Last** — i det här dokumentet: en mätbar förändring i värmeväxlarens inkommande temperatur, uppmätt av en temperaturgivare uppströms. Anges på simulatorns gemensamma 0–100-skala, precis som PV/SP — inte i grader eller en annan fysisk enhet; en riktig givares egen kalibrering till den skalan ligger utanför vad simulatorn modellerar. Triggas med knappen "Trigga last" (**Processpåverkan**) och ligger sedan kvar BESTÅENDE tills systemet återställs eller en ny last triggas — till skillnad från Puls, som återgår till 0 av sig själv.
- **Lastförstärkning** — hur starkt den triggade lasten fysiskt påverkar utgående temperatur. Processens egen egenskap, i **Processpåverkan** (bredvid Last mag/Trigga last — alltid synlig, inte bakom Avancerat).
- **Kff (framkopplingsförstärkning)** — regulatorns kompensation för lasten (hur mycket ångventilen förjusteras), adderad direkt till utsignalen. I **Regulatorkonfiguration → Avancerat**. Kan vara negativt.
- **Teoretiskt korrekt Kff** — det värde som exakt kompensationerar lastens effekt: `Kff = −auxGain / K`, där K är PROCESSENS EGNA K (samma K-fält som i **Processinställning**, grundnivå) — inte auxGain igen och ingen tredje storhet. Med auxGain=0.65 och K=1.3 blir det exakt −0.5, ingen avrundning.
- **Avancerat** — en hopfällbar sektion längst ner i Regulatorkonfiguration (klicka "▸ Avancerat" för att fälla ut den). Kff-fältet ligger där och öppnas AUTOMATISKT om det laddade scenariot redan har ett Kff skilt från 0 — annars (t.ex. scenariot "PID ensam" med Kff=0) måste du klicka upp sektionen själv. Uppgifterna nedan säger till när det behövs.
- **t_last, t_slut, Δt** — t-värdet (avläst i grafen) när lasten triggas, t-värdet när PV har stabiliserat sig, och skillnaden mellan dem (`Δt = t_slut − t_last`) — den faktiska insvängningstiden EFTER lasten, inte ett absolut stegnummer.
- **K, T, L, Kp, Ti, Td** — se `ovningar-reglerstrategier.md` för grundläggande definitioner om de är nya begrepp för dig.

## Innehållsförteckning

- Uppgift 1: PID kontra PID + framkoppling (grundläggande)
- Uppgift 2: För lågt, korrekt och för högt Kff (grundläggande)
- Uppgift 3: Hitta rätt Kff själv (utforskande)
- Uppgift 4: Framkoppling mot mätbar + omätbar störning samtidigt (utforskande)

**Arbetssätt:** Klicka **"Återställ system"** före varje nytt test när resultat ska jämföras. Trigga alltid störningar (last/puls) FÖRST — aktivera Mätläge EFTERÅT, för avläsning. Mätläge låser parameterfälten (inklusive Trigga-knapparna) för att skydda pågående mätningar, så ordningen är inte valfri. Statusraden (under grafen) visar dessutom lastens aktuella nivå ("Last: −40 (aktiv)") så länge den är triggad. Anteckna dina uppmätta värden i ett separat dokument — det är själva leveransen.

---

## Uppgift 1: PID kontra PID + framkoppling

**Syfte:** Se med egna ögon hur mycket snabbare/mindre avvikelsen blir när framkoppling läggs till en fungerande PID-regulator.

**Process:** Värmeväxlare, K=1.3, T=15, normalvärde=50 (samma som SP — utgående temperatur står redan i vila vid börvärdet), Lastförstärkning=0.65. SP=50. Last mag=−40 (en temperaturminskning i inkommande flöde).

### Test A — PID ensam
1. Ladda scenariot **"Framkoppling — demo: PID ensam (värmeväxlare)"**. Kontrollera Kp=1.2, Ti=20 (synliga direkt i Regulatorkonfiguration). Kff=0 i det här scenariot, så Regulatorkonfigurationens Avancerat-sektion är stängd som standard — klicka upp "▸ Avancerat" om du vill se fältet och bekräfta att det står på 0.
2. Klicka "Trigga last" — notera t-värdet för markeringslinjen ("Last → -40"), det är `t_last`. Kör minst 200 steg.
3. Aktivera Mätläge. Hovra över grafens djupaste punkt (dippen) och läs av PV. Notera avvikelsen (50 − avläst PV).
4. Skriv in det avlästa värdet som PV₀ och SP=50 som PV∞, kryssa i "2%-toleransband". Hovra tills kurvan går in i och stannar kvar i bandet — läs av t-värdet där, det är `t_slut`. Räkna ut `Δt = t_slut − t_last`.

### Test B — PID + korrekt Kff
1. Ladda scenariot **"Framkoppling — demo: PID + korrekt Kff (värmeväxlare)"**. Kontrollera Kp=1.2, Ti=20 (oförändrat), Kff=−0.5 — EXAKT det teoretiskt korrekta värdet (−auxGain/K = −0.65/1.3), ingen avrundning.
2. Klicka "Trigga last" — notera nytt `t_last`. Kör samma antal steg.
3. Aktivera Mätläge. Notera att kurvan inte rör sig alls den här gången — ingen dipp att hovra över.

**Mätprotokoll Uppgift 1:**

| Test | Kff | Störst avvikelse från SP | Δt (insvängningstid efter last) |
|---|---|---|---|
| A (PID ensam) | 0 | | |
| B (PID + Kff) | −0.5 | | |

**Reflektion 1:**
- Samma Kp, Ti, T, L, last — bara Kff skiljer. Hur stor är skillnaden i störst avvikelse mellan A och B?
- Test B:s avvikelse är NOLL, inte bara liten. Vad är det som gör att framkopplingen här tar bort HELA avvikelsen, inte bara det mesta av den?

---

## Uppgift 2: För lågt, korrekt och för högt Kff

**Syfte:** Se att framkoppling kan överkompensera lika lätt som underkompensera — en "för aggressiv" framkoppling är inte bättre, bara fel åt andra hållet.

**Process:** Samma värmeväxlare som Uppgift 1. Ladda scenariot **"Framkoppling — demo: ren framkoppling, fel Kff (värmeväxlare)"** (Kp=0.1, Ti=0, Td=0 — praktiskt taget ingen återkoppling. Skiljer sig medvetet från lärstigens steg 2/3, som båda kör full PID — här utforskar du istället VARFÖR ren framkoppling, utan någon återkoppling som backup, kräver extra precision i Kff). Det teoretiskt korrekta Kff för den här processen är EXAKT −0.5 (−auxGain/K = −0.65/1.3).

1. Sätt Kff=−0.25 (exakt halva det korrekta värdet — scenariots startvärde). Klicka "Återställ system", klicka "Trigga last", kör minst 150 steg. Aktivera Mätläge och läs av det NYA, stabila PV-värdet kurvan lägger sig på (inte SP=50).
2. Ändra Kff till −0.5 (det exakt korrekta värdet). Klicka "Återställ system", trigga last igen, kör lika många steg, läs av på samma sätt. Här återgår PV exakt till SP.
3. Ändra Kff till −0.75 (exakt 1.5× det korrekta värdet — "för mycket" kompensation). Upprepa.

**Mätprotokoll Uppgift 2:**

| Kff | Stabilt PV-värde efter triggning | Avvikelse från SP (50 − PV), med tecken |
|---|---|---|
| −0.25 (för lågt) | | |
| −0.5 (korrekt) | | |
| −0.75 (för högt) | | |

**Reflektion 2:**
- Vilket håll (över eller under SP) hamnar PV på vid för LÅGT Kff (dvs för svag kompensation)? Och vid för HÖGT Kff?
- Är avvikelsens STORLEK symmetrisk kring det korrekta värdet (dvs är "lika mycket fel åt fel håll" lika illa åt båda hållen)? (−0.25 och −0.75 ligger lika långt från −0.5 på var sitt håll — jämför de uppmätta avvikelsernas storlek.)
- Om du bara fick titta på GRAFEN (inte sifforna) — hade du kunnat avgöra om ett visst Kff var för lågt eller för högt, bara genom att se vilken riktning PV avviker åt?

---

## Uppgift 3: Hitta rätt Kff själv

**Syfte:** Öva att räkna ut och verifiera ett korrekt Kff-värde själv, inte bara läsa av ett facit.

**Process:** Samma scenario som Uppgift 2 (ren framkoppling, Kp=0.1, Ti=0). Processen har K=1.3 (Processinställning) och Lastförstärkning=0.65 (Processpåverkan) — kontrollera själv.

1. Räkna ut vilket Kff-värde som EXAKT ska kompensera lasten, med formeln `Kff = −auxGain / K` (samma formel som i teorimodulen/Kff-fältets hjälptext).
2. Sätt ditt uträknade Kff. Klicka "Återställ system", klicka "Trigga last", kör minst 150 steg.
3. Aktivera Mätläge och läs av det stabila PV-värdet (hovra mot slutet av kurvan). Ligger det (nära) SP=50?
4. Justera Kff något (t.ex. ±0.05) åt vartdera hållet och se hur känsligt resultatet är för små avvikelser från ditt uträknade värde.

**Mätprotokoll Uppgift 3:**

| Ditt uträknade Kff | Stabilt PV-värde | Avvikelse från SP |
|---|---|---|
| | | |

**Reflektion 3:**
- Hur nära SP=50 kom du med ditt uträknade värde?
- Om Lastförstärkningen i en verklig värmeväxlare bara är UNGEFÄR känd (inte exakt uppmätt) — vad säger det om hur nära "perfekt" man realistiskt kan förvänta sig att komma med enbart framkoppling, utan någon återkoppling som backup?

---

## Uppgift 4: Framkoppling mot mätbar + omätbar störning samtidigt

**Syfte:** Se att framkoppling bara kompenserar den störning den faktiskt MÄTER (temperaturgivarens avläsning) — en annan, omätbar störning (t.ex. brus i temperaturmätningen) måste fortfarande hanteras av återkopplingen precis som vanligt.

**Process:** Ladda scenariot **"Framkoppling — demo: PID + korrekt Kff (värmeväxlare)"** (Kp=1.2, Ti=20, Kff=−0.5 — redan exakt korrekt inställt).

### Del A — bara den mätbara lasten (referens)
1. Klicka "Trigga last". Kör 60 steg. Notera (t.ex. i statusraden eller via Mätläge efteråt) att PV inte rör sig alls — du har redan sett detta i Uppgift 1/lärstigens steg 3.

### Del B — mätbar last + omätbar puls samtidigt
1. Klicka "Återställ system". Sätt Puls mag=−8, Puls steg=5 (Processpåverkan, samma fält som i `ovningar-reglerstrategier.md`).
2. Klicka "Trigga last" OCH "Trigga puls" (i valfri ordning, gärna direkt efter varandra).
3. Kör minst 60 steg. Aktivera Mätläge och notera den STÖRSTA avvikelsen från SP du ser den här gången.

### Del C — bara pulsen, ingen last (jämförelse)
1. Klicka "Återställ system". Sätt Last mag=0 (eller låt bli att trigga den). Puls mag=−8, Puls steg=5 fortfarande.
2. Klicka bara "Trigga puls".
3. Kör 60 steg. Aktivera Mätläge och notera den STÖRSTA avvikelsen igen.

**Mätprotokoll Uppgift 4:**

| Del | Last triggad? | Puls triggad? | Störst avvikelse från SP |
|---|---|---|---|
| A | Ja | Nej | |
| B | Ja | Ja | |
| C | Nej | Ja | |

**Reflektion 4:**
- Jämför B och C — är avvikelsen ungefär LIKA STOR i båda, trots att B även har en (korrekt kompenserad) last aktiv?
- Vad säger det om VILKEN sorts störning framkoppling faktiskt hjälper mot? Skulle framkoppling någonsin kunna kompensera för brus/puls, oavsett hur bra Kff är inställt — varför/varför inte?
