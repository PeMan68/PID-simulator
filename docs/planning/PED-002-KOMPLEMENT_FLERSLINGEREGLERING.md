# Komplement till PED-002 — Kaskad, kvot, framkoppling, parameterstyrning

**Uppdrag:** Ingen (ej ett tilldelat PED-nummer i det här repots uppdragsflöde)
**Utförd av:** Claude Code, i kursplaneringsrepot `YHAU25-Industriell_Mät_och_Reglerteknik`, på uppdrag av kursledaren
**Datum:** 2026-09-18
**Bakgrund:** Kursledaren planerar vecka 39 (kör 21–25/9, dvs. mycket nära i tid) och frågade om PID Simulator kan täcka veckans fyra reglerstrategier — kaskad, kvot, framkoppling, parameterstyrning. En agent fick i uppdrag att kartlägga `sim-core`, `scenario-schema` och appens UI för att svara på frågan, och hittade under tiden `PED-002_PROGRESSIONSKARTLAGGNING.md`, som redan identifierat samma fyra ämnen som **A-lucka** ("Kritiska luckor", avsnitt 3) och dragit slutsatsen att de "kräver flerslingearkitektur... bör hanteras som ett eget strategiskt beslut."

Det här dokumentet **ersätter inte PED-002** — det bekräftar dess kärnslutsats oberoende (ingen kod skriven mot dessa fyra ämnen sedan 2026-08-21, verifierat via sökning i `docs/tracking/todo.md` och de senaste PED-003/PED-005-rapporterna) men nyanserar den på en punkt som är relevant för prioritering: **de fyra ämnena är inte lika svåra**, och att gruppera dem som en enda arkitekturfråga riskerar att blockera två av dem i onödan.

Ingen kod är skriven. Det här är en analys, inte ett produktbeslut.

---

## Kärnfynd: två svårighetsgrupper, inte en

PED-002 grupperar alla fyra under samma dom ("kräver flerslingearkitektur"). En närmare titt på `packages/sim-core/` visar att det bara stämmer för två av dem.

### Grupp A — ryms inom dagens en-slinge-arkitektur

**Parameterstyrning (gain scheduling).** Behöver ingen andra process, ingen andra regulator:
- `ProcessModel` (`process.js`) behöver en olinjär förstärkning K(y) eller K(u) i stället för konstant K — annars finns inget att demonstrera olinjäriteten med.
- `PIDController` (`controllers.js`) behöver ett scheman-fält: kp/ti/td som funktion av en referenssignal (GSref), t.ex. en enkel brytpunktstabell.
- UI-tillägg: en extra kurva som visar aktuellt GSref/aktuell förstärkning. Ingen ny panel krävs.

**Framkoppling (feedforward).** Också en-slinge-kompatibel, till skillnad från hur PED-002 grupperar den:
- Dagens störningsmekanism i `process.js` (`disturbance` = Gaussiskt brus + puls, adderas rakt på `y`, alltså omätbar för regulatorn) behöver bli en **mätbar** signal med ett känt förlopp (t.ex. ett tidsstyrt steg).
- `simulation.js` behöver ett litet nytt block: u_ff = Kf · Δv, adderat till regulatorns ordinarie utsignal innan den skickas till processen.
- Ingen ny regulatorinstans, ingen ny process — bara en ny signalväg i orkestreringslagret.

### Grupp B — kräver riktig flerslingearkitektur (håller med PED-002 här)

**Kaskadreglering.** Två `ProcessModel`-instanser dynamiskt kopplade i serie (den inre processens faktiska utsignal blir en del av den yttre processens insignal) + två `PIDController`-instanser (yttre regulatorns utsignal blir inre regulatorns börvärde — `step(setpoint, pv)`-signaturen stödjer redan det tekniskt). Kräver ny orkestrering (t.ex. en `CascadeSimulation`-klass), ett utökat scenario-schema, och en ny UI-vy med två PV/SP-paneler samtidigt — dagens `drawChart()` i `app.js` är hårdkodad för exakt ett PV/SP-par.

**Kvotreglering.** Två *okopplade*, parallella processer (två oberoende flöden) + en kvotstation (SP_B = kvot × PV_A eller SP_A, beroende på parallell/seriell/följande utförande). Fysikaliskt enklare än kaskad (ingen dynamisk koppling mellan processerna), men kräver samma typ av dubbel-process- och dubbel-vy-arkitektur som kaskad.

---

## Praktisk konsekvens för prioritering

Om målet är att så snabbt som möjligt få *något* stöd för veckans reglerstrategier i appen, är **parameterstyrning och framkoppling** rimliga kandidater att skatta och scopa separat — de kräver inte att flerslinge-UI:t finns först. **Kaskad och kvot** bör däremot vägas som en gemensam investering, eftersom de delar samma UI-behov (dubbla PV/SP-paneler); att bygga det en gång täcker sannolikt båda.

**Tidsrealism:** v39 körs redan 21–25/9. Även parameterstyrning (den enklaste av de fyra) är sannolikt för snäv marginal för att hinnas till Pass 21 (onsdag 23/9 EM). Om det här ska in i nuvarande kursomgång krävs sannolikt en alternativ, icke-app-baserad övning (papper/kalkylblad) som stopgap, med simulatorstöd som mål för nästa kursomgång.

---

## Källor

- `packages/sim-core/process.js`, `controllers.js`, `simulation.js` (arkitekturgenomgång)
- `packages/scenario-schema/schema/scenario.schema.json` (schemabegränsningar, `additionalProperties: false`)
- `apps/app/app.js` (`drawChart()`, hårdkodad för ett PV/SP-par)
- `docs/planning/PED-002_PROGRESSIONSKARTLAGGNING.md` (ursprunglig luckanalys)
- `docs/tracking/todo.md` (sökt igenom för relaterade FEAT/BESLUT — inga träffar utöver FEAT-010 "Adaptiv reglering", som redan var känd via PED-002)

*Detta dokument är underlag, inte ett fattat beslut. PO/projektledning avgör om, och i vilken ordning, Grupp A och Grupp B ska scopas som riktiga uppdrag.*
