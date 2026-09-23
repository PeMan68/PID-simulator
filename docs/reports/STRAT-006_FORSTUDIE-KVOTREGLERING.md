# STRAT-006 — Förstudie: Kvotreglering (Ratio Control)

**Datum:** 2026-09-23
**Uppdragsgivare:** PO — analysuppdrag, explicit "ingen implementation"
**Typ:** Analys/rekommendation — INGEN kod, ingen branch
**Underlag:** `apps/app/sim-core.js` (verifierad rad för rad — `Simulation.step()`,
`ProcessModel.step()`, `PIDController.step()`, `triggerAuxSignal()`, `seededRandom`/
`gaussian`), `apps/app/app.js` (FEAT-045s UI-mönster), `docs/reports/STRAT-001_FORSTUDIE-REGLERSTRATEGIER.md`
avsnitt 3.3 (tidigare, mer teoretisk Kvotreglerings-förstudie — bekräftad och
förfinad här mot den FAKTISKA sim-core.js:n, se avsnitt 3), `docs/reports/UX-001_FORSTUDIE-PROCESSBASERAD-UX.md`
avsnitt 1.1 (tidigare tillämpningsskiss — se avsnitt 6 för en korrigering), FEAT-046s
redan ritade blockschema (`04-kvotreglering.svg`, på obetjänt granskad branch
`feature/FEAT-046-blockschema-svg` — se avsnitt 5)

**Viktig avgränsning:** `docs/planning/PED-002-KOMPLEMENT_FLERSLINGEREGLERING.md`
diskuterar också Kvotreglering, men är skriven mot **systerrepots** `packages/sim-core/`
(process.js/controllers.js/simulation.js, ett annat scenario-schema) — INTE mot den
faktiska produktionskoden i `apps/app/`. Dess konceptuella slutsats (Kvotreglering är
enklare än Kaskadreglering) stämmer, men dess filreferenser gäller inte här. Allt i
den här rapporten är verifierat direkt mot `apps/app/sim-core.js`.

---

## 0. Sammanfattning för snabb läsning

Kvotreglering kräver **INGEN ny process, INGEN ny regulatorinstans, och INGEN
flerslinge-UI** (till skillnad från Kaskadreglering). Det är fortfarande EN
återkopplad PID-slinga — skillnaden är bara HUR dess börvärde räknas fram. Det
kräver dock en liten, väl avgränsad ändring i `sim-core.js` (inte noll, som
STRAT-001s mer optimistiska scenario antog — se avsnitt 3) och en genuint
tidsvarierande "vild flödes"-signal (inte bara en manuellt triggad nivå som
Framkopplingens `auxValue` — se avsnitt 4, annars blir lärstigen pedagogiskt tandlös).

---

## 1. Pedagogiskt mål

Kvotreglering lär ut ett fundamentalt annorlunda sätt att sätta ett börvärde: **inte
en fast siffra en operatör skriver in, utan ett börvärde som automatiskt HÄRLEDS från
en annan, okontrollerad process-signal** — SP_B = kvot × Flöde_A. Den centrala
pedagogiska poängen är att visa VARFÖR detta behövs: om Flöde A (den "vilda",
okontrollerade variabeln) varierar och SP_B förblir fast, glider den faktiska kvoten
mellan de två flödena — vilket i en verklig process kan betyda fel blandningsstyrka,
fel bränsle/luft-förhållande, eller ett kvalitetsfel. Kvotreglering håller kvoten
konstant AUTOMATISKT, oavsett hur Flöde A varierar.

Detta bygger direkt vidare på Framkopplings pedagogiska tråd (en mätbar störning
kompenseras PROAKTIVT, innan felet syns) men är ett steg vidare: Framkoppling
KOMPENSERAR för en störning på UTSIGNALEN, Kvotreglering ÄNDRAR SJÄLVA BÖRVÄRDET
utifrån en mätbar, relaterad process-signal. Lärstigen bör uttryckligen dra den
kopplingen (samma "mätbar signal"-familj som Framkoppling, men en annan roll i
regulatorstrukturen) — se avsnitt 7/8.

---

## 2. Lämpligt processexempel

**Rekommendation: kemikaliedosering proportionerlig mot ett vattenflöde**
(t.ex. koaguleringsmedel vid vattenrening, eller ett doseringsflöde i en industriell
process). Flöde A (vatten, vild/okontrollerad — bestäms av efterfrågan/produktion,
inte av denna regulator) och Flöde B (kemikalie, reglerad — ska hålla en fast kvot
mot Flöde A).

