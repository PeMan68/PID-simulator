# Webbapp – Iakttagelser

Denna fil är till för löpande iakttagelser om webbappen som inte nödvändigtvis ska åtgärdas direkt.

Syftet är att samla observationer, idéer, oklarheter och mindre problem utan att de automatiskt blir backlogg-arbete.

## När denna fil ska användas
- När något observeras men inte är moget som konkret uppgift
- När beteenden behöver följas upp senare
- När UI/UX-intryck, pedagogiska reflektioner eller tekniska risker behöver sparas
- När vi vill skilja mellan "noterat" och "ska byggas/fixas nu"

## När något ska flyttas till backloggen
Flytta en punkt till BACKLOG.md när den är tillräckligt tydlig för att bli:
- bugg
- feature request
- konkret förbättring
- prioriterat arbete

## Mall för nya iakttagelser

### Datum:
### Del av webbappen:
### Iakttagelse:
### Konsekvens:
### Förslag / nästa tanke:
### Status: Noterad

---

## Iakttagelser

### Datum: 2026-04-29
### Del av webbappen: Statusrad / stegtransparens
### Iakttagelse:
- Visa även de enskilda bidragen från P-, I- och D-delarna som bildar u. Formlerna behöver inte redovisas explicit.
- Kunna stega både framåt och bakåt för att granska värden i statusraden. När kurvan är plottad ska en markör visa vilket steg som presenteras, inklusive tidpunkt.
### Konsekvens:
### Förslag / nästa tanke: Stegning framåt/tillbaka kräver sparande av alla simulator-stater - kan implementeras senare med state snapshots eller replay-logik.
### Status: Delvis implementerad - P/I/D-bidrag visas nu i statusraden. Stegning framåt/tillbaka planerat för senare.

### Datum: 2026-05-13
### Del av webbappen: PID parametrar/graf
### Iakttagelse: Vid ändring av parmetrar och "Applicera" nollställs graf. Det skainte vara så, grafen ska fortsätta plotta. En knapp "Rensa graf" bör istället läggas till. En annan knapp kan vara "Återställ system" så allt börjar om från utgångsläget.
### Konsekvens:
### Förslag / nästa tanke:
### Status: Implementerad - Grafen behalles vid parameträndring. "Rensa graf" och "Återställ system" knappar är nu tillgängliga.

### Datum: 2026-05-13
### Del av webbappen: graf
### Iakttagelse: GRaferna bör ha en enkel skalering 0-100 på Y-axlorna.
### Konsekvens:
### Förslag / nästa tanke:
### Status: Implementerad - Y-axel visar nu skalering 0-100 med etiketter.

### Datum: 2026-05-13
### Del av webbappen: on/off reglering
### Iakttagelse: Inställning av hysteres saknas och applicering av dem. hysteres ska vara 2 separata inställningar övre och undre och ska beräknas korrekt i regleringen. grafen ska visa hystersgränserna med streckade linjer i annan färg
### Konsekvens:
### Förslag / nästa tanke:
### Status: Implementerad - Hysteresinställningar är nu tillgängliga. Gränser visas som streckade linjer i orange.
### Status: Noterad

### Datum: 2026-05-13
### Del av webbappen: utseende
### Iakttagelse: lägg på ett tema på appen, lite industriellt stuk
### Konsekvens:
### Förslag / nästa tanke:
### Status: Implementerad - Appen har nu ett industriellt tema med metallisk färgpalett, panelkänsla och responsiv layout för desktop/mobil.

### Datum: 2026-05-13
### Del av webbappen: Arkitektur / web vs standalone
### Iakttagelse: Två versioner av webbappen (web-server och standalone) - vilken är den primära? Web kräver serveradministration och är komplex, standalone är enkel och offline. För pedagogisk miljö utan skolintegrering är standalone enklare.
### Konsekvens: Potentiell kodduplicering mellan web och standalone versioner.
### Förslag / nästa tanke: Fokusera på standalone som primär för nu. Web-versionen kan bli "premium-version" för framtida skolintegrering (LMS, dataspårning, samarbete). Håll simulerings-logiken (sim-core) gemensam.
### Status: Noterad - arkitektonisk beslutspunkt

### Datum: 2026-05-13
### Del av webbappen: Parameterstyrning
### Iakttagelse: Parametrar som visas och är skrivbara bör styras av vilket läge som är valt. 
### Konsekvens: Användare kan sätta värden på Ti och Td i P-läge, vilket är förvirrande.
### Förslag / nästa tanke: Dölja/låsa parametrar baserat på läge.
### Status: Implementerad - Ti och Td inputs är nu dolda/låsta när de inte är tillämpliga för det valda läget.

