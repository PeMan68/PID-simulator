# Analys: XP-baserad spelifiering — viktning av aktiviteter

**Status:** Idéanalys. **Inte ett beslutat produktdesign. Ingen implementation
påbörjad.** Ingen appkod är ändrad av detta dokument eller dess tillkomst — rent
underlag för ett framtida PO/PM-beslut om en avgränsad prototyp.

**Bakgrund:** Test-läget (poängräkning: rätt/fel på kontrollfrågor) är avstängt i PROD
och har inte visat sig vara en bärande spelidé i nuvarande utförande. Ny idé från PO:
räkna interaktioner (klick, stegningar, lärstigsframsteg, aktiv tid, hjälpanvändning)
och vikta dem till XP, med fyra uttalade principer:
1. Upprepning av ett experiment ska ge **mer** XP, inte mindre (kunskap befästs av
   upprepning) — förslag: exponentiell funktion för återbesök.
2. Att stega ett förlopp i många små steg istället för ett stort hopp ska ge mer XP,
   eftersom varje enskild beräkning blir synlig.
3. Aktiv interaktionstid kan vara en signal, men vanlig öppettid och enstaka
   musrörelse ska inte räknas som aktivitet i sig.
4. Klick på hjälpfrågetecken bör ge XP första gången en unik hjälptext öppnas per
   session — inte vid återöppning.

Denna analys tar samtliga idéer på allvar, men flaggar genomgående var en bokstavlig
tolkning (obegränsad exponentiell, XP per klick utan tak, tid utan krav på verklig
aktivitet) skapar ett spel som går att fuska sig igenom utan att lära sig något — och
föreslår modeller som behåller pedagogiken utan att öppna de hålen.

**Uppdragshistorik:** grundanalysen (avsnitt 1–4, "Idé 1"/"Idé 2") skrevs som ett första
utkast. GAM-001 kompletterade den med aktiv interaktionstid, hjälptextsanvändning och en
tre-nivåmodell för råhändelser → pedagogiska aktiviteter → XP (avsnitt 5–11).

---

## 1. Verkliga klickbara aktiviteter i appen (grund för analysen)

Genomgången utgår från de faktiska event-lyssnarna i `apps/app/app.js` — inte
hypotetiska knappar. Fem kategorier framträder naturligt:

### A. Lärstigsnavigering
| Aktivitet | Element | Kommentar |
|---|---|---|
| Starta en lärstig | `#loadPath` | Signalerar påbörjad övning |
| Nästa/föregående steg | `#nextStep` / `#prevStep` | Ren progression |
| Besvara kontrollfråga | `handleQuizAnswer` (Test-läge) | Enda direkta kunskapssignalen som finns idag |

### B. Kärnsimulering (experimenterande)
| Aktivitet | Element | Kommentar |
|---|---|---|
| Ett simuleringssteg | `#step` | Hög granularitet — ett beräkningssteg synligt i taget |
| Kör 10 steg | `#run10` | Låg granularitet — samma antal steg, mindre synlighet per steg |
| Trigga störning | `#pulse` | Utökar experimentet med ett nytt fenomen |
| Återställ system | `#systemReset` | Housekeeping — förutsättning för ett nytt försök |
| Rensa graf | `#clearChart` | Housekeeping |

### C. Scenario- och parameterutforskning
| Aktivitet | Element | Kommentar |
|---|---|---|
| Ladda fristående scenario | `#load` | Ny utgångspunkt |
| Ändra process-/regulatorparameter | `fields.*` (`change`) | Kp, Ti, Td, K, T, L, SP, brus, puls m.fl. |
| Byt regulatorläge | `#mode` | Manuell/On-Off/P/PI/PID — konceptuellt tyngre byte |
| Byt processtyp | `#processType` | Självreglerande/integrerande/instabil/2:a ordningen |

### D. Fördjupningsverktyg
| Aktivitet | Element | Kommentar |
|---|---|---|
| Mät K/T/L | `#btnMeasure` + `#mpPv0`/`#mpPvInf`/`#mp63Line`/`#mpTangent` | Aktivt tolkningsarbete |
| Visa facit (K/T/L) | `#btnFacit` | Avslöjar svaret — ska inte belönas som om det vore egen analys |

### E. Ren UI (bör inte ge XP)
`#toggleLeft`/`#toggleRight` (sidopanel), `#modeGuided`/`#modeTest` (lägesväxling i sig),
`#btnPresent` (lärarverktyg för projicering, inte en elevhandling).

---

## 2. Föreslagen grundviktning per kategori

Utgångsläge, avsett att justeras efter faktisk speltestning — **inte** slutgiltiga tal:

| Kategori | Aktivitet | Bas-XP/händelse |
|---|---|---|
| A | Starta lärstig | 3 |
| A | Nästa/föregående steg | 2 |
| A | Rätt svar på kontrollfråga | 15 |
| A | Fel svar (försök gjort) | 5 |
| B | Ett simuleringssteg (`#step`) | 1 |
| B | Kör 10 steg (`#run10`) | 3 |
| B | Trigga störning | 4 |
| B | Reset/rensa | 1 |
| C | Ladda scenario | 3 |
| C | Ändra en parameter | 2 |
| C | Byt regulatorläge | 4 |
| C | Byt processtyp | 4 |
| D | Aktivera Mät K/T/L | 5 |
| D | Justera mätlinjer under Mät-läge | 2 |
| D | Visa facit | 1 |
| E | Allt i kategori E | 0 |

