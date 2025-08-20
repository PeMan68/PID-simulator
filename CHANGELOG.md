# Changelog

## [1.4.0] - 2025-08-20

### Nya funktioner
- **Regulator-presets**: Fördefinierade inställningar för enkelt val av regulator-typ
  - On/Off-reglering med konfigurerbar hysteresis (över/under/båda)
  - P-reglering (endast proportionell del)
  - PI-reglering (proportionell + integral)
  - PID-reglering (alla tre komponenter)
- **On/Off-regulator**: Komplett implementation med hysteresis-kontroll
- **Intelligent UI**: Kontroller döljs/visas automatiskt baserat på vald preset
- **Hysteresis-visualisering**: Röda pricklinjer visar hysteresis-gränser i processvärdes-grafen
- **Signalstörning på/av**: En checkbox för att aktivera/inaktivera alla störningar samtidigt
- **Step-plot för On/Off**: Tydlig visualisering av on/off-regulatorns utsignal

### Förbättringar
- Förbättrad GUI-layout med preset-kontroller överst
- Anti-windup visas endast för PI/PID (dolt för P och On/Off)
- Manuellt läge dolt för On/Off-reglering
- Automatiska parametervärden för varje preset-typ

### Tekniska förändringar
- Ny OnOffController-klass för On/Off-reglering
- Förbättrad preset-hantering med dynamisk kontroll-visning
- Utökad plot-logik för hysteresis-visualisering

## [1.3.0] - 2025-08-18

### Nya funktioner
- **Stegsvarsanalys-läge**: Förbättrat manuellt läge för stegsvarsanalys
- **Procentvisning**: Möjlighet att visa processvärden i procent
- **Export-funktionalitet**: Spara grafer och data till fil
- **Pedagogisk dokumentation**: Förklaring av processförstärkning-beräkningar

### Förbättringar
- Dynamisk graf-layout i manuellt läge
- Förbättrad x-axel-visning
- Intelligent auto-skalning av processvärden

## [1.2.0] - 2025-08-07

### Nya funktioner
- **Normalvärde (NV)**: Lagt till möjlighet att ställa in det värde som processen tenderar mot när ingen styrsignal är aktiv (t.ex. rumstemperatur för temperaturreglering)
  - Ny inmatning i GUI för normalvärde
  - Processmodellen uppdaterad för att använda normalvärdet som naturlig jämviktspunkt
  - Systemet startar nu på normalvärdet istället för noll
- **Hastighetskontroll**: Möjlighet att justera simuleringshastigheten
  - Knappar (<</>>) för att göra simuleringen snabbare eller långsammare
  - Hastighetsetikett visar aktuell multiplikator (t.ex. "2.0x")
  - Hastighetsområde: 0.3x till 6x normal hastighet

### Förbättringar
- Mer realistisk processmodell med normalvärde för bättre pedagogisk demonstration
- GUI uppdaterad med nya kontroller för normalvärde och hastighet
- Förbättrad startlogik där systemet börjar vid normalvärdet

### Tekniska förändringar
- Process-klassen uppdaterad med normalvarde-parameter
- Ny logik i set_nv() för att uppdatera normalvärde under körning
- Speed control implementation med variabel delay

## [1.1.0] - Tidigare version
- Grundläggande PID-simulator med tooltip-funktionalitet
- Störningsgenerering (brus och puls)
- Anti-windup funktionalitet
- Prestandamått och grafisk visualisering
