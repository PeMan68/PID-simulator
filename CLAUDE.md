# Claude Code — projektinstruktioner

## Workflow (obligatorisk läsning)

Läs [docs/WORKFLOW.md](docs/WORKFLOW.md) innan du börjar koda.

Kortversion:
1. Registrera feature i `docs/tracking/todo.md` eller bug i `docs/tracking/buglog.md` på `develop` → commit
2. Skapa branch: `feature/<kortnamn>` eller `bugfix/ÅÅÅÅ-NNN`
3. All implementation sker i feature/bugfix-branchen — aldrig direkt i `develop`

## Spårningsdokument

| Fil | Syfte |
|-----|-------|
| `docs/tracking/todo.md` | Öppna features (FEAT-NNN, BESLUT-NNN) |
| `docs/tracking/todo-done.md` | Klara features |
| `docs/tracking/buglog.md` | Öppna buggar (ÅÅÅÅ-NNN) |
| `docs/tracking/buglog-done.md` | Stängda buggar |
| `docs/tracking/content-log.md` | Innehållsfeedback (lärstigar/scenarier/teori) |
| `docs/planning/WEB-IAKTTAGELSER.md` | Löpande iakttagelser — källa till features/buggar |
| `docs/reports/` | Engångsanalyser och nulägesrapporter (t.ex. PED-001) |

## Kodbasen

Webbappen bor i `apps/app/`. Lokal testning:
```
python -m http.server 8000 --directory apps/app
```
