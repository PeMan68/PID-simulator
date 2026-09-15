# Facit: Reglerstrategier (lärarmaterial)
*Facit till [ovningar-reglerstrategier.md](ovningar-reglerstrategier.md) — dela inte rakt av med studenter.*

> **⚠️ Viktigt**: Delvis AI-genererat. Alla siffror nedan är däremot inte gissade — de är körda direkt mot `apps/app/sim-core.js` (exakt samma simuleringskod som webbappen använder) via Node, seed=42, dt=1s, med samma analysverktyg som `tests/simulation/cli.mjs`/`tests/simulation/lib/analyze.mjs` använder. Insvängningstid mäts genomgående mot ett 2 %-toleransband (se "Termer och definitioner" i övningsdokumentet). Smärre avvikelser kan uppstå vid annan brusrealisering (annat seed) eller om studenten kör med lite andra parametrar än facit-exemplen. Verifiera gärna stickprov i appen innan facit delas ut.

---

## Uppgift 1: Regulatortyp som strategival (P / PI)

**Fall A** — K=1.3, T=15, L=0, SP=60, P-only Kp=2.0: PV stiger monotont mot **43,3** (aldrig 60) — kvarstående fel **16,7 (28 %)**, ingen översläng. Formel att visa eleverna: för självreglerande process med P-only är e_ss = SP/(1+Kp·K). Med Kp=6 istället: e_ss=60/(1+6·1,3)≈6,8 (11 %) — felet krymper men försvinner aldrig.
**Svar:** 28 % fel är för stort även för uppgiftens 15 %-gräns. P duger inte förrän Kp är mycket högre — och även då kvarstår ett fel.

**Fall B** — samma process/Kp, lägg till Ti=15 (PI): PV → **60 exakt**, fel=0, insvängning ≈ **38 s**, ingen översläng.
**Svar:** P kan aldrig ge exakt träff (samma process som Fall A!) — I-delen är obligatorisk när nollfel krävs.

**Reflektion 1 — facit-tumregler:**
- **P:** litet, förutsägbart kvarstående fel accepteras; snabbhet/enkelhet prioriteras.
- **PI:** standardval när nollfel krävs (de flesta industriella loopar).
- **PID:** se Uppgift 2, Fall C — tumregeln där är mer nyanserad än "D kostar alltid brus".

---

## Uppgift 2: Aggressivitet — matcha strategi till driftkrav

Process K=1,5, T=20, L=5, SP=60:

| Strategi | Kp | Fel | Översläng | Insvängning | Max u |
|---|---|---|---|---|---|
| Konservativ (λ=60) | 0,21 | 0 | ingen | ~197 s | 40 % |
| Balanserad (λ=20) | 0,53 | 0 | ingen | ~85 s | 42 % |
| Aggressiv (λ=5) | 1,33 | 0 | **4,4 %** | **~46 s** | **100 % (mättar!)** |

**Bonusupptäckt:** den aggressiva inställningen mättar faktiskt utsignalen (u=100 %) tillfälligt — bra brygga till Uppgift 5. Om utsignalen hade en snävare gräns (t.ex. max 60 %) skulle samma inställning riskera windup. Kan läggas till som bonusfråga.

**Svar Fall A (säkerhetskritisk):** Konservativ — ingen risk för översläng, stor marginal.
**Svar Fall B (genomströmningskritisk):** Aggressiv (46 s, 4,4 % översläng) om det är acceptabelt; annars Balanserad som kompromiss (85 s, 0 % översläng). Se även Fall C nedan — PID slår båda på insvängningstid.

**Reflektion 2 (Fall A/B):** Kravet styrde valet, inte processen (identisk process i båda fallen). Extra marginal bör läggas på det säkerhetskritiska svaret — testa gärna ännu lägre λ.

### Fall C — Lägg till derivata

Utgångspunkt: Kp=1,33, Ti=20 (Fall B:s aggressiva PI). Svep över Td, samma process (K=1,5, T=20, L=5):

| Td | Översläng | Insvängning (äkta) | u_std vid brus (noiseStd=1,0) |
|---|---|---|---|
| 0 (ren PI, Fall B) | 4,4 % | 46 s | 4,10 |
| 0,5 | 1,8 % | 18 s | 4,09 |
| **1** | **~0 %** | **21 s** | **4,21** |
| 1,5 | 0,7 % | 24 s | 4,46 |
| 2 | 1,5 % | 26 s | 4,83 |
| 3 | 2,9 % | **58 s** | 5,92 |

