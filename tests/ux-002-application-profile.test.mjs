// UX-002 (UX-001 Fas 0) — Tillämpnings-/processmodellsväljare.
//
// Ren statisk källkodskontroll (ingen webbläsare/DOM tillgänglig här, samma
// begränsning och samma mönster som tests/hotfix-v1.4.1-facit-env.test.mjs).
// Verifierar: att APPLICATION_PROFILES-tabellen i app.js har exakt den
// struktur UX-001 avsnitt 1.1 specificerar (extraherad och körd isolerat,
// inte bara regex-matchad rad för rad), att index.html har de nya
// kontrollerna/attributen applyApplicationProfile() förutsätter, och att
// Processmodell-väljaren ALDRIG döljs helt (bara dess alternativ filtreras —
// PO:s uttryckliga pedagogiska krav).
//
// Körs: node tests/ux-002-application-profile.test.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(__dirname, "..", "apps", "app");

let failed = 0;
let passed = 0;
function check(name, condition, detail) {
  if (condition) { passed++; console.log(`OK   ${name}`); }
  else { failed++; console.error(`FAIL ${name}${detail ? " — " + detail : ""}`); }
}

const html = readFileSync(path.join(APP_DIR, "index.html"), "utf8");
const appJs = readFileSync(path.join(APP_DIR, "app.js"), "utf8");

// ── 1. index.html: Tillämpning-väljaren finns med rätt alternativ ──
{
  check("1a. #applicationProfile-select finns", html.includes('id="applicationProfile"'));
  check("1b. Alternativ: Fri utforskning", /<option value="fri">Fri utforskning<\/option>/.test(html));
  check("1c. Alternativ: Tvålägesreglering (On\\/Off)", /<option value="onoff">Tvålägesreglering \(On\/Off\)<\/option>/.test(html));
  check("1d. Alternativ: Temperaturprocess", /<option value="temperatur">Temperaturprocess<\/option>/.test(html));
  check("1e. Alternativ: Nivåprocess", /<option value="niva">Nivåprocess<\/option>/.test(html));
  // Granskningsobservation 1 (PO): Tillämpning ska INTE vara en egen
  // parametergrupp — flyttad in i Process-gruppen, direkt före Processmodell.
  check("1f. Ingen egen \"groupTillampning\"-parametergrupp längre", !html.includes('id="groupTillampning"'));
  check("1g. Tillämpning-fältet ligger i Process-gruppen, DIREKT FÖRE Processmodell", /id="groupProcess">[\s\S]{0,600}<label for="applicationProfile"[\s\S]{0,650}<label for="processType"/.test(html));
}

// ── 2. index.html: Processmodell-väljaren är omdöpt, ALDRIG helt dold ──
{
  check("2a. Etiketten \"Processmodell\" används (inte längre \"Processtyp\")", html.includes(">Processmodell <"));
  check("2b. Gamla etiketten \"Processtyp\" finns inte kvar i UI-fältet", !html.includes('for="processType">Processtyp'));
  check("2c. #processType-selecten finns fortfarande oförändrad (samma id, appen refererar den överallt)", html.includes('<select id="processType">'));
  check(
    "2d. processType-fältet självt har INGET data-addon/hidden-attribut på sig — bara dess <option>er filtreras av JS, väljaren visas alltid",
    !/id="processType"[^>]*(hidden|data-addon)/.test(html)
  );
  check("2e. Namnen enkapacitiv/flerkapacitiv används (UX-001 avsnitt 1.2)", html.includes("Självreglerande (enkapacitiv)") && html.includes("Självreglerande (flerkapacitiv)"));
}

// ── 3. index.html: data-addon på Framkoppling/Parameterstyrning/Ventilkarakteristik ──
{
  check("3a. auxGain-fältet har data-addon=\"framkoppling\"", /<div class="field" data-addon="framkoppling">\s*<label for="auxGain"/.test(html));
  check("3b. kff-fältet har data-addon=\"framkoppling\"", /<div class="field" data-addon="framkoppling">\s*<label for="kff"/.test(html));
  check("3c. auxMag-fältet har data-addon=\"framkoppling\"", /<div class="field" data-addon="framkoppling">\s*<label for="auxMag"/.test(html));
  check("3d. \"Trigga last\"-knappens fält har data-addon=\"framkoppling\"", /data-addon="framkoppling">\s*<button id="triggerAux">/.test(html));
  check("3e. #gainScheduleField har data-addon=\"parameterstyrning\"", /id="gainScheduleField" data-addon="parameterstyrning"/.test(html));
  check("3f. #gainScheduleFields har data-addon=\"parameterstyrning\"", /id="gainScheduleFields" data-addon="parameterstyrning"/.test(html));
  check("3g. #nonlinearGainField har data-addon=\"ventilkarakteristik\"", /id="nonlinearGainField" data-addon="ventilkarakteristik"/.test(html));
  check("3h. #nonlinearGainFields har data-addon=\"ventilkarakteristik\"", /id="nonlinearGainFields" data-addon="ventilkarakteristik"/.test(html));
}

// ── 4. index.html: CSS-regeln som garanterar addon-döljning vinner över lägesbaserad style.display ──
{
  check("4a. [data-addon].addon-hidden { display: none !important; } finns", /\[data-addon\]\.addon-hidden\s*\{\s*display:\s*none\s*!important;\s*\}/.test(html));
}

