# Facit: Reglerstrategier (lärarmaterial)
*Facit till [ovningar-reglerstrategier.md](ovningar-reglerstrategier.md) — dela inte rakt av med studenter.*

> **⚠️ Viktigt**: Delvis AI-genererat. Alla siffror nedan är däremot inte gissade — de är
> körda direkt mot `apps/app/sim-core.js` (exakt samma simuleringskod som webbappen
> använder) via Node, seed=42, dt=1s. Smärre avvikelser kan uppstå vid annan brusrealisering
> (annat seed) eller om studenten kör med lite andra parametrar än facit-exemplen. Verifiera
> gärna stickprov i appen innan facit delas ut.

## Viktigast: justeringar att göra i övningsdokumentet

Verifieringen mot faktisk simulering avslöjade fyra saker som bör rättas/förtydligas i
`ovningar-reglerstrategier.md` innan det går till studenter:

1. **Uppgift 2 hade fel processförstärkning.** Texten anger K=1.0, men de refererade
   Lambda-scenarierna (`lambda-pi-conservative/moderate/aggressive`) använder K=1.5.
   Facit nedan är räknat på K=1.5 (rätt värde) — uppgiftstexten bör rättas till samma.
2. **Pulsstörningens "magnitud" läggs till processvärdet en gång PER STEG under hela
   `durationSteps`, inte utspritt.** En puls med magnitud=5 under 20 steg ger alltså ett
   totalt tillskott på **+100** till processvärdet — inte 5. Detta gäller genomgående i
   appen (även befintliga inbyggda scenarier), men gör att flera av mina förslag på
   pulsparametrar nedan är nedskalade jämfört med vad man instinktivt skulle gissa.
3. **Uppgift 4:s standardpuls (mag=5, 20 steg → totalt +100) är orealistiskt kraftig** för
   en process med mätområde 0–100 — PV skjuter iväg till ~156 i facit-körningen. Föreslår
   mag=1, 10 steg (totalt +10) i uppgiftstexten istället.
4. **Uppgift 7:s störningstest har en dold poäng som bör förtydligas i uppgiftstexten:**
   med börvärde = normalvärde (65) ligger regulatorns viloläge på u=0%. Processen är en
   "endast värme"-process (utsignalen kan bara höja PV, aldrig sänka den aktivt), så en
   positiv störning kan INTE motverkas aktivt — bara vänta ut naturlig avklingning. Utan
   ett förtydligande kan studenter tro att simulatorn/regulatorn är trasig när u inte rör
   sig alls under en störning uppåt.

Se respektive uppgift nedan för detaljer och exakta siffror.

---

## Uppgift 1: Regulatortyp som strategival

**Fall A** — K=1.3, T=15, L=0, SP=60, P-only Kp=2.0:
PV stiger monotont mot **43,3** (aldrig 60) — kvarstående fel **16,7 (28 %)**, ingen
översläng. Formel att visa eleverna: för självreglerande process med P-only är
e_ss = SP/(1+Kp·K). Med Kp=6 istället: e_ss=60/(1+6·1,3)≈6,8 (11 %) — felet krymper men
försvinner aldrig.
**Svar:** 28 % fel är för stort även för "litet fel accepteras". P duger inte förrän Kp
är mycket högre — och även då kvarstår ett fel.

**Fall B** — samma process/Kp, lägg till Ti=15 (PI):
PV → **60 exakt**, fel=0, insvängning till ±5 %-band ≈ **24 s**, ingen översläng.
**Svar:** P kan aldrig ge exakt träff (samma process som Fall A!) — I-delen är
obligatorisk när nollfel krävs.

**Fall C** — brus (noiseStd=1.0), Kp=2,Ti=15, jämför Td:
Utsignalens spridning (std) under stabil drift, sista 100 s:

| Td | u_std |
|----|-------|
| 0 (PI) | 3,6 |
| 1 | 4,3 |
| 2 | 6,0 |
| 3 | 8,3 |

