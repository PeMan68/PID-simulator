# Övningsuppgifter: Framkoppling (Feedforward)
*Dokumentversion 1.0. Kräver PID Simulator med stöd för Framkoppling (FEAT-045).*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

Simulatorns lärstig "Framkoppling (Feedforward)" visar konceptet steg för steg med tre färdigbyggda demo-scenarier. Det här dokumentet är fristående lösblad — samma mönster som `ovningar-parameterstyrning.md` — där du själv ställer in Kff och lasten enligt instruktionerna och antecknar vad du observerar.

**Förkunskaper:** Grundläggande PID-förståelse, gärna genomförd lärstigen "Framkoppling (Feedforward)".

**Mål:** Kunna förklara skillnaden mellan reaktiv reglering (återkoppling) och direktkompenserande reglering (framkoppling), räkna ut ett korrekt Kff-värde, och känna igen symptomen på ett fel Kff (över- eller underkompensation).

## Termer och definitioner

- **auxSignal / Last** — en mätbar störning som triggas med knappen "Trigga last" (Störningar-gruppen) och sedan ligger kvar BESTÅENDE tills systemet återställs eller en ny last triggas. Till skillnad från Puls (som återgår till 0 av sig själv).
- **Lastförstärkning (auxGain)** — hur starkt den triggade lasten fysiskt påverkar processen. Processens egen egenskap, i Process-gruppen.
- **Kff (framkopplingsförstärkning)** — regulatorns kompensation för lasten, adderad direkt till utsignalen. I Regulator-gruppen. Kan vara negativt.
- **Teoretiskt korrekt Kff** — det värde som exakt kompensationerar lastens effekt: `Kff = −auxGain / K`.
- **K, T, L, Kp, Ti, Td** — se `ovningar-reglerstrategier.md` för grundläggande definitioner om de är nya begrepp för dig.

## Innehållsförteckning

- Uppgift 1: PID kontra PID + framkoppling (grundläggande)
- Uppgift 2: För lågt, korrekt och för högt Kff (grundläggande)
- Uppgift 3: Hitta rätt Kff själv (utforskande)
- Uppgift 4: Framkoppling mot mätbar + omätbar störning samtidigt (utforskande)

**Arbetssätt:** Klicka **"Återställ system"** före varje nytt test när resultat ska jämföras. Aktivera Mätläge (knappen "Mät K/T/L") för crosshair-avläsning — hovra över grafen för att läsa av exakta PV-värden. Anteckna dina uppmätta värden i ett separat dokument — det är själva leveransen.

---

## Uppgift 1: PID kontra PID + framkoppling

**Syfte:** Se med egna ögon hur mycket snabbare/mindre avvikelsen blir när framkoppling läggs till en fungerande PID-regulator.

**Process:** K=1.3, T=15, normalvärde=50 (samma som SP — processen står redan i vila vid börvärdet), Lastförstärkning=0.8. SP=50. Last mag=−20.

### Test A — PID ensam
1. Ladda scenariot **"Framkoppling — demo: PID ensam"**. Kontrollera Kp=1.2, Ti=20, Kff=0.
2. Aktivera Mätläge. Klicka "Trigga last". Kör minst 200 steg.
3. Hovra över grafens djupaste punkt (dippen) och läs av PV. Notera avvikelsen (50 − avläst PV).
4. Hovra vidare tills kurvan är helt tillbaka vid 50 — notera ungefär vid vilket steg (räknat FRÅN triggningen).

### Test B — PID + korrekt Kff
1. Ladda scenariot **"Framkoppling — demo: PID + korrekt Kff"**. Kontrollera Kp=1.2, Ti=20 (oförändrat), Kff=−0.6154.
2. Mätläge fortfarande aktivt. Klicka "Trigga last". Kör samma antal steg.
3. Notera samma mått som i Test A.

**Mätprotokoll Uppgift 1:**

| Test | Kff | Störst avvikelse från SP | Ungefär antal steg till PV är tillbaka vid SP |
|---|---|---|---|
| A (PID ensam) | 0 | | |
| B (PID + Kff) | −0.6154 | | |

**Reflektion 1:**
- Samma Kp, Ti, T, L, last — bara Kff skiljer. Hur stor är skillnaden i störst avvikelse mellan A och B?
- Test B:s avvikelse är inte NOLL, men mycket liten. Vad är det som gör den lilla resten obetydlig jämfört med Test A:s?

---

## Uppgift 2: För lågt, korrekt och för högt Kff

**Syfte:** Se att framkoppling kan överkompensera lika lätt som underkompensera — en "för aggressiv" framkoppling är inte bättre, bara fel åt andra hållet.

**Process:** Samma som Uppgift 1. Ladda scenariot **"Framkoppling — demo: ren framkoppling (fel Kff)"** (Kp=0.1, Ti=0, Td=0 — praktiskt taget ingen återkoppling, precis som lärstigens steg 2). Det teoretiskt korrekta Kff för den här processen är −0.6154 (−auxGain/K = −0.8/1.3).

