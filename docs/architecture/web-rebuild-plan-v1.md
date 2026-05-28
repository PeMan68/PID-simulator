# Web Rebuild Plan v1

## Syfte
Detta dokument styr implementationen av en ny webbaserad app byggd fran grunden, med simulator-karnan som bas och progression/ovningar som lager ovanpa.

## Avgransning
- Behall legacy-apparna i samma repo under overgangsperioden.
- Bygg ny webapp separat fran dagens index.html-prototyp.
- Python-appen ar referens for beteende, inte arkitektur.

## Malbild v1.0
- Fri simulator i webben med central funktionalitet.
- Stod for teorikopplade ovningar via scenarioformat.
- Minst en komplett larstig: teori -> ovning -> simulering.

## Styrande principer
1. Core-first: simulering och scenariokontrakt forst.
2. UI-oberoende domanlogik i separat paket.
3. Pedagogikstyrd progression, inte spelmekanikstyrd progression.
4. Testbarhet mot referensscenarion.

## Faser

### Fas 0 - Beslut
- Faststall scope for v1.0.
- Faststall vad som ar experimentellt (integrerande process) tills verifierat.

### Fas 1 - Doman och data
- Definiera schema for process, regulator, storningar, scenario och resultat.
- Definiera standardiserade presets och metadata.

### Fas 2 - Sim-core
- Implementera Process, PID, OnOff och historik som UI-oberoende moduler.
- Etablera referenstester for sjalvreglerande process.

### Fas 3 - Fri simulator UI
- Implementera parameterpanel, kor/paus/stega, grafer, historik, export.

### Fas 4 - Larinnehall
- Modellera teori och ovningar som dataobjekt kopplade till scenarion.
- Implementera styrd ovningsvy med mal och checkpoints.

### Fas 5 - Progression
- Implementera modulprogression ovanpa samma motor.
- Revidera spelmoduler sa de stoder larandemal.

### Fas 6 - Konsolidering
- Regression mot referensscenarion.
- Scope-lagning for v1.0 och releaseunderlag.

## Definition of Done for v1.0
- Websimulatorn kan anvandas utan legacykod.
- Scenarioformatet driver simulator och minst en ovning.
- Referenstester finns for centrala regulatorfall.
- En dokumenterad larstig ar verifierad pedagogiskt internt.

## Risker
- Integrerande process ar kandesvag punkt.
- Risk for scope creep om spelifiering prioriteras fore simulatorkarna.
- Risk for divergerande modeller mellan legacy och ny implementation.

## Riskhantering
- Feature flag for experimentella processfall.
- Krav pa scenario-baserade regressionstester.
- Fasgrindar: inga nya moduler innan corekvalitet ar ok.
