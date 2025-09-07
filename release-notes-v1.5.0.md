# PID-simulator v1.5.0 🎉

En stor uppdatering med omfattande förbättringar av dokumentation, användarupplevelse och funktionalitet!

## ✨ Nya funktioner

### 📚 Komplett hjälp- och teorisystem
- **Ny Teori-flik**: Inbyggd teorivisning direkt i applikationen för smidig navigation mellan praktik och teori
- **Hjälp-flik**: Omfattande hjälpdokumentation med förklaringar av alla parametrar och koncept
- **Hjälpsystem med tooltips**: Hover-tooltips på alla viktiga fält med pedagogisk guidning
- **Avancerad markdown-rendering**: Formaterad hjälptext med rubriker, listor och korrekt formatering

### 💾 Förbättrade sparfunktioner
- **Separerade sparfunktioner**: Separata "Spara"-knappar för Regulatorparametrar och Systemparametrar
- **Graf-skala sparfunktion**: Spara graf-skala separat med samma funktionalitet som andra parametrar
- **Smart enhetskonvertering**: Automatisk växling mellan procent (%) och fysiska enheter utan falska varningar

### 🎯 UI/UX-förbättringar
- **Dynamisk T-parameter**: Döljs automatiskt för integrerande processer när den inte är relevant
- **Standardpreset**: OnOff-regulator som standard för enklare introduktion
- **Kompakt layout**: Regulatorparametrar på en rad, export-knappar under graferna
- **Förbättrad change tracking**: Visuell feedback för osparade ändringar på alla fält

## 📖 Dokumentationsförbättringar

- **Omstrukturerad README**: Fokus på projektöversikt, installation och snabbstart
- **Förbättrad help.md**: Praktisk användning med snabbguider (~150 rader)
- **Utökad teori-och-bakgrund.md**: Avancerade inställningsmetoder och matematisk bakgrund (~300+ rader)
- **Tre-flik struktur**: Optimal informationsstruktur (Simulator, Hjälp, Teori)

## 🔧 Tekniska förbättringar

- Ny `ToolTip`-klass för hover-hjälp
- Förbättrad markdown-rendering
- Robust parameterhantering
- Konsekvent sparlogik för alla fält

## ⚠️ Kända begränsningar

- **Integrerande processer**: Simuleringen fungerar inte helt korrekt än, kommer förbättras i framtida versioner

## 📥 Installation

### Windows (Enklast)
Ladda ner `PID-simulator-v1.5.0.exe` och dubbelklicka för att köra - ingen installation behövs!

### Python (alla plattformar)
```bash
git clone https://github.com/PeMan68/PID-simulator.git
cd PID-simulator
pip install -r requirements.txt
python main.py
```

---

**Fullständig changelog**: https://github.com/PeMan68/PID-simulator/blob/main/CHANGELOG.md
