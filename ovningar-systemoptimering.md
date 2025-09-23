# Övningsuppgifter: Systemoptimering och Parameterjämförelser
*PID-simulator v1.6.1 - Avancerade övningar med historikanalys*

## Inledning

Denna övningssamling fokuserar på systematisk optimering av regulatorparametrar och fördjupad förståelse för hur olika systemegenskaper påverkar regulatorprestanda. De nya historikfunktionerna gör det möjligt att spara och namnge simuleringar för detaljerad jämförelse.

**Förkunskaper:** Genomförda övningar i signalstörningar, grundläggande PID-förståelse.

**Mål:** Utveckla systematisk approach för regulatordesign och optimering.

**Användning av historikfunktioner:**
- **"Spara" knappen**: Aktiv endast när simuleringen är pausad/stoppad
- **Namngivning**: Du kan antingen använda det föreslagna namnet eller skriva ditt eget
- **Visning**: Tekniska parametrar visas alltid, ditt anpassade namn som extra etikett
- **"Rensa historik"**: Tar bort alla sparade simuleringar med bekräftelse

**Exempel på arbetsflöde:**
1. Ställ in parametrar (ex: P-reglering, Kp=1.5)
2. Kör simulering tills den stabiliserat sig
3. Pausa eller låt simuleringen avslutas
4. Tryck "Spara" → programmet föreslår "P(Kp=1.5)"
5. Ändra till "P på integrerande" → Klicka OK
6. I historikpanelen visas: tekniska parametrar + [P på integrerande]

---

## Del 1: Parameterkänslighetsanalys

### Övning 1.1: Kp-parameterns påverkan
**Syfte:** Systematiskt utforska proportionalförstärkningens effekter.

#### Steg 1: Baslinje-system
1. **Process**: Självreglerande, K=1.0, T=25s, Dötid=0s
2. **Börvärde**: 60, **Mätområde**: 0-100
3. **Rensa historik**

#### Steg 2: Kp-variation (endast P-reglering)
1. Kp=0.3 → Kör 80s → **Spara** (märk: "Låg Kp")
2. Kp=0.6 → Kör 80s → **Spara** (märk: "Medel Kp")
3. Kp=1.0 → Kör 80s → **Spara** (märk: "Hög Kp")
4. Kp=1.5 → Kör 80s → **Spara** (märk: "Mycket hög Kp")
5. Kp=2.0 → Kör 80s → **Spara** (märk: "Kritisk Kp")

#### Steg 3: Analys av historik
Studera alla kurvor samtidigt och dokumentera:
- **Stationärt fel** för varje Kp-värde
- **Stabiliseringstid** (tid till ±5% av börvärde)
- **Översläng** (maximal överridning)
- **Oscillationsbeteende**

**Reflektion 1.1:**
- Vid vilket Kp-värde börjar systemet oscillera?
- Vad är kompromissen mellan snabbhet och stabilitet?
- Hur skulle du välja Kp för en verklig tillämpning?

---

### Övning 1.2: Ti-parameterns roll
**Syfte:** Förstå integreringstidens påverkan på systemdynamik.

#### Steg 1: Förberedelser
1. **Rensa historik**
2. Samma grundprocess som övning 1.1
3. Fast Kp=1.0 (från tidigare analys)

#### Steg 2: Ti-variation (PI-reglering)
1. Ti=5s → Kör 100s → **Spara** (märk: "Snabb integration")
2. Ti=10s → Kör 100s → **Spara** (märk: "Medel integration")
3. Ti=20s → Kör 100s → **Spara** (märk: "Långsam integration")
4. Ti=40s → Kör 100s → **Spara** (märk: "Mycket långsam")
5. Ti=100s → Kör 100s → **Spara** (märk: "Nästan P-reglering")

#### Steg 3: Steady-state analys
För varje inställning, mät:
- **Tid till noll steady-state fel**
- **Oscillationstendens**
- **Integrator windup-risk**

**Reflektion 1.2:**
- Hur påverkar Ti stationära felet?
- Vad händer när Ti blir för liten?
- Vilken balans krävs mellan eliminering av stationärt fel och stabilitet?

