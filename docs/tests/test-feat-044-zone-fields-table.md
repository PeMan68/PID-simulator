# Test: feat-044-zone-fields-table

**Datum:** 2026-09-23
**Brancher:** `feature/FEAT-044-zone-fields-table` (mergad hit; branchen i sin tur
uppdaterad med `develop`/v1.6.0-basen och konfliktlöst mot UX-004 i ett tidigare steg,
se `docs/reports/FEAT-044_INTEGRATIONSRAPPORT.md`)
**Testmiljö:** Lokal statisk server (`apps/app/`) + isolerad headless Chrome (eget
`--user-data-dir`, styrd via Chrome DevTools Protocol) + PO:s egen visuella granskning

## Testfall

| # | Beskrivning | Förväntat | Resultat | OK? |
|---|-------------|-----------|----------|-----|
| 1 | Full automatisk testsvit (16 testfiler) | Samtliga kontroller gröna | 386 OK, 0 FAIL | ✅ |
| 2 | DEV-/PROD-innehållsvalidering | Inga referensfel | Inga referensfel hittades | ✅ |
| 3 | DEV-/PROD-byggning + PROD-allowlist | Byggning lyckas, urval oförändrat (FEAT-044 är en ren layoutändring) | 9 lärstigar, 21 scenarier, 8 teorimoduler — matchar exakt tidigare allowlist | ✅ |
| 4 | FEAT-042-regression (`feat-042-gain-schedule.test.mjs`) | Gain-schedule/nonlinear-gain-logiken opåverkad | 24/24 gröna | ✅ |
| 5 | UX-004-regression (`ux-004-huvudyta.test.mjs`) | Ingen återgång till gamla grupper, Avancerat-strukturen intakt | 64/64 gröna | ✅ |
| 6 | Olinjär ventilkarakteristik — kompakt K-tabell | Tabell renderar, tre zonrader | Bekräftat i headless Chrome, `valve-nonlinear-gain-demo.json` | ✅ |
| 7 | Aktiv zonmarkering (process, K-zon) | Aktiv rad highlightas grönt, matchar statusraden | Bekräftat: Zon 2-raden highlightad, status "K-zon 2 (K=2,5)" | ✅ |
| 8 | Parameterstyrning — kompakt Kp/Ti/Td-tabell | Tabell renderar, tre zonrader, tre kolumner | Bekräftat, `valve-nonlinear-gain-demo-scheduled.json` | ✅ |
| 9 | Aktiv zonmarkering (regulator, Kp-zon) | Aktiv rad highlightas orange, matchar statusraden | Bekräftat: Zon 3-raden highlightad, status "Zon 3 (Kp=1,2)" | ✅ |
| 10 | Zonbyte mellan flera zoner under en körning | Regulatorns/processens zon byter synligt under transienten, markeringslinjer loggas | Bekräftat: 4 "Zonbyte"-markeringar, radhighlight vandrar Zon 1→2→3 | ✅ |
| 11 | Guidad lärstig "Parameterstyrning och olinjär ventilkarakteristik" steg 1–7 | Fungerar end-to-end, `visibilityOverride` döljer Kff genomgående | Bekräftat: Zon 1-highlight (Kp=5) korrekt vid rätt steg, Kff aldrig synligt | ✅ |
| 12 | UX-004 progressiv exponering (fräsch sidladdning) | Avancerat-sektionerna stängda, Tillämpning="Temperaturprocess" | Bekräftat, oförändrat av denna merge | ✅ |
| 13 | Inga gamla gruppnamn/dubblettfält i `index.html` | 0 träffar på `groupProcess`/`groupRegulator`/`groupStyrning`/`groupStorningar`, inga dubblerade fält-ID:n | Bekräftat | ✅ |
| 14 | PO:s egen visuella granskning | Godkänd | "FEAT-044 uppfyller sitt syfte... Några nya UX-problem har inte identifierats" | ✅ |

## Sammanfattning

Merge av `feature/FEAT-044-zone-fields-table` → `test/feat-044-zone-fields-table` (från
`develop`, v1.6.0-basen) genomförd som en rak fast-forward (branchen var redan
konfliktfri mot dagens `develop` sedan det tidigare integrationsuppdraget). Samtliga 14
testfall godkända, inklusive PO:s egen visuella granskning. Ingen kod ändrad i detta
steg — ren verifiering inför merge till `develop`.

## Godkänd av
Datum: 2026-09-23 (PO — visuell granskning; CC — teknisk verifiering)
