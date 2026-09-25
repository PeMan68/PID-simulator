# Övningsuppgifter: Kvotreglering (Ratio Control)
*Dokumentversion 1.0. Kräver PID Simulator 1.7.0 eller högre (Kvotreglering i PROD sedan v1.7.0).*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

Simulatorns lärstig "Kvotreglering (Ratio Control)" visar konceptet steg för steg med tre färdigbyggda demo-scenarier, alla baserade på samma processexempel: **kemikaliedosering proportionell mot ett vattenflöde** (t.ex. koaguleringsmedel vid vattenrening). Flöde A (vattnet) är "vilt" — det varierar kontinuerligt och okontrollerat, styrt av efterfrågan/produktion, inte av den här regulatorn. Flöde B (kemikalien) är den reglerade processen, som ska hållas i en fast PROPORTION mot Flöde A, inte vid ett fast värde.

Det här dokumentet är fristående lösblad — samma mönster som `ovningar-parameterstyrning.md`/`ovningar-framkoppling.md` — där du själv ställer in Kvot och Flöde A:s volatilitet enligt instruktionerna och antecknar vad du observerar.

**Förkunskaper:** Grundläggande PID-förståelse, gärna genomförd lärstigen "Kvotreglering (Ratio Control)".

**Mål:** Kunna förklara varför ett fast börvärde INTE räcker när en relaterad processignal varierar fritt, kunna räkna på hur Flöde A:s variation (volatilitet) påverkar hur väl kvoten faktiskt hålls, och känna igen symptomen på ett felaktigt satt kvotvärde.

## Termer och definitioner

- **Flöde A** — den "vilda", okontrollerade processignalen (i exemplet: vattenflödet). Vandrar kontinuerligt av sig själv, en slumpvandring klippt till ±50 % av en bas-nivå. Styrs INTE av den här regulatorn — det är hela poängen. Fälten **Flöde A basnivå** och **Flöde A volatilitet** ligger i **Processinställning → Avancerat**.
- **Flöde B** — den reglerade processen (i exemplet: kemikaliedoseringen), styrd av en helt vanlig PI-regulator som INTE vet att dess börvärde kommer från en beräkning.
- **Kvot** — multiplikatorn i `SP = Kvot × Flöde A`. Fältet ligger i **Regulatorkonfiguration → Avancerat**, tillsammans med kryssrutan **"Kvotreglering"** som slår på/av själva omräkningen.
- **Kvotreglering (kryssrutan)** — när ikryssad: `SP` (Flöde B:s börvärde) räknas om VARJE steg som `Kvot × Flöde A`. När urkryssad: `SP` är fast (det värde du själv skrivit i SP-fältet), trots att Flöde A ändå fortsätter vandra.
- **Faktisk kvot** — det du egentligen bryr dig om: `Flöde B / Flöde A`, räknat ut från de UPPMÄTTA värdena (statusraden visar det direkt som "Kvot (faktisk)"). Målet är att hålla den nära det avsedda Kvot-värdet, inte bara att hålla Flöde B vid ett visst tal.
- **Avancerat** — en hopfällbar sektion (klicka "▸ Avancerat" för att fälla ut den). Öppnas AUTOMATISKT om scenariot redan har Kvotreglering aktiverad — annars måste du klicka upp den själv. Uppgifterna nedan säger till när det behövs.
- **K, T, L, Kp, Ti, Td** — se `ovningar-reglerstrategier.md` för grundläggande definitioner om de är nya begrepp för dig.

## Innehållsförteckning

- Uppgift 1: Utan kvotreglering — se kvoten glida (grundläggande)
- Uppgift 2: Med kvotreglering — kvoten hålls automatiskt (grundläggande)
- Uppgift 3: Sätt ditt eget kvotvärde (utforskande)
- Uppgift 4: Volatilitetens effekt — hur tight hålls kvoten egentligen? (utforskande)

**Arbetssätt:** Klicka **"Återställ system"** före varje nytt test när resultat ska jämföras. Läs av "Kvot (faktisk)" direkt i statusraden — ingen manuell uträkning behövs för den siffran. Kör tillräckligt många steg (minst 150) för att Flöde A hinner vandra ordentligt innan du bedömer resultatet. Anteckna dina uppmätta värden i ett separat dokument — det är själva leveransen.

---

## Uppgift 1: Utan kvotreglering — se kvoten glida

**Syfte:** Se med egna ögon att en regulator som håller sitt börvärde PERFEKT ändå kan ge ett helt fel resultat, om börvärdet i sig är fel.

**Process:** Ladda scenariot **"Kvotreglering – utan (fast börvärde)"**. Kontrollera Kp=3, Ti=5 (Regulatorkonfiguration), SP=25 (Processpåverkan, fast). Flöde A basnivå=50, volatilitet=2 (Processinställning → Avancerat — redan uppfälld). Kvotreglering-kryssrutan är AV.

1. Kör minst 250 steg.
2. Läs av statusraden vid tre olika tillfällen under körningen (t.ex. efter 50, 150 och 250 steg): notera Flöde A, Flöde B (=PV) och Kvot (faktisk).
3. **Fråga:** Ligger PV (Flöde B) nära sitt börvärde SP=25 hela tiden?

**Mätprotokoll Uppgift 1:**

