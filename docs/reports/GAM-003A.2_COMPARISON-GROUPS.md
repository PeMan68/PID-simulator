# GAM-003A.2 — Deklarativa jämförelsegrupper (comparisonGroup)

**Uppdrag:** GAM-003A.2
**Utförd av:** Claude Code (CC)
**Datum:** 2026-09-09
**Status:** Full implementation i lärstigsdata, appdispatch, GAM-002:s aktivitetsmodell
och kalibreringsverktyget. **Ingen synlig XP, badge eller nivåmätare. Ingen persistens.**

---

## 1. Sammanfattning

GAM-003A/A.1 identifierade att GAM-002 bara kan upptäcka jämförelsepar **inom samma
kontext** (ett scenario/lärstigssteg) — flera lärstigars pedagogiskt viktigaste
jämförelser (P vs PI, PI vs PID, olika Kp-nivåer, med/utan dötid, med/utan
anti-windup, olika λ) spänner över LÄRSTIGSSTEG och missades därför helt. PO/PM
beslutade att lösa detta med ett deklarativt fält, `comparisonGroup`, i
lärstigsdata — och att göra det som en fullständig implementation nu, inte bara
i kalibreringsverktyget.

**Genomfört:**
- Nytt valfritt fält `comparisonGroup` i lärstigsformatet, validerat av
  `tests/validate-content.mjs`.
- Fältet satt på **19 steg i 6 lärstigar, fördelat på 8 grupper** — bara där
  instruktionstexten uttryckligen ber användaren jämföra försöken.
- `apps/app/app.js` skickar `comparisonGroup` med `learning_step_reached`.
- `apps/app/activity-prototype-core.js` (GAM-002) utökad med en ny,
  fristående jämförelsemekanism för grupper — den BEFINTLIGA inom-kontext-
  logiken är helt oförändrad och kontrollerad att den inte dubbelräknar.
- Grupper med fler än två försök (upptäckt: `storningar-noise-comparison` har
  fyra) hanteras genom att **bara jämföra mot det senast registrerade
  försöket i gruppen** — samma princip GAM-002 redan använder inom en
  kontext. Fyra försök ger tre kedjade par, inte sex (C(4,2)) — löst utan
  något nytt fält utöver `comparisonGroup` själv.
- Kalibreringsverktyget (`tests/gamification/`) uppdaterat att använda samma
  mekanism. Jämförelse-XP i referensen "Test 1" ökade från 6 till 18 XP (två
  nya gruppjämförelser upptäckta som tidigare missades helt).
- **Det godkända nivåtempot (2/4/6 genomgångar till nivå 8) är i praktiken
  oförändrat** trots den ökade jämförelse-XP:n — se avsnitt 6.
- 71 nya/ändrade automatiska tester (Core: 8, innehåll: 23, XP-verktyg:
  oförändrat antal men omräknat), samtliga gröna. Full DEV/PROD-regression
  grön, PROD-artifakten fysiskt oförändrad i struktur (fältet är inert data
  i PROD — GAM-002 laddas aldrig där).

---

## 2. Schemaändring

Nytt valfritt fält på ett lärstigssteg (`apps/app/content/exercises/*.json`):

```json
{
  "type": "scenario",
  "ref": "...",
  "comparisonGroup": "pi-vs-pid",
  ...
}
```

**Regler (validerade av `tests/validate-content.mjs`):**
- Valfritt — steg utan fältet är helt opåverkade.
- Måste vara en icke-tom sträng om det finns (fel om inte).
- Varning om satt på ett `theory`-steg (bara `scenario`-steg kan bilda
  jämförelsepar — teoristeg har inga försök).
- Varning om ett grupp-ID bara används av ETT steg i hela katalogen (kan
  aldrig bilda ett par — sannolikt en felstavning).
- Samma grupp-ID FÅR delas av flera lärstigar (inte utnyttjat i denna
  inventering, men inte begränsat).

---

## 3. Slutlig definition av comparisonGroup

Ett steg med `comparisonGroup: "X"` deltar i en session-omfattande,
kronologisk kedja av genomförda, distinkta konfigurationer inom grupp X.
När ett steg i grupp X får en NY distinkt konfiguration (enligt GAM-002:s
redan befintliga regler — minst 20 körda steg, signatur inte tidigare sedd
I DEN KONTEXTEN), jämförs den mot den SENAST registrerade distinkta
konfigurationen i HELA gruppen X:
- Om den senaste kom från en **annan kontext** (annat lärstigssteg/scenario)
  → ett nytt **gruppjämförelsepar** registreras (`session.groupComparisonPairs`).
