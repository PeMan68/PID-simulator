# Scenarier och lärstigar — översikt och genomgång

Genererad 2026-08-21 som underlag för pedagogisk avstämning mot klassgenomgångar.
Källa: `apps/app/content/catalog.json` + samtliga scenario- och lärstigsfiler.

Innehåll:
1. [Lärstigar](#1-lärstigar) — samtliga 6 aktiva + 1 föräldralös fil
2. [Scenarier](#2-scenarier) — samtliga 19, med användning
3. [Scenario → lärstig-koppling](#3-scenario--lärstig-koppling)
4. [Oanvända scenarier](#4-oanvända-scenarier)
5. [Rekommendationer](#5-rekommendationer)

---

## 1. Lärstigar

6 lärstigar är registrerade i `catalog.json` och laddningsbara i appen.

| ID | Titel | Nivå | Steg (teori/scenario) | Scenarier som används |
|---|---|---|---|---|
| `kom-igång.v1` | Kom igång med PID Simulator | intro | 0 teori / 5 scenario | `basic-step-self-regulating` (×4), `pid-step-self-regulating` (×1) |
| `grundlaggande.v1` | Grundläggande reglering | intro | 1 teori / 4 scenario | `onoff-basic`, `p-step-self-regulating`, `pi-step-self-regulating`, `pid-step-self-regulating` |
| `processbegransningar.v1` | Processens begränsningar | intro | 1 teori / 2 scenario | `pi-step-self-regulating` (×2, samma scenario med olika parameterändringar) |
| `windup.v1` | Integratoruppvridning & integrerande process | intermediate | 2 teori / 3 scenario | `pi-windup-demo` (×2), `integrating-pi` (×1) |
| `lambda-metoden.v1` | Lambda-metoden | intermediate | 1 teori / 4 scenario | `lambda-open-loop`, `lambda-pi-moderate`, `lambda-pi-aggressive`, `lambda-pi-conservative` |
| `stegsvar-identifiering.v1` | Stegsvar och processidentifiering | intermediate | 1 teori / 6 scenario | `manual-identification` (×6, samma scenario genom hela mätövningen) |

### Föräldralös fil (ej i catalog.json)

**`apps/app/content/exercises/basic-learning-path.v1.json`** — "Grundstig: teori till simulering". Refereras **inte** i `catalog.json` → går inte att ladda i appen. Innehållet (teori pid-intro → `manual-open-loop` → `p-step-self-regulating` → `pi-step-self-regulating`) är i praktiken en enklare föregångare till `grundlaggande.v1` (som har checkpoints/quiz och även täcker on/off och PID). Ser ut som en kvarglömd utkastfil.

**Rekommendation:** radera filen, eller om något i den saknas i `grundlaggande.v1` (t.ex. den explicita öppna-slingan-steget) — flytta in det innan borttagning. Se avsnitt 5.

---

## 2. Scenarier

19 scenarier finns registrerade i `catalog.json`.

| ID | Titel | Process | Regulator | Används i lärstig |
|---|---|---|---|---|
| `basic-step-self-regulating` | Grundläggande stegsvar självreglerande | self_regulating K=1.5 T=5 L=1 | PID | `kom-igång.v1` |
| `p-step-self-regulating` | P-reglering stegsvar | self_regulating K=1.3 T=15 | P | `grundlaggande.v1` |
| `pi-step-self-regulating` | PI-reglering stegsvar | self_regulating K=1.3 T=15 | PI | `grundlaggande.v1`, `processbegransningar.v1` (×2) |
| `pid-step-self-regulating` | PID-reglering stegsvar | self_regulating K=1.3 T=15 | PID | `grundlaggande.v1`, `kom-igång.v1` |
| `onoff-basic` | On/Off grundläggande | self_regulating K=1.0 T=10 | On/Off, hyst 10/10 | `grundlaggande.v1` |
| `onoff-hysteresis-basic` | OnOff med hysteresis | self_regulating K=1.0 T=20 | On/Off, hyst 10/10 | *(ingen)* |
| `manual-open-loop` | Manuellt öppen slinga | self_regulating K=1.0 T=20 | Manuell, u=50 | *(ingen — bara i föräldralösa filen)* |
| `pid-disturbance-noise` | PID med brus | self_regulating K=1.0 T=20 L=5 | PID, noiseStd=3 | *(ingen)* |
| `pid-pulse-rejection` | PID pulsstörningsavstötning | self_regulating K=1.0 T=20 | PID, puls 10/5 steg | *(ingen)* |
| `pi-windup-demo` | PI — integratoruppvridning (windup) | self_regulating K=1.0 T=20 | PI, anti-windup av | `windup.v1` (×2) |
| `integrating-pi` | Integrerande process — PI-reglering | integrating K=0.01, tank | PI | `windup.v1` |
| `integrating-experimental` | Integrerande process — fri utforskning | integrating K=0.01 | PI (fri) | *(ingen)* |
| `unstable-experimental` | Instabil process experimentell | unstable K=1.5 T=5 L=0.5 | PID | *(ingen)* |
| `lambda-open-loop` | Lambda — processidentifiering | self_regulating K=1.5 T=20 L=5 | P (lågt Kp) | `lambda-metoden.v1` |
| `lambda-pi-moderate` | Lambda PI — måttligt λ (λ=T) | self_regulating K=1.5 T=20 L=5 | PI, Kp=0.53 | `lambda-metoden.v1` *(nämns även i text i `stegsvar-identifiering.v1`, ej som steg-ref)* |
| `lambda-pi-aggressive` | Lambda PI — aggressivt λ (λ=L) | self_regulating K=1.5 T=20 L=5 | PI, Kp=1.33 | `lambda-metoden.v1` |
| `lambda-pi-conservative` | Lambda PI — konservativt λ (λ=3T) | self_regulating K=1.5 T=20 L=5 | PI, Kp=0.21 | `lambda-metoden.v1` |
| `manual-identification` | Processidentifiering (manuell) | self_regulating K=1.5 T=20 L=5 | Manuell, u=30 | `stegsvar-identifiering.v1` (×6) |
| `second-order-identification` | Processidentifiering 2:a ordningen | self_regulating_2 (S-kurva) K=1.5 T=20 L=3 | Manuell, u=30 | *(ingen)* |

---

## 3. Scenario → lärstig-koppling

Sammanfattat: **12 av 19 scenarier** används i minst en aktiv lärstig, **7 används inte alls**.

```
kom-igång.v1              → basic-step-self-regulating, pid-step-self-regulating
grundlaggande.v1          → onoff-basic, p-step-self-regulating, pi-step-self-regulating, pid-step-self-regulating
processbegransningar.v1   → pi-step-self-regulating
windup.v1                 → pi-windup-demo, integrating-pi
lambda-metoden.v1         → lambda-open-loop, lambda-pi-moderate, lambda-pi-aggressive, lambda-pi-conservative
stegsvar-identifiering.v1 → manual-identification
```

Not: flera scenarier används flera gånger *inom* samma lärstig med olika parameterändringar under övningens gång (t.ex. `pi-step-self-regulating` i `processbegransningar.v1`, `manual-identification` i `stegsvar-identifiering.v1`). Det är avsedd design, inte dubbelarbete.

---

## 4. Oanvända scenarier

7 scenarier laddas aldrig av någon lärstig (de går fortfarande att välja manuellt i scenario-listan):

| Scenario | Vad det visar | Trolig anledning till att det inte används |
|---|---|---|
| `onoff-hysteresis-basic` | On/Off med symmetrisk hysteres 10/10 | Nästan identiskt med `onoff-basic` (samma hysteres, bara T skiljer 10 vs 20) — sannolikt en kvarleva/duplikat |
| `manual-open-loop` | Öppen slinga, fast u=50, ingen reglering | Fanns bara i den föräldralösa `basic-learning-path.v1.json` |
| `pid-disturbance-noise` | PID med kontinuerligt brus | Ingen lärstig om störningar/robusthet finns ännu |
| `pid-pulse-rejection` | PID som avvisar en pulsstörning | Samma som ovan |
| `integrating-experimental` | Fri utforskning av integrerande process | Ser avsiktligt ut som ett "prova själv"-scenario, inte ett guidat steg |
| `unstable-experimental` | Instabil process | Ingen lärstig om instabila processer finns — och det finns heller ingen teorifil om instabilitet i `catalog.json` |
| `second-order-identification` | Identifiering av S-kurve-process (2:a ordningen) | Skapades i FEAT-028 (flerkapacitiv process) men kopplades aldrig in i `stegsvar-identifiering.v1` |

---

## 5. Rekommendationer

### A. Lärstigar som kan koppla in befintliga, oanvända scenarier direkt

- **`stegsvar-identifiering.v1` bör utökas med `second-order-identification`.**
  Lärstigens egen teoridel (`tangentmetoden.v1.json`) nämner redan uttryckligen att flerkapacitiva processer har inflexionspunkten mitt i S-kurvan — men lärstigen demonstrerar aldrig det med ett verkligt scenario. Detta är en direkt uppföljare till FEAT-026/FEAT-028 (stängda 2026-06-26) som inte blev klar. Inget nytt scenario behövs, bara nya steg.
- **Ny lärstig "Störningar och robusthet"** (redan noterad i `docs/planning/WEB-IAKTTAGELSER.md`, 2026-05-27, som mellannivå baserad på `ovningar-signalstorningar.md`) kan byggas helt med befintliga `pid-disturbance-noise` och `pid-pulse-rejection` — inga nya scenarier krävs för att komma igång.
- **`grundlaggande.v1` eller `kom-igång.v1` skulle kunna inleda med `manual-open-loop`** som ett "vad händer utan reglering?"-steg innan on/off introduceras — pedagogiskt naturlig startpunkt, scenariot finns redan.
- **`onoff-hysteresis-basic` bör antingen tas bort (duplikat av `onoff-basic`) eller ges ett eget syfte** — t.ex. omgjort till asymmetrisk hysteres (upper ≠ lower) för att visa något `onoff-basic` inte gör. I nuvarande form tillför det inget nytt.

### B. Lärstigar som sannolikt behöver *nytt* innehåll, inte bara koppling

- **Instabila processer** — `unstable-experimental` finns, men det finns ingen teorifil om instabilitet i `catalog.json` (`theory`-listan saknar en post för detta). En lärstig här kräver ny teoritext, inte bara ett nytt steg. Löst kopplat till FEAT-011 (säkerhetsmarginaler, låg prio i `docs/tracking/todo.md`).
- **FEAT-022 (verkningsriktning, direkt/omvänt verkande)** i `docs/tracking/todo.md` — kräver ett helt nytt scenario (t.ex. kylprocess) eftersom funktionen inte är byggd än. Ingen befintlig scenariofil täcker detta.
- **"Optimering"-nivån** (tredje och sista delen av tre-nivå-planen i `docs/planning/WEB-IAKTTAGELSER.md`, baserad på `ovningar-systemoptimering.md`) — de befintliga scenarierna är alla fasta startpunkter; en övning om avvägningar vid tuning (overshoot vs. insvängningstid) har troligen inget bra existerande scenario och behöver nya.

### C. Städning

- **Radera eller arkivera `apps/app/content/exercises/basic-learning-path.v1.json`** — oåtkomlig i appen, innehållsmässigt ersatt av `grundlaggande.v1`.
- **`integrating-experimental`** ser ut att vara avsiktligt fristående (fri utforskning) — behöver troligen inte kopplas till någon lärstig, men värt att bekräfta att det är avsikten och inte en glömd koppling.

---

*Detta dokument är ett engångsunderlag för genomgång, inte ett levande spårningsdokument. Beslut som fattas utifrån det bör landa som FEAT-poster i `docs/tracking/todo.md` eller uppdateringar i `docs/planning/WEB-IAKTTAGELSER.md`.*
