# Manuellt test: 2026-007 — Puls steg tillåter 0 och negativa tal

## Starta lokal testmiljö

GitHub Pages byggs från `main` — använd lokal server för att testa aktuell branch.

```powershell
python -m http.server 8000 --directory apps/app
```

Öppna `http://localhost:8000`. Stoppa med `Ctrl+C`.

---

## Testfall

### TC-001: Tangentbord kan inte skriva negativt värde
**Steg:**
1. Ladda ett scenario
2. Klicka i fältet "Puls steg"
3. Skriv `-5` via tangentbord

**Förväntat:** Värdet accepteras inte eller klammas till 0 (fältet visar 0 eller ignorerar negativa).

---

### TC-002: Tangentbord tillåter 0
**Steg:**
1. Klicka i fältet "Puls steg"
2. Radera innehållet och skriv `0`

**Förväntat:** Värdet 0 accepteras och visas i fältet.

---

### TC-003: Musklick kan gå ner till 0
**Steg:**
1. Sätt "Puls steg" till `1`
2. Klicka på nedåtpilen i fältet

**Förväntat:** Värdet minskar till 0 och kan inte minskas ytterligare med musklick.

---

### TC-004: Puls med steg=0 ger ingen effekt
**Steg:**
1. Sätt "Puls steg" till `0` och "Puls mag" till `10`
2. Kör simulering 10 steg
3. Klicka "Trigga puls"
4. Kör 10 steg till

**Förväntat:** PV-kurvan är opåverkad (0 steg = ingen puls).

---

### TC-005: Puls med steg>0 fungerar fortfarande
**Steg:**
1. Sätt "Puls steg" till `3` och "Puls mag" till `10`
2. Kör simulering 10 steg
3. Klicka "Trigga puls"
4. Kör 10 steg till

**Förväntat:** PV hoppar synligt under 3 steg efter pulsen triggades.
