# Övningsuppgifter: Grundläggande Reglerteknik
*PID-simulator v1.7.0 - Nybörjarvänliga övningar*

> **⚠️ Viktigt meddelande**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

Välkommen till grundläggande reglerteknik! Dessa övningar är designade för dig som är nybörjare och vill förstå hur reglering fungerar från grunden. Vi börjar med den enklaste formen av reglering och bygger gradvis upp kunskap till en fullständig PID-regulator.

**Förkunskaper:** Inga - vi börjar från början!

**Mål:** 
- Förstå varför vi behöver automatisk reglering
- Lära sig hur olika regulatortyper fungerar
- Känna igen olika systemegenskaper
- Kunna anpassa regulatorinställningar för olika system

**Pedagogisk approach:**
- Varje övning bygger på föregående kunskap
- Tydliga steg-för-steg-instruktioner
- Många reflektionsfrågor för förståelse
- Praktiska exempel från verkligheten

---

## Del 1: Varför behöver vi reglering?

### Övning 1.1: System utan reglering
**Syfte:** Förstå vad som händer när vi inte har automatisk reglering.

#### Steg 1: Öppen styrning (ingen reglering)
1. Starta PID-simulatorn
2. Grundinställningar:
   - **Process**: Självreglerande
   - **K**: 1.0 (processförstärkning)
   - **T**: 20s (tidskonstant)
   - **Dötid**: 0s
   - **Börvärde**: 50
   - **Mätområde**: 0-100

3. **Viktigt**: Sätt alla regulatorparametrar till 0:
   - **Kp**: 0
   - **Ti**: 0
   - **Td**: 0

4. Starta simuleringen och låt den köra i 100 sekunder

**Vad händer?**
- Processvärdet (PV) förblir på 0
- Utsignalen (MO) är också 0
- Systemet gör ingenting!

**Förklaring:**
När vi inte har någon regulator så finns det ingenting som försöker styra processen mot önskat värde (börvärdet). Det är som att ha en värmare utan termostat - den kommer aldrig att veta när den ska värma!

#### Steg 2: Fast utsignal
1. Under "Simuleringsstart" hittar du **Initialt MO**
2. Ändra detta till 50%
3. Starta om simuleringen

**Vad händer nu?**
- Processvärdet stiger till ett värde (ca 50 eftersom K=1.0)
- Men det stannar där - oavsett vad börvärdet är!

**Reflektion 1.1:**
- Varför når inte processvärdet börvärdet exakt?
- Vad skulle hända om någon störning påverkade processen?
- Skulle detta fungera i verkligheten? Varför/varför inte?

**Verklighetsexempel:**
Tänk dig en dusch där du ställer in varmvattenkranen på en viss position. Om någon spolar på toaletten eller tvättar händerna påverkas vattenflödet och temperaturen ändras - kranen "vet" inte att den ska justera sig!

---

## Del 2: On/Off-reglering - Den enklaste regulatorn

### Övning 2.1: Upptäck On/Off-reglering
**Syfte:** Förstå den absolut enklaste formen av automatisk reglering.

#### Bakgrund: Vad är On/Off-reglering?
En On/Off-regulator fungerar som en vanlig termostat i hemmet:
- Om temperaturen är **under** börvärdet → sätt på värmen (100%)
- Om temperaturen är **över** börvärdet → stäng av värmen (0%)

Inget mellanting - antingen full effekt eller ingen effekt!

#### Steg 1: Simulera en termostat
1. Återställ simulatorn (eller starta om)
2. Grundinställningar:
   - **Process**: Självreglerande
   - **K**: 1.0
   - **T**: 20s
   - **Dötid**: 0s
   - **Börvärde**: 50
   - **Mätområde**: 0-100

3. Regulatorinställningar för On/Off:
   - **Kp**: 100 (mycket högt värde)
   - **Ti**: 0 (ingen integration)
   - **Td**: 0 (ingen derivata)
   - **Spärrning**: Av (viktigt!)