**Observera:** Td=1 (uppgiftstextens exempel) ger bara ~22 % högre bruskänslighet — svårt
att se med blotta ögat i grafen. **Rekommendation:** höj exempelvärdet till Td=2–3 i
uppgiftstexten för en tydligare, lättobserverad kontrast.
**Svar:** Bruskänsligheten växer snabbare än linjärt med Td. Värt priset bara när
snabbhet verkligen behövs och mätsignalen är relativt ren.

**Reflektion 1 — facit-tumregler:**
- **P:** litet, förutsägbart kvarstående fel accepteras; snabbhet/enkelhet prioriteras.
- **PI:** standardval när nollfel krävs (de flesta industriella loopar).
- **PID:** trög process/mycket dötid där snabbhet väger tyngre än bruskänslighet, och
  mätsignalen är relativt ren.

---

## Uppgift 2: Aggressivitet (efter rättning K=1,0→1,5)

Process K=1,5, T=20, L=5, SP=60:

| Strategi | Kp | Fel | Översläng | Insvängning | Max u |
|---|---|---|---|---|---|
| Konservativ (λ=60) | 0,21 | 0 | ingen | ~174 s | 40 % |
| Balanserad (λ=20) | 0,53 | 0 | ingen | ~65 s | 42 % |
| Aggressiv (λ=5) | 1,33 | 0 | **4,4 %** | ~16 s | **100 % (mättar!)** |

**Bonusupptäckt:** den aggressiva inställningen mättar faktiskt utsignalen (u=100 %)
tillfälligt — bra brygga till Uppgift 5. Om utsignalen hade en snävare gräns (t.ex. max
60 %) skulle samma inställning riskera windup. Kan läggas till som bonusfråga.

**Svar Fall A (säkerhetskritisk):** Konservativ — ingen risk för översläng, stor marginal.
**Svar Fall B (genomströmningskritisk):** Aggressiv (16 s, 4,4 % översläng) om det är
acceptabelt; annars Balanserad som kompromiss (65 s, 0 % översläng).

**Reflektion 2:** Kravet styrde valet, inte processen (identisk process i båda fallen).
Extra marginal bör läggas på det säkerhetskritiska svaret — testa gärna ännu lägre λ.

---

## Uppgift 3: Dötid

**Test A** (L=0, Kp=1,5, Ti=20): fel=0, ingen översläng, insvängning ≈ **32 s**, max u ≈ 95 %.
**Test B** (samma Kp/Ti, L=5): översläng **7,5 %**, insvängning ≈ 39 s, max u = **100 %
(mättar!)**.

**Detuning för att ta bort översläng igen** (samma process, L=5):

| Kp | Översläng | Insvängning | Max u |
|---|---|---|---|
| 1,5 (ojusterad) | 7,5 % | 39 s | 100 % |
| 1,0 | ingen | 43 s | 78 % |
| 0,8 | ingen | 52 s | 62 % |

**Svar:** Kp behövde sänkas ~33 % (1,5→1,0) för att bli lika välartad som utan dötid —
och insvängningstiden ökade ~34 % (32 s→43 s). Det är "priset" för 5 s dötid.

**Reflektion 3:** Dötid begränsar hur aggressivt man kan reglera oavsett K/T. Okänd dötid
→ börja konservativt tills uppmätt (samma logik som Lambda-metoden i Uppgift 2).

---

## Uppgift 4: Integrerande process

**P-only, Kp=1,2** (K=0,01, outflow=0,5, SP=60): PV stannar på **~18,3** — kvarstående
fel **41,6** (bara 30 % av vägen till börvärdet). Betydligt värre än Uppgift 1 Fall A.

**Viktig nyans för facit-samtalet:** felet beror INTE på att processen är instabil, utan
på att en konstant last (outflow=0,5) kräver en konstant styrsignal i jämvikt
(u=outflow/K=50 %) — och en P-regulator kan bara leverera en konstant styrsignal genom
ett kvarstående fel (u=Kp·fel). Exakt samma mekanism som i Uppgift 1, bara mer extrem här.

