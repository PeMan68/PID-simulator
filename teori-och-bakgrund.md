# Teori och bakgrund - PID-simulator

## Översikt

Detta dokument innehåller fördjupad teoretisk bakgrund för koncepten som används i PID-simulatorn. Det är utformat som referensmaterial för dem som vill förstå de matematiska och tekniska grunderna bakom simuleringen.

**Denna fil kompletterar hjälpsystemet** i PID-simulatorn med detaljerade tekniska förklaringar. För grundläggande förklaringar, använd hjälp-fliken i applikationen.

---

## Processförstärkning - Två beräkningsmetoder

Processförstärkning (K) är en fundamental parameter i processreglering som beskriver förhållandet mellan processens utgång och ingång. Det finns två huvudsakliga metoder för att beräkna processförstärkning, båda korrekta men med olika tillämpningsområden och pedagogiska fördelar.

### Metod 1: Traditionell ingenjörsansats (°C/%)

#### Beskrivning
I denna metod uttrycks processförstärkningen direkt i de enheter som processen arbetar med.

### Formel
```
K = ΔPV / ΔMO
```
Där:
- K = Processförstärkning [°C/%]
- ΔPV = Förändring i processvärde [°C]
- ΔMO = Förändring i manipulerad variabel [%]

### Exempel
En värmeprocess där:
- Styrsignal ökar från 0% till 50%
- Temperatur ökar från 20°C till 40°C

**Beräkning:**
```
K = (40°C - 20°C) / (50% - 0%) = 20°C / 50% = 0,4 °C/%
```

### Fördelar
- ✅ Direkt fysikalisk tolkning
- ✅ Enkelt att förstå enheter
- ✅ Vanligt i ingenjörslitteratur
- ✅ Mätområdet påverkar inte K-värdet

### Nackdelar
- ❌ K-värdet har enheter
- ❌ Svårare att jämföra olika processer
- ❌ Enhetskonvertering krävs vid skalning

## Metod 2: Enhetslös industristandard (%/%)

### Beskrivning
I denna metod konverteras både ingång och utgång till procent av respektive mätområde, vilket ger en enhetslös förstärkning.

### Formel
```
K = ΔPV% / ΔMO%
```
Där:
- K = Processförstärkning [enhetslös]
- ΔPV% = Förändring i processvärde [% av mätområde]
- ΔMO% = Förändring i manipulerad variabel [%]

### Konvertering till procent
```
PV% = 100 · (PV - PVmin) / (PVmax - PVmin)
```

### Exempel
Samma värmeprocess med mätområde -10°C till 120°C:

**Steg 1: Konvertera processvärden till procent**
```
PV1% = 100 · (20°C - (-10°C)) / (120°C - (-10°C)) = 100 · 30/130 = 23,08%
PV2% = 100 · (40°C - (-10°C)) / (120°C - (-10°C)) = 100 · 50/130 = 38,46%
```

**Steg 2: Beräkna enhetslös förstärkning**
```
K = (38,46% - 23,08%) / (50% - 0%) = 15,38% / 50% = 0,31
```

### Fördelar
- ✅ Enhetslös - lättare att jämföra processer
- ✅ Industristandard
- ✅ Direkt användbar i PID-regulatorer
- ✅ Skalningsoberoende inom mätområdet

### Nackdelar
- ❌ Kräver känt mätområde
- ❌ Mätområdet påverkar K-värdet
- ❌ Mindre intuitiv för nybörjare


## När ska man använda vilken metod?

### Använd traditionell metod när:
- 📚 Du undervisar grundläggande processreglering
- 🔬 Du arbetar med forskning och utveckling
- 📊 Du vill ha direkt fysikalisk tolkning
- 📖 Du följer akademisk litteratur

### Använd enhetslös metod när:
- 🏭 Du arbetar med industriella processer
- ⚙️ Du konfigurerar kommersiella regulatorer
- 📈 Du vill jämföra olika processer
- 🎯 Du följer industriella standarder

## Omvandling mellan metoderna

Om du har K i traditionell form och vill konvertera:

```
K_enhetslös = K_traditionell · (PVmax - PVmin) / 100
```

Exempel:
```
K_enhetslös = (0,4 °C/% / (120°C - (-10°C))) · 100 = (0,4 / 130) · 100 ≈ 0,31
```

## Pedagogiska tips

