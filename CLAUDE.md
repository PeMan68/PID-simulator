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
| `todo.md` | Features (FEAT-NNN, BESLUT-NNN) |
| `buglog.md` | Buggar (ÅÅÅÅ-NNN) |
| `docs/planning/BACKLOG.md` | Längre backlog och prioritering |
| `docs/releases/CHANGELOG.md` | Releasenotes |

## Kodbasen

Webbappen bor i `apps/app/`. Lokal testning:
```
python -m http.server 8000 --directory apps/app
```
