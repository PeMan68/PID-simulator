# Test: ux-004-huvudyta

**Datum:** 2026-09-22
**Brancher:** `feature/UX-004-huvudyta-omstrukturering` (mergad hit; branchen i sin tur
byggd ovanpå redan mergad UX-002, FEAT-042, FEAT-043, FEAT-045 på `develop`)
**Testmiljö:** Lokal statisk server (`apps/app/`) + isolerad headless Chrome
(eget `--user-data-dir`, styrd via Chrome DevTools Protocol)

## Testfall

| # | Beskrivning | Förväntat | Resultat | OK? |
|---|-------------|-----------|----------|-----|
| 1 | Full automatisk testsvit (16 testfiler, källkods-/innehållsverifiering) | Samtliga kontroller gröna | 372 OK, 0 FAIL | ✅ |
| 2 | DEV-innehållsvalidering (`validate-content.mjs`) | Inga referensfel | Inga referensfel hittades | ✅ |
| 3 | PROD-innehållsvalidering (`validate-content.mjs catalog.prod.json`) | Inga referensfel | Inga referensfel hittades | ✅ |
| 4 | DEV-/PROD-byggning (`build-preview.mjs dev`/`prod`) | Byggning lyckas, PROD-allowlist exakt | Båda lyckades; PROD-urvalet matchar allowlistet exakt | ✅ |
| 5 | PROD-allowlist-validering (`validate-prod.mjs`) | Rätt lärstigar/scenarier, test-läge avstängt | Matchar beslutat urval, test-läge/poäng avstängda | ✅ |
| 6 | Fräsch sidladdning (tom `localStorage`) | Tillämpning="Temperaturprocess", båda Avancerat-sektionerna stängda, inga konsolfel | Bekräftat i headless Chrome: `temperatur`, `processAdvancedOpen=false`, `regulatorAdvancedOpen=false`, 0 konsolfel/exceptions | ✅ |
| 7 | Manuellt val av Tillämpning="Nivåprocess" + sidomladdning | Senast valda Tillämpning återställs | Bekräftat: `niva` återställs efter reload | ✅ |
| 8 | Lärstig `framkoppling.v1`, steg 2 | Kff synligt, Parameterstyrning dolt, Regulatorkonfigurations-Avancerat auto-öppnad | Bekräftat: `kffHidden=[false]`, `parameterstyrningHidden=[true,true]` | ✅ |
| 9 | Lärstig `parameterstyrning-ventilkarakteristik.v1`, steg 2 | Parameterstyrning synligt, Kff dolt | Bekräftat: `kffHidden=[true]`, `parameterstyrningHidden=[false,false]` | ✅ |
| 10 | `framkoppling.v1` → manuellt scenarioval (dölj-filter ska inte läcka) | Parameterstyrning synligt igen, `currentPathStep=-1` | Bekräftat: `parameterstyrningHidden=[false,false]` efter manuellt val | ✅ |
| 11 | Aktiv lärstigsfilter + manuellt byte till Tillämpning="Avancerat" | Fullständig sandlåda, allt synligt, båda Avancerat-sektionerna öppna | Bekräftat: Kff/Parameterstyrning/Ventilkarakteristik samtliga synliga, båda sektionerna öppna | ✅ |
| 12 | `windup-antiwindup.v1` (discoverability-risk från ursprungsanalysen) | Bumpless/Anti-windup synliga, Regulatorkonfigurations-Avancerat auto-öppnad (`forceAdvancedOpen`) | Bekräftat: båda synliga, sektionen öppen | ✅ |
| 13 | `kom-igång.v1` (introduktionslärstigen), samtliga 5 steg | Tillämpning="Temperaturprocess" genomgående, Avancerat-sektionerna stängda genomgående, lärstigen slutförs korrekt | Bekräftat i samtliga 5 steg + slutmeddelande "✓ Lärstigen klar!" | ✅ |
| 14 | FEAT-044 (`.zone-table`) — kontroll att inget läckt in av misstag | Ingen träff i `index.html`/`app.js` | Bekräftat: `zone-table` finns inte i den mergade koden | ✅ |
| 15 | `.zone-table`-visuell granskning på egen branch (FEAT-044, separat worktree, INTE del av denna merge) | Layout fungerar, aktiv-zon-highlight korrekt | Bekräftat separat (se `docs/reports/FEAT-044_STATUSRAPPORT.md`) — redovisas bara för spårbarhet, ingår inte i detta test | ℹ️ |
| 16 | Rök-test: 10 simuleringssteg efter sidladdning | Statusrad uppdateras, inga konsolfel | Bekräftat: `steg=10`, P/I/D-bidrag korrekta, 0 konsolfel | ✅ |

## Sammanfattning

Merge av `feature/UX-004-huvudyta-omstrukturering` → `test/ux-004-huvudyta`
(från `develop`, som redan innehåller UX-002/FEAT-042/FEAT-043/FEAT-045)
genomfördes utan konflikter (`git merge --no-edit`, "Merge made by the 'ort'
strategy"). Samtliga 16 testfall godkända. Ingen kod ändrad i detta steg —
ren verifiering inför merge till `develop`.

## Godkänd av
Datum: 2026-09-22 (CC, teknisk verifiering — PO:s produktgodkännande av
UX-004 gavs redan innan detta uppdrag, se konversationshistorik)
