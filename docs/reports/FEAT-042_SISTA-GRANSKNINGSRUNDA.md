# FEAT-042 — Sista granskningsrunda efter PO:s användartest

**Datum:** 2026-09-19
**Uppdragsgivare:** PO
**Branch:** `feature/FEAT-042-parameterstyrning-ventilkarakteristik` (fortsatt EJ mergad)
**Underlag:** PO:s sammanställda slutliga feedback från användartestet,
`docs/reports/FEAT-042_ANVANDARTEST-ATGARDER.md` (föregående rundas rapport)

---

## 1. Genomförda ändringar

### Punkt 1 — Zonbadges borttagna

Badgen ("Aktiv: Zon N") togs bort helt — HTML-elementen (`<span id="gsZoneBadge">`/
`<span id="ngZoneBadge">`), CSS-klasserna (`.zone-badge*`) och
badge-uppdateringskoden i `updateZoneIndicators()`. **Behållet, som instruerat:**
den färgade ramen runt aktiva zonens egna fält (`zone-active-regulator`/
`zone-active-process`), statusradens zonavläsning ("Zon 2 (Kp=1.8)"/"K-zon 3
(K=2.5)") och grafens zonbytesmarkeringar. `activeZones()` är fortsatt den enda
källan för alla tre kvarvarande mekanismerna. Hjälptexterna för de två
kryssrutorna uppdaterade att beskriva ramen/statusraden istället för badgen.

### Punkt 2 — Zonlogiken förklarad

Ny mening i teorimodulen (steg 1): "de två zonsystemen är HELT OBEROENDE...
processen kan visa OLIKA zonnummer samtidigt... inget fel, bara en konsekvens av
att u och PV inte alltid befinner sig i motsvarande delar av sina respektive
skalor." Samma förklaring återkommer konkret i steg 7:s instruktion (där
studenten faktiskt kan observera det hända) och i checkpointens explanation.
Även tillagd i `nonlinearGainEnabled`s hjälptext, så den syns oavsett om man
kommer via lärstigen eller fritt läge.

### Punkt 3 + 5 — Objektiv mätmetod (PER:s notering: dessa två hänger ihop —
bekräftat, se avsnitt 1 nedan)

Samtliga sex mätningar (A–F) instruerar nu **exakt** samma metod som redan
etablerad i övrigt kursmaterial: aktivera Mätläge, ange PV₀/PV∞ (konkreta
siffror per steg, t.ex. PV₀=0/PV∞=10), kryssa i "Visa 2%-toleransband
(insvängning)", och läs av exakt vid vilket steg kurvan går in i bandet och
stannar kvar — inte ett ögonmåttsbeslut om "ser stabil ut."

**Rotorsaksanalys av punkt 5:** Simulerade själv fram exakt samma scenario (SP=90,
steg 3) med `tests/simulation/` och undersökte kurvan runt den beräknade
insvängningspunkten (steg 50). Fyndet: PV går tekniskt in i det exakta 2%-bandet
vid steg ~50 och stannar där resten av körningen — men fortsätter samtidigt att
krypa märkbart uppåt i flera tiotals steg till (89.7 vid steg 90, 89.9 vid steg
120) innan kurvan verkligen SER helt platt ut för ögat. En student som
"ögonmått-bedömer" när kurvan ser stabil ut väntar alltså naturligt mycket längre
än den exakta 2%-definitionen kräver — särskilt tydligt vid SP=90-fallen (B, D),
mindre märkbart vid SP=10-fallen (A, C), vilket matchar precis det mönster PO:s
egna siffror visade (C≈A-diskrepansens storlek var liten, B/D-diskrepansen stor).

**Slutsats för punkt 5 specifikt:** Kontrollerade lärstigstextens påståenden
("C < A", "C inte i samma härad som B") mot scenariofilernas faktiska,
simuleringsverifierade beteende (oförändrat sedan förra rundan) — påståendena
stämmer när insvängningstiden mäts med den EXAKTA 2%-bandsmetoden. Ingen
sakfel i texten eller i scenarierna — problemet var uteslutande att
instruktionen tidigare tillät fritt ögonmått, vilket gav inkonsekventa,
metodberoende resultat. Åtgärdat genom punkt 3:s fix, ingen ytterligare ändring
av jämförelsepåståendena behövdes.

