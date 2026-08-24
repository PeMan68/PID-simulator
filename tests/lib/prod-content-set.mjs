// HOTFIX-v1.3.1 — Härledd allowlist för PROD-artifaktens innehållsfiler.
//
// Delas mellan tests/build-preview.mjs (vad som ska KOPIERAS till dist/prod)
// och tests/validate-prod.mjs (vad som FÅR finnas i en redan byggd
// dist/prod). Samma härledning på båda ställena — ingen duplicerad
// beroendelista att glömma synka.
//
// Principen (se docs/development/ENVIRONMENTS.md):
//   - Lärstigar: exakt catalog.prod.json:s learning_paths[].
//   - Teori/scenario-beroenden: härleds genom att faktiskt läsa varje
//     publicerad lärstigs steps[] och slå upp referenserna — INTE en
//     hårdkodad lista, och INTE hela catalog.prod.json:s theory[]/
//     scenarios[] rakt av (en post som ligger kvar i katalogen men inte
//     längre refereras av något publicerat lärsteg ska inte kopieras).
//   - Fristående scenarier (standalone !== false) tas alltid med, även om
//     ingen lärstig råkar referera dem.
//   - Ett lärsteg som refererar något som saknas i catalog.prod.json är ett
//     fel i produktionsurvalet — funktionen kastar med ett tydligt
//     felmeddelande istället för att tyst hoppa över det.

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

/**
 * @param {string} contentDir  Sökväg till en content/-katalog (källträdet
 *   eller en redan byggd dist/prod/content/) som innehåller catalog.prod.json.
 * @returns {{
 *   catalogFile: string,
 *   helpFile: string,
 *   learningPathFiles: string[],
 *   theoryFiles: string[],
 *   scenarioFiles: string[],
 *   standaloneScenarioFiles: string[],
 * }}
 */
export function deriveProdContentSet(contentDir) {
  const catalogPath = path.join(contentDir, "catalog.prod.json");
  if (!existsSync(catalogPath)) {
    throw new Error(`catalog.prod.json saknas i ${contentDir} — kan inte härleda PROD-innehåll.`);
  }
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

  const catalogScenarioFiles = new Map(catalog.scenarios.map(s => [s.file, s]));
  const catalogTheoryFiles = new Set(catalog.theory.map(t => t.file));

  const learningPathFiles = [];
  const theoryFiles = new Set();
  const scenarioFiles = new Set();

  for (const entry of catalog.learning_paths) {
    learningPathFiles.push(entry.file);
    const full = path.join(contentDir, entry.file);
    if (!existsSync(full)) {
      throw new Error(`Lärstig "${entry.id}": filen ${entry.file} finns inte i ${contentDir}.`);
    }
    const data = JSON.parse(readFileSync(full, "utf8"));
    for (const step of data.steps || []) {
      if (step.type === "theory") {
        const rel = "theory/" + step.ref;
        if (!catalogTheoryFiles.has(rel)) {
          throw new Error(
            `Lärstig "${entry.id}" refererar teori "${step.ref}" som inte finns i ` +
            `catalog.prod.json:s theory[] — trasigt produktionsberoende.`
          );
        }
        theoryFiles.add(rel);
      } else if (step.type === "scenario") {
        const rel = "scenarios/" + step.ref;
        if (!catalogScenarioFiles.has(rel)) {
          throw new Error(
            `Lärstig "${entry.id}" refererar scenario "${step.ref}" som inte finns i ` +
            `catalog.prod.json:s scenarios[] — trasigt produktionsberoende.`
          );
        }
        scenarioFiles.add(rel);
      }
    }
  }

  const standaloneScenarioFiles = [];
  for (const entry of catalog.scenarios) {
    if (entry.standalone !== false) {
      standaloneScenarioFiles.push(entry.file);
      scenarioFiles.add(entry.file); // union: fristående scenarier tas med även utan lärstigsreferens
    }
  }

  return {
    catalogFile: "catalog.prod.json",
    helpFile: catalog.help,
    learningPathFiles: learningPathFiles.sort(),
    theoryFiles: [...theoryFiles].sort(),
    scenarioFiles: [...scenarioFiles].sort(),
    standaloneScenarioFiles: standaloneScenarioFiles.sort(),
  };
}