4. Starta simuleringen och låt den köra i 200 sekunder

**Vad observerar du?**
- Processvärdet oscillerar (svänger) runt börvärdet
- Utsignalen växlar mellan 0% och 100%
- Systemet "jagar" hela tiden

**Spara denna kurva!** Tryck på "Spara" och döp den till "On/Off grundtest"

#### Steg 2: Påverkan av tidskonstanten
1. Ändra **T** till 40s (dubbelt så långsamt system)
2. Starta ny simulering (200s)
3. Spara som "On/Off långsamt system"

**Jämförelse:**
- Hur ändras oscillationens frekvens?
- Hur ändras oscillationens amplitud (svängningstorlek)?

#### Steg 3: Lägg till dötid
1. Ändra tillbaka **T** till 20s
2. Ändra **Dötid** till 5s
3. Starta ny simulering (200s)
4. Spara som "On/Off med dötid"

**Förklaring av dötid:**
Dötid är fördröjningen mellan när du ändrar något och när effekten syns. Som när du vrider varmvattenkranen i duschen - det tar några sekunder innan det varmare vattnet når dig.

**Reflektion 2.1:**
- Varför oscillerar On/Off-reglering?
- Vilket system oscillerade mest - det snabba eller långsamma?
- Hur påverkade dötiden oscillationen?
- Kan du komma på verkliga system där On/Off-reglering räcker?
- Vilka problem skulle oscillationen kunna orsaka i verkligheten?

**Verklighetsexempel On/Off-reglering:**
- Kylskåp och frysar
- Enklare termostater för rumstemperatur
- Värmefläktar
- Många hushållsapparater

**Slutsats:**
On/Off-reglering är enkel och billig, men oscillationen kan vara problematisk för processer som kräver stabil reglering eller där frekventa omkopplingar sliter på utrustningen.

---

## Del 3: P-reglering - Proportionell kontroll

### Övning 3.1: Introduktion till P-reglering
**Syfte:** Förstå hur proportionell reglering ger mjukare och mer nyanserad styrning.

#### Bakgrund: Vad är P-reglering?
P-reglering (Proportionell reglering) är smartare än On/Off:
- Utsignalen är **proportionell** mot felet
- Stort fel → stor utsignal
- Litet fel → liten utsignal
- Inget hopp mellan 0% och 100%!

**Formel:**
```
MO = Kp × fel
där fel = (börvärde - processvärde)
```

#### Steg 1: Din första P-regulator
1. Rensa historik för en ny start
2. Grundinställningar:
   - **Process**: Självreglerande
   - **K**: 1.0
   - **T**: 20s
   - **Dötid**: 0s
   - **Börvärde**: 50
   - **Mätområde**: 0-100

3. P-regulator:
   - **Kp**: 0.5 (moderat förstärkning)
   - **Ti**: 0
   - **Td**: 0

4. Starta simuleringen (200s)
5. Spara som "P-reglering Kp=0.5"

**Vad händer?**
- Ingen oscillation!
- Men... processvärdet når inte riktigt börvärdet

**Det statiska reglerfelet:**
Skillnaden mellan börvärde och slutligt processvärde kallas **statiskt reglerfel** (offset). Detta är P-regleringens stora nackdel.

**Varför uppstår statiskt reglerfel?**
För att hålla processen vid ett visst värde krävs en viss utsignal. Men eftersom utsignalen från P-regulatorn bara beror på felet, måste det finnas ett fel för att ge rätt utsignal!

#### Steg 2: Prova olika Kp-värden
**Uppgift:** Testa följande Kp-värden och spara varje simulering:

| Kp-värde | Förväntat beteende | Spara som |
|----------|-------------------|-----------|
| 0.2 | Långsam, stort statiskt fel | "P Kp=0.2" |
| 0.5 | Måttlig | "P Kp=0.5" |
| 1.0 | Snabbare | "P Kp=1.0" |
| 2.0 | Snabb, risk för svängning | "P Kp=2.0" |
| 4.0 | Mycket snabb, oscillation? | "P Kp=4.0" |

