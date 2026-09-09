# GAM-003A.1 — Reviderad XP-kalibrering: repetition ska ge XP

**Uppdrag:** GAM-003A.1 (uppföljning av GAM-003A)
**Utförd av:** Claude Code (CC)
**Datum:** 2026-09-09
**Status:** Analys- och kalibreringsuppdrag. **Ingen synlig XP, badge eller
nivåmätare implementerad. Ingen appkod ändrad.**

---

## 1. Sammanfattning

PO/PM granskade GAM-003A:s rapport och fattade en korrigerad grundprincip:
**XP-systemet ska premiera lärandeaktivitet, även när den upprepas** — repetition
av försök, lärstigar och egna parameterexperiment är inte manipulation, det är
avsedd användning. GAM-003A:s rekommenderade tak (hjälptak, sänkt
enstegningstak) dras därför tillbaka; kalibreringen görs om med PM:s
ursprungliga, okapade XP-regler och en ny, betydligt längre nivåkurva.

**Under omkalibreringen hittades och rättades två verkliga fel i
GAM-003A:s beräkningsmotor** (inte i XP-reglerna själva):

1. Ett försök som pågick när en händelsesekvens tog slut (utan ett
   avslutande Reset/scenariobyte) finaliserades aldrig — dess XP gick
   förlorad. Motorn finaliserar nu automatiskt eventuella pågående försök
   vid sessionens slut.
2. "Slutförd lärstig"-XP var felaktigt hopkopplad med "nytt högsta
   lärsteg"-XP i koden. Eftersom GAM-002:s egen `completed`-flagga är
   bestående (sätts bara en gång, aldrig om), gjorde detta att en repeterad
   lärstig ALDRIG gav ny lärstigs-XP — rakt motsatt PO:s nya princip.
   Lärstigs-XP är nu en egen, per-session repeterbar räkning, frikopplad
   från den bestående stegprogressionen.

Dessa rättelser gäller retroaktivt — GAM-003A:s ursprungliga siffror (t.ex.
referensen "Test 1" på 84 XP) var något för låga. Med rättelserna, men
fortfarande PM:s ursprungliga regler, blir referensen **90 XP**.

**Huvudresultat i denna omkalibrering:**

- En (1) fullständig genomgång av samtliga tio lärstigar, med den nya
  nivåkurvan (0/50/140/300/550/900/1400/2100): minimal→**Loopvävare**,
  normal→**Loopvävare (60 % mot Regleradept)**, aktiv fördjupare→
  **Processmästare (precis över tröskeln)**. Ingen profil når nivå 8 på en
  enda genomgång — kalibreringsmålet uppfyllt.
- Upprepade genomgångar ger stabil, repeterbar XP: en andra/tredje genomgång
  av samma lärstig ger ~65–70 % av förstagångs-XP:t (completedAttempt +
  completedLearningPath + hjälp + enstegning + mätarbete, men INTE
  newHighestStep/distinctConfig/jämförelsepar för identiska
  konfigurationer — de är bestående). Se avsnitt 4.
- **Nivå 8 nås** vid full, repeterad genomgång av alla tio lärstigar: efter
  **2 genomgångar** för en aktiv fördjupare, **4 genomgångar** för en normal
  användare, **6 genomgångar** för en minimal användare. Se avsnitt 5 för
  fullständig progression och en bedömning av om det tempot känns rimligt.
- Manipulationstesterna 4, 6, 8 och 16 från GAM-003A ska **inte längre
  läsas som fel** — de visar nu avsedd, belönad repetition/experimenterande
  (se avsnitt 6).
- Ett tekniskt krav följer av principen: bestående progression (nytt
  högsta lärsteg, distinkta konfigurationer, total XP, nivå) måste sparas
  mellan sessioner i en framtida synlig prototyp. Se avsnitt 7 — inte
  implementerat i detta uppdrag, bara dokumenterat som krav för GAM-003B.

---

## 2. Reviderad XP-modell (PO/PM:s beslut, 2026-09-09)

