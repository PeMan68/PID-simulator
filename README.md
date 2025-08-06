 # PID-simulator – Användarmanual

## Syfte
Detta program demonstrerar och simulerar PID-reglering för processindustriella system, med pedagogisk visualisering av process- och regulatorns signaler. Två processmodeller stöds: självreglerande och integrerande (t.ex. nivåreglering).

## Starta programmet
Kör `main.py` med Python 3.8+ och nödvändiga paket installerade (tkinter, matplotlib, numpy).

## Gränssnitt och funktioner
- **Systemparametrar**: Ange processens förstärkning (K), tidskonstant (T), dötid, utflöde (för nivåreglering) och om processen är integrerande.
- **Regulatorparametrar**: Ange PID-parametrar (Kp, Ti, Td) och aktivera/inaktivera I- och D-del.
- **Börvärde**: Ange önskat börvärde och eventuellt utflöde (för nivåreglering).
- **Simulering**: Starta (Kör), pausa, stega eller återställ simuleringen.
- **Tidsfönster**: Välj om hela eller ett fönster av simuleringen ska visas, och navigera i tiden.
- **Visualisering**: Tre grafer visar processvärde, regulatorutgång och PID-komponenter. Vertikal markör och tooltip visas vid paus/steg.
- **Formler och mellanresultat**: Aktuell PID-beräkning visas med alla delbidrag.
- **Prestandamått**: Översläng, stigtid, inställningstid och stationärt fel visas under graferna.
- **Auto-paus**: Simuleringen pausar automatiskt när systemet är nära börvärdet eller stabilt.

## Exempel på användning
1. Välj process- och regulatorparametrar.
2. Ange börvärde och eventuellt utflöde (för nivåreglering).
3. Tryck "Kör" för att starta simuleringen. Simuleringen pausar automatiskt när systemet stabiliserats.
4. Justera parametrar och observera effekterna.
5. Använd "Stega" för att gå igenom simuleringen stegvis.

## Tips
- För nivåreglering (integrerande process): Ange utflöde > 0 och aktivera "Integrerande".
- För självreglerande process: Avmarkera "Integrerande" och sätt utflöde till 0.
- Testa olika PID-parametrar och observera hur systemet reagerar.

---

# Teoretisk bakgrund och praktiska tips

## Processmodeller

### Självreglerande process
- Exempel: Temperaturreglering.
- Modelleras som ett första ordningens system med dötid.
- Utsignal y(t) går mot ett nytt jämviktsläge efter en ändring av styrsignalen.
- Påverkas av: K (förstärkning), T (tidskonstant), dötid.

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
- Justera en parameter i taget och observera effekten.
- För nivåreglering: Kontrollera att styrsignalen kan kompensera för utflödet.
- Om systemet aldrig når börvärdet (stationärt fel): öka Kp eller aktivera I-delen.

---

För mer teori, se kurslitteratur om reglerteknik och PID-reglering.
# PID-simulator

Detta projekt demonstrerar PID-reglering för processindustriella tillämpningar. 

## Funktioner
- Simulering av självreglerande och integrerande processer med dödtid och ställbar processförstärkning
- Möjlighet att ställa PID-parametrar och processparametrar
- Fördefinierade störningar och manuell ändring av börvärde
- Grafiskt gränssnitt med realtidsplottar
- Möjlighet att pausa och stega simuleringen för pedagogisk genomgång
- Tydlig presentation av regulatorns beräkningssteg (formler och resultat)

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
