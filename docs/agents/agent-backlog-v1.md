# Agent Backlog v1

## Instruktion
Varje agent levererar i egen branch med tydligt outputkontrakt. Inga UI-antaganden i core-agenters leveranser.

## AGENT-01: Schema and Contracts
- Mal: Definiera och validera scenarioformat.
- Input: docs/architecture/web-rebuild-plan-v1.md, teori/ovningsdokument.
- Output:
  - packages/scenario-schema/schema/scenario.schema.json
  - content/scenarios/*.json exempel
  - kort beslutslogg i docs/architecture/
- Acceptanskriterier:
  - Schema validerar minst 3 scenarion.
  - Process- och regulatorfaltetacker v1.0-behov.

## AGENT-02: Python Behavior Mapping
- Mal: Kartlagga vad som maste matchas fran legacy Python.
- Input: main.py
- Output: docs/architecture/python-parity-matrix.md
- Acceptanskriterier:
  - Lista over must-have, should-have, can-wait funktioner.
  - Referens till kodsektioner per funktion.

## AGENT-03: Sim Core Implementation
- Mal: Bygga UI-oberoende simuleringskarna.
- Input: schema + parity matrix.
- Output: packages/sim-core/*
- Acceptanskriterier:
  - Process, PID och OnOff med tydliga interface.
  - Historik och prestandamatteberakning for v1.0.

## AGENT-04: Reference Tests
- Mal: Bygga referensscenarion och regressionstester.
- Input: sim-core + schema.
- Output: tests/reference/*
- Acceptanskriterier:
  - Minst 10 deterministiska testfall.
  - Toleranser dokumenterade per test.

## AGENT-05: Web Simulator Shell
- Mal: Bygga fri simulator-UI ovanpa sim-core.
- Input: sim-core API.
- Output: apps/web/*
- Acceptanskriterier:
  - Kor/paus/stega, parameterinmatning, grafvisning.
  - Export av CSV for basdata.

## AGENT-06: Learning Content Pipeline
- Mal: Omvandla teori och ovningar till strukturerade objekt.
- Input: ovningar-*.md, teori-och-bakgrund.md
- Output: content/theory/*, content/exercises/*
- Acceptanskriterier:
  - Minst en fullstandig larstig definierad.
  - Ovningar kan laddas av webappen via dataformat.

## AGENT-07: Progression Layer
- Mal: Implementera modulprogression och feedback ovanpa samma simulatormotor.
- Input: content + apps/web shell.
- Output: apps/web/progression/*
- Acceptanskriterier:
  - Minst 2 progressionmoduler for v1.0.
  - Tydlig koppling mellan mal, handling och feedback.

## Gemensamma regler
- Hall svensk text i UI och pedagogiskt innehall.
- Hall domankod separat fran vykod.
- Leverera testbar kod och kort changelog per agent.
