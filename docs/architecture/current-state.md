# Arkitektur – nuläge

_Uppdaterad: 2026-05-28_

## Vad är det här projektet?

Pedagogiskt PID-simuleringsverktyg för YH-studenter. Kombinerar fri simulering med guidade lärstigar och quiz. Primär deployment: GitHub Pages (gratis, ingen server).

---

## Huvudapplikation: apps/app/

All produktion sker i `apps/app/`. Övriga appar i repot är experimentella.

### Teknikstack

- Ren HTML/CSS/JavaScript — inga ramverk, inga buildsteg
- Data laddas via `fetch()` från JSON-filer i `content/`
- Kräver HTTP-server (GitHub Pages eller lokal server)

### Filstruktur

```
apps/app/
  index.html          Tre-kolumns layout: scenario-panel | simulator | hjälp
  app.js              All applogik (~540 rader, ingen hårdkodad data)
  content/
    catalog.json      Manifest — listar alla scenarion, teorier, lärstigar
    scenarios/        En JSON-fil per scenario
    theory/           Teoritexter (title, summary, bullets)
    exercises/        Lärstigar (steps med type/ref/checkpoint)
```

### Datainläsning

Vid sidladdning fetchar `loadCatalog()` i `app.js`:
1. `content/catalog.json` — hämtar manifestet
2. Alla JSON-filer parallellt (scenarios, theory, exercises)
3. Bygger `SCENARIOS`, `THEORY`, `LEARNING_PATHS` i minnet
4. Anropar `initUI()` som populerar dropdowns och laddar startscenario

`HELP_CONTENT` (UI-hjälptexter) är hårdkodad i `app.js` — behöver inte vara i JSON.

### Lägg till ett scenario

```json
// 1. Skapa apps/app/content/scenarios/mitt-scenario.json
{
  "id": "mitt-scenario",
  "version": "v1.0.0",
  "title": "Visningsnamn i dropdown",
  "process": {
    "type": "self_regulating",
    "K": 1.2, "T": 15.0, "L": 2.0,
    "normalValue": 0.0,
    "measurementRange": { "min": 0.0, "max": 100.0 }
  },
  "controller": {
    "mode": "pid",
    "kp": 1.0, "ti": 15.0, "td": 2.0,
    "antiWindup": true,
    "outputLimits": { "min": 0.0, "max": 100.0 }
  },
  "disturbance": { "noiseStd": 0.0, "pulse": { "magnitude": 0.0, "durationSteps": 0 } },
  "runtime": { "dt": 1.0, "maxSteps": 600, "setpoint": 60.0, "autopause": false }
}
```

```json
// 2. Lägg till en rad i apps/app/content/catalog.json
{
  "scenarios": [
    ...
    { "id": "mitt-scenario", "file": "scenarios/mitt-scenario.json" }
  ]
}
```

### Lägg till en lärstig

Skapa `apps/app/content/exercises/min-larstig.v1.json` med steps:

```json
{
  "id": "min-larstig-v1",
  "version": "v1.0.0",
  "title": "Visningsnamn",
  "description": "Kort beskrivning.",
  "difficulty": "intro",
  "steps": [
    {
      "type": "theory",
      "ref": "pid-intro.v1.json",
      "title": "Stegtitel",
      "objective": "Vad studenten ska förstå.",
      "checkpoint": {
        "question": "Frågans text?",
        "options": ["A", "B", "C", "D"],
        "correct": 1,
        "explanation": "Förklaring av rätt svar."
      }
    },
    {
      "type": "scenario",
      "ref": "pi-step-self-regulating.json",
      "title": "Stegtitel",
      "objective": "...",
      "instruction": "Instruktion som visas i sidopanelen.",
      "checkpoint": { ... }
    }
  ]
}
```

Lägg till i `catalog.json` under `"learning_paths"`.

Step-typer: `theory` (visar teori), `scenario` (laddar scenario).
Checkpoint är valfritt — utan checkpoint kan man klicka vidare direkt.

---

## Deployment

### GitHub Actions

Fil: `.github/workflows/deploy-pid-simulator.yml`

Triggar på push till `main` om filer under `apps/app/` ändrades.
Publicerar `apps/app/` som GitHub Pages-webbplats.

```
Push till main
  → Actions klonar repo
  → Paketerar apps/app/
  → Publicerar till https://peman68.github.io/PID-simulator/
  (~30 sekunder)
```

### Lokal testning

```bash
cd apps/app
python -m http.server 8080
```

Öppna `http://localhost:8080`. Identisk miljö som GitHub Pages.

---

## Övriga appar (ej produktion)

| Mapp | Beskrivning | Status |
|------|-------------|--------|
| `apps/web/` | Serverapp med ES-moduler och `sim-core`-paketet | Experimentell |
| `apps/web-standalone/` | Äldre standalone-prototyp | Referens |
| `main.py` | Original Python/tkinter-app | Referens |

Dessa appar ska inte påverka produktionsdeployment. Ändringar i dem triggar inte Actions-workflow (som bara lyssnar på `apps/app/**`).

---

## Gitflow

| Branch | Syfte |
|--------|-------|
| `main` | Stabil kod. Push hit deployas automatiskt. |
| `develop` | Integrationsgren. Feature-branches mergas hit först. |
| `feature/*` | Ny funktionalitet |
| `fix/*` | Buggfixar |
| `refactor/*` | Omstrukturering |
| `test/*` | Proof-of-concept som aldrig mergas till main |

Regel: Alltid feature → develop → main. Direkt push till main undviks.
