// HOTFIX-v1.3.1 — Automatiska tester för PROD-artifaktens filtrering
// (tests/lib/prod-content-set.mjs + tests/lib/build-prod.mjs).
//
// Bygger syntetiska content-träd i os.tmpdir() för varje test — rör ALDRIG
// apps/app/content/. Egen enkel testrunner, i linje med
// tests/simulation/analyze.test.mjs.
//
// Körs: node tests/build-preview.test.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { deriveProdContentSet } from "./lib/prod-content-set.mjs";
import { buildProd } from "./lib/build-prod.mjs";

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

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pid-sim-prod-fixture-"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Bygger ett minimalt, men fullständigt, syntetiskt apps/app-liknande träd:
// en publicerad lärstig (med teori- och scenarioreferens), en dold DEV-
// lärstig som INTE ligger i catalog.prod.json, ett dolt/oanvänt scenario,
// och ett beroendescenario markerat standalone:false.
function buildFixture({ extraCatalogScenarios = [], extraCatalogLearningPaths = [], omitScenarioFile = false } = {}) {
  const root = mkTmp();
  const contentDir = path.join(root, "content");

  writeJson(path.join(contentDir, "help.json"), { entries: {} });

  writeJson(path.join(contentDir, "theory", "teori-a.json"), { id: "teori-a", title: "Teori A" });
  writeJson(path.join(contentDir, "theory", "teori-endast-dold.json"), { id: "teori-dold", title: "Endast dold lärstig" });

  writeJson(path.join(contentDir, "scenarios", "scenario-standalone.json"), { id: "scenario-standalone", title: "Fristående" });
  if (!omitScenarioFile) {
    writeJson(path.join(contentDir, "scenarios", "scenario-beroende.json"), { id: "scenario-beroende", title: "Beroende, ej fristående" });
  }
  writeJson(path.join(contentDir, "scenarios", "scenario-dold.json"), { id: "scenario-dold", title: "Oanvänt/dolt" });

  writeJson(path.join(contentDir, "exercises", "publicerad.v1.json"), {
    id: "publicerad.v1",
    title: "Publicerad lärstig",
    steps: [
      { type: "theory", ref: "teori-a.json", title: "Teori" },
      {
        type: "scenario", ref: "scenario-beroende.json", title: "Beroendesteg",
        checkpoint: { question: "?", options: ["a", "b"], correct: 0, explanation: "" },
      },
    ],
  });

  writeJson(path.join(contentDir, "exercises", "dold.v1.json"), {
    id: "dold.v1",
    title: "Dold DEV-lärstig",
    steps: [
      { type: "theory", ref: "teori-endast-dold.json", title: "Teori (dold)" },
      {
        type: "scenario", ref: "scenario-dold.json", title: "Dolt steg",
        checkpoint: { question: "Hemligt facit?", options: ["rätt", "fel"], correct: 0, explanation: "hemlig förklaring" },
      },
    ],
  });

  const catalog = {
    version: "test",
    help: "help.json",
    scenarios: [
      { id: "scenario-standalone", file: "scenarios/scenario-standalone.json", standalone: true },
      { id: "scenario-beroende", file: "scenarios/scenario-beroende.json", standalone: false },
      ...extraCatalogScenarios,
    ],
    theory: [
      { id: "teori-a", file: "theory/teori-a.json" },
    ],
    learning_paths: [
      { id: "publicerad.v1", file: "exercises/publicerad.v1.json" },
      ...extraCatalogLearningPaths,
    ],
  };
  writeJson(path.join(contentDir, "catalog.prod.json"), catalog);

  fs.writeFileSync(
    path.join(root, "env.prod.js"),
    `(function (g) { g.ENV_CONFIG = { environment: "production", showTestMode: false, showScore: false, showExperimentalContent: false, catalogFile: "catalog.prod.json" }; })(typeof window !== "undefined" ? window : globalThis);\n`
  );
  fs.writeFileSync(path.join(root, "index.html"), "<!doctype html><html></html>");
  fs.writeFileSync(path.join(root, "app.js"), "// fixture\n");
  fs.writeFileSync(path.join(root, "sim-core.js"), "// fixture\n");

  return root;
}

