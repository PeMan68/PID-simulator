# FEAT-045 — Åtgärder efter PO:s användartest

**Datum:** 2026-09-19
**Typ:** Analys/rekommendation — INGEN kod-/innehållsändring i detta dokument
(punkt 5 och 7 i PO:s uppdrag begär uttryckligen ett ställningstagande FÖRE
implementation; behandlar hela leveransen enhetligt på samma sätt)
**Underlag:** PO:s samlade feedback (8 punkter + nytt produktbeslut),
`apps/app/app.js`, `apps/app/index.html`, `apps/app/content/exercises/framkoppling.v1.json`,
`docs/reports/FEAT-045_IMPLEMENTATION.md`

---

## 0. Produktbeslutet — hur det påverkar FEAT-045

> "Varje reglerstrategi ska förankras i ett konkret processexempel."

Håller med om att FEAT-045 i sitt nuvarande skick bryter mot detta — teorimodul,
lärstig och hjälptexter talar genomgående om "processen", "lasten", "K" som
abstrakta storheter utan en verklig kontext. Se punkt 8 för rekommenderat
exempel och hur det väver in i befintligt innehåll.

---

## 1. "Last mag" är otydligt

**Bekräftat.** Lärstigens steg 2-instruktion ("Kontrollera att Last mag visar
−20") introducerar ett fältnamn utan att förklara vad det representerar,
varför tecknet är negativt, eller hur det hänger ihop med Lastförstärkning/Kff.

**Orsak:** Fältet `auxMag`/"Last mag" är en GENERISK mekanism (återanvändbar
för vilken process som helst, se STRAT-005) — men lärstigstexten presenterade
den generiskt istället för att förankra den i ett konkret exempel innan den
används.

**Rekommendation:** Behåll fältnamnet "Last mag" oförändrat i UI:t (det är en
generisk mekanism som ska fungera för alla framtida processexempel — att döpa
om FÄLTET till något processpecifikt vore fel abstraktionsnivå, jämför med
att "Puls mag" inte heter om sig efter varje scenario). Lös istället genom:

1. Introducera processexemplet (se punkt 8) i teorimodulen INNAN lärstigens
   första scenariosteg — studenten vet vad "lasten" fysiskt är innan de möter
   fältet.
2. Skriv om steg 1–3-instruktionerna så att "Last mag" alltid nämns
   TILLSAMMANS med sin fysiska betydelse i det valda exemplet, första gången:
   t.ex. "Last mag −20 (en plötslig temperaturminskning i inkommande flöde)."
3. Uppdatera `auxMag`s hjälptext (`help.json`) att referera till exemplet
   istället för att vara helt generisk.

---

## 2. Mätläge används i fel ordning — **bekräftat som en FUNKTIONELL BUGG, inte bara UX**

Detta är allvarligare än en instruktionsordning. `.measure-locked`
(`apps/app/index.html:500`) sätter `pointer-events: none` på HELA
`.params-container` när Mätläge är aktivt — och "Trigga last"-knappen ligger
inuti `.params-container` (samma som "Trigga puls"). **Lärstigens instruktion
"Aktivera Mätläge ... Klicka sedan Trigga last" går alltså inte att utföra —
knappen är overksam i Mätläge.**

Detta är samma begränsning som redan gäller för "Trigga puls" i ALLA
befintliga lärstigar — och där följer instruktionerna redan genomgående rätt
ordning (verifierat genom grep över `apps/app/content/exercises/`):
`storningar-robusthet.v1` skriver t.ex. "Klicka 'Trigga puls' ... och fortsätt
köra ... " FÖRE eventuell Mätläge-användning, aldrig efter. FEAT-045s lärstig
är alltså den ENDA som bryter mot ett redan etablerat, korrekt mönster.

**Åtgärd (nu):** Skriv om alla tre scenariosteg till ordningen:
1. Trigga last (params-container olåst).
2. Kör simuleringen (10-/1-steg som vanligt).
3. Aktivera Mätläge.
4. Läs av (crosshair och/eller 2%-band, se punkt 3).

---

## 3–4. Insvängningstid för subjektivt definierad + Δt istället för absoluta stegnummer

Behandlas tillsammans eftersom lösningen är gemensam.

**Bekräftat, med en teknisk nyans:** 2%-toleransbandet (`mpPvInf`/`mpPv0` i
`drawChart()`) kräver `|PV∞ − PV₀| > 0.01` (`hasRange`-kontrollen,
`apps/app/app.js`) för att överhuvudtaget ritas ut. I lärstigens steg 1 och 3
återgår/stannar PV vid SAMMA värde (SP) före och efter triggning — sätter
studenten PV₀=PV∞=50 blir bandet noll brett och osynligt. Bandet fungerar
korrekt bara i steg 2, där PV settlar på ett NYTT värde.

**Rekommenderad lösning (fungerar med BEFINTLIGT verktyg, ingen kodändring
krävs i mätverktyget självt):** low att PV₀ = den GROVT avlästa
dipp-/toppunkten (crosshair, ett ungefärligt värde räcker för att sätta ett
icke-nollskilt band) och PV∞ = SP. Det ger ett meningsfullt, om än något
asymmetriskt, toleransband kring SLUTVÄRDET — precis det studenten vill mäta
tiden till. Kombinerat med markeringslinjens exakta triggpunkt (redan ritad,
`sim.history.markers`) får studenten både `t_last` (markeringslinjens
t-värde) och `t_slut` (när kurvan går in i och stannar i bandet) direkt ur
grafen, utan gissning.

**Konkret instruktionstext (förslag, ersätter nuvarande "hovra tills den
planar ut"):**

> "Notera t-värdet för markeringslinjen ('Last → −20') — det är `t_last`.
> Aktivera Mätläge. Hovra över dippens lägsta punkt och läs av PV — skriv in
> det ungefärliga värdet som PV₀, och SP=50 som PV∞. Kryssa i '2%-toleransband'.
> Hovra längs kurvan tills den går in i och stannar kvar i det streckade
> bandet — läs av t-värdet där. Det är `t_slut`.
> Räkna ut `Δt = t_slut − t_last`. Det är insvängningstiden — inte
> `t_slut` i sig."

Steg 3 (PID + korrekt Kff) har en avvikelse så liten (≈0) att bandet blir
extremt smalt/svårt att använda meningsfullt — instruktionen bör där istället
säga rakt ut: "avvikelsen är för liten för att ett toleransband ska tillföra
något — notera bara att markeringslinjen och kurvans flacka förlopp
sammanfaller, `Δt ≈ 0`."

Samma `Δt`-terminologi (`t_last`, `t_slut`, `Δt`) bör genomgående ersätta de
nuvarande "steg B"/"steg E"-formuleringarna i lärstig OCH övningsdokument.

---

## 5. Negativ last visualiseras dåligt — **en konkret renderingsbugg hittad, inte bara en tolkningssvårighet**

Grävde i `drawChart()` (`apps/app/app.js`): lastlinjen ritas i samma panel/
skala som PV/SP, där `yMin = Math.min(measurementRange.min, 0)` — för
FEAT-045s demo-scenarier är `measurementRange.min = 0`. Ett `auxValue` på
−20 mappas då till en y-koordinat UTANFÖR panelens klippta rektangel
(`ctx.clip()` mot `[pad.top, h*0.62]`) — linjen ritas, men klipps bort helt.
**Med nuvarande demo-scenarier (Last mag=−20) är lastlinjen alltså
osynlig, inte bara svårtolkad.** Detta måste åtgärdas oavsett vilken
visualiseringslösning som väljs.

**Övervägda alternativ:**

| Alternativ | Fördel | Nackdel |
|---|---|---|
| A. Egen högerskala (ny y-axel, egen range) | Tydlig separation, kan hantera vilket värde som helst | Mest kod: ny axel, egna etiketter, egen skalningsfunktion |
| B. Klampa/expandera PV/SP-skalan för att inkludera lastens värde | Enkel kodändring | Förvränger PV/SP-skalan (0–100 blir t.ex. 0–120) — gör ALLA andra kurvor svårare att läsa, även i scenarier utan last |
| C. Ta bort tidsserielinjen, ersätt med statusradsavläsning | Löser buggen helt, enklast kod, otvetydigt tecken (siffra, inte linjeposition) | Tappar en kontinuerlig graf-representation |

**Rekommendation: C.** Motivering: lasten är ett STEG som ligger konstant
(inte en tidsvarierande kurva som PV) — dess enda "form" över tid är "0 fram
till triggning, sedan konstant". Den informationen visas redan fullständigt
av den befintliga markeringslinjen (`"Last → −20"`, exakt triggpunkt + värde)
— en tidsserielinje tillför inget utöver det, bara en trasig skala att
felläsa. Förslag:

1. **Ta bort** den nya lila prickstreckade linjen och "Last"-etiketten i
   `drawChart()` (`apps/app/app.js`, den kod som lades till i FEAT-045).
2. **Behåll** markeringslinjen ("Last → −20") — redan korrekt, alltid synlig
   oavsett tecken (text, ingen skala).
3. **Lägg till** en statusradsavläsning, samma mönster som Parameterstyrningens
   zoninfo i `updateStatus()`: `| Last: −20 (aktiv)` — visas bara när
   `sim.auxValue !== 0`, alltid en läsbar, tecken-otvetydig siffra.
4. Valfritt, litet tillägg: nämn i lärstigstexten att "Last mag"-FÄLTET visar
   vad som KOMMER att triggas, medan statusradens "Last: …" visar vad som
   FAKTISKT är aktivt — en användbar, redan etablerad distinktion (jämför
   "Puls mag" vs. pulsens faktiska nedräkning).

Detta är en förenkling relativt STRAT-005 (som förutsatte en graflinje) —
motiverat av den hittade buggen plus att lösningen blir enklare och mer
robust. Flaggas som ett nytt, litet avsteg om PO godkänner riktningen.

---

## 6. Crosshair-avrundning

**Bekräftat, och GLOBAL kod** — inte FEAT-045-specifik. `apps/app/app.js`,
crosshair-tooltippen i `drawChart()`:
```
const lines = ["t  = " + Math.round(tHover), "PV = " + pvH.toFixed(2), "u  = " + uH.toFixed(2)];
```
Används av ALLA lärstigar/scenarier i Mätläge, inte bara FEAT-045.

**Bedömning:** Lågrisk att ändra `toFixed(2)` → `toFixed(1)` för PV/u —
tooltippens avrundning påverkar bara VISNINGEN i den lilla rutan, inte de
faktiska värdena som lagras/matas in i PV₀-/PV∞-fälten (de skrivs in
manuellt av studenten oavsett). Påverkar ingen befintlig lärstigs
mätprotokoll-precision. **Rekommendation: NU, men som en tydligt separat,
global ändring** (egen commit-rad) — inte begravd i FEAT-045-specifika
ändringar, eftersom den syns i varenda lärstig som använder Mätläge.

---

## 7. Växande mängd parametrar och knappar

**Ingen implementation, per PO:s instruktion.** Bedömning: JA, bör
dokumenteras — det är precis den typ av löpande, icke-akut produktiakttagelse
`docs/planning/WEB-IAKTTAGELSER.md` är till för (se CLAUDE.md:s
spårningstabell). Tillagd där (se separat diff, ingen branch/uppdrags-ceremoni
krävs för en observation).

Kort bedömning i sak: parametergridet har vuxit från de ursprungliga P/PI/PID-
fälten till att nu även inkludera Parameterstyrning (11 fält), olinjär
ventilkarakteristik (5 fält) och nu Framkoppling (3 fält) — allt synligt för
ALLA processer/lägen samtidigt (bara döljt när det är irrelevant för aktuellt
LÄGE, t.ex. P vs PID, inte för vilken PROCESSTYP/tillämpning studenten valt).
PO:s idé om processpecifika vyer (Temperaturprocess/Nivåprocess/Flödesprocess/
Framkoppling/Kvot/Kaskad) är en rimlig riktning men en betydligt större
arkitekturfråga (skulle sannolikt kräva ett eget "processtyp"/"tillämpnings"-
val som styr vilka parametergrupper som visas, utöver dagens läges-styrda
visning) — inte något att besluta i förbigående här.

---

## 8. Rekommenderat processexempel: Värmeväxlare (temperaturreglering)

**Förslag: en värmeväxlares utgående temperatur, med en mätbar
förändring i inkommande flöde/temperatur som den framkopplade störningen.**

- **PV** = utgående temperatur.
- **SP** = börvärde för utgående temperatur.
- **u** = ångventilens öppning (%) — styr hur mycket värme som tillförs.
- **K, T** = värmeväxlarens egen dynamik (hur temperaturen svarar på en
  ventiländring) — matchar exakt den befintliga `self_regulating`-modellen,
  ingen kodändring behövs.
- **auxSignal/"Last"** = en plötslig förändring i det inkommande flödet eller
  dess temperatur, uppmätt av en flödes-/temperaturgivare UPPSTRÖMS
  värmeväxlaren — innan den hunnit påverka utgående temperatur. Negativt
  värde = kallare/mindre inkommande flöde (drar ner PV om inget görs åt det).
- **Lastgivare** = den fysiska sensorn som gör störningen mätbar — samma
  begrepp lärstigens instruktion redan (implicit) förutsätter, nu med en
  konkret motsvarighet.
- **Kff (negativt tecken, förklarat i sak):** ett kallare/mindre inkommande
  flöde drar ner utgående temperatur — regulatorn måste ÖKA ångventilen för
  att kompensera. Eftersom lastvärdet SJÄLVT är negativt (kallare) och
  åtgärden ska bli en ÖKNING (positiv), blir `u-bidraget = Kff × lastvärde`
  positivt bara om Kff är negativt (två negativa tal ger ett positivt
  bidrag) — värt en egen, konkret mening i hjälptexten/teorimodulen, se
  punkt 1.

**Varför detta exempel, jämfört med alternativ:**

- **Nivåreglering med mätbart inflöde** (skulle återanvända
  `integrerande-process-niva.v1`s redan etablerade vokabulär) — avvisad för
  FEAT-045: kräver `integrating`-processtyp för fysikalisk trovärdighet, vilket
  skulle kräva att HELA den redan simuleringsverifierade numeriska modellen
  (avsnitt 3 i `FEAT-045_IMPLEMENTATION.md`) byggs om från grunden, med ny
  risk. Sparas som ett STARKT förslag till en framtida Kaskadreglering-
  lärstig (klassisk kaskad-exempel är just "nivå (yttre slinga) + flöde
  (inre slinga)") — noterat för framtiden, inget beslut nu.
- **Rumstemperatur/klimatstyrning med mätbar utomhustemperatur** — mer
  vardagsrelaterat/lättillgängligt, men mindre tydligt "processindustri"
  (PO:s egen formulering) och mer byggnadsautomation. Håller det som en
  enklare RESERV om PO bedömer värmeväxlar-exemplet för tekniskt.
- **Värmeväxlare** — klassiskt, väletablerat läroboksexempel specifikt för
  framkoppling inom processindustrin, passar `self_regulating`-modellen
  perfekt utan omarbetning, och ger en naturlig, konkret motivering till
  VARFÖR flödesgivaren finns (mäta innan störningen hinner påverka en
  trög process) — själva kärnpoängen med framkoppling.

**Hur det vävs in:**

- **Teorimodul:** öppningsmeningen byts från abstrakt "en mätbar störning"
  till "Tänk dig en värmeväxlare som håller ett utgående flöde vid en viss
  temperatur…" — konkret scenario introducerat FÖRE de generiska begreppen.
- **Lärstig:** varje steg refererar värmeväxlaren vid första nämnandet av
  "last"/Kff/auxGain (se punkt 1), scenariotitlar uppdateras
  (t.ex. "Framkoppling — demo: PID ensam (värmeväxlare)").
- **Övningsdokument:** inledningens "Termer och definitioner" utökas med en
  kort processbeskrivning; uppgiftstexterna refererar samma exempel
  genomgående (inte ett nytt exempel per uppgift).
- **Hjälptexter (`help.json`):** `auxGain`/`kff`/`auxMag` omskrivna med
  värmeväxlarexemplet som konkret illustration, generisk förklaring kvar som
  huvudtext (fälten är fortsatt generiska mekanismer, se punkt 1).

Ingen ändring av scenario-JSON:ernas TAL krävs (samma K/T/auxGain/Kff som
redan simuleringsverifierat) — bara benämningar/titlar/beskrivningar.

---

## 9. Sammanfattning — nu vs. senare

**Åtgärdas nu (nästa implementationsomgång, väntar på PO:s OK på riktningen
i punkt 5 och 8 innan jag börjar):**
1. Last mag-terminologi → förankras i processexemplet (punkt 1+8).
2. Mätläge-ordning → RÄTTAS I ALLA TRE STEG (punkt 2, funktionell bugg).
3+4. Δt-baserad, verktygskompatibel mätinstruktion (punkt 3+4).
5. Ta bort den trasiga graflinjen, ersätt med statusradsavläsning (punkt 5;
   rekommendation C ovan — invänta PO:s godkännande av just detta val innan
   det låses, per PO:s egen instruktion).
6. Crosshair `toFixed(1)` — global, egen commit-rad (punkt 6).
8. Väva in värmeväxlarexemplet i teorimodul/lärstig/övningsdokument/hjälptexter
   (punkt 8; invänta PO:s godkännande av exemplet innan text skrivs om).

**Skjuts till senare:**
7. Processpecifika vyer/parametergrupper — dokumenterat som iakttagelse i
   `docs/planning/WEB-IAKTTAGELSER.md`, ingen implementation.
- Nivåreglering som processexempel — sparad som kandidat till en framtida
  Kaskadreglering-lärstig.

---

## 10. Uppdaterad rekommendation om FEAT-045

**Inte redo för PO:s slutgranskning/merge ännu.** Användartestet hittade en
funktionell bugg (punkt 2 — instruktioner som inte går att utföra) och en
renderingsbugg (punkt 5 — lastlinjen osynlig för negativa värden i just de
scenarier vi byggt), utöver de rena pedagogik-/terminologiproblemen. Föreslår
en andra implementationsomgång som åtgärdar punkt 1–6+8 i ett svep (allt
innehålls-/instruktionstext plus de två kodfixarna i punkt 5/6), följt av ny
PO-granskning. Väntar på ditt beslut om:

- (a) Värmeväxlare som processexempel (punkt 8) — eller ett annat val,
- (b) Statusradsavläsning istället för graflinje för lasten (punkt 5),

innan jag påbörjar nästa omgång.