| Steg | Flöde A | Flöde B (PV) | Kvot (faktisk) |
|---|---|---|---|
| ~50 | | | |
| ~150 | | | |
| ~250 | | | |

**Reflektion 1:**
- PV ligger troligen mycket nära SP=25 hela tiden — regulatorn gör alltså sitt jobb perfekt. Trots det: hur mycket varierar den faktiska kvoten mellan dina tre avläsningar?
- Var exakt går felet — i regulatorn, eller i något annat? Motivera med dina egna avläsningar.

---

## Uppgift 2: Med kvotreglering — kvoten hålls automatiskt

**Syfte:** Se att SAMMA regulator, oförändrad, ger ett helt annat (korrekt) resultat så fort börvärdet räknas om automatiskt istället för att vara fast.

**Process:** Ladda scenariot **"Kvotreglering – korrekt kvot"** (Kp=3, Ti=5 — identiskt med Uppgift 1. Kvotreglering PÅ, Kvot=0.5, Flöde A basnivå=50, volatilitet=2 — samma vandring som Uppgift 1).

1. Kör minst 250 steg.
2. Läs av statusraden vid samma tre tillfällen som i Uppgift 1 (efter 50, 150, 250 steg).

**Mätprotokoll Uppgift 2:**

| Steg | Flöde A | Flöde B (PV) | Kvot (faktisk) |
|---|---|---|---|
| ~50 | | | |
| ~150 | | | |
| ~250 | | | |

**Reflektion 2:**
- Jämför dina Kvot (faktisk)-värden med Uppgift 1:s. Hur mycket TÄTARE ligger de nu kring 0,5?
- Lägg märke till att SP (Flöde B:s börvärde) INTE längre är fast — det rör sig hela tiden i takt med Flöde A. Titta i statusraden: rör sig SP exakt lika mycket som Flöde A, eller finns det en liten eftersläpning?

---

## Uppgift 3: Sätt ditt eget kvotvärde

**Syfte:** Öva att själv konfigurera och verifiera en kvotreglering, inte bara läsa av ett färdigt exempel.

**Process:** Ladda scenariot **"Kvotreglering – utan (fast börvärde)"** igen (kvotreglering AV, som utgångsläge). Klicka upp "▸ Avancerat" under Regulatorkonfiguration (stängd som standard i det här scenariot) och kryssa i **"Kvotreglering"**.

1. Välj ett eget Kvot-värde, t.ex. 0,7 (valfritt, men inte 0,5 — det är redan Uppgift 2:s värde).
2. Klicka "Återställ system". Kör minst 250 steg.
3. Läs av Kvot (faktisk) i statusraden vid slutet av körningen.

**Mätprotokoll Uppgift 3:**

| Ditt valda Kvot | Kvot (faktisk), avläst | Skillnad |
|---|---|---|
| | | |

**Reflektion 3:**
- Hur nära ditt valda Kvot-värde hamnade den faktiska kvoten?
- Testa att ändra Kvot till ett NEGATIVT eller orimligt stort värde (t.ex. 5) — vad händer med SP, och är resultatet fysikaliskt rimligt för en verklig kemikaliedosering? (Simulatorn stoppar dig inte från att skriva in orimliga värden — det gör den verkliga processen desto mer.)

---

## Uppgift 4: Volatilitetens effekt — hur tight hålls kvoten egentligen?

**Syfte:** Kvotregleringen räknar om SP varje steg, men Flöde B:s PI-regulator behöver ändå EN VISS tid att hinna ikapp ett nytt SP. Om Flöde A vandrar FORTARE än PI-regulatorn hinner reagera, uppstår en liten men mätbar eftersläpning — även med kvotreglering korrekt aktiverad.

**Process:** Ladda scenariot **"Kvotreglering – korrekt kvot"** (Kvot=0,5, Kp=3, Ti=5 — oförändrat i hela uppgiften).

1. Sätt Flöde A volatilitet=0,5 (lägre än scenariots grundvärde 2). Klicka "Återställ system". Kör minst 250 steg. Läs av Kvot (faktisk) vid flera tillfällen och notera hur MYCKET den pendlar kring 0,5 (dvs det största avvikande värdet du ser, inte bara ett enstaka avläst tal).
2. Sätt volatilitet=2 (scenariots grundvärde). Upprepa.
3. Sätt volatilitet=6 (betydligt högre). Upprepa.

**Mätprotokoll Uppgift 4:**

| Flöde A volatilitet | Största avvikelse i Kvot (faktisk) från 0,5 du observerade |
|---|---|
| 0,5 | |
| 2 | |
| 6 | |

**Reflektion 4:**
- Blir kvotens pendling större eller mindre när volatiliteten ökar?
- Kvotregleringens BERÄKNING (SP = Kvot × Flöde A) sker exakt, varje steg, utan fördröjning. Vad är det då som orsakar avvikelsen vid hög volatilitet, om inte själva uträkningen?
- Om Flöde A i en verklig anläggning vandrar MYCKET snabbare än i det här scenariot (t.ex. ett flöde som kan hoppa kraftigt inom loppet av någon sekund) — vad skulle du behöva göra med Flöde B:s regulator (Kp/Ti) för att kvoten ändå ska hållas tight? Koppla till vad du redan vet om aggressivitet och insvängningstid från `ovningar-reglerstrategier.md`.
