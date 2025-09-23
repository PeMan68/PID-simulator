# Övningsuppgifter: Signalstörningar och Robusthet
*PID-simulator v1.6.1 - Pedagogiska övningar med historikjämförelse*

## Inledning

Dessa övningar fokuserar på att förstå hur olika regulatorinställningar hanterar signalstörningar i verkliga system. De förbättrade historikfunktionerna gör det enkelt att jämföra olika strategier och analysera robusthet.

**Förkunskaper:** Grundläggande förståelse för P-, I- och D-parametrarnas funktion.

**Mål:** Förstå hur regulatorer presterar under realistiska förhållanden med störningar.

**Tips för historikhantering:**
- Spara-knappen aktiveras automatiskt när simuleringen pausas
- Använd beskrivande namn som "P-reglering med brus" eller "PID låg Td"
- Både tekniska parametrar och ditt anpassade namn visas i legenden
- Rensa historik mellan olika övningsdelar för tydligare jämförelser

---

## Del 1: Grundläggande störningsanalys

### Övning 1.1: Brusstörningens påverkan
**Syfte:** Förstå hur olika regulatortyper hanterar kontinuerlig brusstörning.

#### Steg 1: Förberedelser
1. Starta PID-simulatorn
2. Ställ in grundläggande process:
   - **Process**: Självreglerande
   - **K**: 1.0, **T**: 20s, **Dötid**: 0s
   - **Börvärde**: 50
   - **Mätområde**: 0-100

#### Steg 2: P-reglering utan störning (referens)
1. Välj **P-preset** (Kp=1.0)
2. Starta simuleringen och låt den köra tills systemet stabiliserat sig (ca 60s)
3. **Tryck "Spara"** för att lägga till i historik
4. Notera: Stationärt fel och stabiliseringstid

#### Steg 3: P-reglering med brusstörning
1. Aktivera **Brusstörning** (amplitude: 2.0)
2. Starta ny simulering med samma P-inställningar
3. Låt köra 60s och **tryck "Spara"**
4. **Analysera historiken:** Jämför de två kurvorna

**Reflektion 1.1:**
- Hur påverkar bruset processvärdet?
- Blir utsignalen också brusig? Varför?
- Vilka praktiska problem kan detta orsaka?

---

### Övning 1.2: PI-reglerens robusthet
**Syfte:** Undersöka hur I-delen påverkar störningshantering.

#### Steg 1: PI-reglering utan störning
1. Välj **PI-preset** (Kp=1.0, Ti=10s)
2. Kör simulering utan störningar (60s)
3. **Spara** i historik

#### Steg 2: PI-reglering med brusstörning
1. Aktivera **Brusstörning** (amplitude: 2.0)
2. Kör simulering med PI-inställningar (60s)
3. **Spara** i historik

#### Steg 3: Experimentera med Ti-värden
1. Prova Ti=5s med brusstörning → **Spara**
2. Prova Ti=20s med brusstörning → **Spara**

**Reflektion 1.2:**
- Vilken skillnad ser du mellan P och PI vid brusstörning?
- Hur påverkar Ti-värdet störningskänsligheten?
- Vad händer med utsignalen när Ti blir mindre?

---

## Del 2: Pulsstörningar och transienter

### Övning 2.1: Snabba störningsförändringar
**Syfte:** Förstå hur olika regulatorer återhämtar sig från plötsliga störningar.

#### Steg 1: Förberedelser
1. **Rensa historik** (ta bort alla tidigare simuleringar)
2. Samma processmodell som tidigare
3. Stäng av brusstörning

#### Steg 2: P-reglering vs pulsstörning
1. P-preset (Kp=1.0)
2. Aktivera **Pulsstörning** (amplitude: 10, varaktighet: 5s)
3. Starta simulering, vänta tills första pulsen träffat (ca 20s)
4. **Spara** i historik

#### Steg 3: PI-reglering vs pulsstörning
1. PI-preset (Kp=1.0, Ti=10s)
2. Samma pulsstörning
3. Kör simulering (60s) → **Spara**

#### Steg 4: PID-reglering vs pulsstörning
1. PID-preset (Kp=1.0, Ti=10s, Td=2s)
2. Samma pulsstörning
3. Kör simulering (60s) → **Spara**

**Reflektion 2.1:**
- Vilken regulatortyp återhämtar sig snabbast från pulsstörningen?
- Vad är skillnaden mellan olika regulatortypers respons?
- Ser du någon "översläng" efter störningen?

---

### Övning 2.2: D-delens roll vid störningar
**Syfte:** Förstå derivatadelens fördelar och nackdelar vid störningar.

#### Steg 1: Jämför Td-värden
1. **Rensa historik**
2. Använd PI-inställningar (Kp=1.0, Ti=10s) med pulsstörning → **Spara**
3. Lägg till D-del: Td=1s → **Spara**
4. Öka D-del: Td=3s → **Spara**
5. Hög D-del: Td=5s → **Spara**