*Om en elev frågar "är inte integrerande processer marginellt instabila utan I-del?":*
Ja — **om det inte finns någon last** (outflow=0) ger P-reglering istället asymptotiskt
nollfel (verifierat: felet krymper från 40 till ~0,3 efter 400 s, fast långsamt). Med en
last (som i scenariot) blir det istället ett permanent offset. Bra fördjupningsfråga,
inte nödvändig i grundflödet.

**PI, Kp=1,5, Ti=80:** fel → ~0 (0,46 kvar efter 600 s, fortsatt krympande), översläng
**12,9 %**, mycket långsam insvängning (~385 s) — Ti=80 är i överkant försiktigt; en
elev som testar lägre Ti (t.ex. 40–50) bör få snabbare insvängning med kvar liten/ingen
översläng.

**Puls (appens standard: mag=5, 20 steg → totalt +100!):** orealistiskt kraftig — PV
toppar på **~156**, över mätområdet 0–100. **Använd istället mag=1, 10 steg (totalt +10)**
i uppgiftstexten för en rimlig men tydlig störning.

**Reflektion 4:** P duger inte, av samma skäl som Uppgift 1 Fall B — inte för att
processen är instabil, utan för att en last kräver konstant u. Verkliga integrerande
processer: nivåreglering i tankar, ackumulerande lager, vissa satsprocesser.

---

## Uppgift 5: Windup

Process K=1, T=20, Kp=3, Ti=20, utsignal max=50, SP 80→40 vid t=150 s.

Vid växlingen (t=150 s): PV≈**50** (kan aldrig nå 80 — utsignalstaket sätter gränsen;
integratorn har redan "skuldsatt sig" kraftigt under hela uppgångsfasen).

**Utan anti-windup:** PV och u förblir **helt fastfrusna** (u=50 %, PV=50) genom hela det
efterföljande 150 s-fönstret — ingen synlig reaktion alls på det nya, lägre börvärdet.
(Detta är en starkare demonstration än standardscenariot i appen, eftersom
windup-skulden här byggs upp under en hel 150 s lång uppgångsfas och därför tar
motsvarande lång tid att vinna tillbaka. Om studenten kör längre än ~300 s syns till slut
en reaktion, men inte inom ett rimligt testfönster — påpeka det så ingen tror att
simulatorn hängt sig.)

**Med anti-windup:** reaktion börjar omedelbart:

| Tid efter växling | PV | u |
|---|---|---|
| 0 s | 50 | 50 % |
| 5 s | 38,7 | 0 % |
| 10 s | 33,1 | 22 % |
| 20 s | 32,8 | 36 % |
| 90 s | 39,7 | 40 % |
| 120 s | 39,9 | 40 % |

Bottnar strax under nya SP (32 vs 40 — viss översläng nedåt) och stabiliseras på 40 inom
~90–120 s.

**Svar:** Ja — givet den kända begränsningen (max 50 %) bör anti-windup vara aktiverat
**från början**, som en del av grundstrategin. Windup-skulden byggs upp redan under
normal drift (uppgångsfasen), helt utan förvarning — det finns ingen "vänta och se".

**Reflektion 5:** Andra windup-orsaker: kärvande/mekaniskt begränsad ventil,
effektbegränsning, frekvensomriktare i strömbegränsning, delat/manuellt övermanövrerat
ställdon. Strategiregel: *"Om manöverdonet kan mättas — fysisk gräns, säkerhetsgräns
eller delad resurs — ska anti-windup vara standard, inte opt-in."*

---

## Uppgift 6: Prioritering — SP-följning vs störningsavvisning

Process K=1, T=20, PID Kp=1, Ti=10, Td=2.

**Fall A** (SP 30→70): översläng **7,8 %**, insvängning ≈ **64 s**, max u ≈ 83 % (ingen
mättning).

**Fall B** (SP fast=50, puls mag=10/5 steg → **totalt +50**, se anmärkning ovan om
pulssemantik): PV rusar till >100 momentant, regulatorn tar ner det, max avvikelse
från SP ≈ **37,5**. Rekommendera mag=2, 5 steg (totalt +10) i uppgiftstexten för ett
rimligare facit-scenario.

