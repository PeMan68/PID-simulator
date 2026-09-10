# Claude Code — projektinstruktioner

## Överlämning (läs FÖRST, innan allt annat)

`docs/handoffs/` innehåller en eller flera handoff-dokument, namngivna
`HANDOFF_ÅÅÅÅ-MM-DD.md`. **Läs alltid det SENAST daterade filnamnet** — nya sessioner
skriver ett nytt, dagsfärskt dokument istället för att redigera ett gammalt, så flera
kan finnas samtidigt. Det senaste dokumentet beskriver aktuella roller, produktvision,
git-status, senaste uppdrag och öppna beslut. Ett äldre dokument kan vara flera veckor
ur fas — ta inte dess sakinnehåll (avsnitt om git-status, lärstigar, beslut) för
nuvarande sanning om ett nyare dokument finns.

Om du (CC) avslutar en session efter ett större uppdrag (release, arkitekturändring,
flera sammanhängande uppdrag) och det gamla handoff-dokumentet börjar bli inaktuellt:
skriv ett NYTT, dagsdaterat handoff-dokument i `docs/handoffs/` istället för att patcha
det gamla — det är det etablerade mönstret i det här projektet.

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