// ── 1. En ny DEV-lärstig i källträdet men inte i catalog.prod.json ska inte kopieras ──
{
  const root = buildFixture();
  const outDir = path.join(mkTmp(), "dist-prod");
  const { set } = buildProd(outDir, root);
  check(
    "1. Dold DEV-lärstig (inte i catalog.prod.json) kopieras inte",
    !set.learningPathFiles.includes("exercises/dold.v1.json")
    && !fs.existsSync(path.join(outDir, "content", "exercises", "dold.v1.json"))
  );
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 2. Ett publicerat lärsteg refererar ett scenario som saknas på disk → tydligt fel ──
{
  const root = buildFixture({ omitScenarioFile: true });
  const outDir = path.join(mkTmp(), "dist-prod");
  let threw = false, message = "";
  try {
    buildProd(outDir, root);
  } catch (err) {
    threw = true; message = err.message;
  }
  check("2. Saknat scenarioberoende ger tydligt fel, inte tyst avhopp", threw, message);
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 2b. Ett publicerat lärsteg refererar ett scenario som FINNS → kopieras ──
{
  const root = buildFixture();
  const outDir = path.join(mkTmp(), "dist-prod");
  const { set } = buildProd(outDir, root);
  check(
    "2b. Existerande scenarioberoende kopieras",
    set.scenarioFiles.includes("scenarios/scenario-beroende.json")
    && fs.existsSync(path.join(outDir, "content", "scenarios", "scenario-beroende.json"))
  );
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 3. Ett dolt/oanvänt scenario i källträdet (varken standalone eller refererat) kopieras inte ──
{
  const root = buildFixture();
  const outDir = path.join(mkTmp(), "dist-prod");
  buildProd(outDir, root);
  check(
    "3. Oanvänt/dolt scenario kopieras inte",
    !fs.existsSync(path.join(outDir, "content", "scenarios", "scenario-dold.json"))
  );
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 4. Ett beroendescenario med standalone:false kopieras men listas inte som fristående ──
{
  const root = buildFixture();
  const outDir = path.join(mkTmp(), "dist-prod");
  const { set } = buildProd(outDir, root);
  check(
    "4. standalone:false-scenario kopieras men är inte fristående",
    set.scenarioFiles.includes("scenarios/scenario-beroende.json")
    && !set.standaloneScenarioFiles.includes("scenarios/scenario-beroende.json")
  );
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 5. En dold lärstig med checkpoints — hela lärstigsfilen (inkl. facit) kopieras inte ──
{
  const root = buildFixture();
  const outDir = path.join(mkTmp(), "dist-prod");
  buildProd(outDir, root);
  const dolPath = path.join(outDir, "content", "exercises", "dold.v1.json");
  check(
    "5. Dold lärstig med checkpoint-facit finns inte i artifakten",
    !fs.existsSync(dolPath)
  );
  // Och dess facit-sträng finns inte NÅGONSTANS i den byggda artifakten.
  const allText = fs.readdirSync(outDir, { recursive: true })
    .filter(f => fs.statSync(path.join(outDir, f)).isFile())
    .map(f => fs.readFileSync(path.join(outDir, f), "utf8"))
    .join("\n");
  check("5b. Facit-strängen \"hemlig förklaring\" finns inte i artifakten", !allText.includes("hemlig förklaring"));
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 6. Gammal fil i dist/prod från tidigare byggning rensas bort ──
{
  const root = buildFixture();
  const outDir = path.join(mkTmp(), "dist-prod");
  fs.mkdirSync(outDir, { recursive: true });
  const staleFile = path.join(outDir, "gammal-fil-fran-tidigare-byggning.json");
  fs.writeFileSync(staleFile, "{}");
  check("6a. (fixture) gammal fil finns innan byggning", fs.existsSync(staleFile));
  buildProd(outDir, root);
  check("6b. Ny PROD-byggning rensar bort gamla filer", !fs.existsSync(staleFile));
  fs.rmSync(root, { recursive: true, force: true });
}

// ── 7. deriveProdContentSet: lärstig som refererar teori utanför catalog.prod.json ger tydligt fel ──
{
  const root = buildFixture();
  // Lägg till ett steg som refererar en teorifil som INTE finns i catalog.prod.json:s theory[].
  const p = path.join(root, "content", "exercises", "publicerad.v1.json");
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  data.steps.push({ type: "theory", ref: "teori-utanfor-katalogen.json", title: "Trasig referens" });
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  let threw = false;
  try {
    deriveProdContentSet(path.join(root, "content"));
  } catch (err) {
    threw = true;
  }
  check("7. Teorireferens utanför catalog.prod.json ger tydligt fel", threw);
  fs.rmSync(root, { recursive: true, force: true });
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
