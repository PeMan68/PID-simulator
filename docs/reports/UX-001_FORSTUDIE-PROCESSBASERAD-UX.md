# UX-001 — Förstudie: processbaserad användarmodell

**Datum:** 2026-09-20
**Uppdragsgivare:** PO (efter FEAT-042/FEAT-045, pausar ny reglerstrategiutveckling)
**Typ:** Förstudie/rekommendation — INGEN kod, ingen branch
**Underlag:** `apps/app/index.html`/`app.js` (dagens parametergrid), samtliga 12 DEV-lärstigar,
`docs/reports/STRAT-001…005`, `docs/reports/FEAT-042_IMPLEMENTATION.md`,
`docs/reports/FEAT-045_IMPLEMENTATION.md`/`_ANVANDARTEST-ATGARDER.md`,
`docs/assets/diagrams/` (FEAT-046, Kvot-/Kaskaddiagrammen)

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

## 1. Förslag på process-/tillämpningskategorier

Jag utgår från PO:s fyra exempel men föreslår en justering: **Parameterstyrning
och Ventilkarakteristik (FEAT-042) är inte substansspecifika** — de handlar om att
processens egen förstärkning varierar med driftpunkt/utsignal, vilket kan hända i
en temperaturprocess LIKA GÄRNA som i en nivå- eller flödesprocess. De passar
därför bättre som en **avancerad tilläggsmodul** som kan slås på INOM en kategori,
inte som en egen kategori. Framkoppling, Kvotreglering och Kaskadreglering är
däremot strukturellt kopplade till en viss processform (en mätbar störning, två
flöden, två nästlade slingor) och blir naturliga EGNA kategorier.

| Kategori | Processdynamik | Kärnstrategi(er) | Avancerat (valbart) | Givare |
|---|---|---|---|---|
| **Temperaturprocess** | Självreglerande | PID | + Framkoppling, + Parameterstyrning/Ventilkarakteristik | Temperaturgivare (PV), ev. lastgivare |
| **Nivåprocess** | Integrerande (+ konisk tank, framtida STRAT-002-uppföljning) | PID/PI | + Parameterstyrning/Ventilkarakteristik (konisk tank = K beroende av PV) | Nivågivare |
| **Blandnings-/kvotprocess** *(framtida)* | Två parallella självreglerande/flödesprocesser | Kvotreglering + PID | — | Två flödesgivare |
| **Kaskadreglerad process** *(framtida)* | Två nästlade slingor (valfri inre/yttre dynamik) | Kaskadreglering (yttre+inre PID) | + Framkoppling på yttre slinga | Två givare (inre + yttre) |
| **Fri utforskning / Avancerat** | Alla, fritt val | Allt, oskalat (dagens UI) | — | — |

**Varför en femte kategori ("Fri utforskning") är nödvändig:** åtta av de tolv
befintliga lärstigarna (`kom-igång`, `oppen-slinga-onoff-p`,
`proportionalband-forstarkning`, `pi-pid`, `processbegransningar`,
`windup-antiwindup`, `storningar-robusthet`, `stegsvar-identifiering`,
`lambda-metoden`) undervisar grundläggande PID-begrepp (P/PI/PID, windup,
störningar, identifiering) utan någon substansberättelse — de är MEDVETET
generiska (se `ovningar-reglerstrategier.md`s egen ram: "processer i allmänhet",
inte ett specifikt exempel). Att tvinga in dem i "Temperaturprocess" skulle vara
en konstlad omskrivning utan pedagogiskt värde. De hör hemma i ett neutralt,
"tekniskt" läge — precis dagens UI, oförändrat.

---

## 2. Parametrar som bör visas per kategori

**Alltid synliga, oavsett kategori (5 fält):** Kp, Ti, Td, SP, Läge (mode) — samt
Umin/Umax (säkerhetsgränser, alltid relevanta).