---

### Övning 1.3: Td-parameterns optimering
**Syfte:** Förstå derivatadelens bidrag och begränsningar.

#### Steg 1: Baslinje PI-reglering
1. **Rensa historik**
2. PI-reglering: Kp=1.0, Ti=15s → **Spara** (märk: "Utan D-del")

#### Steg 2: Td-variation (PID-reglering)
1. Td=1s → Kör 80s → **Spara** (märk: "Låg D-del")
2. Td=3s → Kör 80s → **Spara** (märk: "Medel D-del")
3. Td=5s → Kör 80s → **Spara** (märk: "Hög D-del")
4. Td=8s → Kör 80s → **Spara** (märk: "Mycket hög D-del")

#### Steg 3: D-del med realistiska störningar
1. Aktivera brusstörning (amplitude: 1.5)
2. Upprepa Td-variationen med brus
3. Jämför med tidigare resultat utan brus

**Reflektion 1.3:**
- Hur påverkar D-delen översläng och stabiliseringstid?
- Vid vilken punkt blir D-delen kontraproduktiv?
- Varför är D-delen problematisk med brusstörningar?

---

## Del 2: Systemvariation och anpassning

### Övning 2.1: Processförstärkningens påverkan
**Syfte:** Förstå hur olika processförstärkningar kräver olika regulatorstrategier.

#### Steg 1: Referens-regulator
1. **Process**: K=1.0, T=20s, Dötid=0s
2. **Optimal PID**: Kp=1.2, Ti=12s, Td=2s
3. Kör simulering → **Spara** (märk: "K=1.0 referens")

#### Steg 2: Låg processförstärkning
1. **Ändra K till 0.3** (håll T och dötid konstanta)
2. Samma regulatorinställningar → **Spara** (märk: "K=0.3, samma reg")
3. Anpassa regulator: Kp=4.0, Ti=12s, Td=2s → **Spara** (märk: "K=0.3, anpassad")

#### Steg 3: Hög processförstärkning
1. **Ändra K till 3.0**
2. Samma ursprungliga regulator → **Spara** (märk: "K=3.0, samma reg")
3. Anpassa regulator: Kp=0.4, Ti=12s, Td=2s → **Spara** (märk: "K=3.0, anpassad")

**Reflektion 2.1:**
- Hur påverkar processförstärkningen stabiliteten?
- Vilken tumregel kan du utveckla för Kp i relation till K?
- Varför blir system med hög förstärkning svårare att reglera?

---

### Övning 2.2: Tidskonstantens betydelse
**Syfte:** Utforska hur processens naturliga hastighet påverkar reglerstrategin.

#### Steg 1: Referenssystem
1. **Process**: K=1.0, T=20s, Dötid=0s
2. **PID**: Kp=1.0, Ti=10s, Td=2s → **Spara** (märk: "T=20s referens")

#### Steg 2: Snabb process
1. **Ändra T till 5s**
2. Samma regulator → **Spara** (märk: "T=5s, samma reg")
3. Anpassa: Kp=1.0, Ti=3s, Td=0.5s → **Spara** (märk: "T=5s, anpassad")

#### Steg 3: Långsam process
1. **Ändra T till 60s**
2. Samma ursprungliga regulator → **Spara** (märk: "T=60s, samma reg")
3. Anpassa: Kp=1.0, Ti=30s, Td=5s → **Spara** (märk: "T=60s, anpassad")

**Reflektion 2.2:**
- Hur relaterar Ti optimalt till T?
- Varför behöver långsamma processer längre Ti-tid?
- Vilka utmaningar ger mycket snabba respektive långsamma processer?

---

### Övning 2.3: Dötidsproblem
**Syfte:** Förstå hur dötid begränsar regulatorprestanda.

#### Steg 1: Utan dötid (referens)
1. **Process**: K=1.0, T=20s, Dötid=0s
2. **Aggressiv PID**: Kp=1.5, Ti=8s, Td=2s → **Spara** (märk: "Ingen dötid")

