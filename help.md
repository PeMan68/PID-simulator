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
- **Vad det gör**: Beskriver hur mycket processvärdet ändras vid ändring av styrsignalen
- **Högre K**: Större påverkan av styrsignal
- **Lägre K**: Mindre påverkan av styrsignal
- **Typiska värden**: 0.1 - 5 

**För tekniska detaljer och beräkningsmetoder**: Se **teori-och-bakgrund.md**

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

### Simuleringshastighet
- **Hastighetskontroller**: Högerpil (>>) ökar hastighet, vänsterpil (<<) minskar hastighet
- **Jämna hastighetsändringar**: 15 förutbestämda nivåer från 0.17x till 58x
- **Användning**: Anpassa simuleringshastighet för optimal demonstration och analys

### Export
- **Exportera grafer**: Spara som PNG-bild
- **Spara data**: Exportera som CSV för analys i Excel

## Jämförelsefunktion (Simuleringshistorik)

Simulatorn sparar automatiskt upp till 5 simuleringar för jämförelse av olika regulatorinställningar.

### Automatisk sparning
Simuleringar sparas när du byter regulatortyp eller sparar parametrar.

### Praktisk användning
- **Undervisning**: Visa "före och efter" vid parameterändringar
- **Jämförelse**: Olika regulatortyper side-by-side  
- **Analys**: Effekten av olika parametrar

### Tips
- Kör tillräckligt länge (minst 10 datapunkter)
- Låt systemet stabilisera
- Ändra en parameter i taget för tydliga jämförelser

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

## Snabbguide för regulatorinställning

### Grundläggande steg:
1. **Börja med P-reglering**: Sätt Ti högt (50+), Td lågt (0-1)
2. **Öka Kp gradvis**: Tills snabb respons utan oscillation
3. **Lägg till I-delen**: Sänk Ti för att eliminera kvarstående fel
4. **Optimera med D-delen**: Justera Td för att minska översläng

**För avancerade inställningsmetoder**: Se **teori-och-bakgrund.md**

## Support och vidareutveckling

Detta verktyg är utvecklat för pedagogiska ändamål inom reglerteknik. 

### Ytterligare resurser
- **Teori-fliken** i programmet för vägledning till teoridokument
- **teori-och-bakgrund.md** för fullständig teknisk dokumentation
- **CHANGELOG.md** för versionshistorik

**Version**: 1.6.0
