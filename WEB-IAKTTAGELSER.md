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
### Status: Noterad

### Datum: 2026-05-13
### Del av webbappen: Arkitektur / web vs standalone
### Iakttagelse: Två versioner av webbappen (web-server och standalone) - vilken är den primära? Web kräver serveradministration och är komplex, standalone är enkel och offline. För pedagogisk miljö utan skolintegrering är standalone enklare.
### Konsekvens: Potentiell kodduplicering mellan web och standalone versioner.
### Förslag / nästa tanke: Fokusera på standalone som primär för nu. Web-versionen kan bli "premium-version" för framtida skolintegrering (LMS, dataspårning, samarbete). Håll simulerings-logiken (sim-core) gemensam.
### Status: Noterad - arkitektonisk beslutspunkt

### Datum: 2026-05-13
### Del av webbappen: Paramterar
### Iakttagelse: Parmaterar som visas och är skrivbara bör styras av vilket läge som är valt. Fråga om du är osäker på vad som avses.
### Konsekvens:
### Förslag / nästa tanke:
### Status: Noterad

### Datum: 2026-05-13
### Del av webbappen: PID-beräkning
### Iakttagelse: Vid val a P-reglering beräknas output fel. Endast P-delen ska beräkna output. Det är förmodligen full PID som körs i både P och PI 
### Konsekvens:
### Förslag / nästa tanke:
### Status: Fixerad - P-läge nollställer nu integral och dTerm. PI-läge nollställer dTerm. dTerm-historiken sparar nu korrekt värde istället för raw derivative.