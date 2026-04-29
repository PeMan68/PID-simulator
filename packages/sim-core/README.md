# sim-core

Detta paket ska innehalla UI-oberoende simuleringslogik.

## Scope v1
- Processmodell (self_regulating, integrating, unstable)
- Regulatorer (onoff, p, pi, pid, manual)
- Storningar (brus och puls)
- Historik och prestandamatt

## Public API (utkast)
- createSimulation(scenario)
- simulation.step()
- simulation.run(nSteps)
- simulation.getState()
- simulation.getHistory()
- simulation.reset()

## Designregler
- Ingen DOM, ingen canvas, ingen frameworkkoppling.
- Deterministiskt beteende nar brusgenerator seedas.
- Tydliga felmeddelanden vid ogiltiga scenarios.