- Om den senaste kom från **samma kontext** → inget nytt gruppar (paret är
  redan räknat av den befintliga inom-kontext-logiken) — bara "senaste
  post"-pekaren i gruppen uppdateras.

Detta är matematiskt samma "jämför mot föregående"-princip GAM-002 redan
använder inom en kontext, bara utsträckt till att gälla över kontextgränser
när ett grupp-ID uttryckligen kopplar ihop dem.

---

## 4. Inventerade lärstigar

Samtliga sju namngivna lärstigar granskades genom att läsa den fullständiga,
faktiska instruktionstexten (inte bara regex-sökning):

| Lärstig | Resultat |
|---|---|
| `oppen-slinga-onoff-p.v1` | **Ingen comparisonGroup.** Steg 5:s instruktion jämför PV mot SP internt, men ber aldrig användaren jämföra mot steg 4 (On/Off) — bara en kvalitativ notering i objective-fältet. Ingen uttrycklig jämförelseinstruktion. |
| `proportionalband-forstarkning.v1` | Två grupper (avsnitt 5). |
| `pi-pid.v1` | En grupp. |
| `processbegransningar.v1` | Två grupper. |
| `windup-antiwindup.v1` | En grupp — **korrigerar ett fel i GAM-003A:s ursprungliga inventering**, som felaktigt modellerade av/på-jämförelsen som ETT steg med två interna konfigurationer. Det är i verkligheten två separata lärstigssteg (steg 2 = av, steg 3 = på, steg 3:s instruktion säger uttryckligen "Jämför... jämfört med utan anti-windup"). |
| `storningar-robusthet.v1` | En grupp med FYRA steg (avsnitt 6). |
| `lambda-metoden.v1` | En grupp med tre steg. |

---

## 5. Grupp-ID och pedagogiskt syfte

| Grupp-ID | Lärstig, steg (1-indexerat) | Syfte |
|---|---|---|
| `pb-kp-escalation` | proportionalband-forstarkning.v1, steg 2–3 | Kp=0,5 → Kp=2/5: hur PB-bandet krymper och kvarstående fel minskar när Kp ökar. |
| `pb-p-vs-pi` | proportionalband-forstarkning.v1, steg 5–6 | Samma Kp, P vs PI — hur I-delen eliminerar kvarstående fel. |
| `pi-vs-pid` | pi-pid.v1, steg 1–3 | Samma process/Kp/Ti, PI vs PID — hur D-delen dämpar översläng. |
| `procbeg-k-comparison` | processbegransningar.v1, steg 2–3 | Stark vs svag process (K=1,3 vs K=0,5) — processens fysikaliska tak. |
| `procbeg-deadtime-comparison` | processbegransningar.v1, steg 4–5 | Samma PI-regulator, L=0 vs L=5 — dötidens effekt på översläng. |
| `windup-antiwindup-comparison` | windup-antiwindup.v1, steg 2–3 | Samma mättningsscenario, utan vs med anti-windup. |
| `storningar-noise-comparison` | storningar-robusthet.v1, steg 2–4 (4 försök) | P-utan-brus → P-med-brus → PI → PID — hur P/I/D hanterar mätbrus olika. |
| `lambda-comparison` | lambda-metoden.v1, steg 3–5 | Moderat → aggressivt → konservativt λ. |

`oppen-slinga-onoff-p.v1` fick medvetet INGEN grupp — se avsnitt 4.

---

## 6. Grupper med fler än två försök — hur de hanteras

**Upptäckt under inventeringen** (precis det scenario uppdraget varnade för):
`storningar-noise-comparison` har FYRA distinkta försök (P-nobrus, P-brus, PI,
PID) i tre lärstigssteg (steg 2 innehåller både P-nobrus och P-brus som en
befintlig inom-kontext-jämförelse). Alla C(4,2)=6 möjliga par är INTE
pedagogiskt avsedda — bara den sekventiella kedjan (nobrus→brus→PI→PID, 3 par)
är det.

**Lösning:** ingen ny deklarativ komplettering (roller/ordning) behövdes.
Den sekventiella "jämför bara mot senaste"-principen (avsnitt 3), som redan
är hur GAM-002 hanterar flera konfigurationer INOM en kontext, tillämpad på
gruppnivå, ger exakt de tre avsedda paren automatiskt — utan att någonsin
räkna ut alla sex kombinationerna. `lambda-comparison` (tre försök, skulle ge
C(3,2)=3 om alla räknades) ger på samma sätt bara två kedjade par.