1. Sätt Kff=−0.31 (ungefär halva det korrekta värdet — scenariots startvärde). Klicka "Återställ system", aktivera Mätläge, klicka "Trigga last", kör minst 150 steg. Läs av det NYA, stabila PV-värdet kurvan lägger sig på (inte SP=50).
2. Ändra Kff till −0.6154 (det korrekta värdet). Klicka "Återställ system", trigga last igen, kör lika många steg. Läs av det stabila PV-värdet.
3. Ändra Kff till −0.92 (ungefär 1.5× det korrekta värdet — "för mycket" kompensation). Upprepa.

**Mätprotokoll Uppgift 2:**

| Kff | Stabilt PV-värde efter triggning | Avvikelse från SP (50 − PV), med tecken |
|---|---|---|
| −0.31 (för lågt) | | |
| −0.6154 (korrekt) | | |
| −0.92 (för högt) | | |

**Reflektion 2:**
- Vilket håll (över eller under SP) hamnar PV på vid för LÅGT Kff (dvs för svag kompensation)? Och vid för HÖGT Kff?
- Är avvikelsens STORLEK ungefär symmetrisk kring det korrekta värdet (dvs är "lika mycket fel åt fel håll" ungefär lika illa åt båda hållen)?
- Om du bara fick titta på GRAFEN (inte sifforna) — hade du kunnat avgöra om ett visst Kff var för lågt eller för högt, bara genom att se vilken riktning PV avviker åt?

---

## Uppgift 3: Hitta rätt Kff själv

**Syfte:** Öva att räkna ut och verifiera ett korrekt Kff-värde själv, inte bara läsa av ett facit.

**Process:** Samma scenario som Uppgift 2 (ren framkoppling, Kp=0.1, Ti=0). Processen har K=1.3 och Lastförstärkning (auxGain)=0.8 — kontrollera själv i Process-gruppen.

1. Räkna ut vilket Kff-värde som EXAKT ska kompensera lasten, med formeln `Kff = −auxGain / K` (samma formel som i teorimodulen/Kff-fältets hjälptext).
2. Sätt ditt uträknade Kff. Klicka "Återställ system", aktivera Mätläge, trigga lasten, kör minst 150 steg.
3. Läs av det stabila PV-värdet. Ligger det (nära) SP=50?
4. Justera Kff något (t.ex. ±0.05) åt vartdera hållet och se hur känsligt resultatet är för små avvikelser från ditt uträknade värde.

**Mätprotokoll Uppgift 3:**

| Ditt uträknade Kff | Stabilt PV-värde | Avvikelse från SP |
|---|---|---|
| | | |

**Reflektion 3:**
- Hur nära SP=50 kom du med ditt uträknade värde?
- Om Lastförstärkningen (auxGain) i en verklig process bara är UNGEFÄR känd (inte exakt uppmätt) — vad säger det om hur nära "perfekt" man realistiskt kan förvänta sig att komma med enbart framkoppling, utan någon återkoppling som backup?

---

## Uppgift 4: Framkoppling mot mätbar + omätbar störning samtidigt

**Syfte:** Se att framkoppling bara kompenserar den störning den faktiskt MÄTER — en annan, omätbar störning (brus/puls) måste fortfarande hanteras av återkopplingen precis som vanligt.

**Process:** Ladda scenariot **"Framkoppling — demo: PID + korrekt Kff"** (Kp=1.2, Ti=20, Kff=−0.6154 — redan korrekt inställt).

### Del A — bara den mätbara lasten (referens)
1. Aktivera Mätläge. Klicka "Trigga last". Kör 60 steg. Notera att PV knappt rör sig (du har redan sett detta i Uppgift 1/lärstigens steg 3).

### Del B — mätbar last + omätbar puls samtidigt
1. Klicka "Återställ system". Sätt Puls mag=−8, Puls steg=5 (Störningar-gruppen, samma fält som i `ovningar-reglerstrategier.md`).
2. Klicka "Trigga last" OCH "Trigga puls" (i valfri ordning, gärna direkt efter varandra).
3. Kör minst 60 steg. Notera den STÖRSTA avvikelsen från SP du ser den här gången.

### Del C — bara pulsen, ingen last (jämförelse)
1. Klicka "Återställ system". Sätt Last mag=0 (eller låt bli att trigga den). Puls mag=−8, Puls steg=5 fortfarande.
2. Klicka bara "Trigga puls".
3. Kör 60 steg. Notera den STÖRSTA avvikelsen igen.

**Mätprotokoll Uppgift 4:**

| Del | Last triggad? | Puls triggad? | Störst avvikelse från SP |
|---|---|---|---|
| A | Ja | Nej | |
| B | Ja | Ja | |
| C | Nej | Ja | |

**Reflektion 4:**
- Jämför B och C — är avvikelsen ungefär LIKA STOR i båda, trots att B även har en (korrekt kompenserad) last aktiv?
- Vad säger det om VILKEN sorts störning framkoppling faktiskt hjälper mot? Skulle framkoppling någonsin kunna kompensera för brus/puls, oavsett hur bra Kff är inställt — varför/varför inte?
