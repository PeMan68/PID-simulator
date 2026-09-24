# DES-001 — Designförslag: Kaskadreglering, sidopanel/graf/informationsflöde

**Datum:** 2026-09-24
**Uppdragsgivare:** PO — designuppdrag, explicit "ingen implementation, ingen kod"
**Typ:** Designförslag — INGEN kod, ingen branch
**Bygger på:** `docs/reports/STRAT-007_FORSTUDIE-KASKADREGLERING.md` (arkitekturanalys,
avsnitt 6/9 flaggade UI/graf som störst risk) samt PO:s första designbeslut (se
avsnitt 1). Verifierat mot `apps/app/index.html` (UX-004:s tre grupper, exakt
fältmönster i Regulatorkonfiguration/Processpåverkan) och `apps/app/app.js`
(`drawChart()` rad 161–, `statusEl`-mönstret rad 595–648).

---

## 0. Sammanfattning för snabb läsning

PO:s beslut att slavregulatorn INTE ska exponera PID-parametrar förändrar
STRAT-007s riskbild i grunden — till det bättre. STRAT-007 antog att kaskad kräver
en HELT DUBBLERAD uppsättning av både Processinställning och Regulatorkonfiguration
(två fulla parametergrupper). Med PO:s förenkling behövs det INTE: Huvudregulatorn
återanvänder dagens Regulatorkonfiguration och Processpåverkan **i princip
oförändrade**, och slavslingan behöver bara en liten, ren avläsningspanel (SP2, PV2,
U, ev. status) — inte en ny fullständig parametergrupp. Detta sänker UI-kostnaden
väsentligt jämfört med STRAT-007s ursprungliga bedömning.

**Rekommendation i korthet:**
- **Sidopanel:** en ny, kompakt "Slavslinga"-panel (skrivskyddade värden, inga
  redigerbara fält) placerad direkt under Regulatorkonfiguration — inte en
  dubblerad grupp, inte gömd i en Avancerat-sektion.
- **Graf:** tre staplade paneler (yttre PV/SP, inre PV/SP, u) istället för dagens
  två — båda slingorna synliga samtidigt, ingen vyväxling, ingen skalkonflikt.
- **Informationsflöde:** en liven, alltid synlig "signalkedja"-rad (SP1 → u_yttre
  → SP2 → u_inre → PV2 → PV1) med aktuella siffervärden, som gör själva flödet PO
  pekat ut som "den viktigaste visualiseringen" konkret och läsbart utan att kräva
  ett nytt grafikbibliotek.

---

## 1. Bakgrund och avgränsning

PO:s beslut: **slavregulatorn (inre slingan) ska inte exponeras som en fullständig,
justerbar regulator.** Kp/Ti/Td, anti-windup och bumpless för den inre slingan sätts
av scenariot, inte av studenten. Motivet är uttryckligen pedagogiskt: kaskad ska lära
ut SAMSPELET mellan två slingor, inte bli en övning i att trimma två regulatorer
samtidigt.

**Konsekvens för STRAT-007s riskbild (avsnitt 6/9 där):** STRAT-007s två UI-alternativ
("dubblerad panel" vs. "vy-växlare") antog båda att den inre slingan behöver en egen,
fullständig Regulatorkonfiguration-liknande grupp. Det behövs inte längre. Kvar att
lösa är bara: **var och hur visas SP2/PV2/U** (rena avläsningsvärden, ingen
konfiguration) **och hur görs sambandet mellan slingorna tydligt** — vilket är ett
betydligt mindre UI-problem än det STRAT-007 ursprungligen flaggade.

**Huvudregulatorn påverkas i praktiken inte alls strukturellt:** SP1 fortsätter att
vara dagens `sp`-fält i Processpåverkan (`apps/app/index.html` rad 1002–1005), och
Kp/Ti/Td fortsätter att vara dagens fält i Regulatorkonfiguration (rad 881–892) —
den studerande arbetar med EXAKT samma gränssnitt som idag för huvudslingan.

---

## 2. Föreslagen sidopanel

### 2.1 Huvudregulator — oförändrad

Ingen ändring i `groupProcessinstallning`, `groupRegulatorkonfiguration` eller
`groupProcesspaverkan`. SP1 (fältet `sp`), Kp/Ti/Td, Läge, U min/max m.fl. fungerar
och visas exakt som idag. Detta är en direkt konsekvens av PO:s beslut, inte ett nytt
förslag i sig — men värt att slå fast tydligt: **noll UI-omarbetning för
huvudslingan.**

