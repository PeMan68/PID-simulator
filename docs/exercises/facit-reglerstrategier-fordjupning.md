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

## Fördjupning 2–4

Ej ännu skrivna — se `docs/tracking/todo.md` för status.

---
**Metod:** Kritisk förstärkning/period funna genom att svepa Kp i P-only-läge och jämföra svängningsamplitud i ett tidigt (t=50–150 s) och ett sent (t=300–400 s) tidsfönster (kvot ≈1 = sustained). Period uppmätt genom topp-detektion i den stabiliserade svängningen. Övriga mått (översläng, insvängningstid, max u) från samma metodik som grunddokumentets facit (`tests/simulation/lib/analyze.mjs`, 2 %-band).