**Huvudsvar:** Td=1 är ett genuint vinn-vinn-läge här — överslängen försvinner helt (4,4 %→0,0 %) OCH den äkta insvängningstiden mer än halveras (46 s→21 s), samtidigt som bruskänsligheten knappt påverkas (4,10→4,21, +2,7 %, praktiskt taget omärkbart i grafen). Notera att **stigtiden** (10–90 %, hur snabbt kurvan första gången närmar sig börvärdet) är i princip oförändrad (9→10 steg) — vinsten sitter i att kurvan slutar röra sig snabbare EFTER den inledande stigningen, inte i att den är snabbare fram till börvärdet första gången. Det är precis den distinktionen uppgiftstexten ber studenten göra i Fall C, steg 3.

**Viktig nyans:** D-delens klassiska "kostar dig brus"-lektion syns INTE tydligt vid Td=1 — skillnaden är för liten för att se med blotta ögat i grafen. Höj Td till ett tydligt överdrivet värde (Td=3) för att göra bruskostnaden synlig. Vid Td=3 syns dessutom en andra, viktigare lektion: **för mycket Td är inte bara dyrare, det är rakt av sämre på alla tre mått samtidigt** — översläng och insvängningstid blir DÅLIGARE än vid Td=1 (58 s är till och med sämre än den obehandlade PI:ns 46 s!), samtidigt som bruset är klart hörbart/synligt (u_std +44 %).

**Svar på uppgiftens fråga (steg 7):** Ja — Td≈1 gav förbättring på alla tre mått nästan utan kostnad. Td=3 är exemplet på "mer D gör allt sämre samtidigt", inte bara en avvägning.

**Reflektion 2 (Fall C-tillägget):** D-delen är inte en ren avvägningsknapp (mer snabbhet = mer brus, linjärt) — den har ett optimum. Att bara "lägga på mer D" som tumregel är fel; rätt tumregel är "testa ett litet Td, verifiera att både översläng OCH insvängning faktiskt förbättras, och sluta höja så fort någotdera börjar försämras igen".

---

## Uppgift 3: Dötid

**Test A** (L=0, Kp=1,5, Ti=20): fel=0, ingen översläng, insvängning ≈ **53 s**, max u ≈ 95 %.
**Test B** (samma Kp/Ti, L=5): översläng **7,5 %**, insvängning ≈ 66 s, max u = **100 % (mättar!)**.

**Detuning för att ta bort översläng igen** (samma process, L=5):

| Kp | Översläng | Insvängning | Max u |
|---|---|---|---|
| 1,5 (ojusterad) | 7,5 % | 66 s | 100 % |
| 1,0 | ingen | 63 s | 78 % |
| 0,8 | ingen | 76 s | 62 % |

**Svar:** Kp behövde sänkas ~33 % (1,5→1,0) för att bli lika välartad som utan dötid — insvängningstiden ökade ~19 % (53 s→63 s) jämfört med Test A. Det är "priset" för 5 s dötid. (Notera att den detunade Kp=1,0 faktiskt landar något SNABBARE än den ojusterade, mättande Kp=1,5 — 63 s mot 66 s: översläng och mättning kostar här mer tid än de vinner, ett bra sidoobservandum om eleven frågar "kostar det verkligen att sänka Kp".)

**Reflektion 3:** Dötid begränsar hur aggressivt man kan reglera oavsett K/T. Okänd dötid → börja konservativt tills uppmätt (samma logik som Lambda-metoden i Uppgift 2).

---

## Uppgift 4: Integrerande process

**P-only, Kp=1,2** (K=0,01, outflow=0,5, SP=60): PV stannar på **~18,3** — kvarstående fel **41,6** (bara 30 % av vägen till börvärdet). Betydligt värre än Uppgift 1 Fall A.

**Viktig nyans för facit-samtalet:** felet beror INTE på att processen är instabil, utan på att en konstant last (outflow=0,5) kräver en konstant styrsignal i jämvikt (u=outflow/K=50 %) — och en P-regulator kan bara leverera en konstant styrsignal genom ett kvarstående fel (u=Kp·fel). Exakt samma mekanism som i Uppgift 1, bara mer extrem här.

*Om en elev frågar "är inte integrerande processer marginellt instabila utan I-del?":* Ja — **om det inte finns någon last** (outflow=0) ger P-reglering istället asymptotiskt nollfel (verifierat: felet krymper från 40 till ~0,3 efter 400 s, fast långsamt). Med en last (som i scenariot) blir det istället ett permanent offset. Bra fördjupningsfråga, inte nödvändig i grundflödet.