// ── 5. app.js: APPLICATION_PROFILES-tabellen har exakt UX-001 avsnitt 1.1s struktur ──
{
  const match = appJs.match(/const APPLICATION_PROFILES = (\{[\s\S]*?\n\};)/);
  check("5a. APPLICATION_PROFILES hittades i app.js", !!match);
  if (match) {
    // Egen, isolerad utvärdering av objektlitteralen (inga DOM-anrop i denna
    // textsnutt) — robustare än att regexmatcha varje fält för sig.
    const objLiteral = match[1].replace(/;\s*$/, "");
    let profiles;
    try {
      profiles = new Function("return " + objLiteral)();
    } catch (err) {
      check("5b. APPLICATION_PROFILES kunde tolkas som ett objekt", false, err.message);
      profiles = null;
    }
    if (profiles) {
      check("5b. Exakt fyra profiler (fri/onoff/temperatur/niva)", Object.keys(profiles).sort().join(",") === "fri,niva,onoff,temperatur");
      check("5c. fri tillåter alla tre processmodeller", JSON.stringify(profiles.fri.processModels.sort()) === JSON.stringify(["integrating", "self_regulating", "self_regulating_2"].sort()));
      check("5d. fri visar alla tre tillägg", JSON.stringify(profiles.fri.addons.sort()) === JSON.stringify(["framkoppling", "parameterstyrning", "ventilkarakteristik"].sort()));
      check("5e. onoff tillåter bara de två självreglerande modellerna, inga tillägg", JSON.stringify(profiles.onoff.processModels.sort()) === JSON.stringify(["self_regulating", "self_regulating_2"].sort()) && profiles.onoff.addons.length === 0);
      check("5f. temperatur tillåter de två självreglerande modellerna och alla tre tillägg", JSON.stringify(profiles.temperatur.processModels.sort()) === JSON.stringify(["self_regulating", "self_regulating_2"].sort()) && JSON.stringify(profiles.temperatur.addons.sort()) === JSON.stringify(["framkoppling", "parameterstyrning", "ventilkarakteristik"].sort()));
      check("5g. niva tillåter ENDAST integrating, inga tillägg", JSON.stringify(profiles.niva.processModels) === JSON.stringify(["integrating"]) && profiles.niva.addons.length === 0);
    }
  }
}

// ── 6. app.js: applyApplicationProfile() finns, döljer aldrig väljaren, är kopplad ──
{
  check("6a. applyApplicationProfile()-funktionen är definierad", /function applyApplicationProfile\(\)/.test(appJs));
  check("6b. Filtrerar <option>-alternativ via .hidden (inte hela fields.processType)", /opt\.hidden = !allowed/.test(appJs));
  check("6c. Faller tillbaka till ett giltigt värde om nuvarande blir otillåtet", /if \(!currentValueAllowed\) fields\.processType\.value = profile\.processModels\[0\]/.test(appJs));
  check("6d. Döljer/visar [data-addon]-element via addon-hidden-klassen (inte style.display direkt, undviker konflikt med lägesstyrd döljning)", /classList\.toggle\("addon-hidden", !profile\.addons\.includes\(el\.dataset\.addon\)\)/.test(appJs));
  check("6e. Anropar updateProcessUIState() så Processmodell-beroende fält synkas om", /function applyApplicationProfile\(\) \{[\s\S]{0,1200}updateProcessUIState\(\);\s*\n\}/.test(appJs));
  check("6f. #applicationProfile har en change-lyssnare kopplad till applyApplicationProfile()", /getElementById\("applicationProfile"\)\.addEventListener\("change", \(\) => \{\s*\n\s*applyApplicationProfile\(\);/.test(appJs));
  check("6h. Inget sparat tillämpningsläge i localStorage (Fri utforskning ska alltid vara default vid sidladdning)", !/localStorage\.[gs]etItem\("[^"]*[Aa]pplication[Pp]rofile/.test(appJs));
}

// ── 6i–6m. Granskningsobservation 2: varje scenarioladdning sätter en
// SAMMANHÄNGANDE Tillämpning+Processmodell-kombination (deriveApplicationProfile()) ──
{
  check("6i. deriveApplicationProfile()-funktionen är definierad", /function deriveApplicationProfile\(scenario\)/.test(appJs));
  check("6j. Framkoppling (auxSignal) → Temperaturprocess", /if \(scenario\.auxSignal\) return "temperatur";/.test(appJs));
  check("6k. Integrerande processtyp → Nivåprocess", /if \(scenario\.process\.type === "integrating"\) return "niva";/.test(appJs));
  check("6l. OnOff-läge → Tvålägesreglering", /if \(scenario\.controller\.mode === "onoff"\) return "onoff";/.test(appJs));
  check(
    "6m. loadScenarioByName() sätter applicationProfile från deriveApplicationProfile() OCH tillämpar det, EFTER hydrateFields() (så det härleds från det nyss laddade scenariot)",
    /hydrateFields\(currentScenario\);\s*\n\s*fields\.applicationProfile\.value = deriveApplicationProfile\(currentScenario\);\s*\n\s*applyApplicationProfile\(\);/.test(appJs)
  );
  check("6n. initUI() laddar startscenariot via loadScenarioByName() (som i sin tur härleder Tillämpning — ingen separat väg kvar)", /function initUI\(\) \{[\s\S]{0,700}loadScenarioByName\("basic-step-self-regulating\.json"\);/.test(appJs));
}

// ── 7. help.json: hjälptext för den nya väljaren finns ──
{
  const helpJson = JSON.parse(readFileSync(path.join(APP_DIR, "content", "help.json"), "utf8"));
  check("7a. help.json har en \"applicationProfile\"-post", !!helpJson.applicationProfile);
  check("7b. help.json:s \"processType\"-post är omdöpt till \"Processmodell\"", helpJson.processType && helpJson.processType.title === "Processmodell");
}

console.log(`\n${passed} OK, ${failed} FAIL`);
if (failed > 0) process.exit(1);
