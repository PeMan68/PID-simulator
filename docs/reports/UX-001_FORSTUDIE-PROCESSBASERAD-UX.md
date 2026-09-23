# UX-001 — Förstudie: processbaserad användarmodell

**Datum:** 2026-09-20 (rev. 3, samma dag — PO:s svar på öppna frågor + genomläsning av `oppen-slinga-onoff-p.v1`)
**Uppdragsgivare:** PO (efter FEAT-042/FEAT-045, pausar ny reglerstrategiutveckling)
**Typ:** Förstudie/rekommendation — INGEN kod, ingen branch
**Underlag:** `apps/app/index.html`/`app.js` (dagens parametergrid), samtliga 12 DEV-lärstigar
(inkl. fullständig genomläsning av `oppen-slinga-onoff-p.v1.json` + dess tre
scenarier), `docs/reports/STRAT-001…005`, `docs/reports/FEAT-042_IMPLEMENTATION.md`,
`docs/reports/FEAT-045_IMPLEMENTATION.md`/`_ANVANDARTEST-ATGARDER.md`,
`docs/assets/diagrams/` (FEAT-046, Kvot-/Kaskaddiagrammen)

**Revisionsnotis:** Rev. 1 (samma dag) föreslog EN sammanslagen "kategori"-axel
(processdynamik + tillämpning ihopblandat). PO korrigerade: det är TVÅ separata
dimensioner (rev. 2). Rev. 3: PO har svarat på samtliga fyra öppna frågor från
rev. 2 (se avsnitt 6, nu markerade BESLUTADE) och bett om en separat
genomläsning av `oppen-slinga-onoff-p.v1` (ny avsnitt 4.1) samt att
kaskadreglering ska anta OBEROENDE processmodeller per slinga (avsnitt 1.1/2
uppdaterade). Nästa steg är beslutat: **UX-002** (Fas 0-implementation), se
separat registrering i `todo.md`.

---

## 0. Nuläge — hur stort är problemet, konkret

Parametergridet innehåller idag **45 kontroller** (41 fält + 4 rullgardiner) fördelat
på fyra grupper (Process/Regulator/Styrning/Störningar), varav:

- 5 fält är grundläggande PID (Kp/Ti/Td/SP/mode) — relevanta för ALLA studenter, alltid.
- 16 fält hör till FEAT-042 (Parameterstyrning: 2 brytpunkter + 3×3 Kp/Ti/Td;
  Ventilkarakteristik: 2 brytpunkter + 3×K) — relevanta bara för EN specifik,
  avancerad lärstig.
- 3 fält + 1 knapp hör till FEAT-045 (Framkoppling: Lastförstärkning, Kff, Last mag,
  Trigga last) — relevanta bara för EN annan specifik lärstig.
- Resten (K/T/L/normalvärde/utflöde/processtyp, umin/umax/manuellt, brus/puls) är
  process- eller lägesberoende men redan idag delvis dolda via `updateProcessUIState()`/
  `updateControllerUIState()`.

Synlighetsstyrningen som REDAN finns är alltså bara TVÅDIMENSIONELL: regulatorläge
(P/PI/PID/Manuell/OnOff) och processtyp (Självreglerande/Integrerande). Det finns
INGEN mekanism som frågar "vilken UPPGIFT/TILLÄMPNING håller studenten på med" —
en student som öppnar "kom igång"-lärstigen ser samma 45 kontroller som en som
specifikt övar Parameterstyrning. FEAT-042 och FEAT-045 exponerade bara detta
tydligare; problemet fanns latent redan innan.

Detta bekräftar PO:s bedömning: nästa reglerstrategi (Kvotreglering,
Kaskadreglering) skulle lägga till ytterligare ~8–12 fält vardera i SAMMA platta
lista, utan att någon student som inte jobbar med just den strategin någonsin får
nytta av dem.

---

## 1. Två separata dimensioner, inte en

PO:s korrigering av rev. 1: **Tillämpning** och **Processmodell** är olika
begrepp som ska väljas var för sig, inte en sammanslagen "kategori".