**Varför detta hellre än bränsle/luft vid förbränning** (det andra klassiska
läroboksexemplet, och ett fullt giltigt alternativ om PO föredrar det): dosering
undviker förbränningens säkerhets-/explosionskonnotationer, är lika vanligt i svensk
processindustriutbildning, och Flöde B:s dynamik (en ventil/pump som doserar en
vätska) mappar rakt av på appens redan befintliga självreglerande processmodell —
exakt samma typ av process som Framkopplings värmeväxlarexempel, bara ett annat
ämne. **PO:s val** — bägge fungerar tekniskt identiskt, det här är en ren
namnsättnings-/berättelsefråga, ingen som påverkar avsnitt 3–6.

---

## 3. Reglerteknisk modell

**Kärninsikt, verifierad direkt i koden:** Kvotreglering behöver bara ETT verkligt
simulerat flöde (Flöde B, den reglerade processen — appens redan existerande
`ProcessModel`, oförändrad). Flöde A ("vild") behöver INTE en egen `ProcessModel`-
instans (ingen K/T/L, ingen dynamik att simulera) — det räcker med en genererad
signal, se avsnitt 4.

**Blocket som är nytt:** ett kvotblock som varje steg räknar `SP_B = kvot × Flöde_A`
— resten av slingan (PID → Ventil B → Flöde B → återkoppling) är en **helt vanlig**
återkopplad PID-slinga, identisk med allt som redan finns i appen.

**Var i koden detta hör hemma — en förfining av STRAT-001 avsnitt 3.3:**
STRAT-001 (skriven innan Framkoppling faktiskt byggdes) antog att detta skulle gå att
bygga med **noll ändringar** i `sim-core.js`, bara genom att app.js sätter
`scenario.runtime.setpoint` innan varje `step()`-anrop. Nu när den faktiska
`Simulation.step()` finns att läsa (`apps/app/sim-core.js` rad 175) stämmer det INTE
riktigt: `const sp = this.scenario.runtime.setpoint;` läses visserligen färskt varje
steg (så STRAT-001s grundpremiss var rätt), men en **AUTOMATISK, varje-steg-beräkning**
(till skillnad från Framkopplings ENGÅNGS-triggning, `triggerAuxSignal()`) hör
arkitektoniskt hemma INUTI `Simulation.step()` — exakt som Parameterstyrningens
zonuppslag (`gs.enabled`-grenen, rad 189–197) redan gör, av samma skäl:

1. **Determinism/testbarhet.** `sim-core.js` är den enda produktionskoden och är det
   enda som testas via `tests/simulation/`s bridge. En kvotberäkning som ligger i
   app.js istället skulle vara otestad av den befintliga sviten.
2. **Ett enda källa-till-sanning.** Appen anropar `sim.step()` från MINST två ställen
   (Stega 1, Kör 10 steg-loopen) — en beräkning som måste köras "innan varje step()"
   men ligger UTANFÖR `step()` riskerar att glömmas på ett anropsställe.
3. **Redan etablerat mönster i just denna kodbas.** Parameterstyrning bevisar att
   "automatisk, varje-steg-omräknad regulatoregenskap" hör hemma inuti `step()` —
   Kvotreglering är samma sorts mekanism (automatisk omräkning), bara av SP istället
   för Kp/Ti/Td.

**Konkret, minimal ändring** (beskrivet på idénivå, inte kod — implementation är inte
del av detta uppdrag): en ny gren i `Simulation.step()`, analog med
gainSchedule-grenen, som — om `scenario.ratioControl?.enabled` — räknar
`sp = scenario.ratioControl.ratio * wildFlowValue` INNAN `sp` används resten av
steget, istället för att läsa `scenario.runtime.setpoint` rakt av. `wildFlowValue`
själv beräknas enligt avsnitt 4.

---

## 4. Nödvändiga signaler

| Signal | Ny/befintlig | Roll |
|---|---|---|
| **Flöde A (vild)** | NY | Se nedan — kärnfrågan i detta avsnitt |
| **Kvot** | NY (regulator-nivå, analog med Kff) | Multiplikatorn i SP_B = kvot × A |
| **SP_B** | Befintlig (`scenario.runtime.setpoint`) | Beräknas nu automatiskt istället för manuellt satt, när Kvotreglering är aktiv |
| Flöde B:s PV/u/e | Befintlig, oförändrad | Den redan simulerade, reglerade processen |