**PI, Kp=1,5, Ti=80:** fel → 0 exakt (verifierat vid 1500 steg), översläng **12,9 %**, insvängning ≈ **167 s** — Ti=80 är i överkant försiktigt; en elev som testar lägre Ti (t.ex. 40–50) bör få snabbare insvängning med kvar liten/ingen översläng.

**Puls (appens standard: mag=5, 20 steg → totalt +100!):** orealistiskt kraftig — PV toppar på **~156**, över mätområdet 0–100. Uppgiftstexten använder istället mag=1, 10 steg (totalt +10) för en rimlig men tydlig störning.

**Reflektion 4:** P duger inte, av samma skäl som Uppgift 1 Fall B — inte för att processen är instabil, utan för att en last kräver konstant u. Verkliga integrerande processer: nivåreglering i tankar, ackumulerande lager, vissa satsprocesser.

---

## Uppgift 5: Windup

Process K=1, T=20, Kp=3, Ti=20, utsignal max=50, SP 80→40 vid t=150 s.

Vid växlingen (t=150 s): PV≈**50** (kan aldrig nå 80 — utsignalstaket sätter gränsen; integratorn har redan "skuldsatt sig" kraftigt under hela uppgångsfasen).

**Utan anti-windup:** PV och u förblir **helt fastfrusna** (u=50 %, PV=50) genom hela det efterföljande 150 s-fönstret — ingen synlig reaktion alls på det nya, lägre börvärdet. (Detta är en starkare demonstration än standardscenariot i appen, eftersom windup-skulden här byggs upp under en hel 150 s lång uppgångsfas och därför tar motsvarande lång tid att vinna tillbaka. Om studenten kör längre än ~300 s syns till slut en reaktion, men inte inom ett rimligt testfönster — påpeka det så ingen tror att simulatorn hängt sig.)

**Med anti-windup:** reaktion börjar omedelbart:

| Tid efter växling | PV | u |
|---|---|---|
| 0 s | 50 | 50 % |
| 5 s | 38,7 | 0 % |
| 10 s | 33,1 | 22 % |
| 20 s | 32,8 | 36 % |
| 90 s | 39,7 | 40 % |
| 120 s | 39,9 | 40 % |

Bottnar strax under nya SP (32 vs 40 — viss översläng nedåt) och stabiliseras på 40 inom ~90–120 s.

**Svar:** Ja — givet den kända begränsningen (max 50 %) bör anti-windup vara aktiverat **från början**, som en del av grundstrategin. Windup-skulden byggs upp redan under normal drift (uppgångsfasen), helt utan förvarning — det finns ingen "vänta och se".

**Reflektion 5:** Andra windup-orsaker: kärvande/mekaniskt begränsad ventil, effektbegränsning, frekvensomriktare i strömbegränsning, delat/manuellt övermanövrerat ställdon. Strategiregel: *"Om manöverdonet kan mättas — fysisk gräns, säkerhetsgräns eller delad resurs — ska anti-windup vara standard, inte opt-in."*

---

## Uppgift 6: Prioritering — börvärdesföljning vs störningsavvisning

Process K=1, T=20, PID Kp=1, Ti=10, Td=2.

**Fall A** (SP 30→70): översläng **8,7 %**, insvängning ≈ **78 s**, max u ≈ **54 %** (ingen mättning).

**Fall B** (SP fast=50, puls mag=2/5 steg → totalt +10): max avvikelse från SP ≈ **7,5**, max u ≈ 50 %, återhämtning efter pulsen ≈ **56 s**.

**Omtrimmad för störningsavvisning** (Kp=2, Ti=6, Td=3), samma puls: max avvikelse ≈ **5,8** (**~22 % bättre**) och återhämtningen mer än halveras, till ≈ **36 s**. Samtidigt försämras börvärdessvaret kraftigt när samma parametrar testas tillbaka på Fall A (uppgiftens steg 3): översläng stiger från 8,7 % till **20,1 %**, och utgången mättar kortvarigt (u=100 %, 3 steg) — något den ojusterade inställningen aldrig gjorde. Insvängningstiden för Fall A blir visserligen nominellt kortare (78 s→65 s), men det är en fälla: kurvan går in i toleransbandet snabbare EFTER en mycket större översläng, inte för att den är bättre. Titta alltid på översläng OCH insvängningstid tillsammans, aldrig bara det ena.

