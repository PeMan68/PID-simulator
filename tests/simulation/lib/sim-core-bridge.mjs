// Laddar apps/app/sim-core.js (CommonJS/UMD) i ett ESM-sammanhang.
// Detta ÄR appens faktiska simuleringskod — ingen omimplementation.
// Se apps/app/sim-core.js för bakgrund och packages/sim-core/ för den
// andra, obesläktade kärnan som apps/web/ (inte produktionsappen) använder.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SIM_CORE_PATH = path.resolve(__dirname, "..", "..", "..", "apps", "app", "sim-core.js");
export const CONTENT_DIR = path.resolve(__dirname, "..", "..", "..", "apps", "app", "content");

const simCore = require(SIM_CORE_PATH);

export const { Simulation, OnOffController, PIDController, ProcessModel, seededRandom, gaussian } = simCore;
