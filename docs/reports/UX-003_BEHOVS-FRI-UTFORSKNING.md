# UX-003 — Behövs Fri utforskning?

**Datum:** 2026-09-21
**Uppdragsgivare:** PO (efter UX-002:s tredje kodrunda, innan mergebeslut)
**Typ:** Analys/rekommendation — INGEN kod, ingen branch (per uppdragets
explicita instruktion)
**Underlag:** `apps/app/app.js` (`APPLICATION_PROFILES`,
`deriveApplicationProfile()`, `applyApplicationProfile()`,
`updateFramkopplingVisibility()`), `docs/reports/UX-001_FORSTUDIE-PROCESSBASERAD-UX.md`,
`docs/reports/UX-002_SYNLIGHETSGRANSKNING.md`, `docs/reports/STRAT-001_FORSTUDIE-REGLERSTRATEGIER.md`
(Kvot-/Kaskadreglerings byggordning och återanvändningsplan), samtliga 12
DEV-lärstigars scenarioreferenser

---

## 0. Rekommendation i korthet

**Alternativ A — behåll Fri utforskning, men skärp dess ROLL (ingen kodändring
krävs för det).** Alternativ B löser ett verkligt, men FRAMTIDA problem
(skalbarhet när Kvot-/Kaskadreglering tillkommer) till priset av ett nytt,
olöst hål just nu: det finns inte längre någon plats för de åtta lärstigar som
UX-001 redan fastslog är MEDVETET kontextlösa. Se avsnitt 4 för den fulla
motiveringen och avsnitt 6 för en migreringsväg ifall PO ändå väljer B.

---

## 1. Nulägesanalys — hur stor är skillnaden faktiskt?

PO:s iakttagelse är sakligt korrekt, och mer extrem än den kanske verkar vid
en snabb titt. Med dagens `APPLICATION_PROFILES` (efter tredje kodrundan):

```js
fri:        { processModels: [self_regulating, self_regulating_2, integrating], modes: [alla 5], addons: [alla 3] },
temperatur: { processModels: [self_regulating, self_regulating_2],              modes: [alla 5], addons: [alla 3] },
```

**`modes` och `addons` är identiska.** Den ENDA skillnaden mellan Fri
utforskning och Temperaturprocess är om Integrerande erbjuds som
Processmodell-alternativ. Det är allt.

Jag körde en fullständig sökning: **inget av de 12 lärstigarnas 30+
scenariosteg kombinerar `process.type === "integrating"` med något strategi-
tillägg** (Framkoppling/Parameterstyrning/Ventilkarakteristik). Den enda
lärstigen som använder Integrerande (`integrerande-process-niva.v1`) härleds
redan korrekt till Nivåprocess, som saknar addons helt. Fri utforskning
öppnar alltså idag ett kombinationsutrymme (Integrerande + valfritt tillägg)
som **inget shippat innehåll använder** — bara en student som fritt
experimenterar skulle nå det.

Det förklarar PO:s intryck fullt ut: i praktiken, för allt existerande
innehåll, är Fri utforskning och Temperaturprocess samma UI.

---

## 2. Vad Fri utforskning FAKTISKT gör idag (utöver ovanstående)

Två separata roller, värda att hålla isär eftersom de har olika vikt i
resten av analysen:

**Roll 1 — "sandlåda utan begränsningar".** Den enda tillämpningen som
principiellt tillåter VILKEN kombination som helst, inklusive sådana ingen
lärstig använder än (Integrerande + Framkoppling, Integrerande +
Parameterstyrning). Pedagogiskt legitimt som ett "vad händer om jag
provar..."-läge, men i dagsläget oanvänt av innehållet.

**Roll 2 — default-hemvist för generiskt innehåll.** Åtta av tolv lärstigar
(`kom-igång`, `oppen-slinga-onoff-p`* (delvis), `proportionalband-forstarkning`,
`pi-pid`, `processbegransningar`, `windup-antiwindup`, `storningar-robusthet`,
`stegsvar-identifiering`, `lambda-metoden`) härleds till `fri`, men INTE för
att de behöver Integrerande-alternativet — samtliga använder uteslutande
Självreglerande-processer. De hamnar där enbart för att
`deriveApplicationProfile()`s SISTA `else`-gren returnerar `"fri"` när inget
annat matchar. UX-001 avsnitt 1.3 slog fast VARFÖR de hör hemma där: de är
**medvetet kontextlösa** — att tvinga in dem i "Temperaturprocess" vore "en
konstlad omskrivning" av innehåll som lär ut PID-grunder utan någon
substansberättelse.

