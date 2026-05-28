<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Projektöversikt

Detta repo innehåller **PID-simulator** – ett pedagogiskt Python/tkinter-verktyg för att demonstrera och simulera PID-reglering i processindustriella system (v1.7.0).

Det finns också ett **webbläsarbaserat lärspel** (`reglerteknik-spel`, separat repo) byggt i ren HTML/JS utan beroenden. Båda apparna delar samma pedagogiska syfte och processmodell, och målet är att de på sikt ska kunna **samköras** – t.ex. att simulatorn kan exportera processparametrar eller scenarion som spelet kan ladda in, eller att de delar ett gemensamt format för FOPDT-processkonfiguration.

## Gemensam processmodell

Båda apparna använder en FOPDT-liknande diskret modell:
- **K** (processförstärkning), **tau** (tidskonstant), **L** (dödtid)
- Diskret tidssteg: DT = 0.05 s (20 Hz) i spelet; simulatorn använder eget DT
- Signalnivåer: u(t) och y(t) i intervallet 0–100
- Processtyper: självreglerande, integrerande (bugg känd i simulatorn), instabil

Presets i spelet (referens vid samkörning):
- Svag motor: K=0.5, tau=10, L=1.0
- Normal motor: K=1.5, tau=5, L=1.0
- Stark motor: K=4.0, tau=3, L=0.5
- Seg process: K=1.0, tau=15, L=3.0

## Riktning för utveckling

- Prioritera tydlig och pedagogisk kod, särskilt för regulatorns beräkningssteg och visualisering av processens och regulatorns signaler.
- Möjlighet att pausa, stega och diskutera varje beräkningssteg är viktig.
- Arbeta mot ett **gemensamt parameterformat** (t.ex. JSON) som båda apparna kan läsa/skriva, för att möjliggöra samkörning.
- Kända buggar att inte förvärra: integrerande processimulering, hjälp/teori-flikar i exe-bygget.
- Spelet har 5 spellägen (stegrespons, störningsavstötning, processidentifiering, processtyp, PID-tuning) – simulatorn kan inspireras av dessa för framtida övningslägen.

## Kodriktlinjer

- Python 3.8+, tkinter för GUI.
- Håll simuleringslogik separerad från GUI-kod så att den lättare kan återanvändas eller exporteras.
- Skriv på svenska i kommentarer och UI-text (konsekvent med befintlig kod).