**Temperaturprocess:** K, T, L, Normalvärde (processtyp låst till Självreglerande,
fältet självt dolt — kategorin ÄR valet). "Avancerat"-flik: Lastförstärkning, Kff,
Last mag, Trigga last (Framkoppling) + Parameterstyrnings/Ventilkarakteristiks 16
fält, samlade under en TYDLIGT separat, hopfällbar "Avancerad reglering"-sektion
(byggd på FEAT-044s redan etablerade `.zone-table`-mönster) — INTE blandade med
grundfälten.

**Nivåprocess:** Kv, Utflöde (processtyp låst till Integrerande). Samma
"Avancerat"-flik-princip om/när en konisk tank-variant (STRAT-002s öppna fråga)
byggs.

**Blandnings-/kvotprocess** *(när den byggs)*: två uppsättningar K/T/L (Flöde A,
Flöde B), kvotens brytpunkter/förhållande — INGA Parameterstyrnings-/
Framkopplingsfält alls (skulle inte vara meningsfullt i denna kategori, se STRAT-001
om varför Kvotreglering är strukturellt fristående).

**Kaskadreglerad process** *(när den byggs)*: två fulla Kp/Ti/Td-uppsättningar
(inre/yttre), två SP-relaterade fält (yttre SP, inre SP beräknas), separata
Umin/Umax per slinga om det behövs.

**Fri utforskning/Avancerat:** allt, exakt som idag — ingen ändring.

---

## 3. Funktioner som bör döljas per kategori

- **Temperaturprocess:** döljer Kv/Utflöde (integrerande-specifika), döljer
  Hysteres-fälten (OnOff-specifika, redan dolda via läge — oförändrat), döljer
  Kvot-/Kaskad-relaterade fält (finns inte än, men reserverar principen).
- **Nivåprocess:** döljer L (dötid sällan relevant pedagogisk poäng för nivå i
  nuvarande lärstigar), döljer Framkopplings-/Parameterstyrningsfälten som
  DEFAULT (kan slås på i Avancerat-fliken om en konisk tank-lärstig byggs).
- **Blandnings-/kvotprocess, Kaskadreglerad process:** döljer i princip HELA
  dagens Regulator-grupp i sin nuvarande platta form — ersätts av
  kategorispecifik layout (två regulatorer, eller en regulator + ett kvotblock).
  Detta är den STÖRSTA avvikelsen från dagens UI-struktur och kräver egen
  design (se avsnitt 5, Fas 2).
- **Alla kategorier utom Avancerat:** döljer processtyp-väljaren själv (låst av
  kategorivalet) — en student som valt "Temperaturprocess" ska inte kunna råka
  ställa om till Integrerande och få ett inkonsekvent UI.

---

## 4. Påverkan på lärstigar och övningar

**Ingen brytande ändring krävs för befintligt innehåll om kategorivalet byggs
ADDITIVT** (se migreringsväg, avsnitt 5): åtta generiska lärstigar körs i
"Avancerat"-läge precis som idag, oförändrade.

**Två lärstigar bör TAGGAS mot en kategori direkt när mekanismen finns:**
- `parameterstyrning-ventilkarakteristik.v1` → **Temperaturprocess (Avancerat
  på)** — den använder redan `self_regulating` genomgående (ventil-exemplen).
  Att öppna lärstigen skulle då automatiskt sätta rätt kategori OCH expandera
  "Avancerad reglering"-fliken åt studenten, istället för att de möter alla 45
  fält direkt.
- `framkoppling.v1` → **Temperaturprocess (Avancerat på, Framkoppling)** —
  redan byggd kring en värmeväxlare (FEAT-045-beslutet om konkret
  processexempel), passar exakt.

**`integrerande-process-niva.v1`** → **Nivåprocess** — redan en nivålärstig
till namnet, naturlig kandidat, kräver ingen innehållsändring, bara en
kategori-tagg.

