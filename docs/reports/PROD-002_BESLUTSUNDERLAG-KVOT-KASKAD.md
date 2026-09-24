# PROD-002 — Beslutsunderlag: Kvotreglering och Kaskadreglering till PROD

**Utförd av:** Claude Code (CC)
**Datum:** 2026-09-24
**Mottagare:** PO (Per Manholm), PM
**Uppdrag:** Ta fram underlag för beslut om att släppa Kvotreglering (FEAT-048) och
Kaskadreglering (FEAT-050) till PROD. Ingenting är släppt. `catalog.prod.json` och `main`
är orörda.

---

## 1. Sammanfattning

- **Tekniskt redo:** båda lärstigarna fungerar i ett riktigt PROD-bygge. Det gav 0 fel,
  0 sidfel och 0 falska grafmarkeringar över alla 12 lärstigar och 30 scenarier.
- **Pedagogiskt godkännande saknas för båda.** Alla lärstigar som finns i PROD idag har
  noteringen "PO-testad och godkänd för PROD" i allowlistan. Varken Kvot eller Kaskad har
  fått den noteringen ännu.
- **Nästa release tar med koden oavsett beslut.** `develop` innehåller redan koden för
  båda funktionerna. Varje release från `develop`, även en ren buggfix-release, gör
  kryssrutan **Kvotreglering** synlig under Tillämpning "Avancerat" i PROD (se avsnitt 4).
- **CC:s rekommendation:** släpp båda tillsammans som **v1.7.0**, men först efter att PO
  har klickat igenom båda lärstigarna i ett lokalt PROD-bygge och är nöjd.

---

## 2. Läget på `develop` (2026-09-24)

| Del | Status |
|---|---|
| FEAT-048 Kvotreglering | Mergad sedan tidigare. Två PO-uppföljningsrundor (trendgraf, Mätläge). |
| FEAT-050 Kaskadreglering | **Mergad idag** (`7ba9571`) på PO:s beslut, efter sex PO-testrundor. |
| Bugg 2026-018 | **Fixad idag** (`ce202bc`, se avsnitt 5). |
| Testsvit | 12 testfiler, 357 kontroller, alla gröna. Innehålls- och PROD-validering gröna. |
| `main` / PROD | v1.6.2 (`183cd0f`), oförändrad. |

---

## 3. Verifiering av ett kandidatbygge

Jag byggde ett kandidatbygge med `tests/build-preview.mjs prod`. Kandidatkatalogen var
`catalog.prod.json` plus de två lärstigarna och deras innehåll. Katalogändringen var
tillfällig och är återställd. Bygget kördes i headless Edge med riktiga knapptryckningar:
ladda, Stega ×20, Återställ system, Rensa graf, samt varje lärstig steg för steg.

| | PROD idag (develop-kod) | Kandidat med Kvot + Kaskad |
|---|---|---|
| Lärstigar / teorimoduler / scenarier | 10 / 9 / 23 | 12 / 11 / 30 |
| Sidfel eller undantag | 0 | 0 |
| Icke-finita PV-värden | 0 | 0 |
| Falska "X ändrad"-markeringar | 0 | 0 |
| `validate-content catalog.prod.json` | ✓ | ✓ |

**Synlighet i lärstigarna (kandidatbygget):**

- **Kaskadreglering:** Slavslinga-panelen visas i steg 1, 3 och 4. Den är dold i steg 2
  ("Enkelslinga — problemet"), vilket är avsiktligt. Kvot-kontrollerna är dolda.
- **Kvotreglering:** kvotregleringen är aktiv i steg 2 och 3. Slavslingan är dold.
  Kontrollernas synlighet är identisk med DEV, som PO redan har testat.

---

## 4. Beslutspunkter

### B1. Vad ska släppas?

| Alternativ | Innebörd |
|---|---|
| **A. Båda, v1.7.0** (rekommenderas) | 12 lärstigar i PROD. Alla fyra reglerstrategier från STRAT-001 blir publicerade i ordningen Parameterstyrning → Framkoppling → Kvot → Kaskad. |
| B. Bara Kvot, v1.7.0 | Kaskad väntar. Kaskad-koden följer ändå med men syns inte, eftersom Slavslingan bara visas i scenarier med `cascade.enabled` och inget sådant finns i PROD. |
| C. Ingen ny lärstig, v1.6.3 | Bara buggfixen 2026-018. Koden för båda funktionerna följer ändå med, se B2. |

