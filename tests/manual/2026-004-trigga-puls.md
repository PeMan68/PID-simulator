# Manuellt test: 2026-004 — Trigga puls påverkar inte PV

## Starta lokal testmiljö

GitHub Pages byggs från `main` — använd lokal server för att testa aktuell branch.

```powershell
python -m http.server 8000 --directory apps/app
```

Öppna `http://localhost:8000`. Stoppa med `Ctrl+C`.

---

## Testfall

### TC-001: Puls triggar med default-scenario (durationSteps=0)
**Förutsättning:** Scenariot `basic-step-self-regulating` är laddat (har `durationSteps: 0` som default).
**Steg:**
1. Ladda scenariot
2. Sätt "Puls mag" till `10`
3. Kontrollera att "Puls steg" visar `3` (default)
4. Klicka "Kör 10 steg" så kurvan börjar plottas
5. Klicka "Trigga puls"
6. Klicka "Kör 10 steg" igen

**Förväntat:** PV-kurvan hoppar synligt uppåt under 3 steg efter pulsen triggades.

---

### TC-002: Puls triggar med konfigurerat antal steg
**Förutsättning:** Valfritt scenario laddat, simulering startad.
**Steg:**
1. Sätt "Puls mag" till `15`
2. Sätt "Puls steg" till `5`
3. Klicka "Trigga puls"
4. Kör 10 steg

**Förväntat:** PV hoppar under exakt 5 steg, sedan återgår kurvan mot normalt beteende.

---

### TC-003: pid-pulse-rejection-scenariot fortfarande fungerar
**Förutsättning:** Scenariot `pid-pulse-rejection` laddat (har `magnitude: 10, durationSteps: 5`).
**Steg:**
1. Ladda scenariot
2. Kör 20 steg
3. Klicka "Trigga puls"
4. Kör 20 steg till

**Förväntat:** PV påverkas och regulatorn kompenserar — kurvan visar ett tydligt störningsutslag som sedan återgår mot SP.

---

### TC-004: Puls med magnitude 0 ger ingen effekt
**Steg:**
1. Sätt "Puls mag" till `0`
2. Klicka "Trigga puls"
3. Kör 10 steg

**Förväntat:** PV-kurvan är opåverkad (korrekt beteende — magnitude är 0).
