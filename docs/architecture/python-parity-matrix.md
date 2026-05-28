# Python Parity Matrix (v1)

Syfte: dokumentera vad den nya webkarnan maste matcha fran legacy-appen i main.py.

## Must Have (v1.0)

1. Processsteg med dottid och tiddiskret uppdatering
- Legacy referens: main.py class Process, method step
- Webbstatus: implementerat i sim-core process.js

2. Regulatormoden OnOff, P, PI, PID samt manuell
- Legacy referens: main.py classes OnOffController och PID, samt simulate-flodet
- Webbstatus: implementerat i controllers.js + simulation.js

3. Utsignalsbegransning och anti-windup
- Legacy referens: PID.step antiwindup-branch
- Webbstatus: implementerat i PIDController.step

4. Brus- och pulsstorning
- Legacy referens: simulate() section storningar
- Webbstatus: implementerat i simulation.js _disturbanceStep + triggerPulse

5. Grundhistorik (t, y, u, e, sp)
- Legacy referens: listor i appens state
- Webbstatus: implementerat i Simulation.history

6. Bas-prestandamatt
- Legacy referens: update_plot() prestandasektion
- Webbstatus: implementerat i metrics.js

## Should Have (strax efter v1.0 start)

1. Prozentlage med enhetskonvertering i UI-lager
- Legacy referens: to_percent/from_percent i appen
- Webbstatus: delvis i processmodellen, inte exponerat i UI an

2. Dynamiska andringar under korning
- Legacy referens: activate_dynamic_changes
- Webbstatus: scenariofaltet finns, men UI-hook saknas

3. Historikjämforelse med flera korningar
- Legacy referens: simulation_history
- Webbstatus: datamodell finns, visning saknas

## Can Wait

1. Full tkinter-specifik UX
- Tooltips, fargmarkering av osparade andringar, avancerad widgethantering

2. Hjälp- och teoriflikarnas rendering
- Legacy referens: markdown render i tkinter
- Ny plan: separat content-pipeline

3. Exakt paritet for alla edge-cases i integrerande process
- Kandesvag punkt enligt backlog, hanteras som experimentellt i forsta skedet

## Kanda avvikelser att stanga

1. Integrerande process
- Ska verifieras med referensscenarion innan den markeras stabil.

2. Instabil process
- Formel i webb-karnan ar initial approximation och ska stallas mot referensfall.

3. Settling-kriterier
- Legacy anvander olika trösklar i olika kontexter; webbkarnan har enhetlig 5 procent i nulaget.
