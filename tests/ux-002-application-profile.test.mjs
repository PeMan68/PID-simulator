// UX-002 (UX-001 Fas 0) — Tillämpnings-/processmodellsväljare.
//
// Ren statisk källkodskontroll (ingen webbläsare/DOM tillgänglig här, samma
// begränsning och samma mönster som tests/hotfix-v1.4.1-facit-env.test.mjs).
// Verifierar: att APPLICATION_PROFILES-tabellen i app.js har exakt den
// struktur UX-001/UX-002-rapporterna specificerar (extraherad och körd
// isolerat, inte bara regex-matchad rad för rad), att index.html har de nya
// kontrollerna/attributen applyApplicationProfile() förutsätter, att
// Processmodell-väljaren ALDRIG döljs helt (bara dess alternativ filtreras —
// PO:s uttryckliga pedagogiska krav), och (efter UX-002_SYNLIGHETSGRANSKNING)
// att Tvålägesreglering INTE längre är en egen tillämpning samt att
// Framkopplingens fält kräver BÅDE rätt Tillämpning OCH Läge ∈ {P,PI,PID}.
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
  check("1d. Alternativ: Temperaturprocess", /<option value="temperatur">Temperaturprocess<\/option>/.test(html));
  check("1e. Alternativ: Nivåprocess", /<option value="niva">Nivåprocess<\/option>/.test(html));
  // UX-002_SYNLIGHETSGRANSKNING.md avsnitt 1 (PO-godkänd 2026-09-20) —
  // Tvålägesreglering är INTE längre en egen tillämpning (fel axel: on/off
  // är en regulatorstrategi, inte en processkontext) — OnOff är istället
  // ett giltigt Läge-val inom varje tillämpning, se avsnitt 5 nedan.
  check("1c. Tvålägesreglering finns INTE längre som egen tillämpning", !html.includes("Tvålägesreglering") && !/<option value="onoff">Tvålägesreglering/.test(html));
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

// ── 5. app.js: APPLICATION_PROFILES har exakt tre profiler, on/off inkluderat i varje ──
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
      check("5b. Exakt TRE profiler (fri/temperatur/niva) — Tvålägesreglering borttagen", Object.keys(profiles).sort().join(",") === "fri,niva,temperatur");
      check("5c. fri tillåter alla tre processmodeller och alla fem lägen", JSON.stringify(profiles.fri.processModels.sort()) === JSON.stringify(["integrating", "self_regulating", "self_regulating_2"].sort()) && JSON.stringify(profiles.fri.modes.sort()) === JSON.stringify(["manual", "onoff", "p", "pi", "pid"].sort()));
      check("5d. fri visar alla tre tillägg", JSON.stringify(profiles.fri.addons.sort()) === JSON.stringify(["framkoppling", "parameterstyrning", "ventilkarakteristik"].sort()));
      check("5f. temperatur tillåter de två självreglerande modellerna och alla tre tillägg", JSON.stringify(profiles.temperatur.processModels.sort()) === JSON.stringify(["self_regulating", "self_regulating_2"].sort()) && JSON.stringify(profiles.temperatur.addons.sort()) === JSON.stringify(["framkoppling", "parameterstyrning", "ventilkarakteristik"].sort()));
      check("5g. niva tillåter ENDAST integrating, inga tillägg", JSON.stringify(profiles.niva.processModels) === JSON.stringify(["integrating"]) && profiles.niva.addons.length === 0);
      // UX-002_SYNLIGHETSGRANSKNING.md avsnitt 1 — OnOff ska vara ett
      // giltigt Läge-val i VARJE tillämpning (inte en egen tillämpning).
      check("5j. temperatur tillåter onoff/p/pi/pid/manual (alla fem lägen)", JSON.stringify(profiles.temperatur.modes.sort()) === JSON.stringify(["manual", "onoff", "p", "pi", "pid"].sort()));
      check("5k. niva tillåter onoff/p/pi/pid/manual (alla fem lägen)", JSON.stringify(profiles.niva.modes.sort()) === JSON.stringify(["manual", "onoff", "p", "pi", "pid"].sort()));
    }
  }
}

