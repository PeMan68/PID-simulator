# Övningsuppgifter: Kaskadreglering (Cascade Control)
*Dokumentversion 1.0. Kräver PID Simulator 1.7.0 eller högre (Kaskadreglering i PROD sedan v1.7.0).*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

Simulatorns lärstig "Kaskadreglering (Cascade Control)" visar konceptet steg för steg med fyra färdigbyggda demo-scenarier, alla baserade på samma processexempel: **en värmeväxlare** vars utgående temperatur (PV1) hålls vid ett börvärde (SP1) — men istället för att huvudregulatorn styr ventilen direkt, styr den en EGEN, snabbare regulator (slavregulatorn) som i sin tur styr ventilen. Slavslingan reglerar flödet genom ventilen (PV2), en mätbar mellanvariabel som ändrar sig mycket fortare än temperaturen.

Det här dokumentet är fristående lösblad — samma mönster som `ovningar-parameterstyrning.md`/`ovningar-framkoppling.md` — där du själv kör och jämför scenarierna och antecknar vad du observerar. **Slavslingans egna parametrar (Kp/Ti/Td) är INTE redigerbara i simulatorn** — det är ett medvetet designval (PO-beslut) så att övningen handlar om SAMSPELET mellan slingorna, inte om att trimma två regulatorer samtidigt.

**Förkunskaper:** Grundläggande PID-förståelse, gärna genomförd lärstigen "Kaskadreglering (Cascade Control)".

**Mål:** Kunna förklara signalkedjan SP1 → SP2 → U → PV2 → PV1, kunna skilja på huvudslingans egen utsignal (u1) och slavslingans verkliga ventilsignal (U), och känna igen vad som händer om slavslingan inte faktiskt är snabbare än huvudslingan.

## Termer och definitioner

- **Huvudslinga** — den yttre slingan, den du själv arbetar med: SP1, Kp/Ti/Td, precis som en vanlig PID-regulator. Dess utsignal är i kaskadläge INTE en ventilsignal, utan en AVVIKELSE som läggs på slavslingans normalläge för att bilda SP2.
- **Slavslinga** — den inre slingan, som styr ventilen mot SP2. Exponeras bara som en avläsning i en egen panel (SP2, PV2, U, en signalkedja och en egen liten trendgraf) mellan Regulatorkonfiguration och Processpåverkan.
- **u1** — huvudslingans egen utsignal, synlig i huvudgrafens nedre panel och i statusraden. En BERÄKNING (kan ändras nästan direkt), inte en fysisk ventilsignal.
- **U** — slavslingans (den verkliga) ventilsignal, synlig i Slavslinga-panelen. Det är DEN som faktiskt styr ventilen i kaskadläge — inte u1.
- **SP2** — slavslingans börvärde, beräknat automatiskt varje steg av huvudslingan (`SP2 = slavslingans normalläge + u1`). Slavregulatorn vet inte att dess börvärde kommer från en beräkning.
- **Signalkedjan** — textraden i Slavslinga-panelen som visar hela vägen, uppdaterad varje steg: `SP1 → Huvud-PID → SP2 → Slav-PID → U → PV2 → PV1`.
- **K, T, L, Kp, Ti, Td** — se `ovningar-reglerstrategier.md` för grundläggande definitioner om de är nya begrepp för dig.

## Innehållsförteckning

- Uppgift 1: Enkelslinga mot kaskad — samma störning (grundläggande)
- Uppgift 2: SP-förändringens väg genom kedjan (grundläggande)
- Uppgift 3: u1 kontra U — vem gör egentligen jobbet? (utforskande)
- Uppgift 4: Hur mycket snabbare måste slavslingan vara? (utforskande)

**Arbetssätt:** Klicka **"Återställ system"** före varje nytt test när resultat ska jämföras. Läs av huvudgrafens PV1/u1 OCH Slavslinga-panelens SP2/PV2/U — poängen med flera av uppgifterna är just att jämföra dem. Anteckna dina uppmätta värden i ett separat dokument.

---

## Uppgift 1: Enkelslinga mot kaskad — samma störning

**Syfte:** Se med egna ögon hur mycket mindre huvudprocessen påverkas av en störning när en slavslinga finns, jämfört med när huvudregulatorn styr ventilen direkt.

**Process:** Värmeväxlare, K=1.3, T=90, normalvärde=50, SP1=50. Last mag=−35 (ett tryckfall som minskar levererat flöde för samma ventilöppning).

### Test A — enkelslinga
1. Ladda scenariot **"Kaskadreglering — demo: enkelslinga (problemet)"**. Kontrollera Kp=0,6, Ti=70. Ingen Slavslinga-panel syns — regulatorn styr ventilen direkt.
2. Klicka "Trigga last". Kör minst 500 steg.
3. Aktivera Mätläge, hovra över grafens djupaste punkt, läs av PV. Notera avvikelsen (50 − avläst PV).

### Test B — kaskad
1. Ladda scenariot **"Kaskadreglering — demo: kaskad (lösningen)"**. Samma Kp=0,6, Ti=70 för huvudslingan. Slavslinga-panelen syns nu.
2. Klicka "Trigga last". Kör minst 150 steg.
3. Aktivera Mätläge, läs av PV1:s (huvudgrafens) djupaste punkt.

**Mätprotokoll Uppgift 1:**

