# Övningsuppgifter: Reglerstrategier — Kaskadreglering
*Dokumentversion 1.0. Kräver PID Simulator 1.7.0 eller högre.*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

`ovningar-reglerstrategier.md` tränar **vilken reglerstrategi man väljer och varför**. `ovningar-kaskadreglering.md` tränar **hur** kaskaden fungerar mekaniskt. Det här dokumentet kopplar ihop de två på två sätt: dels genom att fråga om en mer aggressiv huvudregulator kunde ha gjort samma jobb (Uppgift 1, precis som `ovningar-reglerstrategier-framkoppling.md` gör för Framkoppling), dels genom att peka på det som gör Kaskadreglering annorlunda än de tre andra strategierna — den kräver en mätbar, snabbare MELLANVARIABEL (Uppgift 2), inte bara en känd störning eller en olinjär process.

**Förkunskaper:** Samtliga uppgifter i `ovningar-reglerstrategier.md` (särskilt Uppgift 2 om aggressivitet/bruskänslighet) OCH `ovningar-kaskadreglering.md` genomförda.

**Mål:** Kunna avgöra om ett kontrollproblem bäst löses med en mer aggressiv huvudregulator eller med kaskad, och kunna avgöra OM kaskad ens är en möjlig strategi för ett givet problem (inte bara om den är önskvärd).

## Termer och definitioner

Se `ovningar-kaskadreglering.md` för Huvudslinga, Slavslinga, u1, U, SP2 och signalkedjan. Se `ovningar-reglerstrategier.md` för K, T, L, Kp, Ti, Td och u_std (bruskänslighet).

## Innehållsförteckning

- Uppgift 1: Kaskad eller bara en mer aggressiv huvudregulator?
- Uppgift 2: Är kaskad ens MÖJLIGT? En förutsättning, inte bara ett val

**Arbetssätt:** Samma som i `ovningar-kaskadreglering.md` — klicka "Återställ system" före varje nytt test.

---

## Uppgift 1: Kaskad eller bara en mer aggressiv huvudregulator?

**Syfte:** Undersöka om samma störningsskydd kan uppnås genom att bara höja huvudregulatorns Kp — och vad det kostar i bruskänslighet, direkt kopplat till `ovningar-reglerstrategier.md` Uppgift 2 Fall C.

**Process:** Enkelslingescenariot från `ovningar-kaskadreglering.md`: K=1.3, T=90, normalvärde=50, SP1=50, Last mag=−35.

### Fall A — kaskad (referens, från `ovningar-kaskadreglering.md` Uppgift 1)
Ladda **"Kaskadreglering — demo: kaskad (lösningen)"** (huvudregulatorns Kp=0,6, oförändrad). Återanvänd ditt uppmätta resultat, eller kör om testet.

### Fall B — enkelslinga, kompensera med högre Kp istället
1. Ladda **"Kaskadreglering — demo: enkelslinga (problemet)"**. Höj Kp stegvis (t.ex. 1,5, 3, 5) och trigga lasten om vid varje steg (Återställ system emellan). Notera störst avvikelse vid varje Kp.
2. Sätt sedan Brus std=0,5 (Processpåverkan) vid Kp=0,6 OCH vid det högsta Kp du testade. Trigga lasten igen vid båda och bedöm utsignalens (u1) oro på samma "låg/måttlig/hög"-skala som `ovningar-reglerstrategier.md` Uppgift 2 (hoppar den gröna u-kurvan mycket eller lite mellan steg?).

**Mätprotokoll Uppgift 1:**

| Fall | Kp | Störst avvikelse (utan brus) | Utsignalens oro med brus (låg/måttlig/hög) |
|---|---|---|---|
| A (kaskad) | 0,6 | | (ej relevant — u1 rör sig knappt, se Uppgift 3 i `ovningar-kaskadreglering.md`) |
| B (enkelslinga) | 0,6 | | |
| B (enkelslinga) | 3 | | |
| B (enkelslinga) | 5 | | |

