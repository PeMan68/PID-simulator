# Övningsuppgifter: Reglerstrategier — Framkoppling
*Dokumentversion 1.0. Kräver PID Simulator 1.6.0 eller högre.*

> **⚠️ Viktigt**: Denna övningssamling har delvis genererats med AI-assistans och kan innehålla tekniska felaktigheter eller missvisande information. Använd alltid din tekniska kunskap och verifiera resultaten genom praktisk testning i simulatorn. Vid tveksamheter, konsultera kurslitteratur eller expertis inom reglerteknik.

## Inledning

`ovningar-reglerstrategier.md` tränar **vilken reglerstrategi man väljer och varför**. `ovningar-framkoppling.md` tränar **hur** framkoppling fungerar mekaniskt (räkna ut och verifiera Kff). Det här dokumentet kopplar ihop de två: framkoppling behandlas här som **ett strategival att motivera**, konkurrerande mot en mer aggressiv PID-inställning (Uppgift 1) och mot ett medvetet beslut att INTE bygga den alls (Uppgift 2) — inte bara en teknik att räkna fram korrekt.

**Förkunskaper:** Samtliga uppgifter i `ovningar-reglerstrategier.md` (särskilt Uppgift 2 om aggressivitet/bruskänslighet och Uppgift 6 om prioritering) OCH `ovningar-framkoppling.md` genomförda.

**Mål:** Kunna avgöra om ett kontrollproblem bäst löses med en mer aggressiv återkoppling eller med framkoppling, och kunna bedöma om framkoppling är värd att bygga givet hur ofta störningen faktiskt inträffar och hur väl den är känd.

## Termer och definitioner

Se `ovningar-framkoppling.md` för Last, Lastförstärkning, Kff och Avancerat. Se `ovningar-reglerstrategier.md` för K, T, L, Kp, Ti, Td och u_std (bruskänslighet).

## Innehållsförteckning

- Uppgift 1: Framkoppling eller bara mer aggressiv PID?
- Uppgift 2: Är framkoppling värt att bygga? En prioriteringsfråga

**Arbetssätt:** Samma som i `ovningar-framkoppling.md` — trigga störningar FÖRST, aktivera Mätläge EFTERÅT. Klicka "Återställ system" före varje nytt test.

---

## Uppgift 1: Framkoppling eller bara mer aggressiv PID?

**Syfte:** Undersöka om samma störningsåterhämtning kan uppnås genom att bara höja Kp — och vad det i så fall kostar i bruskänslighet, direkt kopplat till `ovningar-reglerstrategier.md` Uppgift 2 Fall C.

**Process:** Värmeväxlaren från `ovningar-framkoppling.md`: K=1.3, T=15, normalvärde=50, Lastförstärkning=0.65, SP=50, Last mag=−40. Lägg till måttligt mätbrus: Brus std≈0.5 (Processpåverkan) i samtliga tester nedan.

### Fall A — PID + korrekt Kff
1. Ladda scenariot **"Framkoppling — demo: PID + korrekt Kff (värmeväxlare)"** (Kp=1.2, Ti=20, Kff=−0.5). Sätt Brus std=0.5.
2. Klicka "Trigga last". Kör minst 200 steg.
3. Notera störst avvikelse från SP under återhämtningen, och bedöm utsignalens (u) oro på samma "låg/måttlig/hög"-skala som `ovningar-reglerstrategier.md` Uppgift 2 (titta på den gröna u-kurvan — hoppar den mycket eller lite mellan steg?).

### Fall B — Ren PID, ingen framkoppling, kompensera med högre Kp istället
1. Ladda scenariot **"Framkoppling — demo: PID ensam (värmeväxlare)"** (Kff=0). Sätt Brus std=0.5 (samma som Fall A).
2. Höj Kp stegvis (t.ex. 2, 3, 4) tills störningsåterhämtningen (tid tillbaka nära SP efter triggning) blir ungefär lika snabb som Fall A:s. Klicka "Trigga last" och testa om vid varje Kp-steg.
3. Vid den Kp du till slut valde: notera störst avvikelse och bedöm u:s oro på samma skala som Fall A.

**Mätprotokoll Uppgift 1:**

