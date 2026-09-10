// GAM-003A — Innehållsinventering av samtliga aktiva DEV-lärstigar.
//
// Siffrorna nedan är extraherade genom att parsa varje lärstigs faktiska
// instruktionstext i apps/app/content/exercises/*.json (regex-sökning efter
// "<tal> steg", "Byt Läge", "Trigga puls", "Mät K/T/L"/mätpanelens fält,
// "Jämför"/konfigurations-markörer) — INTE gissade. Se
// docs/reports/GAM-003A_XP-KALIBRERING.md avsnitt 4 ("Metod") för den
// exakta extraktionen. Där instruktionstexten inte entydigt anger ett tal
// (t.ex. "kör samma antal steg som i föregående steg" eller en step som
// enbart återanvänder föregående stegs data för mätarbete) är värdet en
// motiverad, tydligt markerad uppskattning — se `note`-fältet per steg.
//
// `configsInStep`: antal PEDAGOGISKT DISTINKTA konfigurationer instruktionen
// uttryckligen ber användaren köra i just detta steg.
//
// `comparisonGroup` (GAM-003A.2): speglar EXAKT samma fält som satts i de
// verkliga lärstigsfilerna (apps/app/content/exercises/*.json) — se
// docs/reports/GAM-003A.2_COMPARISON-GROUPS.md för den fullständiga
// inventeringen av vilka steg som fick ett grupp-ID och varför. Steg utan
// comparisonGroup vars jämförelse korsar en kontextgräns missas fortfarande
// av GAM-002 (dokumenterat i `note`) — det gäller bara oppen-slinga-onoff-p.v1,
// där ingen uttrycklig jämförelseinstruktion finns.
//
// Ordningen matchar catalog.json (samma ordning som DEV-appen visar).