**Reflektionsfrågor 3.1:**
- Hur påverkar Kp stigtiden (hur snabbt systemet reagerar)?
- Hur påverkar Kp det statiska reglerfelet?
- Vid vilket Kp börjar systemet oscillera?
- Finns det ett "perfekt" Kp-värde?

#### Steg 3: Processförstärkning och Kp
**Syfte:** Förstå hur processens egenskaper påverkar valet av Kp.

1. Rensa historik
2. Ändra **K** (processförstärkning) till 0.5
3. Testa Kp = 1.0 och spara som "K=0.5 Kp=1.0"
4. Ändra K till 2.0
5. Testa Kp = 1.0 och spara som "K=2.0 Kp=1.0"

**Viktigt samband:**
Produkten **Kp × K** bestämmer systemets totala "slingförstärkning". 
```
Slingförstärkning = Kp × K
```

**Reflektion:**
- Vilket system var mest stabilt vid samma Kp?
- Hur borde du justera Kp om processförstärkningen K ökar?
- Tumregel: Om K är stor, välj ett lägre Kp (och vice versa)

### Övning 3.2: P-reglering för olika processtyper
**Syfte:** Uppleva hur olika system beter sig med P-reglering.

#### Scenario A: Snabbt system
**Verklighetexempel:** Temperaturreglering av en liten värmeplatta

1. Inställningar:
   - **Process**: Självreglerande
   - **K**: 1.0
   - **T**: 5s (snabbt system!)
   - **Dötid**: 0s
   - **Kp**: 1.0
2. Kör simulering (100s)
3. Spara som "Snabb process"

#### Scenario B: Långsamt system
**Verklighetexempel:** Temperaturreglering av stor vattentank

1. Inställningar:
   - **K**: 1.0
   - **T**: 60s (långsamt system!)
   - **Dötid**: 0s
   - **Kp**: 1.0
2. Kör simulering (400s) - behöver längre tid!
3. Spara som "Långsam process"

#### Scenario C: System med dötid
**Verklighetexempel:** Värmeväxlare med lång rörledning

1. Inställningar:
   - **K**: 1.0
   - **T**: 20s
   - **Dötid**: 10s (betydande fördröjning!)
   - **Kp**: 1.0
2. Kör simulering (200s)
3. Spara som "Process med dötid"

**Reflektion 3.2:**
- Vilket system var lättast att reglera?
- Vilket system krävde lägst Kp för stabil reglering?
- Hur påverkar dötid stabiliteten?
- Generell regel: Svårare system → lägre Kp

**Praktisk design-tumregel:**
```
Om T/θ > 5: Relativt enkelt att reglera
Om T/θ < 2: Svårt att reglera (θ = dötid)
```

---

## Del 4: PI-reglering - Eliminera statiskt fel

### Övning 4.1: Varför behövs I-delen?
**Syfte:** Förstå I-delens (integrator) funktion och hur den eliminerar statiskt reglerfel.

#### Bakgrund: Vad gör I-delen?
Integratorn **ackumulerar** (summerar) felet över tid:
- Om det finns ett kvarstående fel → integratorn ökar långsamt
- Integratorn "minns" historiska fel
- Slutligen blir integratorn tillräckligt stor för att eliminera felet helt

**Matematisk analogi:**
Om P-delen är systemets "nu", så är I-delen systemets "minne".

#### Steg 1: P vs PI - Direkt jämförelse
1. Rensa historik
2. Grundinställning:
   - **Process**: Självreglerande
   - **K**: 1.0
   - **T**: 20s
   - **Dötid**: 2s
   - **Börvärde**: 50

3. **Test 1: Endast P**
   - **Kp**: 0.8
   - **Ti**: 0 (ingen I-del)
   - Kör 200s, spara som "Endast P"

