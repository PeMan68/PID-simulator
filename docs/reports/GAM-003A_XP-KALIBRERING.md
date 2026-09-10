# GAM-003A — XP-kalibrering mot samtliga DEV-lärstigar

**Uppdrag:** GAM-003A
**Utförd av:** Claude Code (CC)
**Datum:** 2026-09-08
**Status:** Analys-, test- och kalibreringsuppdrag. **Ingen synlig XP, badge eller
nivåmätare implementerad. Ingen appkod ändrad.**

> **OBS (2026-09-09): Delvis ersatt av GAM-003A.1.** PO/PM granskade denna
> rapport och beslutade en korrigerad grundprincip — repetition (upprepade
> försök, lärstigar och egna parameterexperiment) ska ge full XP, inte
> begränsas. De rekommendationer i avsnitt 9/10/15 nedan som infört tak
> (hjälptak, sänkt enstegningstak) är därför **tillbakadragna**. Under
> omkalibreringen hittades dessutom två verkliga fel i beräkningsmotorn
> (ett ofinaliserat sista försök gick förlorat, och "slutförd lärstig"-XP var
> felaktigt bestående istället för repeterbar) — siffrorna nedan är därför
> något för låga. Se `docs/reports/GAM-003A.1_XP-KALIBRERING-REPETITION.md`
> för den rättade, reviderade kalibreringen. Metoden, verktyget och de
> strukturella fynden (jämförelser mellan lärsteg, avsnitt 6/16) nedan är
> fortsatt giltiga.

---

## 1. Sammanfattning

PM:s preliminära XP-modell (10 XP-kategorier + åtta nivåer) har provräknats mot
samtliga tio aktiva DEV-lärstigar med tre användarprofiler, mot 16
manipulationsscenarier, och mot alternativa regler för hjälp-XP, enstegnings-XP
och nivåkurvor. Verktyget som gjorde detta (`tests/gamification/`) är
återanvändbart och oberoende av GAM-002:s aktivitetsmodell (importerar den
oförändrad, ändrar den aldrig).

**Huvudresultat:**

- Referensen "Test 1" (Proportionalband, en normal-liknande genomgång) gav
  **84 XP** mot PM:s uppskattade 75–79 XP — en avvikelse på +5 XP (7 %), inom
  rimlig marginal givet att PM:s siffra var en handräknad uppskattning. Se
  avsnitt 4.
- Med PM:s huvudkandidat (regler + nivåkurva oförändrade) hamnar en **normal**
  användare på **Processmästare (nivå 7)** efter samtliga tio lärstigar, och en
  **aktiv fördjupare når Reglerlegend (nivå 8, MAX) redan efter sju av tio
  lärstigar**. Det bryter mot kalibreringsmålet att nivå 7–8 inte ska nås genom
  en enda genomgång av alla lärstigar.
- Grundorsaken är inte primärt nivåkurvan utan **två XP-regler som kan bli
  oproportionerligt stora**: hjälp-XP utan tak (24 unika hjälptexter ger **48
  XP** — mer än hela nivå 2:s tröskel på 35 XP, helt utan simulering eller
  jämförelse) och analytisk enstegning som — kombinerat med många
  konfigurationer — blir den enskilt största kategorin (**29 %** av total XP)
  för en aktiv fördjupare.
- En rekommenderad justering (hjälptak = 5 unika hjälptexter/session,
  enstegningstak = 3/försök, långsammare nivåkurva) ger en normal användare
  **Regleradept (nivå 6)** och en aktiv fördjupare **Processmästare (nivå 7,
  75 % mot nivå 8)** efter samtliga tio lärstigar — ingen av profilerna når
  taket genom en enda genomgång, vilket uppfyller kalibreringsmålet. Se
  avsnitt 13 och 15.
- Ett konkret, allvarligt manipulationsfynd: att upprepa **exakt samma**
  konfiguration efter Reset ger fortsatt full "genomfört försök"-XP varje
  gång (bara den nya konfigurations-XP:n uteblir) — en ren repetitions-loop
  ger **24 XP på fem upprepningar** utan någon ny pedagogisk insikt. Se
  avsnitt 7 och 8.