export const LP_INVENTORY = [
  {
    id: "kom-igång.v1",
    title: "Kom igång med PID Simulator",
    note: "Onboarding utan checkpoints (FEAT-025) — introducerar UI-funktioner, inte regulatortuning.",
    steps: [
      { type: "scenario", checkpoint: false, simSteps: 5, configsInStep: 0 },
      { type: "scenario", checkpoint: false, simSteps: 5, configsInStep: 0 },
      { type: "scenario", checkpoint: false, simSteps: 10, configsInStep: 0 },
      { type: "scenario", checkpoint: false, simSteps: 20, configsInStep: 0 },
      { type: "scenario", checkpoint: false, simSteps: 5, configsInStep: 0 },
    ],
  },
  {
    id: "oppen-slinga-onoff-p.v1",
    title: "Öppen slinga, On/Off och P-reglering",
    steps: [
      { type: "theory", checkpoint: true },
      { type: "scenario", checkpoint: true, simSteps: 100, configsInStep: 1 },
      { type: "theory", checkpoint: true },
      { type: "scenario", checkpoint: true, simSteps: 40, configsInStep: 1 },
      { type: "scenario", checkpoint: true, simSteps: 50, configsInStep: 1, note: "Jämförs mot steg 4 (On/Off) — annan kontext, GAM-002 ser inte paret." },
    ],
  },
  {
    id: "proportionalband-forstarkning.v1",
    title: "Proportionalband och regulatorförstärkning",
    steps: [
      { type: "theory", checkpoint: true },
      { type: "scenario", checkpoint: true, simSteps: 30, configsInStep: 1, comparisonGroup: "pb-kp-escalation" },
      { type: "scenario", checkpoint: true, simSteps: 60, configsInStep: 2, comparisonGroup: "pb-kp-escalation", note: "Kp=2 och Kp=5 i samma steg (1 internt par); jämförelsen mot steg 2:s Kp=0.5 (GAM-003A.2: comparisonGroup \"pb-kp-escalation\") ger ytterligare ett gruppar." },
      { type: "scenario", checkpoint: true, simSteps: 50, configsInStep: 1 },
      { type: "scenario", checkpoint: true, simSteps: 30, configsInStep: 1, comparisonGroup: "pb-p-vs-pi" },
      { type: "scenario", checkpoint: true, simSteps: 30, configsInStep: 1, comparisonGroup: "pb-p-vs-pi", note: "Jämförs mot steg 5 (P) — GAM-003A.2: comparisonGroup \"pb-p-vs-pi\" ger ett gruppar över kontextgränsen." },
    ],
  },
  {
    id: "pi-pid.v1",
    title: "PI- och PID-reglering",
    steps: [
      { type: "scenario", checkpoint: true, simSteps: 90, configsInStep: 1, usesMeasurement: true, comparisonGroup: "pi-vs-pid" },
      { type: "scenario", checkpoint: true, simSteps: 90, configsInStep: 1, usesMeasurement: true, comparisonGroup: "pi-vs-pid", note: "Jämförs mot steg 1 (PI) — GAM-003A.2: comparisonGroup \"pi-vs-pid\" ger ett gruppar över kontextgränsen." },
      { type: "scenario", checkpoint: true, simSteps: 10, configsInStep: 0, comparisonGroup: "pi-vs-pid", note: "Ren reflektions-/jämförelsesteg, ingen ny körning — ingen effekt på XP." },
    ],
  },
  {
    id: "processbegransningar.v1",
    title: "Processens begränsningar",
    steps: [
      { type: "theory", checkpoint: true },
      { type: "scenario", checkpoint: false, simSteps: 80, configsInStep: 1, usesMeasurement: true, comparisonGroup: "procbeg-k-comparison", note: "Försök 1 i ett försök1/försök2-par (checkpoint på försök 2)." },
      { type: "scenario", checkpoint: true, simSteps: 80, configsInStep: 1, comparisonGroup: "procbeg-k-comparison", note: "Försök 2 — instruktionen anger inte exakt stegtal, uppskattat likt försök 1. GAM-003A.2 ger ett gruppar." },
      { type: "scenario", checkpoint: false, simSteps: 80, configsInStep: 1, usesMeasurement: true, comparisonGroup: "procbeg-deadtime-comparison" },
      { type: "scenario", checkpoint: true, simSteps: 80, configsInStep: 1, usesMeasurement: true, comparisonGroup: "procbeg-deadtime-comparison", note: "Försök 2, stegtal uppskattat likt föregående par. GAM-003A.2 ger ett gruppar." },
    ],
  },
  {
    id: "windup-antiwindup.v1",
    title: "Windup och anti-windup",
    steps: [
      { type: "theory", checkpoint: true },
      { type: "scenario", checkpoint: true, simSteps: 150, configsInStep: 1, comparisonGroup: "windup-antiwindup-comparison", note: "Windup UTAN anti-windup." },
      { type: "scenario", checkpoint: true, simSteps: 150, configsInStep: 1, comparisonGroup: "windup-antiwindup-comparison", note: "Anti-windup PÅ, separat lärstigssteg — GAM-003A.2: comparisonGroup ger ett gruppar mot steg 2 (tidigare felaktigt modellerat som ett internt par i samma steg, se GAM-003A.2-rapporten)." },
    ],
  },
  {
    id: "storningar-robusthet.v1",
    title: "Störningar och robusthet",
    note: "Steg 2-4 fortsätter samma körning (continueFromPreviousStep, FEAT-030) men är TRE separata GAM-002-kontexter (contextKey inkluderar stegindex). GAM-003A.2: comparisonGroup \"storningar-noise-comparison\" på alla tre stegen gör att P-brus→PI och PI→PID nu korrekt ger gruppjämförelsepar, utöver det redan befintliga P-nobrus→P-brus-paret inom steg 2.",
    steps: [
      { type: "theory", checkpoint: true },
      { type: "scenario", checkpoint: true, simSteps: 120, configsInStep: 2, comparisonGroup: "storningar-noise-comparison", note: "P utan/med brus — 1 internt par (oförändrat, inom samma kontext)." },
      { type: "scenario", checkpoint: true, simSteps: 60, configsInStep: 1, comparisonGroup: "storningar-noise-comparison", note: "PI, fortsätter samma graf, ny GAM-002-kontext — GAM-003A.2 ger nu ett gruppar mot steg 2:s P-brus." },
      { type: "scenario", checkpoint: true, simSteps: 60, configsInStep: 1, comparisonGroup: "storningar-noise-comparison", note: "PID, samma sak — GAM-003A.2 ger nu ett gruppar mot steg 3:s PI." },
      { type: "scenario", checkpoint: true, simSteps: 90, configsInStep: 1, usesPulse: true },
      { type: "scenario", checkpoint: true, simSteps: 210, configsInStep: 3, usesPulse: true, note: "P/PI/PID mot samma puls HELT inom ett steg (ingen stegväxling) — 2 interna par KORREKT detekterade av GAM-002." },
      { type: "scenario", checkpoint: true, simSteps: 180, configsInStep: 2, note: "Aggressiv/konservativ inom samma steg — 1 internt par korrekt detekterat." },
    ],
  },
  {
    id: "integrerande-process-niva.v1",
    title: "Integrerande process och nivåreglering",
    steps: [
      { type: "theory", checkpoint: true },
      { type: "scenario", checkpoint: true, simSteps: 200, configsInStep: 1, usesPulse: true },
    ],
  },
  {
    id: "stegsvar-identifiering.v1",
    title: "Stegsvar och processidentifiering",
    steps: [
      { type: "theory", checkpoint: true },
      { type: "scenario", checkpoint: false, simSteps: 60, configsInStep: 1 },
      { type: "scenario", checkpoint: false, simSteps: 120, configsInStep: 1 },
      { type: "scenario", checkpoint: false, simSteps: 5, configsInStep: 0, usesMeasurement: true, note: "Ren mätsteg mot redan körd data — inget nytt \"kör N steg\" i texten." },
      { type: "scenario", checkpoint: false, simSteps: 5, configsInStep: 0, usesMeasurement: true },
      { type: "scenario", checkpoint: false, simSteps: 5, configsInStep: 0, usesMeasurement: true },
      { type: "scenario", checkpoint: false, simSteps: 5, configsInStep: 0, usesMeasurement: true },
      { type: "scenario", checkpoint: true, simSteps: 210, configsInStep: 1, usesMeasurement: true },
    ],
  },
  {
    id: "lambda-metoden.v1",
    title: "Lambda-metoden för självreglerande system",
    steps: [
      { type: "theory", checkpoint: true },
      { type: "scenario", checkpoint: true, simSteps: 100, configsInStep: 1, note: "Processidentifiering — inte del av lambda-jämförelsen." },
      { type: "scenario", checkpoint: true, simSteps: 200, configsInStep: 1, comparisonGroup: "lambda-comparison" },
      { type: "scenario", checkpoint: true, simSteps: 200, configsInStep: 1, comparisonGroup: "lambda-comparison", note: "Jämförs mot steg 3 (moderat λ) — GAM-003A.2 ger ett gruppar." },
      { type: "scenario", checkpoint: true, simSteps: 200, configsInStep: 1, comparisonGroup: "lambda-comparison", note: "Jämförs mot steg 4 (aggressivt λ) — GAM-003A.2 ger ett gruppar. Totalt tre steg i gruppen ger två kedjade par, inte tre (C(3,2))." },
    ],
  },
];

export function totalActiveLearningPaths() {
  return LP_INVENTORY.length;
}
