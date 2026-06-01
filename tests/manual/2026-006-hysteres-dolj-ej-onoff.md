# Manuellt test: 2026-006 — Hysteresfält visas oavsett läge

## Starta lokal testmiljö

GitHub Pages byggs från `main` — använd lokal server för att testa aktuell branch.

```powershell
python -m http.server 8000 --directory apps/app
```

Öppna `http://localhost:8000`. Stoppa med `Ctrl+C`.

---

## Testfall

### TC-001: Hysteresfält dolda i PID-läge
**Steg:**
1. Ladda ett scenario med PID-läge (t.ex. `basic-step-self-regulating`)
2. Kontrollera att fälten "Hyst. låg" och "Hyst. hög" inte syns i panelen

**Förväntat:** Båda hysteresfälten är dolda.

---

### TC-002: Hysteresfält dolda i P-läge
**Steg:**
1. Byt läge till `P`
2. Kontrollera panelen

**Förväntat:** Hysteresfälten är dolda.

---

### TC-003: Hysteresfält dolda i PI-läge
**Steg:**
1. Byt läge till `PI`
2. Kontrollera panelen

**Förväntat:** Hysteresfälten är dolda.

---

### TC-004: Hysteresfält dolda i Manuellt läge
**Steg:**
1. Byt läge till `Manuell`
2. Kontrollera panelen

**Förväntat:** Hysteresfälten är dolda.

---

### TC-005: Hysteresfält visas i On/Off-läge
**Steg:**
1. Byt läge till `On/Off`
2. Kontrollera panelen

**Förväntat:** Båda hysteresfälten ("Hyst. låg" och "Hyst. hög") är synliga och redigerbara.

---

### TC-006: Byte från On/Off → PID döljer fälten
**Steg:**
1. Byt läge till `On/Off` — verifiera att fälten syns
2. Byt läge till `PID`

**Förväntat:** Hysteresfälten försvinner direkt vid lägesbyte.

---

### TC-007: Hysteresvärden bevaras vid lägesbyte
**Steg:**
1. Byt till `On/Off`, sätt "Hyst. låg" till `3` och "Hyst. hög" till `5`
2. Byt till `PID`
3. Byt tillbaka till `On/Off`

**Förväntat:** Värdena 3 och 5 är fortfarande kvar i fälten.