**Varför `#step` (1 XP) och `#run10` (3 XP) redan kodar principen om granularitet:** tio
klick på `#step` ger 10 XP för samma antal simulerade tidssteg som ett klick på `#run10`
ger 3 XP för. Det är en direkt implementation av PO:s andra idé — utan att behöva någon
särskild specialregel.

---

## 3. Idé 1: Mer XP för upprepning — men inte bokstavligt obegränsat

**Den pedagogiska poängen är rimlig** — att köra samma experiment igen, särskilt med en
ändrad parameter, är precis den typen av jämförande utforskning appen är byggd för
(P/PI/PID-jämförelserna, dötidsjämförelsen m.fl. är redan uppbyggda kring "kör två
gånger, jämför"). Det förtjänar mer XP än ett enda försök.

**Problemet med en bokstavlig, obegränsad exponentiell funktion:** den går att fuska.
Om varje återbesök till samma scenario ger `bas × 2^besök`, är den dominanta strategin
att klicka `#systemReset` → `#run10` om och om igen med **identiska** parametrar —
noll lärande, maximal XP. En obegränsad exponentiell kurva belönar inte upprepning av
kunskap, den belönar upprepning av klick.

**Föreslagen lösning — koppla bonusen till *distinkta* konfigurationer, inte till
antal klick:**

1. Räkna per scenario (eller per lärstigssteg) hur många **faktiskt olika**
   parameterkombinationer användaren kört till slutfört tillstånd (t.ex. minst 20 steg
   simulerade). Ett återbesök med exakt samma Kp/Ti/Td/K/T/L som senast räknas inte som
   en ny distinkt konfiguration.
2. Ge en växande multiplikator per distinkt konfiguration, men **begränsad (S-kurva)**
   snarare än obegränsad exponentiell:

   | Distinkt konfiguration # | Multiplikator |
   |---|---|
   | 1 | 1,0× |
   | 2 | 1,3× |
   | 3 | 1,6× |
   | 4 | 2,0× |
   | 5 | 2,5× |
   | 6+ | 3,0× (tak) |

   Kurvan *känns* exponentiell i de första stegen (vilket var poängen — att gå från ett
   till några försök ska kännas som ett tydligt kliv), men konvergerar mot ett tak så
   att XP-vinsten avtar när ytterligare varianter ger allt mindre ny insikt. Ett
   olimiterat `2^n` växer i praktiken till absurda XP-summor redan vid 10–15 besök, vilket
   gör hela poängsystemet meningslöst som signal.
3. Alternativ, matematiskt renare formulering av samma idé om en mjukare kurva
   föredras: `multiplikator = min(3.0, 1 + log2(distinkta_konfigurationer))` — växer
   snabbt initialt, avtar därefter, inget hårt stegtak att balansera manuellt.

**Öppen fråga till PO/PM:** hur "olik" måste en parameterändring vara för att räknas
som en ny distinkt konfiguration? Ett förslag: varje parameter som ändras mer än ~5 % av
sitt tillåtna intervall sedan senaste räknade försöket.

---

## 4. Idé 2: Mer XP för finkornig stegning — samma gaming-risk, annan form

Grundviktningen i avsnitt 2 (`#step` = 1 XP, `#run10` = 3 XP för samma stegantal)
implementerar redan principen. Kvarstående risk: att bara mala `#step` utan att titta på
något ger obegränsad gratis-XP.

**Föreslaget tak:** max XP från `#step`-kategorin per laddad scenario-instans, t.ex.
20 XP (motsvarar 20 meningsfulla enskilda steg). Därefter ger fortsatta `#step`-klick
0 XP tills scenariot laddas om eller parametrar ändras. Samma resonemang gäller
`#run10`. Detta bevarar att enstegning lönar sig mer *per steg upp till en rimlig gräns*,
utan att göra ren klickspam till en oändlig XP-källa.

---

## 5. Aktiv interaktionstid

**Mål:** skilja "fliken är öppen" från "användaren är faktiskt engagerad", utan
backend och utan att identifiera användaren.

### Vad webbläsaren faktiskt kan avgöra

| Tillstånd | API | Vad det faktiskt säger |
|---|---|---|
| Fliken är synlig/dold | `document.visibilityState` + `visibilitychange`-event | Täcker fliken bytt, minimerad, låst skärm. Väl webbläsarstött. |
| Fönstret har OS-fokus | `window.addEventListener("focus"/"blur")` | Fångar fall `visibilityState` missar på vissa webbläsare — t.ex. att användaren alt-tabbar till ett annat program medan flikens innehåll ändå räknas "synligt". |
| Användaren har nyss interagerat | `pointerdown`, `keydown`, `change`, samt appens egna knapp-/fälthändelser | Direkt, tillförlitlig signal. |
| Användaren rör muspekaren | `pointermove` (kraftigt strypt, se avsnitt 6) | Svag signal — se nedan. |

**Rekommenderad regel:** aktiv tid ackumuleras endast när **alla tre** gäller
samtidigt:
```
document.visibilityState === "visible"
&& window har fokus (ingen blur sedan senaste focus)
&& (nu − senasteInteraktion) < inaktivitetsgräns
```
Så snart fliken döljs eller fönstret tappar fokus pausas klockan **omedelbart** (inget
väntar in inaktivitetsgränsen) — att dölja fliken är en otvetydig signal, till skillnad
från frånvaro av klick som kan bero på att användaren läser eller tänker.

**Idle Detection API används inte** — instämmer med PM:s bedömning: begränsat
webbläsarstöd, kräver HTTPS och ett explicit användartillstånd (permission prompt), vilket
är fel avvägning för ett lågriskverktyg som bara ska mäta ungefärlig aktivitet. Den lokala
modellen ovan (Page Visibility + focus/blur + egna interaktionshändelser) täcker samma
behov utan permission-friktion och fungerar konsekvent mellan webbläsare.

### Rekommenderad inaktivitetsgräns: 60 sekunder (startvärde)

| Gräns | Risk om för kort | Risk om för lång |
|---|---|---|
| 30 s | Normal tankepaus (läsa en graf, fundera på en kontrollfråga) pausar klockan i onödan — aktiv tid underskattas kraftigt för eftertänksamma användare. | — |
| **60 s** | Viss underskattning kvarstår för längre tankepauser. | Viss risk att kort frånvaro (svara i telefonen) räknas som aktiv tid. |
| 120 s | — | Betydande risk att faktisk frånvaro (rast, avbrott) räknas som aktiv tid; underminerar hela poängen med mätningen. |

60 sekunder föreslås som startvärde, i linje med PM:s preliminära rekommendation och med
vanlig praxis inom webbanalys (ofta 30 s, men den här appen har ovanligt långa naturliga
tankepauser mellan klick — att läsa av en graf eller resonera om en kontrollfråga tar
längre tid än att läsa en artikeltext). Bör betraktas som en **tuningparameter**, inte ett
fastslaget värde — avsnitt 11 föreslår att prototypen loggar faktisk klickfrekvens så att
gränsen kan sättas empiriskt istället för att gissas.

---

## 6. Musrörelse och pekarrörelse

`pointermove` (Pointer Events — täcker mus, penna och pekskärm i ett enda API, till
skillnad från separata `mousemove`/`touchmove`-lyssnare) är en användbar men **svag**
signal: den säger "en pekare rör sig över sidan", inte "användaren tänker eller lär sig
något". Handen kan vila på musen medan blicken är någon helt annanstans.

**Modell:**
- `pointermove` **återställer endast `senasteInteraktion`** — samma mekanism som ett
  klick, men ger **aldrig** XP, räknas **aldrig** som en pedagogisk aktivitet, och
  bidrar **aldrig** till "genomfört experiment".
- **Ingen koordinatlagring.** Handlern behöver bara veta *att* en rörelse skedde, aldrig
  *var*. Inget att spara, inget att kunna läcka.
- **Hård strypning, kontrollerad i själva handlern — inte bara via lyssnaralternativ.**
  `pointermove` kan trigga hundratals gånger per sekund på modern hårdvara. Rekommenderad
  implementation:
  ```js
  let lastPointerSample = 0;
  window.addEventListener("pointermove", () => {
    const now = Date.now();
    if (now - lastPointerSample < 5000) return; // en gate, inte en fullständig hantering
    lastPointerSample = now;
    markActive();
  }, { passive: true });
  ```
  Genom att avbryta på första raden hålls kostnaden för de bortkastade anropen nere till
  en enda jämförelse — det är strypningen i handlern, inte `{ passive: true }` i sig, som
  löser prestandaproblemet (den flaggan gör bara att webbläsaren inte behöver vänta på
  handlern innan den skrollar/ritar om, den minskar inte antalet anrop).
- Föreslagen sampling: **högst en gång var femte sekund**, i linje med PM:s förslag.

**Varför detta spelar roll för resten av analysen:** eftersom `pointermove` aldrig ger
XP och aldrig räknas som en pedagogisk aktivitet, kan en användare inte samla vare sig
aktiv tid *i belönande bemärkelse* eller XP genom att bara vifta med muspekaren — den
kan bara förhindra att klockan pausas medan andra, starkare signaler saknas. Det är
alltjämt PM:s alternativ C (avsnitt 8) som avgör om ens det spelar någon roll.

---

## 7. Hjälptexter och frågetecken

### Fullständig inventering

Samtliga `?`-hjälpknappar i appen är av samma typ: en `.help-btn` med ett
`data-help`-attribut som slår upp en post i det delade `content/help.json` och visar den
i höger sidopanel (`#infoTitle`/`#infoBody`). Ingen modal, inget separat fönster — bara
en textruta som byts ut. Samtliga är kopplade till en enskild parameter, ett
regulatorläge eller ett verktyg, **inte** till ett specifikt scenario eller en specifik
lärstig.

| `data-help`-ID | Vad förklaras | Grupp |
|---|---|---|
| `processType` | Processtyp (självreglerande/integrerande/instabil/2:a ordn.) | Process |
| `k` / `kv` | Processförstärkning K, respektive Kv för integrerande processer — **samma knapp** (`#kHelpBtn`), `data-help` byts dynamiskt av `updateProcessUIState()` beroende på vald processtyp | Process |
| `t` | Tidskonstant T | Process |
| `l` | Dötid L | Process |
| `normalValue` | Normalvärde | Process |
| `outflow` | Utflöde (integrerande processer) | Process |
| `mode` | Regulatorläge (Manuell/On-Off/P/PI/PID) | Regulator |
| `kp`, `ti`, `td` | Regulatorparametrar | Regulator |
| `bumpless` | Stötfri övergång | Regulator |
| `antiWindup` | Anti-windup | Regulator |
| `showPB` | Visa proportionalband | Regulator |
| `hysteresLower`, `hysteresUpper` | Hysteresgränser (On/Off) | Regulator |
| `sp`, `umin`, `umax`, `manualOutput` | Börvärde, utsignalsgränser, manuell utsignal | Styrning |
| `noise`, `pulseMag`, `pulseDuration` | Störningsparametrar | Störningar |
| `tangentlinje` | Tangentlinjen i Mät K/T/L-läget | Mätverktyg |

**24 distinkta hjälptexter, 23 fysiska knappar** (eftersom `k`/`kv` delar knapp men är
två olika `data-help`-värden vid klicktillfället — koden läser redan `btn.dataset.help`
vid klickets ögonblick, så rätt ID fångas automatiskt utan extra logik).

Samtliga finns identiskt i DEV och PROD (`help.json` är en delad, ovillkorad fil i
`tests/lib/prod-content-set.mjs`s härledning — kopieras alltid). Ingen hjälptext hör till
en viss lärstig eller ett visst scenario; de är generella parameterförklaringar.

**Ingen befintlig "stängd"-händelse.** Ett klick byter bara ut panelens innehåll — det
finns inget event för "användaren slutade läsa den här hjälptexten", bara nästa klick
(på en annan hjälpknapp, eller på `#toggleRight` som fäller ihop panelen). Det här är
relevant för dwell-time-frågan nedan.

### Föreslagen händelsemodell: `help_opened`

```
{
  helpId: "kp",                       // stabilt data-help-värde
  timestamp: 1234567890,
  scenarioId: "pi-step-self-regulating" | null,
  learningPathId: "processbegransningar.v1" | null,
  stepIndex: 2 | null,
  isFirstInSession: true
}
```
`scenarioId`/`learningPathId`/`stepIndex` är redan tillgängliga som modul-global state
(`currentScenario`, `currentPath`, `currentPathStep`) — ingen ny spårningsinfrastruktur
krävs för att läsa av dem, bara för att logga dem.

### Föreslagen XP-regel

- Första öppningen av ett unikt `helpId` under sessionen: **2 XP** (PM:s
  preliminära förslag, rimligt).
- Återöppning av samma `helpId` senare i samma session: **0 XP.**
- Olika `helpId` räknas separat (24 unika = 24 möjliga XP-tillfällen per session, aldrig
  fler — ett naturligt tak utan att någon extra spärr behöver byggas).

### Bör en 2-sekunders dwell-time krävas innan öppningen räknas?

**Rekommendation: nej, inte i första versionen — komplexiteten uppväger inte nyttan
här.** Skälen:
1. Eftersom `help_opened` bara ger XP **första gången per unikt ID**, är den totala
   möjliga vinsten redan hårt begränsad till 24 XP per session oavsett klickhastighet.
   Att snabbklicka igenom alla 24 knapparna utan att läsa någon av dem ger exakt lika
   mycket XP (24 tillfällen × 2 XP) som att läsa dem alla noggrant — spam-risken som
   dwell-time skulle lösa finns inte här, till skillnad från t.ex. `#step`-kategorin i
   avsnitt 4 som saknar ett naturligt tak.
2. Att implementera dwell-time kräver en "stängd"-händelse som inte finns idag (se
   ovan) — antingen en timer som avbryts om panelen byter innehåll inom 2 sekunder,
   eller att spåra `#toggleRight`/nästa `help-btn`-klick som implicit stängning. Det är
   en reell teknisk komplexitetsökning för en marginell nyttoförbättring.
3. Om en framtida prototyp visar att elever systematiskt "samlar" hjälp-XP genom att
   klicka igenom allt i början av en session utan att läsa, är det en tydlig, mätbar
   signal — och då är dwell-time ett välmotiverat, avgränsat tillägg. Bygg det inte i
   förväg för ett problem som inte är bekräftat.

**Öppen fråga till PO/PM:** ska `help_opened` räknas som en råhändelse eller en
pedagogisk aktivitet (se avsnitt 9)? Den här analysen föreslår att placera den i ett
mellanskikt — se avsnitt 9.

---

## 8. Aktiv tid som XP — tre alternativ

| | A. Endast statistik | B. Låg XP med tak | C. XP kräver samtidig pedagogisk aktivitet |
|---|---|---|---|
| **Pedagogisk nytta** | Ingen direkt — men värdefull som lärarsignal ("hur länge jobbade klassen faktiskt aktivt?") | Låg — belönar närvaro, inte insikt | Måttlig — belönar närvaro *som ledde till* något mätbart |
| **Manipulationsrisk** | Ingen (ingen XP att fuska till) | Hög — hålla fliken fokuserad och röra musen var 55:e sekund räcker | Låg — kräver en riktig pedagogisk aktivitet (avsnitt 9) inom samma intervall, inte bara närvaro |
| **Teknisk komplexitet** | Låg — bara en timer och de tre villkoren i avsnitt 5 | Låg-medel — samma plus ett tak att balansera | Medel — kräver att tidsackumulatorn korsrefereras mot aktivitetsloggen per intervall |
| **Begriplighet för studerande** | Hög (visas bara som "du var aktiv i X minuter") | Hög men missvisande — känns som "jag får poäng bara för att vara inloggad" | Medel — kräver förklaring av *varför* vissa aktiva minuter inte gav XP |
| **Integritet** | Neutral | Neutral | Neutral (inga nya datatyper, bara en korsreferens mellan två redan föreslagna loggar) |
| **Fungerar utan backend** | Ja | Ja | Ja |

**Rekommendation: börja med A.** Visa aktiv tid som ren sessionsstatistik (exemplet i
PM:s underlag — "Aktiv interaktionstid: 27 minuter" — är precis rätt nivå). Inför **inte**
B eller C förrän en prototyp har visat vad faktiska sessioner faktiskt ser ut som; annars
balanseras ett tak mot gissade snarare än uppmätta mönster. Om/när tidsbaserad XP blir
aktuell är C den enda av de två XP-bärande alternativen som är värd att bygga — B:s
manipulationsrisk är för hög för den pedagogiska nyttan.

---

## 9. Tre nivåer: råhändelser, pedagogiska aktiviteter, XP

### Nivå 1 — Råhändelser (hög frekvens, ingen naturlig gräns, ger normalt inte XP direkt)
Klick/tryck, `pointermove` (endast aktivitetssignal), `keydown`, `change` på
parameterfält, `#step`/`#run10`, `#pulse`/`#systemReset`/`#clearChart`,
`#nextStep`/`#prevStep`, `#load`/`#loadPath`, `help_opened`.

### Nivå 2 — Pedagogiska aktiviteter (aggregerat, meningsfulla enheter — huvudkällan till XP)
| Aktivitet | Härledd från | Definitionsförslag |
|---|---|---|
| Genomfört försök | Nivå 1-simuleringshändelser | Ett scenario körs till ett meningsfullt tillstånd. Kan återanvända `tests/simulation/lib/analyze.mjs`s befintliga begrepp `settledStep`/`reachedSpStep` som referens — samma definition av "försöket sa något" som analysverktyget redan använder för att avgöra stabilisering. |
| Genomförd distinkt parameterkonfiguration | Parameterändring + genomfört försök | Se avsnitt 3 — minst en parameter ändrad ≥5 % sedan senaste räknade försök på samma scenario. |
| Genomfört jämförelsepar | Två genomförda försök | Två distinkta konfigurationer på samma scenario/lärstegspar inom samma session. |
| Genomförd mätning | Mät K/T/L-interaktion | `#btnMeasure` aktivt **och** minst en av `#mpPv0`/`#mpPvInf`/`#mp63Line`/`#mpTangent` justerad — inte bara att klicka `#btnFacit`. |
| Slutfört lärsteg | `#nextStep` | Framsteg till ett steg-index som inte tidigare nåtts i den lärstigsinstansen (förhindrar fram-tillbaka-pumpning). |
| Slutförd lärstig | Sista `#nextStep` i en lärstig | Nått lärstigens sista steg. |
| Öppnad unik hjälptext | `help_opened`, första gången per ID och session | Se avsnitt 7 — stödaktivitet, inte en stark kunskapssignal. |

### Nivå 3 — XP
XP baseras i första hand på Nivå 2. Nivå 1-händelser används i första hand för att
**avgöra om** en Nivå 2-aktivitet är genomförd, inte för att ge XP var för sig.

**Vilka råhändelser kan ändå ge en liten direkt XP utan tydlig spamrisk?**
Kriteriet är: händelsen måste ha en **naturlig, inbyggd gräns** — annars måste den gå
via Nivå 2:s deduplicering/trösklar.

| Råhändelse | Direkt XP rimlig? | Motivering |
|---|---|---|
| `help_opened` (unik per session) | **Ja** | Hårt tak på 24 möjliga tillfällen någonsin — se avsnitt 7. |
| `#nextStep` till ett nytt högsta steg-index | **Ja, låg XP** | Begränsat av lärstigens faktiska stegantal — kan inte pumpas obegränsat, bara fram till slutet. Ping-pong (fram/tillbaka) ger 0 om det inte är ett nytt högsta index. |
| `#step` / `#run10` / parameteränding / `click` i allmänhet | **Nej** | Obegränsat repeterbara — måste gå via Nivå 2 (genomfört försök) med sina trösklar och tak, exakt som avsnitt 3–4 redan resonerar. |
| `pointermove` | **Aldrig** | Ren aktivitetssignal, se avsnitt 6. |

---

## 10. Integritet och lagring

Den föreslagna första prototypen (avsnitt 11) ska:
- fungera helt utan backend — allt sker i webbläsarens minne,
- inte identifiera användaren på något sätt,
- inte skicka någon data över nätverket,
- lagra data **endast i minnet under sessionen** — försvinner vid sidladdning,
- **inte** lagra muskoordinater (avsnitt 6),
- **inte** lagra tangenttryckningarnas innehåll — bara att en `keydown` skedde, aldrig
  vilken tangent eller vilket värde som skrevs,
- **inte** användas för betyg eller bedömning i något skede.

**Detta är samma princip som redan gäller för `pathScore` i det befintliga (avstängda)
Test-läget** — poäng har aldrig persisterats till `localStorage`, av samma skäl. Att XP
och aktiv tid håller samma linje är en fortsättning av ett redan etablerat mönster i
appen, inte en ny avvägning.

**Senare, ej beslutat alternativ:** om XP ska överleva en sidladdning krävs
`localStorage` (eller en backend, vilket ligger långt utanför nuvarande arkitektur — se
`docs/development/ENVIRONMENTS.md`s princip om att appen är helt statisk/serverlös). Om
detta blir aktuellt bör **endast summerad XP och sessionsstatistik** sparas, aldrig en
råhändelselogg — men detta är ett framtida beslut, inte något GAM-001 tar ställning till.

**Genomgående markering:** aktiv tid och XP beskriver **aktivitet**, inte **kunskap**
eller **läranderesultat**. Detta bör stå tydligt i gränssnittet den dag XP visas för
användaren, inte bara i det här dokumentet.

---

## 11. Rekommenderad prototyp

Avgränsat nästa steg — **inte en del av GAM-001, kräver ett separat implementationsuppdrag**:

**Prototypen ska:**
- registrera Nivå 1-råhändelser i minnet (ingen persistens),
- mäta synlig sessionstid (enkel `Date.now()`-differens sedan sidladdning),
- mäta uppskattad aktiv interaktionstid enligt modellen i avsnitt 5,
- upptäcka och logga inaktivitetsperioder,
- registrera unika öppnade hjälptexter (`help_opened`, avsnitt 7),
- registrera simulerings- och parameteraktiviteter (Nivå 1 → Nivå 2-härledning, avsnitt 9),
- sammanställa en sessionsrapport i det format PM redan skitserat (sessionstid, aktiv
  tid, genomförda försök, distinkta konfigurationer, öppnade hjälptexter),
- skriva ut resultatet **endast i webbläsarkonsolen**,
- **inte** visa XP eller något tal för användaren,
- **inte** lagra något permanent,
- **inte** röra PROD — endast aktiv i DEV, styrt av `ENV_CONFIG.environment` som redan
  finns (se `docs/development/ENVIRONMENTS.md`) snarare än en ny flagga.

**Frågor prototypen ska besvara innan synlig XP byggs:**
1. Känns 60 sekunders inaktivitetsgräns rätt mot faktisk klickfrekvens, eller pausar
   klockan för ofta/sällan under normal, tankfull användning?
2. Hur mycket aktiv tid innehåller en verklig lärstigsgenomgång faktiskt — är
   "27 av 42 minuter" (PM:s exempel) en rimlig kvot, eller avviker verkliga sessioner
   kraftigt?
3. Ger definitionen av "distinkt parameterkonfiguration" (≥5 % ändring) ett rimligt
   antal räknade försök, eller räknas för mycket/för lite som "nytt"?
4. Är hjälptextsanvändningen koncentrerad (några få populära `?`) eller utspridd — och
   klickas de igenom snabbt (tyder på spam) eller med rimliga mellanrum?
5. Fångar Nivå 2-kategorierna (avsnitt 9) det PO/PM faktiskt vill belöna, eller saknas
   en tydlig pedagogisk aktivitet som borde finnas med?

Detta uppdrag (GAM-001) beslutar inte om prototypen ska byggas — det är ett separat
PO/PM-beslut, se avsnitt 12/13.

---

## 12. Sammanfattande formel (utkast)

```
XP(händelse) = BasXP(kategori)
             × RepetitionsMultiplikator(scenario, distinkta_konfigurationer)
             × [1 om kategori-tak för scenario-instansen inte nått, annars 0]
```

Total XP per session = summan över alla händelser. Ingen global "level"-logik föreslås
här — det är ett separat designbeslut (trösklar, belöningar, ev. badges) som bör vänta
tills själva viktningen är speltestad.

---

## 13. Risker och öppna frågor

1. **Proxy, inte mätning.** Klicktyp och aktiv tid mäter aktivitet, inte förståelse. En
   elev som experimenterar genomtänkt och en elev som klickar slumpmässigt genom allt
   kan i värsta fall få liknande XP. Taken, kravet på *distinkta* konfigurationer och
   kopplingen mellan tid och pedagogisk aktivitet (avsnitt 8–9) minskar detta men
   eliminerar det inte. Rekommendation: betrakta XP och aktiv tid som en
   engagemangsindikator för läraren, inte ett kunskapsmått i sig (se avsnitt 10).
2. **Ny infrastruktur krävs.** Inget klickspårningssystem finns idag — detta är ett helt
   nytt lager (händelseloggning, per-scenario-tillståndsjämförelse, aktiv tid-mätning,
   XP-lagring). Bör inte underskattas; sannolikt större än själva viktningsfrågan.
3. **Var lagras XP?** Se avsnitt 10 — samma princip som `pathScore` i Test-läget: ingen
   persistens i första versionen.
4. **Relation till Test-läget.** Detta är ett nytt, separat koncept — inte en
   vidareutveckling av det avstängda Test-läget. Kontrollfrågorna (kategori A) kan
   fortfarande bidra XP, men huvudtyngden flyttas till *experimenterande*, vilket är en
   annan pedagogisk vinkel än rätt/fel-quiz.
5. **Numren i avsnitt 2 och 3 är en utgångspunkt, inte ett facit.** De bör justeras efter
   en första speltestning — särskilt förhållandet mellan kategori B (simulering) och
   kategori A (progression), som avgör om appen känns som "man belönas för att tänka"
   eller "man belönas för att klicka mycket".
6. **Inaktivitetsgränsen (avsnitt 5) och tröskeln för "distinkt konfiguration" (avsnitt
   3) är båda gissade startvärden**, inte empiriskt underbyggda — prototypen i
   avsnitt 11 är tänkt att ge underlag för att sätta dem med verklig data istället.
7. **`help_opened` hör hemma i ett mellanskikt** (öppen fråga från avsnitt 7): den är
   varken en obegränsat repeterbar råhändelse (den har ett hårt tak) eller en lika stark
   pedagogisk signal som ett genomfört försök. Denna analys placerar den som en
   råhändelse med undantag (avsnitt 9) snarare än att skapa en helt egen nivå — men det
   är en modelleringsdetalj PO/PM kan välja att se annorlunda på.

## 14. Rekommenderat nästa steg

Detta är en analys, inte en implementation — i linje med att spelifiering uttryckligen
ska vänta tills den pedagogiska grunden är stabil (se `CHANGELOG.md`,
`docs/handoffs/HANDOFF_2026-08-23.md`). GAM-001 kompletterade underlaget (aktiv
interaktionstid, hjälptexter, tre-nivåmodellen); nästa steg om PO/PM vill gå vidare är
fortfarande stegvis, inte att bygga hela systemet på en gång:

1. **Prototyp av händelseloggning** (avsnitt 11) — ingen XP-visning ännu. Logga
   Nivå 1/2-händelser i minnet per session, mät aktiv tid enligt avsnitt 5, skriv ut en
   sammanfattning i konsolen. Besvarar frågorna i avsnitt 11 innan XP visas för
   användaren. Endast i DEV.
2. **XP-visning och tak/multiplikator** — bygg bara vidare om prototypen från steg 1
   visar att kategoriseringen fångar det man vill belöna, och först efter att
   inaktivitetsgränsen och konfigurations-tröskeln är satta med verklig data snarare
   än gissade startvärden.

Ingen av dessa punkter är påbörjade eller beslutade — detta dokument är underlag för det
beslutet. Se även `docs/tracking/todo.md` för aktuell status på pedagogisk granskning av
kvarvarande DEV-lärstigar, som PO/PM prioriterat högre än gamification-prototypen just nu.

## 15. Underlag från HOTFIX-v1.4.1: grafavläsning som möjlig ny aktivitet

PO/PM:s uppdrag att dölja tangentlinjens facit i PROD (se `docs/tracking/todo.md`,
HOTFIX-v1.4.1) innehöll produktfeedback om grafmarköravläsningen som ligger utanför
hotfixens eget avgränsade mandat att implementera, men som är relevant underlag för ett
framtida GAM-uppdrag. Dokumenteras här utan att någon kod ändrats för detta.

**Feedback:**

1. Marköravläsningen (crosshair-tooltipen som visar t/PV/u vid hovring över grafen,
   `hoverPos`/mätläget i `apps/app/app.js`) fungerar bra för att läsa av värden i grafen —
   PO:s bedömning efter test, till skillnad från tangentlinjens facit (se HOTFIX-v1.4.1).
2. En framtida pedagogisk aktivitet kan registreras när användaren håller markören
   tillräckligt stilla över grafen under en kort sammanhängande tid ("dwell").
3. Vanlig rörelse över grafen ska **inte** ge XP.
4. Zoomning ska **inte** ge XP.
5. `pointermove` ska fortsatt endast vara en signal för aktiv interaktionstid (samma
   princip som redan gäller för `help_opened`, se avsnitt 7 och
   `docs/development/GAMIFICATION-PROTOTYPE.md`s "Kända begränsningar") — inte en
   direkt räknad händelse.
6. En framtida händelse för genomförd grafavläsning ska baseras på ett tydligt
   dwell-villkor (hur länge markören står still, inom vilken pixel-/tidstolerans), inte
   på antalet `pointermove`-händelser — samma "råhändelse med filter, inte råräkning"-
   princip som resten av denna analys använder för att undvika att belöna spam.
7. Ingen XP eller ny grafhändelse implementerades inom ramen för HOTFIX-v1.4.1 — det låg
   uttryckligen utanför det uppdragets mandat (rent hotfix-uppdrag, inga GAM-002-ändringar
   tillåtna).

**Status:** Underlag för nästa GAM-uppdrag, inte påbörjat. Nästa GAM-uppdrag: undersöka
dwell-baserad grafavläsning som pedagogisk aktivitet utan att belöna zoomning eller
vanlig musrörelse — se punkt 2 i "Rekommenderat nästa steg" (avsnitt 14), där detta
naturligt hör hemma som en del av händelseloggnings-prototypen.

## 16. GAM-003A — XP-modellen provräknad och kalibrerad

PM:s preliminära XP-modell (avsnitt 2–3 i detta dokument var förstadiet) har nu
provräknats fullständigt mot samtliga tio aktiva DEV-lärstigar, tre användarprofiler,
16 manipulationsscenarier och alternativa regler för hjälp-/enstegnings-XP och
nivåkurvor. Fullständig analys, metod och siffror:
`docs/reports/GAM-003A_XP-KALIBRERING.md` (+ maskinläsbar
`GAM-003A_XP-KALIBRERING.json`). Återanvändbart beräkningsverktyg:
`tests/gamification/` (kör oförändrad GAM-002-kod, ändrar den aldrig).

**Sammanfattning av resultatet:**
- PM:s huvudkandidat är en solid utgångspunkt, men två regler (hjälp-XP utan tak,
  enstegnings-XP staplat över många försök) gör att en aktiv fördjupare kan nå
  maxnivån (Reglerlegend) redan efter sju av tio lärstigar — mot kalibreringsmålet.
- Rekommenderad justering: hjälptak 5 unika hjälptexter/session, enstegningstak
  3/försök (ner från 5), och en långsammare nivåkurva
  (0/50/130/250/410/620/890/1220). Med dessa tre ändringar når varken en normal
  användare eller en aktiv fördjupare taket genom en enda genomgång av alla
  lärstigar — se rapportens avsnitt 13/15 för fullständig motivering.
- Checkpoint-XP rekommenderas ligga i ett SEPARAT prestationssystem, inte i
  nivå-XP:t, för att undvika att nivån blir ett kunskapsmått.
- Ett strukturellt fynd: GAM-002 kan bara upptäcka jämförelsepar inom samma
  kontext (scenario/lärstigssteg) — flera lärstigar (inklusive
  `storningar-robusthet.v1`s `continueFromPreviousStep`-funktion, FEAT-030) bygger
  pedagogiskt på jämförelser som korsar kontextgränser och som därför aldrig syns
  för GAM-002. Öppet produktbeslut för en framtida lösning, se rapportens avsnitt 16.

**Status:** XP-modellen är provräknad och tekniskt kalibrerad. Synlig XP är
fortfarande INTE implementerad. Nivå-UX (åtta nivåer, badge, grafisk mätare) är
beslutad (se `docs/development/GAMIFICATION-PROTOTYPE.md`). Produktionsaktivering är
inte beslutad. Nästa planerade steg: **GAM-003B** — synlig DEV-prototyp med
nivåbadge, nivånamn och grafisk nivåmätare. GAM-003B är inte påbörjat.

## 17. GAM-003A.1 — Reviderad princip: repetition ska ge XP

PO/PM granskade GAM-003A och beslutade en korrigerad grundprincip: XP ska
premiera lärandeaktivitet ÄVEN när den upprepas — upprepade försök, lärstigar
och egna parameterexperiment är avsedd användning, inte manipulation.
GAM-003A:s rekommenderade tak (hjälptak, sänkt enstegningstak) drogs tillbaka;
PM:s ursprungliga, okapade regler gäller. En ny, betydligt längre nivåkurva
(0/50/140/300/550/900/1400/2100) infördes istället för att hantera tempot.

Under omkalibreringen hittades och rättades två verkliga fel i
beräkningsverktyget (inte i XP-reglerna): ett sista, ofinaliserat försök i en
händelsesekvens gick tidigare förlorat, och "slutförd lärstig"-XP var av
misstag bestående istället för repeterbar. Båda rättade — se
`docs/reports/GAM-003A.1_XP-KALIBRERING-REPETITION.md`.

**Resultat:** en genomgång av alla tio lärstigar tar ingen profil till
maxnivån. Vid FLERA fullständiga genomgångar (kedjat med ett nytt
`priorState`/`endState`-lager i `xp-model.mjs` som modellerar bestående
progression utan att röra GAM-002:s kod) nås nivå 8 efter 2 genomgångar för
en aktiv fördjupare, 4 för en normal användare, 6 för en minimal användare —
öppen fråga till PO/PM om det tempot är rätt avvägt.

**Tekniskt krav framåt:** en synlig prototyp (GAM-003B) behöver spara
bestående progression (total XP, högsta nått lärsteg per lärstig, redan sedda
konfigurationssignaturer per kontext) mellan sessioner, plus en
"Återställ progression"-funktion. Inte implementerat i GAM-003A.1.

**Status:** Reviderad kalibrering klar. Nästa steg fortsatt GAM-003B, nu med
persistenskravet dokumenterat som förutsättning.