| Fall | Kp | Kff | Störst avvikelse från SP | Utsignalens oro (låg/måttlig/hög) |
|---|---|---|---|---|
| A | 1.2 | −0.5 | | |
| B | (din valda) | 0 | | |

**Reflektion 1:**
- Gick det att matcha Fall A:s störningsåterhämtning bara genom att höja Kp? Hur hög Kp krävdes?
- Jämför utsignalens oro mellan de två fallen. `ovningar-reglerstrategier.md` Uppgift 2 Fall C visade att högre aggressivitet kostar i bruskänslighet — håller det mönstret här också?
- Framkoppling i Fall A påverkar INTE hur regulatorn hanterar brus (Kff verkar bara på den mätbara lasten). Är det en rimlig sammanfattning att säga att framkoppling här gav "störningsåterhämtning utan aggressivitetens bruskostnad"?

---

## Uppgift 2: Är framkoppling värt att bygga? En prioriteringsfråga

**Syfte:** Koppla framkoppling till `ovningar-reglerstrategier.md` Uppgift 6:s prioriteringstema — men här är frågan inte HUR regulatorn ska trimmas, utan OM det är värt att investera i att bygga framkoppling överhuvudtaget, givet hur ofta störningen faktiskt inträffar och hur säkert Kff kan bestämmas.

**Process:** Samma värmeväxlare. Teoretiskt korrekt Kff=−0.5 (som i `ovningar-framkoppling.md`).

### Fall A — Lasten inträffar ofta och förutsägbart
**Driftbeskrivning:** Den inkommande temperaturen ändras vid varje batchbyte (flera gånger per skift) — ett känt, återkommande mönster värt att kompensera för i förväg.

1. Ladda scenariot med korrekt Kff (−0.5). Trigga lasten tre gånger i rad (Återställ system mellan varje), som om det vore tre batchbyten. Notera avvikelsen vid varje triggning.
2. **Fråga:** Om detta mönster upprepas dagligen, året runt — vad är den ackumulerade nyttan av att avvikelsen är noll varje gång, jämfört med att acceptera en tillfällig dipp (som i Uppgift 1 i `ovningar-framkoppling.md`, Test A) varje gång?

### Fall B — Lasten är sällsynt, Kff är osäkert bestämt
**Driftbeskrivning:** Samma typ av last, men den inträffar bara någon enstaka gång per månad — det mesta av arbetet är istället börvärdesändringar. Lastförstärkningen är dessutom bara UNGEFÄR känd (inte laboratoriemätt), så Kff kan vara upp till 30 % fel.

1. Sätt Kff till 30 % för högt (−0.65) och testa en triggning. Notera avvikelsen och dess RIKTNING (jämför med `ovningar-framkoppling.md` Uppgift 2 för vad över-/underkompensation innebär).
2. Sätt Kff till 30 % för lågt (−0.35) och upprepa.
3. **Fråga:** Är avvikelsen vid ett 30 %-fel Kff mindre, lika stor, eller större än om du inte haft NÅGON framkoppling alls (Kff=0, ren PID)? Jämför med `ovningar-framkoppling.md` Uppgift 1 Test A:s uppmätta avvikelse.

**Mätprotokoll Uppgift 2:**

| Fall | Kff | Avvikelse vid triggning | Kommentar |
|---|---|---|---|
| A (upprepad, korrekt) | −0.5 | | |
| B (30 % för högt) | −0.65 | | |
| B (30 % för lågt) | −0.35 | | |
| B (referens: ingen FF) | 0 | (från `ovningar-framkoppling.md` Uppgift 1) | |

**Reflektion 2:**
- I Fall A: är den tekniska investeringen (räkna fram och underhålla Kff) uppenbart motiverad givet hur ofta störningen inträffar?
- I Fall B: kan ett DÅLIGT bestämt Kff göra saken SÄMRE än att inte ha någon framkoppling alls? Under vilket villkor (jämför dina Kff=−0.65/−0.35-resultat mot Kff=0-referensen)?
- Formulera en tumregel, i samma stil som `ovningar-reglerstrategier.md`s tumregler för P/PI: "Bygg framkoppling när …, avstå när …". Vilka TVÅ faktorer (utöver hur ofta störningen inträffar) borde ingå i det beslutet?
