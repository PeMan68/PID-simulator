# Claude Code — projektinstruktioner

## Workflow (obligatorisk läsning)

Läs [docs/WORKFLOW.md](docs/WORKFLOW.md) innan du börjar koda.

Kortversion:
1. Registrera feature i `todo.md` eller bug i `buglog.md` på `develop` → commit
2. Skapa branch: `feature/<kortnamn>` eller `bugfix/ÅÅÅÅ-NNN`
3. All implementation sker i feature/bugfix-branchen — aldrig direkt i `develop`

## Spårningsdokument

| Fil | Syfte |
|-----|-------|
| `todo.md` | Öppna features (FEAT-NNN, BESLUT-NNN) |
| `todo-done.md` | Klara features |
| `buglog.md` | Öppna buggar (ÅÅÅÅ-NNN) |
| `buglog-done.md` | Stängda buggar |
| `docs/planning/WEB-IAKTTAGELSER.md` | Löpande iakttagelser — källa till features/buggar |

## Kodbasen

Webbappen bor i `apps/app/`. Lokal testning:
```
python -m http.server 8000 --directory apps/app
```
