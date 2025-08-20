 # PID-simulator – Användarmanual v1.4

## Syfte
Detta program demonstrerar och simulerar PID-reglering för processindustriella system, med pedagogisk visualisering av process- och regulatorns signaler. Stöder flera regulator-typer: On/Off, P, PI och PID, samt två processmodeller: självreglerande och integrerande.

## Starta programmet
Kör `main.py` med Python 3.8+ och nödvändiga paket installerade (tkinter, matplotlib, numpy).

## Gränssnitt och funktioner

### Regulator-presets (NYT i v1.4)
- **On/Off-reglering**: Tvånivåreglering med konfigurerbar hysteresis
  - Tre hysteresis-lägen: Över börvärdet, Under börvärdet, eller Båda sidorna
  - Ställbara hysteresis-värden för precision
  - Visuell hysteresis-visualisering i processvärdes-grafen
- **P-reglering**: Endast proportionell del aktiv
- **PI-reglering**: Proportionell + Integral komponenter
- **PID-reglering**: Alla tre komponenter (P, I, D)
- **Signalstörning på/av**: Enkel aktivering/inaktivering av alla störningar

### Intelligent användargränssnitt
- **Dynamiska kontroller**: Relevanta parametrar visas/döljs automatiskt baserat på vald preset
- **Automatiska parametervärden**: Fördefinierade standardvärden för varje regulator-typ
- **Förbättrad layout**: Preset-kontroller överst för enkel åtkomst

### Övriga funktioner
- **Systemparametrar**: Ange processens förstärkning (K), tidskonstant (T), dötid, utflöde (för nivåreglering) och om processen är integrerande.
- **Regulatorparametrar**: Ange PID-parametrar (Kp, Ti, Td) och aktivera/inaktivera I- och D-del. Anti-windup kan aktiveras för att förhindra integrator-mättnad.
- **Börvärde och Normalvärde**: Ange önskat börvärde och normalvärde (det värde processen tenderar mot när ingen styrsignal är aktiv, t.ex. rumstemperatur).
- **Störningar**: Lägg till brus och pulsstörningar för att testa regulatorns robusthet.
- **Simulering**: Starta (Kör), pausa, stega eller återställ simuleringen. Hastighetskontroll (<</>>) låter dig köra simuleringen snabbare eller långsammare.
- **Tidsfönster**: Välj om hela eller ett fönster av simuleringen ska visas, och navigera i tiden.
- **Visualisering**: Tre grafer visar processvärde, regulatorutgång och PID-komponenter. Vertikal markör och tooltip visas vid paus/steg för detaljanalys.
- **Formler och mellanresultat**: Aktuell beräkning visas med alla delbidrag (anpassad för vald regulator-typ).
- **Prestandamått**: Översläng, stigtid, inställningstid och stationärt fel visas under graferna.
- **Auto-paus**: Simuleringen pausar automatiskt när systemet är nära börvärdet eller stabilt.

## Exempel på användning
1. Välj process- och regulatorparametrar.
2. Ange börvärde och normalvärde (t.ex. 23°C för rumstemperatur).
3. Tryck "Sätt NV" för att aktivera normalvärdet, sedan "Kör" för att starta simuleringen.
4. Använd hastighetsknapparna (<</>>) för att justera simuleringshastigheten.
5. Justera parametrar och observera effekterna. Testa störningar (brus/puls).
6. Använd "Stega" för att gå igenom simuleringen stegvis och analysera varje beräkningssteg.
7. Hovra med musen över graferna under paus för detaljerad information vid varje tidpunkt.

## Tips
- För nivåreglering (integrerande process): Ange utflöde > 0 och aktivera "Integrerande".
- För självreglerande process: Avmarkera "Integrerande" och sätt utflöde till 0. Ställ in normalvärdet till det värde processen ska tendera mot (t.ex. rumstemperatur).
- Testa olika PID-parametrar och observera hur systemet reagerar.
- Använd hastighetskontrollerna för att studera snabba transienter (snabb hastighet) eller detaljanalys (långsam hastighet).
- Aktivera anti-windup om systemet har begränsad styrsignal för att undvika integrator-mättnad.

---

# Teoretisk bakgrund och praktiska tips

## Processmodeller

### Självreglerande process
- Exempel: Temperaturreglering.
- Modelleras som ett första ordningens system med dötid och normalvärde.
- Utsignal y(t) går mot normalvärdet när ingen styrsignal finns, mot ett nytt jämviktsläge efter en ändring av styrsignalen.
- Påverkas av: K (förstärkning), T (tidskonstant), dötid, normalvärde (grundläggande jämviktstillstånd).

### Integrerande process (t.ex. nivåreglering)
- Exempel: Tanknivå med inflöde (styrsignal) och utflöde (Fout).
- Utsignal y(t) ökar eller minskar kontinuerligt så länge inflöde ≠ utflöde.
- Påverkas av: K (skala inflöde), T ("tankens tröghet"), Fout (utflöde).

