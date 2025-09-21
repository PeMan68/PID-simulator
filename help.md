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

- **Traditionell metod**: K i fysiska enheter (t.ex. 0.4 °C/%)
- **Enhetslös metod**: K som procent av mätområdet (industristandard)
- **Högre K**: Större påverkan av styrsignal
- **Typiska värden**: 0.1 - 5 (beroende på metod och process)

**Se även**: **Teori-fliken** för detaljerade beräkningsmetoder och matematisk bakgrund

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

## Jämförelsefunktion (Simuleringshistorik)

### Översikt
Simulatorn sparar automatiskt upp till 5 simuleringar för jämförelse, vilket gör det enkelt att analysera effekten av olika regulatorinställningar.

### Automatisk sparning
Simuleringar sparas automatiskt till historik när du:
- **Byter regulatortyp**: Från OnOff till P, P till PI, etc.
- **Sparar regulatorparametrar**: Efter att ha ändrat Kp, Ti, Td eller andra regulatorinställningar
- **Ändrar viktiga parametrar**: Börvärde, utsignalgränser, hysteresis

### Visuell representation
- **Färgkodning**: Varje simulering får en unik färg som behålls konsekvent
- **Progressiv transparens**: Äldre simuleringar blir mer transparenta (30-70% genomskinlighet)
- **Historik bara för processvärde**: Endast den övre grafen visar historik för tydlighetens skull
- **Nuvarande simulering**: Visas alltid med full opacitet och tjockare linje

### Historikpanel
En dedikerad panel till höger visar:
- **Nuvarande inställning**: Aktuella parametrar som används
- **Tidigare plottar**: Lista över sparade simuleringar med:
  - Reglertyp (OnOff, P, PI, PID)
  - Huvudparametrar (Kp, Ti, Td, hysteresis)
  - Utsignalgränser (U:)
  - Färgkodad indikator
  - Radera-knapp (×) för individuell borttagning

### Praktisk användning
**För undervisning**:
- Visa "före och efter" vid parameterändringar
- Jämför olika regulatortyper side-by-side
- Demonstrera effekten av Kp, Ti, Td individuellt
- Analysera kompromisser mellan snabbhet och stabilitet

**För lärande**:
- Experimentera utan att förlora tidigare resultat
- Enkelt återgå till tidigare inställningar genom att studera historiken
- Förstå parametereffekter genom visuell jämförelse

### Hantering av historik
- **Automatisk begränsning**: Max 5 simuleringar (äldsta tas bort automatiskt)
- **Smart rensning**: Historik rensas endast vid processparameterändringar (K, T, dötid)
- **Manuell borttagning**: Klicka × för att ta bort specifika simuleringar
- **Bevaras vid**: Reset, störningar, och grafändringar påverkar inte historiken

### Tips för bästa resultat
1. **Kör tillräckligt länge**: Minst 10 datapunkter krävs för sparning
2. **Låt systemet stabilisera**: Kör simuleringen tillräckligt länge för att se full respons
3. **Systematiska jämförelser**: Ändra en parameter i taget för tydliga jämförelser
4. **Använd konsekvent tidsram**: Samma simuleringslängd ger bättre jämförelser

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

### Tumregler:
- **Snabb process (T < 10s)**: Börja med Kp ≈ 1, Ti ≈ 2×T
- **Långsam process (T > 30s)**: Börja med Kp ≈ 0.5, Ti ≈ T
- **Med dötid**: Minska Kp, öka Ti proportionellt mot dötiden

**Se även**: **Teori-fliken** innehåller avancerade inställningsmetoder (Ziegler-Nichols, Lambda-metoden) och fullständig matematisk bakgrund

## Support och vidareutveckling

Detta verktyg är utvecklat för pedagogiska ändamål inom reglerteknik. 

### Ytterligare resurser
- **Teori-flik**: Översikt och vägledning till externt teoridokument
- **Teorifil**: Öppna `teori-och-bakgrund.md` för korrekt formatering av tabeller och matematik
- **Versionshistorik**: Se CHANGELOG för nya funktioner och förbättringar  
- **Installation**: README innehåller projektöversikt och installationsinstruktioner

**Tips**: Teori-fliken visar vad som finns tillgängligt, externa filen ger optimal läsbarhet!

**Version**: 1.5.0
**Senast uppdaterad**: September 2025
