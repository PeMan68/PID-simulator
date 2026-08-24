#!/usr/bin/env node
// Kommandoradsverktyg för scenarioanalys. Se tests/simulation/README.md.
//
// Exempel:
//   node tests/simulation/cli.mjs --scenario p-step-self-regulating --steps 60
//   node tests/simulation/cli.mjs --scenario pi-step-self-regulating \
//     --kp 2 --ti 15 --steps 100 --spChangeStep 0 --newSp 60 --out result.json

import fs from "node:fs";
import { loadScenario, runAnalysis, formatSummary } from "./lib/analyze.mjs";
import { SIM_CORE_PATH } from "./lib/sim-core-bridge.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function printUsage() {
  console.log(`Användning:
  node tests/simulation/cli.mjs --scenario <id|sökväg> [flaggor]

Flaggor:
  --scenario <id|sökväg>   Scenario-id (content/scenarios/<id>.json) eller sökväg (krävs)
  --steps <n>              Antal steg att köra efter ev. SP-ändring (default: scenariots maxSteps eller 200)
  --spChangeStep <n>       Steg då SP ändras (valfritt)
  --newSp <v>               Nytt SP-värde vid spChangeStep (valfritt, krävs om spChangeStep anges)
  --kp/--ti/--td/--mode <v> Override av regulatorparametrar
  --seed <n>                Slumpfrö för brus (default 42)
  --tolerance <v>            Absolut toleransband i PV-enheter
  --tolerancePercent <v>     Toleransband som andel av stegstorleken (default 0.02)
  --settleHold <n>           Antal steg PV måste ligga kvar inom toleransen (default 10)
  --out <fil>                 Spara fullständigt resultat som JSON
  --json                       Skriv resultatet som JSON till stdout
  --quiet                      Skriv inte den mänskligt läsbara sammanfattningen
  --help                        Visa denna hjälptext

Källa för simuleringslogik: ${SIM_CORE_PATH}`);
}

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.scenario) {
  printUsage();
  process.exit(args.help ? 0 : 1);
}

let scenario, filePath;
try {
  ({ scenario, filePath } = loadScenario(args.scenario));
} catch (err) {
  console.error("Fel: " + err.message);
  process.exit(2);
}

const controllerOverrides = {};
for (const key of ["kp", "ti", "td", "mode"]) {
  if (args[key] !== undefined && args[key] !== true) {
    const n = Number(args[key]);
    controllerOverrides[key] = Number.isNaN(n) ? args[key] : n;
  }
}

let result;
try {
  result = runAnalysis({
    scenario,
    steps: Number(args.steps || scenario.runtime.maxSteps || 200),
    spChangeAtStep: args.spChangeStep !== undefined ? Number(args.spChangeStep) : null,
    newSp: args.newSp !== undefined ? Number(args.newSp) : null,
    controllerOverrides: Object.keys(controllerOverrides).length ? controllerOverrides : null,
    seed: args.seed !== undefined ? Number(args.seed) : 42,
    toleranceAbsolute: args.tolerance !== undefined ? Number(args.tolerance) : null,
    tolerancePercent: args.tolerancePercent !== undefined ? Number(args.tolerancePercent) : 0.02,
    settleHoldSteps: args.settleHold !== undefined ? Number(args.settleHold) : 10,
  });
} catch (err) {
  console.error("Fel vid simulering: " + err.message);
  process.exit(3);
}

if (args.out) {
  fs.writeFileSync(args.out, JSON.stringify(result, null, 2));
  console.error("Sparade resultat till " + args.out);
}
if (!args.quiet) {
  console.log(`Fil: ${filePath}\n`);
  console.log(formatSummary(result));
}
if (args.json) {
  console.log(JSON.stringify(result));
}
