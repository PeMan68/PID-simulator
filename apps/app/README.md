# PID Simulator — webbapp

Detta är webbappens källkod. Se projektets huvud-[README.md](../../README.md) för
fullständig dokumentation (funktioner, DEV/PROD-profiler, lokal körning, tester, Gitflow).

## Körning

Appen laddar innehåll (lärstigar, scenarier, teori) via `fetch()` från `content/` och
**kräver därför en HTTP-server** — dubbelklick på `index.html` fungerar inte.

```bash
node ../../tests/build-preview.mjs dev
python -m http.server 8000 --directory ../../dist/dev
```

Se huvud-READMEn för fullständiga DEV- och PROD-kommandon.

## Struktur

- `index.html`, `app.js`, `sim-core.js` — appen.
- `env.js` — aktiv miljökonfiguration (DEV i denna katalog). `env.prod.js` är
  produktionsmallen, se `docs/development/ENVIRONMENTS.md`.
- `content/` — lärstigar (`exercises/`), scenarier (`scenarios/`), teori (`theory/`),
  manifest (`catalog.json` för DEV, `catalog.prod.json` för PROD).