4. **Test 2: PI**
   - **Kp**: 0.8 (samma som innan!)
   - **Ti**: 40s (integratortid)
   - Kör 200s, spara som "PI Ti=40s"

**Vad ser du?**
- P-kurvan: Stabiliserar med statiskt reglerfel
- PI-kurvan: Når långsamt börvärdet helt!

**Viktigt:** 
Ti-parametern anger hur snabb integratorn är:
- **Lågt Ti** (t.ex., 10s) = snabb integration
- **Högt Ti** (t.ex., 100s) = långsam integration

#### Steg 2: Optimera Ti
**Uppgift:** Testa olika Ti-värden med samma Kp = 0.8

| Ti-värde | Förväntad effekt | Spara som |
|----------|------------------|-----------|
| 20s | För snabb? | "PI Ti=20s" |
| 40s | Lagom | "PI Ti=40s" |
| 80s | Långsam | "PI Ti=80s" |
| 10s | Risk för oscillation | "PI Ti=10s" |

**Observera:**
- Hur lång tid tar det innan felet eliminerats?
- Uppstår översläng (overshoot)?
- Börjar systemet oscillera vid låga Ti?

**Reflektion 4.1:**
- Varför kan för låg Ti orsaka instabilitet?
- Vad händer med integratorn när processen når börvärdet?
- Hur väljer du Ti i förhållande till processens T?

#### Steg 3: Börvärdesändring
**Syfte:** Se hur PI-regulatorn hanterar dynamiska förändringar.

1. Använd dina bästa PI-inställningar från tidigare
2. Starta simulering
3. Efter 100s: Ändra börvärdet från 50 till 70 (via reglaget)
4. Låt simuleringen fortsätta till 300s
5. Spara som "PI börvärdessteg"

**Vad händer?**
- Ny instigning mot det nya börvärdet
- Kanske viss översläng
- Systemet når slutligen det nya börvärdet

**Praktisk poäng:**
Detta är en nyckel-funktion! I verkliga processer ändras börvärdet ofta (t.ex., olika temperaturer för olika produkter).

### Övning 4.2: Integratoruppvridning (Windup)
**Syfte:** Förstå ett viktigt praktiskt problem med integratorer.

#### Bakgrund: Vad är windup?
När utsignalen är begränsad (0-100%) men integratorn fortsätter att öka, "vrids integratorn upp" till stora värden. Detta kan orsaka långsam återhämtning.

#### Steg 1: Skapa windup-situation
1. Inställningar:
   - **Process**: Självreglerande
   - **K**: 1.0
   - **T**: 20s
   - **Dötid**: 0s
   - **Börvärde**: 90 (högt värde!)
   
2. Regulator:
   - **Kp**: 1.0
   - **Ti**: 20s
   - **Spärrning**: AV (viktigt - inaktivera anti-windup)

3. Kör simulering (300s)
4. **Efter 150s**: Sänk börvärdet till 30
5. Spara som "Windup utan spärrning"

**Vad händer?**
När du sänker börvärdet tar det lång tid innan processen börjar sjunka. Varför? Integratorn har "vridit sig upp" till ett högt värde!

#### Steg 2: Testa anti-windup
1. Samma inställningar som ovan
2. **Spärrning**: PÅ (aktivera anti-windup)
3. Upprepa samma börvärdesändring (90→30 efter 150s)
4. Spara som "Med spärrning"

**Jämför kurvorna:**
- Med spärrning: Snabbare respons vid börvärdesändring nedåt
- Anti-windup begränsar integratorn när utsignalen är mättad

**Reflektion 4.2:**
- Varför är windup ett problem?
- När uppstår windup mest sannolikt?
- Ska anti-windup alltid vara på?

**Verklighetsexempel:**
En värmeprocess som går från full effekt (100%) till kylning - integratorn måste först "avläsas" innan systemet kan börja svara.

---

## Del 5: PID-reglering - Snabbare respons