// ── 6. app.js: applyApplicationProfile() finns, döljer aldrig väljarna, är kopplad ──
{
  check("6a. applyApplicationProfile()-funktionen är definierad", /function applyApplicationProfile\(\)/.test(appJs));
  check("6a2. filterSelectOptions()-hjälpfunktionen är definierad (delad av Processmodell och Läge)", /function filterSelectOptions\(selectEl, allowedValues\)/.test(appJs));
  check("6b. filterSelectOptions() filtrerar <option>-alternativ via .hidden (inte hela selectEl)", /opt\.hidden = !allowed/.test(appJs));
  check("6c. filterSelectOptions() faller tillbaka till ett giltigt värde om nuvarande blir otillåtet", /if \(!currentValueAllowed\) selectEl\.value = allowedValues\[0\]/.test(appJs));
  check("6c2. applyApplicationProfile() filtrerar BÅDE Processmodell och Läge via filterSelectOptions()", /filterSelectOptions\(fields\.processType, profile\.processModels\)/.test(appJs) && /filterSelectOptions\(fields\.mode, profile\.modes\)/.test(appJs));
  check(
    "6d. Döljer/visar Parameterstyrning/Ventilkarakteristik via addon-hidden-klassen, men hoppar över Framkoppling (hanteras separat, se 6u)",
    /document\.querySelectorAll\("\[data-addon\]"\)\.forEach\(el => \{\s*\n\s*if \(el\.dataset\.addon === "framkoppling"\) return;\s*\n\s*el\.classList\.toggle\("addon-hidden", !profile\.addons\.includes\(el\.dataset\.addon\)\);/.test(appJs)
  );
  check("6e. Anropar updateProcessUIState() och updateControllerUIState() så beroende fält synkas om (inkl. Läge-tvingande)", /function applyApplicationProfile\(\) \{[\s\S]{0,4000}updateControllerUIState\(\);[\s\S]{0,200}updateProcessUIState\(\);\s*\n\}/.test(appJs));
  check("6f. #applicationProfile har en change-lyssnare kopplad till applyApplicationProfile()", /getElementById\("applicationProfile"\)\.addEventListener\("change", \(\) => \{\s*\n\s*applyApplicationProfile\(\);/.test(appJs));
  check("6h. Inget sparat tillämpningsläge i localStorage (Fri utforskning ska alltid vara default vid sidladdning)", !/localStorage\.[gs]etItem\("[^"]*[Aa]pplication[Pp]rofile/.test(appJs));
  // PO:s granskning (2026-09-20) — ett tillägg som blir dolt ska också stängas
  // AV, inte bara döljas (annars fortsätter t.ex. Parameterstyrning påverka
  // simuleringen trots en osynlig, oåtkomlig kryssruta).
  check("6o. Stänger av Parameterstyrning (avmarkerar) när tillägget inte ingår i profilen", /if \(!profile\.addons\.includes\("parameterstyrning"\)\) fields\.gainScheduleEnabled\.checked = false;/.test(appJs));
  check("6p. Stänger av Ventilkarakteristik (avmarkerar) när tillägget inte ingår i profilen", /if \(!profile\.addons\.includes\("ventilkarakteristik"\)\) fields\.nonlinearGainEnabled\.checked = false;/.test(appJs));
  check("6q. Nollställer Kff/Last mag OCH ett redan triggat sim.auxValue när Framkoppling inte ingår i profilen (tillämpningsstyrt, ej lägesstyrt — se motivering i koden)", /if \(!profile\.addons\.includes\("framkoppling"\)\) \{[\s\S]{0,200}fields\.kff\.value = 0;[\s\S]{0,100}fields\.auxMag\.value = 0;[\s\S]{0,100}if \(sim\) sim\.auxValue = 0;/.test(appJs));
  check("6r. Manuellt tillämpningsbyte synkar och ritar om direkt (till skillnad från scenarioladdning)", /getElementById\("applicationProfile"\)\.addEventListener\("change", \(\) => \{[\s\S]{0,600}if \(sim\) \{ syncParamsFromUI\(\); drawChart\(\); updateStatus\(\); \}/.test(appJs));
}

// ── 6s–6t. Bumpless har ingen effekt i OnOff-läge — ska döljas där ──
{
  check("6s. updateControllerUIState() döljer Bumpless-fältet när Läge=OnOff", /getElementById\("bumpless"\)\.parentElement\.style\.display = isOnOff \? "none" : "";/.test(appJs));
  check(
    "6t. Bumpless-döljningen ligger i updateControllerUIState() (körs både vid manuellt lägesbyte och via applyApplicationProfile())",
    /function updateControllerUIState\(\) \{[\s\S]{0,1500}getElementById\("bumpless"\)\.parentElement\.style\.display/.test(appJs)
  );
}

// ── 6u–6x. UX-002_SYNLIGHETSGRANSKNING.md avsnitt 2.1/3 — Framkoppling
// kräver BÅDE rätt Tillämpning OCH Läge ∈ {P,PI,PID} ──
{
  check("6u. updateFramkopplingVisibility()-funktionen är definierad", /function updateFramkopplingVisibility\(\)/.test(appJs));
  check(
    "6v. Kräver isPidFamily (p/pi/pid) OCH att profilen tillåter framkoppling — inte bara ett av villkoren",
    /const isPidFamily = mode === "p" \|\| mode === "pi" \|\| mode === "pid";\s*\n\s*const visible = profile\.addons\.includes\("framkoppling"\) && isPidFamily;/.test(appJs)
  );
  check("6w. Döljer via samma addon-hidden-klass (samma CSS-företräde som övriga tillägg)", /function updateFramkopplingVisibility\(\)[\s\S]{0,600}classList\.toggle\("addon-hidden", !visible\)/.test(appJs));
  check("6x. Anropas BÅDE från applyApplicationProfile() OCH updateControllerUIState() (så ett rent lägesbyte utan tillämpningsbyte också räknas om)", (appJs.match(/updateFramkopplingVisibility\(\);/g) || []).length >= 2);
}

// ── 6i–6n. Granskningsobservation 2 (föregående runda): varje
// scenarioladdning sätter en SAMMANHÄNGANDE Tillämpning+Processmodell-
// kombination (deriveApplicationProfile()) ──
{
  check("6i. deriveApplicationProfile()-funktionen är definierad", /function deriveApplicationProfile\(scenario\)/.test(appJs));
  check("6j. Framkoppling (auxSignal) → Temperaturprocess", /if \(scenario\.auxSignal\) return "temperatur";/.test(appJs));
  check("6k. Integrerande processtyp → Nivåprocess", /if \(scenario\.process\.type === "integrating"\) return "niva";/.test(appJs));
  check("6l. Inget separat onoff-härledningsfall längre (Tvålägesreglering borttagen) — generiska on/off-scenarier faller tillbaka på Fri utforskning", !/return "onoff";/.test(appJs));
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