**Den viktiga designfrågan: Flöde A får INTE vara en engångs-triggad statisk nivå.**

Framkopplingens `auxValue`-mönster (`triggerAuxSignal()`, ett manuellt klick som
sätter en FAST nivå tills nästa klick) är fel modell att återanvända rakt av här. Om
Flöde A bara är en konstant som hoppar vid ett klick, blir SP_B också bara en
konstant som hoppar en gång — pedagogiskt identiskt med ett vanligt SP-steg, och
lärstigen visar då INGENTING av det som gör kvotreglering värt att lära ut (att
regulatorn AUTOMATISKT FÖLJER en variabel som fortsätter ändras). Kvotreglerings hela
poäng kräver att Flöde A varierar KONTINUERLIGT under körningen.

**Rekommendation:** återanvänd de redan existerande, deterministiskt sådda
primitiverna `seededRandom`/`gaussian` (samma som redan driver brusmodellen,
`sim-core.js` rad 137–138) för att generera Flöde A som en bas-nivå + en långsam,
reproducerbar variation varje steg (t.ex. en liten slumpvandring: `A += gaussian(rng)
* A_volatility`, klippt till ett rimligt intervall) — INTE en ny arkitektur, bara
samma RNG-mekanism appen redan litar på för brus, applicerad på ett nytt fält. Detta
håller kostnaden låg (ingen ny simuleringsprincip att bygga/testa/lita på) samtidigt
som det ger den pedagogiskt nödvändiga, genuina variationen.

**Vad som INTE behövs:** en uppmätt/beräknad kvot-signal (B/A) för larm-/trim-syften
— det är en ANNAN, mer avancerad kvotreglerings-variant (mätande kvotlarm snarare än
styrande kvotreglering). FEAT-046s redan ritade blockschema (avsnitt 5) visar den
STYRANDE varianten (kvotblocket beräknar SP_B, ingen återkopplad kvot-mätning) —
rekommenderas som scope för en första lärstig. En uppmätt-kvot-variant kan noteras
som en möjlig, betydligt senare vidareutveckling, inte del av detta förslag.

---

## 5. Blockschema

Ett fullständigt blockschema för Kvotreglering **finns redan ritat** —
`docs/assets/diagrams/04-kvotreglering.svg`, byggt under FEAT-046 (samma
konsekventa block-/färgkodning som appens övriga strategidiagram). Texten i
diagrammet:

> Flöde A bestämmer börvärdet för Flöde B — kvotblocket räknar fram SP_B, regulatorn
> arbetar som vanligt.
>
> Flöde A → Givare A → **Kvotblock (B/A)** → SP_B → Σ(+/−) → PID → Ventil B → Flöde B
> → Givare B → (återkoppling till Σ)
>
> "Kvotblocket ersätter ett fast SP — regulatorloopen (Σ → PID → Ventil B → Flöde B)
> är i övrigt en helt vanlig återkopplad slinga."

Detta bekräftar oberoende (diagrammet ritades separat, innan denna rapport) exakt
samma arkitektur som avsnitt 3 härleder direkt ur koden — starkt tecken på att
modellen är rätt förstådd från två håll.

**OBS — FEAT-046 (hela diagramsetet) är en egen, ännu inte mergad/PO-godkänd
branch** (`feature/FEAT-046-blockschema-svg`), väntar sedan flera sessioner på
visuellt godkännande (oberoende av detta uppdrag). Om Kvotreglering byggs innan
FEAT-046 mergas, bör diagrammet ändå kunna återanvändas rakt av — det beskriver
redan exakt rätt modell.

---

## 6. UI-påverkan

**Följer samma redan etablerade tregruppsmönster som Framkoppling** (UX-004): en ny
strategi behöver INTE en ny UI-arkitektur, bara nya fält på rätt ställe i den
redan befintliga Processinställning/Regulatorkonfiguration/Processpåverkan-
strukturen:

| Fält | Grupp | Analogt med (Framkoppling) |
|---|---|---|
| Kvot | Regulatorkonfiguration → Avancerat | Kff |
| Flöde A: bas-nivå, volatilitet | Processinställning → Avancerat | Lastförstärkning |
| Flöde A: aktuellt värde (läsbar status, INTE en ny graflinje) | Statusraden | Lastens aktuella nivå (FEAT-045, punkt 5 i användartestet — PO:s uttryckliga val bort från en extra graflinje) |
| Kvotreglering på/av | Regulatorkonfiguration → Avancerat (kryssruta, likt Parameterstyrning) | Parameterstyrnings egen på/av-kryssruta |

**Rekommenderas INGEN ny graflinje för Flöde A** — samma motivering PO redan gav för
Framkopplingens last (FEAT-045): en statusradsiffra räcker, och SP-linjen (redan
ritad, röd streckad) visar ändå tydligt HUR SP_B rör sig i takt med Flöde A, vilket
är den pedagogiskt relevanta observationen.

**Tillämpnings-frågan — en korrigering av UX-001s ursprungliga skiss:** UX-001
(avsnitt 1.1, skriven långt innan Framkoppling faktiskt byggdes) skissade en egen,
framtida Tillämpning **"Blandnings-/kvotprocess"** med "två självreglerande flöden,
ETT PROCESSMODELLVAL PER FLÖDE". Avsnitt 3/4 ovan visar att det inte stämmer med hur
det faktiskt billigast byggs: bara EN riktig `ProcessModel` (Flöde B) behövs, Flöde A
är en genererad signal utan eget processmodellval. Att bygga en hel ny Tillämpning
med två processmodell-väljare vore alltså överdimensionerat mot vad reglerstrategin
faktiskt kräver.

**Rekommendation, i linje med UX-002/UX-003s redan etablerade axel-princip** ("en
regulatorstrategi hör hemma som ett TILLÄGG, inte en egen Tillämpning" — samma
resonemang som redan fällde "Tvålägesreglering" som egen tillämpning):
Kvotreglering bör bli ett NYTT ADDON (`data-addon="kvotreglering"`, samma mönster som
`framkoppling`/`parameterstyrning`/`ventilkarakteristik`), inte en ny Tillämpning.
Vilken/vilka Tillämpningar som ska tillåta det är ett öppet PO-beslut (avsnitt 9) —
enklast är att lägga till det i Temperaturprocess-profilen (eller döpa om/bredda den
något), eftersom Flöde B:s dynamik är en vanlig självreglerande process, precis som
Framkoppling redan gör.

---

## 7. Interaktion med befintlig återkoppling

Kvotreglering ÄNDRAR INGENTING i själva återkopplingsslingan — PID-regulatorn,
anti-windup, bumpless, Parameterstyrning och Ventilkarakteristik fortsätter fungera
EXAKT som idag på Flöde B. Den enda skillnaden är VARIFRÅN `sp` kommer INNAN den
används i steget (avsnitt 3). Detta är samma sorts "lägger sig FÖRE den vanliga
slingan, rör inte slingans inre logik"-relation som redan gäller för
Parameterstyrning (ändrar Kp/Ti/Td innan PID-steget) och Framkoppling (adderar en
term till u INNAN klippning) — ett konsekvent, redan bevisat arkitekturmönster i den
här kodbasen, inte en ny sorts komplexitet.

**Kombinerbarhet:** Kvotreglering + Framkoppling samtidigt är tekniskt okomplicerat
(båda är oberoende tillägg till samma steg-logik — kvotberäkningen sätter `sp`,
framkopplingstermen adderas till `u`, ingen delad mutabel tillstånd mellan dem) men
sannolikt pedagogiskt FÖR MYCKET för en och samma lärstig — se avsnitt 9.

---

## 8. Förslag till lärstig

Föreslagen struktur, medvetet i samma stil som Framkopplings redan PO-godkända,
3-stegs "PID ensam → PID+fel Kff → PID+korrekt Kff"-progression (`framkoppling.v1`):

1. **Teori:** vad är kvotreglering, varför räcker inte ett fast SP när en relaterad
   process-variabel varierar fritt — industriexemplet (avsnitt 2).
2. **Scenario A — utan kvotreglering:** fast, manuellt satt SP_B medan Flöde A
   varierar. Kvoten glider synligt (statusraden visar Flöde A:s värde och den
   FAKTISKA kvoten B/A, som avviker från målkvoten allt eftersom Flöde A rör sig).
   Illustrerar PROBLEMET.
