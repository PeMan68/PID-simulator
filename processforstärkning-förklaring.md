# Processförstärkning - Två beräkningsmetoder

## Introduktion

Processförstärkning (K) är en fundamental parameter i processreglering som beskriver hur mycket processvärdet ändras när styrsignalen ändras. Denna fil förklarar två olika sätt att beräkna och förstå processförstärkning, båda lika korrekta men med olika tillämpningsområden.

## Metod 1: Traditionell ingenjörsansats (°C/%)

### Beskrivning
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
PV% = 100 × (PV - PVmin) / (PVmax - PVmin)
```

### Exempel
Samma värmeprocess med mätområde -10°C till 120°C:

**Steg 1: Konvertera processvärden till procent**
```
PV1% = 100 × (20°C - (-10°C)) / (120°C - (-10°C)) = 100 × 30/130 = 23,08%
PV2% = 100 × (40°C - (-10°C)) / (120°C - (-10°C)) = 100 × 50/130 = 38,46%
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

## Jämförelse av metoderna

| Aspekt | Traditionell (°C/%) | Enhetslös (%/%) |
|--------|-------------------|-----------------|
| K-värde för exemplet | 0,4 °C/% | 0,31 |
| Enheter | Ja | Nej |
| Mätområdets påverkan | Ingen | Stor |
| Industriell användning | Läroböcker | Praktisk tillämpning |
| Intuitivitet | Hög | Medel |

## Praktisk tillämpning i simulatorn

### Traditionell metod
```python
# Direkt beräkning i ingenjörsenheter
dy = (-(y - normalvärde) + K * u) * dt / T
```

### Enhetslös metod
```python
# Konvertera till procent, beräkna, konvertera tillbaka
y_pct = to_percent(y)
nv_pct = to_percent(normalvärde)
dy_pct = (-(y_pct - nv_pct) + K * u) * dt / T
y_new = from_percent(y_pct + dy_pct)
```

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
K_enhetslös = K_traditionell × (PVmax - PVmin) / 100

Exempel:
K_enhetslös = 0,4 °C/% × (120°C - (-10°C)) / 100 = 0,4 × 130/100 = 0,52
```

**Obs!** Detta värde (0,52) skiljer sig från vårt exempel (0,31) eftersom det antar linjär skalning över hela mätområdet, medan vårt exempel använder specifika arbetspunkter.

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

## Slutsats

Båda metoderna är korrekta och har sina fördelar. Valet beror på sammanhang, målgrupp och tillämpning. I undervisningssyfte kan det vara värdefullt att visa båda för att ge en fullständig förståelse av processidentifiering och regulatordesign.

Den viktigaste insikten är att **mätområdet spelar en central roll** i den enhetslösa metoden, medan det är irrelevant för den traditionella metoden. Detta är fundamentalt för att förstå varför samma process kan ha olika K-värden beroende på beräkningsmetod.
