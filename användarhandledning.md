# PID-simulator - Referensguide
*Version 1.7.0 - Snabb referens för inställningar och kontroller*

## Innehållsförteckning

1. [Översikt](#översikt)
2. [Regulator-presets](#regulator-presets)
3. [Systemparametrar](#systemparametrar)
4. [Regulatorparametrar](#regulatorparametrar)
5. [Dynamiska inställningar](#dynamiska-inställningar)
6. [Stegsvarsanalys och visning](#stegsvarsanalys-och-visning)
7. [Formler och mellanresultat](#formler-och-mellanresultat)
8. [Prestandamått](#prestandamått)
9. [Simuleringskontroller](#simuleringskontroller)
10. [Grafområde](#grafområde)
11. [Jämförelse-historik](#jämförelse-historik)
12. [Export](#export)

---

## Översikt

**Flikar:**
- **Simulator**: Huvudvy med inställningar och grafer
- **Hjälp**: Inbyggd hjälptext
- **Teori**: Länkar till dokumentation

**Layout (Simulatorfliken):**
- Vänster: Inställningspaneler
- Höger: Grafer och historik

---

## Regulator-presets

Fyra knappar för snabb växling mellan regulatortyper:

- **OnOff**: Tvånivåreglering (PÅ/AV), oscillerar runt börvärdet
- **P**: Proportionell reglering, ger statiskt reglerfel
- **PI**: P + Integration, eliminerar statiskt fel
- **PID**: P + I + Derivata, snabbast respons

Aktiva parametrar ändras automatiskt beroende på vald preset.

![Regulator-presets](media/användarhandledning/Pasted%20image%2020260305125311.png)

---

## Systemparametrar

Beskriver processen som ska regleras.

### Processtyp

**Självreglerande** (standard):
- Processen når jämviktsläge vid konstant styrsignal
- Checkbox "Integrerande" avkryssad

**Integrerande**:
- Processvärdet fortsätter förändras vid konstant styrsignal
- Checkbox "Integrerande" ikryssad
- Fältet "Utflöde" aktiveras, "T" inaktiveras

### Parametrar

**K (Processförstärkning):**
- Hur mycket processvärdet ändras vid ändring av styrsignal
- Checkbox "Enhetslös K" växlar mellan enhetslös (%/%) och fysisk (t.ex. °C/%)

**T (Tidskonstant):**
- Tid till 63% av slutvärdet
- Endast för självreglerande processer
- Enhet: sekunder

**Dötid:**
- Fördröjning innan processen börjar reagera
- Enhet: sekunder

**Utflöde** (endast integrerande):
- Konstant utflöde från process
- Enhet: samma som processvärde

**Normalvärde (NV):**
- Processvärde vid styrsignal = 0%
- Startvärde för simulering

**Spara systemparametrar:**
- Aktiverar ändringar
- Återställer simulering

![Systemparametrar](media/användarhandledning/Pasted%20image%2020260305125443.png)

---

## Regulatorparametrar

Bestämmer regulatorns beteende.

### Mätområde
- Sensorns mätområde
- Används för enhetslös K och procent-visning
### Utsignalsbegränsningar
- Begränsar regulatorns utsignal
- Standard: 0-100%

Vilka fält som är aktiva nedan beror på vald preset (OnOff, P, PI, PID).

**Kp (Proportionalförstärkning):**
- Regulatorns grundförstärkning
- Högre värde → snabbare men mindre stabilt

**Ti (Integreringstid):**
- Hur snabbt integratorn arbetar  
- Lägre värde → snabbare integration
- Endast aktiv i PI och PID
- Enhet: sekunder

**Td (Deriveringstid):**
- Reaktion på förändringshastighet
- Dämpar översläng
- Endast aktiv i PID
- Enhet: sekunder


### OnOff-parametrar

Visas endast när OnOff-preset är vald.

**Hysteresis-typ:**
- Båda (both): Symmetrisk hysteres
- Övre (upper): Endast övre tröskelvärde
- Undre (lower): Endast undre tröskelvärde

**Hög/Låg:**
- Tröskelvärden för hysteres
- Förhindrar frekvent omkoppling

### Avancerade inställningar

**Anti-windup (Spärrning):**
- Checkbox
- Förhindrar integratoruppvridning vid mättning
- Rekommenderas: PÅ

**Manuellt läge:**
- Checkbox
- Kopplar bort regulatorn
- Aktiverar "Manuell ut (%)"-fältet

**Manuell ut (%):**
- Fast utsignal när manuellt läge är aktivt
- För stegsvar-tester

**Spara regulatorparametrar:**
- Aktiverar ändringar
- Sparar nuvarande simulering till historik
- Återställer simulering

![Regulatorparametrar](media/användarhandledning/Pasted%20image%2020260305125951.png)

---

## Dynamiska inställningar

Kan ändras under körning utan att återställa simuleringen.

### Börvärde (dynamiskt)

**Börvärde:**
- Ändras direkt under simulering
- Enhet visas enligt procent-läge

### Signalstörningar

**Signalstörning (checkbox):**
- Aktiverar/inaktiverar störningar

**Brus std:**
- Slumpmässig variation på mätsignal
- Skjutreglage + textfält (0-5)
- Kontinuerlig störning

**Puls (storlek) och (steg):**
- Storlek: Amplitud på pulsstörning
- Steg: Duration i tidssteg

**Pulsstörning (knapp):**
- Triggar enskild pulsstörning

### Aktivera ändringar

**Knapp:** "Aktivera ändringar"
- Applicerar dynamiska ändringar direkt
- Kräver ej återställning

![Dynamiska inställningar](media/användarhandledning/Pasted%20image%2020260305130041.png)

---

## Stegsvarsanalys och visning

Styr hur data visas i graferna.

### Procent-läge

**Visa i procent (%):**
- Checkbox
- AV: Visar fysiska enheter (t.ex. °C)
- PÅ: Visar procent av mätområdet

**Enhet:**
- Textfält för processenhet (t.ex. °C, bar)
- Visas i grafer och börvärdesfält

### Graf-skala

**Min/Max:**
- Sätter y-axelns gränser i grafer
- Standard: Samma som mätområde

**Återställ:**
- Återställer till mätområdets Min/Max

**Spara:**
- Applicerar graf-skalinställningar

![Stegsvarsanalys och visning](media/användarhandledning/Pasted%20image%2020260305130222.png)

---

## Formler och mellanresultat

Visar realtidsberäkningar av regulatorns komponenter.

**Innehåll:**
- Aktuella värden: PV, SP, MO
- Reglerfel (e)
- P-del, I-del, D-del (när tillämpligt)
- OnOff-status (när OnOff aktiv)

Uppdateras varje simulationssteg.

![Formler och mellanresultat](media/användarhandledning/Pasted%20image%2020260305130309.png)

---

## Prestandamått

Kvantitativ utvärdering av regulatorprestanda.

**Mått:**
- **Stigtid:** Tid från 10% till 90% av slutvärdet
- **Etableringstid:** Tid till inom ±2% av börvärdet
- **Översläng:** Maximal överskridning av börvärde (%)
- **IAE:** Integral of Absolute Error
- **ISE:** Integral of Squared Error

Uppdateras kontinuerligt under simulering.

![Prestandamått](media/användarhandledning/Pasted%20image%2020260305130324.png)

---

## Simuleringskontroller

Knappar och inställningar för simuleringskörning.

### Knappar

**Kör:**
- Startar/återupptar simulering

**Paus:**
- Pausar körande simulering

**Stega:**
- Kör exakt ett tidssteg framåt

**Återställ:**
- Återställer till t=0
- Rensar graf (behåller historik)

### Inställningar

**Autopaus:**
- Checkbox
- Pausar automatiskt när *ärvärdet* är stabilt nära *börvärdet*

**Stoppa vid:**
- Checkbox + textfält
- Automatisk paus vid angiven tid (sekunder)

**Hastighet:**
- Knappar: << (långsammare), >> (snabbare)
- Etikett visar hastighet (t.ex. "1x", "5x")
- Styr simuleringstempo, inte simulerad tid

![Simuleringskontroller](media/användarhandledning/Pasted%20image%2020260305130608.png)

---

## Grafområde

Tre delgrafer visar simuleringsresultat.

### Graf 1: PV och SP
- Graferna visar ärvärde och börvärde
- X-axel: Tid i sekunder
- Y-axel: Processenhet eller procent

### Graf 2: Utsignal (MO)
- Graf: Beräknad och faktiskt utsignal
- Y-axel: Procent (0-100%)

### Graf 3: PID-komponenter
- Varje delkomponents bidrag till utsignalen

**Interaktion:**
- Crosshair visas vid musöverflygning
- Visar koordinater vid muspositionen

![Grafområde](media/användarhandledning/Pasted%20image%2020260305131115.png)

---

## Jämförelse-historik

Panel till höger om graferna. Sparar upp till 5 simuleringar för jämförelse.

### Knappar

**Spara:**
- Sparar nuvarande simulering med anpassat namn
- Endast aktiv när pausad

**Rensa historik:**
- Raderar alla sparade simuleringar
- Bekräftelsedialog

### Historikinformation

För varje sparad simulering:
- Färgmarkör (syns i grafer)
- Regulatortyp och parametrar
- Anpassat namn (om angivet)

**Max 5 simuleringar:**
- Vid fler: Äldsta raderas automatiskt (FIFO)

![Jämförelse-historik](media/användarhandledning/Pasted%20image%2020260305131135.png)

---

## Export

Knappar längst ned till höger.

**Exportera grafer:**
- Sparar grafer som PNG-bild
- Inkluderar alla tre grafer och historikkurvor

**Spara data:**
- Exporterar simuleringsdata som CSV-fil
- Kolumner: Tid, PV, SP, MO, Fel, I_värde, D_värde

![Export](media/användarhandledning/Pasted%20image%2020260305131200.png)

---

## Snabbreferens

### Symboler

| Symbol | Betydelse |
|--------|-----------|
| PV | Processvärde |
| SP | Börvärde |
| MO | Utsignal |
| Kp | Proportionalförstärkning |
| Ti | Integreringstid |
| Td | Deriveringstid |
| K | Processförstärkning |
| T | Tidskonstant |
| θ | Dötid |

---

**Version**: 1.7.0  
**För detaljerad information**: Se teori-och-bakgrund.md och övningsdokument

