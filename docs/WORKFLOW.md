# Utvecklingsflöde

## Branch-struktur

```
main          ← produktion (GitHub Pages)
└── develop   ← integration, alltid stabil
    ├── feature/<kortnamn>     ← ny feature
    ├── bugfix/ÅÅÅÅ-NNN        ← buggfix
    └── test/<kortnamn>        ← staging för testning
```

---

## 1. Registrera en feature

1. Växla till `develop`
2. Lägg till post i `todo.md` (använd mallen)
3. Commit: `"feat(todo): registrera FEAT-NNN <kortnamn>"`
4. Skapa branch: `git checkout -b feature/<kortnamn>`

## 2. Registrera en bugg

1. Växla till `develop`
2. Lägg till post i `buglog.md` (använd mallen, tilldela nästa `ÅÅÅÅ-NNN`)
3. Commit: `"bug(buglog): registrera 2026-NNN <kort beskrivning>"`
4. Skapa branch: `git checkout -b bugfix/2026-NNN`

> Buggar som hittas under test i en staging-branch registreras alltid i `develop` —
> växla dit, lägg till posten, växla tillbaka.

## 3. Arbeta i feature/bugfix-branch

- Committa regelbundet med meningsfulla meddelanden (se konvention nedan)
- Uppdatera **endast din egen post** i `todo.md` eller `buglog.md` (ändra Status, lägg till noteringar)
- Commit för varje meningsfull uppdatering av dokumentet: `"feat(todo): FEAT-NNN pågår"`

## 4. Staging och testning

När en eller flera features/bugfixar är klara i sina brancher:

1. Skapa staging-branch från `develop`:
   ```
   git checkout develop
   git checkout -b test/<kortnamn>
   ```
2. Merga in de aktuella feature/bugfix-brancherna:
   ```
   git merge feature/<kortnamn>
   git merge bugfix/2026-NNN
   ```
3. Skapa `docs/tests/test-<kortnamn>.md` med alla testfall (se mall nedan)
4. Kör testerna. Committa resultat löpande.

**Om en feature misslyckas i staging:**
Bygg en ny staging-branch utan den felande featuren. Lämna feature-branchen öppen för fix.

## 5. Merge till develop och release

När alla tester är gröna:

1. Merga staging → `develop`:
   ```
   git checkout develop
   git merge test/<kortnamn>
   ```
2. Flytta klara features från `todo.md` till `todo-done.md`, stängda buggar från `buglog.md` till `buglog-done.md`
3. Radera alla involverade brancher (feature, bugfix, test):
   ```
   git branch -d feature/<kortnamn>
   git branch -d bugfix/2026-NNN
   git branch -d test/<kortnamn>
   ```
4. Merga `develop` → `main` (triggar deploy till GitHub Pages):
   ```
   git checkout main
   git merge develop
   git push
   git checkout develop
   ```

---

## Commit-konvention

```
<typ>(<scope>): <kort beskrivning>
```

| Typ | Används för |
|-----|-------------|
| `feat` | Ny funktionalitet |
| `fix` | Buggfix |
| `refactor` | Omstrukturering utan beteendeändring |
| `test` | Testfall, testdokument |
| `docs` | Dokumentation |
| `chore` | Bygg, beroenden, konfiguration |

Exempel:
- `feat(simulator): lägg till normalvärde-fält`
- `fix(2026-001): korrigera display:none vid processtyp-byte`
- `docs(todo): FEAT-005 status pågår`

---

## Testdokument-mall

`docs/tests/test-<kortnamn>.md`:

```markdown
# Test: <kortnamn>

**Datum:** ÅÅÅÅ-MM-DD
**Brancher:** feature/x, bugfix/2026-NNN
**Testmiljö:** lokal / GitHub Pages

## Testfall

| # | Beskrivning | Förväntat | Resultat | OK? |
|---|-------------|-----------|----------|-----|
| 1 | | | | |

## Godkänd av
Datum:
```

---

## Hotfix (bugg i produktion)

Om en kritisk bugg hittas i `main` gäller samma flöde — men branchar från `main`
i stället för `develop` (develop kan ligga före och ska inte dras med).

1. Registrera buggen i `buglog.md` på `develop` (spårbarhet)
2. Skapa hotfix-branch från `main`:
   ```
   git checkout main
   git checkout -b bugfix/ÅÅÅÅ-NNN
   ```
3. Fixa, testa i staging-branch (från `main`), merga tillbaka till `main`
4. Merga även `main` → `develop` så fixen inte försvinner vid nästa release:
   ```
   git checkout develop
   git merge main
   ```
