# UX-004 — Omstrukturering av huvudyta och progressiv exponering

**Datum:** 2026-09-21
**Uppdragsgivare:** PO + PM (designbeslut redan taget — denna analys utformar
INTE om de tre huvudgrupperna, bara hur de ska realiseras)
**Typ:** Analys/UX-design — INGEN kod, ingen branch, ingen implementation
**Underlag:** `apps/app/index.html` (fullständig genomgång av samtliga fält
i dagens fyra grupper: Process/Regulator/Styrning/Störningar),
`apps/app/app.js` (`APPLICATION_PROFILES`, `[data-addon]`-mekaniken från
UX-002, `updateProcessUIState()`/`updateControllerUIState()`), samtliga 12
DEV-lärstigar, `docs/reports/UX-001…003`

---

## 0. Viktig avgränsning innan analysen — två olika "Avancerat"-begrepp

UX-003 (föregående uppdrag) avfärdade ett förslag som ANVÄNDE ordet
"Avancerat" för att **ERSÄTTA** Tillämpning/Fri utforskning (en global
lås-upp-allt-mekanism). Det är INTE vad UX-004 ber om. Här är "Avancerat"
en **disklosyr-lager** som verkar HELT INOM det redan beslutade
Tillämpnings-/Processmodell-/Läges-systemet från UX-002 (som mergades till
`develop` i samma uppdrag som detta): Tillämpning avgör fortfarande VILKA
fält som överhuvudtaget är MÖJLIGA att visa (oförändrat), "Avancerat" avgör
bara om ett fält som redan är TILLÅTET visas direkt eller bakom en klickning.
De två mekanismerna är alltså komplementära, inte konkurrerande — se
avsnitt 5 för hur de kombineras. Detta var för övrigt precis den riktning
UX-003 avsnitt 4 föreslog spara till "när det faktiskt behövs" — UX-004 är
det tillfället.

---

## 1. Nulägesinventering — samtliga fält i dagens fyra grupper

| Grupp idag | Fält |
|---|---|
| **Process** | Tillämpning, Processmodell, K, T, L, **Lastförstärkning** (addon: framkoppling), Normalvärde, Utflöde, **Olinjär ventilkarakteristik** + 5 zonfält (addon: ventilkarakteristik) |
| **Regulator** | Läge, Kp, Ti, Td, **Kff** (addon: framkoppling), **Parameterstyrning** + 11 zonfält (addon: parameterstyrning), Bumpless, Anti-windup, Visa PB, Hyst. låg, Hyst. hög |
| **Styrning** | SP, U min, U max, Manuell u |
| **Störningar** | Brus std, Puls mag, Puls steg, Trigga puls, **Last mag** (addon: framkoppling), **Trigga last** (addon: framkoppling) |

(Fetstil = redan addon-gated av UX-002, dvs. bara synliga när vald
Tillämpning tillåter Framkoppling/Parameterstyrning/Ventilkarakteristik.)

**Iakttagelse:** Framkoppling är redan idag spridd över TRE av dagens fyra
grupper (Lastförstärkning i Process, Kff i Regulator, Last mag+Trigga last i
Störningar) — den nya tregruppsindelningen ändrar inte det mönstret, bara
var respektive del hamnar.

---

## 2. Föreslagen slutlig informationsarkitektur

| Ny grupp | Grundfält (alltid synliga, inom Tillämpning/Processmodell/Läge-filtret) | Avancerat (kollapsad, se avsnitt 3) |
|---|---|---|
| **Processinställning** | Tillämpning, Processmodell, K/T/L/Normalvärde (Självreglerande) ELLER Kv/Utflöde (Integrerande — se anmärkning nedan) | Olinjär ventilkarakteristik + zonfält, Lastförstärkning, *framtida processtillägg* |
| **Regulatorkonfiguration** | Läge, Kp, Ti, Td, U min, U max, Hyst. låg/hög (endast Läge=OnOff) | Parameterstyrning + zonfält, Bumpless, Anti-windup, Kff, *(brytpunkter/zonparametrar ingår i Parameterstyrning/Ventilkarakteristik ovan, inte en egen post)* |
| **Processpåverkan** | SP, Manuell u (endast Läge=Manuell), Brus std, Puls mag, Puls steg, Trigga puls, Last mag, Trigga last | — (se avsnitt 2.2, ingen egen disklosyr-nivå föreslås här) |

