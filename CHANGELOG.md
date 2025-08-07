# Changelog

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
