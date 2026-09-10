// PED-005 — Automatiserad kontroll av beslutsunderlaget
// PED-005_JAMFORELSEGRANSKNING.json mot den faktiska innehållskodbasen.
//
// Kontrollerar (DEL 18 i uppdraget):
//  - Alla comparisonGroup i rapporten finns i den faktiska lärstigsfilen,
//    med samma antal medlemssteg.
//  - Alla scenarioIds i rapporten motsvarar filer som faktiskt finns.
//  - currentPairs stämmer med formeln (antal medlemssteg - 1), vilket är
//    hur GAM-002:s sekventiella kedjemodell (recordGroupComparison) bildar
//    par — se activity-prototype-core.js.
//  - Ingen lärstigsfil, appkod eller aktivitetsmodell har ändrats
//    (git diff mot develop är tomt för dessa sökvägar).
//
// Körs manuellt: node tests/gamification/ped-005-audit.mjs

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execSync } from "node:child_process";
import { LP_INVENTORY } from "./lp-inventory.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const CONTENT_DIR = path.join(ROOT, "apps", "app", "content");
const REPORT_JSON = path.join(ROOT, "docs", "reports", "PED-005_JAMFORELSEGRANSKNING.json");

let failures = 0;
function check(label, cond, detail) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.log(`  ✗ ${label}${detail ? " — " + detail : ""}`);
  }
}

const report = JSON.parse(readFileSync(REPORT_JSON, "utf8"));

// Bygg upp faktiska comparisonGroup → medlemssteg (1-baserat index) per lärstig.
const learningPathFiles = {};
for (const c of report.comparisons) {
  if (!learningPathFiles[c.learningPathId]) {
    const file = path.join(CONTENT_DIR, "exercises", `${c.learningPathId}.json`);
    learningPathFiles[c.learningPathId] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  }
}

console.log("PED-005 — kontroll av beslutsunderlaget mot kodbasen\n");

console.log("Lärstigsfiler:");
for (const [id, data] of Object.entries(learningPathFiles)) {
  check(`${id}.json existerar och är giltig JSON`, !!data);
}

console.log("\nPer jämförelse i rapporten:");
for (const c of report.comparisons) {
  const data = learningPathFiles[c.learningPathId];
  if (!data) continue;

  if (c.comparisonGroup) {
    const actualMembers = data.steps
      .map((s, i) => (s.comparisonGroup === c.comparisonGroup ? i + 1 : null))
      .filter((x) => x !== null);
    check(
      `${c.learningPathId} / ${c.comparisonGroup}: medlemssteg matchar (${JSON.stringify(c.stepIndexes)})`,
      JSON.stringify(actualMembers) === JSON.stringify(c.stepIndexes),
      `faktiskt: ${JSON.stringify(actualMembers)}`
    );
    // Totalt antal FÖRSÖK i gruppen (inte antal steg) — ett steg med flera
    // konfigurationer (configsInStep, se lp-inventory.mjs) bildar flera
    // försök. Kedjemodellen (recordGroupComparison) jämför varje nytt
    // försök mot det senast registrerade — oavsett om det ligger inom
    // samma eller ett annat lärstigssteg — så totalt antal jämförelsepar
    // (inom-kontext + grupp) är alltid (totalt antal försök i gruppen - 1).
    const lp = LP_INVENTORY.find((x) => x.id === c.learningPathId);
    const totalAttempts = actualMembers.reduce((sum, i1) => {
      const step = data.steps[i1 - 1];
      if (step.type !== "scenario") return sum;
      const lpStep = lp && lp.steps[i1 - 1];
      const configs = lpStep && typeof lpStep.configsInStep === "number" ? lpStep.configsInStep : 1;
      return sum + (configs === 0 ? 0 : Math.max(1, configs));
    }, 0);
    const expectedPairs = Math.max(0, totalAttempts - 1);
    check(
      `${c.learningPathId} / ${c.comparisonGroup}: currentPairs (${c.currentPairs}) matchar kedjeformeln (försök-1=${expectedPairs}, försök=${totalAttempts})`,
      c.currentPairs === expectedPairs,
      `formel: ${expectedPairs}`
    );
  } else {
    // Steg utan comparisonGroup ska inte förekomma taggade i filen för dessa index.
    for (const idx of c.stepIndexes) {
      const step = data.steps[idx - 1];
      check(
        `${c.learningPathId} steg ${idx}: saknar comparisonGroup (rapporten anger null)`,
        !step || !step.comparisonGroup
      );
    }
  }

  for (const scenarioId of c.scenarioIds) {
    const scenarioFile = path.join(CONTENT_DIR, "scenarios", scenarioId);
    check(`Scenariofil finns: ${scenarioId}`, existsSync(scenarioFile));
  }
}

console.log("\nGit-kontroll — inga förbjudna sökvägar ändrade mot develop:");
try {
  const diff = execSync("git diff --name-only develop...HEAD", { cwd: ROOT, encoding: "utf8" });
  const changed = diff.split("\n").filter(Boolean);
  const forbidden = changed.filter(
    (f) =>
      f.startsWith("apps/app/content/exercises/") ||
      f === "apps/app/app.js" ||
      f === "apps/app/activity-prototype-core.js"
  );
  check("Inga lärstigsfiler eller appkod ändrade i grenen", forbidden.length === 0, JSON.stringify(forbidden));
} catch (e) {
  console.log(`  (kunde inte köra git diff: ${e.message})`);
}

console.log(`\n${failures === 0 ? "✓ Alla kontroller godkända." : `${failures} kontroll(er) misslyckades.`}`);
process.exit(failures === 0 ? 0 : 1);