#### Steg 2: Måttlig dötid
1. **Dötid=3s**
2. Samma aggressiva PID → **Spara** (märk: "Dötid 3s, samma reg")
3. Konservativ anpassning: Kp=1.0, Ti=12s, Td=1s → **Spara** (märk: "Dötid 3s, anpassad")

#### Steg 3: Stor dötid
1. **Dötid=10s**
2. Ursprunglig aggressiv PID → **Spara** (märk: "Dötid 10s, samma reg")
3. Mycket konservativ: Kp=0.6, Ti=20s, Td=0.5s → **Spara** (märk: "Dötid 10s, anpassad")

**Reflektion 2.3:**
- Hur påverkar dötid systemets stabilitet?
- Varför måste alla parametrar minskas vid ökad dötid?
- Finns det gränser för vad som är reglerbart?

---

## Del 3: Verkliga designstrategier

### Övning 3.1: Ziegler-Nichols-metoden
**Syfte:** Testa klassisk inställningsmetod och jämföra med manuell optimering.

#### Steg 1: Hitta kritisk förstärkning
1. **Process**: K=1.0, T=25s, Dötid=2s
2. **Endast P-reglering**, börja med Kp=0.5
3. Öka Kp gradvis tills systemet oscillerar stabilt
4. Dokumentera kritiska Kp (Kp_crit) och oscillationsperiod (T_crit)

#### Steg 2: Beräkna Ziegler-Nichols-parametrar
- **P-reglering**: Kp = 0.5 × Kp_crit
- **PI-reglering**: Kp = 0.45 × Kp_crit, Ti = T_crit/1.2
- **PID-reglering**: Kp = 0.6 × Kp_crit, Ti = T_crit/2, Td = T_crit/8

#### Steg 3: Jämförelse
1. **Rensa historik**
2. ZN P-inställning → **Spara** (märk: "ZN P-metod")
3. ZN PI-inställning → **Spara** (märk: "ZN PI-metod")
4. ZN PID-inställning → **Spara** (märk: "ZN PID-metod")
5. Din manuella optimering → **Spara** (märk: "Manuell optimering")

**Reflektion 3.1:**
- Hur presterar Ziegler-Nichols jämfört med din manuella inställning?
- Vilka fördelar och nackdelar har standardmetoder?
- När skulle du använda ZN vs manuell optimering?

---

### Övning 3.2: Lambda-inställning
**Syfte:** Utforska modern inställningsmetodik baserad på önskad sluten-slinga-tidskonstant.

#### Steg 1: Konservativ design (λ = 2×T)
1. **Process**: K=1.0, T=20s, Dötid=0s
2. **Lambda = 40s** (konservativ)
3. Beräkna: Kp = T/(K×(λ+dötid)), Ti = T, Td = 0
4. Kör simulering → **Spara** (märk: "Lambda konservativ")

#### Steg 2: Balanserad design (λ = T)
1. **Lambda = 20s** (balanserad)
2. Uppdatera parametrar enligt formel
3. Kör simulering → **Spara** (märk: "Lambda balanserad")

#### Steg 3: Aggressiv design (λ = 0.5×T)
1. **Lambda = 10s** (aggressiv)
2. Uppdatera parametrar
3. Kör simulering → **Spara** (märk: "Lambda aggressiv")

#### Steg 4: Med dötid
1. Lägg till **dötid = 5s**
2. Uppdatera lambda-beräkningar för alla tre fall
3. Jämföra prestanda med och utan dötid

**Reflektion 3.2:**
- Vilken lambda ger bäst kompromiss för din applikation?
- Hur påverkar dötid lambda-metodens prestanda?
- När är lambda-metoden överlägsen traditionella metoder?

---

## Del 4: Specialfall och avancerade tekniker

### Övning 4.1: Integrerande processer
**Syfte:** Hantera processer utan naturlig stabilitet.

#### Steg 1: Integrerande processmodell
1. **Processtyp**: Integrerande
2. **K=0.8, T=15s, Utflöde=1.5**
3. **Rensa historik**