### 2.2 Slavslinga — ny, minimal avläsningspanel

**Innehåll (per PO:s "Föreslagen struktur"):**
- SP2 (beräknat av huvudregulatorn — inte redigerbart)
- PV2 (den inre processvariabeln)
- U (ventilsignalen, den inre regulatorns utsignal)
- Valfritt: regulatorläge (t.ex. "PID (fast)") och en statusindikator (t.ex. en
  liten badge "Mättad" när U ligger i sitt tak/golv — se avsnitt 4 för varför detta
  är värdefullt att förbereda redan nu, utan att bygga kaskad-windup-logiken än)

**Två placeringsalternativ:**

**A. Statusradstillägg (billigast, minst påträngande).** Dagens `statusEl`
(`apps/app/app.js` rad 648) bygger redan upp en sammansatt textrad genom att
villkorligt lägga till `auxInfo`/`ratioInfo`-segment (t.ex. Kvotreglerings
`"  | Flöde A=... Flöde B=... Kvot (faktisk)=..."`). Ett `kaskadInfo`-segment i
samma stil (`"  | SP2=32.0, PV2=31.4, U=68%"`) skulle vara den billigaste möjliga
lösningen och kräva noll ny UI-struktur.
**Nackdel:** Kvotreglerings/Framkopplings statusradstillägg är sekundär,
kompletterande information — inte huvudsaken i lärstigen. SP2/PV2/U är här
**huvudsaken** (PO: "den viktigaste visualiseringen"). Att begrava den i en lång,
odramatisk textrad underdriver dess pedagogiska vikt och gör den lätt att missa.

**B. Egen kompakt panel, samma fältmönster som befintliga grupper (rekommenderas).**
En ny, liten sektion — visuellt en `.param-group`-liknande låda, men med
SKRIVSKYDDADE värden (grå bakgrund/disabled-stil på inputs, eller ren text i stället
för `<input>`) snarare än redigerbara fält, för att tydligt signalera "detta är en
avläsning, inte något du ställer in". Rubrik t.ex. **"Slavslinga (inre process)"**
eller **"Slavregulator"**, placerad DIREKT UNDER Regulatorkonfiguration (innan
Processpåverkan) — fysiskt nära huvudregulatorns Kp/Ti/Td, vilket förstärker att
slavslingan är en DEL av huvudregulatorns sammanhang, inte en separat, jämbördig
konfigurationsyta.
**Fördel:** rätt visuell vikt för den viktigaste informationen, tydlig avgränsning
(skrivskyddad stil) mot att den skulle kunna förväxlas med en tredje, redigerbar
regulator. **Nackdel:** något mer ny CSS/HTML än alternativ A, men fortfarande
litet jämfört med en dubblerad full grupp (3–4 rader, ingen Avancerat-sektion,
ingen ny toggle-logik).

**Rekommendation:** Alternativ B. Motivering: PO har själv gett SP1→...→PV1-kedjan
högsta pedagogiska prioritet ("den viktigaste visualiseringen") — då bör den
motsvarande sidopanelsinformationen ha en egen, tydligt avgränsad plats, inte
smygas in som ett textradstillägg bland andra addons.

### 2.3 Placering i UX-004-strukturen

Slavslinge-panelen bör INTE ligga inuti Regulatorkonfigurationens
`.advanced-toggle`-sektion (den är reserverad för valfria, avstängningsbara
tilläggsparametrar som Kff/Kvot/gainSchedule — SP2/PV2/U är däremot alltid
relevanta och synliga så snart kaskad är aktivt scenario, precis som PV/SP/u
själva). Den bör vara en egen, alltid synlig sektion, analogt med hur
Processpåverkan hålls "medvetet flack, ingen egen Avancerat-sektion" (redan
etablerad princip i UX-004, se kommentaren vid rad 995–998 i `index.html`).

---

## 3. Föreslagen graf-layout

Dagens graf (`drawChart()`, `apps/app/app.js` rad 161–) har två paneler: en övre
(PV/SP, ~62 % höjd) och en undre (u, resten). Målet — båda slingor synliga
samtidigt, ingen vyväxling — kräver att fler serier ryms utan att panelerna blir
oläsliga.