**Facit-slutsats (viktig, ärlig poäng):** med bara Kp/Ti/Td att skruva på är vinsten i störningsavvisning genuint mätbar (~22 % lägre max avvikelse, halverad återhämtningstid) — men priset i börvärdessvar är stort och tydligt (översläng mer än fördubblad, kortvarig mättning). Klassisk avvägning inom en enda PID-struktur. Använd gärna detta som brygga till nästa veckas kursmål: framkoppling/kaskadreglering löser precis detta dilemma bättre än att "bara skruva hårdare".

**Reflektion 6:** Ingen av parametrarna var optimal för båda fallen — det var en tydlig avvägning, inte ett gratis val. Och: en enda siffra (insvängningstid) utan sitt syskon (översläng) kan lura även den som mäter noggrant.

---

## Mästaruppgift 7: Reglerstrategi-PM

Process K=0,7, T=40, L=6, normalvärde 65, utsignal max=85, SP=85.

| Kandidat | Kp | Ti | Fel | Översläng | Insvängning | Max u |
|---|---|---|---|---|---|---|
| Konservativ | 1,0 | 40 | 0 | ingen | ~208 s | 29 % |
| **Balanserad** | **1,5** | **30** | 0 | 2,6 % | **~75 s** | 38 % |
| Försiktig/långsam | 0,7 | 50 | 0 (mycket långsamt — se not) | ingen | ~417 s | 29 % |

*Försiktig/långsam:* felet går mot exakt 0 (PI-regulator), men mycket långsamt — vid 400 steg återstår fortfarande ~0,5 i fel, vid 800 steg är det nere i ~0,02. Insvängningstiden 417 s kräver alltså en körning på minst 800 steg för att mätas tillförlitligt; en kortare körning ger en falskt kort insvängningstid eftersom referens-slutvärdet då skattas fel.

**Facit-rekommendation:** Balanserad (Kp=1,5, Ti=30) är sannolikt bästa PM-svaret — god marginal till säkerhetsgränsen (38 % av tillåtna 85 %), snabb, obetydlig översläng.

**Windup-frågan:** Balanserad kommer aldrig i närheten av 85 %-taket vid ett vanligt börvärdessteg — ingen synlig skillnad med/utan anti-windup i just det testet. Eleven bör ändå svara "ja, aktivera som standardpolicy" (jämför Uppgift 5-principen: man vet inte i förväg om en större störning eller ett större börvärdessteg någon gång driver upp mot taket).

**Störningstestet — den dolda poängen:** SP=65=normalvärdet i detta test ⇒ regulatorns viloläge är u=0 %. Processen är "endast värme" (u kan bara höja PV, aldrig sänka den aktivt). En positiv störning kan alltså INTE motverkas aktivt — regulatorn går bara ner till u=0 % och väntar ut den naturliga avklingningen (T=40 s). Med en rimlig liten puls (mag=1, 5 steg → totalt +5) syns detta tydligt: PV toppar på **~69,8**, u ligger kvar på **0 %** hela tiden, och det tar **>90 s** innan PV är tillbaka inom 0,5 av börvärdet — enbart processens egen dynamik, ingen aktiv reglering. Detta förklaras redan i uppgiftstexten, men var beredd på att förtydliga muntligt — annars kan studenter tro att u="fastnat"/trasigt.

**Reflektion 7:** Beslut 2 (aggressivitet) styrde mest — det avgjorde både insvängningstid och hur mycket marginal som fanns kvar till säkerhetsgränsen, vilket i sin tur påverkade svaret på windup-frågan. Om gränsen istället varit 100 % hade troligen inget av de tre kandidatsvaren behövt ändras — ingen av dem kom ens i närheten av 85 %. Bra observandum i sig: gränsen var *inte* den begränsande faktorn med rimliga inställningar; först vid betydligt högre Kp/lägre Ti, eller en stor störning, hade den blivit det.

---
**Metod:** Alla värden ovan från `sim-core.js` kört i Node (samma kod som webbappen) via `tests/simulation/lib/analyze.mjs` (samma bibliotek som `tests/simulation/cli.mjs`), `dt=1`, seed=42 för brus/puls-test. Insvängningstid mäts genomgående med ett 2 %-toleransband (verktygets standardvärde). Uppgift 7:s "Försiktig/långsam"-rad kräver en körning på minst 800 steg (Ti=50 är trögt) för att slutvärdet ska skattas tillförlitligt. Bruskänslighetsmåtten (u_std) i Uppgift 2 Fall C, samt Uppgift 6 Fall B:s pulstest (`triggerPulse()`, inte del av `analyze.mjs`), är beräknade med separata skript utanför repot.