**Detta är den avgörande skillnaden mellan rollerna:** Roll 1 är en
processmodell-fråga (vilka `processModels`/`addons` tillåts) — det är den roll
PO:s fråga siktar på. Roll 2 är en SEMANTISK fråga (finns det ett läge som
uttryckligen betyder "ingen specifik tillämpning", till skillnad från "en
tillämpning som råkar tillåta allt") — och den rollen försvinner inte bara för
att Roll 1 byggs om.

---

## 3. Alternativ A — behåll Fri utforskning

### Pedagogiska konsekvenser
Neutrala till svagt negativa som det ser ut NU (två nästan identiska
tillämpningar är förvirrande att välja mellan), men problemet är litet och
billigt att åtgärda utan att ta bort begreppet — se avsnitt 5.

### UX-konsekvenser
Ingen förändring från dagens (redan PO-granskade, tre gånger justerade) UI.
Ingen ny interaktionsmekanism att lära sig.

### Påverkan på lärstigar
Ingen. Samtliga 12 lärstigar fortsätter härledas exakt som idag (verifierat i
UX-002-granskningen, avsnitt 4).

### Påverkan på framtida Kvotreglering
Enligt STRAT-001 återanvänder Kvotreglering Framkopplings hjälpsignal och blir
en egen, ny tillämpning (`Blandnings-/kvotprocess`) med två K/T/L-uppsättningar
(en per flöde). Fri utforskning berörs inte strukturellt — men **måste
underhållas manuellt**: när Kvotreglering byggs måste någon komma ihåg att
lägga till dess tillägg i `fri.addons` också, annars blir Fri utforskning
inkonsekvent (tillåter allt UTOM det nyaste tillägget). Litet men reellt
underhållsansvar.

### Påverkan på framtida Kaskadreglering
Samma manuella underhållspunkt som ovan, fast Kaskadreglering enligt STRAT-001
ändå kräver en helt egen layout (dubblerad regulator/process/UI/graf) — Fri
utforskning skulle troligen INTE kunna erbjuda kaskad på samma enkla sätt som
den erbjuder dagens tillägg (en flat parameterlista har ingen naturlig plats
för två fulla Kp/Ti/Td-uppsättningar). Det är alltså redan idag osäkert om
"Fri utforskning ska kunna göra allt Kaskadreglerad process kan" är ens en
rimlig ambition — vilket gör frågan mindre brådskande än den låter.

### Komplexitet för användaren
Oförändrad. En extra rullgardinspost att förstå skillnaden på (se avsnitt 5
för hur den skärps utan kodändring).

### Komplexitet i implementationen
**Noll — inget behöver byggas.** Den enda kostnaden är den manuella
synkroniseringsplikten mot nya tillägg (ovan), som redan finns idag för
`temperatur`/`niva` och inte är unik för `fri`.

---

## 4. Alternativ B — ta bort Fri utforskning, inför "Avancerat" per tillämpning

### Den olösta luckan (avgörande för rekommendationen)

Uppdragets egen definition: *"När Avancerat öppnas visas alla tillgängliga
parametrar och tillägg som är kompatibla med **aktuell processmodell**."*
Det förutsätter att en Tillämpning redan är vald — men vilken Tillämpning ska
de åtta kontextlösa lärstigarna (avsnitt 2, Roll 2) då stå under? De har inget
naturligt hem bland Temperaturprocess/Nivåprocess/framtida
Kvot-/Kaskadprocess, eftersom de per definition INTE handlar om någon av
dessa kontexter.

Tre tänkbara lösningar på luckan, ingen av dem gratis:

1. **Tvinga in dem under Temperaturprocess** (de flesta använder
   Självreglerande ändå). Bryter direkt mot UX-001 avsnitt 1.3:s uttryckliga,
   redan PO-godkända princip — en lärstig om P/PI/PID-grunder skulle heta
   "Temperaturprocess" i UI:t trots att den inte har någon
   substansberättelse. Detta är precis den "konstlade omskrivning" UX-001
   varnade för.
2. **Behåll ett neutralt "grundläge" ändå**, bara under ett annat namn.
   Det LÖSER luckan — men är i praktiken Fri utforskning omdöpt, inte
   borttaget. Frågans premiss ("ta bort Fri utforskning") uppfylls då bara
   till namnet.
3. **Låt "Avancerat" vara globalt, inte per tillämpning** — en enda
   allomfattande "lås upp allt"-brytare oavsett vald Tillämpning. Det är
   återigen funktionellt Fri utforskning, fast som en checkbox istället för
   en rullgardinspost.

Ingen av de tre är en riktig "ta bort"-lösning; alla tre återinför samma
FUNKTION (ett obegränsat läge) under en annan FORM. Uppdraget bad om en
analys av om Fri utforskning fyller ett verkligt syfte — svaret den här
luckan ger är: ja, dess Roll 2 (avsnitt 2) gör det, oavsett vilket UI-mönster
som väljs för Roll 1.

### Pedagogiska konsekvenser
Blandade. Fördel: en tillämpning + dess "Avancerat" berättar tydligare "det
här är kärnan av [kontext], det här är fördjupningen" — bra progressiv
disclosure FÖR den som redan valt en kontext. Nackdel, och den väger tyngre:
`framkoppling.v1` och `parameterstyrning-ventilkarakteristik.v1` är
**dedikerade fördjupningslärstigar** — deras hela poäng är att visa just de
fälten. Om de fälten flyttas bakom en extra "Avancerat"-klickning även när
tillämpningen (Temperaturprocess) redan är rätt vald, blir den avsedda
huvudinnehållet GÖMT som standard i sin egen lärstig — motsatt effekt av vad
UX-001 ville uppnå (dölj det IRRELEVANTA, inte det relevanta).

### UX-konsekvenser
Ny interaktionsmekanism (hopfällbar sektion) att designa, testa och lära ut —
inget som finns någon annanstans i appen ännu (närmaste släkting är FEAT-044s
`.zone-table`, men den är alltid synlig när dess fält väl visas, inte
kollapsad by default). Risk för att relevanta fält blir mindre upptäckbara
(se ovan) om "Avancerat" defaultar stängd, vilket den rimligen måste för att
fylla sitt syfte.

### Påverkan på lärstigar
Kräver en NY, tredje styrbar dimension per lärstigssteg utöver Tillämpning +
Processmodell: om "Avancerat" ska vara förvalt öppet eller stängt. Uppdragets
egen `oberoende styrning`-krav (tillämpning, processmodell, strategitillägg)
är alltså inte fullt uppfyllt av B utan denna extra parameter —
`framkoppling.v1`/`parameterstyrning-ventilkarakteristik.v1` skulle annars
öppna med sina egna ämnesfält gömda.

### Påverkan på framtida Kvotreglering
Här vinner B verkligt: eftersom "Avancerat" härleds från processmodell-
kompatibilitet istället för en hårdkodad per-tillämpning-lista, slipper man
den manuella synklplikten från Alternativ A (avsnitt 3) — ett nytt tillägg
blir automatiskt tillgängligt överallt det är kompatibelt, utan att någon
behöver komma ihåg att uppdatera flera profiler.

### Påverkan på framtida Kaskadreglering
Samma fördel som Kvotreglering i teorin, men Kaskadreglering behöver enligt
STRAT-001 ändå en helt egen layout (dubblerad regulatorpanel) — "Avancerat"
som mönster hjälper föga där; värdet av B koncentreras alltså till
Kvotreglering, inte till de två tyngsta framtida strategierna tillsammans.

### Komplexitet för användaren
Cuts båda vägar: enklare för RENODLAD fri utforskning (ingen "vilken
tillämpning ska jag välja"-fråga, bara öppna Avancerat var du än är) men
STÖRRE för det vanligaste fallet — en student i en dedikerad lärstig som nu
måste veta att klicka "Avancerat" för att se lärstigens egna ämnesfält, om
inte lärstigsförfattaren kommit ihåg att förvälja det öppet.

### Komplexitet i implementationen
Betydande, och större än den låter:
- En generell "vad är kompatibelt med aktuell processmodell"-beräkning
  ersätter dagens statiska `addons`-lista per profil — mer logik, fler
  gränsfall, större testyta.
- En ny, återanvändbar hopfällbar UI-komponent.
- Måste beslutas OCH byggas: hur en lärstig tvingar "Avancerat" öppet för
  sina egna steg (ovan).
- Rör ALLA tillämpningar (inte en avgränsad ändring som att ta bort en
  profil) — större regressionsyta mot samtliga 12 redan granskade lärstigar.
- Går delvis emot en princip PO själv fastslog i UX-001 avsnitt 1
  ("Tillämpning avgör KONTEXTEN, Processmodell avgör DYNAMIKEN — två separata
  dimensioner") eftersom "Avancerat" enligt sin egen definition styrs av
  Processmodell, inte av Tillämpning — de två dimensionerna vävs delvis ihop
  igen i just den här mekanismen.

---

## 5. Rekommenderad lätt justering av Alternativ A (ingen ny mekanism)

Adresserar PO:s faktiska observation ("nästan identiska") utan att ta bort
begreppet eller bygga något nytt:

- **Ompröva bara BESKRIVNINGEN/hjälptexten**, inte funktionen: Fri utforskning
  bör inte ramas in som "den mest kompletta tillämpningen" (vilket gör
  jämförelsen med Temperaturprocess naturlig) utan uttryckligen som **"ingen
  specifik tillämpning — för grundträning och fri experimentering"**, dvs.
  samma sak UX-001 avsnitt 1.3 redan beskrev den som. En text-/hjälp-json-
  ändring, inte en kodändring av `APPLICATION_PROFILES`.
- Detta är en möjlig, billig UX-003b-uppföljning om PO vill — flaggas här,
  inte rekommenderad som ett eget uppdrag utan PO:s bekräftelse.

---

## 6. Konsekvenser för UX-002

**Ingen ändring krävs i UX-002 för att gå vidare mot merge.** Dagens
`APPLICATION_PROFILES`/`deriveApplicationProfile()`-implementation är
konsistent med rekommendationen i denna rapport (behåll Fri utforskning).
UX-002s status förblir: väntar på PO:s fjärde (visuella) granskningsrunda,
oberoende av UX-003s utfall.

Om PO ändå väljer Alternativ B senare påverkas UX-002s kod direkt (`fri`-
profilen och dess `<option>` tas bort, `deriveApplicationProfile()`s
fallback-gren måste peka någon annanstans) — men det är då ett nytt uppdrag,
inte en blockerare för att merga UX-002 som den är idag.

---

## 7. Migreringsväg om Alternativ B ändå väljs

Endast skisserad, inte rekommenderad — för beslutsunderlag ifall PO ändå vill
gå vidare med B trots avsnitt 4:

1. Besluta EXPLICIT vilken av de tre lösningarna i avsnitt 4 som täcker Roll 2
   (kontextlöst innehåll) — utan det beslutet kan B inte specificeras
   färdigt.
2. Bygg "Avancerat" som en hopfällbar sektion per tillämpning, återanvänd
   FEAT-044s `.zone-table`-mönster för själva hopfällningen.
3. Ersätt `APPLICATION_PROFILES[x].addons`-listorna med en
   processmodell-baserad kompatibilitetsfunktion (vilka tillägg är
   kompatibla med vilka `processModels`) istället för en hårdkodad lista per
   tillämpning.
4. Lägg till ett nytt, valfritt lärstigsfält för att tvinga "Avancerat" öppet
   per steg (krävs av `framkoppling.v1`/`parameterstyrning-ventilkarakteristik.v1`,
   se avsnitt 4).
5. Full regression + ny synlighetsgranskning av samtliga 12 lärstigar, samma
   metod som UX-002 (programmatisk körning genom härledningslogiken, inte
   manuell genomläsning).

Detta är ett väsentligt större uppdrag än UX-002 självt — inte en enkel
uppföljning.

---

Väntar på PO:s beslut (A eller B) innan något implementeras, per uppdragets
instruktion.