3. **Scenario B — kvotreglering aktiverad, korrekt kvot:** SP_B följer nu
   automatiskt. Kvoten B/A håller sig konstant nära målvärdet trots att Flöde A
   fortsätter variera på samma sätt som i steg 2.
4. **(Valfritt fjärde steg) — felaktigt satt kvot:** samma mönster som Framkopplings
   "fel Kff"-steg (som PO uppskattade särskilt) — visar att kvotregleringen bara är
   så bra som kvotvärdet den ges, inte en universallösning.
5. Checkpoint-frågor per steg, samma format som övriga lärstigar.

**Verifiering innan innehåll skrivs:** exakt som med alla tidigare numeriska påståenden
i lärstigar (Framkoppling, Parameterstyrning) — varje scenarios faktiska kurva/kvot-
avvikelse måste köras genom den riktiga `Simulation`-klassen (via
`tests/simulation/lib/sim-core-bridge.mjs`) innan siffror skrivs in i
instruktionstexten, INTE uppskattas.

---

## 9. Risker och förenklingar

1. **Störst risk: en för enkel Flöde A-signal gör lärstigen meningslös.** Se
   avsnitt 4 — måste variera kontinuerligt under körningen, inte vara en engångs-
   triggad nivå. Om detta förenklas bort "för att spara tid" försvinner hela den
   pedagogiska poängen.
2. **`sim-core.js` behöver en riktig, om än liten, ändring** — inte de "noll
   ändringar" STRAT-001 optimistiskt skissade innan Framkoppling fanns att jämföra
   mot (avsnitt 3). Kostnadsuppskattning bör utgå från detta, inte STRAT-001s
   ursprungliga siffra.
3. **Tillämpnings-placeringen är ett öppet designval** (avsnitt 6) — UX-001s
   ursprungliga "egen Blandnings-/kvotprocess-tillämpning med två processmodellval"
   är sannolikt överdimensionerad; rekommendationen är ett nytt addon inom en
   befintlig Tillämpning, men PO bör bekräfta det innan implementation, särskilt
   eftersom det påverkar hur "vild"-signalen namnges i UI:t (generiskt återanvändbar
   för framtida kvotscenarier, eller processpecifik).
4. **Kombination med Framkoppling i SAMMA lärstig avråds** (avsnitt 7) — tekniskt
   enkelt men riskerar att sudda ut vad VARDERA strategin ensam demonstrerar. Håll
   dem som separata lärstigar, precis som idag.
5. **Namngivning av "vild"-signalen i scenarioformatet** bör generaliseras nog för
   att inte behöva byggas om igen om en framtida strategi (t.ex. en variant av
   Kaskadreglering) skulle behöva en liknande, oberoende varierande signal — samma
   framtidssäkrings-princip STRAT-001 redan rekommenderade för Framkopplings
   hjälpsignal (avsnitt 5.3/5.4 där), tillämpad här igen. Bygg INTE en generisk
   flersignal-motor i förväg — bara namnge fältet så det inte är hårdkodat till just
   "kvotreglering" om det visar sig återanvändbart.
6. **Edge case, lågt men verifierbart:** om Flöde A:s slumpvandring tillåts gå mot
   0 eller negativt blir SP_B = kvot × A också 0/negativt — inget krasch-scenario
   (SP klipps redan idag av `outputLimits`-liknande logik nedströms), men bör
   klippas till ett rimligt minimum i signalgenereringen så en lärstig inte råkar
   visa ett orealistiskt SP-hopp mot 0 av ren slump.

---

## Sammanfattande rekommendation

Kvotreglering är, precis som STRAT-001 ursprungligen rankade den, den billigaste
återstående reglerstrategin efter Parameterstyrning och Framkoppling — bekräftat och
skärpt mot den faktiska koden. Den kräver: en liten, väl avgränsad
`Simulation.step()`-utökning (analog med gainSchedule), en ny men enkel,
RNG-baserad "vild flödes"-signalgenerator (återanvänder befintlig `gaussian`), två-tre
nya UI-fält fördelade över redan existerande grupper (inget nytt UI-mönster), och ett
nytt addon (inte en ny Tillämpning). Blockschemat finns redan ritat. Största öppna
frågan för PO är Tillämpnings-placeringen (avsnitt 6/9 punkt 3) — resten är
tekniskt väl avgränsat och kan scopas som ett konkret FEAT-uppdrag när PO ger
klartecken.

Väntar på PO:s designbeslut innan något implementeras.