### Punkt 4 — Fullständigt mätprotokoll

Varje steg instruerar nu explicit: "Anteckna: SP=X, Kp=Y (eller aktiv
uppsättning=Zon N), insvängningstid." Granskade samtliga sex jämförelser
(A mot B, C mot A/B, D mot B, E mot A/C, F mot B/C) — alla har nu tillräckligt
antecknat underlag (SP + Kp/zon + tid) för att kunna genomföras.

### Punkt 6 — Tvåstegsprofilen förklarad

Tillagd direkt i steg 2:s instruktion, innan mätningen börjar: "I det här
scenariot delar Zon 2 och Zon 3 samma K-värde (2.5) — mekanismen har alltid tre
zoner, men just den här processen behöver bara TVÅ olika beteenden (svag/stark)
för att visa poängen tydligt." Bedömning: ja, detta behövde förklaras (en
uppmärksam student skulle annars rimligen undra varför en synlig zongräns finns
mellan två fält med identiskt beteende) — men bara EN mening räcker, ingen djupare
utläggning bedömdes nödvändig.

---

## 2. Punkter medvetet lämnade oförändrade

- **De två tidigare rapporterna** (`FEAT-042_IMPLEMENTATION.md`,
  `FEAT-042_ANVANDARTEST-ATGARDER.md`) är INTE omskrivna för att ta bort
  badge-omnämnanden — de står kvar som en ärlig historik över vad som
  prövades och sedan togs bort, i linje med hur tidigare uppföljningsrapporter
  i det här projektet fungerar (t.ex. PED-003-seriens kedja).
- **`sim-core.js` orörd igen** — samtliga sex punkter denna runda var UI-text/
  UI-visning, ingen simuleringslogik.
- **Scenariofilernas siffror (K-zoner, Kp-värden) oförändrade** — punkt 5:s
  utredning visade att de redan var korrekta; inget att justera där.
- **`docs/exercises/ovningar-parameterstyrning.md` (det fristående
  övningsdokumentet) inte uppdaterat denna runda.** Observation: samma
  ögonmåtts-/mätmetodproblem (punkt 3/5) finns sannolikt latent även där, av
  samma anledning. Inte åtgärdat eftersom uppdraget avgränsades till
  "lärstigen" — flaggas här för PO:s kännedom, inte tyst ignorerat.
- **10-stegsknappens låsning** — oförändrad bedömning från förra rundan
  (avstyrkt, se `FEAT-042_ANVANDARTEST-ATGARDER.md` avsnitt 4); inget nytt i
  denna rundas feedback ändrar den bedömningen.

---

## 3. Verifiering

- `node --check apps/app/app.js`: OK.
- `validate-content.mjs`/`validate-prod.mjs` (DEV+PROD): inga nya varningar.
- Fullständig regressionssvit (15 testsviter): 0 FAIL.
- DEV-/PROD-byggnation kontrollerad, badge-koden bekräftat borta ur båda.
- **Ingen webbläsartest genomförd** — ingen webbläsare tillgänglig i denna
  miljö, som i tidigare rundor.

---

## 4. Slutlig rekommendation om merge

**Redo för PO:s slutliga visuella godkännande — fortsatt inte mergad.**

Samtliga sex punkter från den här rundan är åtgärdade och, där det går att
verifiera utan webbläsare (JSON-korrekthet, referensintegritet, simulerings-
verifierade siffror, regressionssvit), bekräftat korrekta. Kvarstående
verifieringsbehov är uteslutande visuellt/manuellt:
- Att badgen verkligen är borta och att fälthighlighten (ram) fortfarande syns
  och byter zon korrekt.
- Att Mätläge + 2%-toleransband ger en läsbar, tydlig avläsningspunkt för alla
  sex mätningar.
- Att texterna om zonoberoende (steg 7) läses naturligt i sitt sammanhang.

Om dessa ser korrekta ut vid PO:s manuella genomgång bedöms branchen redo för
merge till `develop`. Ingen ytterligare kod- eller innehållsändring
rekommenderas utöver vad som redan är levererat i de tre FEAT-042-rapporterna.
