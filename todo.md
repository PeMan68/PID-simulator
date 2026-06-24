# Feature Backlog — Öppna

Nya features registreras här i `develop`-branchen innan en feature-branch skapas.
Varje feature-branch uppdaterar **endast sin egen post** (status, anteckningar).
Klara features flyttas till [todo-done.md](todo-done.md).

---

## Webbapp (`apps/app/`)

### BESLUT-001 — Ta ställning till appens namn inför slutlig prod-version
**Prioritet:** Låg (innan release)
**Beskrivning:**
"PID Simulator" är tekniskt korrekt men kan vara exkluderande för nybörjare och speglar inte bredden (On/Off, Lambda-metoden, lärstigar). Kandidater: Reglerlab, PIDlab, Processlabb. Namnbyte kräver: byta repo-namn på GitHub, uppdatera GitHub Pages-URL, uppdatera `<title>`, sidebar-rubrik och `APP_VERSION`-text i appen. Överväg custom domain för stabilt URL.
**Status:** Öppen — beslut krävs

---

### FEAT-022 — Direktverkande / Omvänt verkande (verkningsriktning)
**Branch:** `feature/verkningsriktning`
**Prioritet:** Medel
**Beskrivning:**
Industriella regulatorer har en inställning för verkningsriktning: omvänt verkande (Kp > 0, t.ex. värme — utsignal ökar när PV sjunker) och direktverkande (Kp < 0, t.ex. kyla — utsignal ökar när PV stiger). Ska implementeras som en toggle i Regulator-gruppen och påverkar PB-bandets placering (ovanför SP vid direktverkande). Lämplig att inkludera i en lärstig om reglering av kylprocesser.
**Status:** Öppen

---

### FEAT-005 — Stegning framåt/bakåt i historik med markör
**Branch:** `feature/historik-stegning`
**Prioritet:** Medel
**Beskrivning:**
Möjlighet att stega framåt och bakåt i en redan plottad kurva. En markör i grafen visar vilket steg som presenteras, inklusive tidpunkt och aktuella P/I/D-värden i statusraden.
**Lösningsidé:**
Kräver sparande av alla simulator-stater — kan implementeras med state snapshots eller replay-logik.
**Status:** Öppen

---

### FEAT-007 — Avancerade störningsmodeller
**Branch:** `feature/storningsmodeller`
**Prioritet:** Medel
**Beskrivning:**
Fler typer av realistiska processförändringar utöver befintliga störningstyper.
**Status:** Öppen

---

### FEAT-009 — Frekvensanalys av störningar
**Branch:** `feature/frekvensanalys`
**Prioritet:** Låg
**Beskrivning:**
Olika brusfrekvenser och deras påverkan på reglering.
**Status:** Öppen

---

### FEAT-010 — Adaptiv reglering
**Branch:** `feature/adaptiv-reglering`
**Prioritet:** Låg
**Beskrivning:**
Automatisk anpassning av PID-parametrar för olika driftförhållanden.
**Status:** Öppen

---

### FEAT-011 — Säkerhetsmarginaler
**Branch:** `feature/sakerhetsmarginaler`
**Prioritet:** Låg
**Beskrivning:**
Verktyg för design med störningsreserver (gain margin, phase margin).
**Status:** Öppen

---

## Python-app (`main.py`)

### FEAT-006 — Utökad historik — jämförelse och export
**Branch:** `feature/python-historik-utokad`
**Prioritet:** Medel
**Beskrivning:**
Fler jämförelsemöjligheter mellan körningar och utökade exportalternativ utöver befintlig CSV-export.
**Status:** Öppen

---

### FEAT-008 — Utökad tooltip-funktionalitet
**Branch:** `feature/python-tooltips-utokad`
**Prioritet:** Medel
**Beskrivning:**
Mer kontextuell hjälp för avancerade funktioner via tooltips.
**Status:** Öppen

---

### FEAT-012 — Optimerad graf-rendering
**Branch:** `feature/python-graf-rendering`
**Prioritet:** Låg
**Beskrivning:**
Bättre prestanda vid många historiska kurvor simultant.
**Status:** Öppen

---

### FEAT-013 — Förbättrad export-funktionalitet
**Branch:** `feature/python-export-utokad`
**Prioritet:** Låg
**Beskrivning:**
Fler exportformat och dataanpassningar.
**Status:** Öppen

---

### FEAT-014 — Unicode/emoji-kompatibilitet
**Branch:** `feature/python-unicode`
**Prioritet:** Hög
**Beskrivning:**
Fullständig emoji-support för äldre Python/Tcl-versioner. Identifierat i v1.6.1 release notes.
**Status:** Öppen

---

### FEAT-015 — Förbättrad dialog-positionering
**Branch:** `feature/python-dialog-pos`
**Prioritet:** Medel
**Beskrivning:**
Mer robust centrering av dialogrutor på alla skärmkonfigurationer. Identifierat i v1.6.1 release notes.
**Status:** Öppen

---

### FEAT-016 — Förbättrad hysteresis-visualisering (OnOff)
**Branch:** `feature/python-hysteresis-ui`
**Prioritet:** Medel
**Beskrivning:**
Tydligare visuell feedback för OnOff-regulatorns hysteresis-gränser.
**Status:** Öppen