### Alternativ A: Tre staplade paneler (rekommenderas)

- **Panel 1 (övre, ~38 % höjd):** PV1/SP1 — huvudslingan, exakt som dagens
  PV/SP-panel ser ut idag.
- **Panel 2 (mitten, ~30 % höjd):** PV2/SP2 — slavslingan, samma visuella stil
  som Panel 1 men en annan färgkodning (t.ex. den orange/blå-ton som redan
  används för kaskad i `05-kaskadreglering.svg`, för visuell konsekvens mellan
  blockschema och graf).
- **Panel 3 (nedre, ~32 % höjd):** U — den inre regulatorns utsignal, dvs.
  exakt samma innehåll som dagens u-panel, bara nu tydligt kopplad till Panel 2
  eftersom det är slavregulatorns utsignal som driver PV2 direkt ovanför den.

**Läsordning uppifrån och ned speglar signalkedjan:** SP1/PV1 (vad studenten satt
och vad som händer med den) → SP2/PV2 (vad huvudregulatorn beordrade slaven att
göra, och hur väl slaven lyckas) → U (vad slaven faktiskt gör åt ventilen). Detta
är samma ordning som PO:s egen beskrivna kedja, fast läst uppifrån och ned istället
för vänster till höger.

**Fördelar:** varje storhet får sin egen skala (ingen risk att PV1:s temperaturskala
och PV2:s flödesskala kolliderar visuellt om de råkar ha olika naturliga
värdeintervall), hög läsbarhet, direkt återanvändning av befintlig panel-rit-kod
(bara en tredje instans av samma mönster, inte en ny ritmotor), ingen vyväxling.
**Nackdelar:** mer vertikal höjd totalt (tre paneler istället för två) — kan kräva
att grafytan blir högre eller att paneler görs något kompaktare (mindre typsnitt,
tunnare marginaler) för att rymmas utan scroll på mindre skärmar.

### Alternativ B: Två paneler, överlagrade linjer

- **Panel 1 (övre):** PV1/SP1 OCH PV2/SP2 överlagrade i samma ruta, skilda med
  linjestil (heldragen/streckad) och färg, ungefär som Kvotreglerings
  `wildFlow`-linje redan läggs ovanpå dagens PV-panel idag.
- **Panel 2 (nedre):** U, oförändrad.