### Övning 5.1: Introduktion till D-delen
**Syfte:** Förstå derivata-delens funktion och när den är användbar.

#### Bakgrund: Vad gör D-delen?
Derivata-delen (D) reagerar på **förändringshastighet**:
- Om processvärdet ändras snabbt → stor D-påverkan
- Om processvärdet är stillastående → ingen D-påverkan
- D-delen "förutser" framtida fel

**Analogi:**
Om P är "nu" och I är "minne", så är D "framtidsspaning".

#### Steg 1: PI vs PID
1. Rensa historik
2. Grundinställning:
   - **Process**: Självreglerande
   - **K**: 1.0
   - **T**: 20s
   - **Dötid**: 3s
   - **Börvärde**: 50

3. **Test 1: PI**
   - **Kp**: 1.0
   - **Ti**: 30s
   - **Td**: 0
   - Kör 150s, spara som "PI-reglering"

4. **Test 2: PID**
   - **Kp**: 1.0
   - **Ti**: 30s
   - **Td**: 5s (lägg till D-del)
   - Kör 150s, spara som "PID Td=5s"

**Vad observerar du?**
- PID-kurvan: Snabbare instigning
- Mindre översläng
- D-delen "bromsar" när processvärdet närmar sig börvärdet

#### Steg 2: För stor D-del
1. Testa **Td**: 15s (för stor D-del)
2. Kör simulering och spara som "PID Td för stor"

**Vad händer?**
- Risk för oscillation eller ryckig utsignal
- D-delen överreagerar på små förändringar

**Reflektion 5.1:**
- När är D-delen användbar?
- Vilka nackdelar har D-delen?
- Varför ska Td vara mindre än Ti och T?

### Övning 5.2: PID för olika processtyper
**Syfte:** Anpassa PID-parametrar för olika system.

#### Scenario A: Snabb process med dötid
**Exempel:** Flödeskontroll i rör

1. Inställningar:
   - **K**: 1.0
   - **T**: 10s (snabb)
   - **Dötid**: 5s (betydande dötid)

2. **Börja med PI:**
   - Kp: 0.5, Ti: 20s, Td: 0

3. **Lägg till D:**
   - Td: 3s

4. Jämför resultaten

#### Scenario B: Långsam process
**Exempel:** Temperaturreglering stor tank

1. Inställningar:
   - **K**: 1.0
   - **T**: 60s (mycket långsam)
   - **Dötid**: 2s

2. **PID-inställningar:**
   - Kp: 1.0, Ti: 80s, Td: 8s

3. Kör simulering (600s)

**Diskussion:**
- D-delen mindre användbar för mycket långsamma processer
- PI ofta tillräckligt när T >> dötid

#### Scenario C: Integrerande process
**Exempel:** Nivåreglering i tank

1. Välj **Process**: Integrerande (inte självreglerande!)
2. **K**: 0.5
3. Börja med:
   - Kp: 0.3, Ti: 40s, Td: 0

**Observera:**
Integrerande processer är speciella - de fortsätter förändras utan återkoppling. Detta gör dem mer utmanande!

**Reflektion 5.2:**
- Vilket processtyp är lättast att reglera?
- När är PID verkligen nödvändig (vs PI)?
- Hur påverkar processtyp valet av parametrar?

---

## Del 6: Systematisk inställning - Din verktygslåda

### Övning 6.1: En enkel inställningsmetod
**Syfte:** Lära sig en praktisk metod för grundläggande PID-inställning.

#### Metod: "Steg-för-steg-ansatsen"

**Steg 1: Starta med P**
1. Sätt Ti = 0, Td = 0
2. Öka Kp gradvis tills systemet blir nästan ostabilt
3. Backa till 50-60% av detta Kp
4. Detta är ditt bas-Kp

**Steg 2: Lägg till I**
1. Sätt Ti = 3-4 × T (processens tidskonstant)
2. Om för långsam: Minska Ti
3. Om oscillation: Öka Ti
4. Kanske reducera Kp något

