# PID-simulator

Ett pedagogiskt verktyg för att demonstrera och simulera PID-reglering i processindustriella system.

## Översikt

Denna simulator är utformad för utbildning i reglerteknik och visar hur olika regulatortyper fungerar med realistiska processmodeller.

### Huvudfunktioner
- **Flera regulatortyper**: On/Off, P, PI och PID
- **Realistiska processmodeller**: Självreglerande och integrerande processer  
- **Simuleringshistorik**: Jämför olika regulatorinställningar
- **Pedagogisk design**: Interaktiv visualisering med hjälpsystem
- **Störningstester**: Brus och pulsstörningar

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
1. Välj **OnOff-preset** för enklaste introduktion
2. Experimentera med **P-reglering** 
3. Utforska **PI** och **PID** för avancerade tillämpningar
4. Använd **Hjälp-fliken** för detaljerade förklaringar

## Pedagogisk användning

### Målgrupp
- Studenter inom automation och reglerteknik
- Yrkesverksamma som vill förstå PID-reglering bättre  
- Lärare som behöver demonstrationsverktyg

### Support och utveckling
För detaljerad hjälp och teknisk information, se:
- **Hjälp-fliken** i programmet för praktisk användning
- **teori-och-bakgrund.md** för matematisk fördjupning
- **CHANGELOG.md** för versionshistorik

---

**Version**: 1.6.0  
**Utvecklat för**: Pedagogisk användning inom reglerteknik
