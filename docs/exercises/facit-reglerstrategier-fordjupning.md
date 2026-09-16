# Facit: Reglerstrategier — Fördjupning (lärarmaterial)
*Facit till [ovningar-reglerstrategier-fordjupning.md](ovningar-reglerstrategier-fordjupning.md) — dela inte rakt av med studenter.*

> **⚠️ Viktigt**: Delvis AI-genererat. Alla siffror nedan är däremot inte gissade — de är körda direkt mot `apps/app/sim-core.js` (exakt samma simuleringskod som webbappen använder) via Node, seed=42, dt=1s, med samma analysverktyg som `tests/simulation/cli.mjs`/`tests/simulation/lib/analyze.mjs` (2 %-toleransband för insvängningstid, se grunddokumentets facit för definitioner). Verifiera gärna stickprov i appen innan facit delas ut.

---

## Fördjupning 1: Ziegler-Nichols

Process K=1,5, T=20, L=5, SP=60 (samma som grunddokumentets Uppgift 2).

**Kritisk förstärkning:** vid P-only-svep visar sig övergången vara skarp — Kp=4,0 dämpar fortfarande ut (svängningsamplitud krymper till ~35 % av sitt startvärde över 250 s), medan Kp=4,2 ger en fullt sustained svängning (amplituden är i praktiken identisk i ett tidigt och ett sent tidsfönster). **Ku ≈ 4,2.**

**Period:** uppmätt genom topp-till-topp-tajming vid Kp=4,2, långt in i den stabiliserade svängningen (t=220–400 s): mycket regelbunden, **Tu ≈ 20 s** (exakt lika med processens egen tidskonstant T — ingen slump, men inte heller något att förvänta sig generellt; en ren tillfällighet för just detta K/T/L-kombination).

**Beräknade ZN-parametrar:**
- P: Kp = 0,5×4,2 = **2,1**
- PI: Kp = 0,45×4,2 = **1,9** (avrundat), Ti = 20/1,2 ≈ **16,7**
- PID: Kp = 0,6×4,2 = **2,5** (avrundat), Ti = 20/2 = **10**, Td = 20/8 = **2,5**

**Verifierade resultat:**

| Regulator | Kp | Ti | Td | Översläng | Insvängning | Max u |
|---|---|---|---|---|---|---|
| ZN P | 2,1 | — | — | **21,9 %** | 45 s | 100 % (mättar, 9 steg) |
| ZN PI | 1,9 | 16,7 | — | **0,9 %** | 45 s | 100 % (mättar, 8 steg) |
| ZN PID | 2,5 | 10 | 2,5 | **9,4 %** | 39 s | 100 % (mättar, 7 steg) |

**Jämfört med Lambda-metoden (samma process, från grunddokumentets facit):**

| Metod | Kp | Ti | Översläng | Insvängning | Max u |
|---|---|---|---|---|---|
| Lambda Konservativ | 0,21 | 20 | ingen | ~197 s | 40 % |
| Lambda Balanserad | 0,53 | 20 | ingen | ~85 s | 42 % |
| Lambda Aggressiv | 1,33 | 20 | 4,4 % | ~46 s | 100 % (mättar) |
| **ZN PI** | **1,9** | **16,7** | **0,9 %** | **~45 s** | **100 %** |
| **ZN PID** | **2,5** | **10/Td=2,5** | **9,4 %** | **~39 s** | **100 %** |

**Facit-poäng (den intressanta, icke-uppenbara slutsatsen):** ZN PI slår faktiskt Lambda Aggressiv på BÅDA måtten samtidigt här — nästan lika snabb (45 s mot 46 s) men med mindre än en fjärdedel av överslängen (0,9 % mot 4,4 %). ZN PID är ytterligare snabbare (39 s) men med mer översläng (9,4 %) än både Lambda Aggressiv och ZN PI — en tydlig snabbhet/mjukhet-avvägning inom ZN:s egna tre förslag. **Ingen av metoderna är entydigt "bäst"** — vilken som vinner beror på om kravet är minimal insvängningstid eller minimal översläng, exakt samma lärdom som grunddokumentets Uppgift 2 redan etablerat, nu bekräftad med en helt annan beräkningsmetod.

