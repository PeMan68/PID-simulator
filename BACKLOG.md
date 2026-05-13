 # PID-simulator - Utvecklingsbacklog

Denna fil samlar kända buggar, feature requests och förbättringsförslag för framtida versioner.

## 🏗️ Arkitektoniska beslut

### Web-versioner (prioritering)
- **Primary (2026+)**: Fokus på `apps/web-standalone/` för offline-miljöer och enkelt pilotprojekt
- **Secondary (framtida)**: `apps/web/` (server-baserad) för skolintegrering (LMS, dataspårning, samarbete)
- **Gemensamt**: `packages/sim-core/` - alla förbättringar sprids till båda versioner

## 🐛 Kända buggar

### Kärnfunktionalitet
- **🔥 Integrerande processer**: Simulering av integrerande processer fungerar inte korrekt *(från CHANGELOG.md och teori-och-bakgrund.md)*

### Build/Deployment
- **🔥 Hjälp- och teori-flikar i exe**: Flikarnas Hjälp och teori innehåll skapas inte korrekt i exe-filen (PyInstaller packaging-problem)

### UI/UX-förbättringar
- **⚡ Dynamiska inställningar feedback**: Ändringar i dynamiska inställningar ska också vara röda till de är aktiverade (för bättre visuell feedback)

### Graf/Visualisering
- **⚡ PID-bidrag y-axel enhet**: Y-axeln för PID-bidrag (graf 3) visar celsius men ska visa procent (%)

## 💡 Feature requests

### Planerade för nästa version
- **🔥 Förbättrad integrerande processimulering**: Lösa kända problem med integrerande processer *(från CHANGELOG.md)*

### Framtida versioner
- **⚡ Utökad historik-funktionalitet**: Fler jämförelsemöjligheter och exportalternativ *(från CHANGELOG.md)*
- **⚡ Avancerade störningsmodeller**: Fler typer av realistiska processförändringar *(från CHANGELOG.md)*
- **💤 Frekvensanalys av störningar**: Olika brusfrekvenser och deras påverkan *(från övningsuppgifter)*
- **💤 Adaptiv reglering**: Automatisk anpassning av parametrar för olika driftförhållanden *(från övningsuppgifter)*
- **💤 Säkerhetsmarginaler**: Verktyg för design med störningsreserver *(från övningsuppgifter)*

## 🔧 Förbättringsförslag

### Användbarhet
- **🔥 Unicode-kompatibilitet**: Fullständig emoji-support för äldre Python/Tcl-versioner *(från v1.6.1 notes)*
- **⚡ Förbättrad dialog-positionering**: Mer robust centrering på alla skärmkonfigurationer *(från v1.6.1 notes)*
- **⚡ Utökad tooltip-funktionalitet**: Mer kontextuell hjälp för avancerade funktioner *(från projektutveckling)*
- **⚡ Förbättrad hysteresis-visualisering**: Tydligare OnOff-regulator feedback *(från bugfix-historik)*

### Prestanda
- **💤 Optimerad graf-rendering**: Bättre prestanda vid många historiska kurvor *(från tekniska förbättringar)*

### Dokumentation
- **💤 Förbättrad export-funktionalität**: Fler format och dataanpassningar *(från användarförfrågningar)*

---

## Instruktioner för bidrag

**Lägg till nya buggar/features här:**
1. Kategorisera korrekt (🐛 Bug, 💡 Feature, 🔧 Förbättring)
2. Skriv tydlig beskrivning
3. Lägg till prioritet om möjligt (Hög/Medel/Låg)
4. Referera till GitHub issues om de finns

**Prioritering:**
- 🔥 **Hög**: Kritiska buggar eller mycket efterfrågade features
- ⚡ **Medel**: Viktiga förbättringar
- 💤 **Låg**: Nice-to-have funktioner

**Status:**
- 📋 **Planerad**: Bekräftad för utveckling
- 🔄 **Pågående**: Under utveckling  
- ✅ **Klar**: Implementerad (flytta till CHANGELOG.md)