### Datum: 2026-05-13
### Del av webbappen: PID-beräkning
### Iakttagelse: Vid val a P-reglering beräknas output fel. Endast P-delen ska beräkna output. Det är förmodligen full PID som körs i både P och PI 
### Konsekvens:
### Förslag / nästa tanke:
### Status: Fixerad - P-läge nollställer nu integral och dTerm. PI-läge nollställer dTerm. dTerm-historiken sparas nu korrekt värde istället för raw derivative. UI uppdateras: Ti och Td inputs är dolda/låsta när mode=P, Td är dold/låst när mode=PI.

### Datum: 2026-05-13
### Del av webbappen: PID-beräkning
### Iakttagelse: Vid val av manuellt läge bör man kunna sätta utsignalen antar jag, och ingen reglering ska ske? Det finns ingen inmatningsruta för utsignal när man väljer manuellt läge.
### Konsekvens:
### Förslag / nästa tanke:
### Status: Implementerad - Nytt fält "Manuell u" finns och aktiveras endast i Manuell-läge. Värdet används direkt som utsignal utan PID-beräkning. Lägesbyte PID->P använder nu bumpless övergång så u inte hoppar till 0 vid nästa steg.

### Datum: 2026-05-18
### Del av webbappen: PID-beräkning (P-läge / Kp-uppdatering)
### Iakttagelse: Vid ändring av Kp i P-läge och klick på "Applicera parametrar" blir u inte proportionell mot aktuellt fel (u != e*Kp). Efter "Återställ system" kvarstår samma effekt i nästa steg. Exempel: Kp=1, e ca 14, men u ca 24.
### Konsekvens: Användaren får intrycket att Kp inte uppdateras korrekt, och P-regleringens pedagogiska tydlighet försämras eftersom u inte följer enkel P-logik.
### Förslag / nästa tanke: Separera "bumpless transfer" från ren P-beräkning. Lösning: låt bias fasas ut linjärt över 5 steg så att övergången blir mjuk men går tillbaka till ren reglering. Lägg dessutom till val av bumpless transfer (På/Av) så man pedagogiskt kan se skillnaden mellan mjuk övergång och ren P-logik.
### Status: Implementerad - bias fasas ut linjärt över 5 steg. Bumpless checkbox (på/av) tillagd.

---

### Datum: 2026-05-27
### Del av webbappen: Layout / navigationsstruktur
### Iakttagelse: Scenario-väljaren och Lärstig-väljaren ligger idag inline i huvudflödet. Det skulle vara tydligare om de flyttades till en vänsterpanel/sidebar, separerade från parameterkontrollen. Det skulle ge mer plats till grafen och göra det lättare att byta scenario/lärstig utan att blanda ihop med PID-parametrar.
### Konsekvens: Nuvarande layout känns tätt packat när alla kontroller visas samtidigt. Scenario och lärstig har en annan karaktär (övergripande val) jämfört med parametrarna (detaljjustering).
### Förslag / nästa tanke: Lägg till en vänstersidebar (kollapsbar) med Scenario-sektion och Lärstig-sektion. Parametrar och graf förblir i höger/mitten-sektionen. Responsiv design: sidebar kollapsas automatiskt på mobil.
### Status: Noterad

---

### Datum: 2026-05-27
### Del av webbappen: Lärstigar / processbegränsning
### Iakttagelse: En självreglerande process har ett fysikaliskt tak för vad den kan uppnå, bestämt av processförstärkning K och utsignalsgräns u_max: y_max = normalValue + K × u_max. Om SP sätts över y_max integrerar PID:en upp u till 100 % men y fastnar vid taket — processen är för "svag". Jämförelsen med en mopedmotor på max gas som ändå bara ger 50 km/h är pedagogiskt träffande. Detta beteende är inte en bugg utan korrekt fysik, men det är lätt att missförstå som en reglerfel. Det finns heller ingen varning idag när SP är ouppnåeligt.
### Konsekvens: Studenter kan tro att PID:en är felinställd när y aldrig når SP, trots att problemet är i processparametrarna. Saknat feedback leder till felaktig felsökning (ändra Kp, Ti osv. fast det inte hjälper).
### Förslag / nästa tanke:
  1. **Ny lärstig: "Processens begränsningar"** — Steg 1: visa vad K, T, L betyder fysikaliskt. Steg 2: experimentera med K för att se hur y_max förändras. Steg 3: sätt SP > y_max och observera att u fastnar vid 100 %. Steg 4: öka K tills SP är nåbar. Steg 5: diskutera vad som händer i en riktig anläggning (ventil för stor/liten, pump för svag).
  2. **Varning i statusraden** när SP > y_max, t.ex. "⚠ SP ouppnåeligt (y_max=50.0)". Beräknas som normalValue + K × outputLimits.max.