ZN P:s 21,9 % översläng är betydligt sämre än allt annat i tabellen — men det är faktiskt förväntat: Ziegler-Nichols är historiskt konstruerad för att ge ungefär "kvarts-dämpning" (en synlig, avsiktlig översläng), inte en överslängsfri kurva. P-varianten utan I-del gör detta särskilt tydligt.

**Svar på reflektionsfrågorna:**
- Att medvetet driva en process till gränsen av instabilitet är oacceptabelt på säkerhetskritiska eller svårreversibla processer (reaktorer, höga temperaturer, tryckkärl). Praktiskt alternativ: modellbaserade metoder (som Lambda) som bara kräver ett vanligt stegsvar, eller en försiktig, stegvis ökning med snabb avstängningsmöjlighet.
- Styrka: enkel, kräver inget annat än att observera processen själv (ingen modellidentifiering). Svaghet: ger bara EN fast, ganska aggressiv inställning per regulatortyp — inget sätt att direkt välja "hur försiktig" man vill vara, till skillnad från Lambda.
- Mer översläng betyder INTE per automatik en sämre metod — Kp/Ti/Td-kombinationerna mäter olika saker (ZN PID är optimerad mot snabb insvängning enligt sin egen, historiska definition, inte mot minimal översläng). Poängen är att "aggressivitet" alltid är ett flerdimensionellt val, aldrig ett enda tal.
- Ziegler-Nichols är fortfarande i bruk för att metoden är enkel, kräver ingen processmodell, och ger "good enough"-resultat snabbt — bra som utgångspunkt för vidare manuell fintrimning, inte nödvändigtvis som slutgiltig inställning.

---

## Fördjupning 2: Fullständig regulatorjämförelse på en integrerande process

Process K=0,01, outflow=0,5, L=1,0, normalvärde 20, SP=60 (samma som grunddokumentets Uppgift 4).

| Regulator | Variant | Kp | Ti | Td | Slutvärde | Kvarstående fel | Översläng % | Insvängningstid | Max u |
|---|---|---|---|---|---|---|---|---|---|
| P | Säker | 1,5 | — | — | 27,1 | 32,9 | 0 % | 146 s | 61,5 % |
| P | Aggressiv | 2,4 | — | — | 39,4 | 20,6 | 0 % | 129 s | 98,4 % |
| PI | Säker | 1,0 | 150 | — | 60 | 0 | 9,5 % | 360 s | 67 % |
| PI | Aggressiv | 3,0 | 8 | — | 60 | 0 | 13,3 % | 179 s | 100 % (mättar) |
| PID | Säker | 1,0 | 150 | 5 | 60 | 0 | 10,5 % | 360 s | ~70 % |
| PID | Aggressiv | 3,0 | 8 | 1 | 60 | 0 | 13,5 % | 181 s | 100 % (mättar) |

**Viktig, icke-uppenbar poäng:** till skillnad från Uppgift 2 Fall C (där ett lagom Td gav en tydlig, "gratis" förbättring) gör Td här knappt någon skillnad alls — snarare tvärtom, en svag FÖRSÄMRING (10 %→10,5 %, 13,3 %→13,5 %) ju mer Td man lägger på, både för den säkra och den aggressiva PI-varianten. Facit-förklaring: Uppgift 2:s process hade en BETYDANDE dötid (L=5) relativt sin tidskonstant, vilket är precis den situationen D-delen är som mest värd (den kompenserar fasfördröjning från dötiden). Den här processens dötid (L=1) är liten i jämförelse, så det finns lite fasfördröjning att kompensera för — D-delen får då mest bara amplifiera högfrekventa förändringar utan att vinna något i gengäld. **Lärdomen:** D-delens nytta beror på hur mycket dötid (relativt) som faktiskt finns att kompensera — inte en universell regel att "PID > PI".

