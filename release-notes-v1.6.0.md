# PID-simulator v1.6.0 🎉

## Omfattande uppdatering med simuleringshistorik och förbättrad användarupplevelse

### 🎯 Stora nya funktioner

#### **Simuleringshistorik**
- **Jämför upp till 5 simuleringar samtidigt** med automatisk färgkodning
- **Automatisk sparning** vid reglertyp-byten och parameterändringar
- **Progressiv transparens** (30-70%) för historiska kurvor
- **Dedikerad historikpanel** med scrollbar och detaljerad parameterinfo
- **Individuell hantering** - ta bort specifika simuleringar med ×-knapp
- **Smart historikhantering** - bevaras vid reset/störningar, rensas vid processändringar

#### **Maximerat startfönster**
- Programmet startar automatiskt i maximerat läge för optimal skärmutnyttjande
- Perfekt för demonstration och undervisning

#### **Revolutionerade hastighetskontroller**
- **Logaritmiska hastighetssteg**: 15 förutbestämda nivåer från 0.17x till 58x
- **1,5x multiplikator-progression** för jämn acceleration/deceleration
- **Korrigerad kontrollriktning**: >> ökar hastighet, << minskar hastighet
- **Förutsägbara steg** för optimal demonstration

### 🔧 Tekniska förbättringar

#### **Konsekvent färghantering**
- **Permanent färg-ID system** säkerställer konsekvent färgkodning
- **Nuvarande simulering** visas med samma färg som den kommer att få i historiken
- **Eliminerat förvirrande färgbyten** när simuleringar sparas

#### **Förbättrad prestanda**
- **Optimerad rendering** - historik visas endast för processvärde-grafen
- **Effektiv hantering** av upp till 5 samtidiga simuleringar
- **Automatisk uppdatering** av legend vid alla parameterändringar

### 🐛 Kritiska bugfixar

#### **Hysteresis-synkronisering**
- **Fixat problem** där hysteresis-typ (upper/lower/both) inte synkades korrekt till historiken
- **Förbättrad parameterhantering** - alla hysteresis-parametrar sparas nu konsekvent
- **Korrekt visning** av alla OnOff-regulatorinställningar i historikpanelen

### 📚 Dokumentationsförbättringar
- **Utökad README** med beskrivning av jämförelsefunktion
- **Förbättrad help.md** med praktiska användningstips för simuleringshistorik
- **Detaljerade användarguider** för optimal pedagogisk användning

### 🎓 Pedagogiska fördelar

#### **För lärare:**
- **Visa "före och efter"** vid parameterändringar
- **Jämför regulatortyper** side-by-side (OnOff vs P vs PI vs PID)
- **Demonstrera parametereffekter** individuellt
- **Analysera kompromisser** mellan snabbhet och stabilitet

#### **För studenter:**
- **Experimentera utan att förlora resultat** - historik sparas automatiskt
- **Visuell jämförelse** av olika inställningar
- **Förstå parametereffekter** genom tydlig färgkodning
- **Lär genom att prova** med förutsägbara kontroller

### ⚡ Hastighetsnivåer
**0.17x → 0.25x → 0.4x → 0.7x → 1x → 1.5x → 2x → 3x → 5x → 7.5x → 11x → 17x → 25x → 38x → 58x**

### 💿 Installation

#### **Standalone exe (rekommenderat)**
Ladda ner `PID-simulator-v1.6.0.exe` och dubbelklicka för att köra - ingen installation behövs!

#### **Python-version**
```bash
git clone https://github.com/PeMan68/PID-simulator.git
cd PID-simulator
git checkout 1.6.0
pip install -r requirements.txt
python main.py
```

### 🔄 Uppgradering från tidigare versioner
- **Alla inställningar bevaras** - ingen konfiguration behöver ändras
- **Nya funktioner aktiveras automatiskt** vid första körning
- **Bakåtkompatibilitet** - alla gamla simuleringar fungerar som vanligt

### 🎯 Systemkrav
- **Windows**: 7/8/10/11 (x64)
- **Python**: 3.8+ (endast för källkodsversionen)
- **Minne**: 512MB RAM
- **Disk**: 100MB ledigt utrymme

---

**Version**: 1.6.0  
**Releasedatum**: 23 september 2025  
**Utvecklat för**: Pedagogisk användning inom reglerteknik  
**Kompatibilitet**: Windows 7+ (x64), Python 3.8+

🔗 **GitHub**: https://github.com/PeMan68/PID-simulator  
📖 **Dokumentation**: Se README.md och help.md i repositoriet  
🐛 **Buggrapporter**: Skapa en issue på GitHub