**Steg 3: Eventuellt lägg till D**
1. Börja med Td = T/4
2. Öka försiktigt om snabbare respons önskas
3. Om ryckig/oscillerande: Minska Td

#### Praktisk övning
Använd metoden ovan på ett nytt system:
- **K**: 1.5
- **T**: 25s
- **Dötid**: 4s

Dokumentera dina steg och slutliga parametrar!

### Övning 6.2: Känna igen systemegenskaper
**Syfte:** Lära sig att "läsa" processens beteende.

#### Uppgift: System-detektiv

Du får tre okända processer (bygg dem själv!):
1. K=0.5, T=15s, Dötid=0s
2. K=2.0, T=40s, Dötid=8s  
3. K=1.0, T=5s, Dötid=5s

För varje process:
1. Starta med öppen styrning (MO=30%)
2. Observera stegsvar
3. Uppskatta systemets "svårighetsgrad"
4. Välj lämpliga PID-parametrar
5. Testa och justera

**Viktiga observationer:**
- Hur snabbt når systemet 63% av slutvärdet? (ger T)
- Hur lång fördröjning innan något händer? (ger dötid)
- Hur stort är slutvärdet vid MO=30%? (ger K)

---

## Del 7: Vanliga misstag och felsökning

### Övning 7.1: Känna igen problem

#### Problem A: Systemet oscillerar
**Möjliga orsaker:**
- För högt Kp
- För lågt Ti (för snabb integrator)
- För högt Td
- Kombination av ovanstående

**Lösning:**
1. Minska Kp med 30-50%
2. Öka Ti
3. Minska eller ta bort Td

#### Problem B: För långsamt
**Möjliga orsaker:**
- För lågt Kp
- För högt Ti
- Processens natur

**Lösning:**
1. Öka Kp försiktigt
2. Minska Ti något
3. Överväg att lägga till D

#### Problem C: Stor översläng
**Möjliga orsaker:**
- För aggressiv tuning
- För snabb integrator

**Lösning:**
1. Minska Kp
2. Öka Ti
3. Lägg till eller öka Td

#### Praktisk övning: Felsökning
Skapa medvetet "dåliga" inställningar och träna på att identifiera och åtgärda problemet!

---

## Del 8: Verklighetsanslutning

### Övning 8.1: Verkliga exempel
**Syfte:** Relatera simuleringen till verkliga processer.

#### Exempel 1: Rumstemperatur
**Processegenskaper:**
- Långsam (T = 30-60 minuter)
- Stor dötid (10-20 minuter)
- K beror på värmesystem

**Typ av regulator:**
- On/Off (billiga termostater)
- PI (moderna smarta termostater)

Simulera: T=50s, Dötid=15s, K=1.0

#### Exempel 2: Motorvarvtal
**Processegenskaper:**
- Snabb (T = 0.1-1 sekunder)
- Liten dötid
- God förstärkning

**Typ av regulator:**
- PID med snabb respons
- D-del ofta nödvändig

Simulera: T=5s, Dötid=0.5s, K=1.2

#### Exempel 3: Processtemperatur (kemisk reaktor)
**Processegenskaper:**
- Medelhastighet (T = 10-30 sekunder)
- Måttlig dötid
- Kräver stabil kontroll

**Typ av regulator:**
- PID med måttliga parametrar
- God robusthet viktig

Simulera: T=20s, Dötid=5s, K=1.0

**Diskussion:**
- Vilka krav ställer olika industrier?
- Säkerhet vs prestanda?
- Kostnad av utrustning vs regulatorprestanda?

---

## Sammanfattning och nästa steg

### Vad du har lärt dig

#### Regulatortyper
✅ **On/Off:** Enklast, oscillerar, men tillräcklig för många tillämpningar
✅ **P:** Proportionell kontroll, statiskt reglerfel, grundläggande stabilitet
✅ **PI:** Eliminerar statiskt fel, standard för många processer
✅ **PID:** Snabbaste respons, kräver noggrann inställning

