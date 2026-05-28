# PID-simulator

Pedagogiskt verktyg för simulering av PID-reglering. Primärt målgrupp: YH-studenter inom automation och reglerteknik.

## Huvudapplikation

**`apps/app/`** — Webbsimulator som hostas på GitHub Pages.

Live-URL: `https://peman68.github.io/PID-simulator/`

Funktioner: On/Off-, P-, PI- och PID-reglering, interaktiva lärstigar med quiz, scenariobibliotek, hjälpsystem.

## Lokal utveckling

```bash
cd apps/app
python -m http.server 8080
# Öppna http://localhost:8080
```

Appen kräver HTTP-server (fetch() används för att ladda data). Dubbel-klick på index.html fungerar inte.

## Lägg till ett scenario

1. Skapa `apps/app/content/scenarios/mitt-scenario.json`
2. Lägg till en rad i `apps/app/content/catalog.json` under `"scenarios"`
3. Testa lokalt, merga till main → deployas automatiskt

Se `docs/architecture/current-state.md` för fullständigt format.

## Deployment

GitHub Actions deployas automatiskt vid push till `main` om filer under `apps/app/` ändrades.
Workflow: `.github/workflows/deploy-pid-simulator.yml`

Branches som **inte** triggar deployment: `develop`, feature-branches.

## Projektstruktur

```
apps/
  app/              ← Huvudapplikation (GitHub Pages)
    index.html
    app.js
    content/
      catalog.json  ← Manifest för alla datafiler
      scenarios/    ← En JSON-fil per scenario
      exercises/    ← Lärstigar med quiz-checkpoints
      theory/       ← Teoritexter
  web/              ← Experimentell serverapp (ES-moduler, kräver server)
  web-standalone/   ← Äldre standalone-prototyp (referens)
packages/
  sim-core/         ← Delad simuleringslogik (används av apps/web/)
docs/
  architecture/     ← Teknisk dokumentation
  agents/           ← AI-assistenternas planeringsunderlag
main.py             ← Original Python/tkinter-app (referens)
```

## Gitflow

```
main        ← Stabil, deployas till GitHub Pages
develop     ← Integrationsgren
feature/*   ← Ny funktionalitet
fix/*       ← Buggfixar
refactor/*  ← Omstrukturering
```

Merga alltid feature → develop → main. Aldrig direkt till main.
