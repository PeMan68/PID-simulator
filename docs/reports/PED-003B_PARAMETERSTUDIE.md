# PED-003B — Parameterstudie

**Uppdrag:** PED-003B
**Utförd av:** Claude Code (CC)
**Datum:** 2026-08-22
**Status:** Teknisk leveransrapport — visas inte i appen.

Denna rapport dokumenterar hur parametrarna för de nya jämförelsescenarierna
i PED-003B togs fram, vilka kandidater som förkastades och varför, samt en
lista över instruktioner i övriga (oförändrade) lärstigar som bör
kalibreras i ett senare uppdrag.

---

## 1. Använd analysmetod

Samtliga värden i denna rapport är framtagna med det återanvändbara
verktyget i `tests/simulation/` (se avsnitt 9), inte genom visuell
gissning. Metoden var en systematisk sweep: för varje jämförelsepar
kördes ett antal Kp/Ti/Td-kombinationer genom `runAnalysis()`, resultaten
jämfördes mot de pedagogiska urvalskraven i uppdraget (tydlighet, inga
extrema oscillationer, ingen dominerande mättning, rimligt antal steg),
och den kombination som bäst uppfyllde kraven valdes. Sökskripten själva
var engångsskript och har inte sparats i repot (de är inte del av det
återanvändbara verktyget) — men är fullt reproducerbara med
`tests/simulation/cli.mjs` eller `runAnalysis()` med samma parametrar som
anges nedan.

## 2. Definitioner av mätvärden

Se `tests/simulation/README.md` för fullständiga definitioner. Sammanfattat:

- **Stationärt fel** = SP − uppmätt stationärt PV-värde (medelvärde av
  sista 20 stegen).
- **Översläng** (`overshootAbs`/`overshootPct`) — riktningsmedveten
  avvikelse över/under det stationära slutvärdet, i procent av stegets
  storlek.
- **Insvängningstid** (`settledStep`) — första steg där PV går in i och
  stannar kvar inom ett toleransband (2 % av stegstorleken, minst 10
  sammanhängande steg) kring det stationära slutvärdet. Skiljs
  uttryckligen från **"nått SP"** (`reachedSpStep`, mätt mot SP istället
  för mot det faktiska slutvärdet) — en P-regulator kan ha ett
  `settledStep` utan att någonsin få ett `reachedSpStep`.
- **Oscillation** — tre eller fler lokala extrempunkter i PV-kurvan efter
  ett steg, utöver brusgolvet.
- **Mättning** (`saturatedSteps`) — antal steg där utsignalen legat vid
  `outputLimits.min` eller `.max`.

## 3. Testade parameterområden

| Jämförelse | Process | Kp-intervall | Ti-intervall | Td-intervall |
|---|---|---|---|---|
| P vs PI | K=1.5, T=15, L=1 | 0.5 – 2.0 | 5 – 30 | — |
| PB-utforskning (nya lärstigen, steg B–D) | K=1.5, T=15, L=1 | 0.3 – 80 | — | — |
| PI vs PID (första försök) | K=1.5, T=15, L=2 | 1.5 – 3 | 8 – 15 | — |
| PI vs PID (slutgiltig process) | K=1.5, T=15, L=5 | 1.5 – 5 | 5 – 15 | 1 – 8 |

**Varför L=2 förkastades för PI/PID-paret:** med bara L=2 dödtid gav ingen
testad Kp/Ti-kombination mätbar översläng (samtliga <0.1 %) — processen var
för väldämpad. L=5 valdes istället, vilket gav ett realistiskt spann av
översläng (7–38 %) att välja en pedagogiskt lämplig punkt inom.

## 4. Valda parametrar

### P vs PI (`p-pi-comparison-p` / `p-pi-comparison-pi`)

Process: K=1.5, T=15, L=1, normalValue=0, SP=60.

| | Kp | Ti | Stationärt fel | Översläng | Insvängd (steg) | Nått SP |
|---|---|---|---|---|---|---|
| P | 1.0 | – | 24.1 (40 % av SP) | 0.2 % | 17 | Nej |
| PI | 1.0 | 12 | −0.07 (≈0) | 1.1 % | 24 | Ja (steg 23) |

Motivering: Kp=1.0 ger ett stort, tydligt kvarstående fel utan att vara
extremt. Ti=12 valdes för att eliminera felet **utan** att introducera
märkbar översläng (endast 1.1 %) — jämförelsen ska handla om att felet
försvinner, inte om översläng (det är nästa lärstigs ämne).

### PB-utforskning (samma process, `p-pi-comparison-p` med olika Kp live i UI)