- **Processmodellen avgör DYNAMIKEN** — det är matematiken i `sim-core.js`
  (`ProcessModel.step()`s tre grenar: `self_regulating`, `self_regulating_2`,
  `integrating`). Motsvarar EXAKT dagens `processType`-fält, bara med tydligare
  namn (se avsnitt 1.2).
- **Tillämpningen avgör KONTEXTEN** — vilka parametrar som visas, vilka givare
  som finns, vilka reglerstrategier som är relevanta, och vilka lärstigar som
  hör hemma där. Detta är en HELT NY, ännu icke existerande dimension.

**Viktig pedagogisk princip (PO:s explicita krav):** de tre grundläggande
processmodellerna är centrala reglertekniska begrepp och ska förbli SYNLIGA och
BEGRIPLIGA för studenten — processmodellen får alltså inte tystas ner till en
dold, automatisk bakgrundsinställning. En tillämpning får FÖRVAL/BEGRÄNSA vilka
processmodeller som är meningsfulla att visa (se tabellen nedan), men det valda
alternativet ska stå tydligt märkt i UI:t, inte gömmas.

### 1.1 Tillämpning × giltiga processmodeller × tillägg

| Tillämpning | Giltiga processmodeller | Tillägg (reglerstrategier) | Givare |
|---|---|---|---|
| **Tvålägesreglering (On/Off)** | Självreglerande (enkapacitiv), Självreglerande (flerkapacitiv) | — | PV-givare |
| **Temperaturprocess** | Självreglerande (enkapacitiv), Självreglerande (flerkapacitiv) | Framkoppling, Parameterstyrning, Ventilkarakteristik | Temperaturgivare, ev. lastgivare |
| **Nivåprocess** | Integrerande | *(framtida)* Konisk tank, Parameterstyrning | Nivågivare |
| **Blandnings-/kvotprocess** *(framtida)* | Två självreglerande flöden (ett processmodellval PER flöde) | Kvotreglering | Två flödesgivare |
| **Kaskadreglerad process** *(framtida)* | Fritt, OBEROENDE processmodellval PER slinga (inre slinga, yttre slinga — kan skilja sig, t.ex. inre Självreglerande/yttre Integrerande, se avsnitt 6 punkt 3) | Kaskadreglering, ev. Framkoppling på yttre slingan | Två givare (inre + yttre) |
| **Fri utforskning** | Alla tre, fritt val — exakt som idag | Allt, oskalat | — |

Detta är PO:s egen struktur (relayerad i uppdraget), inte en omtolkning.

### 1.2 Namnförslag: förtydliga processmodellernas namn

Dagens `processType`-väljare heter "Självreglerande" / "Självreglerande 2:a
ordn." / "Integrerande". PO:s skiss använder "Självreglerande (enkapacitiv)" /
"Självreglerande (flerkapacitiv)" / "Integrerande" — tydligare reglerteknisk
terminologi (enkapacitiv/flerkapacitiv beskriver VARFÖR ordningen skiljer sig,
inte bara ATT den gör det). Rekommenderar att byta etiketterna i UI:t oavsett
om/när tillämpningsdimensionen byggs — en billig, fristående textändring som
inte kräver att vänta på resten av UX-001.

### 1.3 Varför "Fri utforskning" fortfarande krävs

Åtta av de tolv befintliga lärstigarna (`kom-igång`, `oppen-slinga-onoff-p`*,
`proportionalband-forstarkning`, `pi-pid`, `processbegransningar`,
`windup-antiwindup`, `storningar-robusthet`, `stegsvar-identifiering`,
`lambda-metoden`) undervisar grundläggande PID-begrepp utan någon
substansberättelse — de är MEDVETET generiska. (*`oppen-slinga-onoff-p.v1`
täcks numera delvis av den nya "Tvålägesreglering"-tillämpningen, se avsnitt 4
— men delar av den lärstigen är ren P-reglering utan on/off-koppling och passar
bättre som Fri utforskning.) Att tvinga alla in i en tillämpning vore en
konstlad omskrivning. De hör hemma i "Fri utforskning" — dagens UI, oförändrat.

