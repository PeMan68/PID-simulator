# PED-003D — Kollationsrapport: testfrågor och checkpoints

**Utförd av:** Claude Code (CC)
**Datum:** 2026-08-23
**Omfattning:** Samtliga checkpoints i `proportionalband-forstarkning.v1`, `pi-pid.v1` och
`processbegransningar.v1` — de tre lärstigar Test 3/4 gäller.

Varje checkpoint kontrollerad mot uppdragets tio kriterier:
1. Stämmer med den korrigerade instruktionen
2. Använder PV i stället för y
3. Kan besvaras från försöket och tillhörande teori
4. Kräver inte information från parameterstudierapporten
5. Avslöjas inte direkt av instruktionens formulering
6. Har ett entydigt korrekt svar
7. Använder rätt SP, processparametrar och regulatorparametrar
8. Skiljer mellan stabilisering och att PV når SP
9. Påstår inte att PID alltid är bättre än PI
10. Påstår inte att dötid alltid gör systemet instabilt

---

## proportionalband-forstarkning.v1

| # | Steg | Fråga (kort) | Avvikelse funnen | Korrigering | Verifierat |
|---|---|---|---|---|---|
| 1 | 1 (teori) | Vad händer med PB om Kp fördubblas? | Ingen | — | Ren formelfråga (PB=100/Kp), entydigt svar |
| 2 | 2 (Stort PB) | Vad betyder PB-linjen i grafen? | Ingen | — | Matchar instruktionens observation av PB-visualiseringen |
| 3 | 3 (Minska PB) | Vad händer när Kp ökas stegvis? | Ingen | — | Matchar instruktionens Kp=0.5→2→5-progression |
| 4 | 4 (Litet PB) | Varför liknar litet PB On/Off? | Ingen | — | Matchar instruktionens jämförelse med On/Off |
| 5 | 5 (P-referens) | Varför stabiliserar P-regulatorn under SP=60? | Ingen | — | SP=60 matchar scenariots faktiska default |
| 6 | 6 (PI) | Vad förklarar att PV når SP med Ti tillagt? | Ingen | — | Matchar instruktionens jämförelse mot föregående steg |

Inga ändringar behövdes i denna lärstig — checkpoints skrevs redan med PV-notation i
PED-003B och innehöll aldrig hänvisningar till parameterstudien.

## pi-pid.v1

| # | Steg | Fråga (kort) | Avvikelse funnen | Korrigering | Verifierat |
|---|---|---|---|---|---|
| 7 | 1 (PI-försök) | Vad orsakar PI:s översläng? | Ingen | — | Matchar den omskrivna instruktionen (parameterstudiehänvisning borttagen, se nedan) |
| 8 | 2 (PID-försök) | Vad gör D-delen som minskar översläng/insvängningstid? | Ingen | — | Matchar instruktionen |
| 9 | 3 (Jämförelse) | Är PID alltid bättre än PI? | Ingen | Explanation-text hade ordet "verifierade" (intern analysspråk) — bytt till "det här försöket" | Kriterium 9 uppfylls explicit — korrekt svar är "Nej, beror på process/inställning" |

**Instruktionsändring (ej checkpoint):** Steg 1:s instruktion innehöll
"(parameterstudien visar att förloppet stabiliserar sig kring steg 60–65)" — borttagen,
ersatt med observationsinstruktion. Se huvudrapporten (todo.md-status) för fullständig
diff. Checkpointen i sig refererade aldrig till parameterstudien och behövde ingen ändring.

## processbegransningar.v1

| # | Steg | Fråga (kort) | Avvikelse funnen | Korrigering | Verifierat |
|---|---|---|---|---|---|
| 10 | 1 (teori) | Maximalt PV för K=0.5? | `y_max` i explanation | Ändrat till `PV_max` | Ren formelfråga, entydigt svar (50) |
| — | 2 (Svag proc. försök 1) | — (inget checkpoint, ren observation) | — | — | — |
| 11 | 3 (Svag proc. försök 2) | Varför fastnar PV nära 50? | Steget fanns tidigare inte som egen fråga — hela försök 1/2-uppdelningen är ny i PED-003D | Ny checkpoint skriven, jämför uttryckligen mot försök 1:s K=1.3 | K=1.3/K=0.5, SP=80 verifierade med `tests/simulation/` (se huvudrapport) |
| — | 4 (Dötid försök 1) | — (inget checkpoint, ren observation) | — | — | — |
| 12 | 5 (Dötid försök 2) | Varför försämrar dötid regleringen? | Gamla frågan var kvar från enkelt-steg-versionen och nämnde inte att systemet fortfarande är stabilt | Ny formulering: frågan säger uttryckligen "även när systemet fortfarande är stabilt" | L=0 vs L=5 verifierade — L=0 helt monotont (0 % översläng), L=5 ger mätbar men måttlig översläng, ingen oscillation. Kriterium 10 uppfylls explicit. |

---

## Övrig kontroll (samtliga lärstigar)

- **Svarsalternativ / rätt svar:** Kontrollerade manuellt mot förväntad regulator-/processteori. Inga fel hittade.
- **Feedback vid rätt/fel svar, möjlighet att försöka igen:** Appmekanik (`handleQuizAnswer` i `app.js`), oförändrad av PED-003D, verifierad fungerande i webbläsartest (se huvudrapport).
- **Rätt svar exponeras inte i presentationsläget:** Arkitekturellt garanterat — presentationsläget (`buildPresentHtml` i `app.js`, PED-003A) renderar aldrig `checkpoint.options`, bara `checkpoint.question`. Oförändrat i PED-003D, verifierat i webbläsartest.

## Sammanfattning

12 checkpoints granskade. 3 korrigerade (2 formeltext y→PV, 1 internt analysspråk
borttaget). 2 helt nya checkpoints skapade som en direkt följd av att
processbegränsningar-lärstigens två jämförelseförsök delades i tydliga
försök 1/försök 2-par. Inga frågor identifierades som kräver information från
parameterstudierapporten, avslöjar svaret direkt, eller bryter mot kriterium 9/10.
