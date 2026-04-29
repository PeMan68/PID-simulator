import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");

const htmlFiles = [
  "apps/web/index.html",
  "apps/web-standalone/index.html"
];

const uiTextFiles = [
  ...htmlFiles,
  "apps/web/main.js",
  "apps/web-standalone/app.js",
  "content/exercises/basic-learning-path.v1.json",
  "content/theory/pid-intro.v1.json",
  "content/scenarios/manual-open-loop.json",
  "content/scenarios/basic-step-self-regulating.json",
  "content/scenarios/onoff-hysteresis-basic.json",
  "content/scenarios/p-step-self-regulating.json",
  "content/scenarios/pi-step-self-regulating.json",
  "content/scenarios/pid-pulse-rejection.json",
  "content/scenarios/unstable-experimental.json"
];

const mojibakeRegex = /(Ã.|Â.|â..|ï¿½|\uFFFD)/g;
const degradedSpellings = [
  "Aterstall",
  "Kor 10 steg",
  "Lage",
  "Larstig",
  "Nasta steg",
  "larstig",
  "borja",
  "Valj",
  "fortsatt",
  "Mal:",
  "Forsta",
  "Jamfor",
  "Oppen slinga",
  "Grundide",
  "Bla:",
  "Rod streckad",
  "Gron:",
  "stationart",
  "storningsavstotning",
  "avstotning",
  "Grundlaggande",
  "sjalvreglerande",
  "grundovning",
  "tvanivareglering"
];

let failed = 0;

for (const relPath of htmlFiles) {
  const fullPath = path.join(root, relPath);
  const content = fs.readFileSync(fullPath, "utf8");

  if (!content.includes('<meta charset="utf-8">')) {
    failed += 1;
    console.error(`FAIL ${relPath}: missing <meta charset="utf-8">`);
  } else {
    console.log(`OK ${relPath} has utf-8 meta charset`);
  }
}

for (const relPath of uiTextFiles) {
  const fullPath = path.join(root, relPath);

  if (!fs.existsSync(fullPath)) {
    failed += 1;
    console.error(`FAIL missing file: ${relPath}`);
    continue;
  }

  const content = fs.readFileSync(fullPath, "utf8");
  const lines = content.split(/\r?\n/);
  let foundInFile = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const mojibakeMatches = line.match(mojibakeRegex);
    if (mojibakeMatches) {
      foundInFile += mojibakeMatches.length;
      failed += mojibakeMatches.length;
      console.error(`FAIL ${relPath}:${i + 1} contains mojibake: ${mojibakeMatches.join("")}`);
    }

    for (const degraded of degradedSpellings) {
      if (!line.includes(degraded)) continue;
      foundInFile += 1;
      failed += 1;
      console.error(`FAIL ${relPath}:${i + 1} contains degraded UI text: ${degraded}`);
    }
  }

  if (foundInFile === 0) {
    console.log(`OK ${relPath}`);
  }
}

if (failed > 0) {
  console.error(`\nUI UTF-8/Unicode verification failed with ${failed} issue(s).`);
  process.exitCode = 1;
} else {
  console.log("\nUI UTF-8/Unicode verification passed.");
}
