# PID-simulator Hjälp

## Introduktion
Denna simulator demonstrerar PID-reglering för processindustriella system. Programmet är utformat för pedagogisk användning och hjälper dig att förstå hur olika regulatortyper fungerar.

## Snabbstart
1. **Börja med OnOff-reglering** - Enklaste formen av reglering
2. **Prova P-reglering** - Lägg till proportionell kontroll
3. **Utöka till PI** - Eliminera steady-state fel
4. **Slutligen PID** - Optimal prestanda med alla komponenter

**TIPS**: Hover med musen över fält för snabb hjälp!

## Regulatorparametrar

### Regulator-presets
- **OnOff**: Tvånivåreglering med konfigurerbar hysteres
- **P-reglering**: Endast proportionell del aktiv
- **PI-reglering**: Proportionell + Integral komponenter  
- **PID-reglering**: Alla tre komponenter för optimal prestanda

### PID-parametrar

#### Kp (Proportionalförstärkning)
- **Vad det gör**: Bestämmer hur kraftigt regulatorn reagerar på avvikelser från börvärdet
- **Högre värde**: Snabbare respons men risk för oscillation
- **Lägre värde**: Långsammare men stabilare respons
- **Typiska värden**: 0.5 - 10

#### Ti (Integreringstid)
- **Vad det gör**: Hur snabbt regulatorn eliminerar kvarstående fel (steady-state error)
- **Lägre värde**: Snabbare elimination av kvarstående fel
- **Högre värde**: Långsammare men stabilare integration
- **Typiska värden**: 5 - 50 sekunder
- **Special**: Ti=0 innebär ingen integral-verkan (för P-reglering)

#### Td (Deriveringstid)
- **Vad det gör**: Hur regulatorn förutser och motverkar snabba förändringar
- **Fördelar**: Minskar översläng och oscillation
- **Nackdelar**: Känslig för mätbrus
- **Typiska värden**: 0.5 - 5 sekunder

### Begränsningar och säkerhet

#### Utsignal min/max
- Begränsar regulatorns utsignal till säkra värden
- Viktigt för säkerhet i verkliga system
- Standard: 0-100%

#### Anti-windup
- Förhindrar "integrator windup" när utsignalen är mättad
- Kritiskt för system med begränsad utsignal
- Rekommenderas: PÅ för de flesta tillämpningar

#### Manuellt läge
- Frånkopplar regulatorn
- Utsignalen styrs manuellt
- Användbart för testning och nödsituationer

## Systemparametrar

### Processmodell

#### K (Processförstärkning)
Beskriver hur mycket processvärdet ändras när styrsignalen ändras.

**Traditionell metod (°C/%)**:
- K = ΔTemperatur / ΔStyrsignal
- Exempel: K = 0.4 °C/% betyder att 1% ökning av styrsignal ger 0.4°C temperaturökning
- Fysikaliskt intuitivt men har enheter

**Enhetslös metod (%/%)**:
- Industristandard som konverterar allt till procent av mätområdet
- K = ΔProcent_PV / ΔProcent_Styrsignal  
- Lättare att jämföra olika processer
- Påverkas av valt mätområde

#### T (Tidskonstant)
- Beskriver hur snabbt processen reagerar
- Tid det tar för processen att nå 63% av slutvärdet
- Längre T = långsammare process
- Typiska värden: 5-100 sekunder

#### Dötid (Dead time)
- Fördröjning innan processen börjar reagera
- Vanligt i processindustrin (rörledningar, sensorer)
- Gör reglering svårare
- Typiska värden: 0-10 sekunder

### Processtyper

#### Självreglerande process
- Processen når ett nytt jämviktsvärde vid konstant styrsignal
- Exempel: Temperaturreglering med värmeförluster
- Stabilare och lättare att reglera

#### Integrerande process  
- Processvärdet fortsätter att förändras vid konstant styrsignal
- Exempel: Nivåreglering i tank
- Kräver mer avancerad reglering
- **Utflöde**: Konstant utflöde från processen

### Mätområde och enheter

#### Normalvärde
- Det värde processen har vid 0% styrsignal
- Viktigt för korrekt simulering
- Exempel: Rumstemperatur för värmesystem

#### Mätområde
- Definierar området för mätning (min - max)
- Påverkar enhetslös K-beräkning
- Exempel: -10°C till 120°C för temperatursensor

#### Procent-läge
- Visar alla värden som procent av mätområdet
- Användbart för jämförelser
- Växlar mellan fysiska enheter och procent

## Störningar och tester

### Signalstörning
Aktiverar olika typer av störningar för att testa regulatorns prestanda:

- **Brusstörning**: Slumpmässig variation
- **Pulsstörning**: Kort störimpuls

## Graf och analys

### Graf-skala
- Kontrollerar tidsaxelns längd
- Anpassa för att se olika tidsperspektiv
- Kortare skala = mer detaljer
- Längre skala = överblick

### Export
- **Exportera grafer**: Spara som PNG-bild
- **Spara data**: Exportera som CSV för analys i Excel

## Användartips

### För nybörjare
1. **Starta enkelt**: Använd OnOff-reglering först
2. **Öka komplexitet gradvis**: OnOff → P → PI → PID  
3. **Observera effekter**: Se hur varje parameter påverkar systemet
4. **Använd standardvärden**: Börja med föreslagna värden

### För erfarna
1. **Testa olika processtyper**: Självregalande vs integrerande
2. **Experimentera med störningar**: Testa robusthet
3. **Jämför metoder**: Traditionell vs enhetslös förstärkning
4. **Optimera parametrar**: Hitta bästa inställningar

### Felsökning
- **Röd text**: Osparade ändringar - klicka "Spara" för att tillämpa
- **Oscillation**: Minska Kp eller öka Ti
- **Långsam respons**: Öka Kp eller minska Ti  
- **Översläng**: Lägg till Td (PID-reglering)
- **Instabilitet**: Kontrollera anti-windup och utsignalsbegränsningar

## Bakgrundsteori

### PID-ekvationen
```
u(t) = Kp * [e(t) + (1/Ti)*∫e(t)dt + Td*de(t)/dt]
```

Där:
- u(t) = Utsignal från regulator
- e(t) = Fel (börvärde - processvärde)  
- Kp = Proportionalförstärkning
- Ti = Integreringstid
- Td = Deriveringstid

### Processmodell (Första ordningens process med dötid)
```
G(s) = K * e^(-s*L) / (T*s + 1)
```

Där:
- K = Processförstärkning
- T = Tidskonstant
- L = Dötid (Dead time)

### On/Off-reglering
Enkel tvånivåreglering med hysteresis för att undvika "chattering".

## Support och vidareutveckling

Detta verktyg är utvecklat för pedagogiska ändamål. För frågor eller förslag på förbättringar, kontakta utvecklaren.

**Version**: 1.4.2+
**Senast uppdaterad**: September 2025