**P-only, oavsett Kp:** ingen testad Kp-nivå (upp till 2,4, nära utsignalmättning) kommer i närheten av börvärdet — kvarstående fel på 20+ enheter kvarstår även vid aggressiv trimning. Regulatortypen är fel val här, inte trimningen (samma mekanism som grunddokumentets Uppgift 1 Fall B, bara mer extrem eftersom denna process är integrerande).

---

## Fördjupning 3: Stegvis skärpta utsignalgränser

Process K=1, T=20, Kp=3, Ti=20, SP 80→15 vid t=150 s (bytt från grunddokumentets 80→40 till 80→15 här specifikt för att det nya börvärdet ska vara nåbart även vid den hårdaste testade gränsen, 30 %; 40 % som i grunddokumentet hade varit exakt vid gränsen för vad Utsignal Max=30 % fysiskt kan nå — se `analyze.mjs`s `y_max=K·Utsignal Max`).

**Del 1 — utan anti-windup:**

| Utsignal Max | Tid tills u börjar röra sig | Tid tills PV stabiliserat nära 15 |
|---|---|---|
| 50 % | 129 s | 223 s |
| 40 % | 242 s | 330 s |
| 30 % | 508 s | 585 s |

Dramatisk, i det närmaste linjär försämring: nästan 4× längre väntetid vid 30 % jämfört med 50 %.

**Del 2 — försök detune:a bort problemet (fortfarande utan anti-windup, Utsignal Max=30 %):**

| Kp | Ti | Tid tills u börjar röra sig | Tid tills PV stabiliserat nära 15 |
|---|---|---|---|
| 3,0 (ojusterad) | 20 | 508 s | 585 s |
| 1,0 | 20 | 483 s | 587 s |
| 1,0 | 5 | 526 s | 579 s |
| 0,5 | 5 | 516 s | 592 s |

**Facit-poäng (den centrala lärdomen i denna uppgift):** detuning hjälper i praktiken INTE — väntetiden ligger kvar kring 480–590 s oavsett hur mycket Kp/Ti sänks. Det är logiskt vid närmare eftertanke: windup-skulden byggs upp av `fel × dt` som ackumuleras i integratorn så länge processen är mättad — den ackumulerade tiden i mättning (inte Kp/Ti) avgör hur stor skulden blir. Att sänka Kp ändrar bara HUR den ackumulerade skulden omsätts till utsignal, inte HUR MYCKET skuld som byggs upp.

**Del 3 — samma tre gränser, med anti-windup PÅ:**

| Utsignal Max | Tid tills u börjar röra sig | Tid tills PV stabiliserat nära 15 |
|---|---|---|
| 50 % | 1 s | 78 s |
| 40 % | 1 s | 74 s |
| 30 % | 1 s | 68 s |

Med anti-windup är skillnaden mellan de tre gränserna i praktiken försumbar (68–78 s, jämfört med 223–585 s utan). Utsignalen börjar dessutom röra sig OMEDELBART (steg 1) i alla tre fallen, mot 129–508 steg utan.

**Svar på reflektionsfrågorna:**
- Nej — detuning i Del 2 gav i praktiken ingen förbättring alls. Anti-windup i Del 3 löste problemet nästan helt, oavsett hur hård gränsen var.
- Skärpt strategiregel: *"Om manöverdonet kan mättas ska anti-windup alltid vara aktiverat — att försöka lösa windup genom försiktigare Kp/Ti fungerar INTE, eftersom skulden byggs upp av tiden i mättning, inte av regulatorns förstärkning."*
- Med anti-windup aktiverat spelar den exakta utsignalgränsen mycket mindre roll för återhämtningsbeteendet — den är fortfarande viktig för vad processen överhuvudtaget KAN nå (se `y_max=K·Utsignal Max`), men inte för hur snabbt regulatorn återhämtar sig efter en mättningsperiod.