**Anmärkning om Processinställning:** PO:s exempellista (K, T, L,
Normalvärde) beskriver det Självreglerande fallet. Kv/Utflöde är
Integrerande-processens DIREKTA motsvarighet till K/T/L/Normalvärde (samma
roll: processens grundparametrar) — de hör alltså till samma grundnivå, inte
till Avancerat. Detta är EXAKT dagens befintliga Processmodell-styrda
visning (`updateProcessUIState()`), oförändrad av UX-004 — nämns bara för
att göra listan uttömmande.

**U min/U max flyttas** från nuvarande "Styrning" till Regulatorkonfigurations
grundnivå. Motivering: de är gränser regulatorn ARBETAR INOM (en
konfigurationsegenskap), inte något en student typiskt ändrar under en
pågående körning — till skillnad från SP, som PO uttryckligen räknar till
Processpåverkan. Det är den tydligaste tolkningen av PO:s egna exempellistor
(U min/U max nämns explicit under Regulatorkonfiguration, SP explicit under
Processpåverkan) — ingen egen bedömning som avviker från uppdraget.

**Manuell u** är inte uttryckligen placerad i PO:s uppdrag. Rekommendation:
**Processpåverkan**, inte Regulatorkonfiguration — det är per definition
"det en student ändrar under pågående körning" (PO:s egen definition av
gruppen) när Läge=Manuell; konceptuellt samma roll som SP/Last, bara att
manöverdonet styrs direkt istället för via en regulator. Flaggas som ett
tolkningsval för PO att bekräfta, inte ett redan avgjort faktum.

**Visa PB** är inte heller uttryckligen placerad. Den är en
GRAF-VISNINGSINSTÄLLNING (om proportionalbandet ritas ut), inte en
reglertekniskt betydelsefull parameter i sig. Rekommendation:
Regulatorkonfiguration → Avancerat (den ändrar inget i simuleringen, bara
vad som visas — hör hemma bland fördjupningsfunktioner snarare än bland
Kp/Ti/Td). Flaggas som tolkningsval, samma skäl som ovan.

### 2.1 Vad Avancerat FAKTISKT gömmer, i siffror

Av dagens **45 kontroller** totalt: **23 blir grundnivå** (alltid synliga,
inom befintlig filtrering), **22 blir Avancerat** (11 Regulator: Kff +
Parameterstyrning-kryssrutan + 9 zonfält... se exakt uppdelning i avsnitt 3).
Det är nästan en halvering av vad en nybörjarstudent möter vid första
anblicken, utan att en enda kontroll försvinner ur appen.

### 2.2 Bör Processpåverkan ha en egen Avancerat-nivå?

