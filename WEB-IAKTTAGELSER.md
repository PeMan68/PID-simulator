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