---

## 2. Parametrar som bör visas

Uppdelat efter vilken DIMENSION som styr vad:

**Processmodellen styr (oförändrat mot idag, bara flyttad/omdöpt):**
- Självreglerande (enkapacitiv/flerkapacitiv): K, T, L, Normalvärde.
- Integrerande: Kv, Utflöde.

**Tillämpningen styr (den nya delen):**
- **Tvålägesreglering:** Hysteres låg/hög (redan lägesstyrda idag — flyttas
  konceptuellt hit). Inga strategitillägg.
- **Temperaturprocess:** "Tillägg"-flik (hopfällbar, FEAT-044s
  `.zone-table`-mönster) innehåller Framkopplingens 3 fält + Trigga last-knapp,
  OCH Parameterstyrnings/Ventilkarakteristiks 16 fält — samlade, INTE blandade
  med grundfälten.
- **Nivåprocess:** samma tilläggsprincip för en framtida konisk tank/
  Parameterstyrning-på-nivå.
- **Blandnings-/kvotprocess** *(framtida)*: två K/T/L-uppsättningar (en PER
  flöde, eftersom processmodellen väljs per flöde), kvotens brytpunkter.
- **Kaskadreglerad process** *(framtida)*: två fulla Kp/Ti/Td-uppsättningar
  (inre/yttre) OCH två separata processmodell-väljare (en per slinga) — detta
  är den enda tillämpningen där processmodell-valet i sig upprepas.
- **Fri utforskning:** allt, exakt som idag.

**Alltid synliga, oavsett tillämpning:** Kp, Ti, Td, SP, Läge (mode), Umin/Umax.

---

## 3. Funktioner som bör döljas

- **Tvålägesreglering:** döljer Ti/Td (on/off har ingen I/D-del), döljer alla
  strategitillägg (Framkoppling/Parameterstyrning ger inte mening i on/off-läge).
- **Temperaturprocess:** döljer Kv/Utflöde (integrerande-specifika), döljer
  Hysteres (on/off-specifik).
- **Nivåprocess:** döljer L som default (sällan pedagogisk poäng för nivå i
  nuvarande lärstigar), döljer Temperaturprocessens tillägg tills en
  nivåspecifik motsvarighet (konisk tank) byggs.
- **Blandnings-/kvotprocess, Kaskadreglerad process** *(framtida)*: döljer HELA
  dagens Regulator-grupp i sin nuvarande platta form — kräver egen layout, se
  Fas 2 nedan. Störst avvikelse från dagens UI-struktur.
- **INGEN tillämpning döljer själva processmodell-väljaren** — se den
  pedagogiska principen i avsnitt 1. Det som döljs/begränsas är vilka
  ALTERNATIV som visas i den (t.ex. Temperaturprocess visar bara de två
  självreglerande varianterna, inte Integrerande), inte väljaren själv.

---

## 4. Påverkan på lärstigar och övningar

**Ingen brytande ändring krävs för befintligt innehåll om detta byggs
ADDITIVT** (se migreringsväg, avsnitt 5): lärstigar som inte taggas körs i "Fri
utforskning" precis som idag, oförändrade.

**Lärstigar som bör TAGGAS mot en tillämpning + processmodell direkt när
mekanismen finns:**

| Lärstig | Tillämpning | Processmodell |
|---|---|---|
| `parameterstyrning-ventilkarakteristik.v1` | Temperaturprocess (Tillägg: Parameterstyrning + Ventilkarakteristik) | Självreglerande (enkapacitiv) |
| `framkoppling.v1` | Temperaturprocess (Tillägg: Framkoppling) | Självreglerande (enkapacitiv) |
| `integrerande-process-niva.v1` | Nivåprocess | Integrerande |
| `oppen-slinga-onoff-p.v1` | Blandad — se avsnitt 4.1, PER STEG, inte en enda tagg |  |

### 4.1 Genomläsning: `oppen-slinga-onoff-p.v1` (PO:s misstanke bekräftad)