**Omtrimmad för störningsavvisning** (Kp=2, Ti=6, Td=3): max avvikelse ≈ **36,0** —
**bara ~4 % bättre** trots betydligt mer aggressiva parametrar. Samtidigt försämras
börvärdessvaret: översläng stiger till **12,5 %** och utgången mättar (u=100 %).

**Facit-slutsats (viktig, ärlig poäng):** med bara Kp/Ti/Td att skruva på är det svårt
att förbättra störningsavvisningen nämnvärt utan att tydligt försämra
börvärdesföljningen — klassisk avvägning inom en enda PID-struktur. Använd gärna detta
som brygga till nästa veckas kursmål: framkoppling/kaskadreglering löser precis detta
dilemma bättre än att "bara skruva hårdare".

**Reflektion 6:** Ingen av parametrarna var optimal för båda fallen — det var en
avvägning, inte ett gratis val.

---

## Mästaruppgift 7: Reglerstrategi-PM

Process K=0,7, T=40, L=6, normalvärde 65, utsignal max=85, SP=85.

| Kandidat | Kp | Ti | Fel | Översläng | Insvängning | Max u |
|---|---|---|---|---|---|---|
| Konservativ | 1,0 | 40 | 0 | ingen | ~159 s | 29 % |
| **Balanserad** | **1,5** | **30** | 0 | 2,6 % | **~67 s** | 38 % |
| Försiktig/långsam | 0,7 | 50 | ~0,08 (ej klart) | ingen | ~309 s | 29 % |

**Facit-rekommendation:** Balanserad (Kp=1,5, Ti=30) är sannolikt bästa PM-svaret — god
marginal till säkerhetsgränsen (38 % av tillåtna 85 %), snabb, obetydlig översläng.

**Windup-frågan:** Balanserad kommer aldrig i närheten av 85 %-taket vid ett vanligt
börvärdessteg — ingen synlig skillnad med/utan anti-windup i just det testet. Eleven bör
ändå svara "ja, aktivera som standardpolicy" (jämför Uppgift 5-principen: man vet inte i
förväg om en större störning eller ett större börvärdessteg någon gång driver upp mot
taket).

**Störningstestet — den dolda poängen (se punkt 4 högst upp):** SP=65=normalvärdet i
detta test ⇒ regulatorns viloläge är u=0 %. Processen är "endast värme" (u kan bara höja
PV, aldrig sänka den aktivt). En positiv störning kan alltså INTE motverkas aktivt —
regulatorn går bara ner till u=0 % och väntar ut den naturliga avklingningen (T=40 s).
Med en rimlig liten puls (mag=1, 5 steg → totalt +5) syns detta tydligt: PV toppar på
**~69,8**, u ligger kvar på **0 %** hela tiden, och det tar **>90 s** innan PV är
tillbaka inom 0,5 av börvärdet — enbart processens egen dynamik, ingen aktiv reglering.
**Detta måste förklaras i uppgiftstexten**, annars tror studenter att u="fastnat"/trasigt.

**Reflektion 7:** Beslut 2 (aggressivitet) styrde mest — det avgjorde både
insvängningstid och hur mycket marginal som fanns kvar till säkerhetsgränsen, vilket i
sin tur påverkade svaret på windup-frågan. Om gränsen istället varit 100 % hade
troligen inget av de tre kandidatsvaren behövt ändras — ingen av dem kom ens i närheten
av 85 %. Bra observandum i sig: gränsen var *inte* den begränsande faktorn med rimliga
inställningar; först vid betydligt högre Kp/lägre Ti, eller en stor störning, hade den
blivit det.

---
**Metod:** Alla värden ovan från `sim-core.js` kört i Node (samma kod som webbappen),
`dt=1`, seed=42 för brus/puls-test. Script sparat i sessionens scratchpad, inte i repot —
säg till om du vill ha det som ett återanvändbart valideringsverktyg i `tests/`.