#### Systemegenskaper
✅ **Processförstärkning (K):** Hur mycket processen reagerar
✅ **Tidskonstant (T):** Hur snabb/långsam processen är
✅ **Dötid (θ):** Fördröjning i systemet
✅ **T/θ-ratio:** Mått på reglerbarheten

#### Inställningsprinciper
✅ Högre Kp → snabbare men mindre stabilt
✅ Lägre Ti → snabbare integrator men risk för instabilitet
✅ Td ger förbättring men kräver försiktighet
✅ Svårare system → försiktigare inställningar

### Fortsatt lärande

**Du är nu redo för:**
1. **ovningar-signalstorningar.md** - Hur reglering hanterar störningar
2. **ovningar-systemoptimering.md** - Avancerad optimering och parameterjämförelser
3. **teori-och-bakgrund.md** - Fördjupad matematisk förståelse

**Praktiska projekt:**
- Bygg en egen "process" med Arduino/Raspberry Pi
- Implementera en PID-regulator i kod
- Analysera PID-inställningar i verkliga system

### Reflektionsfrågor för djupare förståelse

1. **Varför finns det ingen "universal" PID-inställning?**
   - För att varje process är unik!

2. **När räcker On/Off-reglering?**
   - När oscillation accepteras och utrustning tål det

3. **Vad är viktigast - snabbhet eller stabilitet?**
   - Beror på tillämpningen! Säkerhet först.

4. **Kan man reglera allt med PID?**
   - Nej, vissa processer kräver mer avancerade metoder

5. **Hur vet man om inställningen är "bra"?**
   - Balans mellan prestanda, stabilitet och robusthet

---

## Tilläggsövningar (utmaning)

### Utmaning 1: Optimal tuning
Hitta den "perfekta" PID-inställningen för:
- K=1.2, T=30s, Dötid=6s

Kriteria:
- Stigtid < 40s
- Översläng < 10%
- Ingen oscillation
- Statiskt fel = 0

### Utmaning 2: Störningshantering
Med samma process och dina bästa PID-parametrar:
1. Aktivera brusstörning (amplitude: 3.0)
2. Justera parametrar för bästa störningsundertryckning
3. Jämför prestanda med/utan störning

### Utmaning 3: System identification
Från stegsvar med öppen styrning:
1. Använd inställningen: MO_initialt = 40%
2. Mät tidpunkter och värden från graf
3. Uppskatta K, T och θ
4. Verifiera med simuleringsparametrar

---

## Appendix: Snabbreferens

### Tumregler för inställning

**Starta alltid konservativt:**
```
Kp = 0.5 × (1/K)
Ti = 3 × T
Td = T/4
```

**Justera från oscillation:**
```
Om systemet oscillerar vid Kp_osc:
Kp_final = 0.5 × Kp_osc
Ti_final = 1.2 × T_osc (oscillationsperiod)
Td_final = 0.3 × Ti_final
```

### Systemkaraktärisering

| T/θ ratio | Reglerbarheten | Lämplig regulator |
|-----------|----------------|-------------------|
| > 10 | Lätt | P eller PI |
| 5-10 | Medel | PI |
| 2-5 | Svår | PI eller PID |
| < 2 | Mycket svår | PID, försiktigt |

### Felsökningschecklista

- [ ] Kontrollera processparametrar (K, T, dötid)
- [ ] Är Kp rimlig? (ej för stor/liten)
- [ ] Oscillerar systemet? → Minska Kp eller öka Ti
- [ ] För långsamt? → Öka Kp eller minska Ti
- [ ] Statiskt fel? → Kontrollera att Ti > 0
- [ ] Ryckig utsignal? → Minska Td
- [ ] Anti-windup aktiverad?

---

**Lycka till med ditt lärande i reglerteknik! 🎓**

*Kom ihåg: Övning ger färdighet. Testa, reflektera och experimentera!*
