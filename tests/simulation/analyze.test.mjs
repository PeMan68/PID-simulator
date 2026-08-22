// Automatiska tester för det återanvändbara analysverktyget
// (tests/simulation/lib/analyze.mjs). Körs: node tests/simulation/analyze.test.mjs
//
// Enkel egen testrunner utan beroenden, i linje med stilen i
// tests/reference/*.mjs.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadScenario, runAnalysis } from "./lib/analyze.mjs";

let failed = 0;
let passed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`OK   ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name}${detail ? " — " + detail : ""}`);
  }
}

// 1. Kan läsa ett giltigt scenario.
{
  const { scenario, filePath } = loadScenario("p-step-self-regulating");
  check("1. Läser giltigt scenario via id", scenario && scenario.id === "p-step-self-regulating" && fs.existsSync(filePath));
}

// 2. Avvisar/rapporterar ett scenarioreferensfel.
{
  let threw = false;
  let message = "";
  try {
    loadScenario("scenario-som-inte-finns-xyz");
  } catch (err) {
    threw = true;
    message = err.message;
  }
  check("2. Avvisar okänt scenario-id med tydligt fel", threw && message.includes("scenario-som-inte-finns-xyz"));
}

// 3. Reproducerbart resultat vid samma indata.
{
  const { scenario } = loadScenario("pid-disturbance-noise"); // har brus, seed spelar roll
  const a = runAnalysis({ scenario, steps: 60, seed: 7 });
  const b = runAnalysis({ scenario, steps: 60, seed: 7 });
  check(
    "3. Samma seed ger identiskt resultat",
    JSON.stringify(a.history.y) === JSON.stringify(b.history.y) && a.finalPV === b.finalPV
  );
}

// 4. Identifierar kvarstående reglerfel i ett P-scenario.
{
  const { scenario } = loadScenario("p-step-self-regulating");
  const r = runAnalysis({ scenario, steps: 150 });
  check(
    "4. P-scenario ger kvarstående reglerfel > 1 och når inte SP-tolerans",
    Math.abs(r.steadyStateError) > 1 && r.reachedSpStep == null,
    `steadyStateError=${r.steadyStateError}`
  );
}

// 5. Identifierar att PI når eller ligger nära SP.
{
  const { scenario } = loadScenario("pi-step-self-regulating");
  const r = runAnalysis({ scenario, steps: 150 });
  check(
    "5. PI-scenario når SP-tolerans och har litet stationärt fel",
    r.reachedSpStep != null && Math.abs(r.steadyStateError) < 2,
    `reachedSpStep=${r.reachedSpStep} steadyStateError=${r.steadyStateError}`
  );
}

// 6. Beräknar översläng korrekt för ett känt förlopp.
{
  const { scenario } = loadScenario("pi-windup-demo"); // känt kraftigt översläng-scenario
  const r = runAnalysis({ scenario, steps: 150 });
  check(
    "6. Windup-scenariot ger ett tydligt, rimligt uppmätt översläng (5-40%)",
    r.overshootPct != null && r.overshootPct > 5 && r.overshootPct < 40,
    `overshootPct=${r.overshootPct}`
  );
}

// 7. Identifierar utsignalsmättning.
{
  const { scenario } = loadScenario("pi-windup-demo");
  const r = runAnalysis({ scenario, steps: 150 });
  check("7. Identifierar utsignalsmättning i windup-scenariot", r.saturationOccurred && r.saturatedSteps > 0, `saturatedSteps=${r.saturatedSteps}`);

  const { scenario: noSat } = loadScenario("pi-step-self-regulating");
  const r2 = runAnalysis({ scenario: noSat, steps: 150 });
  check("7b. Rapporterar ingen mättning där ingen sker (måttlig PI)", r2.saturatedSteps === 0 || r2.maxU < 99.9);
}

// 8. Kan beräkna en rimlig insvängningstid.
{
  const { scenario } = loadScenario("pi-step-self-regulating");
  const r = runAnalysis({ scenario, steps: 150 });
  check(
    "8. Insvängningstid definierad och inom rimligt intervall (10-120 steg)",
    r.settledStep != null && r.settledStep > 10 && r.settledStep < 120,
    `settledStep=${r.settledStep}`
  );
}

// 9. Skiljer mellan stabilisering och uppnått SP.
{
  const { scenario } = loadScenario("p-step-self-regulating");
  const r = runAnalysis({ scenario, steps: 150 });
  check(
    "9. P-scenario: stabiliserad (settledStep satt) men har INTE nått SP (reachedSpStep null)",
    r.settledStep != null && r.reachedSpStep == null,
    `settledStep=${r.settledStep} reachedSpStep=${r.reachedSpStep}`
  );
}

// 10. Kan spara ett maskinläsbart resultat.
{
  const { scenario } = loadScenario("p-step-self-regulating");
  const r = runAnalysis({ scenario, steps: 60 });
  const tmpFile = path.join(os.tmpdir(), "ped003b-test-result.json");
  fs.writeFileSync(tmpFile, JSON.stringify(r, null, 2));
  const reread = JSON.parse(fs.readFileSync(tmpFile, "utf8"));
  check("10. Resultat kan sparas och läsas tillbaka som giltig JSON", reread.scenarioId === "p-step-self-regulating" && reread.finalPV === r.finalPV);
  fs.unlinkSync(tmpFile);
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exitCode = 1;