**Fördelar:** ingen extra vertikal höjd jämfört med idag — passar direkt in i
befintlig layout utan att grafytan behöver bli högre.
**Nackdelar:** fyra linjer (PV1/SP1/PV2/SP2) i en och samma ruta riskerar att bli
visuellt rörigt, särskilt om PV1 och PV2 representerar olika fysikaliska storheter
(t.ex. temperatur kontra flöde) med olika naturliga dynamik/utslag — svårare att vid
en snabb blick avgöra vilken linje som hör till vilken slinga jämfört med separata
paneler. Motverkar delvis PO:s egen prioritering ("sambandet mellan slingorna ska
vara tydligt") genom att göra just den distinktionen visuellt svårare, inte lättare.

### Jämförelse

| | Alt. A (tre paneler) | Alt. B (två paneler, överlagrat) |
|---|---|---|
| Vertikal höjd | Mer | Oförändrad |
| Läsbarhet per slinga | Hög (egen skala/ruta) | Lägre (delad ruta, fyra linjer) |
| Kodåteranvändning | Hög (samma panelmönster x3) | Hög (samma overlay-mönster som `wildFlow`) |
| Risk för skärmträngsel (små skärmar) | Måttlig | Låg |
| Matchar "sambandet ska vara tydligt" | Bäst | Sämre |

---

## 4. Informationsflöde

PO pekar ut signalkedjan SP1 → Huvudregulator → SP2 → Slavregulator → U → PV2 → PV1
som "den viktigaste visualiseringen". Två grafpaneler (eller tre, Alt. A) visar VAD
värdena är över tid, men inte tydligt HUR de hänger ihop i en enda ögonblicksbild.

**Förslag: en alltid synlig "signalkedja"-rad** ovanför eller under grafen, i stil
med dagens statusrad men separat och kompakt, t.ex.:

```
SP1 = 50.0 → Huvud-PID → SP2 = 32.1 → Slav-PID → U = 68 % → PV2 = 31.4 → PV1 = 49.8
```

Uppdateras varje simuleringssteg, med samma `fmt1()`-formatering som redan används
i statusraden. Detta är medvetet EN textrad, inte ett nytt levande blockschema
(en levande, siffer-annoterad version av `05-kaskadreglering.svg` vore visuellt
starkare men är ett väsentligt större UI-åtagande — en ny SVG-renderingskomponent
med dynamiska textnoder — och rekommenderas INTE för en första version). Textraden
ger samma pedagogiska kärna (kedjan, i ordning, med siffror) till en bråkdel av
kostnaden, och kan uppgraderas till ett grafiskt flödesschema senare om PO efter
test bedömer att det behövs.

**Placering:** direkt ovanför grafen, väl synlig utan scroll, tydligt avgränsad
från den vanliga statusraden (som fortsätter visa steg/t/e/varningar som idag) så
att de inte konkurrerar om uppmärksamhet.

---

## 5. För- och nackdelar — sammanfattning av hela förslaget

**Fördelar:**
- Huvudregulatorns gränssnitt är helt oförändrat — ingen ny inlärningströskel för
  det som redan fungerar.
- Slavslinge-panelen är liten, skrivskyddad och tydligt avgränsad — omöjlig att
  förväxla med en andra, jämbördig regulator att trimma.
- Tre grafpaneler (Alt. A) ger båda slingor full synlighet samtidigt utan
  vyväxling, med bevarad läsbarhet per storhet.
- Signalkedje-raden gör PO:s viktigaste pedagogiska poäng konkret och läsbar utan
  ett nytt grafikbibliotek.
- Betydligt billigare än STRAT-007s ursprungliga "dubblerad panel"-antagande —
  PO:s förenklingsbeslut sänker den tidigare identifierade största risken.

**Nackdelar/kvarstående öppna frågor:**
- Tre grafpaneler kräver mer vertikal höjd — bör provas mot faktisk skärmstorlek
  (särskilt bärbar dator i helskärm, appens vanligaste användningsmiljö) innan det
  låses.
- Färgkodningen mellan sidopanel, graf och signalkedja bör vara konsekvent (samma
  färg för "slavslinga" överallt) — en liten designdetalj, men värd att fastställa
  i implementationsskedet så den inte uppfinns på nytt tre gånger.
- Kaskad-windup (STRAT-007 avsnitt 3/9) är inte löst av detta förslag och behöver
  inte vara det här — men statusindikatorn i avsnitt 2.2 ("Mättad") är en
  medveten krok för att kunna visualisera det senare utan ytterligare UI-arbete.

---

## 6. Rekommendation

1. **Sidopanel:** ny, kompakt, skrivskyddad "Slavslinga"-panel direkt under
   Regulatorkonfiguration (avsnitt 2.2, alternativ B). Huvudregulatorns
   gränssnitt lämnas orört.
2. **Graf:** tre staplade paneler — PV1/SP1, PV2/SP2, U (avsnitt 3, alternativ A).
3. **Informationsflöde:** en textbaserad signalkedje-rad ovanför grafen
   (avsnitt 4), med möjlighet att senare uppgraderas till ett grafiskt
   flödesschema om PO bedömer att det ger tillräckligt mervärde.

Detta förslag håller sig till PO:s princip — huvudregulatorn är den studerande
arbetar med, slavregulatorn är en del av processens funktion — och sänker samtidigt
UI-risken som STRAT-007 pekade ut som störst, genom att aldrig behöva bygga en
dubblerad, fullständig regulatorpanel för den inre slingan.

---

## Sammanfattande slutsats

PO:s beslut att inte exponera slavregulatorns PID-parametrar är den enskilt
viktigaste åtgärden för att göra Kaskadreglerings UI hanterbart. Det förvandlar
STRAT-007s största öppna risk (ett helt nytt, dubblerat panelmönster) till ett
väsentligt mindre problem: en liten avläsningspanel plus en tredje grafpanel,
båda byggda med mönster som redan finns i appen (statusrad-stil,
panel-rit-mönster). Kvar att besluta, innan implementation påbörjas, är egentligen
bara grafhöjd/skärmanpassning (avsnitt 5) och den konsekventa färgkodningen mellan
sidopanel/graf/signalkedja — inga öppna arkitekturfrågor kvarstår.
