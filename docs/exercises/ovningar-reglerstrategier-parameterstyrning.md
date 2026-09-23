# Övningsuppgifter: Reglerstrategier — Parameterstyrning
*Dokumentversion 1.0. Kräver PID Simulator 1.6.0 eller högre.*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

`ovningar-reglerstrategier.md` tränar **vilken reglerstrategi man väljer och varför** — regulatortyp, aggressivitet, hänsyn till dötid/windup/prioritering. `ovningar-parameterstyrning.md` tränar **hur** Parameterstyrning (gain scheduling) fungerar mekaniskt. Det här dokumentet kopplar ihop de två: Parameterstyrning behandlas här som **ännu en reglerstrategi att väga mot alternativen** — inte bara en teknik att lära sig, utan ett val med samma sorts avvägningar (kostnad, nytta, risk) som regulatortyp eller aggressivitetsnivå redan hade i grunddokumentet.

**Förkunskaper:** Samtliga uppgifter i `ovningar-reglerstrategier.md` OCH `ovningar-parameterstyrning.md` genomförda. Det här dokumentet upprepar inte grundmekanismerna.

**Mål:** Kunna avgöra NÄR Parameterstyrningens extra komplexitet är motiverad (och när den inte är det), och förstå att en gain-schedule är en strategi som kräver underhåll, inte en lösning en gång för alla.

## Termer och definitioner

Se `ovningar-parameterstyrning.md` för Olinjär ventilkarakteristik, Parameterstyrning, Zon, Brytpunkt och Avancerat. Se `ovningar-reglerstrategier.md` för K, T, L, Kp, Ti, Td.

## Innehållsförteckning

- Uppgift 1: Parameterstyrning eller kompromiss? Ett val som beror på driftmönstret
- Uppgift 2: Parameterstyrning är inte "set and forget"

**Arbetssätt:** Samma som i `ovningar-parameterstyrning.md` — klicka "Återställ system" före varje nytt test, anteckna motiveringar OCH uppmätta värden.

---

## Uppgift 1: Parameterstyrning eller kompromiss? Ett val som beror på driftmönstret

**Syfte:** Inse att Parameterstyrningens motivering inte bara handlar om PROCESSENS olinjäritet, utan om HUR processen faktiskt körs i drift. Samma process kan motivera helt olika strategival beroende på driftmönster.

**Process:** Ladda scenariot **"Olinjär ventilkarakteristik — demo"** (K-zoner 0.5/2.0/2.5, brytpunkter 25/65 — scenariots grundvärden). Du återanvänder här samma mätningar du redan gjort i `ovningar-parameterstyrning.md` Uppgift 1 och 3 — ta fram dem om du sparat dem, annars gör om testerna nedan snabbt.

### Fall A — Processen jobbar nästan uteslutande i EN zon
**Driftbeskrivning:** Anläggningen körs i praktiken alltid nära hög driftpunkt (SP 75–95) — det är det normala arbetsområdet, låg driftpunkt förekommer aldrig i denna verksamhet.

1. Kp=1.2, Ti=20, Parameterstyrning AV (Uppgift 1/3:s ostyrda baslinje).
2. Testa SP=80 och SP=95 (båda i Zon 3). Notera ungefär hur många steg det tar innan PV stabiliserat sig vid respektive SP.
3. **Fråga:** Presterar den enkla, ostyrda Kp=1.2 tillräckligt bra genom HELA det verkliga arbetsområdet (75–95)?

### Fall B — Processen ramper regelbundet genom hela intervallet
**Driftbeskrivning:** Samma fysiska process, men nu en batchprocess där SP rutinmässigt körs 10→50→90 varje cykel — låg driftpunkt är en normal, förväntad del av arbetet, inte ett undantag.

1. Samma Kp=1.2, Parameterstyrning AV. Testa SP=10 (du har redan detta resultat från Uppgift 1 Test A om du sparat det — annars gör om).
2. Jämför insvängningstiden vid SP=10 med Fall A:s resultat vid SP=80/95.
3. Aktivera Parameterstyrning (Zon 1 Kp=5, Zon 2/3 Kp=1.2 — scenariots startvärden). Testa SP=10, SP=50, SP=90 i följd (som en batchcykel).

**Mätprotokoll Uppgift 1:**