### För studenter som lär sig första gången:
1. Börja med traditionell metod - den är mer intuitiv
2. Förklara fysikalisk betydelse först
3. Introducera enhetslös metod som "industriell praktik"
4. Visa båda metoderna parallellt i simulatorn

### För yrkesverksamma:
1. Fokusera på enhetslös metod
2. Förklara varför mätområdet är viktigt
3. Visa praktiska exempel från industrin
4. Diskutera regulatorinställningar

## Slutsats och rekommendationer

Båda metoderna är matematiskt korrekta och har sina fördelar. Valet beror på sammanhang, målgrupp och tillämpning:

### För utbildning och förståelse:
- **Börja med traditionell metod** - mer intuitiv och fysikaliskt meningsfull
- **Introducera enhetslös metod** som "industriell praktik"
- **Visa båda parallellt** i simulatorn för fullständig förståelse

### För praktisk tillämpning:
- **Använd enhetslös metod** i kommersiella regulatorer
- **Kom ihåg mätområdets betydelse** för K-värdet
- **Dokumentera vilken metod som används** i projektdokumentation

### Viktiga insikter:
1. **Mätområdet spelar central roll** i enhetslös metod men är irrelevant för traditionell
2. **Samma process kan ha olika K-värden** beroende på beräkningsmetod
3. **Fysikalisk intuition** hjälper vid felsökning och optimering
4. **Industriell standard** underlättar kommunikation med kollegor

## Integration med PID-simulatorn

Denna simulator stöder båda metoderna:
- **Traditionell visning**: Använd fysiska enheter (°C, %, etc.)
- **Enhetslös visning**: Aktivera "Visa i procent" för industriell standard
- **Jämförelser**: Växla mellan metoderna för att se skillnaderna
- **Pedagogisk progression**: Börja enkelt, bygg förståelse gradvis

## Vidare läsning

För mer fördjupning inom reglerteknik, se:
- Klassisk reglerteori och PID-design
- Processidentifiering och systemanalys  
- Industriella automationsstandarder
- Modern reglerteknik och avancerade metoder

---

## Regulatorinställning och optimering

### Manuell inställning (Ziegler-Nichols-liknande metod)

Detta är en systematisk metod för att ställa in PID-parametrar när processens parametrar inte är kända:

1. **Sätt Ti och Td höga** (eller inaktivera I och D helt)
2. **Öka Kp gradvis** tills systemet börjar oscillera med konstant amplitud ("kritisk Kp")
3. **Minska Kp** till 50-70% av det kritiska värdet för stabilitet
4. **Aktivera I-delen** (sänk Ti gradvis) tills stationärt fel försvinner, men utan att ge svängningar
5. **Lägg till D-delen** (sänk Td) för att dämpa översläng och snabba störningar
6. **Finjustera** alla parametrar för önskad balans mellan snabbhet och stabilitet

**Fördelar**: Fungerar utan förkunskap om processen
**Nackdelar**: Kräver att systemet får oscillera under inställningen

### Lambda-metoden (IMC/Direct Synthesis)

Om processens parametrar (K, T, dötid) är kända kan du använda lambda-metoden för att beräkna regulatorns parametrar direkt. Detta ger en robust och pedagogisk startpunkt för inställning.

#### Princip
Välj önskad sluten tidskonstant (λ, "lambda"), t.ex. 1–3 gånger processens tidskonstant T:

#### För en självreglerande process av typen: G(s) = K / (T · s + 1) · e^(-L · s)

**PI-regulator (vanligast i industrin)**:
```
Kp = T / (K · (λ + L) )
Ti = T
```

**PID-regulator**:
```
Kp = (T + 0,5 · L) / (K · (λ + 0,5 · L))
Ti = T + 0,5 · L  
Td = (T · L) / (2T + L)
```

#### Exempel
För en process med K = 2, T = 10, L = 2, och λ = 10:

**PI-inställning**:
```
Kp = 10 / (2 · (10 + 2)) = 10 / 24 ≈ 0,42
Ti = 10
```

**PID-inställning**:
```
Kp = (10 + 1) / (2 · (10 + 1)) = 11 / 22 ≈ 0.5
Ti = 11
Td = (10 · 2) / (20 + 2) ≈ 0.91
```

**Fördelar**: Systematisk, robust, pedagogisk
**Nackdelar**: Kräver kännedom om processparametrar


#### För en integrerande process av typen: G(s) = K / s · e^(-L · s)