**Framtida lärstigar (Kvotreglering/Kaskadreglering) bör byggas DIREKT mot sina
respektive kategorier**, inte mot dagens generiska UI följt av en efterhandskon-
vertering — det undviker att upprepa exakt det tekniska underhållsproblem PO
identifierat nu.

**Övningsdokument** (`ovningar-*.md`) påverkas inte strukturellt — de är redan
fristående lösblad med egna processbeskrivningar i klartext. Möjlig framtida
förbättring (inte del av detta uppdrag): nämna vilken UI-kategori ett
övningsdokument förutsätter, i dess inledning.

---

## 5. Rekommenderad migreringsväg

**Fas 0 — additiv, låg risk, ingen ändring av scenarioformat eller sim-core:**
Ny rullgardin högst upp i sidopanelen: "Tillämpning" (default: **Avancerat** —
dagens fulla UI, exakt som nu). Ett val av t.ex. "Temperaturprocess" gör TVÅ
saker, rent i UI-lagret (`app.js`):
1. Sätter `processType`-fältet (dolt) och triggar `updateProcessUIState()` som
   idag.
2. Filtrerar vilka `.param-group`/fält som visas, via en ny, liten
   `applicationProfiles`-tabell (fält→kategorier den hör hemma i) — samma
   `.style.display`-mönster som redan används för läges-/processtyp-styrning,
   bara en tredje dimension.

Ingen ändring i `sim-core.js`, inga nya scenario-fält, inga befintliga lärstigar
påverkas (de fortsätter köra i "Avancerat"). **Detta är den delen jag skulle
rekommendera som ett första, avgränsat FEAT-uppdrag**, eftersom den ensam redan
löser huvudklagomålet (för många synliga kontroller) utan att röra något som
redan fungerar.

**Fas 1 — koppla lärstigar till kategorier:** nytt, valfritt fält
`applicationCategory` i lärstigs-JSON:en (läses av `loadPath()`), så att
`parameterstyrning-ventilkarakteristik.v1`/`framkoppling.v1`/
`integrerande-process-niva.v1` automatiskt sätter rätt kategori + expanderar
rätt "Avancerat"-flik när studenten öppnar dem — ingen manuell
kategoriväljning krävs mitt i en guidad lärstig.

**Fas 2 — Kvotreglering/Kaskadreglering som egna kategorier från start:** när
dessa strategier faktiskt byggs (separata STRAT-/FEAT-uppdrag, se STRAT-001),
designas deras UI DIREKT mot en dedikerad layout (två regulatorer/kvotblock,
inte återanvända Regulator-gruppens platta fältlista) — det är den delen av
Fas 0/1:s modell som inte är en ren visa/dölj-filtrering, utan kräver ny HTML-
struktur. Motiverar varför PO:s paus av ny reglerstrategiutveckling till dess
är rätt ordning: bygger man Kvot/Kaskad FÖRE denna UX-grund finns, riskerar man
att behöva göra om deras UI en andra gång.

**Explicit ICKE rekommenderat:** att börja med en genomgripande omskrivning av
HELA parametergridets HTML-struktur i ett steg. Risken för regressioner i de
tolv befintliga, redan PO-godkända lärstigarna är för hög för nyttan — additiv,
opt-in filtrering (Fas 0) ger nästan hela UX-vinsten till en bråkdel av risken.

---

## 6. Öppna frågor till PO

1. Ska "Avancerat" vara namnet, eller föredrar du något annat (t.ex. "Fri
   utforskning", "Alla parametrar")?
2. Ska Parameterstyrning/Ventilkarakteristik verkligen vara en TILLVALS-flik
   inom Temperaturprocess/Nivåprocess (min rekommendation, avsnitt 1), eller
   ska de förbli en egen, fristående kategori/lärstig som idag?
3. Är kategorilistan i avsnitt 1 komplett, eller finns fler tillämpningar du
   vill se (t.ex. en renodlad "OnOff-process", som idag inte har någon
   substansberättelse alls)?

Inget av ovanstående är implementerat. Ingen branch skapad.
