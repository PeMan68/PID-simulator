# FEAT-044 — Statusrapport (gruppera zonfälten i en kompakt tabell)

**Datum:** 2026-09-22
**Skriven av:** Claude Code (CC), på uppdrag av PO
**Typ:** Statusrapport — ingen kod ändrad, ren analys av befintlig branch
**Underlag:** `feature/FEAT-044-zone-fields-table` (`f3503f7`), `develop`
(`7e6fc74`), `feature/UX-004-huvudyta-omstrukturering` (`bc02d90`), tre
provmergningar i engångs-worktrees (aldrig pushade, aldrig commitade till
någon riktig branch)

---

## 1. Sammanfattning

FEAT-044 är **implementerad och testad på källkodsnivå sedan 2026-09-19**,
men har **aldrig visuellt granskats i en webbläsare förrän denna rapport**.
Den är nu det, och layouten fungerar väl. **Huvudfrågan är inte längre "är
featuren klar" utan "i vilken ordning mergas den mot UX-004"** — de två
brancherna har skrivit om exakt samma HTML-region på oförenliga sätt. Denna
rapport kvantifierar konflikten konkret (inte bara "stor risk" som tidigare
handoff-dokument flaggat) och ger en rekommendation.

---

## 2. Vad FEAT-044 gör

**Uppdrag (PO:s observation under FEAT-042-testning):** FEAT-042s 11
regulatorschema-fält (2 brytpunkter + 3×3 Kp/Ti/Td) och 5 processchema-fält
låg utspridda som enskilda `.field`-rutor — rörigt, svårt att se vilket fält
som hör till vilken zon.

**Lösning:** Zonfälten omstrukturerade till en kompakt `<table class="zone-table">`
(en rad per zon, en kolumn per parameter) istället för utspridda `.field`-rutor.
Brytpunktsfälten ligger kvar oförändrade utanför tabellen. Aktiv-zon-highlighten
(FEAT-042) flyttades från per-fält-ram till helmarkerad tabellrad
(`GS_ZONE_ROWS`/`NG_ZONE_ROWS` i `app.js`, samma orange/grön-färgkodning som
tidigare). Ingen ändring i `sim-core.js`, inga nya fält-ID:n, inga ändrade
`fields{}`-referenser — rent HTML-/CSS-/highlight-omstrukturering.

**Omfattning:** 29 ändrade rader i `app.js`, 128 ändrade rader i `index.html`
(mätt mot branchens egen bas, INTE mot dagens `develop` — se avsnitt 3 för
varför den skillnaden spelar roll).

---

## 3. Branchens ålder — varför en naiv diff mot `develop` missvisar

`feature/FEAT-044-zone-fields-table` grenade från `develop` **2026-09-19**,
**innan UX-002 mergades** (2026-09-21) och långt innan UX-003/UX-004. En diff
rakt mot dagens `develop` visar ~4200 rader skillnad — det är nästan
uteslutande ALLT ANNAT som hänt på `develop` sedan dess (UX-002, FEAT-045,
samtliga rapporter), inte FEAT-044s eget arbete. Branchens egna, faktiska
ändringar (avsnitt 2 ovan) är begränsade till zonfälten.

35 commits ligger mellan FEAT-044s branch-punkt och dagens `develop`,
varav 10 rör `index.html`/`app.js`.

---

## 4. Faktisk konfliktyta — mätt, inte gissad

Jag körde tre provmergningar i tillfälliga, engångs-`git worktree`-kataloger
(aldrig commitade eller pushade till någon riktig branch — rena mätningar):

### 4a. FEAT-044 → dagens `develop` (utan UX-004)
**1 konflikt, i `index.html`, 22 rader — rent kosmetisk.** `app.js` mergas
automatiskt utan konflikt. Konflikten är att UX-002 lade till
`flex: 0 0 auto; min-width: 90px` på `.field`-CSS-regeln samtidigt som
FEAT-044 lade till sina `.zone-table`-CSS-regler alldeles intill — två
oberoende tillägg nära varandra i samma fil, inte en motsägelse. Löses genom
att slå ihop båda CSS-tilläggen, inget beslut krävs.

### 4b. FEAT-044 → `feature/UX-004-huvudyta-omstrukturering` (dagens tip)
**3 konflikter i `index.html`, varav 2 är STRUKTURELLA, inte bara textuella:**

1. Samma kosmetiska CSS-konflikt som i 4a (~70 rader, men samma enkla lösning).
2. **Processinställningens Avancerat-sektion:** FEAT-044s sida av konflikten
   försöker lägga in `ngZ1K`/`ngZ2K`/`ngZ3K` som tre separata `.field`-rutor
   (den GAMLA strukturen den grenade från) på exakt den plats där UX-004
   redan lagt in dem SOM en `.zone-table`. Git förstår inte att FEAT-044s
   tabellmarkup ska in I UX-004s `advancedFieldsProcess`-sektion — den
   försöker återskapa den gamla, ogrupperade strukturen ovanpå den nya.
3. **Regulatorkonfigurationens Avancerat-sektion + gränsen mot gamla
   "Styrning"-gruppen:** Samma problem, större skala (~170 rader). FEAT-044s
   sida försöker lägga in HELA den gamla Parameterstyrnings-`.zone-table`
   PLUS Bumpless/Anti-windup/Visa PB/Hyst.-fälten PLUS en hel gammal
   "Styrning"-grupp (SP/U min/U max) — allt i den gamla, fyrgruppsstrukturen
   UX-004 redan ersatt med Processinställning/Regulatorkonfiguration/
   Processpåverkan. En mekanisk "behåll båda sidor" hade gett dubbla
   `id`-attribut och en spöklik gammal "Styrning"-grupp bredvid den nya
   Processpåverkan.