- GAM-002 kan bara upptäcka jämförelsepar **inom samma kontext** (scenario/
  lärstigssteg). Flera lärstigar — inklusive den nya `continueFromPreviousStep`-
  funktionen i "Störningar och robusthet" — bygger pedagogiskt på jämförelser
  som korsar kontextgränser och som GAM-002 därför aldrig ser. Se avsnitt 6.

---

## 2. Ursprunglig XP-modell (PM:s huvudkandidat)

| Kategori | XP | Tak/villkor |
|---|---|---|
| Nytt högsta lärsteg | 2 | En gång per steg och lärstig |
| Slutförd lärstig | 12 | En gång per lärstig och session |
| Genomfört försök (≥20 steg) | 4 | En gång per konfiguration |
| Distinkt parameterkonfiguration | 2 | Först efter genomfört försök |
| Jämförelsepar | 6 | En gång per konfigurationspar |
| Unik hjälptext | 2 | En gång per helpId och session, **inget tak** |
| Genomfört mätarbete | 4 | Aktivering + justering + efterföljande aktivitet |
| Analytisk enstegning | 1 | Högst 5 XP per försök |
| Checkpoint, första rätt | 4 | Analys endast — ej implementerat |
| Checkpoint, rätt efter fel | 2 | Analys endast — ej implementerat |

Nivåkurva (ackumulerad XP): 0 / 35 / 90 / 170 / 280 / 425 / 610 / 840, för
Reglernovis → Looplärling → Signalspanare → Processutforskare → Loopvävare →
Regleradept → Processmästare → Reglerlegend.

---

## 3. Metod

**Verktyg** (`tests/gamification/`, ren Node, ingen webbläsare, kopplas
aldrig till appens UI):

- `xp-model.mjs` — beräkningsmotorn. Kör en händelsesekvens genom
  `apps/app/activity-prototype-core.js` **oförändrad** (samma import som
  `tests/activity-prototype.test.mjs`) och observerar sessionens tillstånd
  (försök, distinkta konfigurationer, jämförelsepar, hjälp, lärstigsprogression)
  **före och efter** varje händelse — XP ges på differensen. Detta lager lägger
  aldrig till egen tolkning av vad som räknas som ett genomfört försök eller en
  distinkt konfiguration; det beslutet ligger helt i GAM-002:s befintliga kod.
  Analytisk enstegning och checkpoints hanteras i ett tunt eget lager ovanpå,
  eftersom GAM-002 inte modellerar dem alls (se avsnitt 6/12).