| Fall | SP | Parameterstyrning | Ungefärligt antal steg till stabilt läge |
|---|---|---|---|
| A | 80 | AV | |
| A | 95 | AV | |
| B | 10 | AV | |
| B | 10 | PÅ | |
| B | 50 | PÅ | |
| B | 90 | PÅ | |

**Reflektion 1:**
- I Fall A: är Parameterstyrningens extra komplexitet motiverad här, eller vinner den knappt något jämfört med den enkla Kp=1.2? Motivera med dina egna mätvärden.
- I Fall B: vad hade hänt om du (av bekvämlighet) struntat i Parameterstyrning och bara kört Kp=1.2 genom hela batchcykeln?
- `ovningar-reglerstrategier.md` Uppgift 2 visade att "kravet, inte processen, avgjorde valet" mellan konservativ och aggressiv inställning på EN identisk process. Håller samma resonemang här — är det DRIFTMÖNSTRET, inte bara processens fysiska olinjäritet, som avgör om Parameterstyrning är rätt strategi?

---

## Uppgift 2: Parameterstyrning är inte "set and forget"

**Syfte:** Inse att en gain-schedule är kalibrerad mot en ANTAGEN processkarakteristik — om den verkliga processen sedan ändras (ventilslitage, ombyggnad, ny utrustning) utan att schemat uppdateras, kan strategin sluta fungera, i värsta fall bli instabil istället för att bara bli sämre.

**Process:** Samma scenario, Parameterstyrning PÅ med det redan validerade schemat från Uppgift 1 i `ovningar-parameterstyrning.md`: Zon 1 Kp=5, Zon 2 Kp=1.2, Zon 3 Kp=1.2, Ti=20 i alla zoner.

### Fall A — Schemat och ventilen matchar (referens)
1. K-zoner oförändrade (0.5/2.0/2.5 — scenariots grundvärden, samma "ventil" schemat designades för).
2. Testa SP=10 (Zon 1) och SP=90 (Zon 3). Notera att båda konvergerar mjukt mot sina börvärden (du har redan sett detta i `ovningar-parameterstyrning.md` Uppgift 3).

### Fall B — Ventilen har bytts ut, schemat är INTE uppdaterat
**Scenario:** Ventilen har underhållits/bytts ut och har nu en annan karakteristik — men ingen kom ihåg att räkna om gain-schedulet.

1. Ändra ENDAST K-zonernas värden (i Processinställning → Avancerat) till det breda paret från `ovningar-parameterstyrning.md` Uppgift 2: K vid låg u=0.2, K vid mellan-u=4.0, K vid hög u=4.0. Rör INTE gain-schedulet (Zon 1 Kp=5, Zon 2/3 Kp=1.2 ligger kvar oförändrat, precis som om ingen uppdaterat det).
2. Testa SP=10 igen (samma test som Fall A). Kör minst 150 steg — låt det gå tillräckligt länge för att avgöra om kurvan verkligen stabiliserar sig eller fortsätter röra sig.
3. Testa SP=90 igen. Kör minst 80 steg.

**Mätprotokoll Uppgift 2:**

| Fall | SP | K-zoner | Konvergerar / oscillerar? | Ungefärlig PV-amplitud om den oscillerar |
|---|---|---|---|---|
| A | 10 | 0.5/2.0/2.5 | | — |
| A | 90 | 0.5/2.0/2.5 | | — |
| B | 10 | 0.2/4.0/4.0 | | |
| B | 90 | 0.2/4.0/4.0 | | |

**Reflektion 2:**
- Blev resultatet i Fall B bara "lite sämre", eller kvalitativt annorlunda (t.ex. övergick till att oscillera/inte stabilisera sig) jämfört med Fall A?
- Om du istället hade kört EN enda kompromiss-Kp (ingen Parameterstyrning alls) och ventilen bytts ut på samma sätt — hade den strategin också blivit fel? Skulle den ha blivit INSTABIL på samma sätt, eller bara mindre optimal? Vilken risk väger tyngst: en strategi som presterar sämre när förutsättningarna ändras, eller en som kan bli instabil?
- Vem i en verklig organisation ansvarar för att upptäcka att ett gain-schedule inte längre matchar processen — och vad säger det om Parameterstyrning som en "engångsinvestering" kontra en strategi som kräver löpande underhåll?