**Rekommendation: nej, håll Processpåverkan FLACK** (ingen disklosyr-nivå),
av två skäl:
1. PO:s egen motivering för gruppen ("parametrar som ändras under pågående
   simulering") är i sig redan en avgränsning — allt i gruppen har samma
   konceptuella vikt (ett SP-steg är inte "mer avancerat" än en Puls, det är
   bara en annan sorts påverkan).
2. Last mag/Trigga last är redan addon-gated (bara synliga när Tillämpning
   tillåter Framkoppling OCH Läge ∈ {P, PI, PID}, se UX-002). Den gatingen
   fyller redan den funktion en Avancerat-sektion annars skulle haft här —
   ett andra disklosyr-lager ovanpå en redan smal, redan-filtrerad grupp vore
   överarbetat för det uppmätta antalet fält (2 av 7).

---

## 3. Vad ska ligga bakom respektive Avancerat-sektion — exakt lista

**Processinställning → Avancerat (7 fält):**
Olinjär ventilkarakteristik (kryssruta), Brytpunkt 1/2, K vid låg/mellan/hög
u (5 zonfält), Lastförstärkning.

**Regulatorkonfiguration → Avancerat (15 fält):**
Kff, Parameterstyrning (kryssruta), Brytpunkt 1/2, Zon 1/2/3 Kp/Ti/Td
(9 zonfält), Bumpless, Anti-windup, Visa PB.

Ingen ny "brytpunkter/zonparametrar"-kategori krävs utöver ovanstående — de
ÄR redan Parameterstyrnings/Ventilkarakteristiks egna undertabeller
(FEAT-044s `.zone-table`-mönster), inte en separat post att designa.

---

## 4. Hur ska lärstigar styra synligheten?

**Kärnproblem, samma som UX-003 avsnitt 4 identifierade för sitt förslag:**
en dedikerad lärstig (t.ex. `parameterstyrning-ventilkarakteristik.v1`,
`framkoppling.v1`) har SITT EGET ämne som huvudinnehåll — om Avancerat är
kollapsat by default även där, gömmer UI:t precis det lärstigen ska lära ut.
UX-004 måste lösa detta, till skillnad från UX-003:s förslag som lämnade
det olöst.

**Rekommendation: härled "Avancerat öppet" automatiskt från scenariots EGNA
värden, återanvänd samma signal som `deriveApplicationProfile()` redan
inspekterar — bygg INTE ett nytt lärstigsfält för normalfallet.**

Konkret regel: en grupps Avancerat-sektion öppnas automatiskt vid
scenarioladdning om det laddade scenariot har ett AKTIVT värde i något av
dess Avancerat-fält:
- Processinställning-Avancerat öppnas om `nonlinearGain.enabled` eller
  `auxGain !== 0` (och `!== undefined`) i scenariot.
- Regulatorkonfiguration-Avancerat öppnas om `gainSchedule.enabled` eller
  `kff !== 0`.

Detta är BILLIGT (ingen ny scenario-/lärstigsstruktur, samma mönster som
`deriveApplicationProfile()` redan etablerat i UX-002) och TRÄFFSÄKERT för
samtliga nuvarande lärstigar: `framkoppling.v1`s scenarier har redan
`kff !== 0`/`auxGain !== 0` satt (det är hela poängen med lärstigen) — båda
sektionerna öppnas alltså automatiskt utan någon ny taggning.

**Undantag som INTE fångas av regeln — kräver särskild hantering:**
**Bumpless och Anti-windup.** Båda är `true` i nästan alla scenarier
(standardvärde, inte ett tecken på att de är ämnet). En
"aktivt-värde"-regel skulle antingen aldrig öppna Avancerat för dem (om
kravet är "≠ default") eller alltid öppna det (om kravet bara är "satt över
huvud taget", vilket de nästan alltid är) — ingetdera är rätt för
`windup-antiwindup.v1`, vars HELA poäng är att visa Anti-windups effekt.

**Lösning:** ett nytt, valfritt boolean-fält per lärstigssteg,
`forceAdvancedOpen: ["regulator"]` (eller `["process"]`/båda), som
ÖVERSTYR den automatiska härledningen när den inte räcker till. Används
bara av de fåtal lärstigar där ämnet är en fält-EXISTENS snarare än ett
avvikande VÄRDE (`windup-antiwindup.v1` i dagsläget; potentiellt framtida
introduktionssteg som pratar OM en funktion innan den aktiveras).

**Sammanfattning:** härledning (billig, täcker de flesta fallen) +
explicit override (billig, täcker undantagen) — ingen lärstig behöver
manuellt taggas i det vanliga fallet.

---

## 5. Hur samverkar Tillämpning, Processmodell/Läge och lärsteg?

Tre lager, i ordning, var och en filtrerar vidare på föregående:

1. **Tillämpning** (UX-002, oförändrad): avgör vilka `processModels`,
   `modes` och `addons` som är MÖJLIGA överhuvudtaget. Ett fält vars addon
   inte ingår visas ALDRIG, oavsett Avancerat-status.
2. **Processmodell + Läge** (oförändrat, `updateProcessUIState()`/
   `updateControllerUIState()`): avgör vilka GRUNDFÄLT som är relevanta för
   just denna kombination (K/T/L vs Kv/Utflöde; Kp/Ti/Td per läge;
   Hyst. bara vid OnOff).
3. **Avancerat-status** (NY, detta uppdrag): för ett fält vars addon ÄR
   tillåtet av lager 1 — avgör om det visas direkt eller bakom en
   klickning. Härleds automatiskt från scenariots värden (avsnitt 4), med
   ett explicit override-fält för undantagsfallen.

Ett fält är alltså synligt om och endast om: (a) dess addon (om det har
någon) ingår i vald Tillämpning, OCH (b) dess Processmodell-/Läges-villkor
är uppfyllt, OCH (c) antingen är fältet grundnivå ELLER dess grupps
Avancerat-sektion är öppen. Samma "alla villkor samtidigt"-princip som redan
gäller i UX-002 (ingen ny sammansättningslogik, bara ett tredje villkor
tillagt).

---

## 6. Risker

1. **Discoverability-regression för Bumpless/Anti-windup** (störst risk).
   Dessa två flyttas till Avancerat trots att de INTE är addon-gated idag —
   de är alltid på/synliga för alla studenter. Att gömma dem bakom en klick
   riskerar att en student aldrig upptäcker att Anti-windup finns, särskilt
   om `forceAdvancedOpen` (avsnitt 4) missas för någon framtida lärstig.
   Mitigering: `windup-antiwindup.v1` MÅSTE verifieras explicit efter
   implementation (manuellt, inte bara programmatiskt) — den är den enda
   lärstigen där denna risk slår igenom idag.
2. **Två disklosyr-mekanismer på samma element.** `[data-addon].addon-hidden`
   (UX-002, Tillämpnings-styrd) och en ny Avancerat-kollapsad-klass verkar
   på SAMMA fält (t.ex. Kff har både addon="framkoppling" OCH tillhör
   Regulator-Avancerat). CSS-prioritetsordningen måste vara entydig: ett
   fält addon-dolt av Tillämpning ska förbli dolt OAVSETT Avancerat-status;
   ett fält vars addon är tillåtet men vars Avancerat-sektion är stängd ska
   döljas av DEN anledningen. Kräver att de två mekanismerna kombineras med
   AND, inte skrivs över varandra — en konkret implementationsrisk att
   specificera noga i nästa kodrunda, inte bara "det löser sig".
3. **`.param-group`s flexbox-layout (UX-002) möter en ny nästlad
   kollapsbar sektion.** Dagens `display:flex;flex-wrap:wrap` på hela
   gruppen antar platta fält i följd. En Avancerat-underrubrik + dess fält
   måste bryta flödet utan att förstöra radbrytningen för resten av
   gruppen — löses troligen med en egen flex-container per Avancerat-block,
   men är en implementationsdetalj att lösa i kodrundan, inte här.
4. **"Framtida processtillägg"** i PO:s uppdrag är per definition
   odesignat — risk att bygga en generisk "N framtida tillägg"-plats i
   Avancerat innan ett konkret tillägg (Kvotreglering, konisk tank för
   Nivåprocess) finns att fylla den med. Rekommendation: bygg Avancerat för
   de tillägg som FINNS idag (Ventilkarakteristik, Lastförstärkning,
   Parameterstyrning, Kff, Bumpless, Anti-windup, Visa PB) — lägg till
   platser för nya när de faktiskt byggs, inte i förväg. Samma princip
   STRAT-001 själv förespråkade ("bygg inte en generisk N-slinge-motor i
   förväg").
5. **Regressionsyta mot samtliga 12 lärstigar, ett tredje lager ovanpå
   redan granskad kod.** Kräver en fullständig omkörning av samma
   programmatiska metod som UX-002 använde (ladda varje scenario, verifiera
   både Tillämpnings-derivering OCH Avancerat-härledning), inte bara
   återanvänd gammal verifiering.
6. **`forceAdvancedOpen` är ett nytt, manuellt underhållet lärstigsfält.**
   Till skillnad från avsnitt 4:s automatiska härledning (som "bara
   fungerar" utifrån befintliga scenariovärden) kräver detta fält att någon
   kommer ihåg att sätta det för framtida lärstigar av samma typ som
   `windup-antiwindup.v1`. Litet men reellt underhållsansvar, värt att
   dokumentera tydligt i lärstigsmallen när det byggs.

---

## 7. Konkret layoutförslag

Samma `.param-group`-mönster som idag (kollapsbar hel grupp via
`▼`-knappen, oförändrat), men med en NY, nästlad kollapsbar rad mellan
grundfälten och den befintliga gruppgränsen:

```
┌ Processinställning ▼ ──────────────────────────────────────┐
│ Tillämpning ▾   Processmodell ▾   K [__]  T [__]  L [__]    │
│ Normalvärde [__]                                            │
│                                                               │
│ ▸ Avancerat (2 dolda)                        [klicka för att visa] │
└───────────────────────────────────────────────────────────┘

… vid öppnad Avancerat-sektion (t.ex. under framkoppling.v1) …

┌ Processinställning ▼ ──────────────────────────────────────┐
│ Tillämpning ▾   Processmodell ▾   K [__]  T [__]  L [__]    │
│ Normalvärde [__]                                            │
│                                                               │
│ ▾ Avancerat                                                  │
│   Lastförstärkning [__]                                     │
│   ☐ Olinjär ventilkarakteristik                              │
└───────────────────────────────────────────────────────────┘
```

Samma mönster för Regulatorkonfiguration (Avancerat innehåller Kff,
Parameterstyrning + dess 9 zonfält, Bumpless, Anti-windup, Visa PB).
Processpåverkan får INGEN Avancerat-rad (avsnitt 2.2) — ser ut som dagens
Störningar-grupp, bara med SP och Manuell u tillagda och U min/U max
flyttade ut.

**Detaljer:**
- "Avancerat"-raden återanvänder FEAT-044s redan etablerade
  `.zone-table`-hopfällningsmönster (samma interaktion studenten redan känner
  igen från Parameterstyrnings zontabell) — inte en ny komponenttyp att lära
  ut.
- Räknaren ("2 dolda") hjälper en student förstå att det FINNS mer, utan att
  det tar plats — särskilt viktigt givet risk 1 (discoverability).
- Öppen/stängd Avancerat-status är UI-tillstånd, inte scenario-tillstånd —
  härleds vid varje scenarioladdning (avsnitt 4), sparas inte i
  `localStorage` (samma princip som UX-002: Tillämpning sparas heller inte
  mellan sidladdningar).

---

## 8. Sammanfattning — svar på uppdragets sju punkter

1. **Informationsarkitektur:** tre grupper enligt avsnitt 2:s tabell, U
   min/U max flyttade till Regulatorkonfiguration, SP/Manuell u till
   Processpåverkan.
2. **Alltid synligt:** 23 grundfält (avsnitt 2/2.1), filtrerade som idag av
   Tillämpning/Processmodell/Läge.
3. **Bakom Avancerat:** 7 processfält + 15 regulatorfält, exakt lista i
   avsnitt 3.
4. **Lärstigspåverkan:** automatisk härledning från aktiva scenariovärden
   (återanvänder UX-002:s mönster) + ett nytt explicit
   `forceAdvancedOpen`-fält för undantagen (Bumpless/Anti-windup).
5. **Samspel Tillämpning/Processmodell/lärsteg:** tre lager i serie, `AND`
   mellan dem, se avsnitt 5.
6. **Risker:** sex identifierade, störst är discoverability-regressionen
   för Anti-windup/Bumpless (avsnitt 6.1) och de två disklosyr-mekanismernas
   CSS-samspel (avsnitt 6.2).
7. **Layoutförslag:** nästlad kollapsbar "Avancerat"-rad per grupp,
   återanvänder FEAT-044s etablerade mönster, se avsnitt 7.

Väntar på PO:s beslut/justeringar innan något implementeras.