| Kp | PB | Stationärt fel | Översläng | Oscillerar | Mättade steg (av 100) |
|---|---|---|---|---|---|
| 0.5 | 200 % | 34.3 | 0 % | Nej | 1 |
| 2 | 50 % | 15.0 | 0 % | Nej | 4 |
| 5 | 20 % | 7.1 | 5.8 % | Nej | 7 |
| 20 | 5 % | 0.2 | 11.7 % | **Ja** | 83 |

Progressionen 0.5 → 2 → 5 → 20 valdes eftersom den tydligt visar: gradvis
minskat fel, första tecken på översläng vid Kp=5, och kraftig
oscillation/mättning (på/av-liknande beteende) vid Kp=20.

### PI vs PID (`pi-pid-comparison-pi` / `pi-pid-comparison-pid`)

Process: K=1.5, T=15, L=5, normalValue=0, SP=60.

| | Kp | Ti | Td | Stationärt fel | Översläng | Insvängd (steg) | Mättade steg (av 100) |
|---|---|---|---|---|---|---|---|
| PI | 1.5 | 10 | – | 0.12 (≈0) | 14.6 % | 62 | 6 |
| PID | 1.5 | 10 | 2 | 0.00 | 1.9 % | 25 | 6 |

Motivering: samma Kp/Ti behålls mellan PI och PID så att **enbart Td**
förklarar skillnaden (per DEL 6:s krav om identiska försöksvillkor).
Td=2 valdes framför Td=1 (mindre tydlig skillnad, 4.4 % översläng) och
Td=5+ (oscillation börjar uppstå, se förkastade kandidater) — Td=2 gav
den tydligaste, mest stabila demonstrationen av dämpning. Mättningen är
identisk (6 steg) i båda scenarierna, så den påverkar inte jämförelsen
snett.

## 5. Förkastade kandidater

| Kandidat | Resultat | Varför förkastad |
|---|---|---|
| Process L=2 för PI/PID-paret, Kp 1.5–3, Ti 8–15 | Översläng ≈0 % i alla kombinationer | Kunde inte ge mätbar översläng — för väldämpad process för syftet |
| PI Kp=3, Ti=5 (L=5-processen) | Översläng 35.8 %, oscillerande, 64/150 steg mättade | Mättningen dominerar förloppet, uppfyller inte "mättning ska inte dominera jämförelsen" |
| PI Kp=2, Ti=5 | Steady-state error −7.04 efter 150 steg (aldrig riktigt insvängd) | För aggressiv, hinner inte visa ett rent, avslutat förlopp inom rimlig tid |
| PID Td=6 | Översläng 25.6 %, oscillerande (11 extrempunkter), fel steg upp till 0.39 | D-delen överkompenserar — ger sämre resultat än PI, fel pedagogiskt budskap |
| PID Td=8 | Översläng 29.5 %, kraftigt oscillerande (24 extrempunkter), 84/150 mättade | Samma problem, värre |
| PID Td=1 | Översläng 4.4 %, insvängd steg 35 | Fungerande, men mindre tydlig kontrast mot PI:s 14.6 % än Td=2 gav — inte fel, men Td=2 bedömdes pedagogiskt tydligare |
| PB-progression med Kp=0.3 som startpunkt (steg B) | Fel=41.4, ingen översläng | Fungerande men gav mindre "rund" PB-siffra (333 %) än Kp=0.5 (200 %) — Kp=0.5 valdes för enklare huvudräkning |

## 6. Mätresultat

Se tabellerna i avsnitt 4. Fullständiga JSON-resultat (inklusive
tidsserier) kan återskapas exakt med:

```bash
node tests/simulation/cli.mjs --scenario p-pi-comparison-p --steps 40 --json
node tests/simulation/cli.mjs --scenario p-pi-comparison-pi --steps 40 --json
node tests/simulation/cli.mjs --scenario pi-pid-comparison-pi --steps 100 --json
node tests/simulation/cli.mjs --scenario pi-pid-comparison-pid --steps 100 --json
```

## 7. Rekommenderat antal steg per nytt/ändrat försök

| Lärstig | Steg | Scenario | Rekommenderat (instruerat) | Verifierat mot |
|---|---|---|---|---|
| proportionalband-forstarkning.v1 | B (stort PB) | p-pi-comparison-p (Kp=0.5 live) | minst 30 | settled=25 |
| proportionalband-forstarkning.v1 | C (minska PB) | samma (Kp=2, Kp=5 live) | minst 30 vardera | settled=10 resp. 11; översläng synlig vid 30 steg för Kp=5 |
| proportionalband-forstarkning.v1 | D (mkt litet PB) | samma (Kp=20 live) | minst 50 | oscillation/mättning tydligt etablerad vid 50 steg (9 extrempunkter, 41/50 mättade) |
| proportionalband-forstarkning.v1 | E1 (P) | p-pi-comparison-p | minst 30 | settled=17 |
| proportionalband-forstarkning.v1 | E2 (PI) | p-pi-comparison-pi | minst 30 | settled=24, nått SP steg 23 |
| pi-pid.v1 | A (PI) | pi-pid-comparison-pi | minst 90 | settled=62 |
| pi-pid.v1 | B (PID) | pi-pid-comparison-pid | minst 90 | settled=25 |

