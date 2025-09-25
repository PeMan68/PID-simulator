# PID-simulator v1.7.0 🚀

*Dynamiska inställningar för realtidsjusteringar*

## 🎯 Huvudfunktioner

### ⚡ Dynamiska inställningar
- **Realtidsjusteringar**: Ändra börvärde och signalstörningar under pågående simulering
- **Säker aktivering**: "Aktivera ändringar"-knapp för kontrollerad tillämpning  
- **Automatisk enhetshantering**: Börvärde visas i rätt enhet (% eller fysisk)
- **Intelligent GUI-placering**: Placerad logiskt efter regulatorparametrar

### ⏱️ Avancerad simuleringskontroll
- **Stoppa vid tidpunkt**: Automatisk stopp vid specificerad tid
- **Dynamisk "Kör"-knapp**: Kontextberoende text (Starta/Fortsätt/Kör)
- **Optimerad hastighetsvisning**: Tydlig hastighetsindikering

### 🎨 Förbättrat användargränssnitt
- **Intelligent tooltips**: Korrekt positionering på utökade skärmar
- **Förbättrad decimal-hantering**: Accepterar både komma och punkt
- **Städad layout**: Borttagna tidsfönsterkontroller för mer utrymme

## 📋 Detaljerade förbättringar

### Dynamiska inställningar
```
✅ Börvärde: Justera setpoint under körning
✅ Signalstörningar: Aktivera/inaktivera störningar live  
✅ Brus-nivå: Realtidsjustering av störningsamplitud
✅ Pulsstörningar: Konfigurera och utlösa under simulering
✅ Säker aktivering: Förhindrar oavsiktliga ändringar
```

### Tekniska förbättringar
- **Unified numeric input**: Enhetligt system för alla numeriska fält
- **Tooltip positioning**: Window-boundary aware positionering
- **Kompatibilitetsstruktur**: Bevarad bakåtkompatibilitet
- **Säkrare ändringshantering**: Förhandsgranskning innan aktivering

### GUI-optimering
- **Logisk gruppering**: Dynamiska inställningar nära regulatorparametrar
- **Kontext-aware knappar**: "Kör"-knappen anpassas till simuleringstillstånd
- **Autopause-tooltip**: Förbättrad förklaring med intelligent positionering
- **Tidskontroll**: "Stoppa vid"-funktioner integrerade smidigt

## 🔧 Installation

### Windows (Rekommenderat)
```bash
# Ladda ner färdig körbar fil (kommer snart)
PID-simulator-v1.7.0.exe
```

### Utvecklare/Avancerade användare
```bash
git clone https://github.com/PeMan68/PID-simulator.git
cd PID-simulator
git checkout 1.7.0
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## 📚 Pedagogisk användning

### Realtidsdemonstrationer
- **Setpoint-ändringar**: Visa systemresponse vid börvärdesändringar
- **Störningsanalys**: Demonstrera robusthet mot olika störningar
- **Parameteroptimering**: Jämför olika regulatorinställningar live

### Förbättrat arbetsflöde
1. **Konfigurera** regulatorparametrar
2. **Starta** simulering
3. **Justera** dynamiska inställningar under körning
4. **Aktivera** ändringar säkert
5. **Jämför** resultat med historikfunktionen (v1.6.0+)

## 🆕 Nyheter från v1.6.1

| Funktion | v1.6.1 | v1.7.0 |
|----------|--------|---------|
| Börvärde | Endast vid stopp | ✅ Under körning |
| Störningar | Endast vid stopp | ✅ Under körning |
| Tooltips | Skärmbaserad | ✅ Fönsterbaserad |
| Decimal-input | Endast punkt | ✅ Komma + punkt |
| Tidskontroll | Endast manuell | ✅ Automatisk stopp |
| GUI-layout | Standard | ✅ Optimerad |

## 📖 Kompatibilitet

**Systemkrav**: Windows 10/11, Python 3.7+  
**Bakåtkompatibilitet**: Alla v1.6.x funktioner bevarade  
**Rekommenderat**: Använd med övningar uppdaterade för v1.7.0  

---

**Ladda ner**: [PID-simulator-v1.7.0.exe](https://github.com/PeMan68/PID-simulator/releases/tag/1.7.0) *(kommer snart)*  
**Källkod**: [GitHub Repository](https://github.com/PeMan68/PID-simulator)  
**Dokumentation**: [Komplett manual](README.md) | [Hjälpsystem](help.md) | [Teori](teori-och-bakgrund.md)

**Version**: 1.7.0  
**Datum**: 25 september 2025  
**Kompatibilitet**: Windows 10/11, Python 3.7+