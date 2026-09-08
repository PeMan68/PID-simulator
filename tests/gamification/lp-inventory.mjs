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
// uttryckligen ber användaren köra i just detta steg (inte totalt i
// lärstigen — jämförelser som spänner över flera lärstigssteg räknas INTE
// här, se DEL 7-analysen i rapporten för varför GAM-002 inte kan se dem).
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
      { type: "scenario", checkpoint: true, simSteps: 30, configsInStep: 1 },
      { type: "scenario", checkpoint: true, simSteps: 60, configsInStep: 2, note: "Kp=2 och Kp=5 i samma steg (1 internt par); jämförelsen mot steg 2:s Kp=0.5 korsar kontext och missas av GAM-002." },
      { type: "scenario", checkpoint: true, simSteps: 50, configsInStep: 1 },
      { type: "scenario", checkpoint: true, simSteps: 30, configsInStep: 1 },
      { type: "scenario", checkpoint: true, simSteps: 30, configsInStep: 1, note: "Jämförs mot steg 5 (P) — annan kontext, missas av GAM-002." },
    ],
  },
  {
    id: "pi-pid.v1",
    title: "PI- och PID-reglering",
    steps: [
      { type: "scenario", checkpoint: true, simSteps: 90, configsInStep: 1, usesMeasurement: true },
      { type: "scenario", checkpoint: true, simSteps: 90, configsInStep: 1, usesMeasurement: true, note: "Jämförs mot steg 1 (PI) — annan kontext, missas av GAM-002." },
      { type: "scenario", checkpoint: true, simSteps: 10, configsInStep: 0, note: "Ren reflektions-/jämförelsesteg, ingen ny körning." },
    ],
  },
  {
    id: "processbegransningar.v1",
    title: "Processens begränsningar",
    steps: [
      { type: "theory", checkpoint: true },
      { type: "scenario", checkpoint: false, simSteps: 80, configsInStep: 1, usesMeasurement: true, note: "Försök 1 i ett försök1/försök2-par (checkpoint på försök 2)." },
      { type: "scenario", checkpoint: true, simSteps: 80, configsInStep: 1, note: "Försök 2 — instruktionen anger inte exakt stegtal, uppskattat likt försök 1." },
      { type: "scenario", checkpoint: false, simSteps: 80, configsInStep: 1, usesMeasurement: true },
      { type: "scenario", checkpoint: true, simSteps: 80, configsInStep: 1, usesMeasurement: true, note: "Försök 2, stegtal uppskattat likt föregående par." },
    ],
  },
  {
    id: "windup-antiwindup.v1",
    title: "Windup och anti-windup",
    steps: [
      { type: "theory", checkpoint: true },
      { type: "scenario", checkpoint: true, simSteps: 150, configsInStep: 1 },
      { type: "scenario", checkpoint: true, simSteps: 150, configsInStep: 2, note: "Anti-windup av/på jämförs inom samma steg — 1 internt par." },
    ],
  },
  {
    id: "storningar-robusthet.v1",
    title: "Störningar och robusthet",
    note: "Steg 2-4 fortsätter samma körning (continueFromPreviousStep, FEAT-030) men är TRE separata GAM-002-kontexter (contextKey inkluderar stegindex) — jämförelsen P→PI→PID över dessa tre steg är därför osynlig för GAM-002 trots att grafen är sammanhängande. Se DEL 7.",
    steps: [
      { type: "theory", checkpoint: true },
      { type: "scenario", checkpoint: true, simSteps: 120, configsInStep: 2, note: "P utan/med brus — 1 internt par." },
      { type: "scenario", checkpoint: true, simSteps: 60, configsInStep: 1, note: "PI, fortsätter samma graf men NY GAM-002-kontext — paret mot steg 2 missas." },
      { type: "scenario", checkpoint: true, simSteps: 60, configsInStep: 1, note: "PID, samma sak — paret mot steg 3 missas." },
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
      { type: "scenario", checkpoint: true, simSteps: 100, configsInStep: 1 },
      { type: "scenario", checkpoint: true, simSteps: 200, configsInStep: 1 },
      { type: "scenario", checkpoint: true, simSteps: 200, configsInStep: 1, note: "Jämförs mot steg 3 — annan kontext, missas av GAM-002." },
      { type: "scenario", checkpoint: true, simSteps: 200, configsInStep: 1, note: "Jämförs mot steg 3-4 — annan kontext, missas av GAM-002." },
    ],
  },
];

export function totalActiveLearningPaths() {
  return LP_INVENTORY.length;
}
