# Övningsuppgifter: Reglerstrategier — Kvotreglering
*Dokumentversion 1.0. Kräver PID Simulator 1.7.0 eller högre.*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

`ovningar-reglerstrategier.md` tränar **vilken reglerstrategi man väljer och varför**. `ovningar-kvotreglering.md` tränar **hur** Kvotreglering fungerar mekaniskt (SP = Kvot × Flöde A). Det här dokumentet kopplar ihop de två: Kvotreglering behandlas här som **ett strategival att motivera** — beror på hur mycket den "vilda" signalen faktiskt varierar i drift — inte bara en mekanism att räkna fram.

**Förkunskaper:** Samtliga uppgifter i `ovningar-reglerstrategier.md` OCH `ovningar-kvotreglering.md` genomförda.

**Mål:** Kunna avgöra NÄR Kvotreglerings extra komplexitet (en andra, "vild" mätning och en omräkningsregel) är motiverad, och förstå att ett fel kvotvärde är en lika allvarlig, men annorlunda, brist än att helt sakna kvotreglering.

## Termer och definitioner

Se `ovningar-kvotreglering.md` för Flöde A, Flöde B, Kvot, Kvotreglering och Faktisk kvot. Se `ovningar-reglerstrategier.md` för K, T, L, Kp, Ti, Td.

## Innehållsförteckning

- Uppgift 1: Kvotreglering eller manuell omräkning? Beror på hur ofta Flöde A ändras
- Uppgift 2: Fel kvot är INTE samma sak som ingen kvotreglering

**Arbetssätt:** Samma som i `ovningar-kvotreglering.md` — klicka "Återställ system" före varje nytt test, läs av Kvot (faktisk) direkt i statusraden.

---

## Uppgift 1: Kvotreglering eller manuell omräkning? Beror på hur ofta Flöde A ändras

**Syfte:** Inse att Kvotreglerings motivering inte bara handlar om att Flöde A VARIERAR, utan om HUR OFTA och hur MYCKET det gör det i praktiken. Ett alternativ till automatisk kvotreglering är att en operatör manuellt räknar om och skriver in ett nytt SP när Flöde A ändras påtagligt — om det sällan behövs kan det räcka.

**Process:** Kp=3, Ti=5 (oförändrat i hela uppgiften), Kvot=0,5.

### Fall A — Flöde A nästan konstant
**Driftbeskrivning:** Anläggningen körs i praktiken med ett nästan konstant vattenflöde — variationerna är små och långsamma, en operatör skulle knappt märka dem.

1. Ladda **"Kvotreglering – utan (fast börvärde)"**. Sätt Flöde A volatilitet=0,3 (lägre än grundvärdet). Kör minst 250 steg utan kvotreglering (SP fast vid vad som ungefär motsvarar 0,5×50=25).
2. Läs av Kvot (faktisk) några gånger. Notera hur mycket den avviker från 0,5.

### Fall B — Flöde A varierar kraftigt och ofta
**Driftbeskrivning:** Samma process, men nu en batchdriven anläggning där vattenflödet ändras kraftigt flera gånger per timme — en operatör skulle behöva räkna om och skriva in ett nytt SP GÅNG PÅ GÅNG.

1. Sätt Flöde A volatilitet=6 (betydligt högre). Kör minst 250 steg, fortfarande utan kvotreglering.
2. Läs av Kvot (faktisk) några gånger.
3. Aktivera nu Kvotreglering (samma Kvot=0,5). Klicka "Återställ system". Kör minst 250 steg igen.
4. Läs av Kvot (faktisk) på samma sätt.

**Mätprotokoll Uppgift 1:**

| Fall | Volatilitet | Kvotreglering | Kvot (faktisk), ungefärligt intervall |
|---|---|---|---|
| A | 0,3 | AV | |
| B | 6 | AV | |
| B | 6 | PÅ | |

**Reflektion 1:**
- I Fall A: är Kvotreglerings extra komplexitet (en andra mätning, en omräkningsregel) motiverad här, eller hade en operatör som skriver in SP en gång i veckan klarat sig nästan lika bra?
- I Fall B: hur ofta hade en operatör behövt räkna om SP för hand för att hålla samma noggrannhet som Kvotreglering ger automatiskt? Är det realistiskt att förvänta sig att någon gör det manuellt, dygnet runt?
- `ovningar-reglerstrategier-parameterstyrning.md` Uppgift 1 visade att det är DRIFTMÖNSTRET, inte bara processens egenskaper, som avgör om en extra reglerstrategi är motiverad. Stämmer samma resonemang här — är det Flöde A:s VOLATILITET, inte bara att det existerar, som avgör om Kvotreglering är rätt val?

---

## Uppgift 2: Fel kvot är INTE samma sak som ingen kvotreglering

**Syfte:** Skilja på två olika sorters fel: att SAKNA en strategi (Uppgift 1) och att ha en strategi som är AKTIV men felkonfigurerad. De ser olika ut och kräver olika åtgärder att upptäcka.

**Process:** Kp=3, Ti=5, Flöde A basnivå=50, volatilitet=2 (grundvärden) i samtliga fall.

### Fall A — Ingen kvotreglering (referens, från `ovningar-kvotreglering.md` Uppgift 1)
Kvot (faktisk) glider fritt, okontrollerat, i takt med Flöde A — ingen stabil nivå alls.

### Fall B — Kvotreglering aktiv, men felaktigt satt kvot
1. Ladda **"Kvotreglering – felaktigt satt kvot"** (Kvot=0,3 istället för avsedda 0,5). Kör minst 250 steg.
2. Läs av Kvot (faktisk) vid flera tillfällen.

**Mätprotokoll Uppgift 2:**

| Fall | Kvot (faktisk) — stabil nivå eller fritt glidande? | Ungefärligt värde/intervall |
|---|---|---|
| A (ingen kvotreglering) | | |
| B (fel kvot, 0,3 istället för 0,5) | | |

**Reflektion 2:**
- I Fall A glider kvoten OKONTROLLERAT. I Fall B hålls kvoten STABILT — men vid fel värde. Vilket av de två felen är lättare att UPPTÄCKA för en operatör som bara kastar en snabb blick på processen (utan att jämföra mot ett facit)? Motivera.
- Vilket av de två felen bedömer du som allvarligast i en verklig process (t.ex. om kvoten styr ett kritiskt blandningsförhållande för en kemisk reaktion)? Är "stabilt fel" alltid bättre än "okontrollerat fel", eller kan det vara tvärtom beroende på sammanhang?
- Precis som `ovningar-reglerstrategier-parameterstyrning.md` Uppgift 2 visade för gain-scheduling (ett schema kalibrerat mot en process som sedan ändras): vem i en verklig organisation ansvarar för att upptäcka att Kvot-värdet 0,3 borde ha varit 0,5? Vad säger det om Kvotreglering som en "sätt och glöm"-lösning kontra en strategi som kräver att någon känner till och kan verifiera det avsedda kvotvärdet?