### Status: Noterad — två konkreta åtgärder föreslagna (ny lärstig + statusvarning) 

---

### Datum: 2026-05-27
### Del av webbappen: Lärstigar / gamifiering / test-lager
### Iakttagelse: De befintliga övningsdokumenten (ovningar-grundlaggande.md, ovningar-signalstorningar.md, ovningar-systemoptimering.md) är designade för py-appen men innehåller precis det material som behövs för interaktiva lärstigar i webappen. Varje dokument har redan: steg-för-steg-instruktioner (→ scenario-steg), reflektionsfrågor (→ quiz-steg) och verklighetsexempel (→ teori-steg). Övningarna är naturligt indelade i tre progressionsnivåer som passar tre separata lärstigar.

Idag är lärstigs-systemet passivt: användaren klickar "Nästa steg" utan att behöva visa att de förstått. För att få pedagogisk effekt och gamifiering behövs ett test-lager där svar krävs för att gå vidare.
### Konsekvens: Utan testfrågor kan studenter klicka igenom hela lärstigen utan att lära sig något. Övningsdokumentens reflektionsfrågor är värdefulla men används inte alls i webappen.
### Förslag / nästa tanke:

**Arkitektur — tre steg-typer:**
- `type: "theory"` — finns idag, visar text
- `type: "scenario"` — finns idag, laddar scenario
- `type: "quiz"` — NY: visar en flervalsfråga med 3-4 alternativ; "Nästa steg"-knappen är låst tills rätt svar klickas. Fel svar ger feedback ("Inte riktigt — tänk på att...") utan att blockera permanent.
- `type: "task"` — NY: "Kör simuleringen tills y > 80 inom 30 steg". Appen kontrollerar automatiskt mot simulatorns state och låser upp när villkoret uppfylls.

**Två separata lager:**
1. **Lärstigar** (nuvarande) — guidad utforskning, öppen, ingen kontroll. Passar intro och demonstration.
2. **Utmaningar/Test** (nytt lager) — samma progression men med quiz- och task-steg som blockerar. Passar examination och självtest. Kan ha stjärnbetyg (1-3 stjärnor beroende på antal försök).

**Konvertering av övningsdokumenten:**
- `ovningar-grundlaggande.md` → Lärstig "Grundläggande reglering" (3 delar, ~12 steg)
- `ovningar-signalstorningar.md` → Lärstig "Störningar och robusthet" (mellannivå)
- `ovningar-systemoptimering.md` → Lärstig "Optimering" (avancerad)

Reflektionsfrågor i .md-filerna omvandlas till `quiz`-steg med MCQ. Simuleringsuppgifter ("kör tills systemet stabiliseras") omvandlas till `task`-steg med auto-kontroll.

**Gamifieringselement att överväga:** låsta lärstigar (måste klara grundläggande för att låsa upp mellannivå), framstegsvisning (steg X av Y), stjärnbetyg, lokal sparning av framsteg (localStorage).
### Status: Delvis implementerad — quiz-gates, guidat/test-läge och föregående-knapp klart (2026-05-28)

---

### Datum: 2026-05-28
### Del av webbappen: Lärstigar / test-läge / UX
### Iakttagelse: Klick på "Test"-knappen nollställer poäng och startar lärstigen från steg 1. Det är inte alltid önskat beteende — om användaren råkar klicka Test mitt i en lärstig förlorar de sin progress och måste börja om. Samma gäller om man växlar Guidat→Test→Guidat under pågående genomgång.
### Konsekvens: Oavsiktlig förlust av progress och poäng. Pedagogiskt störande om det händer i klassrum eller under examination.
### Förslag / nästa tanke: Två alternativ — (A) Visa en bekräftelsedialog: "Byta till Test-läge nollställer poäng och startar om. Fortsätt?". (B) Låt lägesbytet bevara steget man är på och bara ändra hur checkpoints renderas; nollställ bara poäng explicit med en "Börja om"-knapp. Alternativ B är mjukare UX och troligen rätt för pedagogisk miljö.
### Status: Noterad