| Test | Störst avvikelse i PV1 från SP1 |
|---|---|
| A (enkelslinga) | |
| B (kaskad) | |

**Reflektion 1:**
- Ungefär hur många gånger mindre blev avvikelsen i Test B jämfört med Test A?
- Huvudregulatorn (Kp/Ti) är EXAKT densamma i båda testen. Vad är det då som gör skillnaden?

---

## Uppgift 2: SP-förändringens väg genom kedjan

**Syfte:** Se signalkedjan SP1 → SP2 → U → PV2 → PV1 i praktiken, genom en avsiktlig börvärdesändring — inte en störning.

**Process:** Ladda scenariot **"Kaskadreglering — demo: SP-förändring"** (K=1.3, T=90, SP1=50, i stabilt läge).

1. Ändra SP-fältet i Processpåverkan från 50 till 90. Kör minst 40 steg (klicka "Kör 10 steg" fyra gånger).
2. Läs av, direkt efter ändringen (efter bara någon enstaka "Stega 1"), signalkedjan i Slavslinga-panelen: hur mycket har SP2 redan hunnit ändras?
3. Låt sedan resten av de 40 stegen köra klart. Läs av PV1 i huvudgrafen.

**Mätprotokoll Uppgift 2:**

| Tidpunkt | SP2 | PV2 | PV1 |
|---|---|---|---|
| Direkt efter SP-ändring (1–2 steg) | | | |
| Efter 40 steg | | | |

**Reflektion 2:**
- SP2 rör sig nästan direkt efter att du ändrat SP1. PV1 tar desto längre tid. Vad förklarar skillnaden — vad ÄR SP2 egentligen, jämfört med vad PV1 är?
- Om huvudprocessens tidskonstant (T=90) hade varit MYCKET mindre (t.ex. T=10) — hade PV1 fortfarande tagit påtagligt längre tid än SP2 att svara, eller hade skillnaden nästan försvunnit?

---

## Uppgift 3: u1 kontra U — vem gör egentligen jobbet?

**Syfte:** Reda ut en vanlig missuppfattning: huvudgrafens nedre linje (u1) är INTE ventilsignalen i kaskadläge. Den verkliga ventilsignalen (U) syns bara i Slavslinga-panelen.

**Process:** Ladda scenariot **"Kaskadreglering — demo: kaskad (lösningen)"** (samma som Uppgift 1, Test B).

1. Klicka "Trigga last". Kör minst 150 steg.
2. Läs av BÅDA värdena samtidigt, vid samma tidpunkt: huvudgrafens u1 (nedre panelen, eller statusradens "u1=") OCH Slavslinga-panelens U.

**Mätprotokoll Uppgift 3:**

| Signal | Värde efter 150 steg | Vad styr den fysiskt? |
|---|---|---|
| u1 (huvudgrafen) | | |
| U (Slavslinga-panelen) | | |

**Reflektion 3:**
- Vilket av de två värdena är störst? Är skillnaden liten eller stor?
- Huvudregulatorn "märker" knappt av störningen (litet u1) medan slavregulatorn gör ett betydligt större jobb (stort U). Vad säger det om VAR i systemet en störning i flödet faktiskt hanteras, och varför det är just DÄR den bör hanteras?
- Om du tittar på statusraden: den visar P/I/D-termer för u1 — inte för U. Vems P/I/D är det du ser?

---

## Uppgift 4: Hur mycket snabbare måste slavslingan vara?

**Syfte:** Kaskadens fördel bygger på att slavslingan verkligen ÄR snabbare än huvudslingan. Här jämförs en väl trimmad och en feltrimmad slavslinga — med IDENTISK processfysik (samma K, T för slavens process), bara regulatorns EGNA inställningar (Kp/Ti) skiljer.

**Process:** Samma störning (Last mag=−35) i båda fallen.

### Test A — väl trimmad slavslinga (redan sedd i Uppgift 1, Test B)
Scenariot **"Kaskadreglering — demo: kaskad (lösningen)"**.

### Test B — feltrimmad slavslinga
1. Ladda scenariot **"Kaskadreglering — demo: felaktigt trimmad slavslinga"**. Slavslingans process (K=1, T=8) är IDENTISK med Test A — bara slavregulatorns Kp/Ti skiljer.
2. Klicka "Trigga last". Kör minst 1100 steg (detta tar betydligt längre tid att svänga in).
3. Aktivera Mätläge, läs av PV1:s djupaste punkt.

**Mätprotokoll Uppgift 4:**

| Test | Störst avvikelse i PV1 | Ungefärligt antal steg till stabilt läge |
|---|---|---|
| A (väl trimmad slav) | | |
| B (feltrimmad slav) | | |
| Referens: enkelslinga (Uppgift 1, Test A) | | |

**Reflektion 4:**
- Rangordna de tre resultaten (A, B, enkelslinga) efter hur bra PV1 skyddas. Hamnar B verkligen SÄMST — sämre än att inte ha någon kaskad alls?
- Slavens PROCESS (K=1, T=8, samma "ventil och rörsträcka") är identisk i A och B. Vad är det då som gör slavslingan i B för långsam, om inte processens egen fysik?
- Formulera en tumregel, i samma stil som `ovningar-reglerstrategier.md`s tumregler för P/PI: hur mycket snabbare (ungefär) bör slavslingans EGEN insvängning vara jämfört med huvudslingans, för att kaskaden ska ge en tydlig fördel istället för att bli en black om foten?