#### Steg 2: Olika regulatorstrategier
1. P-reglering (Kp=1.5) → **Spara** (märk: "P på integrerande")
2. PI-reglering (Kp=1.5, Ti=8s) → **Spara** (märk: "PI på integrerande")
3. PID-reglering (Kp=1.5, Ti=8s, Td=1s) → **Spara** (märk: "PID på integrerande")

#### Steg 3: Optimering för integrerande process
1. Experimentera med olika Ti-värden (Ti=4s, 8s, 15s)
2. Testa med och utan D-del
3. Dokumentera stabilitet och prestanda

**Reflektion 4.1:**
- Varför fungerar inte P-reglering för integrerande processer?
- Hur skiljer sig parameterval från självreglerande processer?
- Vilka verkliga system är integrerande?

---

### Övning 4.2: Multivariabel påverkan
**Syfte:** Förstå hur systemets komplexitet påverkar regulatordesign.

#### Steg 1: Grundsystem med begränsningar
1. **Process**: Självreglerande, K=1.0, T=20s
2. **Utsignal begränsad**: 0-80% (istället för 0-100%)
3. **Anti-windup**: Aktiverad

#### Steg 2: Stor setpoint-ändring
1. PID-reglering (Kp=1.2, Ti=10s, Td=2s)
2. **Börvärde**: Ändra från 30 till 70 (stor ändring)
3. Kör simulering → **Spara** (märk: "Stor SP-ändring")

#### Steg 3: Jämför med obegränsad utsignal
1. **Utsignal**: Ändra till 0-100%
2. Samma stora setpoint-ändring
3. Kör simulering → **Spara** (märk: "Obegränsad utsignal")

#### Steg 4: Optimering för begränsningar
1. Anpassa regulator för begränsad utsignal
2. Minska aggressivitet: Kp=0.8, Ti=15s, Td=1s
3. Testa samma stora setpoint-ändring → **Spara**

**Reflektion 4.2:**
- Hur påverkar begränsningar regulatorprestanda?
- Vad är värdet av anti-windup?
- Hur skulle du designa för system med kända begränsningar?

---

## Sammanfattande projektuppgift

### Designprojekt: Optimal regulator för given process
**Scenario**: Du ska designa en regulator för en temperaturprocess i en kemisk reaktor.

**Processegenskaper**:
- Självreglerande process
- K = 0.6°C/% (processförstärkning)
- T = 45s (tidskonstant)
- Dötid = 8s (sensorfördröjning)
- Normala störningar: Brus ±2°C, enstaka pulser ±10°C
- Utsignal begränsad: 0-90% (säkerhetsrestriktioner)

**Krav**:
1. Stabiliseringstid < 3 minuter för setpoint-ändringar
2. Översläng < 10% vid setpoint-ändring
3. Steady-state fel = 0
4. Stabil vid normala störningar
5. Återhämtning inom 2 minuter efter pulsstörning

**Leverans**:
1. Dokumenterad designprocess med historikjämförelser
2. Slutlig regulatorinställning med motivering
3. Prestanda-verifiering under olika förhållanden
4. Riskanalys och reservstrategier

---

## Avslutande reflektion

Efter genomförda övningar, svara på:

1. **Systematisk approach**: Vilken metodik fungerar bäst för regulatordesign?
2. **Kompromisser**: Vilka är de viktigaste avvägningarna i praktisk reglering?
3. **Verkliga begränsningar**: Hur påverkar praktiska begränsningar din designfilosofi?
4. **Framtida utveckling**: Vilka avancerade tekniker skulle kunna förbättra prestanda?

---

**Tips för lärare:**
- Använd olika processmodeller för olika studentgrupper
- Låt studenter presentera sina optimeringsstrategier
- Diskutera verkliga applikationer och industristandards
- Använd som grund för avancerade reglerkurser

**Version:** 1.0 för PID-simulator v1.6.0  
**Tidsåtgång:** 4-6 timmar (inklusive projektuppgift)  
**Svårighetsgrad:** Medel-Avancerad