#### Steg 2: D-del med brusstörning
1. **Rensa historik**
2. PID (Kp=1.0, Ti=10s, Td=2s) utan störning → **Spara**
3. Samma PID med brusstörning (amplitude: 2.0) → **Spara**
4. Öka brusamplitud till 5.0 → **Spara**

**Reflektion 2.2:**
- Hur hjälper D-delen vid pulsstörningar?
- Vad händer när D-delen möter brusstörning?
- Vilken kompromiss måste man göra mellan snabbhet och brusskänslighet?

---

## Del 3: Verkliga systemutmaningar

### Övning 3.1: Integrerande process med störningar
**Syfte:** Förstå hur procestypen påverkar störningskänslighet.

#### Steg 1: Ändra till integrerande process
1. **Processtyp**: Integrerande
2. **K**: 0.5, **Dötid**: 15s, **Utflöde**: 2.0
3. **Rensa historik**

#### Steg 2: Jämför regulatortyper
1. P-reglering (Kp=2.0) med brusstörning → **Spara**
2. PI-reglering (Kp=2.0, Ti=8s) med brusstörning → **Spara**
3. PID-reglering (Kp=2.0, Ti=8s, Td=1s) med brusstörning → **Spara**

**Reflektion 3.1:**
- Vilken skillnad ser du mellan självreglerande och integrerande processer?
- Varför är P-reglering problematisk för integrerande processer?
- Hur påverkar störningar de olika regulatortyperna här?

---

### Övning 3.2: Kompromisser och optimering
**Syfte:** Hitta optimal balans mellan prestanda och robusthet.

#### Steg 1: Självreglerande process med dötid
1. **Processtyp**: Självreglerande
2. **K**: 1.0, **T**: 20s, **Dötid**: 5s
3. Brusstörning aktiverad (amplitude: 3.0)

#### Steg 2: Optimeringsförsök
1. Konservativ PID: Kp=0.8, Ti=15s, Td=1s → **Spara**
2. Aggressiv PID: Kp=2.0, Ti=8s, Td=3s → **Spara**
3. Balanserad PID: Kp=1.2, Ti=12s, Td=2s → **Spara**

#### Steg 3: Stresstesta bästa inställningen
1. Välj bästa inställningen från steg 2
2. Öka brusstörning till amplitude 5.0 → **Spara**
3. Lägg till pulsstörningar samtidigt → **Spara**

**Reflektion 3.2:**
- Vilken inställning ger bäst kompromiss mellan snabbhet och stabilitet?
- Hur mycket störning tål systemet innan det blir instabilt?
- Vad skulle du rekommendera för en verklig tillämpning?

---

## Del 4: Avancerade störningsscenarier

### Övning 4.1: Anti-windup och begränsningar
**Syfte:** Förstå hur begränsningar påverkar störningshantering.

#### Steg 1: Begränsad utsignal
1. Självreglerande process (K=1.0, T=20s)
2. PI-reglering (Kp=1.5, Ti=8s)
3. **Utsignal max**: 80% (istället för 100%)
4. Stora pulsstörningar (amplitude: 15)

#### Steg 2: Jämför anti-windup
1. Anti-windup AV → Kör simulering → **Spara**
2. Anti-windup PÅ → Kör simulering → **Spara**

**Reflektion 4.1:**
- Vad händer när utsignalen "mättas"?
- Hur hjälper anti-windup-funktionen?
- Vilka verkliga situationer kan detta representera?

---

## Sammanfattande reflektion

Efter att ha genomfört alla övningar, fundera över:

1. **Prestanda vs Robusthet:** Vilka kompromisser måste man göra?
2. **Processtyp:** Hur påverkar procestypen val av regulatorstrategi?
3. **Verkliga tillämpningar:** Vilka typer av störningar förväntar du dig i olika industrier?
4. **Designfilosofi:** Ska man designa för nominella förhållanden eller värstafallsscenarier?

---

## Fördjupningsuppgifter

### Extra A: Frekvensanalys
Experimentera med olika brusfrekvenser genom att variera simuleringshastigheten och observera hur snabba vs långsamma störningar påverkar systemet olika.

### Extra B: Adaptiv reglering
Använd historikfunktionen för att dokumentera hur du skulle ändra regulatorparametrar för olika driftförhållanden.

### Extra C: Säkerhetsmarginaler
Designa en regulator som fungerar acceptabelt även med 50% högre störningsnivåer än nominellt.

---

**Tips för lärare:**
- Låt studenter presentera sina historikjämförelser för klassen
- Diskutera verkliga exempel från olika industrier
- Använd som grund för mer avancerade reglerteknikkurser

**Version:** 1.0 för PID-simulator v1.6.1  
**Tidsåtgång:** 3-4 timmar (beroende på fördjupningsnivå)  
**Svårighetsgrad:** Medel (efter grundkurs i reglerteknik)