**PI-regulator (vanligast i industrin):**
```
Kp = λ / (K · (L + 0.5 · λ))
Ti = λ
```

- Där λ (lambda) är önskad sluten tidskonstant, ofta 3–5 gånger dötiden L.
- **Ingen D-del används** för integrerande processer.

**Exempel:**
För en process med K = 1, L = 4, och λ = 12:
```
Kp = 12 / (1 · (4 + 0.5 · 12)) = 12 / (4 + 6) = 12 / 10 = 1.2
Ti = 12
```

**Fördelar:** Robust och enkel inställning även för processer utan naturlig jämviktspunkt.  
**Nackdelar:** Kräver uppskattning av dötid L.

## Matematisk bakgrund och formler

### PID-regulatorns ekvation

Den kontinuerliga PID-regulatorn beskrivs av:

```
u(t) = Kp · [e(t) + (1 / Ti) · ∫e(t)dt + Td · de(t) / dt]
```

Där:
- **u(t)** = Utsignal från regulator [%]
- **e(t)** = Fel (börvärde - processvärde) [enhet]
- **Kp** = Proportionalförstärkning [enhetslös eller med enhet]
- **Ti** = Integreringstid [s] 
- **Td** = Deriveringstid [s]

#### Komponenternas bidrag:
- **P-delen**: Kp · e(t) - Omedelbar reaktion på aktuellt fel
- **I-delen**: Kp · (1 / Ti) · ∫e(t)dt - Eliminerar kvarstående fel över tid
- **D-delen**: Kp · Td · de(t) / dt - Förutser och motverkar snabba förändringar

### Processmodeller

#### Första ordningens process med dötid
Den vanligaste processmodellen inom processindustrin:

```
G(s) = K · e^(-s*L) / (T*s + 1)
```

Där:
- **K** = Processförstärkning [°C/% eller enhetslös]
- **T** = Tidskonstant [s] - Bestämmer responsens snabbhet
- **L** = Dötid (Dead time) [s] - Fördröjning innan respons börjar
- **s** = Laplace-variabel

#### Integrerande process
För processer som nivåreglering:

```
G(s) = K · e^(-s · L) / (T · s^2 + s)
```

Denna process har ingen naturlig jämviktspunkt utan extern kontroll.

### On/Off-reglering med hysteresis

Matematisk beskrivning av tvånivåreglering:

```
u(t) = {
  100%  om PV(t) < SP - h_under
  0%    om PV(t) > SP + h_över  
  u(t-) annars (bibehåll tidigare värde)
}
```

Där:
- **SP** = Börvärde (Setpoint)
- **PV(t)** = Processvärde vid tid t
- **h_under** = Hysteresis under börvärdet
- **h_över** = Hysteresis över börvärdet
- **u(t-)** = Tidigare utsignalvärde

#### Hysteresistyper:
- **Över börvärdet**: h_under = 0, h_över > 0
- **Under börvärdet**: h_under > 0, h_över = 0  
- **Båda sidorna**: h_under > 0, h_över > 0

---

## Framtida teorisektioner

**Framtida utbyggnad**: Detta dokument kan utökas med fler teoretiska avsnitt när nya funktioner läggs till i simulatorn:

### Föreslagna tillägg:
- **Stabilitetsteori**: Rotort och Nyquist-kriteriet
- **Frekvensanalys**: Bode-diagram och fasmarginaler  
- **Avancerade regulatorer**: Cascade, Feedforward, Model Predictive Control
- **Processidentifiering**: Step-response och frekvenssvarsmetoder
- **Anti-windup strategier**: Detaljerad analys av olika metoder
- **Diskret reglering**: Z-transform och samplingseffekter
- **Robust reglering**: Osäkerhetshantering och H∞-design

### Kända begränsningar som ska åtgärdas:
- **Integrerande processer**: Simuleringen av integrerande processer är inte helt korrekt implementerad i nuvarande version. Detta kommer att förbättras i kommande releaser för att bättre återspegla verklig nivåreglering och andra integrerande processer.

## Vidare läsning

För mer fördjupning inom reglerteknik, se:
- Klassisk reglerteori och PID-design
- Processidentifiering och systemanalys  
- Industriella automationsstandarder
- Modern reglerteknik och avancerade metoder

---

**Författad för PID-simulator v1.4+**  
**Del av pedagogiskt material för reglerteknikutbildning**