| Aktivitet | XP | Regel | Ändrat mot GAM-003A:s rekommendation? |
|---|---|---|---|
| Nytt högsta lärsteg | 2 | Bestående, en gång per lärsteg (över sessioner) | Oförändrat |
| Slutförd lärstig | 12 | Repeterbar, varje fullständig genomgång | **Bugg rättad** — var av misstag bestående |
| Genomfört försök | 4 | Repeterbar, varje uppfyllt försök (även identisk konfiguration) | Oförändrat |
| Distinkt parameterkonfiguration | 2 | Bestående per kontext, bonus första gången | Oförändrat |
| Jämförelsepar | 6 | Per session, när GAM-002 kan identifiera det | Oförändrat |
| Unik hjälptext | 2 | En gång per helpId OCH session — **inget tak** | **Återställt** — GAM-003A:s hjälptak (5/session) dras tillbaka |
| Genomfört mätarbete | 4 | Aktivering + justering + efterföljande aktivitet | Oförändrat |
| Analytisk enstegning | 1 | Högst 5 per försök | **Återställt** — GAM-003A:s sänkta tak (3) dras tillbaka |
| Aktiv tid | 0 | Visas som statistik, ingen XP | Oförändrat (fanns aldrig en XP-regel för detta) |
| Reset / Rensa graf | 0 | Förberedande funktioner | Oförändrat |
| Checkpoint | Separat system | Påverkar inte aktivitetsnivån | Oförändrat |

**Bestående vs. repeterbar — den avgörande skillnaden:**

| Bestående (en gång, över alla sessioner) | Repeterbar (varje session/genomgång) |
|---|---|
| Nytt högsta lärsteg | Slutförd lärstig |
| Ny distinkt konfiguration i en given kontext | Genomfört försök |
| | Analytisk enstegning |
| | Genomfört mätarbete |
| | Unik hjälptext (per NY session — inte inom samma session) |
| | Nya jämförelsepar (per session) |

---

## 3. Metod — vad som byggdes/ändrades i verktyget

Inget i `apps/app/` rört. Ändringar i `tests/gamification/`:

- **`xp-model.mjs`:**
  - Ny nivåkurva `LEVELS_V2` (0/50/140/300/550/900/1400/2100).
  - `computeXP(events, rules, priorState)` — nytt tredje, valfritt argument.
    `priorState` för-fyller samma `session.learningPaths`/`session.contexts`-
    strukturer GAM-002 redan använder, INNAN händelserna processas — det
    ändrar inte en rad i `activity-prototype-core.js`, det bara låter en ny
    session "komma ihåg" vad en tidigare session redan uppnått. Funktionen
    returnerar nu även `endState` i samma form, för att kedjas in i nästa
    anrop (`mergeState()` slår ihop tillstånd från flera lärstigar).
  - De två buggrättningarna i avsnitt 1 (automatisk finalisering vid
    sessionsslut; `completedLearningPath` frikopplad från `newHighestStep`).
  - 13 nya automatiska tester (totalt 43, alla gröna) som specifikt verifierar
    den reviderade bestående/repeterbar-principen.
- **`career.mjs`** (nytt) — kör N genomgångar av en lärstig eller en hel
  katalog, kedjat via `priorState`/`endState`, och räknar ut vid vilken
  genomgång en profil når en given nivå.
- **`lp-inventory.mjs`, `profiles.mjs`, `calibrate.mjs`, `manipulation.mjs`,
  `sensitivity.mjs`** — oförändrade i sak (samma innehållsinventering och
  profiler som GAM-003A), men alla resultat i denna rapport är omräknade med
  den rättade motorn och de återställda XP-reglerna.

---

## 4. Repetition — resultat

**En lärstig upprepad tre gånger** (profil "normal", identiska
konfigurationer varje gång — en student som kör om samma övning för att
kontrollera sitt resultat):

| Lärstig | Genomgång 1 | Genomgång 2 | Genomgång 3 |
|---|---|---|---|
| proportionalband-forstarkning.v1 | 90 XP | 60 XP | 60 XP |
| storningar-robusthet.v1 | 144 XP | 86 XP | 86 XP |

Mönstret är konsekvent: genomgång 1 innehåller den bestående XP:n (nytt
högsta lärsteg, distinkta konfigurationer, jämförelsepar) UTÖVER den
repeterbara delen; genomgång 2/3 ger bara den repeterbara delen
(completedAttempt + completedLearningPath + enstegning + hjälp), vilket
landar på **65–67 % av förstagångs-XP:t**. En repeterad lärstig ger alltså
fortfarande betydande, förutsägbar XP — precis som PO/PM beslutat — men
avtar naturligt eftersom de bestående kategorierna (som ofta är en stor del
av en FÖRSTA genomgång) inte kan tjänas in igen.