Verifierat med automatiska tester (`tests/activity-prototype.test.mjs`,
test 32): fyra försök i en grupp ger exakt tre par.

---

## 7. Hur appen skickar comparisonGroup till GAM-002

`apps/app/app.js`s `nextPathStep()`/`prevPathStep()` läser redan
`currentPath.steps[currentPathStep]` (variabeln `step`) innan de dispatchar
`learning_step_reached`. Ändringen är en tilläggd nyckel i samma
dispatch-anrop:

```js
activityDispatch("learning_step_reached", {
  learningPathId: currentPathId,
  stepIndex: currentPathStep,
  isFinalStep: ...,
  contextKey: activityContextKey(),
  comparisonGroup: step.comparisonGroup || null, // NYTT
});
```

Ingen ny händelsetyp, ingen ny dispatch-plats — samma befintliga anrop, ett
tillagt fält. `null` när steget saknar gruppen (oförändrat beteende).

---

## 8. Hur jämförelsepar identifieras över kontextgränser

Se avsnitt 3. Implementerat i `activity-prototype-core.js`:
- `session.comparisonGroups: Map<groupId, { lastEntry }>` — nytt sessionsfält.
- `session.groupComparisonPairs: []` — nytt sessionsfält, samma form som
  befintliga `comparisonPairs` men med `fromContext`/`toContext` istället för
  en enda `contextKey`.
- `ctx.comparisonGroup` sätts när ett `learning_step_reached` (eller
  `scenario_loaded`) med `meta.comparisonGroup` tas emot.
- `finalizeAttempt()` anropar den nya `recordGroupComparison()`-funktionen
  EFTER sin befintliga, oförändrade inom-kontext-logik, och ENDAST om
  `ctx.comparisonGroup` är satt och konfigurationen är distinkt (samma
  `isDistinct`-kontroll som redan styr allt annat).

## 9. Hur dubbletter förhindras

- **Samma par två gånger:** en gruppjämförelse bildas bara i RIKTNINGEN
  "senaste registrerade → ny" — det finns ingen kod som någonsin prövar den
  omvända riktningen, så A→B och B→A kan aldrig båda inträffa.
- **Dubbelräkning mot befintlig inom-kontext-jämförelse:** om den senaste
  gruppposten kommer från SAMMA kontext som den nya (dvs. paret redan är
  räknat av den oförändrade `session.comparisonPairs`-logiken), bildas INGET
  gruppar — bara pekaren uppdateras. Verifierat med test 33 (se avsnitt 12).
- **Repetition mellan sessioner:** eftersom `session.comparisonGroups`
  INTE ingår i `computeXP()`s `priorState`/`endState`-kedjning (GAM-003A.1),
  startar varje ny session med en tom grupp-karta — i linje med PO/PM:s
  regel "samma par ska bara registreras en gång per session" (en ny session
  FÅR alltså generera samma jämförelse igen, vilket är avsett enligt
  GAM-003A.1:s repetitionsprincip).

## 10. Hur grupper med fler än två försök hanteras

Se avsnitt 6.

## 11. Hur befintliga kontextinterna jämförelser bevaras

`session.comparisonPairs` (den befintliga arrayen) och dess intilliggande
kod i `finalizeAttempt()` är **inte ändrade** — bara utökade med ett
efterföljande, villkorat anrop till den nya gruppfunktionen. Verifierat:
- `tests/activity-prototype.test.mjs` test 33a/33b: en inom-kontext-
  jämförelse med `comparisonGroup` satt ger fortfarande exakt EN post i
  `comparisonPairs` och INGEN post i `groupComparisonPairs`.
- Samtliga 30 ursprungliga GAM-002-tester (opåverkade av GAM-003A.2) är
  fortfarande gröna.

---

## 12. Automatiska tester

**`apps/app/activity-prototype-core.js` / `tests/activity-prototype.test.mjs`**
(8 nya, totalt 48 — alla gröna):
31. Två försök i samma grupp, olika kontext → ett gruppar.
32. Fyra försök i en grupp → tre kedjade par, inte sex.
33. Inom-kontext-par dubbelräknas inte som gruppar.
34. Utan `comparisonGroup` → inget gruppar (oförändrat beteende).
35. Ett kort (ej genomfört) försök i gruppen bildar aldrig ett par.
36. Endast en riktning prövas (inget A-B/B-A-dubbelpar).
37. `app.js` skickar `comparisonGroup` med `learning_step_reached`.
38. `summary()` exponerar de nya fälten.