Samtliga siffror ovan är verifierade genom att köra exakt det instruerade
antalet steg genom verktyget (inte bara mot `settledStep`, som kräver
marginal utöver själva insvängningsögonblicket för hold-perioden).

## 8. Kända begränsningar

- Parametrarna är valda för **pedagogisk tydlighet**, inte som exempel på
  optimal regulatorinställning (t.ex. är PID Td=2 inte nödvändigtvis
  "bäst" i någon formell mening — bara tydligast för demonstrationen).
- Sökningen var en rutnätssökning (grid search) över ett begränsat antal
  värden per parameter, inte en uttömmande optimering.
- Se även begränsningarna i `tests/simulation/README.md` (oscillationsmått
  är en heuristik, ingen pulsstörningssimulering i verktyget än).

## 9. Hänvisning till det återanvändbara verktyget

Allt ovanstående är framtaget med `tests/simulation/` — se
[tests/simulation/README.md](../../tests/simulation/README.md) för fullständig
dokumentation, definitioner och exempel. Verktyget använder
`apps/app/sim-core.js`, samma simuleringskod som webbappen kör i
produktion (se README:t för resonemanget kring `packages/sim-core/`).

---

## Framtida kalibreringskandidater

Instruktioner i **oförändrade** lärstigar (utanför PED-003B:s scope) som
sannolikt bör verifieras mot `tests/simulation/` i ett separat uppdrag.
Ingen av dessa är ändrad eller åtgärdad här.

| Lärstig | Steg | Nuvarande instruktion | Scenario | Varför verifiera |
|---|---|---|---|---|
| windup-antiwindup.v1 | 2 ("Observera windup utan anti-windup") | "Kör 150 steg" | pi-windup-demo | Ej verifierat att 150 steg är rätt mängd för att tydligt visa den kraftiga överslängen utan att vara onödigt långt |
| windup-antiwindup.v1 | 3 ("Anti-windup aktiverat") | "Kör 150 steg igen" | pi-windup-demo | Samma fråga för det dämpade förloppet |
| integrerande-process-niva.v1 | 2 ("Styr en tanknivå med PI") | "Kör 200 steg" | integrating-pi | Ej verifierat om 200 steg räcker för att tydligt nå och hålla u_jämvikt, eller om det är i överkant |
| processbegransningar.v1 | 2 ("Svag process") | "Kör 50 steg" (efter live-ändring K=0.5, SP=80) | pi-step-self-regulating (ändrad live) | Ej verifierat att y tydligt hunnit fastna vid taket (y_max=50) inom 50 steg |
| processbegransningar.v1 | 3 ("Dötid och reglering") | "Kör 80 steg" (efter live-ändring L=5) | pi-step-self-regulating (ändrad live) | Ej verifierat att den försämrade insvängningen är tydligt synlig inom 80 steg |
| lambda-metoden.v1 | 2 (processidentifiering) | "Kör 100 steg" | lambda-open-loop | Ej verifierat mot processens faktiska tröghet (T=20, L=5) |
| lambda-metoden.v1 | 3 (måttligt λ) | "Kör 200 steg" | lambda-pi-moderate | Instruktionstexten påstår "inregleringstiden är ungefär λ+L=25 steg" — bör verifieras med `settledStep`, och om sant är 200 steg möjligen onödigt många |
| lambda-metoden.v1 | 4 (aggressivt λ) | "Kör 200 steg" | lambda-pi-aggressive | Ej verifierat att översläng/oscillation syns tydligt inom rimlig tid |
| lambda-metoden.v1 | 5 (konservativt λ) | "Kör 200 steg" | lambda-pi-conservative | Ej verifierat att 200 steg räcker för den långsammare inregleringen vid λ=3T=60 |
| stegsvar-identifiering.v1 | 2–3 (manuellt stegsvar) | "Kör 60 steg" / "kör 120 steg" | manual-identification | Ej verifierat att respektive fas hunnit stabiliseras exakt vid angivet stegantal — särskilt relevant eftersom eleven ska avläsa PV₀/PV∞ ur grafen |

**Rekommendation:** dessa hanteras lämpligen som ett eget, avgränsat
uppdrag (t.ex. "PED-005 — kalibrera befintliga stegantal") snarare än att
blandas in i PED-004 (rensning av oanvänt innehåll), eftersom de handlar
om att **verifiera** befintligt innehåll, inte ta bort det.