**Många identiska, fullständiga försök** (samma konfiguration körd om fem
gånger, med Reset mellan): **24 XP** — 4 XP completedAttempt × 5 + 2 XP
newHighestStep + 2 XP distinctConfig (bara den första). Detta beskrevs i
GAM-003A som manipulationstest 6; det ska nu läsas som ett **korrekt,
avsett exempel på belönad repetition**, inte ett fel.

**Egna parameterexperiment utan tak:** tio på varandra följande, egna
konfigurationsändringar (var och en körd till ett genomfört försök) gav
**116 XP** (GAM-003A:s manipulationstest 8, tidigare kallat "farmning").
Under den nya principen är detta korrekt: "Tio konfigurationer som faktiskt
körs minst 20 steg kan vara en seriös parameterstudie" (PO). Inget tak
införs. Villkoren som redan skyddar mot ren klickspam kvarstår oförändrade
(kräver ≥20 körda steg per konfiguration; ingen simulering → ingen XP).

**Hjälpanvändning i flera sessioner:** en unik hjälptext ger XP igen i en ny
session (`computeXP()`-anrop utan `priorState` för hjälp — hjälp är
uttryckligen INTE bestående över sessioner, bara inom en session). Detta är
redan hur verktyget fungerar och krävde ingen kodändring — bekräftat med ett
nytt test (se `xp-model.test.mjs`, tester 31/34 som demonstrerar samma
princip för lärstig/steg-XP).

---

## 5. Nivåkurvan och flera fullständiga genomgångar

Ny huvudkandidat (`LEVELS_V2`): 0 / 50 / 140 / 300 / 550 / 900 / 1400 / 2100.

**En (1) genomgång av samtliga tio lärstigar:**

| Profil | Total XP | Slutnivå |
|---|---|---|
| Minimal | 570 | Loopvävare (6 % mot Regleradept) |
| Normal | 760 | Loopvävare (60 % mot Regleradept) |
| Aktiv fördjupare | 1408 | Processmästare (precis över 1400-tröskeln) |

**Flera fullständiga genomgångar** (samma lärstigar upprepade i katalog­
ordning, kedjat tillstånd):

| Genomgång | Minimal (kumulativ) | Normal (kumulativ) | Aktiv fördjupare (kumulativ) |
|---|---|---|---|
| 1 | 570 (Loopvävare) | 760 (Loopvävare) | 1 408 (Processmästare) |
| 2 | 914 (Regleradept) | 1 294 (Regleradept) | **2 350 (Reglerlegend, MAX)** |
| 3 | 1 258 (Regleradept) | 1 828 (Processmästare) | 3 292 (MAX) |
| 4 | 1 602 (Processmästare) | **2 362 (Reglerlegend, MAX)** | 4 234 (MAX) |
| 5 | 1 946 (Processmästare) | 2 896 (MAX) | 5 176 (MAX) |
| 6 | **2 290 (Reglerlegend, MAX)** | 3 430 (MAX) | 6 118 (MAX) |

**Nivå 8 (Reglerlegend) nås vid:** aktiv fördjupare → **genomgång 2**, normal
→ **genomgång 4**, minimal → **genomgång 6**.

**Bedömning:** ingen profil når taket på en enda genomgång av kursens alla
lärstigar (kalibreringsmålet). En aktiv fördjupare som medvetet experimenterar
extra i varje steg når dock taket redan efter att ha gått igenom hela kursen
en andra gång — det är en öppen fråga till PO/PM om det känns rätt eller för
snabbt (se avsnitt 8). Det är värt att notera att "en andra genomgång med
utökat eget experimenterande" inte är en trivial handling — det motsvarar i
praktiken att göra om hela kursens övningar en gång till med högre ambition,
vilket rimligen SKA belönas rejält enligt den beslutade principen.

---

## 6. Omvärdering av GAM-003A:s manipulationstester

