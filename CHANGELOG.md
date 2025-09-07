# Changelog

## [1.5.0] - 2025-09-07

### Nya funktioner
- **Hjälpsystem med tooltips**: Hover-tooltips på alla viktiga fält med 1 sekunds fördröjning för pedagogisk guidning
- **Hjälp-flik**: Inbyggd hjälpdokumentation med omfattande förklaringar av alla parametrar och koncept
- **Ny Teori-flik**: Inbyggd teorivisning direkt i applikationen för smidig navigation mellan praktik och teori
- **Avancerad markdown-rendering**: Formaterad hjälptext med rubriker, listor och korrekt partiell fetstil för blandad text
- **Mushjuls-scrollning**: Responsiv scrollning i hjälp-fliken oavsett var musen befinner sig
- **Kontextuell hjälp**: Tooltips anpassade för nybörjare inom reglerteknik med förklaringar av komplicerade begrepp
- **Separerade sparfunktioner**: Implementerat separata "Spara"-knappar för Regulatorparametrar och Systemparametrar för bättre kontroll över vilka ändringar som sparas
- **Graf-skala sparfunktion**: Lagt till "Spara"-knapp för graf-skala med samma funktionalitet som andra parametrar - ändringar påverkar inte visningen förrän de sparas
- **Smart enhetskonvertering**: Automatisk växling mellan procent (%) och fysiska enheter triggar inte längre falska varningar om osparade ändringar
- **Korrekt beräkningslogik**: Börvärdet konverteras nu alltid till rätt enheter för PID-beräkningarna, oavsett om GUI visar procent eller fysiska enheter
- **Optimerad layout**: OnOff-preset som standard, kompakt parametervisning på en rad, export-knappar flyttade under graferna

### Dokumentationsförbättringar
- **Omstrukturerad README**: Fokus på projektöversikt, installation och snabbstart istället för detaljerad manual
- **Förbättrad help.md**: Fokus på praktisk användning med snabbguider och användartips (~150 rader)
- **Utökad teori-och-bakgrund.md**: Tidigare `processförstärkning-förklaring.md` med avancerade inställningsmetoder och matematisk bakgrund (~300+ rader)
- **Förbättrad användarupplevelse**: Tre flikar (Simulator, Hjälp, Teori) ger optimal informationsstruktur
- **Eliminerade pseudo-länkar**: Korrekta referenser till flikar istället för filnamn som ser ut som länkar
- **Förbättrad navigation**: Smarta korsreferenser mellan flikar för effektiv kunskapsbyggnad

### UI/UX-förbättringar
- **Dynamisk T-parameter**: T-parameter döljs automatiskt för integrerande processer när den inte är relevant
- **Förbättrade tooltips**: Kontextuell hjälp för T-parameter med pedagogisk vägledning
- **Standardpreset**: OnOff-regulator visas som standard för enklare introduktion
- **Dynamisk parametervisning**: Ti/Td visas bara för relevanta presets (PI/PID)
- **Kompakt layout**: Regulatorparametrar visas på en rad istället för flera
- **Bättre organisation**: Export-funktioner flyttade under graferna för logisk gruppering
- **Konsekvent textfeedback**: Alla entry-fält blir röda vid ändringar och svarta vid spara

### Förbättringar
- **Förbättrad change tracking**: Visuell feedback för osparade ändringar fungerar nu korrekt för alla fält (hysteresis, utsignal min/max, graf-skala)
- **Konsekvent sparlogik**: Alla parameterfält använder samma change tracking-system med röd text för osparade ändringar
- **Robust parameterhantering**: `saved_params` uppdateras automatiskt vid enhetskonverteringar för att säkerställa korrekt beteende
- **Pedagogisk korrekthet**: Användaren ser konsekvent information i vald enhet medan beräkningarna sker i korrekta enheter
- **Förbättrad hysteresis-hantering**: Hysteresis-plott och beräkningar uppdateras bara vid spara, inte i realtid

### Tekniska förändringar
- Ny `ToolTip`-klass för hover-hjälp med konfigurerbar fördröjning

### Kända begränsningar
- **Integrerande processer**: Simulering av integrerande processer fungerar inte korrekt och ska åtgärdas i kommande versioner

## [1.4.2] - 2025-08-25

### Bugfix
- Hysteresis-gränser i On/Off-regulatorn uppdateras nu korrekt från GUI och påverkar simuleringen som förväntat.

## [1.4.1] - 2025-08-25

### Förbättringar och ändringar
- Omstrukturering av GUI: widgets och parametrar har flyttats och grupperats för bättre layout och dynamisk visning/döljning.
- Signalstörningskontroll flyttad till systemparametrar.
- Utflöde, normalvärde och mätområde placeras på egna rader för tydligare gränssnitt.
- Dynamisk visning av Ti och Td beroende på vald regulator.
- Manuellt läge och manuell ut visas/döljs enligt val.
- Flera layout- och stabilitetsförbättringar i tkinter-grids.

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