**Reflektion 1:**
- Gick det att matcha kaskadens störningsskydd bara genom att höja Kp? Hur högt behövde du gå, och räckte det ens?
- Jämför utsignalens oro vid högre Kp, med och utan brus. Håller mönstret från `ovningar-reglerstrategier.md` Uppgift 2 Fall C (högre aggressivitet kostar i bruskänslighet) även här?
- I den här simulatorn saknar processen dödtid (L=0), så du kan fortsätta höja Kp mycket långt utan att systemet blir instabilt. I en VERKLIG process finns nästan alltid någon dödtid. Vad tror du skulle hända med ett väldigt högt Kp (t.ex. 20–30) i en process med även bara en liten dödtid — och vad säger det om varför kaskad ofta är att föredra framför att bara "vrida upp" en enkelslinges Kp, även om det matematiskt SKULLE kunna fungera i en idealiserad modell?

---

## Uppgift 2: Är kaskad ens MÖJLIGT? En förutsättning, inte bara ett val

**Syfte:** De tre andra reglerstrategierna (Parameterstyrning, Framkoppling, Kvotreglering) kan i princip alltid ÖVERVÄGAS — frågan är bara om de lönar sig. Kaskadreglering är annorlunda: den kräver att en snabbare, mätbar MELLANVARIABEL faktiskt finns tillgänglig mellan ventilen och den slutliga processvariabeln. Finns ingen sådan mätning, är kaskad inte ett alternativ — oavsett hur mycket bättre störningsskydd man önskar sig.

**Process:** Ingen ny körning krävs för denna uppgift — den bygger på resonemang kring vad du redan mätt upp, plus verkliga exempel.

1. I värmeväxlarexemplet är PV2 (flödet genom ventilen) den snabbare mellanvariabeln. Lista vilken FYSISK GIVARE som skulle behövas i en verklig anläggning för att mäta PV2 (jämför med `docs/assets/diagrams/05-kaskadreglering.svg` eller lärstigens beskrivning om du vill se ett blockschema).
2. Läroboken "Sammansatta reglersystem" (kapitel 7) beskriver kaskadreglering av en värmeväxlares temperatur, kaskadkopplad mot flödet av det värmande mediet — samma princip som simulatorns exempel. Boken visar också (bild 7.9) en anläggning som kombinerar kaskad OCH framkoppling: en flödesgivare (FT2) mäter en störning och adderar en kompensationssignal direkt till SLAVREGULATORNS styrsignal, INTE till huvudregulatorns — alltså framkoppling in i den redan snabba, inre slingan, för ännu snabbare störningsavvisning.
3. **Tankeexperiment A:** Föreställ dig samma värmeväxlare, men den enda tillgängliga mätningen är den utgående temperaturen (PV1) — ingen flödesgivare finns eller går att montera. Är kaskadreglering då möjlig? Vad återstår istället (jämför med de strategier du redan kan)?
4. **Tankeexperiment B:** Föreställ dig istället en nivåreglering i en tank, där inflödet styrs av en ventil. Vilken mellanvariabel (om någon) skulle kunna kaskadkopplas här, på samma sätt som flödet kaskadkopplas under temperaturen i värmeväxlarexemplet?

**Reflektion 2:**
- Vilken av de fyra reglerstrategierna (Parameterstyrning, Framkoppling, Kvotreglering, Kaskadreglering) har den STRÄNGASTE förutsättningen för att ens vara ett tillgängligt alternativ, jämfört med de andra tre? Motivera.
- I bild 7.9:s kombination (kaskad + framkoppling i samma anläggning): varför läggs framkopplingssignalen till SLAVREGULATORNS styrsignal och inte huvudregulatorns, givet vad du redan vet om att slavslingan är den snabba delen av systemet?
- Om en anläggning redan HAR den nödvändiga mellanvariabel-mätningen installerad av ett annat skäl (t.ex. för larm eller loggning) — sänker det tröskeln för att kaskad ska vara värt att bygga, jämfört med att behöva installera en helt ny givare bara för kaskadens skull?
