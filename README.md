# PID-simulator

Ett pedagogiskt verktyg för att demonstrera och simulera PID-reglering i processindustriella system.

## Översikt

Denna simulator är utformad för utbildning i reglerteknik och visar hur olika regulatortyper fungerar med realistiska processmodeller. Programmet kombinerar teoretisk förståelse med praktisk tillämpning genom interaktiv simulering.

### Huvudfunktioner
- **Flera regulatortyper**: On/Off, P, PI och PID med fördefinierade presets
- **Realistiska processmodeller**: Självreglerande och integrerande processer
- **Pedagogisk design**: Steg-för-steg visualisering av regulatorberäkningar
- **Interaktiv hjälp**: Inbyggda tooltips och omfattande hjälpdokumentation
- **Störningstester**: Brus och pulsstörningar för robusthetsutvärdering

## Snabbstart

### Krav
- Python 3.8+
- tkinter (ingår normalt i Python-standardinstallationen)

### Installation

1. **Klona eller ladda ner projektet**
2. **Skapa virtuell miljö**:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. **Installera beroenden**:
   ```powershell
   pip install -r requirements.txt
   ```
4. **Starta programmet**:
   ```powershell
   python main.py
   ```

### Första användning
1. Starta med **OnOff-preset** för enklaste introduktion
2. Experimentera med **P-reglering** för grundläggande förståelse
3. Utforska **PI** och **PID** för avancerade tillämpningar
4. Använd **Hjälp-fliken** för detaljerade förklaringar

## Beroenden

Projektet använder följande Python-paket:
- `matplotlib` - För grafer och visualisering
- `numpy` - Numeriska beräkningar
- `scipy` - Avancerade matematiska funktioner
- `tkinter` - GUI-ramverk (ingår i Python)

## Projektstruktur

```
PID-simulator/
├── main.py                    # Huvudapplikation
├── help.md                   # Detaljerad hjälpdokumentation  
├── teori-och-bakgrund.md     # Teknisk fördjupning och teori
├── CHANGELOG.md              # Versionshistorik
├── README.md                 # Denna fil
└── requirements.txt          # Python-beroenden
```

## Pedagogisk användning

### Målgrupp
- **Studenter** inom automation och reglerteknik
- **Yrkesverksamma** som vill förstå PID-reglering bättre  
- **Lärare** som behöver demonstrationsverktyg

### Undervisningsförslag
1. **Introduktion**: Börja med On/Off-reglering för grundläggande förståelse
2. **Proportionell reglering**: Visa effekten av Kp-parameter
3. **PI-reglering**: Demonstrera eliminering av stationärt fel
4. **PID-reglering**: Fullständig kontroll med D-del för optimering
5. **Störningstester**: Utvärdera regulatorprestanda

## Teknisk information

### Processmodeller
- **Självreglerande**: Första ordningens system med normalvärde
- **Integrerande**: Tankmodell med utflöde

### Regulatortyper  
- **On/Off**: Tvånivåreglering med konfigurerbar hysteresis
- **P**: Proportionell reglering
- **PI**: Proportionell + Integral  
- **PID**: Komplett reglering med alla komponenter

## Support och utveckling

### Rapportera problem
Skapa en issue i projektets repository eller kontakta utvecklaren.

### Bidrag
Pull requests välkomnas för förbättringar och nya funktioner.

### Licens
Se projektets licensfil för detaljer.

---

**Version**: 1.4.2+  
**Utvecklat för**: Pedagogisk användning inom reglerteknik  
**Kompatibilitet**: Python 3.8+ på Windows, macOS, Linux