**`app.js` mergas fortfarande HELT automatiskt, utan konflikt** — FEAT-044s
`GS_ZONE_ROWS`/`NG_ZONE_ROWS`-omskrivning och UX-004s ändringar (Auto/Manuell-
togglen, Visa PB-flytten, visibilityOverride m.m.) rör olika delar av filen.
**Hela konflikten är begränsad till `index.html`, ingen logik i `app.js`
behöver skrivas om.**

**Slutsats:** konflikten är verklig och kräver manuell HTML-reorganisering
(uppskattningsvis 1–2 timmars fokuserat arbete: flytta FEAT-044s tre
`<table>`-block in i UX-004s redan existerande Avancerat-sektioner istället
för att låta dem återskapa den gamla gruppstrukturen), men den är **avgränsad
och väl förstådd** — inte det öppna, obestämda "stor omskrivning krävs" som
tidigare handoff-dokument (2026-09-21) flaggade innan denna mätning gjordes.

---

## 5. Visuell verifiering — gjord nu, för första gången

FEAT-044 har ALDRIG körts i en webbläsare förrän denna rapport (tidigare
sessioner saknade webbläsartillgång, se `docs/tracking/todo.md`s FEAT-044-post:
"Ingen webbläsartest genomförd"). Jag startade branchen i en isolerad
`git worktree` (rörde inte huvudarbetskatalogen), körde den i headless Chrome
via Chrome DevTools Protocol, och laddade scenariot "Olinjär ventilkarakteristik
— Parameterstyrning aktiv" (aktiverar BÅDA zonfunktionerna samtidigt) plus
10 simuleringssteg.

**Resultat: layouten fungerar väl.**
- Båda `.zone-table`-tabellerna (K-tabellen för Ventilkarakteristik, Kp/Ti/Td-
  tabellen för Parameterstyrning) renderar korrekt, tre rader vardera.
- Aktiv-zon-highlighten fungerar: Zon 1 var aktiv i båda tabellerna vid det
  testade tillståndet, och båda rader var korrekt färgmarkerade (grön för
  processchemat, orange för regulatorschemat) — matchar statusradens
  "Zon 1 (Kp=5.0) | K-zon 1 (K=0.5)".
- Layouten är kompakt utan att kännas trång — tabellformatet gör det tydligt
  vilket värde som hör till vilken zon, precis det uppdraget efterfrågade.
- Inga visuella buggar upptäckta.

Ingen skärmdump bifogas i denna fil (headless verifiering, inget
skärmdumpsflöde etablerat för `docs/reports/`) — kan tas fram på begäran.

---

## 6. Regressionstest

Branchens egen testsvit (6 filer: `activity-prototype`, `build-preview`,
`feat-042-gain-schedule`, `feat-043-extend-max-steps`,
`hotfix-2026-014-bumpless-reset`, `hotfix-v1.4.1-facit-env`) + DEV-/PROD-
innehållsvalidering + PROD-byggvalidering — samtliga gröna, körda på nytt
idag (branchen har inget eget dedikerat testfilnamn för just zontabell-
omstruktureringen, men ingen av de befintliga 6 filerna bröts).

---

## 7. Öppna punkter — beslut som väntar på PO

1. **Mergeordning FEAT-044 vs. UX-004** (den återkommande, ännu olösta
   frågan sedan HANDOFF_2026-09-21). Två realistiska vägar:
   - **A: Merga FEAT-044 till `develop` FÖRST** (nästan konfliktfritt, se
     avsnitt 4a), låt UX-004 sedan rebasas/byggas om ovanpå den redan
     mergade zontabell-strukturen. Kräver att UX-004-branchen uppdateras
     (dess Avancerat-sektioner måste byggas kring `.zone-table` istället för
     de gamla `.field`-raderna) — men UX-004 väntar ändå på PO:s
     visuella granskning, så ett omtag där är inte bortkastat arbete.
   - **B: Merga UX-004 FÖRST** (redan visuellt granskad och godkänd av PO
     vid det laget, om så blir fallet), lös sedan FEAT-044s tre
     konflikthärdar manuellt (avsnitt 4b) som en egen, avgränsad uppgift.
   - **Rekommendation:** A är enklare och säkrare — FEAT-044 mot `develop`
     är en nästan-ickehändelse (en CSS-rad att slå ihop), medan FEAT-044 mot
     UX-004 kräver att någon manuellt vet vad de gör i tre HTML-regioner.
     Men detta är ett PO/PM-beslut, inte ett CC ska ta ensidigt — särskilt
     eftersom UX-004 väntar på egen granskning just nu.
2. **PO:s visuella godkännande av FEAT-044s layout** (avsnitt 5) — själva
   featuren är nu verifierad fungera väl, men PO har inte själv sett den.
3. Ingen ändring gjord i denna rapport — inget beslut om mergeordning eller
   godkännande har fattats åt PO:s vägnar.

---

## 8. Vad som INTE gjordes i denna rapport

- Ingen kod ändrades, varken på `develop`, `feature/UX-004-…` eller
  `feature/FEAT-044-…`.
- Ingen faktisk merge genomfördes — samtliga tre provmergningar kördes i
  bortkastade `git worktree`-kataloger som togs bort direkt efteråt
  (`git worktree remove`), aldrig commitade eller pushade.
- Inget mergeordning-beslut fattat — avsnitt 7 är en rekommendation, inte
  ett genomfört val.