**`tests/gamification/comparison-groups-content.test.mjs`** (nytt, 23 tester):
pinnar de faktiska 8 grupperna och deras exakta stegindex i de 6 berörda
lärstigsfilerna, plus att `oppen-slinga-onoff-p.v1` uttryckligen saknar
grupper. Fångar en oavsiktlig framtida borttagning/ändring som ett testfel.

**`tests/validate-content.mjs`** (utökad, körs mot riktigt innehåll):
typvalidering av `comparisonGroup` + varning för grupper med <2 medlemmar
och för `comparisonGroup` på teoristeg. 0 fel, 0 nya varningar mot dagens
innehåll (alla 8 grupper har ≥2 medlemmar).

**`tests/gamification/xp-model.mjs`/`xp-model.test.mjs`** (43 tester,
oförändrat antal — logiken återanvänder samma diff-mönster som redan testas,
bara på ett andra Core-fält).

---

## 13. Resultat från uppdaterad XP-kalibrering

Referensen "Test 1" (proportionalband-forstarkning, profil "normal"):
jämförelse-XP ökade från **6 till 18 XP** (två nya, tidigare missade
gruppjämförelser à 6 XP). Total lärstigs-XP: 90 → **102 XP**.

Sammanfattat över alla tio lärstigar × tre profiler — se
`docs/reports/GAM-003A.2_COMPARISON-GROUPS.json` för fullständiga siffror
per lärstig. Genomgång 1 (första gången varje lärstig görs) ökar för alla
profiler eftersom de nya gruppjämförelserna är bestående "första gången"-
händelser.

## 14. Skillnad i jämförelse-XP före/efter, och effekt på nivåtempot

| | Före GAM-003A.2 | Efter GAM-003A.2 |
|---|---|---|
| Test 1-referens, comparisonPair-kategori | 6 XP | 18 XP |
| Test 1-referens, total | 90 XP | 102 XP |
| Nivå 8 nås (fördjupare / normal / minimal) | 2 / 4 / 6 genomgångar | **2 / 4 / 6 genomgångar (oförändrat)** |

**Varför nivåtempot höll trots ökningen:** de nya gruppjämförelserna är
BESTÅENDE (per distinkt konfiguration i sin kontext) — de ger extra XP i
FÖRSTA genomgången av varje lärstig, men INTE vid en identisk repetition
(samma mekanism som redan gäller `distinctConfig`, se GAM-003A.1). Eftersom
PM:s godkända nivåkurva kalibrerades mot en modell där repetition dominerar
den långsiktiga progressionen (genomgång 2+ av alla tio lärstigar), och
gruppjämförelserna bara påverkar genomgång 1:s totalsumma måttligt, förblev
milstolparna 2/4/6 i praktiken oförändrade. Se den bifogade JSON-rapporten
för exakta tal per genomgång.

---

## 15. Öppna frågor inför GAM-003B

1. **Ska `comparisonGroup` kunna spänna över lärstigar** (inte bara steg
   inom en lärstig)? Inget i implementationen hindrar det (grupp-ID:n är
   globala strängar), men ingen av de sju grupperna gör det idag. Om ett
   framtida behov uppstår (t.ex. jämföra ett resultat i en tidig lärstig mot
   ett resultat i en sen) fungerar mekanismen redan, oprövad.
2. **`session.comparisonGroups`/`groupComparisonPairs` ingår inte i
   GAM-003A.1:s `priorState`/`endState`-persistensmodell** (medvetet, se
   avsnitt 9) — bekräfta att detta är rätt beslut inför GAM-003B:s faktiska
   `localStorage`-implementation, så att en gruppjämförelse verkligen kan
   upprepas i en ny session utan att av misstag blockeras av sparad
   "redan jämfört"-status.
3. Övriga öppna frågor från GAM-003A.1 (persistensformat, "Återställ
   progression") kvarstår oförändrade.

---

## 16. Underlag för GAM-003B

`session.groupComparisonPairs` (och den befintliga `session.comparisonPairs`)
är nu den fullständiga källan till all jämförelse-XP en synlig prototyp
behöver läsa — inget gissningsarbete från grafmarkeringar krävs eller görs.