## PID-regulatorns parametrar
- **Kp**: Proportionell förstärkning. Ökar reaktionens styrka, men för högt värde kan ge instabilitet eller översläng.
- **Ti**: Integraltid. Tar bort stationärt fel, men för låg Ti kan ge svängningar.
- **Td**: Derivattid. Dämpar snabba förändringar, men för hög Td kan ge brusig reglering.

## Hur påverkar parametrarna?
- **Kp**: Högre Kp ger snabbare reaktion men risk för översläng och instabilitet.
- **Ti**: Lägre Ti (starkare I-del) minskar stationärt fel men kan ge svängningar.
- **Td**: Högre Td dämpar snabba förändringar men kan förstärka brus.
- **Fout** (endast integrerande process): Högre utflöde kräver högre styrsignal för att hålla nivån konstant.

## Manuell inställning av PID-parametrar (Ziegler-Nichols-liknande metod)
1. Sätt Ti och Td mycket höga (eller inaktivera I och D).
2. Öka Kp tills systemet börjar svänga ("kritisk Kp").
3. Sätt Kp till ca 50-70% av kritisk Kp för stabilitet.
4. Aktivera I-delen (sänk Ti gradvis) tills stationärt fel försvinner, men utan att ge svängningar.
5. Aktivera D-delen (sänk Td) för att dämpa översläng och snabba störningar.
6. Finjustera alla parametrar för önskad balans mellan snabbhet och stabilitet.


## Automatisk inställning – Lambda-metoden (IMC/Direct Synthesis)

Om processens parametrar (K, T, dötid) är kända kan du använda lambda-metoden för att beräkna regulatorns parametrar direkt. Detta ger en robust och pedagogisk startpunkt för inställning.

### Princip
- Välj önskad sluten tidskonstant (λ, "lambda"), t.ex. 1–3 gånger processens tidskonstant T. Liten λ ger snabb reglering men risk för översläng, stor λ ger långsammare men stabilare reglering.
- Använd formlerna nedan för att beräkna Kp, Ti och Td.

### För en process av typen:
G(s) = K / (T s + 1) * e^{-dötid·s}

#### PI-regulator (vanligast i industrin):
- Kp = T / (K · (λ + dötid))
- Ti = T

#### PID-regulator:
- Kp = (T + 0.5·dötid) / (K · (λ + 0.5·dötid))
- Ti = T + 0.5·dötid
- Td = (T · dötid) / (2T + dötid)

**Exempel:**
Om K = 2, T = 10, dötid = 2, λ = 10:
- PI:  Kp = 10 / (2·(10+2)) = 10 / 24 ≈ 0.42, Ti = 10
- PID: Kp = (10+1) / (2·(10+1)) = 11/22 ≈ 0.5, Ti = 11, Td = (10·2)/(20+2) ≈ 0.91

Du kan själv räkna ut och testa dessa värden i simulatorn!

---

## Praktiska tips
- Använd "Stega" och auto-paus för att analysera varje beräkningssteg.
- Hovra med musen över graferna under paus för detaljerad tooltip-information.
- Justera simuleringshastigheten med <</>>) för optimal studietakt.
- Justera en parameter i taget och observera effekten.
- För nivåreglering: Kontrollera att styrsignalen kan kompensera för utflödet.
- För självreglerande processer: Sätt normalvärdet till det naturliga jämviktstillståndet.
- Om systemet aldrig når börvärdet (stationärt fel): öka Kp eller aktivera I-delen.
- Testa störningar (brus/puls) för att utvärdera regulatorns robusthet.

---

För mer teori, se kurslitteratur om reglerteknik och PID-reglering.
# PID-simulator

Detta projekt demonstrerar PID-reglering för processindustriella tillämpningar. 

## Funktioner
- Simulering av självreglerande och integrerande processer med dödtid, processförstärkning och normalvärde
- Realistisk modellering med normalvärde (det värde processen tenderar mot utan styrsignal)
- PID-reglering med aktiverbara I- och D-delar samt anti-windup-funktionalitet
- Möjlighet att ställa PID-parametrar och processparametrar
- Störningar: brus och pulsstörningar för robusthetstester
- Hastighetskontroll för simuleringen (snabbare/långsammare)
- Manuell ändring av börvärde och normalvärde under körning
- Grafiskt gränssnitt med realtidsplottar och detaljerade tooltips
- Möjlighet att pausa och stega simuleringen för pedagogisk genomgång
- Tydlig presentation av regulatorns beräkningssteg (formler och resultat)
- Prestandamått: översläng, stigtid, inställningstid och stationärt fel

## Syfte
Projektet är avsett för utbildning i PID-reglering, t.ex. i en YH-klass.

## Kom igång
1. Säkerställ att du har Python 3.8+ installerat
2. Installera beroenden:
   ```
   pip install matplotlib numpy
   ```
3. Starta programmet:
   ```
   python main.py
   ```

## Kontakt
För frågor, kontakta projektägaren.
