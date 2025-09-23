# PID-simulator v1.6.1 🎯

**Utgivningsdatum**: 23 september 2025  
**Typ**: Förbättringsrelease med förbättrad användarupplevelse

## 🆕 Nya funktioner

### Manuell historikhantering
- **"Spara" knapp** i historikpanelen för manuell sparning av simuleringar
- **Anpassade namn** med föreslagna etiketter baserat på regulatorparametrar
- **"Rensa historik" knapp** med bekräftelsedialog för säker rensning
- **Flexibel namngivning** - använd föreslaget namn eller skriv eget

### Förbättrad pedagogisk användning
- **Strukturerade jämförelser** med beskrivande etiketter
- **Optimerat arbetsflöde** för övningsuppgifter och laborationer
- **Tydlig historikvisning** med både tekniska parametrar och anpassade namn

## 🎨 Användargränssnitt

### Centrerade dialoger
- **Perfekt centrering** av alla dialoger över huvudfönstret
- **Egen input-dialog** ersätter systemets standard för bättre kontroll
- **Modal design** med korrekt fokushantering

### Optimerad layout
- **Logisk knappplacering** - historikknappar i historikpanelen
- **Strömlinjeformat arbetsflöde** - borttaget överflödiga meddelanden
- **Bättre visuell organisation** för pedagogisk användning

## 🐛 Bugfixar

### Kompatibilitet
- **Unicode-fix** för äldre Python/Tcl-versioner (ersatt emoji med kompatibla symboler)
- **Dialog-positionering** löst med egen implementation
- **Knappstatus-hantering** - "Spara" aktiveras endast när data finns

## 📚 Dokumentation

### Uppdaterade övningar
- **Systemoptimering** med v1.6.1 arbetsflöden
- **Signalstörningar** med nya historikfunktioner
- **Hjälpdokumentation** utökad med manuella funktioner

## 🚀 Installation

### Exekverbar fil
Ladda ner `PID-simulator-v1.6.1.exe` och dubbelklicka för att köra - ingen installation behövs!

### Från källkod
```powershell
git clone https://github.com/PeMan68/PID-simulator.git
cd PID-simulator
git checkout 1.6.1
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

## 🎯 Användningsexempel

### Pedagogisk jämförelse
1. Ställ in P-reglering (Kp=1.0)
2. Kör simulation tills stabilisering
3. Tryck **"Spara"** → ange namn: "P-reglering grundinställning"
4. Ändra till PI-reglering (Kp=1.0, Ti=10s)
5. Tryck **"Spara"** → ange namn: "PI-reglering med Ti=10s"
6. Jämför kurvorna i historikpanelen

### Strukturerade övningar
Perfekt för:
- **Parameterkänslighetsanalys** med namngivna jämförelser
- **Systemoptimering** med dokumenterade steg
- **Regulatordesign** med systematisk approach

## 🔗 Teknisk information

**Version**: 1.6.1  
**Python-kompatibilitet**: 3.8+  
**Plattform**: Windows 10/11  
**Filstorlek**: ~38.6 MB (fristående exe)

## 🆙 Uppgradering från v1.6.0

### Automatisk kompatibilitet
- Alla v1.6.0 funktioner bevarade
- Inga breaking changes
- Historikformat kompatibelt

### Nya möjligheter
- Manuell sparning kompletterar automatisk
- Bättre organisation för pedagogisk användning
- Förbättrad användarupplevelse

## 🎓 För utbildningsanvändning

### Lärare
- **Strukturerade övningar** med tydliga jämförelser
- **Förbättrat arbetsflöde** för demonstration
- **Pedagogisk dokumentation** uppdaterad

### Studenter
- **Enklare jämförelser** med anpassade namn
- **Tydligare progression** genom övningar
- **Bättre förståelse** genom strukturerad analys

---

**Ladda ner**: [PID-simulator-v1.6.1.exe](https://github.com/PeMan68/PID-simulator/releases/tag/1.6.1)  
**Dokumentation**: Se `help.md` och övningsfilerna  
**Support**: GitHub Issues

**Utvecklat för pedagogisk excellens inom reglerteknik! 🎯**