| # | Scenario | XP (rättad motor) | Ny tolkning |
|---|---|---|---|
| 4 | Alla 24 hjälptexter, inget annat | 48 (oförändrat) | Avsedd — utforskande av alla förklaringar är lärandeaktivitet, inget tak. |
| 6 | Identisk konfiguration 5× | 24 (oförändrat) | Avsedd repetition, inte manipulation. |
| 8 | Parameter +6 % upprepat 10× | 116 (tidigare 104) | Avsedda egna experiment, inget tak. |
| 16 | Maximerad kort session | 115 (oförändrat) | Fortfarande högre än en enda lärstigsgenomgång (90 XP, Test 1) — men under den nya principen är intensivt, brett experimenterande i en session precis vad som ska belönas. Ingen åtgärd. |

De tre scenarier som verkligen ska ge 0 XP (Reset, Rensa graf, ändring utan
körning, pointermove, fel checkpointsvar) gjorde det redan i GAM-003A och
gör det fortfarande — bekräftat oförändrat med den rättade motorn.

---

## 7. Tekniskt krav för GAM-003B: persistens

Om upprepade lärstigar ska ge bestående progression måste en framtida synlig
prototyp (GAM-003B) spara, mellan sessioner:

- total ackumulerad XP
- aktuell nivå (härledd från XP, behöver inte sparas separat)
- högsta tidigare nådda lärstegsindex, per lärstig
- vilka konfigurationssignaturer som redan räknats som distinkta, per
  kontext (annars ges distinctConfig-bonus om och om igen för samma
  konfiguration i en ny session)
- antal slutförda genomgångar per lärstig (för egen statistik, inte för
  XP-beräkningen i sig — den senare räknas repeterbart per genomgång)

**Ska INTE sparas** (oförändrat sedan GAM-002/GAM-003A): råhändelseloggen,
musrörelser, tangentaktivitet, fullständig parameterhistorik, detaljerad
aktiv tid.

En **"Återställ progression"**-funktion med tydlig bekräftelse behövs också.

`tests/gamification/xp-model.mjs`s `priorState`/`endState`-mekanism
(avsnitt 3) är avsiktligt utformad för att motsvara exakt detta —
`endState` är i praktiken den datastruktur en `localStorage`-baserad
implementation skulle behöva spara. **Inget av detta är implementerat i
GAM-003A.1** — det är ett dokumenterat krav för GAM-003B, inte kod som
finns i appen.

---

## 8. Jämförelser mellan lärsteg — bekräftat öppet beslut

PO/PM avfärdade uttryckligen att gissa jämförelser från grafmarkeringarna
(FEAT-030/PED-004) och föreslog istället ett deklarativt fält i
lärstigsformatet, t.ex.:

```json
{ "comparisonGroup": "pi-pid-comparison" }
```

med motiveringen att en jämförelse kan omfatta fler än två steg, vilket ett
`comparesWithStep`-fält (GAM-003A:s eget förslag) inte uttrycker lika
tydligt. **Ingen ändring av lärstigsformatet görs i GAM-003A.1** — detta
förblir ett öppet beslut för ett framtida uppdrag, i linje med PO/PM:s egen
instruktion.

---

## 9. Öppna beslut till PO/PM

1. **Är takten till nivå 8 rimlig?** 2 genomgångar (fördjupare) / 4
   (normal) / 6 (minimal) av HELA kursens innehåll. Om det känns för snabbt
   eller för långsamt är avsnitt 5:s tabell underlaget för att justera
   `LEVELS_V2`s toppnivåer specifikt (bottennivåerna 1–4 följer redan väl
   det tidigare beslutade tempot från GAM-003A, se avsnitt 5:s
   engångskolumn).
2. **`comparisonGroup`-fältet** (avsnitt 8) — när ska det införas, och ska
   det vara en del av GAM-003B eller ett eget litet innehållsuppdrag innan
   dess?
3. **Persistensformatet** (avsnitt 7) — `localStorage` är standardantagandet
   i detta dokument (matchar hur resten av appen redan sparar UI-inställningar,
   t.ex. `pidSimWelcomed`, kollapsade parametergrupper), men det är inte
   uttryckligen beslutat. Om ett annat lagringssätt önskas påverkar det
   GAM-003B:s tekniska design.

---

## 10. Underlag för GAM-003B

Se GAM-003A:s rapport (`docs/reports/GAM-003A_XP-KALIBRERING.md`) avsnitt 17
— fortsatt giltigt, med tillägget att `priorState`/`endState`-mekanismen i
`xp-model.mjs` nu ger en konkret, testad referens för hur bestående
progression ska modelleras i den synliga prototypen.