- `lp-inventory.mjs` — innehållsinventering av alla tio aktiva lärstigar,
  extraherad genom regex-sökning i de faktiska instruktionstexterna
  (`apps/app/content/exercises/*.json`): antal instruerade simuleringssteg,
  antal pedagogiskt distinkta konfigurationer per steg, förekomst av Mät
  K/T/L och pulstriggning. Där texten inte anger ett exakt tal (t.ex. "kör
  samma antal steg som i föregående steg") är värdet en motiverad, explicit
  markerad uppskattning (`note`-fältet per steg i filen).
- `profiles.mjs` — genererar händelsesekvenser för tre profiler (minimal,
  normal, aktiv fördjupare) mot varje lärstig. Allt instruktionen kräver körs
  av **alla** profiler (det är inte valfritt); profilerna skiljer sig bara i
  extra enstegning, hjälpanvändning och (bara aktiv fördjupare) en extra egen
  konfiguration utöver det instruerade.
- `calibrate.mjs`, `manipulation.mjs`, `sensitivity.mjs` — kör provräkningarna
  i avsnitt 5–13 nedan.
- `xp-model.test.mjs` — 33 automatiska regressionstester (se avsnitt 17-
  motsvarigheten, alla gröna).

**Begränsning att vara transparent med:** eftersom GAM-002 inte har körts
mot riktiga användarsessioner ännu, är händelsesekvenserna **simulerade**
utifrån lärstigarnas faktiska instruktionstext — inte inspelade från verklig
användning. Där ett antagande gjorts om användarbeteende (t.ex. hur många
extra hjälptexter en "normal" användare öppnar) är det tydligt markerat i
`profiles.mjs` och nedan, i linje med uppdragets instruktion.

---

## 4. Antaganden

- En "session" = en sammanhängande genomgång av EN lärstig. XP-kategorier som
  är uttryckligen session-begränsade (hjälp, slutförd lärstig) återställs
  därför per lärstig i kalibreringen — i linje med att GAM-002 själv saknar
  persistens mellan sidladdningar.
- Kumulativ nivåprogression "efter samtliga lärstigar" beräknas som summan av
  varje lärstigs oberoende beräknade XP, i katalogordning — en rimlig modell
  av en användare som gör lärstigarna i tur och ordning under en längre period,
  eftersom GAM-002 självt inte har någon mekanism för att föra XP mellan
  sessioner (det är precis vad en framtida GAM-003B-implementation skulle
  behöva lösa separat, t.ex. med `localStorage`).
- Checkpoints existerar inte som GAM-002-händelse. De modelleras som en
  syntetisk händelsetyp `checkpoint_answered`, som visas separat
  (`totalXPWithCheckpoints`) och aldrig blandas in i nivåprogressionen (i
  linje med uppdragets instruktion att checkpoint-XP är analys, inte
  implementation).
- Samtliga profiler svarar rätt på checkpoints första gången i huvudanalysen
  (checkpoint-varianter med fel svar provräknas separat i avsnitt 12).
- "Mät K/T/L" körs av alla profiler i steg som uttryckligen kräver det
  (`usesMeasurement` i inventeringen) — det är obligatorisk aktivitet, inte
  utforskande, så det skiljer inte profilerna åt.

---

## 5. Resultat per lärstig

Total XP (utan checkpoints) per profil, PM:s huvudkandidat:

| Lärstig | Minimal | Normal | Aktiv fördjupare |
|---|---|---|---|
| kom-igång.v1 | 46 | 66 | 81 |
| oppen-slinga-onoff-p.v1 | 34 | 50 | 104 |
| proportionalband-forstarkning.v1 | 60 | 84 | 181 |
| pi-pid.v1 | 38 | 50 | 93 |
| processbegransningar.v1 | 52 | 70 | 144 |
| windup-antiwindup.v1 | 30 | 42 | 85 |
| storningar-robusthet.v1 | 98 | 132 | 264 |
| integrerande-process-niva.v1 | 16 | 22 | 36 |
| stegsvar-identifiering.v1 | 84 | 114 | 180 |
| lambda-metoden.v1 | 40 | 58 | 132 |

Spridningen (16–264 XP) förklaras huvudsakligen av antalet lärstigssteg och
instruerade simuleringssteg (`storningar-robusthet.v1` har flest steg och
flest konfigurationer; `integrerande-process-niva.v1` har bara två steg) —
inte av någon enskild kategoris orimliga bidrag i den normala vandringen.
Skillnaden blir dock stor för **aktiv fördjupare** (upp till 3,3× minimal),
se avsnitt 6 för varför.

---

## 6. Resultat per användarprofil, dubbelbelöning och automatiskt laddade konfigurationer

**Kategorifördelning, summerat över samtliga tio lärstigar:**

| Kategori | Minimal | Normal | Aktiv fördjupare |
|---|---|---|---|
| Nytt högsta lärsteg | 98 (20 %) | 98 (14 %) | 98 (8 %) |
| Slutförd lärstig | 120 (24 %) | 120 (17 %) | 120 (9 %) |
| Genomfört försök | 144 (29 %) | 144 (21 %) | 264 (20 %) |
| Distinkt konfiguration | 72 (14 %) | 72 (10 %) | 132 (10 %) |
| Jämförelsepar | 24 (5 %) | 24 (3 %) | 168 (13 %) |
| Unik hjälptext | 0 (0 %) | 98 (14 %) | 98 (8 %) |
| Genomfört mätarbete | 40 (8 %) | 40 (6 %) | 40 (3 %) |
| Analytisk enstegning | 0 (0 %) | 92 (13 %) | **380 (29 %)** |
| **Totalt** | **498** | **688** | **1300** |

Ingen kategori dominerar för minimal/normal (högst 29 %, "genomfört försök" —
rimligt eftersom det är kärnaktiviteten). För **aktiv fördjupare** blir
**analytisk enstegning den enskilt största kategorin (29 %)** — nära
en-tredjedels-indikatorn i uppdraget. Orsaken är inte enstegningsregeln i sig
(taket på 5/försök håller per försök), utan att den **staplas** över många
försök när en användare medvetet provar flera konfigurationer per steg.

**Högsta möjliga XP:**

- Normalt försök (en konfiguration, inget extra): completedAttempt (4) +
  distinctConfig (2) = **6 XP**, plus upp till 5 XP enstegning = **11 XP**.
- Fördjupat försök med jämförelse (två konfigurationer i samma kontext):
  2×(4+2) + comparisonPair (6) = **18 XP**, plus upp till 10 XP enstegning
  (5/försök × 2 försök) = **28 XP**.
- **Manipulationstest 16** (en enda kort, maximalt utnyttjad session — se
  avsnitt 7) gav **115 XP** — MER än referensens hela "Test 1"-genomgång av en
  riktig sexstegslärstig (84 XP). Det är den tydligaste enskilda varningssignalen
  i denna analys: en kort, mekanisk men "tillåten" sekvens ger mer XP än en
  äkta pedagogisk genomgång.

**Dubbelbelöning:** ett genomfört försök som också är en ny, jämförbar
konfiguration ger redan idag fyra staplade poster (completedAttempt +
distinctConfig + comparisonPair + upp till 5 enstegnings-XP) — det är i sig
rimligt eftersom det verkligen ÄR fyra olika, äkta prestationer (fullföljde,
provade nytt, jämförde, arbetade metodiskt). Problemet är inte att de
staplas, utan att **jämförelsepar och distinkta konfigurationer kan farmas
genom att upprepat ändra en parameter precis över 5 %-tröskeln** (se
manipulationstest 8, avsnitt 7) — det ger äkta, staplad XP för en aktivitet
som pedagogiskt inte är en äkta ny jämförelse.

**Automatiskt laddade konfigurationer:** `scenario_loaded` sätter INTE någon
`ctx.currentConfig`-post i GAM-002 (bara `parameter_changed`/
`regulator_mode_changed`/`process_type_changed` gör det) — ett scenariobyte i
sig kan alltså aldrig utlösa en falsk distinkt-konfiguration-XP. En
automatiskt laddad startkonfiguration bidrar bara till XP om användaren
sedan kör ≥20 steg på den **utan** att ändra något — vilket är exakt rätt
beteende (det är då en genuin, om än ourörd, konfiguration som testats
klart). **Rekommendation:** inget att ändra här — nuvarande gränsdragning
(bara explicita parameterändringar räknas som "konfiguration") är korrekt.

---

## 7. Manipulationstester

16 provräknade scenarier (`tests/gamification/manipulation.mjs`):

| # | Scenario | XP | Kommentar |
|---|---|---|---|
| 1 | Upprepad Reset (20×) | 0 | Korrekt — inga sidoeffekter av ren repetition. |
| 2 | Rensa graf upprepat (20×) | 0 | Korrekt. `chart_cleared` hanteras inte alls av GAM-002. |
| 3 | Samma hjälptext upprepat (15×) | 2 | Korrekt — bara första öppningen räknas. |
| 4 | **Alla 24 hjälptexter, inget annat** | **48** | **Överstiger nivå 2:s tröskel (35) utan en enda simulering.** |
| 5 | Enstegning långt över taket (50×) | 7 | Taket håller (2 för lärsteg + 5 för enstegning). |
| 6 | **Identisk konfiguration upprepad 5× (med Reset mellan)** | **24** | **completedAttempt ges alla 5 gånger; bara 1 distinctConfig.** |
| 7 | Parameter fram/tillbaka, ingen simulering | 2 (bara lärsteg) | Korrekt — inget försök startas utan simuleringssteg. |
| 8 | **Parameter +6 % upprepat 10× (gränsfall)** | **104** | **Varje steg blir en "ny" distinkt konfiguration + par.** |
| 9 | Kort försök (10 steg) | 2 (bara lärsteg) | Korrekt — under 20-stegsgränsen. |
| 10 | 20× Kör 10 utan variation (200 steg) | 8 | Korrekt — en completedAttempt, en distinctConfig, oavsett klickantal. |
| 11 | Mät K/T/L aktiverat, ingen justering | 2 (bara lärsteg) | Korrekt — ingen mätarbets-XP. |
| 12 | Mätjustering utan efterföljande aktivitet | 2 (bara lärsteg) | Korrekt — väntar på uppföljande händelse. |
| 13 | Facit öppnas utan mätning | 2 (bara lärsteg) | Korrekt — facit ger aldrig XP. |
| 14 | Fram/bakåtnavigering, återbesök | 4 | Korrekt — bara två unika stegindex räknas. |
| 15 | Endast pointermove | 0 | Korrekt — når aldrig XP-lagret. |
| 16 | **Maximerad kort session** | **115** | **Se avsnitt 6 — högre än en äkta lärstigsgenomgång.** |

**Slutsats:** 13 av 16 fall beter sig exakt som avsett. **Tre verkliga fynd**
kräver ett beslut (fetmarkerade ovan): obegränsad hjälp-XP (#4), obegränsad
upprepning av identisk konfiguration efter Reset (#6), och farmning via
gränsfallsändringar strax över 5 %-tröskeln (#8). Rekommenderad åtgärd för
#4 i avsnitt 9; #6 och #8 hänger ihop och adresseras bäst genom att inte
ändra 5 %-regeln (den är GAM-002:s befintliga, redan validerade logik) utan
genom nivåkurvan och hjälp-/enstegningstaken (avsnitt 13/15) — att stänga
#6/#8 helt skulle kräva en ändring av GAM-002:s egen
`distinctConfigRelativeThreshold`-logik, vilket ligger utanför GAM-003A:s
mandat (”ändra inte GAM-002:s registreringsmodell”).

---

## 8. Känslighetsanalys — sammanfattning

Se avsnitt 9–11 för hjälp/enstegning/mätarbete i detalj. Generellt: modellen
är känsligast för **hur många försök/konfigurationer** en profil hinner med
per lärstig (linjärt) och **hur högt hjälptaket sätts** (kan ensamt ge upp
till 48 XP, se avsnitt 9) — mindre känslig för själva
distinctConfig/comparisonPair-värdena (2/6 XP), som är väl avvägda i sig.

---

## 9. Hjälp-XP

Provräknat (`tests/gamification/sensitivity.mjs`), XP-summa vid 3 / 8 / 24
unika hjälpöppningar:

| Variant | 3 unika | 8 unika | 24 unika (alla) |
|---|---|---|---|
| A. 2 XP/unik, inget tak (nuvarande) | 6 | 16 | **48** |
| B. 2 XP/unik, tak 5 unika (→ högst 10 XP) | 6 | 10 | 10 |
| C. 1 XP/unik, tak 12 unika (→ högst 12 XP) | 3 | 8 | 12 |

**Bedömning:** 48 XP (variant A, alla 24 hjälptexter) är **för högt** — det
överstiger hela nivå 2:s tröskel (35 XP) genom ren hjälpanvändning, utan
någon simulering, jämförelse eller genomfört försök. Variant B eller C håller
hjälp-XP:t till en rimlig andel (max 10–12 XP, 3–4 % av en typisk lärstigs
totala XP) oavsett hur många hjälptexter som öppnas.

**Rekommendation:** Variant B (2 XP/unik hjälptext, tak 5 unika per session,
högst 10 XP). Enklare att förklara pedagogiskt ("de första hjälptexterna du
öppnar räknas") än C:s omräkning till 1 XP/st.

---

## 10. Enstegnings-XP

Provräknat, singleStep-XP vid 3/5/8/20 klick i samma försök:

| Variant | 3 klick | 5 klick | 8 klick | 20 klick |
|---|---|---|---|---|
| A. 1 XP/klick, tak 5 (nuvarande) | 3 | 5 | 5 | 5 |
| B. 1 XP/klick, tak 3 | 3 | 3 | 3 | 3 |

C (fast bonus 3 XP vid ≥5 enstegningar) och D (ingen egen kategori, högre
`completedAttempt`-XP om enstegning användes) provräknades inte numeriskt —
båda kräver en annan regelform än "XP per händelse med tak" och ändrar
principen från "belöna varje analytisk steg" till "belöna att metoden
användes alls", vilket är en produktfråga snarare än en kalibreringsfråga.

**Bedömning:** Begriplighet och spamrisk är goda i både A och B (taket håller
i båda). Pedagogisk signal är starkare i A (fler steg → mer XP, upp till
taket) men avsnitt 6 visar att A:s tak (5) staplat över många försök blir
appens **enskilt största XP-källa** för en aktiv fördjupare (29 %). Variant B
(tak 3) minskar den kategorin proportionellt (~40 %) utan att ändra
grundprincipen.

**Rekommendation:** Variant B (tak 3/försök). Enstegning gynnas fortfarande
tydligt mer än Kör 10 (som ger 0 direkt XP) — bara det extrema taket sänks.

---

## 11. Mätarbete

Provräknat: 0 justeringar → 0 XP, 1 justering + efterföljande aktivitet →
4 XP, 2+ justeringar → samma 4 XP (nuvarande regel skiljer inte på antal
justeringar, bara på om minst en gjordes).

Mätarbete utgör redan en liten andel av total XP (3–8 %, avsnitt 6) — det
dominerar inte och riskerar inte att göra det ens vid intensiv användning,
eftersom `usesMeasurement`-steg är begränsade till fyra lärstigar
(`pi-pid.v1`, `processbegransningar.v1`, `stegsvar-identifiering.v1`, och
Mät K/T/L-fördjupning i övriga).

**Bedömning av alternativen:**
- A (4 XP, nuvarande villkor) — rimligt, ingen dominansrisk.
- B (3 XP) — marginell skillnad, ingen stark motivering att sänka.
- C (kräver ≥2 justeringar) — skulle göra regeln strängare utan att lösa
  något verkligt problem (mätarbete dominerar inte).
- D (bara i uttryckligen mät-instruerade lärsteg) — **redan uppfyllt i
  praktiken**: `usesMeasurement`-flaggan i inventeringen visar att Mät K/T/L
  bara förekommer i steg där lärstigen uttryckligen ber om det. Att
  hårdkoda detta i XP-regeln (istället för i innehållsmodelleringen) skulle
  kräva att appen känner till vilka steg som "kräver" mätning — en
  innehållsschemaändring utanför GAM-003A:s mandat.

**Rekommendation:** Behåll A (4 XP, aktivering + minst en justering +
efterföljande aktivitet). Inget kalibreringsproblem här.

---

## 12. Checkpoint-XP

Provräknat (alla rätt första gången, rätt efter ett fel, flera fel före
rätt svar) — beteendet är entydigt: 4 XP första rätt, 2 XP rätt efter fel,
0 XP för varje fel svar, oavsett hur många fel som föregår ett rätt svar.

Referensen "Test 1" med checkpoints inkluderade blev **84 + 24 = 108 XP**
(sex checkpoints, alla rätt första gången) — checkpoint-XP:t ensamt (24 XP)
motsvarar mer än **70 % av nivå 2:s tröskel (35 XP)** för en enda lärstig.
Om checkpoint-XP läggs till nivå-XP:t rakt av finns en påtaglig risk att
nivåprogressionen i praktiken blir ett kunskapsmått (rätt/fel på
kontrollfrågor) snarare än ett aktivitetsmått (experimenterande), vilket
strider mot den beslutade UX-riktningen ("nivå som beskriver aktivitet och
progression, inte kunskap").

**Rekommendation:** Checkpoint-XP ska **ligga i ett separat
prestationssystem** (t.ex. en egen "kunskaps"-indikator kopplad till
Test-läget) snarare än blandas in i aktivitetsnivån, och ska under alla
omständigheter vänta tills Test-läget är färdigt och produktionsaktuellt.
Detta är i linje med uppdragets egen instruktion att inte implementera
checkpoint-XP i appen.

---

## 13. Nivåkurvor

Slutnivå efter samtliga tio lärstigar, per kurva och profil (PM:s
huvudkandidats XP-regler, om inte annat anges):

| Kurva | Minimal | Normal | Aktiv fördjupare |
|---|---|---|---|
| Huvudkandidat (0/35/90/170/280/425/610/840) | Regleradept | Processmästare | **Reglerlegend (MAX, redan efter lärstig 7/10)** |
| Snabbare (0/22/55/100/165/250/360/500) | Processmästare | **Reglerlegend (MAX)** | Reglerlegend (MAX) |
| Långsammare (0/50/130/250/410/620/890/1220) | Loopvävare | Regleradept | Reglerlegend (MAX) |

Med **oförändrade XP-regler** löser INGEN av de tre kurvorna problemet helt —
en aktiv fördjupare (1300 XP totalt) överskrider även den långsammare
kurvans topp (1220). Nivåkurvan ensam räcker alltså inte; XP-reglerna måste
också justeras (se avsnitt 15).

**Kombinerat med de rekommenderade regeljusteringarna** (hjälptak 5 unika,
enstegningstak 3/försök) och den **långsammare kurvan**:

| Profil | Slutnivå efter alla 10 lärstigar |
|---|---|
| Minimal | Loopvävare (nivå 5), 42 % mot Regleradept |
| Normal | **Regleradept (nivå 6)**, 21 % mot Processmästare |
| Aktiv fördjupare | **Processmästare (nivå 7)**, 75 % mot Reglerlegend |

Ingen profil når nivå 8 (Reglerlegend) genom en enda genomgång av alla
lärstigar — kalibreringsmålet uppfyllt. En aktiv fördjupare kommer nära
(75 %) vilket är rimligt: "viss fördjupning eller återbesök" (uppdragets
egen formulering) räcker för att nå taket, utan att det sker automatiskt.

**Milstolpar för normal-profilen (rekommenderad modell):**

| Lärstig (katalogordning) | Kumulativ XP | Nivå |
|---|---|---|
| 1. kom-igång.v1 | 66 | **Looplärling** (nivå 2, redan efter första lärstigen ✓) |
| 2. oppen-slinga-onoff-p.v1 | 116 | Looplärling |
| 3. proportionalband-forstarkning.v1 | 198 | **Signalspanare** (nivå 3, efter tre lärstigar — målet var "ungefär två", se avsnitt 16) |
| 4. pi-pid.v1 | 248 | Signalspanare |
| 5. processbegransningar.v1 | 318 | **Processutforskare** (nivå 4, efter fem lärstigar ✓ "flera") |
| 6. windup-antiwindup.v1 | 360 | Processutforskare |
| 7. storningar-robusthet.v1 | 488 | **Loopvävare** (nivå 5, efter sju lärstigar ✓ "återkommande användning") |
| 8. integrerande-process-niva.v1 | 510 | Loopvävare |
| 9. stegsvar-identifiering.v1 | 618 | Loopvävare |
| 10. lambda-metoden.v1 | 676 | **Regleradept** (nivå 6, slutnivå efter alla lärstigar) |

**Rekommendation:** Den långsammare kurvan (0/50/130/250/410/620/890/1220),
kombinerad med regeljusteringarna i avsnitt 15.

---

## 14. XP-fördelning

Se tabellen i avsnitt 6. Sammanfattat mot uppdragets indikator ("ingen
kategori bör ge mer än ca en tredjedel"):

- **Minimal/normal:** ingen kategori över 29 % — inga problem.
- **Aktiv fördjupare (huvudkandidatens regler):** analytisk enstegning 29 %,
  gränsfall mot en tredjedel. **Med rekommenderad enstegningstak (3 i stället
  för 5)** sjunker den andelen proportionellt (~uppskattat 20–22 %) utan att
  någon annan kategori tar över dominansen.
- Hjälp bidrar aldrig mer än 14 % ens innan hjälptaket införs (den teoretiska
  maxandelen, manipulationstest 4, är en isolerad session utan annan
  aktivitet — inte representativ för en riktig lärstigsgenomgång).
- Lärstegsprogression (nytt högsta steg + slutförd lärstig) dominerar ALDRIG
  ensam (max 44 % kombinerat för minimal, där den andelen är rimlig eftersom
  minimal-profilen per definition gör lite annat).

---

## 15. Rekommenderad slutmodell

**PO/PM:s huvudförslag** (oförändrat, avsnitt 2) är en solid utgångspunkt —
kategorierna, deras syften och grundvillkoren är väl genomtänkta. Justeringen
nedan är begränsad till tre parametrar och en tabell, inte en omdesign.

| Aspekt | PO/PM:s huvudförslag | CC:s beräknade rekommendation |
|---|---|---|
| Hjälp-XP | 2 XP/unik, inget tak | 2 XP/unik, **tak 5 unika/session (högst 10 XP)** |
| Enstegningstak | 5/försök | **3/försök** |
| Nivåkurva | 0/35/90/170/280/425/610/840 | **0/50/130/250/410/620/890/1220** |
| Övriga XP-värden | Oförändrade | Oförändrade — inget kalibreringsproblem hittat |
| Mätarbete | 4 XP, aktivering+justering+uppföljning | Oförändrat |
| Distinkt konfiguration / jämförelsepar | 2 / 6 XP | Oförändrat (se avsnitt 6 om varför 5 %-farmning inte löses här) |
| Checkpoints | Specificerad men ej implementerad | **Separat prestationssystem, inte del av nivå-XP** (se avsnitt 12) |
| Automatiskt laddade konfigurationer | Ej explicit adresserat | Bekräftat korrekt hanterat redan (avsnitt 6) — ingen ändring |
| Jämförelser mellan lärsteg | Ej explicit adresserat | Kräver framtida lösning, se avsnitt 16 (öppet beslut) |

**Förväntat nivåtempo** med rekommendationen (normal-profil): nivå 2 efter
lärstig 1, nivå 3 efter lärstig 3, nivå 4 efter lärstig 5, nivå 5 efter
lärstig 7, nivå 6 (slutnivå) efter lärstig 10. Se avsnitt 13.

**0-XP-aktiviteter:** oförändrad lista, bekräftad korrekt i samtliga
manipulationstester (avsnitt 7).

---

## 16. Öppna produktbeslut

1. **Jämförelser mellan lärsteg/scenario-ID.** GAM-002 ser bara jämförelser
   inom samma kontext. Flera lärstigar (proportionalband-forstarkning,
   pi-pid, lambda-metoden) och särskilt `storningar-robusthet.v1` (vars
   `continueFromPreviousStep`-funktion uttryckligen är byggd för att låta en
   jämförelse spänna över flera lärstigssteg) missar därför jämförelsepar som
   pedagogiskt är kärnan i övningen. **Förslag på framtida lösning:** låt
   grafmarkeringarna från PED-004/FEAT-030 (`sim.history.markers`, satta vid
   varje betydelsefull parameterändring) fungera som en TREDJE signalkälla
   utöver GAM-002:s kontext-interna jämförelsepar — eller, enklare och mer
   robust, låt lärstigsformatet deklarera explicit vilka steg som utgör ett
   jämförelsepar (`"comparesWithStep": 2` e.d.), så att GAM-003B kan räkna
   dem utan att gissa. **Ingen ändring av lärstigsformatet gjord i
   GAM-003A**, per uppdragets avgränsning.
2. **Nivåkurva:** rekommenderad långsammare kurva (avsnitt 13) kräver PO/PM:s
   godkännande — den är en synlig produktparameter, inte bara teknisk
   kalibrering.
3. **Hjälptak och enstegningstak:** kräver PO/PM:s godkännande av samma skäl.
4. **Checkpoint-XP:** kräver ett produktbeslut om det ska bli ett separat
   prestationssystem, vänta helt till Test-läget är klart, eller utgå helt
   ur GAM-003B:s scope.
5. **5 %-farmning (manipulationstest 8):** inget förslag lämnas i GAM-003A
   eftersom en lösning skulle kräva att ändra GAM-002:s
   `distinctConfigRelativeThreshold`-logik — uttryckligen utanför detta
   uppdrags mandat. Flaggas som underlag för ett eventuellt separat
   GAM-uppdrag om PO/PM bedömer risken som tillräckligt stor i praktiken.

---

## 17. Underlag för GAM-003B

GAM-003B (synlig DEV-prototyp: nivåbadge, nivånamn, grafisk nivåmätare) kan
utgå från:

- `tests/gamification/xp-model.mjs` som referensimplementation för
  XP-/nivålogiken (portas till/anropas från en app-sida integration —
  **inte** genom att koppla in denna testfil direkt i `app.js`, som är en
  testverktygsfil utan felhantering för webbläsarmiljö).
- De rekommenderade parametervärdena i avsnitt 15, i väntan på PO/PM:s
  formella godkännande (öppna beslut, avsnitt 16).
- `docs/planning/GAMIFICATION-XP-ANALYS.md` avsnitt 15 (grafavläsning som
  möjlig ny aktivitet, från HOTFIX-v1.4.1) som en ANNAN öppen kandidatkategori
  att eventuellt inkludera i GAM-003B:s första version eller lämna till en
  uppföljning.
- Öppna beslutet om jämförelser mellan lärsteg (avsnitt 16, punkt 1) bör
  lösas INNAN eller SOM DEL AV GAM-003B, eftersom flera lärstigars kärnpoäng
  annars aldrig kan trigga jämförelse-XP i en synlig nivåfunktion.