### B2. Kvotreglering syns under "Avancerat" oavsett B1

`APPLICATION_PROFILES` ger Tillämpning "Avancerat" tillgång till kvotreglerings-tillägget.
Det gäller redan i dagens PROD-bygge av `develop`, alltså utan någon katalogändring.
Kaskad har ingen motsvarande kryssruta och påverkas inte.

- Med alternativ A eller B är detta konsekvent. Framkoppling och Parameterstyrning syns
  under "Avancerat" på samma sätt.
- Med alternativ C finns en kryssruta i PROD som ingen publicerad lärstig förklarar.
  Om PO väljer C behövs ett beslut om att dölja tillägget i PROD. Det är en mindre ändring.

### B3. PO:s eget slutgodkännande

Varje lärstig i PROD har hittills fått PO:s uttryckliga "testad och godkänd för PROD".
Kaskad hade sex testrundor i rad där PO hittade verkliga problem som automatiska tester
missade (se HANDOFF_2026-09-24 avsnitt 14). Därför rekommenderar jag en sista
genomklickning innan releasen. Det är inte ytterligare en utvecklingsrunda.

---

## 5. Bugg 2026-018 (fixad idag)

En falsk "X ändrad"-markering lades till i grafen vid första steget i **alla 39
scenarier**, och redan när sidan laddades. Kvotscenarierna fick dessutom en falsk
"SP x→y" efter Återställ och Rensa. Orsaken var att baslinjen för jämförelsen togs på
scenariofilens råa form i stället för den normaliserade form som varje steg jämför mot.

Resultat före och efter fixen, i ett webbläsarsvep över alla scenarier och lärstigar:

| | Före | Efter |
|---|---|---|
| Scenarier med falsk markering (ladda / Återställ / Rensa) | 39 / 39 | 0 / 39 |
| Lärstigssteg med falsk markering | 56 | 0 |
| Markering direkt vid sidladdning | Ja | Nej |
| Äkta ändringar (Kp, SP) markeras | Ja | Ja |
| PV-kurvor identiska före/efter | — | 117 / 117 |

"Zonbyte (K)" i de två ventilkarakteristik-scenarierna finns kvar. Det är en avsedd
markering för en verklig zonövergång (FEAT-042), inte en del av buggen.

Buggen finns i nuvarande PROD (v1.6.2). Fixen följer därför med i nästa release, vilket
alternativ som än väljs i B1.

---

## 6. Releasesteg om PO väljer A

Enligt `docs/WORKFLOW.md` avsnitt 5:

1. `catalog.prod.json`: lägg till `kvotreglering.v1` och `kaskadreglering.v1` sist,
   teorimodulerna `kvotreglering` och `kaskadreglering`, samt 7 scenarier
   (`kvotreglering-demo-{fast-sp,korrekt,fel-kvot}`,
   `kaskad-demo-{sp-steg,enkelslinga,losning,langsam-slav}`).
2. `tests/validate-prod.mjs`: lägg till båda i `EXPECTED_LEARNING_PATHS` med
   PO-godkännandet som kommentar.
3. Ändra `APP_VERSION` till `1.7.0`, skriv en ny sektion i `CHANGELOG.md` och uppdatera
   versionsreferenserna i `README.md`.
4. Fast-forwarda `main`, tagga `v1.7.0` och pusha. GitHub Actions bygger och driftsätter
   `dist/prod`.
5. Kontrollera att https://peman68.github.io/PID-simulator/ visar v1.7.0.

Steg 1–2 är redan provade i kandidatbygget ovan.

---

## 7. Kvarstående kända begränsningar (påverkar inte releasen)

- **Kaskad-windup:** det finns ingen särskild hantering för windup mellan slingorna.
  Den behövs inte i de fyra demoscenarierna, eftersom slavregulatorn aldrig mättar i något
  av dem. Detta måste kontrolleras på nytt om större störningar läggs till senare
  (STRAT-007).
- FEAT-049 (HMI-/SCADA-vy), FEAT-046 (blockschema-SVG:er) och FEAT-031 är oförändrade och
  påverkas inte.
