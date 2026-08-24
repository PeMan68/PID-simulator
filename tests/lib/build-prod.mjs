// HOTFIX-v1.3.1 — Testbar kärna för PROD-byggningen. Separerad från
// tests/build-preview.mjs (den tunna CLI:n) så att tests/build-preview.test.mjs
// kan bygga mot syntetiska content-träd utan att röra apps/app/.

import { existsSync, rmSync, cpSync, copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { deriveProdContentSet } from "./prod-content-set.mjs";

function copyInto(relFile, srcContentDir, destContentDir) {
  const src = path.join(srcContentDir, relFile);
  if (!existsSync(src)) {
    throw new Error(`PROD-byggning: ${relFile} finns i catalog.prod.json men filen saknas på disk (${src}).`);
  }
  const dest = path.join(destContentDir, relFile);
  mkdirSync(path.dirname(dest), { recursive: true });
  copyFileSync(src, dest);
}

/**
 * Bygger en filtrerad PROD-artifakt i outDir, utgående från appSrcDir
 * (normalt apps/app/, men i tester ett syntetiskt content-träd).
 *
 * @param {string} outDir      Destinationskatalog. Rensas helt innan byggning.
 * @param {string} appSrcDir   Källkatalog (motsvarar apps/app/).
 * @returns {{ set: ReturnType<typeof deriveProdContentSet> }}
 */
export function buildProd(outDir, appSrcDir) {
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });

  const srcContentDir = path.join(appSrcDir, "content");
  const destContentDir = path.join(outDir, "content");
  mkdirSync(destContentDir, { recursive: true });

  for (const f of ["index.html", "app.js", "sim-core.js", "README.md"]) {
    const src = path.join(appSrcDir, f);
    if (existsSync(src)) copyFileSync(src, path.join(outDir, f));
  }

  const prodEnvSrc = path.join(appSrcDir, "env.prod.js");
  if (!existsSync(prodEnvSrc)) {
    throw new Error("env.prod.js saknas — kan inte bygga PROD.");
  }
  copyFileSync(prodEnvSrc, path.join(outDir, "env.js"));

  const set = deriveProdContentSet(srcContentDir);

  copyInto("catalog.prod.json", srcContentDir, destContentDir);
  copyInto(set.helpFile, srcContentDir, destContentDir);
  for (const f of set.learningPathFiles) copyInto(f, srcContentDir, destContentDir);
  for (const f of set.theoryFiles) copyInto(f, srcContentDir, destContentDir);
  for (const f of set.scenarioFiles) copyInto(f, srcContentDir, destContentDir);

  return { set };
}