Lärstigen har 5 steg, alla `self_regulating` (enkapacitiv) — processmodellen är
alltså konsekvent genom hela lärstigen, inget problem där. Men INNEHÅLLET
blandar tre skilda pedagogiska teman, precis som PO misstänkte:

| Steg | Typ | Tema | Passar tillämpning |
|---|---|---|---|
| 1 | Teori (`pid-intro`) | PV/SP/u/e — universella grundbegrepp | Ingen specifik (alla) |
| 2 | Scenario (`manual-open-loop`) | Öppen slinga (manuellt läge, ingen återkoppling) | Ingen specifik (alla) — konceptet "öppen vs sluten slinga" gäller lika mycket i en temperatur- som en nivåprocess |
| 3 | Teori (`onoff-theory`) | Hysteres | **Tvålägesreglering** |
| 4 | Scenario (`onoff-basic`) | On/off-oscillation | **Tvålägesreglering** |
| 5 | Scenario (`p-step-self-regulating`) | P-reglering, stationärt fel | Ingen specifik — grund för PID-tråden (se nedan) |

**Viktigt fynd:** steg 5 (P-reglering) är INTE en del av Tvålägesreglering-temat
alls — det är första länken i en separat kedja. `pi-pid.v1`s egen beskrivning
säger uttryckligen "Bygger vidare på P/PI-jämförelsen i **föregående lärstig**"
— dvs. steg 5 här är medvetet skrivet som förberedelse för `pi-pid.v1`s PI/PID-
jämförelse, inte som en fortsättning på on/off-temat i steg 3–4. Lärstigen är
alltså en sammanvävd "från ingenting till PID"-berättelse (öppen slinga → on/off
→ P → [nästa lärstig] PI → PID), inte en enda sammanhållen tillämpning.

**Rekommendation: DELA INTE UPP lärstigen nu.** Berättelsens ordning (öppen
slinga → on/off → P) har ett eget pedagogiskt värde som en progression — att
tvinga fram en uppdelning bara för att passa en UI-tagg vore att låta
verktyget styra innehållet, inte tvärtom. Lös det istället på TAGGNINGSNIVÅN:

**Design-implikation för Fas 1:** tillämpnings-taggen bör kunna sättas PER
LÄRSTIGSSTEG, inte bara per lärstig som ursprungligen skissat i avsnitt 5. Det
är billigare än det låter — appen växlar redan UI-tillstånd vid VARJE
scenariobyte (`loadScenarioByName()` triggar om `updateProcessUIState()`/
`updateControllerUIState()` för varje nytt steg), så att låta samma mekanism
även sätta tillämpning är en förlängning av ett mönster som redan finns, inte
en ny arkitektur. Konkret: steg 3–4 taggas `Tvålägesreglering`, steg 1/2/5
taggas `null`/ospecificerad (vilket kan betyda "ärv föregående" eller "Fri
utforskning" — ett designval för Fas 1, inte avgjort här).

**Framtida lärstigar (Kvotreglering/Kaskadreglering) bör byggas DIREKT mot sina
respektive tillämpningar**, inte mot dagens generiska UI följt av en
efterhandskonvertering.

**Övningsdokument** (`ovningar-*.md`) påverkas inte strukturellt — redan
fristående lösblad med egna processbeskrivningar i klartext.

---

## 5. Rekommenderad migreringsväg

**Fas 0 — additiv, låg risk, ingen ändring av scenarioformat eller sim-core:**
Två nya, kopplade väljare högst upp i sidopanelen:

1. **"Tillämpning"** (rullgardin, default: **Fri utforskning** — dagens fulla
   UI, exakt som nu).
2. **"Processmodell"** (radioknappar/rullgardin DIREKT under, filtrerad till
   de alternativ som är giltiga för vald tillämpning enligt tabellen i
   avsnitt 1.1) — detta ÄR dagens `processType`-fält, bara flyttat överst och
   med tydligare etiketter (avsnitt 1.2) och en begränsad, kontextuell
   alternativlista istället för alltid alla tre.

Ett val av tillämpning:
- Filtrerar `processType`-alternativen (steg 2 ovan) och väljer ett förval.
- Visar/döljer "Tillägg"-flikarna (Framkoppling/Parameterstyrning/
  Ventilkarakteristik), enligt tabellen i avsnitt 1.1 — samma
  `.style.display`-mönster som redan används för läges-/processtypsstyrning,
  bara ytterligare en dimension.

Processmodell-valet i sig fortsätter trigga EXAKT samma `updateProcessUIState()`
som idag. Ingen ändring i `sim-core.js`, inga nya scenario-fält, inga
befintliga lärstigar påverkas. **Detta är den delen jag skulle rekommendera som
ett första, avgränsat FEAT-uppdrag.**

**Fas 1 — koppla lärstigar till tillämpning+processmodell:** nya, valfria fält,
enligt tabellen i avsnitt 4. Genomläsningen av `oppen-slinga-onoff-p.v1`
(avsnitt 4.1) visar att taggen behöver kunna sättas PER STEG (`steps[].ref`-
nivå), inte bara per lärstig som i den första skissen — annars tvingas en
blandad lärstig in i en enda, felaktig tillämpning. Detta är en förlängning av
det UI-tillstånd som redan växlas om vid varje scenariobyte
(`loadScenarioByName()`), inte en ny mekanism.

**Fas 2 — Kvotreglering/Kaskadreglering som egna tillämpningar från start:**
designas DIREKT mot dedikerad layout (två regulatorer/kvotblock, kaskadens
per-slinga-processmodellval) — inte återanvänd platt fältlista. Motiverar
paus-beslutet: bygger man dem FÖRE denna grund finns, riskerar man att göra om
deras UI en andra gång.

**Explicit ICKE rekommenderat:** en genomgripande omskrivning av HELA
parametergridets HTML-struktur i ett steg. Additiv, opt-in filtrering (Fas 0)
ger nästan hela UX-vinsten till en bråkdel av risken mot de tolv befintliga,
redan PO-godkända lärstigarna.

---

## 6. Öppna frågor — PO:s svar (2026-09-20)

1. **BESLUTAT — gjort.** Namnbyte "Självreglerande 2:a ordn." →
   "Självreglerande (flerkapacitiv)" (och "Självreglerande" →
   "Självreglerande (enkapacitiv)" för konsekvens) genomfört direkt, oberoende
   av resten av UX-001. Se `todo-done.md` (UX-001b).
2. **BESLUTAT — gjort.** Genomläsning av `oppen-slinga-onoff-p.v1` klar, se
   avsnitt 4.1. PO:s misstanke bekräftad: lärstigen blandar tre teman
   (öppen slinga, Tvålägesreglering, P-reglerings-grund för `pi-pid.v1`).
   Rekommendation: dela INTE upp lärstigen, men Fas 1:s taggningsmekanism
   måste stödja per-steg-taggar, inte bara per lärstig.
3. **BESLUTAT.** Kaskadreglerings inre/yttre slinga ska kunna ha OLIKA,
   OBEROENDE processmodeller (PO: "kostar i princip inget i förstudiefasen att
   utgå från att de är oberoende"). Avsnitt 1.1/2 uppdaterade. Ingen
   implementation krävs nu — Fas 2:s design ska bara vara KOMPATIBEL med
   antagandet, inte begränsa det i förväg.
4. **BESLUTAT.** Tillämpningslistan (avsnitt 1.1: Tvålägesreglering,
   Temperaturprocess, Nivåprocess, Blandnings-/kvotprocess, Kaskadreglerad
   process, Fri utforskning) är komplett. Inga fler läggs till förrän ett
   verkligt behov uppstår.

**PO:s rekommenderade nästa steg (beslutat):** inte STRAT-006, inte
Kvotreglering, inte Kaskadreglering — utan **UX-002**, Fas 0 från avsnitt 5:
tillämpningsväljare + processmodellsväljare + visa/dölj-logik, inga ändringar
i `sim-core.js`, ingen ändring av scenarioformat, Fri utforskning som
standard. Se registrering i `todo.md`.