---

## Fördjupning 4: Kombinerad störning

Process K=1, T=20, SP=50 (fast), puls mag=2/5 steg (samma som grunddokumentets Uppgift 6 Fall B).

| Inställning | Max avvikelse (endast puls) | Max avvikelse (puls + brus, noiseStd=1,0) | Utsignalens u_std (puls + brus) |
|---|---|---|---|
| Ursprunglig (Kp=1, Ti=10, Td=2) | 7,5 | 7,7 | 4,2 |
| Omtrimmad (Kp=2, Ti=6, Td=3) | 5,8 | 5,5 | **9,0** |

**Facit-poäng:** max avvikelse från störningen ändras knappt av att brus läggs till (för båda inställningarna) — bruset stör inte själva pulsåterhämtningen nämnvärt. Men **den omtrimmade inställningens bruskänslighet (u_std) är mer än DUBBELT så hög som den ursprungliga** (9,0 mot 4,2) — betydligt värre än vad Uppgift 6:s pulstest ensamt avslöjade. Den omtrimmade inställningen "vinner" fortfarande på max avvikelse, men priset (en mycket oroligare utsignal, sliter mer på ventil/manöverdon i verkligheten) syns bara när båda störningstyperna testas tillsammans.

**Svar på reflektionsfrågorna:**
- Den omtrimmade inställningen vinner fortfarande på max avvikelse (5,5 mot 7,7), men den dolda kostnaden (dubbelt så hög u_std) syns bara i det kombinerade testet — Uppgift 6 ensamt gav en ofullständig bild.
- Om verkligheten innehåller båda störningstyperna samtidigt bör den ökade bruskänsligheten vägas in — kanske är en mellaninställning (mindre aggressiv än den omtrimmade, men mer än den ursprungliga) det bättre valet i praktiken, även om den inte "vinner" på något enskilt test.
- Samma lärdom som Uppgift 2 Fall C gäller här: aggressivare trimning (högre Kp, lägre Ti, mer Td) köper snabbhet mot störningar till priset av bruskänslighet — mönstret upprepar sig oavsett process eller sammanhang, vilket är precis varför det är värt att känna igen som en generell avvägning, inte ett engångsfenomen.

---
**Metod:**
- **Fördjupning 1:** kritisk förstärkning/period funna genom att svepa Kp i P-only-läge och jämföra svängningsamplitud i ett tidigt (t=50–150 s) och ett sent (t=300–400 s) tidsfönster (kvot ≈1 = sustained). Period uppmätt genom topp-detektion i den stabiliserade svängningen. Övriga mått (översläng, insvängningstid, max u) från samma metodik som grunddokumentets facit (`tests/simulation/lib/analyze.mjs`, 2 %-band).
- **Fördjupning 2:** samma `analyze.mjs`-metodik (2 %-band, stepstorlek 40 för överslängs-% eftersom SP går 20→60). Td-svepen kördes med explicit `--mode pid` (annars nollställer `sim-core.js` Td automatiskt i PI-läge).
- **Fördjupning 3:** "tid tills u börjar röra sig" = första steget där u avviker >5 % från den mättade gränsen efter SP-bytet vid t=150 s; "tid tills stabiliserat" = första steget PV ligger inom ±1 enhet från SP=15 och stannar där i minst 10 steg.
- **Fördjupning 4:** max avvikelse mätt som störst |PV−SP| under och efter pulsen. Utsignalens oro (u_std) mätt som standardavvikelse på u under en 50-stegs period efter att pulsens direkta effekt klingat av, för att isolera bruseffekten från själva pulsåterhämtningen.

Samtliga körningar: `apps/app/sim-core.js` direkt i Node, seed=42, dt=1 s.
